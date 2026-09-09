import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ReportingAvailability, ReportingQueryResult, ReportingRecord } from '../src/reporting/contracts';
import { presentReportingQuery } from '../src/reporting/presentation';
import { registeredReportingSource } from '../src/reporting/registry';

function presentationResult(availability: ReportingAvailability): ReportingQueryResult<ReportingRecord> {
  const source = registeredReportingSource('cloudflare.operations');
  return {
    schemaVersion: 1,
    contract: 'contracts/assurance/reporting.schema.json',
    dataset: source.id,
    datasets: [source.id],
    availability: { [source.id]: availability },
    sources: [source],
    qualifications: { [source.id]: availability === 'stale' ? 'Observation is outside its freshness window.' : null },
    query: { filters: {} },
    records: [{ id: 'observation-1' }],
    derived: { count: 1, totalAvailable: availability === 'available' ? 1 : 0, facets: {} },
  };
}

describe('final common reporting audit guards', () => {
  it('uses one schema-defined availability vocabulary for observations and query results', () => {
    const schema = JSON.parse(readFileSync('contracts/assurance/reporting.schema.json', 'utf8')) as {
      $defs: {
        availability: { enum: string[] };
        observation: { properties: { availability: { $ref: string } } };
        queryResult: { properties: { availability: { additionalProperties: { $ref: string } } } };
      };
    };
    expect(schema.$defs.availability.enum).toEqual(['available', 'partial', 'unavailable', 'rate-limited', 'stale', 'expired']);
    expect(schema.$defs.observation.properties.availability.$ref).toBe('#/$defs/availability');
    expect(schema.$defs.queryResult.properties.availability.additionalProperties.$ref).toBe('#/$defs/availability');
  });

  it('keeps stale, unavailable, and provider-expired reporting states distinct in shared presentation', () => {
    expect(presentReportingQuery(presentationResult('stale')).availability).toBe('stale');
    expect(presentReportingQuery(presentationResult('unavailable')).availability).toBe('unavailable');
    expect(presentReportingQuery(presentationResult('expired')).availability).toBe('expired');
  });

  it('normalizes non-revisioned observation sources without weakening revisioned provider declarations', () => {
    expect(registeredReportingSource('cloudflare.operations').revisionIdentity).toEqual([]);
    expect(registeredReportingSource('github.issues').revisionIdentity).toEqual(['updatedAt']);
    expect(registeredReportingSource('github.branch-protection').revisionIdentity).toEqual(['branchCommitSha']);
  });

  it('contains no legacy Cloudflare estimated-cost reporting discriminator', () => {
    const collector = readFileSync('src/lib/cloudflare-usage.ts', 'utf8');
    const presentation = readFileSync('src/demos/operations-pages.ts', 'utf8');
    expect(collector).not.toContain("'estimated'");
    expect(presentation).not.toContain("usage.cost.kind === 'estimated'");
  });

  it('queries the current Durable Objects storage analytics dataset', () => {
    const collector = readFileSync('src/lib/cloudflare-usage.ts', 'utf8');
    expect(collector).toContain('durableObjectsStorageGroups');
    expect(collector).not.toContain('durableObjectsSqlStorageGroups');
  });

  it('keeps assurance status normalization in the common reporting layer instead of the dashboard', () => {
    const service = readFileSync('src/reporting/service.ts', 'utf8');
    const dashboard = readFileSync('src/demos/reporting-dashboard.ts', 'utf8');
    expect(service).not.toContain('AssuranceCollectionStatus');
    expect(dashboard).toContain('queryReportingCollection');
    expect(dashboard).toContain('presentReportingQuery');
    expect(dashboard).not.toContain('structuredAvailability(');
    expect(dashboard).not.toContain('result.records.map');
  });

  it('renders Cloudflare product and billed-cost state from common availability rather than boolean or kind shortcuts', () => {
    const presentation = readFileSync('src/demos/operations-pages.ts', 'utf8');
    expect(presentation).toContain("productCard('Workers', usage.products.workers.availability");
    expect(presentation).toContain('const costBadgeState = usage.cost.availability');
    expect(presentation).not.toContain("productCard('Workers', usage.products.workers.available");
    expect(presentation).not.toContain("usage.cost.kind === 'billed' ? 'live' : 'unavailable'");
  });

  it('uses provider-native workflow attempts for reports without a branch-backed report copy', () => {
    const registry = JSON.parse(readFileSync('assurance/registry.json', 'utf8')) as {
      reporting: { retainedReports?: unknown; ownership: Array<{ domain: string; source: string }> };
    };
    const schema = JSON.parse(readFileSync('contracts/assurance/reporting.schema.json', 'utf8')) as {
      $defs: Record<string, unknown>;
    };
    expect(registry.reporting).not.toHaveProperty('retainedReports');
    expect(registry.reporting.ownership.find((owner) => owner.domain === 'reports')).toEqual({
      domain: 'reports',
      source: 'github.workflow-attempts',
    });
    expect(schema.$defs).not.toHaveProperty('retainedReportSource');
    expect(existsSync('.github/workflows/report-publisher.yml')).toBe(false);
    expect(existsSync('scripts/generate-retained-report.mjs')).toBe(false);
    expect(existsSync('contracts/assurance/report.schema.json')).toBe(false);
  });
});
