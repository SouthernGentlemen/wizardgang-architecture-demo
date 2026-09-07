import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  gitBlobShaForFile,
  LIFECYCLE_BASELINE_MEMBERSHIP_BLOB,
  LIFECYCLE_BASELINE_MEMBERSHIP_PATH,
} from '../scripts/generate-assurance-runtime-binding.mjs';

const repositoryRoot = process.cwd();
const repositoryGitDir = spawnSync('git', ['rev-parse', '--absolute-git-dir'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).stdout.trim();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const lifecyclePath = 'assurance/lifecycle/records.json';
const claimsPath = 'assurance/claims/claims.json';

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-155-lifecycle-'));
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

function runLifecycle(root: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['scripts/validate-assurance-lifecycle.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_DIR: repositoryGitDir,
      ASSURANCE_PREVIOUS_DIR: repositoryRoot,
    },
  });
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

function expectRejected(result: SpawnSyncReturns<string>, message: string): void {
  expect(result.status).not.toBe(0);
  expect(output(result)).toContain(message);
}

function approveClaimsRevision(root: string): void {
  const lifecycle = readJson(root, lifecyclePath);
  const revision = gitBlobShaForFile(root, claimsPath);
  if (!lifecycle.sourceApprovals.some((approval: any) => approval.resource === 'claims' && approval.revision === revision)) {
    lifecycle.sourceApprovals.push({
      id: `fixture-claims-${revision.slice(0, 12)}`,
      resource: 'claims',
      revision,
      reviewRef: 'review-demo155-current-sources',
    });
  }
  writeJson(root, lifecyclePath, lifecycle);
}

function removeClaim(root: string, id: string): void {
  const claims = readJson(root, claimsPath);
  claims.records = claims.records.filter((record: { id: string }) => record.id !== id);
  writeJson(root, claimsPath, claims);
  approveClaimsRevision(root);
}

function addNewClaim(root: string): void {
  const claims = readJson(root, claimsPath);
  const relationships = structuredClone(claims.records[0].relationships);
  claims.records.push({
    id: 'CLM-NEW-001',
    area: 'lifecycle-validation',
    title: 'New lifecycle-governed public claim',
    statement: 'Synthetic fixture proves new stable IDs cannot inherit historical disclosure authority.',
    posture: 'partial',
    relationships,
  });
  writeJson(root, claimsPath, claims);
  approveClaimsRevision(root);
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('normalized assurance lifecycle history', () => {
  it('validates the migrated current contract without legacy-format readers', () => {
    const result = runLifecycle(repositoryRoot);
    expect(result.status, output(result)).toBe(0);
    expect(result.stdout).toContain('frozen historical IDs verified through the normalized migration bridge');

    const historySource = readFileSync('scripts/lib/assurance-lifecycle-history.mjs', 'utf8');
    expect(historySource).not.toContain('LEGACY_V014');
    expect(historySource).not.toContain('decodeLegacyIso');
    expect(historySource).not.toContain('collectHistoricalAssuranceSnapshot');
  });

  it('keeps the one-time verified historical membership artifact byte-pinned', () => {
    expect(gitBlobShaForFile(repositoryRoot, LIFECYCLE_BASELINE_MEMBERSHIP_PATH))
      .toBe(LIFECYCLE_BASELINE_MEMBERSHIP_BLOB);
    const membership = readJson(repositoryRoot, LIFECYCLE_BASELINE_MEMBERSHIP_PATH);
    expect(membership.commit).toBe('c2359f00fc3bac80bfbc2e82369a86f20e522f74');
    expect(membership.recordIds.length).toBeGreaterThan(0);
  });

  it('fails closed when unchanged identity has changed source content without a new disclosure decision', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, claimsPath);
    claims.records[0].statement += ' Changed external content.';
    writeJson(fixtureRoot, claimsPath, claims);

    expectRejected(runLifecycle(fixtureRoot), 'has no disclosure approval for this exact content revision');

    approveClaimsRevision(fixtureRoot);
    const approved = runLifecycle(fixtureRoot);
    expect(approved.status, output(approved)).toBe(0);
  });

  it('does not let an unknown stable ID inherit baseline lifecycle or approval', () => {
    const fixtureRoot = createFixture();
    addNewClaim(fixtureRoot);
    expectRejected(runLifecycle(fixtureRoot), 'CLM-NEW-001: new public assurance record requires explicit lifecycle and disclosure-review metadata');

    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.records.push({
      id: 'CLM-NEW-001',
      lifecycle: 'Draft',
      reviewRef: 'review-demo155-current-sources',
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);
    const explicit = runLifecycle(fixtureRoot);
    expect(explicit.status, output(explicit)).toBe(0);
  });

  it('retains a withdrawn stable ID reservation instead of allowing silent deletion', () => {
    const fixtureRoot = createFixture();
    removeClaim(fixtureRoot, 'CLM-SEC-001');
    expectRejected(runLifecycle(fixtureRoot), 'CLM-SEC-001: silent deletion');

    const lifecycle = readJson(fixtureRoot, lifecyclePath);
    lifecycle.retiredRecords.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Withdrawn',
      reviewRef: 'review-v014-public-assurance',
      withdrawalRationale: 'Synthetic lifecycle fixture explicitly retires the historical identifier.',
    });
    writeJson(fixtureRoot, lifecyclePath, lifecycle);
    const retired = runLifecycle(fixtureRoot);
    expect(retired.status, output(retired)).toBe(0);
  });

  it('rejects reuse of a locked historical identity even after the new source revision is approved', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, claimsPath);
    claims.records[0].title = 'Different identity under reused stable ID';
    writeJson(fixtureRoot, claimsPath, claims);
    approveClaimsRevision(fixtureRoot);
    expectRejected(runLifecycle(fixtureRoot), 'CLM-SEC-001: immutable public ID identity changed');
  });

  it('rejects invalid retirement and non-reciprocal supersession', () => {
    const invalidRetirementRoot = createFixture();
    removeClaim(invalidRetirementRoot, 'CLM-SEC-001');
    const invalidRetirement = readJson(invalidRetirementRoot, lifecyclePath);
    invalidRetirement.retiredRecords.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Approved',
      reviewRef: 'review-v014-public-assurance',
    });
    writeJson(invalidRetirementRoot, lifecyclePath, invalidRetirement);
    expectRejected(runLifecycle(invalidRetirementRoot), 'retired record lifecycle must be Superseded or Withdrawn');

    const supersessionRoot = createFixture();
    removeClaim(supersessionRoot, 'CLM-SEC-001');
    const supersession = readJson(supersessionRoot, lifecyclePath);
    supersession.retiredRecords.push({
      id: 'CLM-SEC-001',
      lifecycle: 'Superseded',
      reviewRef: 'review-v014-public-assurance',
      supersededBy: ['CLM-SEC-002'],
    });
    writeJson(supersessionRoot, lifecyclePath, supersession);
    expectRejected(runLifecycle(supersessionRoot), 'supersededBy relationship to CLM-SEC-002 must be reciprocal via supersedes');
  });
});
