import type { Principal } from '../lib/authorization';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import { renderReportingPresentation } from '../reporting/html';
import { presentReportingQuery } from '../reporting/presentation';
import { queryReportingCollection, reportingCollectionInventory } from '../reporting/service';
import type { DemoDefinition, Env } from '../types';
import { renderNotFound, shell } from '../ui/page';
import { renderConcerns, renderIncidents, renderRisks } from './assurance-pages';
import { renderComplianceDemo } from './compliance-page';
import { renderEvidenceDemo } from './evidence-page';
import { renderGitDemo } from './git-page';
import { renderGovernance } from './governance';

export const assuranceViews = [
  'overview',
  'delivery',
  'governance',
  'evidence',
  'compliance',
  'risks',
  'incidents',
  'concerns',
] as const;
export type AssuranceView = (typeof assuranceViews)[number];

const assuranceDemo: DemoDefinition = {
  id: 'assurance',
  route: '/assurance',
  title: 'Assurance',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/assurance.ts',
  summary: 'One server-rendered assurance surface for delivery, governance, evidence, compliance, risks, incidents, and public concerns.',
  notice: 'WCAG 2.2 / ISO 27001 / ISO 42001 references are alignment targets, not certification claims. Private vulnerability reporting remains at /security.',
  proves: [
    'Public assurance views share one canonical server-rendered route and shared reporting contracts',
    'Stable assurance record fragments survive surface consolidation',
    'Git delivery controls and public concern intake retain their existing provider-backed workflows',
    'Private vulnerability reporting and published security advisories remain isolated on /security',
  ],
  status: 'working',
  supportingSources: [
    { label: 'Assurance guidance', path: 'docs/ASSURANCE.md' },
    { label: 'Reporting guidance', path: 'docs/REPORTING.md' },
    { label: 'Evidence map', path: 'docs/EVIDENCE.md' },
    { label: 'Disclosure policy', path: 'src/reporting/disclosure.ts' },
    { label: 'Publication policy', path: 'src/assurance/publication-policy.js' },
  ],
};

const viewLabels: Record<AssuranceView, string> = {
  overview: 'Overview',
  delivery: 'Delivery',
  governance: 'Governance',
  evidence: 'Evidence',
  compliance: 'Compliance',
  risks: 'Risks',
  incidents: 'Incidents',
  concerns: 'Concerns',
};

const viewDescriptions: Record<AssuranceView, string> = {
  overview: 'Public assurance posture, qualifications, and inspectable record families.',
  delivery: 'Git delivery workflow, validation evidence, and release traceability.',
  governance: 'Governance records, control mappings, AI boundary evaluation, and traceability.',
  evidence: 'Searchable public evidence with provenance, freshness, lifecycle state, and stable fragments.',
  compliance: 'Filterable WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 engineering-evidence mappings.',
  risks: 'Disclosure-safe public risk records with treatment direction, lifecycle state, and evidence relationships.',
  incidents: 'Disclosure-safe incident and exercise records with explicit record boundaries.',
  concerns: 'Structured public intake for non-sensitive bugs, features, accessibility, AI/MCP, and governance concerns.',
};

const viewCollections: Record<AssuranceView, string> = {
  overview: 'claims',
  delivery: 'evidence',
  governance: 'governance',
  evidence: 'evidence',
  compliance: 'compliance',
  risks: 'risks',
  incidents: 'incidents',
  concerns: 'governance',
};

const retiredPresentationRoutes: Array<[string, AssuranceView]> = [
  ['/governance/concerns', 'concerns'],
  ['/governance/incidents', 'incidents'],
  ['/governance/risks', 'risks'],
  ['/governance', 'governance'],
  ['/compliance', 'compliance'],
  ['/evidence', 'evidence'],
  ['/git', 'delivery'],
];

function publicPrincipal(): Principal {
  return { subject: 'public-visitor', authentication: 'anonymous', role: 'viewer', permissions: ['demo:read'] };
}

function viewHref(view: AssuranceView): string {
  return `/assurance?view=${view}`;
}

function isAssuranceView(value: string): value is AssuranceView {
  return (assuranceViews as readonly string[]).includes(value);
}

function requestedLimit(url: URL): number {
  const value = Number(url.searchParams.get('limit') || '25');
  if (!Number.isInteger(value)) return 25;
  return Math.max(1, Math.min(50, value));
}

function nextHref(request: Request, cursor: string | null | undefined): string | null {
  if (!cursor) return null;
  const url = new URL(request.url);
  url.searchParams.set('cursor', cursor);
  return `${url.pathname}${url.search}`;
}

function viewNavigation(view: AssuranceView): string {
  return `<section class="platform-view-selector assurance-view-selector" aria-label="Assurance view selection">
    <div class="section-head"><h2>Assurance views</h2><span>Server-rendered views</span></div>
    <nav class="meta" aria-label="Assurance views">
      ${assuranceViews.map((name) => `<a href="${escapeHtml(viewHref(name))}"${name === view ? ' aria-current="page"' : ''}>${escapeHtml(viewLabels[name])}</a>`).join('')}
      <a href="/security">Security reporting</a>
    </nav>
  </section>`;
}

function overviewContent(): string {
  return `<section class="page-header assurance-header">
    <p class="eyebrow">Delivery &amp; Governance / /assurance</p>
    <h1>Public assurance, one inspectable surface.</h1>
    <p class="lede">Browse delivery, governance, evidence, compliance, risk, incident, and concern records without duplicating the canonical reporting or publication contracts behind them.</p>
    <p class="assurance-notice"><strong>Qualification:</strong> ${escapeHtml(assuranceDemo.notice ?? '')}</p>
  </section>
  <section aria-labelledby="assurance-overview-heading">
    <div class="section-head"><h2 id="assurance-overview-heading">Assurance areas</h2><span>Shared query and presentation contracts</span></div>
    <div class="grid">${assuranceViews.filter((view) => view !== 'overview').map((view) => `<a class="card" href="${escapeHtml(viewHref(view))}"><p class="eyebrow">${escapeHtml(viewHref(view))}</p><h3>${escapeHtml(viewLabels[view])}</h3><p>${escapeHtml(viewDescriptions[view])}</p></a>`).join('')}</div>
  </section>
  <section class="assurance-notice" aria-labelledby="security-boundary-heading">
    <h2 id="security-boundary-heading">Security stays separate</h2>
    <p>Suspected vulnerabilities, active security incidents, credentials, exploit detail, and other sensitive material belong in private vulnerability reporting. Published advisories remain on the canonical <a href="/security">security page</a>.</p>
  </section>`;
}

async function mainContent(response: Response): Promise<string> {
  const html = await response.text();
  const marker = '<main class="site-main" id="main">';
  const start = html.indexOf(marker);
  const end = start === -1 ? -1 : html.indexOf('</main>', start + marker.length);
  if (start === -1 || end === -1) throw new Error('Assurance renderer did not return the shared page shell.');
  return html.slice(start + marker.length, end);
}

function normalizeEmbeddedRoutes(html: string): string {
  let normalized = html;
  for (const [route, view] of retiredPresentationRoutes) {
    const target = viewHref(view);
    normalized = normalized.replaceAll(`href="${route}`, `href="${target}`);
    normalized = normalized.replaceAll(`action="${route}`, `action="${target}`);
  }
  for (const view of assuranceViews) {
    normalized = normalized.replaceAll(`${viewHref(view)}?`, `${viewHref(view)}&`);
  }
  return normalized.replace(
    /<form([^>]*?)action="\/assurance\?view=([a-z]+)"([^>]*)>/g,
    (_match, before: string, view: string, after: string) => `<form${before}action="/assurance"${after}><input type="hidden" name="view" value="${escapeHtml(view)}">`,
  );
}

async function renderSelectedAssurance(request: Request, env: Env, view: AssuranceView): Promise<string> {
  if (view === 'overview') return overviewContent();
  let response: Response;
  if (view === 'delivery') response = await renderGitDemo(env);
  else if (view === 'governance') response = await renderGovernance(request, env, []);
  else if (view === 'evidence') response = await renderEvidenceDemo(request, env);
  else if (view === 'compliance') response = await renderComplianceDemo(request, env);
  else if (view === 'risks') response = await renderRisks(request, env);
  else if (view === 'incidents') response = await renderIncidents(env);
  else response = await renderConcerns(env);
  return normalizeEmbeddedRoutes(await mainContent(response));
}

async function renderSharedReporting(request: Request, env: Env, view: AssuranceView): Promise<string> {
  const principal = publicPrincipal();
  const collection = reportingCollectionInventory(principal).find((candidate) => candidate.id === viewCollections[view]);
  if (!collection) {
    return `<section class="operations-section" id="assurance-reporting"><div class="availability-empty">No compatible public reporting collection is registered for this view.</div></section>`;
  }
  const url = new URL(request.url);
  const result = await queryReportingCollection(env, principal, collection, {
    searchParams: url.searchParams,
    limit: requestedLimit(url),
    cursor: url.searchParams.get('cursor'),
  });
  const presentation = presentReportingQuery(result, { label: `${viewLabels[view]} reporting` });
  return `<section class="operations-section" id="assurance-reporting" aria-labelledby="assurance-reporting-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Shared reporting projection</p><h2 id="assurance-reporting-heading">${escapeHtml(viewLabels[view])} reporting</h2></div><a href="${escapeHtml(sourceUrl(env, 'src/reporting/service.ts'))}">Reporting source <span aria-hidden="true">↗</span></a></div>
    <p class="subtle">This view queries the registered reporting collection and renders it through the shared disclosure-aware presentation layer. Canonical lifecycle, qualification, provenance, and public/private boundaries remain upstream of this page.</p>
    ${renderReportingPresentation(presentation, {
      headingId: `assurance-${view}-records-heading`,
      nextHref: nextHref(request, presentation.pagination?.nextCursor),
    })}
  </section>`;
}

async function finalizeResponse(response: Response, canonicalPath: string): Promise<Response> {
  let html = await response.text();
  const canonicalHref = new URL(canonicalPath, 'https://demo.wizardgang.ai').toString();
  const tag = `<link rel="canonical" href="${escapeHtml(canonicalHref)}">`;
  html = html.replace('  <link rel="icon"', `  ${tag}\n  <link rel="icon"`);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function renderAssurance(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const rawView = url.searchParams.get('view');
  const requestedView = rawView === null ? 'overview' : rawView;
  if (!isAssuranceView(requestedView)) return renderNotFound(env);

  const body = `${viewNavigation(requestedView)}
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, assuranceDemo.sourcePath))}">Assurance route source</a></div>
  ${await renderSelectedAssurance(request, env, requestedView)}
  ${await renderSharedReporting(request, env, requestedView)}`;
  const response = shell(env, `${viewLabels[requestedView]} · Assurance`, body, {
    activeRoute: assuranceDemo.route,
    description: viewDescriptions[requestedView],
    cacheControl: 'no-store',
  });
  return finalizeResponse(response, rawView === null ? assuranceDemo.route : viewHref(requestedView));
}

export default assuranceDemo;
