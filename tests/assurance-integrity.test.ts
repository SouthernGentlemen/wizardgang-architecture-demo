import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assuranceComplianceResponse } from '../src/api/assurance';
import { deriveComplianceCounts, type PublicComplianceRecord } from '../src/assurance/registry';
import { renderComplianceDemo } from '../src/demos/compliance-page';
import type { Env } from '../src/types';

const repositoryRoot = process.cwd();
const fixtureRoots: string[] = [];
const ignoredFixtureParts = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'coverage', 'artifacts']);
const validationNow = '2026-09-03T03:59:00Z';

function createFixture(): string {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'demo-130-assurance-'));
  cpSync(repositoryRoot, fixtureRoot, { recursive: true, filter(source) {
    const pathFromRoot = relative(repositoryRoot, source);
    if (!pathFromRoot) return true;
    return !pathFromRoot.split(sep).some((part) => ignoredFixtureParts.has(part));
  } });
  fixtureRoots.push(fixtureRoot);
  return fixtureRoot;
}
function readJson<T = any>(fixtureRoot: string, relativePath: string): T { return JSON.parse(readFileSync(join(fixtureRoot, relativePath), 'utf8')) as T; }
function writeJson(fixtureRoot: string, relativePath: string, value: unknown): void { writeFileSync(join(fixtureRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`); }
function runIntegrity(fixtureRoot: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['scripts/validate-assurance-integrity.mjs'], { cwd: fixtureRoot, encoding: 'utf8', env: { ...process.env, ASSURANCE_VALIDATION_NOW: validationNow } });
}
function runRegisteredSchemas(fixtureRoot: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['scripts/validate-assurance-registry.mjs'], { cwd: fixtureRoot, encoding: 'utf8' });
}
function expectRejected(result: SpawnSyncReturns<string>, messageFragment: string): void {
  expect(result.status).not.toBe(0);
  expect(`${result.stdout}\n${result.stderr}`).toContain(messageFragment);
}
afterEach(() => { while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true }); });

describe('assurance integrity validator rejection matrix', () => {
  it('rejects duplicate public IDs across assurance domains', () => {
    const fixtureRoot = createFixture();
    const evidence = readJson(fixtureRoot, 'assurance/evidence/evidence.json');
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records[0].id = evidence.records[0].id;
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);
    expectRejected(runIntegrity(fixtureRoot), 'duplicate public ID');
  });
  it('rejects invalid public statuses through the registered schema', () => {
    const fixtureRoot = createFixture();
    const risks = readJson(fixtureRoot, 'assurance/risks/risks.json');
    risks.records[0].status = 'closed';
    writeJson(fixtureRoot, 'assurance/risks/risks.json', risks);
    expectRejected(runRegisteredSchemas(fixtureRoot), 'must be one of "open", "treating"');
  });
  it('rejects missing N/A rationales through the registered schema', () => {
    const fixtureRoot = createFixture();
    const compliance = readJson(fixtureRoot, 'assurance/compliance/iso-27001-2022.json');
    const target = compliance.records.find((record: any) => record.status === 'not-applicable');
    expect(target).toBeDefined();
    delete target.rationale;
    writeJson(fixtureRoot, 'assurance/compliance/iso-27001-2022.json', compliance);
    expectRejected(runRegisteredSchemas(fixtureRoot), 'must contain required property rationale');
  });
  it('rejects unresolved evidence relationships', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records[0].relationships.evidence = ['EVD-FAKE-999'];
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);
    expectRejected(runIntegrity(fixtureRoot), 'unresolved evidence relationship EVD-FAKE-999');
  });
  it('rejects unresolved risk relationships', () => {
    const fixtureRoot = createFixture();
    const exercises = readJson(fixtureRoot, 'assurance/incidents/exercises.json');
    exercises.records[0].relationships.risks = ['SEC-RISK-999'];
    writeJson(fixtureRoot, 'assurance/incidents/exercises.json', exercises);
    expectRejected(runIntegrity(fixtureRoot), 'unresolved risks relationship SEC-RISK-999');
  });
  it('resolves existing exercise/objective links through the canonical objective dataset', () => {
    const fixtureRoot = createFixture();
    const exercises = readJson(fixtureRoot, 'assurance/incidents/exercises.json');
    expect(exercises.records[0].relationships.objectives).toEqual(['SEC-OBJ-005']);
    expect(runIntegrity(fixtureRoot).status).toBe(0);

    const objectives = readJson(fixtureRoot, 'assurance/objectives/objectives.json');
    objectives.records = objectives.records.filter((record: { id: string }) => record.id !== 'SEC-OBJ-005');
    writeJson(fixtureRoot, 'assurance/objectives/objectives.json', objectives);
    expectRejected(runIntegrity(fixtureRoot), 'unresolved objectives relationship SEC-OBJ-005');
  });
  it('rejects unknown objective relationship targets', () => {
    const fixtureRoot = createFixture();
    const exercises = readJson(fixtureRoot, 'assurance/incidents/exercises.json');
    exercises.records[0].relationships.objectives = ['SEC-OBJ-999'];
    writeJson(fixtureRoot, 'assurance/incidents/exercises.json', exercises);
    expectRejected(runIntegrity(fixtureRoot), 'unresolved objectives relationship SEC-OBJ-999');
  });
  it('rejects unresolved incident relationships from disposable advisory fixtures', () => {
    const fixtureRoot = createFixture();
    const advisories = readJson(fixtureRoot, 'assurance/advisories/advisories.json');
    const relationships = structuredClone(advisories.records[0]?.relationships ?? {
      evidence: [], compliance: [], frameworks: [], claims: [], risks: [], controls: [], incidents: [], exercises: [], advisories: [], governanceDocuments: [], objectives: [],
    });
    relationships.incidents = ['INC-999'];
    advisories.records.push({ id: 'GHSA-aaaa-bbbb-cccc', recordType: 'advisory', title: 'Validation fixture advisory', severity: 'low', summary: 'Synthetic record used only to prove referential rejection.', publishedAt: '2026-09-02T12:00:00Z', fixedReleases: ['v0.13.0'], relationships });
    writeJson(fixtureRoot, 'assurance/advisories/advisories.json', advisories);
    expectRejected(runIntegrity(fixtureRoot), 'unresolved incidents relationship INC-999');
  });
  it('rejects unresolved canonical advisory relationships and wrong-family IDs at the correct validation layer', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records[0].relationships.advisories = ['GHSA-zzzz-yyyy-xxxx'];
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);
    expectRejected(runIntegrity(fixtureRoot), 'unresolved advisories relationship GHSA-zzzz-yyyy-xxxx');

    claims.records[0].relationships.advisories = [];
    claims.records[0].relationships.evidence = ['SEC-RISK-001'];
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);
    expectRejected(runRegisteredSchemas(fixtureRoot), 'must match pattern ^EVD-[A-Z]+-[0-9]{3,}$');
  });
  it('rejects unknown relationship types through the shared relationship schema', () => {
    const fixtureRoot = createFixture();
    const claims = readJson(fixtureRoot, 'assurance/claims/claims.json');
    claims.records[0].relationships.widgets = ['EVD-CI-001'];
    writeJson(fixtureRoot, 'assurance/claims/claims.json', claims);
    expectRejected(runRegisteredSchemas(fixtureRoot), 'additional property widgets is not allowed');
  });
  it('rejects stale time-bound evidence', () => {
    const fixtureRoot = createFixture();
    const evidence = readJson(fixtureRoot, 'assurance/evidence/evidence.json');
    evidence.records[0].kind = 'observation'; evidence.records[0].freshnessPolicy = 'observation-bound'; evidence.records[0].observedAt = '2026-08-01T00:00:00Z'; evidence.records[0].validUntil = '2026-08-02T00:00:00Z';
    writeJson(fixtureRoot, 'assurance/evidence/evidence.json', evidence);
    expectRejected(runIntegrity(fixtureRoot), 'time-bound evidence is stale');
  });
  it('rejects missing public assurance routes', () => {
    const fixtureRoot = createFixture();
    const manifest = readJson<any[]>(fixtureRoot, 'docs/route-manifest.json');
    writeJson(fixtureRoot, 'docs/route-manifest.json', manifest.filter((entry) => entry.route !== '/compliance'));
    expectRejected(runIntegrity(fixtureRoot), 'required public assurance route is missing: /compliance');
  });
  it('rejects stored counts that can drift from canonical records', () => {
    const fixtureRoot = createFixture();
    const wcag = readJson(fixtureRoot, 'assurance/compliance/wcag-2.2.json'); wcag.counts = { total: 999 };
    writeJson(fixtureRoot, 'assurance/compliance/wcag-2.2.json', wcag);
    expectRejected(runIntegrity(fixtureRoot), 'counts is derived presentation data and must not be stored');
  });
  it('rejects unsafe public fields', () => {
    const fixtureRoot = createFixture();
    const risks = readJson(fixtureRoot, 'assurance/risks/risks.json'); risks.records[0].acceptanceAuthority = 'fixture-only';
    writeJson(fixtureRoot, 'assurance/risks/risks.json', risks);
    expectRejected(runIntegrity(fixtureRoot), 'unsafe public field acceptanceAuthority');
  });
});

type ComplianceApiBody = { counts: ReturnType<typeof deriveComplianceCounts>; totalAvailable: number; records: PublicComplianceRecord[] };
const environment = { GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main', DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567' } as unknown as Env;
function complianceProjectionErrors(body: ComplianceApiBody, html: string): string[] {
  const errors: string[] = [];
  const htmlIds = [...html.matchAll(/<tr id="((?:ISO27001|ISO42001|WCAG)-[^"]+)">/g)].map((match) => match[1]);
  const apiIds = body.records.map((record) => record.id);
  if (JSON.stringify(htmlIds) !== JSON.stringify(apiIds)) errors.push('HTML record IDs do not match the API record set');
  const counts = body.counts;
  const summary = `<strong>${counts.total}</strong> matching of ${body.totalAvailable} records · ${counts.byFramework['iso-27001']} ISO 27001 · ${counts.byFramework['iso-42001']} ISO 42001 · ${counts.byFramework['wcag-2.2']} WCAG.`;
  if (!html.includes(summary)) errors.push('HTML framework counts do not match API counts');
  const statusSummary = `Statuses: ${counts.byStatus.met} met · ${counts.byStatus.partial} partial · ${counts.byStatus.gap} gap · ${counts.byStatus['not-applicable']} not applicable · ${counts.byStatus.demonstrated} demonstrated · ${counts.byStatus['not-observed']} not observed. WCAG levels: ${counts.byLevel.A} A · ${counts.byLevel.AA} AA · ${counts.byLevel.AAA} AAA.`;
  if (!html.includes(statusSummary)) errors.push('HTML status and level counts do not match API counts');
  return errors;
}

describe('assurance API and HTML consistency', () => {
  it.each(['', '?framework=iso-27001&status=partial', '?framework=iso-42001&status=not-applicable', '?framework=wcag-2.2&status=partial&level=AA', '?framework=wcag-2.2&status=demonstrated&level=A'])('keeps API records and HTML rows/counts identical for %s', async (query) => {
    const apiResponse = assuranceComplianceResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/compliance${query}`));
    const body = await apiResponse.json() as ComplianceApiBody;
    const htmlResponse = renderComplianceDemo(new Request(`https://demo.wizardgang.ai/compliance${query}`), environment);
    const html = await htmlResponse.text();
    expect(complianceProjectionErrors(body, html)).toEqual([]);
  });
  it('detects count drift and row drift in the consistency assertion', async () => {
    const query = '?framework=wcag-2.2&status=partial&level=AA';
    const apiResponse = assuranceComplianceResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/compliance${query}`));
    const body = await apiResponse.json() as ComplianceApiBody;
    const htmlResponse = renderComplianceDemo(new Request(`https://demo.wizardgang.ai/compliance${query}`), environment);
    const html = await htmlResponse.text();
    const countDrift = structuredClone(body); countDrift.counts.total += 1;
    expect(complianceProjectionErrors(countDrift, html)).toContain('HTML framework counts do not match API counts');
    const firstId = body.records[0]?.id; expect(firstId).toBeDefined();
    const rowDriftHtml = html.replace(`id="${firstId}"`, `id="REMOVED-${firstId}"`);
    expect(complianceProjectionErrors(body, rowDriftHtml)).toContain('HTML record IDs do not match the API record set');
  });
});