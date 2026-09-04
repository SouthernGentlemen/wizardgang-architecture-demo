import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assuranceObservedState } from '../src/assurance/publication-policy.js';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const validationNow = '2026-09-03T03:59:00.000Z';

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-152-freshness-'));
  cpSync(repositoryRoot, fixtureRoot, { recursive: true, filter(source) {
    const pathFromRoot = relative(repositoryRoot, source);
    if (!pathFromRoot) return true;
    return !pathFromRoot.split(sep).some((part) => ignoredFixtureParts.has(part));
  } });
  fixtureRoots.push(fixtureRoot);
  return fixtureRoot;
}

function readEvidence(fixtureRoot: string): any {
  return JSON.parse(readFileSync(join(fixtureRoot, 'assurance/evidence/evidence.json'), 'utf8'));
}

function writeEvidence(fixtureRoot: string, evidence: unknown): void {
  writeFileSync(join(fixtureRoot, 'assurance/evidence/evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
}

function runIntegrity(fixtureRoot: string, clock = validationNow): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['scripts/validate-assurance-integrity.mjs'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: { ...process.env, ASSURANCE_VALIDATION_NOW: clock },
  });
}

function observationRecord(fixtureRoot: string, observedAt?: string, validUntil?: string): any {
  const evidence = readEvidence(fixtureRoot);
  const record = evidence.records[0];
  record.kind = 'observation';
  record.freshnessPolicy = 'observation-bound';
  delete record.observedAt;
  delete record.validUntil;
  if (observedAt !== undefined) record.observedAt = observedAt;
  if (validUntil !== undefined) record.validUntil = validUntil;
  writeEvidence(fixtureRoot, evidence);
  return record;
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('shared assurance observation-window validation', () => {
  it('accepts a current window using the same explicit clock as runtime presentation', () => {
    const fixtureRoot = createFixture();
    const record = observationRecord(
      fixtureRoot,
      '2026-09-03T03:00:00.000Z',
      '2026-09-03T05:00:00.000Z',
    );

    expect(assuranceObservedState(record, validationNow)?.state).toBe('current');
    expect(runIntegrity(fixtureRoot).status).toBe(0);
  });

  it('expires exactly at validUntil in runtime presentation and integrity validation', () => {
    const fixtureRoot = createFixture();
    const record = observationRecord(
      fixtureRoot,
      '2026-09-03T03:00:00.000Z',
      validationNow,
    );

    expect(assuranceObservedState(record, validationNow)?.state).toBe('expired');
    const result = runIntegrity(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(output(result)).toContain(`time-bound evidence is stale as of ${validationNow}`);
  });

  it.each([
    ['reversed', '2026-09-03T05:00:00.000Z', '2026-09-03T03:00:00.000Z', 'validUntil must be after observedAt'],
    ['zero-length', '2026-09-03T03:00:00.000Z', '2026-09-03T03:00:00.000Z', 'validUntil must be after observedAt'],
    ['missing validUntil', '2026-09-03T03:00:00.000Z', undefined, 'observation window must declare both observedAt and validUntil'],
    ['missing observedAt', undefined, '2026-09-03T05:00:00.000Z', 'observation window must declare both observedAt and validUntil'],
    ['invalid observedAt', 'invalid', '2026-09-03T05:00:00.000Z', 'observedAt is not a valid date-time'],
    ['invalid validUntil', '2026-09-03T03:00:00.000Z', 'invalid', 'validUntil is not a valid date-time'],
  ])('rejects %s windows with validator-specific errors from the shared state', (_label, observedAt, validUntil, expectedError) => {
    const fixtureRoot = createFixture();
    const record = observationRecord(fixtureRoot, observedAt, validUntil);

    expect(assuranceObservedState(record, validationNow)?.state).toBe('invalid-window');
    const result = runIntegrity(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(output(result)).toContain(expectedError);
  });
});
