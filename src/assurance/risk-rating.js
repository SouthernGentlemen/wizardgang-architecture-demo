export const RISK_RATING_VALUES = Object.freeze(['low', 'moderate', 'high', 'critical']);

export function deriveRiskRating(score) {
  if (!Number.isInteger(score) || score < 1 || score > 25) {
    throw new RangeError(`Risk score must be an integer from 1 through 25; received ${String(score)}.`);
  }
  if (score <= 4) return 'low';
  if (score <= 9) return 'moderate';
  if (score <= 16) return 'high';
  return 'critical';
}

export function deriveRiskScore(value) {
  return {
    ...value,
    rating: deriveRiskRating(value.score),
  };
}

export function deriveRiskRecord(record) {
  return {
    ...record,
    inherent: deriveRiskScore(record.inherent),
    residual: deriveRiskScore(record.residual),
  };
}
