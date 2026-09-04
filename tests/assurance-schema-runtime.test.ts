import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceRisksResponse } from '../src/api/assurance';
import {
  assuranceFilterValues,
  filterAssuranceRecords,
} from '../src/assurance/service';
import { renderRisks } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

function riskIdsFromHtml(html: string): string[] {
  return [...html.matchAll(/<article class="info-card" id="((?:SEC|AI)-RISK-[^"]+)">/g)].map((match) => match[1]);
}

describe('assurance schema-derived runtime metadata', () => {
  it('uses the external risk status vocabulary for filters, counts, API, and HTML behavior', async () => {
    const vocabulary = JSON.parse(readFileSync('contracts/assurance/risk-vocabulary.schema.json', 'utf8')) as {
      $defs: { status: { enum: string[] } };
    };
    const statuses = vocabulary.$defs.status.enum;
    expect(assuranceFilterValues('risks', 'status')).toEqual(statuses);

    for (const status of statuses) {
      const expected = filterAssuranceRecords('risks', { status }).map((record) => record.id);
      const apiResponse = assuranceRisksResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/risks?status=${status}`));
      const apiBody = await apiResponse.json() as { counts: { byStatus: Record<string, number> }; records: Array<{ id: string }> };
      const html = await renderRisks(
        new Request(`https://demo.wizardgang.ai/governance/risks?status=${status}`),
        environment,
      ).text();

      expect(apiBody.records.map((record) => record.id)).toEqual(expected);
      expect(apiBody.counts.byStatus[status]).toBe(expected.length);
      expect(riskIdsFromHtml(html)).toEqual(expected);
      expect(html).toContain(`name="status"`);
      expect(html).toContain(`value="${status}"`);
    }
  });

  it('keeps schema-reference interpretation out of the Worker service', () => {
    const source = readFileSync('src/assurance/service.ts', 'utf8');
    expect(source).not.toContain('resolveLocalSchemaRef');
    expect(source).not.toContain('runtimeAssuranceSchema');
    expect(source).not.toContain("startsWith('#/')");
  });
});
