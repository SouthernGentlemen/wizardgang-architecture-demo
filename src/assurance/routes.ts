import {
  assuranceRegistry,
  assuranceRegistryResources,
  type AssuranceRegistryResource,
} from './model';
import {
  assuranceAnchor as contractAnchor,
  assuranceRouteDeclarations as contractRouteDeclarations,
  assuranceRouteOwnerResource as contractRouteOwnerResource,
  assuranceRoutesForDataset as contractRoutesForDataset,
  validateAssuranceRouteHandlerSupport as contractValidateRouteHandlerSupport,
} from './route-contract.js';
import { reportingOwnership } from '../reporting/registry';
import { routeUrl } from '../routing/application-routes';
import type { RouteQuery } from '../routing/route-url';

export interface AssuranceRouteDeclaration {
  owner: string;
  ownerId: string;
  routeId: string;
}

export interface AssuranceRouteHandlerSupport {
  html?: boolean;
}

export function assuranceRouteOwnerResource(dataset: string): AssuranceRegistryResource | null {
  return contractRouteOwnerResource(assuranceRegistry, dataset) as AssuranceRegistryResource | null;
}

export function assuranceRoutesForDataset(dataset: string): string | null {
  return contractRoutesForDataset(assuranceRegistry, dataset) as string | null;
}

export function requireAssuranceRoutesForDataset(dataset: string): string {
  const routeId = assuranceRoutesForDataset(dataset);
  if (!routeId) throw new Error(`${dataset} has no declared assurance presentation route.`);
  return routeId;
}

export function assuranceRegistryHtmlRoute(): string {
  const routeId = assuranceRegistry.presentation?.routeId;
  if (!routeId) throw new Error('assurance registry is missing its canonical presentation route ID.');
  return routeUrl(routeId);
}

export function assuranceHtmlRoute(dataset: string, query: RouteQuery = {}): string {
  return routeUrl(requireAssuranceRoutesForDataset(dataset), {}, query);
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
  return routeUrl('reporting.collection', { collection: reportingCollectionId(dataset) }, query);
}

export function assuranceRegistryApiRoute(query: RouteQuery = {}): string {
  return routeUrl('reporting.index', {}, query);
}

export function assuranceRecordUrls(
  dataset: string,
  recordId?: string,
): { html?: string; api?: string } {
  const routeId = requireAssuranceRoutesForDataset(dataset);
  const collection = reportingCollectionId(dataset);
  return {
    html: recordId === undefined
      ? routeUrl(routeId)
      : `${routeUrl(routeId)}#${contractAnchor(recordId)}`,
    api: recordId === undefined
      ? routeUrl('reporting.collection', { collection })
      : routeUrl('reporting.record', { collection, recordId: recordId.normalize('NFC') }),
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
