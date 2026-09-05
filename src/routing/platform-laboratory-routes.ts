import type { Env } from '../types';
import { requireSameOrigin } from '../lib/admin-auth';
import { methodNotAllowed } from '../lib/http';
import { platformLaboratoryCapabilities } from '../platform/route-capabilities';
import type { PlatformLaboratoryCapability } from '../platform/route-capability';
import {
  createRouteRegistry,
  defineRouteModule,
  matchRoute,
  type CachePolicy,
  type RouteDeclaration,
  type RouteMethod,
} from './registry';

function cacheControl(policy: CachePolicy): string {
  if (policy.mode === 'no-store') return 'no-store';
  if (policy.mode === 'private') {
    return policy.maxAgeSeconds === undefined ? 'private' : `private, max-age=${policy.maxAgeSeconds}`;
  }
  return [
    'public',
    `max-age=${policy.maxAgeSeconds}`,
    ...(policy.staleWhileRevalidateSeconds === undefined ? [] : [`stale-while-revalidate=${policy.staleWhileRevalidateSeconds}`]),
    ...(policy.immutable ? ['immutable'] : []),
  ].join(', ');
}

function applyResponsePolicy(response: Response, route: RouteDeclaration<Env>): Response {
  const headers = new Headers(response.headers);
  if (!headers.has('cache-control')) headers.set('cache-control', cacheControl(route.cache));
  if (route.kind === 'page' && route.crawler.indexing === 'deny') {
    headers.set('x-robots-tag', 'noindex, nofollow');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function createPlatformLaboratoryRouteRouter(
  capabilities: readonly PlatformLaboratoryCapability[] = platformLaboratoryCapabilities,
) {
  const registry = createRouteRegistry(
    capabilities.map((capability) => defineRouteModule<Env>(capability.id, capability.routes)),
  );

  return {
    registry,
    async route(request: Request, env: Env, path: string): Promise<Response | undefined> {
      const match = matchRoute(registry, request.method, path);
      if (match.status === 'not-found') return undefined;
      if (match.status === 'method-not-allowed') return methodNotAllowed([...match.allowedMethods]);

      const route = match.route;
      if (route.sameOrigin.mode === 'required' && route.sameOrigin.methods.includes(request.method as RouteMethod)) {
        const originFailure = requireSameOrigin(request);
        if (originFailure) return originFailure;
      }

      const response = await route.handler(request, env, match.params);
      return applyResponsePolicy(response, route);
    },
  };
}

export const platformLaboratoryRouter = createPlatformLaboratoryRouteRouter();
export const platformLaboratoryRouteRegistry = platformLaboratoryRouter.registry;

export async function routePlatformLaboratoryRequest(
  request: Request,
  env: Env,
  path: string,
): Promise<Response | undefined> {
  return platformLaboratoryRouter.route(request, env, path);
}
