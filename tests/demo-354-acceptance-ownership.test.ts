import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  acceptedBuildOutputPaths,
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
  ['Worker build from accepted client', 'build:worker'],
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
    expect(expandedCiRuns.filter((name) => name === 'validate:assurance')).toHaveLength(1);
    expect(expandedCiRuns.filter((name) => name === 'validate:worker-secrets')).toHaveLength(1);
  });

  it('binds nested scaffold, documentation, and assurance predicates to their single current owners', () => {
    for (const retired of ['validate:scaffold', 'validate:documentation', 'validate:assurance-documentation']) {
      expect(expandedCheckRuns.filter((run) => run === retired), retired).toHaveLength(0);
      expect(expandedCiRuns.filter((run) => run === retired), retired).toHaveLength(0);
    }

    const baseline = fs.readFileSync(path.join(process.cwd(), 'scripts/validate-repository-baseline.ts'), 'utf8');
    const governance = fs.readFileSync(path.join(process.cwd(), 'scripts/validate-governance-metadata.ts'), 'utf8');
    const assurance = fs.readFileSync(path.join(process.cwd(), 'scripts/validate-assurance-suite.ts'), 'utf8');
    expect(baseline).toContain('validateScaffold(root).failures');
    expect(governance).toContain('runDocumentationValidation(root)');
    expect(packageJson.scripts['validate:assurance']).toBe('node scripts/validate-assurance-suite.ts');
    const owners = [
      'runAssuranceRegistryValidation',
      'runAssuranceRecordValidation',
      'runAdvisoryValidation',
      'runAssuranceProjectionValidation',
      'runAssuranceDocumentationValidation',
      'runIso27001Validation',
      'runIso42001Validation',
      'runWcagValidation',
      'runAssurancePublicationValidation',
      'runAssuranceLifecycleValidation',
      'runAssuranceIntegrityValidation',
      'runAssuranceOperationsValidation',
    ];
    for (const predicate of owners) {
      expect(assurance.includes(predicate), predicate).toBe(true);
    }
    expect((assurance.match(/^  \['/gm) ?? [])).toHaveLength(12);
    expect(expandedCheckRuns.filter((run) => run === 'validate:assurance')).toHaveLength(1);
  });

  it('exposes accepted same-head build output paths on the existing full-check owner only', () => {
    const check = ciCommands.find(({ id }) => id === 'check');
    expect(acceptedBuildOutputPaths).toEqual({
      clientAssets: 'dist/client',
      workerBundle: 'dist/worker',
      workerEntry: 'src/worker-entry.mjs',
    });
    expect(Object.isFrozen(acceptedBuildOutputPaths)).toBe(true);
    expect(check?.acceptedBuildOutputPaths).toBe(acceptedBuildOutputPaths);
    expect(ciCommands.filter((command) => 'acceptedBuildOutputPaths' in command)).toHaveLength(1);

    // A future browser job may transfer these ignored outputs from the *same validated head*.
    // This metadata does not add a build step, cache, upload or a second execution owner.
    expect(ciCommands.map(({ id }) => id)).toEqual(['toolchain', 'install', 'check', 'patch-whitespace']);
    expect(check).toMatchObject({ file: 'npm', args: ['run', 'check'] });
    expect(ciWorkflow).toContain('ci-diagnostics-'); // Existing failure diagnostics are retained.
    expect(ciWorkflow).not.toContain('name: accepted-build-outputs');
    expect(ciWorkflow).not.toMatch(/path:\s*(?:\.\/)?dist\//);
    expect(ciWorkflow).not.toContain('actions/cache');
    const paths = Object.values(acceptedBuildOutputPaths);
    expect(new Set(paths).size).toBe(paths.length);
    for (const output of paths) {
      expect(path.posix.isAbsolute(output)).toBe(false);
      expect(output.split('/')).not.toContain('..');
    }
    const ignored = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
    expect(ignored).toContain('dist/');
    expect(ignored).toContain('src/worker-entry.mjs');
    const wrangler = fs.readFileSync(path.join(process.cwd(), 'wrangler.jsonc'), 'utf8');
    expect(wrangler).toContain('"main": "src/worker-entry.mjs"');
    expect(wrangler).toContain('"directory": "./dist/client"');
    expect(commandSequence(packageJson.scripts['build:worker'])).toContain('wrangler deploy --dry-run --outdir dist/worker');
    expect(checkRuns.indexOf('validate:generated-artifacts')).toBeLessThan(checkRuns.indexOf('build:worker'));
    expect(checkRuns.indexOf('build:worker')).toBeLessThan(checkRuns.indexOf('test:site-accessibility'));
    expect(expandedCheckRuns.filter((run) => run === 'build:worker')).toHaveLength(1);
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
    const parityIndex = checkRuns.indexOf('validate:generated-artifacts');
    const workerBuildIndex = checkRuns.indexOf('build:worker');
    expect(parityIndex).toBeGreaterThan(-1);
    expect(workerBuildIndex).toBeGreaterThan(parityIndex);
    expect(checkRuns).not.toContain('build');
    expect(expandedCheckRuns).not.toContain('build:client');
    expect(expandedCheckRuns).not.toContain('generate:assets');
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

  it('hands the accepted two-pass client output to Worker compilation without another Vite build', () => {
    const flatten = (name: string, ancestors: string[] = []): string[] => {
      if (ancestors.includes(name)) throw new Error('Cyclic build script: ' + [...ancestors, name].join(' -> '));
      return commandSequence(packageJson.scripts[name]).flatMap((command) => {
        const nested = /^npm run ([A-Za-z0-9:_-]+)$/.exec(command);
        return nested ? flatten(nested[1], [...ancestors, name]) : [command];
      });
    };
    const accepted = flatten('check');
    // The parity owner runs both clean client passes before the sole Worker build.
    const runner = fs.readFileSync(path.join(process.cwd(), 'scripts/validate-generated-artifacts.ts'), 'utf8');
    expect(packageJson.scripts['validate:generated-artifacts']).toBe('node scripts/validate-generated-artifacts.ts');
    expect(runner.split('const first = runGenerator(definition, cwd)').length - 1).toBe(1);
    expect(runner.split('const second = runGenerator(definition, cwd)').length - 1).toBe(1);
    expect(runner.split("if (definition.id === 'assets') fs.rmSync(path.join(cwd, 'dist/client')").length - 1).toBe(2);
    expect(checkRuns.filter((run) => run === 'validate:generated-artifacts')).toHaveLength(1);
    expect(checkRuns.filter((run) => run === 'build:worker')).toHaveLength(1);
    expect(checkRuns).not.toContain('build:client');
    expect(checkRuns).not.toContain('generate:assets');
    const parity = 'node scripts/validate-generated-artifacts.ts';
    const entry = 'node scripts/generate-worker-entry.ts';
    const compile = 'wrangler deploy --dry-run --outdir dist/worker';
    const bundle = 'node scripts/validate-react-presentation.ts --worker-bundle';

    for (const command of [parity, entry, compile, bundle]) {
      expect(accepted.filter((candidate) => candidate === command), command).toHaveLength(1);
    }
    expect(accepted.indexOf(parity)).toBeLessThan(accepted.indexOf(entry));
    expect(accepted.indexOf(entry) + 1).toBe(accepted.indexOf(compile));
    expect(accepted.indexOf(compile) + 1).toBe(accepted.indexOf(bundle));
    expect(accepted.filter((command) => /\bvite\s+build\b/.test(command))).toEqual([]);

    // Standalone builds still produce a fresh client distribution before the same Worker chain.
    expect(packageJson.scripts.build).toBe('npm run build:client && npm run build:worker');
    expect(packageJson.scripts['build:client']).toBe('npm run generate:assets');
    expect(packageJson.scripts['generate:assets']).toBe('ASSET_MANIFEST_WRITE=1 vite build');
    const standalone = flatten('build');
    expect(standalone.filter((command) => /\bvite\s+build\b/.test(command))).toEqual([
      'ASSET_MANIFEST_WRITE=1 vite build',
    ]);
    expect(standalone.indexOf('ASSET_MANIFEST_WRITE=1 vite build')).toBeLessThan(standalone.indexOf(entry));
    expect(standalone.indexOf(entry) + 1).toBe(standalone.indexOf(compile));
    expect(standalone.indexOf(compile) + 1).toBe(standalone.indexOf(bundle));
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
    expect(packageJson.scripts['generate:routes']).toBe('node scripts/generate-route-manifest.ts');
    expect(packageJson.scripts['validate:routes']).toBe('vitest run tests/route-artifacts.test.ts');
    expect(packageJson.scripts.test).toBe('vitest run');
  });

});
