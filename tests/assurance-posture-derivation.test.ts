import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);

function createFixtureRoot(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-136-posture-'));
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

function run(root: string, script: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
}

function expectPassed(result: SpawnSyncReturns<string>): void {
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
}

function expectRejected(result: SpawnSyncReturns<string>, messageFragment: string): void {
  expect(result.status).not.toBe(0);
  expect(`${result.stdout}\n${result.stderr}`).toContain(messageFragment);
}

function postureCounts(data: any): Record<string, number> {
  const counts: Record<string, number> = { met: 0, partial: 0, gap: 0, 'not-applicable': 0 };
  for (const record of data.records.filter((candidate: any) => candidate.kind === 'control')) {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
  }
  return counts;
}

function findResource(registry: any, id: string): any {
  const stack = [...(registry.datasets ?? [])];
  while (stack.length) {
    const resource = stack.shift();
    if (resource.id === id) return resource;
    stack.push(...(resource.resources ?? []));
  }
  return undefined;
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('canonical assurance posture derivation', () => {
  it('lets a valid assessment update flow through validation and generated SoA summary without validator constants', () => {
    const root = createFixtureRoot();
    const dataPath = 'assurance/compliance/iso-27001-2022.json';
    const data = readJson(root, dataPath);
    const before = postureCounts(data);
    const changed = data.records.find((record: any) => record.kind === 'control' && record.status === 'partial');
    expect(changed).toBeDefined();
    changed.status = 'met';
    writeJson(root, dataPath, data);

    expectPassed(run(root, 'scripts/validate-iso27001-compliance.mjs'));
    expectPassed(run(root, 'scripts/generate-assurance-summaries.mjs'));

    const after = postureCounts(data);
    expect(after.met).toBe(before.met + 1);
    expect(after.partial).toBe(before.partial - 1);
    const total = Object.values(after).reduce((sum, count) => sum + count, 0);
    const summary = readFileSync(join(root, 'docs/governance/soa/ISO-27001-SOA.md'), 'utf8');
    expect(summary).toContain(`| ${total} | ${after.met} | ${after.partial} | ${after.gap} | ${after['not-applicable']} |`);
  });

  it('still rejects unsupported assessment statuses', () => {
    const root = createFixtureRoot();
    const dataPath = 'assurance/compliance/iso-27001-2022.json';
    const data = readJson(root, dataPath);
    const changed = data.records.find((record: any) => record.kind === 'control' && record.status !== 'not-applicable');
    expect(changed).toBeDefined();
    changed.status = 'certified';
    changed.applicability = 'applicable';
    writeJson(root, dataPath, data);
    expectRejected(run(root, 'scripts/validate-iso27001-compliance.mjs'), 'unsupported normalized status certified');
  });

  it('still rejects unsupported framework claims', () => {
    const root = createFixtureRoot();
    const registry = readJson(root, 'assurance/registry.json');
    const resource = findResource(registry, 'compliance.iso-27001');
    expect(resource).toBeDefined();
    resource.framework.qualification = 'Certified and formally conformant.';
    writeJson(root, 'assurance/registry.json', registry);
    expectRejected(run(root, 'scripts/validate-iso27001-compliance.mjs'), 'qualification must avoid certification/conformance claims');
  });

  it('retains approval provenance as a required authorization control without duplicating its current values', () => {
    const root = createFixtureRoot();
    const dataPath = 'assurance/compliance/iso-27001-2022.json';
    const data = readJson(root, dataPath);
    delete data.sourceSoa.approval.mergeCommit;
    writeJson(root, dataPath, data);
    expectRejected(run(root, 'scripts/validate-iso27001-compliance.mjs'), 'approved sourceSoa must retain pull-request and merge-commit provenance');
  });
});
