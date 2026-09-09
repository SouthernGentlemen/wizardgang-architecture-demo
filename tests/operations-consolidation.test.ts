import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class OperationsRouteStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: OperationsRouteD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: this.db.state, public_message: this.db.state === 'offline' ? 'Planned maintenance.' : 'Available.', updated_at: '2026-09-07T12:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-07T12:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM service_health_checks')) {
      return { results: [
        { id: 2, service_key: 'public-demo', status: 'operational', response_ms: 5, detail_json: '{"intentionalOffline":false}', checked_at: '2026-09-07T11:00:00.000Z' },
        { id: 1, service_key: 'public-demo', status: 'down', response_ms: 5, detail_json: '{"intentionalOffline":true}', checked_at: '2026-09-07T10:00:00.000Z' },
      ] as T[] };
    }
    if (this.sql.includes('FROM usage_snapshots') || this.sql.includes('FROM application_logs')) return { results: [] as T[] };
    return { results: [] as T[] };
  }
}

class OperationsRouteD1 {
  constructor(public state: 'online' | 'offline' = 'online') {}
  prepare(sql: string) { return new OperationsRouteStatement(this, sql); }
}

function env(state: 'online' | 'offline' = 'online'): Env {
  return {
    DEMO_DB: new OperationsRouteD1(state),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    DEMO_ADMIN_USER: 'operator',
    DEMO_ADMIN_PASSWORD: 'test-admin-password',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

const basic = `Basic ${btoa('operator:test-admin-password')}`;
const routes = [
  'operations.index',
  'operations.availability',
  'operations.logs',
  'operations.usage',
  'operations.reports',
  'operations.docs',
].map((routeId) => routeUrl(routeId));

const navigationHrefs = routes;

describe('canonical operations routes', () => {
  it('renders all six server-rendered pages with one derived navigation', async () => {
    const environment = env();
    for (const path of routes) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, path).toBe(200);
      const html = await response.text();
      expect(html, path).toContain('aria-label="Operations sections"');
      for (const href of navigationHrefs) {
        if (href !== path || path !== routeUrl('operations.index')) expect(html, `${path} -> ${href}`).toContain(`href="${href}"`);
      }
      expect(html, path).toContain('aria-current="page"');
      expect(html, path).toContain('<a class="skip-link" href="#main">Skip to main content</a>');
      expect(html, path).not.toContain('href="/operations?view=');
      expect(html, path).not.toContain('href="/dashboard');
    }
  });

  it('preserves availability classification, public-safe logs, usage controls, deployment evidence, and docs', async () => {
    const environment = env();
    const overview = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations'), environment)).text();
    expect(overview).toContain('Current operational state');
    expect(overview).toContain('id="health"');
    expect(overview).toContain('Deployment evidence');
    expect(overview).toContain('href="/operations/availability"');
    expect(overview).toContain('href="/operations/logs"');
    expect(overview).toContain('href="/operations/usage"');

    const availability = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations/availability'), environment)).text();
    expect(availability).toContain('Intentional demo offline');
    expect(availability).toContain('Planned maintenance observed');

    const logs = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations/logs?level=warn&source=rest&limit=25&requestId=req-1'), environment)).text();
    expect(logs).toContain('Application Logs');
    expect(logs).toContain('Public-safe');
    expect(logs).not.toContain('name="view"');
    expect(logs).toContain('action="/operations/logs"');
    expect(logs).toContain('href="/operations/logs"');

    const usage = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations/usage'), environment)).text();
    expect(usage).toContain('Cloudflare Usage &amp; Cost');
    expect(usage).toContain('Cost guardrail simulator');
    expect(usage).toContain('Usage-based spend');
    expect(usage).toContain('Provider billing cost is unavailable; no local pricing fallback is used.');

    const docs = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations/docs'), environment)).text();
    expect(docs).toContain('OpenAPI JSON');
    expect(docs).toContain('docs/INTERACTIVE-DEMO-SPEC.md');
  });

  it('uses the shared reporting presenter without retaining view query state', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/operations/reports?report=operations&limit=10', { headers: { accept: 'text/html' } }), env());
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Unified reporting');
    expect(html).toContain('Collection discovery comes from reporting ownership and registered capabilities.');
    expect(html).toContain('src/reporting/presentation.ts');
    expect(html).not.toContain('name="view"');
    expect(html).toContain('action="/operations/reports"');
  });

  it('keeps all six operations pages and recovery interfaces reachable while intentionally offline', async () => {
    const environment = env('offline');
    const alwaysReachable: Array<[string, RequestInit | undefined, number]> = [
      ...routes.map((path) => [path, { headers: { accept: 'text/html' } }, 200] as [string, RequestInit, number]),
      [routeUrl('security.index'), { headers: { accept: 'text/html' } }, 200],
      ['/api/operations/health', undefined, 503],
      ['/api/operations/version', undefined, 200],
      ['/api/operations/logs', undefined, 200],
      ['/admin', { headers: { authorization: basic, accept: 'text/html' } }, 200],
      ['/offline', { headers: { accept: 'text/html' } }, 503],
    ];
    for (const [path, init, status] of alwaysReachable) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, init), environment);
      expect(response.status, path).toBe(status);
    }
  });

  it('keeps gated API/non-HTML/write traffic on structured 503 responses while offline', async () => {
    const environment = env('offline');
    for (const request of [
      new Request('https://demo.wizardgang.ai/api/reporting/operations', { headers: { accept: 'application/json' } }),
      new Request('https://demo.wizardgang.ai/platform', { headers: { accept: 'application/json' } }),
      new Request('https://demo.wizardgang.ai/api/labs/workers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    ]) {
      const response = await routeRequest(request, environment);
      expect(response.status).toBe(503);
      expect(response.headers.get('content-type')).toContain('application/json');
    }
  });

  it('returns the ordinary 404 for the removed operations usage endpoint', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api/operations/usage'), env());
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
  });

  it('returns the normal 404 without redirects for all retired dashboard HTML routes', async () => {
    const environment = env();
    for (const path of ['/dashboard', '/dashboard/uptime', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }
  });

  it('publishes all six canonical operations pages in the sitemap', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/sitemap.xml'), env());
    expect(response.status).toBe(200);
    const sitemap = await response.text();
    for (const path of routes) expect(sitemap, path).toContain(`<loc>https://demo.wizardgang.ai${path}</loc>`);
    expect(sitemap).not.toContain('/dashboard');
    expect(sitemap).not.toContain('?view=');
  });

  it('returns ordinary 404s for every retired operations view URL', async () => {
    const environment = env();
    for (const view of ['overview', 'availability', 'logs', 'usage', 'reports', 'docs', 'not-a-view']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/operations?view=${view}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, view).toBe(404);
      expect(response.headers.get('location'), view).toBeNull();
    }
  });
});
