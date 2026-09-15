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

async function renderAssurance(): Promise<string> {
  const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance', {
    headers: { accept: 'text/html' },
  }), environment);
  expect(response.status).toBe(200);
  return response.text();
}

describe('minimal assurance accessibility contract', () => {
  it('provides four labelled check sections and one page heading', async () => {
    const html = await renderAssurance();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const section of ['security-controls', 'ai-boundary', 'traceability', 'accessibility-posture']) {
      expect(html).toContain(`id="${section}" aria-labelledby="${section}-heading"`);
      expect(html).toContain(`id="${section}-heading"`);
    }
  });

  it('labels the compact assurance navigation without exposing a view selector or record search', async () => {
    const html = await renderAssurance();
    expect(html).toContain('<nav class="link-row" aria-label="Assurance checks">');
    for (const target of ['security-controls', 'ai-boundary', 'traceability', 'accessibility-posture']) {
      expect(html).toContain(`href="#${target}"`);
    }
    expect(html).not.toContain('name="view"');
    expect(html).not.toContain('name="q"');
  });

  it('keeps focused evidence in native disclosures and live action output announced politely', async () => {
    const html = await renderAssurance();
    expect((html.match(/<summary>/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect((html.match(/type="button" data-assurance-run/g) ?? [])).toHaveLength(3);
    expect((html.match(/aria-live="polite"/g) ?? [])).toHaveLength(3);
    expect(html).toContain('href="#accessibility-evidence"');
  });

  it('does not emit duplicate element ids in the server-rendered assurance page', async () => {
    const html = await renderAssurance();
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
