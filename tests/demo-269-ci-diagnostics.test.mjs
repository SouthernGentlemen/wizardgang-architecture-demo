import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDiagnosticCommands } from '../scripts/lib/ci-diagnostics.mjs';
import { runGeneratedArtifactParity } from '../scripts/validate-generated-artifacts.mjs';

const temporaryDirectories = [];

function temporaryGitRepository() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-269-ci-'));
  temporaryDirectories.push(directory);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: directory });
  execFileSync('git', ['config', 'user.email', 'ci-test@example.invalid'], { cwd: directory });
  execFileSync('git', ['config', 'user.name', 'CI test'], { cwd: directory });
  fs.writeFileSync(path.join(directory, 'tracked.txt'), 'baseline\n');
  execFileSync('git', ['add', 'tracked.txt'], { cwd: directory });
  execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: directory });
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('DEMO-269 CI diagnostics', () => {
  it('stops at the first failure and preserves the authoritative exit code', async () => {
    const cwd = temporaryGitRepository();
    const marker = path.join(cwd, 'should-not-exist');
    const report = await runDiagnosticCommands({
      cwd,
      diagnosticsDir: '.ci-diagnostics',
      commands: [
        { label: 'intentional failure', file: process.execPath, args: ['-e', "console.log('everything green'); process.exit(7)"] },
        { label: 'must not run', file: process.execPath, args: ['-e', `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'bad')`] },
      ],
      environment: { ...process.env, CI: 'true' },
      emitAnnotations: false,
    });
    expect(report.status).toBe('failure');
    expect(report.failure.exitCode).toBe(7);
    expect(report.commands).toHaveLength(1);
    expect(fs.existsSync(marker)).toBe(false);
    expect(fs.readFileSync(path.join(cwd, '.ci-diagnostics', 'validation.log'), 'utf8')).toContain('everything green');
  });

  it('redacts secret-like environment values from complete command output', async () => {
    const cwd = temporaryGitRepository();
    const secret = 'demo-269-secret-value';
    const report = await runDiagnosticCommands({
      cwd,
      diagnosticsDir: '.ci-diagnostics',
      commands: [{ label: 'secret output', file: process.execPath, args: ['-e', "console.log(process.env.DEMO_TEST_SECRET)"], env: { DEMO_TEST_SECRET: secret } }],
      environment: { ...process.env, CI: 'true' },
      emitAnnotations: false,
    });
    const log = fs.readFileSync(path.join(cwd, '.ci-diagnostics', 'validation.log'), 'utf8');
    expect(report.status).toBe('success');
    expect(log).toContain('***');
    expect(log).not.toContain(secret);
  });

  it('reports generated drift, proves the second pass, and bounds the diff', () => {
    const cwd = temporaryGitRepository();
    fs.writeFileSync(path.join(cwd, 'input.txt'), `${'new line\n'.repeat(12_000)}`);
    fs.writeFileSync(path.join(cwd, 'output.txt'), 'old line\n');
    execFileSync('git', ['add', 'input.txt', 'output.txt'], { cwd });
    execFileSync('git', ['commit', '-qm', 'generated baseline'], { cwd });
    const definition = {
      id: 'test-generated-output',
      command: [process.execPath, ['-e', "require('node:fs').copyFileSync('input.txt', 'output.txt')"]],
      inputs: ['input.txt'],
      outputs: ['output.txt'],
    };
    const report = runGeneratedArtifactParity({ cwd, diagnosticsDirectory: '.ci-diagnostics', definitions: [definition] });
    const diff = fs.readFileSync(path.join(cwd, '.ci-diagnostics', 'generated-artifact.diff'), 'utf8');
    expect(report.status).toBe('failure');
    expect(report.failures[0].firstChanged).toEqual(['output.txt']);
    expect(report.failures[0].secondChanged).toEqual([]);
    expect(report.definitions[0].idempotent).toBe(true);
    expect(diff).toContain('diagnostic output truncated');
    expect(diff.length).toBeLessThan(33_500);
  });
});
