import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';
import { removedHtml404Pathnames } from './fixtures/removed-html-pathnames';

class ConcernStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new ConcernStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

describe('public concern intake boundary', () => {
  it('keeps concern inventory out of assurance and points non-security feedback to repository issue forms', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance#concerns', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).not.toContain('data-assurance-workbench-section="concerns"');
    expect(html).not.toContain('issues/new?template=concern.yml');

    const security = await routeRequest(new Request('https://demo.wizardgang.ai/security#non-security-feedback', { headers: { accept: 'text/html' } }), env);
    const securityHtml = await security.text();
    expect(security.status).toBe(200);
    expect(securityHtml).toContain('id="non-security-feedback"');
    expect(securityHtml).toContain('issues/new/choose');
  });

  it('retires the concerns child route without an alias or redirect', async () => {
    const pathname = removedHtml404Pathnames.find((path) => path.endsWith('/concerns'))!;
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai${pathname}`, { headers: { accept: 'text/html' } }), env);
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
  });
});
