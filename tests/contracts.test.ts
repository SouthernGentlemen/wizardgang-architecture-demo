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
    expect(new URL(openapi.servers[0].url).pathname).toBe('/');

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

  it('references the canonical reporting schema without embedding a weaker copy', () => {
    const openapi = readOpenApi();
    const reporting = JSON.parse(readFileSync('contracts/assurance/reporting.schema.json', 'utf8')) as { $id: string };
    for (const duplicate of ['ReportingContract', 'AssuranceRegistryContract', 'AssuranceQueryResult']) {
      expect(openapi.components.schemas).not.toHaveProperty(duplicate);
    }
    const reference = (openapi.paths['/api/reporting/{collection}'].get.responses?.['200'] as { content?: { 'application/json'?: { schema?: { $ref?: string } } } })
      .content?.['application/json']?.schema?.$ref;
    expect(reference).toBe(`${reporting.$id}#/$defs/queryResult`);
    expect(existsSync('contracts/openapi/swagger.json')).toBe(false);
  });

  it('documents only the canonical reporting and operations API families', () => {
    const openapi = readOpenApi();
    for (const path of [
      '/api/reporting',
      '/api/reporting/{collection}',
      '/api/reporting/{collection}/{recordId}',
      '/api/operations/health',
      '/api/operations/version',
      '/api/operations/logs',
      '/api/operations/budget',
      '/api/openapi.json',
    ]) expect(openapi.paths[path]).toBeDefined();

    expect(openapi.paths['/api/reporting/{collection}'].get).toBeDefined();
    expect(openapi.paths['/api/reporting/{collection}/{recordId}'].get).toBeDefined();
    expect(openapi.paths['/api/reporting/{collection}/{recordId}'].patch).toBeDefined();
    const reportingParameters = openapi.paths['/api/reporting/{collection}'].get?.parameters?.map((parameter) => parameter.name) ?? [];
    expect(reportingParameters).toContain('residual');
    expect(reportingParameters).not.toContain('residualRating');
    expect(reportingParameters).not.toContain('schemaVersion');

    for (const path of Object.keys(openapi.paths)) {
      expect(path.startsWith('/assurance')).toBe(false);
      expect(path.startsWith('/__api/operations')).toBe(false);
      expect(path).not.toBe('/health');
      expect(path).not.toBe('/version');
      expect(path).not.toBe('/api/operations/usage');
    }
  });

  it('serves the current OpenAPI and reporting contracts through the router', async () => {
    const openapi = await routeRequest(new Request('https://demo.wizardgang.ai/api/openapi.json'), env);
    expect(openapi.status).toBe(200);
    expect(openapi.headers.get('content-type')).toContain('application/json');
    const document = await openapi.json() as { openapi: string; paths: Record<string, unknown> };
    expect(document.openapi).toBe('3.1.0');
    expect(document.paths).toHaveProperty('/api/reporting/{collection}');
    expect(document.paths).toHaveProperty('/api/operations/health');

    const reporting = await routeRequest(new Request('https://demo.wizardgang.ai/api/reporting/risks?limit=1'), env);
    expect(reporting.status).toBe(200);
    const body = await reporting.json() as { contract: string; records: Array<{ id: string }> };
    expect(body.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(body.records).toHaveLength(1);
  });
});
