import { describe, expect, it } from 'vitest';
import { interfaceViews } from '../src/demos/interfaces';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class InterfaceStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new InterfaceStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

const viewMarkers = {
  rest: 'id="rest"',
  graphql: 'src="/graphql/console"',
  webhooks: 'id="webhooks"',
  identity: 'id="oauth"',
  mcp: 'id="mcp-endpoint"',
  i18n: 'data-i18n-form',
  accessibility: 'id="accessibility-demo"',
} as const;

describe('consolidated interface demonstrations', () => {
  it('server-renders every query-selected view with canonical navigation', async () => {
    for (const view of interfaceViews) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/interfaces?view=${view}`, {
        headers: { accept: 'text/html' },
      }), environment);
      const html = await response.text();
      expect(response.status, view).toBe(200);
      expect(response.headers.get('content-type'), view).toContain('text/html');
      expect(html, view).toContain(viewMarkers[view]);
      expect(html, view).toContain(`href="/interfaces?view=${view}" aria-current="page"`);
      expect(html, view).toContain(`<link rel="canonical" href="https://demo.wizardgang.ai/interfaces?view=${view}">`);
      expect(html.match(/<h1\b/g), view).toHaveLength(1);
    }
  });

  it('defaults to REST and rejects unknown views without redirecting', async () => {
    const defaultResponse = await routeRequest(new Request('https://demo.wizardgang.ai/interfaces', {
      headers: { accept: 'text/html' },
    }), environment);
    const defaultHtml = await defaultResponse.text();
    expect(defaultResponse.status).toBe(200);
    expect(defaultHtml).toContain(viewMarkers.rest);
    expect(defaultHtml).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/interfaces">');

    const unknown = await routeRequest(new Request('https://demo.wizardgang.ai/interfaces?view=unknown', {
      headers: { accept: 'text/html' },
    }), environment);
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get('location')).toBeNull();
  });

  it('keeps internal presentation links on the consolidated route', async () => {
    for (const view of interfaceViews) {
      const html = await (await routeRequest(new Request(`https://demo.wizardgang.ai/interfaces?view=${view}`, {
        headers: { accept: 'text/html' },
      }), environment)).text();
      expect(html, view).not.toMatch(/href="\/(?:api|webhooks|identity|mcp|i18n|accessibility)"/);
    }

    const i18n = await (await routeRequest(new Request('https://demo.wizardgang.ai/interfaces?view=i18n&locale=ar&count=3'), environment)).text();
    expect(i18n).toContain('<html lang="ar" dir="rtl">');
    expect(i18n).toContain('<input type="hidden" name="view" value="i18n">');
  });

  it('retires standalone pages while preserving GraphQL and MCP machine endpoints', async () => {
    for (const path of ['/api', '/webhooks', '/identity', '/mcp', '/i18n', '/accessibility']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
        headers: { accept: 'text/html' },
      }), environment);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }

    const graphql = await routeRequest(new Request('https://demo.wizardgang.ai/graphql?query=%7B%20__typename%20%7D', {
      headers: { accept: 'text/html' },
    }), environment);
    expect(graphql.headers.get('content-type')).toContain('application/graphql-response+json');
    expect(graphql.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await graphql.text()).not.toContain('GraphiQL');

    const mcp = await routeRequest(new Request('https://demo.wizardgang.ai/mcp/server'), environment);
    expect(mcp.status).toBe(405);
  });

  it('lands identity start errors on the consolidated identity view', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/identity/google'), environment);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://demo.wizardgang.ai/interfaces?view=identity&error=provider_unconfigured&provider=google');
  });
});
