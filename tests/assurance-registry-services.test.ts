import { describe, expect, it } from 'vitest';
import { reportingCollectionResponse } from '../src/api/reporting';
import {
  assuranceDatasetCount,
  assuranceReportingCollections,
  listAssuranceRecords,
} from '../src/assurance/service';
import type { Env } from '../src/types';

const env = { GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main' } as Env;

describe('registry-driven assurance services', () => {
  it('discovers runtime record families directly from runtime record capabilities', () => {
    const objectives = listAssuranceRecords('objectives');
    expect(objectives.length).toBeGreaterThan(0);
    expect(assuranceDatasetCount('objectives')).toBe(objectives.length);
  });

  it('builds source-bound reporting collections for every registered runtime resource', () => {
    for (const dataset of ['evidence', 'claims', 'objectives', 'compliance', 'risks', 'incidents', 'exercises', 'advisories']) {
      const collections = assuranceReportingCollections(dataset);
      expect(collections.length).toBeGreaterThan(0);
      expect(collections.every((collection) => collection.source.authority === 'structured-record')).toBe(true);
      expect(collections.reduce((sum, collection) => sum + collection.derived.count, 0)).toBe(listAssuranceRecords(dataset).length);
    }
  });

  it('serves any registered record family through the generic current query envelope', async () => {
    const response = await reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/objectives?limit=2'), env, 'objectives');
    expect(response.status).toBe(200);
    const body = await response.json() as {
      dataset: string;
      datasets: string[];
      availability: Record<string, string>;
      records: Array<{ id: string }>;
      query: { pagination: { total: number; returned: number } };
      derived: { count: number; totalAvailable: number };
    };
    expect(body.dataset).toBe('objectives');
    expect(body.datasets).toEqual(['objectives']);
    expect(body.availability.objectives).toBe('available');
    expect(body.records).toHaveLength(2);
    expect(body.query.pagination.total).toBe(listAssuranceRecords('objectives').length);
    expect(body.derived.count).toBe(body.records.length);
    expect(body.derived.totalAvailable).toBe(listAssuranceRecords('objectives').length);
  });

  it('keeps unknown families out of collection discovery while treating empty registered data as available', async () => {
    const unknown = await reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/not-a-family'), env, 'not-a-family');
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({ error: 'reporting_collection_not_found', collection: 'not-a-family' });

    const advisories = await reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/security'), env, 'security');
    expect(advisories.status).toBe(200);
    expect(await advisories.json()).toMatchObject({ availability: { security: 'available' } });
  });
});
