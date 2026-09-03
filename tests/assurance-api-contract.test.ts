import { describe, expect, it } from 'vitest';
import { assuranceAdvisoriesResponse } from '../src/api/advisories';
import { assuranceComplianceResponse, assuranceIncidentsResponse, assuranceRisksResponse } from '../src/api/assurance';
import { assuranceEvidenceResponse, assuranceResponse } from '../src/api/assurance-registry';
import {
  serializeAssuranceV1Advisory,
  serializeAssuranceV1Compliance,
  serializeAssuranceV1Exercise,
  serializeAssuranceV1Incident,
  serializeAssuranceV1Risk,
} from '../src/api/assurance-v1';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import type { Env } from '../src/types';

const environment = {
  DEMO_DB: { prepare: () => { throw new Error('D1 should not be used by assurance contract tests'); } },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'v0.14.0',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

const canonicalCollections = {
  claims: listPublishedAssuranceRecords('claims'),
  evidence: listPublishedAssuranceRecords('evidence'),
  risks: listPublishedAssuranceRecords('risks'),
  incidents: listPublishedAssuranceRecords('incidents'),
  exercises: listPublishedAssuranceRecords('exercises'),
  advisories: listPublishedAssuranceRecords('advisories'),
  compliance: listPublishedAssuranceRecords('compliance'),
};

describe('public assurance HTTP contract', () => {
  it('preserves the released aggregate response while deriving current counts and ordering from canonical records', async () => {
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
      claims: Array<Record<string, unknown> & { id: string }>;
      evidence: Array<{ id: string }>;
      risks: Array<Record<string, unknown> & { id: string }>;
      incidents: Array<{ id: string }>;
      exercises: Array<{ id: string }>;
      advisories: Array<{ id: string }>;
      pagination?: unknown;
    };
    const secondBody = await second.json() as typeof firstBody;

    expect(firstBody.schemaVersion).toBe(1);
    expect(firstBody.counts).toEqual({
      claims: canonicalCollections.claims.length,
      evidence: canonicalCollections.evidence.length,
      risks: canonicalCollections.risks.length,
      incidents: canonicalCollections.incidents.length,
      exercises: canonicalCollections.exercises.length,
      advisories: canonicalCollections.advisories.length,
    });
    expect(firstBody).not.toHaveProperty('pagination');
    for (const dataset of ['claims', 'evidence', 'risks', 'incidents', 'exercises', 'advisories'] as const) {
      expect(firstBody[dataset].map((record) => record.id)).toEqual(canonicalCollections[dataset].map((record) => record.id));
    }
    expect(firstBody.risks).toEqual(canonicalCollections.risks.map(serializeAssuranceV1Risk));
    expect(firstBody.incidents).toEqual(canonicalCollections.incidents.map(serializeAssuranceV1Incident));
    expect(firstBody.exercises).toEqual(canonicalCollections.exercises.map(serializeAssuranceV1Exercise));
    expect(firstBody.advisories).toEqual(canonicalCollections.advisories.map(serializeAssuranceV1Advisory));
    expect(secondBody).toEqual(firstBody);
  });

  it('keeps representative v1 compatibility aliases and key order at the HTTP boundary only', async () => {
    const riskResponse = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks'));
    const riskBody = await riskResponse.json() as { records: Array<Record<string, unknown>> };
    const risk = riskBody.records[0];
    expect(Object.keys(risk)).toEqual([
      'id', 'framework', 'title', 'inherent', 'residual', 'treatment', 'status', 'reviewDue', 'controls', 'evidence', 'publication',
    ]);
    expect(risk).toHaveProperty('controls');
    expect(risk).toHaveProperty('evidence');
    expect(risk).not.toHaveProperty('relationships');

    const aggregate = await (await assuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance'), environment)).json() as {
      claims: Array<Record<string, unknown>>;
    };
    expect(Object.keys(aggregate.claims[0])).toEqual([
      'id', 'area', 'title', 'statement', 'posture', 'frameworkReferences', 'evidence', 'publication',
    ]);
    expect(aggregate.claims[0]).not.toHaveProperty('relationships');

    const compliance = await (await assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance?limit=1'),
    )).json() as { records: Array<Record<string, unknown>> };
    expect(compliance.records[0]).toHaveProperty('evidence');
    expect(compliance.records[0]).not.toHaveProperty('relationships');
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
    const wcagRecords = canonicalCollections.compliance.filter((record) => record.framework === 'wcag-2.2');
    const first = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance?framework=wcag-2.2&limit=2'),
    );
    const firstBody = await first.json() as {
      counts: { total: number };
      records: Array<{ id: string }>;
      pagination: { limit: number; returned: number; total: number; nextCursor: string | null };
    };
    expect(firstBody.counts.total).toBe(wcagRecords.length);
    expect(firstBody.records).toEqual(wcagRecords.slice(0, 2).map(serializeAssuranceV1Compliance));
    expect(firstBody.pagination).toEqual({
      limit: 2,
      returned: Math.min(2, wcagRecords.length),
      total: wcagRecords.length,
      nextCursor: wcagRecords.length > 2 ? wcagRecords[1].id : null,
    });

    const second = assuranceComplianceResponse(
      new Request(`https://demo.wizardgang.ai/v1/assurance/compliance?framework=wcag-2.2&limit=2&cursor=${encodeURIComponent(firstBody.pagination.nextCursor ?? '')}`),
    );
    const secondBody = await second.json() as typeof firstBody;
    expect(secondBody.records).toEqual(wcagRecords.slice(2, 4).map(serializeAssuranceV1Compliance));
    expect(secondBody.pagination.total).toBe(wcagRecords.length);

    const securityRisks = canonicalCollections.risks.filter((record) => record.framework === 'security');
    const risks = assuranceRisksResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=security&limit=2'),
    );
    const riskBody = await risks.json() as {
      counts: { total: number };
      records: Array<{ id: string }>;
      pagination: { total: number };
    };
    expect(riskBody.counts.total).toBe(securityRisks.length);
    expect(riskBody.records).toEqual(securityRisks.slice(0, 2).map(serializeAssuranceV1Risk));
    expect(riskBody.pagination.total).toBe(securityRisks.length);

    const evidence = assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=2'),
      environment,
    );
    const evidenceBody = await evidence.json() as {
      count: number;
      records: Array<{ id: string }>;
      pagination: { total: number };
    };
    expect(evidenceBody.count).toBe(canonicalCollections.evidence.length);
    expect(evidenceBody.records.map((record) => record.id)).toEqual(canonicalCollections.evidence.slice(0, 2).map((record) => record.id));
    expect(evidenceBody.pagination.total).toBe(canonicalCollections.evidence.length);

    const incidents = assuranceIncidentsResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/incidents?limit=1'),
    );
    const incidentBody = await incidents.json() as {
      incidents: Array<{ id: string }>;
      exercises: Array<{ id: string }>;
      pagination: { total: number; nextCursor: string | null };
    };
    const combinedIncidentRecords = [...canonicalCollections.incidents, ...canonicalCollections.exercises];
    const expectedIncidentPage = combinedIncidentRecords.slice(0, 1);
    expect(incidentBody.incidents.map((record) => record.id)).toEqual(expectedIncidentPage.filter((record) => record.recordType === 'incident').map((record) => record.id));
    expect(incidentBody.exercises.map((record) => record.id)).toEqual(expectedIncidentPage.filter((record) => record.recordType === 'exercise').map((record) => record.id));
    expect(incidentBody.pagination).toMatchObject({
      total: combinedIncidentRecords.length,
      nextCursor: combinedIncidentRecords.length > 1 ? expectedIncidentPage[0]?.id ?? null : null,
    });

    const advisories = assuranceAdvisoriesResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/advisories?limit=1'),
    );
    const advisoryBody = await advisories.json() as {
      count: number;
      records: Array<{ id: string }>;
      pagination: { total: number; nextCursor: string | null };
    };
    const expectedAdvisoryPage = canonicalCollections.advisories.slice(0, 1);
    expect(advisoryBody.count).toBe(canonicalCollections.advisories.length);
    expect(advisoryBody.records).toEqual(expectedAdvisoryPage.map(serializeAssuranceV1Advisory));
    expect(advisoryBody.pagination).toMatchObject({
      total: canonicalCollections.advisories.length,
      nextCursor: canonicalCollections.advisories.length > 1 ? expectedAdvisoryPage[0]?.id ?? null : null,
    });
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

  it('negotiates schema version 1 and preserves read-only CORS and lookup errors', async () => {
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
    expect(await unsupported.json()).toEqual({
      error: 'unsupported_schema_version',
      requested: '2',
      supported: [1],
    });

    const preflight = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks', { method: 'OPTIONS' }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*');
    expect(preflight.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');

    const rejected = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(await rejected.json()).toEqual({ error: 'method_not_allowed', allowed: ['GET'] });

    const missing = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-9.9.9'),
      'WCAG-9.9.9',
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'compliance_record_not_found', recordId: 'WCAG-9.9.9' });
  });
});
