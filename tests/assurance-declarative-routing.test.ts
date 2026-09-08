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
  routeId: string,
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
    presentation: { routeId },
  };
}

function registryWith(...resources: AssuranceRegistryResource[]): AssuranceRegistry {
  const registry = structuredClone(assuranceRegistry) as AssuranceRegistry;
  registry.datasets.push(...resources);
  return registry;
}

function syntheticCapability(routeId: string, pattern: string): AssuranceRouteCapability {
  return {
    routeId,
    pattern,
    html: {
      handler: (request) => new Response(JSON.stringify({ routeId, pathname: new URL(request.url).pathname }), {
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
      'assurance.synthetic',
    ));
    const routeRegistry = createAssuranceRouteRegistry(
      registry,
      [...assuranceRouteCapabilities, syntheticCapability('assurance.synthetic', '/synthetic-assurance')],
    );

    expect(routeRegistry.declarations.map((route) => route.pattern)).toContain('/synthetic-assurance');
    const match = matchRoute(routeRegistry, 'GET', '/synthetic-assurance');
    expect(match.status).toBe('matched');
    if (match.status !== 'matched') throw new Error('Synthetic assurance route did not match.');
    const response = await match.route.handler(new Request('https://demo.wizardgang.ai/synthetic-assurance'), { env }, match.params);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ routeId: 'assurance.synthetic', pathname: '/synthetic-assurance' });
  });

  it('keeps independently registered presentation routes distinct', () => {
    const registry = registryWith(
      syntheticResource('synthetic-a', 'synthetic-a', 'assurance.synthetic-a'),
      syntheticResource('synthetic-b', 'synthetic-b', 'assurance.synthetic-b'),
    );
    const routeRegistry = createAssuranceRouteRegistry(
      registry,
      [
        ...assuranceRouteCapabilities,
        syntheticCapability('assurance.synthetic-a', '/synthetic-a'),
        syntheticCapability('assurance.synthetic-b', '/synthetic-b'),
      ],
    );

    expect(matchRoute(routeRegistry, 'GET', '/synthetic-a').status).toBe('matched');
    expect(matchRoute(routeRegistry, 'GET', '/synthetic-b').status).toBe('matched');
    expect(matchRoute(routeRegistry, 'GET', '/synthetic-a/extra')).toEqual({ status: 'not-found', statusCode: 404 });
  });

  it('fails closed when metadata references an application route ID with no renderer', () => {
    const registry = registryWith(syntheticResource(
      'synthetic-html',
      'synthetic-html',
      'assurance.synthetic-missing',
    ));
    expect(() => createAssuranceRouteRegistry(registry, assuranceRouteCapabilities))
      .toThrow(/synthetic-html.*unknown application route assurance\.synthetic-missing/i);
  });

  it('takes the pathname from the application route capability rather than assurance metadata', () => {
    const registry = registryWith(syntheticResource(
      'synthetic-canonical',
      'synthetic-canonical',
      'assurance.synthetic-canonical',
    ));
    const routeRegistry = createAssuranceRouteRegistry(
      registry,
      [...assuranceRouteCapabilities, syntheticCapability('assurance.synthetic-canonical', '/owned-by-application-route')],
    );
    expect(matchRoute(routeRegistry, 'GET', '/owned-by-application-route').status).toBe('matched');
    expect(JSON.stringify(registry)).not.toContain('/owned-by-application-route');
  });
});
