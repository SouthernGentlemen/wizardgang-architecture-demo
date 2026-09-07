import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse, assuranceIncidentsResponse, assuranceRisksResponse } from '../src/api/assurance';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';

describe('assurance integrity current-contract invariants', () => {
  it('passes the repository cross-dataset integrity validator on the checked-in canonical sources', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-assurance-integrity.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  it('publishes only canonical relationships and never flattened aliases', async () => {
    const responses = await Promise.all([
      assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance?limit=3')),
      assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?limit=3')),
      assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents?limit=3')),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(200);
      const body = await response.json() as { records: Array<Record<string, unknown>> };
      for (const record of body.records) {
        expect(record).toHaveProperty('relationships');
        for (const alias of ['evidence', 'controls', 'riskLinks', 'controlLinks', 'objectiveLinks', 'incidentLinks', 'frameworkReferences']) {
          expect(record).not.toHaveProperty(alias);
        }
      }
    }
  });

  it('derives public counts from the selected published records rather than stored totals', async () => {
    const published = listPublishedAssuranceRecords('risks');
    const response = await assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=security'));
    const body = await response.json() as { records: Array<{ id: string }>; derived: { count: number; totalAvailable: number } };
    expect(body.derived.count).toBe(body.records.length);
    expect(body.derived.totalAvailable).toBe(published.length);
  });

  it('keeps canonical source files free of HTTP/presentation-only count and alias state', () => {
    for (const path of [
      'assurance/claims/claims.json',
      'assurance/evidence/evidence.json',
      'assurance/risks/risks.json',
      'assurance/incidents/incidents.json',
      'assurance/incidents/exercises.json',
      'assurance/advisories/advisories.json',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/"(?:count|counts|totalAvailable|riskLinks|controlLinks|objectiveLinks|incidentLinks|frameworkReferences)"\s*:/);
    }
  });
});