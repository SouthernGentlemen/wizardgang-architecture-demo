import type { DemoDefinition } from '../types';
import { escapeHtml } from '../lib/html';
import { withSecurityHeaders } from '../lib/http';

/**
 * Generated from the same registry that serves the routes, so the public sitemap
 * cannot drift from the published route contract.
 */
export function sitemapResponse(request: Request, demos: DemoDefinition[]): Response {
  const url = new URL(request.url);
  // The public site is HTTPS-only; local hosts keep whatever scheme the developer used.
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const origin = local ? url.origin : `https://${url.host}`;
  const paths = ['/', ...demos.map((demo) => demo.route)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${escapeHtml(`${origin}${path}`)}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: withSecurityHeaders(new Headers({
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    })),
  });
}
