import type { Env } from '../types';
import { authorize, type Principal } from '../lib/authorization';
import { recordDemoEvent } from '../lib/audit';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';
import { clearDemoRecords, deleteDemoRecord, findDemoRecord, listDemoRecords, saveDemoRecord, type DemoRecord } from '../lib/demo-records';

interface RecordInput {
  namespace?: unknown;
  key?: unknown;
  value?: unknown;
}

function identifier(value: unknown, field: string, fallback?: string): string {
  const candidate = typeof value === 'string' ? value.trim() : fallback;
  if (!candidate || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(candidate)) {
    throw new HttpError(400, `invalid_${field}`, `${field} must be 1–64 letters, numbers, dots, underscores, or hyphens.`);
  }
  return candidate;
}

function present(record: DemoRecord) {
  return { namespace: record.namespace, key: record.key, value: record.value, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

function namespaceFor(principal: Principal): string {
  return principal.namespace ?? 'public';
}

function publicPrincipal(principal: Principal) {
  return {
    subject: principal.subject,
    authentication: principal.authentication,
    ...(principal.provider ? { provider: principal.provider } : {}),
    permissions: principal.permissions,
    ...(principal.namespace ? { scope: 'visitor-sandbox' } : { scope: 'public' }),
  };
}

function requestId(): string {
  return `req_${crypto.randomUUID().replaceAll('-', '')}`;
}

function traced(response: Response, id: string): Response {
  const headers = new Headers(response.headers);
  headers.set('x-request-id', id);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function checkedValue(value: unknown): unknown {
  const serialized = JSON.stringify(value ?? null);
  if (new TextEncoder().encode(serialized).byteLength > 4096) throw new HttpError(413, 'record_value_too_large');
  return JSON.parse(serialized) as unknown;
}

async function listRecords(request: Request, env: Env, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:read');
  if (principal instanceof Response) return principal;
  const namespace = namespaceFor(principal);
  const results = await listDemoRecords(env, namespace);
  await recordApplicationLog(env, {
    source: 'rest', eventKey: 'records_listed', message: `REST listed ${results.length} demo record(s).`, route: '/api/labs/rest-records', requestId: id,
    detail: { namespace, resultCount: results.length, authentication: principal.authentication },
  });
  return json({ results: results.map(present), authorization: publicPrincipal(principal) }, { headers: { 'cache-control': 'no-store' } });
}

async function getRecord(request: Request, env: Env, key: string, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:read');
  if (principal instanceof Response) return principal;
  const namespace = namespaceFor(principal);
  const row = await findDemoRecord(env, namespace, key);
  await recordApplicationLog(env, {
    source: 'rest', eventKey: row ? 'record_read' : 'record_not_found', message: row ? `REST read demo record ${namespace}/${key}.` : `REST could not find demo record ${namespace}/${key}.`,
    route: `/api/labs/rest-records/${key}`, requestId: id, detail: { namespace, key, found: Boolean(row), authentication: principal.authentication },
  });
  return row ? json({ ...present(row), authorization: publicPrincipal(principal) }, { headers: { 'cache-control': 'no-store' } }) : json({ error: 'record_not_found' }, { status: 404, headers: { 'cache-control': 'no-store' } });
}

async function createRecord(request: Request, env: Env, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const body = await readJson<RecordInput>(request);
  const namespace = namespaceFor(principal);
  const key = identifier(body.key, 'key');
  if (await findDemoRecord(env, namespace, key)) throw new HttpError(409, 'record_already_exists', 'POST creates a new resource. Use PUT to replace an existing key.');
  const value = checkedValue(body.value);
  const now = new Date().toISOString();
  await saveDemoRecord(env, { namespace, key, value, createdAt: now, updatedAt: now });
  const event = await recordDemoEvent(env, 'd1', 'record_created', { namespace, key, createdBy: principal.subject });
  await recordApplicationLog(env, {
    source: 'rest', eventKey: 'record_created', message: `REST created demo record ${namespace}/${key}.`, route: '/api/labs/rest-records', requestId: id,
    detail: { namespace, key, authentication: principal.authentication, eventId: event.id },
  });
  return json({ namespace, key, value: body.value ?? null, createdAt: now, updatedAt: now, authorization: publicPrincipal(principal), auditEventId: event.id }, {
    status: 201,
    headers: { location: `/api/labs/rest-records/${encodeURIComponent(key)}?namespace=${encodeURIComponent(namespace)}`, 'cache-control': 'no-store' },
  });
}

async function replaceRecord(request: Request, env: Env, key: string, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const body = await readJson<RecordInput>(request);
  if (body.key !== undefined && identifier(body.key, 'key') !== key) throw new HttpError(400, 'record_key_mismatch', 'The body key must match the resource path.');
  const namespace = namespaceFor(principal);
  const existing = await findDemoRecord(env, namespace, key);
  const value = checkedValue(body.value);
  const now = new Date().toISOString();
  await saveDemoRecord(env, { namespace, key, value, createdAt: existing?.createdAt ?? now, updatedAt: now });
  const eventType = existing ? 'record_replaced' : 'record_created_by_put';
  const event = await recordDemoEvent(env, 'd1', eventType, { namespace, key, updatedBy: principal.subject });
  await recordApplicationLog(env, {
    source: 'rest', eventKey: eventType, message: `REST ${existing ? 'replaced' : 'created'} demo record ${namespace}/${key}.`, route: `/api/labs/rest-records/${key}`, requestId: id,
    detail: { namespace, key, authentication: principal.authentication, eventId: event.id },
  });
  return json({ namespace, key, value: body.value ?? null, createdAt: existing?.createdAt ?? now, updatedAt: now, authorization: publicPrincipal(principal), auditEventId: event.id }, {
    status: existing ? 200 : 201,
    headers: { location: `/api/labs/rest-records/${encodeURIComponent(key)}?namespace=${encodeURIComponent(namespace)}`, 'cache-control': 'no-store' },
  });
}

async function deleteRecord(request: Request, env: Env, key: string, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const namespace = namespaceFor(principal);
  await deleteDemoRecord(env, namespace, key);
  const event = await recordDemoEvent(env, 'd1', 'record_deleted', { namespace, key, deletedBy: principal.subject });
  await recordApplicationLog(env, {
    source: 'rest', eventKey: 'record_deleted', message: `REST deleted demo record ${namespace}/${key}.`, route: `/api/labs/rest-records/${key}`, requestId: id,
    detail: { namespace, key, authentication: principal.authentication, eventId: event.id },
  });
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}

export async function recordsResponse(request: Request, env: Env, rawKey?: string): Promise<Response> {
  const id = requestId();
  try {
    const key = rawKey === undefined ? undefined : identifier(decodeURIComponent(rawKey), 'key');
    let response: Response;
    if (!key && request.method === 'GET') response = await listRecords(request, env, id);
    else if (!key && request.method === 'POST') response = await createRecord(request, env, id);
    else if (key && request.method === 'GET') response = await getRecord(request, env, key, id);
    else if (key && request.method === 'PUT') response = await replaceRecord(request, env, key, id);
    else if (key && request.method === 'DELETE') response = await deleteRecord(request, env, key, id);
    else response = methodNotAllowed(key ? ['GET', 'PUT', 'DELETE'] : ['GET', 'POST']);
    if (response.status >= 400) await logRejectedRequest(request, env, id, response.status);
    return traced(response, id);
  } catch (error) {
    const response = errorResponse(error);
    await logRejectedRequest(request, env, id, response.status);
    return traced(response, id);
  }
}

async function logRejectedRequest(request: Request, env: Env, id: string, status: number): Promise<void> {
  try {
    await recordApplicationLog(env, {
      level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info', source: 'rest', eventKey: 'request_rejected',
      message: `REST request was rejected with HTTP ${status}.`, route: new URL(request.url).pathname, requestId: id,
      detail: { method: request.method, status },
    });
  } catch { /* The API response remains authoritative if diagnostic persistence is unavailable. */ }
}

export async function resetRecordSandboxResponse(request: Request, env: Env): Promise<Response> {
  const id = requestId();
  try {
    if (request.method !== 'POST') {
      const response = methodNotAllowed(['POST']);
      await logRejectedRequest(request, env, id, response.status);
      return traced(response, id);
    }
    const principal = await authorize(request, env, 'demo:write');
    if (principal instanceof Response) {
      await logRejectedRequest(request, env, id, principal.status);
      return traced(principal, id);
    }
    if (!principal.namespace) throw new HttpError(403, 'visitor_sandbox_required');
    const deleted = await clearDemoRecords(env, principal.namespace);
    await recordApplicationLog(env, {
      source: 'rest', eventKey: 'sandbox_reset', message: 'REST visitor sandbox was reset.', route: '/api/labs/rest-records-reset', requestId: id,
      detail: { namespace: principal.namespace, deleted, authentication: principal.authentication },
    });
    return traced(json({ reset: true, deleted, sandbox: 'Your API sandbox' }, { headers: { 'cache-control': 'no-store' } }), id);
  } catch (error) {
    const response = errorResponse(error);
    await logRejectedRequest(request, env, id, response.status);
    return traced(response, id);
  }
}
