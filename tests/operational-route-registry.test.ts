import { describe, expect, it } from 'vitest';
import { routeUrl } from '../src/routing/application-routes';
import { matchRoute } from '../src/routing/registry';
import { operationalRouteRegistry } from '../src/routing/operational-routes';
import { removedHtmlPathnames } from './fixtures/removed-html-pathnames';

const publicPagePolicy = {
  methods: ['GET'], kind: 'page', visibility: 'public',
  authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
  offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'controlled', indexing: 'allow' },
} as const;

const expectedPolicies = [
  {
    id: 'operations.admin', pattern: '/admin', methods: ['GET', 'POST'], kind: 'page', visibility: 'private',
    authentication: { mode: 'required', provider: 'admin-basic' }, authorization: { mode: 'policy', policy: 'admin' },
    sameOrigin: { mode: 'required', methods: ['POST'] }, offline: { mode: 'available' }, cache: { mode: 'no-store' },
    crawler: { crawling: 'allow', indexing: 'deny' },
  },
  {
    id: 'operations.offline', pattern: '/offline', methods: ['GET'], kind: 'page', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'controlled', indexing: 'deny' },
  },
  {
    id: 'operations.health', pattern: '/api/operations/health', methods: ['GET'], kind: 'api', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'controlled', indexing: 'deny' },
  },
  {
    id: 'operations.version', pattern: '/api/operations/version', methods: ['GET'], kind: 'api', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'controlled', indexing: 'deny' },
  },
  {
    id: 'operations.robots', pattern: '/robots.txt', methods: ['GET', 'HEAD'], kind: 'protocol', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'allow', indexing: 'deny' },
  },
  {
    id: 'operations.security-txt', pattern: '/.well-known/security.txt', methods: ['GET', 'HEAD'], kind: 'protocol', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'public', maxAgeSeconds: 3600 }, crawler: { crawling: 'allow', indexing: 'deny' },
  },
  {
    id: 'operations.assets', pattern: '/assets/:asset', methods: ['GET', 'HEAD'], kind: 'asset', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'public', maxAgeSeconds: 31_536_000, immutable: true }, crawler: { crawling: 'controlled', indexing: 'deny' },
  },
  {
    id: 'operations.sitemap', pattern: '/sitemap.xml', methods: ['GET'], kind: 'protocol', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'gated' }, cache: { mode: 'public', maxAgeSeconds: 3600 }, crawler: { crawling: 'controlled', indexing: 'deny' },
  },
  { id: 'operations.index', pattern: routeUrl('operations.index'), ...publicPagePolicy },
  ...[
    ['operations.api-logs', '/api/operations/logs', ['GET']],
    ['operations.api-budget', '/api/operations/budget', ['POST']],
  ].map(([id, pattern, methods]) => ({
    id, pattern, methods, kind: 'api', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'controlled', indexing: 'deny' },
  })),
];

const retiredOperationsPaths = removedHtmlPathnames
  .filter((entry) => entry.outcome === '404' && entry.supersededBy === 'operations.index')
  .map((entry) => entry.pathname);

describe('global operational route policies', () => {
  it('declares the complete policy contract for every operational route', () => {
    expect(operationalRouteRegistry.declarations.map((route) => ({
      id: route.id,
      pattern: route.pattern,
      methods: route.methods,
      kind: route.kind,
      visibility: route.visibility,
      authentication: route.authentication,
      authorization: route.authorization,
      sameOrigin: route.sameOrigin,
      offline: route.offline,
      cache: route.cache,
      crawler: route.crawler,
    }))).toEqual(expectedPolicies);
  });

  it('matches every declared method and rejects undeclared methods from route metadata', () => {
    for (const route of operationalRouteRegistry.declarations) {
      for (const method of route.methods) {
        expect(matchRoute(operationalRouteRegistry, method, route.pattern), `${method} ${route.pattern}`).toMatchObject({
          status: 'matched', route: { id: route.id },
        });
      }
      const unsupported = route.methods.includes('DELETE') ? 'PUT' : 'DELETE';
      expect(matchRoute(operationalRouteRegistry, unsupported, route.pattern), `${unsupported} ${route.pattern}`).toMatchObject({
        status: 'method-not-allowed', route: { id: route.id }, allowedMethods: route.methods,
      });
    }
  });

  it('does not register retired dashboard paths, retired operations child paths, old view aliases, or unknown paths', () => {
    for (const path of [
      '/dashboard', '/dashboard/uptime', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing', '/dashboard/not-a-route',
      ...retiredOperationsPaths,
    ]) {
      expect(matchRoute(operationalRouteRegistry, 'GET', path), path).toEqual({ status: 'not-found', statusCode: 404 });
    }
    expect(matchRoute(operationalRouteRegistry, 'GET', '/api/operations/not-a-route')).toEqual({ status: 'not-found', statusCode: 404 });
    expect(matchRoute(operationalRouteRegistry, 'GET', `${routeUrl('operations.index')}/not-a-route`)).toEqual({ status: 'not-found', statusCode: 404 });
  });

  it('keeps the single operations page available while intentionally offline', () => {
    const route = operationalRouteRegistry.declarations.find((candidate) => candidate.id === 'operations.index');
    expect(route?.pattern).toBe(routeUrl('operations.index'));
    expect(route?.offline).toEqual({ mode: 'available' });
    expect(route?.kind).toBe('page');
    expect(operationalRouteRegistry.declarations.filter((candidate) => candidate.kind === 'page' && candidate.visibility === 'public' && candidate.crawler.indexing === 'allow').map((candidate) => candidate.pattern)).toEqual([routeUrl('operations.index')]);
  });

  it('attaches documentation and source metadata to every operational route', () => {
    for (const route of operationalRouteRegistry.declarations) {
      expect(route.documentation.title).not.toBe('');
      expect(route.documentation.description).not.toBe('');
      expect(route.documentation.docs).toContain('docs/ROUTE-REGISTRY.md');
      expect(route.source.module).toMatch(/^src\//);
      expect(route.source.exportName).toBeTruthy();
      expect(route.source.tests).toContain('tests/operational-route-registry.test.ts');
    }
  });
});
