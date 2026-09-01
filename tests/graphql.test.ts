import { describe, expect, it } from 'vitest';
import { graphqlResponse } from '../src/api/graphql';
import type { D1PreparedStatement, Env } from '../src/types';

type Row = Record<string, unknown>;

class GraphStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: GraphD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.startsWith('INSERT INTO demo_sessions')) {
      const [id, createdAt, expiresAt, lastSeenAt] = this.values as string[];
      this.db.sessions.set(id, { id, created_at: createdAt, expires_at: expiresAt, last_seen_at: lastSeenAt });
    } else if (this.sql.startsWith('INSERT INTO demo_users')) {
      const [id, sessionId, name, email, role, createdAt, updatedAt] = this.values as string[];
      this.db.users.set(id, { id, session_id: sessionId, name, email, role, created_at: createdAt, updated_at: updatedAt });
    } else if (this.sql.startsWith('INSERT INTO demo_tasks')) {
      const [id, sessionId, assigneeId, title, status, createdAt, updatedAt] = this.values as string[];
      this.db.tasks.set(id, { id, session_id: sessionId, assignee_id: assigneeId, title, status, created_at: createdAt, updated_at: updatedAt });
    }
    return { meta: { last_row_id: 1, changes: 1 } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_sessions')) {
      const row = this.db.sessions.get(String(this.values[0])); return { results: (row ? [row] : []) as T[] };
    }
    if (this.sql.includes('COUNT(*)') && this.sql.includes('demo_users')) {
      const [sessionId, id] = this.values as string[];
      return { results: [{ total: [...this.db.users.values()].filter((row) => row.session_id === sessionId && (!id || row.id === id)).length }] as T[] };
    }
    if (this.sql.includes('FROM demo_users')) {
      const [sessionId, id] = this.values as string[];
      return { results: [...this.db.users.values()].filter((row) => row.session_id === sessionId && (!id || row.id === id)) as T[] };
    }
    return { results: [] as T[] };
  }
}

class GraphD1 {
  sessions = new Map<string, Row>();
  users = new Map<string, Row>();
  tasks = new Map<string, Row>();
  prepare(sql: string) { return new GraphStatement(this, sql); }
}

function env(): Env {
  return {
    DEMO_DB: new GraphD1(),
    DEMO_SESSION_SECRET: 'test-session-secret-with-at-least-32-characters',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

describe('GraphQL Yoga D1 interface', () => {
  it('serves an embeddable GraphiQL interface', async () => {
    const response = await graphqlResponse(new Request('https://demo.example/graphql', { headers: { accept: 'text/html' } }), env());
    expect(response.status).toBe(200);
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(await response.text()).toContain('WizardGang GraphiQL');
  });

  it('queries and mutates the same session-scoped users', async () => {
    const environment = env();
    const query = JSON.stringify({ query: 'query { users { id name email role } }' });
    const first = await graphqlResponse(new Request('https://demo.example/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: query }), environment);
    const cookie = first.headers.get('set-cookie')!.split(';')[0];
    const initialBody = await first.clone().json() as { data: { users: Array<{ name: string }> } };
    expect(initialBody.data.users.some((user) => user.name === 'Ada Lovelace')).toBe(true);

    const mutation = await graphqlResponse(new Request('https://demo.example/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://demo.example', cookie },
      body: JSON.stringify({ query: 'mutation { createUser(input: { name: "Mary Jackson", email: "mary@example.test", role: MEMBER }) { name role } }' }),
    }), environment);
    expect(await mutation.json()).toMatchObject({ data: { createUser: { name: 'Mary Jackson', role: 'MEMBER' } } });

    const listed = await graphqlResponse(new Request('https://demo.example/graphql', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: query }), environment);
    expect((await listed.json() as { data: { users: unknown[] } }).data.users).toHaveLength(4);
  });

  it('rejects batching and cross-origin mutation', async () => {
    const environment = env();
    const batched = await graphqlResponse(new Request('https://demo.example/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '[]' }), environment);
    expect(batched.status).toBe(400);

    const denied = await graphqlResponse(new Request('https://demo.example/graphql', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://attacker.example' },
      body: JSON.stringify({ query: 'mutation { createUser(input: { name: "X", email: "x@example.test", role: MEMBER }) { id } }' }),
    }), environment);
    expect(await denied.json()).toMatchObject({ errors: [{ extensions: { code: 'FORBIDDEN' } }] });
  });
});
