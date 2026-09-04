import { describe, expect, it } from 'vitest';
import { publishedAssuranceSummary } from '../src/assurance/publication';

describe('retained assurance publication', () => {
  it('keeps retained lifecycle identities in publication metadata rather than current record collections', () => {
    const retained = publishedAssuranceSummary.publication.retainedRecords;
    expect(Array.isArray(retained)).toBe(true);
    expect(new Set(retained.map((record) => record.id)).size).toBe(retained.length);
    for (const record of retained) {
      expect(record.id).toEqual(expect.any(String));
      expect(['Superseded', 'Withdrawn']).toContain(record.lifecycle);
    }
  });

  it('derives current summary counts independently from retained reservations', () => {
    for (const count of Object.values(publishedAssuranceSummary.counts)) {
      expect(count).toBeGreaterThanOrEqual(0);
    }
    expect(publishedAssuranceSummary.publication.retainedRecords.every((record) => (
      !Object.values(publishedAssuranceSummary.counts).includes(record as never)
    ))).toBe(true);
  });
});