import {
  assuranceResourceById,
  flattenAssuranceResources,
  resolveAssuranceResourceOwner,
  type AssuranceDiscoverableRegistry,
  type AssuranceDiscoverableResource,
} from './record-discovery.ts';

export interface AssuranceRouteContractDeclaration {
  owner: string;
  ownerId: string;
  routeId: string;
}

export interface AssuranceRouteHandlerSupport {
  html?: boolean;
}

interface AssuranceRoutePresentation {
  routeId?: unknown;
}

interface AssuranceRouteResource extends AssuranceDiscoverableResource {
  presentation?: AssuranceRoutePresentation;
}

interface AssuranceRouteRegistry extends AssuranceDiscoverableRegistry {
  id?: unknown;
  presentation?: AssuranceRoutePresentation;
  datasets?: AssuranceRouteResource[];
}

function rootDataset(registry: unknown, kind: string): AssuranceRouteResource | null {
  const value = registry as AssuranceRouteRegistry | null | undefined;
  const matches = (value?.datasets ?? []).filter(
    (dataset) => dataset?.kind === kind && dataset?.role === 'dataset',
  );
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error(`assurance route contract expected exactly one ${kind} root dataset; found ${matches.length}`);
  }
  return matches[0];
}

function routeOwnerResource(registry: unknown, kind: string): AssuranceRouteResource | null {
  const dataset = rootDataset(registry, kind);
  if (!dataset) return null;
  return (
    resolveAssuranceResourceOwner(
      registry as AssuranceDiscoverableRegistry,
      dataset,
      'routeOwner',
    ) as AssuranceRouteResource
  ) ?? dataset;
}

export function assuranceRouteOwnerResource(registry: unknown, kind: string): unknown | null {
  return routeOwnerResource(registry, kind);
}

export function assuranceRoutesForDataset(registry: unknown, kind: string): string | null {
  return routeOwnerResource(registry, kind)?.presentation?.routeId as string | null ?? null;
}

export function assuranceRouteDeclarations(registry: unknown): AssuranceRouteContractDeclaration[] {
  const value = registry as AssuranceRouteRegistry | null | undefined;
  const declarations: AssuranceRouteContractDeclaration[] = [];
  if (value?.presentation?.routeId) {
    declarations.push({
      owner: 'registry',
      ownerId: value.id as string,
      routeId: value.presentation.routeId as string,
    });
  }

  const seenOwners = new Set<string>();
  for (const dataset of value?.datasets ?? []) {
    if (dataset?.role !== 'dataset') continue;
    const owner = routeOwnerResource(registry, dataset.kind);
    if (!owner?.presentation?.routeId || seenOwners.has(owner.id)) continue;
    seenOwners.add(owner.id);
    declarations.push({
      owner: owner.kind,
      ownerId: owner.id,
      routeId: owner.presentation.routeId as string,
    });
  }
  return declarations;
}

export function assuranceAnchor(recordId: string): string {
  return encodeURIComponent(recordId);
}

function applicationRouteIds(
  registeredRouteIds?: ReadonlySet<string> | readonly string[],
): ReadonlySet<string> | null {
  if (!registeredRouteIds) return null;
  if (registeredRouteIds instanceof Set) return registeredRouteIds;
  return new Set(registeredRouteIds);
}

export function validateAssuranceRouteHandlerSupport(
  registry: unknown,
  support: Record<string, AssuranceRouteHandlerSupport>,
): string[] {
  const errors: string[] = [];
  let declarations: AssuranceRouteContractDeclaration[] = [];
  try {
    declarations = assuranceRouteDeclarations(registry);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  for (const declaration of declarations) {
    const routeSupport = support?.[declaration.routeId] ?? support?.['*'] ?? {};
    if (!routeSupport.html) {
      errors.push(`${declaration.ownerId} presents on ${declaration.routeId} without an HTML handler`);
    }
  }
  return errors;
}

export function validateAssuranceRouteContract(
  registry: unknown,
  registeredRouteIds?: ReadonlySet<string> | readonly string[],
): string[] {
  const errors: string[] = [];
  const value = registry as AssuranceRouteRegistry | null | undefined;
  const resources = flattenAssuranceResources(
    registry as AssuranceDiscoverableRegistry,
  ) as AssuranceRouteResource[];
  const routeIds = applicationRouteIds(registeredRouteIds);

  if (!value?.presentation?.routeId) {
    errors.push('registry must declare presentation.routeId');
  }

  for (const resource of resources.filter((entry) => entry.role === 'dataset')) {
    if (resource.presentation && resource.routeOwner) {
      errors.push(`${resource.id} cannot declare both presentation and routeOwner`);
    }
    if (resource.routeOwner) {
      const owner = assuranceResourceById(
        registry as AssuranceDiscoverableRegistry,
        resource.routeOwner,
      );
      if (!owner) errors.push(`${resource.id} declares unknown routeOwner ${resource.routeOwner}`);
    }
  }

  let declarations: AssuranceRouteContractDeclaration[] = [];
  try {
    declarations = assuranceRouteDeclarations(registry);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return errors;
  }

  for (const declaration of declarations) {
    if (typeof declaration.routeId !== 'string' || declaration.routeId.length === 0) {
      errors.push(`${declaration.ownerId} presentation.routeId must be a non-empty route ID`);
      continue;
    }
    if (routeIds && !routeIds.has(declaration.routeId)) {
      errors.push(
        `${declaration.ownerId} presentation.routeId references unknown application route ${declaration.routeId}`,
      );
    }
  }

  return errors;
}
