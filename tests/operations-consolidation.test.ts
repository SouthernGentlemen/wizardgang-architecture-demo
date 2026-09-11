import { describe, expect, it } from 'vitest';
import { operationsContent } from '../src/demos/operations';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';
import { removedHtmlPathnames } from './fixtures/removed-html-pathnames';

class OperationsRouteStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: OperationsRouteD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: this.db.state, public_message: this.db.state === 'offline' ? 'Planned maintenance.' : 'Available.', updated_at: '2026-09-07T12:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: 'disabled', updated_at: '2026-09-07T12:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.trim() === 'SELECT 1') return { results: [{ 1: 1 }] as T[] };
    if (this.sql.includes('COUNT(*) AS stored')) return { results: [{ stored: 2, verified: 2, legacy: 0, operational: 1, intentional: 1, unexpected: 0, first_checked_at: '2026-09-07T10:00:00.000Z', last_checked_at: '2026-09-07T11:00:00.000Z', monitoring_started_at: '2026-09-07T10:00:00.000Z' }] as T[] };
    if (this.sql.includes('GROUP BY substr')) return { results: [{ day: '2026-09-07', total: 2, operational: 1, intentional: 1, unexpected: 0 }] as T[] };
    if (this.sql.includes('FROM service_health_checks')) return { results: [
      { status: 'operational', response_ms: 5, detail_json: '{"intentionalOffline":false,"observationSource":"scheduled"}', checked_at: '2026-09-07T11:00:00.000Z' },
      { status: 'down', response_ms: 5, detail_json: '{"intentionalOffline":true,"observationSource":"scheduled"}', checked_at: '2026-09-07T10:00:00.000Z' },
    ] as T[] };
    if (this.sql.includes('FROM usage_snapshots') || this.sql.includes('FROM application_logs') || this.sql.includes('cloudflare_usage')) return { results: [] as T[] };
    return { results: [] as T[] };
  }
}
class OperationsRouteD1 { constructor(public state: 'online' | 'offline' = 'online') {} prepare(sql: string) { return new OperationsRouteStatement(this, sql); } }
function env(state: 'online' | 'offline' = 'online'): Env { return { DEMO_DB: new OperationsRouteD1(state), GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main', DEMO_ADMIN_USER: 'operator', DEMO_ADMIN_PASSWORD: 'test-admin-password', BILLING_DEMO_MONTHLY_BUDGET_USD: '10' }; }
const basic = `Basic ${btoa('operator:test-admin-password')}`;
const retiredOperationsPaths = removedHtmlPathnames
  .filter((entry) => entry.outcome === '404' && entry.supersededBy === 'operations.index')
  .map((entry) => entry.pathname);

describe('consolidated operations route', () => {
  it('renders one canonical operations dashboard with the five task sections', async () => {
    const content = await operationsContent(new Request('https://demo.wizardgang.ai/operations'), env());
    expect(content.canonicalPath).toBe(routeUrl('operations.index'));
    for (const id of ['status', 'availability', 'activity', 'usage', 'deployment']) { expect(content.body).toContain(`id="${id}"`); expect(content.body).toContain(`href="#${id}"`); }
    expect(content.body).toContain('Inspect long availability history');
    expect(content.body).toContain('Open bounded log explorer');
    expect(content.body).toContain('Cost guardrail simulator');
    expect(content.body).toContain('Usage-based spend');
    expect(content.body).toContain('Release evidence');
    expect(content.body).toContain('docs/OPERATIONS.md');
    for (const path of retiredOperationsPaths) {
      expect(content.body).not.toContain(`href="${path}"`);
      expect(content.body).not.toContain(`action="${path}"`);
    }
  });

  it('keeps operational filters as query state while the canonical remains /operations', async () => {
    const content = await operationsContent(new Request('https://demo.wizardgang.ai/operations?window=24h&level=warn&source=rest&limit=25&requestId=req-1'), env());
    expect(content.canonicalPath).toBe(routeUrl('operations.index'));
    expect(content.body).toContain('24 hours of measured history');
    expect(content.body).toContain('Open bounded log explorer');
    expect(content.body).toContain('action="/operations#activity"');
    expect(content.body).toContain('href="/operations#activity"');
    expect(content.body).toContain('window=365d#availability');
    expect(content.body).toContain('value="warn"');
    expect(content.body).toContain('value="rest"');
    expect(content.body).toContain('value="req-1"');
    expect(content.body).toContain('value="25"');
    expect(content.body).not.toContain('name="view"');
  });

  it('retires every former operations child page as an ordinary 404', async () => {
    for (const path of retiredOperationsPaths) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), env());
      expect(response.status, path).toBe(404); expect(response.headers.get('location'), path).toBeNull();
    }
  });

  it('returns ordinary 404s for obsolete view-selected operations URLs', async () => {
    for (const view of ['overview', 'availability', 'logs', 'usage', 'reports', 'docs', 'not-a-view']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/operations?view=${view}`, { headers: { accept: 'text/html' } }), env());
      expect(response.status, view).toBe(404); expect(response.headers.get('location'), view).toBeNull();
    }
  });

  it('keeps the single operations dashboard and recovery interfaces reachable while intentionally offline', async () => {
    const environment = env('offline');
    const alwaysReachable: Array<[string, RequestInit | undefined, number]> = [
      [routeUrl('operations.index'), { headers: { accept: 'text/html' } }, 200], [routeUrl('security.index'), { headers: { accept: 'text/html' } }, 200],
      ['/api/operations/health', undefined, 503], ['/api/operations/version', undefined, 200], ['/api/operations/logs', undefined, 200],
      ['/admin', { headers: { authorization: basic, accept: 'text/html' } }, 200], ['/offline', { headers: { accept: 'text/html' } }, 503],
    ];
    for (const [path, init, status] of alwaysReachable) expect((await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, init), environment)).status, path).toBe(status);
  });

  it('keeps gated machine traffic on structured 503 responses while offline', async () => {
    const environment = env('offline');
    for (const request of [
      new Request('https://demo.wizardgang.ai/api/reporting/operations', { headers: { accept: 'application/json' } }),
      new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'application/json' } }),
      new Request('https://demo.wizardgang.ai/api/labs/workers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    ]) {
      const response = await routeRequest(request, environment); expect(response.status).toBe(503); expect(response.headers.get('content-type')).toContain('application/json');
    }
  });

  it('publishes only /operations as the indexed operations page', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/sitemap.xml'), env());
    expect(response.status).toBe(200); const sitemap = await response.text();
    expect(sitemap).toContain('<loc>https://demo.wizardgang.ai/operations</loc>');
    for (const path of retiredOperationsPaths) expect(sitemap).not.toContain(path);
    expect(sitemap).not.toContain('?view=');
  });
});
