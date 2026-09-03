import { describe, expect, it } from 'vitest';
import { assuranceRisksResponse } from '../src/api/assurance';
import { deriveRiskCounts, filterPublicRisks, publicAssuranceRegistry } from '../src/assurance/registry';
import { renderRisks } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('disclosure-safe public risk assurance', () => {
  it('preserves stable source IDs and derives counts from canonical records', () => {
    expect(publicAssuranceRegistry.counts).toEqual({ claims: 9, evidence: 23, risks: 30, incidents: 0, exercises: 1, advisories: 0 });
    expect(publicAssuranceRegistry.riskCounts).toEqual({
      total: 30,
      byFramework: { security: 15, ai: 15 },
      byStatus: { open: 3, treating: 27 },
      byResidualRating: { low: 1, moderate: 22, high: 7, critical: 0 },
    });
    expect(publicAssuranceRegistry.risks.map((risk) => risk.id)).toEqual([
      ...Array.from({ length: 15 }, (_, index) => `SEC-RISK-${String(index + 1).padStart(3, '0')}`),
      ...Array.from({ length: 15 }, (_, index) => `AI-RISK-${String(index + 1).padStart(3, '0')}`),
    ]);
  });

  it('filters records without storing alternate counts', () => {
    const records = filterPublicRisks({ framework: 'security', residualRating: 'high' });
    expect(records).toHaveLength(7);
    expect(deriveRiskCounts(records).byFramework).toEqual({ security: 7, ai: 0 });
    expect(records.every((risk) => risk.residual.rating === 'high')).toBe(true);
  });

  it('keeps private treatment and infrastructure detail outside the public record shape', () => {
    const forbidden = new Set([
      'affectedAsset',
      'affectedProcess',
      'threat',
      'cause',
      'consequence',
      'owner',
      'acceptanceAuthority',
      'treatmentActions',
      'acceptanceRationale',
      'infrastructureDetails',
    ]);
    for (const risk of publicAssuranceRegistry.risks) {
      expect(Object.keys(risk).some((key) => forbidden.has(key))).toBe(false);
      expect(risk.status).not.toBe('accepted');
      expect(risk.treatment).not.toContain('accept');
    }
  });

  it('serves filtered GET JSON with derived counts and rejects writes', async () => {
    const response = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=ai&status=open&residual=low'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    const body = await response.json() as {
      counts: { total: number };
      totalAvailable: number;
      records: Array<{ id: string }>;
    };
    expect(body.counts.total).toBe(1);
    expect(body.totalAvailable).toBe(30);
    expect(body.records.map((record) => record.id)).toEqual(['AI-RISK-005']);

    const rejected = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
  });

  it('renders filter state and stable exact risk anchors', async () => {
    const response = renderRisks(new Request('https://demo.wizardgang.ai/governance/risks?framework=security&residual=high'), environment);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('option value="security" selected');
    expect(html).toContain('id="SEC-RISK-001"');
    expect(html).toContain('href="#SEC-RISK-001"');
    expect(html).not.toContain('id="AI-RISK-001"');
    expect(html).toContain('/v1/assurance/risks?framework=security&amp;residual=high');
  });
});
