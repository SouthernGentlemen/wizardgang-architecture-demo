function capabilities(resource) {
  return Array.isArray(resource?.capabilities) ? resource.capabilities : [];
}

function visitResource(resource, resources, inheritedFramework) {
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

export function assuranceRecordResources(registry) {
  return flattenAssuranceResources(registry).filter((resource) => capabilities(resource).includes('records'));
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
    if (options.runtimeOnly && !capabilities(resource).includes('runtime')) {
      throw new Error(`${resource.id} declares records capability without runtime capability; Worker record discovery cannot load it.`);
    }
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
