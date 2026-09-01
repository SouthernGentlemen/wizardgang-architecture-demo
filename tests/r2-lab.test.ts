import { describe, expect, it } from 'vitest';
import { r2FilesResetResponse, r2FilesResponse } from '../src/api/r2';
import type { D1PreparedStatement, Env, R2ObjectBody } from '../src/types';

type Metadata = { object_key: string; content_type: string; size_bytes: number; updated_at: string; updated_by: string; session_id: string | null; display_name: string | null; expires_at: string | null };

class R2Statement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: R2D1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.startsWith('INSERT INTO demo_sessions')) {
      const [id, createdAt, expiresAt, lastSeenAt] = this.values as string[];
      this.db.sessions.set(id, { id, created_at: createdAt, expires_at: expiresAt, last_seen_at: lastSeenAt });
    } else if (this.sql.includes('INSERT INTO r2_object_metadata')) {
      const [objectKey, contentType, sizeBytes, updatedAt, updatedBy, value5, value6, value7] = this.values;
      const shared = this.sql.includes('NULL, ?, NULL');
      this.db.metadata.set(String(objectKey), {
        object_key: String(objectKey), content_type: String(contentType), size_bytes: Number(sizeBytes), updated_at: String(updatedAt), updated_by: String(updatedBy),
        session_id: shared ? null : String(value5), display_name: String(shared ? value5 : value6), expires_at: shared ? null : String(value7),
      });
    } else if (this.sql.startsWith('DELETE FROM r2_object_metadata')) {
      const [keyOrSession, session] = this.values as string[];
      if (session) { const row = this.db.metadata.get(keyOrSession); if (row?.session_id === session) this.db.metadata.delete(keyOrSession); }
      else for (const [key, row] of this.db.metadata) if (row.session_id === keyOrSession) this.db.metadata.delete(key);
    }
    return { meta: { last_row_id: this.db.nextId++, changes: 1 } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_sessions')) {
      const row = this.db.sessions.get(String(this.values[0])); return { results: (row ? [row] : []) as T[] };
    }
    if (this.sql.includes('COUNT(*)') && this.sql.includes('r2_object_metadata')) {
      const rows = [...this.db.metadata.values()].filter((row) => row.session_id === this.values[0]);
      return { results: [{ object_count: rows.length, total_bytes: rows.reduce((sum, row) => sum + row.size_bytes, 0) }] as T[] };
    }
    if (this.sql.includes('FROM r2_object_metadata')) {
      if (this.sql.includes('object_key = ?')) {
        const row = this.db.metadata.get(String(this.values[0]));
        return { results: (row && (row.session_id === this.values[1] || row.session_id === null) ? [row] : []) as T[] };
      }
      const session = this.values[0];
      const rows = [...this.db.metadata.values()].filter((row) => row.session_id === session || (this.sql.includes("object_key LIKE 'documents/%'") && (row.object_key.startsWith('documents/') || row.object_key.startsWith('images/'))));
      return { results: rows as T[] };
    }
    return { results: [] as T[] };
  }
}

class R2D1 {
  sessions = new Map<string, Record<string, unknown>>();
  metadata = new Map<string, Metadata>();
  nextId = 1;
  prepare(sql: string) { return new R2Statement(this, sql); }
}

class MemoryR2 {
  objects = new Map<string, { bytes: Uint8Array; contentType?: string }>();
  async put(key: string, value: string | ArrayBuffer | ReadableStream<Uint8Array>, options?: { httpMetadata?: { contentType?: string } }) {
    if (value instanceof ReadableStream) throw new Error('stream not used by this demo');
    const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
    this.objects.set(key, { bytes, contentType: options?.httpMetadata?.contentType });
  }
  async get(key: string): Promise<R2ObjectBody | null> {
    const item = this.objects.get(key); if (!item) return null;
    return { text: async () => new TextDecoder().decode(item.bytes), arrayBuffer: async () => item.bytes.slice().buffer as ArrayBuffer, size: item.bytes.byteLength, httpMetadata: { contentType: item.contentType } };
  }
  async delete(key: string) { this.objects.delete(key); }
}

function env(): Env {
  return {
    DEMO_DB: new R2D1(), DEMO_R2: new MemoryR2(),
    DEMO_SESSION_SECRET: 'test-session-secret-with-at-least-32-characters',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main',
  };
}

describe('R2 visitor file manager', () => {
  it('uploads real bytes, lists safe metadata, previews, deletes, and resets only the session', async () => {
    const environment = env();
    const listed = await r2FilesResponse(new Request('https://demo.example/__api/r2/files'), environment);
    const cookie = listed.headers.get('set-cookie')!.split(';')[0];
    expect(await listed.clone().json()).toMatchObject({ operation: 'r2.files.list', objectCount: 2 });

    const form = new FormData(); form.append('file', new Blob(['hello r2'], { type: 'text/plain' }), 'hello.txt');
    const uploaded = await r2FilesResponse(new Request('https://demo.example/__api/r2/files', { method: 'POST', headers: { origin: 'https://demo.example', cookie }, body: form }), environment);
    const uploadBody = await uploaded.json() as { result: { file: { id: string; key: string } } };
    expect(uploadBody.result.file.key).toContain('uploads/this-session/');
    expect((environment.DEMO_R2 as MemoryR2).objects.size).toBe(3);

    const id = uploadBody.result.file.id;
    const preview = await r2FilesResponse(new Request(`https://demo.example/__api/r2/files/${id}`, { headers: { cookie } }), environment, id);
    expect(await preview.text()).toBe('hello r2');
    expect(preview.headers.get('content-disposition')).toContain('inline');

    expect((await r2FilesResponse(new Request(`https://demo.example/__api/r2/files/${id}`, { method: 'DELETE', headers: { origin: 'https://demo.example', cookie } }), environment, id)).status).toBe(200);
    expect((environment.DEMO_R2 as MemoryR2).objects.size).toBe(2);
    expect((await r2FilesResetResponse(new Request('https://demo.example/__api/r2/reset', { method: 'POST', headers: { origin: 'https://demo.example', cookie } }), environment)).status).toBe(200);
  });

  it('rejects cross-origin upload before creating a sandbox', async () => {
    const environment = env();
    const response = await r2FilesResponse(new Request('https://demo.example/__api/r2/files', { method: 'POST', headers: { origin: 'https://attacker.example' } }), environment);
    expect(response.status).toBe(403);
    expect((environment.DEMO_DB as R2D1).sessions.size).toBe(0);
  });
});

