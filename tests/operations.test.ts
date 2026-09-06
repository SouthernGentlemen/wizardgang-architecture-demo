import { describe, expect, it, vi } from 'vitest';
import { billingScenarioResponse } from '../src/api/billing';
import { cloudflareUsageResponse } from '../src/api/operations';
import { workerComputeResponse } from '../src/api/runtime';
import { renderBilling, renderDashboard, renderDocs, renderUptime } from '../src/demos/operations-pages';
import { runScheduledOperations } from '../src/index';
import { collectCloudflareUsage } from '../src/lib/cloudflare-usage';
import type { D1PreparedStatement, Env } from '../src/types';

interface Usage { id: number; service_key: string; metric_key: string; quantity: number; unit: string; estimated_cost_usd: number; budget_limit_usd: number; captured_at: string }

class OperationsStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: OperationsD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.includes('INSERT INTO usage_snapshots')) this.db.usage.unshift({ id: this.db.nextId++, service_key: String(this.values[0]), metric_key: String(this.values[1]), quantity: Number(this.values[2]), unit: String(this.values[3]), estimated_cost_usd: Number(this.values[4]), budget_limit_usd: Number(this.values[5]), captured_at: String(this.values[6]) });
    if (this.sql.includes('INSERT INTO service_health_checks')) this.db.persistedHealth += 1;
    return { meta: { last_row_id: this.db.nextId++ } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-08-31T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: 'disabled', updated_at: '2026-09-01T12:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM usage_snapshots')) return { results: this.db.usage.slice(0, Number(this.values.at(-1) || 20)) as T[] };
    if (this.sql.includes('FROM service_health_checks')) return { results: this.db.health as T[] };
    if (this.sql.includes('FROM application_logs')) return { results: [] as T[] };
    return { results: [] as T[] };
  }
}

class OperationsD1 {
  nextId = 10;
  persistedHealth = 0;
  usage: Usage[] = [];
  health = [
    { id: 3, service_key: 'public-demo', status: 'operational', response_ms: 4, detail_json: '{"intentionalOffline":false}', checked_at: '2026-08-31T03:00:00.000Z' },
    { id: 2, service_key: 'public-demo', status: 'down', response_ms: 4, detail_json: '{"intentionalOffline":true}', checked_at: '2026-08-31T02:00:00.000Z' },
    { id: 1, service_key: 'public-demo', status: 'degraded', response_ms: 4, detail_json: '{"intentionalOffline":false}', checked_at: '2026-08-31T01:00:00.000Z' },
  ];
  prepare(sql: string) { return new OperationsStatement(this, sql); }
}

function env(): Env {
  return {
    DEMO_DB: new OperationsD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

function cloudflareEnv(account = 'account-tag', worker = 'worker-name'): Env {
  return {
    ...env(),
    CLOUDFLARE_ACCOUNT_ID: account,
    CLOUDFLARE_API_TOKEN: 'read-only-token',
    CLOUDFLARE_WORKER_NAME: worker,
    CLOUDFLARE_D1_DATABASE_ID: 'database-id',
    CLOUDFLARE_R2_BUCKET: 'bucket-name',
    CLOUDFLARE_DO_NAMESPACE: 'namespace-id',
  };
}

function providerAccount(query: string, zero = false): Record<string, unknown> {
  if (query.includes('DashboardWorkers')) return zero
    ? { totals: [], daily: [] }
    : { totals: [{ sum: { requests: 100, errors: 2, subrequests: 8 }, quantiles: { cpuTimeP50: 1500, cpuTimeP99: 5500 } }], daily: [{ sum: { requests: 100 }, dimensions: { date: '2026-09-02' } }] };
  if (query.includes('DashboardD1')) return zero
    ? { analytics: [], storage: [] }
    : { analytics: [{ sum: { rowsRead: 200, rowsWritten: 12 } }], storage: [{ max: { databaseSizeBytes: 4096 } }] };
  if (query.includes('DashboardR2')) return zero
    ? { operations: [], storage: [] }
    : { operations: [{ sum: { requests: 3 }, dimensions: { actionType: 'PutObject' } }, { sum: { requests: 7 }, dimensions: { actionType: 'GetObject' } }], storage: [{ max: { objectCount: 4, payloadSize: 1024, metadataSize: 128 } }] };
  return zero
    ? { invocations: [], periodic: [], storage: [] }
    : { invocations: [{ sum: { requests: 9 } }], periodic: [{ sum: { cpuTime: 20000 } }], storage: [{ max: { storedBytes: 512 } }] };
}

function analyticsFetch(options: { zero?: boolean; missingAccount?: boolean; malformedWorkers?: boolean; billing?: 'forbidden' | 'available' } = {}) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (String(input).includes('/billable/usage?')) {
      if (options.billing === 'available') {
        return Response.json({ result: [{
          BilledCost: 0.25,
          BillingCurrency: 'USD',
          BillingPeriodStart: '2026-09-01',
          BillingPeriodEnd: '2026-09-30',
          ChargePeriodStart: '2026-09-02T00:00:00.000Z',
          x_ProductFamilyName: 'Workers',
        }] });
      }
      return new Response('{}', { status: 403 });
    }
    const query = String(JSON.parse(String(init?.body)).query);
    if (options.missingAccount) return Response.json({ data: { viewer: { accounts: [] } }, errors: null });
    if (options.malformedWorkers && query.includes('DashboardWorkers')) {
      return Response.json({ data: { viewer: { accounts: [{ totals: {}, daily: [] }] } }, errors: null });
    }
    return Response.json({ data: { viewer: { accounts: [providerAccount(query, options.zero)] } }, errors: null });
  };
}

describe('operations proof surface', () => {
  it('renders dashboard, health, docs, uptime classification, and billing from live state', async () => {
    const environment = env();
    const dashboard = await (await renderDashboard(environment)).text();
    expect(dashboard).toContain('Current operational state');
    expect(dashboard).toContain('id="health"');
    expect(dashboard).toContain('Service health');
    expect(dashboard).toContain('User-requested ChatGPT fetch');
    expect(dashboard).toContain('href="/admin"');
    expect(dashboard).toContain('href="/robots.txt"');
    expect(dashboard).toContain('aria-label="Operations"');
    expect(dashboard).toContain('Compliance &amp; Assurance');
    expect(dashboard).toContain('href="/compliance"');
    expect(dashboard).not.toContain('name="control" value="chatgpt-crawl"');
    expect(dashboard).not.toContain('name="state" value="enabled"');
    const docs = await renderDocs(environment).text();
    expect(docs).toContain('OpenAPI JSON');
    expect(docs).toContain('docs/INTERACTIVE-DEMO-SPEC.md');
    const uptime = await (await renderUptime(environment)).text();
    expect(uptime).toContain('planned/manual offline');
    expect(uptime).toContain('<strong>1 / 1</strong><span>planned / unexpected</span>');
    const billing = await (await renderBilling(environment)).text();
    expect(billing).toContain('Cloudflare Usage &amp; Cost');
    expect(billing).toContain('Cost guardrail simulator');
  });

  it('moves controlled usage through degraded state and pauses only optional compute', async () => {
    const environment = env();
    const changed = await billingScenarioResponse(new Request('https://demo.example/__api/operations/billing', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: 'degraded' }),
    }), environment);
    expect(await changed.json()).toMatchObject({ synthetic: true, state: 'degraded', optionalWorkerCompute: 'paused' });

    const compute = await workerComputeResponse(new Request('https://demo.example/__api/workers/compute', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'sum', values: [1, 2] }),
    }), environment);
    expect(compute.status).toBe(429);
    expect(await compute.json()).toMatchObject({ error: 'synthetic_budget_degraded' });
  });

  it('runs scheduled health independently and exposes the common reporting contract when Cloudflare is unconfigured', async () => {
    const environment = env();
    await runScheduledOperations(environment, Date.parse('2026-09-02T12:05:00.000Z'));
    expect((environment.DEMO_DB as OperationsD1).persistedHealth).toBe(1);

    const response = await cloudflareUsageResponse(new Request('https://demo.example/__api/operations/cloudflare-usage'), environment);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      schemaVersion: 1,
      dataset: 'cloudflare.operations',
      availability: { 'cloudflare.operations': 'unavailable' },
    });
  });

  it('treats a matched account with empty provider datasets as valid zero activity', async () => {
    const environment = cloudflareEnv('zero-account');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));
    vi.stubGlobal('fetch', analyticsFetch({ zero: true, billing: 'forbidden' }));
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot.status).toBe('live');
      expect(snapshot.products).toMatchObject({
        workers: { available: true, availability: 'available', requests: 0 },
        d1: { available: true, availability: 'available', rowsRead: 0, rowsWritten: 0, storageBytes: 0 },
        r2: { available: true, availability: 'available', classAOperations: 0, classBOperations: 0, storageBytes: 0, objects: 0 },
        durableObjects: { available: true, availability: 'available', requests: 0, cpuTimeMs: 0, storageBytes: 0 },
      });
      expect(snapshot.cost).toMatchObject({ kind: 'unavailable', amountUsd: null, scope: 'account' });
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('does not convert a successful GraphQL response with no matching account into zero live usage', async () => {
    const environment = cloudflareEnv('missing-account');
    vi.stubGlobal('fetch', analyticsFetch({ missingAccount: true, billing: 'forbidden' }));
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot.status).toBe('unavailable');
      expect(Object.values(snapshot.products).every((product) => !product.available)).toBe(true);
      expect(snapshot.products.workers.qualification).toBe('account-scope-not-found');
      const dashboard = await (await renderDashboard(environment)).text();
      expect(dashboard).toContain('>UNAVAILABLE<');
      expect(dashboard).not.toContain('>STALE<');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('marks malformed provider datasets partial instead of inventing zero values', async () => {
    const environment = cloudflareEnv('malformed-account');
    vi.stubGlobal('fetch', analyticsFetch({ malformedWorkers: true, billing: 'forbidden' }));
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot.status).toBe('partial');
      expect(snapshot.products.workers).toMatchObject({ available: false, availability: 'unavailable', qualification: 'malformed-workers-totals' });
      expect(snapshot.products.d1.available).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('marks a reused authoritative telemetry observation stale after its freshness window', async () => {
    const environment = cloudflareEnv('stale-account');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));
    vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
    try {
      const first = await collectCloudflareUsage(environment, false);
      expect(first.status).toBe('live');
      const observedAt = first.capturedAt;
      vi.setSystemTime(new Date('2026-09-02T12:11:00.000Z'));
      vi.stubGlobal('fetch', async () => { throw new Error('network unavailable'); });
      const cached = await collectCloudflareUsage(environment, false);
      expect(cached.status).toBe('stale');
      expect(cached.cache).toBe('derived-cache');
      expect(cached.capturedAt).toBe(observedAt);
      expect(cached.products.workers).toMatchObject({ availability: 'stale', qualification: 'observation-stale' });

      const response = await cloudflareUsageResponse(new Request('https://demo.example/__api/operations/cloudflare-usage'), environment);
      const body = await response.json() as { availability: Record<string, string>; records: Array<{ availability: string }> };
      expect(body.availability['cloudflare.operations']).toBe('stale');
      expect(body.records.length).toBeGreaterThan(0);
      expect(body.records.every((record) => record.availability === 'stale')).toBe(true);

      const dashboard = await (await renderDashboard(environment)).text();
      expect(dashboard).toContain('>STALE<');
      expect(dashboard).not.toContain('>UNAVAILABLE<');
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('does not return another resource scope snapshot after the configured source changes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));
    vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
    try {
      const original = await collectCloudflareUsage(cloudflareEnv('scope-account', 'worker-a'), false);
      expect(original.status).toBe('live');
      vi.stubGlobal('fetch', async () => { throw new Error('network unavailable'); });
      const changed = await collectCloudflareUsage(cloudflareEnv('scope-account', 'worker-b'), false);
      expect(changed.status).toBe('unavailable');
      expect(changed.cache).toBe('provider');
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('preserves the original observation time when current telemetry reuses account-wide billing', async () => {
    const environment = cloudflareEnv('billing-reuse-account');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));
    vi.stubGlobal('fetch', analyticsFetch({ billing: 'available' }));
    try {
      const first = await collectCloudflareUsage(environment, true);
      expect(first.cost).toMatchObject({ kind: 'billed', amountUsd: 0.25, observedAt: '2026-09-02T12:00:00.000Z', scope: 'account' });
      vi.setSystemTime(new Date('2026-09-02T12:05:00.000Z'));
      vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
      const second = await collectCloudflareUsage(environment, true);
      expect(second.capturedAt).toBe('2026-09-02T12:05:00.000Z');
      expect(second.cost).toMatchObject({ kind: 'billed', amountUsd: 0.25, observedAt: '2026-09-02T12:00:00.000Z', qualification: 'reused-derived-billing-observation' });
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('reports unavailable provider cost without any hardcoded pricing fallback', async () => {
    const environment = cloudflareEnv('no-cost-account');
    vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot.status).toBe('live');
      expect(snapshot.cost).toMatchObject({ kind: 'unavailable', availability: 'unavailable', amountUsd: null, scope: 'account' });
      expect(snapshot.cost.note).toContain('no local pricing fallback');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps private account and resource identifiers out of the public machine projection', async () => {
    const environment = cloudflareEnv('private-account-id', 'private-worker-name');
    environment.CLOUDFLARE_D1_DATABASE_ID = 'private-d1-id';
    environment.CLOUDFLARE_R2_BUCKET = 'private-r2-name';
    environment.CLOUDFLARE_DO_NAMESPACE = 'private-do-id';
    vi.stubGlobal('fetch', analyticsFetch({ billing: 'available' }));
    try {
      const response = await cloudflareUsageResponse(new Request('https://demo.example/__api/operations/cloudflare-usage'), environment);
      const body = JSON.stringify(await response.json());
      expect(body).not.toContain('private-account-id');
      expect(body).not.toContain('private-worker-name');
      expect(body).not.toContain('private-d1-id');
      expect(body).not.toContain('private-r2-name');
      expect(body).not.toContain('private-do-id');
      expect(body).toContain('account-billing');
      expect(body).toContain('workersInvocationsAdaptive');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
