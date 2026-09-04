import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const validationNow = '2026-09-03T03:59:00Z';

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-146-assurance-'));
  cpSync(repositoryRoot, fixtureRoot, { recursive: true, filter(source) {
    const pathFromRoot = relative(repositoryRoot, source);
    if (!pathFromRoot) return true;
    return !pathFromRoot.split(sep).some((part) => ignoredFixtureParts.has(part));
  } });
  fixtureRoots.push(fixtureRoot);
  return fixtureRoot;
}

function readJson<T = any>(fixtureRoot: string, relativePath: string): T {
  return JSON.parse(readFileSync(join(fixtureRoot, relativePath), 'utf8')) as T;
}

function writeJson(fixtureRoot: string, relativePath: string, value: unknown): void {
  const absolute = join(fixtureRoot, relativePath);
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

function moveRecordToPartition(fixtureRoot: string, parentId: string, recordId: string, partitionPath: string): void {
  const registry = readJson(fixtureRoot, 'assurance/registry.json');
  const parent = registryResource(registry, parentId);
  const primary = readJson(fixtureRoot, parent.path);
  const recordIndex = primary.records.findIndex((record: any) => record.id === recordId);
  expect(recordIndex).toBeGreaterThanOrEqual(0);
  const [record] = primary.records.splice(recordIndex, 1);
  writeJson(fixtureRoot, parent.path, primary);
  writeJson(fixtureRoot, partitionPath, { ...primary, records: [record] });
  parent.resources = [
    ...(parent.resources ?? []),
    {
      id: `${parentId}.fixture-partition`,
      kind: parent.kind,
      role: 'partition',
      path: partitionPath,
      schema: parent.schema,
      visibility: parent.visibility,
      capabilities: ['runtime', 'records'],
      recordCollection: structuredClone(parent.recordCollection),
    },
  ];
  writeJson(fixtureRoot, 'assurance/registry.json', registry);
}

function runScript(fixtureRoot: string, script: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script], {
    cwd: fixtureRoot,
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

describe('registry-driven assurance semantic validation', () => {
  it('keeps evidence relationships valid when an existing record moves to a registered partition', () => {
    const fixtureRoot = createFixture();
    moveRecordToPartition(fixtureRoot, 'evidence', 'EVD-DOC-003', 'assurance/evidence/governance-evidence.json');

    expectPassed(runScript(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-registry.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-iso27001-compliance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-iso42001-compliance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-wcag-compliance.mjs'));
  });

  it('applies evidence locator and risk-domain semantics to additional registered partitions', () => {
    const evidenceFixture = createFixture();
    const evidencePartition = 'assurance/evidence/governance-evidence.json';
    moveRecordToPartition(evidenceFixture, 'evidence', 'EVD-DOC-003', evidencePartition);
    const evidence = readJson(evidenceFixture, evidencePartition);
    evidence.records[0].locator.repositoryPath = 'docs/fixture-does-not-exist.md';
    writeJson(evidenceFixture, evidencePartition, evidence);
    expectRejected(runScript(evidenceFixture, 'scripts/validate-assurance.mjs'), 'repository path does not exist');

    const riskFixture = createFixture();
    const riskPartition = 'assurance/risks/security-risks-partition.json';
    moveRecordToPartition(riskFixture, 'risks', 'SEC-RISK-001', riskPartition);
    const risks = readJson(riskFixture, riskPartition);
    risks.records[0].framework = 'ai';
    writeJson(riskFixture, riskPartition, risks);
    expectRejected(runScript(riskFixture, 'scripts/validate-assurance.mjs'), 'framework must match AI-RISK prefix');

    risks.records[0].framework = 'security';
    risks.records[0].residual.score = 0;
    writeJson(riskFixture, riskPartition, risks);
    expectRejected(runScript(riskFixture, 'scripts/validate-assurance.mjs'), 'risk score cannot derive a canonical rating');
  });

  it('follows registry-owned ISO and WCAG data/schema paths after relocation', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const isoResource = registryResource(registry, 'compliance.iso-27001');
    const relocatedIsoData = 'assurance/compliance/iso-27001-2022-relocated.json';
    const relocatedIsoSchema = 'contracts/assurance/iso-27001-compliance-relocated.schema.json';

    renameSync(join(fixtureRoot, isoResource.path), join(fixtureRoot, relocatedIsoData));
    copyFileSync(join(fixtureRoot, isoResource.schema), join(fixtureRoot, relocatedIsoSchema));
    isoResource.path = relocatedIsoData;
    isoResource.schema = relocatedIsoSchema;

    const wcagResource = registryResource(registry, 'compliance.wcag-2.2');
    const wcagPartition = wcagResource.resources[0];
    const relocatedWcagManifest = 'assurance/compliance/wcag-2.2-relocated.json';
    const relocatedWcagManifestSchema = 'contracts/assurance/wcag-2.2-registry-relocated.schema.json';
    const relocatedWcagPartition = 'assurance/compliance/wcag-2.2-principle-relocated.json';
    const relocatedWcagPartitionSchema = 'contracts/assurance/wcag-2.2-criteria-relocated.schema.json';

    renameSync(join(fixtureRoot, wcagResource.path), join(fixtureRoot, relocatedWcagManifest));
    copyFileSync(join(fixtureRoot, wcagResource.schema), join(fixtureRoot, relocatedWcagManifestSchema));
    wcagResource.path = relocatedWcagManifest;
    wcagResource.schema = relocatedWcagManifestSchema;
    renameSync(join(fixtureRoot, wcagPartition.path), join(fixtureRoot, relocatedWcagPartition));
    copyFileSync(join(fixtureRoot, wcagPartition.schema), join(fixtureRoot, relocatedWcagPartitionSchema));
    wcagPartition.path = relocatedWcagPartition;
    wcagPartition.schema = relocatedWcagPartitionSchema;
    writeJson(fixtureRoot, 'assurance/registry.json', registry);

    expectPassed(runScript(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-registry.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-iso27001-compliance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-wcag-compliance.mjs'));
  });
});
