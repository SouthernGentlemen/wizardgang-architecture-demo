import { describe, expect, it } from 'vitest';
import { recordsResponse } from '../src/api/records';
import { authorize } from '../src/lib/authorization';
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
    if (this.sql.startsWith('DELETE FROM demo_records')) this.database.records.delete(`${this.values[0]}/${this.values[1]}`);
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
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
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

    const listed = await recordsResponse(new Request('https://demo.example/v1/demo-records?namespace=public'), environment);
    expect(await listed.json()).toMatchObject({ results: [{ key: 'example', value: { count: 2 } }] });

    const deleted = await recordsResponse(new Request('https://demo.example/v1/demo-records/example?namespace=public', {
      method: 'DELETE', headers: { authorization: 'Bearer test-write-token' },
    }), environment, 'example');
    expect(deleted.status).toBe(204);
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
