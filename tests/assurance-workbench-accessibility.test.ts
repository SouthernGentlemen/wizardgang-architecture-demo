import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class AssuranceAccessibilityStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-10T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-10T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new AssuranceAccessibilityStatement(sql) },
  DEMO_SESSION_SECRET: 'test-assurance-a11y-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

async function renderWorkbench(): Promise<string> {
  const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance', {
    headers: { accept: 'text/html' },
  }), environment);
  expect(response.status).toBe(200);
  return response.text();
}

describe('assurance workbench accessibility contract', () => {
  it('provides labelled section landmarks and one page heading', async () => {
    const html = await renderWorkbench();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const section of ['posture', 'frameworks', 'risks', 'evidence', 'governance', 'activity']) {
      expect(html).toContain(`<section id="${section}" aria-labelledby="${section}-heading"`);
      expect(html).toContain(`id="${section}-heading"`);
    }
  });

  it('labels section navigation and filter/search controls without a view selector', async () => {
    const html = await renderWorkbench();
    expect(html).toContain('<nav class="link-row" aria-label="Assurance workbench sections">');
    expect(html).toContain('<label for="assurance-framework">Framework</label>');
    expect(html).toContain('<label for="assurance-search">Search records</label>');
    expect(html).toContain('aria-labelledby="assurance-search-heading"');
    expect(html).not.toContain('name="view"');
  });

  it('keeps record collections in native disclosures and live action output announced politely', async () => {
    const html = await renderWorkbench();
    expect((html.match(/data-assurance-collection=/g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect((html.match(/<summary>/g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect(html).toContain('type="button" data-governance-run="0"');
    expect(html).toContain('type="button" data-governance-run="1"');
    expect(html).toContain('type="button" data-governance-run="2"');
    expect((html.match(/aria-live="polite"/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('does not emit duplicate element ids in the server-rendered workbench', async () => {
    const html = await renderWorkbench();
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
