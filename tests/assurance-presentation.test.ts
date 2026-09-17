import { describe, expect, it } from 'vitest';
import { presentEvidence } from '../src/assurance/presentation';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import type { Env } from '../src/types';

function env(overrides: Partial<Env> = {}): Env {
  return {
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    ...overrides,
  } as Env;
}

describe('assurance evidence presentation', () => {
  it('resolves canonical repository evidence at the exact deployed SHA, never the configured branch', () => {
    const deployedSha = 'fedcba9876543210fedcba9876543210fedcba98';
    const repository = 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo';
    const origin = 'https://demo.example';
    const records = listPublishedAssuranceRecords('evidence');
    const repositoryRecords = records.filter((record) => Boolean(record.locator.repositoryPath));
    expect(repositoryRecords.length).toBeGreaterThan(0);

    for (const record of repositoryRecords) {
      const presented = presentEvidence(record, env({ DEPLOYED_SHA: deployedSha, GITHUB_BRANCH: 'moving-branch' }), origin);
      expect(presented.resolved.kind).toBe('repository');
      if (presented.resolved.kind !== 'repository') throw new Error('Expected repository evidence.');
      expect(presented.resolved.revision).toBe(deployedSha);
      expect(presented.resolved.url).toBe(`${repository}/blob/${deployedSha}/${record.locator.repositoryPath}`);
      expect(presented.resolved.url).not.toContain('/blob/moving-branch/');
      expect(presented.resolved.url).not.toContain('/blob/main/');
    }
  });

  it('does not fabricate a moving-branch URL when deployment identity is absent', () => {
    const record = listPublishedAssuranceRecords('evidence').find((candidate) =>
      candidate.freshnessPolicy === 'release-bound' && Boolean(candidate.locator.repositoryPath));
    expect(record).toBeDefined();
    if (!record) throw new Error('Expected release-bound repository evidence.');

    const presented = presentEvidence(record, env({ GITHUB_BRANCH: 'moving-branch', DEPLOYED_SHA: undefined }), 'https://demo.example');
    expect(presented.resolved.kind).toBe('repository');
    if (presented.resolved.kind !== 'repository') throw new Error('Expected repository evidence.');
    expect(presented.resolved.revision).toBeNull();
    expect(presented.resolved.url).toBeNull();
    expect(presented.resolved.resolution).toBe('not-supplied');
  });
});
