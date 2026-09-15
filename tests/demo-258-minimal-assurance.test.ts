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
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-14T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const env = {
  DEMO_DB: { prepare: (sql: string) => new Statement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

async function page(path = routeUrl('assurance.index')) {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), env);
  return { response, html: await response.text() };
}

describe('DEMO-258 minimal assurance', () => {
  it('exposes exactly the four MVP checks', async () => {
    const { response, html } = await page();
    expect(response.status).toBe(200);
    expect((html.match(/class="assurance-check"/g) ?? [])).toHaveLength(4);
    for (const id of ['security-controls', 'ai-boundary', 'traceability', 'accessibility-posture']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('removes internal assurance inventory from the ordinary default HTML', async () => {
    const { html } = await page();
    for (const forbidden of [
      'Browse risk records',
      'Browse incident and exercise records',
      'Browse governance records',
      'Report a non-sensitive concern',
      'data-assurance-collection="risks"',
      'data-assurance-collection="activity"',
      'data-assurance-collection="governance"',
      'data-assurance-collection="frameworks"',
    ]) expect(html).not.toContain(forbidden);
  });

  it('keeps focused evidence and the canonical reporting machinery available', async () => {
    const { html } = await page();
    expect(html).toContain('Inspect focused evidence');
    expect(html).toContain('Focused WCAG evidence');
    expect(listPublishedAssuranceRecords('risks').length).toBeGreaterThan(0);
    expect(listPublishedAssuranceRecords('evidence').length).toBeGreaterThan(0);
    expect(applicationRouteRegistry.declarations.some((route) => route.id === 'reporting.collection')).toBe(true);
    expect(applicationRouteRegistry.declarations.some((route) => route.id === 'reporting.record')).toBe(true);
  });

  it('preserves the security support boundary and rejects legacy assurance view selection', async () => {
    const { html } = await page();
    expect(html).toContain(`href="${routeUrl('security.index')}"`);
    const legacy = await page(`${routeUrl('assurance.index')}?view=risks`);
    expect(legacy.response.status).toBe(404);
    expect(legacy.response.headers.get('location')).toBeNull();
  });
});
