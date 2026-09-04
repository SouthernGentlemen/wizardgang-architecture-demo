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

export type AssuranceRecordFamilyRegistrationStatus = 'unknown' | 'unsupported' | 'unavailable' | 'partial' | 'registered';
export interface AssuranceRecordFamilyRegistration {
  kind: string;
  status: AssuranceRecordFamilyRegistrationStatus;
  resources: AssuranceDiscoverableResource[];
  recordResources: AssuranceDiscoverableResource[];
  runtimeResources: AssuranceDiscoverableResource[];
}

export function flattenAssuranceResources(registry: AssuranceDiscoverableRegistry): AssuranceDiscoverableResource[];
export function assuranceResourceById(registry: AssuranceDiscoverableRegistry, id: string): AssuranceDiscoverableResource | undefined;
export function assuranceResourcesForKind(registry: AssuranceDiscoverableRegistry, kind: string): AssuranceDiscoverableResource[];
export function primaryAssuranceDatasetResource(registry: AssuranceDiscoverableRegistry, kind: string): AssuranceDiscoverableResource;
export function resolveAssuranceResourceOwner(
  registry: AssuranceDiscoverableRegistry,
  resourceOrId: AssuranceDiscoverableResource | string,
  ownerProperty?: string,
): AssuranceDiscoverableResource;
export function assuranceRecordFamilyRegistration(
  registry: AssuranceDiscoverableRegistry,
  kind: string,
): AssuranceRecordFamilyRegistration;
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
