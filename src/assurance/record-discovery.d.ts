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
  capabilities?: string[];
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

export function flattenAssuranceResources(registry: AssuranceDiscoverableRegistry): AssuranceDiscoverableResource[];
export function assuranceResourcesWithCapability(
  registry: AssuranceDiscoverableRegistry,
  capability: string,
): AssuranceDiscoverableResource[];
export function requireAssuranceCapabilityResource(
  registry: AssuranceDiscoverableRegistry,
  capability: string,
): AssuranceDiscoverableResource;
export function assuranceRecordResources(registry: AssuranceDiscoverableRegistry): AssuranceDiscoverableResource[];
export function assuranceRecordCollectionPath(resource: AssuranceDiscoverableResource): string | null;
export function assuranceValueAtPath(value: unknown, dottedPath: string): unknown;
export function assuranceRecordsFromDocument(resource: AssuranceDiscoverableResource, document: unknown): unknown[];
export function assuranceRecordEntries(
  registry: AssuranceDiscoverableRegistry,
  loadDocument: (resource: AssuranceDiscoverableResource) => unknown,
  options?: { runtimeOnly?: boolean },
): AssuranceRecordEntry[];
export function assuranceRecordsForKind<T = unknown>(entries: AssuranceRecordEntry[], kind: string): T[];
export function assuranceRecordIdentity(resource: AssuranceDiscoverableResource, record: unknown): string;
