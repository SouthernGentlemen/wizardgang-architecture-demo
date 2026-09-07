import type { Env } from '../types';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';
import { renderLogsDemo } from './logs';
import { renderBilling, renderDashboard, renderDocs, renderUptime } from './operations-pages';
import { renderUnifiedReportingPresentation } from './reporting-dashboard';
import { frontendSurface, frontendViewUrl } from './registry';

export const operationsViews = ['overview', 'availability', 'logs', 'usage', 'reports', 'docs'] as const;
export type OperationsView = (typeof operationsViews)[number];

const operationsSurface = frontendSurface('operations.page');
const viewLabels = Object.fromEntries(operationsSurface.views.map((view) => [view.id, view.label])) as Record<OperationsView, string>;

function viewHref(view: OperationsView): string {
  return view === 'overview' ? operationsSurface.route : frontendViewUrl('operations.page', view);
}

function operationsViewNavigation(active: OperationsView): string {
  return `<div class="operations-navigation"><nav class="section-nav" aria-label="Operations views">${operationsViews.map((view) =>
    `<a href="${viewHref(view)}"${view === active ? ' aria-current="page"' : ''}>${viewLabels[view]}</a>`).join('')}</nav>
  <details class="machine-endpoints"><summary>Machine endpoints</summary><nav class="link-row" aria-label="Operations machine endpoints"><a href="/api/operations/health">/api/operations/health</a><a href="/api/operations/version">/api/operations/version</a><a href="/api/operations/logs">/api/operations/logs</a><a href="/api/reporting/operations">/api/reporting/operations</a></nav></details></div>`;
}

function parseView(request: Request): OperationsView | null {
  const raw = new URL(request.url).searchParams.get('view') || 'overview';
  return operationsViews.includes(raw as OperationsView) ? raw as OperationsView : null;
}

async function renderReports(request: Request, env: Env): Promise<Response> {
  const usage = await latestCloudflareUsage(env);
  const reporting = await renderUnifiedReportingPresentation(request, env, usage);
  return shell(env, 'Operations Reports', `<section class="page-header operations-header">
  <p class="eyebrow">OPERATIONS / REPORTS</p>
  <h1>Reports</h1>
  <p class="lede">Shared operational and assurance reporting, projected through the canonical reporting presenter.</p>
  <div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/reporting/presentation.ts')}">View reporting presenter <span aria-hidden="true">↗</span></a></div>
</section>
${operationsViewNavigation('reports')}
${reporting}`, {
    cacheControl: 'no-store',
    activeRoute: operationsSurface.route,
    description: 'Shared operational and assurance reporting for the architecture demo.',
  });
}

function notFound(env: Env): Response {
  return shell(env, 'Not Found', `<section class="page-header"><p class="eyebrow">404</p><h1>Not found</h1><p class="lede">That operations view is not registered.</p><p><a href="${operationsSurface.route}">Return to Operations</a></p></section>`, {
    status: 404,
    cacheControl: 'no-store',
    activeRoute: operationsSurface.route,
    noindex: true,
  });
}

export async function renderOperations(request: Request, env: Env): Promise<Response> {
  const view = parseView(request);
  if (!view) return notFound(env);

  switch (view) {
    case 'overview':
      return renderDashboard(env, request);
    case 'availability':
      return renderUptime(env);
    case 'logs':
      return renderLogsDemo(request, env);
    case 'usage':
      return renderBilling(env);
    case 'reports':
      return renderReports(request, env);
    case 'docs':
      return renderDocs(env);
  }
}
