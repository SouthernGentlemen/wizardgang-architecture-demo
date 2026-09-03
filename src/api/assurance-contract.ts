import { withSecurityHeaders } from '../lib/http';

export const ASSURANCE_SCHEMA_VERSION = 1;
export const ASSURANCE_CACHE_CONTROL = 'public, max-age=300';
export const ASSURANCE_PAGINATION_DEFAULT_LIMIT = 50;
export const ASSURANCE_PAGINATION_MAX_LIMIT = 100;
export const ASSURANCE_CORS_ALLOW_ORIGIN = '*';

const ASSURANCE_VENDOR_MEDIA_TYPE = 'application/vnd.wizardgang.assurance+json';
const ASSURANCE_CORS_EXPOSE_HEADERS = [
  'ETag',
  'Cache-Control',
  'X-Assurance-Schema-Version',
  'Deprecation',
  'Sunset',
  'Link',
].join(', ');

export interface AssuranceRequestContext {
  url: URL;
  schemaVersion: typeof ASSURANCE_SCHEMA_VERSION;
}

export interface AssurancePagination {
  limit: number;
  returned: number;
  total: number;
  nextCursor: string | null;
}

export interface AssurancePage<T> {
  records: T[];
  pagination?: AssurancePagination;
}

interface AssuranceResponseOptions {
  status?: number;
  headers?: HeadersInit;
  cacheControl?: string;
  etag?: boolean;
  deprecation?: {
    deprecation: string;
    sunset: string;
    link: string;
  };
}

function contractHeaders(init?: HeadersInit, cacheControl = ASSURANCE_CACHE_CONTROL): Headers {
  const headers = withSecurityHeaders(new Headers(init));
  headers.set('cache-control', cacheControl);
  headers.set('cross-origin-resource-policy', 'cross-origin');
  headers.set('access-control-allow-origin', ASSURANCE_CORS_ALLOW_ORIGIN);
  headers.set('access-control-expose-headers', ASSURANCE_CORS_EXPOSE_HEADERS);
  headers.set('x-assurance-schema-version', String(ASSURANCE_SCHEMA_VERSION));
  const vary = headers.get('vary');
  if (!vary) {
    headers.set('vary', 'Accept');
  } else if (!vary.split(',').map((value) => value.trim().toLowerCase()).includes('accept')) {
    headers.set('vary', `${vary}, Accept`);
  }
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

function matchesEtag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  const normalizedEtag = etag.replace(/^W\//, '');
  return ifNoneMatch.split(',').some((candidate) => {
    const value = candidate.trim();
    return value === '*' || value === etag || value.replace(/^W\//, '') === normalizedEtag;
  });
}

function vendorSchemaVersion(accept: string | null): string | undefined {
  if (!accept) return undefined;
  for (const mediaRange of accept.split(',')) {
    const [type, ...parameters] = mediaRange.split(';').map((value) => value.trim());
    if (type.toLowerCase() !== ASSURANCE_VENDOR_MEDIA_TYPE) continue;
    for (const parameter of parameters) {
      const [name, rawValue] = parameter.split('=').map((value) => value.trim());
      if (name?.toLowerCase() !== 'version' || rawValue === undefined) continue;
      return rawValue.replace(/^"|"$/g, '');
    }
  }
  return undefined;
}

export function assuranceJsonResponse(
  request: Request,
  data: unknown,
  options: AssuranceResponseOptions = {},
): Response {
  const body = JSON.stringify(data, null, 2);
  const headers = contractHeaders(options.headers, options.cacheControl ?? ASSURANCE_CACHE_CONTROL);
  headers.set('content-type', 'application/json; charset=utf-8');

  if (options.deprecation) {
    headers.set('deprecation', options.deprecation.deprecation);
    headers.set('sunset', options.deprecation.sunset);
    headers.set('link', `<${options.deprecation.link}>; rel="deprecation"`);
  }

  if (options.etag !== false && (options.status === undefined || options.status === 200)) {
    const etag = `W/"assurance-v${ASSURANCE_SCHEMA_VERSION}-${hashRepresentation(body)}"`;
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
  const queryVersions = url.searchParams.getAll('schemaVersion');
  if (queryVersions.length > 1) {
    return assuranceErrorResponse(request, 400, {
      error: 'duplicate_query_parameter',
      parameter: 'schemaVersion',
    });
  }

  const queryVersion = queryVersions[0];
  const acceptVersion = vendorSchemaVersion(request.headers.get('accept'));
  if (queryVersion !== undefined && acceptVersion !== undefined && queryVersion !== acceptVersion) {
    return assuranceErrorResponse(request, 400, {
      error: 'schema_version_conflict',
      queryVersion,
      acceptVersion,
    });
  }

  const requestedVersion = queryVersion ?? acceptVersion;
  if (requestedVersion !== undefined && requestedVersion !== String(ASSURANCE_SCHEMA_VERSION)) {
    return assuranceErrorResponse(request, 406, {
      error: 'unsupported_schema_version',
      requested: requestedVersion,
      supported: [ASSURANCE_SCHEMA_VERSION],
    });
  }

  return { url, schemaVersion: ASSURANCE_SCHEMA_VERSION };
}

function sliceAssurancePage<T extends { id: string }>(
  records: T[],
  options?: { limit: number; cursor?: string },
): AssurancePage<T> | undefined {
  if (!options) return { records: [...records] };
  let start = 0;
  if (options.cursor !== undefined) {
    const index = records.findIndex((record) => record.id === options.cursor);
    if (index < 0) return undefined;
    start = index + 1;
  }
  const pageRecords = records.slice(start, start + options.limit);
  const hasMore = start + pageRecords.length < records.length;
  return {
    records: pageRecords,
    pagination: {
      limit: options.limit,
      returned: pageRecords.length,
      total: records.length,
      nextCursor: hasMore && pageRecords.length > 0 ? pageRecords[pageRecords.length - 1].id : null,
    },
  };
}

export function paginateAssuranceRecords<T extends { id: string }>(
  request: Request,
  url: URL,
  records: T[],
): AssurancePage<T> | Response {
  const limitValues = url.searchParams.getAll('limit');
  const cursorValues = url.searchParams.getAll('cursor');
  const paginationRequested = limitValues.length > 0 || cursorValues.length > 0;

  if (!paginationRequested) return sliceAssurancePage(records) as AssurancePage<T>;

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

  const page = sliceAssurancePage(records, { limit, ...(cursor !== undefined ? { cursor } : {}) });
  if (!page) {
    return assuranceErrorResponse(request, 400, {
      error: 'invalid_cursor',
      cursor,
    });
  }
  return page;
}
