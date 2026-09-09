import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class RiskPageStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new RiskPageStatement(sql) },
  DEMO_SESSION_SECRET: 'test-risk-page-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

async function riskPage(query = '') {
  return routeRequest(new Request(`https://demo.wizardgang.ai/assurance/risks${query}`, {
    headers: { accept: 'text/html' },
  }), environment);
}

describe('risk assurance presentation', () => {
  it('renders posture, priority risks, and one focused risk register', async () => {
    const response = await riskPage();
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Risk posture you can inspect.');
    expect(html).toContain('Current risk posture');
    expect(html).toContain('Priority residual risks');
    expect(html).toContain('How to read the register');
    expect(html).toContain('Complete risk register');
    expect(html).toContain('30 public risks');
    expect(html).toContain('15 security · 15 AI');
    expect(html).not.toContain('Shared reporting projection');
    expect(html).not.toContain('id="assurance-reporting"');
  });

  it('keeps every canonical risk filter server-rendered and functional', async () => {
    const cases = [
      ['?framework=security', 'option value="security" selected'],
      ['?status=treating', 'option value="treating" selected'],
      ['?residual=high', 'option value="high" selected'],
      ['?framework=ai&status=open&residual=moderate', 'option value="ai" selected'],
    ] as const;

    for (const [query, selected] of cases) {
      const response = await riskPage(query);
      const html = await response.text();
      expect(response.status, query).toBe(200);
      expect(html, query).toContain(selected);
      expect(html, query).toContain('action="/assurance/risks"');
      expect(html, query).toContain('View matching JSON');
      expect(html, query).not.toContain('Shared reporting projection');
    }
  });

  it('preserves stable record anchors while moving publication detail behind traceability', async () => {
    const response = await riskPage('?framework=security&residual=high');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('id="SEC-RISK-003"');
    expect(html).toContain('Critical 20 <span aria-hidden="true">→</span> High 15');
    expect(html).toContain('<summary>Traceability and publication</summary>');
    expect(html).toContain('EVD-CI-001');
    expect(html).toContain('Exact record JSON');
    expect(html).toContain('src/demos/risk-page.ts');
  });

  it('normalizes unsupported filter values instead of failing the page', async () => {
    const response = await riskPage('?framework=bogus&status=closed&residual=severe');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toMatch(/<strong>\d+<\/strong> matching of \d+ records/);
    expect(html).not.toContain('selected>Bogus');
    expect(html).not.toContain('Shared reporting projection');
  });
});
