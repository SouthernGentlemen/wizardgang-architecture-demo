import { methodNotAllowed } from '../lib/http';
import { localGraphiqlDocument } from './graphiql-document';

export function localGraphiqlResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const html = localGraphiqlDocument(request);
  return new Response(html, { headers: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; connect-src 'self'; img-src data:; script-src 'self' blob:; style-src 'self' 'unsafe-inline'; worker-src blob:; frame-ancestors 'self'; base-uri 'none'; form-action 'self'",
    'cross-origin-resource-policy': 'same-origin',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
  } });
}
