import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { secondaryNavigation } from '../routing/navigation';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { pageContent, renderPage, type PageContent } from '../ui/page';

const ROUTE_ID = 'interfaces.index';

export function interfacesContent(env: Env): PageContent {
  const children = secondaryNavigation(ROUTE_ID);
  const body = `<section class="page-header">
    <h1>Interfaces</h1>
    <p class="lede">Explore each application interface, identity surface, localization proof, and accessibility laboratory at its own canonical route.</p>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/interfaces.ts'))}">Interfaces index source</a></div>
  </section>
  <section aria-labelledby="interface-children-heading">
    <div class="section-head"><h2 id="interface-children-heading">Interface demonstrations</h2><span>${children.length} registered routes</span></div>
    <div class="grid">${children.map((route) => `<a class="card" href="${escapeHtml(routeUrl(route.id))}"><p class="eyebrow">${escapeHtml(route.pattern)}</p><h3>${escapeHtml(route.page!.label)}</h3><p>${escapeHtml(route.page!.summary)}</p></a>`).join('')}</div>
  </section>`;
  return pageContent(env, 'Interfaces', body, {
    routeId: ROUTE_ID,
    canonicalPath: routeUrl(ROUTE_ID),
    description: 'Registered application interface demonstrations with canonical child routes.',
  });
}

export function renderInterfaces(_request: Request, env: Env): Response {
  return renderPage(env, interfacesContent(env));
}
