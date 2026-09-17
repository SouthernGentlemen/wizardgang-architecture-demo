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

describe('minimal assurance route', () => {
  it('makes /assurance a framework workbench while security stays distinct', async () => {
    const response = await get();
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain(`<link rel="canonical" href="https://demo.wizardgang.ai${assurancePath}">`);
    expect((html.match(/data-assurance-framework=/g) ?? [])).toHaveLength(3);
    for (const framework of ['iso-27001', 'iso-42001', 'wcag-2.2']) expect(html).toContain(`data-assurance-framework="${framework}"`);
    expect(html).toContain('data-assurance-section');
    expect(html).toContain('data-assurance-record="ISO27001-A.5.1"');
    expect(html).toContain('href="#ISO27001-A.5.1"');
    for (const retiredAction of ['/api/labs/governance-security-controls', '/api/labs/governance-ai-evaluation', '/api/labs/governance-traceability']) {
      expect(html).not.toContain(retiredAction);
    }
    expect(html).not.toContain('data-assurance-run');
    expect(html).not.toContain('data-assurance-output');
    expect(html).not.toContain('No ISO/IEC or WCAG certification is claimed');
    expect(html).toContain(`href="${securityPath}"`);
    for (const path of retiredPaths.filter((path) => path.startsWith(`${assurancePath}/`))) expect(html).not.toContain(`href="${path}`);
  });

  it('preserves canonical machine record URLs without exposing management inventories as page sections', async () => {
    for (const dataset of ['claims', 'evidence', 'compliance', 'risks', 'incidents', 'exercises', 'governance-records']) {
      expect(assuranceHtmlRoute(dataset), dataset).toBe(assurancePath);
    }
    expect(assuranceRecordUrls('evidence', 'EV-001').api).toContain('/api/reporting/');
    expect(assuranceRecordUrls('advisories', 'ADV-001').html).toBe(`${securityPath}#ADV-001`);

    const html = await (await get()).text();
    for (const hidden of [
      'data-assurance-collection="risks"',
      'data-assurance-collection="activity"',
      'Browse risk records',
      'Browse incident and exercise records',
      'Report a non-sensitive concern',
      'Risk register',
      'Supplier register',
      'Registry browser',
    ]) expect(html).not.toContain(hidden);
  });

  it('rejects the retired view selector while localization and record fragments remain valid', async () => {
    const legacy = await get(`${assurancePath}?view=compliance`);
    expect(legacy.status).toBe(404);
    expect(legacy.headers.get('location')).toBeNull();

    const localized = await get(`${assurancePath}?lang=ar#ISO27001-A.5.1`);
    const html = await localized.text();
    expect(localized.status).toBe(200);
    expect(localized.headers.get('content-language')).toBe('ar');
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('id="ISO27001-A.5.1"');
    expect(html).toContain('href="#ISO27001-A.5.1"');
  });

  it('returns ordinary 404 responses with no redirects for retired assurance-owned HTML pathnames', async () => {
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
});
