import { describe, expect, it } from 'vitest';
import {
  assuranceCollectionState,
  assuranceDatasetCount,
  assuranceDatasetSchema,
  assuranceDatasetSource,
  assuranceFilterDefinitions,
  assuranceReportingCollections,
  deriveAssuranceCounts,
  findAssuranceRecord,
  listAssuranceRecords,
} from '../src/assurance/service';
import {
  assurancePublicationForRecord,
  listPublishedAssuranceRecords,
} from '../src/assurance/publication';
import { assuranceRuntimeRecordCollections } from '../src/assurance/model';
import { genericAssuranceResponse } from '../src/api/assurance';

describe('registry-driven assurance services', () => {
  it('gives objectives every declared generic record capability without api-index', async () => {
    const objectives = listAssuranceRecords('objectives');
    expect(objectives).toHaveLength(12);
    expect(objectives.map((record) => record.id)).toContain('SEC-OBJ-001');
    expect(findAssuranceRecord('objectives', 'SEC-OBJ-001')?.id).toBe('SEC-OBJ-001');
    expect(assuranceDatasetCount('objectives')).toBe(12);
    expect(assuranceDatasetSource('objectives')).toBe('assurance/objectives/objectives.json');
    expect(assuranceDatasetSchema('objectives')).toBe('contracts/assurance/objective.schema.json');
    expect(assuranceFilterDefinitions('objectives')).toEqual({});
    expect(deriveAssuranceCounts('objectives', objectives)).toEqual({ total: 12, byFilter: {} });
    expect(assuranceReportingCollections('objectives')).toHaveLength(1);
    expect(assuranceReportingCollections('objectives')[0].derived.count).toBe(12);
    expect(assurancePublicationForRecord('objectives', 'SEC-OBJ-001')).toMatchObject({
      lifecycle: 'Approved',
      disclosureReview: 'Reviewed',
    });
    expect(listPublishedAssuranceRecords('objectives')).toHaveLength(12);

    const collection = genericAssuranceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/objectives?limit=2'),
      'objectives',
    );
    expect(collection.status).toBe(200);
    expect(await collection.json()).toMatchObject({
      dataset: 'objectives',
      availability: 'available',
      totalAvailable: 12,
      counts: { total: 12, byFilter: {} },
      pagination: { returned: 2, total: 12 },
    });

    const detail = genericAssuranceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/objectives/SEC-OBJ-001'),
      'objectives',
      'SEC-OBJ-001',
    );
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({
      dataset: 'objectives',
      record: {
        id: 'SEC-OBJ-001',
        publication: { lifecycle: 'Approved', disclosureReview: 'Reviewed' },
      },
    });
  });

  it('keeps empty registered families discoverable and distinguishes unknown families', () => {
    expect(Object.hasOwn(assuranceRuntimeRecordCollections, 'advisories')).toBe(true);
    expect(assuranceCollectionState('advisories')).toEqual({
      dataset: 'advisories',
      status: 'empty',
      resourceIds: ['advisories'],
      records: [],
    });
    expect(assuranceDatasetCount('advisories')).toBe(0);
    expect(assuranceReportingCollections('advisories')).toHaveLength(1);
    expect(assuranceReportingCollections('advisories')[0].records).toEqual([]);

    expect(assuranceCollectionState('not-registered')).toEqual({
      dataset: 'not-registered',
      status: 'unknown',
      resourceIds: [],
      records: [],
    });
    expect(() => listAssuranceRecords('not-registered')).toThrow(/Unknown assurance record family/);
  });
});
