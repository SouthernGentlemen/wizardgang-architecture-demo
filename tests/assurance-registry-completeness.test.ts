import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-126-registry-'));
  cpSync(repositoryRoot, fixtureRoot, {
    recursive: true,
    filter(source) {
      const pathFromRoot = relative(repositoryRoot, source);
      if (!pathFromRoot) return true;
      return !pathFromRoot.split(sep).some((part) => ignoredFixtureParts.has(part));
    },
  });
  symlinkSync(
    join(repositoryRoot, 'node_modules'),
    join(fixtureRoot, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  fixtureRoots.push(fixtureRoot);
  return fixtureRoot;
}

function readJson<T = any>(root: string, relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  writeFileSync(join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function run(root: string, script: string, args: string[] = []): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
}

function runNpm(root: string, args: string[]): SpawnSyncReturns<string> {
  return spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: root, encoding: 'utf8' });
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

function expectRejected(result: SpawnSyncReturns<string>, message: string): void {
  expect(result.status).not.toBe(0);
  expect(output(result)).toContain(message);
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('assurance registry completeness and schema enforcement', () => {
  it('registers every canonical assurance JSON file and validates every registered dataset against its declared schema', () => {
    const result = run(repositoryRoot, 'scripts/validate-assurance-registry.mjs');
    expect(result.status, output(result)).toBe(0);
    expect(result.stdout).toContain('all canonical assurance JSON registered and schema-valid');
  });

  it('reports dataset path and schema violation for invalid registered structured data', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records[0].id = 'invalid-claim-id';
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);
    const result = run(fixtureRoot, 'scripts/validate-assurance-registry.mjs');
    expectRejected(result, 'assurance/claims/claims.json: $.records[0].id must match pattern');
    expect(output(result)).toContain('contracts/assurance/claim.schema.json');
  });

  it('rejects duplicate registry identity and duplicate registered paths', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    registry.datasets[1].id = registry.datasets[0].id;
    registry.datasets[1].path = registry.datasets[0].path;
    writeJson(fixtureRoot, 'assurance/registry.json', registry);
    const result = run(fixtureRoot, 'scripts/validate-assurance-registry.mjs');
    expectRejected(result, 'duplicate dataset identity');
    expect(output(result)).toContain('duplicate registered path');
  });

  it('rejects private assurance resource classification in the public repository', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const risks = registry.datasets.find((dataset: any) => dataset.kind === 'risks');
    risks.visibility = 'private';
    writeJson(fixtureRoot, 'assurance/registry.json', registry);
    const result = run(fixtureRoot, 'scripts/validate-assurance-registry.mjs');
    expectRejected(result, 'risks uses unsupported assurance visibility private');
  });

  it('rejects an unregistered canonical assurance dataset', () => {
    const fixtureRoot = createFixture();
    writeJson(fixtureRoot, 'assurance/unregistered-demo126.json', { schemaVersion: 1, records: [] });
    expectRejected(run(fixtureRoot, 'scripts/validate-assurance-registry.mjs'), 'unregistered canonical assurance file assurance/unregistered-demo126.json');
  });

  it('rejects missing registered files and schemas', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const evidence = registry.datasets.find((dataset: any) => dataset.kind === 'evidence');
    unlinkSync(join(fixtureRoot, evidence.path));
    evidence.schema = 'contracts/assurance/missing-demo126.schema.json';
    writeJson(fixtureRoot, 'assurance/registry.json', registry);
    const result = run(fixtureRoot, 'scripts/validate-assurance-registry.mjs');
    expectRejected(result, 'registered dataset is missing');
    expect(output(result)).toContain('registered schema is missing');
  });

  it('keeps the generated Worker runtime import binding mechanically aligned with the registry', () => {
    const current = run(repositoryRoot, 'scripts/generate-assurance-runtime-binding.mjs', ['--check']);
    expect(current.status, output(current)).toBe(0);

    const fixtureRoot = createFixture();
    const bindingPath = join(fixtureRoot, 'src/assurance/generated/registry-bindings.ts');
    writeFileSync(bindingPath, `${readFileSync(bindingPath, 'utf8')}\n// drift\n`);
    expectRejected(run(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs', ['--check']), 'generated runtime import binding is stale');
  });

  it('loads relocated lifecycle control-plane data through the registry binding without counting it as assurance records', () => {
    const fixtureRoot = createFixture();
    const registryPath = 'assurance/registry.json';
    const registry = readJson(fixtureRoot, registryPath);
    const originalLifecyclePath = registry.lifecycle.path as string;
    const movedLifecyclePath = 'assurance/lifecycle/relocated-records.json';
    renameSync(join(fixtureRoot, originalLifecyclePath), join(fixtureRoot, movedLifecyclePath));
    registry.lifecycle.path = movedLifecyclePath;
    writeJson(fixtureRoot, registryPath, registry);

    const generation = run(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs');
    expect(generation.status, output(generation)).toBe(0);

    const validation = run(fixtureRoot, 'scripts/validate-assurance-registry.mjs');
    expect(validation.status, output(validation)).toBe(0);

    const publication = run(fixtureRoot, 'scripts/validate-assurance-publication.mjs');
    expect(publication.status, output(publication)).toBe(0);

    const build = runNpm(fixtureRoot, ['run', 'build']);
    expect(build.status, output(build)).toBe(0);

    const binding = readFileSync(join(fixtureRoot, 'src/assurance/generated/registry-bindings.ts'), 'utf8');
    expect(binding).toContain("../../../assurance/lifecycle/relocated-records.json");
    expect(binding).not.toContain("../../../assurance/lifecycle/records.json");

    const publicationSource = readFileSync(join(fixtureRoot, 'src/assurance/publication.ts'), 'utf8');
    expect(publicationSource).not.toContain('assurance/lifecycle/records.json');

    const snapshotResult = run(fixtureRoot, 'scripts/generate-assurance-snapshot.mjs', [
      '--tag', 'v0.14.0',
      '--commit', '0123456789abcdef0123456789abcdef01234567',
      '--generated-at', '2026-09-04T12:00:00Z',
    ]);
    expect(snapshotResult.status, output(snapshotResult)).toBe(0);
    const snapshot = JSON.parse(snapshotResult.stdout);
    expect(snapshot.recordCounts.byPath[movedLifecyclePath]).toBeUndefined();
    expect(snapshot.recordCounts.total).toBe(
      Object.values(snapshot.recordCounts.byPath).reduce((total: number, count) => total + Number(count), 0),
    );
  }, 15_000);

  it('requires exactly one lifecycle capability owner', () => {
    const missingRoot = createFixture();
    const missingRegistry = readJson(missingRoot, 'assurance/registry.json');
    missingRegistry.lifecycle.capabilities = ['runtime'];
    writeJson(missingRoot, 'assurance/registry.json', missingRegistry);
    expectRejected(
      run(missingRoot, 'scripts/generate-assurance-runtime-binding.mjs'),
      'expected exactly one lifecycle capability owner; found 0',
    );

    const ambiguousRoot = createFixture();
    const ambiguousRegistry = readJson(ambiguousRoot, 'assurance/registry.json');
    ambiguousRegistry.datasets[0].capabilities.push('lifecycle');
    writeJson(ambiguousRoot, 'assurance/registry.json', ambiguousRegistry);
    expectRejected(
      run(ambiguousRoot, 'scripts/generate-assurance-runtime-binding.mjs'),
      'expected exactly one lifecycle capability owner; found 2',
    );
  });

  it('builds release snapshots from registry discovery rather than a directory walk inventory', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const monitoring = registry.operations.find((resource: any) => resource.capabilities.includes('monitoring'));
    const movedPath = 'assurance/operations/monitoring-registry-test.json';
    renameSync(join(fixtureRoot, monitoring.path), join(fixtureRoot, movedPath));
    monitoring.path = movedPath;
    writeJson(fixtureRoot, 'assurance/registry.json', registry);

    const result = run(fixtureRoot, 'scripts/generate-assurance-snapshot.mjs', [
      '--tag', 'v0.14.0',
      '--commit', '0123456789abcdef0123456789abcdef01234567',
      '--generated-at', '2026-09-03T12:00:00Z',
    ]);
    expect(result.status, output(result)).toBe(0);
    const snapshot = JSON.parse(result.stdout);
    expect(snapshot.contentDigest.scope).toContain('registry-declared canonical dataset paths');
  });

  it('routes lifecycle and integrity validation through the shared registry discovery layer', () => {
    for (const script of ['scripts/validate-assurance-lifecycle.mjs', 'scripts/validate-assurance-integrity.mjs']) {
      const source = readFileSync(join(repositoryRoot, script), 'utf8');
      expect(source).toContain("from './lib/assurance-registry.mjs'");
      expect(source).not.toContain("'assurance/compliance/iso-42001-2023.json'");
      expect(source).not.toContain("'assurance/compliance/wcag-2.2/perceivable.json'");
    }
  });
});
