import type { Env } from './types';
import { renderNotFound } from './ui/page';
import type { AdminIdentity } from './lib/admin-auth';
import { requireAdmin, requireSameOrigin } from './lib/admin-auth';
import { getDemoControl } from './lib/demo-control';
import { readIdentitySession } from './lib/identity-session';
import { json, methodNotAllowed, safeError } from './lib/http';
import {
  crawlerBlockedResponse,
  getCrawlerControl,
  identifyOpenAIAgent,
} from './lib/crawler-control';
import {
  applicationRouteRegistry,
  type ApplicationRouteContext,
  type ApplicationRouteDeclaration,
} from './routing/application-routes';
import { matchRoute, normalizeRoutePath, type CachePolicy, type RouteMethod } from './routing/registry';

function cacheControl(policy: CachePolicy): string {
  if (policy.mode === 'no-store') return 'no-store';
  if (policy.mode === 'private') {
    return policy.maxAgeSeconds === undefined ? 'private' : `private, max-age=${policy.maxAgeSeconds}`;
  }
  return [
    'public',
    `max-age=${policy.maxAgeSeconds}`,
    ...(policy.staleWhileRevalidateSeconds === undefined
      ? []
      : [`stale-while-revalidate=${policy.staleWhileRevalidateSeconds}`]),
    ...(policy.immutable ? ['immutable'] : []),
  ].join(', ');
}

function applyResponsePolicy(response: Response, route: ApplicationRouteDeclaration): Response {
  const headers = new Headers(response.headers);
  headers.set('cache-control', cacheControl(route.cache));
  if (route.crawler.indexing === 'deny') headers.set('x-robots-tag', 'noindex, nofollow');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function crawlerPolicyFailure(
  request: Request,
  env: Env,
  route: ApplicationRouteDeclaration,
): Promise<Response | null> {
  if (route.crawler.crawling === 'allow') return null;
  const agent = identifyOpenAIAgent(request.headers.get('user-agent'));
  if (!agent) return null;
  if (route.crawler.crawling === 'deny' || agent === 'GPTBot') return crawlerBlockedResponse(agent);
  if ((await getCrawlerControl(env)).state === 'disabled') return crawlerBlockedResponse(agent);
  return null;
}

function acceptsHtml(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') || accept === '';
}

function offlineResponse(request: Request, route: ApplicationRouteDeclaration, message: string): Response {
  if (request.method === 'GET' && route.browserHtml !== 'never' && acceptsHtml(request)) {
    const url = new URL(request.url);
    const target = new URL('/offline', url.origin);
    target.searchParams.set('from', url.pathname);
    return Response.redirect(target.toString(), 302);
  }
  return json({ status: 'offline', message }, {
    status: 503,
    headers: {
      'cache-control': 'no-store',
      'retry-after': '60',
    },
  });
}

async function authenticateRoute(
  request: Request,
  env: Env,
  route: ApplicationRouteDeclaration,
): Promise<AdminIdentity | Response | undefined> {
  if (route.authentication.mode === 'anonymous') return undefined;
  if (route.authentication.provider === 'admin-basic') return requireAdmin(request, env);
  if (route.authentication.provider === 'identity-session') {
    if (await readIdentitySession(request, env)) return undefined;
    return json({ error: 'authentication_required' }, {
      status: 401,
      headers: { 'cache-control': 'no-store' },
    });
  }
  throw new Error(`Unsupported route authentication provider '${route.authentication.provider}' for ${route.id}`);
}

export async function routeRequest(request: Request, env: Env): Promise<Response> {
  try {
    return await routeRequestUnsafe(request, env);
  } catch (error) {
    return safeError(request, error);
  }
}

async function routeRequestUnsafe(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = normalizeRoutePath(url.pathname);
  const match = matchRoute(applicationRouteRegistry, request.method, path);

  if (match.status === 'not-found') return renderNotFound(env);
  const route = match.route as ApplicationRouteDeclaration;

  const crawlerFailure = await crawlerPolicyFailure(request, env, route);
  if (crawlerFailure) return crawlerFailure;

  if (route.offline.mode === 'gated') {
    const control = await getDemoControl(env);
    if (control.state === 'offline') return offlineResponse(request, route, control.publicMessage);
  }

  if (match.status === 'method-not-allowed') return methodNotAllowed([...match.allowedMethods]);

  const authentication = await authenticateRoute(request, env, route);
  if (authentication instanceof Response) return authentication;

  if (route.sameOrigin.mode === 'required' && route.sameOrigin.methods.includes(request.method as RouteMethod)) {
    const originFailure = requireSameOrigin(request);
    if (originFailure) return originFailure;
  }

  const context: ApplicationRouteContext = {
    env,
    ...(authentication ? { adminIdentity: authentication } : {}),
  };
  const response = await route.handler(request, context, match.params);
  return applyResponsePolicy(response, route);
}
