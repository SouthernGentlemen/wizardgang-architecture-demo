import { describe, expect, it } from 'vitest';
import { sitemapResponse } from '../src/api/sitemap';
import { assuranceRecordUrls } from '../src/assurance/routes';
import { assuranceViews } from '../src/demos/assurance';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry } from '../src/routing/application-routes';
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

const retiredPaths = [
  '/git',
  '/governance',
  '/evidence',
  '/compliance',
  '/governance/concerns',
  '/governance/risks',
  '/governance/incidents',
] as const;

describe('consolidated assurance surface', () => {
  it('server-renders every assurance view through the shared reporting presenter', async () => {
    for (const view of assuranceViews) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/assurance?view=${view}`, {
        headers: { accept: 'text/html' },
      }), environment);
      const html = await response.text();
      expect(response.status, view).toBe(200);
      expect(response.headers.get('content-type'), view).toContain('text/html');
      expect(html, view).toContain(`href="/assurance?view=${view}" aria-current="page"`);
      expect(html, view).toContain('Shared reporting presenter');
      expect(html, view).toContain(`<link rel="canonical" href="https://demo.wizardgang.ai/assurance?view=${view}">`);
      expect(html, view).toContain('href="/security"');
      expect(html, view).not.toContain('github.code-scanning-alerts');
      expect(html, view).not.toContain('github.secret-scanning-alerts');
      expect(html.match(/<h1\b/g), view).toHaveLength(1);
    }
  });

  it('defaults to overview and rejects unknown views without redirecting', async () => {
    const defaultResponse = await routeRequest(new Request('https://demo.wizardgang.ai/assurance', {
      headers: { accept: 'text/html' },
    }), environment);
    const defaultHtml = await defaultResponse.text();
    expect(defaultResponse.status).toBe(200);
    expect(defaultHtml).toContain('Public assurance, one inspectable surface.');
    expect(defaultHtml).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/assurance">');

    const unknown = await routeRequest(new Request('https://demo.wizardgang.ai/assurance?view=unknown', {
      headers: { accept: 'text/html' },
    }), environment);
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get('location')).toBeNull();
  });

  it('preserves filters and stable fragments on the consolidated route', async () => {
    expect(assuranceRecordUrls('evidence', 'EV-001').html).toBe('/assurance?view=evidence#EV-001');
    expect(assuranceRecordUrls('risks', 'SEC-RISK-001').html).toBe('/assurance?view=risks#SEC-RISK-001');
    expect(assuranceRecordUrls('incidents', 'INC-001').html).toBe('/assurance?view=incidents#INC-001');
    expect(assuranceRecordUrls('exercises', 'EX-001').html).toBe('/assurance?view=incidents#EX-001');
    expect(assuranceRecordUrls('advisories', 'ADV-001').html).toBe('/security#ADV-001');

    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance?view=risks&framework=security&residual=high', {
      headers: { accept: 'text/html' },
    }), environment);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('option value="security" selected');
    expect(html).toContain('name="view" value="risks"');
    expect(html).not.toContain('/assurance?view=risks?');
    expect(html).toContain('/v1/assurance/risks?framework=security&amp;residual=high');
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

  it('publishes only the consolidated assurance pages while retaining machine endpoints', async () => {
    const patterns = applicationRouteRegistry.declarations.map((route) => route.pattern);
    expect(patterns).toContain('/assurance');
    expect(patterns).toContain('/security');
    expect(patterns).toContain('/__api/git/demo');
    expect(patterns).toContain('/__api/governance/security-controls');
    expect(patterns).toContain('/v1/assurance/evidence');
    expect(patterns).toContain('/v1/assurance/compliance');
    expect(patterns).toContain('/v1/assurance/risks');
    expect(patterns).toContain('/v1/assurance/incidents');
    for (const path of retiredPaths) expect(patterns).not.toContain(path);

    const sitemap = await sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml')).text();
    expect(sitemap).toContain('<loc>https://demo.wizardgang.ai/assurance</loc>');
    expect(sitemap).toContain('<loc>https://demo.wizardgang.ai/security</loc>');
    for (const path of retiredPaths) {
      expect(sitemap).not.toContain(`<loc>https://demo.wizardgang.ai${path}</loc>`);
    }
  });
});
