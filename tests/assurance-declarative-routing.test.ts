import { describe, expect, it } from 'vitest';
import {
  assuranceRegistry,
  type AssuranceRegistry,
  type AssuranceRegistryResource,
} from '../src/assurance/model';
import { assuranceRouteCapabilities } from '../src/assurance/route-capabilities';
import { createAssuranceRouteRouter } from '../src/routing/assurance-routes';
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
  capabilities: string[] = ['runtime', 'records', 'api-index'],
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

function jsonHandler(request: Request, _env: Env, owner: string, rawRecordId?: string): Response {
  return new Response(JSON.stringify({
    owner,
    rawRecordId: rawRecordId ?? null,
    pathname: new URL(request.url).pathname,
  }), { headers: { 'content-type': 'application/json' } });
}

describe('declarative assurance routing', () => {
  it('discovers and routes a compatible new API family without a main-router change', async () => {
    const registry = registryWith(syntheticResource(
      'synthetic',
      'synthetic',
      { api: '/v1/assurance/synthetic', apiRecord: '/v1/assurance/synthetic/{id}' },
    ));
    const router = createAssuranceRouteRouter(registry, assuranceRouteCapabilities, jsonHandler);

    expect(router.registry.declarations.map((route) => route.pattern)).toContain('/v1/assurance/synthetic');
    expect(router.registry.declarations.map((route) => route.pattern)).toContain('/v1/assurance/synthetic/:id');

    const collection = await router.route(
      new Request('https://demo.wizardgang.ai/v1/assurance/synthetic'),
      env,
      '/v1/assurance/synthetic',
    );
    expect(collection?.status).toBe(200);
    expect(await collection?.json()).toMatchObject({ owner: 'synthetic', rawRecordId: null });

    const detail = await router.route(
      new Request('https://demo.wizardgang.ai/v1/assurance/synthetic/record-1'),
      env,
      '/v1/assurance/synthetic/record-1',
    );
    expect(await detail?.json()).toMatchObject({ owner: 'synthetic', rawRecordId: 'record-1' });
  });

  it('lets an exact registered collection outrank another family detail template', async () => {
    const registry = registryWith(
      syntheticResource('synthetic', 'synthetic', {
        api: '/v1/assurance/synthetic',
        apiRecord: '/v1/assurance/synthetic/{id}',
      }),
      syntheticResource('synthetic-special', 'synthetic-special', {
        api: '/v1/assurance/synthetic/special',
      }),
    );
    const router = createAssuranceRouteRouter(registry, assuranceRouteCapabilities, jsonHandler);

    const response = await router.route(
      new Request('https://demo.wizardgang.ai/v1/assurance/synthetic/special'),
      env,
      '/v1/assurance/synthetic/special',
    );
    expect(await response?.json()).toMatchObject({ owner: 'synthetic-special', rawRecordId: null });
  });

  it('preserves one-segment encoded record lookup and rejects longer unknown paths', async () => {
    const registry = registryWith(syntheticResource(
      'synthetic',
      'synthetic',
      { api: '/v1/assurance/synthetic', apiRecord: '/v1/assurance/synthetic/{id}' },
    ));
    const router = createAssuranceRouteRouter(registry, assuranceRouteCapabilities, jsonHandler);

    const encoded = await router.route(
      new Request('https://demo.wizardgang.ai/v1/assurance/synthetic/value%252Fencoded'),
      env,
      '/v1/assurance/synthetic/value%252Fencoded',
    );
    expect(await encoded?.json()).toMatchObject({ owner: 'synthetic', rawRecordId: 'value%252Fencoded' });

    expect(await router.route(
      new Request('https://demo.wizardgang.ai/v1/assurance/synthetic/value/extra'),
      env,
      '/v1/assurance/synthetic/value/extra',
    )).toBeUndefined();
  });

  it('fails closed when a registered HTML route has no specialized renderer', () => {
    const registry = registryWith(syntheticResource(
      'synthetic-html',
      'synthetic-html',
      { html: '/synthetic-assurance', api: '/v1/assurance/synthetic-html' },
    ));
    expect(() => createAssuranceRouteRouter(registry, assuranceRouteCapabilities, jsonHandler))
      .toThrow(/synthetic-html.*HTML|HTML.*synthetic-html/i);
  });

  it('rejects incomplete registered route capabilities before dispatch', () => {
    const registry = registryWith(syntheticResource(
      'synthetic-incomplete',
      'synthetic-incomplete',
      { api: '/v1/assurance/synthetic-incomplete' },
      ['runtime', 'api-index'],
    ));
    expect(() => createAssuranceRouteRouter(registry, assuranceRouteCapabilities, jsonHandler))
      .toThrow(/records capability/i);
  });
});
