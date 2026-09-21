import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDiagnosticCommands } from '../scripts/lib/ci-diagnostics.mjs';
import { runGeneratedArtifactParity } from '../scripts/validate-generated-artifacts.mjs';
import { migrationArguments, runCleanLocalMigrations } from '../scripts/validate-migrations.mjs';

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
      commands: [{ label: 'secret output', file: process.execPath, args: ['-e', "process.stdout.write(process.env.DEMO_TEST_SECRET.slice(0, 8)); setTimeout(()=>console.log(process.env.DEMO_TEST_SECRET.slice(8)), 25)"], env: { DEMO_TEST_SECRET: secret } }],
      environment: { ...process.env, CI: 'true' },
      emitAnnotations: false,
    });
    const log = fs.readFileSync(path.join(cwd, '.ci-diagnostics', 'validation.log'), 'utf8');
    expect(report.status).toBe('success');
    expect(log).toContain('***');
    expect(log).not.toContain(secret);
  });

  it('streams complete redacted lines before the command exits', async () => {
    const cwd = temporaryGitRepository();
    const reportPromise = runDiagnosticCommands({
      cwd,
      diagnosticsDir: '.ci-diagnostics',
      commands: [{ label: 'stream output', file: process.execPath, args: ['-e', "console.log('progress visible'); setTimeout(()=>console.log('complete'), 300)"] }],
      environment: { ...process.env, CI: 'true' },
      emitAnnotations: false,
    });
    const logPath = path.join(cwd, '.ci-diagnostics', 'validation.log');
    for (let attempt = 0; attempt < 20 && !fs.readFileSync(logPath, 'utf8').includes('progress visible'); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    expect(fs.readFileSync(logPath, 'utf8')).toContain('progress visible');
    const report = await reportPromise;
    expect(report.status).toBe('success');
    expect(fs.readFileSync(logPath, 'utf8')).toContain('complete');
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
  it('owns generated-artifact parity through the canonical check command', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const checkCommands = packageJson.scripts.check.split('&&').map((command) => command.trim());
    const ciValidation = fs.readFileSync(path.join(process.cwd(), 'scripts/ci-validation.mjs'), 'utf8');

    expect(checkCommands.filter((command) => command === 'npm run validate:generated-artifacts')).toHaveLength(1);
    expect(ciValidation).toContain("args: ['run', 'check']");
    expect(ciValidation).not.toContain("args: ['run', 'validate:generated-artifacts']");
  });

  it('owns clean-local migration proof through the canonical check command', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const checkCommands = packageJson.scripts.check.split('&&').map((command) => command.trim());
    const ciValidation = fs.readFileSync(path.join(process.cwd(), 'scripts/ci-validation.mjs'), 'utf8');

    expect(packageJson.scripts['validate:migrations']).toBe('node scripts/validate-migrations.mjs');
    expect(checkCommands.filter((command) => command === 'npm run validate:migrations')).toHaveLength(1);
    expect(ciValidation).toContain("args: ['run', 'check']");
    expect(ciValidation).not.toContain("args: ['run', 'validate:migrations']");
  });

  it('uses fresh disposable local persistence for every D1 migration validation', () => {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-349-migrations-'));
    temporaryDirectories.push(temporaryRoot);
    const invocations = [];
    const run = (file, args, options) => {
      const persistIndex = args.indexOf('--persist-to');
      const persistenceDirectory = args[persistIndex + 1];
      invocations.push({ file, args, options, persistenceDirectory });
      fs.writeFileSync(path.join(persistenceDirectory, 'proof.txt'), 'isolated');
      return { status: 0 };
    };

    expect(runCleanLocalMigrations({ temporaryRoot, run })).toBe(0);
    expect(runCleanLocalMigrations({ temporaryRoot, run })).toBe(0);
    expect(invocations).toHaveLength(2);
    expect(new Set(invocations.map(({ persistenceDirectory }) => persistenceDirectory)).size).toBe(2);

    for (const invocation of invocations) {
      expect(invocation.args).toEqual(migrationArguments(invocation.persistenceDirectory));
      expect(invocation.args).toContain('--local');
      expect(invocation.args).not.toContain('--remote');
      expect(invocation.options.stdio).toBe('inherit');
      expect(fs.existsSync(invocation.persistenceDirectory)).toBe(false);
    }
  });

  it('shares one isolated migrated D1 state only across later CI browser consumers', () => {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-349-shared-migrations-'));
    temporaryDirectories.push(temporaryRoot);
    const persistenceDirectory = fs.mkdtempSync(path.join(temporaryRoot, 'shared-'));
    const run = (_file, args) => {
      expect(args).toEqual(migrationArguments(persistenceDirectory));
      fs.writeFileSync(path.join(persistenceDirectory, 'migration-proof.txt'), 'ready');
      return { status: 0 };
    };

    expect(runCleanLocalMigrations({ persistenceDirectory, run })).toBe(0);
    expect(fs.readFileSync(path.join(persistenceDirectory, 'migration-proof.txt'), 'utf8')).toBe('ready');

    const ciValidation = fs.readFileSync(path.join(process.cwd(), 'scripts/ci-validation.mjs'), 'utf8');
    expect(ciValidation.match(/env: localD1Environment/g)).toHaveLength(2);
    for (const script of ['site-browser-audit.mjs', 'demo-268-rest-browser-audit.mjs', 'demo-289-site-evaluation.mjs']) {
      const source = fs.readFileSync(path.join(process.cwd(), 'scripts', script), 'utf8');
      expect(source).toContain('process.env.WG_LOCAL_D1_PERSIST_TO');
      expect(source).toContain("'--persist-to'");
    }
  });

  it('preserves a migration failure status and still removes disposable state', () => {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-349-migrations-failure-'));
    temporaryDirectories.push(temporaryRoot);
    let persistenceDirectory;

    const status = runCleanLocalMigrations({
      temporaryRoot,
      run: (_file, args) => {
        persistenceDirectory = args[args.indexOf('--persist-to') + 1];
        return { status: 7 };
      },
    });

    expect(status).toBe(7);
    expect(fs.existsSync(persistenceDirectory)).toBe(false);
  });

});
