import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { reportingCollectionResponse } from '../src/api/reporting';
import type { Env } from '../src/types';

const env = { GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main' } as Env;

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
      reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/compliance?limit=3'), env, 'compliance'),
      reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/risks?limit=3'), env, 'risks'),
      reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/incidents?limit=3'), env, 'incidents'),
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
    const response = await reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/risks?framework=security'), env, 'risks');
    const body = await response.json() as { records: Array<{ id: string }>; derived: { count: number; totalAvailable: number } };
    expect(body.derived.count).toBe(body.records.length);
    expect(body.derived.totalAvailable).toBe(body.records.length);
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
