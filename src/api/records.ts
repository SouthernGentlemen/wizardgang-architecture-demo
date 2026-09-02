import type { Env } from '../types';
import { authorize, type Principal } from '../lib/authorization';
import { recordDemoEvent } from '../lib/audit';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

interface RecordInput {
  namespace?: unknown;
  key?: unknown;
  value?: unknown;
}

interface RecordRow {
  id: number;
  namespace: string;
  record_key: string;
  value_json: string;
  created_at: string;
  updated_at: string;
}

function identifier(value: unknown, field: string, fallback?: string): string {
  const candidate = typeof value === 'string' ? value.trim() : fallback;
  if (!candidate || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(candidate)) {
    throw new HttpError(400, `invalid_${field}`, `${field} must be 1–64 letters, numbers, dots, underscores, or hyphens.`);
  }
  return candidate;
}

function present(row: RecordRow) {
  let value: unknown = null;
  try { value = JSON.parse(row.value_json); } catch { value = row.value_json; }
  return { id: row.id, namespace: row.namespace, key: row.record_key, value, createdAt: row.created_at, updatedAt: row.updated_at };
}

function namespaceFor(principal: Principal, requested: unknown, fallback = 'public'): string {
  if (principal.namespace) return principal.namespace;
  if (principal.authentication === 'anonymous') return 'public';
  return identifier(requested, 'namespace', fallback);
}

function publicPrincipal(principal: Principal) {
  return {
    subject: principal.subject,
    authentication: principal.authentication,
    ...(principal.provider ? { provider: principal.provider } : {}),
    permissions: principal.permissions,
    ...(principal.namespace ? { scope: 'visitor-sandbox' } : principal.authentication === 'anonymous' ? { scope: 'public' } : { scope: 'caller-selected' }),
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

async function findRecord(env: Env, namespace: string, key: string): Promise<RecordRow | undefined> {
  const result = await env.DEMO_DB.prepare(
    `SELECT id, namespace, record_key, value_json, created_at, updated_at
     FROM demo_records WHERE namespace = ? AND record_key = ? LIMIT 1`,
  ).bind(namespace, key).all<RecordRow>();
  return result.results[0];
}

function valueJson(value: unknown): string {
  const serialized = JSON.stringify(value ?? null);
  if (new TextEncoder().encode(serialized).byteLength > 4096) throw new HttpError(413, 'record_value_too_large');
  return serialized;
}

async function listRecords(request: Request, env: Env, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:read');
  if (principal instanceof Response) return principal;
  const namespace = namespaceFor(principal, new URL(request.url).searchParams.get('namespace'));
  const result = await env.DEMO_DB.prepare(
    `SELECT id, namespace, record_key, value_json, created_at, updated_at
     FROM demo_records WHERE namespace = ? ORDER BY record_key LIMIT 100`,
  ).bind(namespace).all<RecordRow>();
  await recordApplicationLog(env, {
    source: 'rest', eventKey: 'records_listed', message: `REST listed ${result.results.length} demo record(s).`, route: '/v1/demo-records', requestId: id,
    detail: { namespace, resultCount: result.results.length, authentication: principal.authentication },
  });
  return json({ results: result.results.map(present), authorization: publicPrincipal(principal) }, { headers: { 'cache-control': 'no-store' } });
}

async function getRecord(request: Request, env: Env, key: string, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:read');
  if (principal instanceof Response) return principal;
  const namespace = namespaceFor(principal, new URL(request.url).searchParams.get('namespace'));
  const row = await findRecord(env, namespace, key);
  await recordApplicationLog(env, {
    source: 'rest', eventKey: row ? 'record_read' : 'record_not_found', message: row ? `REST read demo record ${namespace}/${key}.` : `REST could not find demo record ${namespace}/${key}.`,
    route: `/v1/demo-records/${key}`, requestId: id, detail: { namespace, key, found: Boolean(row), authentication: principal.authentication },
  });
  return row ? json({ ...present(row), authorization: publicPrincipal(principal) }, { headers: { 'cache-control': 'no-store' } }) : json({ error: 'record_not_found' }, { status: 404, headers: { 'cache-control': 'no-store' } });
}

async function createRecord(request: Request, env: Env, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const body = await readJson<RecordInput>(request);
  const namespace = namespaceFor(principal, body.namespace);
  const key = identifier(body.key, 'key');
  if (await findRecord(env, namespace, key)) throw new HttpError(409, 'record_already_exists', 'POST creates a new resource. Use PUT to replace an existing key.');
  const serialized = valueJson(body.value);
  const now = new Date().toISOString();
  let result;
  try {
    result = await env.DEMO_DB.prepare(
      `INSERT INTO demo_records (namespace, record_key, value_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(namespace, key, serialized, now, now).run();
  } catch (error) {
    if (/unique|constraint/i.test(String(error))) throw new HttpError(409, 'record_already_exists', 'POST creates a new resource. Use PUT to replace an existing key.');
    throw error;
  }
  const event = await recordDemoEvent(env, 'd1', 'record_created', { namespace, key, createdBy: principal.subject });
  await recordApplicationLog(env, {
    source: 'rest', eventKey: 'record_created', message: `REST created demo record ${namespace}/${key}.`, route: '/v1/demo-records', requestId: id,
    detail: { namespace, key, authentication: principal.authentication, eventId: event.id },
  });
  return json({ id: result.meta.last_row_id, namespace, key, value: body.value ?? null, createdAt: now, updatedAt: now, authorization: publicPrincipal(principal), auditEventId: event.id }, {
    status: 201,
    headers: { location: `/v1/demo-records/${encodeURIComponent(key)}?namespace=${encodeURIComponent(namespace)}`, 'cache-control': 'no-store' },
  });
}

async function replaceRecord(request: Request, env: Env, key: string, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const body = await readJson<RecordInput>(request);
  if (body.key !== undefined && identifier(body.key, 'key') !== key) throw new HttpError(400, 'record_key_mismatch', 'The body key must match the resource path.');
  const namespace = namespaceFor(principal, body.namespace, new URL(request.url).searchParams.get('namespace') || 'public');
  const existing = await findRecord(env, namespace, key);
  const serialized = valueJson(body.value);
  const now = new Date().toISOString();
  await env.DEMO_DB.prepare(
    `INSERT INTO demo_records (namespace, record_key, value_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(namespace, record_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
  ).bind(namespace, key, serialized, existing?.created_at ?? now, now).run();
  const eventType = existing ? 'record_replaced' : 'record_created_by_put';
  const event = await recordDemoEvent(env, 'd1', eventType, { namespace, key, updatedBy: principal.subject });
  await recordApplicationLog(env, {
    source: 'rest', eventKey: eventType, message: `REST ${existing ? 'replaced' : 'created'} demo record ${namespace}/${key}.`, route: `/v1/demo-records/${key}`, requestId: id,
    detail: { namespace, key, authentication: principal.authentication, eventId: event.id },
  });
  return json({ ...(existing ? { id: existing.id } : {}), namespace, key, value: body.value ?? null, createdAt: existing?.created_at ?? now, updatedAt: now, authorization: publicPrincipal(principal), auditEventId: event.id }, {
    status: existing ? 200 : 201,
    headers: { location: `/v1/demo-records/${encodeURIComponent(key)}?namespace=${encodeURIComponent(namespace)}`, 'cache-control': 'no-store' },
  });
}

async function deleteRecord(request: Request, env: Env, key: string, id: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const namespace = namespaceFor(principal, new URL(request.url).searchParams.get('namespace'));
  await env.DEMO_DB.prepare('DELETE FROM demo_records WHERE namespace = ? AND record_key = ?').bind(namespace, key).run();
  const event = await recordDemoEvent(env, 'd1', 'record_deleted', { namespace, key, deletedBy: principal.subject });
  await recordApplicationLog(env, {
    source: 'rest', eventKey: 'record_deleted', message: `REST deleted demo record ${namespace}/${key}.`, route: `/v1/demo-records/${key}`, requestId: id,
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
    const result = await env.DEMO_DB.prepare('DELETE FROM demo_records WHERE namespace = ?').bind(principal.namespace).run();
    await recordApplicationLog(env, {
      source: 'rest', eventKey: 'sandbox_reset', message: 'REST visitor sandbox was reset.', route: '/__api/api-sandbox/reset', requestId: id,
      detail: { namespace: principal.namespace, deleted: result.meta.changes ?? null, authentication: principal.authentication },
    });
    return traced(json({ reset: true, deleted: result.meta.changes ?? null, sandbox: 'Your API sandbox' }, { headers: { 'cache-control': 'no-store' } }), id);
  } catch (error) {
    const response = errorResponse(error);
    await logRejectedRequest(request, env, id, response.status);
    return traced(response, id);
  }
}
