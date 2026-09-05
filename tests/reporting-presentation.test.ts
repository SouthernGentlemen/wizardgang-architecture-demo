import { describe, expect, it } from 'vitest';
import type { ReportingQueryResult, ReportingRecord, ReportingSource } from '../src/reporting/contracts';
import { presentReportingQuery, reportingPresentationLabel } from '../src/reporting/presentation';

const source: ReportingSource = {
  id: 'github.example-reports',
  provider: 'github',
  authority: 'structured-record',
  scope: { resource: 'reports/' },
  nativeIdentity: ['id'],
  revisionIdentity: ['blob'],
  schema: 'contracts/assurance/report.schema.json',
  visibility: 'public',
  capabilities: ['read', 'query', 'export'],
  ingestion: 'disabled',
};

function result(overrides: Partial<ReportingQueryResult<ReportingRecord>> = {}): ReportingQueryResult<ReportingRecord> {
  return {
    schemaVersion: 1,
    contract: 'contracts/assurance/reporting.schema.json',
    dataset: 'example-reports',
    datasets: ['example-reports'],
    availability: { 'example-reports': 'available' },
    sources: [source],
    qualifications: { 'example-reports': null },
    query: { filters: {} },
    records: [],
    derived: { count: 0, totalAvailable: 0, facets: {} },
    ...overrides,
  };
}

describe('shared reporting presentation', () => {
  it('distinguishes a registered empty collection from an unavailable source', () => {
    expect(presentReportingQuery(result()).availability).toBe('empty');
    expect(presentReportingQuery(result({
      availability: { 'example-reports': 'unavailable' },
      qualifications: { 'example-reports': 'provider-observation-unavailable' },
    })).availability).toBe('unavailable');
  });

  it('recognizes unconfigured source qualification without inventing zero records', () => {
    const presented = presentReportingQuery(result({
      availability: { 'example-reports': 'unavailable' },
      qualifications: { 'example-reports': 'Reporting is unconfigured for this environment.' },
    }));
    expect(presented.availability).toBe('unconfigured');
    expect(presented.count).toBe(0);
  });

  it('keeps source availability separate from record status and relationships', () => {
    const presented = presentReportingQuery(result({
      availability: { 'example-reports': 'partial' },
      records: [{
        id: 'REPORT-1',
        title: 'CI report',
        status: 'failed',
        availability: 'available',
        relationships: [{ relation: 'produced-by' }],
        url: 'https://github.com/example/repo/actions/runs/1',
      } as unknown as ReportingRecord],
      derived: { count: 1, totalAvailable: 1, facets: { status: { failed: 1 } } },
    }));
    expect(presented.availability).toBe('partial');
    expect(presented.records[0]).toMatchObject({
      title: 'CI report',
      status: 'failed',
      availability: 'available',
      relationshipCount: 1,
      sourceLink: 'https://github.com/example/repo/actions/runs/1',
    });
  });

  it('derives readable labels generically rather than from dataset switches', () => {
    expect(reportingPresentationLabel('github.workflow-runs')).toBe('Workflow Runs');
    expect(reportingPresentationLabel('cloudflare.operations')).toBe('Operations');
    expect(reportingPresentationLabel('new-compatible-report-family')).toBe('New Compatible Report Family');
  });
});
