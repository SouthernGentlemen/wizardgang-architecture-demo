import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse, assuranceIncidentsResponse, assuranceRisksResponse } from '../src/api/assurance';
import { filterPublishedAssuranceRecords, listPublishedAssuranceRecords } from '../src/assurance/publication';
import { serializeAssuranceFilters } from '../src/assurance/service';
import { renderComplianceDemo } from '../src/demos/compliance-page';
import { renderIncidents, renderRisks } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('assurance presentation consistency', () => {
  it('keeps risk HTML and API selection aligned on canonical ids', async () => {
    const filters = { framework: 'security', residual: 'high' };
    const query = serializeAssuranceFilters('risks', filters);
    const expected = filterPublishedAssuranceRecords('risks', filters).map((record) => record.id);
    const api = await assuranceRisksResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/risks?${query}`)).json() as { records: Array<{ id: string }>; derived: { count: number } };
    const html = await renderRisks(new Request(`https://demo.wizardgang.ai/governance/risks?${query}`), environment).text();
    const rendered = [...html.matchAll(/id="((?:SEC|AI)-RISK-[0-9]+)"/g)].map((match) => match[1]);
    expect(api.records.map((record) => record.id)).toEqual(expected);
    expect(api.derived.count).toBe(expected.length);
    expect(rendered).toEqual(expected);
  });

  it('keeps compliance HTML and API selection aligned on canonical ids', async () => {
    const filters = { framework: 'wcag-2.2', level: 'A' };
    const query = serializeAssuranceFilters('compliance', filters);
    const expected = filterPublishedAssuranceRecords('compliance', filters).map((record) => record.id);
    const api = await assuranceComplianceResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/compliance?${query}`)).json() as { records: Array<{ id: string }>; derived: { count: number } };
    const html = await renderComplianceDemo(new Request(`https://demo.wizardgang.ai/compliance?${query}`), environment).text();
    const rendered = [...html.matchAll(/<tr id="((?:ISO27001|ISO42001|WCAG)-[^"]+)">/g)].map((match) => match[1]);
    expect(api.records.map((record) => record.id)).toEqual(expected);
    expect(api.derived.count).toBe(expected.length);
    expect(rendered).toEqual(expected);
  });

  it('presents incidents and exercises from the same current records collection', async () => {
    const expected = [...listPublishedAssuranceRecords('incidents'), ...listPublishedAssuranceRecords('exercises')];
    const api = await assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents')).json() as { records: Array<{ id: string }>; derived: { count: number } };
    const html = await renderIncidents(environment).text();
    expect(api.records.map((record) => record.id)).toEqual(expected.map((record) => record.id));
    expect(api.derived.count).toBe(expected.length);
    for (const record of expected) expect(html).toContain(`id="${record.id}"`);
  });

  it('keeps HTML presentation code off retired relationship property aliases and serializer references', () => {
    for (const path of ['src/demos/compliance-page.ts', 'src/demos/evidence-page.ts', 'src/demos/assurance-pages.ts', 'src/demos/security-page.ts']) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toContain('.riskLinks');
      expect(source).not.toContain('.controlLinks');
      expect(source).not.toContain('.objectiveLinks');
      expect(source).not.toContain('.incidentLinks');
      expect(source).not.toContain('src/api/assurance-v1.ts');
      expect(source).not.toContain('v1 HTTP serializer');
    }
  });
});