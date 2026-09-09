import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { platformLaboratoryCapabilities } from '../src/platform/route-capabilities';
import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../src/platform/route-capability';
import { createPlatformLaboratoryRouteRegistry } from '../src/routing/platform-laboratory-routes';
import { routeUrl } from '../src/routing/application-routes';
import { matchRoute } from '../src/routing/registry';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';
import {
  noncanonicalSyntheticLabPathname,
  removedPlatformLaboratoryPathnames,
} from './fixtures/removed-api-pathnames';

function environment(state: 'online' | 'offline'): Env {
  return {
    DEMO_DB: {
      prepare: (sql: string) => ({
        bind() { return this; },
        all: async () => ({
          results: sql.includes('FROM demo_control') ? [{
            state,
            public_message: state === 'online' ? 'Demo online.' : 'Demo maintenance.',
            updated_at: '2026-09-05T00:00:00.000Z',
            updated_by: 'test',
          }] : [],
        }),
      }),
    },
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  } as unknown as Env;
}

const onlineEnv = environment('online');
const offlineEnv = environment('offline');
const routes = platformLaboratoryCapabilities.flatMap((capability) => capability.routes);
const removedPagePaths = ['/edge', '/workers', '/durable-objects', '/d1', '/r2'] as const;
const platformPageCases = [
  { path: routeUrl('platform.edge'), heading: 'Cloudflare Edge', absent: 'SQL Inspector', view: 'edge' },
  { path: routeUrl('platform.workers'), heading: 'Cloudflare Workers', absent: 'Your R2 sandbox', view: 'workers' },
  { path: routeUrl('platform.durable-objects'), heading: 'Durable Objects', absent: 'SQL Inspector', view: 'durable-objects' },
  { path: routeUrl('platform.d1'), heading: 'Cloudflare D1 Database', absent: 'Your R2 sandbox', view: 'd1' },
  { path: routeUrl('platform.r2'), heading: 'Cloudflare R2 Storage', absent: 'SQL Inspector', view: 'r2' },
] as const;

describe('platform laboratory declarative routing', () => {
  it('owns one consolidated platform page and only canonical laboratory APIs with complete contracts', () => {
    expect(routes.map((route) => route.pattern).sort()).toEqual([
      '/api/labs/accessibility',
      '/api/labs/d1-reset',
      '/api/labs/d1-tasks',
      '/api/labs/d1-tasks/:id',
      '/api/labs/d1-users',
      '/api/labs/d1-users/:id',
      '/api/labs/durable-counter',
      '/api/labs/edge',
      '/api/labs/git-delivery',
      '/api/labs/git-release',
      '/api/labs/governance-ai-evaluation',
      '/api/labs/governance-security-controls',
      '/api/labs/governance-traceability',
      '/api/labs/r2-demo',
      '/api/labs/r2-files',
      '/api/labs/r2-files/:id',
      '/api/labs/r2-objects',
      '/api/labs/r2-reset',
      '/api/labs/rest-demo-records',
      '/api/labs/rest-demo-records/:id',
      '/api/labs/rest-records',
      '/api/labs/rest-records/:id',
      '/api/labs/rest-records-reset',
      '/api/labs/webhook-demo',
      '/api/labs/webhook-events',
      '/api/labs/webhook-reset',
      '/api/labs/workers',
      routeUrl('interfaces.accessibility'),
      routeUrl('platform.d1'),
      routeUrl('platform.durable-objects'),
      routeUrl('platform.edge'),
      routeUrl('platform.r2'),
      routeUrl('platform.workers'),
      routeUrl('platform.index'),
    ].sort());

    for (const route of routes) {
      expect(route.methods.length, route.id).toBeGreaterThan(0);
      expect(route.requestLimits, route.id).toBeDefined();
      expect(route.requestLimits.notes.length, route.id).toBeGreaterThan(0);
      expect(route.authorization, route.id).toBeDefined();
      expect(route.offline, route.id).toEqual({ mode: 'gated' });
      expect(route.cache, route.id).toBeDefined();
      if (route.kind === 'page') {
      expect(route.labId, route.id).toBeUndefined();
      expect(route.requestSchemas, route.id).toBeUndefined();
      expect(route.crawler.indexing, route.id).toBe('allow');
      expect(route.page, route.id).toBeDefined();
    } else {
      expect(route.source.module, route.id).toMatch(/^src\/platform\/route-capabilities\//);
      expect(route.labId, route.id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(route.pattern, route.id).toSatisfy((pattern: string) =>
        pattern === `/api/labs/${route.labId}` || pattern === `/api/labs/${route.labId}/:id`);
      for (const method of route.methods) expect(route.requestSchemas?.[method], `${route.id}:${method}`).toBeTruthy();
    }
      expect(route.source.exportName, route.id).toBeTruthy();
      expect(route.source.tests, route.id).toContain('tests/platform-laboratory-routing.test.ts');
      expect(route.handler, route.id).toBeTypeOf('function');
      expect(route.storage, route.id).toBeDefined();
    }

    expect(routes.find((route) => route.id === 'platform.index')?.storage.kind).toBe('none');
    expect(routes.find((route) => route.id === 'platform.workers.compute')?.storage.kind).toBe('stateless-compute');
    expect(routes.find((route) => route.id === 'platform.durable-objects.counter')?.storage.kind).toBe('durable-object');
    expect(routes.find((route) => route.id === 'platform.d1.records')?.storage.kind).toBe('d1');
    expect(routes.find((route) => route.id === 'platform.r2.files')?.storage).toMatchObject({
      kind: 'r2',
      binding: 'DEMO_R2',
      metadataBinding: 'DEMO_DB',
    });
  });

  it('rejects a laboratory API that is noncanonical or lacks a method schema', () => {
    const base = {
      id: 'platform.synthetic.ping',
      methods: ['GET'] as const,
      kind: 'api' as const,
      handler: () => new Response('ok'),
      authentication: { mode: 'anonymous' as const },
      authorization: { mode: 'none' as const },
      visibility: 'public' as const,
      sameOrigin: { mode: 'not-required' as const },
      offline: { mode: 'gated' as const },
      cache: { mode: 'no-store' as const },
      crawler: { crawling: 'controlled' as const, indexing: 'deny' as const },
      documentation: { title: 'Synthetic', description: 'Synthetic route.', docs: ['docs/ROUTE-REGISTRY.md'] },
      source: { module: 'tests/platform-laboratory-routing.test.ts', exportName: 'synthetic', tests: ['tests/platform-laboratory-routing.test.ts'] },
      requestLimits: noRequestBody(),
      storage: NO_STORAGE,
      labId: 'synthetic',
    };

    expect(() => definePlatformLaboratoryCapability({
      id: 'platform.synthetic',
      routes: [{ ...base, pattern: noncanonicalSyntheticLabPathname, requestSchemas: { GET: 'none' } }],
    })).toThrow(/must use \/api\/labs\/synthetic/);

    expect(() => definePlatformLaboratoryCapability({
      id: 'platform.synthetic',
      routes: [{ ...base, pattern: '/api/labs/synthetic' }],
    })).toThrow(/must declare method request schemas/);
  });

  it('renders every platform child as a canonical accessible page', async () => {
  const bodies: string[] = [];
  for (const { path, heading, absent } of platformPageCases) {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), onlineEnv);
    expect(response.status, path).toBe(200);
    const html = await response.text();
    bodies.push(html);
    expect(html, path).toContain(`<h1>${heading}</h1>`);
    expect(html, path).toContain(`<link rel="canonical" href="https://demo.wizardgang.ai${path}">`);
    expect(html, path).toContain('class="skip-link" href="#main"');
    expect(html, path).toContain('<main class="site-main" id="main">');
    expect(html.match(/<h1\b/g), path).toHaveLength(1);
    const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
    expect(inlineScripts.length, path).toBeGreaterThan(0);
    for (const script of inlineScripts) expect(() => new vm.Script(script), path).not.toThrow();
    expect(html, path).not.toContain('WG-ARCH-001');
    expect(html, path).not.toContain('References');
    expect(html, path).not.toContain('Implementation notes');
    expect(html, path).not.toContain('Request body');
    expect(html, path).toContain('Route source');
    expect(html, path).toContain('<a href="/platform" data-section-current');
    for (const removed of removedPagePaths) expect(html, `${path} legacy ${removed}`).not.toContain(`href="${removed}"`);
    expect(html, path).not.toContain(absent);
  }
  expect(new Set(bodies).size).toBe(platformPageCases.length);
});

it('renders /platform as a real child index rather than the edge laboratory', async () => {
  const response = await routeRequest(new Request('https://demo.wizardgang.ai/platform', { headers: { accept: 'text/html' } }), onlineEnv);
  const html = await response.text();
  expect(response.status).toBe(200);
  expect(html).toContain('<h1>Cloudflare Platform</h1>');
  expect(html).toContain('<link rel="canonical" href="https://demo.wizardgang.ai/platform">');
  expect(html).not.toContain('<h1>Cloudflare Edge</h1>');
  for (const { path } of platformPageCases) expect(html).toContain(`href="${path}"`);
});

it('returns the ordinary 404 for every retired platform ?view= URL', async () => {
  for (const view of [...platformPageCases.map((entry) => entry.view), 'not-a-view']) {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai/platform?view=${view}`, { headers: { accept: 'text/html' } }), onlineEnv);
    expect(response.status, view).toBe(404);
    expect(response.headers.get('location'), view).toBeNull();
    expect(await response.text(), view).toContain('404 / unknown route');
  }
});

  it('uses normal 405 handling for unsupported canonical lab methods', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api/labs/edge', { method: 'PUT' }), onlineEnv);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
  });

  it('keeps handler schema validation on canonical lab requests', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api/labs/workers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operation: 'sum', values: [] }),
    }), onlineEnv);
    expect(response.status).toBe(400);
  });

  it('preserves authorization and same-origin controls on canonical lab requests', async () => {
    const unauthorized = await routeRequest(new Request('https://demo.wizardgang.ai/api/labs/rest-records-reset', {
      method: 'POST',
    }), onlineEnv);
    expect(unauthorized.status).toBe(401);

    const crossOrigin = await routeRequest(new Request('https://demo.wizardgang.ai/api/labs/d1-reset', {
      method: 'POST',
      headers: { origin: 'https://example.test' },
    }), onlineEnv);
    expect(crossOrigin.status).toBe(403);
  });

  it('preserves offline gating for canonical lab APIs', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api/labs/edge'), offlineEnv);
    expect(response.status).toBe(503);
  });

  it('uses the ordinary 404 for an unknown platform view, unknown lab, and every removed page/API path', async () => {
    const unknownView = await routeRequest(new Request('https://demo.wizardgang.ai/platform?view=not-a-view', {
      headers: { accept: 'text/html' },
    }), onlineEnv);
    expect(unknownView.status).toBe(404);
    expect(unknownView.headers.get('location')).toBeNull();
    expect(await unknownView.text()).toContain('404 / unknown route');

    const unknownLab = await routeRequest(new Request('https://demo.wizardgang.ai/api/labs/not-registered'), onlineEnv);
    expect(unknownLab.status).toBe(404);
    expect(unknownLab.headers.get('location')).toBeNull();

    for (const path of [...removedPagePaths, ...removedPlatformLaboratoryPathnames]) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`), onlineEnv);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('location'), path).toBeNull();
      expect(await response.text(), path).toContain('404 / unknown route');
    }
  });

  it('registers a compatible canonical laboratory without modifying the central router', async () => {
    const synthetic = definePlatformLaboratoryCapability({
      id: 'platform.synthetic',
      routes: [{
        id: 'platform.synthetic.ping',
        labId: 'synthetic',
        pattern: '/api/labs/synthetic',
        methods: ['GET'],
        requestSchemas: { GET: 'none' },
        kind: 'api',
        handler: () => new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
        }),
        authentication: { mode: 'anonymous' },
        authorization: { mode: 'none' },
        visibility: 'public',
        sameOrigin: { mode: 'not-required' },
        offline: { mode: 'gated' },
        cache: { mode: 'no-store' },
        crawler: { crawling: 'controlled', indexing: 'deny' },
        documentation: {
          title: 'Synthetic laboratory',
          description: 'Test-only compatible platform laboratory.',
          docs: ['docs/ROUTE-REGISTRY.md'],
        },
        source: {
          module: 'tests/platform-laboratory-routing.test.ts',
          exportName: 'synthetic',
          tests: ['tests/platform-laboratory-routing.test.ts'],
        },
        requestLimits: noRequestBody(),
        storage: NO_STORAGE,
      }],
    });
    const routeRegistry = createPlatformLaboratoryRouteRegistry([...platformLaboratoryCapabilities, synthetic]);
    const match = matchRoute(routeRegistry, 'GET', '/api/labs/synthetic');
    expect(match.status).toBe('matched');
    if (match.status !== 'matched') throw new Error('Synthetic laboratory route did not match.');
    const response = await match.route.handler(new Request('https://demo.wizardgang.ai/api/labs/synthetic'), onlineEnv, match.params);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const centralRouterSource = fs.readFileSync('src/router.ts', 'utf8');
    expect(centralRouterSource).not.toContain('/api/labs/synthetic');
  });

  it('keeps individual laboratory paths out of the central router', () => {
    const centralRouterSource = fs.readFileSync('src/router.ts', 'utf8');
    expect(centralRouterSource).toContain('applicationRouteRegistry');
    expect(centralRouterSource).not.toContain('routePlatformLaboratoryRequest');

    for (const path of routes.map((route) => route.pattern)) {
      expect(centralRouterSource).not.toContain(`'${path}'`);
      expect(centralRouterSource).not.toContain(`"${path}"`);
    }
  });
});
