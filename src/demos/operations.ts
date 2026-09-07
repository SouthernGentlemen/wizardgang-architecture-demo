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
  <details class="machine-endpoints"><summary>Machine endpoints</summary><nav class="link-row" aria-label="Operations machine endpoints"><a href="/api/operations/health">/api/operations/health</a><a href="/api/operations/version">/api/operations/version</a><a href="/api/operations/logs">/api/operations/logs</a><a href="/api/operations/usage">/api/operations/usage</a></nav></details></div>`;
}

function parseView(request: Request): OperationsView | null {
  const raw = new URL(request.url).searchParams.get('view') || 'overview';
  return operationsViews.includes(raw as OperationsView) ? raw as OperationsView : null;
}

function rewriteLegacyLinks(html: string, view: OperationsView): string {
  let rewritten = html
    .replaceAll('/dashboard/uptime', viewHref('availability'))
    .replaceAll('/dashboard/logs', viewHref('logs'))
    .replaceAll('/dashboard/billing', viewHref('usage'))
    .replaceAll('/dashboard/docs', viewHref('docs'))
    .replaceAll('/dashboard?report=', `${viewHref('reports')}&amp;report=`)
    .replaceAll('/dashboard', operationsSurface.route);

  rewritten = rewritten.replace(
    /<div class="operations-navigation"><nav class="section-nav" aria-label="Operations">[\s\S]*?<\/details><\/div>/,
    operationsViewNavigation(view),
  );
  rewritten = rewritten.replace(
    `<a href="${operationsSurface.route}">Operations</a>`,
    `<a href="${operationsSurface.route}" aria-current="page">Operations</a>`,
  );
  if (view === 'logs') {
    rewritten = rewritten.replace(
      '<form method="get" class="filters">',
      '<form method="get" class="filters"><input type="hidden" name="view" value="logs">',
    );
  }
  return rewritten;
}

async function normalizeLegacyResponse(response: Response, view: OperationsView): Promise<Response> {
  const headers = new Headers(response.headers);
  const body = rewriteLegacyLinks(await response.text(), view);
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
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
      return normalizeLegacyResponse(await renderDashboard(env, request), view);
    case 'availability':
      return normalizeLegacyResponse(await renderUptime(env), view);
    case 'logs':
      return normalizeLegacyResponse(await renderLogsDemo(request, env), view);
    case 'usage':
      return normalizeLegacyResponse(await renderBilling(env), view);
    case 'reports':
      return renderReports(request, env);
    case 'docs':
      return normalizeLegacyResponse(await renderDocs(env), view);
  }
}
