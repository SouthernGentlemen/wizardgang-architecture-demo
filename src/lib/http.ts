import { escapeHtml } from './html';

const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy': "default-src 'self'; base-uri 'none'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

export function withSecurityHeaders(headers: Headers): Headers {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return headers;
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = withSecurityHeaders(new Headers(init.headers));
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

export function methodNotAllowed(allowed: string[]): Response {
  return json({ error: 'method_not_allowed', allowed }, {
    status: 405,
    headers: { allow: allowed.join(', '), 'cache-control': 'no-store' },
  });
}

export function safeError(request: Request, error: unknown): Response {
  const requestId = crypto.randomUUID();
  console.error('Unhandled request failure', { requestId, error });
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html') && request.method === 'GET') {
    const headers = withSecurityHeaders(new Headers({
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    }));
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Service unavailable</title></head><body><main><h1>Service temporarily unavailable</h1><p>The request could not be completed. Try again later.</p><p>Reference: <code>${escapeHtml(requestId)}</code></p><p><a href="/dashboard#health">View health</a></p></main></body></html>`, { status: 503, headers });
  }
  return json({ error: 'service_unavailable', requestId }, {
    status: 503,
    headers: { 'cache-control': 'no-store', 'retry-after': '30' },
  });
}

export async function readJson<T>(request: Request, maxBytes = 16_384): Promise<T> {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim();
  if (contentType !== 'application/json') throw new HttpError(415, 'content_type_must_be_application_json');
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > maxBytes) throw new HttpError(413, 'request_body_too_large');
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new HttpError(413, 'request_body_too_large');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, readonly detail?: string) {
    super(code);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ error: error.code, ...(error.detail ? { detail: error.detail } : {}) }, {
      status: error.status,
      headers: { 'cache-control': 'no-store' },
    });
  }
  throw error;
}
