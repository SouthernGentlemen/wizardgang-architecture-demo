import {
  assuranceRegistry,
  type AssuranceDataset,
  type AssuranceRegistryRoutes,
} from './model';
import {
  assuranceAnchor as contractAnchor,
  assuranceRecordUrls as contractRecordUrls,
  assuranceRegistryApiRoute as contractRegistryApiRoute,
  assuranceRouteAliases as contractRouteAliases,
  assuranceRouteDeclarations as contractRouteDeclarations,
  assuranceRoutesForDataset as contractRoutesForDataset,
  matchAssuranceRoute as contractMatchRoute,
  validateAssuranceRouteContract as contractValidateRouteContract,
  validateAssuranceRouteHandlerSupport as contractValidateRouteHandlerSupport,
} from './route-contract.js';

export interface AssuranceRouteDeclaration {
  owner: 'registry' | AssuranceDataset;
  ownerId: string;
  routes: AssuranceRegistryRoutes;
}

export interface AssuranceRouteMatch {
  owner: 'registry' | AssuranceDataset;
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

export function assuranceRoutesForDataset(dataset: AssuranceDataset): AssuranceRegistryRoutes | null {
  return contractRoutesForDataset(assuranceRegistry, dataset) as AssuranceRegistryRoutes | null;
}

export function requireAssuranceRoutesForDataset(dataset: AssuranceDataset): AssuranceRegistryRoutes {
  const routes = assuranceRoutesForDataset(dataset);
  if (!routes) throw new Error(`${dataset} has no canonical assurance route owner.`);
  return routes;
}

export function assuranceHtmlRoute(dataset: AssuranceDataset): string {
  const route = requireAssuranceRoutesForDataset(dataset).html;
  if (!route) throw new Error(`${dataset} has no canonical assurance HTML route.`);
  return route;
}

export function assuranceCollectionApiRoute(dataset: AssuranceDataset): string {
  const route = requireAssuranceRoutesForDataset(dataset).api;
  if (!route) throw new Error(`${dataset} has no canonical assurance collection API route.`);
  return route;
}

export function assuranceRegistryApiRoute(): string {
  return contractRegistryApiRoute(assuranceRegistry) as string;
}

export function assuranceRecordUrls(
  dataset: AssuranceDataset,
  recordId?: string,
): { html?: string; api?: string } {
  return contractRecordUrls(assuranceRegistry, dataset, recordId) as { html?: string; api?: string };
}

export function assuranceRouteDeclarations(): AssuranceRouteDeclaration[] {
  return contractRouteDeclarations(assuranceRegistry) as AssuranceRouteDeclaration[];
}

export function assuranceRouteAliases(): Array<{ owner: AssuranceDataset; path: string; target: string }> {
  return contractRouteAliases(assuranceRegistry) as Array<{ owner: AssuranceDataset; path: string; target: string }>;
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
