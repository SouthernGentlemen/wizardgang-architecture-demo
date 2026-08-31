import type { Env } from '../types';
import { recordDemoEvent } from '../lib/audit';
import { budgetState } from '../lib/billing';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

interface BillingInput { scenario?: unknown }

export async function billingScenarioResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  try {
    const body = await readJson<BillingInput>(request, 1024);
    const scenario = body.scenario;
    if (scenario !== 'normal' && scenario !== 'warning' && scenario !== 'degraded') throw new HttpError(400, 'invalid_billing_scenario');
    const budget = Math.max(1, Math.min(Number(env.BILLING_DEMO_MONTHLY_BUDGET_USD || '10') || 10, 1_000_000));
    const ratio = scenario === 'normal' ? 0.4 : scenario === 'warning' ? 0.75 : 0.95;
    const cost = Number((budget * ratio).toFixed(4));
    const quantity = Math.round(ratio * 100_000);
    const capturedAt = new Date().toISOString();
    await env.DEMO_DB.prepare(
      `INSERT INTO usage_snapshots (service_key, metric_key, quantity, unit, estimated_cost_usd, budget_limit_usd, captured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind('architecture-demo', 'synthetic-worker-requests', quantity, 'requests', cost, budget, capturedAt).run();
    const state = budgetState(cost, budget);
    const event = await recordDemoEvent(env, 'billing', 'synthetic_budget_changed', { scenario, state, percent: ratio * 100 });
    await recordApplicationLog(env, { level: state === 'degraded' ? 'warn' : 'info', source: 'billing', eventKey: 'synthetic_budget_changed', message: `Synthetic budget state changed to ${state}.`, route: '/__api/operations/billing', detail: { scenario, state, percent: ratio * 100, eventId: event.id } });
    return json({ synthetic: true, state, estimatedCostUsd: cost, budgetUsd: budget, percent: ratio * 100, optionalWorkerCompute: state === 'degraded' ? 'paused' : 'available', capturedAt, auditEventId: event.id }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
