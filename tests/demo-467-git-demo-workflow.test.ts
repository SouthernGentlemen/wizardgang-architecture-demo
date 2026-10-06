import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  mergedCommit, nextSemanticVersion, planLiveReleaseStart, requireExactBase, requireSuccessfulChecks, verifyLivePullRequest,
} from '../scripts/lib/git-demo-workflow.ts';

const requestId = '123E4567-e89b-12d3-a456-426614174000';
const plan = '# Implementation plan\n\n## Open tasks\n\n### DEMO-468 — [BUILD] Queued change\n\n- Dependency: none.\n';
const pull = {
  state: 'OPEN',
  title: '[DEMO-469] [BUILD] Demonstrate v0.32.0 release lifecycle',
  body: `Controlled\n<!-- git-demo-request:${requestId} -->`,
  baseRefName: 'main',
  headRefName: 'demo-469-live-v0-32-0-123e4567',
  headRefOid: 'a'.repeat(40),
};
const passing = ['validate', 'change-id', 'security', 'secrets'].map((name) => ({ bucket: 'pass', name, workflow: 'CI' }));

describe('DEMO-467 live Git workflow logic', () => {
  it('computes the semantic version, change ID, and controlled branch for start', () => {
    expect(['patch', 'minor', 'major'].map((bump) => nextSemanticVersion('0.31.1', bump as 'patch'))).toEqual(['0.31.2', '0.32.0', '1.0.0']);
    expect(planLiveReleaseStart({
      packageJson: JSON.stringify({ version: '0.31.1' }),
      bump: 'minor',
      requestId,
      subjects: ['[DEMO-467] [BUILD] Accepted', ''],
      planMarkdown: plan,
      openPullRequests: [],
      existingTag: () => false,
    })).toEqual({ current: '0.31.1', version: '0.32.0', change_id: 'DEMO-469', branch: 'demo-469-live-v0-32-0-123e4567' });
  });

  it('refuses invalid versions and existing tags', () => {
    expect(() => nextSemanticVersion('0.31', 'patch')).toThrow('Invalid package version: 0.31');
    expect(() => planLiveReleaseStart({
      packageJson: JSON.stringify({ version: '0.31.1' }), bump: 'patch', requestId, subjects: [], planMarkdown: plan,
      openPullRequests: [], existingTag: (tag) => tag === 'v0.31.2',
    })).toThrow('Release tag v0.31.2 already exists.');
  });

  it('binds the release operation to the exact controlled pull request', () => {
    expect(verifyLivePullRequest(pull, requestId)).toEqual({ branch: pull.headRefName, sha: pull.headRefOid, version: '0.32.0' });
    expect(() => verifyLivePullRequest({ ...pull, state: 'CLOSED' }, requestId)).toThrow('not an open live-demo change');
    expect(() => verifyLivePullRequest({ ...pull, title: pull.title.replace('469', '470') }, requestId)).toThrow('controlled live-demo contract');
    expect(() => verifyLivePullRequest({ ...pull, headRefName: 'demo-469-live-v0-32-0-zzzzzzzz' }, requestId)).toThrow('controlled live-demo contract');
    expect(() => verifyLivePullRequest(pull, '00000000-0000-0000-0000-000000000000')).toThrow('request ID does not match');
  });

  it('requires every passing CI check, the unchanged head, and mergeability against current main', () => {
    expect(() => requireSuccessfulChecks(passing)).not.toThrow();
    expect(() => requireSuccessfulChecks(passing.slice(1))).toThrow('Required CI validate');
    expect(() => requireSuccessfulChecks([...passing.slice(0, 3), { bucket: 'pass', name: 'secrets', workflow: 'Other' }])).toThrow('Required CI secrets');
    const api = { state: 'open', mergeable: true, head: { sha: 'h' }, base: { sha: 'm' } };
    expect(() => requireExactBase(api, 'h', 'm')).not.toThrow();
    for (const changed of [{ ...api, mergeable: null }, { ...api, base: { sha: 'old' } }, { ...api, head: { sha: 'new' } }, { ...api, state: 'closed' }]) {
      expect(() => requireExactBase(changed, 'h', 'm')).toThrow('revalidate CI');
    }
    expect(mergedCommit({ state: 'MERGED', mergeCommit: { oid: 'c' } })).toBe('c');
    expect(mergedCommit({ state: 'OPEN', mergeCommit: { oid: 'c' } })).toBe('');
    expect(mergedCommit({ state: 'MERGED', mergeCommit: null })).toBe('');
  });

  it('runs the workflow entrypoint natively from TypeScript', () => {
    const version = spawnSync(process.execPath, ['scripts/git-demo-workflow.ts', 'package-version'], { input: '{"version":"0.31.1"}', encoding: 'utf8' });
    expect(version.status, version.stderr).toBe(0);
    expect(version.stdout).toBe('0.31.1\n');
    const checks = spawnSync(process.execPath, ['scripts/git-demo-workflow.ts', 'require-checks'], { env: { ...process.env, CHECKS_JSON: '[]' }, encoding: 'utf8' });
    expect(checks.status).not.toBe(0);
    expect(checks.stderr).toContain('Required CI validate is not successful');
  });
});
