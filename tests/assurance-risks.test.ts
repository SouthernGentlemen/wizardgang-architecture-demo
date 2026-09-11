import { describe, expect, it } from 'vitest';
import { reportingCollectionResponse } from '../src/api/reporting';
import {
  deriveRiskCounts,
  filterAssuranceRecords,
  listAssuranceRecords,
} from '../src/assurance/service';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import { assuranceIndexContent } from '../src/demos/assurance';
import { renderPage } from '../src/ui/page';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('disclosure-safe public risk assurance', () => {
  it('preserves stable source IDs and derives counts from canonical records', () => {
    const risks = listAssuranceRecords('risks');
    expect(risks.map((risk) => risk.id)).toEqual([
      ...Array.from({ length: 15 }, (_, index) => `SEC-RISK-${String(index + 1).padStart(3, '0')}`),
      ...Array.from({ length: 15 }, (_, index) => `AI-RISK-${String(index + 1).padStart(3, '0')}`),
    ]);
    expect(deriveRiskCounts(risks)).toEqual({
      total: risks.length,
      byFramework: { security: risks.filter((risk) => risk.framework === 'security').length, ai: risks.filter((risk) => risk.framework === 'ai').length },
      byStatus: { open: risks.filter((risk) => risk.status === 'open').length, treating: risks.filter((risk) => risk.status === 'treating').length },
      byResidualRating: {
        low: risks.filter((risk) => risk.residual.rating === 'low').length,
        moderate: risks.filter((risk) => risk.residual.rating === 'moderate').length,
        high: risks.filter((risk) => risk.residual.rating === 'high').length,
        critical: risks.filter((risk) => risk.residual.rating === 'critical').length,
      },
    });
  });

  it('filters canonical records without storing alternate counts', () => {
    const records = filterAssuranceRecords('risks', { framework: 'security', residual: 'high' });
    expect(deriveRiskCounts(records).total).toBe(records.length);
    expect(records.every((risk) => risk.framework === 'security' && risk.residual.rating === 'high')).toBe(true);
  });

  it('keeps private treatment and infrastructure detail outside the canonical public record shape', () => {
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
      'controls',
      'evidence',
    ]);
    for (const risk of listAssuranceRecords('risks')) {
      expect(Object.keys(risk).some((key) => forbidden.has(key))).toBe(false);
      expect(risk).toHaveProperty('relationships');
      expect(risk.status).not.toBe('accepted');
      expect(risk.treatment).not.toContain('accept');
    }
  });

  it('serves filtered GET JSON through the current shared query contract', async () => {
    const published = listPublishedAssuranceRecords('risks');
    const response = await reportingCollectionResponse(new Request('https://demo.wizardgang.ai/api/reporting/risks?framework=ai&status=open&residual=low'), environment, 'risks');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    const body = await response.json() as {
      query: { filters: Record<string, string> };
      derived: { count: number; totalAvailable: number };
      records: typeof published;
    };
    const expected = published.filter((risk) => risk.framework === 'ai' && risk.status === 'open' && risk.residual.rating === 'low');
    expect(body.query.filters).toEqual({ framework: 'ai', status: 'open', residual: 'low' });
    expect(body.derived.count).toBe(expected.length);
    expect(body.derived.totalAvailable).toBe(expected.length);
    expect(body.records).toEqual(expected);
    expect(body.records.every((record) => Boolean(record.relationships))).toBe(true);

  });

  it('renders filter state and stable exact risk anchors', async () => {
    const content = await assuranceIndexContent(new Request('https://demo.wizardgang.ai/assurance?riskFramework=security&riskResidual=high#risks'), environment);
    const response = renderPage(environment, { ...content, routeId: 'assurance.index' });
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('option value="security" selected');
    const firstMatching = filterAssuranceRecords('risks', { framework: 'security', residual: 'high' })[0];
    expect(firstMatching).toBeDefined();
    expect(html).toContain(`id="${firstMatching?.id}"`);
    expect(html).not.toContain('id="AI-RISK-001"');
    expect(html).toContain('name="riskFramework"');
  });
});
