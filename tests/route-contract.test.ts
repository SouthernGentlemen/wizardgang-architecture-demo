import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applicationRouteRegistry,
  routeUrl,
} from '../src/routing/application-routes';
import { routeRequest } from '../src/router';
import { sitemapPaths } from '../src/routing/navigation';
import type { D1PreparedStatement, Env } from '../src/types';

class ContractStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: {} }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-02T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: 'disabled', updated_at: '2026-09-02T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new ContractStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_ADMIN_USER: 'operator',
  DEMO_ADMIN_PASSWORD: 'test-admin-password',
  BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
};

const authorization = `Basic ${btoa('operator:test-admin-password')}`;
const hrefPattern = /<a\b[^>]*\shref="([^"]+)"/gi;
const idPattern = /\sid="([^"]+)"/gi;

function renderedHrefs(html: string): string[] {
  const renderedMarkup = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  return [...renderedMarkup.matchAll(hrefPattern)]
    .map((match) => match[1].replaceAll('&amp;', '&'));
}

function internalLinks(html: string, sourceRoute: string): URL[] {
  return renderedHrefs(html)
    .filter((href) => !href.startsWith('mailto:') && !href.startsWith('data:'))
    .map((href) => new URL(href, `https://demo.wizardgang.ai${sourceRoute}`))
    .filter((url) => url.origin === 'https://demo.wizardgang.ai');
}

function registeredPageUrls(): string[] {
  return applicationRouteRegistry.declarations
    .filter((route) => route.kind === 'page')
    .map((route) => routeUrl(route.id));
}

async function get(path: string): Promise<Response> {
  return routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
    headers: { accept: 'text/html,application/json', authorization },
  }), environment);
}

describe('public link and route contract', () => {
  it('keeps every registered HTML route implemented, sourced, and canonical', async () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{
      route: string;
      source: { module: string };
    }>;
    for (const route of sitemapPaths()) {
      const entries = manifest.filter((entry) => entry.route === route);
      expect(entries, `${route} manifest entry`).toHaveLength(1);
      expect(readFileSync(entries[0].source.module, 'utf8').length, `${route} source is empty`).toBeGreaterThan(0);
      const response = await get(route);
      expect(response.status, `${route} implementation`).toBe(200);
    }
  });

  it('resolves every internal page link and linked fragment', async () => {
    const targets = new Map<string, Set<string>>();
    for (const page of registeredPageUrls()) {
      const response = await get(page);
      const html = await response.text();
      for (const href of renderedHrefs(html)) {
        expect((href.match(/\?/g) ?? []).length, `multiple query delimiters in ${page} href ${href}`).toBeLessThanOrEqual(1);
      }
      for (const link of internalLinks(html, page)) {
        const target = `${link.pathname}${link.search}`;
        const fragments = targets.get(target) ?? new Set<string>();
        if (link.hash) fragments.add(decodeURIComponent(link.hash.slice(1)));
        targets.set(target, fragments);
      }
    }

    for (const [target, fragments] of targets) {
      const response = await get(target);
      expect(response.status, `dead internal link ${target}`).not.toBe(404);
      expect(response.status, `failed internal link ${target}`).toBeLessThan(500);
      if (!fragments.size) continue;
      expect(response.headers.get('content-type'), `${target} fragment target is not HTML`).toContain('text/html');
      const html = await response.text();
      const ids = new Set([...html.matchAll(idPattern)].map((match) => match[1]));
      for (const fragment of fragments) expect(ids.has(fragment), `missing ${target}#${fragment}`).toBe(true);
    }
  }, 60_000);

  it('serves every compliance framework filter through the canonical assurance route', async () => {
    for (const framework of ['iso-27001', 'iso-42001', 'wcag-2.2']) {
      const target = routeUrl('assurance.compliance', {}, { framework });
      const response = await get(target);
      expect(response.status, target).toBe(200);
      const html = await response.text();
      expect(html, `${framework} filter was not applied`).toContain(`<input type="hidden" name="framework" value="${framework}">`);
    }
  });

  it('builds the sitemap exclusively from registered canonical HTML routes', async () => {
    const response = await get('/sitemap.xml');
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>https:\/\/demo\.wizardgang\.ai([^<]*)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual(sitemapPaths());
    expect(new Set(locations).size).toBe(locations.length);
  });
});
