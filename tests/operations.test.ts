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
    expect(dashboard).not.toContain('name="control" value="chatgpt-crawl"');
    expect(dashboard).not.toContain('name="state" value="enabled"');
    const docs = await renderDocs(environment).text();
    expect(docs).toContain('Swagger JSON');
    expect(docs).toContain('docs/INTERACTIVE-DEMO-SPEC.md');
    const uptime = await (await renderUptime(environment)).text();
    expect(uptime).toContain('planned/manual offline');
    expect(uptime).toContain('<strong>1 / 1</strong><span>planned / unexpected</span>');
    const billing = await (await renderBilling(environment)).text();
    expect(billing).toContain('Cloudflare Usage &amp; Cost');
    expect(billing).toContain('Cost guardrail simulator');
    expect(billing).toContain('Scheduled collection has not stored a Cloudflare snapshot yet.');
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

  it('runs scheduled health independently and exposes an honest telemetry fallback', async () => {
    const environment = env();
    await runScheduledOperations(environment, Date.parse('2026-09-02T12:05:00.000Z'));
    expect((environment.DEMO_DB as OperationsD1).persistedHealth).toBe(1);

    const response = await cloudflareUsageResponse(new Request('https://demo.example/__api/operations/cloudflare-usage'), environment);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'unconfigured',
      capturedAt: null,
      cost: { kind: 'unavailable' },
    });
  });

  it('normalizes Cloudflare product analytics without downgrading live usage when optional billing is restricted', async () => {
    const environment = {
      ...env(),
      CLOUDFLARE_ACCOUNT_ID: 'account-tag',
      CLOUDFLARE_API_TOKEN: 'read-only-token',
      CLOUDFLARE_WORKER_NAME: 'worker-name',
      CLOUDFLARE_D1_DATABASE_ID: 'database-id',
      CLOUDFLARE_R2_BUCKET: 'bucket-name',
      CLOUDFLARE_DO_NAMESPACE: 'namespace-id',
    };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/billable/usage?from=2026-09-01&to=2026-09-02')) return new Response('{}', { status: 403 });
      const query = String(JSON.parse(String(init?.body)).query);
      const account = query.includes('DashboardWorkers')
        ? { totals: [{ sum: { requests: 100, errors: 2, subrequests: 8 }, quantiles: { cpuTimeP50: 1500, cpuTimeP99: 5500 } }], daily: [{ sum: { requests: 100 }, dimensions: { date: '2026-09-02' } }] }
        : query.includes('DashboardD1')
          ? { analytics: [{ sum: { rowsRead: 200, rowsWritten: 12 } }], storage: [{ max: { databaseSizeBytes: 4096 } }] }
          : query.includes('DashboardR2')
            ? { operations: [{ sum: { requests: 3 }, dimensions: { actionType: 'PutObject' } }, { sum: { requests: 7 }, dimensions: { actionType: 'GetObject' } }], storage: [{ max: { objectCount: 4, payloadSize: 1024, metadataSize: 128 } }] }
            : { invocations: [{ sum: { requests: 9 } }], periodic: [{ sum: { cpuTime: 20000 } }], storage: [{ max: { storedBytes: 512 } }] };
      return Response.json({ data: { viewer: { accounts: [account] } }, errors: null });
    });
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot).toMatchObject({
        status: 'live',
        failures: ['Billable usage'],
        products: {
          workers: { available: true, requests: 100, errors: 2, subrequests: 8, cpuP50Ms: 1.5, cpuP99Ms: 5.5 },
          d1: { available: true, rowsRead: 200, rowsWritten: 12, storageBytes: 4096 },
          r2: { available: true, classAOperations: 3, classBOperations: 7, storageBytes: 1152, objects: 4 },
          durableObjects: { available: true, requests: 9, cpuTimeMs: 20, storageBytes: 512 },
        },
        cost: { kind: 'estimated', amountUsd: 0 },
      });
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
});
