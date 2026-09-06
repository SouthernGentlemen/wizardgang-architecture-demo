import { escapeHtml } from '../lib/html';
import { withSecurityHeaders } from '../lib/http';
import { registeredSitemapPaths } from '../routing/navigation';

/** Generate the public sitemap from registered page metadata. */
export function sitemapResponse(request: Request, _legacyInput?: unknown): Response {
  const url = new URL(request.url);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const origin = local ? url.origin : `https://${url.host}`;
  const paths = registeredSitemapPaths();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((routePath) => `  <url><loc>${escapeHtml(`${origin}${routePath}`)}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: withSecurityHeaders(new Headers({
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    })),
  });
}
