import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registry from '../assurance/registry.json';
import complianceData from '../assurance/compliance/iso-42001-2023.json';
import evidenceData from '../assurance/evidence/evidence.json';
import { assuranceRelationshipIds } from '../src/assurance/relationship-contract.js';

const expectedClauseRefs = [
  '4.1', '4.2', '4.3', '4.4', '5.1', '5.2', '5.3', '6.1', '6.1.1', '6.1.2', '6.1.3', '6.1.4', '6.2', '6.3',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.5.1', '7.5.2', '7.5.3', '8.1', '8.2', '8.3', '8.4', '9.1', '9.2', '9.2.1',
  '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3', '10.1', '10.2',
];
const expectedAnnexRefs = [
  'A.2.2', 'A.2.3', 'A.2.4', 'A.3.2', 'A.3.3', 'A.4.2', 'A.4.3', 'A.4.4', 'A.4.5', 'A.4.6',
  'A.5.2', 'A.5.3', 'A.5.4', 'A.5.5', 'A.6.1.2', 'A.6.1.3', 'A.6.2.2', 'A.6.2.3', 'A.6.2.4', 'A.6.2.5',
  'A.6.2.6', 'A.6.2.7', 'A.6.2.8', 'A.7.2', 'A.7.3', 'A.7.4', 'A.7.5', 'A.7.6', 'A.8.2', 'A.8.3', 'A.8.4', 'A.8.5',
  'A.9.2', 'A.9.3', 'A.9.4', 'A.10.2', 'A.10.3', 'A.10.4',
];

const complianceOwner = (registry as any).datasets.find((resource: any) => resource.id === 'compliance.iso-27001');
const frameworkOwner = complianceOwner.resources.find((resource: any) => resource.id === 'compliance.iso-42001');

function postureCounts(records: typeof complianceData.records) {
  const counts: Record<string, number> = { met: 0, partial: 0, gap: 0, 'not-applicable': 0 };
  for (const record of records.filter((record) => record.kind === 'control')) counts[record.status] = (counts[record.status] ?? 0) + 1;
  return counts;
}

function expectApprovalProvenance(sourceSoa: typeof complianceData.sourceSoa) {
  expect(sourceSoa.approval.pullRequest).toEqual(expect.any(Number));
  expect(sourceSoa.approval.pullRequest).toBeGreaterThan(0);
  expect(sourceSoa.approval.mergeCommit).toMatch(/^[0-9a-f]{40}$/);
}

describe('ISO/IEC 42001:2023 canonical public compliance records', () => {
  const clauses = complianceData.records.filter((record) => record.kind === 'clause');
  const annex = complianceData.records.filter((record) => record.kind === 'control');

  it('preserves every public ID and reference explicitly in JSON', () => {
    expect(clauses).toHaveLength(36);
    expect(annex).toHaveLength(38);
    expect(new Set(clauses.map((record) => record.reference))).toEqual(new Set(expectedClauseRefs));
    expect(new Set(annex.map((record) => record.reference))).toEqual(new Set(expectedAnnexRefs));
    for (const record of complianceData.records) expect(record.id).toBe(`ISO42001-${record.reference}`);
  });

  it('derives the current SoA posture and generated summary from canonical records', () => {
    const counts = postureCounts(complianceData.records);
    const summary = readFileSync('docs/governance/soa/ISO-42001-SOA.md', 'utf8');
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(annex.length);
    expect(summary).toContain(`| ${annex.length} | ${counts.met} | ${counts.partial} | ${counts.gap} | ${counts['not-applicable']} |`);
    expect(JSON.stringify(complianceData)).not.toContain('notApplicable');
    expect(complianceData.sourceSoa).toMatchObject({
      id: 'WG-SOA-002', governanceDocumentReference: 'WG-SOA-002', status: 'approved',
    });
    expectApprovalProvenance(complianceData.sourceSoa);
  });

  it('requires explicit evidence and rationale for every N/A control without freezing which controls are N/A', () => {
    const notApplicable = annex.filter((record) => record.status === 'not-applicable');
    for (const record of notApplicable) {
      expect(record.applicability).toBe('not-applicable');
      expect(record.rationale?.length ?? 0).toBeGreaterThan(10);
      expect(assuranceRelationshipIds(record.relationships, 'evidence').length).toBeGreaterThan(0);
    }
  });

  it('uses only resolvable typed evidence relationships and derives counts', () => {
    const evidenceIds = new Set(evidenceData.records.map((record) => record.id));
    expect('counts' in complianceData).toBe(false);
    for (const record of complianceData.records) {
      const relationshipEvidenceIds = assuranceRelationshipIds(record.relationships, 'evidence');
      expect(relationshipEvidenceIds.length).toBeGreaterThan(0);
      for (const evidenceId of relationshipEvidenceIds) expect(evidenceIds.has(evidenceId), evidenceId).toBe(true);
    }
  });

  it('retains the approved public AI and MCP scope limitations', () => {
    expect(complianceData.scopeLimitations.capability.toLowerCase()).toContain('read-only');
    expect(complianceData.scopeLimitations.modelBoundary.toLowerCase()).toContain('general-purpose ai model');
    expect(complianceData.scopeLimitations.modelBoundary.toLowerCase()).toContain('provider reasoning');
    expect(complianceData.scopeLimitations.approvedAiMcpFamilies).toEqual(['OpenAI Codex', 'Anthropic Claude']);
    expect(complianceData.scopeLimitations.publicMcpDataBoundary.allowedD1Source).toBe('demo_records');
    expect(complianceData.scopeLimitations.publicMcpDataBoundary.excluded).toEqual(expect.arrayContaining(['visitor/session data', 'identity data', 'logs', 'audit records', 'R2 objects', 'secrets']));
    expect(complianceData.scopeLimitations.changeReviewRequiredFor).toEqual(expect.arrayContaining(['write authority', 'privileged authority', 'destructive authority', 'deployment authority', 'private-data access', 'autonomous authority', 'third-provider use', 'reduced human oversight']));
    expect(complianceData.scopeLimitations.requiredReviewDomains).toEqual(['supplier', 'risk', 'impact', 'SoA', 'data', 'testing']);
    expect(complianceData.scopeLimitations.trainingBoundary.toLowerCase()).toContain('fine-tuning');
  });

  it('reads framework presentation metadata from the canonical registry owner', () => {
    expect({ ...frameworkOwner.framework, sourcePath: frameworkOwner.path }).toMatchObject({ id: 'iso-42001', label: 'ISO/IEC 42001:2023', sourcePath: 'assurance/compliance/iso-42001-2023.json' });
    expect(complianceData.paraphraseNotice.toLowerCase()).toContain('paraphrase');
    expect(frameworkOwner.framework.qualification.toLowerCase()).toContain('not claimed');
    for (const record of complianceData.records) expect(record.title.length).toBeLessThanOrEqual(80);
  });
});
