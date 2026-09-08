import { describe, expect, it, vi } from 'vitest';
import { billingScenarioResponse } from '../src/api/billing';
import { reportingCollectionResponse } from '../src/api/reporting';
import { workerComputeResponse } from '../src/api/runtime';
import { renderOperations, reportsContent } from '../src/demos/operations';
import { billingContent, docsContent, uptimeContent } from '../src/demos/operations-pages';
import { runScheduledOperations } from '../src/index';
import { collectCloudflareUsage } from '../src/lib/cloudflare-usage';
import { cursorLink } from '../src/routing/cursor-link';
import { routeUrl } from '../src/routing/application-routes';
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
  it('renders the canonical index and child content from live state', async () => {
    const environment = env();
    const dashboard = await (await renderOperations(new Request('https://demo.wizardgang.ai/operations'), environment)).text();
    expect(dashboard).toContain('Current operational state');
    expect(dashboard).toContain('id="health"');
    expect(dashboard).toContain('Service health');
    expect(dashboard).toContain('User-requested ChatGPT fetch');
    expect(dashboard).toContain('href="/admin"');
    expect(dashboard).toContain('href="/robots.txt"');
    expect(dashboard).toContain('aria-label="Operations sections"');
    expect(dashboard).toContain('How the system operates');
    expect(dashboard).toContain('Inspect evidence');
    expect(dashboard).not.toContain('id="reporting-browser"');
    expect(dashboard).not.toContain('Registered reporting collections');
    const reports = await reportsContent(new Request('https://demo.wizardgang.ai/operations/reports'), environment);
    expect(reports.body).toContain('href="/operations/reports?report=compliance#reporting-browser"');
    expect(reports.body).toContain('Shared reporting presenter');
    expect(dashboard).not.toContain('name="control" value="chatgpt-crawl"');
    expect(dashboard).not.toContain('name="state" value="enabled"');

    const docs = docsContent(environment);
    expect(docs.canonicalPath).toBe(routeUrl('operations.docs'));
    expect(docs.body).toContain('OpenAPI JSON');
    expect(docs.body).toContain('docs/INTERACTIVE-DEMO-SPEC.md');

    const uptime = await uptimeContent(environment);
    expect(uptime.canonicalPath).toBe(routeUrl('operations.availability'));
    expect(uptime.body).toContain('planned/manual offline');
    expect(uptime.body).toContain('<strong>1 / 1</strong><span>planned / unexpected</span>');

    const billing = await billingContent(environment);
    expect(billing.canonicalPath).toBe(routeUrl('operations.usage'));
    expect(billing.body).toContain('Cloudflare Usage &amp; Cost');
    expect(billing.body).toContain('Cost guardrail simulator');
  });

  it('keeps the guided tour usable without observations or provider telemetry', async () => {
    const environment = env();
    (environment.DEMO_DB as OperationsD1).health = [];
    const response = await renderOperations(new Request('https://demo.wizardgang.ai/operations'), environment);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const html = await response.text();
    const body = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(body).toContain('AWAITING DATA');
    expect(body).toContain('UNAVAILABLE');
    expect(body).toContain('Awaiting the first scheduled observation.');
    expect(body).toContain('Current health snapshot');
    const tour = body.slice(body.indexOf('class="operations-tour"'), body.indexOf('id="operations-flow-heading"'));
    for (const routeId of ['operations.availability', 'operations.logs', 'operations.usage', 'operations.reports', 'operations.docs']) {
      expect(tour).toContain(`href="${routeUrl(routeId)}"`);
    }
    const stages = ['Current operational state', 'id="operations-tour-heading"', 'id="operations-flow-heading"', 'id="operations-results-heading"', 'id="operations-evidence-heading"', 'Implementation sources'];
    for (let index = 1; index < stages.length; index += 1) {
      expect(body.indexOf(stages[index])).toBeGreaterThan(body.indexOf(stages[index - 1]));
    }
    expect(body).toContain('<details class="operations-inspection">\n    <summary>Inspect runtime details</summary>');
    expect(body).toContain('<summary>Inspect operational policy</summary>');
    expect(body).not.toContain('id="reporting-browser"');
  });

  it('explains availability before progressively disclosing the full observation window', async () => {
    const environment = env();
    const db = environment.DEMO_DB as OperationsD1;
    db.health = [...db.health, ...Array.from({ length: 22 }, (_, index) => ({ ...db.health[0], id: 100 + index }))];
    const { body } = await uptimeContent(environment);
    expect(body).toContain('measured history, not an SLA');
    expect(body).toContain('<strong>1 / 1</strong><span>planned / unexpected</span>');
    expect(body).toContain('Event counts classify observations');
    expect(body.indexOf('availability-demonstrates-heading')).toBeLessThan(body.indexOf('class="availability-timeline"'));
    expect(body.indexOf('class="availability-timeline"')).toBeLessThan(body.indexOf('class="availability-kpis"'));
    const inspection = body.slice(body.indexOf('<details class="operations-inspection">'), body.indexOf('<details class="reference-details">'));
    expect(inspection).toContain('<summary>Inspect observations</summary>');
    expect(inspection).toContain('<th>D1 latency</th>');
    expect(inspection).toContain('planned/manual offline');
    expect(inspection).toContain('unexpected dependency failure');
    expect(inspection).toContain('Show full history');
    expect((inspection.match(/<time /g) || []).length).toBe(25);
    expect(body.slice(0, body.indexOf('<details class="operations-inspection">'))).not.toContain('<table>');
  });

  it('shows the latest stored maintenance or failure state and keeps empty history explicit', async () => {
    const environment = env();
    const db = environment.DEMO_DB as OperationsD1;
    db.health = [db.health[1], db.health[2]];
    expect((await uptimeContent(environment)).body).toContain('<strong>PLANNED MAINTENANCE</strong>');
    db.health = [db.health[1]];
    expect((await uptimeContent(environment)).body).toContain('<strong>DEGRADED</strong>');
    db.health = [];
    const { body } = await uptimeContent(environment);
    expect(body).toContain('<strong>AWAITING DATA</strong>');
    expect(body).toContain('Awaiting the first scheduled observation.');
    expect(body).toContain('<strong>0 / 0</strong><span>planned / unexpected</span>');
    expect(body).not.toContain('100.000%');
    expect(body).toContain('Inspect observations');
  });

  it('explains shared reporting before the closed registry browser and opens selections', async () => {
    const environment = env();
    const { body } = await reportsContent(new Request('https://demo.wizardgang.ai/operations/reports'), environment);
    expect(body).toContain('One reporting contract, many evidence families');
    expect(body).toContain('Shared authorization · shared presentation · shared pagination');
    expect(body).toContain('HTML pages · JSON responses · machine consumers');
    expect(body).toContain('id="reporting-explorer">');
    expect(body.indexOf('One reporting contract')).toBeLessThan(body.indexOf('Explore all reporting sources'));
    expect(body.indexOf('Explore all reporting sources')).toBeLessThan(body.indexOf('Registered reporting collections'));
    const selected = await reportsContent(new Request('https://demo.wizardgang.ai/operations/reports?report=compliance&limit=25'), environment);
    expect(selected.body).toContain('id="reporting-explorer" open');
    expect(selected.body).toContain('value="compliance" selected');
    expect(selected.body).toContain('value="25" selected');
    expect(selected.body).toContain('id="reporting-browser"');
    expect(selected.body).toContain('Shared reporting presenter');
  });

  it('preserves all reporting query state while replacing only the cursor', () => {
    const request = new Request('https://demo.wizardgang.ai/operations/reports?report=operations&limit=25&source=github&cursor=old#reporting-browser');
    expect(cursorLink(request, 'next cursor')).toBe(`${routeUrl('operations.reports', {}, {
      report: 'operations', limit: '25', source: 'github', cursor: 'next cursor',
    })}#reporting-browser`);
    expect(cursorLink(request, null)).toBeNull();
  });

  it('leads with the guardrail simulator while retaining unavailable provider telemetry', async () => {
    const { body } = await billingContent(env());
    expect(body.indexOf('Cost-aware degradation')).toBeLessThan(body.indexOf('Cost guardrail simulator'));
    expect(body.indexOf('Cost guardrail simulator')).toBeLessThan(body.indexOf('Live provider telemetry'));
    expect(body.indexOf('Live provider telemetry')).toBeLessThan(body.indexOf('<strong>UNAVAILABLE</strong>'));
    expect(body).toContain('it does not establish an application outage');
    expect(body).toContain('Warning begins at 70%; degradation begins at 90%');
    expect(body).toContain('data-budget="normal" aria-pressed="true"');
    expect(body).toContain('Synthetic scenario history');
  });

  it('retains workload behavior across each simulator state and recovery', async () => {
    const environment = env();
    for (const state of ['normal', 'warning', 'degraded', 'normal']) {
      const response = await billingScenarioResponse(new Request('https://demo.example' + routeUrl('operations.api-budget'), {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: state }),
      }), environment);
      expect(await response.json()).toMatchObject({ state, optionalWorkerCompute: state === 'degraded' ? 'paused' : 'available' });
      const { body } = await billingContent(environment);
      expect(body).toContain(`data-budget="${state}" aria-pressed="true"`);
      expect(body).toContain('Live provider telemetry');
      const compute = await workerComputeResponse(new Request('https://demo.example/api/labs/workers', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'sum', values: [1, 2] }),
      }), environment);
      expect(compute.status).toBe(state === 'degraded' ? 429 : 200);
    }
  });

  it('moves controlled usage through degraded state and pauses only optional compute', async () => {
    const environment = env();
    const changed = await billingScenarioResponse(new Request('https://demo.example/api/operations/billing', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: 'degraded' }),
    }), environment);
    expect(await changed.json()).toMatchObject({ synthetic: true, state: 'degraded', optionalWorkerCompute: 'paused' });

    const compute = await workerComputeResponse(new Request('https://demo.example/api/labs/workers', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'sum', values: [1, 2] }),
    }), environment);
    expect(compute.status).toBe(429);
    expect(await compute.json()).toMatchObject({ error: 'synthetic_budget_degraded' });
  });

  it('runs scheduled health independently and exposes the common reporting contract when Cloudflare is unconfigured', async () => {
    const environment = env();
    await runScheduledOperations(environment, Date.parse('2026-09-02T12:05:00.000Z'));
    expect((environment.DEMO_DB as OperationsD1).persistedHealth).toBe(1);

    const response = await reportingCollectionResponse(new Request('https://demo.example/api/reporting/operations'), environment, 'operations');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=30, s-maxage=30');
    expect(await response.json()).toMatchObject({
      schemaVersion: 1,
      dataset: 'operations',
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
      expect(snapshot.status).toBe('available');
      expect(snapshot.products).toMatchObject({
        workers: { availability: 'available', requests: 0 },
        d1: { availability: 'available', rowsRead: 0, rowsWritten: 0, storageBytes: 0 },
        r2: { availability: 'available', classAOperations: 0, classBOperations: 0, storageBytes: 0, objects: 0 },
        durableObjects: { availability: 'available', requests: 0, cpuTimeMs: 0, storageBytes: 0 },
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
      expect(Object.values(snapshot.products).every((product) => product.availability === 'unavailable')).toBe(true);
      expect(snapshot.products.workers.qualification).toBe('account-scope-not-found');
      const dashboard = await (await renderOperations(new Request('https://demo.wizardgang.ai/operations'), environment)).text();
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
      expect(snapshot.products.workers).toMatchObject({ availability: 'unavailable', qualification: 'malformed-workers-totals' });
      expect(snapshot.products.d1.availability).toBe('available');
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
      expect(first.status).toBe('available');
      const observedAt = first.capturedAt;
      vi.setSystemTime(new Date('2026-09-02T12:11:00.000Z'));
      vi.stubGlobal('fetch', async () => { throw new Error('network unavailable'); });
      const cached = await collectCloudflareUsage(environment, false);
      expect(cached.status).toBe('stale');
      expect(cached.cache).toBe('derived-cache');
      expect(cached.capturedAt).toBe(observedAt);
      expect(cached.products.workers).toMatchObject({ availability: 'stale', qualification: 'observation-stale' });

      const response = await reportingCollectionResponse(new Request('https://demo.example/api/reporting/operations'), environment, 'operations');
      const body = await response.json() as { availability: Record<string, string>; records: Array<{ availability: string }> };
      expect(body.availability['cloudflare.operations']).toBe('stale');
      expect(body.records.length).toBeGreaterThan(0);
      expect(body.records.every((record) => record.availability === 'stale')).toBe(true);

      const dashboard = await (await renderOperations(new Request('https://demo.wizardgang.ai/operations'), environment)).text();
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
      expect(original.status).toBe('available');
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
      expect(snapshot.status).toBe('available');
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
      const response = await reportingCollectionResponse(new Request('https://demo.example/api/reporting/operations'), environment, 'operations');
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
