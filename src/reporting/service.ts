import {
  assuranceCollectionState,
  assuranceDatasetQualification,
  assuranceFilterDefinitions,
  assuranceFilterPredicate,
  assuranceFilterValues,
  assuranceReportingCollections,
  deriveAssuranceCounts,
  labelAssuranceFilterValue,
  normalizeAssuranceFilters,
} from '../assurance/service';
import { assuranceRegistryResources, type AssuranceRegistryResource } from '../assurance/model';
import { listPublishedAssuranceRecords } from '../assurance/publication';
import type { Principal } from '../lib/authorization';
import type { CloudflareUsageSnapshot } from '../lib/cloudflare-usage';
import type { Env } from '../types';
import type {
  ReportingAvailability,
  ReportingQueryResult,
  ReportingRecord,
  ReportingSource,
} from './contracts';
import { queryCloudflareReportingPage } from './cloudflare-query';
import { GitHubReportingError } from './github';
import { queryGitHubReportingPage } from './github-query';
import { reportingPresentationLabel } from './presentation';
import { paginateReportingRecords, reportingCursorSecret } from './query';
import {
  registeredReportingSource,
  registeredReportingSources,
  reportingContractPath,
  reportingOwnership,
  structuredReportingSource,
} from './registry';
import { reportingSummaryDocument } from './summary-data';

export interface ReportingCollectionDescriptor {
  id: string;
  label: string;
  kind: 'structured' | 'provider';
  provider: ReportingSource['provider'];
  visibility: ReportingSource['visibility'];
  sourceIds: string[];
  resourceIds: string[];
  sourcePaths: string[];
  dataset?: string;
}

export interface ReportingFilterOption {
  name: string;
  label: string;
  values: Array<{ value: string; label: string }>;
}

export interface ReportingQueryOptions {
  searchParams?: URLSearchParams;
  limit?: number;
  cursor?: string | null;
  usage?: CloudflareUsageSnapshot;
}

const STRUCTURED_SOURCE_ID = 'github.structured-records';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export function canReadPrivateReporting(principal: Principal | null | undefined): boolean {
  return Boolean(
    principal
    && principal.authentication !== 'anonymous'
    && principal.role === 'operator'
    && principal.permissions.includes('reporting:private'),
  );
}

function normalizedLimit(value: number | undefined): number {
  if (!Number.isInteger(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Number(value)));
}

function compatibleStructuredResource(resource: AssuranceRegistryResource): boolean {
  if (resource.visibility !== 'public') return false;
  const runtimeRecords = resource.capabilities.includes('runtime') && resource.capabilities.includes('records');
  return runtimeRecords || resource.capabilities.includes('summary-source');
}

function resourcesForOwnedRoot(rootId: string): AssuranceRegistryResource[] {
  return assuranceRegistryResources.filter((resource) => (
    (resource.id === rootId || resource.id.startsWith(`${rootId}.`)) && compatibleStructuredResource(resource)
  ));
}

function structuredDescriptor(id: string, resources: AssuranceRegistryResource[]): ReportingCollectionDescriptor | null {
  if (resources.length === 0) return null;
  const dataset = resources[0].kind;
  if (resources.some((resource) => resource.kind !== dataset)) {
    throw new Error(`Reporting collection ${id} spans incompatible structured record families.`);
  }
  const sources = resources.map(structuredReportingSource);
  return {
    id,
    label: reportingPresentationLabel(id),
    kind: 'structured',
    provider: sources[0].provider,
    visibility: 'public',
    sourceIds: sources.map((source) => source.id),
    resourceIds: resources.map((resource) => resource.id),
    sourcePaths: resources.map((resource) => resource.path),
    dataset,
  };
}

function providerDescriptor(id: string, source: ReportingSource): ReportingCollectionDescriptor {
  return {
    id,
    label: reportingPresentationLabel(id),
    kind: 'provider',
    provider: source.provider,
    visibility: source.visibility,
    sourceIds: [source.id],
    resourceIds: [],
    sourcePaths: [],
  };
}

/**
 * Reporting inventory is derived from authoritative ownership first, then from compatible
 * registered capabilities. This deliberately has no dashboard family/provider allowlist.
 */
export function reportingCollectionInventory(principal?: Principal | null): ReportingCollectionDescriptor[] {
  const collections: ReportingCollectionDescriptor[] = [];
  const claimedKinds = new Set<string>();
  const claimedSources = new Set<string>();

  for (const owner of reportingOwnership) {
    if (owner.source === STRUCTURED_SOURCE_ID) {
      if (!owner.resource) continue;
      const descriptor = structuredDescriptor(owner.domain, resourcesForOwnedRoot(owner.resource));
      if (!descriptor) continue;
      collections.push(descriptor);
      if (descriptor.dataset) claimedKinds.add(descriptor.dataset);
      descriptor.sourceIds.forEach((sourceId) => claimedSources.add(sourceId));
      continue;
    }
    const source = registeredReportingSource(owner.source);
    if (source.visibility === 'private' && !canReadPrivateReporting(principal)) continue;
    collections.push(providerDescriptor(owner.domain, source));
    claimedSources.add(source.id);
  }

  const byKind = new Map<string, AssuranceRegistryResource[]>();
  for (const resource of assuranceRegistryResources) {
    if (resource.visibility !== 'public') continue;
    if (!resource.capabilities.includes('runtime') || !resource.capabilities.includes('records')) continue;
    const resources = byKind.get(resource.kind) ?? [];
    resources.push(resource);
    byKind.set(resource.kind, resources);
  }
  for (const [kind, resources] of byKind) {
    if (claimedKinds.has(kind)) continue;
    const descriptor = structuredDescriptor(kind, resources);
    if (!descriptor) continue;
    collections.push(descriptor);
    claimedKinds.add(kind);
    descriptor.sourceIds.forEach((sourceId) => claimedSources.add(sourceId));
  }

  for (const source of registeredReportingSources()) {
    if (!source.capabilities.includes('query') || claimedSources.has(source.id)) continue;
    if (source.visibility === 'private' && !canReadPrivateReporting(principal)) continue;
    collections.push(providerDescriptor(source.id, source));
    claimedSources.add(source.id);
  }

  return collections;
}

export function reportingCollectionFilters(collection: ReportingCollectionDescriptor): ReportingFilterOption[] {
  if (collection.kind !== 'structured' || !collection.dataset) return [];
  const runtime = assuranceRegistryResources.some((resource) => (
    collection.resourceIds.includes(resource.id)
    && resource.capabilities.includes('runtime')
    && resource.capabilities.includes('records')
  ));
  if (!runtime) return [];
  return Object.entries(assuranceFilterDefinitions(collection.dataset)).map(([name, definition]) => ({
    name,
    label: definition.label,
    values: assuranceFilterValues(collection.dataset!, name).map((value) => ({
      value,
      label: labelAssuranceFilterValue(collection.dataset!, name, value),
    })),
  }));
}

function structuredAvailability(status: ReturnType<typeof assuranceCollectionState>['status']): ReportingAvailability {
  if (status === 'available' || status === 'empty') return 'available';
  if (status === 'partial') return 'partial';
  return 'unavailable';
}

function genericFacets(records: readonly ReportingRecord[]): Readonly<Record<string, Readonly<Record<string, number>>>> {
  const facets: Record<string, Record<string, number>> = {};
  for (const field of ['recordType', 'status', 'availability', 'partition']) {
    const counts: Record<string, number> = {};
    for (const record of records) {
      const value = (record as unknown as Record<string, unknown>)[field];
      if (typeof value !== 'string' || !value) continue;
      counts[value] = (counts[value] ?? 0) + 1;
    }
    if (Object.keys(counts).length > 0) facets[field] = counts;
  }
  return facets;
}

async function paginateStructured(
  env: Env,
  collection: ReportingCollectionDescriptor,
  records: readonly ReportingRecord[],
  filters: Readonly<Record<string, string>>,
  limit: number,
  cursor: string | null,
) {
  return paginateReportingRecords(records, {
    context: {
      schemaVersion: 1,
      collection: `reporting:${collection.id}`,
      source: [...collection.sourceIds].sort().join(','),
      filters,
      ordering: [{ field: 'id', direction: 'asc' }],
    },
    limit,
    cursor,
    secret: reportingCursorSecret(env),
  });
}

async function queryRuntimeStructured(
  env: Env,
  collection: ReportingCollectionDescriptor,
  options: ReportingQueryOptions,
): Promise<ReportingQueryResult<ReportingRecord>> {
  const dataset = collection.dataset!;
  const searchParams = options.searchParams ?? new URLSearchParams();
  const normalized = normalizeAssuranceFilters(dataset, searchParams);
  const allPublished = listPublishedAssuranceRecords(dataset) as ReportingRecord[];
  const filtered = allPublished.filter(assuranceFilterPredicate(dataset, normalized.filters));
  const limit = normalizedLimit(options.limit);
  const page = await paginateStructured(env, collection, filtered, normalized.filters, limit, options.cursor ?? null);
  const state = assuranceCollectionState(dataset);
  const availability = structuredAvailability(state.status);
  const sources = assuranceReportingCollections(dataset)
    .map((entry) => entry.source)
    .filter((source) => collection.sourcePaths.includes(source.scope.resource));
  return {
    schemaVersion: 1,
    contract: reportingContractPath,
    dataset: collection.id,
    datasets: collection.resourceIds,
    availability: {
      [collection.id]: availability,
      ...Object.fromEntries(sources.map((source) => [source.id, availability])),
    },
    sources,
    qualifications: { [collection.id]: assuranceDatasetQualification(dataset) ?? null },
    query: { filters: normalized.filters, pagination: page.pagination },
    records: page.records,
    derived: {
      count: page.records.length,
      totalAvailable: filtered.length,
      facets: deriveAssuranceCounts(dataset, filtered).byFilter,
    },
  };
}

function recordsFromSummaryDocument(resource: AssuranceRegistryResource): ReportingRecord[] | null {
  const document = reportingSummaryDocument(resource.path);
  if (!document || typeof document !== 'object' || Array.isArray(document)) return null;
  const source = structuredReportingSource(resource);
  const value = document as Record<string, unknown>;
  const records = value.records;
  if (!Array.isArray(records)) return null;
  const partition = typeof value.partition === 'string' ? value.partition : undefined;
  const controlFamily = typeof value.controlFamily === 'string' ? value.controlFamily : undefined;
  return records.flatMap((record) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return [];
    const id = (record as { id?: unknown }).id;
    if (typeof id !== 'string' || !id) return [];
    return [{
      ...(record as Record<string, unknown>),
      id,
      source: source.id,
      ...(partition ? { partition } : {}),
      ...(controlFamily ? { controlFamily } : {}),
    } as ReportingRecord];
  });
}

async function querySummaryStructured(
  env: Env,
  collection: ReportingCollectionDescriptor,
  resources: AssuranceRegistryResource[],
  options: ReportingQueryOptions,
): Promise<ReportingQueryResult<ReportingRecord>> {
  const sourceStates: Array<{ source: ReportingSource; availability: ReportingAvailability; records: ReportingRecord[] }> = resources.map((resource) => {
    const source = structuredReportingSource(resource);
    const records = recordsFromSummaryDocument(resource);
    return records === null
      ? { source, availability: 'unavailable' as const, records: [] }
      : { source, availability: 'available' as const, records };
  });
  const allRecords = sourceStates.flatMap((entry) => entry.records);
  const availableSources = sourceStates.filter((entry) => entry.availability === 'available').length;
  const availability: ReportingAvailability = availableSources === sourceStates.length
    ? 'available'
    : availableSources === 0 ? 'unavailable' : 'partial';
  const limit = normalizedLimit(options.limit);
  const page = await paginateStructured(env, collection, allRecords, {}, limit, options.cursor ?? null);
  return {
    schemaVersion: 1,
    contract: reportingContractPath,
    dataset: collection.id,
    datasets: resources.map((resource) => resource.id),
    availability: {
      [collection.id]: availability,
      ...Object.fromEntries(sourceStates.map((entry) => [entry.source.id, entry.availability])),
    },
    sources: sourceStates.map((entry) => entry.source),
    qualifications: { [collection.id]: resources.find((resource) => resource.qualification)?.qualification ?? null },
    query: { filters: {}, pagination: page.pagination },
    records: page.records,
    derived: {
      count: page.records.length,
      totalAvailable: allRecords.length,
      facets: genericFacets(allRecords),
    },
  };
}

function unavailableProviderResult(
  collection: ReportingCollectionDescriptor,
  source: ReportingSource,
  availability: ReportingAvailability,
  qualification: string,
): ReportingQueryResult<ReportingRecord> {
  return {
    schemaVersion: 1,
    contract: reportingContractPath,
    dataset: collection.id,
    datasets: [source.id],
    availability: { [collection.id]: availability, [source.id]: availability },
    sources: [source],
    qualifications: { [collection.id]: qualification },
    query: { filters: {} },
    records: [],
    derived: { count: 0, totalAvailable: 0, facets: {} },
  };
}

async function queryProvider(
  env: Env,
  principal: Principal,
  collection: ReportingCollectionDescriptor,
  options: ReportingQueryOptions,
): Promise<ReportingQueryResult<ReportingRecord>> {
  const source = registeredReportingSource(collection.sourceIds[0]);
  const limit = normalizedLimit(options.limit);
  if (source.provider === 'github') {
    try {
      const outcome = await queryGitHubReportingPage(env, principal, {
        sourceIds: [source.id],
        limit,
        cursor: options.cursor ?? null,
      });
      return { ...outcome.result, dataset: collection.id, datasets: [source.id] } as ReportingQueryResult<ReportingRecord>;
    } catch (error) {
      if (error instanceof GitHubReportingError) {
        const availability: ReportingAvailability = error.status === 429 ? 'rate-limited' : 'unavailable';
        return unavailableProviderResult(collection, source, availability, error.code);
      }
      throw error;
    }
  }
  if (source.provider === 'cloudflare') {
    if (!options.usage) return unavailableProviderResult(collection, source, 'unavailable', 'cloudflare_snapshot_unavailable');
    const result = await queryCloudflareReportingPage(env, options.usage, { limit, cursor: options.cursor ?? null });
    return { ...result, dataset: collection.id, datasets: [source.id] } as ReportingQueryResult<ReportingRecord>;
  }
  return unavailableProviderResult(collection, source, 'unavailable', 'reporting_provider_unsupported');
}

export async function queryReportingCollection(
  env: Env,
  principal: Principal,
  collection: ReportingCollectionDescriptor,
  options: ReportingQueryOptions = {},
): Promise<ReportingQueryResult<ReportingRecord>> {
  if (collection.visibility === 'private' && !canReadPrivateReporting(principal)) {
    throw new Error('Private reporting collection is not authorized for this principal.');
  }
  if (collection.kind === 'provider') return queryProvider(env, principal, collection, options);
  const resources = assuranceRegistryResources.filter((resource) => collection.resourceIds.includes(resource.id));
  const runtime = resources.some((resource) => resource.capabilities.includes('runtime') && resource.capabilities.includes('records'));
  return runtime
    ? queryRuntimeStructured(env, collection, options)
    : querySummaryStructured(env, collection, resources, options);
}

export async function queryStructuredReportingDataset(
  env: Env,
  dataset: string,
  options: ReportingQueryOptions = {},
): Promise<ReportingQueryResult<ReportingRecord>> {
  const resources = assuranceRegistryResources.filter((resource) => (
    resource.kind === dataset
    && resource.visibility === 'public'
    && resource.capabilities.includes('runtime')
    && resource.capabilities.includes('records')
  ));
  const descriptor = structuredDescriptor(dataset, resources);
  if (!descriptor) throw new Error(`Reporting dataset ${dataset} is not registered as a compatible structured collection.`);
  return queryRuntimeStructured(env, descriptor, options);
}
