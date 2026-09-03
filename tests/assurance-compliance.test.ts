import { describe, expect, it } from 'vitest';
import complianceData from '../assurance/compliance/iso-27001-2022.json';
import evidenceData from '../assurance/evidence/evidence.json';

const expectedClauseRefs = [
  '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.2', '5.3',
  '6.1', '6.1.1', '6.1.2', '6.1.3', '6.2', '6.3',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.5.1', '7.5.2', '7.5.3',
  '8.1', '8.2', '8.3',
  '9.1', '9.2', '9.2.1', '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3',
  '10.1', '10.2',
];
const expectedAnnexRefs = [
  ...Array.from({ length: 37 }, (_, index) => `A.5.${index + 1}`),
  ...Array.from({ length: 8 }, (_, index) => `A.6.${index + 1}`),
  ...Array.from({ length: 14 }, (_, index) => `A.7.${index + 1}`),
  ...Array.from({ length: 34 }, (_, index) => `A.8.${index + 1}`),
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

describe('ISO/IEC 27001:2022 public compliance mapping', () => {
  const clauses = flatten(complianceData.clauses);
  const annex = Object.values(complianceData.annexA).flatMap((groups) => flatten(groups));

  it('publishes every numbered clause reference and all 93 Annex A controls', () => {
    expect(clauses).toHaveLength(34);
    expect(annex).toHaveLength(93);
    expect(new Set(clauses.map((record) => record.reference))).toEqual(new Set(expectedClauseRefs));
    expect(new Set(annex.map((record) => record.reference))).toEqual(new Set(expectedAnnexRefs));
  });

  it('matches the approved SoA Annex A posture totals', () => {
    const counts = annex.reduce<Record<string, number>>((result, record) => {
      result[record.posture as string] = (result[record.posture as string] ?? 0) + 1;
      return result;
    }, {});

    expect(counts).toEqual({
      partial: 62,
      gap: 3,
      'not-applicable': 25,
      met: 3,
    });
    expect(complianceData.sourceSoa).toMatchObject({
      id: 'WG-SOA-001',
      status: 'approved',
      assessmentDate: '2026-09-02',
      approval: {
        pullRequest: 56,
        mergeCommit: '1ae105da8ab6466e334a2faf4e6c63f5885c91df',
      },
    });
  });

  it('requires an explicit rationale for every N/A control', () => {
    const notApplicable = annex.filter((record) => record.posture === 'not-applicable');
    expect(notApplicable).toHaveLength(25);
    for (const record of notApplicable) {
      expect(record.applicability).toBe('not-applicable');
      expect(typeof record.rationale).toBe('string');
      expect((record.rationale as string).length).toBeGreaterThan(10);
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

  it('keeps labels short and explicitly paraphrased instead of reproducing normative text', () => {
    expect(complianceData.paraphraseNotice.toLowerCase()).toContain('paraphrase');
    expect(complianceData.qualification.toLowerCase()).toContain('not claimed');
    for (const record of [...clauses, ...annex]) {
      expect((record.title as string).length).toBeLessThanOrEqual(80);
    }
  });
});
