import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demos } from '../src/demos/registry';
import { routeRequest } from '../src/router';
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

function internalLinks(html: string, sourceRoute: string): URL[] {
  const renderedMarkup = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  return [...renderedMarkup.matchAll(hrefPattern)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .filter((href) => !href.startsWith('mailto:') && !href.startsWith('data:'))
    .map((href) => new URL(href, `https://demo.wizardgang.ai${sourceRoute}`))
    .filter((url) => url.origin === 'https://demo.wizardgang.ai');
}

async function get(path: string): Promise<Response> {
  return routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
    headers: { accept: 'text/html,application/json', authorization },
  }), environment);
}

describe('public link and route contract', () => {
  it('keeps every registered HTML route implemented, sourced, and canonical', async () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{ route: string; source: string }>;
    for (const demo of demos) {
      expect(readFileSync(demo.sourcePath, 'utf8').length, `${demo.route} source is empty`).toBeGreaterThan(0);
      expect(manifest.filter((entry) => entry.route === demo.route), `${demo.route} manifest entry`).toHaveLength(1);
      const response = await get(demo.route);
      expect(response.status, `${demo.route} implementation`).toBe(200);
    }
  });

  it('resolves every internal page link and linked fragment', async () => {
    const pages = ['/', ...demos.map((demo) => demo.route)];
    const targets = new Map<string, Set<string>>();
    for (const page of pages) {
      const response = await get(page);
      const html = await response.text();
      for (const link of internalLinks(html, page)) {
        const fragments = targets.get(link.pathname) ?? new Set<string>();
        if (link.hash) fragments.add(decodeURIComponent(link.hash.slice(1)));
        targets.set(link.pathname, fragments);
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
  });

  it('builds the sitemap exclusively from registered canonical HTML routes', async () => {
    const response = await get('/sitemap.xml');
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>https:\/\/demo\.wizardgang\.ai([^<]*)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual(['/', ...demos.map((demo) => demo.route)]);
    expect(new Set(locations).size).toBe(locations.length);
  });
});
