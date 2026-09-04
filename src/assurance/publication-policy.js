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

function findLifecycleRecord(records, recordId) {
  return Array.isArray(records) ? records.find((record) => record?.id === recordId) : undefined;
}

export function assuranceLifecycleBaselineEligible(lifecycleRegistry, baselineMembership, recordId) {
  if (!lifecycleRegistry?.baseline || baselineMembership?.schemaVersion !== 1) return false;
  if (lifecycleRegistry.baseline.commit !== baselineMembership.commit) return false;
  return Array.isArray(baselineMembership.recordIds) && baselineMembership.recordIds.includes(recordId);
}

export function resolveAssuranceLifecycle(lifecycleRegistry, recordId, options = {}) {
  const explicit = findLifecycleRecord(lifecycleRegistry?.records, recordId);
  if (explicit) return { ...explicit, source: 'explicit', retained: false };

  const retired = findLifecycleRecord(lifecycleRegistry?.retiredRecords, recordId);
  if (retired) return { ...retired, source: 'retired', retained: true };

  if (assuranceLifecycleBaselineEligible(lifecycleRegistry, options.baselineMembership, recordId)) {
    return {
      id: recordId,
      lifecycle: lifecycleRegistry.baseline.lifecycle ?? 'Published',
      disclosureReview: lifecycleRegistry.baseline.disclosureReview,
      source: 'baseline',
      retained: false,
    };
  }

  return null;
}

export function assuranceLifecyclePresentation(resolved) {
  if (!resolved) return null;
  return {
    ...(resolved.retained === true ? { id: resolved.id } : {}),
    lifecycle: resolved.lifecycle,
    source: resolved.source,
    disclosureReview: disclosureStatus(resolved.disclosureReview),
    retained: resolved.retained === true,
    ...(resolved.supersedes ? { supersedes: resolved.supersedes } : {}),
    ...(resolved.supersededBy ? { supersededBy: resolved.supersededBy } : {}),
    ...(resolved.withdrawalRationale ? { withdrawalRationale: resolved.withdrawalRationale } : {}),
  };
}

export function assurancePublicationDecision(resource, lifecycleRegistry, recordId, options = {}) {
  assertSupportedAssuranceResource(resource);
  const resolved = resolveAssuranceLifecycle(lifecycleRegistry, recordId, options);
  const reviewed = disclosureReviewIsPublishable(resolved?.disclosureReview);
  const selected = Boolean(resolved && reviewed && !resolved.retained);
  return {
    selected,
    reason: !resolved
      ? 'missing-lifecycle'
      : !reviewed
        ? 'disclosure-review-required'
        : resolved.retained
          ? 'retained-record'
          : 'publishable',
    lifecycle: resolved,
    presentation: assuranceLifecyclePresentation(resolved),
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
