import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class ComplianceStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new ComplianceStatement(sql) },
  DEMO_SESSION_SECRET: 'test-compliance-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

const complianceRoute = routeUrl('assurance.compliance');

describe('DEMO-229 compliance presentation', () => {
  it('keeps the default route instructional instead of dumping every record', async () => {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai${complianceRoute}`, {
      headers: { accept: 'text/html' },
    }), environment);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Compliance posture you can actually inspect.');
    expect(html).toContain('Choose a framework to inspect');
    expect(html).toContain('Needs attention');
    expect(html).not.toContain('<table');
    expect(html).not.toContain('Compliance records');
    expect(html).not.toContain('Shared reporting presenter');
    expect(html).not.toContain('records on this page');
  });

  it('drills from a framework into canonical sections and exact evidence', async () => {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai${complianceRoute}?framework=iso-27001&section=Clauses%204%E2%80%9310`, {
      headers: { accept: 'text/html' },
    }), environment);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Framework review');
    expect(html).toContain('Clauses 4–10');
    expect(html).toContain('ISO27001-4.1');
    expect(html).toContain('href="/assurance/evidence#EVD-DOC-003"');
    expect(html).toContain('Exact JSON record');
  });

  it('supports focused search inside a selected framework', async () => {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai${complianceRoute}?framework=iso-27001&q=operating%20environment`, {
      headers: { accept: 'text/html' },
    }), environment);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Search results');
    expect(html).toContain('ISO27001-4.1');
    expect(html).not.toContain('ISO27001-4.2');
  });

  it('keeps relationship links resolvable under progressive disclosure', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance/evidence', {
      headers: { accept: 'text/html' },
    }), environment);
    const html = await response.text();

    expect(html).toContain(`${complianceRoute}?framework=iso-27001&amp;section=Annex+A+%C2%B7+organizational#ISO27001-A.5.15`);
  });

  it('lets the dedicated compliance presenter own the HTML route', () => {
    const capability = readFileSync('src/assurance/route-capabilities/compliance.ts', 'utf8');
    expect(capability).toContain('complianceContent');
    expect(capability).not.toContain('renderSharedReporting');
  });
});
