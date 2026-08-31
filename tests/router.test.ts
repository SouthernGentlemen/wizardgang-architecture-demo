import { describe, expect, it } from 'vitest';
import { demos } from '../src/demos/registry';
import { RETIRED_PAGE_REDIRECTS, routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class RouterStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: RouterD1, private readonly sql: string) { db.queries.push(sql); }
  bind(...values: unknown[]) { this.values = values; this.db.binds.push(...values); return this; }
  async run() { return { meta: { last_row_id: this.db.nextId++ } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: this.db.state, public_message: this.db.state === 'online' ? 'Available.' : 'Planned maintenance.', updated_at: '2026-08-31T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

class RouterD1 {
  nextId = 1;
  queries: string[] = [];
  binds: unknown[] = [];
  constructor(public state: 'online' | 'offline' = 'online') {}
  prepare(sql: string) { return new RouterStatement(this, sql); }
}

function env(state: 'online' | 'offline' = 'online'): Env & { DEMO_DB: RouterD1 } {
  return {
    DEMO_DB: new RouterD1(state),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    DEMO_ADMIN_USER: 'operator',
    DEMO_ADMIN_PASSWORD: 'test-admin-password',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

const basic = `Basic ${btoa('operator:test-admin-password')}`;

describe('public route contract', () => {
  it('resolves every registered human demo route and links to its exact primary source', async () => {
    const environment = env();
    for (const demo of demos) {
      if (RETIRED_PAGE_REDIRECTS.has(demo.route)) continue;
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${demo.route}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, demo.route).toBe(200);
      const html = await response.text();
      expect(html, demo.route).toContain(`https://github.com/SouthernGentlemen/wizardgang-architecture-demo/blob/main/${demo.sourcePath}`);
    }
  });

  it('redirects retired page routes to exact anchors without intercepting SAML metadata', async () => {
    const environment = env();
    for (const [route, destination] of RETIRED_PAGE_REDIRECTS) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${route}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, route).toBe(301);
      expect(response.headers.get('location'), route).toBe(`https://demo.wizardgang.ai${destination}`);
    }

    const metadata = await routeRequest(new Request('https://demo.wizardgang.ai/identity/saml/metadata'), environment);
    expect(metadata.status).toBe(200);
    expect(metadata.headers.get('content-type')).toContain('application/samlmetadata+xml');
  });

  it('resolves root, protected admin, offline, health, version, and logs surfaces', async () => {
    const environment = env();
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/admin', { headers: { authorization: basic } }), environment)).status).toBe(200);
    // The maintenance page reports the real state: it only claims the demo is down while it is.
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/offline'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/health'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/version'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/__api/operations/logs'), environment)).status).toBe(200);
  });

  it('renders the consolidated API interfaces as runnable anchored sections', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    for (const anchor of ['rest', 'openapi', 'graphql', 'webhooks']) expect(html).toContain(`id="${anchor}"`);
    for (const endpoint of ['/v1/demo-records', '/v1/openapi.json', '/graphql', '/__api/webhooks/demo']) expect(html).toContain(endpoint);
  });

  it('renders the consolidated identity interfaces as runnable anchored sections', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/identity', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    for (const anchor of ['oauth', 'sso', 'saml']) expect(html).toContain(`id="${anchor}"`);
    for (const endpoint of ['/__api/identity/authorize', '/__api/identity/oauth-pkce', '/__api/identity/sso', '/__api/identity/saml/inspect', '/identity/saml/metadata']) expect(html).toContain(endpoint);
  });
});

describe('offline routing matrix', () => {
  it('blocks ordinary behavior before execution while keeping operations reachable', async () => {
    const environment = env('offline');
    const html = await routeRequest(new Request('https://demo.wizardgang.ai/edge', { headers: { accept: 'text/html' } }), environment);
    expect(html.status).toBe(302);
    expect(html.headers.get('location')).toContain('/offline?from=%2Fedge');
    expect(environment.DEMO_DB.queries.every((query) => query.includes('demo_control'))).toBe(true);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/mcp', { headers: { accept: 'text/html' } }), environment)).status).toBe(302);

    const api = await routeRequest(new Request('https://demo.wizardgang.ai/v1/demo-records', { headers: { accept: 'application/json' } }), environment);
    expect(api.status).toBe(503);
    expect(await api.json()).toMatchObject({ status: 'offline' });

    const offlinePage = await routeRequest(new Request('https://demo.wizardgang.ai/offline', { headers: { accept: 'text/html' } }), environment);
    expect(offlinePage.status).toBe(503);
    expect(await offlinePage.text()).toContain('Oops! demo is down.');

    expect((await routeRequest(new Request('https://demo.wizardgang.ai/dashboard'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/__api/operations/logs'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/version'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/health'), environment)).status).toBe(503);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/admin', { headers: { authorization: basic } }), environment)).status).toBe(200);
  });

  it('persists and audits an authenticated same-origin admin transition without binding credentials', async () => {
    const environment = env();
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/admin', {
      method: 'POST',
      headers: { authorization: basic, origin: 'https://demo.wizardgang.ai', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ state: 'offline', message: 'Planned public demonstration window.' }),
    }), environment);
    expect(response.status).toBe(303);
    expect(environment.DEMO_DB.queries.some((query) => query.includes('INSERT INTO demo_control'))).toBe(true);
    expect(environment.DEMO_DB.queries.some((query) => query.includes('INSERT INTO demo_events'))).toBe(true);
    expect(environment.DEMO_DB.queries.some((query) => query.includes('INSERT INTO application_logs'))).toBe(true);
    expect(environment.DEMO_DB.binds.join(' ')).not.toContain('test-admin-password');
    expect(environment.DEMO_DB.binds.join(' ')).not.toContain(basic);
  });
});
