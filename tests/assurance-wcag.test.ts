import { describe, expect, it } from 'vitest';
import manifest from '../assurance/compliance/wcag-2.2.json';
import perceivable from '../assurance/compliance/wcag-2.2/perceivable.json';
import operable from '../assurance/compliance/wcag-2.2/operable.json';
import understandable from '../assurance/compliance/wcag-2.2/understandable.json';
import robust from '../assurance/compliance/wcag-2.2/robust.json';
import evidenceData from '../assurance/evidence/evidence.json';

const criteria = [...perceivable.criteria, ...operable.criteria, ...understandable.criteria, ...robust.criteria];
const evidenceIds = new Set(evidenceData.records.map((record) => record.id));

describe('WCAG 2.2 public criterion registry', () => {
  it('covers every current A, AA, and AAA success criterion without removed 4.1.1', () => {
    expect(criteria).toHaveLength(86);
    expect(new Set(criteria.map((record) => record.criterionId)).size).toBe(86);
    expect(criteria.some((record) => record.criterionId === '4.1.1')).toBe(false);
    const counts = { A: 0, AA: 0, AAA: 0 };
    for (const record of criteria) counts[record.level as keyof typeof counts] += 1;
    expect(counts).toEqual({ A: 31, AA: 24, AAA: 31 });
  });

  it('uses W3C primary sources and explicitly avoids conformance claims', () => {
    expect(manifest.sources.normative).toBe('https://www.w3.org/TR/WCAG22/');
    expect(manifest.sources.machineReadable).toBe('https://www.w3.org/WAI/WCAG22/wcag.json');
    expect(manifest.qualification.toLowerCase()).toContain('does not claim');
    expect(manifest.qualification.toLowerCase()).toContain('conformance');
    expect(manifest.qualification.toLowerCase()).toContain('certification');
    expect(JSON.stringify({ manifest, criteria }).toLowerCase()).not.toContain('wcag 2.2 conformant');
    expect(JSON.stringify({ manifest, criteria }).toLowerCase()).not.toContain('wcag 2.2 compliant');
  });

  it('distinguishes partial/no automation from required manual validation for every criterion', () => {
    for (const record of criteria) {
      expect(['partial', 'none']).toContain(record.validation.automated);
      expect(record.validation.manual).toBe('required');
      expect(record.gaps.length).toBeGreaterThan(0);
    }
  });

  it('resolves evidence IDs, owners, and freshness rules without stored counts', () => {
    expect('counts' in manifest).toBe(false);
    for (const record of criteria) {
      expect(record.owner.length).toBeGreaterThan(0);
      expect(record.evidenceIds.length).toBeGreaterThan(0);
      for (const evidenceId of record.evidenceIds) expect(evidenceIds.has(evidenceId), evidenceId).toBe(true);
      expect(record.freshnessRules).toEqual(['release-bound', 'content-change', 'interaction-change', 'quarterly-manual']);
    }
    for (const evidenceId of manifest.registryEvidenceIds) expect(evidenceIds.has(evidenceId), evidenceId).toBe(true);
  });
});
