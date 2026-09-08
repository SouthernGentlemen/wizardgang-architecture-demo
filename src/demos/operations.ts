import type { Env } from '../types';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import { routeUrl } from '../routing/application-routes';
import { pageContent, renderPage, type PageContent } from '../ui/page';
import { dashboardContent } from './operations-pages';
import { renderUnifiedReportingPresentation } from './reporting-dashboard';

const OPERATIONS_ROUTE_ID = 'operations.index';

export function operationsPageContent(content: PageContent, routeId: string): PageContent {
  return {
    ...content,
    routeId,
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
