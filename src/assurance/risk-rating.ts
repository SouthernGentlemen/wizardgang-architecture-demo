export type RiskRating = 'low' | 'moderate' | 'high' | 'critical';

export const RISK_RATING_VALUES: readonly RiskRating[] = Object.freeze([
  'low',
  'moderate',
  'high',
  'critical',
]);

export function deriveRiskRating(score: number): RiskRating {
  if (!Number.isInteger(score) || score < 1 || score > 25) {
    throw new RangeError(`Risk score must be an integer from 1 through 25; received ${String(score)}.`);
  }
  if (score <= 4) return 'low';
  if (score <= 9) return 'moderate';
  if (score <= 16) return 'high';
  return 'critical';
}

export function deriveRiskScore<T extends { score: number }>(
  value: T,
): T & { rating: RiskRating } {
  return {
    ...value,
    rating: deriveRiskRating(value.score),
  };
}

export function deriveRiskRecord<
  T extends { inherent: { score: number }; residual: { score: number } },
>(record: T): Omit<T, 'inherent' | 'residual'> & {
  inherent: T['inherent'] & { rating: RiskRating };
  residual: T['residual'] & { rating: RiskRating };
} {
  return {
    ...record,
    inherent: deriveRiskScore(record.inherent),
    residual: deriveRiskScore(record.residual),
  } as Omit<T, 'inherent' | 'residual'> & {
    inherent: T['inherent'] & { rating: RiskRating };
    residual: T['residual'] & { rating: RiskRating };
  };
}
