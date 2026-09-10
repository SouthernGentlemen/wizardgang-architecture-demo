import { describe, expect, it } from 'vitest';
import { sitemapResponse } from '../src/api/sitemap';
import { assuranceHtmlRoute, assuranceRecordUrls } from '../src/assurance/routes';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';
import { removedHtmlPathnames } from './fixtures/removed-html-pathnames';

class AssuranceStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-07T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: 'disabled', updated_at: '2026-09-07T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new AssuranceStatement(sql) },
  DEMO_SESSION_SECRET: 'test-assurance-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

const assurancePath = routeUrl('assurance.index');
const securityPath = routeUrl('security.index');
const retiredPaths = removedHtmlPathnames
  .filter((entry) => entry.outcome === '404' && 'supersededBy' in entry && entry.supersededBy === 'assurance.index')
  .map((entry) => entry.pathname);

async function get(path = assurancePath) {
  return routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), environment);
}

describe('DEMO-244 consolidated assurance route', () => {
  it('makes /assurance the sole human-facing assurance workbench while security stays distinct', async () => {
    const response = await get();
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain(`<link rel="canonical" href="https://demo.wizardgang.ai${assurancePath}">`);
    for (const section of ['posture', 'frameworks', 'risks', 'evidence', 'governance', 'activity', 'concerns']) expect(html).toContain(`data-assurance-workbench-section="${section}"`);
    for (const collection of ['frameworks', 'risks', 'evidence', 'governance', 'activity']) expect(html).toContain(`data-assurance-collection="${collection}"`);
    for (const action of ['/api/labs/governance-security-controls', '/api/labs/governance-ai-evaluation', '/api/labs/governance-traceability']) expect(html).toContain(action);
    expect(html).toContain('Delivery and release evidence');
    expect(html).toContain('issues/new?template=concern.yml');
    expect(html).toContain('issues/new?template=bug.yml');
    expect(html).toContain('issues/new?template=feature.yml');
    expect(html).toContain('Security stays separate');
    expect(html).toContain(`href="${securityPath}"`);
    for (const path of retiredPaths.filter((path) => path.startsWith(`${assurancePath}/`))) expect(html).not.toContain(`href="${path}`);
  });

  it('resolves every non-advisory presented assurance family to /assurance and preserves stable fragments', () => {
    for (const dataset of ['claims', 'evidence', 'compliance', 'risks', 'incidents', 'exercises', 'governance-records']) expect(assuranceHtmlRoute(dataset), dataset).toBe(assurancePath);
    expect(assuranceRecordUrls('evidence', 'EV-001').html).toBe(`${assurancePath}#EV-001`);
    expect(assuranceRecordUrls('risks', 'SEC-RISK-003').html).toBe(`${assurancePath}#SEC-RISK-003`);
    expect(assuranceRecordUrls('incidents', 'INC-001').html).toBe(`${assurancePath}#INC-001`);
    expect(assuranceRecordUrls('exercises', 'EX-001').html).toBe(`${assurancePath}#EX-001`);
    expect(assuranceRecordUrls('advisories', 'ADV-001').html).toBe(`${securityPath}#ADV-001`);
  });

  it('keeps framework, risk, evidence, governance, and search state as filters on /assurance', async () => {
    const response = await get(`${assurancePath}?framework=wcag-2.2&riskFramework=security&riskResidual=high&evidenceKind=route&q=focus#risks`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain(`action="${assurancePath}"`);
    expect(html).toContain('option value="wcag-2.2" selected');
    expect(html).toContain('option value="security" selected');
    expect(html).toContain('option value="high" selected');
    expect(html).toContain('name="evidenceKind"');
    expect(html).toContain('name="governanceSource"');
    expect(html).toContain('name="q"');
    expect(html).not.toContain('name="view"');
  });

  it('returns ordinary 404 responses with no redirects for every retired assurance-owned HTML pathname', async () => {
    for (const path of retiredPaths) {
      const response = await get(path);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }
  });

  it('publishes only /assurance and /security from the assurance presentation family', async () => {
    const patterns = applicationRouteRegistry.declarations.map((route) => route.pattern);
    expect(patterns).toContain(assurancePath);
    expect(patterns).toContain(securityPath);
    for (const path of retiredPaths) expect(patterns).not.toContain(path);
    expect(patterns.filter((path) => path === assurancePath || path.startsWith(`${assurancePath}/`))).toEqual([assurancePath]);

    const sitemap = await sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml')).text();
    expect(sitemap).toContain(`<loc>https://demo.wizardgang.ai${assurancePath}</loc>`);
    expect(sitemap).toContain(`<loc>https://demo.wizardgang.ai${securityPath}</loc>`);
    for (const path of retiredPaths) expect(sitemap).not.toContain(`<loc>https://demo.wizardgang.ai${path}</loc>`);
  });

  it('retains localization and RTL shell coverage on the consolidated route', async () => {
    for (const locale of ['es', 'ar']) {
      const response = await get(`${assurancePath}?lang=${locale}#evidence`);
      const html = await response.text();
      expect(response.status, locale).toBe(200);
      expect(response.headers.get('content-language'), locale).toBe(locale);
      expect(html, locale).toContain(`<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">`);
      expect(html, locale).toContain('href="#evidence"');
    }
  });
});
