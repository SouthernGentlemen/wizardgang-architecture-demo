import { assertSupportedAssuranceResource } from './publication-policy.ts';

export interface AssuranceRecordIdentityComponent {
  source: 'record' | 'resource';
  path: string;
}

export interface AssuranceRecordCollectionDeclaration {
  path: string;
  identity: Array<string | AssuranceRecordIdentityComponent>;
}

export interface AssuranceDiscoverableResource {
  id: string;
  kind: string;
  role?: string;
  path?: string;
  schema?: string;
  visibility?: 'public' | 'private';
  capabilities?: string[];
  routeOwner?: string;
  routes?: unknown;
  filters?: unknown;
  framework?: unknown;
  recordCollection?: AssuranceRecordCollectionDeclaration;
  resources?: AssuranceDiscoverableResource[];
}

export interface AssuranceDiscoverableRegistry {
  datasets?: AssuranceDiscoverableResource[];
  lifecycle?: AssuranceDiscoverableResource;
  presentations?: AssuranceDiscoverableResource[];
  operations?: AssuranceDiscoverableResource[];
}

export interface AssuranceRecordEntry<T = unknown> {
  resource: AssuranceDiscoverableResource;
  record: T;
}

export type AssuranceRecordFamilyRegistrationStatus =
  | 'unknown'
  | 'unsupported'
  | 'unavailable'
  | 'partial'
  | 'registered';

export interface AssuranceRecordFamilyRegistration {
  kind: string;
  status: AssuranceRecordFamilyRegistrationStatus;
  resources: AssuranceDiscoverableResource[];
  recordResources: AssuranceDiscoverableResource[];
  runtimeResources: AssuranceDiscoverableResource[];
}

function capabilities(resource: AssuranceDiscoverableResource | null | undefined): string[] {
  return Array.isArray(resource?.capabilities) ? resource.capabilities : [];
}

function visitResource(
  resource: AssuranceDiscoverableResource,
  resources: AssuranceDiscoverableResource[],
  inheritedFramework?: unknown,
): void {
  assertSupportedAssuranceResource(resource);
  const framework = resource.framework ?? inheritedFramework;
  const resolved = framework && !resource.framework ? { ...resource, framework } : resource;
  resources.push(resolved);
  for (const child of resource.resources ?? []) visitResource(child, resources, framework);
}

export function flattenAssuranceResources(
  registry: AssuranceDiscoverableRegistry,
): AssuranceDiscoverableResource[] {
  const resources: AssuranceDiscoverableResource[] = [];
  for (const dataset of registry?.datasets ?? []) visitResource(dataset, resources);
  if (registry?.lifecycle) visitResource(registry.lifecycle, resources);
  for (const resource of registry?.presentations ?? []) visitResource(resource, resources);
  for (const resource of registry?.operations ?? []) visitResource(resource, resources);
  return resources;
}

export function assuranceResourceById(
  registry: AssuranceDiscoverableRegistry,
  id: string,
): AssuranceDiscoverableResource | undefined {
  return flattenAssuranceResources(registry).find((resource) => resource.id === id);
}

export function assuranceResourcesForKind(
  registry: AssuranceDiscoverableRegistry,
  kind: string,
): AssuranceDiscoverableResource[] {
  return flattenAssuranceResources(registry).filter((resource) => resource.kind === kind);
}

export function primaryAssuranceDatasetResource(
  registry: AssuranceDiscoverableRegistry,
  kind: string,
): AssuranceDiscoverableResource {
  const matches = (registry?.datasets ?? []).filter(
    (resource) => resource?.kind === kind && resource?.role === 'dataset',
  );
  if (matches.length !== 1) {
    throw new Error(`Assurance registry expected exactly one primary ${kind} dataset; found ${matches.length}.`);
  }
  return matches[0];
}

function resourceProperty(
  resource: AssuranceDiscoverableResource,
  property: string,
): unknown {
  return (resource as AssuranceDiscoverableResource & Record<string, unknown>)[property];
}

export function resolveAssuranceResourceOwner(
  registry: AssuranceDiscoverableRegistry,
  resourceOrId: AssuranceDiscoverableResource | string,
  ownerProperty = 'routeOwner',
): AssuranceDiscoverableResource {
  let current = typeof resourceOrId === 'string'
    ? assuranceResourceById(registry, resourceOrId)
    : resourceOrId;
  if (!current) throw new Error(`Assurance registry cannot resolve resource ${String(resourceOrId)}.`);
  const seen = new Set<string>();
  while (resourceProperty(current, ownerProperty)) {
    if (seen.has(current.id)) {
      throw new Error(`Assurance ${ownerProperty} ownership cycle includes ${current.id}.`);
    }
    seen.add(current.id);
    const ownerId = resourceProperty(current, ownerProperty) as string;
    const owner = assuranceResourceById(registry, ownerId);
    if (!owner) throw new Error(`${current.id} declares unknown ${ownerProperty} ${ownerId}.`);
    current = owner;
  }
  return current;
}

export function assuranceRecordFamilyRegistration(
  registry: AssuranceDiscoverableRegistry,
  kind: string,
): AssuranceRecordFamilyRegistration {
  const resources = assuranceResourcesForKind(registry, kind);
  if (resources.length === 0) {
    return { kind, status: 'unknown', resources: [], recordResources: [], runtimeResources: [] };
  }
  const recordResources = resources.filter((resource) => capabilities(resource).includes('records'));
  if (recordResources.length === 0) {
    return { kind, status: 'unsupported', resources, recordResources, runtimeResources: [] };
  }
  const runtimeResources = recordResources.filter((resource) => capabilities(resource).includes('runtime'));
  if (runtimeResources.length === 0) {
    return { kind, status: 'unavailable', resources, recordResources, runtimeResources };
  }
  return {
    kind,
    status: runtimeResources.length === recordResources.length ? 'registered' : 'partial',
    resources,
    recordResources,
    runtimeResources,
  };
}

export function assuranceResourcesWithCapability(
  registry: AssuranceDiscoverableRegistry,
  capability: string,
): AssuranceDiscoverableResource[] {
  return flattenAssuranceResources(registry).filter((resource) => capabilities(resource).includes(capability));
}

export function requireAssuranceCapabilityResource(
  registry: AssuranceDiscoverableRegistry,
  capability: string,
): AssuranceDiscoverableResource {
  const matches = assuranceResourcesWithCapability(registry, capability);
  if (matches.length !== 1) {
    throw new Error(`Assurance registry expected exactly one ${capability} capability owner; found ${matches.length}.`);
  }
  return matches[0];
}

export function assuranceRecordResources(
  registry: AssuranceDiscoverableRegistry,
): AssuranceDiscoverableResource[] {
  return assuranceResourcesWithCapability(registry, 'records');
}

export function assuranceRecordCollectionPath(
  resource: AssuranceDiscoverableResource,
): string | null {
  if (!capabilities(resource).includes('records')) return null;
  const collectionPath = resource?.recordCollection?.path;
  if (typeof collectionPath !== 'string' || collectionPath.length === 0) {
    throw new Error(`${resource?.id ?? 'unknown assurance resource'} declares records capability without recordCollection.path.`);
  }
  return collectionPath;
}

export function assuranceValueAtPath(value: unknown, dottedPath: string): unknown {
  let current: unknown = value;
  for (const segment of String(dottedPath).split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function assuranceRecordsFromDocument(
  resource: AssuranceDiscoverableResource,
  document: unknown,
): unknown[] {
  const collectionPath = assuranceRecordCollectionPath(resource);
  if (!collectionPath) return [];
  const records = assuranceValueAtPath(document, collectionPath);
  if (!Array.isArray(records)) {
    throw new Error(`${resource.id} declares record collection ${collectionPath}, but that value is not an array.`);
  }
  return records;
}

export function assuranceRecordEntries(
  registry: AssuranceDiscoverableRegistry,
  loadDocument: (resource: AssuranceDiscoverableResource) => unknown,
  options: { runtimeOnly?: boolean } = {},
): AssuranceRecordEntry[] {
  const entries: AssuranceRecordEntry[] = [];
  for (const resource of assuranceRecordResources(registry)) {
    if (options.runtimeOnly && !capabilities(resource).includes('runtime')) continue;
    const document = loadDocument(resource);
    for (const record of assuranceRecordsFromDocument(resource, document)) entries.push({ resource, record });
  }
  return entries;
}

export function assuranceRecordsForKind<T = unknown>(
  entries: AssuranceRecordEntry[],
  kind: string,
): T[] {
  return entries
    .filter((entry) => entry.resource.kind === kind)
    .map((entry) => entry.record) as T[];
}

function stableIdentityPart(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return [...value].map(stableIdentityPart).sort().join(',');
  if (typeof value === 'object') {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
      ),
    );
  }
  return String(value);
}

function assuranceIdentityValue(
  resource: AssuranceDiscoverableResource,
  record: unknown,
  component: string | AssuranceRecordIdentityComponent,
): unknown {
  if (typeof component === 'string') return assuranceValueAtPath(record, component);
  const source = component?.source === 'resource' ? resource : record;
  return assuranceValueAtPath(source, component?.path);
}

export function assuranceRecordIdentity(
  resource: AssuranceDiscoverableResource,
  record: unknown,
): string {
  const identityPaths = resource?.recordCollection?.identity;
  if (!Array.isArray(identityPaths) || identityPaths.length === 0) {
    throw new Error(`${resource?.id ?? 'unknown assurance resource'} declares records capability without recordCollection.identity.`);
  }
  return `${resource.kind}|${identityPaths
    .map((component) => stableIdentityPart(assuranceIdentityValue(resource, record, component)))
    .join('|')}`;
}
