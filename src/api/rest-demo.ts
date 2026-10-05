import type { Env } from '../types';
import { ensureDemoSession, withDemoSession, type DemoSession } from '../lib/demo-session';
import { errorResponse, HttpError, json, methodNotAllowed, readJson } from '../lib/http';
import { deleteDemoRecord, findDemoRecord, listDemoRecords, saveDemoRecord, type DemoRecord } from '../lib/demo-records';

interface RecordInput {
  key?: unknown;
  value?: unknown;
}

function keyValue(value: unknown): string {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(candidate)) {
    throw new HttpError(400, 'invalid_key', 'key must be 1–64 letters, numbers, dots, underscores, or hyphens.');
  }
  return candidate;
}

function checkedValue(value: unknown): unknown {
  const serialized = JSON.stringify(value ?? null);
  if (new TextEncoder().encode(serialized).byteLength > 4096) throw new HttpError(413, 'value_too_large');
  return JSON.parse(serialized) as unknown;
}

function present(record: DemoRecord): Record<string, unknown> {
  return { key: record.key, value: record.value, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

function attach(response: Response, session: DemoSession): Response {
  return withDemoSession(response, session);
}

export async function restDemoResponse(request: Request, env: Env, rawKey?: string): Promise<Response> {
  let session: DemoSession | undefined;
  try {
    session = await ensureDemoSession(request, env);
    const key = rawKey === undefined ? undefined : keyValue(decodeURIComponent(rawKey));
    const namespace = session.id;

    if (!key && request.method === 'GET') {
      const rows = await listDemoRecords(env, namespace);
      return attach(json({ results: rows.map(present), count: rows.length }), session);
    }

    if (!key && request.method === 'POST') {
      const body = await readJson<RecordInput>(request);
      const recordKey = keyValue(body.key);
      if (await findDemoRecord(env, namespace, recordKey)) {
        throw new HttpError(409, 'record_already_exists', 'POST creates a new resource. Use PUT to replace an existing key.');
      }
      const value = checkedValue(body.value);
      const now = new Date().toISOString();
      await saveDemoRecord(env, { namespace, key: recordKey, value, createdAt: now, updatedAt: now });
      return attach(json({ key: recordKey, value: body.value ?? null, createdAt: now, updatedAt: now }, {
        status: 201,
        headers: { location: `/api/labs/rest-demo-records/${encodeURIComponent(recordKey)}`, 'cache-control': 'no-store' },
      }), session);
    }

    if (key && request.method === 'GET') {
      const row = await findDemoRecord(env, namespace, key);
      return attach(row ? json(present(row), { headers: { 'cache-control': 'no-store' } }) : json({ error: 'record_not_found' }, { status: 404 }), session);
    }

    if (key && (request.method === 'PUT' || request.method === 'PATCH')) {
      const body = await readJson<RecordInput>(request);
      if (body.key !== undefined && keyValue(body.key) !== key) throw new HttpError(400, 'record_key_mismatch', 'The body key must match the resource path.');
      const existing = await findDemoRecord(env, namespace, key);
      let value = body.value;
      if (request.method === 'PATCH' && body.value === undefined) {
        if (!existing) return attach(json({ error: 'record_not_found' }, { status: 404 }), session);
        value = existing.value;
      }
      const stored = checkedValue(value);
      const now = new Date().toISOString();
      await saveDemoRecord(env, { namespace, key, value: stored, createdAt: existing?.createdAt ?? now, updatedAt: now });
      return attach(json({ key, value: value ?? null, createdAt: existing?.createdAt ?? now, updatedAt: now }, {
        status: existing ? 200 : 201,
        headers: { location: `/api/labs/rest-demo-records/${encodeURIComponent(key)}`, 'cache-control': 'no-store' },
      }), session);
    }

    if (key && request.method === 'DELETE') {
      await deleteDemoRecord(env, namespace, key);
      return attach(new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }), session);
    }

    return attach(methodNotAllowed(key ? ['GET', 'PUT', 'PATCH', 'DELETE'] : ['GET', 'POST']), session);
  } catch (error) {
    return attach(errorResponse(error), session ?? { id: '' });
  }
}
