import type { DemoDefinition, Env } from '../types';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';
import { renderLogsDemo } from './logs';
import { renderBilling, renderDashboard, renderDocs, renderUptime } from './operations-pages';
import { renderUnifiedReportingPresentation } from './reporting-dashboard';

type OperationsView = 'overview' | 'availability' | 'logs' | 'usage' | 'reports' | 'docs';

const views: readonly OperationsView[] = ['overview', 'availability', 'logs', 'usage', 'reports', 'docs'];

function operationsViewNavigation(active: OperationsView): string {
  const links: Array<[OperationsView, string, string]> = [
    ['overview', 'Overview', '/operations'],
    ['availability', 'Availability', '/operations?view=availability'],
    ['logs', 'Logs', '/operations?view=logs'],
    ['usage', 'Usage', '/operations?view=usage'],
    ['reports', 'Reports', '/operations?view=reports'],
    ['docs', 'Docs', '/operations?view=docs'],
  ];
  return `<div class="operations-navigation"><nav class="section-nav" aria-label="Operations views">${links.map(([view, label, href]) =>
    `<a href="${href}"${view === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
  <details class="machine-endpoints"><summary>Machine endpoints</summary><nav class="link-row" aria-label="Operations machine endpoints"><a href="/health">/health</a><a href="/version">/version</a><a href="/__api/operations/logs">/__api/operations/logs</a><a href="/__api/operations/cloudflare-usage">/__api/operations/cloudflare-usage</a></nav></details></div>`;
}

function parseView(request: Request): OperationsView | null {
  const raw = new URL(request.url).searchParams.get('view') || 'overview';
  return views.includes(raw as OperationsView) ? raw as OperationsView : null;
}

function rewriteLegacyLinks(html: string, view: OperationsView): string {
  let rewritten = html
    .replaceAll('/dashboard/uptime', '/operations?view=availability')
    .replaceAll('/dashboard/logs', '/operations?view=logs')
    .replaceAll('/dashboard/billing', '/operations?view=usage')
    .replaceAll('/dashboard/docs', '/operations?view=docs')
    .replaceAll('/dashboard?report=', '/operations?view=reports&amp;report=')
    .replaceAll('/dashboard', '/operations');

  rewritten = rewritten.replace(
    /<div class="operations-navigation"><nav class="section-nav" aria-label="Operations">[\s\S]*?<\/details><\/div>/,
    operationsViewNavigation(view),
  );
  rewritten = rewritten.replace(
    '<a href="/operations">Operations</a>',
    '<a href="/operations" aria-current="page">Operations</a>',
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
    activeRoute: '/operations',
    description: 'Shared operational and assurance reporting for the architecture demo.',
  });
}

function notFound(env: Env): Response {
  return shell(env, 'Not Found', `<section class="page-header"><p class="eyebrow">404</p><h1>Not found</h1><p class="lede">That operations view is not registered.</p><p><a href="/operations">Return to Operations</a></p></section>`, {
    status: 404,
    cacheControl: 'no-store',
    activeRoute: '/operations',
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

const demo: DemoDefinition = {
  id: 'operations',
  route: '/operations',
  title: 'Operations',
  group: 'Operations',
  sourcePath: 'src/demos/operations.ts',
  summary: 'One server-rendered operations surface for health, availability, public-safe logs, usage and cost, shared reporting, deployment evidence, and documentation.',
  proves: [
    'One canonical server-rendered operations route with six explicit views',
    'Scheduled observations distinguish planned maintenance from unexpected availability failures',
    'Public-safe logs and sanitized Cloudflare observations remain visible without exposing private account configuration',
    'Billed-cost state and synthetic guardrail simulation remain available alongside deployment evidence',
    'Reports use the shared reporting presenter rather than a parallel reporting contract',
    'Operational documentation and machine recovery interfaces remain directly reachable',
  ],
  status: 'working',
  interfaces: [
    { method: 'GET', path: '/operations', description: 'Render overview, availability, logs, usage, reports, or docs from the view query.' },
    { method: 'GET', path: '/health', description: 'Return machine-readable runtime and dependency health.' },
    { method: 'GET', path: '/version', description: 'Return deployment version and source metadata.' },
    { method: 'GET', path: '/__api/operations/logs', description: 'Return bounded public-safe application logs.' },
    { method: 'GET', path: '/__api/operations/cloudflare-usage', description: 'Return sanitized Cloudflare usage observations.' },
    { method: 'POST', path: '/__api/operations/billing', description: 'Run the synthetic cost-guardrail scenario.' },
  ],
  supportingSources: [
    { label: 'View consolidated operations implementation', path: 'src/demos/operations.ts' },
    { label: 'View operational presenters', path: 'src/demos/operations-pages.ts' },
    { label: 'View shared reporting presenter', path: 'src/reporting/presentation.ts' },
    { label: 'View operations tests', path: 'tests/operations-consolidation.test.ts' },
  ],
};

export default demo;
