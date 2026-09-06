import type { Env } from '../types';
import {
  assuranceRegistry,
  type AssuranceRegistry,
  type AssuranceRegistryRoutes,
} from '../assurance/model';
import { genericAssuranceResponse } from '../api/assurance';
import { assuranceRouteCapabilities } from '../assurance/route-capabilities';
import type {
  AssuranceRouteCapability,
  AssuranceRouteSourceMetadata,
} from '../assurance/route-capability';
import {
  assuranceRouteDeclarations as contractRouteDeclarations,
  validateAssuranceRouteContract as contractValidateRouteContract,
  validateAssuranceRouteHandlerSupport as contractValidateHandlerSupport,
} from '../assurance/route-contract.js';
import { getDemoControl } from '../lib/demo-control';
import { json } from '../lib/http';
import {
  createRouteRegistry,
  defineRouteModule,
  matchRoute,
  type RouteDeclaration,
  type RouteHandler,
  type RouteRegistry,
  type RouteSourceMetadata,
} from './registry';

export interface AssuranceRouteContext {
  env: Env;
}

interface AssuranceContractRouteDeclaration {
  owner: string;
  ownerId: string;
  routes: AssuranceRegistryRoutes;
}

export type GenericAssuranceApiHandler = (
  request: Request,
  env: Env,
  owner: string,
  rawRecordId?: string,
) => Response | Promise<Response>;

export interface AssuranceRouteRouter {
  registry: RouteRegistry<AssuranceRouteContext>;
  route(request: Request, env: Env, path: string): Promise<Response | undefined>;
}

const ROUTE_TEST = 'tests/assurance-declarative-routing.test.ts';
const API_CACHE_SECONDS = 300;
const GENERIC_API_SOURCE: RouteSourceMetadata = {
  module: 'src/api/assurance.ts',
  exportName: 'genericAssuranceResponse',
  tests: [ROUTE_TEST, 'tests/assurance-api-contract.test.ts'],
};

function routeSource(source: AssuranceRouteSourceMetadata | undefined): RouteSourceMetadata {
  return source ? { ...source } : GENERIC_API_SOURCE;
}

function baseRoute(
  declaration: AssuranceContractRouteDeclaration,
  suffix: string,
  pattern: string,
  kind: 'page' | 'api',
  methods: RouteDeclaration<AssuranceRouteContext>['methods'],
  handler: RouteHandler<AssuranceRouteContext>,
  source: RouteSourceMetadata,
  offline: 'available' | 'gated',
): RouteDeclaration<AssuranceRouteContext> {
  return {
    id: `assurance.${declaration.ownerId}.${suffix}`,
    pattern,
    methods,
    kind,
    handler,
    authentication: { mode: 'anonymous' },
    authorization: { mode: 'none' },
    visibility: 'public',
    sameOrigin: { mode: 'not-required' },
    offline: { mode: offline },
    cache: kind === 'api' ? { mode: 'public', maxAgeSeconds: API_CACHE_SECONDS } : { mode: 'no-store' },
    crawler: { crawling: 'controlled', indexing: kind === 'page' ? 'allow' : 'deny' },
    documentation: {
      title: `Assurance ${declaration.owner} ${suffix}`,
      description: `Registry-owned ${suffix} route for the ${declaration.owner} assurance surface.`,
      docs: ['docs/ASSURANCE-REGISTRY.md', 'docs/ASSURANCE-API.md', 'docs/ROUTES.md'],
    },
    source,
  };
}

function detailPattern(pattern: string): string {
  return pattern.replace('{id}', ':recordId');
}

function encodedRecordId(params: Readonly<Record<string, string>>): string {
  const recordId = params.recordId;
  if (!recordId) throw new Error('Matched assurance detail route without a record ID.');
  return encodeURIComponent(recordId);
}

function capabilityByOwner(
  declarations: readonly AssuranceContractRouteDeclaration[],
  capabilities: readonly AssuranceRouteCapability[],
): ReadonlyMap<string, AssuranceRouteCapability> {
  const declaredOwners = new Set(declarations.map((declaration) => declaration.ownerId));
  const result = new Map<string, AssuranceRouteCapability>();
  for (const capability of capabilities) {
    if (!declaredOwners.has(capability.ownerId)) {
      throw new Error(`Assurance route capability '${capability.ownerId}' has no registered route owner.`);
    }
    if (result.has(capability.ownerId)) {
      throw new Error(`Duplicate assurance route capability owner '${capability.ownerId}'.`);
    }
    result.set(capability.ownerId, capability);
  }
  return result;
}

function validateCapabilities(
  registry: AssuranceRegistry,
  declarations: readonly AssuranceContractRouteDeclaration[],
  capabilities: ReadonlyMap<string, AssuranceRouteCapability>,
): void {
  const support: Record<string, { html?: boolean; apiCollection?: boolean; apiRecord?: boolean }> = {};
  const errors: string[] = [];

  for (const declaration of declarations) {
    const capability = capabilities.get(declaration.ownerId);
    if ((declaration.routes.aliases ?? []).length > 0) {
      errors.push(`${declaration.ownerId} declares aliases, which are not supported by the current assurance router`);
    }
    if (capability?.html && !declaration.routes.html) {
      errors.push(`${declaration.ownerId} registers an HTML handler without routes.html`);
    }
    if (capability?.apiCollection && !declaration.routes.api) {
      errors.push(`${declaration.ownerId} registers a collection handler without routes.api`);
    }
    if (capability?.apiRecord && !declaration.routes.apiRecord) {
      errors.push(`${declaration.ownerId} registers an exact-record handler without routes.apiRecord`);
    }

    const genericDatasetApi = declaration.owner !== 'registry';
    support[declaration.owner] = {
      html: Boolean(capability?.html),
      apiCollection: Boolean(declaration.routes.api && (capability?.apiCollection || genericDatasetApi)),
      apiRecord: Boolean(declaration.routes.apiRecord && (capability?.apiRecord || genericDatasetApi)),
    };
  }

  errors.push(...contractValidateHandlerSupport(registry, support));
  if (errors.length > 0) {
    throw new Error(`Invalid assurance declarative route capabilities:\n${errors.join('\n')}`);
  }
}

function routeDeclarations(
  declaration: AssuranceContractRouteDeclaration,
  capability: AssuranceRouteCapability | undefined,
  genericApiHandler: GenericAssuranceApiHandler,
): RouteDeclaration<AssuranceRouteContext>[] {
  const routes: RouteDeclaration<AssuranceRouteContext>[] = [];

  if (declaration.routes.html) {
    const html = capability?.html;
    if (!html) throw new Error(`${declaration.ownerId} declares routes.html without a specialized HTML handler.`);
    routes.push(baseRoute(
      declaration,
      'html',
      declaration.routes.html,
      'page',
      ['GET'],
      (request, { env }) => html.handler(request, env),
      routeSource(html.source),
      html.offline ?? 'gated',
    ));
  }

  if (declaration.routes.api) {
    const collection = capability?.apiCollection;
    if (declaration.owner === 'registry' && !collection) {
      throw new Error(`${declaration.ownerId} registry API requires a specialized collection handler.`);
    }
    routes.push(baseRoute(
      declaration,
      'collection',
      declaration.routes.api,
      'api',
      ['GET', 'OPTIONS'],
      collection
        ? (request, { env }) => collection.handler(request, env)
        : (request, { env }) => genericApiHandler(request, env, declaration.owner),
      routeSource(collection?.source),
      'gated',
    ));
  }

  if (declaration.routes.apiRecord) {
    const detail = capability?.apiRecord;
    routes.push(baseRoute(
      declaration,
      'detail',
      detailPattern(declaration.routes.apiRecord),
      'api',
      ['GET', 'OPTIONS'],
      detail
        ? (request, { env }, params) => detail.handler(request, env, encodedRecordId(params))
        : (request, { env }, params) => genericApiHandler(request, env, declaration.owner, encodedRecordId(params)),
      routeSource(detail?.source),
      'gated',
    ));
  }

  return routes;
}

function offlineResponse(
  request: Request,
  route: RouteDeclaration<AssuranceRouteContext>,
  message: string,
): Response {
  const accept = request.headers.get('accept') || '';
  const browserHtml = request.method === 'GET'
    && route.kind === 'page'
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

export function createAssuranceRouteRouter(
  registry: AssuranceRegistry,
  capabilities: readonly AssuranceRouteCapability[],
  genericApiHandler: GenericAssuranceApiHandler = (request, _env, owner, rawRecordId) =>
    genericAssuranceResponse(request, owner, rawRecordId),
): AssuranceRouteRouter {
  const contractErrors = contractValidateRouteContract(registry) as string[];
  if (contractErrors.length > 0) {
    throw new Error(`Invalid assurance route contract:\n${contractErrors.join('\n')}`);
  }

  const declarations = contractRouteDeclarations(registry) as AssuranceContractRouteDeclaration[];
  const capabilityMap = capabilityByOwner(declarations, capabilities);
  validateCapabilities(registry, declarations, capabilityMap);

  const modules = declarations.map((declaration) => defineRouteModule(
    `assurance.${declaration.ownerId}`,
    routeDeclarations(declaration, capabilityMap.get(declaration.ownerId), genericApiHandler),
  ));
  const declarativeRegistry = createRouteRegistry(modules);

  return {
    registry: declarativeRegistry,
    async route(request: Request, env: Env, path: string): Promise<Response | undefined> {
      const match = matchRoute(declarativeRegistry, request.method, path);
      if (match.status === 'not-found') return undefined;
      if (match.status === 'method-not-allowed' && match.route.kind === 'page') return undefined;

      const route = match.route;
      if (route.offline.mode === 'gated') {
        const control = await getDemoControl(env);
        if (control.state === 'offline') return offlineResponse(request, route, control.publicMessage);
      }

      return route.handler(request, { env }, match.params);
    },
  };
}

export const assuranceRouteRouter = createAssuranceRouteRouter(
  assuranceRegistry,
  assuranceRouteCapabilities,
);
export const assuranceDeclarativeRouteRegistry = assuranceRouteRouter.registry;
export const routeAssuranceRequest = assuranceRouteRouter.route;
