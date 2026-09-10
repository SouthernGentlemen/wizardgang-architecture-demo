import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import { retiredDemoBrowserRoots } from './fixtures/removed-html-pathnames';

const fragments = [
  'edge', 'workers', 'durable-objects', 'd1', 'r2', 'rest',
  'graphql', 'webhooks', 'identity', 'mcp', 'accessibility', 'i18n',
] as const;

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
});
