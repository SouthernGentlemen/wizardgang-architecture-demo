import { describe, expect, it } from 'vitest';
import { indexedSurfaces } from '../src/demos/registry';
import { sitemapResponse } from '../src/api/sitemap';
import {
  applicationRouteRegistry,
  type ApplicationRouteDeclaration,
} from '../src/routing/application-routes';
import { operationalRouteRegistry } from '../src/routing/operational-routes';
import { matchRoute } from '../src/routing/registry';
import { readFileSync } from 'node:fs';

const applicationRoutes = applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[];

describe('architecture demo registry', () => {
  it('publishes the consolidated HTML routes in four architecture groups', () => {
    expect(indexedSurfaces).toHaveLength(5);
    expect([...new Set(indexedSurfaces.map((surface) => surface.group))]).toEqual([
      'Platform', 'Interfaces', 'Delivery & Governance', 'Operations',
    ]);
  });

  it('uses unique public routes', () => {
    expect(new Set(indexedSurfaces.map((surface) => surface.route)).size).toBe(indexedSurfaces.length);
  });

  it('uses one source module per architecture demo route', () => {
    const indexedRoutes = applicationRoutes.filter((route) => route.navigation?.index);
    expect(indexedRoutes).toHaveLength(indexedSurfaces.length);
    expect(new Set(indexedRoutes.map((route) => route.source.module)).size).toBe(indexedSurfaces.length);
  });

  it('keeps every architecture route absolute', () => {
    expect(indexedSurfaces.every((surface) => surface.route.startsWith('/'))).toBe(true);
  });

  it('publishes one canonical operations route and retires the dashboard route family', () => {
    const routes = new Set(indexedSurfaces.map((surface) => surface.route));
    expect([...routes].filter((route) => route === '/operations')).toEqual(['/operations']);
    expect([...routes].filter((route) => route.startsWith('/dashboard'))).toEqual([]);
  });

  it('places consolidated assurance and separate security in delivery and governance', () => {
    const assurance = indexedSurfaces.find((surface) => surface.route === '/assurance');
    expect(assurance).toMatchObject({ group: 'Delivery & Governance' });
    expect(applicationRoutes.find((route) => route.pattern === '/assurance')?.source.module).toBe('src/demos/assurance.ts');
    const security = indexedSurfaces.find((surface) => surface.route === '/security');
    expect(security).toMatchObject({ group: 'Delivery & Governance' });
    expect(applicationRoutes.find((route) => route.pattern === '/security')?.source.module).toBe('src/demos/security-page.ts');
    for (const retired of ['/git', '/governance', '/evidence', '/compliance', '/governance/concerns', '/governance/risks', '/governance/incidents']) {
      expect(indexedSurfaces.some((surface) => surface.route === retired), retired).toBe(false);
    }
    expect(indexedSurfaces.some((surface) => surface.route === '/dashboard/compliance')).toBe(false);
  });

  it('keeps registry metadata synchronized with the machine route manifest', () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{
      route: string;
      source: { module: string };
      status: string;
      navigation?: { group: string; label: string; index: boolean; sitemap: boolean };
    }>;
    for (const surface of indexedSurfaces) {
      const entry = manifest.find((candidate) => candidate.route === surface.route);
      const declaration = applicationRoutes.find((route) => route.pattern === surface.route);
      expect(entry, `missing manifest entry for ${surface.route}`).toBeDefined();
      expect(entry?.source.module).toBe(declaration?.source.module);
      expect(entry?.status).toBe('working');
      expect(entry?.navigation).toMatchObject({
        group: surface.group,
        label: surface.title,
        index: true,
        sitemap: true,
      });
    }
    expect(manifest.filter((entry) => entry.navigation?.index)).toHaveLength(indexedSurfaces.length);
  });
});

describe('intentional offline route policies', () => {
  it('keeps registered operational recovery surfaces reachable', () => {
    for (const route of [
      '/operations',
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
    expect(browserPolicy('/interfaces')).toBe('page');
    expect(browserPolicy('/platform')).toBe('page');
    expect(browserPolicy('/edge')).toBeUndefined();
    expect(applicationRoutes.some((route) => route.pattern === '/v1/things')).toBe(false);
  });
});

describe('public sitemap', () => {
  it('publishes every registered route over https', async () => {
    const xml = await sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml')).text();
    expect(xml).toContain('<loc>https://demo.wizardgang.ai/</loc>');
    for (const surface of indexedSurfaces) {
      expect(xml, surface.route).toContain(`<loc>https://demo.wizardgang.ai${surface.route}</loc>`);
    }
    expect((xml.match(/<loc>/g) ?? []).length).toBe(indexedSurfaces.length + 1);
  });
});
