import { describe, expect, it } from 'vitest';
import swagger from '../contracts/openapi/swagger.json';
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
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: this.db.crawlerState, updated_at: '2026-09-01T12:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

class RouterD1 {
  nextId = 1;
  queries: string[] = [];
  binds: unknown[] = [];
  constructor(public state: 'online' | 'offline' = 'online', public crawlerState: 'enabled' | 'disabled' = 'disabled') {}
  prepare(sql: string) { return new RouterStatement(this, sql); }
}

function env(state: 'online' | 'offline' = 'online', crawlerState: 'enabled' | 'disabled' = 'disabled'): Env & { DEMO_DB: RouterD1 } {
  return {
    DEMO_DB: new RouterD1(state, crawlerState),
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
      const target = new URL(destination, 'https://demo.wizardgang.ai');
      const targetResponse = await routeRequest(new Request(target, { headers: { accept: 'text/html' } }), environment);
      expect(targetResponse.status, destination).toBe(200);
      expect(await targetResponse.text(), destination).toContain(`id="${target.hash.slice(1)}"`);
    }

    const metadata = await routeRequest(new Request('https://demo.wizardgang.ai/identity/saml/metadata'), environment);
    expect(metadata.status).toBe(200);
    expect(metadata.headers.get('content-type')).toContain('application/samlmetadata+xml');
  });

  it('resolves root, protected admin, offline, health, version, and logs surfaces', async () => {
    const environment = env();
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/'), environment)).status).toBe(200);
    const admin = await routeRequest(new Request('https://demo.wizardgang.ai/admin', { headers: { authorization: basic } }), environment);
    expect(admin.status).toBe(200);
    const adminHtml = await admin.text();
    expect(adminHtml).toContain('ChatGPT web access');
    expect(adminHtml).toContain('https://developers.openai.com/api/docs/bots');
    // The maintenance page reports the real state: it only claims the demo is down while it is.
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/offline'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/health'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/version'), environment)).status).toBe(200);
    const socialCard = await routeRequest(new Request('https://demo.wizardgang.ai/og.png'), environment);
    expect(socialCard.status).toBe(200);
    expect(socialCard.headers.get('content-type')).toBe('image/png');
    expect(socialCard.headers.get('cache-control')).toContain('immutable');
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/__api/operations/logs'), environment)).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/robots.txt'), environment)).status).toBe(200);
    const accessibilityFrame = await routeRequest(new Request('https://demo.wizardgang.ai/__api/accessibility/lab?mode=accessible'), environment);
    expect(accessibilityFrame.status).toBe(200);
    expect(accessibilityFrame.headers.get('content-type')).toContain('text/html');
  });

  it('renders the consolidated API interfaces as runnable anchored sections', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    const swaggerOperationCount = Object.values(swagger.paths).reduce((count, path) => count + Object.keys(path).filter((method) => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)).length, 0);
    for (const anchor of ['rest', 'openapi', 'graphql', 'webhooks']) expect(html).toContain(`id="${anchor}"`);
    for (const endpoint of ['/v1/demo-records', '/v1/openapi.json', '/graphql', '/v1/webhooks/github', '/__api/webhooks/demo', '/__api/webhooks/events']) expect(html).toContain(endpoint);
    expect(html.match(/<form data-swagger-form/g)).toHaveLength(swaggerOperationCount);
    expect(html.match(/<details class="swagger-operation"/g)).toHaveLength(swaggerOperationCount);
    expect(html).not.toContain('<details class="swagger-operation" open');
    expect(html).toContain('Swagger 2.0');
    expect(html).toContain('REST API');
    expect(html).not.toContain('All 6 operations below are generated from the same');
    expect(html).not.toContain('>Ready.</pre>');
    expect(html).toContain('Request body schema');
    expect(html).toContain('swagger-definition-RecordInput');
    expect(html).toContain('swagger-definition-WebhookEvent');
    expect(html).toContain('data-auth-prefix="Bearer "');
  });

  it('renders the consolidated identity interfaces as runnable anchored sections', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/identity', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    for (const anchor of ['oauth', 'sso', 'saml']) expect(html).toContain(`id="${anchor}"`);
    for (const endpoint of ['/__api/identity/authorize', '/__api/identity/oauth-pkce', '/__api/identity/sso', '/__api/identity/saml/inspect', '/identity/saml/metadata']) expect(html).toContain(endpoint);
  });

  it('renders the consolidated delivery lifecycle with one runnable version proof', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/git', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    for (const anchor of ['source-of-truth', 'versioning', 'branching', 'actions', 'releases', 'environments']) expect(html).toContain(`id="${anchor}"`);
    expect(html).toContain('/__api/git/evidence');
    expect(html).toContain('data-evidence-refresh');
    expect(html).toContain('Not publicly verifiable');
  });

  it('renders consolidated governance controls, evidence anchors, and the alignment notice', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/governance', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    for (const anchor of ['iso-27001', 'iso-42001', 'traceability', 'evidence']) expect(html).toContain(`id="${anchor}"`);
    for (const endpoint of ['/__api/governance/security-controls', '/__api/governance/ai-evaluation', '/__api/evidence/traceability']) expect(html).toContain(endpoint);
    expect(html).toContain('alignment targets, not certification claims');

    const edge = await routeRequest(new Request('https://demo.wizardgang.ai/edge', { headers: { accept: 'text/html' } }), env());
    expect(await edge.text()).not.toContain('alignment targets, not certification claims');
  });

  it('keeps source context without repeating global route chrome or interface lists', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/edge', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    expect(html).toContain('Route source');
    expect(html).not.toContain('D1 schema');
    expect(html).not.toContain('Route map');
    expect(html).not.toContain('Live interfaces');
    expect(html).not.toContain('This button calls the live Worker interface below');
  });

  it('keeps a compact live status strip on the index and removes duplicate dashboard navigation', async () => {
    const environment = env();
    const index = await (await routeRequest(new Request('https://demo.wizardgang.ai/'), environment)).text();
    expect(index).not.toContain('<h2 class="eyebrow">Routes</h2>');
    expect(index).not.toContain('<h2 class="eyebrow">Groups</h2>');
    expect(index).toContain('<section class="status-strip"');
    expect(index).toContain('<span>Version</span>');
    expect(index).toContain('<span>Health</span>');
    expect(index).toContain('<strong>WIZARDGANG.AI</strong>');
    expect(index).toContain('<meta property="og:image" content="https://demo.wizardgang.ai/og.png">');

    const dashboard = await (await routeRequest(new Request('https://demo.wizardgang.ai/dashboard'), environment)).text();
    expect(dashboard).not.toContain('<nav aria-label="Operations">');
    expect(dashboard).not.toContain('Operational proof surfaces');
    expect(dashboard).toContain('ChatGPT access');
    expect(dashboard).toContain('Model-training crawl stays blocked.');

    const docs = await (await routeRequest(new Request('https://demo.wizardgang.ai/dashboard/docs'), environment)).text();
    expect(docs).toContain('src/router.ts');
  });

  it('removes the generic fallback runner and event listing routes', async () => {
    const environment = env();
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/__api/demo/run', { method: 'POST' }), environment)).status).toBe(404);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/__api/demo/events'), environment)).status).toBe(404);
  });
});

describe('ChatGPT crawler control', () => {
  it('publishes the selected robots policy while always opting out of model training', async () => {
    const disabled = await routeRequest(new Request('https://demo.wizardgang.ai/robots.txt'), env('online', 'disabled'));
    expect(disabled.status).toBe(200);
    expect(disabled.headers.get('cache-control')).toBe('no-store');
    expect(disabled.headers.get('x-chatgpt-crawl-access')).toBe('disabled');
    const disabledPolicy = await disabled.text();
    expect(disabledPolicy).toContain('User-agent: OAI-SearchBot\nDisallow: /');
    expect(disabledPolicy).toContain('User-agent: ChatGPT-User\nDisallow: /');
    expect(disabledPolicy).toContain('User-agent: GPTBot\nDisallow: /');

    const enabled = await routeRequest(new Request('https://demo.wizardgang.ai/robots.txt'), env('online', 'enabled'));
    const enabledPolicy = await enabled.text();
    expect(enabled.headers.get('x-chatgpt-crawl-access')).toBe('enabled');
    expect(enabledPolicy).toContain('User-agent: OAI-SearchBot\nAllow: /');
    expect(enabledPolicy).toContain('User-agent: ChatGPT-User\nAllow: /');
    expect(enabledPolicy).toContain('User-agent: GPTBot\nDisallow: /');
    expect(enabledPolicy).toContain('Sitemap: https://demo.wizardgang.ai/sitemap.xml');
  });

  it('enforces the switch for search and user-requested fetches, with training always blocked', async () => {
    const searchAgent = 'Mozilla/5.0; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot';
    const userAgent = 'Mozilla/5.0; compatible; ChatGPT-User/1.0; +https://openai.com/bot';
    const trainingAgent = 'Mozilla/5.0; compatible; GPTBot/1.4; +https://openai.com/gptbot';

    const searchBlocked = await routeRequest(new Request('https://demo.wizardgang.ai/', { headers: { 'user-agent': searchAgent } }), env('online', 'disabled'));
    expect(searchBlocked.status).toBe(403);
    expect(await searchBlocked.json()).toMatchObject({ agent: 'OAI-SearchBot', reason: 'chatgpt_crawl_access_disabled' });

    const userBlocked = await routeRequest(new Request('https://demo.wizardgang.ai/health', { headers: { 'user-agent': userAgent } }), env('online', 'disabled'));
    expect(userBlocked.status).toBe(403);
    expect(userBlocked.headers.get('x-robots-tag')).toBe('noindex, nofollow');

    expect((await routeRequest(new Request('https://demo.wizardgang.ai/', { headers: { 'user-agent': searchAgent } }), env('online', 'enabled'))).status).toBe(200);
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/version', { headers: { 'user-agent': userAgent } }), env('online', 'enabled'))).status).toBe(200);

    const trainingBlocked = await routeRequest(new Request('https://demo.wizardgang.ai/', { headers: { 'user-agent': trainingAgent } }), env('online', 'enabled'));
    expect(trainingBlocked.status).toBe(403);
    expect(await trainingBlocked.json()).toMatchObject({ agent: 'GPTBot', reason: 'model_training_disabled' });

    expect((await routeRequest(new Request('https://demo.wizardgang.ai/'), env('online', 'disabled'))).status).toBe(200);
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
    expect((await routeRequest(new Request('https://demo.wizardgang.ai/og.png'), environment)).status).toBe(200);
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

  it('persists and audits the authenticated ChatGPT access switch', async () => {
    const unauthenticatedEnvironment = env();
    const denied = await routeRequest(new Request('https://demo.wizardgang.ai/admin', {
      method: 'POST',
      headers: { origin: 'https://demo.wizardgang.ai', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ control: 'chatgpt-crawl', state: 'enabled' }),
    }), unauthenticatedEnvironment);
    expect(denied.status).toBe(401);
    expect(unauthenticatedEnvironment.DEMO_DB.queries.some((query) => query.includes('INSERT INTO crawler_control'))).toBe(false);

    const environment = env();
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/admin', {
      method: 'POST',
      headers: { authorization: basic, origin: 'https://demo.wizardgang.ai', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ control: 'chatgpt-crawl', state: 'enabled' }),
    }), environment);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('changed=chatgpt-crawl-enabled');
    expect(response.headers.get('location')).toContain('#chatgpt-crawl');
    expect(environment.DEMO_DB.queries.some((query) => query.includes('INSERT INTO crawler_control'))).toBe(true);
    expect(environment.DEMO_DB.queries.some((query) => query.includes('INSERT INTO demo_events'))).toBe(true);
    expect(environment.DEMO_DB.queries.some((query) => query.includes('INSERT INTO application_logs'))).toBe(true);
    expect(environment.DEMO_DB.binds).toContain('chatgpt_crawl_access_changed');
    expect(environment.DEMO_DB.binds.join(' ')).not.toContain('test-admin-password');
  });
});
