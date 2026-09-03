import { describe, expect, it } from 'vitest';
import complianceData from '../assurance/compliance/iso-42001-2023.json';
import evidenceData from '../assurance/evidence/evidence.json';

const expectedClauseRefs = [
  '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.2', '5.3',
  '6.1', '6.1.1', '6.1.2', '6.1.3', '6.1.4', '6.2', '6.3',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.5.1', '7.5.2', '7.5.3',
  '8.1', '8.2', '8.3', '8.4',
  '9.1', '9.2', '9.2.1', '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3',
  '10.1', '10.2',
];
const expectedAnnexRefs = [
  'A.2.2', 'A.2.3', 'A.2.4',
  'A.3.2', 'A.3.3',
  'A.4.2', 'A.4.3', 'A.4.4', 'A.4.5', 'A.4.6',
  'A.5.2', 'A.5.3', 'A.5.4', 'A.5.5',
  'A.6.1.2', 'A.6.1.3',
  'A.6.2.2', 'A.6.2.3', 'A.6.2.4', 'A.6.2.5', 'A.6.2.6', 'A.6.2.7', 'A.6.2.8',
  'A.7.2', 'A.7.3', 'A.7.4', 'A.7.5', 'A.7.6',
  'A.8.2', 'A.8.3', 'A.8.4', 'A.8.5',
  'A.9.2', 'A.9.3', 'A.9.4',
  'A.10.2', 'A.10.3', 'A.10.4',
];

function flatten(groups: Record<string, Array<Record<string, unknown>>>) {
  return Object.entries(groups).flatMap(([posture, records]) =>
    records.map((record) => ({
      ...record,
      posture: posture === 'notApplicable' ? 'not-applicable' : posture,
      applicability: posture === 'notApplicable' ? 'not-applicable' : 'applicable',
    }))
  );
}

describe('ISO/IEC 42001:2023 public compliance mapping', () => {
  const clauses = flatten(complianceData.clauses);
  const annex = Object.values(complianceData.annexA).flatMap((groups) => flatten(groups));

  it('publishes every numbered clause reference and all 38 Annex A controls', () => {
    expect(clauses).toHaveLength(36);
    expect(annex).toHaveLength(38);
    expect(new Set(clauses.map((record) => record.reference))).toEqual(new Set(expectedClauseRefs));
    expect(new Set(annex.map((record) => record.reference))).toEqual(new Set(expectedAnnexRefs));
  });

  it('matches the approved SoA Annex A posture totals and source record', () => {
    const counts = annex.reduce<Record<string, number>>((result, record) => {
      result[record.posture as string] = (result[record.posture as string] ?? 0) + 1;
      return result;
    }, {});

    expect(counts).toEqual({
      partial: 34,
      met: 2,
      'not-applicable': 2,
    });
    expect(complianceData.sourceSoa).toMatchObject({
      id: 'WG-SOA-002',
      status: 'approved',
      assessmentDate: '2026-09-02',
      approval: {
        pullRequest: 56,
        mergeCommit: '1ae105da8ab6466e334a2faf4e6c63f5885c91df',
      },
    });
    expect(annex.filter((record) => record.posture === 'met').map((record) => record.reference).sort()).toEqual(['A.6.2.8', 'A.9.4']);
  });

  it('requires explicit evidence and rationale for every N/A control', () => {
    const notApplicable = annex.filter((record) => record.posture === 'not-applicable');
    expect(notApplicable.map((record) => record.reference).sort()).toEqual(['A.7.2', 'A.7.6']);
    for (const record of notApplicable) {
      expect(record.applicability).toBe('not-applicable');
      expect(typeof record.rationale).toBe('string');
      expect((record.rationale as string).length).toBeGreaterThan(10);
      expect((record.evidence as string[]).length).toBeGreaterThan(0);
    }
  });

  it('uses only resolvable EVD-* evidence references and derives counts', () => {
    const evidenceIds = new Set(evidenceData.records.map((record) => record.id));
    expect('counts' in complianceData).toBe(false);

    for (const record of [...clauses, ...annex]) {
      const evidence = record.evidence as string[];
      expect(evidence.length).toBeGreaterThan(0);
      expect(new Set(evidence).size).toBe(evidence.length);
      for (const evidenceId of evidence) {
        expect(evidenceId).toMatch(/^EVD-[A-Z]+-[0-9]{3,}$/);
        expect(evidenceIds.has(evidenceId)).toBe(true);
      }
    }
  });

  it('retains the approved public AI and MCP scope limitations', () => {
    expect(complianceData.scopeLimitations.capability.toLowerCase()).toContain('read-only');
    expect(complianceData.scopeLimitations.modelBoundary.toLowerCase()).toContain('general-purpose ai model');
    expect(complianceData.scopeLimitations.modelBoundary.toLowerCase()).toContain('provider reasoning');
    expect(complianceData.scopeLimitations.approvedAiMcpFamilies).toEqual(['OpenAI Codex', 'Anthropic Claude']);
    expect(complianceData.scopeLimitations.publicMcpDataBoundary.allowedD1Source).toBe('demo_records');
    expect(complianceData.scopeLimitations.publicMcpDataBoundary.excluded).toEqual(expect.arrayContaining([
      'visitor/session data', 'identity data', 'logs', 'audit records', 'R2 objects', 'secrets',
    ]));
    expect(complianceData.scopeLimitations.changeReviewRequiredFor).toEqual(expect.arrayContaining([
      'write authority', 'privileged authority', 'destructive authority', 'deployment authority',
      'private-data access', 'autonomous authority', 'third-provider use', 'reduced human oversight',
    ]));
    expect(complianceData.scopeLimitations.requiredReviewDomains).toEqual([
      'supplier', 'risk', 'impact', 'SoA', 'data', 'testing',
    ]);
    expect(complianceData.scopeLimitations.trainingBoundary.toLowerCase()).toContain('fine-tuning');
  });

  it('keeps labels short and explicitly paraphrased instead of reproducing normative text', () => {
    expect(complianceData.paraphraseNotice.toLowerCase()).toContain('paraphrase');
    expect(complianceData.qualification.toLowerCase()).toContain('not claimed');
    for (const record of [...clauses, ...annex]) {
      expect((record.title as string).length).toBeLessThanOrEqual(80);
    }
  });
});
