import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceComplianceResponse } from '../src/api/assurance';
import { serializeAssuranceV1Compliance, type AssuranceV1ComplianceRecord } from '../src/api/assurance-v1';
import { deriveComplianceCounts } from '../src/assurance/service';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import { renderComplianceDemo } from '../src/demos/compliance-page';
import type { Env } from '../src/types';

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
    expect(canonicalComplianceRecords.every((record) => record.relationships.evidence.length > 0)).toBe(true);
    expect(canonicalComplianceRecords.every((record) => !('evidence' in record))).toBe(true);
  });

  it('filters canonical records while preserving the released v1 record projection', async () => {
    const request = new Request('https://demo.wizardgang.ai/v1/assurance/compliance?framework=wcag-2.2&status=partial&level=AA');
    const response = assuranceComplianceResponse(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    const body = await response.json() as {
      filters: { framework?: string; status?: string; level?: string };
      counts: ReturnType<typeof deriveComplianceCounts>;
      totalAvailable: number;
      records: AssuranceV1ComplianceRecord[];
    };
    const expected = canonicalComplianceRecords.filter((record) => record.framework === 'wcag-2.2' && record.status === 'partial' && record.level === 'AA');
    expect(expected.length).toBeGreaterThan(0);
    expect(body.filters).toEqual({ framework: 'wcag-2.2', status: 'partial', level: 'AA' });
    expect(body.totalAvailable).toBe(287);
    expect(body.records).toEqual(expected.map(serializeAssuranceV1Compliance));
    expect(body.counts).toEqual(deriveComplianceCounts(expected));
  });

  it('supports exact stable-record lookup and a deterministic not-found response', async () => {
    const exact = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-4.1.2'),
      'WCAG-4.1.2',
    );
    expect(exact.status).toBe(200);
    const exactBody = await exact.json() as { record: AssuranceV1ComplianceRecord };
    expect(exactBody.record).toMatchObject({
      id: 'WCAG-4.1.2',
      framework: 'wcag-2.2',
      reference: '4.1.2',
      level: 'A',
    });
    expect(exactBody.record).toHaveProperty('evidence');
    expect(exactBody.record).not.toHaveProperty('relationships');

    const missing = assuranceComplianceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-9.9.9'),
      'WCAG-9.9.9',
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'compliance_record_not_found', recordId: 'WCAG-9.9.9' });
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
    expect(html).toContain(`/evidence#${criterion?.relationships.evidence[0]}`);
    expect(html).toContain('<a href="/compliance" aria-current="page">Compliance</a>');
    expect(html).not.toContain('id="ISO27001-4.1"');
  });

  it('keeps the compliance API read-only and represented once in the generated route contract', () => {
    const post = assuranceComplianceResponse(new Request('https://demo.wizardgang.ai/v1/assurance/compliance', { method: 'POST' }));
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET');

    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{ route: string; method?: string; source: string }>;
    expect(manifest.filter((entry) => entry.route === '/v1/assurance/compliance')).toEqual([expect.objectContaining({
      method: 'GET',
      source: 'src/api/assurance.ts',
    })]);
    expect(manifest.filter((entry) => entry.route === '/v1/assurance/compliance/{recordId}')).toEqual([expect.objectContaining({
      method: 'GET',
      source: 'src/api/assurance.ts',
    })]);
  });
});
