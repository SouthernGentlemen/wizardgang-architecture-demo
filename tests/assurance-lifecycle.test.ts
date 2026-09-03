import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const lifecyclePath = 'assurance/lifecycle/records.json';
const registryPath = 'assurance/registry.json';
const baselineCommit = 'c2359f00fc3bac80bfbc2e82369a86f20e522f74';
let pinnedBaselineRoot = '';

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-133-lifecycle-'));
  cpSync(repositoryRoot, fixtureRoot, {
    recursive: true,
    filter(source) {
      const pathFromRoot = relative(repositoryRoot, source);
      if (!pathFromRoot) return true;
      return !pathFromRoot.split(sep).some((part) => ignoredFixtureParts.has(part));
    },
  });
  fixtureRoots.push(fixtureRoot);
  return fixtureRoot;
}

function gitOutput(args: string[]): string {
  const result = spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function materializePinnedBaseline(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-133-v014-baseline-'));
  const assurancePaths = gitOutput(['ls-tree', '-r', '--name-only', baselineCommit, 'assurance'])
    .split('\n')
    .filter((relativePath) => relativePath.endsWith('.json'));

  for (const relativePath of assurancePaths) {
    const absolutePath = join(fixtureRoot, relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, gitOutput(['show', `${baselineCommit}:${relativePath}`]));
  }
  return fixtureRoot;
}

function readJson<T = any>(fixtureRoot: string, relativePath: string): T {
  return JSON.parse(readFileSync(join(fixtureRoot, relativePath), 'utf8')) as T;
}

function writeJson(fixtureRoot: string, relativePath: string, value: unknown): void {
  const absolutePath = join(fixtureRoot, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function moveRegisteredDataset(fixtureRoot: string, datasetId: string, destination: string): void {
  const registry = readJson(fixtureRoot, registryPath);
  const dataset = registry.datasets.find((candidate: { id?: string }) => candidate.id === datasetId);
  expect(dataset).toBeDefined();

  const destinationPath = join(fixtureRoot, destination);
  mkdirSync(dirname(destinationPath), { recursive: true });
  renameSync(join(fixtureRoot, dataset.path), destinationPath);
  dataset.path = destination;
  writeJson(fixtureRoot, registryPath, registry);
}

function runLifecycle(fixtureRoot: string, previousRoot = repositoryRoot): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['scripts/validate-assurance-lifecycle.mjs'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ASSURANCE_BASELINE_DIR: pinnedBaselineRoot,
      ASSURANCE_PREVIOUS_DIR: previousRoot,
    },
  });
}

function expectRejected(result: SpawnSyncReturns<string>, messageFragment: string): void {
  expect(result.status).not.toBe(0);
  expect(`${result.stdout}\n${result.stderr}`).toContain(messageFragment);
}

const reviewed = {
  status: 'Reviewed',
  reviewedAt: '2026-09-03T04:06:18Z',
  reviewer: 'fixture-review',
  basis: 'Synthetic review metadata used only by lifecycle validator tests.',
};

beforeAll(() => {
  pinnedBaselineRoot = materializePinnedBaseline();
});

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

afterAll(() => {
  if (pinnedBaselineRoot) rmSync(pinnedBaselineRoot, { recursive: true, force: true });
});

describe('assurance record lifecycle controls', () => {
  it('decodes the actual immutable v0.14.0 assurance format as the Published baseline', () => {
    const baselineRegistry = readJson(pinnedBaselineRoot, registryPath);
    const baselineIso = readJson(pinnedBaselineRoot, 'assurance/compliance/iso-27001-2022.json');
    const baselineWcag = readJson(pinnedBaselineRoot, 'assurance/compliance/wcag-2.2.json');

    expect(baselineRegistry.lifecycle).toBeUndefined();
    expect(baselineRegistry.datasets.every((dataset: { recordCollection?: unknown }) => dataset.recordCollection === undefined)).toBe(true);
    expect(baselineIso.clauses).toBeDefined();
    expect(baselineIso.annexA).toBeDefined();
    expect(baselineWcag.partitions.length).toBeGreaterThan(0);

    const fixtureRoot = createFixture();
    const result = runLifecycle(fixtureRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Assurance lifecycle validation passed');
  });

  it('preserves identity when a registered dataset moves to a new path', () => {
    const fixtureRoot = createFixture();
    moveRegisteredDataset(fixtureRoot, 'claims', 'assurance/moved/claims.json');

    const result = runLifecycle(fixtureRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Assurance lifecycle validation passed');
  });

  it('rejects immutable identity changes hidden inside a registered dataset move', () => {
    const fixtureRoot = createFixture();
    const movedPath = 'assurance/moved/claims.json';
    moveRegisteredDataset(fixtureRoot, 'claims', movedPath);

    const claims = readJson(fixtureRoot, movedPath);
    const target = claims.records.find((record: { id: string }) => record.id === 'CLM-GOV-001');
    expect(target).toBeDefined();
    target.title = `${target.title} changed identity`;
    writeJson(fixtureRoot, movedPath, claims);

    expectRejected(runLifecycle(fixtureRoot), 'immutable public ID identity changed');
  });

  it('rejects registry removal that would hide previously published records', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, registryPath);
    registry.datasets = registry.datasets.filter((dataset: { id?: string }) => dataset.id !== 'claims');
    writeJson(fixtureRoot, registryPath, registry);

    expectRejected(runLifecycle(fixtureRoot), 'silent deletion');
  });

  it('fails closed when a historical registry declares a record dataset that cannot be read', () => {
    const fixtureRoot = createFixture();
    const previousRoot = createFixture();
    const registry = readJson(previousRoot, registryPath);
    const claims = registry.datasets.find((dataset: { id?: string }) => dataset.id === 'claims');
    expect(claims).toBeDefined();
    claims.path = 'assurance/claims/missing.json';
    writeJson(previousRoot, registryPath, registry);

    expectRejected(
      runLifecycle(fixtureRoot, previousRoot),
      'unable to read registered assurance resource assurance/claims/missing.json',
    );
  });

  it('treats legacy claim framework aliases as the same immutable identity', () => {
    const fixtureRoot = createFixture();
    const previousRoot = createFixture();
    const claims = readJson(previousRoot, 'assurance/claims/claims.json');
    const target = claims.records.find((record: { id: string }) => record.id === 'CLM-GOV-001');
    expect(target).toBeDefined();
    target.frameworkReferences = [
      ...target.relationships.compliance.map((reference: string) => reference.replace('ISO42001-', 'ISO42001:')),
      'WCAG22:feedback-support',
    ];
    delete target.relationships;
    writeJson(previousRoot, 'assurance/claims/claims.json', claims);

    const result = runLifecycle(fixtureRoot, previousRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Assurance lifecycle validation passed');
  });

  it('rejects unsupported lifecycle states', () => {
    const fixtureRoot = createFixture();
    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.records.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Archived',
      disclosureReview: reviewed,
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);
    expectRejected(runLifecycle(fixtureRoot), 'unsupported lifecycle Archived');
  });

  it('rejects unreviewed public records even when lifecycle metadata exists', () => {
    const fixtureRoot = createFixture();
    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.records.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Draft',
      disclosureReview: { status: 'Pending' },
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);
    expectRejected(runLifecycle(fixtureRoot), 'requires disclosureReview.status Reviewed');
  });

  it('rejects Superseded records without supersededBy', () => {
    const fixtureRoot = createFixture();
    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.records.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Superseded',
      disclosureReview: reviewed,
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);
    expectRejected(runLifecycle(fixtureRoot), 'Superseded records require supersededBy');
  });

  it('rejects Withdrawn records without a withdrawal rationale', () => {
    const fixtureRoot = createFixture();
    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.records.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Withdrawn',
      disclosureReview: reviewed,
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);
    expectRejected(runLifecycle(fixtureRoot), 'Withdrawn records require withdrawalRationale');
  });

  it('rejects silent deletion of a previously published stable ID', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records = claims.records.filter((record: { id: string }) => record.id !== 'CLM-SEC-001');
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);
    expectRejected(runLifecycle(fixtureRoot), 'silent deletion');
  });

  it('accepts an explicit Withdrawn tombstone for a removed published record', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records = claims.records.filter((record: { id: string }) => record.id !== 'CLM-SEC-001');
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);

    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.retiredRecords.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Withdrawn',
      withdrawalRationale: 'The synthetic lifecycle fixture intentionally retires this published record.',
      disclosureReview: reviewed,
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);

    const result = runLifecycle(fixtureRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Assurance lifecycle validation passed');
  });

  it('accepts a genuinely new record with explicit lifecycle and disclosure metadata', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records.push({
      id: 'CLM-NEW-001',
      area: 'lifecycle-validation',
      title: 'New lifecycle-governed public claim',
    });
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);

    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.records.push({
      id: 'CLM-NEW-001',
      lifecycle: 'Draft',
      disclosureReview: reviewed,
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);

    const result = runLifecycle(fixtureRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Assurance lifecycle validation passed');
  });

  it('rejects reuse of an immutable published ID for a different identity', () => {
    const fixtureRoot = createFixture();
    const evidence = readJson(fixtureRoot, 'assurance/evidence/evidence.json');
    const target = evidence.records.find((record: { id: string }) => record.id === 'EVD-SRC-001');
    expect(target).toBeDefined();
    target.locator = { repositoryPath: 'SECURITY.md' };
    writeJson(fixtureRoot, 'assurance/evidence/evidence.json', evidence);
    expectRejected(runLifecycle(fixtureRoot), 'immutable public ID identity changed');
  });

  it('rejects sensitive detail added to a public assurance record', () => {
    const fixtureRoot = createFixture();
    const risks = readJson(fixtureRoot, 'assurance/risks/risks.json');
    risks.records[0].exploitDetails = 'Synthetic sensitive detail that must never enter the public registry.';
    writeJson(fixtureRoot, 'assurance/risks/risks.json', risks);
    expectRejected(runLifecycle(fixtureRoot), 'sensitive public field exploitDetails');
  });
});
