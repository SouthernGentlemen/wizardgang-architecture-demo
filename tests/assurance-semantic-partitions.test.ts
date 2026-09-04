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
import { gitBlobShaForFile } from '../scripts/generate-assurance-runtime-binding.mjs';

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

function approveResourceRevision(fixtureRoot: string, resourceId: string, relativePath: string): void {
  const lifecyclePath = 'assurance/lifecycle/records.json';
  const lifecycle = readJson(fixtureRoot, lifecyclePath);
  const revision = gitBlobShaForFile(fixtureRoot, relativePath);
  if (!lifecycle.sourceApprovals.some((approval: any) => approval.resource === resourceId && approval.revision === revision)) {
    lifecycle.sourceApprovals.push({
      id: `fixture-${resourceId.replaceAll('.', '-')}-${revision.slice(0, 12)}`,
      resource: resourceId,
      revision,
      reviewRef: 'review-demo155-current-sources',
    });
  }
  writeJson(fixtureRoot, lifecyclePath, lifecycle);
}

function runScript(fixtureRoot: string, script: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ASSURANCE_VALIDATION_NOW: validationNow,
      ASSURANCE_MIGRATION_DIR: repositoryRoot,
      ASSURANCE_PREVIOUS_DIR: repositoryRoot,
    },
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
  it('keeps evidence relationships and publication valid after a registered partition move only with exact source-revision approvals', () => {
    const fixtureRoot = createFixture();
    const partitionPath = 'assurance/evidence/governance-evidence.json';
    moveRecordToPartition(fixtureRoot, 'evidence', 'EVD-DOC-003', partitionPath);
    approveResourceRevision(fixtureRoot, 'evidence', 'assurance/evidence/evidence.json');
    approveResourceRevision(fixtureRoot, 'evidence.fixture-partition', partitionPath);

    expectPassed(runScript(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-registry.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-iso27001-compliance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-iso42001-compliance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-wcag-compliance.mjs'));
    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-publication.mjs'));
  });

  it('fails publication closed for an ungoverned partition record, then accepts explicit reviewed lifecycle metadata', () => {
    const fixtureRoot = createFixture();
    const partitionPath = 'assurance/evidence/governance-evidence.json';
    moveRecordToPartition(fixtureRoot, 'evidence', 'EVD-DOC-003', partitionPath);

    const partition = readJson(fixtureRoot, partitionPath);
    partition.records.push({
      ...structuredClone(partition.records[0]),
      id: 'EVD-NEW-148',
      title: 'Synthetic partition record requiring explicit lifecycle metadata',
    });
    writeJson(fixtureRoot, partitionPath, partition);
    approveResourceRevision(fixtureRoot, 'evidence', 'assurance/evidence/evidence.json');
    approveResourceRevision(fixtureRoot, 'evidence.fixture-partition', partitionPath);

    expectRejected(
      runScript(fixtureRoot, 'scripts/validate-assurance-publication.mjs'),
      'EVD-NEW-148: public assurance record is not publishable (missing-lifecycle)',
    );

    const lifecycle = readJson(fixtureRoot, 'assurance/lifecycle/records.json');
    lifecycle.records.push({
      id: 'EVD-NEW-148',
      lifecycle: 'Draft',
      reviewRef: 'review-demo155-current-sources',
    });
    writeJson(fixtureRoot, 'assurance/lifecycle/records.json', lifecycle);

    expectPassed(runScript(fixtureRoot, 'scripts/validate-assurance-publication.mjs'));
  });

  it('applies the same fail-closed publication rule to a newly registered record family', () => {
    const fixtureRoot = createFixture();
    const registryPath = 'assurance/registry.json';
    const registry = readJson(fixtureRoot, registryPath);
    const evidenceResource = registryResource(registry, 'evidence');
    const evidence = readJson(fixtureRoot, evidenceResource.path);
    const familyPath = 'assurance/fixture-publication-family.json';
    const familyRecord = {
      ...structuredClone(evidence.records[0]),
      id: 'FIXTURE-NEW-148',
      title: 'Synthetic newly registered assurance family record',
    };

    writeJson(fixtureRoot, familyPath, { ...evidence, records: [familyRecord] });
    registry.datasets.push({
      id: 'fixture-publication-family',
      kind: 'fixture-publication-family',
      role: 'dataset',
      path: familyPath,
      schema: evidenceResource.schema,
      visibility: 'public',
      capabilities: ['runtime', 'records'],
      recordCollection: structuredClone(evidenceResource.recordCollection),
    });
    writeJson(fixtureRoot, registryPath, registry);
    approveResourceRevision(fixtureRoot, 'fixture-publication-family', familyPath);

    expectRejected(
      runScript(fixtureRoot, 'scripts/validate-assurance-publication.mjs'),
      'FIXTURE-NEW-148: public assurance record is not publishable (missing-lifecycle)',
    );
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
