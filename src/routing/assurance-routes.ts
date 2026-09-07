import {
  assuranceRegistry,
  type AssuranceRegistry,
  type AssuranceRegistryRoutes,
} from '../assurance/model';
import { assuranceRouteCapabilities } from '../assurance/route-capabilities';
import type {
  AssuranceRouteCapability,
  AssuranceRouteSourceMetadata,
} from '../assurance/route-capability';
import {
  assuranceRouteDeclarations as contractRouteDeclarations,
  validateAssuranceRouteContract as contractValidateRouteContract,
} from '../assurance/route-contract.js';
import {
  createRouteRegistry,
  defineRouteModule,
  type RouteDeclaration,
  type RouteRegistry,
  type RouteSourceMetadata,
} from './registry';

import type { Env } from '../types';

export interface AssuranceRouteContext { env: Env; }

interface AssuranceContractRouteDeclaration {
  owner: string;
  ownerId: string;
  routes: AssuranceRegistryRoutes;
}

const ROUTE_TEST = 'tests/assurance-declarative-routing.test.ts';

function routeSource(source: AssuranceRouteSourceMetadata | undefined): RouteSourceMetadata {
  if (!source) throw new Error('Assurance HTML route is missing source metadata.');
  return { ...source, tests: source.tests ?? [ROUTE_TEST] };
}

function htmlRoute(
  declaration: AssuranceContractRouteDeclaration,
  capability: AssuranceRouteCapability,
): RouteDeclaration<AssuranceRouteContext> | null {
  if (!declaration.routes.html) return null;
  const html = capability.html;
  if (!html) throw new Error(`${declaration.ownerId} declares routes.html without a specialized HTML handler.`);
  return {
    id: `assurance.${declaration.ownerId}.html`,
    pattern: declaration.routes.html,
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
      title: `Assurance ${declaration.owner} html`,
      description: `Registry-owned html route for the ${declaration.owner} assurance surface.`,
      docs: ['docs/ASSURANCE-REGISTRY.md', 'docs/REPORTING.md', 'docs/ROUTES.md'],
    },
    source: routeSource(html.source),
  };
}

function capabilityByOwner(
  declarations: readonly AssuranceContractRouteDeclaration[],
  capabilities: readonly AssuranceRouteCapability[],
): ReadonlyMap<string, AssuranceRouteCapability> {
  const declaredOwners = new Set(declarations.map((declaration) => declaration.ownerId));
  const result = new Map<string, AssuranceRouteCapability>();
  for (const capability of capabilities) {
    if (!declaredOwners.has(capability.ownerId)) continue;
    if (result.has(capability.ownerId)) {
      throw new Error(`Duplicate assurance route capability owner '${capability.ownerId}'.`);
    }
    result.set(capability.ownerId, capability);
  }
  return result;
}

function validatePresentationCapabilities(
  declarations: readonly AssuranceContractRouteDeclaration[],
  capabilities: ReadonlyMap<string, AssuranceRouteCapability>,
): void {
  const errors: string[] = [];
  for (const declaration of declarations) {
    const capability = capabilities.get(declaration.ownerId);
    if (declaration.routes.html && !capability?.html) {
      errors.push(`${declaration.ownerId} declares routes.html without a specialized HTML handler`);
    }
  }
  if (errors.length > 0) throw new Error(`Invalid assurance presentation route capabilities:\n${errors.join('\n')}`);
}

export function createAssuranceRouteRegistry(
  registry: AssuranceRegistry,
  capabilities: readonly AssuranceRouteCapability[],
): RouteRegistry<AssuranceRouteContext> {
  const contractErrors = contractValidateRouteContract(registry) as string[];
  if (contractErrors.length > 0) {
    throw new Error(`Invalid assurance route contract:\n${contractErrors.join('\n')}`);
  }

  const declarations = contractRouteDeclarations(registry) as AssuranceContractRouteDeclaration[];
  const capabilityMap = capabilityByOwner(declarations, capabilities);
  validatePresentationCapabilities(declarations, capabilityMap);

  const modules = declarations.map((declaration) => {
    const capability = capabilityMap.get(declaration.ownerId);
    const route = capability ? htmlRoute(declaration, capability) : null;
    return defineRouteModule(`assurance.${declaration.ownerId}`, route ? [route] : []);
  });
  return createRouteRegistry(modules);
}

export const assuranceDeclarativeRouteRegistry = createAssuranceRouteRegistry(
  assuranceRegistry,
  assuranceRouteCapabilities,
);
