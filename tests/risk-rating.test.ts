import { describe, expect, it } from 'vitest';
import canonicalRisks from '../assurance/risks/risks.json';
import { listAssuranceRecords } from '../src/assurance/service';
import { deriveRiskRating, deriveRiskRecord } from '../src/assurance/risk-rating.js';

describe('canonical risk rating derivation', () => {
  it('maps every controlled threshold boundary to the expected rating', () => {
    expect([
      [1, deriveRiskRating(1)],
      [4, deriveRiskRating(4)],
      [5, deriveRiskRating(5)],
      [9, deriveRiskRating(9)],
      [10, deriveRiskRating(10)],
      [16, deriveRiskRating(16)],
      [17, deriveRiskRating(17)],
      [25, deriveRiskRating(25)],
    ]).toEqual([
      [1, 'low'],
      [4, 'low'],
      [5, 'moderate'],
      [9, 'moderate'],
      [10, 'high'],
      [16, 'high'],
      [17, 'critical'],
      [25, 'critical'],
    ]);
  });

  it('rejects values outside the controlled 1 through 25 score range', () => {
    expect(() => deriveRiskRating(0)).toThrow(RangeError);
    expect(() => deriveRiskRating(26)).toThrow(RangeError);
    expect(() => deriveRiskRating(4.5)).toThrow(RangeError);
  });

  it('keeps current canonical risk state score-only while runtime records expose derived ratings', () => {
    for (const record of canonicalRisks.records) {
      expect('rating' in record.inherent).toBe(false);
      expect('rating' in record.residual).toBe(false);
    }

    const runtime = listAssuranceRecords('risks');
    expect(runtime).toHaveLength(canonicalRisks.records.length);
    for (const record of runtime) {
      expect(record.inherent.rating).toBe(deriveRiskRating(record.inherent.score));
      expect(record.residual.rating).toBe(deriveRiskRating(record.residual.score));
    }
  });

  it('uses the same derivation for a partition-shaped risk record', () => {
    const source = canonicalRisks.records[0];
    const partitionRecord = deriveRiskRecord({
      ...source,
      id: 'SEC-RISK-999',
      title: 'Partition derivation fixture',
      inherent: { score: 25 },
      residual: { score: 17 },
    });

    expect(partitionRecord.inherent).toEqual({ score: 25, rating: 'critical' });
    expect(partitionRecord.residual).toEqual({ score: 17, rating: 'critical' });
  });
});
