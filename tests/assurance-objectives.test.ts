import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

function run(root: string, script: string, args: string[] = []): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script, ...args], {
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

  it('rejects generated objective-table drift and regenerates from canonical JSON', () => {
    const fixtureRoot = createFixture();
    const target = join(fixtureRoot, 'docs/governance/registers/OBJECTIVES.md');
    const current = readFileSync(target, 'utf8');
    writeFileSync(target, current.replace('| SEC-OBJ-005 | Incident readiness |', '| SEC-OBJ-005 | Drifted incident readiness |'));

    const stale = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']);
    expect(stale.status).not.toBe(0);
    expect(output(stale)).toContain('generated assurance presentation is stale or was edited independently');

    const generated = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs');
    expect(generated.status, output(generated)).toBe(0);
    expect(readFileSync(target, 'utf8')).toContain('| SEC-OBJ-005 | Incident readiness |');
    expect(run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']).status).toBe(0);
  });

  it('projects canonical objective changes into the generated table without changing narrative policy', () => {
    const fixtureRoot = createFixture();
    const target = join(fixtureRoot, 'docs/governance/registers/OBJECTIVES.md');
    const before = readFileSync(target, 'utf8');
    const narrative = before.slice(before.indexOf('## 4. Measurement Notes'));
    const objectives = readJson(fixtureRoot, 'assurance/objectives/objectives.json');
    const objective = objectives.records.find((record: { id: string }) => record.id === 'SEC-OBJ-005');
    expect(objective).toBeDefined();
    objective.reviewCadence = 'Fixture-only cadence';
    writeJson(fixtureRoot, 'assurance/objectives/objectives.json', objectives);

    const generated = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs');
    expect(generated.status, output(generated)).toBe(0);
    const after = readFileSync(target, 'utf8');
    expect(after).toContain('| Fixture-only cadence | Planned |');
    expect(after.slice(after.indexOf('## 4. Measurement Notes'))).toBe(narrative);
  });

  it('does not use Markdown objective rows as relationship authority', () => {
    const fixtureRoot = createFixture();
    const target = join(fixtureRoot, 'docs/governance/registers/OBJECTIVES.md');
    const current = readFileSync(target, 'utf8');
    writeFileSync(target, current.replace('| SEC-OBJ-005 | Incident readiness |', '| SEC-OBJ-999 | Incident readiness |'));

    const integrity = run(fixtureRoot, 'scripts/validate-assurance-integrity.mjs');
    expect(integrity.status, output(integrity)).toBe(0);
    const summaries = run(fixtureRoot, 'scripts/generate-assurance-summaries.mjs', ['--check']);
    expect(summaries.status).not.toBe(0);

    const validator = readFileSync(join(fixtureRoot, 'scripts/validate-assurance-integrity.mjs'), 'utf8');
    expect(validator).not.toContain('objectiveDocument');
    expect(validator).not.toContain('matchAll(/\\|\\s*([A-Z]+-OBJ-');
  });
});
