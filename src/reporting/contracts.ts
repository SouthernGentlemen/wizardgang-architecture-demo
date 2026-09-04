export type ReportingProvider = 'github' | 'cloudflare';
export type ReportingAuthority = 'native-object' | 'structured-record' | 'native-observation';
export type ReportingVisibility = 'public' | 'private';
export type ReportingCapability = 'read' | 'query' | 'export' | 'import' | 'observe';
export type ReportingAvailability = 'available' | 'partial' | 'unavailable';
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

export interface AuthoritativeReportingCollection<T extends ReportingRecord> {
  source: string;
  records: readonly T[];
  relationships: readonly ReportingRelationship[];
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function reportingRecord(value: unknown): value is ReportingRecord {
  const candidate = object(value);
  return typeof candidate?.id === 'string' && candidate.id.length > 0;
}

function reportingIdentity(value: unknown): value is ReportingIdentity {
  const candidate = object(value);
  return typeof candidate?.source === 'string'
    && candidate.source.length > 0
    && typeof candidate.native === 'string'
    && candidate.native.length > 0
    && (candidate.revision === undefined || typeof candidate.revision === 'string')
    && (candidate.observation === undefined || typeof candidate.observation === 'string');
}

function reportingRelationship(value: unknown): value is ReportingRelationship {
  const candidate = object(value);
  return typeof candidate?.relation === 'string'
    && candidate.relation.length > 0
    && reportingIdentity(candidate.from)
    && reportingIdentity(candidate.to);
}

export function createReportingCollection<T extends ReportingRecord>(
  source: ReportingSource,
  records: readonly T[],
  relationships: readonly ReportingRelationship[] = [],
): ReportingCollectionResult<T> {
  return { source, records, relationships, derived: { count: records.length } };
}

export function exportAuthoritativeReportingCollection<T extends ReportingRecord>(
  result: ReportingCollectionResult<T>,
): AuthoritativeReportingCollection<T> {
  return { source: result.source.id, records: result.records, relationships: result.relationships };
}

export function importAuthoritativeReportingCollection<T extends ReportingRecord = ReportingRecord>(
  value: unknown,
): AuthoritativeReportingCollection<T> {
  const candidate = object(value);
  if (!candidate) throw new TypeError('Reporting import must be an object.');
  if ('derived' in candidate) throw new TypeError('Derived reporting fields are presentation-only and cannot be imported as authority.');
  if (typeof candidate.source !== 'string' || candidate.source.length === 0) throw new TypeError('Reporting import requires a source identity.');
  if (!Array.isArray(candidate.records) || !candidate.records.every(reportingRecord)) throw new TypeError('Reporting import records must have canonical ids.');
  if (!Array.isArray(candidate.relationships) || !candidate.relationships.every(reportingRelationship)) throw new TypeError('Reporting import relationships must use the common relationship identity contract.');
  const allowed = new Set(['source', 'records', 'relationships']);
  for (const key of Object.keys(candidate)) if (!allowed.has(key)) throw new TypeError(`Reporting import contains unsupported field ${key}.`);
  return candidate as unknown as AuthoritativeReportingCollection<T>;
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
