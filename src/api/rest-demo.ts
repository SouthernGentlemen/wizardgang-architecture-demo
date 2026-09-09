import type { Env } from '../types';
import { ensureDemoSession, withDemoSession, type DemoSession } from '../lib/demo-session';
import { errorResponse, HttpError, json, methodNotAllowed, readJson } from '../lib/http';

interface RecordInput {
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

function keyValue(value: unknown): string {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(candidate)) {
    throw new HttpError(400, 'invalid_key', 'key must be 1–64 letters, numbers, dots, underscores, or hyphens.');
  }
  return candidate;
}

function serialize(value: unknown): string {
  const serialized = JSON.stringify(value ?? null);
  if (new TextEncoder().encode(serialized).byteLength > 4096) throw new HttpError(413, 'value_too_large');
  return serialized;
}

function present(row: RecordRow): Record<string, unknown> {
  let value: unknown = null;
  try { value = JSON.parse(row.value_json); } catch { value = row.value_json; }
  return { id: row.id, key: row.record_key, value, createdAt: row.created_at, updatedAt: row.updated_at };
}

function attach(response: Response, session: DemoSession): Response {
  return withDemoSession(response, session);
}

async function find(env: Env, sessionId: string, key?: string): Promise<RecordRow[]> {
  const result = await env.DEMO_DB.prepare(
    `SELECT id, namespace, record_key, value_json, created_at, updated_at
     FROM demo_records WHERE namespace = ?${key ? ' AND record_key = ?' : ''} ORDER BY record_key LIMIT 100`,
  ).bind(...(key ? [sessionId, key] : [sessionId])).all<RecordRow>();
  return result.results;
}

export async function restDemoResponse(request: Request, env: Env, rawKey?: string): Promise<Response> {
  let session: DemoSession | undefined;
  try {
    session = await ensureDemoSession(request, env);
    const key = rawKey === undefined ? undefined : keyValue(decodeURIComponent(rawKey));
    const namespace = session.id;

    if (!key && request.method === 'GET') {
      const rows = await find(env, namespace);
      return attach(json({ results: rows.map(present), count: rows.length }), session);
    }

    if (!key && request.method === 'POST') {
      const body = await readJson<RecordInput>(request);
      const recordKey = keyValue(body.key);
      if ((await find(env, namespace, recordKey)).length > 0) {
        throw new HttpError(409, 'record_already_exists', 'POST creates a new resource. Use PUT to replace an existing key.');
      }
      const now = new Date().toISOString();
      const result = await env.DEMO_DB.prepare(
        `INSERT INTO demo_records (namespace, record_key, value_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).bind(namespace, recordKey, serialize(body.value), now, now).run();
      return attach(json({ id: result.meta.last_row_id, key: recordKey, value: body.value ?? null, createdAt: now, updatedAt: now }, {
        status: 201,
        headers: { location: `/api/labs/rest-demo-records/${encodeURIComponent(recordKey)}`, 'cache-control': 'no-store' },
      }), session);
    }

    if (key && request.method === 'GET') {
      const row = (await find(env, namespace, key))[0];
      return attach(row ? json(present(row), { headers: { 'cache-control': 'no-store' } }) : json({ error: 'record_not_found' }, { status: 404 }), session);
    }

    if (key && (request.method === 'PUT' || request.method === 'PATCH')) {
      const body = await readJson<RecordInput>(request);
      if (body.key !== undefined && keyValue(body.key) !== key) throw new HttpError(400, 'record_key_mismatch', 'The body key must match the resource path.');
      const existing = (await find(env, namespace, key))[0];
      let value = body.value;
      if (request.method === 'PATCH' && body.value === undefined) {
        if (!existing) return attach(json({ error: 'record_not_found' }, { status: 404 }), session);
        try { value = JSON.parse(existing.value_json); } catch { value = existing.value_json; }
      }
      const now = new Date().toISOString();
      await env.DEMO_DB.prepare(
        `INSERT INTO demo_records (namespace, record_key, value_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(namespace, record_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      ).bind(namespace, key, serialize(value), existing?.created_at ?? now, now).run();
      return attach(json({ id: existing?.id, key, value: value ?? null, createdAt: existing?.created_at ?? now, updatedAt: now }, {
        status: existing ? 200 : 201,
        headers: { location: `/api/labs/rest-demo-records/${encodeURIComponent(key)}`, 'cache-control': 'no-store' },
      }), session);
    }

    if (key && request.method === 'DELETE') {
      await env.DEMO_DB.prepare('DELETE FROM demo_records WHERE namespace = ? AND record_key = ?').bind(namespace, key).run();
      return attach(new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }), session);
    }

    return attach(methodNotAllowed(key ? ['GET', 'PUT', 'PATCH', 'DELETE'] : ['GET', 'POST']), session);
  } catch (error) {
    return attach(errorResponse(error), session ?? { id: '' });
  }
}
