import type { Env } from '../types';
import { recordDemoEvent } from '../lib/audit';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';
import { currentBudgetState } from '../lib/billing';

interface ComputeInput {
  operation?: unknown;
  values?: unknown;
}

export async function edgeInspectionResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const cf = (request as Request & { cf?: Record<string, unknown> }).cf ?? {};
  const allowedCfFields = ['colo', 'country', 'region', 'city', 'timezone', 'httpProtocol', 'asOrganization'];
  const edge = Object.fromEntries(allowedCfFields.filter((key) => cf[key] !== undefined).map((key) => [key, cf[key]]));
  await recordApplicationLog(env, {
    source: 'edge', eventKey: 'request_inspected', message: 'A visitor inspected safe edge request context.', route: '/__api/edge/inspect',
    detail: { method: request.method, edgeFields: Object.keys(edge) },
  });
  return json({
    deliveredBy: 'Cloudflare Worker',
    request: { method: request.method, protocol: new URL(request.url).protocol, accepts: request.headers.get('accept') || null },
    edge,
    privacy: 'Client IP addresses, cookies, authorization, and raw request headers are intentionally excluded.',
  }, { headers: { 'cache-control': 'no-store' } });
}

export async function workerComputeResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  try {
    const budget = await currentBudgetState(env);
    if (budget.state === 'degraded') {
      return json({ error: 'synthetic_budget_degraded', message: 'Optional Worker compute is paused by the controlled billing policy.', percent: budget.percent, criticalRoutesRemainAvailable: ['/dashboard', '/health', '/version', '/admin', '/offline'] }, { status: 429, headers: { 'cache-control': 'no-store', 'retry-after': '60' } });
    }
    const body = await readJson<ComputeInput>(request, 4096);
    const operation = typeof body.operation === 'string' ? body.operation : '';
    if (!['sum', 'average', 'min', 'max'].includes(operation)) throw new HttpError(400, 'invalid_operation');
    if (!Array.isArray(body.values) || body.values.length < 1 || body.values.length > 100 || !body.values.every((value) => typeof value === 'number' && Number.isFinite(value))) {
      throw new HttpError(400, 'invalid_values', 'values must contain 1–100 finite numbers.');
    }
    const values = body.values as number[];
    const result = operation === 'sum' ? values.reduce((total, value) => total + value, 0)
      : operation === 'average' ? values.reduce((total, value) => total + value, 0) / values.length
        : operation === 'min' ? Math.min(...values) : Math.max(...values);
    const event = await recordDemoEvent(env, 'workers', 'stateless_compute', { operation, inputCount: values.length });
    await recordApplicationLog(env, { source: 'workers', eventKey: 'stateless_compute', message: `Worker completed a bounded ${operation} operation.`, route: '/__api/workers/compute', detail: { operation, inputCount: values.length, eventId: event.id } });
    return json({ operation, inputCount: values.length, result, state: 'No process memory was used for persistence.', auditEventId: event.id });
  } catch (error) {
    return errorResponse(error);
  }
}
