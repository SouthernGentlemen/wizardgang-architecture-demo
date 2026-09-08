import type { Env } from '../types';
import type { AdminIdentity } from '../lib/admin-auth';
import { getDemoControl, setDemoControl } from '../lib/demo-control';
import {
  getCrawlerControl,
  robotsResponse,
  setCrawlerControl,
} from '../lib/crawler-control';
import { json } from '../lib/http';
import { healthResponse, versionResponse, logsResponse } from '../api/operations';
import { billingScenarioResponse } from '../api/billing';
import { securityTxtResponse } from '../api/security-policy';
import { sitemapResponse } from '../api/sitemap';
import { uiAssetResponse } from '../ui/assets';
import {
  createRouteRegistry,
  defineRouteModule,
  type CachePolicy,
  type RouteDeclaration,
  type RouteHandler,
  type RouteKind,
  type RouteMethod,
} from './registry';
import type { PageMetadata } from './application-routes';

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
  page?: PageMetadata;
}

const POLICY_TEST = 'tests/operational-route-registry.test.ts';

function operationalRoute(input: OperationalRouteInput): RouteDeclaration<OperationalRouteContext> & { page?: PageMetadata } {
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
    ...(input.page ? { page: input.page } : {}),
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
  const { renderAdmin } = await import('../ui/admin');
  return renderAdmin(env, demoControl, crawlerControl, notice);
}

const globalOperationalRoutes = [
  operationalRoute({
    id: 'operations.admin', pattern: '/admin', methods: ['GET', 'POST'], kind: 'page', handler: adminHandler,
    title: 'Demo administration', description: 'Protected control surface for demo availability and ChatGPT fetch policy.',
    sourceModule: 'src/ui/admin.ts', sourceExport: 'renderAdmin', visibility: 'private', crawling: 'allow', indexing: 'deny',
    authentication: { mode: 'required', provider: 'admin-basic' }, authorization: { mode: 'policy', policy: 'admin' },
    sameOrigin: { mode: 'required', methods: ['POST'] },
    page: {
      parent: 'operations.index',
      label: 'Demo administration',
      summary: 'Protected control surface for demo availability and ChatGPT fetch policy.',
      order: 0,
      navigation: 'none',
      architectureMap: false,
    },
  }),
  operationalRoute({
    id: 'operations.offline', pattern: '/offline', methods: ['GET'], kind: 'page',
    handler: async (request, { env }) => {
      const { renderOffline } = await import('../ui/admin');
      return renderOffline(env, await getDemoControl(env), new URL(request.url).searchParams.get('from') || '/');
    },
    title: 'Offline recovery page', description: 'Public maintenance page shown when ordinary demo routes are intentionally offline.',
    sourceModule: 'src/ui/admin.ts', sourceExport: 'renderOffline', indexing: 'deny',
    page: {
      parent: 'operations.index',
      label: 'Offline recovery page',
      summary: 'Public maintenance page shown when ordinary demo routes are intentionally offline.',
      order: 1,
      navigation: 'none',
      architectureMap: false,
    },
  }),
  operationalRoute({
    id: 'operations.health', pattern: '/api/operations/health', methods: ['GET'], kind: 'api', handler: (_request, { env }) => healthResponse(env),
    title: 'Operations health', description: 'Machine-readable runtime and dependency health.',
    sourceModule: 'src/api/operations.ts', sourceExport: 'healthResponse',
  }),
  operationalRoute({
    id: 'operations.version', pattern: '/api/operations/version', methods: ['GET'], kind: 'api', handler: (_request, { env }) => versionResponse(env),
    title: 'Operations version', description: 'Machine-readable deployed version and source metadata.',
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
    id: 'operations.assets', pattern: '/assets/:asset', methods: ['GET', 'HEAD'], kind: 'asset',
    handler: (request, _context, params) => uiAssetResponse(request, params.asset || ''), title: 'Bundled UI asset', description: 'Locally bundled immutable UI and social-preview assets.',
    sourceModule: 'src/ui/assets.ts', sourceExport: 'uiAssetResponse',
    cache: { mode: 'public', maxAgeSeconds: 31_536_000, immutable: true },
  }),
  operationalRoute({
    id: 'operations.sitemap', pattern: '/sitemap.xml', methods: ['GET'], kind: 'protocol',
    handler: (request) => sitemapResponse(request), title: 'Sitemap', description: 'Registry-generated public sitemap.',
    sourceModule: 'src/api/sitemap.ts', sourceExport: 'sitemapResponse', offline: 'gated',
    cache: { mode: 'public', maxAgeSeconds: 3600 },
  }),
  operationalRoute({
    id: 'operations.index', pattern: '/operations', methods: ['GET'], kind: 'page', handler: async (request, { env }) => {
      const [{ dashboardContent }, { operationsPageContent }, { renderNotFound, renderPage }] = await Promise.all([
        import('../demos/operations-pages'),
        import('../demos/operations'),
        import('../ui/page'),
      ]);
      if (new URL(request.url).searchParams.has('view')) return renderNotFound(env);
      return renderPage(env, operationsPageContent(await dashboardContent(env, request), 'operations.index'));
    },
    title: 'Operations', description: 'Canonical operations index for live health, availability, public-safe logs, usage, reporting, and documentation.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'dashboardContent', indexing: 'allow', offline: 'available',
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Operations',
      summary: 'Live health, availability, public-safe logs, usage and cost, shared reporting, deployment evidence, and documentation.',
      order: 4,
      navigation: 'primary',
      architectureMap: true,
    },
  }),
  operationalRoute({
    id: 'operations.availability', pattern: '/operations/availability', methods: ['GET'], kind: 'page', handler: async (_request, { env }) => {
      const [{ uptimeContent }, { operationsPageContent }, { renderPage }] = await Promise.all([
        import('../demos/operations-pages'), import('../demos/operations'), import('../ui/page'),
      ]);
      return renderPage(env, operationsPageContent(await uptimeContent(env), 'operations.availability'));
    },
    title: 'Operations availability', description: 'Measured availability history with planned maintenance separated from unexpected failures.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'uptimeContent', indexing: 'allow', offline: 'available',
    page: {
      parent: 'operations.index', label: 'Availability',
      summary: 'Measured availability history with planned maintenance separated from unexpected failures.',
      order: 0, navigation: 'secondary', architectureMap: false,
    },
  }),
  operationalRoute({
    id: 'operations.logs', pattern: '/operations/logs', methods: ['GET'], kind: 'page', handler: async (request, { env }) => {
      const [{ logsContent }, { operationsPageContent }, { renderPage }] = await Promise.all([
        import('../demos/logs'), import('../demos/operations'), import('../ui/page'),
      ]);
      return renderPage(env, operationsPageContent(await logsContent(request, env), 'operations.logs'));
    },
    title: 'Operations logs', description: 'Public-safe application log viewer with bounded filtering and request correlation.',
    sourceModule: 'src/demos/logs.ts', sourceExport: 'logsContent', indexing: 'allow', offline: 'available',
    page: {
      parent: 'operations.index', label: 'Logs',
      summary: 'Public-safe application log viewer with bounded filtering and request correlation.',
      order: 1, navigation: 'secondary', architectureMap: false,
    },
  }),
  operationalRoute({
    id: 'operations.usage', pattern: '/operations/usage', methods: ['GET'], kind: 'page', handler: async (_request, { env }) => {
      const [{ billingContent }, { operationsPageContent }, { renderPage }] = await Promise.all([
        import('../demos/operations-pages'), import('../demos/operations'), import('../ui/page'),
      ]);
      return renderPage(env, operationsPageContent(await billingContent(env), 'operations.usage'));
    },
    title: 'Operations usage and cost', description: 'Live Cloudflare resource consumption with controlled cost-degradation scenarios.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'billingContent', indexing: 'allow', offline: 'available',
    page: {
      parent: 'operations.index', label: 'Usage & cost',
      summary: 'Live Cloudflare resource consumption with controlled cost-degradation scenarios.',
      order: 2, navigation: 'secondary', architectureMap: false,
    },
  }),
  operationalRoute({
    id: 'operations.reports', pattern: '/operations/reports', methods: ['GET'], kind: 'page', handler: async (request, { env }) => {
      const [{ reportsContent, operationsPageContent }, { renderPage }] = await Promise.all([
        import('../demos/operations'), import('../ui/page'),
      ]);
      return renderPage(env, operationsPageContent(await reportsContent(request, env), 'operations.reports'));
    },
    title: 'Operations reports', description: 'Shared operational and assurance reporting through the canonical reporting presenter.',
    sourceModule: 'src/demos/operations.ts', sourceExport: 'reportsContent', indexing: 'allow', offline: 'available',
    page: {
      parent: 'operations.index', label: 'Reports',
      summary: 'Shared operational and assurance reporting through the canonical reporting presenter.',
      order: 3, navigation: 'secondary', architectureMap: false,
    },
  }),
  operationalRoute({
    id: 'operations.docs', pattern: '/operations/docs', methods: ['GET'], kind: 'page', handler: async (_request, { env }) => {
      const [{ docsContent }, { operationsPageContent }, { renderPage }] = await Promise.all([
        import('../demos/operations-pages'), import('../demos/operations'), import('../ui/page'),
      ]);
      return renderPage(env, operationsPageContent(docsContent(env), 'operations.docs'));
    },
    title: 'Operations documentation', description: 'Repository-native standards, contracts, implementation sources, and live machine interfaces.',
    sourceModule: 'src/demos/operations-pages.ts', sourceExport: 'docsContent', indexing: 'allow', offline: 'available',
    page: {
      parent: 'operations.index', label: 'Documentation',
      summary: 'Repository-native standards, contracts, implementation sources, and live machine interfaces.',
      order: 4, navigation: 'secondary', architectureMap: false,
    },
  }),
  operationalRoute({
    id: 'operations.api-logs', pattern: '/api/operations/logs', methods: ['GET'], kind: 'api', handler: (request, { env }) => logsResponse(request, env),
    title: 'Operations logs API', description: 'Sanitized application log query endpoint.',
    sourceModule: 'src/api/operations.ts', sourceExport: 'logsResponse',
  }),
  operationalRoute({
    id: 'operations.api-budget', pattern: '/api/operations/budget', methods: ['POST'], kind: 'api', handler: (request, { env }) => billingScenarioResponse(request, env),
    title: 'Operations budget API', description: 'Synthetic budget scenario control used by the operations demo.',
    sourceModule: 'src/api/billing.ts', sourceExport: 'billingScenarioResponse',
  }),
] as const;

export const operationalRouteModule = defineRouteModule('operations', globalOperationalRoutes);
export const operationalRouteRegistry = createRouteRegistry([operationalRouteModule]);
