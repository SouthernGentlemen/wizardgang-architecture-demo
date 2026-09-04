import { describe, expect, it } from 'vitest';
import { assuranceAdvisoriesResponse } from '../src/api/advisories';
import { assuranceComplianceResponse, assuranceIncidentsResponse, assuranceRisksResponse } from '../src/api/assurance';
import { assuranceEvidenceResponse, assuranceResponse } from '../src/api/assurance-registry';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import type { Env } from '../src/types';

const environment = {
  DEMO_DB: { prepare: () => { throw new Error('D1 should not be used by assurance contract tests'); } },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'v0.14.0',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

const published = {
  evidence: listPublishedAssuranceRecords('evidence'),
  risks: listPublishedAssuranceRecords('risks'),
  incidents: listPublishedAssuranceRecords('incidents'),
  exercises: listPublishedAssuranceRecords('exercises'),
  advisories: listPublishedAssuranceRecords('advisories'),
  compliance: listPublishedAssuranceRecords('compliance'),
};

describe('current assurance HTTP contract', () => {
  it('uses /v1/assurance as current registry discovery instead of a family aggregate envelope', async () => {
    const response = assuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance'), environment);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    expect(response.headers.get('x-assurance-schema-version')).toBe('1');
    expect(response.headers.get('etag')).toMatch(/^W\/"assurance-current-[0-9a-f]{16}"$/);

    const body = await response.json() as {
      contract: string;
      registry: { id: string; reporting?: unknown };
      collections: Array<{ dataset: string; route: string; recordRoute?: string }>;
      claims?: unknown;
      counts?: unknown;
    };
    expect(body.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(body.registry.id).toBe('wizardgang-public-assurance');
    expect(body.registry.reporting).toBeDefined();
    expect(body.collections).toEqual(expect.arrayContaining([
      expect.objectContaining({ dataset: 'evidence', route: '/v1/assurance/evidence' }),
      expect.objectContaining({ dataset: 'compliance', route: '/v1/assurance/compliance', recordRoute: '/v1/assurance/compliance/{id}' }),
      expect.objectContaining({ dataset: 'risks', route: '/v1/assurance/risks' }),
      expect.objectContaining({ dataset: 'incidents', route: '/v1/assurance/incidents' }),
      expect.objectContaining({ dataset: 'advisories', route: '/v1/assurance/advisories' }),
    ]));
    expect(body).not.toHaveProperty('claims');
    expect(body).not.toHaveProperty('counts');
  });

  it('returns canonical records and normalized relationships without flattened v1 aliases', async () => {
    const response = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=security'));
    const body = await response.json() as {
      contract: string;
      dataset: string;
      datasets: string[];
      query: { filters: Record<string, string> };
      records: Array<Record<string, unknown> & { id: string; relationships: Record<string, string[]> }>;
      derived: { count: number; totalAvailable: number; facets: Record<string, Record<string, number>> };
    };
    const expected = published.risks.filter((record) => record.framework === 'security');
    expect(body.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(body.dataset).toBe('risks');
    expect(body.datasets).toEqual(['risks']);
    expect(body.query.filters).toEqual({ framework: 'security' });
    expect(body.records).toEqual(expected);
    expect(body.derived.count).toBe(expected.length);
    expect(body.derived.totalAvailable).toBe(published.risks.length);
    expect(body.derived.facets.framework.security).toBe(expected.length);
    for (const record of body.records) {
      expect(record.relationships).toBeDefined();
      expect(record).not.toHaveProperty('controls');
      expect(record).not.toHaveProperty('evidence');
      expect(record).not.toHaveProperty('riskLinks');
      expect(record).not.toHaveProperty('frameworkReferences');
    }
  });

  it('uses the same records envelope for family collections and exact record lookup', async () => {
    const incidents = await (await assuranceIncidentsResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/incidents?limit=1'),
    )).json() as {
      datasets: string[];
      records: Array<{ id: string; recordType: string; relationships: Record<string, string[]> }>;
      incidents?: unknown;
      exercises?: unknown;
      query: { pagination: { total: number } };
    };
    expect(incidents.datasets).toEqual(['incidents', 'exercises']);
    expect(incidents.records).toHaveLength(1);
    expect(incidents.records[0].relationships).toBeDefined();
    expect(incidents.query.pagination.total).toBe(published.incidents.length + published.exercises.length);
    expect(incidents).not.toHaveProperty('incidents');
    expect(incidents).not.toHaveProperty('exercises');

    const exact = await (await assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-4.1.2'),
      'WCAG-4.1.2',
    )).json() as {
      dataset: string;
      records: Array<{ id: string; relationships: Record<string, string[]> }>;
      record?: unknown;
      derived: { count: number };
    };
    expect(exact.dataset).toBe('compliance');
    expect(exact.records).toHaveLength(1);
    expect(exact.records[0].id).toBe('WCAG-4.1.2');
    expect(exact.records[0].relationships).toBeDefined();
    expect(exact.derived.count).toBe(1);
    expect(exact).not.toHaveProperty('record');
  });

  it('keeps stable cursor pagination and representation ETags on the common envelope', async () => {
    const first = assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=2'),
      environment,
    );
    const firstBody = await first.json() as {
      records: Array<{ id: string }>;
      query: { pagination: { limit: number; returned: number; total: number; nextCursor: string | null } };
      derived: { count: number };
    };
    expect(firstBody.records.map((record) => record.id)).toEqual(published.evidence.slice(0, 2).map((record) => record.id));
    expect(firstBody.query.pagination).toEqual({
      limit: 2,
      returned: Math.min(2, published.evidence.length),
      total: published.evidence.length,
      nextCursor: published.evidence.length > 2 ? published.evidence[1].id : null,
    });
    expect(firstBody.derived.count).toBe(published.evidence.length);

    const etag = first.headers.get('etag');
    const conditional = assuranceEvidenceResponse(new Request(
      'https://demo.wizardgang.ai/v1/assurance/evidence?limit=2',
      { headers: { 'if-none-match': etag ?? '' } },
    ), environment);
    expect(conditional.status).toBe(304);
    expect(conditional.headers.get('etag')).toBe(etag);
    expect(await conditional.text()).toBe('');
  });

  it('rejects legacy negotiation, aliases, invalid filters, and unsupported writes clearly', async () => {
    const schemaVersion = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?schemaVersion=1'));
    expect(schemaVersion.status).toBe(400);
    expect(await schemaVersion.json()).toEqual({
      error: 'legacy_schema_version_parameter_unsupported',
      parameter: 'schemaVersion',
    });

    const vendor = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks', {
      headers: { accept: 'application/vnd.wizardgang.assurance+json; version=1' },
    }));
    expect(vendor.status).toBe(406);
    expect(await vendor.json()).toEqual({
      error: 'legacy_assurance_media_type_unsupported',
      supported: ['application/json'],
    });

    const alias = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?residualRating=low'));
    expect(alias.status).toBe(400);
    expect(await alias.json()).toEqual({
      error: 'unsupported_query_parameter',
      parameter: 'residualRating',
    });

    const invalid = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=unknown'));
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      error: 'invalid_filter',
      parameter: 'framework',
      value: 'unknown',
      allowed: ['security', 'ai'],
    });

    const missing = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-9.9.9'),
      'WCAG-9.9.9',
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: 'assurance_record_not_found',
      dataset: 'compliance',
      recordId: 'WCAG-9.9.9',
    });

    for (const responder of [assuranceRisksResponse, assuranceIncidentsResponse, assuranceAdvisoriesResponse]) {
      const rejected = responder(new Request('https://demo.wizardgang.ai/v1/assurance/risks', { method: 'POST' }));
      expect(rejected.status).toBe(405);
      expect(rejected.headers.get('allow')).toBe('GET');
    }

    const preflight = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks', { method: 'OPTIONS' }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});
