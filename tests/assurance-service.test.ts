import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse, assuranceRisksResponse } from '../src/api/assurance';
import {
  assuranceFilterNames,
  assuranceFilterValues,
  assuranceRecordUrls,
  deriveAssuranceCounts,
  evidenceUsedBy,
  filterAssuranceRecords,
  findAssuranceRecord,
  listAssuranceRecords,
  normalizeAssuranceFilters,
  reverseAssuranceRelationships,
  serializeAssuranceFilters,
} from '../src/assurance/service';
import {
  filterPublishedAssuranceRecords,
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
} from '../src/assurance/publication';
import { renderComplianceDemo } from '../src/demos/compliance-page';
import { renderRisks } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';
import { assuranceRelationshipIds } from '../src/assurance/relationship-contract.js';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

function complianceIds(html: string): string[] {
  return [...html.matchAll(/<tr id="((?:ISO27001|ISO42001|WCAG)-[^"]+)">/g)].map((match) => match[1]);
}

function riskIds(html: string): string[] {
  return [...html.matchAll(/<article class="info-card" id="((?:SEC|AI)-RISK-[^"]+)">/g)].map((match) => match[1]);
}

describe('common canonical assurance query and presentation service', () => {
  it('selects the same canonical records for API and HTML consumers', async () => {
    const complianceFilters = { framework: 'wcag-2.2', status: 'partial', level: 'AA' };
    const complianceQuery = serializeAssuranceFilters('compliance', complianceFilters);
    const complianceExpected = filterPublishedAssuranceRecords('compliance', complianceFilters).map((record) => record.id);
    const complianceApi = await (await assuranceComplianceResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/compliance?${complianceQuery}`))).json() as { records: Array<{ id: string }> };
    const complianceHtml = await renderComplianceDemo(new Request(`https://demo.wizardgang.ai/compliance?${complianceQuery}`), environment).text();
    expect(complianceApi.records.map((record) => record.id)).toEqual(complianceExpected);
    expect(complianceIds(complianceHtml)).toEqual(complianceExpected);

    const riskFilters = { framework: 'security', residual: 'high' };
    const riskQuery = serializeAssuranceFilters('risks', riskFilters);
    const riskExpected = filterPublishedAssuranceRecords('risks', riskFilters).map((record) => record.id);
    const riskApi = await (await assuranceRisksResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/risks?${riskQuery}`))).json() as { records: Array<{ id: string }> };
    const riskHtml = await renderRisks(new Request(`https://demo.wizardgang.ai/governance/risks?${riskQuery}`), environment).text();
    expect(riskApi.records.map((record) => record.id)).toEqual(riskExpected);
    expect(riskIds(riskHtml)).toEqual(riskExpected);
  });

  it('derives filter vocabulary, counts, lookup, and URLs from registered contracts', () => {
    expect(assuranceFilterNames('risks')).toEqual(['framework', 'status', 'residual']);
    expect(assuranceFilterValues('risks', 'residual')).toEqual(['low', 'moderate', 'high', 'critical']);
    const normalized = normalizeAssuranceFilters('compliance', new URLSearchParams('level=AA&framework=wcag-2.2&status=partial'));
    expect(normalized).toEqual({ filters: { framework: 'wcag-2.2', status: 'partial', level: 'AA' }, issues: [] });

    const records = listAssuranceRecords('compliance');
    expect(deriveAssuranceCounts('compliance', records).total).toBe(records.length);
    expect(findAssuranceRecord('compliance', records[0].id)).toEqual(records[0]);
    expect(assuranceRecordUrls('compliance', records[0].id).api).toBe(`/v1/assurance/compliance/${encodeURIComponent(records[0].id)}`);
  });

  it('rejects invalid, duplicate, and undeclared parameters under the current contract', async () => {
    const invalid = await assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance?framework='));
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: 'invalid_filter', parameter: 'framework', value: '' });

    const duplicate = await assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=security&framework=ai'));
    expect(duplicate.status).toBe(400);
    expect(await duplicate.json()).toMatchObject({ error: 'invalid_filter', parameter: 'framework', value: ['security', 'ai'] });

    const unknown = await assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?futureParameter=ignored'));
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toEqual({ error: 'unsupported_query_parameter', parameter: 'futureParameter' });
  });

  it('applies filters before opaque cursor pagination in the shared query block', async () => {
    const filters = { framework: 'wcag-2.2', status: 'partial', level: 'AA' };
    const expected = filterPublishedAssuranceRecords('compliance', filters);
    expect(expected.length).toBeGreaterThan(2);
    const query = serializeAssuranceFilters('compliance', filters);

    const first = await (await assuranceComplianceResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/compliance?${query}&limit=2`))).json() as {
      records: Array<{ id: string }>;
      query: { pagination: { total: number; nextCursor: string | null } };
      derived: { count: number };
    };
    expect(first.records.map((record) => record.id)).toEqual(expected.slice(0, 2).map((record) => record.id));
    expect(first.query.pagination.total).toBe(expected.length);
    expect(first.query.pagination.nextCursor).toMatch(/^rpc1\./);
    expect(first.derived.count).toBe(expected.length);
  });

  it('keeps reverse evidence relationships complete for canonical relationship-bearing families', () => {
    for (const dataset of ['claims', 'risks', 'incidents', 'exercises', 'advisories', 'compliance'] as const) {
      for (const record of listAssuranceRecords(dataset)) {
        for (const evidenceId of assuranceRelationshipIds(record.relationships, 'evidence')) {
          expect(reverseAssuranceRelationships(evidenceId, 'evidence')).toEqual(
            expect.arrayContaining([expect.objectContaining({ sourceId: record.id, dataset, relation: 'evidence' })]),
          );
        }
      }
    }
    for (const evidence of presentedPublishedEvidenceRecords(environment, 'https://demo.wizardgang.ai')) {
      expect(evidence.usedBy).toEqual(evidenceUsedBy(evidence.id));
    }
  });

  it('has no legacy serializer or flattened assurance relationship boundary', () => {
    expect(existsSync('src/api/assurance-v1.ts')).toBe(false);
    const apiSource = readFileSync('src/api/assurance.ts', 'utf8');
    expect(apiSource).not.toContain('serializeAssuranceV1');
    expect(apiSource).not.toContain('riskLinks:');
    expect(apiSource).not.toContain('frameworkReferences:');
    for (const path of ['src/demos/compliance-page.ts', 'src/demos/assurance-pages.ts', 'src/demos/security-page.ts']) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toContain('.riskLinks');
      expect(source).not.toContain('.controlLinks');
      expect(source).not.toContain('.objectiveLinks');
      expect(source).not.toContain('.incidentLinks');
    }
  });
});
