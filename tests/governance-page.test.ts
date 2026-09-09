import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class GovernancePageStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-09T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-09T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new GovernancePageStatement(sql) },
  DEMO_SESSION_SECRET: 'test-governance-page-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

async function governancePage(path = '/assurance/governance') {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
    headers: { accept: 'text/html' },
  }), environment);
  return { response, html: await response.text() };
}

describe('governance page presentation', () => {
  it('leads with executable governance checks and renders the reporting inventory once', async () => {
    const { response, html } = await governancePage();

    expect(response.status).toBe(200);
    expect(html.match(/id="governance-records"/g)).toHaveLength(1);
    expect(html.match(/id="governance-demonstrations-heading"/g)).toHaveLength(1);
    expect(html.indexOf('Governance demonstrations')).toBeLessThan(html.indexOf('Governance records'));
    expect(html).toContain('data-governance-run="0"');
    expect(html).not.toContain('data-run-demo="0"');
    expect(html).not.toContain('Shared reporting presenter');
    expect(html).not.toContain('records on this page');
    expect(html).toContain('name="dataset"');
    expect(html).toContain('value="governance.records.access-classes"');
    expect(html).toContain('Asset Inventory');
    expect(html).toContain('AST-001');
  });

  it('filters to one canonical register and preserves the selection through pagination', async () => {
    const { response, html } = await governancePage('/assurance/governance?dataset=governance.records.access-classes&limit=1');

    expect(response.status).toBe(200);
    expect(html).toContain('option value="governance.records.access-classes" selected');
    expect(html).toContain('ACC-001');
    expect(html).toContain('Public source/site read');
    expect(html).not.toContain('AST-001');
    expect(html).toContain('Showing 1 of');
    expect(html).toMatch(/href="\/assurance\/governance\?dataset=governance\.records\.access-classes&amp;limit=1&amp;cursor=[^"]+">Next page/);
  });

  it('ignores an unknown register instead of creating a second filtering contract', async () => {
    const { response, html } = await governancePage('/assurance/governance?dataset=unknown&limit=1');

    expect(response.status).toBe(200);
    expect(html).toContain('<option value="" selected>All registers');
    expect(html).toContain('AST-001');
    expect(html).not.toContain('value="unknown" selected');
  });
});
