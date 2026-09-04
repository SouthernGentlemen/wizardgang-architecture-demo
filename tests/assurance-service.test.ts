import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse, assuranceRisksResponse } from '../src/api/assurance';
import {
  assuranceFilterDefinitions,
  assuranceFilterNames,
  assuranceFilterValues,
  assuranceRecordUrls,
  complianceFrameworks,
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
import { RISK_RATING_VALUES } from '../src/assurance/risk-rating.js';
import { renderComplianceDemo } from '../src/demos/compliance-page';
import { renderRisks } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

function idsFromComplianceHtml(html: string): string[] {
  return [...html.matchAll(/<tr id="((?:ISO27001|ISO42001|WCAG)-[^"]+)">/g)].map((match) => match[1]);
}

function idsFromRiskHtml(html: string): string[] {
  return [...html.matchAll(/<article class="info-card" id="((?:SEC|AI)-RISK-[^"]+)">/g)].map((match) => match[1]);
}

describe('common canonical assurance query and presentation service', () => {
  it('selects the same canonical compliance records for API and HTML views', async () => {
    const url = 'https://demo.wizardgang.ai/compliance?framework=wcag-2.2&status=partial&level=AA';
    const expected = filterAssuranceRecords('compliance', {
      framework: 'wcag-2.2',
      status: 'partial',
      level: 'AA',
    }).map((record) => record.id);

    const apiResponse = assuranceComplianceResponse(new Request(url.replace('/compliance', '/v1/assurance/compliance')));
    const apiBody = await apiResponse.json() as { records: Array<{ id: string }> };
    const html = await renderComplianceDemo(new Request(url), environment).text();

    expect(apiBody.records.map((record) => record.id)).toEqual(expected);
    expect(idsFromComplianceHtml(html)).toEqual(expected);
  });

  it('resolves every rendered compliance record and evidence link through registry routes', async () => {
    const records = listPublishedAssuranceRecords('compliance');
    const html = await renderComplianceDemo(new Request('https://demo.wizardgang.ai/compliance'), environment).text();

    for (const record of records) {
      const recordUrls = assuranceRecordUrls('compliance', record.id);
      expect(recordUrls.api).toBe(`/v1/assurance/compliance/${encodeURIComponent(record.id)}`);
      expect(html).toContain(`id="${record.id}"`);
      expect(html).toContain(`href="${recordUrls.api}"`);
      for (const evidenceId of record.relationships.evidence) {
        expect(html).toContain(`href="${assuranceRecordUrls('evidence', evidenceId).html}"`);
      }
    }
  });

  it('derives framework cards and counts from canonical records rather than stored count tables', async () => {
    const records = listAssuranceRecords('compliance');
    const html = await renderComplianceDemo(new Request('https://demo.wizardgang.ai/compliance'), environment).text();

    for (const framework of complianceFrameworks) {
      const expected = records.filter((record) => record.framework === framework.id).length;
      expect(html).toContain(`<h2>${framework.label}</h2>`);
      expect(html).toContain(`<strong>${expected} records</strong>`);
    }

    const synthetic = [...records, { ...records[0], id: `${records[0].id}-FIXTURE` }];
    expect(deriveAssuranceCounts('compliance', synthetic).total).toBe(records.length + 1);
  });

  it('gets filter declarations and value semantics from authoritative registered contracts', () => {
    const registry = JSON.parse(readFileSync('assurance/registry.json', 'utf8')) as {
      datasets: Array<{
        kind: string;
        filters?: Record<string, { path: string; label: string }>;
        framework?: { id: string };
        resources?: Array<{ framework?: { id: string }; resources?: Array<{ framework?: { id: string } }> }>;
      }>;
    };
    const complianceRegistry = registry.datasets.find((dataset) => dataset.kind === 'compliance');
    const riskRegistry = registry.datasets.find((dataset) => dataset.kind === 'risks');
    expect(assuranceFilterDefinitions('compliance')).toEqual(complianceRegistry?.filters);
    expect(assuranceFilterDefinitions('risks')).toEqual(riskRegistry?.filters);

    const riskSchema = JSON.parse(readFileSync('contracts/assurance/risk.schema.json', 'utf8'));
    const wcagSchema = JSON.parse(readFileSync('contracts/assurance/wcag-2.2-criteria.schema.json', 'utf8'));
    expect(assuranceFilterValues('risks', 'framework')).toEqual(riskSchema.$defs.risk.properties.framework.enum);
    expect(assuranceFilterValues('risks', 'residual')).toEqual(RISK_RATING_VALUES);
    expect(assuranceFilterValues('compliance', 'level')).toEqual(wcagSchema.properties.criteria.items.properties.level.enum);
    expect(assuranceFilterValues('compliance', 'framework')).toEqual(complianceFrameworks.map((framework) => framework.id));
  });

  it('normalizes declared filters once and serializes them in registry declaration order', () => {
    const normalized = normalizeAssuranceFilters(
      'compliance',
      new URLSearchParams('level=AA&unknown=ignored&framework=wcag-2.2&status=partial'),
    );
    expect(normalized).toEqual({
      filters: { framework: 'wcag-2.2', status: 'partial', level: 'AA' },
      issues: [],
    });
    expect(serializeAssuranceFilters('compliance', normalized.filters)).toBe('framework=wcag-2.2&status=partial&level=AA');

    expect(normalizeAssuranceFilters('compliance', new URLSearchParams('framework=')).issues[0]).toMatchObject({
      parameter: 'framework',
      value: '',
    });
    expect(normalizeAssuranceFilters('risks', new URLSearchParams('framework=security&framework=ai')).issues[0]).toMatchObject({
      parameter: 'framework',
      value: ['security', 'ai'],
    });
  });

  it('lets every registry-declared filter flow through API, HTML forms, and matching-JSON links without handler parameter lists', async () => {
    const cases = [
      {
        dataset: 'compliance' as const,
        apiPath: '/v1/assurance/compliance',
        htmlPath: '/compliance',
        api: assuranceComplianceResponse,
        render: (request: Request) => renderComplianceDemo(request, environment),
        ids: idsFromComplianceHtml,
      },
      {
        dataset: 'risks' as const,
        apiPath: '/v1/assurance/risks',
        htmlPath: '/governance/risks',
        api: assuranceRisksResponse,
        render: (request: Request) => renderRisks(request, environment),
        ids: idsFromRiskHtml,
      },
    ];

    for (const entry of cases) {
      for (const parameter of assuranceFilterNames(entry.dataset)) {
        const value = assuranceFilterValues(entry.dataset, parameter)[0];
        const filters = { [parameter]: value };
        const query = serializeAssuranceFilters(entry.dataset, filters);
        const expected = filterPublishedAssuranceRecords(entry.dataset, filters).map((record) => record.id);
        const apiResponse = entry.api(new Request(`https://demo.wizardgang.ai${entry.apiPath}?${query}`));
        const apiBody = await apiResponse.json() as { records: Array<{ id: string }> };
        const html = await entry.render(new Request(`https://demo.wizardgang.ai${entry.htmlPath}?${query}`)).text();

        expect(apiBody.records.map((record) => record.id)).toEqual(expected);
        expect(entry.ids(html)).toEqual(expected);
        expect(html).toContain(`name="${parameter}"`);
        expect(html).toContain(`href="${entry.apiPath}?${query.replaceAll('&', '&amp;')}"`);
      }
    }

    const apiSource = readFileSync('src/api/assurance.ts', 'utf8');
    expect(apiSource).not.toContain('assuranceEnumQuery');
    expect(apiSource).not.toContain("'framework', assuranceFilterValues");
    expect(apiSource).not.toContain("'status', assuranceFilterValues");
    expect(apiSource).not.toContain("'level', assuranceFilterValues");
    expect(apiSource).not.toContain("'residual', assuranceFilterValues");
  });

  it('preserves v1 invalid, empty, duplicate, and unknown parameter semantics', async () => {
    const invalid = assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance?framework='));
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: 'invalid_filter', parameter: 'framework', value: '' });

    const duplicate = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=security&framework=ai'));
    expect(duplicate.status).toBe(400);
    expect(await duplicate.json()).toMatchObject({
      error: 'invalid_filter',
      parameter: 'framework',
      value: ['security', 'ai'],
    });

    const unknown = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?futureParameter=ignored'));
    expect(unknown.status).toBe(200);
    const body = await unknown.json() as { filters: Record<string, string>; records: Array<{ id: string }> };
    expect(body.filters).toEqual({});
    expect(body.records.map((record) => record.id)).toEqual(listPublishedAssuranceRecords('risks').map((record) => record.id));
  });

  it('applies combined filters before pagination and preserves the filtered cursor identity', async () => {
    const filters = { framework: 'wcag-2.2', status: 'partial', level: 'AA' };
    const expected = filterPublishedAssuranceRecords('compliance', filters);
    expect(expected.length).toBeGreaterThan(2);
    const query = serializeAssuranceFilters('compliance', filters);

    const first = assuranceComplianceResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/compliance?${query}&limit=2`));
    const firstBody = await first.json() as {
      records: Array<{ id: string }>;
      pagination: { total: number; nextCursor: string | null };
    };
    expect(firstBody.records.map((record) => record.id)).toEqual(expected.slice(0, 2).map((record) => record.id));
    expect(firstBody.pagination.total).toBe(expected.length);
    expect(firstBody.pagination.nextCursor).toBe(expected[1].id);

    const second = assuranceComplianceResponse(new Request(
      `https://demo.wizardgang.ai/v1/assurance/compliance?${query}&limit=2&cursor=${encodeURIComponent(expected[1].id)}`,
    ));
    const secondBody = await second.json() as { records: Array<{ id: string }> };
    expect(secondBody.records.map((record) => record.id)).toEqual(expected.slice(2, 4).map((record) => record.id));
  });

  it('uses common exact lookup while keeping pagination out of the internal service', async () => {
    const records = listAssuranceRecords('compliance');
    expect(findAssuranceRecord('compliance', records[10].id)).toEqual(records[10]);

    const serviceSource = readFileSync('src/assurance/service.ts', 'utf8');
    expect(serviceSource).not.toContain('paginateAssuranceRecords');
    expect(serviceSource).not.toContain('interface AssurancePage');

    const api = assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance?limit=2'));
    const body = await api.json() as { records: Array<{ id: string }>; pagination: { nextCursor: string | null } };
    expect(body.records.map((record) => record.id)).toEqual(records.slice(0, 2).map((record) => record.id));
    expect(body.pagination.nextCursor).toBe(records[1].id);
  });

  it('keeps reverse evidence relationships complete for every canonical relationship-bearing family', () => {
    const recordFamilies = ['claims', 'risks', 'incidents', 'exercises', 'advisories', 'compliance'] as const;
    for (const dataset of recordFamilies) {
      for (const record of listAssuranceRecords(dataset)) {
        for (const evidenceId of record.relationships.evidence) {
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

  it('keeps HTML consumers on canonical relationships and released aliases at the API boundary', () => {
    const presentationFiles = [
      'src/demos/compliance-page.ts',
      'src/demos/evidence-page.ts',
      'src/demos/assurance-pages.ts',
      'src/demos/security-page.ts',
      'src/demos/operations-pages.ts',
    ];
    for (const path of presentationFiles) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/from ['"][^'"]*assurance\/(?:compliance|evidence|risks|incidents|advisories)\/[^'"]+\.json['"]/);
      expect(source).not.toMatch(/byFramework\s*:\s*\{|byStatus\s*:\s*\{|byLevel\s*:\s*\{/);
      expect(source).not.toContain('.riskLinks');
      expect(source).not.toContain('.controlLinks');
      expect(source).not.toContain('.objectiveLinks');
      expect(source).not.toContain('.incidentLinks');
    }

    const apiSource = readFileSync('src/api/assurance.ts', 'utf8');
    const serializerSource = readFileSync('src/api/assurance-v1.ts', 'utf8');
    expect(apiSource).not.toMatch(/RISK_(?:FRAMEWORKS|STATUSES|RATINGS)|COMPLIANCE_(?:FRAMEWORKS|STATUSES|LEVELS)/);
    expect(serializerSource).toContain('riskLinks:');
    expect(serializerSource).toContain('frameworkReferences:');
    expect(serializerSource).toContain('residualRating: residual');
    const complianceSource = readFileSync('src/demos/compliance-page.ts', 'utf8');
    expect(complianceSource).not.toContain('/evidence#');
    expect(complianceSource).not.toMatch(/iso-27001-2022\.json|iso-42001-2023\.json|wcag-2\.2\/(?:perceivable|operable|understandable|robust)\.json/);
  });

  it('keeps /compliance useful with derived filters, stable anchors, exact JSON, and qualification text', async () => {
    const html = await renderComplianceDemo(
      new Request('https://demo.wizardgang.ai/compliance?framework=wcag-2.2&level=A'),
      environment,
    ).text();
    expect(html).toContain('<label for="compliance-framework">Framework</label>');
    expect(html).toContain('<label for="compliance-status">Status</label>');
    expect(html).toContain('<label for="compliance-level">WCAG level</label>');
    expect(html).toContain('id="WCAG-4.1.2"');
    expect(html).toContain('href="#WCAG-4.1.2"');
    expect(html).toContain('/v1/assurance/compliance/WCAG-4.1.2');
    expect(html).toContain('certification and formal conformance are not claimed');
  });
});
