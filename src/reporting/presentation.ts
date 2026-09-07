import type {
  ReportingQueryResult,
  ReportingRecord,
  ReportingSource,
} from './contracts';

export type ReportingPresentationAvailability =
  | 'available'
  | 'empty'
  | 'partial'
  | 'unavailable'
  | 'rate-limited'
  | 'stale'
  | 'expired'
  | 'unconfigured';

export interface ReportingPresentationField {
  name: string;
  label: string;
  value: string;
}

export interface ReportingRelationshipPresentation {
  relation: string;
  label: string;
  targets: string[];
}

export interface ReportingRecordPresentation {
  id: string;
  title: string;
  recordType: string | null;
  status: string | null;
  availability: ReportingPresentationAvailability | null;
  fields: ReportingPresentationField[];
  relationships: ReportingRelationshipPresentation[];
  relationshipCount: number;
  sourceId: string | null;
  sourceLink: string | null;
}

export interface ReportingSourcePresentation {
  id: string;
  label: string;
  provider: string;
  visibility: 'public' | 'private';
  availability: ReportingPresentationAvailability;
  recordCount: number;
  resource: string;
  repository: string | null;
}

export interface ReportingQueryPresentation<T extends ReportingRecord = ReportingRecord> {
  dataset: string;
  label: string;
  availability: ReportingPresentationAvailability;
  count: number;
  totalAvailable: number;
  records: ReportingRecordPresentation[];
  sources: ReportingSourcePresentation[];
  facets: Readonly<Record<string, Readonly<Record<string, number>>>>;
  pagination: ReportingQueryResult<T>['query']['pagination'];
}

export interface ReportingPresentationOptions {
  label?: string;
}

const HIDDEN_FIELD_NAMES = new Set([
  'id',
  'title',
  'name',
  'identity',
  'native',
  'nativeId',
  'relationships',
  'source',
  'provider',
  'repository',
  'url',
  'fields',
]);

export function reportingPresentationLabel(value: string): string {
  return value
    .replace(/^github\./, '')
    .replace(/^cloudflare\./, '')
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.length <= 3 && part.toUpperCase() === part ? part : `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function scalarText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null) return 'None';
  return null;
}

function normalizedAvailability(value: unknown): ReportingPresentationAvailability | null {
  if (value === 'available' || value === 'empty' || value === 'partial' || value === 'unavailable'
    || value === 'rate-limited' || value === 'stale' || value === 'expired' || value === 'unconfigured') return value;
  if (value === 'live') return 'available';
  return null;
}

function targetText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const object = value as Record<string, unknown>;
  for (const candidate of [object.id, object.native, object.recordId, object.target]) {
    if (typeof candidate === 'string' && candidate) return candidate;
  }
  return null;
}

function rawRelationshipCount(record: Record<string, unknown>): number {
  const relationships = record.relationships;
  if (Array.isArray(relationships)) return relationships.length;
  if (!relationships || typeof relationships !== 'object') return 0;
  return Object.values(relationships as Record<string, unknown>)
    .reduce<number>((total, value) => total + (Array.isArray(value) ? value.length : value === null || value === undefined ? 0 : 1), 0);
}

function recordRelationships(record: Record<string, unknown>): ReportingRelationshipPresentation[] {
  const relationships = record.relationships;
  if (Array.isArray(relationships)) {
    const grouped = new Map<string, string[]>();
    for (const relationship of relationships) {
      if (!relationship || typeof relationship !== 'object' || Array.isArray(relationship)) continue;
      const object = relationship as Record<string, unknown>;
      const relation = typeof object.relation === 'string' && object.relation ? object.relation : 'related';
      const target = targetText(object.to) ?? targetText(object.target) ?? targetText(object);
      if (!target) continue;
      const values = grouped.get(relation) ?? [];
      values.push(target);
      grouped.set(relation, values);
    }
    return [...grouped].map(([relation, targets]) => ({ relation, label: reportingPresentationLabel(relation), targets }));
  }
  if (!relationships || typeof relationships !== 'object') return [];
  return Object.entries(relationships as Record<string, unknown>).flatMap(([relation, raw]) => {
    const values = Array.isArray(raw) ? raw : [raw];
    const targets = values.map(targetText).filter((value): value is string => Boolean(value));
    return targets.length > 0 ? [{ relation, label: reportingPresentationLabel(relation), targets }] : [];
  });
}

function recordTitle(record: Record<string, unknown>, id: string): string {
  const nested = record.fields && typeof record.fields === 'object' && !Array.isArray(record.fields)
    ? record.fields as Record<string, unknown>
    : {};
  const candidates = [
    record.title, record.name, record.reference, record.metric, record.scenario, record.objective,
    nested.title, nested.name, nested.reference, nested.objective, nested.description,
  ];
  for (const candidate of candidates) {
    const value = scalarText(candidate);
    if (value && value !== 'None') return value;
  }
  return id;
}

function appendScalarFields(
  output: ReportingPresentationField[],
  source: Record<string, unknown>,
  prefix = '',
  limit = 12,
): void {
  for (const [name, raw] of Object.entries(source)) {
    if (!prefix && HIDDEN_FIELD_NAMES.has(name)) continue;
    const path = prefix ? `${prefix}.${name}` : name;
    const value = scalarText(raw);
    if (value !== null && value.length > 0) {
      output.push({ name: path, label: reportingPresentationLabel(path), value });
    } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      appendScalarFields(output, raw as Record<string, unknown>, path, limit);
    }
    if (output.length >= limit) return;
  }
}

function recordFields(record: Record<string, unknown>, limit = 12): ReportingPresentationField[] {
  const fields: ReportingPresentationField[] = [];
  if (record.fields && typeof record.fields === 'object' && !Array.isArray(record.fields)) {
    appendScalarFields(fields, record.fields as Record<string, unknown>, '', limit);
  }
  if (fields.length < limit) appendScalarFields(fields, record, '', limit);
  const unique = new Map<string, ReportingPresentationField>();
  for (const field of fields) if (!unique.has(field.name)) unique.set(field.name, field);
  return [...unique.values()].slice(0, limit);
}

function queryAvailability<T extends ReportingRecord>(
  result: ReportingQueryResult<T>,
  key: string,
): ReportingPresentationAvailability {
  const direct = normalizedAvailability(result.availability[key]);
  const fallback = direct ?? Object.values(result.availability).map(normalizedAvailability).find(Boolean) ?? null;
  const qualification = Object.values(result.qualifications).filter((value): value is string => typeof value === 'string').join(' ').toLowerCase();
  if (fallback === 'unavailable' && qualification.includes('unconfigur')) return 'unconfigured';
  if ((fallback === 'available' || fallback === null) && result.derived.count === 0) return 'empty';
  return fallback ?? (result.derived.count === 0 ? 'empty' : 'available');
}

function sourceAvailability<T extends ReportingRecord>(
  result: ReportingQueryResult<T>,
  source: ReportingSource,
  overall: ReportingPresentationAvailability,
): ReportingPresentationAvailability {
  const explicit = normalizedAvailability(result.availability[source.id]);
  if (explicit) return explicit;
  const dataset = normalizedAvailability(result.availability[result.dataset]);
  return dataset ?? overall;
}

export function presentReportingRecord(record: ReportingRecord): ReportingRecordPresentation {
  const source = record as unknown as Record<string, unknown>;
  const relationships = recordRelationships(source);
  const presentedRelationshipCount = relationships.reduce((total, relationship) => total + relationship.targets.length, 0);
  const sourceId = typeof source.source === 'string' ? source.source : null;
  const sourceLink = typeof source.url === 'string' && /^https:\/\//.test(source.url) ? source.url : null;
  return {
    id: record.id,
    title: recordTitle(source, record.id),
    recordType: scalarText(source.recordType),
    status: scalarText(source.status),
    availability: normalizedAvailability(source.availability),
    fields: recordFields(source),
    relationships,
    relationshipCount: Math.max(rawRelationshipCount(source), presentedRelationshipCount),
    sourceId,
    sourceLink,
  };
}

export function presentReportingQuery<T extends ReportingRecord>(
  result: ReportingQueryResult<T>,
  options: ReportingPresentationOptions = {},
): ReportingQueryPresentation<T> {
  const availability = queryAvailability(result, result.dataset);
  const records = result.records.map((record) => presentReportingRecord(record));
  const countsBySource = new Map<string, number>();
  for (const record of records) {
    if (record.sourceId) countsBySource.set(record.sourceId, (countsBySource.get(record.sourceId) ?? 0) + 1);
  }
  return {
    dataset: result.dataset,
    label: options.label ?? reportingPresentationLabel(result.dataset),
    availability,
    count: result.derived.count,
    totalAvailable: result.derived.totalAvailable,
    records,
    sources: result.sources.map((source) => ({
      id: source.id,
      label: reportingPresentationLabel(source.id),
      provider: source.provider,
      visibility: source.visibility,
      availability: sourceAvailability(result, source, availability),
      recordCount: countsBySource.get(source.id) ?? (result.sources.length === 1 ? records.length : 0),
      resource: source.scope.resource,
      repository: source.scope.repository ?? null,
    })),
    facets: result.derived.facets,
    pagination: result.query.pagination,
  };
}
