import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assuranceRecordEntries,
  assuranceRecordsForKind,
} from '../src/assurance/record-discovery.js';
import { rebindRelationshipSource, setRelationshipTargets } from './helpers/assurance-relationships';

const repositoryRoot = process.cwd();
const repositoryGitDir = spawnSync('git', ['rev-parse', '--absolute-git-dir'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).stdout.trim();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-132-record-discovery-'));
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

function run(root: string, script: string, args: string[] = [], env: NodeJS.ProcessEnv = process.env): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', env });
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

function expectRejected(result: SpawnSyncReturns<string>, message: string): void {
  expect(result.status).not.toBe(0);
  expect(output(result)).toContain(message);
}

function addRiskPartition(root: string, mutate: (record: any) => void): void {
  const registry = readJson(root, 'assurance/registry.json');
  const risks = registry.datasets.find((dataset: any) => dataset.kind === 'risks');
  const riskData = readJson(root, risks.path);
  const record = structuredClone(riskData.records[0]);
  mutate(record);
  rebindRelationshipSource(record, 'github.structured-records.risks.demo-132-partition');
  const partitionPath = 'assurance/risks/demo-132-partition.json';
  writeJson(root, partitionPath, { ...riskData, records: [record] });
  risks.resources = [
    ...(risks.resources ?? []),
    {
      id: 'risks.demo-132-partition',
      kind: 'risks',
      role: 'partition',
      path: partitionPath,
      schema: risks.schema,
      visibility: 'public',
      capabilities: ['runtime', 'records'],
      recordCollection: { path: 'records', identity: ['framework', 'title'] },
    },
  ];
  writeJson(root, 'assurance/registry.json', registry);
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('registry-driven assurance record discovery', () => {
  it('aggregates primary and partition records in registry order without a family-specific switch', () => {
    const registry = {
      datasets: [
        {
          id: 'risks', kind: 'risks', visibility: 'public', capabilities: ['runtime', 'records'], recordCollection: { path: 'records', identity: ['id'] },
          resources: [
            { id: 'risks.partition', kind: 'risks', visibility: 'public', capabilities: ['runtime', 'records'], recordCollection: { path: 'items', identity: ['id'] } },
          ],
        },
      ],
    } as any;
    const documents: Record<string, unknown> = {
      risks: { records: [{ id: 'RISK-001' }] },
      'risks.partition': { items: [{ id: 'RISK-002' }] },
    };
    const entries = assuranceRecordEntries(registry, (resource) => documents[resource.id], { runtimeOnly: true });
    expect(assuranceRecordsForKind<{ id: string }>(entries, 'risks').map((record) => record.id)).toEqual(['RISK-001', 'RISK-002']);
  });

  it('discovers canonical objective records solely through registry declarations', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const entries = assuranceRecordEntries(
      registry,
      (resource) => readJson(fixtureRoot, resource.path),
      { runtimeOnly: true },
    );
    const objectives = assuranceRecordsForKind<{ id: string }>(entries, 'objectives');
    expect(objectives).toHaveLength(12);
    expect(objectives.map((record) => record.id)).toContain('SEC-OBJ-005');
  });

  it('supports a compatible new record family without changing central discovery or registry validation switches', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const risks = registry.datasets.find((dataset: any) => dataset.kind === 'risks');
    const data = readJson(fixtureRoot, risks.path);
    const record = structuredClone(data.records[0]);
    record.id = 'SEC-RISK-999';
    record.title = 'Compatible family fixture';
    const familyPath = 'assurance/risks/findings-demo-132.json';
    writeJson(fixtureRoot, familyPath, { ...data, records: [record] });
    registry.datasets.push({
      id: 'findings.demo-132',
      kind: 'findings',
      role: 'dataset',
      path: familyPath,
      schema: risks.schema,
      visibility: 'public',
      capabilities: ['runtime', 'records'],
      recordCollection: { path: 'records', identity: ['framework', 'title'] },
    });
    writeJson(fixtureRoot, 'assurance/registry.json', registry);

    const generated = run(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs');
    expect(generated.status, output(generated)).toBe(0);
    expect(readFileSync(join(fixtureRoot, 'src/assurance/generated/registry-bindings.ts'), 'utf8')).toContain('"findings.demo-132"');
    const validated = run(fixtureRoot, 'scripts/validate-assurance-registry.mjs');
    expect(validated.status, output(validated)).toBe(0);
  });

  it('rejects duplicate IDs introduced by an additional registered risk partition', () => {
    const fixtureRoot = createFixture();
    addRiskPartition(fixtureRoot, () => {});
    expectRejected(run(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'), 'duplicate public ID SEC-RISK-001');
  });

  it('rejects unresolved relationships introduced by an additional registered risk partition', () => {
    const fixtureRoot = createFixture();
    addRiskPartition(fixtureRoot, (record) => {
      record.id = 'SEC-RISK-999';
      record.title = 'Unresolved relationship fixture';
      setRelationshipTargets(record, 'evidence', 'github.structured-records.evidence', ['EVD-SRC-999']);
    });
    expectRejected(run(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'), 'unresolved evidence relationship EVD-SRC-999');
  });

  it('requires lifecycle coverage for records introduced through an additional registered partition', () => {
    const fixtureRoot = createFixture();
    addRiskPartition(fixtureRoot, (record) => {
      record.id = 'SEC-RISK-999';
      record.title = 'Lifecycle coverage fixture';
    });
    const env = {
      ...process.env,
      GIT_DIR: repositoryGitDir,
      ASSURANCE_PREVIOUS_DIR: repositoryRoot,
    };
    expectRejected(
      run(fixtureRoot, 'scripts/validate-assurance-lifecycle.mjs', [], env),
      'SEC-RISK-999: new public assurance record requires explicit lifecycle and disclosure-review metadata',
    );
  });

  it('fails explicitly when a record-bearing resource is declared without runtime support', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const risks = registry.datasets.find((dataset: any) => dataset.kind === 'risks');
    risks.capabilities = risks.capabilities.filter((capability: string) => capability !== 'runtime');
    writeJson(fixtureRoot, 'assurance/registry.json', registry);
    expectRejected(
      run(fixtureRoot, 'scripts/validate-assurance-registry.mjs'),
      'risks records capability requires runtime capability for shared Worker/Node record discovery',
    );
  });
});
