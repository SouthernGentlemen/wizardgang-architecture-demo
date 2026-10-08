import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateControlledPullRequestIdentity } from '../scripts/lib/controlled-pr-identity.ts';

const malformedMerge = 'ea74418711daf21887747c4344b1496d8b312cef';
const plan = fs.readFileSync('implementation_plan.md', 'utf8');
const source = () => fs.readFileSync('scripts/validate-history.ts', 'utf8');
const recoverySubject = '[DEMO-497] [FIX] Recover post-merge history metadata';
const recoveryMarker = `Post-Merge-Recovery: ${malformedMerge}`;

function recovery(overrides = {}) {
  return {
    branchName: 'demo-497-post-merge-history-recovery',
    title: recoverySubject,
    headSubject: recoverySubject,
    headBody: recoveryMarker,
    rangeSubjects: [recoverySubject],
    basePlanMarkdown: plan,
    headPlanMarkdown: plan,
    baseAcceptedIds: new Set(['DEMO-497']),
    baseSha: malformedMerge,
    ...overrides,
  };
}

describe('DEMO-497 immutable post-merge history recovery', () => {
  it('allows only the exact published malformed squash body as an immutable exception', () => {
    const history = source();
    expect(history).toContain(`'ea74418711daf21887747c4344b1496d8b312cef',\n    'DEMO-497 was squash-merged in PR #440`);
    expect(history).toContain('Markdown Change/Reason headings instead of the required Change: and Reason:');
    expect(history).toContain("const requiredSections = ['Change', 'Reason', 'Risk', 'Validation', 'Source', 'Release'];");
    expect(history).toContain('const inheritedException = inheritedBodyExceptions.get(sha);');
  });

  it('recognizes a single same-ID direct-child recovery while preserving general history validation', () => {
    const history = source();
    expect(history).toContain(`marker: '${recoveryMarker}'`);
    expect(history).toContain('id: 497');
    expect(history).toContain('does not consume DEMO-498');
    expect(history).toContain('parents.length === 1 ? boundedRecoveryContinuations.get(parents[0]) : null');
    expect(history).toContain('boundedRecovery.id === id');
    expect(history).toContain('body.split(\'\\n\').some((line) => line.trim() === boundedRecovery.marker)');
  });

  it('rejects wrong parent, missing acceptance, plan changes, or multiple commits', () => {
    expect(validateControlledPullRequestIdentity(recovery())).toEqual([]);
    expect(validateControlledPullRequestIdentity(recovery({
      baseSha: 'b'.repeat(40),
    }))).toContain(`Post-merge recovery marker must equal the exact PR base SHA ${'b'.repeat(40)}.`);
    expect(validateControlledPullRequestIdentity(recovery({
      baseAcceptedIds: new Set(),
    }))).toContain('Post-merge recovery must reuse a controlled ID already accepted on the PR base.');
    expect(validateControlledPullRequestIdentity(recovery({
      headPlanMarkdown: plan + '\nretired tasks cannot be revived\n',
    }))).toContain('Post-merge recovery must not change implementation_plan.md or consume the next queued task.');
    expect(validateControlledPullRequestIdentity(recovery({
      rangeSubjects: [recoverySubject, recoverySubject],
    }))).toContain('PR range must contain exactly one commit; found 2.');
  });

  it('leaves DEMO-497 retired and all later IDs unchanged', () => {
    const queued = [...plan.matchAll(/^### (DEMO-\d{3,}) —/gm)].map((m) => Number(m[1].slice(5)));
    expect(plan).not.toMatch(/^### DEMO-497 —/m);
    expect(queued[0]).toBe(498);
    expect(queued.every((id) => id >= 498)).toBe(true);
  });
});
