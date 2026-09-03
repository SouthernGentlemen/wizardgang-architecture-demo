import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const validationNow = '2026-09-03T04:40:00Z';
const generatedMarkdownPaths = [
  'docs/governance/registers/SECURITY-RISK-REGISTER.md',
  'docs/governance/registers/AI-RISK-REGISTER.md',
  'docs/governance/registers/INCIDENT-REGISTER.md',
  'docs/governance/soa/ISO-27001-SOA.md',
  'docs/governance/soa/ISO-42001-SOA.md',
];

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-128-assurance-'));
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
function sourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const absolute = join(root, entry);
    if (statSync(absolute).isDirectory()) files.push(...sourceFiles(absolute));
    else if (/\.(?:ts|mjs)$/.test(entry)) files.push(absolute);
  }
  return files;
}
afterEach(() => { while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true }); });

describe('canonical assurance Markdown presentations', () => {
  it('accepts checked-in presentations generated from structured assurance data', () => {
    const fixtureRoot = createFixture(); const result = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']); expect(result.status, combined(result)).toBe(0);
  });

  it('detects independently edited generated risk state as stale', () => {
    const fixtureRoot = createFixture();
    const target = join(fixtureRoot, 'docs/governance/registers/SECURITY-RISK-REGISTER.md');
    const current = readFileSync(target, 'utf8');
    writeFileSync(target, current.replace('| SEC-RISK-001 | Credential or secret exposure | 20 Critical | 10 High | Reduce | Treating | 2026-12-02 |', '| SEC-RISK-001 | Credential or secret exposure | 20 Critical | 10 High | Reduce | Open | 2026-12-02 |'));
    const result = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']);
    expect(result.status).not.toBe(0); expect(combined(result)).toContain('generated assurance presentation is stale or was edited independently');
  });

  it('projects canonical JSON changes into Markdown', () => {
    const fixtureRoot = createFixture();
    const risks = readJson(fixtureRoot, 'assurance/risks/risks.json');
    const record = risks.records.find((candidate: any) => candidate.id === 'SEC-RISK-001');
    expect(record).toBeDefined(); record.status = 'open';
    writeJson(fixtureRoot, 'assurance/risks/risks.json', risks);
    const generate = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs');
    expect(generate.status, combined(generate)).toBe(0);
    const markdown = readFileSync(join(fixtureRoot, 'docs/governance/registers/SECURITY-RISK-REGISTER.md'), 'utf8');
    expect(markdown).toContain('| SEC-RISK-001 | Credential or secret exposure | 20 Critical | 10 High | Reduce | Open | 2026-12-02 |');
    expect(run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']).status).toBe(0);
  });

  it('keeps generated counts and statuses aligned with canonical records, including empty incidents and planned exercises', () => {
    const fixtureRoot = createFixture();
    const risks = readJson(fixtureRoot, 'assurance/risks/risks.json');
    const security = risks.records.filter((record: any) => record.framework === 'security');
    const securityMarkdown = readFileSync(join(fixtureRoot, 'docs/governance/registers/SECURITY-RISK-REGISTER.md'), 'utf8');
    expect(securityMarkdown).toContain(`**Records:** ${security.length}`);
    for (const record of security) {
      const status = String(record.status).replaceAll('-', ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
      expect(securityMarkdown).toContain(`| ${record.id} | ${record.title} |`);
      expect(securityMarkdown).toContain(`| ${status} | ${record.reviewDue} |`);
    }

    const incidents = readJson(fixtureRoot, 'assurance/incidents/incidents.json');
    const exercises = readJson(fixtureRoot, 'assurance/incidents/exercises.json');
    const incidentMarkdown = readFileSync(join(fixtureRoot, 'docs/governance/registers/INCIDENT-REGISTER.md'), 'utf8');
    expect(incidentMarkdown).toContain(`**Actual incident records:** ${incidents.records.length}`);
    expect(incidentMarkdown).toContain(`**Exercise records:** ${exercises.records.length}`);
    expect(incidents.records).toHaveLength(0);
    expect(incidentMarkdown).toContain('| EX-001 | Tabletop / response exercise | Combined security + AI/MCP incident scenario |');
    expect(incidentMarkdown).toContain('| Planned | 0 |');
  });

  it('is byte-stable across repeated generation', () => {
    const fixtureRoot = createFixture();
    expect(run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs').status).toBe(0);
    const first = generatedMarkdownPaths.map((relativePath) => readFileSync(join(fixtureRoot, relativePath)));
    expect(run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs').status).toBe(0);
    const second = generatedMarkdownPaths.map((relativePath) => readFileSync(join(fixtureRoot, relativePath)));
    expect(second).toEqual(first);
  });

  it('does not parse Markdown to validate assurance state', () => {
    const fixtureRoot = createFixture();
    const target = join(fixtureRoot, 'docs/governance/registers/AI-RISK-REGISTER.md');
    writeFileSync(target, readFileSync(target, 'utf8').replace('| AI-RISK-001 | Unauthorized expansion of AI tool authority | 20 Critical | 8 Moderate | Reduce | Treating | 2026-12-02 |', '| AI-RISK-001 | Unauthorized expansion of AI tool authority | 20 Critical | 8 Moderate | Reduce | Open | 2026-12-02 |'));
    const validation = run(fixtureRoot, 'scripts/validate-assurance.mjs');
    expect(validation.status, combined(validation)).toBe(0);
    expect(run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']).status).not.toBe(0);
    const validator = readFileSync(join(fixtureRoot, 'scripts/validate-assurance.mjs'), 'utf8');
    expect(validator).not.toContain('parseRegisterSummary');
    expect(validator).not.toContain('parseExerciseRows');
    expect(validator).not.toContain('matchAll');
  });

  it('preserves incident and exercise relationship validation in canonical JSON', () => {
    const fixtureRoot = createFixture();
    const exercises = readJson(fixtureRoot, 'assurance/incidents/exercises.json');
    exercises.records[0].relationships.risks = ['SEC-RISK-999'];
    writeJson(fixtureRoot, 'assurance/incidents/exercises.json', exercises);
    const result = run(fixtureRoot, 'scripts/validate-assurance-integrity.mjs');
    expect(result.status).not.toBe(0); expect(combined(result)).toContain('unresolved risks relationship SEC-RISK-999');
  });

  it('keeps generated Markdown out of runtime code paths', () => {
    const runtime = sourceFiles(join(repositoryRoot, 'src')).map((absolute) => readFileSync(absolute, 'utf8')).join('\n');
    expect(runtime).not.toMatch(/readFileSync\([^)]*\.md/);
    expect(runtime).not.toMatch(/from\s+['"][^'"]+\.md['"]/);
    expect(runtime).not.toMatch(/import\s*\([^)]*\.md/);
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
