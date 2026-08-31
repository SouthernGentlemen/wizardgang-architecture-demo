import type { Env } from '../types';
import { authorize } from '../lib/authorization';
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
  return {
    id: row.id,
    namespace: row.namespace,
    key: row.record_key,
    value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listRecords(request: Request, env: Env): Promise<Response> {
  const principal = await authorize(request, env, 'demo:read');
  if (principal instanceof Response) return principal;
  const url = new URL(request.url);
  const namespace = identifier(url.searchParams.get('namespace') || 'public', 'namespace');
  const result = await env.DEMO_DB.prepare(
    `SELECT id, namespace, record_key, value_json, created_at, updated_at
     FROM demo_records WHERE namespace = ? ORDER BY record_key LIMIT 100`,
  ).bind(namespace).all<RecordRow>();
  return json({ results: result.results.map(present), authorization: { subject: principal.subject, permission: 'demo:read' } }, {
    headers: { 'cache-control': 'no-store' },
  });
}

async function getRecord(request: Request, env: Env, key: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:read');
  if (principal instanceof Response) return principal;
  const namespace = identifier(new URL(request.url).searchParams.get('namespace') || 'public', 'namespace');
  const result = await env.DEMO_DB.prepare(
    `SELECT id, namespace, record_key, value_json, created_at, updated_at
     FROM demo_records WHERE namespace = ? AND record_key = ? LIMIT 1`,
  ).bind(namespace, key).all<RecordRow>();
  const row = result.results[0];
  return row ? json(present(row), { headers: { 'cache-control': 'no-store' } }) : json({ error: 'record_not_found' }, { status: 404 });
}

async function putRecord(request: Request, env: Env): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const body = await readJson<RecordInput>(request);
  const namespace = identifier(body.namespace, 'namespace', 'public');
  const key = identifier(body.key, 'key');
  const valueJson = JSON.stringify(body.value ?? null);
  if (new TextEncoder().encode(valueJson).byteLength > 4096) throw new HttpError(413, 'record_value_too_large');
  const now = new Date().toISOString();

  await env.DEMO_DB.prepare(
    `INSERT INTO demo_records (namespace, record_key, value_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(namespace, record_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
  ).bind(namespace, key, valueJson, now, now).run();
  const event = await recordDemoEvent(env, 'd1', 'record_upserted', { namespace, key, updatedBy: principal.subject });
  await recordApplicationLog(env, {
    source: 'd1', eventKey: 'record_upserted', message: `Demo record ${namespace}/${key} was stored.`, route: '/v1/demo-records',
    detail: { namespace, key, eventId: event.id },
  });
  return json({ ok: true, namespace, key, updatedAt: now, auditEventId: event.id }, { status: 201, headers: { location: `/v1/demo-records/${encodeURIComponent(key)}?namespace=${encodeURIComponent(namespace)}`, 'cache-control': 'no-store' } });
}

async function deleteRecord(request: Request, env: Env, key: string): Promise<Response> {
  const principal = await authorize(request, env, 'demo:write');
  if (principal instanceof Response) return principal;
  const namespace = identifier(new URL(request.url).searchParams.get('namespace') || 'public', 'namespace');
  await env.DEMO_DB.prepare('DELETE FROM demo_records WHERE namespace = ? AND record_key = ?').bind(namespace, key).run();
  const event = await recordDemoEvent(env, 'd1', 'record_deleted', { namespace, key, deletedBy: principal.subject });
  await recordApplicationLog(env, { source: 'd1', eventKey: 'record_deleted', message: `Demo record ${namespace}/${key} was deleted.`, route: `/v1/demo-records/${key}`, detail: { namespace, key, eventId: event.id } });
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}

export async function recordsResponse(request: Request, env: Env, rawKey?: string): Promise<Response> {
  try {
    const key = rawKey === undefined ? undefined : identifier(decodeURIComponent(rawKey), 'key');
    if (!key && request.method === 'GET') return await listRecords(request, env);
    if (!key && request.method === 'POST') return await putRecord(request, env);
    if (key && request.method === 'GET') return await getRecord(request, env, key);
    if (key && request.method === 'DELETE') return await deleteRecord(request, env, key);
    return methodNotAllowed(key ? ['GET', 'DELETE'] : ['GET', 'POST']);
  } catch (error) {
    return errorResponse(error);
  }
}
