import type { Env } from '../types';
import type { AdminIdentity } from '../lib/admin-auth';
import { requireAdmin, requireSameOrigin } from '../lib/admin-auth';
import { getDemoControl, setDemoControl } from '../lib/demo-control';
import {
  crawlerBlockedResponse,
  getCrawlerControl,
  identifyOpenAIAgent,
  robotsResponse,
  setCrawlerControl,
} from '../lib/crawler-control';
import { json, methodNotAllowed } from '../lib/http';
import { healthResponse, versionResponse, logsResponse, cloudflareUsageResponse } from '../api/operations';
import { billingScenarioResponse } from '../api/billing';
import { securityTxtResponse } from '../api/security-policy';
import { sitemapResponse } from '../api/sitemap';
import { socialCardResponse } from '../ui/brand-assets';
import { renderAdmin, renderOffline } from '../ui/admin';
import { renderBilling, renderDashboard, renderDocs, renderUptime } from '../demos/operations-pages';
import { renderLogsDemo } from '../demos/logs';
import { demos } from '../demos/registry';
import {
  createRouteRegistry,
  defineRouteModule,
  matchRoute,
  type CachePolicy,
  type RouteDeclaration,
  type RouteHandler,
  type RouteKind,
  type RouteMethod,
} from './registry';

export interface OperationalRouteContext {
  env: Env;
  adminIdentity?: AdminIdentity;
}

interface OperationalRouteInput {
  id: string;
  pattern: string;
  methods: readonly RouteMethod[];
  kind: RouteKind;
  handler: RouteHandler<OperationalRouteContext>;
  title: string;
  description: string;
  sourceModule: string;
  sourceExport: string;
  offline?: 'available' | 'gated';
  cache?: CachePolicy;
  crawling?: 'allow' | 'deny' | 'controlled';
  indexing?: 'allow' | 'deny';
  visibility?: 'public' | 'private';
  authentication?: RouteDeclaration<OperationalRouteContext>['authentication'];
  authorization?: RouteDeclaration<OperationalRouteContext>['authorization'];
  sameOrigin?: RouteDeclaration<OperationalRouteContext>['sameOrigin'];
}

const POLICY_TEST = 'tests/operational-route-registry.test.ts';

function operationalRoute(input: OperationalRouteInput): RouteDeclaration<OperationalRouteContext> {
  return {
    id: input.id,
    pattern: input.pattern,
    methods: input.methods,
    kind: input.kind,
    handler: input.handler,
    authentication: input.authentication ?? { mode: 'anonymous' },
    authorization: input.authorization ?? { mode: 'none' },
    visibility: input.visibility ?? 'public',
    sameOrigin: input.sameOrigin ?? { mode: 'not-required' },
    offline: { mode: input.offline ?? 'available' },
    cache: input.cache ?? { mode: 'no-store' },
    crawler: {
      crawling: input.crawling ?? 'controlled',
      indexing: input.indexing ?? 'deny',
    },
    documentation: {
      title: input.title,
      description: input.description,
      docs: ['docs/ROUTES.md', 'docs/OPERATIONS.md', 'docs/ROUTE-REGISTRY.md'],
    },
    source: {
      module: input.sourceModule,
      exportName: input.sourceExport,
      tests: [POLICY_TEST, 'tests/router.test.ts'],
    },
  };
}

async function adminHandler(request: Request, context: OperationalRouteContext): Promise<Response> {
  const { env, adminIdentity } = context;
  if (!adminIdentity) throw new Error('Admin route executed without an authenticated identity');
  const url = new URL(request.url);

  if (request.method === 'POST') {
    const form = await request.formData();
    const requestedControl = form.get('control');
    if (requestedControl === 'chatgpt-crawl') {
      const requestedState = form.get('state');
      if (requestedState !== 'enabled' && requestedState !== 'disabled') {
        return json({ error: 'invalid_crawler_state' }, { status: 400, headers: { 'cache-control': 'no-store' } });
      }
      await setCrawlerControl(env, requestedState, adminIdentity.username);
      const location = new URL('/admin', url.origin);
      location.searchParams.set('changed', `chatgpt-crawl-${requestedState}`);
      location.hash = 'chatgpt-crawl';
      return new Response(null, { status: 303, headers: { location: location.toString(), 'cache-control': 'no-store' } });
    }
    if (requestedControl !== null && requestedControl !== 'demo') {
      return json({ error: 'invalid_admin_control' }, { status: 400, headers: { 'cache-control': 'no-store' } });
    }
    const state = form.get('state') === 'offline' ? 'offline' : 'online';
    const fallback = state === 'offline' ? 'The demo is temporarily unavailable.' : 'The architecture demo is available.';
    const message = String(form.get('message') || fallback).trim().slice(0, 500) || fallback;
    await setDemoControl(env, state, message, adminIdentity.username);
    const location = new URL('/admin', url.origin);
    location.searchParams.set('changed', state);
    return new Response(null, { status: 303, headers: { location: location.toString(), 'cache-control': 'no-store' } });
  }

  const changed = url.searchParams.get('changed');
  const [demoControl, crawlerControl] = await Promise.all([getDemoControl(env), getCrawlerControl(env)]);
  const notice = changed === 'online' || changed === 'offline'
    ? `Demo is now ${changed}.`
    : changed === 'chatgpt-crawl-enabled' || changed === 'chatgpt-crawl-disabled'
      ? `ChatGPT crawl access is now ${changed.endsWith('enabled') ? 'enabled' : 'disabled'}.`
      : '';
  return renderAdmin(env, demoControl, crawlerControl, notice);
}

const globalOperationalRoutes = [
  operationalRoute({
    id: 'operations.admin', pattern: '/admin', methods: ['GET', 'POST'], kind: 'page', handler: adminHandler,
    title: 'Demo administration', description: 'Protected control surface for demo availability and ChatGPT fetch policy.',
    sourceModule: 'src/ui/admin.ts', sourceExport: 'renderAdmin', visibility: 'private', crawling: 'allow', indexing: 'deny',
    authentication: { mode: 'required', provider: 'admin-basic' }, authorization: { mode: 'policy', policy: 'admin' },
    sameOrigin: { mode: 'required', methods: ['POST'] },
  }),
  operationalRoute({
    id: 'operations.offline', pattern: '/offline', methods: ['GET'], kind: 'page',
    handler: async (request, { env }) => renderOffline(env, await getDemoControl(env), new URL(request.url).searchParams.get('from') || '/'),
    title: 'Offline recovery page', description: 'Public maintenance page shown when ordinary demo routes are intentionally offline.',
    sourceModule: 'src/ui/admin.ts', sourceExport: 'renderOffline', indexing: 'deny',
  }),
  operationalRoute({
    id: 'operations.health', pattern: '/health', methods: ['GET'], kind: 'api', handler: (_request, { env }) => healthResponse(env),
    title: 'Health', description: 'Machine-readable runtime and dependency health.',
    sourceModule: 'src/api/operations.ts', sourceExport: 'healthResponse',
  }),
  operationalRoute({
    id: 'operations.version', pattern: '/version', methods: ['GET'], kind: 'api', handler: (_request, { env }) => versionResponse(env),
    title: 'Version', description: 'Machine-readable deployed version and source metadata.',
    sourceModule: 'src/api/operations.ts', sourceExport: 'versionResponse',
  }),
  operationalRoute({
    id: 'operations.robots', pattern: '/robots.txt', methods: ['GET', 'HEAD'], kind: 'protocol',
    handler: async (request, { env }) => robotsResponse(request, await getCrawlerControl(env)),
    title: 'Robots policy', description: 'Dynamic crawler policy preserving ChatGPT fetch controls and GPTBot opt-out.',
    sourceModule: 'src/lib/crawler-control.ts', sourceExport: 'robotsResponse', crawling: 'allow',
  }),
  operationalRoute({
    id: 'operations.security-txt', pattern: '/.well-known/security.txt', methods: ['GET', 'HEAD'], kind: 'protocol',
    handler: (request, { env }) => securityTxtResponse(request, env),
    title: 'Security contact', description: 'RFC 9116 vulnerability-reporting contact and policy metadata.',
    sourceModule: 'src/api/security-policy.ts', sourceExport: 'securityTxtResponse', crawling: 'allow',
    cache: { mode: 'public', maxAgeSeconds: 3600 },
  }),
  operationalRoute({
    id: 'operations.social-card', pattern: '/og.png', methods: ['GET', 'HEAD'], kind: 'asset',
    handler: (request) => socialCardResponse(request), title: 'Social preview image', description: 'Branded Open Graph preview asset.',
    sourceModule: 'src/ui/brand-assets.ts', sourceExport: 'socialCardResponse',
    cache: { mode: 'public', maxAgeSeconds: 31_536_000, immutable: true },
  }),
  operationalRoute({
    id: 'operations.sitemap', pattern: '/sitemap.xml', methods: ['GET'], kind: 'protocol',
    handler: (request) => sitemapResponse(request, demos), title: 'Sitemap', description: 'Registry-generated public sitemap.',
    sourceModule: 'src/api/sitemap.ts', sourceExport: 'sitemapResponse', offline: 'gated',
    cache: { mode: 'public', maxAgeSeconds: 3600 },
  }),
  operationalRoute({
    id: 'operations.dashboard', pattern: '/dashboard', methods: ['GET'], kind: 'page', handler: (request, { env }) => renderDashboard(env, request),
    title: 'Operations dashboard', description: 'Read-only operations center for runtime, availability, delivery, usage, and assurance.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'renderDashboard', indexing: 'allow',
  }),
  operationalRoute({
    id: 'operations.dashboard-uptime', pattern: '/dashboard/uptime', methods: ['GET'], kind: 'page', handler: (_request, { env }) => renderUptime(env),
    title: 'Availability history', description: 'Scheduled availability and planned-maintenance history.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'renderUptime', indexing: 'allow',
  }),
  operationalRoute({
    id: 'operations.dashboard-docs', pattern: '/dashboard/docs', methods: ['GET'], kind: 'page', handler: (_request, { env }) => renderDocs(env),
    title: 'Operations documentation', description: 'Documentation index for the live architecture demo.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'renderDocs', indexing: 'allow',
  }),
  operationalRoute({
    id: 'operations.dashboard-billing', pattern: '/dashboard/billing', methods: ['GET'], kind: 'page', handler: (_request, { env }) => renderBilling(env),
    title: 'Usage and cost', description: 'Cloudflare usage, cost evidence, and guardrail simulator.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'renderBilling', indexing: 'allow',
  }),
  operationalRoute({
    id: 'operations.dashboard-logs', pattern: '/dashboard/logs', methods: ['GET'], kind: 'page', handler: (request, { env }) => renderLogsDemo(request, env),
    title: 'Operations logs', description: 'Public-safe application log viewer.',
    sourceModule: 'src/demos/logs.ts', sourceExport: 'renderLogsDemo', indexing: 'allow',
  }),
  operationalRoute({
    id: 'operations.api-logs', pattern: '/__api/operations/logs', methods: ['GET'], kind: 'api', handler: (request, { env }) => logsResponse(request, env),
    title: 'Operations logs API', description: 'Sanitized application log query endpoint.',
    sourceModule: 'src/api/operations.ts', sourceExport: 'logsResponse',
  }),
  operationalRoute({
    id: 'operations.api-cloudflare-usage', pattern: '/__api/operations/cloudflare-usage', methods: ['GET'], kind: 'api', handler: (request, { env }) => cloudflareUsageResponse(request, env),
    title: 'Cloudflare usage API', description: 'Sanitized cached Cloudflare usage telemetry.',
    sourceModule: 'src/api/operations.ts', sourceExport: 'cloudflareUsageResponse',
  }),
  operationalRoute({
    id: 'operations.api-billing', pattern: '/__api/operations/billing', methods: ['POST'], kind: 'api', handler: (request, { env }) => billingScenarioResponse(request, env),
    title: 'Billing scenario API', description: 'Synthetic budget scenario control used by the operations demo.',
    sourceModule: 'src/api/billing.ts', sourceExport: 'billingScenarioResponse',
  }),
] as const;

export const operationalRouteModule = defineRouteModule('operations', globalOperationalRoutes);
export const operationalRouteRegistry = createRouteRegistry([operationalRouteModule]);

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

function applyResponsePolicy(response: Response, route: RouteDeclaration<OperationalRouteContext>): Response {
  const headers = new Headers(response.headers);
  headers.set('cache-control', cacheControl(route.cache));
  if (route.kind === 'page' && route.crawler.indexing === 'deny') {
    headers.set('x-robots-tag', 'noindex, nofollow');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function crawlerPolicyFailure(
  request: Request,
  env: Env,
  route: RouteDeclaration<OperationalRouteContext>,
): Promise<Response | null> {
  if (route.crawler.crawling === 'allow') return null;
  const agent = identifyOpenAIAgent(request.headers.get('user-agent'));
  if (!agent) return null;
  if (route.crawler.crawling === 'deny' || agent === 'GPTBot') return crawlerBlockedResponse(agent);
  if ((await getCrawlerControl(env)).state === 'disabled') return crawlerBlockedResponse(agent);
  return null;
}

function offlineResponse(request: Request, route: RouteDeclaration<OperationalRouteContext>, message: string): Response {
  const accept = request.headers.get('accept') || '';
  const browserHtml = request.method === 'GET'
    && route.kind !== 'api'
    && (accept.includes('text/html') || accept === '');
  if (browserHtml) {
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

async function authorizeRoute(
  request: Request,
  env: Env,
  route: RouteDeclaration<OperationalRouteContext>,
): Promise<AdminIdentity | Response | undefined> {
  if (route.authentication.mode === 'anonymous') return undefined;
  if (route.authentication.provider !== 'admin-basic' || route.authorization.mode !== 'policy' || route.authorization.policy !== 'admin') {
    throw new Error(`Unsupported operational route authorization policy for ${route.id}`);
  }
  return requireAdmin(request, env);
}

export async function routeOperationalRequest(request: Request, env: Env, path: string): Promise<Response | undefined> {
  const match = matchRoute(operationalRouteRegistry, request.method, path);
  if (match.status === 'not-found') return undefined;
  const route = match.route;

  const authorization = await authorizeRoute(request, env, route);
  if (authorization instanceof Response) return authorization;

  const crawlerFailure = await crawlerPolicyFailure(request, env, route);
  if (crawlerFailure) return crawlerFailure;

  if (route.offline.mode === 'gated') {
    const control = await getDemoControl(env);
    if (control.state === 'offline') return offlineResponse(request, route, control.publicMessage);
  }

  if (match.status === 'method-not-allowed') return methodNotAllowed([...match.allowedMethods]);

  if (route.sameOrigin.mode === 'required' && route.sameOrigin.methods.includes(request.method as RouteMethod)) {
    const originFailure = requireSameOrigin(request);
    if (originFailure) return originFailure;
  }

  const response = await route.handler(request, { env, adminIdentity: authorization }, match.params);
  return applyResponsePolicy(response, route);
}
