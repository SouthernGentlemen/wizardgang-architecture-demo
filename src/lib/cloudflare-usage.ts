import { evaluateAssuranceObservationWindow } from '../assurance/observation-window.js';
import type { Env } from '../types';
import {
  createReportingObservation,
  type ReportingAvailability,
  type ReportingObservation,
  type ReportingObservationProvenance,
  type ReportingQueryResult,
} from '../reporting/contracts';
import { registeredReportingSource, reportingContractPath } from '../reporting/registry';

export type CloudflareTelemetryStatus = 'live' | 'partial' | 'unavailable' | 'unconfigured' | 'rate-limited' | 'expired';
export type CloudflareObservationProjection = 'internal' | 'public';

interface DatasetState {
  available: boolean;
  availability: ReportingAvailability;
  qualification: string | null;
}

export interface UsageTrendPoint {
  date: string;
  requests: number;
  costUsd: number | null;
}

export interface CloudflareUsageSnapshot {
  status: CloudflareTelemetryStatus;
  capturedAt: string | null;
  validUntil: string | null;
  cache: 'provider' | 'derived-cache' | 'none';
  windowStart: string;
  windowEnd: string;
  products: {
    workers: DatasetState & { requests: number; errors: number; subrequests: number; cpuP50Ms: number | null; cpuP99Ms: number | null };
    d1: DatasetState & { rowsRead: number; rowsWritten: number; storageBytes: number };
    r2: DatasetState & { classAOperations: number; classBOperations: number; storageBytes: number; objects: number };
    durableObjects: DatasetState & { requests: number; cpuTimeMs: number; storageBytes: number };
  };
  cost: {
    // `estimated` is retained only as a presentation compatibility discriminator. The authoritative
    // collector never produces it and has no local pricing model.
    kind: 'billed' | 'estimated' | 'unavailable';
    availability: ReportingAvailability;
    qualification: string | null;
    observedAt: string | null;
    validUntil: string | null;
    amountUsd: number | null;
    currency: string | null;
    periodStart: string;
    periodEnd: string;
    scope: 'account';
    note: string;
    breakdown: Array<{ product: string; amountUsd: number }>;
  };
  trend: UsageTrendPoint[];
  failures: string[];
}

interface GraphqlResponse {
  data?: unknown;
  errors?: Array<{ message?: string }> | null;
}

interface BillingRecord {
  BilledCost?: number;
  BillingCurrency?: string;
  BillingPeriodStart?: string;
  BillingPeriodEnd?: string;
  ChargePeriodStart?: string;
  x_ProductFamilyName?: string;
}

class ProviderDatasetError extends Error {
  constructor(
    readonly availability: ReportingAvailability,
    readonly qualification: string,
  ) {
    super(qualification);
  }
}

const GRAPHQL_API = 'https://api.cloudflare.com/client/v4/graphql';
const REST_API = 'https://api.cloudflare.com/client/v4';
const FRESHNESS_MS = 10 * 60 * 1000;
const MAX_DERIVED_CACHE_ENTRIES = 24;
const derivedSnapshotCache = new Map<string, CloudflareUsageSnapshot>();
const derivedBillingCache = new Map<string, CloudflareUsageSnapshot['cost']>();

const CLASS_A_ACTIONS = new Set([
  'ListBuckets', 'PutBucket', 'ListObjects', 'PutObject', 'CopyObject', 'CompleteMultipartUpload',
  'CreateMultipartUpload', 'LifecycleStorageTierTransition', 'ListMultipartUploads', 'ListParts', 'UploadPart',
  'UploadPartCopy', 'PutBucketEncryption', 'PutBucketCors', 'PutBucketLifecycleConfiguration',
]);
const CLASS_B_ACTIONS = new Set([
  'HeadBucket', 'HeadObject', 'GetObject', 'UsageSummary', 'GetBucketEncryption', 'GetBucketLocation',
  'GetBucketCors', 'GetBucketLifecycleConfiguration',
]);

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function requiredObject(value: unknown, qualification: string): Record<string, unknown> {
  const result = object(value);
  if (!result) throw new ProviderDatasetError('unavailable', qualification);
  return result;
}

function requiredRows(value: unknown, qualification: string): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) throw new ProviderDatasetError('unavailable', qualification);
  const result: Array<Record<string, unknown>> = [];
  for (const item of value) {
    const row = object(item);
    if (!row) throw new ProviderDatasetError('unavailable', qualification);
    result.push(row);
  }
  return result;
}

function finite(value: unknown, qualification: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new ProviderDatasetError('unavailable', qualification);
  return value;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function accountConfigured(env: Env): boolean {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
}

function anyResourceConfigured(env: Env): boolean {
  return Boolean(env.CLOUDFLARE_WORKER_NAME || env.CLOUDFLARE_D1_DATABASE_ID || env.CLOUDFLARE_R2_BUCKET || env.CLOUDFLARE_DO_NAMESPACE);
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

function validUntil(observedAt: Date): string {
  return new Date(observedAt.getTime() + FRESHNESS_MS).toISOString();
}

function cacheSet<T>(cache: Map<string, T>, key: string, value: T): void {
  cache.delete(key);
  cache.set(key, value);
  while (cache.size > MAX_DERIVED_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value as string | undefined;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

function snapshotCacheKey(env: Env, startDate: string): string {
  return JSON.stringify([
    env.CLOUDFLARE_ACCOUNT_ID ?? '',
    env.CLOUDFLARE_WORKER_NAME ?? '',
    env.CLOUDFLARE_D1_DATABASE_ID ?? '',
    env.CLOUDFLARE_R2_BUCKET ?? '',
    env.CLOUDFLARE_DO_NAMESPACE ?? '',
    startDate,
  ]);
}

function billingCacheKey(env: Env, startDate: string): string {
  return JSON.stringify([env.CLOUDFLARE_ACCOUNT_ID ?? '', startDate]);
}

function cloneSnapshot(snapshot: CloudflareUsageSnapshot): CloudflareUsageSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as CloudflareUsageSnapshot;
}

function datasetFailure(error: unknown): { availability: ReportingAvailability; qualification: string } {
  if (error instanceof ProviderDatasetError) return error;
  return { availability: 'unavailable', qualification: 'provider-request-failed' };
}

function httpFailure(status: number): ProviderDatasetError {
  if (status === 429) return new ProviderDatasetError('rate-limited', 'provider-rate-limited');
  if (status === 401 || status === 403) return new ProviderDatasetError('unavailable', 'provider-unauthorized');
  return new ProviderDatasetError('unavailable', `provider-http-${status}`);
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
  if (!response.ok) throw httpFailure(response.status);
  let payload: GraphqlResponse;
  try {
    payload = await response.json() as GraphqlResponse;
  } catch {
    throw new ProviderDatasetError('unavailable', 'malformed-provider-response');
  }
  if (payload.errors?.length) throw new ProviderDatasetError('unavailable', 'provider-graphql-errors');
  return requiredObject(payload.data, 'malformed-provider-response');
}

function scopedAccount(data: Record<string, unknown>): Record<string, unknown> {
  const viewer = requiredObject(data.viewer, 'malformed-viewer');
  const accounts = requiredRows(viewer.accounts, 'malformed-account-scope');
  if (accounts.length === 0) throw new ProviderDatasetError('unavailable', 'account-scope-not-found');
  if (accounts.length !== 1) throw new ProviderDatasetError('unavailable', 'ambiguous-account-scope');
  return accounts[0];
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

function availableState(): DatasetState {
  return { available: true, availability: 'available', qualification: null };
}

function unavailableState(qualification: string, availability: ReportingAvailability = 'unavailable'): DatasetState {
  return { available: false, availability, qualification };
}

function workersMetrics(data: Record<string, unknown>): { product: CloudflareUsageSnapshot['products']['workers']; trend: UsageTrendPoint[] } {
  const scoped = scopedAccount(data);
  const totals = requiredRows(scoped.totals, 'malformed-workers-totals');
  const daily = requiredRows(scoped.daily, 'malformed-workers-daily');
  let requests = 0; let errors = 0; let subrequests = 0; let cpuP50Ms: number | null = null; let cpuP99Ms: number | null = null;
  if (totals.length > 0) {
    const sum = requiredObject(totals[0].sum, 'malformed-workers-sum');
    const quantiles = requiredObject(totals[0].quantiles, 'malformed-workers-quantiles');
    requests = finite(sum.requests, 'malformed-workers-requests');
    errors = finite(sum.errors, 'malformed-workers-errors');
    subrequests = finite(sum.subrequests, 'malformed-workers-subrequests');
    cpuP50Ms = requests === 0 ? null : finite(quantiles.cpuTimeP50, 'malformed-workers-cpu-p50') / 1000;
    cpuP99Ms = requests === 0 ? null : finite(quantiles.cpuTimeP99, 'malformed-workers-cpu-p99') / 1000;
  }
  const trend = daily.map((row) => {
    const dimensions = requiredObject(row.dimensions, 'malformed-workers-daily-dimensions');
    const sum = requiredObject(row.sum, 'malformed-workers-daily-sum');
    const date = text(dimensions.date);
    if (!date) throw new ProviderDatasetError('unavailable', 'malformed-workers-daily-date');
    return { date, requests: finite(sum.requests, 'malformed-workers-daily-requests'), costUsd: null };
  }).sort((a, b) => a.date.localeCompare(b.date));
  return { product: { ...availableState(), requests, errors, subrequests, cpuP50Ms, cpuP99Ms }, trend };
}

function d1Metrics(data: Record<string, unknown>): CloudflareUsageSnapshot['products']['d1'] {
  const scoped = scopedAccount(data);
  const analytics = requiredRows(scoped.analytics, 'malformed-d1-analytics');
  const storage = requiredRows(scoped.storage, 'malformed-d1-storage');
  const rowsRead = analytics.reduce((total, row) => total + finite(requiredObject(row.sum, 'malformed-d1-sum').rowsRead, 'malformed-d1-rows-read'), 0);
  const rowsWritten = analytics.reduce((total, row) => total + finite(requiredObject(row.sum, 'malformed-d1-sum').rowsWritten, 'malformed-d1-rows-written'), 0);
  const storageBytes = storage.reduce((maximum, row) => Math.max(maximum, finite(requiredObject(row.max, 'malformed-d1-storage-max').databaseSizeBytes, 'malformed-d1-storage-bytes')), 0);
  return { ...availableState(), rowsRead, rowsWritten, storageBytes };
}

function r2Metrics(data: Record<string, unknown>): CloudflareUsageSnapshot['products']['r2'] {
  const scoped = scopedAccount(data);
  const operations = requiredRows(scoped.operations, 'malformed-r2-operations');
  const storage = requiredRows(scoped.storage, 'malformed-r2-storage');
  let classAOperations = 0; let classBOperations = 0;
  for (const row of operations) {
    const dimensions = requiredObject(row.dimensions, 'malformed-r2-dimensions');
    const sum = requiredObject(row.sum, 'malformed-r2-sum');
    const action = text(dimensions.actionType);
    if (!action) throw new ProviderDatasetError('unavailable', 'malformed-r2-action');
    const requests = finite(sum.requests, 'malformed-r2-requests');
    if (CLASS_A_ACTIONS.has(action)) classAOperations += requests;
    else if (CLASS_B_ACTIONS.has(action)) classBOperations += requests;
  }
  let storageBytes = 0; let objects = 0;
  if (storage.length > 0) {
    const max = requiredObject(storage[0].max, 'malformed-r2-storage-max');
    storageBytes = finite(max.payloadSize, 'malformed-r2-payload-size') + finite(max.metadataSize, 'malformed-r2-metadata-size');
    objects = finite(max.objectCount, 'malformed-r2-object-count');
  }
  return { ...availableState(), classAOperations, classBOperations, storageBytes, objects };
}

function durableObjectMetrics(data: Record<string, unknown>): CloudflareUsageSnapshot['products']['durableObjects'] {
  const scoped = scopedAccount(data);
  const invocations = requiredRows(scoped.invocations, 'malformed-do-invocations');
  const periodic = requiredRows(scoped.periodic, 'malformed-do-periodic');
  const storage = requiredRows(scoped.storage, 'malformed-do-storage');
  const requests = invocations.reduce((total, row) => total + finite(requiredObject(row.sum, 'malformed-do-invocation-sum').requests, 'malformed-do-requests'), 0);
  const cpuTimeMs = periodic.reduce((total, row) => total + finite(requiredObject(row.sum, 'malformed-do-periodic-sum').cpuTime, 'malformed-do-cpu-time'), 0) / 1000;
  const storageBytes = storage.reduce((maximum, row) => Math.max(maximum, finite(requiredObject(row.max, 'malformed-do-storage-max').storedBytes, 'malformed-do-storage-bytes')), 0);
  return { ...availableState(), requests, cpuTimeMs, storageBytes };
}

async function billableUsage(env: Env, start: string, end: string, observedAt: string): Promise<CloudflareUsageSnapshot['cost'] & { trend: UsageTrendPoint[] }> {
  const url = new URL(`${REST_API}/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID || '')}/billable/usage`);
  url.searchParams.set('from', start);
  url.searchParams.set('to', end);
  const response = await fetch(url, { headers: { authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, accept: 'application/json' } });
  if (!response.ok) throw httpFailure(response.status);
  let payload: Record<string, unknown>;
  try {
    payload = requiredObject(await response.json(), 'malformed-billing-response');
  } catch (error) {
    if (error instanceof ProviderDatasetError) throw error;
    throw new ProviderDatasetError('unavailable', 'malformed-billing-response');
  }
  const records = requiredRows(payload.result, 'malformed-billing-result') as BillingRecord[];
  if (records.length === 0) throw new ProviderDatasetError('unavailable', 'billing-dataset-empty');
  const costRecords = records.filter((row) => typeof row.BilledCost === 'number' && Number.isFinite(row.BilledCost));
  if (costRecords.length === 0) throw new ProviderDatasetError('unavailable', 'billing-cost-fields-unavailable');
  const breakdown = new Map<string, number>(); const daily = new Map<string, number>();
  for (const row of costRecords) {
    const cost = row.BilledCost as number;
    const product = text(row.x_ProductFamilyName) || 'Other';
    breakdown.set(product, (breakdown.get(product) ?? 0) + cost);
    const date = text(row.ChargePeriodStart).slice(0, 10);
    if (date) daily.set(date, (daily.get(date) ?? 0) + cost);
  }
  const amountUsd = [...breakdown.values()].reduce((total, value) => total + value, 0);
  const currency = records.find((row) => row.BillingCurrency)?.BillingCurrency ?? 'USD';
  const periodStart = records.find((row) => row.BillingPeriodStart)?.BillingPeriodStart ?? start;
  const periodEnd = records.find((row) => row.BillingPeriodEnd)?.BillingPeriodEnd ?? end;
  return {
    kind: 'billed', availability: 'available', qualification: null, observedAt, validUntil: validUntil(new Date(observedAt)),
    amountUsd, currency, periodStart, periodEnd, scope: 'account',
    note: 'Account-wide Cloudflare billable usage. No resource-level cost attribution is inferred.',
    breakdown: [...breakdown.entries()].map(([product, amount]) => ({ product, amountUsd: amount })).sort((a, b) => b.amountUsd - a.amountUsd),
    trend: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, costUsd]) => ({ date, requests: 0, costUsd })),
  };
}

function emptyProducts(qualification = 'dataset-unavailable'): CloudflareUsageSnapshot['products'] {
  return {
    workers: { ...unavailableState(qualification), requests: 0, errors: 0, subrequests: 0, cpuP50Ms: null, cpuP99Ms: null },
    d1: { ...unavailableState(qualification), rowsRead: 0, rowsWritten: 0, storageBytes: 0 },
    r2: { ...unavailableState(qualification), classAOperations: 0, classBOperations: 0, storageBytes: 0, objects: 0 },
    durableObjects: { ...unavailableState(qualification), requests: 0, cpuTimeMs: 0, storageBytes: 0 },
  };
}

function unavailableCost(current: ReturnType<typeof period>, qualification: string): CloudflareUsageSnapshot['cost'] {
  return {
    kind: 'unavailable', availability: 'unavailable', qualification, observedAt: null, validUntil: null,
    amountUsd: null, currency: null, periodStart: current.startDate, periodEnd: current.endDate, scope: 'account',
    note: 'Provider billing cost is unavailable; no local pricing fallback is used.', breakdown: [],
  };
}

function emptySnapshot(env: Env, status: CloudflareTelemetryStatus, now = new Date()): CloudflareUsageSnapshot {
  const current = period(now);
  const qualification = accountConfigured(env) ? 'provider-observation-unavailable' : 'cloudflare-analytics-unconfigured';
  return {
    status, capturedAt: null, validUntil: null, cache: 'none',
    windowStart: current.start.toISOString(), windowEnd: current.end.toISOString(),
    products: emptyProducts(qualification),
    cost: unavailableCost(current, qualification),
    trend: [], failures: [],
  };
}

function applySnapshotFreshness(snapshot: CloudflareUsageSnapshot, clock = new Date()): CloudflareUsageSnapshot {
  if (!snapshot.capturedAt || !snapshot.validUntil) return snapshot;
  const evaluation = evaluateAssuranceObservationWindow({ observedAt: snapshot.capturedAt, validUntil: snapshot.validUntil }, clock);
  if (evaluation?.state === 'current') return snapshot;
  if (evaluation?.state === 'expired') {
    const copy = cloneSnapshot(snapshot);
    copy.status = 'expired';
    for (const product of Object.values(copy.products)) {
      if (product.available) {
        product.available = false;
        product.availability = 'expired';
        product.qualification = 'observation-expired';
      }
    }
    return copy;
  }
  const copy = cloneSnapshot(snapshot);
  copy.status = 'unavailable';
  copy.failures = [...copy.failures, 'Observation window'];
  return copy;
}

function currentCachedBilling(cost: CloudflareUsageSnapshot['cost'] | undefined, clock: Date): CloudflareUsageSnapshot['cost'] | null {
  if (!cost?.observedAt || !cost.validUntil) return null;
  const evaluation = evaluateAssuranceObservationWindow({ observedAt: cost.observedAt, validUntil: cost.validUntil }, clock);
  if (evaluation?.state !== 'current') return null;
  return JSON.parse(JSON.stringify(cost)) as CloudflareUsageSnapshot['cost'];
}

function markFailure<T extends DatasetState>(target: T, error: unknown): T {
  const failure = datasetFailure(error);
  target.available = false;
  target.availability = failure.availability;
  target.qualification = failure.qualification;
  return target;
}

function overallStatus(products: CloudflareUsageSnapshot['products'], env: Env): CloudflareTelemetryStatus {
  if (!accountConfigured(env) || !anyResourceConfigured(env)) return 'unconfigured';
  const states = Object.values(products);
  const availableCount = states.filter((state) => state.available).length;
  if (availableCount === states.length) return 'live';
  if (availableCount > 0) return 'partial';
  if (states.some((state) => state.availability === 'rate-limited')) return 'rate-limited';
  return 'unavailable';
}

function provenance(transport: 'graphql' | 'rest', dataset: string): ReportingObservationProvenance {
  return { provider: 'cloudflare', transport, endpoint: transport === 'graphql' ? GRAPHQL_API : '/accounts/{account}/billable/usage', dataset };
}

function projectedResource(projection: CloudflareObservationProjection, kind: string, value: string | undefined): string {
  return projection === 'public' ? kind : `${kind}:${value ?? 'unconfigured'}`;
}

export function cloudflareUsageObservations(
  env: Env,
  snapshot: CloudflareUsageSnapshot,
  projection: CloudflareObservationProjection = 'internal',
): ReportingObservation<number | null>[] {
  const source = registeredReportingSource('cloudflare.operations');
  const window = { start: snapshot.windowStart, end: snapshot.windowEnd };
  const observedAt = snapshot.capturedAt ?? snapshot.windowEnd;
  const observationValidUntil = snapshot.validUntil ?? snapshot.windowEnd;
  const defaultDimensions: Record<string, string> = projection === 'public'
    ? { scope: 'resource' }
    : { scope: 'resource', account: env.CLOUDFLARE_ACCOUNT_ID ?? 'unconfigured' };
  const observation = (
    resource: string,
    metric: string,
    unit: string,
    availability: ReportingAvailability,
    value: number | null,
    provider: ReportingObservationProvenance,
    dimensions: Record<string, string> = defaultDimensions,
    observationWindow = window,
    collectedAt = observedAt,
    freshnessUntil = observationValidUntil,
  ) => createReportingObservation({ source, resource, metric, dimensions, unit, window: observationWindow, observedAt: collectedAt, validUntil: freshnessUntil, provenance: provider, availability, value });

  const workers = projectedResource(projection, 'workers', env.CLOUDFLARE_WORKER_NAME);
  const d1 = projectedResource(projection, 'd1', env.CLOUDFLARE_D1_DATABASE_ID);
  const r2 = projectedResource(projection, 'r2', env.CLOUDFLARE_R2_BUCKET);
  const durableObjects = projectedResource(projection, 'durable-objects', env.CLOUDFLARE_DO_NAMESPACE);
  const records: ReportingObservation<number | null>[] = [
    observation(workers, 'requests', 'requests', snapshot.products.workers.availability, snapshot.products.workers.requests, provenance('graphql', 'workersInvocationsAdaptive')),
    observation(workers, 'errors', 'errors', snapshot.products.workers.availability, snapshot.products.workers.errors, provenance('graphql', 'workersInvocationsAdaptive')),
    observation(workers, 'subrequests', 'subrequests', snapshot.products.workers.availability, snapshot.products.workers.subrequests, provenance('graphql', 'workersInvocationsAdaptive')),
    observation(workers, 'cpu-p50', 'milliseconds', snapshot.products.workers.availability, snapshot.products.workers.cpuP50Ms, provenance('graphql', 'workersInvocationsAdaptive')),
    observation(workers, 'cpu-p99', 'milliseconds', snapshot.products.workers.availability, snapshot.products.workers.cpuP99Ms, provenance('graphql', 'workersInvocationsAdaptive')),
    observation(d1, 'rows-read', 'rows', snapshot.products.d1.availability, snapshot.products.d1.rowsRead, provenance('graphql', 'd1AnalyticsAdaptiveGroups')),
    observation(d1, 'rows-written', 'rows', snapshot.products.d1.availability, snapshot.products.d1.rowsWritten, provenance('graphql', 'd1AnalyticsAdaptiveGroups')),
    observation(d1, 'storage', 'bytes', snapshot.products.d1.availability, snapshot.products.d1.storageBytes, provenance('graphql', 'd1StorageAdaptiveGroups')),
    observation(r2, 'class-a-operations', 'operations', snapshot.products.r2.availability, snapshot.products.r2.classAOperations, provenance('graphql', 'r2OperationsAdaptiveGroups')),
    observation(r2, 'class-b-operations', 'operations', snapshot.products.r2.availability, snapshot.products.r2.classBOperations, provenance('graphql', 'r2OperationsAdaptiveGroups')),
    observation(r2, 'storage', 'bytes', snapshot.products.r2.availability, snapshot.products.r2.storageBytes, provenance('graphql', 'r2StorageAdaptiveGroups')),
    observation(r2, 'objects', 'objects', snapshot.products.r2.availability, snapshot.products.r2.objects, provenance('graphql', 'r2StorageAdaptiveGroups')),
    observation(durableObjects, 'requests', 'requests', snapshot.products.durableObjects.availability, snapshot.products.durableObjects.requests, provenance('graphql', 'durableObjectsInvocationsAdaptiveGroups')),
    observation(durableObjects, 'cpu-time', 'milliseconds', snapshot.products.durableObjects.availability, snapshot.products.durableObjects.cpuTimeMs, provenance('graphql', 'durableObjectsPeriodicGroups')),
    observation(durableObjects, 'storage', 'bytes', snapshot.products.durableObjects.availability, snapshot.products.durableObjects.storageBytes, provenance('graphql', 'durableObjectsSqlStorageGroups')),
  ];
  if (snapshot.cost.kind === 'billed' && snapshot.cost.observedAt && snapshot.cost.validUntil) {
    records.push(observation(
      projectedResource(projection, 'account-billing', env.CLOUDFLARE_ACCOUNT_ID),
      'billed-cost', snapshot.cost.currency ?? 'currency-unavailable', snapshot.cost.availability, snapshot.cost.amountUsd,
      provenance('rest', 'billable/usage'), { scope: 'account' },
      { start: new Date(`${snapshot.cost.periodStart}T00:00:00.000Z`).toISOString(), end: new Date(`${snapshot.cost.periodEnd}T23:59:59.999Z`).toISOString() },
      snapshot.cost.observedAt, snapshot.cost.validUntil,
    ));
  }
  return records;
}

function publicAvailability(status: CloudflareTelemetryStatus): ReportingAvailability {
  if (status === 'live') return 'available';
  if (status === 'partial') return 'partial';
  if (status === 'rate-limited') return 'rate-limited';
  if (status === 'expired') return 'expired';
  return 'unavailable';
}

export function cloudflareUsageQueryResult(env: Env, snapshot: CloudflareUsageSnapshot): ReportingQueryResult<ReportingObservation<number | null>> {
  const source = registeredReportingSource('cloudflare.operations');
  const records = cloudflareUsageObservations(env, snapshot, 'public');
  const metricFacets: Record<string, number> = {};
  for (const record of records) metricFacets[record.metric] = (metricFacets[record.metric] ?? 0) + 1;
  const qualification = snapshot.status === 'unconfigured'
    ? 'Cloudflare analytics is not configured for this environment.'
    : snapshot.failures.length ? `One or more provider datasets were unavailable: ${snapshot.failures.join(', ')}.` : null;
  return {
    schemaVersion: 1,
    contract: reportingContractPath,
    dataset: source.id,
    datasets: [source.id],
    availability: { [source.id]: publicAvailability(snapshot.status) },
    sources: [source],
    qualifications: { [source.id]: qualification },
    query: { filters: {}, pagination: { limit: records.length || 1, returned: records.length, total: records.length, nextCursor: null } },
    records,
    derived: { count: records.length, totalAvailable: records.filter((record) => record.availability === 'available').length, facets: { metric: metricFacets } },
  };
}

export async function latestCloudflareUsage(env: Env): Promise<CloudflareUsageSnapshot> {
  return collectCloudflareUsage(env, true);
}

export async function recentCloudflareUsage(env: Env, limit = 20): Promise<CloudflareUsageSnapshot[]> {
  void env;
  void limit;
  // Cloudflare remains authoritative. Transient runtime caches are never projected as report history.
  return [];
}

export async function collectCloudflareUsage(env: Env, includeBilling = true): Promise<CloudflareUsageSnapshot> {
  const now = new Date();
  const current = period(now);
  if (!accountConfigured(env) || !anyResourceConfigured(env)) return emptySnapshot(env, 'unconfigured', now);

  const capturedAt = now.toISOString();
  const products = emptyProducts('resource-unconfigured');
  let trend: UsageTrendPoint[] = [];
  const failures: string[] = [];

  const tasks: Array<Promise<Record<string, unknown>> | null> = [
    env.CLOUDFLARE_WORKER_NAME ? graphql(env, WORKERS_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.start.toISOString(), end: capturedAt, scriptName: env.CLOUDFLARE_WORKER_NAME }) : null,
    env.CLOUDFLARE_D1_DATABASE_ID ? graphql(env, D1_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.startDate, end: current.endDate, databaseId: env.CLOUDFLARE_D1_DATABASE_ID }) : null,
    env.CLOUDFLARE_R2_BUCKET ? graphql(env, R2_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.start.toISOString(), end: capturedAt, bucketName: env.CLOUDFLARE_R2_BUCKET }) : null,
    env.CLOUDFLARE_DO_NAMESPACE ? graphql(env, DURABLE_OBJECTS_QUERY, { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: current.startDate, end: current.endDate, namespaceId: env.CLOUDFLARE_DO_NAMESPACE }) : null,
  ];
  const settled = await Promise.all(tasks.map(async (task) => task ? task.then((value) => ({ ok: true as const, value })).catch((error) => ({ ok: false as const, error })) : Promise.resolve({ ok: false as const, error: new ProviderDatasetError('unavailable', 'resource-unconfigured') })));

  const [workers, d1, r2, durableObjects] = settled;
  if (workers.ok) {
    try { const normalized = workersMetrics(workers.value); products.workers = normalized.product; trend = normalized.trend; }
    catch (error) { markFailure(products.workers, error); failures.push('Workers analytics'); }
  } else { markFailure(products.workers, workers.error); failures.push('Workers analytics'); }
  if (d1.ok) { try { products.d1 = d1Metrics(d1.value); } catch (error) { markFailure(products.d1, error); failures.push('D1 analytics'); } }
  else { markFailure(products.d1, d1.error); failures.push('D1 analytics'); }
  if (r2.ok) { try { products.r2 = r2Metrics(r2.value); } catch (error) { markFailure(products.r2, error); failures.push('R2 analytics'); } }
  else { markFailure(products.r2, r2.error); failures.push('R2 analytics'); }
  if (durableObjects.ok) { try { products.durableObjects = durableObjectMetrics(durableObjects.value); } catch (error) { markFailure(products.durableObjects, error); failures.push('Durable Objects analytics'); } }
  else { markFailure(products.durableObjects, durableObjects.error); failures.push('Durable Objects analytics'); }

  let cost = unavailableCost(current, includeBilling ? 'billing-unavailable' : 'billing-not-requested');
  if (includeBilling) {
    try {
      const billed = await billableUsage(env, current.startDate, current.endDate, capturedAt);
      const { trend: billedTrend, ...billedCost } = billed;
      cost = billedCost;
      cacheSet(derivedBillingCache, billingCacheKey(env, current.startDate), billedCost);
      if (billedTrend.length) trend = billedTrend;
    } catch (error) {
      const failure = datasetFailure(error);
      const cached = currentCachedBilling(derivedBillingCache.get(billingCacheKey(env, current.startDate)), now);
      if (cached) {
        cost = cached;
        cost.qualification = 'reused-derived-billing-observation';
        cost.note = 'Account-wide billing is reused from a still-current derived cache; its original observation time is preserved.';
      } else {
        cost = unavailableCost(current, failure.qualification);
      }
      failures.push('Billable usage');
    }
  }

  const snapshot = applySnapshotFreshness({
    status: overallStatus(products, env), capturedAt, validUntil: validUntil(now), cache: 'provider',
    windowStart: current.start.toISOString(), windowEnd: capturedAt,
    products, cost, trend, failures,
  }, now);

  const key = snapshotCacheKey(env, current.startDate);
  if (snapshot.status === 'live' || snapshot.status === 'partial') {
    cacheSet(derivedSnapshotCache, key, cloneSnapshot(snapshot));
    return snapshot;
  }

  const cached = derivedSnapshotCache.get(key);
  if (cached) {
    const reused = applySnapshotFreshness({ ...cloneSnapshot(cached), cache: 'derived-cache' }, now);
    if (reused.status === 'expired') reused.failures = [...new Set([...reused.failures, ...failures, 'Derived cache expired'])];
    else reused.failures = [...new Set([...reused.failures, ...failures, 'Provider refresh unavailable; using current derived cache'])];
    return reused;
  }
  return snapshot;
}
