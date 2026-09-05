import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registry from '../assurance/registry.json';
import {
  assuranceReportingCollections,
  listAssuranceRecords,
} from '../src/assurance/service';
import {
  cloudflareUsageObservations,
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
    windowStart: '2026-09-04T00:00:00.000Z',
    windowEnd: '2026-09-04T01:00:00.000Z',
    products: {
      workers: { available: true, requests: 12, errors: 0, subrequests: 1, cpuP50Ms: 1, cpuP99Ms: 2 },
      d1: { available: true, rowsRead: 3, rowsWritten: 1, storageBytes: 4 },
      r2: { available: true, classAOperations: 1, classBOperations: 2, storageBytes: 5, objects: 1 },
      durableObjects: { available: true, requests: 2, cpuTimeMs: 3, storageBytes: 4 },
    },
    cost: {
      kind: costKind,
      amountUsd: costKind === 'unavailable' ? null : 0.25,
      currency: costKind === 'unavailable' ? null : 'USD',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-04',
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
      window,
      observedAt: window.end,
      availability: 'available',
      value: 12,
    });
    expect(observation.identity.observation).toBe(first);
    expect(observation.source).toBe('cloudflare.operations');
  });

  it('keeps published-rate cost estimates derived while accepting Cloudflare-returned billed cost as native observation', () => {
    const environment = {
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_WORKER_NAME: 'worker',
      CLOUDFLARE_D1_DATABASE_ID: 'database',
      CLOUDFLARE_R2_BUCKET: 'bucket',
      CLOUDFLARE_DO_NAMESPACE: 'namespace',
    } as Env;
    const estimated = cloudflareUsageObservations(environment, cloudflareSnapshot('estimated'));
    expect(estimated.some((observation) => observation.metric === 'cost-usd')).toBe(false);
    const billed = cloudflareUsageObservations(environment, cloudflareSnapshot('billed'));
    expect(billed.find((observation) => observation.metric === 'cost-usd')?.value).toBe(0.25);
  });

  it('has one current interchange type surface and no legacy source/records-only import helper', () => {
    expect(reportingContracts).not.toHaveProperty('importAuthoritativeReportingCollection');
    expect(reportingContracts).not.toHaveProperty('exportAuthoritativeReportingCollection');
    const schema = JSON.parse(readFileSync('contracts/assurance/reporting.schema.json', 'utf8')) as { $defs: Record<string, unknown> };
    expect(schema.$defs).toHaveProperty('interchangeEnvelope');
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

  it('does not use the retired D1 Cloudflare provider-state mirror in active runtime code', () => {
    const usageSource = readFileSync('src/lib/cloudflare-usage.ts', 'utf8');
    const workerSource = readFileSync('src/index.ts', 'utf8');
    expect(usageSource).not.toContain('cloudflare_usage_snapshots');
    expect(workerSource).not.toContain('collectCloudflareUsage');
  });
});
