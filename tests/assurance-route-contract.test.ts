import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse } from '../src/api/assurance';
import {
  assuranceCollectionApiRoute,
  assuranceRecordUrls,
  assuranceRouteDeclarations,
} from '../src/assurance/routes';
import { assuranceDeclarativeRouteRegistry } from '../src/routing/assurance-routes';
import { matchRoute } from '../src/routing/registry';

describe('assurance route contract', () => {
  it('derives stable public routes and route ownership from the assurance registry', () => {
    const declarations = assuranceRouteDeclarations();
    expect(declarations.map((entry) => entry.owner)).toEqual(expect.arrayContaining(['evidence', 'compliance', 'risks', 'incidents', 'advisories']));
    expect(assuranceCollectionApiRoute('compliance')).toBe('/v1/assurance/compliance');
    expect(assuranceRecordUrls('compliance', 'WCAG-4.1.2')).toMatchObject({
      api: '/v1/assurance/compliance/WCAG-4.1.2',
      html: '/compliance#WCAG-4.1.2',
    });
  });

  it('matches registry-derived routes through the declarative matcher', () => {
    expect(matchRoute(assuranceDeclarativeRouteRegistry, 'GET', '/v1/assurance/risks')).toMatchObject({
      status: 'matched',
      route: { id: 'assurance.risks.collection' },
    });
    expect(matchRoute(assuranceDeclarativeRouteRegistry, 'GET', '/v1/assurance/compliance/WCAG-4.1.2')).toMatchObject({
      status: 'matched',
      route: { id: 'assurance.compliance.iso-27001.detail' },
      params: { recordId: 'WCAG-4.1.2' },
    });
    expect(matchRoute(assuranceDeclarativeRouteRegistry, 'GET', '/v1/assurance/compliance/WCAG-4.1.2/extra')).toEqual({
      status: 'not-found',
      statusCode: 404,
    });
  });

  it('serves exact records through the same current envelope as collection queries', async () => {
    const response = await assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-4.1.2'),
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
    expect(source).not.toContain("'/v1/assurance");
  });
});
