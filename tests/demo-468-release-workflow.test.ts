import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { releaseDispatchFromEnvironment, validateExactTagDispatch } from '../scripts/lib/exact-tag-release.ts';

const commit = 'a'.repeat(40);
const ciRun = { name: 'CI', event: 'push', head_branch: 'main', head_sha: commit, status: 'completed', conclusion: 'success' };
const dispatchEnv = {
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REF: 'refs/tags/v0.31.2',
  GITHUB_REF_NAME: 'v0.31.2',
  REQUESTED_COMMIT: commit,
  RELEASE_CHECKOUT_COMMIT: commit,
  RELEASE_CI_JSON: JSON.stringify(ciRun),
  RELEASE_MAIN_SHA: commit,
};
const pushEnv = { GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/tags/v0.31.2', GITHUB_REF_NAME: 'v0.31.2', RELEASE_CHECKOUT_COMMIT: commit, RELEASE_CI_JSON: 'null', RELEASE_MAIN_SHA: '' };

function cli(args: string[], env: Record<string, string>, input = '') {
  return spawnSync(process.execPath, ['scripts/release-workflow.ts', ...args], { encoding: 'utf8', input, env: { PATH: process.env.PATH, ...env } });
}

describe('DEMO-468 Release workflow logic', () => {
  it('maps the Release step environment onto exact-tag dispatch facts', () => {
    expect(releaseDispatchFromEnvironment(dispatchEnv)).toEqual({
      eventName: 'workflow_dispatch', ref: 'refs/tags/v0.31.2', refName: 'v0.31.2', tag: 'v0.31.2', commit, checkoutCommit: commit, ciRun, mainSha: commit,
    });
    expect(releaseDispatchFromEnvironment(pushEnv).ciRun).toBeNull();
    expect(() => releaseDispatchFromEnvironment({ ...dispatchEnv, RELEASE_CI_JSON: undefined })).toThrow('RELEASE_CI_JSON is required.');
    expect(() => releaseDispatchFromEnvironment({ ...dispatchEnv, RELEASE_CI_JSON: '"run"' })).toThrow('must be a workflow run or null');
  });

  it('accepts exact tag pushes and current-main dispatches, and rejects drift', () => {
    expect(() => validateExactTagDispatch(releaseDispatchFromEnvironment(pushEnv))).not.toThrow();
    expect(() => validateExactTagDispatch(releaseDispatchFromEnvironment(dispatchEnv))).not.toThrow();
    expect(() => validateExactTagDispatch(releaseDispatchFromEnvironment({ ...pushEnv, GITHUB_REF: 'refs/heads/main' }))).toThrow('exact release ref');
    expect(() => validateExactTagDispatch(releaseDispatchFromEnvironment({ ...dispatchEnv, RELEASE_MAIN_SHA: 'b'.repeat(40) }))).toThrow('no longer current main');
    expect(() => validateExactTagDispatch(releaseDispatchFromEnvironment({ ...dispatchEnv, RELEASE_CI_JSON: 'null' }))).toThrow('successful exact-commit main CI');
    expect(() => validateExactTagDispatch(releaseDispatchFromEnvironment({ ...dispatchEnv, GITHUB_EVENT_NAME: 'schedule' }))).toThrow('Unsupported release event.');
  });

  it('runs the typed entrypoint for dispatch validation and package version reads', () => {
    expect(cli(['validate-dispatch'], dispatchEnv).status).toBe(0);
    const stale = cli(['validate-dispatch'], { ...dispatchEnv, RELEASE_MAIN_SHA: 'b'.repeat(40) });
    expect(stale.status).not.toBe(0);
    expect(stale.stderr).toContain('Release dispatch commit is no longer current main.');
    const version = cli(['package-version'], {}, JSON.stringify({ version: '0.31.2' }));
    expect(version.stdout).toBe('0.31.2\n');
    expect(cli(['package-version'], {}, '{}').status).not.toBe(0);
    expect(cli(['unknown'], {}).status).toBe(64);
  });

  it('leaves no authored JavaScript in release.yml and keeps its trust boundary', () => {
    const release = readFileSync('.github/workflows/release.yml', 'utf8');
    expect(release).not.toMatch(/node (?:-p|-e|--input-type)|<<'NODE'|require\(|import \{/);
    expect(release).toContain('node scripts/release-workflow.ts validate-dispatch');
    expect(release).toContain('package_version="$(node scripts/release-workflow.ts package-version < package.json)"');
    expect(release).toContain("tags: ['v*']");
    expect(release).toContain('permissions:\n  contents: write\n  actions: read\n');
    expect(release).toContain('GH_TOKEN: ${{ github.token }}');
  });
});
