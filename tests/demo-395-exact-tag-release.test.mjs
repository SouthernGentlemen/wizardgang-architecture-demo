import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { planExactTagRelease, validateExactTagDispatch } from '../scripts/lib/exact-tag-release.ts';

const commit = 'a'.repeat(40);
const previous = 'b'.repeat(40);
const run = { name: 'CI', event: 'push', head_branch: 'main', head_sha: commit, status: 'completed', conclusion: 'success' };
const jobs = ['validate', 'security', 'secrets'].map((name) => ({ name, head_sha: commit, status: 'completed', conclusion: 'success' }));
const facts = { run, jobs, mainSha: commit, version: '0.28.1', tag: null, release: null, releaseRuns: [] };

describe('DEMO-395 exact main release cutter', () => {
  it('cannot cut a tag from failed, stale, or incomplete CI', () => {
    expect(planExactTagRelease({ ...facts, run: { ...run, conclusion: 'failure' } }).action).toBe('skip');
    expect(planExactTagRelease({ ...facts, mainSha: previous }).action).toBe('skip');
    expect(planExactTagRelease({ ...facts, jobs: jobs.slice(1) }).action).toBe('skip');
    expect(planExactTagRelease({ ...facts, run: { ...run, event: 'pull_request' } }).action).toBe('skip');
  });

  it('leaves a published version alone even when current main has moved', () => {
    expect(planExactTagRelease({ ...facts, version: '0.28.0', tag: { ref: 'refs/tags/v0.28.0', object: { type: 'tag', sha: previous }, tagName: 'v0.28.0', commitSha: previous }, release: { tag_name: 'v0.28.0', draft: false, published_at: '2026-09-21T00:00:00Z' } }).action).toBe('skip');
  });

  it('creates a new annotated tag only for the accepted current main commit', () => {
    expect(planExactTagRelease(facts)).toEqual({ action: 'create-and-dispatch', tag: 'v0.28.1', commit });
    expect(() => planExactTagRelease({ ...facts, tag: { ref: 'refs/tags/v0.28.1', object: { type: 'tag', sha: previous }, tagName: 'v0.28.1', commitSha: previous } })).toThrow(/never be moved/);
    expect(() => planExactTagRelease({ ...facts, tag: { ref: 'refs/tags/v0.28.1', object: { type: 'commit', sha: commit }, commitSha: commit } })).toThrow(/never be moved/);
  });

  it('retries dispatch without moving an existing exact tag or duplicating an active release', () => {
    const tag = { ref: 'refs/tags/v0.28.1', object: { type: 'tag', sha: previous }, tagName: 'v0.28.1', commitSha: commit };
    expect(planExactTagRelease({ ...facts, tag }).action).toBe('dispatch');
    expect(planExactTagRelease({ ...facts, tag, releaseRuns: [{ event: 'workflow_dispatch', head_sha: commit, head_branch: 'v0.28.1', status: 'in_progress', conclusion: null }] }).action).toBe('skip');
  });
});

describe('DEMO-395 release and deployment identities', () => {
  it('accepts only an exact-tag dispatch bound to successful current-main CI', () => {
    const valid = { eventName: 'workflow_dispatch', ref: 'refs/tags/v0.28.1', refName: 'v0.28.1', tag: 'v0.28.1', commit, checkoutCommit: commit, mainSha: commit, ciRun: run };
    expect(() => validateExactTagDispatch(valid)).not.toThrow();
    expect(() => validateExactTagDispatch({ ...valid, ref: 'refs/heads/main' })).toThrow();
    expect(() => validateExactTagDispatch({ ...valid, commit: previous })).toThrow();
    expect(() => validateExactTagDispatch({ ...valid, ciRun: { ...run, conclusion: 'failure' } })).toThrow();
  });

  it('hands the accepted exact tag to the pinned baseline deploy workflow', () => {
    const cutter = readFileSync('.github/workflows/release-cutter.yml', 'utf8');
    const release = readFileSync('.github/workflows/release.yml', 'utf8');
    const live = readFileSync('.github/workflows/git-demo.yml', 'utf8');
    expect(cutter).toContain('node scripts/cut-main-release.ts');
    expect(cutter).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(release).toContain('ci_run_id:');
    expect(release).toContain('Exact-tag Release dispatch is not bound to successful current-main CI');
    expect(release).toContain('$main_sha');
    expect(release).toContain('$REQUESTED_COMMIT');
    expect(release).toContain('Wizard-Gang/baseline/.github/workflows/deploy-worker.yml@67b4b86847e0d635a3f6fe4c21618a25d5bc71a0');
    expect(release).toContain('expected_sha: ${{ github.sha }}');
    expect(existsSync('.github/workflows/deploy.yml')).toBe(false);
    expect(live).not.toContain('git push origin "refs/tags/v$VERSION"');
  });
});
