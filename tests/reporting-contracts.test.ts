import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registry from '../assurance/registry.json';
import {
  assuranceReportingCollections,
  listAssuranceRecords,
} from '../src/assurance/service';
import {
  cloudflareUsageObservations,
  cloudflareUsageQueryResult,
  type CloudflareUsageSnapshot,
} from '../src/lib/cloudflare-usage';
import * as reportingContracts from '../src/reporting/contracts';
import {
  createReportingObservation,
  reportingObservationIdentity,
} from '../src/reporting/contracts';
import {
  registeredReportingSource,
  registeredReportingSources,
  reportingSourceForOwnership,
  structuredReportingSource,
} from '../src/reporting/registry';
import { assuranceRegistryResources } from '../src/assurance/model';
import type { Env } from '../src/types';

function binding(source: ReturnType<typeof structuredReportingSource>): string {
  return [source.provider, source.scope.repository ?? '', source.scope.resource].join('|');
}

function cloudflareSnapshot(costKind: CloudflareUsageSnapshot['cost']['kind']): CloudflareUsageSnapshot {
  return {
    status: 'live',
    capturedAt: '2026-09-04T01:00:00.000Z',
    validUntil: '2026-09-04T01:10:00.000Z',
    cache: 'provider',
    windowStart: '2026-09-04T00:00:00.000Z',
    windowEnd: '2026-09-04T01:00:00.000Z',
    products: {
      workers: { available: true, availability: 'available', qualification: null, requests: 12, errors: 0, subrequests: 1, cpuP50Ms: 1, cpuP99Ms: 2 },
      d1: { available: true, availability: 'available', qualification: null, rowsRead: 3, rowsWritten: 1, storageBytes: 4 },
      r2: { available: true, availability: 'available', qualification: null, classAOperations: 1, classBOperations: 2, storageBytes: 5, objects: 1 },
      durableObjects: { available: true, availability: 'available', qualification: null, requests: 2, cpuTimeMs: 3, storageBytes: 4 },
    },
    cost: {
      kind: costKind,
      availability: costKind === 'billed' ? 'available' : 'unavailable',
      qualification: costKind === 'billed' ? null : 'test-unavailable',
      observedAt: costKind === 'billed' ? '2026-09-04T00:45:00.000Z' : null,
      validUntil: costKind === 'billed' ? '2026-09-04T00:55:00.000Z' : null,
      amountUsd: costKind === 'billed' ? 0.25 : null,
      currency: costKind === 'billed' ? 'USD' : null,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-04',
      scope: 'account',
      note: 'test',
      breakdown: [],
    },
    trend: [],
    failures: [],
  };
}

describe('authoritative reporting contracts', () => {
  it('derives one unique GitHub authority binding for every registered structured resource', () => {
    const sources = assuranceRegistryResources.map((resource) => structuredReportingSource(resource));
    expect(new Set(sources.map(binding)).size).toBe(sources.length);
    expect(sources.every((source) => source.schema.startsWith('contracts/assurance/'))).toBe(true);
    expect(sources.every((source) => source.nativeIdentity.join('|') === 'repository|resource')).toBe(true);
    expect(sources.every((source) => source.revisionIdentity?.join('|') === 'commit|blob')).toBe(true);
  });

  it('routes assurance consumers through source-bound collection results without copying canonical facts', () => {
    for (const dataset of ['evidence', 'claims', 'objectives', 'compliance', 'risks', 'incidents', 'exercises', 'advisories']) {
      const collections = assuranceReportingCollections(dataset);
      expect(collections.length).toBeGreaterThan(0);
      expect(collections.reduce((total, collection) => total + collection.derived.count, 0)).toBe(listAssuranceRecords(dataset).length);
      expect(collections.every((collection) => collection.source.authority === 'structured-record')).toBe(true);
    }
  });

  it('registers native GitHub source kinds once and limits import to supported provider writes', () => {
    const github = registeredReportingSources().filter((source) => source.provider === 'github' && source.authority === 'native-object');
    expect(new Set(github.map((source) => source.id)).size).toBe(github.length);
    expect(github.map((source) => source.id)).toEqual(expect.arrayContaining([
      'github.repositories',
      'github.issues',
      'github.workflow-runs',
      'github.workflow-attempts',
      'github.workflow-artifacts',
      'github.releases',
      'github.code-scanning-alerts',
      'github.secret-scanning-alerts',
      'github.dependabot-alerts',
      'github.repository-security-advisories',
    ]));
    expect(registeredReportingSource('github.issues').capabilities).toContain('import');
    expect(github.filter((source) => source.id !== 'github.issues').every((source) => !source.capabilities.includes('import'))).toBe(true);
  });

  it('resolves report ownership to durable retained reports and governance to canonical structured partitions', () => {
    const retained = registeredReportingSource('github.retained-reports');
    expect(retained).toMatchObject({
      authority: 'structured-record',
      scope: { branch: 'assurance-reports', resource: 'reports/' },
      capabilities: ['read', 'query', 'export'],
      ingestion: 'disabled',
    });
    expect(registry.reporting.ownership.find((owner) => owner.domain === 'reports')).toEqual({
      domain: 'reports',
      source: 'github.retained-reports',
    });
    expect(registry.reporting.ownership.find((owner) => owner.domain === 'governance')).toEqual({
      domain: 'governance',
      source: 'github.structured-records',
      resource: 'governance.records',
    });
    expect(reportingSourceForOwnership('reports').id).toBe('github.retained-reports');
    const governance = assuranceRegistryResources.find((resource) => resource.id === 'governance.records');
    expect(governance).toBeDefined();
    expect(reportingSourceForOwnership('governance', governance).id).toBe('github.structured-records.governance.records');
  });

  it('uses resource, metric, normalized dimensions, and observation window as aggregate observation identity', () => {
    const window = { start: '2026-09-04T00:00:00.000Z', end: '2026-09-04T01:00:00.000Z' };
    const first = reportingObservationIdentity('worker:demo', 'requests', { colo: 'IAD', status: 200 }, window);
    const reordered = reportingObservationIdentity('worker:demo', 'requests', { status: 200, colo: 'IAD' }, window);
    const later = reportingObservationIdentity('worker:demo', 'requests', { colo: 'IAD', status: 200 }, { ...window, end: '2026-09-04T02:00:00.000Z' });
    expect(first).toBe(reordered);
    expect(first).not.toBe(later);

    const source = registeredReportingSource('cloudflare.operations');
    const observation = createReportingObservation({
      source,
      resource: 'worker:demo',
      metric: 'requests',
      dimensions: { colo: 'IAD', status: 200 },
      unit: 'requests',
      window,
      observedAt: window.end,
      validUntil: '2026-09-04T01:10:00.000Z',
      provenance: { provider: 'cloudflare', transport: 'graphql', endpoint: 'https://api.cloudflare.com/client/v4/graphql', dataset: 'workersInvocationsAdaptive' },
      availability: 'available',
      value: 12,
    });
    expect(observation.id).toBe(first);
    expect(observation.identity.observation).toBe(first);
    expect(observation.source).toBe('cloudflare.operations');
    expect(observation.unit).toBe('requests');
    expect(observation.provenance.dataset).toBe('workersInvocationsAdaptive');
  });

  it('keeps exact Cloudflare account/resource scope internally and billing account-scoped', () => {
    const environment = {
      CLOUDFLARE_ACCOUNT_ID: 'private-account',
      CLOUDFLARE_WORKER_NAME: 'private-worker',
      CLOUDFLARE_D1_DATABASE_ID: 'private-database',
      CLOUDFLARE_R2_BUCKET: 'private-bucket',
      CLOUDFLARE_DO_NAMESPACE: 'private-namespace',
    } as Env;
    const unavailable = cloudflareUsageObservations(environment, cloudflareSnapshot('unavailable'));
    expect(unavailable.some((observation) => observation.metric === 'billed-cost')).toBe(false);
    const billed = cloudflareUsageObservations(environment, cloudflareSnapshot('billed'));
    const worker = billed.find((observation) => observation.resource === 'workers:private-worker' && observation.metric === 'requests');
    expect(worker?.dimensions).toEqual({ scope: 'resource', account: 'private-account' });
    const cost = billed.find((observation) => observation.metric === 'billed-cost');
    expect(cost?.value).toBe(0.25);
    expect(cost?.dimensions).toEqual({ scope: 'account' });
    expect(cost?.resource).toBe('account-billing:private-account');
  });

  it('projects Cloudflare observations through the same query result primitive without exposing source identifiers publicly', () => {
    const environment = {
      CLOUDFLARE_ACCOUNT_ID: 'private-account',
      CLOUDFLARE_WORKER_NAME: 'private-worker',
      CLOUDFLARE_D1_DATABASE_ID: 'private-database',
      CLOUDFLARE_R2_BUCKET: 'private-bucket',
      CLOUDFLARE_DO_NAMESPACE: 'private-namespace',
    } as Env;
    const result = cloudflareUsageQueryResult(environment, cloudflareSnapshot('billed'));
    expect(result).toMatchObject({ schemaVersion: 1, dataset: 'cloudflare.operations', availability: { 'cloudflare.operations': 'available' } });
    expect(result.records.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('private-account');
    expect(serialized).not.toContain('private-worker');
    expect(serialized).not.toContain('private-database');
    expect(serialized).not.toContain('private-bucket');
    expect(serialized).not.toContain('private-namespace');
    expect(result.records.every((record) => record.provenance.provider === 'cloudflare')).toBe(true);
  });

  it('has one current interchange type surface and no legacy source/records-only import helper', () => {
    expect(reportingContracts).not.toHaveProperty('importAuthoritativeReportingCollection');
    expect(reportingContracts).not.toHaveProperty('exportAuthoritativeReportingCollection');
    const schema = JSON.parse(readFileSync('contracts/assurance/reporting.schema.json', 'utf8')) as { $defs: Record<string, unknown> };
    expect(schema.$defs).toHaveProperty('interchangeEnvelope');
    expect(schema.$defs).toHaveProperty('observationProvenance');
    expect(schema.$defs).not.toHaveProperty('importCollection');
  });

  it('keeps protected GitHub sources payload-free and private ingestion disabled', () => {
    expect(registry.reporting.privateIngestion).toBe('disabled');
    expect(registry.reporting.privateSources.length).toBeGreaterThan(0);
    expect(registry.reporting.privateSources.every((source) => source.visibility === 'private' && source.ingestion === 'disabled')).toBe(true);
    expect(registry.reporting.privateSources.every((source) => !source.capabilities.includes('import'))).toBe(true);
    const serialized = JSON.stringify(registry.reporting);
    expect(serialized).not.toMatch(/"(?:token|secret|credential|payload)"\s*:/i);
  });

  it('does not use the retired D1 Cloudflare provider-state mirror or a hardcoded cost estimator', () => {
    const usageSource = readFileSync('src/lib/cloudflare-usage.ts', 'utf8');
    const workerSource = readFileSync('src/index.ts', 'utf8');
    expect(usageSource).not.toContain('cloudflare_usage_snapshots');
    expect(usageSource).not.toContain('function estimate(');
    expect(usageSource).not.toContain('10_000_000');
    expect(usageSource).not.toContain('25_000_000_000');
    expect(workerSource).not.toContain('collectCloudflareUsage');
  });
});
