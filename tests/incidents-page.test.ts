import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';
import { removedHtml404Pathnames } from './fixtures/removed-html-pathnames';

class IncidentStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-09T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: 'disabled', updated_at: '2026-09-09T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

const env: Env = {
  DEMO_DB: { prepare: (sql: string) => new IncidentStatement(sql) },
  DEMO_SESSION_SECRET: 'test-incidents-page-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

describe('assurance activity boundary', () => {
  it('keeps incident and exercise inventories out of the assurance workbench', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance#ISO27001-A.5.1', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('data-assurance-workbench');
    expect(html).toContain('data-assurance-record="ISO27001-A.5.1"');
    expect(html).not.toContain('data-assurance-workbench-section="activity"');
    expect(html).not.toContain('Browse incident and exercise records');
    expect(html).not.toContain('/api/labs/governance-traceability');

    for (const collection of ['incidents', 'exercises']) {
      const reporting = await routeRequest(new Request(`https://demo.wizardgang.ai/api/reporting/${collection}`, { headers: { accept: 'application/json' } }), env);
      expect(reporting.status, collection).toBe(200);
    }
  });

  it('retires the incidents child route without an alias or redirect', async () => {
    const pathname = removedHtml404Pathnames.find((path) => path.endsWith('/incidents'))!;
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai${pathname}`, { headers: { accept: 'text/html' } }), env);
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
  });
});
