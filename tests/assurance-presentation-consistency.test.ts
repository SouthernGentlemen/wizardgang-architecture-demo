import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reportingCollectionResponse } from '../src/api/reporting';
import { filterPublishedAssuranceRecords, listPublishedAssuranceRecords } from '../src/assurance/publication';
import { serializeAssuranceFilters } from '../src/assurance/service';
import { assuranceIndexContent } from '../src/demos/assurance';
import { routeUrl } from '../src/routing/application-routes';
import { renderPage } from '../src/ui/page';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

async function assuranceHtml(path: string): Promise<string> {
  const content = await assuranceIndexContent(new Request(`https://demo.wizardgang.ai${path}`), environment);
  return renderPage(environment, { ...content, routeId: 'assurance.index' }).text();
}

describe('assurance presentation consistency', () => {
  it('keeps risk HTML and API selection aligned on canonical ids', async () => {
    const filters = { framework: 'security', residual: 'high' };
    const query = serializeAssuranceFilters('risks', filters);
    const expected = filterPublishedAssuranceRecords('risks', filters).map((record) => record.id);
    const api = await (await reportingCollectionResponse(new Request(`https://demo.wizardgang.ai/api/reporting/risks?${query}`), environment, 'risks')).json() as { records: Array<{ id: string }>; derived: { count: number } };
    const html = await assuranceHtml(`/assurance?riskFramework=${filters.framework}&riskResidual=${filters.residual}#risks`);
    const rendered = [...html.matchAll(/id="((?:SEC|AI)-RISK-[0-9]+)"/g)].map((match) => match[1]);
    expect(api.records.map((record) => record.id)).toEqual(expected);
    expect(api.derived.count).toBe(expected.length);
    expect(rendered).toEqual(expected);
  });

  it('keeps compliance API selection canonical while progressively disclosing HTML records', async () => {
    const filters = { framework: 'wcag-2.2', level: 'A' };
    const query = serializeAssuranceFilters('compliance', filters);
    const expected = filterPublishedAssuranceRecords('compliance', filters).map((record) => record.id);
    const api = await (await reportingCollectionResponse(new Request(`https://demo.wizardgang.ai/api/reporting/compliance?${query}`), environment, 'compliance')).json() as { records: Array<{ id: string }>; derived: { count: number } };
    const focusedId = expected[0];
    const html = await assuranceHtml(`/assurance?${query}&q=${focusedId}#frameworks`);
    const rendered = [...html.matchAll(/<details class="implementation-notes" id="((?:ISO27001|ISO42001|WCAG)-[^"]+)">/g)].map((match) => match[1]);
    expect(api.records.map((record) => record.id)).toEqual(expected);
    expect(api.derived.count).toBe(expected.length);
    expect(rendered).toEqual([focusedId]);
  });

  it('presents incidents and exercises from their canonical collections through the same presenter', async () => {
    const incidents = listPublishedAssuranceRecords('incidents');
    const exercises = listPublishedAssuranceRecords('exercises');
    const [incidentApi, exerciseApi] = await Promise.all([
      reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/incidents'), environment, 'incidents').then((response) => response.json()) as Promise<{ records: Array<{ id: string }>; derived: { count: number } }>,
      reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/exercises'), environment, 'exercises').then((response) => response.json()) as Promise<{ records: Array<{ id: string }>; derived: { count: number } }>,
    ]);
    const html = await assuranceHtml(`${routeUrl('assurance.index')}#activity`);
    expect(incidentApi.records.map((record) => record.id)).toEqual(incidents.map((record) => record.id));
    expect(exerciseApi.records.map((record) => record.id)).toEqual(exercises.map((record) => record.id));
    expect(incidentApi.derived.count).toBe(incidents.length);
    expect(exerciseApi.derived.count).toBe(exercises.length);
    for (const record of [...incidents, ...exercises]) expect(html).toContain(`id="${record.id}"`);
  });

  it('keeps HTML presentation code off removed relationship property aliases and serializer references', () => {
    for (const path of ['src/demos/assurance.ts', 'src/demos/assurance-workbench-renderers.ts', 'src/demos/security-page.ts']) {
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
