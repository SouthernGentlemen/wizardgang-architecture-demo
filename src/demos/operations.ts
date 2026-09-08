import type { Env } from '../types';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { pageContent, pageResponse, renderPage, type PageContent } from '../ui/page';
import { logsContent } from './logs';
import { billingContent, dashboardContent, docsContent, operationsNavigation, uptimeContent } from './operations-pages';
import { renderUnifiedReportingPresentation } from './reporting-dashboard';
import { frontendSurface, frontendViewUrl } from './registry';

export const operationsViews = ['overview', 'availability', 'logs', 'usage', 'reports', 'docs'] as const;
export type OperationsView = (typeof operationsViews)[number];

const operationsSurface = frontendSurface('operations.page');
const viewLabels = Object.fromEntries(operationsSurface.views.map((view) => [view.id, view.label])) as Record<OperationsView, string>;

function viewHref(view: OperationsView): string {
  return view === 'overview' ? operationsSurface.route : frontendViewUrl('operations.page', view);
}

function parseView(request: Request): OperationsView | null {
  const raw = new URL(request.url).searchParams.get('view') || 'overview';
  return operationsViews.includes(raw as OperationsView) ? raw as OperationsView : null;
}

async function reportsContent(request: Request, env: Env): Promise<PageContent> {
  const usage = await latestCloudflareUsage(env);
  const reporting = await renderUnifiedReportingPresentation(request, env, usage);
  return pageContent(env, 'Operations Reports', `<section class="page-header operations-header">
  <p class="eyebrow">OPERATIONS / REPORTS</p>
  <h1>Reports</h1>
  <p class="lede">Shared operational and assurance reporting, projected through the canonical reporting presenter.</p>
  <div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/reporting/presentation.ts')}">View reporting presenter <span aria-hidden="true">↗</span></a></div>
</section>
${reporting}`, {
    cacheControl: 'no-store',
    canonicalPath: operationsSurface.route,
    description: 'Shared operational and assurance reporting for the architecture demo.',
  });
}

function notFound(env: Env): Response {
  return pageResponse(env, 'Not Found', `<section class="page-header"><p class="eyebrow">404</p><h1>Not found</h1><p class="lede">That operations view is not registered.</p><p><a href="${operationsSurface.route}">Return to Operations</a></p></section>`, {
    status: 404,
    cacheControl: 'no-store',
    noindex: true,
    canonicalPath: operationsSurface.route,
  });
}

export async function renderOperations(request: Request, env: Env): Promise<Response> {
  const view = parseView(request);
  if (!view) return notFound(env);

  let content: PageContent;
  switch (view) {
    case 'overview': content = await dashboardContent(env, request); break;
    case 'availability': content = await uptimeContent(env); break;
    case 'logs': content = await logsContent(request, env); break;
    case 'usage': content = await billingContent(env); break;
    case 'reports': content = await reportsContent(request, env); break;
    case 'docs': content = docsContent(env); break;
  }
  return renderPage(env, {
    ...content,
    beforeMain: `<div class="site-main surface-before-main">${operationsNavigation(viewHref(view))}</div>`,
    canonicalPath: viewHref(view),
  });
}
