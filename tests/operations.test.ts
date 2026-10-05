import { describe, expect, it, vi } from 'vitest';
import { billingScenarioResponse } from '../src/api/billing';
import { reportingCollectionResponse } from '../src/api/reporting';
import { workerComputeResponse } from '../src/api/runtime';
import { runScheduledOperations } from '../src/index';
import { collectCloudflareUsage } from '../src/lib/cloudflare-usage';
import { routeUrl } from '../src/routing/application-routes';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

function env(): Env {
  return { WG_DB: new SqliteD1(), GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo', GITHUB_BRANCH: 'main', BILLING_DEMO_MONTHLY_BUDGET_USD: '10' };
}

function cloudflareEnv(account = 'account-tag', worker = 'worker-name'): Env {
  return { ...env(), CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_BILLING_TOKEN: 'read-only-token', CLOUDFLARE_WORKER_NAME: worker, CLOUDFLARE_D1_DATABASE_ID: 'database-id', CLOUDFLARE_R2_BUCKET: 'bucket-name', CLOUDFLARE_DO_NAMESPACE: 'namespace-id' };
}

function providerAccount(query: string, zero = false): Record<string, unknown> {
  if (query.includes('DashboardWorkers')) return zero ? { totals: [], daily: [] } : { totals: [{ sum: { requests: 100, errors: 2, subrequests: 8 }, quantiles: { cpuTimeP50: 1500, cpuTimeP99: 5500 } }], daily: [{ sum: { requests: 100 }, dimensions: { date: '2026-09-02' } }] };
  if (query.includes('DashboardD1')) return zero ? { analytics: [], storage: [] } : { analytics: [{ sum: { rowsRead: 200, rowsWritten: 12 } }], storage: [{ max: { databaseSizeBytes: 4096 } }] };
  if (query.includes('DashboardR2')) return zero ? { operations: [], storage: [] } : { operations: [{ sum: { requests: 3 }, dimensions: { actionType: 'PutObject' } }, { sum: { requests: 7 }, dimensions: { actionType: 'GetObject' } }], storage: [{ max: { objectCount: 4, payloadSize: 1024, metadataSize: 128 } }] };
  return zero ? { invocations: [], periodic: [], storage: [] } : { invocations: [{ sum: { requests: 9 } }], periodic: [{ sum: { cpuTime: 20000 } }], storage: [{ max: { storedBytes: 512 } }] };
}

function analyticsFetch(options: { zero?: boolean; missingAccount?: boolean; malformedWorkers?: boolean; billing?: 'forbidden' | 'available' } = {}) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (String(input).includes('/billable/usage?')) {
      if (options.billing === 'available') return Response.json({ result: [{ BilledCost: 0.25, BillingCurrency: 'USD', BillingPeriodStart: '2026-09-01', BillingPeriodEnd: '2026-09-30', ChargePeriodStart: '2026-09-02T00:00:00.000Z', x_ProductFamilyName: 'Workers' }] });
      return new Response('{}', { status: 403 });
    }
    const query = String(JSON.parse(String(init?.body)).query);
    if (options.missingAccount) return Response.json({ data: { viewer: { accounts: [] } }, errors: null });
    if (options.malformedWorkers && query.includes('DashboardWorkers')) return Response.json({ data: { viewer: { accounts: [{ totals: {}, daily: [] }] } }, errors: null });
    return Response.json({ data: { viewer: { accounts: [providerAccount(query, options.zero)] } }, errors: null });
  };
}

describe('operations machine behavior', () => {
  it('retains workload behavior across each simulator state and recovery', async () => {
    const environment = env();
    for (const state of ['normal', 'warning', 'degraded', 'normal']) {
      const response = await billingScenarioResponse(new Request('https://demo.example' + routeUrl('operations.api-budget'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: state }) }), environment);
      expect(await response.json()).toMatchObject({ state, optionalWorkerCompute: state === 'degraded' ? 'paused' : 'available' });
      const compute = await workerComputeResponse(new Request('https://demo.example/api/labs/workers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'sum', values: [1, 2] }) }), environment);
      expect(compute.status).toBe(state === 'degraded' ? 429 : 200);
    }
  });

  it('runs scheduled health independently and preserves the operations reporting machine contract', async () => {
    const environment = env();
    await runScheduledOperations(environment, Date.parse('2026-09-02T12:05:00.000Z'));
    expect((environment.WG_DB as SqliteD1).records('health').size).toBe(1);
    const response = await reportingCollectionResponse(new Request('https://demo.example/api/reporting/operations'), environment, 'operations');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=30, s-maxage=30');
    expect(await response.json()).toMatchObject({ schemaVersion: 1, dataset: 'operations', availability: { 'cloudflare.operations': 'unavailable' } });
  });

  it('treats a matched account with empty provider datasets as valid zero activity', async () => {
    const environment = cloudflareEnv('zero-account');
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z')); vi.stubGlobal('fetch', analyticsFetch({ zero: true, billing: 'forbidden' }));
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot.status).toBe('available');
      expect(snapshot.products).toMatchObject({ workers: { availability: 'available', requests: 0 }, d1: { availability: 'available', rowsRead: 0, rowsWritten: 0, storageBytes: 0 }, r2: { availability: 'available', classAOperations: 0, classBOperations: 0, storageBytes: 0, objects: 0 }, durableObjects: { availability: 'available', requests: 0, cpuTimeMs: 0, storageBytes: 0 } });
      expect(snapshot.cost).toMatchObject({ kind: 'unavailable', amountUsd: null, scope: 'account' });
    } finally { vi.unstubAllGlobals(); vi.useRealTimers(); }
  });

  it('does not convert a successful GraphQL response with no matching account into zero live usage', async () => {
    const environment = cloudflareEnv('missing-account');
    vi.stubGlobal('fetch', analyticsFetch({ missingAccount: true, billing: 'forbidden' }));
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot.status).toBe('unavailable');
      expect(Object.values(snapshot.products).every((product) => product.availability === 'unavailable')).toBe(true);
      expect(snapshot.products.workers.qualification).toBe('account-scope-not-found');
    } finally { vi.unstubAllGlobals(); }
  });

  it('marks malformed provider datasets partial instead of inventing zero values', async () => {
    const environment = cloudflareEnv('malformed-account');
    vi.stubGlobal('fetch', analyticsFetch({ malformedWorkers: true, billing: 'forbidden' }));
    try {
      const snapshot = await collectCloudflareUsage(environment, true);
      expect(snapshot.status).toBe('partial');
      expect(snapshot.products.workers).toMatchObject({ availability: 'unavailable', qualification: 'malformed-workers-totals' });
      expect(snapshot.products.d1.availability).toBe('available');
    } finally { vi.unstubAllGlobals(); }
  });

  it('marks a reused authoritative telemetry observation stale after its freshness window', async () => {
    const environment = cloudflareEnv('stale-account');
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z')); vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
    try {
      const first = await collectCloudflareUsage(environment, false); const observedAt = first.capturedAt;
      vi.setSystemTime(new Date('2026-09-02T12:11:00.000Z')); vi.stubGlobal('fetch', async () => { throw new Error('network unavailable'); });
      const cached = await collectCloudflareUsage(environment, false);
      expect(cached).toMatchObject({ status: 'stale', cache: 'derived-cache', capturedAt: observedAt });
      expect(cached.products.workers).toMatchObject({ availability: 'stale', qualification: 'observation-stale' });
      const response = await reportingCollectionResponse(new Request('https://demo.example/api/reporting/operations'), environment, 'operations');
      const body = await response.json() as { availability: Record<string, string>; records: Array<{ availability: string }> };
      expect(body.availability['cloudflare.operations']).toBe('stale'); expect(body.records.every((record) => record.availability === 'stale')).toBe(true);
    } finally { vi.unstubAllGlobals(); vi.useRealTimers(); }
  });

  it('does not return another resource scope snapshot after the configured source changes', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z')); vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
    try {
      expect((await collectCloudflareUsage(cloudflareEnv('scope-account', 'worker-a'), false)).status).toBe('available');
      vi.stubGlobal('fetch', async () => { throw new Error('network unavailable'); });
      expect(await collectCloudflareUsage(cloudflareEnv('scope-account', 'worker-b'), false)).toMatchObject({ status: 'unavailable', cache: 'provider' });
    } finally { vi.unstubAllGlobals(); vi.useRealTimers(); }
  });

  it('preserves the original observation time when current telemetry reuses account-wide billing', async () => {
    const environment = cloudflareEnv('billing-reuse-account');
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z')); vi.stubGlobal('fetch', analyticsFetch({ billing: 'available' }));
    try {
      const first = await collectCloudflareUsage(environment, true);
      expect(first.cost).toMatchObject({ kind: 'billed', amountUsd: 0.25, observedAt: '2026-09-02T12:00:00.000Z', scope: 'account' });
      vi.setSystemTime(new Date('2026-09-02T12:05:00.000Z')); vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
      const second = await collectCloudflareUsage(environment, true);
      expect(second.capturedAt).toBe('2026-09-02T12:05:00.000Z');
      expect(second.cost).toMatchObject({ kind: 'billed', amountUsd: 0.25, observedAt: '2026-09-02T12:00:00.000Z', qualification: 'reused-derived-billing-observation' });
    } finally { vi.unstubAllGlobals(); vi.useRealTimers(); }
  });

  it('reports unavailable provider cost without any hardcoded pricing fallback', async () => {
    const environment = cloudflareEnv('no-cost-account'); vi.stubGlobal('fetch', analyticsFetch({ billing: 'forbidden' }));
    try { const snapshot = await collectCloudflareUsage(environment, true); expect(snapshot.cost).toMatchObject({ kind: 'unavailable', availability: 'unavailable', amountUsd: null, scope: 'account' }); expect(snapshot.cost.note).toContain('no local pricing fallback'); }
    finally { vi.unstubAllGlobals(); }
  });

  it('keeps private account and resource identifiers out of the public machine projection', async () => {
    const environment = cloudflareEnv('private-account-id', 'private-worker-name');
    environment.CLOUDFLARE_D1_DATABASE_ID = 'private-d1-id'; environment.CLOUDFLARE_R2_BUCKET = 'private-r2-name'; environment.CLOUDFLARE_DO_NAMESPACE = 'private-do-id';
    vi.stubGlobal('fetch', analyticsFetch({ billing: 'available' }));
    try {
      const response = await reportingCollectionResponse(new Request('https://demo.example/api/reporting/operations'), environment, 'operations');
      const body = JSON.stringify(await response.json());
      for (const privateValue of ['private-account-id', 'private-worker-name', 'private-d1-id', 'private-r2-name', 'private-do-id']) expect(body).not.toContain(privateValue);
      expect(body).toContain('account-billing'); expect(body).toContain('workersInvocationsAdaptive');
    } finally { vi.unstubAllGlobals(); }
  });
});
