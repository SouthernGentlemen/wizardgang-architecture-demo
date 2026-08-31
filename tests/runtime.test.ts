import { describe, expect, it } from 'vitest';
import { edgeInspectionResponse, workerComputeResponse } from '../src/api/runtime';
import { r2DemoObjectResponse, r2ObjectResponse } from '../src/api/r2';
import { DemoCoordinator } from '../src/durable/demo-coordinator';
import type { D1PreparedStatement, Env } from '../src/types';

class RuntimeStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: RuntimeD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.includes('INSERT INTO r2_object_metadata')) {
      this.db.metadata.set(String(this.values[0]), { object_key: this.values[0], content_type: this.values[1], size_bytes: this.values[2], updated_at: this.values[3], updated_by: this.values[4] });
    }
    return { meta: { last_row_id: this.db.nextId++ } };
  }
  async all<T>() {
    if (this.sql.includes('FROM r2_object_metadata')) {
      const row = this.db.metadata.get(String(this.values[0]));
      return { results: (row ? [row] : []) as T[] };
    }
    return { results: [] as T[] };
  }
}

class RuntimeD1 {
  nextId = 1;
  metadata = new Map<string, Record<string, unknown>>();
  prepare(sql: string) { return new RuntimeStatement(this, sql); }
}

class MemoryR2 {
  objects = new Map<string, string>();
  async put(key: string, value: string) { this.objects.set(key, value); }
  async get(key: string) { const value = this.objects.get(key); return value === undefined ? null : { text: async () => value }; }
  async delete(key: string) { this.objects.delete(key); }
}

function env(): Env {
  return {
    DEMO_DB: new RuntimeD1(),
    DEMO_R2: new MemoryR2(),
    DEMO_API_TOKEN: 'write-token',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

describe('edge and Worker demonstrations', () => {
  it('returns only allowlisted edge context', async () => {
    const request = new Request('https://demo.example/__api/edge/inspect', { headers: { cookie: 'private=value', accept: 'application/json' } }) as Request & { cf?: Record<string, unknown> };
    request.cf = { colo: 'IAD', country: 'US', clientTcpRtt: 12, clientIp: '192.0.2.1' };
    const response = await edgeInspectionResponse(request, env());
    const body = await response.json() as { edge: Record<string, unknown>; privacy: string };
    expect(body.edge).toEqual({ colo: 'IAD', country: 'US' });
    expect(JSON.stringify(body)).not.toContain('192.0.2.1');
    expect(body.privacy).toContain('cookies');
  });

  it('performs bounded stateless computation', async () => {
    const response = await workerComputeResponse(new Request('https://demo.example/__api/workers/compute', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'average', values: [2, 4, 9] }),
    }), env());
    expect(await response.json()).toMatchObject({ result: 5, inputCount: 3 });
  });
});

describe('R2 object boundary', () => {
  it('writes the object to R2 and stores only metadata in D1', async () => {
    const environment = env();
    const created = await r2DemoObjectResponse(new Request('https://demo.example/__api/r2/demo', { method: 'POST' }), environment);
    expect(await created.json()).toMatchObject({ storage: 'R2', metadata: 'D1 demo-blob', key: 'public/visitor-demo.txt' });

    const fetched = await r2ObjectResponse(new Request('https://demo.example/__api/r2/object?key=public%2Fvisitor-demo.txt'), environment);
    const body = await fetched.json() as { content: string; metadata: { object_key: string } };
    expect(body.content).toContain('WizardGang R2 demonstration object');
    expect(body.metadata.object_key).toBe('public/visitor-demo.txt');
  });
});

describe('Durable Object coordination', () => {
  it('serializes concurrent counter increments and persists the result in object storage', async () => {
    const values = new Map<string, unknown>();
    const object = new DemoCoordinator({ storage: {
      async get<T>(key: string) { await Promise.resolve(); return values.get(key) as T | undefined; },
      async put<T>(key: string, value: T) { await Promise.resolve(); values.set(key, value); },
    } });
    const [first, second] = await Promise.all([
      object.fetch(new Request('https://object/increment', { method: 'POST' })),
      object.fetch(new Request('https://object/increment', { method: 'POST' })),
    ]);
    const counters = [(await first.json() as { counter: number }).counter, (await second.json() as { counter: number }).counter];
    expect(counters).toEqual([1, 2]);
    expect(values.get('counter')).toBe(2);
  });
});
