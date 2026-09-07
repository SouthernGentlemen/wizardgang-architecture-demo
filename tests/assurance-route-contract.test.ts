import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse } from '../src/api/assurance';
import {
  assuranceCollectionApiRoute,
  assuranceRecordUrls,
  assuranceRouteDeclarations,
} from '../src/assurance/routes';
import { assuranceDeclarativeRouteRegistry } from '../src/routing/assurance-routes';
import { reportingRouteRegistry } from '../src/routing/reporting-routes';
import { matchRoute } from '../src/routing/registry';

describe('assurance route contract', () => {
  it('keeps assurance route ownership presentation-only while deriving canonical reporting URLs', () => {
    const declarations = assuranceRouteDeclarations();
    expect(declarations.map((entry) => entry.owner)).toEqual(expect.arrayContaining(['registry', 'advisories']));
    expect(declarations.every((entry) => !entry.routes.api && !entry.routes.apiRecord)).toBe(true);
    expect(assuranceCollectionApiRoute('compliance')).toBe('/api/reporting/compliance');
    expect(assuranceCollectionApiRoute('advisories')).toBe('/api/reporting/security');
    expect(assuranceRecordUrls('compliance', 'WCAG-4.1.2')).toMatchObject({
      api: '/api/reporting/compliance/WCAG-4.1.2',
      html: '/assurance?view=compliance#WCAG-4.1.2',
    });
  });

  it('matches HTML through assurance routing and all machine reporting through the generic reporting registry', () => {
    expect(matchRoute(assuranceDeclarativeRouteRegistry, 'GET', '/assurance')).toMatchObject({
      status: 'matched',
      route: { id: 'assurance.wizardgang-public-assurance.html' },
    });
    expect(matchRoute(assuranceDeclarativeRouteRegistry, 'GET', '/api/reporting/risks')).toEqual({
      status: 'not-found',
      statusCode: 404,
    });
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/risks')).toMatchObject({
      status: 'matched',
      route: { id: 'reporting.collection' },
      params: { collection: 'risks' },
    });
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/compliance/WCAG-4.1.2')).toMatchObject({
      status: 'matched',
      route: { id: 'reporting.record' },
      params: { collection: 'compliance', recordId: 'WCAG-4.1.2' },
    });
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/compliance/WCAG-4.1.2/extra')).toEqual({
      status: 'not-found',
      statusCode: 404,
    });
  });

  it('serves exact records through the current shared envelope', async () => {
    const response = await assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/api/reporting/compliance/WCAG-4.1.2'),
      'WCAG-4.1.2',
    );
    expect(response.status).toBe(200);
    const body = await response.json() as { dataset: string; records: Array<{ id: string }>; derived: { count: number }; record?: unknown };
    expect(body.dataset).toBe('compliance');
    expect(body.records.map((record) => record.id)).toEqual(['WCAG-4.1.2']);
    expect(body.derived.count).toBe(1);
    expect(body).not.toHaveProperty('record');
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
