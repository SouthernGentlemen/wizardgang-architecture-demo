import { describe, expect, it } from 'vitest';
import { publicAssuranceRegistry } from '../src/assurance/registry';

describe('public assurance registry foundation', () => {
  it('derives counts from the canonical public datasets', () => {
    expect(publicAssuranceRegistry.counts).toEqual({ claims: 9, evidence: 15, risks: 30, incidents: 0, exercises: 1, advisories: 0 });
    expect(Object.hasOwn(publicAssuranceRegistry, 'storedCounts')).toBe(false);
  });

  it('derives reverse evidence relationships across public assurance records without duplicating them in JSON', () => {
    const authorization = publicAssuranceRegistry.evidence.find((record) => record.id === 'EVD-SRC-001');
    const usedBy = authorization?.usedBy ?? [];
    expect(usedBy).toEqual(expect.arrayContaining(['CLM-SEC-001', 'CLM-AI-001']));
    expect(usedBy.length).toBeGreaterThan(2);
    expect(usedBy).toEqual([...usedBy].sort());
    expect(new Set(usedBy).size).toBe(usedBy.length);
  });

  it('contains only explicitly public evidence', () => {
    expect(publicAssuranceRegistry.evidence.every((record) => record.visibility === 'public')).toBe(true);
  });
});
