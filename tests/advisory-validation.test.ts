import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const validationNow = '2026-09-03T03:59:00Z';

function createFixtureRoot(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-131-advisories-'));
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

function readJson<T = any>(root: string, relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  writeFileSync(join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function installAdvisoryFixture(root: string, fixtureName: string): any {
  const fixture = readJson(repositoryRoot, `tests/fixtures/assurance/advisories/${fixtureName}.json`);
  writeJson(root, 'assurance/advisories/advisories.json', fixture);
  return fixture;
}

function run(root: string, script: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ASSURANCE_VALIDATION_NOW: validationNow },
  });
}

function expectPassed(result: SpawnSyncReturns<string>): void {
  expect(`${result.stdout}\n${result.stderr}`).toBeTruthy();
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
}

function expectRejected(result: SpawnSyncReturns<string>, messageFragment: string): void {
  expect(result.status).not.toBe(0);
  expect(`${result.stdout}\n${result.stderr}`).toContain(messageFragment);
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('canonical advisory validation', () => {
  it('accepts an explicit empty-state fixture without making emptiness a canonical invariant', () => {
    const root = createFixtureRoot();
    installAdvisoryFixture(root, 'empty');
    expectPassed(run(root, 'scripts/validate-advisories.mjs'));
  });

  it('accepts a nonempty canonical-shape advisory fixture through schema, semantic, and integrity validation', () => {
    const root = createFixtureRoot();
    installAdvisoryFixture(root, 'valid-nonempty');
    expectPassed(run(root, 'scripts/generate-assurance-runtime-binding.mjs'));
    expectPassed(run(root, 'scripts/validate-assurance-registry.mjs'));
    expectPassed(run(root, 'scripts/validate-advisories.mjs'));
    expectPassed(run(root, 'scripts/validate-assurance-integrity.mjs'));
  });

  it('rejects unresolved canonical evidence relationships', () => {
    const root = createFixtureRoot();
    const advisories = installAdvisoryFixture(root, 'valid-nonempty');
    advisories.records[0].relationships.evidence = ['EVD-FAKE-999'];
    writeJson(root, 'assurance/advisories/advisories.json', advisories);
    expectRejected(run(root, 'scripts/validate-advisories.mjs'), 'unresolved evidence relationship EVD-FAKE-999');
  });

  it('rejects incident relationships that do not resolve to established incident records', () => {
    const root = createFixtureRoot();
    const advisories = installAdvisoryFixture(root, 'valid-nonempty');
    advisories.records[0].relationships.incidents = ['INC-999'];
    writeJson(root, 'assurance/advisories/advisories.json', advisories);
    expectRejected(run(root, 'scripts/validate-advisories.mjs'), 'unresolved incidents relationship INC-999');
  });

  it('rejects fixed releases without controlled release provenance', () => {
    const root = createFixtureRoot();
    const advisories = installAdvisoryFixture(root, 'valid-nonempty');
    advisories.records[0].fixedReleases = ['v9.9.9'];
    writeJson(root, 'assurance/advisories/advisories.json', advisories);
    expectRejected(run(root, 'scripts/validate-advisories.mjs'), 'fixed release v9.9.9 has no controlled release record');
  });

  it('rejects unsafe public advisory fields through the registered schema', () => {
    const root = createFixtureRoot();
    const advisories = installAdvisoryFixture(root, 'valid-nonempty');
    advisories.records[0].reporterIdentity = 'fixture-only';
    writeJson(root, 'assurance/advisories/advisories.json', advisories);
    expectRejected(run(root, 'scripts/validate-advisories.mjs'), 'additional property reporterIdentity is not allowed');
  });

  it('rejects the retired incidentLinks and evidence advisory contract', () => {
    const root = createFixtureRoot();
    const advisories = installAdvisoryFixture(root, 'valid-nonempty');
    const record = advisories.records[0];
    record.incidentLinks = [];
    record.evidence = record.relationships.evidence;
    delete record.relationships;
    writeJson(root, 'assurance/advisories/advisories.json', advisories);
    const result = run(root, 'scripts/validate-advisories.mjs');
    expectRejected(result, 'additional property incidentLinks is not allowed');
    expect(`${result.stdout}\n${result.stderr}`).toContain('must contain required property relationships');
  });
});
