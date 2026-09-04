import {
  assuranceResourceById,
  flattenAssuranceResources,
  resolveAssuranceResourceOwner,
} from './record-discovery.js';

function indexedDataset(registry, kind) {
  const matches = (registry?.datasets ?? []).filter(
    (dataset) => dataset?.kind === kind && dataset?.role === 'dataset' && dataset?.capabilities?.includes('api-index'),
  );
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error(`assurance route contract expected exactly one indexed ${kind} dataset; found ${matches.length}`);
  }
  return matches[0];
}

export function assuranceRouteOwnerResource(registry, kind) {
  const indexed = indexedDataset(registry, kind);
  if (!indexed) return null;
  const owner = resolveAssuranceResourceOwner(registry, indexed, 'routeOwner');
  return owner?.routes ? owner : null;
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

function routeSegments(path) {
  return path === '/' ? [] : path.slice(1).split('/');
}

function matchRecordTemplate(template, path) {
  const templateSegments = routeSegments(template);
  const pathSegments = routeSegments(path);
  if (templateSegments.length !== pathSegments.length) return null;

  let recordId;
  for (let index = 0; index < templateSegments.length; index += 1) {
    const templateSegment = templateSegments[index];
    const pathSegment = pathSegments[index];
    if (templateSegment === '{id}') {
      if (pathSegment.length === 0) return null;
      recordId = pathSegment;
    } else if (templateSegment !== pathSegment) {
      return null;
    }
  }
  return recordId ?? null;
}

function recordTemplateIntersection(left, right) {
  const leftSegments = routeSegments(left);
  const rightSegments = routeSegments(right);
  if (leftSegments.length !== rightSegments.length) return null;

  const witness = [];
  for (let index = 0; index < leftSegments.length; index += 1) {
    const leftSegment = leftSegments[index];
    const rightSegment = rightSegments[index];
    if (leftSegment !== '{id}' && rightSegment !== '{id}' && leftSegment !== rightSegment) return null;
    witness.push(leftSegment === '{id}' ? (rightSegment === '{id}' ? 'record-id' : rightSegment) : leftSegment);
  }
  return `/${witness.join('/')}`;
}

export function matchAssuranceRoute(registry, path) {
  for (const alias of assuranceRouteAliases(registry)) {
    if (alias.path === path) return { owner: alias.owner, kind: 'alias', target: alias.target };
  }

  const declarations = assuranceRouteDeclarations(registry);
  for (const declaration of declarations) {
    const routes = declaration.routes ?? {};
    if (routes.html === path) return { owner: declaration.owner, kind: 'html' };
    if (routes.api === path) return { owner: declaration.owner, kind: 'api-collection' };
  }

  for (const declaration of declarations) {
    const template = declaration.routes?.apiRecord;
    if (!template) continue;
    const recordId = matchRecordTemplate(template, path);
    if (recordId !== null) return { owner: declaration.owner, kind: 'api-record', recordId };
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
    if (routes.api && !ownerSupport.apiCollection) {
      errors.push(`${declaration.ownerId} declares routes.api without a collection API handler`);
    }
    if (routes.apiRecord && !ownerSupport.apiRecord) {
      errors.push(`${declaration.ownerId} declares routes.apiRecord without an exact-record API handler`);
    }
  }
  return errors;
}

export function validateAssuranceRouteContract(registry) {
  const errors = [];
  const resources = flattenAssuranceResources(registry);
  const ids = new Map(resources.map((resource) => [resource.id, resource]));

  if (!registry?.routes?.api) errors.push('registry must declare routes.api');

  for (const resource of resources.filter((entry) => entry.role === 'dataset')) {
    if (resource.routes && resource.routeOwner) {
      errors.push(`${resource.id} cannot declare both routes and routeOwner`);
    }
    if (resource.routeOwner) {
      const owner = assuranceResourceById(registry, resource.routeOwner);
      if (!owner) errors.push(`${resource.id} declares unknown routeOwner ${resource.routeOwner}`);
      else if (!owner.routes) errors.push(`${resource.id} routeOwner ${resource.routeOwner} does not own routes`);
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
  const recordTemplates = [];
  const claim = (path, label) => {
    const existing = claimedPaths.get(path);
    if (existing) errors.push(`${label} collides with ${existing} at ${path}`);
    else claimedPaths.set(path, label);
  };

  for (const declaration of declarations) {
    const routes = declaration.routes ?? {};
    const resource = declaration.owner === 'registry' ? null : ids.get(declaration.ownerId);
    const capabilities = new Set(resource?.capabilities ?? []);
    if (!routes.html && !routes.api) errors.push(`${declaration.ownerId} routes must declare html or api`);
    for (const [name, value] of [['html', routes.html], ['api', routes.api]]) {
      if (value === undefined) continue;
      if (!validRoutePath(value)) errors.push(`${declaration.ownerId} routes.${name} is not a canonical route path: ${value}`);
      else claim(value, `${declaration.ownerId} routes.${name}`);
    }

    if (resource && (routes.html || routes.api || routes.apiRecord) && !capabilities.has('runtime')) {
      errors.push(`${declaration.ownerId} route owner must declare runtime capability`);
    }
    if (resource && routes.api && !capabilities.has('api-index')) {
      errors.push(`${declaration.ownerId} routes.api requires api-index capability`);
    }
    if (resource && routes.api && !capabilities.has('records')) {
      errors.push(`${declaration.ownerId} routes.api requires records capability`);
    }

    if (routes.apiRecord !== undefined) {
      const markerCount = routes.apiRecord.split('{id}').length - 1;
      const placeholderSegments = validRoutePath(routes.apiRecord) ? routeSegments(routes.apiRecord).filter((segment) => segment === '{id}').length : 0;
      const validTemplate = validRoutePath(routes.apiRecord.replace('{id}', 'record-id'))
        && markerCount === 1
        && placeholderSegments === 1;
      if (!validTemplate) {
        errors.push(`${declaration.ownerId} routes.apiRecord must contain exactly one {id} path-segment placeholder`);
      } else {
        recordTemplates.push({ path: routes.apiRecord, label: `${declaration.ownerId} routes.apiRecord` });
      }
      if (!routes.api) errors.push(`${declaration.ownerId} routes.apiRecord requires routes.api`);
      else if (!routes.apiRecord.startsWith(`${routes.api}/`)) {
        errors.push(`${declaration.ownerId} routes.apiRecord must be nested beneath routes.api`);
      }
      if (resource && !capabilities.has('records')) {
        errors.push(`${declaration.ownerId} routes.apiRecord requires records capability`);
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

  for (let leftIndex = 0; leftIndex < recordTemplates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < recordTemplates.length; rightIndex += 1) {
      const left = recordTemplates[leftIndex];
      const right = recordTemplates[rightIndex];
      const witness = recordTemplateIntersection(left.path, right.path);
      if (witness) errors.push(`${left.label} intersects ${right.label} at ${witness}`);
    }
  }

  return errors;
}
