import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('public machine contracts', () => {
  it('keeps the Swagger 2.0 contract aligned to implemented REST routes', () => {
    const contract = JSON.parse(readFileSync('contracts/openapi/swagger.json', 'utf8')) as { swagger: string; basePath: string; paths: Record<string, unknown>; securityDefinitions: Record<string, unknown> };
    const router = readFileSync('src/router.ts', 'utf8');
    expect(contract.swagger).toBe('2.0');
    expect(contract.basePath).toBe('/v1');
    for (const path of Object.keys(contract.paths)) expect(router).toContain(`/v1${path}`.replace('/{key}', '/'));
    expect(contract.securityDefinitions).toHaveProperty('BearerToken');
  });

  it('keeps GraphQL, MCP, and webhook contracts marked executable', () => {
    const graphql = readFileSync('contracts/graphql/schema.graphql', 'utf8');
    expect(graphql).toContain('demoRecords');
    expect(graphql).toContain('createUser');
    expect(JSON.parse(readFileSync('contracts/mcp/tools.json', 'utf8')).status).toBe('working');
    expect(JSON.parse(readFileSync('contracts/webhooks/events.json', 'utf8')).status).toBe('working');
  });
});
