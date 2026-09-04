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

export function evaluateAssuranceObservationWindow(
  record: AssuranceObservationWindowInput | null | undefined,
  clock?: AssuranceObservationClock,
): AssuranceObservationWindowEvaluation | null;
