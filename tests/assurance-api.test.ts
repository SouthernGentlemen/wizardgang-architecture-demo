import { describe, expect, it } from 'vitest';
import { assuranceEvidenceResponse, assuranceResponse } from '../src/api/assurance-registry';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import type { Env } from '../src/types';

const environment = {
  DEMO_DB: { prepare: () => { throw new Error('D1 should not be used by assurance projection tests'); } },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'v0.14.0',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

describe('public assurance API projection', () => {
  it('serves canonical published evidence records through the current record/query contract', async () => {
    const records = listPublishedAssuranceRecords('evidence');
    const response = await assuranceEvidenceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/evidence'), environment);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    const body = await response.json() as {
      dataset: string;
      records: typeof records;
      derived: { count: number; totalAvailable: number };
    };
    expect(body.dataset).toBe('evidence');
    expect(body.records).toEqual(records);
    expect(body.derived.count).toBe(records.length);
    expect(body.derived.totalAvailable).toBe(records.length);
    expect(body.records.every((record) => !('usedBy' in record))).toBe(true);
    expect(body.records.every((record) => !('resolved' in record))).toBe(true);
    expect(body.records.every((record) => !('freshness' in record))).toBe(true);
  });

  it('exposes the registry and current collection routes without embedding duplicate dataset copies', async () => {
    const response = assuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance'), environment);
    const body = await response.json() as {
      contract: string;
      registry: { id: string; routes: { api?: string } };
      collections: Array<{ dataset: string; route: string }>;
      evidence?: unknown;
      deployment?: unknown;
    };
    expect(body.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(body.registry).toMatchObject({ id: 'wizardgang-public-assurance', routes: { api: '/v1/assurance' } });
    expect(body.collections.some((collection) => collection.route === '/v1/assurance/evidence')).toBe(true);
    expect(body).not.toHaveProperty('evidence');
    expect(body).not.toHaveProperty('deployment');
  });

  it('keeps both assurance endpoints read-only', async () => {
    for (const responder of [assuranceResponse, assuranceEvidenceResponse]) {
      const response = await responder(new Request('https://demo.wizardgang.ai/v1/assurance', { method: 'POST' }), environment);
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('GET');
    }
  });
});