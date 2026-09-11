import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';
import { removedIdentityAndProtocolPathnames } from './fixtures/removed-api-pathnames';

class InterfaceStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new InterfaceStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

const pages = [
  { view: 'rest', marker: 'id="rest-rest"' },
  { view: 'graphql', marker: 'srcdoc=' },
  { view: 'webhooks', marker: 'id="webhooks-webhooks"' },
  { view: 'identity', marker: 'id="identity-oauth"' },
  { view: 'mcp', marker: 'id="mcp-mcp-endpoint"' },
  { view: 'i18n', marker: 'data-i18n-form' },
  { view: 'accessibility', marker: 'id="accessibility-accessibility-demo"' },
] as const;

async function demosHtml(path = routeUrl('demos.index')): Promise<string> {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), environment);
  expect(response.status).toBe(200);
  return response.text();
}

function demoMarkup(html: string, id: string): string {
  const start = html.indexOf(`<details class="demo-disclosure" id="${id}"`);
  if (start < 0) throw new Error(`Missing demo disclosure ${id}`);
  const end = html.indexOf('<details class="demo-disclosure"', start + 1);
  return html.slice(start, end < 0 ? undefined : end);
}

describe('canonical interface demonstrations', () => {
  it('server-renders every interface presentation in one canonical accessible document', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos#rest', { headers: { accept: 'text/html' } }), environment);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/demos">');
    expect(html).toContain('class="skip-link" href="#main"');
    expect(html).toContain('<main class="site-main" id="main">');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const page of pages) {
      expect(html, page.view).toContain(`class="demo-disclosure" id="${page.view}"`);
      expect(html, page.view).toContain(page.marker);
    }
    expect(html).not.toContain('/graphql/console');
  });

  it('keeps the interface demos focused and executable', async () => {
    const html = await demosHtml(`${routeUrl('demos.index')}#rest`);
    const rest = demoMarkup(html, 'rest');
    expect(rest).toContain('3.0.3');
    expect(rest).toContain('PATCH');
    expect(rest).toContain('/api/labs/rest-demo-records');
    expect(rest).not.toContain('Your API sandbox');
    expect(rest).not.toContain('Same policy, different transports');
    expect(rest).not.toContain('Authorization');

    const graphql = demoMarkup(html, 'graphql');
    expect(graphql).toContain('Working examples');
    expect(graphql).toContain('data-graphql-example');
    expect(graphql).not.toContain('GraphQL Yoga');
    expect(graphql).not.toContain('Application interfaces');

    const webhooks = demoMarkup(html, 'webhooks');
    expect(webhooks).toContain('Pull the latest release');
    expect(webhooks).toContain('release.published');
    expect(webhooks).not.toContain('HMAC-SHA256');
    expect(webhooks).not.toContain('Event contract');

    const identity = demoMarkup(html, 'identity');
    expect(identity).not.toContain('Many providers. One application identity.');
    expect(identity).not.toContain('No protocol secrets in the inspector');

    const mcp = demoMarkup(html, 'mcp');
    expect(mcp).not.toContain('One shared trust boundary');
    expect(mcp).not.toContain('What this route proves');
    expect(mcp).not.toContain('Internationalization →');
  });

  it('renders /demos as a real index and publishes every child link', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), environment);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<h1>Architecture Demos</h1>');
    expect(html).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/demos">');
    for (const page of pages) expect(html, page.view).toContain(`href="#${page.view}"`);
  });

  it('returns ordinary 404s for every retired interfaces ?view= URL', async () => {
    for (const view of [...pages.map((page) => page.view), 'unknown']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/demos?view=${view}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, view).toBe(404);
      expect(response.headers.get('location'), view).toBeNull();
      expect(await response.text(), view).toContain('404 / unknown route');
    }
  });

  it('keeps language and accessibility mode as query state on canonical resources', async () => {
    const i18nPath = `${routeUrl('demos.index', {}, { lang: 'ar', count: '3' })}#i18n`;
    const i18n = await (await routeRequest(new Request(`https://demo.wizardgang.ai${i18nPath}`), environment)).text();
    expect(i18n).toContain('<html lang="ar" dir="rtl">');
    expect(i18n).not.toContain('name="view"');
    expect(i18n).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/demos">');

    const accessibility = await (await routeRequest(new Request('https://demo.wizardgang.ai/demos?mode=broken#accessibility'), environment)).text();
    expect(accessibility).toContain('Teaching warning:');
    expect(accessibility).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/demos">');
  });

  it('retires standalone pages while preserving GraphQL and MCP machine endpoints', async () => {
    for (const path of ['/api', '/webhooks', '/identity', '/i18n', '/accessibility', '/graphql/console']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }

    const graphql = await routeRequest(new Request('https://demo.wizardgang.ai/graphql?query=%7B%20__typename%20%7D', { headers: { accept: 'text/html' } }), environment);
    expect(graphql.headers.get('content-type')).toContain('application/graphql-response+json');
    expect(graphql.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await graphql.text()).not.toContain('GraphiQL');

    const mcp = await routeRequest(new Request('https://demo.wizardgang.ai/mcp'), environment);
    expect(mcp.status).toBe(405);
  });

  it('returns normal 404s for retired identity and protocol contracts', async () => {
    for (const path of removedIdentityAndProtocolPathnames) {
      const response = await routeRequest(new Request('https://demo.wizardgang.ai' + path, { headers: { accept: 'application/json' } }), environment);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }
  });

  it('lands all unconfigured identity starts and a failed callback on /demos#identity', async () => {
    for (const [path, provider] of [['/auth/microsoft', 'microsoft'], ['/auth/google', 'google'], ['/auth/github', 'github'], ['/auth/saml', 'saml']] as const) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`), environment);
      expect(response.status, path).toBe(303);
      expect(response.headers.get('location'), path).toBe(`https://demo.wizardgang.ai/demos?error=provider_unconfigured&provider=${provider}#identity`);
    }
    const callback = await routeRequest(new Request('https://demo.wizardgang.ai/auth/google/callback?error=access_denied'), environment);
    expect(callback.status).toBe(303);
    expect(callback.headers.get('location')).toBe('https://demo.wizardgang.ai/demos?error=authentication_failed&provider=google#identity');
  });
});
