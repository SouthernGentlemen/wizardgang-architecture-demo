import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceRisksResponse } from '../src/api/assurance';
import { listAssuranceRecords } from '../src/assurance/service';

describe('normalized assurance model', () => {
  it('uses one normalized identity-edge relationship array across canonical record families', () => {
    for (const dataset of ['claims', 'risks', 'incidents', 'exercises', 'advisories', 'compliance'] as const) {
      for (const record of listAssuranceRecords(dataset)) {
        expect(record.relationships).toBeDefined();
        expect(Array.isArray(record.relationships)).toBe(true);
        for (const relationship of record.relationships) {
          expect(relationship.relation.length).toBeGreaterThan(0);
          expect(relationship.from).toMatchObject({ native: record.id });
          expect(relationship.from.source).toMatch(/^github\.structured-records\./);
          expect(relationship.to.source).toMatch(/^github\.structured-records\./);
          expect(relationship.to.native.length).toBeGreaterThan(0);
        }
        for (const alias of ['evidence', 'controls', 'riskLinks', 'controlLinks', 'objectiveLinks', 'incidentLinks', 'frameworkReferences']) {
          expect(record).not.toHaveProperty(alias);
        }
      }
    }
  });

  it('derives risk ratings at runtime while canonical JSON stores only scores', () => {
    const raw = JSON.parse(readFileSync('assurance/risks/risks.json', 'utf8')) as {
      records: Array<{ id: string; inherent: { score: number; rating?: string }; residual: { score: number; rating?: string } }>;
    };
    const runtime = listAssuranceRecords('risks');
    expect(runtime).toHaveLength(raw.records.length);
    for (const source of raw.records) {
      expect(source.inherent).not.toHaveProperty('rating');
      expect(source.residual).not.toHaveProperty('rating');
      const presented = runtime.find((record) => record.id === source.id);
      expect(presented?.inherent.rating).toMatch(/^(low|moderate|high|critical)$/);
      expect(presented?.residual.rating).toMatch(/^(low|moderate|high|critical)$/);
    }
  });

  it('returns normalized runtime records directly at the HTTP boundary', async () => {
    const response = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?limit=2'));
    const body = await response.json() as { records: Array<Record<string, unknown> & { relationships: Array<{ relation: string; from: { source: string; native: string }; to: { source: string; native: string } }> }> };
    expect(body.records).toHaveLength(2);
    for (const record of body.records) {
      expect(record.relationships).toBeDefined();
      expect(record).not.toHaveProperty('riskLinks');
      expect(record).not.toHaveProperty('controls');
      expect(record).not.toHaveProperty('evidence');
    }
  });

  it('has removed the legacy assurance serializer entirely', () => {
    expect(existsSync('src/api/assurance-v1.ts')).toBe(false);
    expect(readFileSync('src/api/assurance.ts', 'utf8')).not.toContain('serializeAssuranceV1');
  });
});
