import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { acceptanceCommands, acceptanceStages, createCiValidationCommands } from '../scripts/lib/acceptance-plan.ts';
import { prepareBrowserInputs, verifyBrowserInputs } from '../scripts/lib/prepared-browser-inputs.ts';
import { planExactTagRelease } from '../scripts/lib/exact-tag-release.ts';
import { requireSuccessfulChecks } from '../scripts/lib/git-demo-workflow.ts';
import { runDiagnosticCommands } from '../scripts/lib/ci-diagnostics.ts';

const options = { nodeExecutable: process.execPath, npmExecutable: 'npm' };
const context = { sha: 'a'.repeat(40), runId: '123' };

describe('grouped canonical acceptance', () => {
  it('partitions every canonical stage once with browser migration preceding its audit', () => {
    const source = acceptanceCommands({ group: 'source' }).map(({ id }) => id);
    const browser = acceptanceCommands({ group: 'browser' }).map(({ id }) => id);
    const all = acceptanceCommands().map(({ id }) => id);
    expect(new Set([...source, ...browser]).size).toBe(all.length);
    expect([...source, ...browser].sort()).toEqual([...all].sort());
    expect(browser).toEqual(['validate:migrations', 'test:site-accessibility']);
    expect(acceptanceStages.filter(({ script }) => script === 'validate:security')).toHaveLength(1);
    expect(() => acceptanceCommands({ group: 'unknown' })).toThrow('Unknown acceptance group');
    const commands = createCiValidationCommands({ ...options, group: 'source', pullRequest: true });
    expect(commands.findIndex(({ id }) => id === 'identity')).toBeLessThan(commands.findIndex(({ id }) => id === source[0]));
    expect(commands.filter(({ id }) => id === 'advisory')).toHaveLength(1);
    expect(commands.filter(({ id }) => id === 'patch-whitespace')).toHaveLength(1);
    expect(createCiValidationCommands({ ...options, group: 'browser' }).map(({ id }) => id)).toEqual(['toolchain', 'install', 'prepared-inputs', ...browser]);
  });

  it.each(['validate', 'browser'])('refuses %s skipped/cancelled/failed/stale evidence in current consumers', (name) => {
    const jobs = ['validate', 'browser'].map((name) => ({ name, head_sha: context.sha, status: 'completed', conclusion: 'success' }));
    for (const conclusion of ['skipped', 'cancelled', 'failure', null]) {
      const changed = jobs.map((job) => job.name === name ? { ...job, conclusion } : job);
      expect(planExactTagRelease({ run: { name: 'CI', event: 'push', head_branch: 'main', head_sha: context.sha, status: 'completed', conclusion: 'success' }, mainSha: context.sha, version: '0.32.0', jobs: changed, tag: null, release: null, releaseRuns: [] }).action).toBe('skip');
      expect(() => requireSuccessfulChecks(jobs.map((job) => ({ name: job.name, workflow: 'CI', bucket: job.name === name ? conclusion : 'pass' })))).toThrow();
    }
    const stale = jobs.map((job) => job.name === name ? { ...job, head_sha: 'b'.repeat(40) } : job);
    expect(planExactTagRelease({ run: { name: 'CI', event: 'push', head_branch: 'main', head_sha: context.sha, status: 'completed', conclusion: 'success' }, mainSha: context.sha, version: '0.32.0', jobs: stale, tag: null, release: null, releaseRuns: [] }).action).toBe('skip');
  });

  it('rejects absent, changed, extra, empty, symlinked and different-run/head build inputs', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wg-browser-input-test-'));
    try {
      fs.mkdirSync(path.join(root, 'dist/client'), { recursive: true });
      fs.mkdirSync(path.join(root, 'src'));
      fs.mkdirSync(path.join(root, 'dist/client/.vite'));
      const hidden = path.join(root, 'dist/client/.vite/manifest.json');
      fs.writeFileSync(hidden, '{"entry":"app.js"}');
      fs.writeFileSync(path.join(root, 'dist/client/app.js'), 'built asset');
      fs.writeFileSync(path.join(root, 'src/worker-entry.mjs'), 'entry');
      expect(() => verifyBrowserInputs(root, context)).toThrow();
      prepareBrowserInputs(root, context);
      expect(verifyBrowserInputs(root, context).sha).toBe(context.sha);
      fs.rmSync(path.dirname(hidden), { recursive: true });
      expect(() => verifyBrowserInputs(root, context)).toThrow('missing, changed or unexpected');
      fs.mkdirSync(path.dirname(hidden));
      fs.writeFileSync(hidden, '{"entry":"app.js"}');
      expect(verifyBrowserInputs(root, context).files).toHaveProperty('dist/client/.vite/manifest.json');
      for (const changed of [{ ...context, runId: '124' }, { ...context, sha: 'b'.repeat(40) }]) expect(() => verifyBrowserInputs(root, changed)).toThrow('another run/head');
      const asset = path.join(root, 'dist/client/app.js');
      fs.writeFileSync(asset, 'changed');
      expect(() => verifyBrowserInputs(root, context)).toThrow('changed');
      fs.writeFileSync(asset, 'built asset');
      fs.writeFileSync(path.join(root, 'dist/client/extra'), 'extra');
      expect(() => verifyBrowserInputs(root, context)).toThrow('unexpected');
      fs.rmSync(path.join(root, 'dist/client/extra'));
      fs.writeFileSync(asset, '');
      expect(() => verifyBrowserInputs(root, context)).toThrow('Invalid');
      fs.rmSync(asset);
      fs.symlinkSync(path.join(root, 'src/worker-entry.mjs'), asset);
      expect(() => verifyBrowserInputs(root, context)).toThrow('symlink');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('preserves nonzero acceptance exit codes and marks later stages not-run', async () => {
    const id = 'acceptance';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wg-stage-failure-'));
    try {
      const report = await runDiagnosticCommands({ cwd: root, emitAnnotations: false, commands: [
        { id, label: id, file: process.execPath, args: ['-e', 'process.exit(7)'] },
        { id: 'later', label: 'later', file: process.execPath, args: ['-e', 'throw Error("must not run")'] },
      ] });
      expect(report.failure?.exitCode).toBe(7);
      expect(report.stages).toEqual([
        { id, label: id, status: 'failed', exitCode: 7 },
        { id: 'later', label: 'later', status: 'not-run', exitCode: null },
      ]);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
});
