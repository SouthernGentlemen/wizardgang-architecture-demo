import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const validationNow = '2026-09-03T04:40:00Z';
function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-125-assurance-'));
  cpSync(repositoryRoot, fixtureRoot, { recursive: true, filter(source) {
    const pathFromRoot = relative(repositoryRoot, source); if (!pathFromRoot) return true;
    return !pathFromRoot.split(sep).some((part) => ignoredFixtureParts.has(part));
  } });
  fixtureRoots.push(fixtureRoot); return fixtureRoot;
}
function run(fixtureRoot: string, script: string, args: string[] = []): SpawnSyncReturns<string> { return spawnSync(process.execPath, [script, ...args], { cwd: fixtureRoot, encoding: 'utf8', env: { ...process.env, ASSURANCE_VALIDATION_NOW: validationNow } }); }
function combined(result: SpawnSyncReturns<string>): string { return `${result.stdout}\n${result.stderr}`; }
function readJson<T = any>(fixtureRoot: string, relativePath: string): T { return JSON.parse(readFileSync(join(fixtureRoot, relativePath), 'utf8')) as T; }
function writeJson(fixtureRoot: string, relativePath: string, value: unknown): void { writeFileSync(join(fixtureRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`); }
afterEach(() => { while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true }); });

describe('canonical assurance summaries', () => {
  it('accepts checked-in summaries generated from structured assurance data', () => {
    const fixtureRoot = createFixture(); const result = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']); expect(result.status, combined(result)).toBe(0);
  });
  it('rejects structured status drift until the Markdown summary is regenerated', () => {
    const fixtureRoot = createFixture();
    const compliance = readJson(fixtureRoot, 'assurance/compliance/iso-27001-2022.json');
    const record = compliance.records.find((candidate: any) => candidate.kind === 'control' && candidate.status === 'partial');
    expect(record).toBeDefined(); record.status = 'gap';
    writeJson(fixtureRoot, 'assurance/compliance/iso-27001-2022.json', compliance);
    const result = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']);
    expect(result.status).not.toBe(0); expect(combined(result)).toContain('generated summary is stale or was edited independently');
  });
  it('rejects hand-edited Markdown status or rationale presentation', () => {
    const fixtureRoot = createFixture(); const target = join(fixtureRoot, 'docs/governance/soa/ISO-42001-SOA.md');
    writeFileSync(target, readFileSync(target, 'utf8').replace('| 38 | 2 | 34 | 0 | 2 |', '| 38 | 3 | 33 | 0 | 2 |'));
    const result = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']);
    expect(result.status).not.toBe(0); expect(combined(result)).toContain('generated summary is stale or was edited independently');
  });
});

describe('assurance operational gates', () => {
  it('rejects missing accountable owners', () => {
    const fixtureRoot = createFixture(); const config = readJson(fixtureRoot, 'assurance/operations/monitoring.json'); delete config.accountableOwners.evidence;
    writeJson(fixtureRoot, 'assurance/operations/monitoring.json', config); const result = run(fixtureRoot, 'scripts/validate-assurance-operations.mjs');
    expect(result.status).not.toBe(0); expect(combined(result)).toContain('missing accountable owner for evidence');
  });
  it('rejects an expired security.txt source value', () => {
    const fixtureRoot = createFixture(); const target = join(fixtureRoot, 'src/api/security-policy.ts');
    writeFileSync(target, readFileSync(target, 'utf8').replace('2027-03-02T00:00:00Z', '2026-01-01T00:00:00Z'));
    const result = run(fixtureRoot, 'scripts/validate-assurance-operations.mjs');
    expect(result.status).not.toBe(0); expect(combined(result)).toContain('security.txt expired at 2026-01-01T00:00:00Z');
  });
});

describe('release-bound registry snapshots', () => {
  it('records exact release identity, counts, generation time, and deterministic content digest', () => {
    const fixtureRoot = createFixture(); const tag = 'v9.8.7'; const commit = '0123456789abcdef0123456789abcdef01234567'; const generatedAt = '2026-09-03T05:00:00Z';
    const firstPath = 'artifacts/first.json'; const secondPath = 'artifacts/second.json';
    const first = run(fixtureRoot, 'scripts/generate-assurance-snapshot.mjs', ['--tag', tag, '--commit', commit, '--generated-at', generatedAt, '--output', firstPath]);
    const second = run(fixtureRoot, 'scripts/generate-assurance-snapshot.mjs', ['--tag', tag, '--commit', commit, '--generated-at', generatedAt, '--output', secondPath]);
    expect(first.status, combined(first)).toBe(0); expect(second.status, combined(second)).toBe(0);
    const firstSnapshot = readJson(fixtureRoot, firstPath); const secondSnapshot = readJson(fixtureRoot, secondPath);
    expect(firstSnapshot).toEqual(secondSnapshot); expect(firstSnapshot.tag).toBe(tag); expect(firstSnapshot.commit).toBe(commit); expect(firstSnapshot.generatedAt).toBe(generatedAt);
    expect(firstSnapshot.recordCounts.total).toBeGreaterThan(0); expect(Object.keys(firstSnapshot.recordCounts.byPath).length).toBeGreaterThan(0); expect(firstSnapshot.contentDigest.algorithm).toBe('sha256'); expect(firstSnapshot.contentDigest.value).toMatch(/^[0-9a-f]{64}$/);
  });
});
