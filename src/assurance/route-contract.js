import { flattenAssuranceResources } from './record-discovery.js';

function indexedDataset(registry, kind) {
  const matches = (registry?.datasets ?? []).filter(
    (dataset) => dataset?.kind === kind && dataset?.role === 'dataset' && dataset?.capabilities?.includes('api-index'),
  );
  if (matches.length !== 1) {
    throw new Error(`assurance route contract expected exactly one indexed ${kind} dataset; found ${matches.length}`);
  }
  return matches[0];
}

function resourceById(registry, id) {
  return flattenAssuranceResources(registry).find((resource) => resource.id === id);
}

export function assuranceRouteOwnerResource(registry, kind) {
  let current = indexedDataset(registry, kind);
  const seen = new Set();
  while (current?.routeOwner) {
    if (seen.has(current.id)) throw new Error(`assurance route ownership cycle includes ${current.id}`);
    seen.add(current.id);
    const owner = resourceById(registry, current.routeOwner);
    if (!owner) throw new Error(`${current.id} declares unknown route owner ${current.routeOwner}`);
    current = owner;
  }
  if (!current?.routes) return null;
  return current;
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
    if (!dataset?.capabilities?.includes('api-index')) continue;
    const owner = assuranceRouteOwnerResource(registry, dataset.kind);
    if (!owner || seenOwners.has(owner.id)) continue;
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
  const routes = assuranceRoutesForDataset(registry, kind);
  if (!routes) throw new Error(`${kind} has no canonical assurance route owner.`);
  const hasRecord = recordId !== undefined;
  const encodedId = hasRecord ? encodeURIComponent(recordId) : undefined;
  return {
    ...(routes.html ? { html: hasRecord ? `${routes.html}#${assuranceAnchor(recordId)}` : routes.html } : {}),
    ...(!hasRecord && routes.api ? { api: routes.api } : {}),
    ...(hasRecord && routes.apiRecord ? { api: routes.apiRecord.replace('{id}', encodedId) } : {}),
  };
}

export function assuranceRegistryApiRoute(registry) {
  const route = registry?.routes?.api;
  if (!route) throw new Error('assurance registry is missing its canonical API route.');
  return route;
}

export function matchAssuranceRoute(registry, path) {
  for (const alias of assuranceRouteAliases(registry)) {
    if (alias.path === path) return { owner: alias.owner, kind: 'alias', target: alias.target };
  }

  for (const declaration of assuranceRouteDeclarations(registry)) {
    const routes = declaration.routes ?? {};
    if (routes.html === path) return { owner: declaration.owner, kind: 'html' };
    if (routes.api === path) return { owner: declaration.owner, kind: 'api-collection' };
    if (routes.apiRecord) {
      const [prefix, suffix = ''] = routes.apiRecord.split('{id}');
      if (path.startsWith(prefix) && path.endsWith(suffix)) {
        const recordId = path.slice(prefix.length, path.length - suffix.length || undefined);
        if (recordId.length > 0) return { owner: declaration.owner, kind: 'api-record', recordId };
      }
    }
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

export function validateAssuranceRouteContract(registry) {
  const errors = [];
  const resources = flattenAssuranceResources(registry);
  const ids = new Map(resources.map((resource) => [resource.id, resource]));

  if (!registry?.routes?.api) errors.push('registry must declare routes.api');

  for (const dataset of registry?.datasets ?? []) {
    if (dataset.routes && dataset.routeOwner) {
      errors.push(`${dataset.id} cannot declare both routes and routeOwner`);
    }
    if (dataset.routeOwner) {
      const owner = ids.get(dataset.routeOwner);
      if (!owner) errors.push(`${dataset.id} declares unknown routeOwner ${dataset.routeOwner}`);
      else if (!owner.routes) errors.push(`${dataset.id} routeOwner ${dataset.routeOwner} does not own routes`);
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
    if (!routes.html && !routes.api) errors.push(`${declaration.ownerId} routes must declare html or api`);
    for (const [name, value] of [['html', routes.html], ['api', routes.api]]) {
      if (value === undefined) continue;
      if (!validRoutePath(value)) errors.push(`${declaration.ownerId} routes.${name} is not a canonical route path: ${value}`);
      else claim(value, `${declaration.ownerId} routes.${name}`);
    }

    if (routes.apiRecord !== undefined) {
      const markerCount = routes.apiRecord.split('{id}').length - 1;
      if (!validRoutePath(routes.apiRecord.replace('{id}', 'record-id')) || markerCount !== 1) {
        errors.push(`${declaration.ownerId} routes.apiRecord must contain exactly one {id} path placeholder`);
      }
      if (!routes.api) errors.push(`${declaration.ownerId} routes.apiRecord requires routes.api`);
      else if (!routes.apiRecord.startsWith(`${routes.api}/`)) {
        errors.push(`${declaration.ownerId} routes.apiRecord must be nested beneath routes.api`);
      }
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
