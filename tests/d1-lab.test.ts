import { describe, expect, it } from 'vitest';
import { d1LabResponse } from '../src/api/d1-lab';
import { createSignedDemoSessionValue, verifySignedDemoSessionValue } from '../src/lib/demo-session';
import type { D1PreparedStatement, Env } from '../src/types';

type Row = Record<string, unknown>;

class LabStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: LabD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    const now = String(this.values.at(-1) || new Date().toISOString());
    if (this.sql.startsWith('INSERT INTO demo_sessions')) {
      const [id, createdAt, expiresAt, lastSeenAt] = this.values as string[];
      this.db.sessions.set(id, { id, created_at: createdAt, expires_at: expiresAt, last_seen_at: lastSeenAt });
    } else if (this.sql.startsWith('UPDATE demo_sessions')) {
      const row = this.db.sessions.get(String(this.values[1])); if (row) row.last_seen_at = String(this.values[0]);
    } else if (this.sql.startsWith('INSERT INTO demo_users')) {
      const [id, sessionId, name, email, role, createdAt, updatedAt] = this.values as string[];
      if ([...this.db.users.values()].some((row) => row.session_id === sessionId && row.email === email)) throw new Error('unique');
      this.db.users.set(id, { id, session_id: sessionId, name, email, role, created_at: createdAt, updated_at: updatedAt });
    } else if (this.sql.startsWith('UPDATE demo_users SET')) {
      const [name, email, role, updatedAt, sessionId, id] = this.values as string[];
      const row = this.db.users.get(id); if (row?.session_id === sessionId) Object.assign(row, { name, email, role, updated_at: updatedAt });
    } else if (this.sql.startsWith('DELETE FROM demo_users')) {
      const [sessionId, id] = this.values as string[];
      if (id) { const row = this.db.users.get(id); if (row?.session_id === sessionId) this.db.users.delete(id); }
      else for (const [key, row] of this.db.users) if (row.session_id === sessionId) this.db.users.delete(key);
    } else if (this.sql.startsWith('INSERT INTO demo_tasks')) {
      const [id, sessionId, assigneeId, title, status, createdAt, updatedAt] = this.values as string[];
      this.db.tasks.set(id, { id, session_id: sessionId, assignee_id: assigneeId, title, status, created_at: createdAt, updated_at: updatedAt });
    } else if (this.sql.startsWith('UPDATE demo_tasks SET assignee_id = NULL')) {
      const [, sessionId, id] = this.values as string[];
      for (const row of this.db.tasks.values()) if (row.session_id === sessionId && row.assignee_id === id) Object.assign(row, { assignee_id: null, updated_at: now });
    } else if (this.sql.startsWith('UPDATE demo_tasks SET')) {
      const [assigneeId, title, status, updatedAt, sessionId, id] = this.values as string[];
      const row = this.db.tasks.get(id); if (row?.session_id === sessionId) Object.assign(row, { assignee_id: assigneeId || null, title, status, updated_at: updatedAt });
    } else if (this.sql.startsWith('DELETE FROM demo_tasks')) {
      const [sessionId, id] = this.values as string[];
      if (id) { const row = this.db.tasks.get(id); if (row?.session_id === sessionId) this.db.tasks.delete(id); }
      else for (const [key, row] of this.db.tasks) if (row.session_id === sessionId) this.db.tasks.delete(key);
    }
    return { meta: { last_row_id: this.db.nextId++, changes: 1 } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_sessions')) {
      const row = this.db.sessions.get(String(this.values[0])); return { results: (row ? [row] : []) as T[] };
    }
    if (this.sql.includes('COUNT(*)') && this.sql.includes('demo_users')) {
      const [sessionId, id] = this.values as string[];
      const total = [...this.db.users.values()].filter((row) => row.session_id === sessionId && (!id || row.id === id)).length;
      return { results: [{ total }] as T[] };
    }
    if (this.sql.includes('COUNT(*)') && this.sql.includes('demo_tasks')) {
      const total = [...this.db.tasks.values()].filter((row) => row.session_id === this.values[0]).length;
      return { results: [{ total }] as T[] };
    }
    if (this.sql.includes('FROM demo_users')) {
      const [sessionId, id] = this.values as string[];
      return { results: [...this.db.users.values()].filter((row) => row.session_id === sessionId && (!id || row.id === id)) as T[] };
    }
    if (this.sql.includes('FROM demo_tasks')) {
      const [sessionId, id] = this.values as string[];
      return { results: [...this.db.tasks.values()].filter((row) => row.session_id === sessionId && (!id || row.id === id)) as T[] };
    }
    return { results: [] as T[] };
  }
}

class LabD1 {
  sessions = new Map<string, Row>();
  users = new Map<string, Row>();
  tasks = new Map<string, Row>();
  nextId = 1;
  prepare(sql: string) { return new LabStatement(this, sql); }
}

function environment(database = new LabD1()): Env {
  return {
    DEMO_DB: database,
    DEMO_SESSION_SECRET: 'test-session-secret-with-at-least-32-characters',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

function mutation(path: string, method: string, body?: unknown, cookie?: string): Request {
  return new Request(`https://demo.example${path}`, {
    method,
    headers: { origin: 'https://demo.example', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('signed visitor session', () => {
  it('round-trips a signed opaque ID and rejects tampering', async () => {
    const secret = 'test-session-secret-with-at-least-32-characters';
    const id = crypto.randomUUID();
    const value = await createSignedDemoSessionValue(id, secret);
    expect(await verifySignedDemoSessionValue(value, secret)).toBe(id);
    const replacement = value.endsWith('0') ? '1' : '0';
    expect(await verifySignedDemoSessionValue(`${value.slice(0, -1)}${replacement}`, secret)).toBeNull();
  });
});

describe('D1 visitor laboratory', () => {
  it('seeds, creates, updates, deletes, and resets isolated users', async () => {
    const database = new LabD1();
    const env = environment(database);
    const initial = await d1LabResponse(new Request('https://demo.example/__api/d1/users'), env, 'users');
    expect(initial.status).toBe(200);
    expect(await initial.clone().json()).toMatchObject({ operation: 'd1.users.list', rowCount: 3 });
    const setCookie = initial.headers.get('set-cookie')!;
    const cookie = setCookie.split(';')[0];

    const created = await d1LabResponse(mutation('/__api/d1/users', 'POST', { name: 'Mary Jackson', email: 'mary@example.test', role: 'member' }, cookie), env, 'users');
    const createdBody = await created.json() as { result: { user: { id: string } } };
    expect(created.status).toBe(201);

    const id = createdBody.result.user.id;
    const updated = await d1LabResponse(mutation(`/__api/d1/users/${id}`, 'PATCH', { name: 'Mary W. Jackson', email: 'mary@example.test', role: 'admin' }, cookie), env, 'users', id);
    expect(await updated.json()).toMatchObject({ result: { user: { name: 'Mary W. Jackson', role: 'admin' } } });

    expect((await d1LabResponse(mutation(`/__api/d1/users/${id}`, 'DELETE', undefined, cookie), env, 'users', id)).status).toBe(200);
    expect((await d1LabResponse(mutation('/__api/d1/reset', 'POST', undefined, cookie), env, 'reset')).status).toBe(200);
    expect([...database.users.values()].filter((row) => row.session_id === [...database.sessions.keys()][0])).toHaveLength(3);
  });

  it('rejects cross-origin writes and keeps two sessions isolated', async () => {
    const database = new LabD1();
    const env = environment(database);
    const first = await d1LabResponse(new Request('https://demo.example/__api/d1/users'), env, 'users');
    const second = await d1LabResponse(new Request('https://demo.example/__api/d1/users'), env, 'users');
    expect(first.headers.get('set-cookie')).not.toBe(second.headers.get('set-cookie'));

    const denied = await d1LabResponse(new Request('https://demo.example/__api/d1/users', {
      method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body: '{}',
    }), env, 'users');
    expect(denied.status).toBe(403);
    expect(database.sessions.size).toBe(2);
  });
});
