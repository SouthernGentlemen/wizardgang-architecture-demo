import {
  assuranceResourceById,
  flattenAssuranceResources,
  resolveAssuranceResourceOwner,
} from './record-discovery.js';

function rootDataset(registry, kind) {
  const matches = (registry?.datasets ?? []).filter(
    (dataset) => dataset?.kind === kind && dataset?.role === 'dataset',
  );
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error(`assurance route contract expected exactly one ${kind} root dataset; found ${matches.length}`);
  }
  return matches[0];
}

export function assuranceRouteOwnerResource(registry, kind) {
  const dataset = rootDataset(registry, kind);
  if (!dataset) return null;
  return resolveAssuranceResourceOwner(registry, dataset, 'routeOwner') ?? dataset;
}

export function assuranceRoutesForDataset(registry, kind) {
  return assuranceRouteOwnerResource(registry, kind)?.presentation?.routeId ?? null;
}

export function assuranceRouteDeclarations(registry) {
  const declarations = [];
  if (registry?.presentation?.routeId) {
    declarations.push({
      owner: 'registry',
      ownerId: registry.id,
      routeId: registry.presentation.routeId,
    });
  }

  const seenOwners = new Set();
  for (const dataset of registry?.datasets ?? []) {
    if (dataset?.role !== 'dataset') continue;
    const owner = assuranceRouteOwnerResource(registry, dataset.kind);
    if (!owner?.presentation?.routeId || seenOwners.has(owner.id)) continue;
    seenOwners.add(owner.id);
    declarations.push({
      owner: owner.kind,
      ownerId: owner.id,
      routeId: owner.presentation.routeId,
    });
  }
  return declarations;
}

export function assuranceAnchor(recordId) {
  return encodeURIComponent(recordId);
}

function applicationRouteIds(registeredRouteIds) {
  if (!registeredRouteIds) return null;
  if (registeredRouteIds instanceof Set) return registeredRouteIds;
  return new Set(registeredRouteIds);
}

export function validateAssuranceRouteHandlerSupport(registry, support) {
  const errors = [];
  let declarations = [];
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

export function validateAssuranceRouteContract(registry, registeredRouteIds) {
  const errors = [];
  const resources = flattenAssuranceResources(registry);
  const routeIds = applicationRouteIds(registeredRouteIds);

  if (!registry?.presentation?.routeId) {
    errors.push('registry must declare presentation.routeId');
  }

  for (const resource of resources.filter((entry) => entry.role === 'dataset')) {
    if (resource.presentation && resource.routeOwner) {
      errors.push(`${resource.id} cannot declare both presentation and routeOwner`);
    }
    if (resource.routeOwner) {
      const owner = assuranceResourceById(registry, resource.routeOwner);
      if (!owner) errors.push(`${resource.id} declares unknown routeOwner ${resource.routeOwner}`);
    }
  }

  let declarations = [];
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
      errors.push(`${declaration.ownerId} presentation.routeId references unknown application route ${declaration.routeId}`);
    }
  }

  return errors;
}
