export type AssuranceObservationWindowStateName = 'not-yet-observed' | 'current' | 'expired' | 'invalid-window';
export type AssuranceObservationWindowInvalidReason =
  | 'incomplete-window'
  | 'invalid-observed-at'
  | 'invalid-valid-until'
  | 'non-positive-window'
  | 'invalid-clock';
export type AssuranceObservationClock = Date | string | number;

export interface AssuranceObservationWindowInput {
  observedAt?: unknown;
  validUntil?: unknown;
}

export type AssuranceObservationWindowEvaluation =
  | { state: Exclude<AssuranceObservationWindowStateName, 'invalid-window'> }
  | { state: 'invalid-window'; reason: AssuranceObservationWindowInvalidReason };

function instant(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).getTime();
  return Number.NaN;
}

/**
 * Evaluate an optional assurance observation window against an explicit clock.
 *
 * A declared window is half-open: [observedAt, validUntil). The observation is
 * current at observedAt and expires exactly at validUntil. Records that declare
 * neither boundary do not have a stored observation window and return null.
 */
export function evaluateAssuranceObservationWindow(
  record: AssuranceObservationWindowInput | null | undefined,
  clock: AssuranceObservationClock = new Date(),
): AssuranceObservationWindowEvaluation | null {
  const observedAt = record?.observedAt;
  const validUntil = record?.validUntil;
  const hasObservedAt = observedAt !== undefined;
  const hasValidUntil = validUntil !== undefined;

  if (!hasObservedAt && !hasValidUntil) return null;
  if (!hasObservedAt || !hasValidUntil) {
    return { state: 'invalid-window', reason: 'incomplete-window' };
  }

  const observedAtMs = instant(observedAt);
  if (!Number.isFinite(observedAtMs)) {
    return { state: 'invalid-window', reason: 'invalid-observed-at' };
  }

  const validUntilMs = instant(validUntil);
  if (!Number.isFinite(validUntilMs)) {
    return { state: 'invalid-window', reason: 'invalid-valid-until' };
  }

  if (validUntilMs <= observedAtMs) {
    return { state: 'invalid-window', reason: 'non-positive-window' };
  }

  const clockMs = instant(clock);
  if (!Number.isFinite(clockMs)) {
    return { state: 'invalid-window', reason: 'invalid-clock' };
  }

  return {
    state: clockMs < observedAtMs
      ? 'not-yet-observed'
      : clockMs >= validUntilMs
        ? 'expired'
        : 'current',
  };
}
