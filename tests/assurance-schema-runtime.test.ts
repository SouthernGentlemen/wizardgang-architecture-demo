import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceRisksResponse } from '../src/api/assurance';
import { assuranceFilterValues, filterAssuranceRecords, listAssuranceRecords } from '../src/assurance/service';

describe('runtime schema-derived assurance behavior', () => {
  it('uses registered schema vocabulary for stored risk filters', () => {
    const schema = JSON.parse(readFileSync('contracts/assurance/risk.schema.json', 'utf8')) as {
      $defs: { risk: { properties: { status: { $ref: string }; framework: { enum: string[] } } } };
    };
    const vocabulary = JSON.parse(readFileSync('contracts/assurance/risk-vocabulary.schema.json', 'utf8')) as {
      $defs: { status: { enum: string[] } };
    };
    expect(schema.$defs.risk.properties.status.$ref).toBe('./risk-vocabulary.schema.json#/$defs/status');
    expect(assuranceFilterValues('risks', 'status')).toEqual(vocabulary.$defs.status.enum);
    expect(assuranceFilterValues('risks', 'framework')).toEqual(schema.$defs.risk.properties.framework.enum);
  });

  it('keeps runtime-derived risk rating vocabulary on the shared derivation', () => {
    expect(assuranceFilterValues('risks', 'residual')).toEqual(['low', 'moderate', 'high', 'critical']);
    for (const rating of assuranceFilterValues('risks', 'residual')) {
      const filtered = filterAssuranceRecords('risks', { residual: rating });
      expect(filtered.every((record) => record.residual.rating === rating)).toBe(true);
    }
  });

  it('reports schema-driven filters as current derived facets instead of family count envelopes', async () => {
    const response = await assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?status=open'));
    const body = await response.json() as {
      records: Array<{ status: string }>;
      derived: { count: number; facets: Record<string, Record<string, number>> };
      counts?: unknown;
    };
    expect(body.records.every((record) => record.status === 'open')).toBe(true);
    expect(body.derived.count).toBe(body.records.length);
    expect(body.derived.facets.status.open).toBe(body.records.length);
    expect(body).not.toHaveProperty('counts');
  });

  it('does not store runtime-derived ratings in canonical risk JSON', () => {
    const raw = JSON.parse(readFileSync('assurance/risks/risks.json', 'utf8')) as { records: Array<{ inherent: Record<string, unknown>; residual: Record<string, unknown> }> };
    expect(raw.records.length).toBe(listAssuranceRecords('risks').length);
    expect(raw.records.every((record) => !Object.hasOwn(record.inherent, 'rating') && !Object.hasOwn(record.residual, 'rating'))).toBe(true);
  });
});