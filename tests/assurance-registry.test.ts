import { describe, expect, it } from 'vitest';
import { evidenceUsedBy, listAssuranceRecords } from '../src/assurance/service';
import { presentedPublishedEvidenceRecords } from '../src/assurance/publication';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

describe('canonical assurance registry foundation', () => {
  it('derives current record cardinality from canonical collections', () => {
    for (const dataset of ['claims', 'evidence', 'risks', 'incidents', 'exercises', 'advisories', 'compliance'] as const) {
      const records = listAssuranceRecords(dataset);
      expect(new Set(records.map((record) => record.id)).size).toBe(records.length);
    }
  });

  it('derives reverse evidence relationships without duplicating them in JSON', () => {
    const usedBy = evidenceUsedBy('EVD-SRC-001');
    expect(usedBy).toEqual(expect.arrayContaining(['CLM-SEC-001', 'CLM-AI-001']));
    expect(usedBy.length).toBeGreaterThan(2);
    expect(usedBy).toEqual([...usedBy].sort());
    expect(new Set(usedBy).size).toBe(usedBy.length);
  });

  it('contains only explicitly public evidence and adds presentation fields outside canonical records', () => {
    const canonical = listAssuranceRecords('evidence');
    expect(canonical.every((record) => record.visibility === 'public')).toBe(true);
    expect(canonical.every((record) => !('usedBy' in record))).toBe(true);
    const presented = presentedPublishedEvidenceRecords(environment, 'https://demo.wizardgang.ai');
    expect(presented.every((record) => Array.isArray(record.usedBy))).toBe(true);
  });
});
