import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import claims from '../assurance/claims/claims.json';
import risks from '../assurance/risks/risks.json';
import iso27001 from '../assurance/compliance/iso-27001-2022.json';
import iso42001 from '../assurance/compliance/iso-42001-2023.json';
import wcagManifest from '../assurance/compliance/wcag-2.2.json';
import perceivable from '../assurance/compliance/wcag-2.2/perceivable.json';
import operable from '../assurance/compliance/wcag-2.2/operable.json';
import understandable from '../assurance/compliance/wcag-2.2/understandable.json';
import robust from '../assurance/compliance/wcag-2.2/robust.json';
import governance from '../docs/governance/REFERENCE-REGISTRY.json';
import { publicAssuranceRegistry, publicComplianceRecords } from '../src/assurance/registry';

const wcag = [...perceivable.criteria, ...operable.criteria, ...understandable.criteria, ...robust.criteria];
const compliance = [...iso27001.records, ...iso42001.records, ...wcag];

describe('DEMO-127 canonical normalized assurance model', () => {
  it('keeps all previously published compliance IDs unchanged while making them source-owned', () => {
    expect(compliance).toHaveLength(287);
    for (const record of iso27001.records) expect(record.id).toBe(`ISO27001-${record.reference}`);
    for (const record of iso42001.records) expect(record.id).toBe(`ISO42001-${record.reference}`);
    for (const record of wcag) expect(record.id).toBe(`WCAG-${record.reference}`);
    expect(publicComplianceRecords.map((record) => record.id)).toEqual(expect.arrayContaining(compliance.map((record) => record.id)));
    expect(new Set(publicComplianceRecords.map((record) => record.id)).size).toBe(287);
  });

  it('stores only canonical normalized status spelling and explicit applicability', () => {
    const serialized = JSON.stringify({ iso27001, iso42001, wcag });
    expect(serialized).not.toContain('notApplicable');
    for (const record of [...iso27001.records, ...iso42001.records]) {
      expect(['met', 'partial', 'gap', 'not-applicable']).toContain(record.status);
      expect(record.applicability).toBe(record.status === 'not-applicable' ? 'not-applicable' : 'applicable');
      if (record.status === 'not-applicable') expect(record.rationale?.trim().length ?? 0).toBeGreaterThan(10);
    }
  });

  it('does not construct compliance IDs or compatibility statuses at runtime', () => {
    const source = readFileSync('src/assurance/registry.ts', 'utf8');
    expect(source).not.toContain('normalizeComplianceStatus');
    expect(source).not.toContain('normalizeIsoDataset');
    expect(source).not.toContain('normalizeIsoGroups');
    expect(source).not.toMatch(/ISO27001-\$\{|ISO42001-\$\{|WCAG-\$\{/);
    expect(source).not.toContain("=== 'notApplicable'");
  });

  it('repairs framework aliases into canonical typed relationships without dangling WCAG pseudo-criteria', () => {
    const serialized = JSON.stringify(claims);
    expect(serialized).not.toContain('ISO27001:');
    expect(serialized).not.toContain('ISO42001:');
    expect(serialized).not.toContain('WCAG22:feedback-support');
    expect(claims.records.some((record) => record.relationships.compliance.includes('ISO27001-A.5.15'))).toBe(true);
    expect(claims.records.some((record) => record.relationships.frameworks.includes('wcag-2.2'))).toBe(true);
    expect(compliance.some((record) => record.id === 'WCAG-feedback-support')).toBe(false);
  });

  it('resolves risk governance document references through the separate governance catalog', () => {
    const catalog = new Map(governance.records.map((record) => [record.reference, record.path]));
    for (const source of risks.sourceRegisters) expect(catalog.has(source.governanceDocumentReference)).toBe(true);
    for (const risk of risks.records) {
      expect(risk).not.toHaveProperty('controls');
      for (const reference of risk.relationships.governanceDocuments) expect(catalog.has(reference), reference).toBe(true);
    }
    for (const risk of publicAssuranceRegistry.risks) {
      for (const control of risk.controls) expect(control.repositoryPath).toBe(catalog.get(control.reference));
    }
  });

  it('keeps framework identity and presentation metadata canonical in registered JSON', () => {
    expect(iso27001.framework.id).toBe('iso-27001');
    expect(iso42001.framework.id).toBe('iso-42001');
    expect(wcagManifest.framework.id).toBe('wcag-2.2');
    expect(iso27001.framework.sourcePath).toBe('assurance/compliance/iso-27001-2022.json');
    expect(iso42001.framework.sourcePath).toBe('assurance/compliance/iso-42001-2023.json');
    expect(wcagManifest.framework.sourcePath).toBe('assurance/compliance/wcag-2.2.json');
  });
});
