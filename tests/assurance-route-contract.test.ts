import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse } from '../src/api/assurance';
import {
  assuranceCollectionApiRoute,
  assuranceRecordUrls,
  assuranceRouteDeclarations,
  matchAssuranceRoute,
  validateAssuranceRouteHandlerSupport,
} from '../src/assurance/routes';

describe('assurance route contract', () => {
  it('derives stable public routes and route ownership from the registry', () => {
    const declarations = assuranceRouteDeclarations();
    expect(declarations.map((entry) => entry.owner)).toEqual(expect.arrayContaining(['evidence', 'compliance', 'risks', 'incidents', 'advisories']));
    expect(assuranceCollectionApiRoute('compliance')).toBe('/v1/assurance/compliance');
    expect(assuranceRecordUrls('compliance', 'WCAG-4.1.2')).toMatchObject({
      api: '/v1/assurance/compliance/WCAG-4.1.2',
      html: '/compliance#WCAG-4.1.2',
    });
  });

  it('matches collection and detail routes without family-specific dispatch inventories', () => {
    expect(matchAssuranceRoute('/v1/assurance/risks')).toMatchObject({ owner: 'risks', kind: 'api-collection' });
    expect(matchAssuranceRoute('/v1/assurance/compliance/WCAG-4.1.2')).toMatchObject({ owner: 'compliance', kind: 'api-record', recordId: 'WCAG-4.1.2' });
    expect(matchAssuranceRoute('/v1/assurance/compliance/WCAG-4.1.2/extra')).toBeNull();
  });

  it('serves exact records through the same current envelope as collection queries', async () => {
    const response = assuranceComplianceResponse(
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

  it('validates handler support without requiring compatibility serializers', () => {
    expect(validateAssuranceRouteHandlerSupport({
      'wizardgang-public-assurance': { apiCollection: true },
      evidence: { html: true, apiCollection: true },
      compliance: { html: true, apiCollection: true, apiRecord: true },
      risks: { html: true, apiCollection: true },
      incidents: { html: true, apiCollection: true },
      advisories: { html: true, apiCollection: true },
      '*': { apiCollection: true, apiRecord: true },
    })).toEqual([]);
    expect(readFileSync('src/router.ts', 'utf8')).toContain('matchAssuranceRoute');
    expect(readFileSync('src/router.ts', 'utf8')).not.toContain('serializeAssuranceV1');
  });
});
