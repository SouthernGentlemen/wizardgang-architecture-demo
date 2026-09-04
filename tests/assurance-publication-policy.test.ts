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
const publicResource = { id: 'risks', visibility: 'public' };
const reviewed = {
  status: 'Reviewed',
  reviewedAt: '2026-09-03T12:00:00Z',
  reviewer: 'test-reviewer',
  basis: 'test fixture',
};
const baselineLifecycle = {
  baseline: {
    commit: baselineCommit,
    lifecycle: 'Published' as const,
    disclosureReview: reviewed,
  },
  records: [],
  retiredRecords: [],
};
const baselineMembership = {
  schemaVersion: 1,
  commit: baselineCommit,
  recordIds: ['SEC-RISK-001'],
};
const baselineOptions = { baselineMembership };

describe('shared assurance publication policy', () => {
  it('rejects unsupported private resources instead of allowing a public runtime projection', () => {
    expect(() => assurancePublicationDecision(
      { id: 'risks', visibility: 'private' },
      baselineLifecycle,
      'SEC-RISK-001',
      baselineOptions,
    )).toThrow('risks uses unsupported assurance visibility private');
  });

  it('inherits reviewed Published lifecycle state only for verified baseline members', () => {
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
  });

  it('fails closed for unknown IDs instead of assuming baseline eligibility', () => {
    const withoutMembership = assurancePublicationDecision(publicResource, baselineLifecycle, 'SEC-RISK-NEW');
    expect(withoutMembership.selected).toBe(false);
    expect(withoutMembership.reason).toBe('missing-lifecycle');
    expect(withoutMembership.presentation).toBeNull();

    const notInBaseline = assurancePublicationDecision(
      publicResource,
      baselineLifecycle,
      'SEC-RISK-NEW',
      baselineOptions,
    );
    expect(notInBaseline.selected).toBe(false);
    expect(notInBaseline.reason).toBe('missing-lifecycle');
  });

  it('rejects baseline inheritance when generated membership belongs to a different baseline commit', () => {
    const decision = assurancePublicationDecision(publicResource, baselineLifecycle, 'SEC-RISK-001', {
      baselineMembership: {
        ...baselineMembership,
        commit: '0000000000000000000000000000000000000000',
      },
    });
    expect(decision.selected).toBe(false);
    expect(decision.reason).toBe('missing-lifecycle');
  });

  it('publishes reviewed Draft records because Draft is lifecycle state, not a visibility state', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [{
        id: 'SEC-RISK-NEW',
        lifecycle: 'Draft' as const,
        disclosureReview: reviewed,
      }],
    };
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-NEW', baselineOptions);
    expect(decision.selected).toBe(true);
    expect(decision.presentation?.lifecycle).toBe('Draft');
    expect(decision.presentation?.source).toBe('explicit');
    expect(decision.presentation?.disclosureReview).toBe('Reviewed');
  });

  it('does not publish an unreviewed Draft record', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [{
        id: 'SEC-RISK-NEW',
        lifecycle: 'Draft' as const,
        disclosureReview: { status: 'Pending' },
      }],
    };
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-NEW', baselineOptions);
    expect(decision.selected).toBe(false);
    expect(decision.reason).toBe('disclosure-review-required');
    expect(decision.presentation?.lifecycle).toBe('Draft');
  });

  it('presents supersession and withdrawal metadata without treating lifecycle state as automatic hiding', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [
        {
          id: 'SEC-RISK-001',
          lifecycle: 'Superseded' as const,
          disclosureReview: reviewed,
          supersededBy: 'SEC-RISK-002',
        },
        {
          id: 'SEC-RISK-003',
          lifecycle: 'Withdrawn' as const,
          disclosureReview: reviewed,
          withdrawalRationale: 'Record no longer applies.',
        },
      ],
    };

    const superseded = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-001', baselineOptions);
    expect(superseded.selected).toBe(true);
    expect(superseded.presentation).toMatchObject({
      lifecycle: 'Superseded',
      source: 'explicit',
      supersededBy: 'SEC-RISK-002',
      retained: false,
    });

    const withdrawn = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-003', baselineOptions);
    expect(withdrawn.selected).toBe(true);
    expect(withdrawn.presentation).toMatchObject({
      lifecycle: 'Withdrawn',
      withdrawalRationale: 'Record no longer applies.',
      retained: false,
    });
  });

  it('keeps retired tombstones authoritative even when the ID was a baseline member', () => {
    const lifecycle = {
      ...baselineLifecycle,
      retiredRecords: [{
        id: 'SEC-RISK-001',
        lifecycle: 'Withdrawn' as const,
        disclosureReview: reviewed,
        withdrawalRationale: 'Retained for identifier history.',
      }],
    };
    const resolved = resolveAssuranceLifecycle(lifecycle, 'SEC-RISK-001', baselineOptions);
    expect(assuranceLifecyclePresentation(resolved)).toMatchObject({
      lifecycle: 'Withdrawn',
      source: 'retired',
      retained: true,
      withdrawalRationale: 'Retained for identifier history.',
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
    expect(observation.freshnessPolicy).toBe('observation-bound');
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
    expect(assuranceObservedState(observation, '2026-09-03T13:00:00Z')?.state).toBe('invalid-window');
  });

  it('rejects an invalid explicit clock without changing the window or freshness policy', () => {
    const observation = {
      freshnessPolicy: 'observation-bound',
      observedAt: '2026-09-03T12:00:00Z',
      validUntil: '2026-09-03T14:00:00Z',
    };
    expect(evaluateAssuranceObservationWindow(observation, 'invalid')).toEqual({
      state: 'invalid-window',
      reason: 'invalid-clock',
    });
    expect(observation.freshnessPolicy).toBe('observation-bound');
  });

  it('preserves records that do not declare an observation window', () => {
    const liveRoute = { freshnessPolicy: 'observation-bound', locator: { route: '/health' } };
    expect(evaluateAssuranceObservationWindow(liveRoute, '2026-09-03T13:00:00Z')).toBeNull();
    expect(assuranceObservedState(liveRoute, '2026-09-03T13:00:00Z')).toBeNull();
  });

  it('projects verified baseline lifecycle presentation on current public runtime records', () => {
    const risks = listPublishedAssuranceRecords('risks');
    expect(risks.length).toBeGreaterThan(0);
    expect(risks.every((record) => record.publication.lifecycle === 'Published')).toBe(true);
    expect(risks.every((record) => record.publication.source === 'baseline')).toBe(true);
    expect(risks.every((record) => record.publication.disclosureReview === 'Reviewed')).toBe(true);
  });
});
