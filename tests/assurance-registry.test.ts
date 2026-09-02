import { describe, expect, it } from 'vitest';
import { publicAssuranceRegistry } from '../src/assurance/registry';

describe('public assurance registry foundation', () => {
  it('derives counts from the canonical public datasets', () => {
    expect(publicAssuranceRegistry.counts).toEqual({ claims: 7, evidence: 12 });
    expect(Object.hasOwn(publicAssuranceRegistry, 'storedCounts')).toBe(false);
  });

  it('derives reverse evidence relationships without duplicating them in JSON', () => {
    const authorization = publicAssuranceRegistry.evidence.find((record) => record.id === 'EVD-SRC-001');
    expect(authorization?.usedBy).toEqual(['CLM-SEC-001', 'CLM-AI-001']);
  });

  it('contains only explicitly public evidence', () => {
    expect(publicAssuranceRegistry.evidence.every((record) => record.visibility === 'public')).toBe(true);
  });
});
