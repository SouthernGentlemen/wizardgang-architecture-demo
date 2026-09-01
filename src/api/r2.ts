import type { Env } from '../types';
import { authorize } from '../lib/authorization';
import { recordDemoEvent } from '../lib/audit';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';
import { deleteDemoObject, getDemoObject, putDemoObject } from '../storage/r2';
import { requireSameOrigin } from '../lib/admin-auth';
import { ensureDemoSession, withDemoSession, type DemoSession } from '../lib/demo-session';
import { withSecurityHeaders } from '../lib/http';

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

interface FileMetadataRow {
  object_key: string;
  content_type: string;
  size_bytes: number;
  updated_at: string;
  session_id: string | null;
  display_name: string | null;
}

interface AggregateRow { object_count: number; total_bytes: number }

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_OBJECTS = 10;
const INLINE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain', 'application/pdf']);

const sharedSeeds = [
  { key: 'documents/architecture-demo.txt', name: 'architecture-demo.txt', type: 'text/plain', body: 'WizardGang architecture demonstration\nThis immutable object is stored in Cloudflare R2.\n' },
  { key: 'images/architecture-map.svg', name: 'architecture-map.svg', type: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 260"><rect width="720" height="260" fill="#111116"/><g fill="none" stroke="#d9ff43" stroke-width="4"><path d="M120 130h120m120 0h120m120 0h60"/></g><g font-family="system-ui" font-size="24" text-anchor="middle"><text x="80" y="138" fill="#f5f2e9">Worker</text><text x="300" y="138" fill="#78e8ff">R2</text><text x="540" y="138" fill="#a489ff">D1 metadata</text></g></svg>' },
] as const;

function opaqueId(key: string): string {
  const bytes = new TextEncoder().encode(key);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function keyFromId(value: string): string {
  if (!/^[a-zA-Z0-9_-]{4,400}$/.test(value)) throw new HttpError(400, 'invalid_file_id');
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch { throw new HttpError(400, 'invalid_file_id'); }
}

function safeName(value: string): string {
  const base = value.split(/[\\/]/).at(-1)?.replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'upload.bin';
  return base.slice(0, 120) || 'upload.bin';
}

function safeKeyName(value: string): string {
  return value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'upload.bin';
}

function visibleKey(row: FileMetadataRow): string {
  return row.session_id ? `uploads/this-session/${row.object_key.split('/').at(-1)}` : row.object_key;
}

function presentFile(row: FileMetadataRow) {
  return {
    id: opaqueId(row.object_key),
    key: visibleKey(row),
    displayName: row.display_name || row.object_key.split('/').at(-1),
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    updatedAt: row.updated_at,
    ownership: row.session_id ? 'this sandbox' : 'shared seed',
    canDelete: Boolean(row.session_id),
    canPreview: INLINE_TYPES.has(row.content_type),
  };
}

async function ensureSharedR2Seeds(env: Env): Promise<void> {
  if (!env.DEMO_R2) throw new HttpError(503, 'r2_not_configured');
  for (const seed of sharedSeeds) {
    const existing = await env.DEMO_R2.get(seed.key);
    if (!existing) await env.DEMO_R2.put(seed.key, seed.body, { httpMetadata: { contentType: seed.type } });
    const now = new Date().toISOString();
    await env.DEMO_DB.prepare(
      `INSERT INTO r2_object_metadata (object_key, content_type, size_bytes, updated_at, updated_by, session_id, display_name, expires_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, NULL)
       ON CONFLICT(object_key) DO UPDATE SET content_type = excluded.content_type, size_bytes = excluded.size_bytes, display_name = excluded.display_name`,
    ).bind(seed.key, seed.type, new TextEncoder().encode(seed.body).byteLength, now, 'shared-seed', seed.name).run();
  }
}

async function metadataFor(env: Env, sessionId: string, key: string): Promise<FileMetadataRow | null> {
  const result = await env.DEMO_DB.prepare(
    `SELECT object_key, content_type, size_bytes, updated_at, session_id, display_name
     FROM r2_object_metadata WHERE object_key = ? AND (session_id = ? OR session_id IS NULL) LIMIT 1`,
  ).bind(key, sessionId).all<FileMetadataRow>();
  return result.results[0] ?? null;
}

function fileEnvelope(operation: string, status: number, startedAt: number, result: unknown, objectCount: number, bytes: number): Response {
  return json({
    requestId: crypto.randomUUID(), operation, resource: 'DEMO_R2 / wizardgang-demo-r2', status,
    durationMs: Number((performance.now() - startedAt).toFixed(2)), objectCount, bytes, result,
  }, { status, headers: { 'cache-control': 'no-store' } });
}

function attachSession(response: Response, session?: DemoSession): Response {
  return session ? withDemoSession(response, session) : response;
}

export async function r2FilesResponse(request: Request, env: Env, rawId?: string): Promise<Response> {
  let session: DemoSession | undefined;
  const startedAt = performance.now();
  try {
    if (!env.DEMO_R2) throw new HttpError(503, 'r2_not_configured');
    if (request.method !== 'GET') {
      const originFailure = requireSameOrigin(request);
      if (originFailure) return originFailure;
    }
    session = await ensureDemoSession(request, env);
    await ensureSharedR2Seeds(env);

    if (!rawId && request.method === 'GET') {
      const result = await env.DEMO_DB.prepare(
        `SELECT object_key, content_type, size_bytes, updated_at, session_id, display_name
         FROM r2_object_metadata
         WHERE session_id = ? OR object_key LIKE 'documents/%' OR object_key LIKE 'images/%'
         ORDER BY session_id IS NOT NULL, updated_at DESC LIMIT 25`,
      ).bind(session.id).all<FileMetadataRow>();
      const files = result.results.map(presentFile);
      return attachSession(fileEnvelope('r2.files.list', 200, startedAt, { files }, files.length, files.reduce((sum, file) => sum + file.sizeBytes, 0)), session);
    }

    if (!rawId && request.method === 'POST') {
      const declared = Number(request.headers.get('content-length') || '0');
      if (declared > MAX_FILE_BYTES + 65_536) throw new HttpError(413, 'file_too_large');
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File) || file.size <= 0) throw new HttpError(400, 'file_required');
      if (file.size > MAX_FILE_BYTES) throw new HttpError(413, 'file_too_large');
      const aggregate = await env.DEMO_DB.prepare(
        'SELECT COUNT(*) AS object_count, COALESCE(SUM(size_bytes), 0) AS total_bytes FROM r2_object_metadata WHERE session_id = ?',
      ).bind(session.id).all<AggregateRow>();
      const usage = aggregate.results[0] ?? { object_count: 0, total_bytes: 0 };
      if (usage.object_count >= MAX_OBJECTS) throw new HttpError(409, 'object_limit_reached');
      if (usage.total_bytes + file.size > MAX_TOTAL_BYTES) throw new HttpError(409, 'byte_limit_reached');
      const displayName = safeName(file.name);
      const key = `uploads/${session.id}/${crypto.randomUUID()}-${safeKeyName(displayName)}`;
      const contentType = (file.type || 'application/octet-stream').toLowerCase().slice(0, 120);
      const body = await file.arrayBuffer();
      await env.DEMO_R2.put(key, body, { httpMetadata: { contentType } });
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
      try {
        await env.DEMO_DB.prepare(
          `INSERT INTO r2_object_metadata (object_key, content_type, size_bytes, updated_at, updated_by, session_id, display_name, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(key, contentType, file.size, now, 'visitor-sandbox', session.id, displayName, expiresAt).run();
      } catch (error) {
        await env.DEMO_R2.delete(key);
        throw error;
      }
      const row: FileMetadataRow = { object_key: key, content_type: contentType, size_bytes: file.size, updated_at: now, session_id: session.id, display_name: displayName };
      await recordDemoEvent(env, 'r2', 'sandbox_object_stored', { displayName, contentType, sizeBytes: file.size });
      return attachSession(fileEnvelope('r2.files.put', 201, startedAt, { file: presentFile(row) }, 1, file.size), session);
    }

    if (!rawId) return attachSession(methodNotAllowed(['GET', 'POST']), session);
    const key = keyFromId(decodeURIComponent(rawId));
    const metadata = await metadataFor(env, session.id, key);
    if (!metadata) throw new HttpError(404, 'file_not_found');

    if (request.method === 'GET') {
      const object = await env.DEMO_R2.get(key);
      if (!object) throw new HttpError(404, 'file_not_found');
      const download = new URL(request.url).searchParams.get('download') === '1';
      const inline = !download && INLINE_TYPES.has(metadata.content_type);
      const headers = withSecurityHeaders(new Headers({
        'content-type': metadata.content_type,
        'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName(metadata.display_name || 'download').replaceAll('"', '')}"`,
        'cache-control': 'private, no-store',
      }));
      headers.set('x-frame-options', inline ? 'SAMEORIGIN' : 'DENY');
      headers.set('content-security-policy', "default-src 'none'; sandbox; frame-ancestors 'self'");
      const body = object.body ?? (object.arrayBuffer ? await object.arrayBuffer() : await object.text());
      return attachSession(new Response(body, { headers }), session);
    }

    if (request.method === 'DELETE') {
      if (metadata.session_id !== session.id || !key.startsWith(`uploads/${session.id}/`)) throw new HttpError(403, 'file_not_owned');
      await env.DEMO_R2.delete(key);
      await env.DEMO_DB.prepare('DELETE FROM r2_object_metadata WHERE object_key = ? AND session_id = ?').bind(key, session.id).run();
      await recordDemoEvent(env, 'r2', 'sandbox_object_deleted', { displayName: metadata.display_name, sizeBytes: metadata.size_bytes });
      return attachSession(fileEnvelope('r2.files.delete', 200, startedAt, { deleted: true, id: rawId }, 1, metadata.size_bytes), session);
    }
    return attachSession(methodNotAllowed(['GET', 'DELETE']), session);
  } catch (error) {
    return attachSession(errorResponse(error), session);
  }
}

export async function r2FilesResetResponse(request: Request, env: Env): Promise<Response> {
  let session: DemoSession | undefined;
  const startedAt = performance.now();
  try {
    if (request.method !== 'POST') return methodNotAllowed(['POST']);
    const originFailure = requireSameOrigin(request);
    if (originFailure) return originFailure;
    if (!env.DEMO_R2) throw new HttpError(503, 'r2_not_configured');
    session = await ensureDemoSession(request, env);
    const result = await env.DEMO_DB.prepare(
      'SELECT object_key, content_type, size_bytes, updated_at, session_id, display_name FROM r2_object_metadata WHERE session_id = ? LIMIT 10',
    ).bind(session.id).all<FileMetadataRow>();
    for (const row of result.results) if (row.object_key.startsWith(`uploads/${session.id}/`)) await env.DEMO_R2.delete(row.object_key);
    await env.DEMO_DB.prepare('DELETE FROM r2_object_metadata WHERE session_id = ?').bind(session.id).run();
    await recordDemoEvent(env, 'r2', 'sandbox_objects_reset', { objectCount: result.results.length });
    return attachSession(fileEnvelope('r2.files.reset', 200, startedAt, { reset: true }, result.results.length, result.results.reduce((sum, row) => sum + row.size_bytes, 0)), session);
  } catch (error) {
    return attachSession(errorResponse(error), session);
  }
}
