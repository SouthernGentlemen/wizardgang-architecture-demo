import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import type { Principal } from '../src/lib/authorization';
import type { Env } from '../src/types';
import { renderReportingPresentation } from '../src/reporting/html';
import { presentReportingQuery } from '../src/reporting/presentation';
import {
  queryReportingCollection,
  reportingCollectionInventory,
} from '../src/reporting/service';
import type { ReportingQueryResult, ReportingRecord, ReportingSource } from '../src/reporting/contracts';

const anonymous: Principal = {
  subject: 'public-visitor',
  authentication: 'anonymous',
  role: 'viewer',
  permissions: ['demo:read'],
};

const viewerWithPrivatePermission: Principal = {
  subject: 'github:viewer',
  authentication: 'oauth2',
  provider: 'github',
  role: 'viewer',
  permissions: ['demo:read', 'reporting:private'],
};

const operator: Principal = {
  subject: 'github:operator',
  authentication: 'oauth2',
  provider: 'github',
  role: 'operator',
  permissions: ['demo:read', 'reporting:private'],
};

function collection(id: string, principal: Principal = anonymous) {
  const result = reportingCollectionInventory(principal).find((candidate) => candidate.id === id);
  expect(result, `missing reporting collection ${id}`).toBeDefined();
  return result!;
}

const source: ReportingSource = {
  id: 'github.presentation-test',
  provider: 'github',
  authority: 'structured-record',
  scope: { resource: 'assurance/test.json' },
  nativeIdentity: ['id'],
  revisionIdentity: ['blob'],
  schema: 'contracts/assurance/reporting.schema.json#/$defs/record',
  visibility: 'public',
  capabilities: ['read', 'query'],
  ingestion: 'disabled',
};

describe('DEMO-178 unified reporting presentation', () => {
  it('discovers owned and compatible reporting families without a dashboard allowlist', () => {
    const ids = reportingCollectionInventory(anonymous).map((entry) => entry.id);
    expect(ids).toEqual(expect.arrayContaining([
      'evidence',
      'reports',
      'issues',
      'risks',
      'security',
      'governance',
      'operations',
      'github.workflow-runs',
      'github.workflow-artifacts',
    ]));

    const dashboard = readFileSync('src/demos/reporting-dashboard.ts', 'utf8');
    expect(dashboard).toContain('reportingCollectionInventory');
    expect(dashboard).not.toContain('__api/git/evidence');
    expect(dashboard).not.toContain('__api/operations/cloudflare-usage');
    expect(dashboard).not.toContain('fetch(');
  });

  it('includes every registered governance record partition and makes its records visible publicly', async () => {
    const governance = collection('governance');
    expect(governance.resourceIds).toEqual(expect.arrayContaining([
      'governance.records',
      'governance.records.access-classes',
      'governance.records.access-reviews',
      'governance.records.security-testing',
      'governance.records.suppliers',
    ]));
    expect(governance.sourcePaths).toContain('assurance/governance/asset-inventory.json');

    const result = await queryReportingCollection({} as Env, anonymous, governance, { limit: 50 });
    expect(result.sources.length).toBe(governance.resourceIds.length);
    expect(result.derived.totalAvailable).toBeGreaterThan(0);
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.availability.governance).toBe('available');
  });

  it('represents public advisories under the registered security reporting domain and keeps revision-bound projection', async () => {
    const security = collection('security');
    expect(security.dataset).toBe('advisories');
    expect(security.sourcePaths).toEqual(['assurance/advisories/advisories.json']);

    const result = await queryReportingCollection({} as Env, anonymous, security, { limit: 50 });
    const published = listPublishedAssuranceRecords('advisories');
    expect(result.dataset).toBe('security');
    expect(result.derived.totalAvailable).toBe(published.length);
    expect(result.records.map((record) => record.id)).toEqual(published.map((record) => record.id));
  });

  it('exposes protected GitHub source inventory only to an authenticated operator with reporting:private', () => {
    const privateSource = 'github.code-scanning-alerts';
    expect(reportingCollectionInventory(anonymous).some((entry) => entry.id === privateSource)).toBe(false);
    expect(reportingCollectionInventory(viewerWithPrivatePermission).some((entry) => entry.id === privateSource)).toBe(false);
    expect(reportingCollectionInventory(operator).some((entry) => entry.id === privateSource)).toBe(true);
  });

  it('keeps unavailable source state distinct from an available empty collection', () => {
    const empty: ReportingQueryResult<ReportingRecord> = {
      schemaVersion: 1,
      contract: 'contracts/assurance/reporting.schema.json',
      dataset: 'presentation-test',
      datasets: ['presentation-test'],
      availability: { 'presentation-test': 'available', [source.id]: 'available' },
      sources: [source],
      qualifications: { 'presentation-test': null },
      query: { filters: {} },
      records: [],
      derived: { count: 0, totalAvailable: 0, facets: {} },
    };
    const unavailable: ReportingQueryResult<ReportingRecord> = {
      ...empty,
      availability: { 'presentation-test': 'unavailable', [source.id]: 'unavailable' },
      qualifications: { 'presentation-test': 'provider_unavailable' },
    };
    expect(presentReportingQuery(empty).availability).toBe('empty');
    expect(presentReportingQuery(unavailable).availability).toBe('unavailable');
  });

  it('renders fields, status, availability, relationships, sources, facets, and pagination from the shared presenter', () => {
    const result: ReportingQueryResult<ReportingRecord> = {
      schemaVersion: 1,
      contract: 'contracts/assurance/reporting.schema.json',
      dataset: 'presentation-test',
      datasets: ['presentation-test'],
      availability: { 'presentation-test': 'partial', [source.id]: 'available' },
      sources: [source],
      qualifications: { 'presentation-test': null },
      query: {
        filters: { status: 'open' },
        pagination: {
          limit: 1,
          returned: 1,
          total: 2,
          nextCursor: 'next',
          completeness: 'partial',
          partialReason: 'page-boundary',
        },
      },
      records: [{
        id: 'REC-1',
        source: source.id,
        title: 'Shared presentation record',
        status: 'open',
        availability: 'available',
        fields: { owner: 'delivery', severity: 'high' },
        relationships: { evidence: ['EVD-1'] },
      } as unknown as ReportingRecord],
      derived: {
        count: 1,
        totalAvailable: 2,
        facets: { status: { open: 2 } },
      },
    };
    const presented = presentReportingQuery(result);
    expect(presented).toMatchObject({
      availability: 'partial',
      count: 1,
      totalAvailable: 2,
      facets: { status: { open: 2 } },
      pagination: { returned: 1, total: 2, nextCursor: 'next' },
    });
    expect(presented.records[0]).toMatchObject({
      title: 'Shared presentation record',
      status: 'open',
      availability: 'available',
      relationshipCount: 1,
    });
    expect(presented.records[0].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'owner', value: 'delivery' }),
      expect.objectContaining({ name: 'severity', value: 'high' }),
    ]));

    const html = renderReportingPresentation(presented, { nextHref: '/dashboard?cursor=next' });
    expect(html).toContain('Shared presentation record');
    expect(html).toContain('Status open');
    expect(html).toContain('Availability Available');
    expect(html).toContain('Evidence');
    expect(html).toContain('EVD-1');
    expect(html).toContain('Facets');
    expect(html).toContain('Next page');

    const governancePage = readFileSync('src/demos/governance.ts', 'utf8');
    expect(governancePage).toContain('queryReportingCollection');
    expect(governancePage).toContain('presentReportingQuery');
    expect(governancePage).toContain('renderReportingPresentation');
  });
});