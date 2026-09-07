import { describe, expect, it } from 'vitest';
import { demos } from '../src/demos/registry';
import { sitemapResponse } from '../src/api/sitemap';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';
import {
  applicationRouteRegistry,
  createApplicationRouteRegistry,
  routeUrl,
  routeUrlFromRegistry,
  type ApplicationRouteContext,
} from '../src/routing/application-routes';
import {
  registeredDemoNavigation,
  registeredPageMetadata,
  registeredSitemapPaths,
} from '../src/routing/navigation';
import { defineRouteModule, matchRoute, type RouteDeclaration } from '../src/routing/registry';

function syntheticRoute(
  id: string,
  pattern: string,
  methods: RouteDeclaration<ApplicationRouteContext>['methods'] = ['GET'],
  kind: RouteDeclaration<ApplicationRouteContext>['kind'] = 'api',
): RouteDeclaration<ApplicationRouteContext> {
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
  it('builds architecture navigation from registered page metadata', () => {
    expect(registeredDemoNavigation().map((demo) => demo.route)).toEqual(demos.map((demo) => demo.route));
    expect(registeredPageMetadata().filter((route) => route.navigation?.index)).toHaveLength(demos.length);
    expect(registeredPageMetadata().every((route) => route.visibility === 'public')).toBe(true);
  });

  it('generates sitemap entries from public registered page metadata', async () => {
    expect(registeredSitemapPaths()).toEqual(['/', ...demos.map((demo) => demo.route)]);
    const response = sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml'));
    const xml = await response.text();
    for (const routePath of registeredSitemapPaths()) {
      expect(xml).toContain(`<loc>https://demo.wizardgang.ai${routePath}</loc>`);
    }
    expect(xml).not.toContain('/admin</loc>');
    expect(xml).not.toContain('/v1/');
  });

  it('resolves internal URLs by stable route ID, including encoded parameters', () => {
    expect(routeUrl('interfaces.openapi.json')).toBe('/v1/openapi.json');
    const parameterized = applicationRouteRegistry.declarations.find((route) => route.pattern.includes(':'));
    expect(parameterized).toBeTruthy();
    const names = [...parameterized!.pattern.matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1]);
    const params = Object.fromEntries(names.map((name) => [name, 'A B']));
    const resolved = routeUrlFromRegistry(applicationRouteRegistry, parameterized!.id, params);
    expect(resolved).not.toContain(':');
    expect(resolved).toContain('A%20B');
    expect(() => routeUrlFromRegistry(applicationRouteRegistry, parameterized!.id)).toThrow('Missing route parameter');
  });

  it('uses one consistent method result from the application registry', () => {
    expect(matchRoute(applicationRouteRegistry, 'POST', '/interfaces')).toMatchObject({
      status: 'method-not-allowed',
      allowedMethods: ['GET'],
      route: { id: 'interfaces.page' },
    });
    expect(matchRoute(applicationRouteRegistry, 'POST', '/mcp')).toEqual({ status: 'not-found', statusCode: 404 });
    expect(matchRoute(applicationRouteRegistry, 'GET', '/mcp/server')).toMatchObject({
      status: 'matched',
      route: { id: 'interfaces.mcp.server' },
    });
  });

  it('requires complete reachable policy and documentation metadata', () => {
    for (const route of applicationRouteRegistry.declarations) {
      expect(route.documentation.title.trim(), route.id).not.toBe('');
      expect(route.documentation.description.trim(), route.id).not.toBe('');
      expect(route.documentation.docs.length, route.id).toBeGreaterThan(0);
      expect(route.source.module.trim(), route.id).not.toBe('');
      if (route.kind === 'page') expect(route.methods, route.id).toContain('GET');
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

    const unreachable = syntheticRoute('synthetic.unreachable', '/synthetic-unreachable', ['POST'], 'page');
    expect(() => createApplicationRouteRegistry([
      defineRouteModule('synthetic.unreachable', [unreachable]),
    ])).toThrow('unreachable as a page');
  });

  it('rejects collisions across capability boundaries', () => {
    expect(() => createApplicationRouteRegistry([
      defineRouteModule('synthetic.duplicate', [syntheticRoute('synthetic.duplicate', '/health')]),
    ])).toThrow("Duplicate route pattern '/health'");

    expect(() => createApplicationRouteRegistry([
      defineRouteModule('synthetic.ambiguous', [
        syntheticRoute('synthetic.ambiguous-a', '/synthetic/:section/edit'),
        syntheticRoute('synthetic.ambiguous-b', '/synthetic/new/:action'),
      ]),
    ])).toThrow('Ambiguous route patterns');
  });

  it('keeps removed aliases and unknown paths on the normal 404 even while offline state is unavailable', async () => {
    for (const path of [
      '/api', '/webhooks', '/identity', '/mcp', '/i18n', '/accessibility',
      '/__api/demo/run', '/__api/demo/events', '/v1/not-registered', '/legacy/compliance',
    ]) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`), noDatabaseEnv());
      expect(response.status, path).toBe(404);
    }
  });
});
