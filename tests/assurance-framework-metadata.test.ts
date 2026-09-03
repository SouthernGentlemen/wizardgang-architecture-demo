import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registry from '../assurance/registry.json';
import iso27001 from '../assurance/compliance/iso-27001-2022.json';
import iso42001 from '../assurance/compliance/iso-42001-2023.json';
import wcagManifest from '../assurance/compliance/wcag-2.2.json';
import perceivable from '../assurance/compliance/wcag-2.2/perceivable.json';
import operable from '../assurance/compliance/wcag-2.2/operable.json';
import understandable from '../assurance/compliance/wcag-2.2/understandable.json';
import robust from '../assurance/compliance/wcag-2.2/robust.json';
import presentation from '../assurance/presentation/documents.json';
import governance from '../docs/governance/REFERENCE-REGISTRY.json';
import { assuranceComplianceResponse } from '../src/api/assurance';
import { publicComplianceFrameworks, publicComplianceRecords } from '../src/assurance/registry';
import { renderComplianceDemo } from '../src/demos/compliance-page';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;
const partitions = [perceivable, operable, understandable, robust];
const resources: any[] = [];
const visit = (resource: any) => {
  resources.push(resource);
  for (const child of resource.resources ?? []) visit(child);
};
for (const dataset of (registry as any).datasets) visit(dataset);
const frameworkOwners = resources.filter((resource) => resource.framework
  && (resource.capabilities.includes('summary-source') || resource.capabilities.includes('manifest')));
const frameworkById = new Map(frameworkOwners.map((resource) => [resource.framework.id, resource]));

describe('DEMO-135 canonical framework metadata ownership', () => {
  it('stores framework and WCAG partition metadata only in registry owners', () => {
    expect(frameworkOwners.map((resource) => resource.framework.id)).toEqual(['iso-27001', 'iso-42001', 'wcag-2.2']);
    for (const data of [iso27001, iso42001, wcagManifest]) {
      for (const field of ['standard', 'edition', 'qualification', 'assessmentDate', 'framework', 'partitions']) {
        expect(data).not.toHaveProperty(field);
      }
    }
    for (const data of [iso27001, iso42001]) expect(data.sourceSoa).not.toHaveProperty('assessmentDate');
    for (const partition of partitions) {
      for (const field of ['principle', 'framework', 'frameworkLabel', 'sourcePath']) expect(partition).not.toHaveProperty(field);
    }
    for (const record of [...iso27001.records, ...iso42001.records, ...partitions.flatMap((partition) => partition.criteria)]) {
      expect(record).not.toHaveProperty('framework');
      expect(record).not.toHaveProperty('frameworkLabel');
      expect(record).not.toHaveProperty('sourcePath');
    }
    for (const record of partitions.flatMap((partition) => partition.criteria)) expect(record).not.toHaveProperty('section');
  });

  it('preserves released v1 framework and record fields through derived serialization', () => {
    expect(publicComplianceFrameworks).toEqual(frameworkOwners.map((resource) => ({ ...resource.framework, sourcePath: resource.path })));
    expect(publicComplianceRecords).toHaveLength(287);
    for (const record of publicComplianceRecords) {
      const owner = frameworkById.get(record.framework) as any;
      expect(owner).toBeDefined();
      expect(record.frameworkLabel).toBe(owner.framework.label);
      expect(record.sourcePath).toBeTruthy();
      expect(record.section).toBeTruthy();
    }
  });

  it('keeps API and HTML framework metadata aligned with the registry owner', async () => {
    const body = await assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance')).json() as any;
    expect(body.frameworks).toEqual(publicComplianceFrameworks);
    const exactBody = await assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/ISO27001-4.1'),
      'ISO27001-4.1',
    ).json() as any;
    const isoOwner = frameworkById.get('iso-27001') as any;
    expect(exactBody.framework).toEqual({ ...isoOwner.framework, sourcePath: isoOwner.path });

    const html = await renderComplianceDemo(new Request('https://demo.wizardgang.ai/compliance'), environment).text();
    for (const framework of publicComplianceFrameworks) {
      expect(html).toContain(framework.label);
      expect(html).toContain(`Assessed ${framework.assessmentDate}`);
    }
  });

  it('generates SoA assessment metadata from the same registry framework owner', () => {
    const governancePaths = new Map((governance as any).records.map((record: any) => [record.reference, record.path]));
    for (const document of (presentation as any).documents.filter((entry: any) => entry.type === 'soa')) {
      const resource = resources.find((entry) => entry.id === document.sourceDatasets[0]);
      const markdown = readFileSync(governancePaths.get(document.governanceDocumentReference) as string, 'utf8');
      expect(markdown).toContain(`# ${resource.framework.label} Statement of Applicability`);
      expect(markdown).toContain(`**Assessment date:** ${resource.framework.assessmentDate}`);
      expect(markdown).toContain('Framework identity, qualification, edition, assessment date, and source-path ownership are maintained in `assurance/registry.json`');
    }
  });
});
