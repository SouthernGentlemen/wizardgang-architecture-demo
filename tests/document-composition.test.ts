import { describe, expect, it } from 'vitest';
import { assuranceViews } from '../src/demos/assurance';
import { operationsViews } from '../src/demos/operations';
import { routeRequest } from '../src/router';
import { renderPage, type PageContent } from '../src/ui/page';
import type { D1PreparedStatement, Env } from '../src/types';

class CompositionStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-07T12:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-07T12:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM service_health_checks')) {
      return { results: [{ id: 1, service_key: 'public-demo', status: 'operational', response_ms: 5, detail_json: '{"intentionalOffline":false}', checked_at: '2026-09-07T11:00:00.000Z' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const env: Env = {
  DEMO_DB: { prepare: (sql: string) => new CompositionStatement(sql) },
  DEMO_SESSION_SECRET: 'test-composition-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
};

function headings(html: string): number[] {
  return [...html.matchAll(/<h([1-6])(?:\s|>)/g)].map((match) => Number(match[1]));
}

function topLevelHtmlElements(html: string): RegExpMatchArray | null {
  return html.match(/^<html\b/gm);
}

function defaultOrView(route: string, views: readonly string[]): string[] {
  return views.map((view, index) => index === 0 ? route : `${route}?view=${view}`);
}

const publicPages = [
  '/',
  '/platform',
  '/platform/edge',
  '/platform/workers',
  '/platform/durable-objects',
  '/platform/d1',
  '/platform/r2',
  '/interfaces',
  '/interfaces/rest',
  '/interfaces/graphql',
  '/interfaces/webhooks',
  '/interfaces/identity',
  '/interfaces/mcp',
  '/interfaces/i18n',
  '/interfaces/accessibility',
  ...defaultOrView('/assurance', assuranceViews),
  '/security',
  ...defaultOrView('/operations', operationsViews),
  '/offline',
];

describe('document composition', () => {
  it('builds one document and preserves page metadata through the content boundary', async () => {
    const content: PageContent = {
      title: 'Boundary proof',
      description: 'Child description',
      body: '<section><h1>Boundary proof</h1><h2>Detail</h2><h3>Evidence</h3></section>',
      canonicalPath: '/platform?view=edge',
      lang: 'ar', dir: 'rtl', status: 404, cacheControl: 'no-store', noindex: true,
      headExtra: '<meta name="boundary-proof" content="yes">',
      beforeMain: '<div class="site-main"><nav aria-label="Views">View selector</nav></div>',
    };
    const response = renderPage(env, content);
    const html = await response.text();
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(topLevelHtmlElements(html)).toHaveLength(1);
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('<meta name="description" content="Child description">');
    expect(html).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/platform?view=edge">');
    expect(html).toContain('<meta property="og:url" content="https://demo.wizardgang.ai/platform?view=edge">');
    expect(html).toContain('<meta name="boundary-proof" content="yes">');
    expect(html.indexOf('aria-label="Views"')).toBeLessThan(html.indexOf('<main'));
    expect(headings(html)).toEqual([1, 2, 3]);
  });

  it('renders all 31 public HTML surfaces through one shell with a valid heading outline', async () => {
    expect(publicPages).toHaveLength(31);
    for (const path of publicPages) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
        headers: { accept: 'text/html' },
      }), env);
      const html = await response.text();
      const levels = headings(html);
      const canonical = `https://demo.wizardgang.ai${path}`;

      expect(response.status, path).toBe(200);
      expect(topLevelHtmlElements(html), path).toHaveLength(1);
      expect(html.match(/<main\b/g), path).toHaveLength(1);
      expect(html.match(/<h1(?:\s|>)/g), path).toHaveLength(1);
      expect(levels[0], path).toBe(1);
      expect(html.indexOf('<h1'), path).toBeGreaterThan(html.indexOf('<main'));
      for (let index = 1; index < levels.length; index += 1) {
        expect(levels[index], `${path} heading ${index}`).toBeLessThanOrEqual(levels[index - 1] + 1);
      }
      expect(html, path).toContain(`<link rel="canonical" href="${canonical}">`);
      expect(html, path).toContain(`<meta property="og:url" content="${canonical}">`);
    }
  });
});
