import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry } from '../src/routing/application-routes';
import { matchRoute } from '../src/routing/registry';

const removedRoutes = [
  ['GET', '/v1/assurance'],
  ['GET', '/v1/assurance/evidence'],
  ['GET', '/v1/assurance/compliance'],
  ['GET', '/v1/assurance/compliance/ISO-27001-A.5.1'],
  ['GET', '/v1/assurance/risks'],
  ['GET', '/v1/assurance/incidents'],
  ['GET', '/v1/assurance/advisories'],
  ['GET', '/__api/git/evidence'],
  ['POST', '/__api/git/evidence'],
  ['GET', '/__api/operations/logs'],
  ['GET', '/__api/operations/cloudflare-usage'],
  ['POST', '/__api/operations/billing'],
  ['GET', '/health'],
  ['GET', '/version'],
  ['GET', '/v1/openapi.json'],
] as const;

describe('removed reporting and operations API routes', () => {
  for (const [method, path] of removedRoutes) {
    it(`${method} ${path} is not registered`, () => {
      expect(matchRoute(applicationRouteRegistry, method, path)).toEqual({ status: 'not-found', statusCode: 404 });
    });
  }

  it('does not retain a catch-all assurance API', () => {
    expect(matchRoute(applicationRouteRegistry, 'GET', '/v1/assurance/anything-else')).toEqual({
      status: 'not-found',
      statusCode: 404,
    });
  });

  it('does not retain a catch-all operations API', () => {
    expect(matchRoute(applicationRouteRegistry, 'GET', '/__api/operations/anything-else')).toEqual({
      status: 'not-found',
      statusCode: 404,
    });
  });
});
