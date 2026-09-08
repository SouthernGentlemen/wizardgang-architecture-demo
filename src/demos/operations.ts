import type { Env } from '../types';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import { routeUrl } from '../routing/application-routes';
import { pageContent, referenceDetails, renderPage, type PageContent } from '../ui/page';
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
  const explorerOpen = Boolean(new URL(request.url).search);
  return pageContent(env, 'Operations Reports', `<section class="page-header operations-header">
  <h1>Reports</h1>
  <p class="lede">Can operational and assurance evidence be retrieved consistently?</p>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/reporting/presentation.ts'))}">View reporting presenter <span aria-hidden="true">↗</span></a></div>
</section>
<section class="operations-section" aria-labelledby="reporting-contract-heading">
  <p class="eyebrow">What this demonstrates</p><h2 id="reporting-contract-heading">One reporting contract, many evidence families</h2>
  <p>Evidence comes from different sources, but consumers need a consistent way to find authorized records, understand their status, and retrieve the next page.</p>
  <p>The same reporting abstraction supports operational and assurance data. Each source keeps ownership of its records while shared services handle access, presentation, and pagination.</p>
  <ol class="operations-flow" aria-label="Shared reporting flow">
    <li><strong>Evidence families</strong><span>Examples: Evidence · Risks · Governance · Compliance · Incidents · Operations</span></li>
    <li><strong>Shared reporting contract</strong><span>Shared authorization · shared presentation · shared pagination</span></li>
    <li><strong>Consumers</strong><span>HTML pages · JSON responses · machine consumers</span></li>
  </ol>
  <p class="subtle">These examples illustrate the flow. The registered source inventory below determines which collections are available to you.</p>
</section>
<details class="operations-inspection" id="reporting-explorer"${explorerOpen ? ' open' : ''}>
  <summary>Explore all reporting sources</summary>
  ${reporting}
</details>
${referenceDetails([
  { label: 'Reporting service and authorization', href: sourceUrl(env, 'src/reporting/service.ts') },
  { label: 'Reporting presentation', href: sourceUrl(env, 'src/reporting/presentation.ts') },
  { label: 'Reporting pagination', href: sourceUrl(env, 'src/reporting/pagination.ts') },
  { label: 'Reporting contracts', href: sourceUrl(env, 'src/reporting/contracts.ts') },
], 'Implementation sources')}
<script>(() => {
  const explorer = document.getElementById('reporting-explorer');
  const revealTarget = () => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target || !explorer.contains(target)) return;
    explorer.open = true;
    for (let parent = target.parentElement; parent && parent !== explorer; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    target.scrollIntoView();
  };
  revealTarget();
  window.addEventListener('hashchange', revealTarget);
})()</script>`, {
    cacheControl: 'no-store',
    canonicalPath: routeUrl('operations.reports'),
    description: 'Shared operational and assurance reporting for the architecture demo.',
  });
}
