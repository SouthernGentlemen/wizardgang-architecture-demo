import { describe, expect, it } from 'vitest';
import { routeUrl } from '../src/routing/application-routes';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class EvidencePageStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new EvidencePageStatement(sql) },
  DEMO_SESSION_SECRET: 'test-evidence-page-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
};

const EVIDENCE_ROUTE = routeUrl('assurance.evidence');
const ACCESSIBILITY_ROUTE = routeUrl('interfaces.accessibility');
const LEGACY_ACCESSIBILITY_VIEW = `${routeUrl('interfaces.index')}?view=accessibility`;

async function evidencePage(path = EVIDENCE_ROUTE) {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
    headers: { accept: 'text/html' },
  }), environment);
  return { response, html: await response.text() };
}

describe('evidence page presentation', () => {
  it('renders one human evidence catalog without the generic reporting projection', async () => {
    const { response, html } = await evidencePage();

    expect(response.status).toBe(200);
    expect(html.match(/id="traceability"/g)).toHaveLength(1);
    expect(html.match(/data-evidence-record/g)?.length ?? 0).toBeGreaterThan(10);
    expect(html).toContain('Evidence you can inspect.');
    expect(html).toContain('Traceability and status');
    expect(html).not.toContain('Evidence reporting');
    expect(html).not.toContain('Shared reporting presenter');
    expect(html).not.toContain('Projection rule:');
  });

  it('provides focused evidence filters and keeps freshness guidance secondary', async () => {
    const { html } = await evidencePage();

    expect(html).toContain('data-evidence-kind');
    expect(html).toContain('data-evidence-framework');
    expect(html).toContain('data-evidence-freshness');
    expect(html).toContain('data-evidence-reset');
    expect(html).toContain('How evidence freshness works');
    expect(html.indexOf('Evidence registry')).toBeLessThan(html.indexOf('How evidence freshness works'));
    expect(html).toContain('ISO 27001');
    expect(html).toContain('ISO 42001');
    expect(html).toContain('WCAG 2.2');
  });

  it('uses canonical evidence routes and links to the actual route source', async () => {
    const { html } = await evidencePage();

    expect(html).toContain(ACCESSIBILITY_ROUTE);
    expect(html).not.toContain(LEGACY_ACCESSIBILITY_VIEW);
    expect(html).toContain('src/demos/evidence-page.ts');
    expect(html).not.toContain('src/demos/evidence.ts');
  });
});
