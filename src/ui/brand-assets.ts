import socialCard from '../assets/og.png';
import { methodNotAllowed, withSecurityHeaders } from '../lib/http';

export function socialCardResponse(request: Request): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed(['GET', 'HEAD']);
  const headers = withSecurityHeaders(new Headers({
    'content-type': 'image/png',
    'content-length': String(socialCard.byteLength),
    'cache-control': 'public, max-age=31536000, immutable',
  }));
  return new Response(request.method === 'HEAD' ? null : socialCard, { headers });
}
