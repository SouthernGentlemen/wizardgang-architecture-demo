import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reportingRecordResponse } from '../src/api/reporting';
import {
  assuranceCollectionApiRoute,
  assuranceHtmlRoute,
  assuranceRecordUrls,
  assuranceRouteDeclarations,
} from '../src/assurance/routes';
import { assuranceDeclarativeRouteRegistry } from '../src/routing/assurance-routes';
import { reportingRouteRegistry } from '../src/routing/reporting-routes';
import { matchRoute } from '../src/routing/registry';
import type { Env } from '../src/types';

const env = { GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main' } as Env;

describe('assurance route contract', () => {
  it('keeps assurance metadata route-ID-only while deriving canonical browser and reporting URLs', () => {
    const declarations = assuranceRouteDeclarations();
    expect(declarations.map((entry) => entry.routeId)).toEqual(expect.arrayContaining([
      'assurance.index',
      'assurance.evidence',
      'assurance.governance',
      'assurance.compliance',
      'assurance.risks',
      'assurance.incidents',
      'security.index',
    ]));
    expect(declarations.every((entry) => !('routes' in entry))).toBe(true);
    expect(assuranceCollectionApiRoute('compliance')).toBe('/api/reporting/compliance');
    expect(assuranceCollectionApiRoute('advisories')).toBe('/api/reporting/security');
    expect(assuranceRecordUrls('compliance', 'WCAG-4.1.2')).toMatchObject({
      api: '/api/reporting/compliance/WCAG-4.1.2',
      html: '/assurance/compliance#WCAG-4.1.2',
    });
    for (const dataset of ['claims', 'evidence', 'compliance', 'risks', 'incidents', 'exercises', 'advisories', 'governance-records']) {
      expect(assuranceHtmlRoute(dataset), dataset).not.toContain('?');
    }
  });

  it('matches every canonical assurance HTML route and all machine reporting through the generic reporting registry', () => {
    for (const [routeId, path] of [
      ['assurance.index', '/assurance'],
      ['assurance.delivery', '/assurance/delivery'],
      ['assurance.governance', '/assurance/governance'],
      ['assurance.evidence', '/assurance/evidence'],
      ['assurance.compliance', '/assurance/compliance'],
      ['assurance.risks', '/assurance/risks'],
      ['assurance.incidents', '/assurance/incidents'],
      ['assurance.concerns', '/assurance/concerns'],
      ['security.index', '/security'],
    ] as const) {
      expect(matchRoute(assuranceDeclarativeRouteRegistry, 'GET', path)).toMatchObject({
        status: 'matched',
        route: { id: routeId },
      });
    }
    expect(matchRoute(assuranceDeclarativeRouteRegistry, 'GET', '/api/reporting/risks')).toEqual({
      status: 'not-found',
      statusCode: 404,
    });
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/risks')).toMatchObject({
      status: 'matched',
      route: { id: 'reporting.collection' },
      params: { collection: 'risks' },
    });
  });

  it('serves exact records through the current shared envelope', async () => {
    const response = await reportingRecordResponse(
      new Request('https://demo.wizardgang.ai/api/reporting/compliance/WCAG-4.1.2'),
      env,
      'compliance',
      'WCAG-4.1.2',
    );
    expect(response.status).toBe(200);
    const body = await response.json() as { dataset: string; records: Array<{ id: string }>; derived: { count: number }; record?: unknown };
    expect(body.dataset).toBe('compliance');
    expect(body.records.map((record) => record.id)).toEqual(['WCAG-4.1.2']);
    expect(body.derived.count).toBe(1);
    expect(body).not.toHaveProperty('record');
  });

  it('contains no dead assuranceRecordUrls export in the JavaScript route contract', () => {
    const source = readFileSync('src/assurance/route-contract.js', 'utf8');
    expect(source).not.toMatch(/export function assuranceRecordUrls/);
    expect(source).not.toContain('?view=');
  });

  it('keeps assurance family dispatch out of the main router', () => {
    const source = readFileSync('src/router.ts', 'utf8');
    expect(source).toContain('applicationRouteRegistry');
    expect(source).not.toContain('routeAssuranceRequest');
    expect(source).not.toContain('ASSURANCE_API_HANDLERS');
    expect(source).not.toContain('ASSURANCE_HTML_HANDLERS');
    expect(source).not.toContain('matchAssuranceRoute');
    expect(source).not.toContain('genericAssuranceResponse');
    expect(source).not.toContain("'/api/reporting");
  });
});
