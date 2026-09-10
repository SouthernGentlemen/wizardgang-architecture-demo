import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { Env } from '../src/types';
import { removedHtmlPathnames } from './fixtures/removed-html-pathnames';

function environment(offline = false): Env {
  return {
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main',
    DEMO_DB: { prepare(sql: string) { return {
      bind() { return this; }, async run() { return { meta: { last_row_id: 1 } }; },
      async all<T>() {
        if (sql.includes('FROM demo_control')) return { results: [{ state: offline ? 'offline' : 'online', public_message: 'Acceptance fixture', updated_at: '2026-09-08T00:00:00Z', updated_by: 'test' }] as T[] };
        if (sql.includes('FROM crawler_control')) return { results: [{ state: 'enabled', updated_at: '2026-09-08T00:00:00Z', updated_by: 'test' }] as T[] };
        if (sql.includes('COUNT(*) AS stored')) return { results: [{ stored: 0, verified: 0, legacy: 0, operational: 0, intentional: 0, unexpected: 0, first_checked_at: null, last_checked_at: null, monitoring_started_at: null }] as T[] };
        return { results: [] as T[] };
      },
    }; } },
  } as Env;
}

async function operations(env: Env, query = '') {
  const response = await routeRequest(new Request(`https://demo.example${routeUrl('operations.index')}${query}`, { headers: { accept: 'text/html' } }), env);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  return response.text();
}

describe('Operations acceptance journey', () => {
  it.each([false, true])('keeps the single dashboard usable with empty observations and offline=%s', async (offline) => {
    const html = await operations(environment(offline));
    expect(html).toContain('aria-label="Operations sections"');
    for (const fragment of ['status', 'availability', 'activity', 'usage', 'deployment']) {
      expect(html).toContain(`href="#${fragment}"`);
      expect(html).toContain(`id="${fragment}"`);
    }
    expect(html).toContain('Awaiting the first verified scheduled observation.');
    expect(html).toContain('No logs have been recorded yet.');
    expect(html).toContain('Cost guardrail simulator');
    expect(html).toContain('Release evidence');
    expect(html).toContain(offline ? 'PLANNED MAINTENANCE' : 'OPERATIONAL');
    const retiredOperationsPaths = removedHtmlPathnames
      .filter((entry) => entry.outcome === '404' && entry.supersededBy === 'operations.index')
      .map((entry) => entry.pathname);
    for (const path of retiredOperationsPaths) {
      expect(html).not.toContain(`href="${path}"`);
      expect(html).not.toContain(`action="${path}"`);
    }
  });

  it('keeps availability and activity filters on /operations without changing the canonical destination', async () => {
    const html = await operations(environment(), '?window=30d&level=error&source=worker&requestId=req-1&limit=25');
    expect(html).toContain('href="/operations?window=30d#availability"');
    expect(html).toContain('value="error"');
    expect(html).toContain('value="worker"');
    expect(html).toContain('value="req-1"');
    expect(html).toContain('value="25"');
    expect(html).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/operations">');
  });
});
