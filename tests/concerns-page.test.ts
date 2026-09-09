import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class ConcernStatement implements D1PreparedStatement {
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

const env: Env = {
  DEMO_DB: { prepare: (sql: string) => new ConcernStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

const concernsUrl = (query = '') => `https://demo.wizardgang.ai${routeUrl('assurance.concerns')}${query}`;

describe('concern intake presentation', () => {
  it('renders only the purpose-built intake workflow', async () => {
    const response = await routeRequest(new Request(concernsUrl(), {
      headers: { accept: 'text/html' },
    }), env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Choose the right intake path.');
    expect(html).toContain('Public non-sensitive intake');
    expect(html).toContain('What happens next');
    expect(html).toContain('GitHub sign-in is required');
    for (const template of ['bug.yml', 'feature.yml', 'concern.yml']) {
      expect(html).toContain(encodeURIComponent(template));
    }
    expect(html).toContain('security/advisories/new');
    expect(html).toContain('src/demos/concerns-page.ts');
  });

  it('does not append governance or generic reporting to concerns', async () => {
    const response = await routeRequest(new Request(concernsUrl('?limit=50'), {
      headers: { accept: 'text/html' },
    }), env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).not.toContain('Shared reporting projection');
    expect(html).not.toContain('Concerns reporting');
    expect(html).not.toContain('id="assurance-reporting"');
    expect(html).not.toContain('Reporting source');
    expect(html).not.toContain('AST-001');
    expect(html).not.toContain('ACC-001');
    expect(html).not.toContain('cursor=');
  });

  it('explains the controlled-work lifecycle without exposing an invented concern dataset', async () => {
    const response = await routeRequest(new Request(concernsUrl(), {
      headers: { accept: 'text/html' },
    }), env);
    const html = await response.text();

    for (const stage of ['Submitted', 'Triaged', 'Controlled change', 'Validated', 'Released']) {
      expect(html).toContain(stage);
    }
    expect(html).not.toContain('api/reporting/governance');
    expect(html).not.toContain('api/reporting/concerns');
  });
});