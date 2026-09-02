import { describe, expect, it } from 'vitest';
import { recordsResponse } from '../src/api/records';
import { authorize } from '../src/lib/authorization';
import { createDemoAccessToken, type IdentitySession } from '../src/lib/identity-session';
import type { D1PreparedStatement, Env } from '../src/types';

class MemoryStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly database: MemoryD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.includes('INSERT INTO demo_records')) {
      const [namespace, key, value, createdAt, updatedAt] = this.values as string[];
      this.database.records.set(`${namespace}/${key}`, { id: 1, namespace, record_key: key, value_json: value, created_at: createdAt, updated_at: updatedAt });
    }
    if (this.sql.startsWith('DELETE FROM demo_records') && this.values.length > 1) this.database.records.delete(`${this.values[0]}/${this.values[1]}`);
    else if (this.sql.startsWith('DELETE FROM demo_records')) for (const record of [...this.database.records.keys()]) if (record.startsWith(`${this.values[0]}/`)) this.database.records.delete(record);
    return { meta: { last_row_id: this.database.nextId++ } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_records')) {
      const namespace = this.values[0];
      const key = this.values[1];
      const results = [...this.database.records.values()].filter((row) => row.namespace === namespace && (!key || row.record_key === key));
      return { results: results as T[] };
    }
    return { results: [] as T[] };
  }
}

class MemoryD1 {
  records = new Map<string, { id: number; namespace: string; record_key: string; value_json: string; created_at: string; updated_at: string }>();
  nextId = 1;
  prepare(sql: string) { return new MemoryStatement(this, sql); }
}

function env(): Env {
  return {
    DEMO_DB: new MemoryD1(),
    DEMO_API_TOKEN: 'test-write-token',
    IDENTITY_SESSION_SECRET: 'test-identity-secret-with-at-least-32-characters',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

async function visitorToken(environment: Env, subject: string): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60_000).toISOString();
  const session: IdentitySession = {
    identity: { provider: 'google', protocol: 'oidc', subject, displayName: subject, assurance: 'provider-authenticated', role: 'viewer', authenticatedAt: now.toISOString(), expiresAt },
    providerPayloadLabel: 'Test', providerPayload: {}, validation: [], protocol: { name: 'OIDC', steps: [] }, issuedAt: now.toISOString(), expiresAt,
  };
  return (await createDemoAccessToken(environment, session)).token;
}

describe('shared application authorization', () => {
  it('allows anonymous reads but protects writes', async () => {
    const environment = env();
    expect(await authorize(new Request('https://demo.example/v1/demo-records'), environment, 'demo:read')).toMatchObject({ authentication: 'anonymous' });
    const denied = await authorize(new Request('https://demo.example/v1/demo-records'), environment, 'demo:write');
    expect(denied).toBeInstanceOf(Response);
    expect((denied as Response).status).toBe(401);
  });
});

describe('D1 REST records', () => {
  it('validates, stores, reads, and deletes a bounded record', async () => {
    const environment = env();
    const authorization = { authorization: 'Bearer test-write-token', 'content-type': 'application/json' };
    const created = await recordsResponse(new Request('https://demo.example/v1/demo-records', {
      method: 'POST', headers: authorization, body: JSON.stringify({ namespace: 'public', key: 'example', value: { count: 2 } }),
    }), environment);
    expect(created.status).toBe(201);
    expect(created.headers.get('x-request-id')).toMatch(/^req_[0-9a-f]{32}$/);

    const conflict = await recordsResponse(new Request('https://demo.example/v1/demo-records', {
      method: 'POST', headers: authorization, body: JSON.stringify({ namespace: 'public', key: 'example', value: { count: 3 } }),
    }), environment);
    expect(conflict.status).toBe(409);

    const replaced = await recordsResponse(new Request('https://demo.example/v1/demo-records/example?namespace=public', {
      method: 'PUT', headers: authorization, body: JSON.stringify({ value: { count: 4 } }),
    }), environment, 'example');
    expect(replaced.status).toBe(200);

    const listed = await recordsResponse(new Request('https://demo.example/v1/demo-records?namespace=public'), environment);
    expect(await listed.json()).toMatchObject({ results: [{ key: 'example', value: { count: 4 } }] });

    const deleted = await recordsResponse(new Request('https://demo.example/v1/demo-records/example?namespace=public', {
      method: 'DELETE', headers: { authorization: 'Bearer test-write-token' },
    }), environment, 'example');
    expect(deleted.status).toBe(204);
  });

  it('derives visitor write scope server-side and isolates identities', async () => {
    const environment = env();
    const first = await visitorToken(environment, 'first-user');
    const second = await visitorToken(environment, 'second-user');
    const created = await recordsResponse(new Request('https://demo.example/v1/demo-records', {
      method: 'POST', headers: { authorization: `Bearer ${first}`, 'content-type': 'application/json' },
      body: JSON.stringify({ namespace: 'public', key: 'private-note', value: true }),
    }), environment);
    const body = await created.json() as { namespace: string };
    expect(body.namespace).toMatch(/^sandbox-[0-9a-f]{24}$/);
    expect(body.namespace).not.toBe('public');

    const other = await recordsResponse(new Request('https://demo.example/v1/demo-records?namespace=' + body.namespace, {
      headers: { authorization: `Bearer ${second}` },
    }), environment);
    expect(await other.json()).toMatchObject({ results: [] });

    const anonymous = await recordsResponse(new Request('https://demo.example/v1/demo-records?namespace=' + body.namespace), environment);
    expect(await anonymous.json()).toMatchObject({ results: [], authorization: { scope: 'public' } });
  });

  it('rejects invalid identifiers and unauthenticated writes', async () => {
    const environment = env();
    const denied = await recordsResponse(new Request('https://demo.example/v1/demo-records', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: 'ok', value: true }),
    }), environment);
    expect(denied.status).toBe(401);

    const invalid = await recordsResponse(new Request('https://demo.example/v1/demo-records', {
      method: 'POST', headers: { authorization: 'Bearer test-write-token', 'content-type': 'application/json' }, body: JSON.stringify({ key: '../escape', value: true }),
    }), environment);
    expect(invalid.status).toBe(400);
  });
});
