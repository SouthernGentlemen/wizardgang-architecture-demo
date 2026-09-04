import { assertSupportedAssuranceResource } from './publication-policy.js';

function capabilities(resource) {
  return Array.isArray(resource?.capabilities) ? resource.capabilities : [];
}

function visitResource(resource, resources, inheritedFramework) {
  assertSupportedAssuranceResource(resource);
  const framework = resource?.framework ?? inheritedFramework;
  const resolved = framework && !resource?.framework ? { ...resource, framework } : resource;
  resources.push(resolved);
  for (const child of resource?.resources ?? []) visitResource(child, resources, framework);
}

export function flattenAssuranceResources(registry) {
  const resources = [];
  for (const dataset of registry?.datasets ?? []) visitResource(dataset, resources);
  if (registry?.lifecycle) visitResource(registry.lifecycle, resources);
  for (const resource of registry?.presentations ?? []) visitResource(resource, resources);
  for (const resource of registry?.operations ?? []) visitResource(resource, resources);
  return resources;
}

export function assuranceResourceById(registry, id) {
  return flattenAssuranceResources(registry).find((resource) => resource.id === id);
}

export function assuranceResourcesForKind(registry, kind) {
  return flattenAssuranceResources(registry).filter((resource) => resource.kind === kind);
}

export function primaryAssuranceDatasetResource(registry, kind) {
  const matches = (registry?.datasets ?? []).filter(
    (resource) => resource?.kind === kind && resource?.role === 'dataset',
  );
  if (matches.length !== 1) {
    throw new Error(`Assurance registry expected exactly one primary ${kind} dataset; found ${matches.length}.`);
  }
  return matches[0];
}

export function resolveAssuranceResourceOwner(registry, resourceOrId, ownerProperty = 'routeOwner') {
  let current = typeof resourceOrId === 'string' ? assuranceResourceById(registry, resourceOrId) : resourceOrId;
  if (!current) throw new Error(`Assurance registry cannot resolve resource ${String(resourceOrId)}.`);
  const seen = new Set();
  while (current?.[ownerProperty]) {
    if (seen.has(current.id)) throw new Error(`Assurance ${ownerProperty} ownership cycle includes ${current.id}.`);
    seen.add(current.id);
    const ownerId = current[ownerProperty];
    const owner = assuranceResourceById(registry, ownerId);
    if (!owner) throw new Error(`${current.id} declares unknown ${ownerProperty} ${ownerId}.`);
    current = owner;
  }
  return current;
}

export function assuranceRecordFamilyRegistration(registry, kind) {
  const resources = assuranceResourcesForKind(registry, kind);
  if (resources.length === 0) return { kind, status: 'unknown', resources: [], recordResources: [], runtimeResources: [] };
  const recordResources = resources.filter((resource) => capabilities(resource).includes('records'));
  if (recordResources.length === 0) return { kind, status: 'unsupported', resources, recordResources, runtimeResources: [] };
  const runtimeResources = recordResources.filter((resource) => capabilities(resource).includes('runtime'));
  if (runtimeResources.length === 0) return { kind, status: 'unavailable', resources, recordResources, runtimeResources };
  return {
    kind,
    status: runtimeResources.length === recordResources.length ? 'registered' : 'partial',
    resources,
    recordResources,
    runtimeResources,
  };
}

export function assuranceResourcesWithCapability(registry, capability) {
  return flattenAssuranceResources(registry).filter((resource) => capabilities(resource).includes(capability));
}

export function requireAssuranceCapabilityResource(registry, capability) {
  const matches = assuranceResourcesWithCapability(registry, capability);
  if (matches.length !== 1) {
    throw new Error(`Assurance registry expected exactly one ${capability} capability owner; found ${matches.length}.`);
  }
  return matches[0];
}

export function assuranceRecordResources(registry) {
  return assuranceResourcesWithCapability(registry, 'records');
}

export function assuranceRecordCollectionPath(resource) {
  if (!capabilities(resource).includes('records')) return null;
  const collectionPath = resource?.recordCollection?.path;
  if (typeof collectionPath !== 'string' || collectionPath.length === 0) {
    throw new Error(`${resource?.id ?? 'unknown assurance resource'} declares records capability without recordCollection.path.`);
  }
  return collectionPath;
}

export function assuranceValueAtPath(value, dottedPath) {
  return String(dottedPath).split('.').reduce((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    return current[segment];
  }, value);
}

export function assuranceRecordsFromDocument(resource, document) {
  const collectionPath = assuranceRecordCollectionPath(resource);
  if (!collectionPath) return [];
  const records = assuranceValueAtPath(document, collectionPath);
  if (!Array.isArray(records)) {
    throw new Error(`${resource.id} declares record collection ${collectionPath}, but that value is not an array.`);
  }
  return records;
}

export function assuranceRecordEntries(registry, loadDocument, options = {}) {
  const entries = [];
  for (const resource of assuranceRecordResources(registry)) {
    if (options.runtimeOnly && !capabilities(resource).includes('runtime')) continue;
    const document = loadDocument(resource);
    for (const record of assuranceRecordsFromDocument(resource, document)) entries.push({ resource, record });
  }
  return entries;
}

export function assuranceRecordsForKind(entries, kind) {
  return entries.filter((entry) => entry.resource.kind === kind).map((entry) => entry.record);
}

function stableIdentityPart(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return [...value].map(stableIdentityPart).sort().join(',');
  if (typeof value === 'object') {
    return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))));
  }
  return String(value);
}

function assuranceIdentityValue(resource, record, component) {
  if (typeof component === 'string') return assuranceValueAtPath(record, component);
  const source = component?.source === 'resource' ? resource : record;
  return assuranceValueAtPath(source, component?.path);
}

export function assuranceRecordIdentity(resource, record) {
  const identityPaths = resource?.recordCollection?.identity;
  if (!Array.isArray(identityPaths) || identityPaths.length === 0) {
    throw new Error(`${resource?.id ?? 'unknown assurance resource'} declares records capability without recordCollection.identity.`);
  }
  return `${resource.kind}|${identityPaths.map((component) => stableIdentityPart(assuranceIdentityValue(resource, record, component))).join('|')}`;
}
