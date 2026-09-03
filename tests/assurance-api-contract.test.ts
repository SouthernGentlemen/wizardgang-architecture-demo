import { describe, expect, it } from 'vitest';
import { assuranceAdvisoriesResponse } from '../src/api/advisories';
import { assuranceComplianceResponse, assuranceIncidentsResponse, assuranceRisksResponse } from '../src/api/assurance';
import { assuranceEvidenceResponse, assuranceResponse } from '../src/api/assurance-registry';
import type { Env } from '../src/types';

const environment = {
  DEMO_DB: { prepare: () => { throw new Error('D1 should not be used by assurance contract tests'); } },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'v0.14.0',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

describe('public assurance HTTP contract', () => {
  it('preserves the legacy aggregate response while locking canonical record ordering', async () => {
    const first = assuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance'), environment);
    const second = assuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance'), environment);

    expect(first.status).toBe(200);
    expect(first.headers.get('cache-control')).toBe('public, max-age=300');
    expect(first.headers.get('access-control-allow-origin')).toBe('*');
    expect(first.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(first.headers.get('x-assurance-schema-version')).toBe('1');
    expect(first.headers.get('etag')).toMatch(/^W\/"assurance-v1-[0-9a-f]{16}"$/);
    expect(first.headers.get('deprecation')).toBeNull();
    expect(first.headers.get('sunset')).toBeNull();

    const firstBody = await first.json() as {
      schemaVersion: number;
      counts: { claims: number; evidence: number; risks: number; incidents: number; exercises: number; advisories: number };
      claims: Array<{ id: string }>;
      evidence: Array<{ id: string }>;
      risks: Array<{ id: string }>;
      incidents: Array<{ id: string }>;
      exercises: Array<{ id: string }>;
      advisories: Array<{ id: string }>;
      pagination?: unknown;
    };
    const secondBody = await second.json() as typeof firstBody;

    expect(firstBody.schemaVersion).toBe(1);
    expect(firstBody.counts).toEqual({ claims: 9, evidence: 23, risks: 30, incidents: 0, exercises: 1, advisories: 0 });
    expect(firstBody).not.toHaveProperty('pagination');
    expect(firstBody.claims.map((record) => record.id)).toEqual([
      'CLM-SEC-001',
      'CLM-SEC-002',
      'CLM-SEC-003',
      'CLM-SEC-004',
      'CLM-SEC-005',
      'CLM-SEC-006',
      'CLM-AI-001',
      'CLM-SEC-007',
      'CLM-GOV-001',
    ]);
    expect(firstBody.evidence.map((record) => record.id)).toEqual([
      'EVD-SRC-001',
      'EVD-CI-001',
      'EVD-DOC-001',
      'EVD-DOC-002',
      'EVD-SRC-002',
      'EVD-DOC-003',
      'EVD-DOC-004',
      'EVD-RUN-001',
      'EVD-RUN-002',
      'EVD-SRC-003',
      'EVD-TST-001',
      'EVD-SRC-004',
      'EVD-RUN-003',
      'EVD-RUN-004',
      'EVD-RUN-005',
      'EVD-DOC-005',
      'EVD-DOC-006',
      'EVD-SRC-005',
      'EVD-SRC-006',
      'EVD-SRC-007',
      'EVD-TST-002',
      'EVD-TST-003',
      'EVD-RUN-006',
    ]);
    expect(firstBody.risks.map((record) => record.id)).toEqual([
      ...Array.from({ length: 15 }, (_, index) => `SEC-RISK-${String(index + 1).padStart(3, '0')}`),
      ...Array.from({ length: 15 }, (_, index) => `AI-RISK-${String(index + 1).padStart(3, '0')}`),
    ]);
    expect(firstBody.incidents).toEqual([]);
    expect(firstBody.exercises.map((record) => record.id)).toEqual(['EX-001']);
    expect(firstBody.advisories).toEqual([]);
    expect(secondBody).toEqual(firstBody);
  });

  it('uses representation ETags for conditional GETs without changing cache policy', async () => {
    const first = assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=2'),
      environment,
    );
    const etag = first.headers.get('etag');
    expect(etag).toBeTruthy();

    const conditional = assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=2', {
        headers: { 'if-none-match': etag ?? '' },
      }),
      environment,
    );
    expect(conditional.status).toBe(304);
    expect(conditional.headers.get('etag')).toBe(etag);
    expect(conditional.headers.get('cache-control')).toBe('public, max-age=300');
    expect(await conditional.text()).toBe('');
  });

  it('supports opt-in stable-cursor pagination while keeping counts scoped to the full filtered selection', async () => {
    const first = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance?framework=wcag-2.2&limit=2'),
    );
    const firstBody = await first.json() as {
      counts: { total: number };
      records: Array<{ id: string }>;
      pagination: { limit: number; returned: number; total: number; nextCursor: string | null };
    };
    expect(firstBody.counts.total).toBe(86);
    expect(firstBody.records).toHaveLength(2);
    expect(firstBody.pagination).toEqual({
      limit: 2,
      returned: 2,
      total: 86,
      nextCursor: firstBody.records[1].id,
    });

    const second = assuranceComplianceResponse(
      new Request(`https://demo.wizardgang.ai/v1/assurance/compliance?framework=wcag-2.2&limit=2&cursor=${encodeURIComponent(firstBody.pagination.nextCursor ?? '')}`),
    );
    const secondBody = await second.json() as typeof firstBody;
    expect(secondBody.records).toHaveLength(2);
    expect(secondBody.records[0].id).not.toBe(firstBody.records[0].id);
    expect(secondBody.records[0].id).not.toBe(firstBody.records[1].id);
    expect(secondBody.pagination.total).toBe(86);

    const risks = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=security&limit=2'),
    );
    const riskBody = await risks.json() as {
      counts: { total: number };
      records: Array<{ id: string }>;
      pagination: { total: number };
    };
    expect(riskBody.counts.total).toBe(15);
    expect(riskBody.records.map((record) => record.id)).toEqual(['SEC-RISK-001', 'SEC-RISK-002']);
    expect(riskBody.pagination.total).toBe(15);

    const evidence = assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=2'),
      environment,
    );
    const evidenceBody = await evidence.json() as {
      count: number;
      records: Array<{ id: string }>;
      pagination: { total: number };
    };
    expect(evidenceBody.count).toBe(23);
    expect(evidenceBody.records.map((record) => record.id)).toEqual(['EVD-SRC-001', 'EVD-CI-001']);
    expect(evidenceBody.pagination.total).toBe(23);

    const incidents = assuranceIncidentsResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/incidents?limit=1'),
    );
    const incidentBody = await incidents.json() as {
      incidents: Array<{ id: string }>;
      exercises: Array<{ id: string }>;
      pagination: { total: number; nextCursor: string | null };
    };
    expect(incidentBody.incidents).toEqual([]);
    expect(incidentBody.exercises.map((record) => record.id)).toEqual(['EX-001']);
    expect(incidentBody.pagination).toMatchObject({ total: 1, nextCursor: null });

    const advisories = assuranceAdvisoriesResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/advisories?limit=1'),
    );
    const advisoryBody = await advisories.json() as {
      count: number;
      records: unknown[];
      pagination: { total: number; nextCursor: string | null };
    };
    expect(advisoryBody.count).toBe(0);
    expect(advisoryBody.records).toEqual([]);
    expect(advisoryBody.pagination).toMatchObject({ total: 0, nextCursor: null });
  });

  it('rejects invalid filters and pagination with stable top-level error codes and no-store caching', async () => {
    const invalidFilter = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=unknown'),
    );
    expect(invalidFilter.status).toBe(400);
    expect(invalidFilter.headers.get('cache-control')).toBe('no-store');
    expect(invalidFilter.headers.get('access-control-allow-origin')).toBe('*');
    expect(await invalidFilter.json()).toEqual({
      error: 'invalid_filter',
      parameter: 'framework',
      value: 'unknown',
      allowed: ['security', 'ai'],
    });

    const invalidLimit = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance?limit=101'),
    );
    expect(invalidLimit.status).toBe(400);
    expect(await invalidLimit.json()).toMatchObject({
      error: 'invalid_pagination',
      parameter: 'limit',
      maximum: 100,
    });

    const invalidCursor = assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=2&cursor=EVD-NOT-REAL'),
      environment,
    );
    expect(invalidCursor.status).toBe(400);
    expect(await invalidCursor.json()).toEqual({
      error: 'invalid_cursor',
      cursor: 'EVD-NOT-REAL',
    });
  });

  it('negotiates schema version 1 by query or vendor Accept media type and rejects unsupported versions', async () => {
    const queryVersion = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks?schemaVersion=1'),
    );
    expect(queryVersion.status).toBe(200);
    expect(queryVersion.headers.get('x-assurance-schema-version')).toBe('1');

    const acceptVersion = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks', {
        headers: { accept: 'application/vnd.wizardgang.assurance+json; version=1' },
      }),
    );
    expect(acceptVersion.status).toBe(200);
    expect(acceptVersion.headers.get('vary')).toContain('Accept');

    const unsupported = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks?schemaVersion=2'),
    );
    expect(unsupported.status).toBe(406);
    expect(unsupported.headers.get('cache-control')).toBe('no-store');
    expect(await unsupported.json()).toEqual({
      error: 'unsupported_schema_version',
      requested: '2',
      supported: [1],
    });

    const conflict = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks?schemaVersion=1', {
        headers: { accept: 'application/vnd.wizardgang.assurance+json; version=2' },
      }),
    );
    expect(conflict.status).toBe(400);
    expect(await conflict.json()).toEqual({
      error: 'schema_version_conflict',
      queryVersion: '1',
      acceptVersion: '2',
    });
  });

  it('makes the public read-only CORS policy explicit without changing legacy method or lookup errors', async () => {
    const preflight = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://example.com',
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'if-none-match',
        },
      }),
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*');
    expect(preflight.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
    expect(preflight.headers.get('access-control-allow-headers')).toContain('If-None-Match');
    expect(preflight.headers.get('access-control-allow-credentials')).toBeNull();

    const rejected = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks', { method: 'POST' }),
    );
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
    expect(await rejected.json()).toEqual({ error: 'method_not_allowed', allowed: ['GET'] });

    const missing = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-9.9.9'),
      'WCAG-9.9.9',
    );
    expect(missing.status).toBe(404);
    expect(missing.headers.get('cache-control')).toBe('no-store');
    expect(await missing.json()).toEqual({ error: 'compliance_record_not_found', recordId: 'WCAG-9.9.9' });
  });
});
