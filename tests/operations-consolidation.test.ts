import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
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
const views = ['overview', 'availability', 'logs', 'usage', 'reports', 'docs'] as const;

describe('consolidated operations surface', () => {
  it('renders all six server-rendered views behind the one canonical route', async () => {
    const environment = env();
    for (const view of views) {
      const suffix = view === 'overview' ? '' : `?view=${view}`;
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/operations${suffix}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, view).toBe(200);
      const html = await response.text();
      expect(html, view).toContain('aria-label="Operations views"');
      expect(html, view).toContain('href="/operations"');
      expect(html, view).toContain('href="/operations?view=availability"');
      expect(html, view).toContain('href="/operations?view=logs"');
      expect(html, view).toContain('href="/operations?view=usage"');
      expect(html, view).toContain('href="/operations?view=reports"');
      expect(html, view).toContain('href="/operations?view=docs"');
      expect(html, view).toContain('aria-current="page"');
      expect(html, view).toContain('<a class="skip-link" href="#main">Skip to main content</a>');
      expect(html, view).not.toContain('href="/dashboard');
    }
  });

  it('preserves availability classification, public-safe operations data, usage controls, deployment evidence, and docs', async () => {
    const environment = env();
    const overview = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations'), environment)).text();
    expect(overview).toContain('Current operational state');
    expect(overview).toContain('id="health"');
    expect(overview).toContain('Deployment evidence');

    const availability = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations?view=availability'), environment)).text();
    expect(availability).toContain('planned/manual offline');
    expect(availability).toContain('planned / unexpected');

    const logs = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations?view=logs'), environment)).text();
    expect(logs).toContain('Application Logs');
    expect(logs).toContain('Public-safe');
    expect(logs).toContain('name="view" value="logs"');

    const usage = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations?view=usage'), environment)).text();
    expect(usage).toContain('Cloudflare Usage &amp; Cost');
    expect(usage).toContain('Cost guardrail simulator');
    expect(usage).toContain('Usage-based spend');
    expect(usage).toContain('Provider billing cost is unavailable; no local pricing fallback is used.');

    const docs = await (await routeRequest(new Request('https://demo.wizardgang.ai/operations?view=docs'), environment)).text();
    expect(docs).toContain('OpenAPI JSON');
    expect(docs).toContain('docs/INTERACTIVE-DEMO-SPEC.md');
  });

  it('uses the shared reporting presenter for the reports view', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/operations?view=reports', { headers: { accept: 'text/html' } }), env());
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Unified reporting');
    expect(html).toContain('Collection discovery comes from reporting ownership and registered capabilities.');
    expect(html).toContain('src/reporting/presentation.ts');
    expect(html).toContain('name="view" value="reports"');
  });

  it('keeps operations, admin, offline, security, and machine recovery interfaces reachable while intentionally offline', async () => {
    const environment = env('offline');
    const alwaysReachable: Array<[string, RequestInit | undefined, number]> = [
      ['/operations', { headers: { accept: 'text/html' } }, 200],
      ['/operations?view=availability', { headers: { accept: 'text/html' } }, 200],
      ['/security', { headers: { accept: 'text/html' } }, 200],
      ['/health', undefined, 503],
      ['/version', undefined, 200],
      ['/__api/operations/logs', undefined, 200],
      ['/__api/operations/cloudflare-usage', undefined, 200],
      ['/admin', { headers: { authorization: basic, accept: 'text/html' } }, 200],
      ['/offline', { headers: { accept: 'text/html' } }, 503],
    ];
    for (const [path, init, status] of alwaysReachable) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, init), environment);
      expect(response.status, path).toBe(status);
    }
  });

  it('returns the normal 404 without redirects for all retired dashboard HTML routes', async () => {
    const environment = env();
    for (const path of ['/dashboard', '/dashboard/uptime', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), environment);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }
  });

  it('publishes only the canonical operations page in the sitemap', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/sitemap.xml'), env());
    expect(response.status).toBe(200);
    const sitemap = await response.text();
    expect(sitemap).toContain('<loc>https://demo.wizardgang.ai/operations</loc>');
    expect(sitemap).not.toContain('/dashboard');
  });

  it('rejects unknown operations views instead of creating aliases', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/operations?view=not-a-view', { headers: { accept: 'text/html' } }), env());
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
  });
});
