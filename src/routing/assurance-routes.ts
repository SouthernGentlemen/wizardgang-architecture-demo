import {
  assuranceRegistry,
  type AssuranceRegistry,
} from '../assurance/model';
import { assuranceRouteCapabilities } from '../assurance/route-capabilities';
import type {
  AssuranceApiRouteHandlerRegistration,
  AssuranceRouteCapability,
  AssuranceRouteSourceMetadata,
} from '../assurance/route-capability';
import {
  validateAssuranceRouteContract as contractValidateRouteContract,
} from '../assurance/route-contract.js';
import {
  createRouteRegistry,
  defineRouteModule,
  type RouteDeclaration,
  type RouteRegistry,
  type RouteSourceMetadata,
} from './registry';
import type { PageMetadata } from './application-routes';
import type { Env } from '../types';

export interface AssuranceRouteContext { env: Env; }

type AssuranceApplicationRouteDeclaration = RouteDeclaration<AssuranceRouteContext> & { page?: PageMetadata };

const ROUTE_TEST = 'tests/assurance-declarative-routing.test.ts';

function routeSource(source: AssuranceRouteSourceMetadata | undefined): RouteSourceMetadata {
  if (!source) throw new Error('Assurance route is missing source metadata.');
  return { ...source, tests: source.tests ?? [ROUTE_TEST] };
}

function htmlRoute(capability: AssuranceRouteCapability): AssuranceApplicationRouteDeclaration | null {
  const html = capability.html;
  if (!html) return null;
  return {
    id: capability.routeId,
    pattern: capability.pattern,
    methods: ['GET'],
    kind: 'page',
    handler: (request, { env }) => html.handler(request, env),
    authentication: { mode: 'anonymous' },
    authorization: { mode: 'none' },
    visibility: 'public',
    sameOrigin: { mode: 'not-required' },
    offline: { mode: html.offline ?? 'gated' },
    cache: { mode: 'no-store' },
    crawler: { crawling: 'controlled', indexing: 'allow' },
    documentation: {
      title: html.page?.label ?? capability.routeId,
      description: html.page?.summary ?? `Canonical assurance presentation route ${capability.routeId}.`,
      docs: ['docs/ASSURANCE.md', 'docs/REPORTING.md', 'docs/ROUTE-REGISTRY.md'],
    },
    source: routeSource(html.source),
    ...(html.page ? { page: html.page } : {}),
  };
}

function apiRoute(api: AssuranceApiRouteHandlerRegistration): AssuranceApplicationRouteDeclaration {
  return {
    id: api.routeId,
    pattern: api.pattern,
    methods: ['GET'],
    kind: 'api',
    handler: (request, { env }, params) => api.handler(request, env, params),
    authentication: { mode: 'anonymous' },
    authorization: { mode: 'none' },
    visibility: 'public',
    sameOrigin: { mode: 'not-required' },
    offline: { mode: api.offline ?? 'gated' },
    cache: api.cache ?? { mode: 'no-store' },
    crawler: { crawling: 'controlled', indexing: 'deny' },
    documentation: {
      title: api.title,
      description: api.description,
      docs: ['docs/ASSURANCE.md', 'docs/ROUTE-REGISTRY.md'],
    },
    source: routeSource(api.source),
  };
}

export function createAssuranceRouteRegistry(
  registry: AssuranceRegistry,
  capabilities: readonly AssuranceRouteCapability[],
): RouteRegistry<AssuranceRouteContext> {
  const routes = capabilities.flatMap((capability) => {
    const html = htmlRoute(capability);
    const api = (capability.api ?? []).map(apiRoute);
    const capabilityRoutes = [...(html ? [html] : []), ...api];
    if (capabilityRoutes.length === 0) throw new Error(`${capability.routeId} has no specialized handler.`);
    return capabilityRoutes;
  });

  const contractErrors = contractValidateRouteContract(
    registry,
    new Set(routes.map((route) => route.id)),
  ) as string[];
  if (contractErrors.length > 0) {
    throw new Error(`Invalid assurance route contract:\n${contractErrors.join('\n')}`);
  }

  return createRouteRegistry(routes.map((route) => defineRouteModule(`assurance.${route.id}`, [route])));
}

export const assuranceDeclarativeRouteRegistry = createAssuranceRouteRegistry(
  assuranceRegistry,
  assuranceRouteCapabilities,
);
