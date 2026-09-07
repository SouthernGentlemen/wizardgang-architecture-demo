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
  return assuranceRouteOwnerResource(registry, kind)?.routes ?? null;
}

export function assuranceRouteDeclarations(registry) {
  const declarations = [];
  if (registry?.routes) {
    declarations.push({ owner: 'registry', ownerId: registry.id, routes: registry.routes });
  }

  const seenOwners = new Set();
  for (const dataset of registry?.datasets ?? []) {
    if (dataset?.role !== 'dataset') continue;
    const owner = assuranceRouteOwnerResource(registry, dataset.kind);
    if (!owner?.routes || seenOwners.has(owner.id)) continue;
    seenOwners.add(owner.id);
    declarations.push({ owner: owner.kind, ownerId: owner.id, routes: owner.routes });
  }
  return declarations;
}

export function assuranceRouteAliases(registry) {
  return assuranceRouteDeclarations(registry).flatMap((declaration) => {
    const html = declaration.routes?.html;
    if (!html) return [];
    return (declaration.routes.aliases ?? []).map((alias) => ({
      owner: declaration.owner,
      path: alias.path,
      target: `${html}${alias.fragment ? `#${encodeURIComponent(alias.fragment)}` : ''}`,
    }));
  });
}

export function assuranceAnchor(recordId) {
  return encodeURIComponent(recordId);
}

export function assuranceRecordUrls(registry, kind, recordId) {
  const owner = assuranceRouteOwnerResource(registry, kind);
  if (!owner) throw new Error(`${kind} has no canonical assurance resource owner.`);
  const route = owner.routes?.html ?? registry?.routes?.html;
  if (!route) return {};
  return {
    html: recordId === undefined ? route : `${route}#${assuranceAnchor(recordId)}`,
  };
}

export function assuranceRegistryApiRoute() {
  return '/api/reporting';
}

export function matchAssuranceRoute(registry, path) {
  for (const alias of assuranceRouteAliases(registry)) {
    if (alias.path === path) return { owner: alias.owner, kind: 'alias', target: alias.target };
  }
  for (const declaration of assuranceRouteDeclarations(registry)) {
    if (declaration.routes?.html === path) return { owner: declaration.owner, kind: 'html' };
  }
  return null;
}

function validRoutePath(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.includes('?')
    && !value.includes('#')
    && (value === '/' || !value.endsWith('/'));
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
    const routes = declaration.routes ?? {};
    const ownerSupport = support?.[declaration.owner] ?? support?.['*'] ?? {};
    if (routes.html && !ownerSupport.html) {
      errors.push(`${declaration.ownerId} declares routes.html without an HTML handler`);
    }
  }
  return errors;
}

export function validateAssuranceRouteContract(registry) {
  const errors = [];
  const resources = flattenAssuranceResources(registry);
  const ids = new Map(resources.map((resource) => [resource.id, resource]));

  if (!registry?.routes?.html) errors.push('registry must declare routes.html');
  if (registry?.routes?.api || registry?.routes?.apiRecord) {
    errors.push('registry cannot declare legacy assurance API routes; use /api/reporting');
  }

  for (const resource of resources.filter((entry) => entry.role === 'dataset')) {
    if (resource.routes && resource.routeOwner) {
      errors.push(`${resource.id} cannot declare both routes and routeOwner`);
    }
    if (resource.routeOwner) {
      const owner = assuranceResourceById(registry, resource.routeOwner);
      if (!owner) errors.push(`${resource.id} declares unknown routeOwner ${resource.routeOwner}`);
    }
    if (resource.routes?.api || resource.routes?.apiRecord) {
      errors.push(`${resource.id} cannot declare legacy assurance API routes; use /api/reporting`);
    }
  }

  let declarations = [];
  try {
    declarations = assuranceRouteDeclarations(registry);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return errors;
  }

  const claimedPaths = new Map();
  const claim = (path, label) => {
    const existing = claimedPaths.get(path);
    if (existing) errors.push(`${label} collides with ${existing} at ${path}`);
    else claimedPaths.set(path, label);
  };

  for (const declaration of declarations) {
    const routes = declaration.routes ?? {};
    const resource = declaration.owner === 'registry' ? null : ids.get(declaration.ownerId);
    const capabilities = new Set(resource?.capabilities ?? []);
    if (!routes.html && (routes.aliases ?? []).length === 0) {
      errors.push(`${declaration.ownerId} routes must declare html`);
    }
    if (routes.html !== undefined) {
      if (!validRoutePath(routes.html)) errors.push(`${declaration.ownerId} routes.html is not a canonical route path: ${routes.html}`);
      else claim(routes.html, `${declaration.ownerId} routes.html`);
    }
    if (resource && routes.html && !capabilities.has('runtime')) {
      errors.push(`${declaration.ownerId} route owner must declare runtime capability`);
    }
    if ((routes.aliases ?? []).length > 0 && !routes.html) {
      errors.push(`${declaration.ownerId} HTML aliases require routes.html`);
    }
    for (const alias of routes.aliases ?? []) {
      if (!validRoutePath(alias.path)) errors.push(`${declaration.ownerId} alias is not a canonical route path: ${alias.path}`);
      else claim(alias.path, `${declaration.ownerId} alias`);
      if (alias.fragment !== undefined && (typeof alias.fragment !== 'string' || alias.fragment.length === 0 || alias.fragment.includes('#'))) {
        errors.push(`${declaration.ownerId} alias fragment must be a non-empty fragment id without #`);
      }
    }
  }

  return errors;
}
