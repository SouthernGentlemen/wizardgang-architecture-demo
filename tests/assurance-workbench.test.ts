import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class Statement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-16T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: 'disabled', updated_at: '2026-09-16T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

const deployedSha = '0123456789abcdef0123456789abcdef01234567';
const env = {
  DEMO_DB: { prepare: (sql: string) => new Statement(sql) },
  DEMO_SESSION_SECRET: 'test-assurance-workbench-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: deployedSha,
  DEPLOYED_VERSION: 'v0.23.0-test',
} as Env;

async function page(path = routeUrl('assurance.index')) {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), env);
  return { response, html: await response.text() };
}

describe('DEMO-286 assurance workbench', () => {
  it('renders the three-framework workbench and defaults to ISO/IEC 27001 A.5.1', async () => {
    const { response, html } = await page();
    expect(response.status).toBe(200);
    expect((html.match(/data-assurance-framework=/g) ?? [])).toHaveLength(3);
    expect((html.match(/class="assurance-framework-tab"[^>]+aria-selected="true"/g) ?? [])).toHaveLength(1);
    expect(html).toContain('ISO/IEC 27001');
    expect(html).toContain('ISO/IEC 42001');
    expect(html).toContain('WCAG 2.2');
    expect(html).not.toContain('All frameworks');
    expect(html).toContain('data-assurance-section');
    expect(html).toContain('data-assurance-record="ISO27001-A.5.1"');
    expect(html).toContain('A.5.1');
  });

  it('shows section and framework posture with text-backed status semantics', async () => {
    const { html } = await page();
    expect(html).toContain('data-assurance-section-posture');
    expect(html).toContain('data-assurance-framework-posture');
    for (const status of ['pass', 'partial', 'gap', 'not-applicable']) {
      expect(html).toContain(`data-posture-count="${status}"`);
      expect(html).toContain(`data-status="${status}"`);
    }
    for (const label of ['Pass', 'Partial', 'Gap', 'N/A']) expect(html).toContain(label);
  });

  it('renders the focused assessment pane and inspector without management inventories', async () => {
    const { html } = await page();
    for (const label of ['Assessment', 'What is missing', 'Assessed', 'Documentation', 'Evidence']) expect(html).toContain(label);
    expect(html).toContain('data-assurance-inspector-mode="documentation"');
    expect(html).toContain('data-assurance-inspector-mode="evidence"');
    expect(html).toContain('Open requirement source');
    expect(html).toContain('Open assessment record');
    expect(html).toContain(`blob/${deployedSha}/`);
    for (const forbidden of ['All frameworks', 'Browse risk records', 'Browse incident and exercise records', 'Browse governance records']) expect(html).not.toContain(forbidden);
  });

  it('exposes two deployed-commit applicability links for the non-script fallback', async () => {
    const { html } = await page();
    expect(html).toContain('<noscript>');
    expect(html).toContain('ISO/IEC 27001 statement of applicability');
    expect(html).toContain('ISO/IEC 42001 statement of applicability');
    expect(html).toContain(`blob/${deployedSha}/assurance/compliance/iso-27001-2022.json`);
    expect(html).toContain(`blob/${deployedSha}/assurance/compliance/iso-42001-2023.json`);
  });

  it('serves a focused presentation fragment, pins repository locations, and 404s unknown IDs', async () => {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai/api/assurance/ISO27001-A.5.1?rev=${deployedSha}&lang=fr`, { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('content-language')).toBe('fr');
    expect(html).toContain('data-assurance-record="ISO27001-A.5.1"');
    expect(html).toContain('lang="en"');
    expect(html).toContain(`blob/${deployedSha}/`);
    expect(html).toContain('data-assurance-inspector-panel="documentation"');
    expect(html).toContain('data-assurance-inspector-panel="evidence"');
    const unknown = await routeRequest(new Request(`https://demo.wizardgang.ai/api/assurance/NOT-A-RECORD?rev=${deployedSha}`), env);
    expect(unknown.status).toBe(404);
  });

  it('registers one page destination plus the presentation API and preserves retired view-selector 404', async () => {
    const assuranceRoutes = applicationRouteRegistry.declarations.filter((route) => route.id.startsWith('assurance.'));
    expect(assuranceRoutes.filter((route) => route.kind === 'page').map((route) => route.id)).toContain('assurance.index');
    expect(assuranceRoutes.some((route) => route.id === 'assurance.presentation' && route.pattern === '/api/assurance/:record' && route.kind === 'api')).toBe(true);
    const legacy = await page(`${routeUrl('assurance.index')}?view=risks`);
    expect(legacy.response.status).toBe(404);
    expect(legacy.response.headers.get('location')).toBeNull();
  });
});
