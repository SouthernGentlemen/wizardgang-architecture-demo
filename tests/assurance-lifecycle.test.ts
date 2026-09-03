import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const lifecyclePath = 'assurance/lifecycle/records.json';

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-123-lifecycle-'));
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

function readJson<T = any>(fixtureRoot: string, relativePath: string): T {
  return JSON.parse(readFileSync(join(fixtureRoot, relativePath), 'utf8')) as T;
}

function writeJson(fixtureRoot: string, relativePath: string, value: unknown): void {
  writeFileSync(join(fixtureRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function runLifecycle(fixtureRoot: string, previousRoot = repositoryRoot): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['scripts/validate-assurance-lifecycle.mjs'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ASSURANCE_BASELINE_DIR: repositoryRoot,
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

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('assurance record lifecycle controls', () => {
  it('accepts the released registry as a reviewed Published baseline', () => {
    const fixtureRoot = createFixture();
    const result = runLifecycle(fixtureRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Assurance lifecycle validation passed');
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
