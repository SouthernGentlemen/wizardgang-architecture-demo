import { describe, expect, it } from 'vitest';
import { sitemapResponse } from '../src/api/sitemap';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';
import {
  applicationRouteRegistry,
  createApplicationRouteRegistry,
  routeUrl,
  routeUrlFromRegistry,
  type ApplicationRouteContext,
  type PageMetadata,
} from '../src/routing/application-routes';
import {
  architectureMapEntries,
  primaryNavigation,
  secondaryNavigation,
  sitemapPaths,
} from '../src/routing/navigation';
import { defineRouteModule, matchRoute, type RouteDeclaration } from '../src/routing/registry';

function syntheticRoute(
  id: string,
  pattern: string,
  methods: RouteDeclaration<ApplicationRouteContext>['methods'] = ['GET'],
  kind: RouteDeclaration<ApplicationRouteContext>['kind'] = 'api',
  page?: PageMetadata,
): RouteDeclaration<ApplicationRouteContext> & { page?: PageMetadata } {
  return {
    id,
    pattern,
    methods,
    kind,
    handler: () => new Response('ok'),
    authentication: { mode: 'anonymous' },
    authorization: { mode: 'none' },
    visibility: 'public',
    sameOrigin: { mode: 'not-required' },
    offline: { mode: 'gated' },
    cache: { mode: 'no-store' },
    crawler: { crawling: 'controlled', indexing: 'deny' },
    documentation: {
      title: id,
      description: `Synthetic route ${id}`,
      docs: ['docs/ROUTE-REGISTRY.md'],
    },
    source: {
      module: 'tests/application-route-registry.test.ts',
      tests: ['tests/application-route-registry.test.ts'],
    },
    ...(page ? { page } : {}),
  };
}

function noDatabaseEnv(): Env {
  return {
    DEMO_DB: {
      prepare() {
        throw new Error('unknown paths must not consult route policy storage');
      },
    },
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

describe('complete declarative application routing', () => {
  it('derives global navigation and the architecture map from page declarations', () => {
    expect(primaryNavigation().map((route) => route.id)).toEqual([
      'interfaces.frontend.index',
      'platform.index',
      'interfaces.index',
      'assurance.index',
      'operations.page',
      'security.index',
    ]);
    expect(primaryNavigation().map((route) => route.page?.label)).toEqual([
      'Architecture', 'Platform', 'Interfaces', 'Assurance', 'Operations', 'Security',
    ]);
    expect(architectureMapEntries().map((route) => route.pattern)).toEqual([
      '/interfaces/rest', '/platform/edge', '/interfaces/graphql', '/platform',
      '/platform/workers', '/interfaces', '/interfaces/webhooks', '/platform/durable-objects',
      '/assurance', '/interfaces/identity', '/platform/d1', '/interfaces/mcp',
      '/operations', '/platform/r2', '/security', '/interfaces/i18n', '/interfaces/accessibility',
    ]);
    expect(secondaryNavigation('interfaces.frontend.index')).toEqual([]);
    expect(secondaryNavigation('platform.index').map((route) => route.pattern)).toEqual([
      '/platform/edge', '/platform/workers', '/platform/durable-objects', '/platform/d1', '/platform/r2',
    ]);
    expect(secondaryNavigation('interfaces.index').map((route) => route.pattern)).toEqual([
      '/interfaces/rest', '/interfaces/graphql', '/interfaces/webhooks', '/interfaces/identity',
      '/interfaces/mcp', '/interfaces/i18n', '/interfaces/accessibility',
    ]);
    expect(secondaryNavigation('assurance.index').map((route) => route.pattern)).toEqual([
      '/assurance/delivery', '/assurance/governance', '/assurance/evidence', '/assurance/compliance',
      '/assurance/risks', '/assurance/incidents', '/assurance/concerns',
    ]);
    expect(primaryNavigation().every((route) => route.visibility === 'public')).toBe(true);
  });

  it('generates sitemap entries from public indexable registered pages', async () => {
    expect([...sitemapPaths()].sort()).toEqual([
      '/', '/interfaces/rest', '/platform/edge', '/interfaces/graphql', '/platform',
      '/platform/workers', '/interfaces', '/interfaces/webhooks', '/platform/durable-objects',
      '/assurance', '/assurance/delivery', '/assurance/governance', '/assurance/evidence',
      '/assurance/compliance', '/assurance/risks', '/assurance/incidents', '/assurance/concerns',
      '/interfaces/identity', '/platform/d1', '/interfaces/mcp', '/operations', '/platform/r2',
      '/security', '/interfaces/i18n', '/interfaces/accessibility',
    ].sort());
    const response = sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml'));
    const xml = await response.text();
    for (const routePath of sitemapPaths()) {
      expect(xml).toContain(`<loc>https://demo.wizardgang.ai${routePath}</loc>`);
    }
    expect(xml).not.toContain('/admin</loc>');
    expect(xml).not.toContain('/v1/');
  });

  it('resolves internal URLs by stable route ID, including encoded parameters', () => {
    expect(routeUrl('interfaces.openapi.json')).toBe('/api/openapi.json');
    const parameterized = applicationRouteRegistry.declarations.find((route) => route.pattern.includes(':'));
    expect(parameterized).toBeTruthy();
    const names = [...parameterized!.pattern.matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1]);
    const params = Object.fromEntries(names.map((name) => [name, 'A B']));
    const resolved = routeUrlFromRegistry(applicationRouteRegistry, parameterized!.id, params);
    expect(resolved).not.toContain(':');
    expect(resolved).toContain('A%20B');
    expect(() => routeUrlFromRegistry(applicationRouteRegistry, parameterized!.id)).toThrow('Missing route parameter');
  });

  it('allows an additional page without encoding an eight-page inventory', () => {
    const extraPage = syntheticRoute(
      'synthetic.page',
      '/synthetic-page',
      ['GET'],
      'page',
      {
        parent: 'interfaces.frontend.index',
        label: 'Synthetic page',
        summary: 'A compatible ninth page registered by a test capability.',
        order: 99,
        navigation: 'secondary',
        architectureMap: true,
      },
    );
    extraPage.crawler = { crawling: 'controlled', indexing: 'allow' };
    const registry = createApplicationRouteRegistry([
      defineRouteModule('synthetic.page', [extraPage]),
    ]);
    expect(registry.declarations.find((route) => route.id === 'synthetic.page')).toMatchObject({
      pattern: '/synthetic-page',
      kind: 'page',
    });
  });

  it('uses one consistent method result from the application registry', () => {
    expect(matchRoute(applicationRouteRegistry, 'POST', '/interfaces')).toMatchObject({
      status: 'method-not-allowed',
      allowedMethods: ['GET'],
      route: { id: 'interfaces.index' },
    });
    expect(matchRoute(applicationRouteRegistry, 'PUT', '/mcp')).toMatchObject({
      status: 'method-not-allowed',
      allowedMethods: ['GET', 'POST', 'DELETE'],
      route: { id: 'interfaces.mcp.server' },
    });
    expect(matchRoute(applicationRouteRegistry, 'GET', '/mcp')).toMatchObject({
      status: 'matched',
      route: { id: 'interfaces.mcp.server' },
    });
  });

  it('requires complete reachable policy, documentation, and page hierarchy metadata', () => {
    for (const route of applicationRouteRegistry.declarations) {
      expect(route.documentation.title.trim(), route.id).not.toBe('');
      expect(route.documentation.description.trim(), route.id).not.toBe('');
      expect(route.documentation.docs.length, route.id).toBeGreaterThan(0);
      expect(route.source.module.trim(), route.id).not.toBe('');
      if (route.kind === 'page') {
        expect(route.methods, route.id).toContain('GET');
        expect(route.page, route.id).toBeDefined();
        if (route.page?.parent) {
          expect(applicationRouteRegistry.declarations.some((candidate) => (
            candidate.kind === 'page' && candidate.id === route.page?.parent
          )), route.id).toBe(true);
        }
      }
      if (route.visibility === 'private') {
        expect(route.crawler.indexing, route.id).toBe('deny');
        expect(route.cache.mode, route.id).not.toBe('public');
      }
    }

    const undocumented = syntheticRoute('synthetic.undocumented', '/synthetic-undocumented');
    undocumented.documentation = { title: '', description: '', docs: [] };
    expect(() => createApplicationRouteRegistry([
      defineRouteModule('synthetic.undocumented', [undocumented]),
    ])).toThrow('undocumented');

    const unreachable = syntheticRoute('synthetic.unreachable', '/synthetic-unreachable', ['POST'], 'page', {
      parent: 'interfaces.frontend.index',
      label: 'Unreachable',
      summary: 'Synthetic unreachable page.',
      order: 100,
      navigation: 'none',
      architectureMap: false,
    });
    expect(() => createApplicationRouteRegistry([
      defineRouteModule('synthetic.unreachable', [unreachable]),
    ])).toThrow('unreachable as a page');
  });

  it('rejects collisions across capability boundaries', () => {
    expect(() => createApplicationRouteRegistry([
      defineRouteModule('synthetic.duplicate', [syntheticRoute('synthetic.duplicate', '/api/operations/health')]),
    ])).toThrow("Duplicate route pattern '/api/operations/health'");

    expect(() => createApplicationRouteRegistry([
      defineRouteModule('synthetic.ambiguous', [
        syntheticRoute('synthetic.ambiguous-a', '/synthetic/:section/edit'),
        syntheticRoute('synthetic.ambiguous-b', '/synthetic/new/:action'),
      ]),
    ])).toThrow('Ambiguous route patterns');
  });

  it('keeps removed aliases and unknown paths on the normal 404 even while offline state is unavailable', async () => {
    for (const path of [
      '/api', '/webhooks', '/identity', '/mcp/server', '/i18n', '/accessibility',
      '/__api/demo/run', '/__api/demo/events', '/v1/not-registered', '/legacy/compliance',
    ]) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`), noDatabaseEnv());
      expect(response.status, path).toBe(404);
    }
  });
});
