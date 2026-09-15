import { describe, expect, it } from 'vitest';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';
import { removedHtml404Pathnames } from './fixtures/removed-html-pathnames';

class AssuranceWorkbenchStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new AssuranceWorkbenchStatement(sql) },
  DEMO_SESSION_SECRET: 'test-assurance-workbench-cursor-secret-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

async function assuranceHtml(path = routeUrl('assurance.index')): Promise<{ response: Response; html: string }> {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
    headers: { accept: 'text/html' },
  }), environment);
  return { response, html: await response.text() };
}

describe('minimal assurance presentation', () => {
  it('orders exactly four public checks by the MVP verification task', async () => {
    const { response, html } = await assuranceHtml();
    expect(response.status).toBe(200);

    const orderedIds = ['security-controls', 'ai-boundary', 'traceability', 'accessibility-posture'];
    const positions = orderedIds.map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect((html.match(/class="assurance-check"/g) ?? [])).toHaveLength(4);
  });

  it('keeps the three executable governance checks obvious and focused evidence collapsed', async () => {
    const { html } = await assuranceHtml();
    for (const endpoint of [
      '/api/labs/governance-security-controls',
      '/api/labs/governance-ai-evaluation',
      '/api/labs/governance-traceability',
    ]) expect(html).toContain(endpoint);
    expect((html.match(/<button[^>]*data-assurance-run/g) ?? [])).toHaveLength(3);
    expect((html.match(/<details class="implementation-notes"/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(html).not.toMatch(/<details class="implementation-notes"[^>]*\sopen(?:[=\s>])/);
  });

  it('does not project management-system inventories into ordinary HTML', async () => {
    const { html } = await assuranceHtml();
    for (const forbidden of [
      'Browse risk records',
      'Browse incident and exercise records',
      'Browse governance records',
      'Report a non-sensitive concern',
      'Delivery and release evidence',
      'data-assurance-collection="risks"',
      'data-assurance-collection="activity"',
      'data-assurance-collection="governance"',
    ]) expect(html).not.toContain(forbidden);
  });

  it('preserves canonical assurance data and reporting machine contracts behind the reduced page', () => {
    expect(listPublishedAssuranceRecords('compliance').length).toBeGreaterThan(0);
    expect(listPublishedAssuranceRecords('claims').length).toBeGreaterThan(0);
    expect(listPublishedAssuranceRecords('evidence').length).toBeGreaterThan(0);
    expect(listPublishedAssuranceRecords('risks').length).toBeGreaterThan(0);
    expect(listPublishedAssuranceRecords('exercises').length).toBeGreaterThan(0);

    const routes = new Map(applicationRouteRegistry.declarations.map((route) => [route.id, route]));
    expect(routes.get('reporting.index')?.pattern).toBe('/api/reporting');
    expect(routes.get('reporting.collection')?.pattern).toBe('/api/reporting/:collection');
    expect(routes.get('reporting.record')?.pattern).toBe('/api/reporting/:collection/:recordId');
  });

  it('retires assurance child routes after their behavior moves into the single assurance destination', async () => {
    const childPaths = removedHtml404Pathnames.filter((path) => path.startsWith(`${routeUrl('assurance.index')}/`));
    const { html } = await assuranceHtml();
    for (const path of childPaths) {
      expect(html).not.toContain(`href="${path}`);
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
        headers: { accept: 'text/html' },
      }), environment);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
    }
  });
});
