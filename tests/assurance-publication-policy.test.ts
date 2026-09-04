import { describe, expect, it } from 'vitest';
import { evaluateAssuranceObservationWindow } from '../src/assurance/observation-window.js';
import {
  assuranceLifecycleBaselineEligible,
  assuranceLifecyclePresentation,
  assuranceObservedState,
  assurancePublicationDecision,
  resolveAssuranceLifecycle,
} from '../src/assurance/publication-policy.js';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';

const baselineCommit = 'c2359f00fc3bac80bfbc2e82369a86f20e522f74';
const approvedRevision = '1111111111111111111111111111111111111111';
const publicResource = { id: 'risks', visibility: 'public' };
const reviewed = {
  id: 'reviewed',
  status: 'Reviewed',
  reviewedAt: '2026-09-03T12:00:00Z',
  reviewer: 'test-reviewer',
  basis: 'Synthetic reviewed event for publication policy tests.',
};
const pending = {
  id: 'pending',
  status: 'Pending',
  reviewedAt: '2026-09-03T12:00:00Z',
  reviewer: 'test-reviewer',
  basis: 'Synthetic pending event for publication policy tests.',
};
const baselineLifecycle = {
  schemaVersion: 2,
  baseline: {
    historicalCommit: baselineCommit,
    migrationCommit: '6f8383cd6a318e0fe03506bc96401f5161c6e222',
    membership: {
      path: 'src/assurance/generated/lifecycle-baseline-membership.json',
      blob: 'e2f4aad3146649fdfe2063abc780dc73a99bdd64',
    },
    lifecycle: 'Published' as const,
    reviewRef: reviewed.id,
  },
  reviewEvents: [reviewed, pending],
  sourceApprovals: [{
    id: 'risk-source-review',
    resource: 'risks',
    revision: approvedRevision,
    reviewRef: reviewed.id,
  }],
  records: [],
  retiredRecords: [],
};
const baselineMembership = {
  schemaVersion: 1,
  commit: baselineCommit,
  recordIds: ['SEC-RISK-001'],
};
const baselineOptions = { baselineMembership, resourceRevision: approvedRevision };

describe('shared assurance publication policy', () => {
  it('rejects unsupported private resources instead of allowing a public runtime projection', () => {
    expect(() => assurancePublicationDecision(
      { id: 'risks', visibility: 'private' },
      baselineLifecycle,
      'SEC-RISK-001',
      baselineOptions,
    )).toThrow('risks uses unsupported assurance visibility private');
  });

  it('publishes a verified baseline member only when the exact source revision is approved', () => {
    expect(assuranceLifecycleBaselineEligible(baselineLifecycle, baselineMembership, 'SEC-RISK-001')).toBe(true);
    const decision = assurancePublicationDecision(publicResource, baselineLifecycle, 'SEC-RISK-001', baselineOptions);
    expect(decision.selected).toBe(true);
    expect(decision.reason).toBe('publishable');
    expect(decision.presentation).toEqual({
      lifecycle: 'Published',
      source: 'baseline',
      disclosureReview: 'Reviewed',
      retained: false,
    });

    const changed = assurancePublicationDecision(publicResource, baselineLifecycle, 'SEC-RISK-001', {
      ...baselineOptions,
      resourceRevision: '2222222222222222222222222222222222222222',
    });
    expect(changed.selected).toBe(false);
    expect(changed.reason).toBe('source-approval-required');
    expect(changed.presentation?.disclosureReview).toBe('Unreviewed');
  });

  it('fails closed for unknown IDs instead of assuming baseline eligibility', () => {
    const decision = assurancePublicationDecision(publicResource, baselineLifecycle, 'SEC-RISK-NEW', baselineOptions);
    expect(decision.selected).toBe(false);
    expect(decision.reason).toBe('missing-lifecycle');
    expect(decision.presentation).toBeNull();
  });

  it('rejects baseline inheritance when frozen membership belongs to a different historical commit', () => {
    const decision = assurancePublicationDecision(publicResource, baselineLifecycle, 'SEC-RISK-001', {
      baselineMembership: {
        ...baselineMembership,
        commit: '0000000000000000000000000000000000000000',
      },
      resourceRevision: approvedRevision,
    });
    expect(decision.selected).toBe(false);
    expect(decision.reason).toBe('missing-lifecycle');
  });

  it('publishes an explicit Draft only when both lifecycle review and exact source approval resolve', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [{
        id: 'SEC-RISK-NEW',
        lifecycle: 'Draft' as const,
        reviewRef: reviewed.id,
      }],
    };
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-NEW', baselineOptions);
    expect(decision.selected).toBe(true);
    expect(decision.presentation?.lifecycle).toBe('Draft');
    expect(decision.presentation?.source).toBe('explicit');
    expect(decision.presentation?.disclosureReview).toBe('Reviewed');
  });

  it('does not publish an explicitly governed record whose lifecycle review is pending', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [{
        id: 'SEC-RISK-NEW',
        lifecycle: 'Draft' as const,
        reviewRef: pending.id,
      }],
    };
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-NEW', baselineOptions);
    expect(decision.selected).toBe(false);
    expect(decision.reason).toBe('disclosure-review-required');
    expect(decision.presentation?.lifecycle).toBe('Draft');
  });

  it('presents supersession metadata while requiring the exact source approval for current records', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [{
        id: 'SEC-RISK-001',
        lifecycle: 'Superseded' as const,
        reviewRef: reviewed.id,
        supersededBy: ['SEC-RISK-002'],
      }],
    };
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-001', baselineOptions);
    expect(decision.selected).toBe(true);
    expect(decision.presentation).toMatchObject({
      lifecycle: 'Superseded',
      source: 'explicit',
      supersededBy: ['SEC-RISK-002'],
      retained: false,
    });
  });

  it('keeps retired tombstones authoritative without requiring a live source revision', () => {
    const lifecycle = {
      ...baselineLifecycle,
      retiredRecords: [{
        id: 'SEC-RISK-001',
        lifecycle: 'Withdrawn' as const,
        reviewRef: reviewed.id,
        withdrawalRationale: 'Record is retained only for identifier history.',
      }],
    };
    const resolved = resolveAssuranceLifecycle(lifecycle, 'SEC-RISK-001', baselineOptions);
    expect(assuranceLifecyclePresentation(resolved)).toMatchObject({
      lifecycle: 'Withdrawn',
      source: 'retired',
      retained: true,
      withdrawalRationale: 'Record is retained only for identifier history.',
    });
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-001', baselineOptions);
    expect(decision.selected).toBe(false);
    expect(decision.reason).toBe('retained-record');
  });

  it.each([
    ['before observedAt', '2026-09-03T11:59:59.999Z', 'not-yet-observed'],
    ['exactly observedAt', '2026-09-03T12:00:00.000Z', 'current'],
    ['inside the window', '2026-09-03T13:00:00.000Z', 'current'],
    ['exactly validUntil', '2026-09-03T14:00:00.000Z', 'expired'],
    ['after validUntil', '2026-09-03T14:00:00.001Z', 'expired'],
  ])('derives %s with one half-open observation-window interpretation', (_label, clock, expectedState) => {
    const observation = {
      freshnessPolicy: 'observation-bound',
      observedAt: '2026-09-03T12:00:00.000Z',
      validUntil: '2026-09-03T14:00:00.000Z',
    };

    expect(evaluateAssuranceObservationWindow(observation, clock)?.state).toBe(expectedState);
    expect(assuranceObservedState(observation, clock)).toMatchObject({
      state: expectedState,
      observedAt: observation.observedAt,
      validUntil: observation.validUntil,
    });
  });

  it.each([
    ['reversed', { observedAt: '2026-09-03T14:00:00Z', validUntil: '2026-09-03T12:00:00Z' }, 'non-positive-window'],
    ['zero-length', { observedAt: '2026-09-03T12:00:00Z', validUntil: '2026-09-03T12:00:00Z' }, 'non-positive-window'],
    ['missing validUntil', { observedAt: '2026-09-03T12:00:00Z' }, 'incomplete-window'],
    ['missing observedAt', { validUntil: '2026-09-03T14:00:00Z' }, 'incomplete-window'],
    ['invalid observedAt', { observedAt: 'invalid', validUntil: '2026-09-03T14:00:00Z' }, 'invalid-observed-at'],
    ['invalid validUntil', { observedAt: '2026-09-03T12:00:00Z', validUntil: 'invalid' }, 'invalid-valid-until'],
  ])('rejects a %s observation window through the shared evaluator', (_label, observation, expectedReason) => {
    expect(evaluateAssuranceObservationWindow(observation, '2026-09-03T13:00:00Z')).toEqual({
      state: 'invalid-window',
      reason: expectedReason,
    });
  });

  it('projects normalized baseline lifecycle presentation on current public runtime records', () => {
    const risks = listPublishedAssuranceRecords('risks');
    expect(risks.length).toBeGreaterThan(0);
    expect(risks.every((record) => record.publication.lifecycle === 'Published')).toBe(true);
    expect(risks.every((record) => record.publication.source === 'baseline')).toBe(true);
    expect(risks.every((record) => record.publication.disclosureReview === 'Reviewed')).toBe(true);
  });
});
