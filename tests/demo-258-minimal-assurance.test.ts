import { describe, expect, it } from 'vitest';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class Statement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-16T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}
const env = { DEMO_DB: { prepare: (sql: string) => new Statement(sql) }, GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main', DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567' } as Env;
async function page(path = routeUrl('assurance.index')) { const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), env); return { response, html: await response.text() }; }

describe('DEMO-258 assurance consolidation boundary', () => {
  it('keeps assurance on one public task page while allowing record fragments', async () => {
    const { response, html } = await page();
    expect(response.status).toBe(200);
    expect(html).toContain('data-assurance-workbench');
    expect(html).toContain('href="#ISO27001-A.5.1"');
    const pages = applicationRouteRegistry.declarations.filter((route) => route.kind === 'page' && route.id.startsWith('assurance.'));
    expect(pages.map((route) => route.id)).toEqual(['assurance.index']);
  });
  it('keeps management-system inventories out of ordinary assurance HTML', async () => {
    const { html } = await page();
    for (const forbidden of ['Browse risk records','Browse incident and exercise records','Browse governance records','Report a non-sensitive concern','data-assurance-collection="risks"','data-assurance-collection="activity"','data-assurance-collection="governance"','All frameworks']) expect(html).not.toContain(forbidden);
  });
  it('keeps canonical reporting machinery and focused evidence available', async () => {
    const { html } = await page();
    expect(html).toContain('data-assurance-inspector-mode="evidence"');
    expect(listPublishedAssuranceRecords('risks').length).toBeGreaterThan(0);
    expect(listPublishedAssuranceRecords('evidence').length).toBeGreaterThan(0);
    expect(applicationRouteRegistry.declarations.some((route) => route.id === 'reporting.collection')).toBe(true);
    expect(applicationRouteRegistry.declarations.some((route) => route.id === 'reporting.record')).toBe(true);
  });
  it('preserves the security boundary and rejects legacy assurance view selection', async () => {
    const { html } = await page();
    expect(html).toContain(`href="${routeUrl('security.index')}"`);
    const legacy = await page(`${routeUrl('assurance.index')}?view=risks`);
    expect(legacy.response.status).toBe(404);
    expect(legacy.response.headers.get('location')).toBeNull();
  });
});
