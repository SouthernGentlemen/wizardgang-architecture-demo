export type ReportingProvider = 'github' | 'cloudflare';
export type ReportingAuthority = 'native-object' | 'structured-record' | 'native-observation';
export type ReportingVisibility = 'public' | 'private';
export type ReportingCapability = 'read' | 'query' | 'export' | 'import' | 'observe';
export type ReportingAvailability = 'available' | 'partial' | 'unavailable' | 'rate-limited' | 'expired';
export type ReportingScalar = string | number | boolean | null;

export interface ReportingSource {
  id: string;
  provider: ReportingProvider;
  authority: ReportingAuthority;
  scope: { repository?: string; resource: string };
  nativeIdentity: readonly string[];
  revisionIdentity?: readonly string[];
  observationIdentity?: readonly string[];
  schema: string;
  visibility: ReportingVisibility;
  capabilities: readonly ReportingCapability[];
  ingestion: 'enabled' | 'disabled';
}

export interface ReportingIdentity {
  source: string;
  native: string;
  revision?: string;
  observation?: string;
}

export interface ReportingRelationship {
  relation: string;
  from: ReportingIdentity;
  to: ReportingIdentity;
}

export interface ReportingObservationWindow { start: string; end: string }

export interface ReportingObservation<T = unknown> {
  identity: ReportingIdentity;
  source: string;
  resource: string;
  metric: string;
  dimensions: Readonly<Record<string, ReportingScalar>>;
  window: ReportingObservationWindow;
  observedAt: string;
  availability: ReportingAvailability;
  value: T;
}

export interface ReportingRecord { id: string }

export interface ReportingCollectionResult<T extends ReportingRecord> {
  source: ReportingSource;
  records: readonly T[];
  relationships: readonly ReportingRelationship[];
  derived: { readonly count: number };
}

export interface ReportingQuery {
  filters: Readonly<Record<string, string>>;
  pagination?: {
    limit: number;
    returned: number;
    total: number;
    nextCursor: string | null;
  };
}

export interface ReportingQueryResult<T extends ReportingRecord> {
  schemaVersion: 1;
  contract: string;
  dataset: string;
  datasets: readonly string[];
  availability: Readonly<Record<string, string>>;
  sources: readonly ReportingSource[];
  qualifications: Readonly<Record<string, string | null>>;
  query: ReportingQuery;
  records: readonly T[];
  derived: {
    count: number;
    totalAvailable: number;
    facets: Readonly<Record<string, Readonly<Record<string, number>>>>;
  };
}

export interface ReportingResourceReference {
  id: string;
  path: string;
  schema: string;
  collectionPath: string;
  visibility: ReportingVisibility;
}

export interface ReportingSourceRevision {
  commit: string;
  blob: string;
}

export interface ReportingInterchangeCollection<T extends ReportingRecord = ReportingRecord> {
  source: ReportingSource;
  resource: ReportingResourceReference;
  revision: ReportingSourceRevision;
  records: readonly T[];
  relationships: readonly ReportingRelationship[];
}

export interface ReportingInterchangeEnvelope<T extends ReportingRecord = ReportingRecord> {
  contract: string;
  registry: { id: string; schemaVersion: 1 };
  collections: readonly ReportingInterchangeCollection<T>[];
}

export function createReportingCollection<T extends ReportingRecord>(
  source: ReportingSource,
  records: readonly T[],
  relationships: readonly ReportingRelationship[] = [],
): ReportingCollectionResult<T> {
  return { source, records, relationships, derived: { count: records.length } };
}

function normalizedDimensions(dimensions: Readonly<Record<string, ReportingScalar>>): Array<[string, ReportingScalar]> {
  return Object.entries(dimensions).sort(([left], [right]) => left.localeCompare(right));
}

export function reportingObservationIdentity(
  resource: string,
  metric: string,
  dimensions: Readonly<Record<string, ReportingScalar>>,
  window: ReportingObservationWindow,
): string {
  return JSON.stringify([resource, metric, normalizedDimensions(dimensions), window.start, window.end]);
}

export function createReportingObservation<T>(input: {
  source: ReportingSource;
  resource: string;
  metric: string;
  dimensions?: Readonly<Record<string, ReportingScalar>>;
  window: ReportingObservationWindow;
  observedAt: string;
  availability: ReportingAvailability;
  value: T;
}): ReportingObservation<T> {
  if (input.source.authority !== 'native-observation') throw new TypeError(`${input.source.id} is not an observation authority.`);
  const dimensions = input.dimensions ?? {};
  const observation = reportingObservationIdentity(input.resource, input.metric, dimensions, input.window);
  return {
    identity: { source: input.source.id, native: input.resource, observation },
    source: input.source.id,
    resource: input.resource,
    metric: input.metric,
    dimensions,
    window: input.window,
    observedAt: input.observedAt,
    availability: input.availability,
    value: input.value,
  };
}
