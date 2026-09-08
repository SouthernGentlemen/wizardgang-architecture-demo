import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reportingCollectionResponse } from '../src/api/reporting';
import { filterPublishedAssuranceRecords, listPublishedAssuranceRecords } from '../src/assurance/publication';
import { serializeAssuranceFilters } from '../src/assurance/service';
import { complianceContent } from '../src/demos/compliance-page';
import { incidentsContent, risksContent } from '../src/demos/assurance-pages';
import { renderPage } from '../src/ui/page';
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
    const api = await (await reportingCollectionResponse(new Request(`https://demo.wizardgang.ai/api/reporting/risks?${query}`), environment, 'risks')).json() as { records: Array<{ id: string }>; derived: { count: number } };
    const html = await renderPage(environment, risksContent(new Request(`https://demo.wizardgang.ai/assurance/risks?${query}`), environment)).text();
    const rendered = [...html.matchAll(/id="((?:SEC|AI)-RISK-[0-9]+)"/g)].map((match) => match[1]);
    expect(api.records.map((record) => record.id)).toEqual(expected);
    expect(api.derived.count).toBe(expected.length);
    expect(rendered).toEqual(expected);
  });

  it('keeps compliance HTML and API selection aligned on canonical ids', async () => {
    const filters = { framework: 'wcag-2.2', level: 'A' };
    const query = serializeAssuranceFilters('compliance', filters);
    const expected = filterPublishedAssuranceRecords('compliance', filters).map((record) => record.id);
    const api = await (await reportingCollectionResponse(new Request(`https://demo.wizardgang.ai/api/reporting/compliance?${query}`), environment, 'compliance')).json() as { records: Array<{ id: string }>; derived: { count: number } };
    const html = await renderPage(environment, complianceContent(new Request(`https://demo.wizardgang.ai/assurance/compliance?${query}`), environment)).text();
    const rendered = [...html.matchAll(/<tr id="((?:ISO27001|ISO42001|WCAG)-[^"]+)">/g)].map((match) => match[1]);
    expect(api.records.map((record) => record.id)).toEqual(expected);
    expect(api.derived.count).toBe(expected.length);
    expect(rendered).toEqual(expected);
  });

  it('presents incidents and exercises from their canonical collections through the same presenter', async () => {
    const incidents = listPublishedAssuranceRecords('incidents');
    const exercises = listPublishedAssuranceRecords('exercises');
    const [incidentApi, exerciseApi] = await Promise.all([
      reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/incidents'), environment, 'incidents').then((response) => response.json()) as Promise<{ records: Array<{ id: string }>; derived: { count: number } }>,
      reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/exercises'), environment, 'exercises').then((response) => response.json()) as Promise<{ records: Array<{ id: string }>; derived: { count: number } }>,
    ]);
    const html = await renderPage(environment, incidentsContent(environment)).text();
    expect(incidentApi.records.map((record) => record.id)).toEqual(incidents.map((record) => record.id));
    expect(exerciseApi.records.map((record) => record.id)).toEqual(exercises.map((record) => record.id));
    expect(incidentApi.derived.count).toBe(incidents.length);
    expect(exerciseApi.derived.count).toBe(exercises.length);
    for (const record of [...incidents, ...exercises]) expect(html).toContain(`id="${record.id}"`);
  });

  it('keeps HTML presentation code off removed relationship property aliases and serializer references', () => {
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
