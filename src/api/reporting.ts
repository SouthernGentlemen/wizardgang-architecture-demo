import type { Env } from '../types';
import { authorize, type Principal } from '../lib/authorization';
import { readJson, withSecurityHeaders } from '../lib/http';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import {
  assuranceFilterDefinitions,
  assuranceFilterValues,
} from '../assurance/service';
import {
  assuranceErrorResponse,
  ASSURANCE_SCHEMA_VERSION,
} from './assurance-contract';
import { reportingJsonResponse } from './reporting-response';
import {
  GitHubReportingError,
  updateGitHubReporting,
} from '../reporting/github';
import { ReportingCursorError } from '../reporting/pagination';
import {
  queryReportingCollection,
  reportingCollectionFilters,
  reportingCollectionInventory,
  type ReportingCollectionDescriptor,
} from '../reporting/service';
import type { ReportingQueryResult, ReportingRecord } from '../reporting/contracts';
import { registeredReportingSource, reportingContractPath } from '../reporting/registry';
import { isReportingContract } from '../reporting/schema-validation';
import { exportReportingPages } from '../reporting/query';

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;
const MAX_UPDATE_BODY_BYTES = 32_768;
const CONTROL_PARAMETERS = new Set(['limit', 'cursor', 'export', 'repository']);

interface ReportingQueryOptions {
  limit: number;
  cursor: string | null;
  exportRequested: boolean;
  repository?: string;
  searchParams: URLSearchParams;
}

interface ReportingUpdateRequest {
  repository: string;
  revision: string;
  fields: Readonly<Record<string, unknown>>;
}

function errorStatus(error: GitHubReportingError | ReportingCursorError): number {
  return error instanceof GitHubReportingError ? error.status : 400;
}

function reportingErrorResponse(request: Request, error: GitHubReportingError | ReportingCursorError): Response {
  const status = errorStatus(error);
  return assuranceErrorResponse(request, status, {
    error: error.code,
    ...(error.detail ? { detail: error.detail } : {}),
  }, {
    ...(status === 401 ? { 'www-authenticate': 'Bearer realm="WizardGang architecture demo"' } : {}),
    ...(status === 429 ? { 'retry-after': '60' } : {}),
  });
}

function reportingPreflight(allowPatch: boolean): Response {
  const headers = withSecurityHeaders(new Headers({
    'cache-control': 'public, max-age=3600',
    'cross-origin-resource-policy': 'cross-origin',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': allowPatch ? 'GET, PATCH, OPTIONS' : 'GET, OPTIONS',
    'access-control-allow-headers': allowPatch
      ? 'Accept, Authorization, Content-Type, If-None-Match'
      : 'Accept, Authorization, If-None-Match',
    'access-control-expose-headers': 'ETag, Cache-Control, X-Assurance-Schema-Version',
    'access-control-max-age': '3600',
    'x-assurance-schema-version': String(ASSURANCE_SCHEMA_VERSION),
  }));
  return new Response(null, { status: 204, headers });
}

function collectionFor(principal: Principal, collectionId: string): ReportingCollectionDescriptor | undefined {
  return reportingCollectionInventory(principal).find((collection) => collection.id === collectionId);
}

function cacheControlFor(collection: ReportingCollectionDescriptor | undefined, principal: Principal): string {
  if (principal.authentication !== 'anonymous' || collection?.visibility === 'private') return 'private, no-store';
  if (collection?.kind === 'provider') return 'public, max-age=30, s-maxage=30';
  return 'public, max-age=300';
}

function integerParameter(request: Request, url: URL): number | Response {
  const values = url.searchParams.getAll('limit');
  if (values.length > 1) {
    return assuranceErrorResponse(request, 400, { error: 'duplicate_query_parameter', parameter: 'limit' });
  }
  const raw = values[0];
  if (raw === undefined) return DEFAULT_PAGE_LIMIT;
  if (!/^[1-9]\d*$/.test(raw)) {
    return assuranceErrorResponse(request, 400, {
      error: 'invalid_pagination', parameter: 'limit', value: raw, minimum: 1, maximum: MAX_PAGE_LIMIT,
    });
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_LIMIT) {
    return assuranceErrorResponse(request, 400, {
      error: 'invalid_pagination', parameter: 'limit', value: raw, minimum: 1, maximum: MAX_PAGE_LIMIT,
    });
  }
  return parsed;
}

function parseQuery(
  request: Request,
  collection: ReportingCollectionDescriptor,
  allowExport: boolean,
): ReportingQueryOptions | Response {
  const url = new URL(request.url);
  const limit = integerParameter(request, url);
  if (limit instanceof Response) return limit;

  const cursorValues = url.searchParams.getAll('cursor');
  if (cursorValues.length > 1) {
    return assuranceErrorResponse(request, 400, { error: 'duplicate_query_parameter', parameter: 'cursor' });
  }
  const cursor = cursorValues[0] ?? null;
  if (cursor === '') {
    return assuranceErrorResponse(request, 400, { error: 'invalid_pagination', parameter: 'cursor', value: cursor });
  }

  const exportValues = url.searchParams.getAll('export');
  if (exportValues.length > 1 || (exportValues[0] !== undefined && exportValues[0] !== '1')) {
    return assuranceErrorResponse(request, 400, { error: 'invalid_export', parameter: 'export' });
  }
  const exportRequested = exportValues[0] === '1';
  if (exportRequested && !allowExport) {
    return assuranceErrorResponse(request, 400, { error: 'unsupported_query_parameter', parameter: 'export' });
  }
  if (exportRequested && cursor !== null) {
    return assuranceErrorResponse(request, 400, { error: 'export_cursor_conflict', parameter: 'cursor' });
  }

  const repositoryValues = url.searchParams.getAll('repository');
  if (repositoryValues.length > 1) {
    return assuranceErrorResponse(request, 400, { error: 'duplicate_query_parameter', parameter: 'repository' });
  }
  const repository = repositoryValues[0]?.trim();
  if (repositoryValues[0] !== undefined && !repository) {
    return assuranceErrorResponse(request, 400, { error: 'invalid_query_parameter', parameter: 'repository' });
  }
  if (repository && collection.provider !== 'github') {
    return assuranceErrorResponse(request, 400, { error: 'unsupported_query_parameter', parameter: 'repository' });
  }

  const searchParams = new URLSearchParams(url.searchParams);
  for (const parameter of CONTROL_PARAMETERS) searchParams.delete(parameter);

  if (collection.kind === 'structured' && collection.dataset) {
    const definitions = assuranceFilterDefinitions(collection.dataset);
    for (const [parameter] of searchParams) {
      if (!definitions[parameter]) {
        return assuranceErrorResponse(request, 400, { error: 'unsupported_query_parameter', parameter });
      }
    }
    for (const [parameter] of Object.entries(definitions)) {
      const values = searchParams.getAll(parameter);
      if (values.length === 0) continue;
      const allowed = assuranceFilterValues(collection.dataset, parameter);
      if (values.length !== 1 || !allowed.includes(values[0])) {
        return assuranceErrorResponse(request, 400, {
          error: 'invalid_filter', parameter, value: values.length === 1 ? values[0] : values, allowed,
        });
      }
    }
  } else {
    const unsupported = [...searchParams.keys()][0];
    if (unsupported) {
      return assuranceErrorResponse(request, 400, { error: 'unsupported_query_parameter', parameter: unsupported });
    }
  }

  return {
    limit,
    cursor,
    exportRequested,
    ...(repository ? { repository } : {}),
    searchParams,
  };
}

async function queryCollection(
  request: Request,
  env: Env,
  principal: Principal,
  collection: ReportingCollectionDescriptor,
  options: ReportingQueryOptions,
): Promise<Response> {
  const usage = collection.provider === 'cloudflare' ? await latestCloudflareUsage(env) : undefined;
  const query = (cursor: string | null) => queryReportingCollection(env, principal, collection, {
    searchParams: options.searchParams,
    limit: options.limit,
    cursor,
    ...(options.repository ? { repository: options.repository } : {}),
    ...(usage ? { usage } : {}),
  });

  try {
    const first = await query(options.cursor);
    if (!options.exportRequested) {
      return reportingJsonResponse(request, first, 'queryResult', { cacheControl: cacheControlFor(collection, principal) });
    }
    const exported = await exportReportingPages(async (cursor) => {
      const page = await query(cursor);
      if (!page.query.pagination) throw new Error(`Reporting collection ${collection.id} did not return pagination metadata.`);
      return { records: page.records, pagination: page.query.pagination };
    }, options.limit);
    return reportingJsonResponse(request, {
      ...first,
      query: { ...first.query, pagination: exported.pagination },
      records: exported.records,
      derived: { ...first.derived, count: exported.records.length, totalAvailable: exported.records.length },
    }, 'queryResult', { cacheControl: cacheControlFor(collection, principal) });
  } catch (error) {
    if (error instanceof GitHubReportingError || error instanceof ReportingCursorError) return reportingErrorResponse(request, error);
    throw error;
  }
}

function recordIdentity(record: ReportingRecord): string[] {
  const nativeId = (record as ReportingRecord & { nativeId?: unknown }).nativeId;
  return [record.id, ...(typeof nativeId === 'string' ? [nativeId] : [])];
}

async function queryRecord(
  request: Request,
  env: Env,
  principal: Principal,
  collection: ReportingCollectionDescriptor,
  recordId: string,
  options: ReportingQueryOptions,
): Promise<Response> {
  const usage = collection.provider === 'cloudflare' ? await latestCloudflareUsage(env) : undefined;
  let cursor: string | null = null;
  try {
    for (let pageNumber = 0; pageNumber < 100; pageNumber += 1) {
      const page = await queryReportingCollection(env, principal, collection, {
        searchParams: options.searchParams,
        limit: MAX_PAGE_LIMIT,
        cursor,
        ...(options.repository ? { repository: options.repository } : {}),
        ...(usage ? { usage } : {}),
      });
      const record = page.records.find((candidate) => recordIdentity(candidate).includes(recordId));
      if (record) {
        const result: ReportingQueryResult<ReportingRecord> = {
          ...page,
          query: { filters: page.query.filters },
          records: [record],
          derived: { ...page.derived, count: 1 },
        };
        return reportingJsonResponse(request, result, 'queryResult', { cacheControl: cacheControlFor(collection, principal) });
      }
      cursor = page.query.pagination?.nextCursor ?? null;
      if (!cursor) break;
    }
    return assuranceErrorResponse(request, 404, {
      error: 'reporting_record_not_found', collection: collection.id, recordId,
    });
  } catch (error) {
    if (error instanceof GitHubReportingError || error instanceof ReportingCursorError) return reportingErrorResponse(request, error);
    throw error;
  }
}

function validateUpdateRequest(value: unknown): ReportingUpdateRequest | null {
  if (!isReportingContract(value, 'updateRequest')) return null;
  return structuredClone(value) as ReportingUpdateRequest;
}

async function updateRecord(
  request: Request,
  env: Env,
  collection: ReportingCollectionDescriptor,
  recordId: string,
): Promise<Response> {
  const principal = await authorize(request, env, 'reporting:write', { allowIdentitySession: true });
  if (principal instanceof Response) return principal;
  if (collection.kind !== 'provider' || collection.sourceIds.length !== 1 || collection.sourceIds[0] !== 'github.issues') {
    return assuranceErrorResponse(request, 405, {
      error: 'reporting_update_not_supported', collection: collection.id, allowed: ['GET'],
    }, { allow: 'GET, OPTIONS' });
  }

  try {
    const input = validateUpdateRequest(await readJson<unknown>(request, MAX_UPDATE_BODY_BYTES));
    if (!input) {
      return assuranceErrorResponse(request, 400, {
        error: 'github_update_payload_invalid',
        detail: 'PATCH body must contain exactly repository, revision, and non-empty fields.',
      });
    }
    const record = await updateGitHubReporting(env, principal, {
      source: collection.sourceIds[0],
      repository: input.repository,
      operation: 'update',
      nativeId: recordId,
      revision: input.revision,
      fields: input.fields,
    });
    return reportingJsonResponse(request, {
      schemaVersion: ASSURANCE_SCHEMA_VERSION,
      contract: reportingContractPath,
      dataset: collection.id,
      datasets: collection.sourceIds,
      records: [record],
      derived: { count: 1, totalAvailable: 1, facets: {} },
      availability: { [collection.id]: 'available', [collection.sourceIds[0]]: 'available' },
      sources: [registeredReportingSource(collection.sourceIds[0])],
      qualifications: {},
      query: { filters: { repository: input.repository } },
    }, 'queryResult', { cacheControl: 'private, no-store' });
  } catch (error) {
    if (error instanceof GitHubReportingError || error instanceof ReportingCursorError) return reportingErrorResponse(request, error);
    throw error;
  }
}

export async function reportingIndexResponse(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return reportingPreflight(false);
  const principal = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  if (principal instanceof Response) return principal;
  const collections = reportingCollectionInventory(principal).map((collection) => ({
    id: collection.id,
    label: collection.label,
    kind: collection.kind,
    provider: collection.provider,
    visibility: collection.visibility,
    filters: reportingCollectionFilters(collection),
    url: `/api/reporting/${encodeURIComponent(collection.id)}`,
  }));
  return reportingJsonResponse(request, {
    schemaVersion: ASSURANCE_SCHEMA_VERSION,
    contract: reportingContractPath,
    collections,
  }, 'collectionIndexResult', { cacheControl: cacheControlFor(undefined, principal) });
}

export async function reportingCollectionResponse(
  request: Request,
  env: Env,
  collectionId: string,
): Promise<Response> {
  if (request.method === 'OPTIONS') return reportingPreflight(false);
  const principal = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  if (principal instanceof Response) return principal;
  const collection = collectionFor(principal, collectionId);
  if (!collection) return assuranceErrorResponse(request, 404, { error: 'reporting_collection_not_found', collection: collectionId });
  const options = parseQuery(request, collection, true);
  if (options instanceof Response) return options;
  return queryCollection(request, env, principal, collection, options);
}

export async function reportingRecordResponse(
  request: Request,
  env: Env,
  collectionId: string,
  recordId: string,
): Promise<Response> {
  if (request.method === 'OPTIONS') return reportingPreflight(true);

  if (request.method === 'PATCH') {
    const principal = await authorize(request, env, 'reporting:write', { allowIdentitySession: true });
    if (principal instanceof Response) return principal;
    const collection = collectionFor(principal, collectionId);
    if (!collection) return assuranceErrorResponse(request, 404, { error: 'reporting_collection_not_found', collection: collectionId });
    return updateRecord(request, env, collection, recordId);
  }

  const principal = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  if (principal instanceof Response) return principal;
  const collection = collectionFor(principal, collectionId);
  if (!collection) return assuranceErrorResponse(request, 404, { error: 'reporting_collection_not_found', collection: collectionId });
  const options = parseQuery(request, collection, false);
  if (options instanceof Response) return options;
  if (options.cursor !== null || options.searchParams.size > 0 || new URL(request.url).searchParams.has('limit')) {
    return assuranceErrorResponse(request, 400, { error: 'unsupported_query_parameter', parameter: 'detail-query' });
  }
  return queryRecord(request, env, principal, collection, recordId, options);
}
