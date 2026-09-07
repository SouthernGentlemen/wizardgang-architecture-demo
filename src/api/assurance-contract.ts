import { withSecurityHeaders } from '../lib/http';

export const ASSURANCE_SCHEMA_VERSION = 1;
export const ASSURANCE_CACHE_CONTROL = 'public, max-age=300';
export const ASSURANCE_CORS_ALLOW_ORIGIN = '*';

const ASSURANCE_CORS_EXPOSE_HEADERS = [
  'ETag',
  'Cache-Control',
  'X-Assurance-Schema-Version',
].join(', ');

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
