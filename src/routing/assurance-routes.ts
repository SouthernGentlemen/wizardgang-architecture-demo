import {
  assuranceRegistry,
  type AssuranceRegistry,
} from '../assurance/model';
import { assuranceRouteCapabilities } from '../assurance/route-capabilities';
import type {
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
  if (!source) throw new Error('Assurance HTML route is missing source metadata.');
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
      docs: ['docs/ASSURANCE-REGISTRY.md', 'docs/REPORTING.md', 'docs/ROUTES.md'],
    },
    source: routeSource(html.source),
    ...(html.page ? { page: html.page } : {}),
  };
}

export function createAssuranceRouteRegistry(
  registry: AssuranceRegistry,
  capabilities: readonly AssuranceRouteCapability[],
): RouteRegistry<AssuranceRouteContext> {
  const routes = capabilities.map((capability) => {
    const route = htmlRoute(capability);
    if (!route) throw new Error(`${capability.routeId} has no specialized HTML handler.`);
    return route;
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
