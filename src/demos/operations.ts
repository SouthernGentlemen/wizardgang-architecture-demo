import type { Env } from '../types';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import { routeUrl } from '../routing/application-routes';
import { registeredRouteMetadata, secondaryNavigation } from '../routing/navigation';
import { pageContent, renderPage, type PageContent } from '../ui/page';
import { dashboardContent } from './operations-pages';
import { renderUnifiedReportingPresentation } from './reporting-dashboard';

const OPERATIONS_ROUTE_ID = 'operations.index';

function operationsPageRoutes() {
  const index = registeredRouteMetadata().find((route) => route.id === OPERATIONS_ROUTE_ID);
  if (!index?.page) throw new Error(`Missing page metadata for ${OPERATIONS_ROUTE_ID}`);
  return [index, ...secondaryNavigation(OPERATIONS_ROUTE_ID)];
}

export function operationsNavigation(activeRouteId: string): string {
  const links = operationsPageRoutes().map((route) =>
    `<a href="${escapeHtml(routeUrl(route.id))}"${route.id === activeRouteId ? ' aria-current="page"' : ''}>${escapeHtml(route.page!.label)}</a>`
  ).join('');
  const machineLinks = [
    ['operations.health', 'Operations health'],
    ['operations.version', 'Operations version'],
    ['operations.api-logs', 'Operations logs'],
  ] as const;
  const reportingRoute = routeUrl('reporting.collection', { collection: 'operations' });
  return `<div class="operations-navigation"><nav class="section-nav" aria-label="Operations views">${links}</nav>
  <details class="machine-endpoints"><summary>Machine endpoints</summary><nav class="link-row" aria-label="Operations machine endpoints">${machineLinks.map(([routeId]) => {
    const href = routeUrl(routeId);
    return `<a href="${escapeHtml(href)}">${escapeHtml(href)}</a>`;
  }).join('')}<a href="${escapeHtml(reportingRoute)}">${escapeHtml(reportingRoute)}</a></nav></details></div>`;
}

export function operationsPageContent(content: PageContent, routeId: string): PageContent {
  return {
    ...content,
    routeId,
    beforeMain: `<div class="site-main surface-before-main">${operationsNavigation(routeId)}</div>`,
    canonicalPath: routeUrl(routeId),
  };
}

export async function renderOperations(request: Request, env: Env): Promise<Response> {
  return renderPage(env, operationsPageContent(await dashboardContent(env, request), OPERATIONS_ROUTE_ID));
}

export async function reportsContent(request: Request, env: Env): Promise<PageContent> {
  const usage = await latestCloudflareUsage(env);
  const reporting = await renderUnifiedReportingPresentation(request, env, usage);
  return pageContent(env, 'Operations Reports', `<section class="page-header operations-header">
  <p class="eyebrow">OPERATIONS / REPORTS</p>
  <h1>Reports</h1>
  <p class="lede">Shared operational and assurance reporting, projected through the canonical reporting presenter.</p>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/reporting/presentation.ts'))}">View reporting presenter <span aria-hidden="true">↗</span></a></div>
</section>
${reporting}`, {
    cacheControl: 'no-store',
    canonicalPath: routeUrl('operations.reports'),
    description: 'Shared operational and assurance reporting for the architecture demo.',
  });
}
