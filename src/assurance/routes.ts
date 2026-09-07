import {
  assuranceRegistry,
  type AssuranceRegistryResource,
  type AssuranceRegistryRoutes,
} from './model';
import {
  assuranceAnchor as contractAnchor,
  assuranceRecordUrls as contractRecordUrls,
  assuranceRegistryApiRoute as contractRegistryApiRoute,
  assuranceRouteAliases as contractRouteAliases,
  assuranceRouteDeclarations as contractRouteDeclarations,
  assuranceRouteOwnerResource as contractRouteOwnerResource,
  assuranceRoutesForDataset as contractRoutesForDataset,
  matchAssuranceRoute as contractMatchRoute,
  validateAssuranceRouteContract as contractValidateRouteContract,
  validateAssuranceRouteHandlerSupport as contractValidateRouteHandlerSupport,
} from './route-contract.js';

export interface AssuranceRouteDeclaration {
  owner: string;
  ownerId: string;
  routes: AssuranceRegistryRoutes;
}

export interface AssuranceRouteMatch {
  owner: string;
  kind: 'html' | 'api-collection' | 'api-record' | 'alias';
  recordId?: string;
  target?: string;
}

export interface AssuranceRouteHandlerSupport {
  html?: boolean;
  apiCollection?: boolean;
  apiRecord?: boolean;
}

const routeContractErrors = contractValidateRouteContract(assuranceRegistry);
if (routeContractErrors.length > 0) {
  throw new Error(`Invalid assurance route contract:\n${routeContractErrors.join('\n')}`);
}

export function assuranceRouteOwnerResource(dataset: string): AssuranceRegistryResource | null {
  return contractRouteOwnerResource(assuranceRegistry, dataset) as AssuranceRegistryResource | null;
}

export function assuranceRoutesForDataset(dataset: string): AssuranceRegistryRoutes | null {
  return contractRoutesForDataset(assuranceRegistry, dataset) as AssuranceRegistryRoutes | null;
}

export function requireAssuranceRoutesForDataset(dataset: string): AssuranceRegistryRoutes {
  const routes = assuranceRoutesForDataset(dataset);
  if (!routes) throw new Error(`${dataset} has no canonical assurance route owner.`);
  return routes;
}

export function assuranceRegistryHtmlRoute(): string {
  const route = assuranceRegistry.routes.html;
  if (!route) throw new Error('assurance registry is missing its canonical HTML route.');
  return route;
}

export function assuranceHtmlRoute(dataset: string): string {
  const owner = assuranceRouteOwnerResource(dataset);
  if (!owner) throw new Error(`${dataset} has no canonical assurance route owner.`);
  if (owner.routes?.html) return owner.routes.html;
  return `${assuranceRegistryHtmlRoute()}?view=${encodeURIComponent(owner.kind)}`;
}

export function assuranceCollectionApiRoute(dataset: string): string {
  const route = requireAssuranceRoutesForDataset(dataset).api;
  if (!route) throw new Error(`${dataset} has no canonical assurance collection API route.`);
  return route;
}

export function assuranceRegistryApiRoute(): string {
  return contractRegistryApiRoute(assuranceRegistry) as string;
}

export function assuranceRecordUrls(
  dataset: string,
  recordId?: string,
): { html?: string; api?: string } {
  const urls = contractRecordUrls(assuranceRegistry, dataset, recordId) as { html?: string; api?: string };
  if (urls.html) return urls;
  const route = assuranceHtmlRoute(dataset);
  return {
    ...urls,
    html: recordId === undefined ? route : `${route}#${contractAnchor(recordId)}`,
  };
}

export function assuranceRouteDeclarations(): AssuranceRouteDeclaration[] {
  return contractRouteDeclarations(assuranceRegistry) as AssuranceRouteDeclaration[];
}

export function assuranceRouteAliases(): Array<{ owner: string; path: string; target: string }> {
  return contractRouteAliases(assuranceRegistry) as Array<{ owner: string; path: string; target: string }>;
}

export function matchAssuranceRoute(path: string): AssuranceRouteMatch | null {
  return contractMatchRoute(assuranceRegistry, path) as AssuranceRouteMatch | null;
}

export function validateAssuranceRouteHandlerSupport(
  support: Record<string, AssuranceRouteHandlerSupport>,
): string[] {
  return contractValidateRouteHandlerSupport(assuranceRegistry, support);
}

export const assuranceAnchor: (recordId: string) => string = contractAnchor;
