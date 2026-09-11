import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';
import { retiredDemoBrowserRoots } from './fixtures/removed-html-pathnames';

const fragments = [
  'edge', 'workers', 'durable-objects', 'd1', 'r2', 'rest',
  'graphql', 'webhooks', 'identity', 'mcp', 'accessibility', 'i18n',
] as const;

class DemoStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-10T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: 'enabled', updated_at: '2026-09-10T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

const env = {
  DEMO_DB: { prepare: (sql: string) => new DemoStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('consolidated architecture demos', () => {
  it('registers one primary demos page beneath the homepage', () => {
    const route = applicationRouteRegistry.declarations.find((candidate) => candidate.id === 'demos.index');
    expect(route?.pattern).toBe(routeUrl('demos.index'));
    expect(route?.kind).toBe('page');
    expect((route as typeof route & { page?: { parent?: string; navigation?: string } })?.page).toMatchObject({
      parent: 'interfaces.frontend.index',
      navigation: 'primary',
    });
  });

  it('retires every registered Platform and Interfaces browser page while preserving machine routes', () => {
    const declarations = applicationRouteRegistry.declarations;
    const retiredPages = declarations.filter((route) => route.kind === 'page' && retiredDemoBrowserRoots.some((root) => route.pattern === root || route.pattern.startsWith(`${root}/`)));
    expect(retiredPages).toEqual([]);
    expect(declarations.some((route) => route.pattern === '/graphql' && route.kind === 'protocol')).toBe(true);
    expect(declarations.some((route) => route.pattern === '/mcp' && route.kind === 'protocol')).toBe(true);
    expect(declarations.some((route) => route.pattern === '/api/openapi.json' && route.kind === 'api')).toBe(true);
    expect(declarations.some((route) => route.pattern === '/webhooks/github' && route.kind === 'protocol')).toBe(true);
  });

  it('publishes the stable fragment disclosures and hash-only reveal enhancement', () => {
    const source = readFileSync('src/demos/demos-page.ts', 'utf8');
    for (const fragment of fragments) expect(source).toContain(`id: '${fragment}'`);
    expect(source).toContain('name="architecture-demo"');
    expect(source).toContain("window.addEventListener('hashchange', revealHashDemo)");
    expect(source).toContain('target.open = true');
    expect(source).toContain('summary.focus({ preventScroll: true })');
    expect(source).not.toContain('history.pushState');
    expect(source).not.toContain('history.replaceState');
  });

  it('keeps presentations out of the initial document and exposes one registered lazy fragment at a time', async () => {
    const page = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), env);
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).not.toContain('/api/labs/edge');
    expect(html).not.toContain('/auth/session');
    expect(html).toContain('data-demo-panel');
    expect(html).toContain("section.dispatchEvent(new CustomEvent('demo:deactivate'))");

    const edge = await routeRequest(new Request('https://demo.wizardgang.ai/api/demos/edge', { headers: { accept: 'text/html' } }), env);
    expect(edge.status).toBe(200);
    expect(edge.headers.get('content-type')).toContain('text/html');
    expect(await edge.text()).toContain('/api/labs/edge');

    const missing = await routeRequest(new Request('https://demo.wizardgang.ai/api/demos/not-a-demo', { headers: { accept: 'text/html' } }), env);
    expect(missing.status).toBe(404);
  });
});
