import { describe, expect, it } from 'vitest';
import { matchRoute } from '../src/routing/registry';
import { operationalRouteRegistry } from '../src/routing/operational-routes';

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
  {
    id: 'operations.page', pattern: '/operations', methods: ['GET'], kind: 'page', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'controlled', indexing: 'allow' },
  },
  ...[
    ['operations.api-logs', '/api/operations/logs', ['GET']],
    ['operations.api-budget', '/api/operations/budget', ['POST']],
  ].map(([id, pattern, methods]) => ({
    id, pattern, methods, kind: 'api', visibility: 'public',
    authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, sameOrigin: { mode: 'not-required' },
    offline: { mode: 'available' }, cache: { mode: 'no-store' }, crawler: { crawling: 'controlled', indexing: 'deny' },
  })),
];

describe('global operational route policies', () => {
  it('declares the complete policy contract for every migrated route', () => {
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

  it('does not register retired dashboard paths or unknown operations paths', () => {
    for (const path of ['/dashboard', '/dashboard/uptime', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing', '/dashboard/not-a-route']) {
      expect(matchRoute(operationalRouteRegistry, 'GET', path), path).toEqual({ status: 'not-found', statusCode: 404 });
    }
    expect(matchRoute(operationalRouteRegistry, 'GET', '/api/operations/not-a-route')).toEqual({ status: 'not-found', statusCode: 404 });
  });

  it('attaches documentation and source metadata to every migrated route', () => {
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
