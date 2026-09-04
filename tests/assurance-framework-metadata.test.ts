import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse } from '../src/api/assurance';
import { assuranceComplianceFrameworks, assuranceRegistryResources } from '../src/assurance/model';
import { listAssuranceRecords } from '../src/assurance/service';

describe('canonical compliance framework metadata', () => {
  it('derives framework presentation metadata from registered framework resources', () => {
    const registered = assuranceRegistryResources
      .filter((resource) => resource.kind === 'compliance' && resource.framework && (resource.capabilities.includes('summary-source') || resource.capabilities.includes('manifest')))
      .map((resource) => ({ ...resource.framework!, sourcePath: resource.path }));
    expect(assuranceComplianceFrameworks).toEqual(registered);
    expect(assuranceComplianceFrameworks.map((framework) => framework.id)).toEqual(['iso-27001', 'iso-42001', 'wcag-2.2']);
  });

  it('enriches runtime compliance records from registry-owned framework metadata', () => {
    const records = listAssuranceRecords('compliance');
    for (const record of records) {
      const framework = assuranceComplianceFrameworks.find((candidate) => candidate.id === record.framework);
      expect(framework).toBeDefined();
      expect(record.frameworkLabel).toBe(framework?.label);
      expect(record.sourcePath).toEqual(expect.stringMatching(/^assurance\/compliance\//));
      expect(record.section.length).toBeGreaterThan(0);
    }
  });

  it('publishes the canonical framework metadata on current records without a compatibility serializer', async () => {
    const response = assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance?framework=wcag-2.2&limit=1'));
    const body = await response.json() as { records: Array<{ framework: string; frameworkLabel: string; sourcePath: string; relationships: Record<string, string[]> }> };
    expect(body.records).toHaveLength(1);
    expect(body.records[0]).toMatchObject({ framework: 'wcag-2.2', frameworkLabel: 'WCAG 2.2' });
    expect(body.records[0].sourcePath).toContain('assurance/compliance/');
    expect(body.records[0].relationships).toBeDefined();
    expect(existsSync('src/api/assurance-v1.ts')).toBe(false);
  });
});