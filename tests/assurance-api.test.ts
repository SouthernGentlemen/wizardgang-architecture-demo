import { describe, expect, it } from 'vitest';
import { assuranceEvidenceResponse, assuranceResponse } from '../src/api/assurance-registry';
import { FRESHNESS_SEMANTICS } from '../src/assurance/presentation';
import type { Env } from '../src/types';

const environment = {
  DEMO_DB: { prepare: () => { throw new Error('D1 should not be used by assurance projection tests'); } },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'v0.12.0',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

describe('public assurance API projection', () => {
  it('resolves repository evidence against the exact deployed commit and derives reverse usage', async () => {
    const response = assuranceEvidenceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/evidence'), environment);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    const body = await response.json() as {
      count: number;
      records: Array<{
        id: string;
        usedBy: string[];
        freshness: { policy: string; scope: string; meaning: string };
        resolved: { kind: string; repositoryPath?: string; revision?: string | null; url: string | null; resolution: string };
      }>;
    };
    expect(body.count).toBe(15);

    const source = body.records.find((record) => record.id === 'EVD-SRC-001');
    expect(source?.usedBy).toEqual(expect.arrayContaining(['CLM-SEC-001', 'CLM-AI-001']));
    expect(source?.usedBy.length).toBeGreaterThan(2);
    expect(source?.usedBy).toEqual([...(source?.usedBy ?? [])].sort());
    expect(source?.resolved).toEqual({
      kind: 'repository',
      repositoryPath: 'src/lib/authorization.ts',
      revision: '0123456789abcdef0123456789abcdef01234567',
      url: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo/blob/0123456789abcdef0123456789abcdef01234567/src/lib/authorization.ts',
      resolution: 'deployed-commit',
    });
    expect(source?.freshness).toEqual({
      policy: 'release-bound',
      ...FRESHNESS_SEMANTICS['release-bound'],
    });

    const live = body.records.find((record) => record.id === 'EVD-RUN-001');
    expect(live?.resolved).toMatchObject({
      kind: 'route',
      url: 'https://demo.wizardgang.ai/health',
      resolution: 'live-route',
    });
    expect(live?.freshness.policy).toBe('observation-bound');
  });

  it('exposes the full v0.12 assurance registry without falling back to a moving branch when deployed SHA is absent', async () => {
    const response = assuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance'), {
      ...environment,
      DEPLOYED_SHA: undefined,
    });
    const body = await response.json() as {
      counts: { claims: number; evidence: number; risks: number; incidents: number; exercises: number };
      deployment: { commit: string | null; sourceResolution: string };
      links: { self: string; evidence: string };
      evidence: Array<{ id: string; resolved: { revision?: string | null; url: string | null; resolution: string } }>;
    };
    expect(body.counts).toEqual({ claims: 9, evidence: 15, risks: 30, incidents: 0, exercises: 1 });
    expect(body.deployment).toMatchObject({ commit: null, sourceResolution: 'not-supplied' });
    expect(body.links).toEqual({
      self: 'https://demo.wizardgang.ai/v1/assurance',
      evidence: 'https://demo.wizardgang.ai/v1/assurance/evidence',
    });
    const source = body.evidence.find((record) => record.id === 'EVD-SRC-001');
    expect(source?.resolved).toMatchObject({
      revision: null,
      url: null,
      resolution: 'not-supplied',
    });
  });

  it('keeps both assurance endpoints read-only', () => {
    for (const responder of [assuranceResponse, assuranceEvidenceResponse]) {
      const response = responder(new Request('https://demo.wizardgang.ai/v1/assurance', { method: 'POST' }), environment);
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('GET');
    }
  });
});
