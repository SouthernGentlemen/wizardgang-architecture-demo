import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { platformLaboratoryCapabilities } from '../src/platform/route-capabilities';
import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../src/platform/route-capability';
import { createPlatformLaboratoryRouteRouter } from '../src/routing/platform-laboratory-routes';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';

const onlineEnv = {
  DEMO_DB: {
    prepare: () => ({
      all: async () => ({
        results: [{
          state: 'online',
          public_message: 'Demo online.',
          updated_at: '2026-09-05T00:00:00.000Z',
          updated_by: 'test',
        }],
      }),
    }),
  },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as unknown as Env;

const routes = platformLaboratoryCapabilities.flatMap((capability) => capability.routes);

describe('platform laboratory declarative routing', () => {
  it('owns every migrated platform page and laboratory API with complete route metadata', () => {
    expect(routes.map((route) => route.pattern).sort()).toEqual([
      '/__api/accessibility/lab',
      '/__api/api-sandbox/reset',
      '/__api/d1/reset',
      '/__api/d1/tasks',
      '/__api/d1/tasks/:id',
      '/__api/d1/users',
      '/__api/d1/users/:id',
      '/__api/durable/counter',
      '/__api/edge/inspect',
      '/__api/r2/demo',
      '/__api/r2/files',
      '/__api/r2/files/:id',
      '/__api/r2/object',
      '/__api/r2/reset',
      '/__api/workers/compute',
      '/accessibility',
      '/d1',
      '/durable-objects',
      '/edge',
      '/r2',
      '/v1/demo-records',
      '/v1/demo-records/:key',
      '/workers',
    ].sort());

    for (const route of routes) {
      expect(route.methods.length, route.id).toBeGreaterThan(0);
      expect(route.requestLimits, route.id).toBeDefined();
      expect(route.requestLimits.notes.length, route.id).toBeGreaterThan(0);
      expect(route.authorization, route.id).toBeDefined();
      expect(route.offline, route.id).toEqual({ mode: 'gated' });
      expect(route.cache, route.id).toBeDefined();
      expect(route.source.module, route.id).toMatch(/^src\/platform\/route-capabilities\//);
      expect(route.source.exportName, route.id).toBeTruthy();
      expect(route.source.tests, route.id).toContain('tests/platform-laboratory-routing.test.ts');
      expect(route.handler, route.id).toBeTypeOf('function');
      expect(route.storage, route.id).toBeDefined();
    }

    expect(routes.find((route) => route.id === 'platform.workers.compute')?.storage.kind).toBe('stateless-compute');
    expect(routes.find((route) => route.id === 'platform.durable-objects.counter')?.storage.kind).toBe('durable-object');
    expect(routes.find((route) => route.id === 'platform.d1.records')?.storage.kind).toBe('d1');
    expect(routes.find((route) => route.id === 'platform.r2.files')?.storage).toMatchObject({
      kind: 'r2',
      binding: 'DEMO_R2',
      metadataBinding: 'DEMO_DB',
    });
  });

  it('registers a compatible new laboratory without modifying the central router', async () => {
    const synthetic = definePlatformLaboratoryCapability({
      id: 'platform.synthetic',
      routes: [{
        id: 'platform.synthetic.ping',
        pattern: '/__api/synthetic-lab/ping',
        methods: ['GET'],
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
    const router = createPlatformLaboratoryRouteRouter([...platformLaboratoryCapabilities, synthetic]);

    const response = await router.route(
      new Request('https://demo.wizardgang.ai/__api/synthetic-lab/ping'),
      onlineEnv,
      '/__api/synthetic-lab/ping',
    );

    expect(response?.status).toBe(200);
    expect(await response?.json()).toEqual({ ok: true });
    expect(response?.headers.get('cache-control')).toBe('no-store');

    const centralRouterSource = fs.readFileSync('src/router.ts', 'utf8');
    expect(centralRouterSource).not.toContain('/__api/synthetic-lab/ping');
  });

  it('keeps unknown laboratory paths unregistered and returns 404 from the main router', async () => {
    const router = createPlatformLaboratoryRouteRouter();
    expect(await router.route(
      new Request('https://demo.wizardgang.ai/__api/d1/not-a-route'),
      onlineEnv,
      '/__api/d1/not-a-route',
    )).toBeUndefined();

    const response = await routeRequest(
      new Request('https://demo.wizardgang.ai/__api/d1/not-a-route'),
      onlineEnv,
    );
    expect(response.status).toBe(404);
  });

  it('removes individual migrated platform paths from the central router', () => {
    const centralRouterSource = fs.readFileSync('src/router.ts', 'utf8');
    expect(centralRouterSource).toContain('applicationRouteRegistry');
    expect(centralRouterSource).not.toContain('routePlatformLaboratoryRequest');

    for (const path of [
      '/edge',
      '/workers',
      '/durable-objects',
      '/d1',
      '/r2',
      '/accessibility',
      '/__api/edge/inspect',
      '/__api/workers/compute',
      '/__api/durable/counter',
      '/__api/d1/users',
      '/__api/d1/tasks',
      '/__api/d1/reset',
      '/v1/demo-records',
      '/__api/api-sandbox/reset',
      '/__api/r2/demo',
      '/__api/r2/object',
      '/__api/r2/files',
      '/__api/r2/reset',
      '/__api/accessibility/lab',
    ]) {
      expect(centralRouterSource).not.toContain(`'${path}'`);
      expect(centralRouterSource).not.toContain(`"${path}"`);
    }
  });
});
