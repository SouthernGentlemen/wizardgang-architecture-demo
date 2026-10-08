import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  commandSequence,
  createCiValidationCommands,
  expandedNpmRunSequence,
  npmRunName,
  npmRunSequence,
} from '../scripts/lib/acceptance-plan.ts';

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const checkCommands = commandSequence(packageJson.scripts.check);
const checkRuns = npmRunSequence(packageJson.scripts.check);
const expandedCheckRuns: string[] = expandedNpmRunSequence(packageJson.scripts, 'check');
const ciCommands = createCiValidationCommands({
  nodeExecutable: 'node',
  npmExecutable: 'npm',
  checkEnvironment: { WG_LOCAL_D1_PERSIST_TO: '/tmp/demo-354-d1' },
});
const ciRuns = ciCommands.map(npmRunName).filter((name): name is string => name !== null);
const expandedCiRuns: string[] = ciRuns.flatMap((name) => expandedNpmRunSequence(packageJson.scripts, name));
const ciWorkflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');

const REQUIRED_CHECK_OWNERS = [
  ['generated-artifact parity', 'validate:generated-artifacts'],
  ['clean local migrations', 'validate:migrations'],
  ['production build', 'build'],
  ['scaffold validation', 'validate:scaffold'],
  ['controlled history', 'validate:history'],
  ['active-plan validation', 'validate:implementation-plan'],
  ['Worker secret names', 'validate:worker-secrets'],
  ['checked-in repository settings', 'validate:repository-settings'],
  ['repository baseline', 'validate:repository-baseline'],
  ['React presentation', 'validate:react-presentation'],
  ['stylesheet classes', 'validate:stylesheet-classes'],
  ['lint', 'lint'],
  ['typecheck', 'typecheck'],
  ['Chromium browser audit', 'test:site-accessibility'],
  ['test suite', 'test'],
  ['contracts', 'validate:contracts'],
  ['locales', 'validate:locales'],
  ['security', 'validate:security'],
  ['governance', 'validate:governance'],
  ['documentation', 'validate:documentation'],
  ['assurance', 'validate:assurance'],
];

describe('DEMO-354 acceptance gate ownership', () => {
  it.each(REQUIRED_CHECK_OWNERS)('%s has exactly one expanded CI execution owner', (_label, run) => {
    expect(expandedCheckRuns.filter((candidate) => candidate === run)).toHaveLength(1);
    expect(expandedCiRuns.filter((candidate) => candidate === run)).toHaveLength(1);
    expect(ciRuns).not.toContain(run);
  });

  it('detects duplicate nested acceptance owners instead of freezing one command sequence', () => {
    for (const name of new Set(expandedCheckRuns)) {
      expect(expandedCheckRuns.filter((candidate) => candidate === name), name).toHaveLength(1);
    }
    expect(expandedCiRuns.filter((name) => name === 'check')).toHaveLength(1);
    expect(expandedCiRuns.filter((name) => name === 'validate:patch-whitespace')).toHaveLength(1);
    expect(expandedCiRuns.filter((name) => name === 'validate:generated-artifacts')).toHaveLength(1);
    expect(expandedCiRuns.filter((name) => name === 'validate:assurance-documentation')).toHaveLength(1);
    expect(expandedCiRuns.filter((name) => name === 'validate:worker-secrets')).toHaveLength(1);
  });

  it('keeps separate CI toolchain, installation, check and committed-patch validation gates', () => {
    for (const id of ['toolchain', 'install', 'check', 'patch-whitespace']) {
      expect(ciCommands.filter((command) => command.id === id), id).toHaveLength(1);
    }
    const index = (id: string) => ciCommands.findIndex((command) => command.id === id);
    expect(index('toolchain')).toBeLessThan(index('install'));
    expect(index('install')).toBeLessThan(index('check'));
    expect(index('check')).toBeLessThan(index('patch-whitespace'));
    expect(ciRuns.filter((run) => run === 'check')).toHaveLength(1);
    expect(ciRuns.filter((run) => run === 'validate:patch-whitespace')).toHaveLength(1);
    expect(ciRuns).not.toContain('security:dependency-advisories');
    expect(ciCommands.find(({ id }) => id === 'check')?.env).toEqual({
      WG_LOCAL_D1_PERSIST_TO: '/tmp/demo-354-d1',
    });
    const securityJob = ciWorkflow.split('\n  security:\n')[1]?.split('\n  secrets:\n')[0] ?? '';
    expect(securityJob.match(/run: npm run audit:dependencies/g) ?? []).toHaveLength(1);
  });

  it('fails expanded ownership inspection for missing or cyclic npm scripts', () => {
    expect(() => expandedNpmRunSequence({ check: 'npm run missing' }, 'check')).toThrow('Missing npm script owner: missing');
    expect(() => expandedNpmRunSequence({ check: 'npm run build', build: 'npm run check' }, 'check')).toThrow('Cyclic npm script ownership');
  });

  it('keeps network, provider-authenticated, and deployment operations outside check', () => {
    for (const run of ['security:dependency-advisories', 'validate:patch-whitespace', 'deploy', 'provision:worker-secret']) {
      expect(checkRuns).not.toContain(run);
    }
    expect(checkCommands.some((command) => command.includes('--live'))).toBe(false);
    expect(ciRuns).not.toContain('deploy');
    expect(ciRuns).not.toContain('provision:worker-secret');
    expect(packageJson.scripts['security:dependency-advisories']).toBe('npm audit --audit-level=high');
    expect(packageJson.scripts['audit:dependencies']).toBe('npm run security:dependency-advisories');
    expect(packageJson.scripts['validate:patch-whitespace']).toBe('node scripts/validate-patch-whitespace.ts');
  });

  it('keeps build and browser ownership nested under their check gates', () => {
    const buildRuns = expandedNpmRunSequence(packageJson.scripts, 'build');
    for (const run of ['build:client', 'generate:assets', 'build:worker', 'validate:worker-bundle']) {
      expect(buildRuns.filter((candidate) => candidate === run), run).toHaveLength(1);
    }
    expect(packageJson.scripts['build:client']).toBe('npm run generate:assets');
    expect(commandSequence(packageJson.scripts['build:worker'])).toEqual([
      'node scripts/generate-worker-entry.ts',
      'wrangler deploy --dry-run --outdir dist/worker',
      'npm run validate:worker-bundle',
    ]);
    expect(expandedNpmRunSequence(packageJson.scripts, 'test:site-accessibility').filter((run) => run === 'verify:chromium')).toHaveLength(1);
    expect(commandSequence(packageJson.scripts['test:site-accessibility'])).toContain(
      'node scripts/run-site-accessibility-audits.ts',
    );
    const runner = fs.readFileSync(path.join(process.cwd(), 'scripts', 'run-site-accessibility-audits.ts'), 'utf8');
    expect(runner.match(/scripts\/site-browser-audit\.ts/g) ?? []).toHaveLength(1);
    expect(runner).not.toContain('demo-289-site-evaluation');
  });

  it('runs static accessibility and localization once through the full Vitest suite while retaining focused commands', () => {
    expect(expandedCheckRuns.filter((run) => run === 'test')).toHaveLength(1);
    expect(checkRuns).not.toContain('validate:site-accessibility');
    expect(checkRuns).not.toContain('validate:site-i18n');
    expect(packageJson.scripts.test).toBe('vitest run');
    expect(packageJson.scripts['validate:site-accessibility']).toBe(
      'vitest run tests/site-accessibility-i18n.test.ts -t "site-wide accessibility"',
    );
    expect(packageJson.scripts['validate:site-i18n']).toBe(
      'vitest run tests/site-accessibility-i18n.test.ts -t "site-wide localization"',
    );
  });

  it('keeps route artifact coverage in generator parity and the full suite without a standalone check duplicate', () => {
    expect(expandedCheckRuns.filter((run) => run === 'validate:generated-artifacts')).toHaveLength(1);
    expect(expandedCheckRuns.filter((run) => run === 'test')).toHaveLength(1);
    expect(checkRuns).not.toContain('validate:routes');
    expect(packageJson.scripts['generate:routes']).toBe('ROUTE_ARTIFACTS_WRITE=1 vitest run tests/route-artifacts.test.ts');
    expect(packageJson.scripts['validate:routes']).toBe('vitest run tests/route-artifacts.test.ts');
    expect(packageJson.scripts.test).toBe('vitest run');
  });

  it('does not restore retired standalone asset validation to check', () => {
    expect(expandedCheckRuns).not.toContain('validate:assets');
  });
});
