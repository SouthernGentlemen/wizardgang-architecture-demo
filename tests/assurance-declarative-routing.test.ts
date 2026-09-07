import { describe, expect, it } from 'vitest';
import {
  assuranceRegistry,
  type AssuranceRegistry,
  type AssuranceRegistryResource,
} from '../src/assurance/model';
import { assuranceRouteCapabilities } from '../src/assurance/route-capabilities';
import type { AssuranceRouteCapability } from '../src/assurance/route-capability';
import { createAssuranceRouteRegistry } from '../src/routing/assurance-routes';
import { matchRoute } from '../src/routing/registry';
import type { Env } from '../src/types';

const env = {
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
} as unknown as Env;

function syntheticResource(
  id: string,
  kind: string,
  routes: AssuranceRegistryResource['routes'],
  capabilities: string[] = ['runtime', 'records'],
): AssuranceRegistryResource {
  return {
    id,
    kind,
    role: 'dataset',
    path: `assurance/synthetic/${id}.json`,
    schema: 'contracts/assurance/claim.schema.json',
    visibility: 'public',
    capabilities,
    recordCollection: { path: 'records', identity: ['title'] },
    routes,
  };
}

function registryWith(...resources: AssuranceRegistryResource[]): AssuranceRegistry {
  const registry = structuredClone(assuranceRegistry) as AssuranceRegistry;
  registry.datasets.push(...resources);
  return registry;
}

function syntheticCapability(ownerId: string): AssuranceRouteCapability {
  return {
    ownerId,
    html: {
      handler: (request) => new Response(JSON.stringify({ ownerId, pathname: new URL(request.url).pathname }), {
        headers: { 'content-type': 'application/json' },
      }),
      source: {
        module: 'tests/assurance-declarative-routing.test.ts',
        exportName: 'syntheticCapability',
        tests: ['tests/assurance-declarative-routing.test.ts'],
      },
    },
  };
}

describe('declarative assurance presentation routing', () => {
  it('discovers and routes a compatible new HTML family without a main-router change', async () => {
    const registry = registryWith(syntheticResource(
      'synthetic',
      'synthetic',
      { html: '/synthetic-assurance' },
    ));
    const routeRegistry = createAssuranceRouteRegistry(
      registry,
      [...assuranceRouteCapabilities, syntheticCapability('synthetic')],
    );

    expect(routeRegistry.declarations.map((route) => route.pattern)).toContain('/synthetic-assurance');
    const match = matchRoute(routeRegistry, 'GET', '/synthetic-assurance');
    expect(match.status).toBe('matched');
    if (match.status !== 'matched') throw new Error('Synthetic assurance route did not match.');
    const response = await match.route.handler(new Request('https://demo.wizardgang.ai/synthetic-assurance'), { env }, match.params);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ownerId: 'synthetic', pathname: '/synthetic-assurance' });
  });

  it('keeps independently registered presentation routes distinct', async () => {
    const registry = registryWith(
      syntheticResource('synthetic-a', 'synthetic-a', { html: '/synthetic-a' }),
      syntheticResource('synthetic-b', 'synthetic-b', { html: '/synthetic-b' }),
    );
    const routeRegistry = createAssuranceRouteRegistry(
      registry,
      [
        ...assuranceRouteCapabilities,
        syntheticCapability('synthetic-a'),
        syntheticCapability('synthetic-b'),
      ],
    );

    expect(matchRoute(routeRegistry, 'GET', '/synthetic-a').status).toBe('matched');
    expect(matchRoute(routeRegistry, 'GET', '/synthetic-b').status).toBe('matched');
    expect(matchRoute(routeRegistry, 'GET', '/synthetic-a/extra')).toEqual({ status: 'not-found', statusCode: 404 });
  });

  it('fails closed when a registered HTML route has no specialized renderer', () => {
    const registry = registryWith(syntheticResource(
      'synthetic-html',
      'synthetic-html',
      { html: '/synthetic-assurance' },
    ));
    expect(() => createAssuranceRouteRegistry(registry, assuranceRouteCapabilities))
      .toThrow(/synthetic-html.*HTML|HTML.*synthetic-html/i);
  });

  it('rejects additional assurance API declarations instead of creating a second API router', () => {
    const registry = registryWith(syntheticResource(
      'synthetic-api',
      'synthetic-api',
      { api: '/v1/assurance/synthetic-api', apiRecord: '/v1/assurance/synthetic-api/{id}' } as never,
    ));
    expect(() => createAssuranceRouteRegistry(registry, assuranceRouteCapabilities))
      .toThrow(/unsupported route field.*api\/reporting/i);
  });
});
