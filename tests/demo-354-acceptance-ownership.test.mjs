import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  commandSequence,
  createCiValidationCommands,
  npmRunName,
  npmRunSequence,
} from '../scripts/lib/acceptance-plan.ts';

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const checkCommands = commandSequence(packageJson.scripts.check);
const checkRuns = npmRunSequence(packageJson.scripts.check);
const ciCommands = createCiValidationCommands({
  nodeExecutable: 'node',
  npmExecutable: 'npm',
  checkEnvironment: { WG_LOCAL_D1_PERSIST_TO: '/tmp/demo-354-d1' },
});
const ciRuns = ciCommands.map(npmRunName).filter(Boolean);

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
  it.each(REQUIRED_CHECK_OWNERS)('%s has exactly one check owner and no direct CI duplicate', (_label, run) => {
    expect(checkRuns.filter((candidate) => candidate === run)).toHaveLength(1);
    expect(ciRuns.filter((candidate) => candidate === run)).toHaveLength(0);
  });

  it('keeps the CI-only command plan structural and ordered', () => {
    expect(ciCommands.map(({ id }) => id)).toEqual([
      'toolchain',
      'install',
      'check',
      'dependency-advisories',
      'patch-whitespace',
    ]);
    expect(ciRuns).toEqual([
      'check',
      'security:dependency-advisories',
      'validate:patch-whitespace',
    ]);
    expect(ciCommands.find(({ id }) => id === 'check')?.env).toEqual({
      WG_LOCAL_D1_PERSIST_TO: '/tmp/demo-354-d1',
    });
  });

  it('keeps network, provider-authenticated, and deployment operations outside check', () => {
    for (const run of ['security:dependency-advisories', 'validate:patch-whitespace', 'deploy', 'provision:worker-secret']) {
      expect(checkRuns).not.toContain(run);
    }
    expect(checkCommands.some((command) => command.includes('--live'))).toBe(false);
    expect(ciRuns).not.toContain('deploy');
    expect(ciRuns).not.toContain('provision:worker-secret');
    expect(packageJson.scripts['security:dependency-advisories']).toBe('npm audit --audit-level=high');
    expect(packageJson.scripts['validate:patch-whitespace']).toBe('node scripts/validate-patch-whitespace.mjs');
  });

  it('keeps build and browser ownership nested under their check gates', () => {
    expect(npmRunSequence(packageJson.scripts.build)).toEqual(['build:client', 'build:worker']);
    expect(packageJson.scripts['build:client']).toBe('npm run generate:assets');
    expect(commandSequence(packageJson.scripts['build:worker'])).toEqual([
      'wrangler deploy --dry-run --outdir dist/worker',
      'npm run validate:worker-bundle',
    ]);
    expect(npmRunSequence(packageJson.scripts['test:site-accessibility'])).toEqual(['verify:chromium']);
    expect(commandSequence(packageJson.scripts['test:site-accessibility'])).toContain(
      'node scripts/run-site-accessibility-audits.mjs',
    );
    const runner = fs.readFileSync(path.join(process.cwd(), 'scripts', 'run-site-accessibility-audits.mjs'), 'utf8');
    expect(runner.match(/scripts\/site-browser-audit\.mjs/g) ?? []).toHaveLength(1);
    expect(runner).not.toContain('demo-289-site-evaluation');
  });

  it('runs static accessibility and localization once through the full Vitest suite while retaining focused commands', () => {
    expect(checkRuns.filter((run) => run === 'test')).toHaveLength(1);
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
    expect(checkRuns.filter((run) => run === 'validate:generated-artifacts')).toHaveLength(1);
    expect(checkRuns.filter((run) => run === 'test')).toHaveLength(1);
    expect(checkRuns).not.toContain('validate:routes');
    expect(packageJson.scripts['generate:routes']).toBe('ROUTE_ARTIFACTS_WRITE=1 vitest run tests/route-artifacts.test.ts');
    expect(packageJson.scripts['validate:routes']).toBe('vitest run tests/route-artifacts.test.ts');
    expect(packageJson.scripts.test).toBe('vitest run');
  });

  it('does not restore retired standalone asset validation to check', () => {
    expect(checkRuns).not.toContain('validate:assets');
  });
});
