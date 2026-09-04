import { evaluateAssuranceObservationWindow } from './observation-window.js';

export { evaluateAssuranceObservationWindow } from './observation-window.js';

export const ASSURANCE_LIFECYCLE_STATES = Object.freeze([
  'Draft',
  'Approved',
  'Published',
  'Superseded',
  'Withdrawn',
]);

export function assertSupportedAssuranceResource(resource) {
  const visibility = resource?.visibility;
  if (visibility !== 'public') {
    const id = resource?.id ?? 'unknown assurance resource';
    throw new Error(
      `${id} uses unsupported assurance visibility ${String(visibility)}; this public repository supports only public assurance resources.`,
    );
  }
  return resource;
}

function disclosureStatus(review) {
  return typeof review?.status === 'string' ? review.status : 'Unreviewed';
}

export function disclosureReviewIsPublishable(review) {
  return disclosureStatus(review) === 'Reviewed';
}

function findById(values, id) {
  return Array.isArray(values) ? values.find((value) => value?.id === id) : undefined;
}

function reviewForRef(lifecycleRegistry, reviewRef) {
  return typeof reviewRef === 'string'
    ? findById(lifecycleRegistry?.reviewEvents, reviewRef)
    : undefined;
}

function sourceApprovalFor(lifecycleRegistry, resourceId, revision) {
  if (typeof resourceId !== 'string' || typeof revision !== 'string') return undefined;
  return Array.isArray(lifecycleRegistry?.sourceApprovals)
    ? lifecycleRegistry.sourceApprovals.find((approval) =>
      approval?.resource === resourceId && approval?.revision === revision)
    : undefined;
}

export function assuranceLifecycleBaselineEligible(lifecycleRegistry, baselineMembership, recordId) {
  if (!lifecycleRegistry?.baseline || baselineMembership?.schemaVersion !== 1) return false;
  if (lifecycleRegistry.baseline.historicalCommit !== baselineMembership.commit) return false;
  return Array.isArray(baselineMembership.recordIds) && baselineMembership.recordIds.includes(recordId);
}

export function resolveAssuranceLifecycle(lifecycleRegistry, recordId, options = {}) {
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
      lifecycle: lifecycleRegistry.baseline.lifecycle ?? 'Published',
      reviewRef: lifecycleRegistry.baseline.reviewRef,
      disclosureReview: reviewForRef(lifecycleRegistry, lifecycleRegistry.baseline.reviewRef),
      source: 'baseline',
      retained: false,
    };
  }

  return null;
}

export function assuranceLifecyclePresentation(resolved, disclosureReview = resolved?.disclosureReview) {
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

export function assurancePublicationDecision(resource, lifecycleRegistry, recordId, options = {}) {
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

export function assuranceObservedState(record, now = new Date()) {
  const evaluation = evaluateAssuranceObservationWindow(record, now);
  if (!evaluation) return null;

  return {
    state: evaluation.state,
    ...(typeof record?.observedAt === 'string' ? { observedAt: record.observedAt } : {}),
    ...(typeof record?.validUntil === 'string' ? { validUntil: record.validUntil } : {}),
  };
}
