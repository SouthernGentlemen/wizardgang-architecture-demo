import { describe, expect, it } from 'vitest';
import { sitemapResponse } from '../src/api/sitemap';
import {
  applicationRouteRegistry,
  routeUrl,
  type ApplicationRouteDeclaration,
} from '../src/routing/application-routes';
import {
  architectureMapEntries,
  primaryNavigation,
  secondaryNavigation,
  sitemapPaths,
} from '../src/routing/navigation';
import { operationalRouteRegistry } from '../src/routing/operational-routes';
import { matchRoute } from '../src/routing/registry';
import { readFileSync } from 'node:fs';
import { retiredApiReferencePrefixes } from './fixtures/removed-api-pathnames';

const applicationRoutes = applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[];

describe('architecture demo registry', () => {
  it('derives primary navigation and architecture cards from page declarations', () => {
    const primary = primaryNavigation();
    expect(primary.map((route) => route.page?.label)).toEqual([
      'Architecture', 'Demos', 'Assurance', 'Operations', 'Security',
    ]);
    expect(primary.every((route) => route.page?.navigation === 'primary')).toBe(true);
    const expected = applicationRoutes
      .filter((route) => (
        route.kind === 'page'
        && route.page?.parent
        && route.visibility === 'public'
        && route.methods.includes('GET')
        && !route.pattern.includes(':')
      ))
      .map((route) => route.id)
      .sort();
    expect(architectureMapEntries().map((route) => route.id).sort()).toEqual(expected);
  });

  it('derives the five operations child links from route declarations', () => {
    expect(secondaryNavigation('operations.index').map((route) => [route.id, route.pattern, route.page?.label])).toEqual([
      ['operations.availability', routeUrl('operations.availability'), 'Availability'],
      ['operations.logs', routeUrl('operations.logs'), 'Logs'],
      ['operations.usage', routeUrl('operations.usage'), 'Usage & cost'],
      ['operations.reports', routeUrl('operations.reports'), 'Reports'],
      ['operations.docs', routeUrl('operations.docs'), 'Documentation'],
    ]);
  });

  it('uses unique public architecture routes', () => {
    const entries = architectureMapEntries();
    expect(new Set(entries.map((route) => route.pattern)).size).toBe(entries.length);
  });

  it('keeps an implementation source on every architecture demo route', () => {
    const entries = architectureMapEntries();
    expect(entries.every((route) => Boolean(route.source.module.trim()))).toBe(true);
  });

  it('keeps every architecture route absolute', () => {
    expect(architectureMapEntries().every((route) => route.pattern.startsWith('/'))).toBe(true);
  });

  it('publishes canonical operations paths and retires the dashboard route family', () => {
    const operations = [
      applicationRoutes.find((route) => route.id === 'operations.index'),
      ...secondaryNavigation('operations.index'),
    ].filter((route): route is ApplicationRouteDeclaration => Boolean(route));
    expect(operations.map((route) => route.pattern)).toEqual([
      'operations.index',
      'operations.availability',
      'operations.logs',
      'operations.usage',
      'operations.reports',
      'operations.docs',
    ].map((routeId) => routeUrl(routeId)));
    expect(applicationRoutes.some((route) => route.id === 'operations.page')).toBe(false);
    expect(applicationRoutes.some((route) => route.pattern.startsWith('/dashboard'))).toBe(false);
  });

  it('keeps consolidated assurance and separate security as registered architecture entries', () => {
    const assurance = architectureMapEntries().find((route) => route.pattern === routeUrl('assurance.index'));
    expect(assurance?.page).toMatchObject({ label: 'Assurance', architectureMap: true });
    expect(assurance?.source.module).toBe('src/demos/assurance.ts');
    const security = architectureMapEntries().find((route) => route.pattern === routeUrl('security.index'));
    expect(security?.page).toMatchObject({ label: 'Security', architectureMap: true });
    expect(security?.source.module).toBe('src/demos/security-page.ts');
    for (const retired of ['/git', '/governance', '/evidence', '/compliance', '/governance/concerns', '/governance/risks', '/governance/incidents']) {
      expect(architectureMapEntries().some((route) => route.pattern === retired), retired).toBe(false);
    }
    expect(architectureMapEntries().some((route) => route.pattern === '/dashboard/compliance')).toBe(false);
  });

  it('keeps derived page metadata synchronized with the machine route manifest', () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{
      id: string;
      route: string;
      source: { module: string };
      status: string;
      navigation?: {
        parent?: string;
        label: string;
        order: number;
        navigation: 'primary' | 'secondary';
        architectureMap: boolean;
        sitemap: boolean;
      };
    }>;
    for (const route of applicationRoutes.filter((candidate) => candidate.page && candidate.page.navigation !== 'none')) {
      const entry = manifest.find((candidate) => candidate.id === route.id);
      expect(entry, `missing manifest entry for ${route.id}`).toBeDefined();
      expect(entry?.source.module).toBe(route.source.module);
      expect(entry?.status).toBe('working');
      expect(entry?.navigation).toMatchObject({
        label: route.page?.label,
        order: route.page?.order,
        navigation: route.page?.navigation,
        architectureMap: route.page?.architectureMap,
        sitemap: sitemapPaths().includes(route.pattern),
      });
      expect(entry?.navigation?.parent).toBe(route.page?.parent);
    }
    const architectureIds = new Set(architectureMapEntries().map((route) => route.id));
    expect(manifest.filter((entry) => architectureIds.has(entry.id))).toHaveLength(architectureIds.size);
  });
});

describe('intentional offline route policies', () => {
  it('keeps registered operational recovery surfaces reachable', () => {
    for (const route of [
      ...['operations.index', 'operations.availability', 'operations.logs', 'operations.usage', 'operations.reports', 'operations.docs'].map((routeId) => routeUrl(routeId)),
      '/api/operations/health', '/api/operations/version', '/api/operations/logs',
      '/api/operations/budget', '/offline', '/admin', '/robots.txt', '/.well-known/security.txt', '/assets/:asset',
    ]) {
      const declaration = operationalRouteRegistry.declarations.find((candidate) => candidate.pattern === route);
      expect(declaration, route).toBeDefined();
      expect(declaration?.offline.mode, route).toBe('available');
    }
  });

  it('keeps sitemap gated and ordinary demo routes outside the operational registry', () => {
    const sitemap = operationalRouteRegistry.declarations.find((candidate) => candidate.pattern === '/sitemap.xml');
    expect(sitemap?.offline.mode).toBe('gated');

    for (const route of ['/edge', '/d1', '/api', '/graphql', '/webhooks', '/identity', '/mcp', '/evidence', '/governance/risks', '/governance/incidents']) {
      expect(matchRoute(operationalRouteRegistry, 'GET', route), route).toEqual({ status: 'not-found', statusCode: 404 });
    }
  });

  it('declares browser response behavior without API-prefix or HTML-path inference', () => {
    const browserPolicy = (pattern: string) => applicationRoutes.find((route) => route.pattern === pattern)?.browserHtml;
    for (const pattern of [
      '/api/labs/edge',
      '/api/reporting',
      '/api/reporting/:collection',
      '/api/reporting/:collection/:recordId',
      '/api/operations/logs',
      '/mcp',
    ]) expect(browserPolicy(pattern), pattern).toBe('never');
    expect(browserPolicy('/graphql')).toBe('never');
    expect(browserPolicy('/mcp/server')).toBeUndefined();
    expect(browserPolicy(routeUrl('demos.index'))).toBe('page');
    expect(browserPolicy(routeUrl('demos.index'))).toBe('page');
    expect(browserPolicy(routeUrl('operations.reports'))).toBe('page');
    expect(browserPolicy('/edge')).toBeUndefined();
    expect(applicationRoutes.some((route) => route.pattern === `${retiredApiReferencePrefixes[0]}/things`)).toBe(false);
  });
});

describe('public sitemap', () => {
  it('publishes every derived sitemap path over https', async () => {
    const xml = await sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml')).text();
    for (const path of sitemapPaths()) {
      expect(xml, path).toContain(`<loc>https://demo.wizardgang.ai${path}</loc>`);
    }
    expect((xml.match(/<loc>/g) ?? []).length).toBe(sitemapPaths().length);
  });
});
