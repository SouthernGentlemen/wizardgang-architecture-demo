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
  | 'expired'
  | 'unconfigured';

export interface ReportingPresentationField {
  name: string;
  label: string;
  value: string;
}

export interface ReportingRecordPresentation {
  id: string;
  title: string;
  status: string | null;
  availability: ReportingPresentationAvailability | null;
  fields: ReportingPresentationField[];
  relationshipCount: number;
  sourceLink: string | null;
}

export interface ReportingSourcePresentation {
  id: string;
  label: string;
  provider: string;
  visibility: 'public' | 'private';
  availability: ReportingPresentationAvailability;
  recordCount: number;
  source: ReportingSource;
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
  return null;
}

function normalizedAvailability(value: unknown): ReportingPresentationAvailability | null {
  if (value === 'available' || value === 'empty' || value === 'partial' || value === 'unavailable'
    || value === 'rate-limited' || value === 'expired' || value === 'unconfigured') return value;
  if (value === 'live') return 'available';
  return null;
}

function relationshipCount(record: Record<string, unknown>): number {
  const relationships = record.relationships;
  if (Array.isArray(relationships)) return relationships.length;
  if (!relationships || typeof relationships !== 'object') return 0;
  return Object.values(relationships as Record<string, unknown>)
    .reduce<number>((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
}

function recordTitle(record: Record<string, unknown>, id: string): string {
  const candidates = [record.title, record.name, record.reference, record.metric, record.scenario, record.objective];
  for (const candidate of candidates) {
    const value = scalarText(candidate);
    if (value) return value;
  }
  return id;
}

function recordFields(record: Record<string, unknown>, limit = 6): ReportingPresentationField[] {
  const fields: ReportingPresentationField[] = [];
  for (const [name, raw] of Object.entries(record)) {
    if (HIDDEN_FIELD_NAMES.has(name)) continue;
    const value = scalarText(raw);
    if (value === null || value.length === 0) continue;
    fields.push({ name, label: reportingPresentationLabel(name), value });
    if (fields.length >= limit) break;
  }
  return fields;
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
  const status = scalarText(source.status);
  const sourceLink = typeof source.url === 'string' && /^https:\/\//.test(source.url) ? source.url : null;
  return {
    id: record.id,
    title: recordTitle(source, record.id),
    status,
    availability: normalizedAvailability(source.availability),
    fields: recordFields(source),
    relationshipCount: relationshipCount(source),
    sourceLink,
  };
}

export function presentReportingQuery<T extends ReportingRecord>(
  result: ReportingQueryResult<T>,
): ReportingQueryPresentation<T> {
  const availability = queryAvailability(result, result.dataset);
  const records = result.records.map((record) => presentReportingRecord(record));
  const countsBySource = new Map<string, number>();
  for (const record of result.records) {
    const source = (record as unknown as { source?: unknown }).source;
    if (typeof source === 'string') countsBySource.set(source, (countsBySource.get(source) ?? 0) + 1);
  }
  return {
    dataset: result.dataset,
    label: reportingPresentationLabel(result.dataset),
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
      source,
    })),
    facets: result.derived.facets,
    pagination: result.query.pagination,
  };
}
