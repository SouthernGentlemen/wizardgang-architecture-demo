import { describe, expect, it } from 'vitest';
import openapi from '../contracts/openapi/openapi.json';
import { demos } from '../src/demos/registry';
import { routeRequest } from '../src/router';
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
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${demo.route}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, demo.route).toBe(200);
      const html = await response.text();
      expect(html, demo.route).toContain(`https://github.com/SouthernGentlemen/wizardgang-architecture-demo/blob/main/${demo.sourcePath}`);
    }
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

  it('renders a focused REST client generated from the OpenAPI contract', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    const openapiOperationCount = Object.values(openapi.paths).reduce((count, path) => count + Object.keys(path).filter((method) => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)).length, 0);
    for (const anchor of ['rest', 'openapi']) expect(html).toContain(`id="${anchor}"`);
    for (const endpoint of ['/v1/demo-records', '/v1/openapi.json', '/graphql', '/webhooks']) expect(html).toContain(endpoint);
    expect(html.match(/<form data-api-form/g)).toHaveLength(openapiOperationCount);
    expect(html.match(/data-api-endpoint=/g)).toHaveLength(openapiOperationCount);
    expect(html).toContain('OpenAPI 3.1');
    expect(html).toContain('REST API');
    expect(html).toContain('Your API sandbox');
    expect(html).toContain('Sign in to enable writes');
    expect(html).toContain('View request in logs');
    for (const language of ['curl', 'JavaScript', 'Python', 'C#']) expect(html).toContain(language);
    expect(html).toContain('openapi-schema-RecordInput');
    expect(html).not.toContain('openapi-schema-WebhookEvent');
    expect(html).not.toContain('DEMO_API_TOKEN');
    const runner = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]).find((script) => script.includes("data-api-endpoint"));
    expect(() => new Function(runner || '')).not.toThrow();

  });

  it('renders focused GraphQL and webhook interface routes', async () => {
    const environment = env();
    const graphqlPage = await routeRequest(new Request('https://demo.wizardgang.ai/graphql', { headers: { accept: 'text/html' } }), environment);
    const graphqlHtml = await graphqlPage.text();
    expect(graphqlHtml).toContain('src="/graphql/console"');
    for (const control of ['Depth limit', 'Field limit', 'Batching', 'Request limit']) expect(graphqlHtml).toContain(control);
    expect(graphqlHtml).toContain('GraphQL ↔ D1 Users');

    const graphqlApi = await routeRequest(new Request('https://demo.wizardgang.ai/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://demo.wizardgang.ai' },
      body: JSON.stringify({ query: '{ demoRecords { key } }' }),
    }), environment);
    expect(graphqlApi.headers.get('content-type')).toContain('application/json');

    const crossOriginGraphqlApi = await routeRequest(new Request('https://demo.wizardgang.ai/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ demoRecords { key } }' }),
    }), environment);
    expect(crossOriginGraphqlApi.status).toBe(403);

    const webhooksPage = await routeRequest(new Request('https://demo.wizardgang.ai/webhooks', { headers: { accept: 'text/html' } }), environment);
    const webhooksHtml = await webhooksPage.text();
    expect(webhooksHtml).toContain('/v1/webhooks/github');
    expect(webhooksHtml).toContain('Generate signed event');
    expect(webhooksHtml).toContain('Signature valid');
    expect(webhooksHtml).toContain('Verified deliveries');
  });

  it('renders the identity console with provider routes, inspector views, and stable anchors', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/identity', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    for (const anchor of ['oauth', 'sso', 'saml']) expect(html).toContain(`id="${anchor}"`);
    for (const endpoint of ['/identity/microsoft', '/identity/google', '/identity/github', '/identity/saml', '/identity/session', '/__api/identity/authorize', '/identity/saml/metadata']) expect(html).toContain(endpoint);
    for (const view of ['Provider payload', 'Normalized identity', 'Authorization', 'Protocol']) expect(html).toContain(view);
    expect(html).not.toContain('visitor@example.test');

    const metadata = await routeRequest(new Request('https://demo.wizardgang.ai/identity/saml/metadata'), env());
    expect(metadata.status).toBe(200);
    expect(metadata.headers.get('content-type')).toContain('application/samlmetadata+xml');
  });

  it('separates the MCP guide from the interoperable Streamable HTTP endpoint', async () => {
    const environment = env();
    const page = await routeRequest(new Request('https://demo.wizardgang.ai/mcp', { headers: { accept: 'text/html' } }), environment);
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain('https://demo.wizardgang.ai/mcp/server');
    expect(html).toContain('claude mcp add --transport http wizardgang');
    expect(html).toContain('codex mcp add wizardgang --url');
    expect(html).toContain('MCP-Protocol-Version: 2026-07-28');
    expect(html).toContain('Live MCP activity');
    expect(html).toContain('MCP is another interface—not another trust boundary.');

    const oldTransport = await routeRequest(new Request('https://demo.wizardgang.ai/mcp', { method: 'POST' }), environment);
    expect(oldTransport.status).toBe(405);
    expect(oldTransport.headers.get('allow')).toBe('GET');

    const transportGet = await routeRequest(new Request('https://demo.wizardgang.ai/mcp/server'), environment);
    expect(transportGet.status).toBe(405);
    expect(await transportGet.text()).toContain('Method not allowed');
  });

  it('renders the consolidated delivery lifecycle with one runnable version proof', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/git', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    for (const anchor of ['source-of-truth', 'versioning', 'branching', 'actions', 'releases', 'environments']) expect(html).toContain(`id="${anchor}"`);
    expect(html).toContain('/__api/git/evidence');
    expect(html).toContain('/__api/git/demo');
    expect(html).toContain('Run Live Git Demo');
    expect(html).toContain('Merge &amp; Release');
    expect(html).toContain('GitHub Actions live feed');
    expect(html).toContain('data-feed-cadence');
    expect(html).toContain('state.feedStores');
    expect(html).not.toContain("q('[data-ci-jobs]').innerHTML");
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

  it('renders compliance as a canonical record registry without certification claims', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/compliance', { headers: { accept: 'text/html' } }), env());
    const html = await response.text();
    expect(response.status).toBe(200);
    for (const statement of ['WCAG 2.2', 'ISO/IEC 27001:2022', 'ISO/IEC 42001:2023', 'Canonical frameworks', 'Filter records', 'Compliance records']) {
      expect(html).toContain(statement);
    }
    for (const control of ['compliance-framework', 'compliance-status', 'compliance-level']) {
      expect(html).toContain(`id="${control}"`);
    }
    for (const anchor of ['ISO27001-4.1', 'ISO42001-4.1', 'WCAG-4.1.2']) {
      expect(html).toContain(`id="${anchor}"`);
    }
    expect(html).toContain('href="/v1/assurance/compliance"');
    expect(html).toContain('href="/v1/assurance/compliance/WCAG-4.1.2"');
    expect(html).toContain('href="/evidence"');
    expect(html).not.toMatch(/>\s*(?:COMPLIANT|CERTIFIED)\s*</i);
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
    expect(index).toContain('<strong>WIZARDGANG</strong>');
    expect(index).toContain('<meta property="og:image" content="https://demo.wizardgang.ai/og.png">');
    expect(index).toContain('href="/dashboard">Dashboard</a>');
    expect(index).not.toContain('>Map</a>');
    expect(index).not.toContain('>Operations</a>');
    expect(index).not.toContain('>Docs</a>');
    expect(index).not.toContain('>GitHub <span');
    expect(index).toContain('WG-ARCH-001 · <a href="https://github.com/SouthernGentlemen/wizardgang-architecture-demo">Public source</a>');

    const dashboard = await (await routeRequest(new Request('https://demo.wizardgang.ai/dashboard'), environment)).text();
    expect(dashboard).toContain('<nav class="section-nav" aria-label="Operations">');
    expect(dashboard).not.toContain('Operational proof surfaces');
    expect(dashboard).toContain('User-requested ChatGPT fetch');
    expect(dashboard).toContain('Model-training crawl');
    expect(dashboard).not.toContain('name="control" value="chatgpt-crawl"');
    expect(dashboard).toContain('Collection discovery comes from reporting ownership and registered capabilities.');
    expect(dashboard).toContain('href="/dashboard?report=compliance#reporting-browser"');
    expect(dashboard).toContain('Shared reporting presenter');
    expect(dashboard).toContain('23 available in the authorized selection');

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
    const mcp = await routeRequest(new Request('https://demo.wizardgang.ai/mcp/server', { headers: { accept: 'application/json' } }), environment);
    expect(mcp.status).toBe(503);
    expect(await mcp.json()).toMatchObject({ status: 'offline' });

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
