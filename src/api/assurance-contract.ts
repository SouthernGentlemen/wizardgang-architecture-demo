import { withSecurityHeaders } from '../lib/http';
import type { Env } from '../types';
import type { ReportingPagination } from '../reporting/contracts';
import { ReportingCursorError, type ReportingCursorContext } from '../reporting/pagination';
import { paginateReportingRecords, reportingCursorSecret } from '../reporting/query';

export const ASSURANCE_SCHEMA_VERSION = 1;
export const ASSURANCE_CACHE_CONTROL = 'public, max-age=300';
export const ASSURANCE_PAGINATION_DEFAULT_LIMIT = 50;
export const ASSURANCE_PAGINATION_MAX_LIMIT = 100;
export const ASSURANCE_CORS_ALLOW_ORIGIN = '*';

const LEGACY_ASSURANCE_VENDOR_MEDIA_TYPE = 'application/vnd.wizardgang.assurance+json';
const ASSURANCE_CORS_EXPOSE_HEADERS = [
  'ETag',
  'Cache-Control',
  'X-Assurance-Schema-Version',
].join(', ');

export interface AssuranceRequestContext {
  url: URL;
  schemaVersion: typeof ASSURANCE_SCHEMA_VERSION;
}

export interface AssurancePage<T> {
  records: readonly T[];
  pagination: ReportingPagination;
}

interface AssuranceResponseOptions {
  status?: number;
  headers?: HeadersInit;
  cacheControl?: string;
  etag?: boolean;
}

function contractHeaders(init?: HeadersInit, cacheControl = ASSURANCE_CACHE_CONTROL): Headers {
  const headers = withSecurityHeaders(new Headers(init));
  headers.set('cache-control', cacheControl);
  headers.set('cross-origin-resource-policy', 'cross-origin');
  headers.set('access-control-allow-origin', ASSURANCE_CORS_ALLOW_ORIGIN);
  headers.set('access-control-expose-headers', ASSURANCE_CORS_EXPOSE_HEADERS);
  headers.set('x-assurance-schema-version', String(ASSURANCE_SCHEMA_VERSION));
  return headers;
}

function hashRepresentation(body: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < body.length; index += 1) {
    const code = body.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

function etagRepresentation(data: unknown): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return JSON.stringify(data, null, 2);

  const root = data as Record<string, unknown>;
  const query = root.query;
  if (!query || typeof query !== 'object' || Array.isArray(query)) return JSON.stringify(data, null, 2);

  const queryRecord = query as Record<string, unknown>;
  const pagination = queryRecord.pagination;
  if (!pagination || typeof pagination !== 'object' || Array.isArray(pagination)) return JSON.stringify(data, null, 2);

  const paginationRecord = pagination as Record<string, unknown>;
  if (!('nextCursor' in paginationRecord)) return JSON.stringify(data, null, 2);

  return JSON.stringify({
    ...root,
    query: {
      ...queryRecord,
      pagination: {
        ...paginationRecord,
        nextCursor: paginationRecord.nextCursor === null ? null : '<opaque-continuation>',
      },
    },
  }, null, 2);
}

function matchesEtag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  const normalizedEtag = etag.replace(/^W\//, '');
  return ifNoneMatch.split(',').some((candidate) => {
    const value = candidate.trim();
    return value === '*' || value === etag || value.replace(/^W\//, '') === normalizedEtag;
  });
}

export function assuranceJsonResponse(
  request: Request,
  data: unknown,
  options: AssuranceResponseOptions = {},
): Response {
  const body = JSON.stringify(data, null, 2);
  const headers = contractHeaders(options.headers, options.cacheControl ?? ASSURANCE_CACHE_CONTROL);
  headers.set('content-type', 'application/json; charset=utf-8');

  if (options.etag !== false && (options.status === undefined || options.status === 200)) {
    const etag = `W/"assurance-current-${hashRepresentation(etagRepresentation(data))}"`;
    headers.set('etag', etag);
    if (matchesEtag(request.headers.get('if-none-match'), etag)) {
      return new Response(null, { status: 304, headers });
    }
  }

  return new Response(body, { status: options.status ?? 200, headers });
}

export function assuranceErrorResponse(
  request: Request,
  status: number,
  error: Record<string, unknown>,
  headers?: HeadersInit,
): Response {
  return assuranceJsonResponse(request, error, {
    status,
    headers,
    cacheControl: 'no-store',
    etag: false,
  });
}

function assurancePreflightResponse(): Response {
  const headers = contractHeaders(undefined, 'public, max-age=3600');
  headers.set('access-control-allow-methods', 'GET, OPTIONS');
  headers.set('access-control-allow-headers', 'Accept, If-None-Match');
  headers.set('access-control-max-age', '3600');
  return new Response(null, { status: 204, headers });
}

export function prepareAssuranceRequest(request: Request): AssuranceRequestContext | Response {
  if (request.method === 'OPTIONS') return assurancePreflightResponse();
  if (request.method !== 'GET') {
    return assuranceErrorResponse(
      request,
      405,
      { error: 'method_not_allowed', allowed: ['GET'] },
      { allow: 'GET' },
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.has('schemaVersion')) {
    return assuranceErrorResponse(request, 400, {
      error: 'legacy_schema_version_parameter_unsupported',
      parameter: 'schemaVersion',
    });
  }

  const accept = request.headers.get('accept')?.toLowerCase() ?? '';
  if (accept.includes(LEGACY_ASSURANCE_VENDOR_MEDIA_TYPE)) {
    return assuranceErrorResponse(request, 406, {
      error: 'legacy_assurance_media_type_unsupported',
      supported: ['application/json'],
    });
  }

  return { url, schemaVersion: ASSURANCE_SCHEMA_VERSION };
}

export async function paginateAssuranceRecords<T>(
  request: Request,
  url: URL,
  records: readonly T[],
  cursorContext: ReportingCursorContext,
  env?: Pick<Env, 'DEMO_SESSION_SECRET'>,
): Promise<AssurancePage<T> | Response> {
  const limitValues = url.searchParams.getAll('limit');
  const cursorValues = url.searchParams.getAll('cursor');
  if (limitValues.length > 1 || cursorValues.length > 1) {
    return assuranceErrorResponse(request, 400, {
      error: 'duplicate_query_parameter',
      parameter: limitValues.length > 1 ? 'limit' : 'cursor',
    });
  }

  const rawLimit = limitValues[0];
  const limit = rawLimit === undefined ? ASSURANCE_PAGINATION_DEFAULT_LIMIT : Number(rawLimit);
  if (
    (rawLimit !== undefined && !/^[1-9]\d*$/.test(rawLimit))
    || !Number.isSafeInteger(limit)
    || limit < 1
    || limit > ASSURANCE_PAGINATION_MAX_LIMIT
  ) {
    return assuranceErrorResponse(request, 400, {
      error: 'invalid_pagination',
      parameter: 'limit',
      value: rawLimit ?? null,
      minimum: 1,
      maximum: ASSURANCE_PAGINATION_MAX_LIMIT,
    });
  }

  const cursor = cursorValues[0];
  if (cursor !== undefined && !cursor) {
    return assuranceErrorResponse(request, 400, {
      error: 'invalid_pagination',
      parameter: 'cursor',
      value: cursor,
    });
  }

  try {
    return await paginateReportingRecords(records, {
      context: cursorContext,
      limit,
      cursor: cursor ?? null,
      secret: reportingCursorSecret(env),
    });
  } catch (error) {
    if (error instanceof ReportingCursorError) {
      return assuranceErrorResponse(request, 400, {
        error: error.code,
        parameter: 'cursor',
        ...(error.detail ? { detail: error.detail } : {}),
      });
    }
    throw error;
  }
}
