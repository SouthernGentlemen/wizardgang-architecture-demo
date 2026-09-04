export type RiskRating = 'low' | 'moderate' | 'high' | 'critical';

export const RISK_RATING_VALUES: readonly RiskRating[];

export function deriveRiskRating(score: number): RiskRating;

export function deriveRiskScore<T extends { score: number }>(
  value: T,
): T & { rating: RiskRating };

export function deriveRiskRecord<
  T extends { inherent: { score: number }; residual: { score: number } },
>(record: T): Omit<T, 'inherent' | 'residual'> & {
  inherent: T['inherent'] & { rating: RiskRating };
  residual: T['residual'] & { rating: RiskRating };
};
