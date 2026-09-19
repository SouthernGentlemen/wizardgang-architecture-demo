import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const validationNow = '2026-09-03T03:59:00Z';

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-142-objectives-'));
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
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ASSURANCE_VALIDATION_NOW: validationNow },
  });
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

afterEach(() => {
  while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});

describe('canonical governance objectives', () => {
  it('gives every canonical objective explicit approved lifecycle and shared disclosure coverage', () => {
    const objectives = readJson(repositoryRoot, 'assurance/objectives/objectives.json');
    const lifecycle = readJson(repositoryRoot, 'assurance/lifecycle/records.json');
    const metadata = new Map(lifecycle.records.map((entry: any) => [entry.id, entry]));
    const reviews = new Map(lifecycle.reviewEvents.map((entry: any) => [entry.id, entry]));

    expect(objectives.records).toHaveLength(12);
    const objectiveReviewRefs = new Set<string>();
    for (const objective of objectives.records) {
      const entry = metadata.get(objective.id) as any;
      expect(entry).toBeDefined();
      expect(entry.lifecycle).toBe('Approved');
      expect(entry.disclosureReview).toBeUndefined();
      expect(entry.reviewRef).toBe('review-objectives-pr56');
      objectiveReviewRefs.add(entry.reviewRef);

      const review = reviews.get(entry.reviewRef) as any;
      expect(review).toBeDefined();
      expect(review.status).toBe('Reviewed');
      expect(review.basis).toContain('PR #56');
      expect(review.basis).toContain('1ae105da8ab6466e334a2faf4e6c63f5885c91df');
    }
    expect([...objectiveReviewRefs]).toEqual(['review-objectives-pr56']);
  });

  it('keeps the stable objective presentation identity bound to structured objectives only', () => {
    const presentation = readJson(repositoryRoot, 'assurance/presentation/documents.json');
    const document = presentation.documents.find((entry: any) => entry.id === 'WG-OBJ-001');
    expect(document).toBeDefined();
    expect(document.sourceDatasets).toEqual(['objectives']);
    expect(document).not.toHaveProperty('governanceDocumentReference');
    expect(document).not.toHaveProperty('approval');
    expect(existsSync(join(repositoryRoot, 'docs/governance/registers/OBJECTIVES.md'))).toBe(false);
    expect(existsSync(join(repositoryRoot, 'scripts/generate-assurance-summaries.mjs'))).toBe(false);
  });

  it('accepts canonical objective content changes without a Markdown projection step', () => {
    const fixtureRoot = createFixture();
    const objectives = readJson(fixtureRoot, 'assurance/objectives/objectives.json');
    const objective = objectives.records.find((record: { id: string }) => record.id === 'SEC-OBJ-005');
    expect(objective).toBeDefined();
    objective.reviewCadence = 'Fixture-only cadence';
    writeJson(fixtureRoot, 'assurance/objectives/objectives.json', objectives);

    const integrity = run(fixtureRoot, 'scripts/validate-assurance-integrity.mjs');
    expect(integrity.status, output(integrity)).toBe(0);
    expect(readJson(fixtureRoot, 'assurance/objectives/objectives.json').records
      .find((record: { id: string }) => record.id === 'SEC-OBJ-005').reviewCadence).toBe('Fixture-only cadence');
  });

  it('uses structured objective IDs as relationship authority', () => {
    const fixtureRoot = createFixture();
    const objectives = readJson(fixtureRoot, 'assurance/objectives/objectives.json');
    const objective = objectives.records.find((record: { id: string }) => record.id === 'SEC-OBJ-005');
    expect(objective).toBeDefined();
    objective.id = 'SEC-OBJ-999';
    writeJson(fixtureRoot, 'assurance/objectives/objectives.json', objectives);

    const integrity = run(fixtureRoot, 'scripts/validate-assurance-integrity.mjs');
    expect(integrity.status).not.toBe(0);
    expect(output(integrity)).toContain('SEC-OBJ-005');

    const validator = readFileSync(join(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'), 'utf8');
    expect(validator).not.toContain('objectiveDocument');
    expect(validator).not.toContain('matchAll(/\\|\\s*([A-Z]+-OBJ-');
  });
});
