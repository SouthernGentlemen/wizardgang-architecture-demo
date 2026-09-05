import type { Env } from '../types';
import { getDemoControl } from '../lib/demo-control';
import { json, methodNotAllowed } from '../lib/http';
import { interfaceIdentityCapabilities } from '../interfaces/route-capabilities';
import type {
  InterfaceIdentityCapability,
  InterfaceIdentityRouteContext,
  InterfaceIdentityRouteDeclaration,
} from '../interfaces/route-capability';
import {
  createRouteRegistry,
  defineRouteModule,
  matchRoute,
  type RouteRegistry,
} from './registry';

export interface InterfaceIdentityRouteRouter {
  registry: RouteRegistry<InterfaceIdentityRouteContext>;
  route(request: Request, env: Env, path: string): Promise<Response | undefined>;
}

function routeModules(capabilities: readonly InterfaceIdentityCapability[]) {
  return capabilities.map((capability) => defineRouteModule(capability.id, capability.routes));
}

function matchedRouteForPath(
  registry: RouteRegistry<InterfaceIdentityRouteContext>,
  path: string,
): InterfaceIdentityRouteDeclaration | undefined {
  const match = matchRoute(registry, 'GET', path);
  return match.status === 'not-found' ? undefined : match.route as InterfaceIdentityRouteDeclaration;
}

function acceptsHtml(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') || accept === '';
}

function wantsHtmlForRoute(request: Request, route: InterfaceIdentityRouteDeclaration): boolean {
  if (request.method !== 'GET') return false;
  if (route.browserHtml === 'never') return false;
  return acceptsHtml(request);
}

function offlineResponse(request: Request, route: InterfaceIdentityRouteDeclaration, message: string): Response {
  if (wantsHtmlForRoute(request, route)) {
    const url = new URL(request.url);
    const target = new URL('/offline', url.origin);
    target.searchParams.set('from', url.pathname);
    return Response.redirect(target.toString(), 302);
  }
  return json({ status: 'offline', message }, {
    status: 503,
    headers: { 'cache-control': 'no-store', 'retry-after': '60' },
  });
}

export function createInterfaceIdentityRouteRouter(
  capabilities: readonly InterfaceIdentityCapability[] = interfaceIdentityCapabilities,
): InterfaceIdentityRouteRouter {
  const registry = createRouteRegistry(routeModules(capabilities));
  return {
    registry,
    async route(request, env, path) {
      const match = matchRoute(registry, request.method, path);
      if (match.status === 'not-found') return undefined;

      const route = match.route as InterfaceIdentityRouteDeclaration;
      if (route.offline.mode === 'gated') {
        const control = await getDemoControl(env);
        if (control.state === 'offline') return offlineResponse(request, route, control.publicMessage);
      }

      if (match.status === 'method-not-allowed') return methodNotAllowed([...match.allowedMethods]);
      return route.handler(request, { env }, match.params);
    },
  };
}

export const interfaceIdentityRouteRouter = createInterfaceIdentityRouteRouter();
export const interfaceIdentityRouteRegistry = interfaceIdentityRouteRouter.registry;

export async function routeInterfaceIdentityRequest(
  request: Request,
  env: Env,
  path: string,
): Promise<Response | undefined> {
  return interfaceIdentityRouteRouter.route(request, env, path);
}

export function isInterfaceIdentityApiLike(path: string): boolean {
  const route = matchedRouteForPath(interfaceIdentityRouteRegistry, path);
  return route ? route.browserHtml !== 'page' : false;
}

export function interfaceIdentityWantsHtml(request: Request, path: string): boolean | undefined {
  const route = matchedRouteForPath(interfaceIdentityRouteRegistry, path);
  return route ? wantsHtmlForRoute(request, route) : undefined;
}
