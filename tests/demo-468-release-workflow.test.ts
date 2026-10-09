import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
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

const ready = { version: '0.31.2', planMarkdown: '# Implementation plan\n', intent: '0.31.2' };
const script = path.resolve('scripts/release-workflow.ts');
const checkouts: string[] = [];
// A tagged checkout whose package.json history carries (or lacks) the authorized intent.
function checkout(plan: string, message: string) {
  const dir = mkdtempSync(path.join(tmpdir(), 'release-checkout-'));
  checkouts.push(dir);
  const run = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  run('init', '-q');
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '0.31.2' }));
  writeFileSync(path.join(dir, 'implementation_plan.md'), plan);
  run('add', '.');
  run('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-q', '-m', message);
  return dir;
}
afterAll(() => { for (const dir of checkouts) rmSync(dir, { recursive: true, force: true }); });
function cli(args: string[], env: Record<string, string>, input = '', cwd = process.cwd()) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', input, env: { PATH: process.env.PATH, ...env } });
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
    const facts = (env: Record<string, string | undefined>) => ({ ...releaseDispatchFromEnvironment(env), ...ready });
    expect(() => validateExactTagDispatch(facts(pushEnv))).not.toThrow();
    expect(() => validateExactTagDispatch(facts(dispatchEnv))).not.toThrow();
    expect(() => validateExactTagDispatch(facts({ ...pushEnv, GITHUB_REF: 'refs/heads/main' }))).toThrow('exact release ref');
    expect(() => validateExactTagDispatch(facts({ ...dispatchEnv, RELEASE_MAIN_SHA: 'b'.repeat(40) }))).toThrow('no longer current main');
    expect(() => validateExactTagDispatch(facts({ ...dispatchEnv, RELEASE_CI_JSON: 'null' }))).toThrow('successful exact-commit main CI');
    expect(() => validateExactTagDispatch(facts({ ...dispatchEnv, GITHUB_EVENT_NAME: 'schedule' }))).toThrow('Unsupported release event.');
  });

  it('runs the typed entrypoint for dispatch validation and package version reads', () => {
    const authorized = checkout('# Implementation plan\n', '[DEMO-600] [BUILD] Authorize v0.31.2 batch release\n\nRelease-Intent: v0.31.2');
    const accepted = cli(['validate-dispatch'], dispatchEnv, '', authorized);
    expect(accepted.status, accepted.stderr).toBe(0);
    const queued = cli(['validate-dispatch'], dispatchEnv, '', checkout('### DEMO-601 — [BUILD] Queued work\n', '[DEMO-600] [BUILD] Authorize\n\nRelease-Intent: v0.31.2'));
    expect(queued.stderr).toContain('waits for the queue to empty (DEMO-601)');
    const absent = cli(['validate-dispatch'], dispatchEnv, '', checkout('# Implementation plan\n', '[DEMO-600] [BUILD] Ordinary change'));
    expect(absent.stderr).toContain('no authorized Release-Intent for v0.31.2');
    const stale = cli(['validate-dispatch'], { ...dispatchEnv, RELEASE_MAIN_SHA: 'b'.repeat(40) }, '', authorized);
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
