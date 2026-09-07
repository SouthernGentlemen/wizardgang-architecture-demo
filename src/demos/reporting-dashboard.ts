import { assuranceRegistryApiRoute } from '../assurance/routes';
import { authorize, type Principal } from '../lib/authorization';
import type { CloudflareUsageSnapshot } from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import type { Env } from '../types';
import { renderReportingPresentation } from '../reporting/html';
import { presentReportingQuery } from '../reporting/presentation';
import {
  queryReportingCollection,
  reportingCollectionFilters,
  reportingCollectionInventory,
  type ReportingCollectionDescriptor,
} from '../reporting/service';

function anonymousPrincipal(): Principal {
  return { subject: 'public-visitor', authentication: 'anonymous', role: 'viewer', permissions: ['demo:read'] };
}

async function reportingPrincipal(request: Request, env: Env): Promise<Principal> {
  const authorized = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  return authorized instanceof Response ? anonymousPrincipal() : authorized;
}

export function dashboardReportingFamilies(
  _env: Env,
  _usage: CloudflareUsageSnapshot,
  principal: Principal = anonymousPrincipal(),
): ReportingCollectionDescriptor[] {
  return reportingCollectionInventory(principal);
}

export function dashboardReportingRequestUrl(
  endpoint: string,
  dashboardUrl: string | URL,
  filterNames: readonly string[] = [],
): URL {
  const current = dashboardUrl instanceof URL ? dashboardUrl : new URL(dashboardUrl);
  const target = new URL(endpoint, current.origin);
  for (const filterName of filterNames) {
    const value = current.searchParams.get(filterName);
    if (value) target.searchParams.set(filterName, value);
  }
  if (!target.searchParams.has('limit')) target.searchParams.set('limit', current.searchParams.get('limit') || '10');
  const cursor = current.searchParams.get('cursor');
  if (cursor) target.searchParams.set('cursor', cursor);
  return target;
}

function familyCard(env: Env, family: ReportingCollectionDescriptor, selected: boolean): string {
  const links = [`<a href="/dashboard?report=${encodeURIComponent(family.id)}#reporting-browser">${selected ? 'Selected' : 'Inspect'} <span aria-hidden="true">→</span></a>`];
  if (family.kind === 'structured' && family.sourcePaths[0]) {
    links.push(`<a href="${escapeHtml(sourceUrl(env, family.sourcePaths[0]))}">Canonical source ↗</a>`);
  }
  return `<article class="usage-product"><div><p class="eyebrow">${family.kind === 'structured' ? 'Registered records' : 'Registered source'}</p><h3>${escapeHtml(family.label)}</h3><span class="badge">${escapeHtml(family.provider)}</span></div><p>${family.kind === 'structured' ? `${family.resourceIds.length} registered collection${family.resourceIds.length === 1 ? '' : 's'}` : `${family.sourceIds.length} registered source`}</p><div class="link-row">${links.join('')}</div></article>`;
}

function filterControls(collection: ReportingCollectionDescriptor, url: URL): string {
  return reportingCollectionFilters(collection).map((filter) => {
    const selected = url.searchParams.get(filter.name) ?? '';
    return `<label>${escapeHtml(filter.label)} <select name="${escapeHtml(filter.name)}"><option value="">All</option>${filter.values.map((option) => `<option value="${escapeHtml(option.value)}"${selected === option.value ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select></label>`;
  }).join('');
}

function pageSize(url: URL): number {
  const value = Number(url.searchParams.get('limit') || '10');
  if (!Number.isInteger(value)) return 10;
  return Math.max(1, Math.min(50, value));
}

function nextHref(request: Request, cursor: string | null | undefined): string | null {
  if (!cursor) return null;
  const url = new URL(request.url);
  url.searchParams.set('cursor', cursor);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function renderUnifiedReportingPresentation(
  request: Request,
  env: Env,
  usage: CloudflareUsageSnapshot,
): Promise<string> {
  const principal = await reportingPrincipal(request, env);
  const families = dashboardReportingFamilies(env, usage, principal);
  const url = new URL(request.url);
  const requested = url.searchParams.get('report');
  const selected = families.find((family) => family.id === requested) ?? families[0];
  if (!selected) {
    return '<section class="operations-section" id="reporting"><h2>Unified reporting</h2><div class="availability-empty">No compatible reporting collections are registered.</div></section>';
  }
  const result = await queryReportingCollection(env, principal, selected, {
    searchParams: url.searchParams,
    limit: pageSize(url),
    cursor: url.searchParams.get('cursor'),
    usage,
  });
  const presentation = presentReportingQuery(result, { label: selected.label });
  const next = nextHref(request, presentation.pagination?.nextCursor);
  const limit = pageSize(url);

  return `<section class="operations-section" id="reporting" aria-labelledby="reporting-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Reporting / shared records</p><h2 id="reporting-heading">Unified reporting</h2></div><a href="${escapeHtml(assuranceRegistryApiRoute())}">Assurance JSON <span aria-hidden="true">→</span></a></div>
    <p>Collection discovery comes from reporting ownership and registered capabilities. The dashboard does not select provider endpoints or interpret provider records.</p>
    <div class="usage-products" aria-label="Registered reporting collections">${families.map((family) => familyCard(env, family, family.id === selected.id)).join('')}</div>
  </section>
  <section class="operations-section" id="reporting-browser" aria-labelledby="reporting-browser-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Authorized selection</p><h2 id="reporting-browser-heading">Reporting browser</h2></div></div>
    <form method="get" action="/dashboard" class="filter-form">
      <label>Collection <select name="report">${families.map((family) => `<option value="${escapeHtml(family.id)}"${family.id === selected.id ? ' selected' : ''}>${escapeHtml(family.label)}</option>`).join('')}</select></label>
      ${filterControls(selected, url)}
      <label>Page size <select name="limit"><option value="10"${limit === 10 ? ' selected' : ''}>10</option><option value="25"${limit === 25 ? ' selected' : ''}>25</option><option value="50"${limit === 50 ? ' selected' : ''}>50</option></select></label>
      <button type="submit">Apply</button>
    </form>
    ${renderReportingPresentation(presentation, { headingId: 'reporting-results-heading', nextHref: next })}
  </section>`;
}
