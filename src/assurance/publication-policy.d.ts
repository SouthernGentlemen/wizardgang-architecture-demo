import type { AssuranceObservationClock, AssuranceObservationWindowStateName } from './observation-window.js';

export type {
  AssuranceObservationClock,
  AssuranceObservationWindowEvaluation,
  AssuranceObservationWindowInput,
  AssuranceObservationWindowInvalidReason,
  AssuranceObservationWindowStateName,
} from './observation-window.js';
export { evaluateAssuranceObservationWindow } from './observation-window.js';

export type AssuranceLifecycle = 'Draft' | 'Approved' | 'Published' | 'Superseded' | 'Withdrawn';
export type AssuranceLifecycleSource = 'baseline' | 'explicit' | 'retired';
export type AssuranceObservedStateName = AssuranceObservationWindowStateName;

export interface AssuranceDisclosureReview {
  id?: string;
  status?: string;
  reviewedAt?: string;
  reviewer?: string;
  basis?: string;
}

export interface AssuranceSourceApproval {
  id: string;
  resource: string;
  revision: string;
  reviewRef: string;
}

export interface AssuranceLifecycleRecord {
  id: string;
  lifecycle: AssuranceLifecycle;
  reviewRef: string;
  supersedes?: string[];
  supersededBy?: string[];
  withdrawalRationale?: string;
}

export interface AssuranceLifecycleRegistry {
  schemaVersion?: number;
  baseline?: {
    historicalCommit?: string;
    migrationCommit?: string;
    membership?: { path?: string; blob?: string };
    lifecycle?: AssuranceLifecycle;
    reviewRef?: string;
  };
  reviewEvents?: AssuranceDisclosureReview[];
  sourceApprovals?: AssuranceSourceApproval[];
  records?: AssuranceLifecycleRecord[];
  retiredRecords?: AssuranceLifecycleRecord[];
}

export interface AssuranceLifecycleBaselineMembership {
  schemaVersion?: number;
  commit?: string;
  recordIds?: readonly string[];
}

export interface AssuranceLifecycleResolutionOptions {
  baselineMembership?: AssuranceLifecycleBaselineMembership;
  resourceRevision?: string;
}

export interface ResolvedAssuranceLifecycle extends AssuranceLifecycleRecord {
  disclosureReview?: AssuranceDisclosureReview;
  source: AssuranceLifecycleSource;
  retained: boolean;
}

export interface AssuranceLifecyclePresentation {
  id?: string;
  lifecycle: AssuranceLifecycle;
  source: AssuranceLifecycleSource;
  disclosureReview: string;
  retained: boolean;
  supersedes?: string[];
  supersededBy?: string[];
  withdrawalRationale?: string;
}

export interface AssurancePublicationDecision {
  selected: boolean;
  reason: 'missing-lifecycle' | 'disclosure-review-required' | 'source-approval-required' | 'retained-record' | 'publishable';
  lifecycle: ResolvedAssuranceLifecycle | null;
  presentation: AssuranceLifecyclePresentation | null;
}

export interface AssuranceObservedState {
  state: AssuranceObservedStateName;
  observedAt?: string;
  validUntil?: string;
}

export const ASSURANCE_LIFECYCLE_STATES: readonly AssuranceLifecycle[];

export function assertSupportedAssuranceResource<T extends { id?: string; visibility?: string }>(resource: T): T;
export function disclosureReviewIsPublishable(review: AssuranceDisclosureReview | null | undefined): boolean;
export function assuranceLifecycleBaselineEligible(
  lifecycleRegistry: AssuranceLifecycleRegistry,
  baselineMembership: AssuranceLifecycleBaselineMembership | null | undefined,
  recordId: string,
): boolean;
export function resolveAssuranceLifecycle(
  lifecycleRegistry: AssuranceLifecycleRegistry,
  recordId: string,
  options?: AssuranceLifecycleResolutionOptions,
): ResolvedAssuranceLifecycle | null;
export function assuranceLifecyclePresentation(
  resolved: ResolvedAssuranceLifecycle | null | undefined,
  disclosureReview?: AssuranceDisclosureReview | null,
): AssuranceLifecyclePresentation | null;
export function assurancePublicationDecision(
  resource: { id?: string; visibility?: string },
  lifecycleRegistry: AssuranceLifecycleRegistry,
  recordId: string,
  options?: AssuranceLifecycleResolutionOptions,
): AssurancePublicationDecision;
export function assuranceObservedState(
  record: { observedAt?: unknown; validUntil?: unknown },
  now?: AssuranceObservationClock,
): AssuranceObservedState | null;
