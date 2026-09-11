import { describe, expect, it } from 'vitest';
import { sitemapResponse } from '../src/api/sitemap';
import { assuranceHtmlRoute, assuranceRecordUrls } from '../src/assurance/routes';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class AssuranceStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-07T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-07T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new AssuranceStatement(sql) },
  DEMO_SESSION_SECRET: 'test-assurance-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

const assurancePageIds = [
  'assurance.index',
  'assurance.delivery',
  'assurance.governance',
  'assurance.evidence',
  'assurance.compliance',
  'assurance.risks',
  'assurance.incidents',
  'assurance.concerns',
] as const;
const assurancePages = assurancePageIds.map((routeId) => [routeId, routeUrl(routeId)] as const);

const retiredPaths = [
  '/git',
  '/governance',
  '/evidence',
  '/compliance',
  '/governance/concerns',
  '/governance/risks',
  '/governance/incidents',
] as const;

describe('canonical assurance child routes', () => {
  it('server-renders every assurance page through canonical application declarations', async () => {
    for (const [routeId, path] of assurancePages) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
        headers: { accept: 'text/html' },
      }), environment);
      const html = await response.text();
      expect(response.status, routeId).toBe(200);
      expect(response.headers.get('content-type'), routeId).toContain('text/html');
      expect(html, routeId).toContain(`<link rel="canonical" href="https://demo.wizardgang.ai${path}">`);
      expect(html, routeId).not.toContain('name="view"');
      expect(html, routeId).not.toContain(`${routeUrl('assurance.index')}?view=`);
      expect(html.match(/<h1\b/g), routeId).toHaveLength(1);
      if (routeId !== 'assurance.index') expect(html, routeId).toContain('<a href="/assurance" data-section-current');
    }
  });

  it('makes /assurance a summary-first workbench while preserving canonical child routes', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance', {
      headers: { accept: 'text/html' },
    }), environment);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<h1>Assurance workbench.</h1>');
    expect(html).toContain('data-assurance-workbench-section="posture"');
    expect(html).toContain('Security stays separate');
    expect(html).toContain('href="/security"');
    for (const [, path] of assurancePages.slice(1)) expect(html).toContain(`href="${path}"`);
    expect(html).not.toContain('data-view-current');
  });

  it('returns bare canonical HTML paths for every presented dataset and preserves stable fragments', () => {
    const datasets = ['claims', 'evidence', 'compliance', 'risks', 'incidents', 'exercises', 'advisories', 'governance-records'];
    for (const dataset of datasets) {
      const path = assuranceHtmlRoute(dataset);
      expect(path, dataset).not.toContain('?');
      expect(path, dataset).not.toContain('#');
    }
    expect(assuranceRecordUrls('evidence', 'EV-001').html).toBe(`${routeUrl('assurance.evidence')}#EV-001`);
    expect(assuranceRecordUrls('risks', 'SEC-RISK-001').html).toBe(`${routeUrl('assurance.risks')}#SEC-RISK-001`);
    expect(assuranceRecordUrls('incidents', 'INC-001').html).toBe(`${routeUrl('assurance.incidents')}#INC-001`);
    expect(assuranceRecordUrls('exercises', 'EX-001').html).toBe(`${routeUrl('assurance.incidents')}#EX-001`);
    expect(assuranceRecordUrls('advisories', 'ADV-001').html).toBe(`${routeUrl('security.index')}#ADV-001`);
  });

  it('round-trips real risk filter state without a hidden view parameter', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance/risks?framework=security&residual=high', {
      headers: { accept: 'text/html' },
    }), environment);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('option value="security" selected');
    expect(html).not.toContain('name="view"');
    expect(html).toContain('action="/assurance/risks"');
    expect(html).toContain('/api/reporting/risks?framework=security&amp;residual=high');
  });

  it('returns normal 404s for every retired HTML pathname', async () => {
    for (const path of retiredPaths) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
        headers: { accept: 'text/html' },
      }), environment);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }
  });

  it('publishes all canonical assurance pages and keeps security separate', async () => {
    const patterns = applicationRouteRegistry.declarations.map((route) => route.pattern);
    for (const [routeId, path] of assurancePages) {
      expect(routeUrl(routeId), routeId).toBe(path);
      expect(patterns, path).toContain(path);
    }
    expect(patterns).toContain(routeUrl('security.index'));
    for (const path of retiredPaths) expect(patterns).not.toContain(path);

    const sitemap = await sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml')).text();
    for (const [, path] of assurancePages) expect(sitemap).toContain(`<loc>https://demo.wizardgang.ai${path}</loc>`);
    expect(sitemap).toContain('<loc>https://demo.wizardgang.ai/security</loc>');
    for (const path of retiredPaths) expect(sitemap).not.toContain(`<loc>https://demo.wizardgang.ai${path}</loc>`);
  });
});
