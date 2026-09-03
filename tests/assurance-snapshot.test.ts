import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const generatorPath = join(repositoryRoot, 'scripts/generate-assurance-snapshot.mjs');
const fixtureRoots: string[] = [];
const snapshotArgs = [
  '--tag', 'v9.8.7',
  '--commit', '0123456789abcdef0123456789abcdef01234567',
  '--generated-at', '2026-09-03T20:45:00Z',
];

function writeJson(root: string, relativePath: string, value: unknown): void {
  const absolute = join(root, relativePath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'demo-134-assurance-snapshot-'));
  fixtureRoots.push(root);

  writeJson(root, 'assurance/registry.json', {
    schemaVersion: 1,
    id: 'snapshot-fixture',
    lifecycle: {
      id: 'lifecycle.records',
      kind: 'lifecycle',
      role: 'control-plane',
      path: 'assurance/lifecycle/records.json',
      schema: 'contracts/assurance/lifecycle.schema.json',
      visibility: 'public',
      capabilities: ['lifecycle'],
    },
    datasets: [
      {
        id: 'risks',
        kind: 'risks',
        role: 'dataset',
        path: 'assurance/risks/risks.json',
        schema: 'contracts/assurance/risk.schema.json',
        visibility: 'public',
        capabilities: ['records'],
        recordCollection: { path: 'records', identity: ['id'] },
        resources: [
          {
            id: 'risks.partition',
            kind: 'risks',
            role: 'partition',
            path: 'assurance/risks/partition.json',
            schema: 'contracts/assurance/risk.schema.json',
            visibility: 'public',
            capabilities: ['records'],
            recordCollection: { path: 'items', identity: ['id'] },
          },
        ],
      },
      {
        id: 'empty-evidence',
        kind: 'evidence',
        role: 'dataset',
        path: 'assurance/evidence/empty.json',
        schema: 'contracts/assurance/evidence.schema.json',
        visibility: 'public',
        capabilities: ['records'],
        recordCollection: { path: 'records', identity: ['id'] },
      },
    ],
    presentations: [
      {
        id: 'presentation.documents',
        kind: 'documents',
        role: 'presentation',
        path: 'assurance/presentation/documents.json',
        schema: 'contracts/assurance/presentation-document.schema.json',
        visibility: 'public',
        capabilities: ['summary-source'],
      },
    ],
    operations: [
      {
        id: 'operations.monitoring',
        kind: 'operations',
        role: 'operations',
        path: 'assurance/operations/monitoring.json',
        schema: 'contracts/assurance/operations.schema.json',
        visibility: 'public',
        capabilities: ['monitoring'],
      },
    ],
  });
  writeJson(root, 'assurance/lifecycle/records.json', {
    schemaVersion: 1,
    records: [{ id: 'LIFECYCLE-META-001' }],
    retiredRecords: [{ id: 'RETIRED-001' }],
  });
  writeJson(root, 'assurance/risks/risks.json', { records: [{ id: 'RISK-001' }] });
  writeJson(root, 'assurance/risks/partition.json', { items: [{ id: 'RISK-002' }] });
  writeJson(root, 'assurance/evidence/empty.json', { records: [] });
  writeJson(root, 'assurance/presentation/documents.json', { records: [{ id: 'PRESENTATION-001' }] });
  writeJson(root, 'assurance/operations/monitoring.json', { records: [{ id: 'OPERATION-001' }] });
  return root;
}

function runSnapshot(root: string): { bytes: string; snapshot: any; result: SpawnSyncReturns<string> } {
  const result = spawnSync(process.execPath, [generatorPath, ...snapshotArgs], {
    cwd: root,
    encoding: 'utf8',
  });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return { bytes: result.stdout, snapshot: JSON.parse(result.stdout), result };
}

function readJson<T = any>(root: string, relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T;
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('release assurance snapshot record counts', () => {
  it('counts only registry-declared record-bearing resources', () => {
    const root = createFixture();
    const { snapshot } = runSnapshot(root);

    expect(snapshot.recordCounts).toEqual({
      total: 2,
      byPath: {
        'assurance/risks/partition.json': 1,
        'assurance/risks/risks.json': 1,
      },
    });
    expect(snapshot.recordCounts.byPath).not.toHaveProperty('assurance/lifecycle/records.json');
    expect(snapshot.recordCounts.byPath).not.toHaveProperty('assurance/presentation/documents.json');
    expect(snapshot.recordCounts.byPath).not.toHaveProperty('assurance/operations/monitoring.json');
  });

  it('keeps lifecycle-only changes out of assurance-record totals while retaining them in the digest', () => {
    const root = createFixture();
    const first = runSnapshot(root).snapshot;
    const lifecycle = readJson(root, 'assurance/lifecycle/records.json');
    lifecycle.records.push({ id: 'LIFECYCLE-META-002' });
    lifecycle.retiredRecords.push({ id: 'RETIRED-002' });
    writeJson(root, 'assurance/lifecycle/records.json', lifecycle);
    const second = runSnapshot(root).snapshot;

    expect(second.recordCounts).toEqual(first.recordCounts);
    expect(second.contentDigest.value).not.toBe(first.contentDigest.value);
  });

  it('increments totals when canonical assurance records are added', () => {
    const root = createFixture();
    const risks = readJson(root, 'assurance/risks/risks.json');
    risks.records.push({ id: 'RISK-003' });
    writeJson(root, 'assurance/risks/risks.json', risks);
    const { snapshot } = runSnapshot(root);

    expect(snapshot.recordCounts.total).toBe(3);
    expect(snapshot.recordCounts.byPath['assurance/risks/risks.json']).toBe(2);
  });

  it('counts compatible partitions through their declared collection path', () => {
    const root = createFixture();
    const registry = readJson(root, 'assurance/registry.json');
    registry.datasets[0].resources.push({
      id: 'risks.compatible-partition',
      kind: 'risks',
      role: 'partition',
      path: 'assurance/risks/compatible-partition.json',
      schema: 'contracts/assurance/risk.schema.json',
      visibility: 'public',
      capabilities: ['records'],
      recordCollection: { path: 'entries', identity: ['id'] },
    });
    writeJson(root, 'assurance/registry.json', registry);
    writeJson(root, 'assurance/risks/compatible-partition.json', {
      entries: [{ id: 'RISK-003' }, { id: 'RISK-004' }],
    });
    const { snapshot } = runSnapshot(root);

    expect(snapshot.recordCounts.total).toBe(4);
    expect(snapshot.recordCounts.byPath['assurance/risks/compatible-partition.json']).toBe(2);
  });

  it('does not add empty record-bearing datasets to byPath', () => {
    const root = createFixture();
    const { snapshot } = runSnapshot(root);

    expect(snapshot.recordCounts.total).toBe(2);
    expect(snapshot.recordCounts.byPath).not.toHaveProperty('assurance/evidence/empty.json');
  });

  it('does not count retained lifecycle tombstones as assurance records', () => {
    const root = createFixture();
    const lifecycle = readJson(root, 'assurance/lifecycle/records.json');
    lifecycle.retiredRecords.push({ id: 'RETIRED-002' }, { id: 'RETIRED-003' });
    writeJson(root, 'assurance/lifecycle/records.json', lifecycle);
    const { snapshot } = runSnapshot(root);

    expect(snapshot.recordCounts.total).toBe(2);
    expect(snapshot.recordCounts.byPath).not.toHaveProperty('assurance/lifecycle/records.json');
  });

  it('preserves deterministic v1 output and exact-byte digest scope', () => {
    const root = createFixture();
    const first = runSnapshot(root);
    const second = runSnapshot(root);

    expect(second.bytes).toBe(first.bytes);
    expect(first.snapshot.schemaVersion).toBe(1);
    expect(Object.keys(first.snapshot)).toEqual([
      'schemaVersion',
      'registryId',
      'tag',
      'commit',
      'generatedAt',
      'recordCounts',
      'contentDigest',
    ]);
    expect(first.snapshot.contentDigest).toMatchObject({
      algorithm: 'sha256',
      scope: 'Sorted assurance/registry.json plus registry-declared canonical dataset paths; path + NUL + exact file bytes + NUL',
      fileCount: 7,
    });
    expect(first.snapshot.contentDigest.value).toMatch(/^[0-9a-f]{64}$/);
  });
});
