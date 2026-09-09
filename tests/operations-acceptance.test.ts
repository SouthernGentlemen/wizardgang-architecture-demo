import { describe, expect, it, vi } from 'vitest';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { Env } from '../src/types';

const pages = ['operations.index', 'operations.availability', 'operations.logs', 'operations.usage', 'operations.reports', 'operations.docs'];
function environment(offline = false): Env {
  return {
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main',
    DEMO_DB: { prepare(sql: string) { return {
      bind() { return this; }, async run() { return { meta: { last_row_id: 1 } }; },
      async all<T>() {
        const rows = sql.includes('FROM demo_control') ? [{ state: offline ? 'offline' : 'online', public_message: 'Acceptance fixture', updated_at: '2026-09-08T00:00:00Z', updated_by: 'test' }]
          : sql.includes('FROM crawler_control') ? [{ state: 'enabled', updated_at: '2026-09-08T00:00:00Z', updated_by: 'test' }] : [];
        return { results: rows as T[] };
      },
    }; } },
  } as Env;
}
async function page(routeId: string, env: Env, query: Record<string, string> = {}) {
  const response = await routeRequest(new Request(new URL(routeUrl(routeId, {}, query), 'https://demo.example'), { headers: { accept: 'text/html' } }), env);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  return response.text();
}

describe('Operations acceptance journey', () => {
  it.each([false, true])('keeps all six pages navigable with empty observations and offline=%s', async (offline) => {
    const env = environment(offline);
    for (const routeId of pages) {
      const html = await page(routeId, env);
      expect(html).toContain('aria-label="Operations sections"');
      for (const sibling of pages.slice(1)) expect(html).toContain(`href="${routeUrl(sibling)}"`);
      expect(html).toContain('>Route source</a>');
      if (routeId === 'operations.index') expect(html).toContain(offline ? 'PLANNED MAINTENANCE' : 'AWAITING DATA');
      if (routeId === 'operations.availability') expect(html).toContain('Awaiting the first verified scheduled observation.');
      if (routeId === 'operations.logs') expect(html).toContain('No logs have been recorded yet.');
      if (routeId === 'operations.usage') expect(html).toContain('it does not establish an application outage');
    }
  });

  it('follows a real signed reporting cursor without losing the selected family or evidence source', async () => {
    const env = environment();
    const first = await page('operations.reports', env, { report: 'evidence', limit: '10' });
    const nextHref = /href="([^"]+)">Next page/.exec(first)?.[1]?.replaceAll('&amp;', '&');
    expect(nextHref).toBeTruthy();
    const next = new URL(nextHref!, 'https://demo.example');
    expect(next.pathname).toBe(routeUrl('operations.reports'));
    expect(next.searchParams.get('report')).toBe('evidence');
    expect(next.searchParams.get('limit')).toBe('10');
    expect(next.searchParams.get('cursor')).toBeTruthy();
    const response = await routeRequest(new Request(next), env);
    expect(response.status).toBe(200);
    const second = await response.text();
    expect(second).toContain('id="reporting-explorer" open');
    const records = (html: string) => [...html.matchAll(/<article class="activity-item"><div><h3>(.*?)<\/h3>/g)].map((match) => match[1]);
    expect(records(first)).toHaveLength(10);
    expect(records(second)).toHaveLength(10);
    expect(records(second).some((title) => records(first).includes(title))).toBe(false);
    expect(second).toContain('https://github.com/SouthernGentlemen/wizardgang-architecture-demo/blob/main/assurance/evidence/evidence.json');
  });

  it('reveals reporting fragment targets initially and on hash changes, including nested disclosure', async () => {
    const html = await page('operations.reports', environment());
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]).find((value) => value.includes('revealTarget'))!;
    const scrollIntoView = vi.fn();
    const explorer = { open: false, contains: (node: unknown) => node === target };
    const parent = { tagName: 'DETAILS', open: false, parentElement: explorer };
    const target = { parentElement: parent, scrollIntoView };
    const location = { hash: '#reporting-browser' };
    let hashchange = () => {};
    const document = { getElementById: (id: string) => id === 'reporting-explorer' ? explorer : id === 'reporting-browser' ? target : null };
    new Function('document', 'window', 'location', script)(document, { addEventListener: (name: string, callback: () => void) => { expect(name).toBe('hashchange'); hashchange = callback; } }, location);
    expect(explorer.open).toBe(true);
    expect(parent.open).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledOnce();
    explorer.open = false; location.hash = '#%E0%A4%A';
    expect(hashchange).not.toThrow();
    expect(explorer.open).toBe(false);
    location.hash = '#reporting-browser'; hashchange();
    expect(explorer.open).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
