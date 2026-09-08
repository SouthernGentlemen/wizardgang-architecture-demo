import {
  assuranceRegistry,
  assuranceRegistryResources,
  type AssuranceRegistryResource,
  type AssuranceRegistryRoutes,
} from './model';
import {
  assuranceAnchor as contractAnchor,
  assuranceRouteDeclarations as contractRouteDeclarations,
  assuranceRouteOwnerResource as contractRouteOwnerResource,
  assuranceRoutesForDataset as contractRoutesForDataset,
  validateAssuranceRouteContract as contractValidateRouteContract,
  validateAssuranceRouteHandlerSupport as contractValidateRouteHandlerSupport,
} from './route-contract.js';
import { reportingOwnership } from '../reporting/registry';
import { withRouteQuery, type RouteQuery } from '../routing/route-url';

export interface AssuranceRouteDeclaration {
  owner: string;
  ownerId: string;
  routes: AssuranceRegistryRoutes;
}

export interface AssuranceRouteHandlerSupport {
  html?: boolean;
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

export function assuranceHtmlRoute(dataset: string, query: RouteQuery = {}): string {
  const owner = assuranceRouteOwnerResource(dataset);
  if (!owner) throw new Error(`${dataset} has no canonical assurance route owner.`);
  const route = owner.routes?.html
    ?? withRouteQuery(assuranceRegistryHtmlRoute(), { view: owner.kind });
  return withRouteQuery(route, query);
}

function reportingCollectionId(dataset: string): string {
  const resource = assuranceRegistryResources.find((candidate) => candidate.kind === dataset);
  if (!resource) return dataset;
  const owned = reportingOwnership.find((candidate) => (
    candidate.source === 'github.structured-records'
    && candidate.resource
    && (resource.id === candidate.resource || resource.id.startsWith(`${candidate.resource}.`))
  ));
  return owned?.domain ?? dataset;
}

export function assuranceCollectionApiRoute(dataset: string, query: RouteQuery = {}): string {
  return withRouteQuery(`/api/reporting/${encodeURIComponent(reportingCollectionId(dataset))}`, query);
}

export function assuranceRegistryApiRoute(query: RouteQuery = {}): string {
  return withRouteQuery('/api/reporting', query);
}

export function assuranceRecordUrls(
  dataset: string,
  recordId?: string,
): { html?: string; api?: string } {
  const html = assuranceHtmlRoute(dataset);
  const api = assuranceCollectionApiRoute(dataset);
  return {
    html: recordId === undefined ? html : `${html}#${contractAnchor(recordId)}`,
    api: recordId === undefined ? api : `${api}/${encodeURIComponent(recordId.normalize('NFC'))}`,
  };
}

export function assuranceRouteDeclarations(): AssuranceRouteDeclaration[] {
  return contractRouteDeclarations(assuranceRegistry) as AssuranceRouteDeclaration[];
}

export function validateAssuranceRouteHandlerSupport(
  support: Record<string, AssuranceRouteHandlerSupport>,
): string[] {
  return contractValidateRouteHandlerSupport(assuranceRegistry, support);
}

export const assuranceAnchor: (recordId: string) => string = contractAnchor;
