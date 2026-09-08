import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { secondaryNavigation } from '../routing/navigation';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { pageContent, renderPage, type PageContent } from '../ui/page';

const ROUTE_ID = 'platform.index';

export function platformContent(env: Env): PageContent {
  const children = secondaryNavigation(ROUTE_ID);
  const body = `<section class="page-header">
    <h1>Cloudflare Platform</h1>
    <p class="lede">Inspect the edge, compute, coordination, relational, and object-storage demonstrations as distinct registered resources.</p>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/platform.ts'))}">Platform index source</a></div>
  </section>
  <section aria-labelledby="platform-children-heading">
    <div class="section-head"><h2 id="platform-children-heading">Platform demonstrations</h2><span>${children.length} registered routes</span></div>
    <div class="grid">${children.map((route) => `<a class="card" href="${escapeHtml(routeUrl(route.id))}"><p class="eyebrow">${escapeHtml(route.pattern)}</p><h3>${escapeHtml(route.page!.label)}</h3><p>${escapeHtml(route.page!.summary)}</p></a>`).join('')}</div>
  </section>`;
  return pageContent(env, 'Platform', body, {
    routeId: ROUTE_ID,
    canonicalPath: routeUrl(ROUTE_ID),
    description: 'Registered Cloudflare platform demonstrations with canonical child routes.',
  });
}

export function renderPlatform(_request: Request, env: Env): Response {
  return renderPage(env, platformContent(env));
}
