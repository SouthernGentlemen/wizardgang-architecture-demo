import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_DB: {
    prepare: () => ({
      all: async () => ({
        results: [{
          state: 'online',
          public_message: 'Demo online.',
          updated_at: '2026-09-04T00:00:00.000Z',
          updated_by: 'test',
        }],
      }),
    }),
  },
} as unknown as Env;

describe('executable interface contracts', () => {
  it('keeps the OpenAPI document aligned with current assurance route shapes', () => {
    const openapi = JSON.parse(readFileSync('contracts/openapi/swagger.json', 'utf8')) as {
      basePath: string;
      paths: Record<string, { get?: { parameters?: Array<{ name: string }> } }>;
      definitions: Record<string, unknown>;
    };
    expect(openapi.basePath).toBe('/v1');
    for (const path of [
      '/assurance',
      '/assurance/evidence',
      '/assurance/compliance',
      '/assurance/compliance/{recordId}',
      '/assurance/risks',
      '/assurance/incidents',
      '/assurance/advisories',
    ]) expect(openapi.paths[path]?.get).toBeDefined();
    expect(openapi.definitions).toHaveProperty('AssuranceQueryResult');
    expect(openapi.definitions).toHaveProperty('AssuranceRegistryDiscovery');

    const riskParameters = openapi.paths['/assurance/risks'].get?.parameters?.map((parameter) => parameter.name) ?? [];
    expect(riskParameters).toContain('residual');
    expect(riskParameters).not.toContain('residualRating');
    expect(riskParameters).not.toContain('schemaVersion');
  });

  it('keeps generated route manifest coverage for documented assurance routes', () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{ route: string; methods: string[] }>;
    const routes = new Set(manifest.flatMap((entry) => entry.methods.map((method) => `${method} ${entry.route}`)));
    for (const route of [
      '/v1/assurance',
      '/v1/assurance/evidence',
      '/v1/assurance/compliance',
      '/v1/assurance/compliance/{recordId}',
      '/v1/assurance/risks',
      '/v1/assurance/incidents',
      '/v1/assurance/advisories',
    ]) expect(routes.has(`GET ${route}`)).toBe(true);
  });

  it('serves the current OpenAPI and assurance contracts through the router', async () => {
    const openapi = await routeRequest(new Request('https://demo.wizardgang.ai/v1/openapi.json'), env);
    expect(openapi.status).toBe(200);
    expect(openapi.headers.get('content-type')).toContain('application/json');
    const document = await openapi.json() as { paths: Record<string, unknown> };
    expect(document.paths).toHaveProperty('/assurance/risks');

    const assurance = await routeRequest(new Request('https://demo.wizardgang.ai/v1/assurance/risks?limit=1'), env);
    expect(assurance.status).toBe(200);
    const body = await assurance.json() as { contract: string; records: Array<{ id: string }> };
    expect(body.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(body.records).toHaveLength(1);
  });
});
