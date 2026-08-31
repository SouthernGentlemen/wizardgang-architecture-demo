import type { Env } from '../types';
import { authorize } from '../lib/authorization';
import { recordDemoEvent } from '../lib/audit';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';
import { deleteDemoObject, getDemoObject, putDemoObject } from '../storage/r2';

interface ObjectInput { key?: unknown; content?: unknown }

function objectKey(value: unknown): string {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!/^public\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(key)) throw new HttpError(400, 'invalid_object_key', 'Use a public/ prefix and a simple 1–80 character file name.');
  return key;
}

async function store(env: Env, key: string, content: string, updatedBy: string): Promise<{ updatedAt: string; eventId: number }> {
  const size = new TextEncoder().encode(content).byteLength;
  if (size > 16_384) throw new HttpError(413, 'object_too_large');
  await putDemoObject(env, key, content);
  const updatedAt = new Date().toISOString();
  await env.DEMO_DB.prepare(
    `INSERT INTO r2_object_metadata (object_key, content_type, size_bytes, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(object_key) DO UPDATE SET content_type = excluded.content_type, size_bytes = excluded.size_bytes, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).bind(key, 'text/plain; charset=utf-8', size, updatedAt, updatedBy).run();
  const event = await recordDemoEvent(env, 'r2', 'object_stored', { key, size, updatedBy });
  await recordApplicationLog(env, { source: 'r2', eventKey: 'object_stored', message: `R2 object ${key} was stored.`, route: '/__api/r2/object', detail: { key, size, eventId: event.id } });
  return { updatedAt, eventId: event.id };
}

export async function r2DemoObjectResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  try {
    const key = 'public/visitor-demo.txt';
    const content = `WizardGang R2 demonstration object\nUpdated: ${new Date().toISOString()}\n`;
    const result = await store(env, key, content, 'public-demo-action');
    return json({ ok: true, storage: 'R2', metadata: 'D1 demo-blob', key, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function r2ObjectResponse(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const principal = await authorize(request, env, 'demo:read');
      if (principal instanceof Response) return principal;
      const key = objectKey(url.searchParams.get('key'));
      const content = await getDemoObject(env, key);
      if (content === null) return json({ error: 'object_not_found' }, { status: 404 });
      const metadata = await env.DEMO_DB.prepare('SELECT object_key, content_type, size_bytes, updated_at, updated_by FROM r2_object_metadata WHERE object_key = ? LIMIT 1').bind(key).all();
      return json({ key, content, metadata: metadata.results[0] ?? null, storage: 'R2 object with D1 metadata reference' }, { headers: { 'cache-control': 'no-store' } });
    }
    if (request.method === 'PUT') {
      const principal = await authorize(request, env, 'demo:write');
      if (principal instanceof Response) return principal;
      const body = await readJson<ObjectInput>(request);
      const key = objectKey(body.key);
      if (typeof body.content !== 'string') throw new HttpError(400, 'invalid_content');
      return json({ ok: true, storage: 'R2', key, ...(await store(env, key, body.content, principal.subject)) }, { status: 201 });
    }
    if (request.method === 'DELETE') {
      const principal = await authorize(request, env, 'demo:write');
      if (principal instanceof Response) return principal;
      const key = objectKey(url.searchParams.get('key'));
      await deleteDemoObject(env, key);
      await env.DEMO_DB.prepare('DELETE FROM r2_object_metadata WHERE object_key = ?').bind(key).run();
      const event = await recordDemoEvent(env, 'r2', 'object_deleted', { key, deletedBy: principal.subject });
      return json({ ok: true, key, auditEventId: event.id });
    }
    return methodNotAllowed(['GET', 'PUT', 'DELETE']);
  } catch (error) {
    return errorResponse(error);
  }
}
