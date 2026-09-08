import { describe, expect, it } from 'vitest';
import { sitemapResponse } from '../src/api/sitemap';
import {
  applicationRouteRegistry,
  type ApplicationRouteDeclaration,
} from '../src/routing/application-routes';
import {
  architectureMapEntries,
  primaryNavigation,
  sitemapPaths,
} from '../src/routing/navigation';
import { operationalRouteRegistry } from '../src/routing/operational-routes';
import { matchRoute } from '../src/routing/registry';
import { readFileSync } from 'node:fs';

const applicationRoutes = applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[];

describe('architecture demo registry', () => {
  it('derives primary navigation and architecture cards from page declarations', () => {
    const primary = primaryNavigation();
    expect(primary.map((route) => route.page?.label)).toEqual([
      'Architecture', 'Platform', 'Interfaces', 'Assurance', 'Operations', 'Security',
    ]);
    expect(primary.every((route) => route.page?.navigation === 'primary')).toBe(true);
    expect(architectureMapEntries().map((route) => route.pattern)).toEqual([
      '/platform', '/interfaces', '/assurance', '/operations', '/security',
    ]);
  });

  it('uses unique public architecture routes', () => {
    const entries = architectureMapEntries();
    expect(new Set(entries.map((route) => route.pattern)).size).toBe(entries.length);
  });

  it('uses one source module per architecture demo route', () => {
    const entries = architectureMapEntries();
    expect(new Set(entries.map((route) => route.source.module)).size).toBe(entries.length);
  });

  it('keeps every architecture route absolute', () => {
    expect(architectureMapEntries().every((route) => route.pattern.startsWith('/'))).toBe(true);
  });

  it('publishes one canonical operations route and retires the dashboard route family', () => {
    const routes = new Set(architectureMapEntries().map((route) => route.pattern));
    expect([...routes].filter((route) => route === '/operations')).toEqual(['/operations']);
    expect([...routes].filter((route) => route.startsWith('/dashboard'))).toEqual([]);
  });

  it('keeps consolidated assurance and separate security as registered architecture entries', () => {
    const assurance = architectureMapEntries().find((route) => route.pattern === '/assurance');
    expect(assurance?.page).toMatchObject({ label: 'Assurance', architectureMap: true });
    expect(assurance?.source.module).toBe('src/demos/assurance.ts');
    const security = architectureMapEntries().find((route) => route.pattern === '/security');
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
    for (const route of primaryNavigation()) {
      const entry = manifest.find((candidate) => candidate.id === route.id);
      expect(entry, `missing manifest entry for ${route.id}`).toBeDefined();
      expect(entry?.source.module).toBe(route.source.module);
      expect(entry?.status).toBe('working');
      expect(entry?.navigation).toMatchObject({
        label: route.page?.label,
        order: route.page?.order,
        navigation: 'primary',
        architectureMap: route.page?.architectureMap,
        sitemap: sitemapPaths().includes(route.pattern),
      });
      expect(entry?.navigation?.parent).toBe(route.page?.parent);
    }
    expect(manifest.filter((entry) => entry.navigation?.architectureMap)).toHaveLength(architectureMapEntries().length);
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
  it('publishes every derived sitemap path over https', async () => {
    const xml = await sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml')).text();
    for (const path of sitemapPaths()) {
      expect(xml, path).toContain(`<loc>https://demo.wizardgang.ai${path}</loc>`);
    }
    expect((xml.match(/<loc>/g) ?? []).length).toBe(sitemapPaths().length);
  });
});
