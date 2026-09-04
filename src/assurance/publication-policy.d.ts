export type AssuranceLifecycle = 'Draft' | 'Approved' | 'Published' | 'Superseded' | 'Withdrawn';
export type AssuranceLifecycleSource = 'baseline' | 'explicit' | 'retired';
export type AssuranceObservedStateName = 'not-yet-observed' | 'current' | 'expired' | 'invalid-window';

export interface AssuranceDisclosureReview {
  status?: string;
  reviewedAt?: string;
  reviewer?: string;
  basis?: string;
}

export interface AssuranceLifecycleRecord {
  id: string;
  lifecycle: AssuranceLifecycle;
  disclosureReview?: AssuranceDisclosureReview;
  supersedes?: string;
  supersededBy?: string;
  withdrawalRationale?: string;
}

export interface AssuranceLifecycleRegistry {
  baseline?: {
    commit?: string;
    lifecycle?: AssuranceLifecycle;
    disclosureReview?: AssuranceDisclosureReview;
  };
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
}

export interface ResolvedAssuranceLifecycle extends AssuranceLifecycleRecord {
  source: AssuranceLifecycleSource;
  retained: boolean;
}

export interface AssuranceLifecyclePresentation {
  id?: string;
  lifecycle: AssuranceLifecycle;
  source: AssuranceLifecycleSource;
  disclosureReview: string;
  retained: boolean;
  supersedes?: string;
  supersededBy?: string;
  withdrawalRationale?: string;
}

export interface AssurancePublicationDecision {
  selected: boolean;
  reason: 'missing-lifecycle' | 'disclosure-review-required' | 'retained-record' | 'publishable';
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
): AssuranceLifecyclePresentation | null;
export function assurancePublicationDecision(
  resource: { id?: string; visibility?: string },
  lifecycleRegistry: AssuranceLifecycleRegistry,
  recordId: string,
  options?: AssuranceLifecycleResolutionOptions,
): AssurancePublicationDecision;
export function assuranceObservedState(
  record: { observedAt?: string; validUntil?: string },
  now?: Date | string | number,
): AssuranceObservedState | null;
