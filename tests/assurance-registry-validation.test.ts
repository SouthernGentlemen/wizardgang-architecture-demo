import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { rebindRelationshipSource, setRelationshipTargets } from './helpers/assurance-relationships';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-154-registry-services-'));
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
  const absolute = join(root, relativePath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function findResource(resource: any, id: string): any | undefined {
  if (resource?.id === id) return resource;
  for (const child of resource?.resources ?? []) {
    const found = findResource(child, id);
    if (found) return found;
  }
  return undefined;
}

function registryResource(registry: any, id: string): any {
  for (const dataset of registry.datasets ?? []) {
    const found = findResource(dataset, id);
    if (found) return found;
  }
  throw new Error(`Missing fixture registry resource ${id}`);
}

function runScript(root: string, script: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

function expectPassed(result: SpawnSyncReturns<string>): void {
  expect(result.status, output(result)).toBe(0);
}

function expectRejected(result: SpawnSyncReturns<string>, message: string): void {
  expect(result.status).not.toBe(0);
  expect(output(result)).toContain(message);
}

function registerSyntheticReportFamily(fixtureRoot: string, mutate?: (record: any) => void): void {
  const registryPath = 'assurance/registry.json';
  const registry = readJson(fixtureRoot, registryPath);
  const risks = registryResource(registry, 'risks');
  const riskData = readJson(fixtureRoot, risks.path);
  const record = structuredClone(riskData.records[0]);
  record.id = 'SEC-RISK-999';
  record.title = 'Synthetic registered report fixture';
  mutate?.(record);
  rebindRelationshipSource(record, 'github.structured-records.report-register-v2');
  const reportPath = 'assurance/reports/demo-154-report.json';
  writeJson(fixtureRoot, reportPath, { ...riskData, records: [record] });
  registry.datasets.push({
    id: 'report-register-v2',
    kind: 'reports',
    role: 'dataset',
    path: reportPath,
    schema: risks.schema,
    visibility: 'public',
    capabilities: ['runtime', 'records', 'api-index'],
    recordCollection: structuredClone(risks.recordCollection),
    routes: {
      api: '/v1/assurance/reports',
      apiRecord: '/v1/assurance/reports/{id}',
    },
  });
  writeJson(fixtureRoot, registryPath, registry);
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('registry-driven assurance validation fixtures', () => {
  it('accepts a compatible synthetic report family without released-family validator edits', () => {
    const fixtureRoot = createFixture();
    registerSyntheticReportFamily(fixtureRoot);

    expectPassed(runScript(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-registry.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'));
    expect(readFileSync(join(fixtureRoot, 'src/assurance/generated/registry-bindings.ts'), 'utf8')).toContain('"report-register-v2"');
  });

  it('rejects a dangling relationship introduced by the synthetic report family', () => {
    const fixtureRoot = createFixture();
    registerSyntheticReportFamily(fixtureRoot, (record) => {
      setRelationshipTargets(record, 'evidence', 'github.structured-records.evidence', ['EVD-MISSING-999']);
    });

    expectPassed(runScript(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-registry.mjs'));
    expectRejected(
      runScript(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'),
      'unresolved evidence relationship EVD-MISSING-999',
    );
  });

  it('aggregates an ISO partition before semantic validation without applying WCAG ownership rules', () => {
    const fixtureRoot = createFixture();
    const registryPath = 'assurance/registry.json';
    const registry = readJson(fixtureRoot, registryPath);
    const iso = registryResource(registry, 'compliance.iso-27001');
    const primary = readJson(fixtureRoot, iso.path);
    const recordIndex = primary.records.findIndex((record: any) => record.kind === 'control');
    expect(recordIndex).toBeGreaterThanOrEqual(0);
    const partitionDocument = structuredClone(primary);
    const [record] = primary.records.splice(recordIndex, 1);
    partitionDocument.records = [record];
    const partitionPath = 'assurance/compliance/iso-27001-annex-partition-demo-154.json';

    writeJson(fixtureRoot, iso.path, primary);
    writeJson(fixtureRoot, partitionPath, partitionDocument);
    iso.resources = [
      ...(iso.resources ?? []),
      {
        id: 'compliance.iso-27001.demo-154-partition',
        kind: 'compliance',
        role: 'partition',
        path: partitionPath,
        schema: iso.schema,
        visibility: 'public',
        capabilities: ['runtime', 'records'],
        recordCollection: structuredClone(iso.recordCollection),
      },
    ];
    writeJson(fixtureRoot, registryPath, registry);

    expectPassed(runScript(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-registry.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-iso27001-compliance.mjs'));
  });
});
