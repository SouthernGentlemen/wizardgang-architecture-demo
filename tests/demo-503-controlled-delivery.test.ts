import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { allocateControlledIdentity, allocatePlanIdentities, reconcileUnpublishedIdentity, selectQueuedIdentity } from '../scripts/lib/controlled-identity-allocation.ts';
import { normalizeControlledBody, renderControlledRecord, requireMatchingRecord, validateControlledRecord } from '../scripts/lib/controlled-record.ts';
import { planProtectedSquash, protectedSquash, verifyMergedIdentity, type DeliverySnapshot } from '../scripts/lib/controlled-delivery.ts';
import { validateControlledPullRequestIdentity } from '../scripts/lib/controlled-pr-identity.ts';

const base = 'a'.repeat(40), head = 'b'.repeat(40);
const task = (id: number, dependency = 'none.') => `### DEMO-${id} — [BUILD] Implement current behavior\n\n- Dependency: ${dependency}\n`;
const before = '# Implementation plan\n\n## Open tasks\n\n' + task(503, 'DEMO-502') + '\n' + task(504, 'DEMO-503');
const after = '# Implementation plan\n\n## Open tasks\n\n' + task(504, 'DEMO-503');
const input = { subjects: ['[DEMO-502] [BUILD] Accepted', '[DEMO-509] [FIX] Forward correction (#446)'], planMarkdown: before, openPullRequests: [] };
const recordInput = { id: 'DEMO-503', type: 'BUILD', summary: 'Use shared controlled delivery', change: 'One record and merge path.', reason: 'Prevent drift.', impact: 'Delivery only.', risk: 'High' as const, controls: '- Exact head, strict current base, no bypass.', validation: '- Focused pure fixtures passed.', evidence: '- scripts/lib/controlled-delivery.ts', source: 'direct', release: 'Unreleased', rollback: `Forward correction from accepted ${base}; no published history rewrite.` };
const record = renderControlledRecord(recordInput);
const snapshot = (): DeliverySnapshot => ({
  mainSha: base,
  pr: { number: 448, state: 'open', title: record.subject, body: record.body, head: { sha: head, ref: 'demo-503-controlled-delivery' }, base: { sha: base, ref: 'main' }, mergeable: true },
  identity: { branchName: 'demo-503-controlled-delivery', title: record.subject, headSubject: record.subject, headBody: record.body, rangeSubjects: [record.subject], basePlanMarkdown: before, headPlanMarkdown: after, baseAcceptedIds: new Set(['DEMO-502']), baseSha: base },
  checks: ['validate', 'browser'].map((name) => ({ name, sha: head, conclusion: 'success' })), requiredChecks: ['validate', 'browser'], canonicalCi: { sha: head, conclusion: 'success' },
});

describe('current identity reservation and publication', () => {
  it('reserves raw accepted IDs, queued IDs, open titles and branches, including malformed titles', () => {
    expect(allocateControlledIdentity(input)).toBe('DEMO-510');
    const current = { ...input, openPullRequests: [{ title: '[DEMO-510] [BUILD] Open (#9)', headRefName: 'demo-511-other' }], branches: ['demo-512-unattached'] };
    expect(allocateControlledIdentity(current)).toBe('DEMO-513');
    expect(allocatePlanIdentities(current, [{ type: 'BUILD', title: 'First' }, { type: 'FIX', title: 'Second' }])).toEqual({ maintenanceId: 'DEMO-513', tasks: [{ type: 'BUILD', title: 'First', id: 'DEMO-514' }, { type: 'FIX', title: 'Second', id: 'DEMO-515' }] });
  });
  it('selects only the first unblocked queue entry, preserving published identities', () => {
    expect(selectQueuedIdentity(input)).toBe('DEMO-503');
    expect(() => selectQueuedIdentity({ ...input, subjects: [] })).toThrow('unmet controlled dependency');
    expect(() => selectQueuedIdentity({ ...input, planMarkdown: '' })).toThrow('queue is empty');
    expect(() => selectQueuedIdentity({ ...input, openPullRequests: [{ title: record.subject, headRefName: 'demo-503-controlled-delivery' }] })).toThrow('already has published work');
  });
  it('recomputes an unpublished collision after a fresh read and refuses published renumbering', () => {
    const raced = { ...input, openPullRequests: [{ title: '[DEMO-510] [BUILD] Concurrent', headRefName: 'demo-510-concurrent' }] };
    expect(reconcileUnpublishedIdentity('DEMO-510', raced, false)).toBe('DEMO-511');
    expect(() => reconcileUnpublishedIdentity('DEMO-510', raced, true)).toThrow('never silently renumber');
    expect(reconcileUnpublishedIdentity('DEMO-511', raced, false)).toBe('DEMO-511');
  });
});

describe('one controlled metadata record', () => {
  it('renders one commit/PR/squash body with only line ending and trailing whitespace normalization', () => {
    expect(record.commit).toBe(`${record.subject}\n\n${record.body}\n`);
    expect(validateControlledRecord(record.subject, record.body)).toEqual([]);
    expect(() => requireMatchingRecord(record.subject, record.body, record.subject, `\r\n${record.body.replaceAll('\n', '  \r\n')}\r\n`)).not.toThrow();
    expect(normalizeControlledBody(record.commit)).not.toBe(record.body);
    expect(() => requireMatchingRecord(record.subject, record.body, record.subject + ' (#448)', record.body)).toThrow('drifted');
    expect(() => requireMatchingRecord(record.subject, record.body, record.subject, record.body + '\nDifferent narrative')).toThrow('drifted');
  });
  it('requires actual validation, every nonempty section and high-risk recovery targets', () => {
    expect(() => renderControlledRecord({ ...recordInput, validation: '' })).toThrow('Validation');
    expect(() => renderControlledRecord({ ...recordInput, rollback: '' })).toThrow('explicit forward recovery');
    expect(validateControlledRecord(record.subject, record.subject + '\n' + record.body)).toContain('Controlled body must not duplicate the subject.');
    expect(validateControlledRecord(record.subject, record.body + '\nChange:\nDuplicate')).toContain('Controlled record requires one nonempty Change: section.');
    expect(() => renderControlledRecord({ ...recordInput, summary: 'Changed (#448)' })).toThrow('suffix');
  });
  it('carries an authorized release intent only in a plan-maintenance record', () => {
    const intent = renderControlledRecord({ ...recordInput, id: 'DEMO-510', maintenance: true, releaseIntent: '0.33.0', release: 'v0.33.0 — authorized batch release', requestId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(validateControlledRecord(intent.subject, intent.body)).toEqual([]);
    expect(intent.body).toMatch(/Portfolio-Plan-Maintenance: true\n\nRelease-Intent: v0\.33\.0\n\n<!-- git-demo-request:/);
    expect(() => renderControlledRecord({ ...recordInput, releaseIntent: '0.33.0' })).toThrow('plan-maintenance record');
  });
});

describe('shared protected squash planning', () => {
  it('plans explicit squash text, never duplicate subjects or mutation during dry-run', async () => {
    const merge = vi.fn();
    const result = await protectedSquash({ read: async () => snapshot(), merge, validatedHead: head, validatedBase: base });
    expect(merge).not.toHaveBeenCalled();
    expect(result.plan).toEqual({ sha: head, merge_method: 'squash', commit_title: record.subject, commit_message: record.body });
  });
  it('rejects moved base/head, unavailable mergeability, wrong queue and mutable metadata drift', () => {
    const cases = [
      (s: DeliverySnapshot) => { s.mainSha = 'c'.repeat(40); },
      (s: DeliverySnapshot) => { s.pr.head.sha = 'c'.repeat(40); },
      (s: DeliverySnapshot) => { s.pr.base.sha = 'c'.repeat(40); },
      (s: DeliverySnapshot) => { s.pr.mergeable = null; },
      (s: DeliverySnapshot) => { s.pr.title += ' (#448)'; },
      (s: DeliverySnapshot) => { s.pr.body += '\nEdited'; },
      (s: DeliverySnapshot) => { s.identity.headPlanMarkdown = before; },
      (s: DeliverySnapshot) => { s.identity.rangeSubjects.push(record.subject); },
    ];
    for (const change of cases) { const current = snapshot(); change(current); expect(() => planProtectedSquash(current, head, base)).toThrow(); }
    const current = snapshot(); current.pr.body += '\nEdited';
    expect(validateControlledPullRequestIdentity({ ...current.identity, prBody: current.pr.body })).toContain('PR title/body drifted from the exact-head controlled record.');
  });
  it('requires canonical CI and every active required check green on the exact head', () => {
    for (const conclusion of [null, 'failure', 'cancelled', 'skipped', 'neutral']) {
      const current = snapshot(); current.checks[1].conclusion = conclusion;
      expect(() => planProtectedSquash(current, head, base)).toThrow('browser');
    }
    const stale = snapshot(); stale.checks[0].sha = base;
    expect(() => planProtectedSquash(stale, head, base)).toThrow('validate');
    const extra = snapshot(); extra.requiredChecks.push('additional-policy');
    expect(() => planProtectedSquash(extra, head, base)).toThrow('additional-policy');
    const ci = snapshot(); ci.canonicalCi.sha = base;
    expect(() => planProtectedSquash(ci, head, base)).toThrow('Canonical');
  });
  it('independently re-reads before mutation and fails closed on a race or provider rejection', async () => {
    const merge = vi.fn(async () => ({ merged: true, sha: 'c'.repeat(40) }));
    const read = vi.fn().mockResolvedValueOnce(snapshot()).mockResolvedValueOnce({ ...snapshot(), mainSha: 'c'.repeat(40) });
    await expect(protectedSquash({ read, merge, validatedHead: head, validatedBase: base, apply: true })).rejects.toThrow('changed');
    expect(merge).not.toHaveBeenCalled();
    await expect(protectedSquash({ read: async () => snapshot(), merge: async () => ({ merged: false, sha: '' }), validatedHead: head, validatedBase: base, apply: true })).rejects.toThrow('Provider declined');
    const success = await protectedSquash({ read: async () => snapshot(), merge, validatedHead: head, validatedBase: base, apply: true });
    expect(success.sha).toBe('c'.repeat(40));
    expect(merge).toHaveBeenCalledTimes(1);
  });
  it('verifies merged subject/body, exact parent and the accepted queue transition', () => {
    const accepted = { subject: record.subject, body: record.body, parent: base, planMarkdown: after };
    const expected = { subject: record.subject, body: record.body, base, planMarkdown: after };
    expect(() => verifyMergedIdentity(accepted, expected)).not.toThrow();
    for (const changed of [{ ...accepted, subject: record.subject + ' (#448)' }, { ...accepted, body: record.body + '\nDrift' }, { ...accepted, parent: head }, { ...accepted, planMarkdown: before }]) expect(() => verifyMergedIdentity(changed, expected)).toThrow();
  });
  it('routes current ordinary and live entrypoints through the same adapter', () => {
    const read = (name: string) => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
    expect(read('scripts/controlled-delivery.ts')).toContain('deliverProtectedPull(');
    expect(read('scripts/git-demo-workflow.ts')).toContain('deliverProtectedPull(');
    const workflow = read('.github/workflows/git-demo.yml');
    expect(workflow).toContain('node scripts/git-demo-workflow.ts publish');
    expect(workflow).toContain('node scripts/git-demo-workflow.ts merge');
    expect(workflow).not.toContain('gh pr merge');
    expect(workflow).not.toContain('git commit -F - <<EOF');
    expect(read('.github/workflows/ci.yml')).toContain('PR_BODY: ${{ github.event.pull_request.body }}');
  });
});
