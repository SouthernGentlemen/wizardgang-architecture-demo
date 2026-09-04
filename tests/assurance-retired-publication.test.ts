import { describe, expect, it, vi } from 'vitest';
import claimsData from '../assurance/claims/claims.json';
import type { Env } from '../src/types';

const retirementFixtures = vi.hoisted(() => ({
  withdrawnId: 'CLM-SEC-001',
  supersededId: 'CLM-AI-001',
  disclosureReview: {
    status: 'Reviewed',
    reviewedAt: '2026-09-04T13:00:00Z',
    reviewer: 'retirement-fixture-review',
    basis: 'Synthetic review metadata used only by retired publication API tests.',
  },
}));

vi.mock('../src/assurance/generated/registry-bindings', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/assurance/generated/registry-bindings')>();
  const datasets = original.assuranceRuntimeDatasets as Record<string, unknown>;
  const lifecycle = datasets['lifecycle.records'] as {
    retiredRecords?: unknown[];
    [key: string]: unknown;
  };

  return {
    ...original,
    assuranceRuntimeDatasets: {
      ...datasets,
      'lifecycle.records': {
        ...lifecycle,
        retiredRecords: [
          ...(lifecycle.retiredRecords ?? []),
          {
            id: retirementFixtures.withdrawnId,
            lifecycle: 'Withdrawn',
            disclosureReview: retirementFixtures.disclosureReview,
            withdrawalRationale: 'The retired fixture no longer represents the current assurance claim.',
          },
          {
            id: retirementFixtures.supersededId,
            lifecycle: 'Superseded',
            disclosureReview: retirementFixtures.disclosureReview,
            supersededBy: ['CLM-GOV-001'],
          },
        ],
      },
    },
  };
});

import { assuranceResponse } from '../src/api/assurance-registry';

const environment = {
  DEMO_DB: { prepare: () => { throw new Error('D1 should not be used by assurance projection tests'); } },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'v0.12.0',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

describe('retired assurance publication', () => {
  it('serializes each retained record with its stable identity and associated retirement metadata', async () => {
    const response = assuranceResponse(new Request('https://demo.wizardgang.ai/v1/assurance'), environment);
    expect(response.status).toBe(200);

    const body = JSON.parse(await response.text()) as {
      counts: { claims: number };
      claims: Array<{ id: string }>;
      publication: {
        retainedRecords: Array<{
          id: string;
          lifecycle: string;
          source: string;
          disclosureReview: string;
          retained: boolean;
          supersededBy?: string[];
          withdrawalRationale?: string;
        }>;
      };
    };

    expect(body.publication.retainedRecords).toEqual([
      {
        id: retirementFixtures.withdrawnId,
        lifecycle: 'Withdrawn',
        source: 'retired',
        disclosureReview: 'Reviewed',
        retained: true,
        withdrawalRationale: 'The retired fixture no longer represents the current assurance claim.',
      },
      {
        id: retirementFixtures.supersededId,
        lifecycle: 'Superseded',
        source: 'retired',
        disclosureReview: 'Reviewed',
        retained: true,
        supersededBy: ['CLM-GOV-001'],
      },
    ]);

    const currentClaimIds = body.claims.map((record) => record.id);
    expect(currentClaimIds).not.toContain(retirementFixtures.withdrawnId);
    expect(currentClaimIds).not.toContain(retirementFixtures.supersededId);
    expect(body.counts.claims).toBe(claimsData.records.length - 2);
    expect(body.counts.claims).toBe(body.claims.length);
  });
});
