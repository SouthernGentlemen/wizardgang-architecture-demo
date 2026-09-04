import type { Principal } from '../lib/authorization';
import type {
  ReportingCollectionResult,
  ReportingRecord,
  ReportingRelationship,
  ReportingSource,
} from './contracts';

export type ReportingDisclosureKind = 'public' | 'authorized' | 'published-projection';

export interface ReportingDisclosure {
  kind: ReportingDisclosureKind;
  sourceRevision?: string;
}

export interface ReportingView<T extends ReportingRecord = ReportingRecord> {
  source: ReportingSource;
  records: T[];
  relationships: ReportingRelationship[];
  derived: { count: number };
  disclosure: ReportingDisclosure;
}

export interface ReportingPublicProjection<TSource extends ReportingRecord, TPublic extends ReportingRecord> {
  sourceRevision: string;
  approvedRevision: string;
  project(record: TSource): TPublic | null | undefined;
}

export class ReportingDisclosureError extends Error {
  constructor(
    readonly code: 'authentication_required' | 'permission_denied' | 'reporting_publication_revision_mismatch',
    readonly status: 401 | 403 | 409,
  ) {
    super(code);
  }
}

function canReadPrivate(principal: Principal | null | undefined): boolean {
  return Boolean(principal?.permissions.includes('reporting:private'));
}

function publicSource(source: ReportingSource): ReportingSource {
  return {
    ...source,
    scope: { resource: source.scope.resource },
    visibility: 'public',
    capabilities: source.capabilities.filter((capability) => capability !== 'import'),
    ingestion: 'disabled',
  };
}

function publishedRelationships(
  source: ReportingSource,
  records: ReportingRecord[],
  relationships: readonly ReportingRelationship[],
): ReportingRelationship[] {
  const visible = new Set(records.map((record) => record.id));
  return relationships.filter((relationship) => (
    relationship.from.source === source.id
    && relationship.to.source === source.id
    && visible.has(relationship.from.native)
    && visible.has(relationship.to.native)
  ));
}

export function discloseReportingCollection<
  TSource extends ReportingRecord,
  TPublic extends ReportingRecord = TSource,
>(
  collection: ReportingCollectionResult<TSource>,
  principal?: Principal | null,
  publication?: ReportingPublicProjection<TSource, TPublic>,
): ReportingView<TSource | TPublic> {
  if (collection.source.visibility === 'public') {
    return {
      source: collection.source,
      records: [...collection.records],
      relationships: [...collection.relationships],
      derived: { count: collection.records.length },
      disclosure: { kind: 'public' },
    };
  }

  if (canReadPrivate(principal)) {
    return {
      source: collection.source,
      records: [...collection.records],
      relationships: [...collection.relationships],
      derived: { count: collection.records.length },
      disclosure: { kind: 'authorized' },
    };
  }

  if (!publication) {
    const authenticated = Boolean(principal && principal.authentication !== 'anonymous');
    throw new ReportingDisclosureError(authenticated ? 'permission_denied' : 'authentication_required', authenticated ? 403 : 401);
  }
  if (publication.sourceRevision !== publication.approvedRevision) {
    throw new ReportingDisclosureError('reporting_publication_revision_mismatch', 409);
  }

  const records: TPublic[] = collection.records.flatMap((record) => {
    const projected = publication.project(record);
    return projected ? [projected] : [];
  });
  return {
    source: publicSource(collection.source),
    records,
    relationships: publishedRelationships(collection.source, records, collection.relationships),
    derived: { count: records.length },
    disclosure: { kind: 'published-projection', sourceRevision: publication.sourceRevision },
  };
}

export function reportingFacets<T extends ReportingRecord>(
  view: ReportingView<T>,
  field: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of view.records) {
    const raw = (record as unknown as Record<string, unknown>)[field];
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
      const key = String(value);
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

export function searchReportingView<T extends ReportingRecord>(view: ReportingView<T>, query: string): T[] {
  const normalized = query.trim().toLocaleLowerCase('en');
  if (!normalized) return [...view.records];
  return view.records.filter((record) => JSON.stringify(record).toLocaleLowerCase('en').includes(normalized));
}

export function reportingLinks<T extends ReportingRecord>(
  view: ReportingView<T>,
  linkFor: (record: T) => string | null | undefined,
): string[] {
  return view.records.flatMap((record) => {
    const link = linkFor(record);
    return link ? [link] : [];
  });
}

export function exportReportingView<T extends ReportingRecord>(view: ReportingView<T>): {
  source: string;
  disclosure: ReportingDisclosure;
  records: T[];
  relationships: ReportingRelationship[];
} {
  return {
    source: view.source.id,
    disclosure: { ...view.disclosure },
    records: [...view.records],
    relationships: [...view.relationships],
  };
}

export function downloadReportingView<T extends ReportingRecord>(view: ReportingView<T>): string {
  return `${JSON.stringify(exportReportingView(view), null, 2)}\n`;
}
