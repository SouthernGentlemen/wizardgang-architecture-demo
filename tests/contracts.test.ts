import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry } from '../src/routing/application-routes';
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

type OpenApiOperation = {
  parameters?: Array<{ name?: string }>;
  responses?: Record<string, unknown>;
  'x-route-id'?: string;
};

type OpenApiDocument = {
  openapi: string;
  servers: Array<{ url: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: {
    schemas: Record<string, unknown>;
  };
};

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']);

function readOpenApi(): OpenApiDocument {
  return JSON.parse(readFileSync('contracts/openapi/openapi.json', 'utf8')) as OpenApiDocument;
}

function documentedRegistryPattern(openapi: OpenApiDocument, path: string): string {
  const basePath = new URL(openapi.servers[0].url).pathname.replace(/\/$/, '');
  return `${basePath}${path}`.replace(/\{([^}]+)\}/g, ':$1').replace(/\/+/g, '/');
}

describe('executable interface contracts', () => {
  it('maps every documented OpenAPI operation directly to the application route registry', () => {
    const openapi = readOpenApi();
    expect(openapi.openapi).toBe('3.1.0');

    for (const [path, pathItem] of Object.entries(openapi.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.has(method.toLowerCase())) continue;
        const routeId = operation['x-route-id'];
        expect(routeId, `${method.toUpperCase()} ${path} must declare x-route-id`).toBeTruthy();
        const route = applicationRouteRegistry.declarations.find((candidate) => candidate.id === routeId);
        expect(route, `${method.toUpperCase()} ${path} must reference a registered route ID`).toBeDefined();
        expect(route?.pattern, `${routeId} must own the documented path`).toBe(documentedRegistryPattern(openapi, path));
        expect(route?.methods, `${routeId} must own ${method.toUpperCase()}`).toContain(method.toUpperCase());
      }
    }
  });

  it('embeds the canonical assurance reporting schemas without drift', () => {
    const openapi = readOpenApi();
    const reporting = JSON.parse(readFileSync('contracts/assurance/reporting.schema.json', 'utf8')) as unknown;
    const registry = JSON.parse(readFileSync('contracts/assurance/registry.schema.json', 'utf8')) as unknown;

    expect(openapi.components.schemas.ReportingContract).toEqual(reporting);
    expect(openapi.components.schemas.AssuranceRegistryContract).toEqual(registry);
    expect(openapi.components.schemas.AssuranceQueryResult).toEqual({
      $ref: '#/components/schemas/ReportingContract/$defs/queryResult',
    });
    expect(existsSync('contracts/openapi/swagger.json')).toBe(false);
  });

  it('keeps current assurance query shapes in the OpenAPI document', () => {
    const openapi = readOpenApi();
    for (const path of [
      '/assurance',
      '/assurance/evidence',
      '/assurance/compliance',
      '/assurance/compliance/{recordId}',
      '/assurance/risks',
      '/assurance/incidents',
      '/assurance/advisories',
    ]) expect(openapi.paths[path]?.get).toBeDefined();

    const riskParameters = openapi.paths['/assurance/risks'].get?.parameters?.map((parameter) => parameter.name) ?? [];
    expect(riskParameters).toContain('residual');
    expect(riskParameters).not.toContain('residualRating');
    expect(riskParameters).not.toContain('schemaVersion');
  });

  it('serves the current OpenAPI and assurance contracts through the router', async () => {
    const openapi = await routeRequest(new Request('https://demo.wizardgang.ai/v1/openapi.json'), env);
    expect(openapi.status).toBe(200);
    expect(openapi.headers.get('content-type')).toContain('application/json');
    const document = await openapi.json() as { openapi: string; paths: Record<string, unknown> };
    expect(document.openapi).toBe('3.1.0');
    expect(document.paths).toHaveProperty('/assurance/risks');

    const assurance = await routeRequest(new Request('https://demo.wizardgang.ai/v1/assurance/risks?limit=1'), env);
    expect(assurance.status).toBe(200);
    const body = await assurance.json() as { contract: string; records: Array<{ id: string }> };
    expect(body.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(body.records).toHaveLength(1);
  });
});
