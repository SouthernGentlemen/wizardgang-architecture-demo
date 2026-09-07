import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse } from '../src/api/assurance';
import { deriveComplianceCounts } from '../src/assurance/service';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import { renderComplianceDemo } from '../src/demos/compliance-page';
import type { Env } from '../src/types';
import { assuranceRelationshipIds } from '../src/assurance/relationship-contract.js';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

const canonicalComplianceRecords = listPublishedAssuranceRecords('compliance');

describe('canonical compliance presentation and API contract', () => {
  it('normalizes every canonical framework record and derives all counts at runtime', () => {
    const counts = deriveComplianceCounts(canonicalComplianceRecords);
    expect(counts.total).toBe(287);
    expect(counts.byFramework).toEqual({
      'iso-27001': 127,
      'iso-42001': 74,
      'wcag-2.2': 86,
    });
    expect(counts.byLevel).toEqual({ A: 31, AA: 24, AAA: 31 });
    expect(new Set(canonicalComplianceRecords.map((record) => record.id)).size).toBe(canonicalComplianceRecords.length);
    expect(canonicalComplianceRecords.every((record) => assuranceRelationshipIds(record.relationships, 'evidence').length > 0)).toBe(true);
    expect(canonicalComplianceRecords.every((record) => !('evidence' in record))).toBe(true);
  });

  it('filters canonical records through the current shared query result', async () => {
    const request = new Request('https://demo.wizardgang.ai/v1/assurance/compliance?framework=wcag-2.2&status=partial&level=AA');
    const response = await assuranceComplianceResponse(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    const body = await response.json() as {
      query: { filters: { framework?: string; status?: string; level?: string } };
      derived: { count: number; totalAvailable: number };
      records: typeof canonicalComplianceRecords;
    };
    const expected = canonicalComplianceRecords.filter((record) => record.framework === 'wcag-2.2' && record.status === 'partial' && record.level === 'AA');
    expect(expected.length).toBeGreaterThan(0);
    expect(body.query.filters).toEqual({ framework: 'wcag-2.2', status: 'partial', level: 'AA' });
    expect(body.derived.totalAvailable).toBe(287);
    expect(body.derived.count).toBe(expected.length);
    expect(body.records).toEqual(expected);
    expect(body.records.every((record) => Boolean(record.relationships))).toBe(true);
  });

  it('supports exact stable-record lookup with the same envelope and deterministic not-found response', async () => {
    const exact = await assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-4.1.2'),
      'WCAG-4.1.2',
    );
    expect(exact.status).toBe(200);
    const exactBody = await exact.json() as { records: typeof canonicalComplianceRecords; derived: { count: number } };
    expect(exactBody.records).toHaveLength(1);
    expect(exactBody.records[0]).toMatchObject({
      id: 'WCAG-4.1.2',
      framework: 'wcag-2.2',
      reference: '4.1.2',
      level: 'A',
    });
    expect(exactBody.records[0]).toHaveProperty('relationships');
    expect(exactBody.records[0]).not.toHaveProperty('evidence');
    expect(exactBody.derived.count).toBe(1);

    const missing = await assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-9.9.9'),
      'WCAG-9.9.9',
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: 'assurance_record_not_found',
      dataset: 'compliance',
      recordId: 'WCAG-9.9.9',
    });
  });

  it('renders accessible filters, stable row anchors, evidence links, exact lookup links, and current primary navigation', async () => {
    const response = renderComplianceDemo(
      new Request('https://demo.wizardgang.ai/compliance?framework=wcag-2.2&level=A'),
      environment,
    );
    const html = await response.text();
    expect(html).toContain('<label for="compliance-framework">Framework</label>');
    expect(html).toContain('<label for="compliance-status">Status</label>');
    expect(html).toContain('<label for="compliance-level">WCAG level</label>');
    expect(html).toContain('<caption class="subtle">');
    expect(html).toContain('id="WCAG-4.1.2"');
    expect(html).toContain('href="#WCAG-4.1.2"');
    expect(html).toContain('/v1/assurance/compliance/WCAG-4.1.2');
    const criterion = canonicalComplianceRecords.find((record) => record.id === 'WCAG-4.1.2');
    expect(criterion).toBeDefined();
    expect(html).toContain(`/assurance?view=evidence#${assuranceRelationshipIds(criterion?.relationships, 'evidence')[0]}`);
    expect(html).toContain('<a href="/assurance" aria-current="page">Assurance</a>');
    expect(html).not.toContain('id="ISO27001-4.1"');
  });

  it('keeps the compliance API read-only and represented once in the generated route contract', async () => {
    const post = await assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance', { method: 'POST' }));
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET');

    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{
      route: string;
      methods: string[];
      source: { module: string };
    }>;
    expect(manifest.filter((entry) => entry.route === '/v1/assurance/compliance')).toEqual([expect.objectContaining({
      methods: expect.arrayContaining(['GET']),
      source: expect.objectContaining({ module: 'src/api/assurance.ts' }),
    })]);
    expect(manifest.filter((entry) => entry.route === '/v1/assurance/compliance/{recordId}')).toEqual([expect.objectContaining({
      methods: expect.arrayContaining(['GET']),
      source: expect.objectContaining({ module: 'src/api/assurance.ts' }),
    })]);
  });
});
