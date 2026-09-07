import { describe, expect, it } from 'vitest';
import { genericAssuranceResponse } from '../src/api/assurance';
import {
  assuranceCollectionState,
  assuranceDatasetCount,
  assuranceReportingCollections,
  listAssuranceRecords,
} from '../src/assurance/service';

describe('registry-driven assurance services', () => {
  it('discovers runtime record families from registry capabilities rather than api-index inventories', () => {
    const objectives = assuranceCollectionState('objectives');
    expect(objectives.status).toBe('available');
    expect(objectives.resourceIds).toContain('objectives');
    expect(objectives.records).toEqual(listAssuranceRecords('objectives'));
    expect(assuranceDatasetCount('objectives')).toBe(objectives.records.length);
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
    const response = await genericAssuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/objectives?limit=2'), 'objectives');
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
    expect(body.derived.count).toBe(listAssuranceRecords('objectives').length);
    expect(body.derived.totalAvailable).toBe(listAssuranceRecords('objectives').length);
  });

  it('distinguishes unknown families from registered empty collections', async () => {
    expect(assuranceCollectionState('not-a-family').status).toBe('unknown');
    const unknown = await genericAssuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/not-a-family'), 'not-a-family');
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({ error: 'assurance_dataset_not_found', dataset: 'not-a-family' });

    const advisories = assuranceCollectionState('advisories');
    expect(['empty', 'available']).toContain(advisories.status);
  });
});