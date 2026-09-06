import { describe, expect, it } from 'vitest';
import registry from '../assurance/registry.json';
import manifest from '../assurance/compliance/wcag-2.2.json';
import perceivable from '../assurance/compliance/wcag-2.2/perceivable.json';
import operable from '../assurance/compliance/wcag-2.2/operable.json';
import understandable from '../assurance/compliance/wcag-2.2/understandable.json';
import robust from '../assurance/compliance/wcag-2.2/robust.json';
import evidenceData from '../assurance/evidence/evidence.json';
import { assuranceRelationshipIds } from '../src/assurance/relationship-contract.js';

const criteria = [...perceivable.criteria, ...operable.criteria, ...understandable.criteria, ...robust.criteria];
const evidenceIds = new Set(evidenceData.records.map((record) => record.id));

const complianceOwner = (registry as any).datasets.find((resource: any) => resource.id === 'compliance.iso-27001');
const frameworkOwner = complianceOwner.resources.find((resource: any) => resource.id === 'compliance.wcag-2.2');

describe('WCAG 2.2 canonical public criterion registry', () => {
  it('preserves all current criterion IDs explicitly without removed 4.1.1', () => {
    expect(criteria).toHaveLength(86);
    expect(new Set(criteria.map((record) => record.id)).size).toBe(86);
    expect(criteria.some((record) => record.reference === '4.1.1')).toBe(false);
    for (const record of criteria) expect(record.id).toBe(`WCAG-${record.reference}`);
    const counts = { A: 0, AA: 0, AAA: 0 };
    for (const record of criteria) counts[record.level as keyof typeof counts] += 1;
    expect(counts).toEqual({ A: 31, AA: 24, AAA: 31 });
  });

  it('uses W3C primary sources and explicitly avoids conformance claims', () => {
    expect(manifest.sources.normative).toBe('https://www.w3.org/TR/WCAG22/');
    expect(manifest.sources.machineReadable).toBe('https://www.w3.org/WAI/WCAG22/wcag.json');
    expect({ ...frameworkOwner.framework, sourcePath: frameworkOwner.path }).toMatchObject({ id: 'wcag-2.2', label: 'WCAG 2.2', sourcePath: 'assurance/compliance/wcag-2.2.json' });
    expect(frameworkOwner.framework.qualification.toLowerCase()).toContain('does not claim');
    expect(frameworkOwner.framework.qualification.toLowerCase()).toContain('conformance');
    expect(frameworkOwner.framework.qualification.toLowerCase()).toContain('certification');
    expect(JSON.stringify({ manifest, criteria }).toLowerCase()).not.toContain('wcag 2.2 conformant');
    expect(JSON.stringify({ manifest, criteria }).toLowerCase()).not.toContain('wcag 2.2 compliant');
  });

  it('distinguishes partial/no automation from required manual validation for every criterion', () => {
    for (const record of criteria) {
      expect(['partial', 'none']).toContain(record.validation.automated);
      expect(record.validation.manual).toBe('required');
      expect(record.gaps.length).toBeGreaterThan(0);
      expect(record.applicability).toBe('applicable');
    }
  });

  it('resolves typed evidence relationships, owners, and freshness rules without stored counts', () => {
    expect('counts' in manifest).toBe(false);
    for (const record of criteria) {
      expect(record.owner.length).toBeGreaterThan(0);
      const relationshipEvidenceIds = assuranceRelationshipIds(record.relationships, 'evidence');
      expect(relationshipEvidenceIds.length).toBeGreaterThan(0);
      for (const evidenceId of relationshipEvidenceIds) expect(evidenceIds.has(evidenceId), evidenceId).toBe(true);
      expect(record.freshnessRules).toEqual(['release-bound', 'content-change', 'interaction-change', 'quarterly-manual']);
      expect(record).not.toHaveProperty('criterionId');
      expect(record).not.toHaveProperty('evidenceIds');
    }
    for (const evidenceId of assuranceRelationshipIds(manifest.registryRelationships, 'evidence')) expect(evidenceIds.has(evidenceId), evidenceId).toBe(true);
    expect(manifest).not.toHaveProperty('registryEvidenceIds');
  });
});
