import { evaluateAssuranceObservationWindow } from './observation-window.ts';
import type { AssuranceObservationClock, AssuranceObservationWindowStateName } from './observation-window.ts';

export type {
  AssuranceObservationClock,
  AssuranceObservationWindowEvaluation,
  AssuranceObservationWindowInput,
  AssuranceObservationWindowInvalidReason,
  AssuranceObservationWindowStateName,
} from './observation-window.ts';
export { evaluateAssuranceObservationWindow } from './observation-window.ts';

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

export const ASSURANCE_LIFECYCLE_STATES: readonly AssuranceLifecycle[] = Object.freeze([
  'Draft',
  'Approved',
  'Published',
  'Superseded',
  'Withdrawn',
]);

export function assertSupportedAssuranceResource<T extends { id?: string; visibility?: string }>(resource: T): T {
  const visibility = resource?.visibility;
  if (visibility !== 'public') {
    const id = resource?.id ?? 'unknown assurance resource';
    throw new Error(
      `${id} uses unsupported assurance visibility ${String(visibility)}; this public repository supports only public assurance resources.`,
    );
  }
  return resource;
}

function disclosureStatus(review: AssuranceDisclosureReview | null | undefined): string {
  return typeof review?.status === 'string' ? review.status : 'Unreviewed';
}

export function disclosureReviewIsPublishable(review: AssuranceDisclosureReview | null | undefined): boolean {
  return disclosureStatus(review) === 'Reviewed';
}

function findById<T extends { id?: string }>(values: readonly T[] | null | undefined, id: string): T | undefined {
  return Array.isArray(values) ? values.find((value) => value?.id === id) : undefined;
}

function reviewForRef(
  lifecycleRegistry: AssuranceLifecycleRegistry | null | undefined,
  reviewRef: unknown,
): AssuranceDisclosureReview | undefined {
  return typeof reviewRef === 'string'
    ? findById(lifecycleRegistry?.reviewEvents, reviewRef)
    : undefined;
}

function sourceApprovalFor(
  lifecycleRegistry: AssuranceLifecycleRegistry | null | undefined,
  resourceId: unknown,
  revision: unknown,
): AssuranceSourceApproval | undefined {
  if (typeof resourceId !== 'string' || typeof revision !== 'string') return undefined;
  return Array.isArray(lifecycleRegistry?.sourceApprovals)
    ? lifecycleRegistry.sourceApprovals.find((approval) =>
      approval?.resource === resourceId && approval?.revision === revision)
    : undefined;
}

export function assuranceLifecycleBaselineEligible(
  lifecycleRegistry: AssuranceLifecycleRegistry,
  baselineMembership: AssuranceLifecycleBaselineMembership | null | undefined,
  recordId: string,
): boolean {
  if (!lifecycleRegistry?.baseline || baselineMembership?.schemaVersion !== 1) return false;
  if (lifecycleRegistry.baseline.historicalCommit !== baselineMembership.commit) return false;
  return Array.isArray(baselineMembership.recordIds) && baselineMembership.recordIds.includes(recordId);
}

export function resolveAssuranceLifecycle(
  lifecycleRegistry: AssuranceLifecycleRegistry,
  recordId: string,
  options: AssuranceLifecycleResolutionOptions = {},
): ResolvedAssuranceLifecycle | null {
  const explicit = findById(lifecycleRegistry?.records, recordId);
  if (explicit) {
    return {
      ...explicit,
      disclosureReview: reviewForRef(lifecycleRegistry, explicit.reviewRef),
      source: 'explicit',
      retained: false,
    };
  }

  const retired = findById(lifecycleRegistry?.retiredRecords, recordId);
  if (retired) {
    return {
      ...retired,
      disclosureReview: reviewForRef(lifecycleRegistry, retired.reviewRef),
      source: 'retired',
      retained: true,
    };
  }

  if (assuranceLifecycleBaselineEligible(lifecycleRegistry, options.baselineMembership, recordId)) {
    return {
      id: recordId,
      lifecycle: lifecycleRegistry.baseline!.lifecycle ?? 'Published',
      reviewRef: lifecycleRegistry.baseline!.reviewRef as string,
      disclosureReview: reviewForRef(lifecycleRegistry, lifecycleRegistry.baseline!.reviewRef),
      source: 'baseline',
      retained: false,
    };
  }

  return null;
}

export function assuranceLifecyclePresentation(
  resolved: ResolvedAssuranceLifecycle | null | undefined,
  disclosureReview: AssuranceDisclosureReview | null | undefined = resolved?.disclosureReview,
): AssuranceLifecyclePresentation | null {
  if (!resolved) return null;
  return {
    ...(resolved.retained === true ? { id: resolved.id } : {}),
    lifecycle: resolved.lifecycle,
    source: resolved.source,
    disclosureReview: disclosureStatus(disclosureReview),
    retained: resolved.retained === true,
    ...(resolved.supersedes ? { supersedes: resolved.supersedes } : {}),
    ...(resolved.supersededBy ? { supersededBy: resolved.supersededBy } : {}),
    ...(resolved.withdrawalRationale ? { withdrawalRationale: resolved.withdrawalRationale } : {}),
  };
}

export function assurancePublicationDecision(
  resource: { id?: string; visibility?: string },
  lifecycleRegistry: AssuranceLifecycleRegistry,
  recordId: string,
  options: AssuranceLifecycleResolutionOptions = {},
): AssurancePublicationDecision {
  assertSupportedAssuranceResource(resource);
  const resolved = resolveAssuranceLifecycle(lifecycleRegistry, recordId, options);
  if (!resolved) {
    return {
      selected: false,
      reason: 'missing-lifecycle',
      lifecycle: null,
      presentation: null,
    };
  }

  if (!disclosureReviewIsPublishable(resolved.disclosureReview)) {
    return {
      selected: false,
      reason: 'disclosure-review-required',
      lifecycle: resolved,
      presentation: assuranceLifecyclePresentation(resolved),
    };
  }

  if (resolved.retained) {
    return {
      selected: false,
      reason: 'retained-record',
      lifecycle: resolved,
      presentation: assuranceLifecyclePresentation(resolved),
    };
  }

  const sourceApproval = sourceApprovalFor(lifecycleRegistry, resource?.id, options.resourceRevision);
  const sourceReview = reviewForRef(lifecycleRegistry, sourceApproval?.reviewRef);
  if (!sourceApproval || !disclosureReviewIsPublishable(sourceReview)) {
    return {
      selected: false,
      reason: 'source-approval-required',
      lifecycle: resolved,
      presentation: assuranceLifecyclePresentation(resolved, sourceReview ?? null),
    };
  }

  return {
    selected: true,
    reason: 'publishable',
    lifecycle: resolved,
    presentation: assuranceLifecyclePresentation(resolved, sourceReview),
  };
}

export function assuranceObservedState(
  record: { observedAt?: unknown; validUntil?: unknown },
  now: AssuranceObservationClock = new Date(),
): AssuranceObservedState | null {
  const evaluation = evaluateAssuranceObservationWindow(record, now);
  if (!evaluation) return null;

  return {
    state: evaluation.state,
    ...(typeof record?.observedAt === 'string' ? { observedAt: record.observedAt } : {}),
    ...(typeof record?.validUntil === 'string' ? { validUntil: record.validUntil } : {}),
  };
}
