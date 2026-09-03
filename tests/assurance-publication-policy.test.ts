import { describe, expect, it } from 'vitest';
import {
  assuranceLifecyclePresentation,
  assuranceObservedState,
  assurancePublicationDecision,
  resolveAssuranceLifecycle,
} from '../src/assurance/publication-policy.js';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';

const publicResource = { id: 'risks', visibility: 'public' };
const reviewed = {
  status: 'Reviewed',
  reviewedAt: '2026-09-03T12:00:00Z',
  reviewer: 'test-reviewer',
  basis: 'test fixture',
};
const baselineLifecycle = {
  baseline: {
    lifecycle: 'Published' as const,
    disclosureReview: reviewed,
  },
  records: [],
  retiredRecords: [],
};

describe('shared assurance publication policy', () => {
  it('rejects unsupported private resources instead of allowing a public runtime projection', () => {
    expect(() => assurancePublicationDecision(
      { id: 'risks', visibility: 'private' },
      baselineLifecycle,
      'SEC-RISK-001',
    )).toThrow('risks uses unsupported assurance visibility private');
  });

  it('inherits reviewed Published lifecycle state from the baseline', () => {
    const decision = assurancePublicationDecision(publicResource, baselineLifecycle, 'SEC-RISK-001');
    expect(decision.selected).toBe(true);
    expect(decision.reason).toBe('publishable');
    expect(decision.presentation).toEqual({
      lifecycle: 'Published',
      source: 'baseline',
      disclosureReview: 'Reviewed',
      retained: false,
    });
  });

  it('publishes reviewed Draft records because Draft is lifecycle state, not a visibility state', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [{
        id: 'SEC-RISK-001',
        lifecycle: 'Draft' as const,
        disclosureReview: reviewed,
      }],
    };
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-001');
    expect(decision.selected).toBe(true);
    expect(decision.presentation?.lifecycle).toBe('Draft');
    expect(decision.presentation?.disclosureReview).toBe('Reviewed');
  });

  it('does not publish an unreviewed Draft record', () => {
    const lifecycle = {
      ...baselineLifecycle,
      records: [{
        id: 'SEC-RISK-001',
        lifecycle: 'Draft' as const,
        disclosureReview: { status: 'Pending' },
      }],
    };
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-001');
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

    const superseded = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-001');
    expect(superseded.selected).toBe(true);
    expect(superseded.presentation).toMatchObject({
      lifecycle: 'Superseded',
      supersededBy: 'SEC-RISK-002',
      retained: false,
    });

    const withdrawn = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-003');
    expect(withdrawn.selected).toBe(true);
    expect(withdrawn.presentation).toMatchObject({
      lifecycle: 'Withdrawn',
      withdrawalRationale: 'Record no longer applies.',
      retained: false,
    });
  });

  it('resolves retained tombstones separately from current-record selection', () => {
    const lifecycle = {
      ...baselineLifecycle,
      retiredRecords: [{
        id: 'SEC-RISK-OLD',
        lifecycle: 'Withdrawn' as const,
        disclosureReview: reviewed,
        withdrawalRationale: 'Retained for identifier history.',
      }],
    };
    const resolved = resolveAssuranceLifecycle(lifecycle, 'SEC-RISK-OLD', { baselineEligible: false });
    expect(assuranceLifecyclePresentation(resolved)).toMatchObject({
      lifecycle: 'Withdrawn',
      source: 'retired',
      retained: true,
      withdrawalRationale: 'Retained for identifier history.',
    });
    const decision = assurancePublicationDecision(publicResource, lifecycle, 'SEC-RISK-OLD', { baselineEligible: false });
    expect(decision.selected).toBe(false);
    expect(decision.reason).toBe('retained-record');
  });

  it('derives time-sensitive observation state from an explicit clock without changing freshness policy', () => {
    const observation = {
      freshnessPolicy: 'observation-bound',
      observedAt: '2026-09-03T12:00:00Z',
      validUntil: '2026-09-03T14:00:00Z',
    };

    expect(assuranceObservedState(observation, new Date('2026-09-03T11:00:00Z'))).toMatchObject({
      state: 'not-yet-observed',
      observedAt: observation.observedAt,
      validUntil: observation.validUntil,
    });
    expect(assuranceObservedState(observation, new Date('2026-09-03T13:00:00Z'))?.state).toBe('current');
    expect(assuranceObservedState(observation, new Date('2026-09-03T15:00:00Z'))?.state).toBe('expired');
    expect(observation.freshnessPolicy).toBe('observation-bound');
  });

  it('projects lifecycle presentation on current public runtime records', () => {
    const risks = listPublishedAssuranceRecords('risks');
    expect(risks.length).toBeGreaterThan(0);
    expect(risks.every((record) => record.publication.lifecycle === 'Published')).toBe(true);
    expect(risks.every((record) => record.publication.disclosureReview === 'Reviewed')).toBe(true);
  });
});
