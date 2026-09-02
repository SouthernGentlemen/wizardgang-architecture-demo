import type { Env } from '../types';
import { recordApplicationLog } from './logs';

export type CloudflareTelemetryStatus = 'live' | 'partial' | 'unavailable' | 'unconfigured';

export interface UsageTrendPoint {
  date: string;
  requests: number;
  costUsd: number | null;
}

export interface CloudflareUsageSnapshot {
  status: CloudflareTelemetryStatus;
  capturedAt: string | null;
  windowStart: string;
  windowEnd: string;
  products: {
    workers: { available: boolean; requests: number; errors: number; subrequests: number; cpuP50Ms: number | null; cpuP99Ms: number | null };
    d1: { available: boolean; rowsRead: number; rowsWritten: number; storageBytes: number };
    r2: { available: boolean; classAOperations: number; classBOperations: number; storageBytes: number; objects: number };
    durableObjects: { available: boolean; requests: number; cpuTimeMs: number; storageBytes: number };
  };
  cost: {
    kind: 'billed' | 'estimated' | 'unavailable';
    amountUsd: number | null;
    currency: string | null;
    periodStart: string;
    periodEnd: string;
    note: string;
    breakdown: Array<{ product: string; amountUsd: number }>;
  };
  trend: UsageTrendPoint[];
  failures: string[];
}

interface StoredSnapshotRow {
  data_json: string;
  captured_at: string;
}

interface GraphqlResponse {
  data?: unknown;
  errors?: Array<{ message?: string }> | null;
}

const GRAPHQL_API = 'https://api.cloudflare.com/client/v4/graphql';
const REST_API = 'https://api.cloudflare.com/client/v4';
const CLASS_A_ACTIONS = new Set([
  'ListBuckets', 'PutBucket', 'ListObjects', 'PutObject', 'CopyObject', 'CompleteMultipartUpload',
  'CreateMultipartUpload', 'LifecycleStorageTierTransition', 'ListMultipartUploads', 'ListParts', 'UploadPart',
  'UploadPartCopy', 'PutBucketEncryption', 'PutBucketCors', 'PutBucketLifecycleConfiguration',
]);
const CLASS_B_ACTIONS = new Set([
  'HeadBucket', 'HeadObject', 'GetObject', 'UsageSummary', 'GetBucketEncryption', 'GetBucketLocation',
  'GetBucketCors', 'GetBucketLifecycleConfiguration',
]);

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function rows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : [];
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function configured(env: Env): boolean {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_WORKER_NAME);
}

function period(now = new Date()): { start: Date; end: Date; startDate: string; endDate: string } {
  const end = new Date(now);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  return {
    start,
    end,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

async function graphql(env: Env, query: string, variables: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(GRAPHQL_API, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json() as GraphqlResponse;
  if (payload.errors?.length) throw new Error('GraphQL dataset unavailable');
  return object(payload.data);
}

function account(data: Record<string, unknown>): Record<string, unknown> {
  const viewer = object(data.viewer);
  return object(rows(viewer.accounts)[0]);
}

const WORKERS_QUERY = `query DashboardWorkers($accountTag: string!, $start: string!, $end: string!, $scriptName: string!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    totals: workersInvocationsAdaptive(limit: 1, filter: { scriptName: $scriptName, datetime_geq: $start, datetime_leq: $end }) {
      sum { requests errors subrequests }
      quantiles { cpuTimeP50 cpuTimeP99 }
    }
    daily: workersInvocationsAdaptive(limit: 31, filter: { scriptName: $scriptName, datetime_geq: $start, datetime_leq: $end }) {
      sum { requests }
      dimensions { date }
    }
  } }
}`;

const D1_QUERY = `query DashboardD1($accountTag: string!, $start: Date!, $end: Date!, $databaseId: string!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    analytics: d1AnalyticsAdaptiveGroups(limit: 10000, filter: { date_geq: $start, date_leq: $end, databaseId: $databaseId }) {
      sum { rowsRead rowsWritten }
      dimensions { date }
    }
    storage: d1StorageAdaptiveGroups(limit: 1, filter: { date_geq: $start, date_leq: $end, databaseId: $databaseId }, orderBy: [date_DESC]) {
      max { databaseSizeBytes }
      dimensions { date }
    }
  } }
}`;

const R2_QUERY = `query DashboardR2($accountTag: string!, $start: Time!, $end: Time!, $bucketName: string!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    operations: r2OperationsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $start, datetime_leq: $end, bucketName: $bucketName }) {
      sum { requests }
      dimensions { actionType }
    }
    storage: r2StorageAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end, bucketName: $bucketName }, orderBy: [datetime_DESC]) {
      max { objectCount payloadSize metadataSize }
      dimensions { datetime }
    }
  } }
}`;

const DURABLE_OBJECTS_QUERY = `query DashboardDurableObjects($accountTag: string!, $start: Date!, $end: Date!, $namespaceId: string!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    invocations: durableObjectsInvocationsAdaptiveGroups(limit: 10000, filter: { date_geq: $start, date_leq: $end, namespaceId: $namespaceId }) { sum { requests } }
    periodic: durableObjectsPeriodicGroups(limit: 10000, filter: { date_geq: $start, date_leq: $end, namespaceId: $namespaceId }) { sum { cpuTime } }
    storage: durableObjectsSqlStorageGroups(limit: 1, filter: { date_geq: $start, date_leq: $end, namespaceId: $namespaceId }, orderBy: [date_DESC]) { max { storedBytes } }
  } }
}`;

function workersMetrics(data: Record<string, unknown>): { product: CloudflareUsageSnapshot['products']['workers']; trend: UsageTrendPoint[] } {
  const scoped = account(data);
  const total = rows(scoped.totals)[0] ?? {};
  const sum = object(total.sum);
  const quantiles = object(total.quantiles);
  const requests = number(sum.requests);
  const cpuP50 = number(quantiles.cpuTimeP50);
  const cpuP99 = number(quantiles.cpuTimeP99);
  return {
    product: {
      available: true,
      requests,
      errors: number(sum.errors),
      subrequests: number(sum.subrequests),
      cpuP50Ms: requests ? cpuP50 / 1000 : null,
      cpuP99Ms: requests ? cpuP99 / 1000 : null,
    },
    trend: rows(scoped.daily).map((row) => ({ date: text(object(row.dimensions).date), requests: number(object(row.sum).requests), costUsd: null }))
      .filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function d1Metrics(data: Record<string, unknown>): CloudflareUsageSnapshot['products']['d1'] {
  const scoped = account(data);
  const analytics = rows(scoped.analytics);
  const storage = rows(scoped.storage);
  return {
    available: true,
    rowsRead: analytics.reduce((total, row) => total + number(object(row.sum).rowsRead), 0),
    rowsWritten: analytics.reduce((total, row) => total + number(object(row.sum).rowsWritten), 0),
    storageBytes: storage.reduce((maximum, row) => Math.max(maximum, number(object(row.max).databaseSizeBytes)), 0),
  };
}

function r2Metrics(data: Record<string, unknown>): CloudflareUsageSnapshot['products']['r2'] {
  const scoped = account(data);
  let classAOperations = 0; let classBOperations = 0;
  for (const row of rows(scoped.operations)) {
    const action = text(object(row.dimensions).actionType);
    const requests = number(object(row.sum).requests);
    if (CLASS_A_ACTIONS.has(action)) classAOperations += requests;
    else if (CLASS_B_ACTIONS.has(action)) classBOperations += requests;
  }
  const latest = rows(scoped.storage)[0] ?? {};
  const max = object(latest.max);
  return {
    available: true,
    classAOperations,
    classBOperations,
    storageBytes: number(max.payloadSize) + number(max.metadataSize),
    objects: number(max.objectCount),
  };
}

function durableObjectMetrics(data: Record<string, unknown>): CloudflareUsageSnapshot['products']['durableObjects'] {
  const scoped = account(data);
  return {
    available: true,
    requests: rows(scoped.invocations).reduce((total, row) => total + number(object(row.sum).requests), 0),
    cpuTimeMs: rows(scoped.periodic).reduce((total, row) => total + number(object(row.sum).cpuTime), 0) / 1000,
    storageBytes: rows(scoped.storage).reduce((maximum, row) => Math.max(maximum, number(object(row.max).storedBytes)), 0),
  };
}

interface BillingRecord {
  BilledCost?: number;
  BillingCurrency?: string;
  BillingPeriodStart?: string;
  BillingPeriodEnd?: string;
  ChargePeriodStart?: string;
  x_ProductFamilyName?: string;
}

async function billableUsage(env: Env, start: string, end: string): Promise<{ amountUsd: number | null; currency: string | null; periodStart: string; periodEnd: string; breakdown: Array<{ product: string; amountUsd: number }>; trend: UsageTrendPoint[] }> {
  const url = new URL(`${REST_API}/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID || '')}/billable/usage`);
  url.searchParams.set('from', start); url.searchParams.set('to', end);
  const response = await fetch(url, { headers: { authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = object(await response.json());
  const records = rows(payload.result) as BillingRecord[];
  const hasCost = records.some((row) => typeof row.BilledCost === 'number');
  const breakdown = new Map<string, number>(); const daily = new Map<string, number>();
  for (const row of records) {
    if (typeof row.BilledCost !== 'number') continue;
    const product = text(row.x_ProductFamilyName) || 'Other';
    breakdown.set(product, (breakdown.get(product) ?? 0) + row.BilledCost);
    const date = text(row.ChargePeriodStart).slice(0, 10);
    if (date) daily.set(date, (daily.get(date) ?? 0) + row.BilledCost);
  }
  return {
    amountUsd: hasCost ? [...breakdown.values()].reduce((total, value) => total + value, 0) : null,
    currency: records.find((row) => row.BillingCurrency)?.BillingCurrency ?? null,
    periodStart: records.find((row) => row.BillingPeriodStart)?.BillingPeriodStart ?? start,
    periodEnd: records.find((row) => row.BillingPeriodEnd)?.BillingPeriodEnd ?? end,
    breakdown: [...breakdown.entries()].map(([product, amountUsd]) => ({ product, amountUsd })).sort((a, b) => b.amountUsd - a.amountUsd),
    trend: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, costUsd]) => ({ date, requests: 0, costUsd })),
  };
}

function estimate(products: CloudflareUsageSnapshot['products']): { total: number; breakdown: Array<{ product: string; amountUsd: number }> } {
  const gb = (bytes: number) => bytes / 1_000_000_000;
  const breakdown = [
    { product: 'Workers', amountUsd: Math.max(0, products.workers.requests - 10_000_000) / 1_000_000 * 0.30 },
    { product: 'D1', amountUsd: Math.max(0, products.d1.rowsRead - 25_000_000_000) / 1_000_000 * 0.001 + Math.max(0, products.d1.rowsWritten - 50_000_000) / 1_000_000 + Math.max(0, gb(products.d1.storageBytes) - 5) * 0.75 },
    { product: 'R2', amountUsd: Math.max(0, products.r2.classAOperations - 1_000_000) / 1_000_000 * 4.50 + Math.max(0, products.r2.classBOperations - 10_000_000) / 1_000_000 * 0.36 + Math.max(0, gb(products.r2.storageBytes) - 10) * 0.015 },
    { product: 'Durable Objects', amountUsd: Math.max(0, products.durableObjects.requests - 1_000_000) / 1_000_000 * 0.15 },
  ];
  return { total: breakdown.reduce((total, row) => total + row.amountUsd, 0), breakdown };
}

function emptySnapshot(env: Env, status: CloudflareTelemetryStatus): CloudflareUsageSnapshot {
  const current = period();
  return {
    status,
    capturedAt: null,
    windowStart: current.start.toISOString(),
    windowEnd: current.end.toISOString(),
    products: {
      workers: { available: false, requests: 0, errors: 0, subrequests: 0, cpuP50Ms: null, cpuP99Ms: null },
      d1: { available: false, rowsRead: 0, rowsWritten: 0, storageBytes: 0 },
      r2: { available: false, classAOperations: 0, classBOperations: 0, storageBytes: 0, objects: 0 },
      durableObjects: { available: false, requests: 0, cpuTimeMs: 0, storageBytes: 0 },
    },
    cost: {
      kind: 'unavailable', amountUsd: null, currency: null,
      periodStart: current.startDate, periodEnd: current.endDate,
      note: configured(env) ? 'Waiting for the next scheduled Cloudflare refresh.' : 'Cloudflare analytics credentials are not configured for this environment.',
      breakdown: [],
    },
    trend: [], failures: [],
  };
}

export async function latestCloudflareUsage(env: Env): Promise<CloudflareUsageSnapshot> {
  try {
    const result = await env.DEMO_DB.prepare(
      `SELECT data_json, captured_at FROM cloudflare_usage_snapshots ORDER BY id DESC LIMIT 1`,
    ).all<StoredSnapshotRow>();
    const row = result.results[0];
    if (!row) return emptySnapshot(env, configured(env) ? 'unavailable' : 'unconfigured');
    const parsed = JSON.parse(row.data_json) as CloudflareUsageSnapshot;
    return { ...parsed, capturedAt: parsed.capturedAt || row.captured_at };
  } catch {
    return emptySnapshot(env, configured(env) ? 'unavailable' : 'unconfigured');
  }
}

export async function recentCloudflareUsage(env: Env, limit = 20): Promise<CloudflareUsageSnapshot[]> {
  try {
    const result = await env.DEMO_DB.prepare(
      `SELECT data_json, captured_at FROM cloudflare_usage_snapshots ORDER BY id DESC LIMIT ?`,
    ).bind(Math.max(1, Math.min(limit, 100))).all<StoredSnapshotRow>();
    return result.results.flatMap((row) => {
      try { const snapshot = JSON.parse(row.data_json) as CloudflareUsageSnapshot; return [{ ...snapshot, capturedAt: snapshot.capturedAt || row.captured_at }]; } catch { return []; }
    });
  } catch { return []; }
}

export async function collectCloudflareUsage(env: Env, includeBilling = true): Promise<CloudflareUsageSnapshot> {
  if (!configured(env)) return emptySnapshot(env, 'unconfigured');
  const current = period();
  const capturedAt = current.end.toISOString();
  const products = emptySnapshot(env, 'unavailable').products;
  let trend: UsageTrendPoint[] = [];
  const failures: string[] = [];

  const tasks = [
    graphql(env, WORKERS_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.start.toISOString(), end: capturedAt, scriptName: env.CLOUDFLARE_WORKER_NAME }),
    env.CLOUDFLARE_D1_DATABASE_ID ? graphql(env, D1_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.startDate, end: current.endDate, databaseId: env.CLOUDFLARE_D1_DATABASE_ID }) : Promise.reject(new Error('not configured')),
    env.CLOUDFLARE_R2_BUCKET ? graphql(env, R2_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.start.toISOString(), end: capturedAt, bucketName: env.CLOUDFLARE_R2_BUCKET }) : Promise.reject(new Error('not configured')),
    env.CLOUDFLARE_DO_NAMESPACE ? graphql(env, DURABLE_OBJECTS_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.startDate, end: current.endDate, namespaceId: env.CLOUDFLARE_DO_NAMESPACE }) : Promise.reject(new Error('not configured')),
  ];
  const [workers, d1, r2, durableObjects] = await Promise.allSettled(tasks);
  if (workers.status === 'fulfilled') { const normalized = workersMetrics(workers.value); products.workers = normalized.product; trend = normalized.trend; } else failures.push('Workers analytics');
  if (d1.status === 'fulfilled') products.d1 = d1Metrics(d1.value); else failures.push('D1 analytics');
  if (r2.status === 'fulfilled') products.r2 = r2Metrics(r2.value); else failures.push('R2 analytics');
  if (durableObjects.status === 'fulfilled') products.durableObjects = durableObjectMetrics(durableObjects.value); else failures.push('Durable Objects analytics');

  const availableCount = Object.values(products).filter((product) => product.available).length;
  const estimated = estimate(products);
  const availableForEstimate: Record<string, boolean> = {
    Workers: products.workers.available,
    D1: products.d1.available,
    R2: products.r2.available,
    'Durable Objects': products.durableObjects.available,
  };
  let cost: CloudflareUsageSnapshot['cost'] = availableCount ? {
    kind: 'estimated', amountUsd: estimated.total, currency: 'USD', periodStart: current.startDate, periodEnd: current.endDate,
    note: `Published-rate estimate for ${availableCount === 4 ? '' : 'available '}Workers Paid, D1, R2 Standard, and Durable Objects metrics; current storage bytes are a GB-month proxy, and fixed plan fees, Workers CPU, and Durable Objects duration are excluded.`,
    breakdown: estimated.breakdown.filter((row) => availableForEstimate[row.product]),
  } : {
    kind: 'unavailable', amountUsd: null, currency: null, periodStart: current.startDate, periodEnd: current.endDate,
    note: 'Cloudflare product analytics did not return a usable dataset, so no usage estimate is available.',
    breakdown: [],
  };
  if (includeBilling) {
    try {
      const billed = await billableUsage(env, current.startDate, current.endDate);
      if (billed.amountUsd !== null) {
        cost = { kind: 'billed', amountUsd: billed.amountUsd, currency: billed.currency ?? 'USD', periodStart: billed.periodStart, periodEnd: billed.periodEnd, note: 'Authoritative usage-based overage from Cloudflare billable usage; fixed-fee subscriptions are excluded.', breakdown: billed.breakdown };
        if (billed.trend.length) trend = billed.trend;
      } else if (cost.kind === 'estimated') {
        cost.note = 'Cloudflare billable usage is accessible, but its restricted alpha cost fields are not populated; this is a published-rate estimate.';
      } else {
        cost.note = 'Cloudflare billable usage is accessible, but its restricted alpha cost fields are not populated and product analytics did not return enough data for an estimate.';
      }
    } catch { failures.push('Billable usage'); }
  } else {
    const previous = await latestCloudflareUsage(env);
    if (previous.cost.kind === 'billed') cost = previous.cost;
  }

  const snapshot: CloudflareUsageSnapshot = {
    status: availableCount === 4 ? 'live' : availableCount ? 'partial' : 'unavailable',
    capturedAt, windowStart: current.start.toISOString(), windowEnd: capturedAt,
    products, cost, trend, failures,
  };
  try {
    await env.DEMO_DB.prepare(
      `INSERT INTO cloudflare_usage_snapshots (status, source, data_json, captured_at) VALUES (?, 'cloudflare', ?, ?)`,
    ).bind(snapshot.status, JSON.stringify(snapshot), capturedAt).run();
    await recordApplicationLog(env, {
      level: snapshot.status === 'unavailable' ? 'warn' : 'info', source: 'cloudflare', eventKey: 'cloudflare_usage_collected',
      message: snapshot.status === 'live' ? 'Cloudflare usage telemetry refreshed.' : `Cloudflare usage telemetry refreshed with ${failures.length} unavailable source${failures.length === 1 ? '' : 's'}.`,
      route: '/__api/operations/cloudflare-usage', detail: { status: snapshot.status, unavailable: failures },
    });
  } catch {
    // External telemetry collection should not fail solely because cache persistence is unavailable.
  }
  return snapshot;
}
