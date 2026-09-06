import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assuranceDatasetCount,
  assuranceDatasetForRecordId,
  assuranceRecordUrlsById,
  findAssuranceRecord,
  forwardAssuranceRelationships,
  listAssuranceRecords,
  reverseAssuranceRelationships,
} from '../src/assurance/service';
import { assuranceRelationshipIds } from '../src/assurance/relationship-contract.js';
import { rebindRelationshipSource, setRelationshipTargets } from './helpers/assurance-relationships';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-143-runtime-index-'));
  cpSync(repositoryRoot, fixtureRoot, {
    recursive: true,
    filter(source) {
      const pathFromRoot = relative(repositoryRoot, source);
      if (!pathFromRoot) return true;
      return !pathFromRoot.split(sep).some((part) => ignoredFixtureParts.has(part));
    },
  });
  symlinkSync(join(repositoryRoot, 'node_modules'), join(fixtureRoot, 'node_modules'), 'dir');
  fixtureRoots.push(fixtureRoot);
  return fixtureRoot;
}

function readJson<T = any>(root: string, relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  writeFileSync(join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function run(root: string, script: string, args: string[] = []): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('registry-driven assurance runtime indexes', () => {
  it('exposes registered objectives through the actual shared runtime services without inventing a public route', () => {
    const objectives = listAssuranceRecords('objectives');

    expect(objectives).toHaveLength(12);
    expect(objectives.map((record) => record.id)).toContain('SEC-OBJ-001');
    expect(findAssuranceRecord('objectives', 'SEC-OBJ-001')?.id).toBe('SEC-OBJ-001');
    expect(assuranceDatasetCount('objectives')).toBe(12);
    expect(assuranceDatasetForRecordId('SEC-OBJ-001')).toBe('objectives');
    expect(assuranceRecordUrlsById('SEC-OBJ-001')).toEqual({});

    expect(assuranceRelationshipIds(forwardAssuranceRelationships('EX-001'), 'objectives')).toContain('SEC-OBJ-005');
    expect(reverseAssuranceRelationships('SEC-OBJ-005', 'objectives')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: 'EX-001', dataset: 'exercises', relation: 'objectives' }),
      ]),
    );
  });

  it('lets a compatible synthetic family and partition flow through shared runtime services after registry generation', () => {
    const fixtureRoot = createFixture();
    const registry = readJson(fixtureRoot, 'assurance/registry.json');
    const risks = registry.datasets.find((dataset: any) => dataset.kind === 'risks');
    const riskData = readJson(fixtureRoot, risks.path);

    const primaryRecord = structuredClone(riskData.records[0]);
    primaryRecord.id = 'SEC-RISK-998';
    primaryRecord.title = 'Synthetic runtime family primary';
    rebindRelationshipSource(primaryRecord, 'github.structured-records.findings.demo-143');
    setRelationshipTargets(primaryRecord, 'objectives', 'github.structured-records.objectives', ['SEC-OBJ-001']);

    const partitionRecord = structuredClone(riskData.records[0]);
    partitionRecord.id = 'SEC-RISK-999';
    partitionRecord.title = 'Synthetic runtime family partition';
    rebindRelationshipSource(partitionRecord, 'github.structured-records.findings.demo-143.partition');
    setRelationshipTargets(partitionRecord, 'objectives', 'github.structured-records.objectives', ['SEC-OBJ-001']);

    const familyPath = 'assurance/risks/findings-demo-143.json';
    const partitionPath = 'assurance/risks/findings-demo-143-partition.json';
    writeJson(fixtureRoot, familyPath, { ...riskData, records: [primaryRecord] });
    writeJson(fixtureRoot, partitionPath, { ...riskData, records: [partitionRecord] });

    registry.datasets.push({
      id: 'findings.demo-143',
      kind: 'findings',
      role: 'dataset',
      path: familyPath,
      schema: risks.schema,
      visibility: 'public',
      capabilities: ['runtime', 'records'],
      recordCollection: { path: 'records', identity: ['framework', 'title'] },
      resources: [
        {
          id: 'findings.demo-143.partition',
          kind: 'findings',
          role: 'partition',
          path: partitionPath,
          schema: risks.schema,
          visibility: 'public',
          capabilities: ['runtime', 'records'],
          recordCollection: { path: 'records', identity: ['framework', 'title'] },
        },
      ],
    });
    writeJson(fixtureRoot, 'assurance/registry.json', registry);

    const generated = run(fixtureRoot, 'scripts/generate-assurance-runtime-binding.mjs');
    expect(generated.status, output(generated)).toBe(0);
    const validated = run(fixtureRoot, 'scripts/validate-assurance-registry.mjs');
    expect(validated.status, output(validated)).toBe(0);

    writeFileSync(join(fixtureRoot, 'tests/demo-143-synthetic-runtime.test.ts'), `
import { describe, expect, it } from 'vitest';
import { assuranceRelationshipIds } from '../src/assurance/relationship-contract.js';
import {
  assuranceDatasetCount,
  assuranceDatasetForRecordId,
  assuranceRecordUrlsById,
  findAssuranceRecord,
  forwardAssuranceRelationships,
  listAssuranceRecords,
  reverseAssuranceRelationships,
} from '../src/assurance/service';

describe('synthetic registry-driven runtime family', () => {
  it('uses the same shared service indexes as built-in families', () => {
    expect(listAssuranceRecords('findings').map((record) => record.id)).toEqual(['SEC-RISK-998', 'SEC-RISK-999']);
    expect(assuranceDatasetCount('findings')).toBe(2);
    expect(assuranceDatasetForRecordId('SEC-RISK-999')).toBe('findings');
    expect(findAssuranceRecord('findings', 'SEC-RISK-999')?.id).toBe('SEC-RISK-999');
    expect(assuranceRelationshipIds(forwardAssuranceRelationships('SEC-RISK-999'), 'objectives')).toContain('SEC-OBJ-001');
    expect(reverseAssuranceRelationships('SEC-OBJ-001', 'objectives')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: 'SEC-RISK-998', dataset: 'findings', relation: 'objectives' }),
        expect.objectContaining({ sourceId: 'SEC-RISK-999', dataset: 'findings', relation: 'objectives' }),
      ]),
    );
    expect(assuranceRecordUrlsById('SEC-RISK-999')).toEqual({});
  });
});
`);

    const runtimeTest = run(
      fixtureRoot,
      'node_modules/vitest/vitest.mjs',
      ['run', 'tests/demo-143-synthetic-runtime.test.ts'],
    );
    expect(runtimeTest.status, output(runtimeTest)).toBe(0);
  }, 15_000);
});
