import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const script = new URL('../scripts/validate-history.mjs', import.meta.url).pathname;
const directories = [];
const body = (release = 'Unreleased', marker = '') => `Change:\nChange.\n\nReason:\nReason.\n\nImpact:\nMetadata.\n\nRisk:\nLow\n\nControls:\n- Review.\n\nValidation:\n- Pure test.\n\nEvidence:\n- package.json.\n\nSource:\ndirect.\n\nRelease:\n${release}\n${marker}`;
function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}
function commit(cwd, subject, contents) {
  git(cwd, 'add', '.');
  git(cwd, 'commit', '--quiet', '-m', subject, '-m', contents);
}
function fixture({ marker = 'Live-Release: true', extraChange = false } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'demo-391-history-'));
  directories.push(cwd);
  git(cwd, 'init', '--quiet');
  git(cwd, 'config', 'user.name', 'Fixture');
  git(cwd, 'config', 'user.email', 'fixture@example.test');
  const plan = '# Implementation plan\n\n## Open tasks\n\n### DEMO-003 — [FIX] Queued\n\n- Dependency: none.\n';
  writeFileSync(join(cwd, 'implementation_plan.md'), plan);
  const pkg = { name: 'fixture', version: '0.1.0', scripts: { check: 'true' } };
  const lock = { name: 'fixture', version: '0.1.0', packages: { '': { name: 'fixture', version: '0.1.0' } } };
  writeFileSync(join(cwd, 'package.json'), JSON.stringify(pkg));
  writeFileSync(join(cwd, 'package-lock.json'), JSON.stringify(lock));
  commit(cwd, '[DEMO-001] [INIT] Initialize fixture', body());
  writeFileSync(join(cwd, 'note.txt'), 'Accepted change.\n');
  commit(cwd, '[DEMO-002] [FIX] Prepare release', body());
  pkg.version = '0.1.1';
  if (extraChange) pkg.scripts.check = 'false';
  lock.version = '0.1.1';
  lock.packages[''].version = '0.1.1';
  writeFileSync(join(cwd, 'package.json'), JSON.stringify(pkg));
  writeFileSync(join(cwd, 'package-lock.json'), JSON.stringify(lock));
  commit(cwd, '[DEMO-004] [BUILD] Demonstrate v0.1.1 release lifecycle', body('v0.1.1', marker));
  return cwd;
}
function history(cwd) { return spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' }); }

afterEach(() => { for (const cwd of directories.splice(0)) rmSync(cwd, { recursive: true, force: true }); });

describe('DEMO-391 controlled history', () => {
  it('accepts a live release ahead of a queued ID and resumes the sequential queue', () => {
    const cwd = fixture();
    expect(history(cwd).status).toBe(0);
    writeFileSync(join(cwd, 'note.txt'), 'Queued change.\n');
    commit(cwd, '[DEMO-003] [FIX] Deliver queued change', body());
    writeFileSync(join(cwd, 'note.txt'), 'Next change.\n');
    commit(cwd, '[DEMO-005] [FIX] Deliver next change', body());
    const result = history(cwd);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Validated 5 sequential controlled changes.');
  });

  it('rejects a live-shaped commit without its identity marker', () => {
    const result = history(fixture({ marker: '' }));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('expected DEMO-003');
  });

  it('rejects non-version changes in a live release', () => {
    const result = history(fixture({ extraChange: true }));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('package.json may change only version metadata.');
  });
});
