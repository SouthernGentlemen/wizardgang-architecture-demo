import { describe, expect, it } from 'vitest';
import { edgeInspectionResponse, workerComputeResponse } from '../src/api/runtime';
import { DemoCoordinator } from '../src/durable/demo-coordinator';
import type { D1PreparedStatement, Env } from '../src/types';

class RuntimeStatement implements D1PreparedStatement {
  constructor(private readonly db: RuntimeD1) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: this.db.nextId++ } }; }
  async all<T>() { return { results: [] as T[] }; }
}

class RuntimeD1 {
  nextId = 1;
  prepare() { return new RuntimeStatement(this); }
}

function env(): Env {
  return {
    DEMO_DB: new RuntimeD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

describe('edge and Worker demonstrations', () => {
  it('returns only allowlisted edge context', async () => {
    const request = new Request('https://demo.example/api/labs/edge', { headers: { cookie: 'private=value', accept: 'application/json' } }) as Request & { cf?: Record<string, unknown> };
    request.cf = { colo: 'IAD', country: 'US', tlsVersion: 'TLSv1.3', clientTcpRtt: 12, clientIp: '192.0.2.1' };
    const response = await edgeInspectionResponse(request, env());
    const body = await response.json() as { request: { host: string }; edge: Record<string, unknown>; delivery: { cacheControl: string }; privacy: string };
    expect(body.request.host).toBe('demo.example');
    expect(body.edge).toEqual({ colo: 'IAD', country: 'US', tlsVersion: 'TLSv1.3' });
    expect(body.delivery.cacheControl).toBe('no-store');
    expect(JSON.stringify(body)).not.toContain('192.0.2.1');
    expect(body.privacy).toContain('cookies');
  });

  it('performs bounded stateless computation', async () => {
    const response = await workerComputeResponse(new Request('https://demo.example/api/labs/workers', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'average', values: [2, 4, 9] }),
    }), env());
    expect(await response.json()).toMatchObject({ result: 5, inputCount: 3 });
  });

  it('applies a stateless edge policy before origin work', async () => {
    const response = await workerComputeResponse(new Request('https://demo.example/api/labs/workers', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operation: 'edge-policy',
        request: { method: 'GET', path: '/assets/app.js', hasCookie: false, hasAuthorization: false },
      }),
    }), env());
    expect(await response.json()).toMatchObject({
      operation: 'edge-policy',
      request: { method: 'GET', path: '/assets/app.js' },
      decision: { route: 'asset', cache: 'public', originRequired: false },
    });
  });

  it.each([
    ['POST', '/assets/app.js', false, false, 'asset', 'private', true],
    ['GET', '/app/dashboard', false, false, 'worker', 'private', true],
    ['GET', '/assets/app.js', true, false, 'asset', 'private', true],
    ['GET', '/assets/app.js', false, true, 'asset', 'private', true],
  ] as const)('keeps %s %s with cookie=%s authorization=%s out of public edge cache', async (method, path, hasCookie, hasAuthorization, route, cache, originRequired) => {
    const response = await workerComputeResponse(new Request('https://demo.example/api/labs/workers', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operation: 'edge-policy', request: { method, path, hasCookie, hasAuthorization },
      }),
    }), env());
    expect(await response.json()).toMatchObject({ decision: { route, cache, originRequired } });
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
