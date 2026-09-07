import {
  assuranceCollectionState,
  assuranceDatasetQualification,
  assuranceFilterDefinitions,
  assuranceFilterValues,
  assuranceRecordUrls,
  assuranceReportingCollections,
  deriveAssuranceCounts,
  labelAssuranceFilterValue,
} from '../assurance/service';
import { assuranceRegistryResources } from '../assurance/model';
import {
  listPublishedAssuranceRecords,
  type PublishedAssuranceRuntimeRecord,
} from '../assurance/publication';
import {
  assuranceRegistryApiRoute,
  assuranceRouteOwnerResource,
} from '../assurance/routes';
import {
  cloudflareUsageQueryResult,
  type CloudflareUsageSnapshot,
} from '../lib/cloudflare-usage';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import type { Env } from '../types';
import type {
  ReportingAvailability,
  ReportingQueryResult,
  ReportingRecord,
  ReportingSource,
} from '../reporting/contracts';
import {
  presentReportingQuery,
  reportingPresentationLabel,
  type ReportingPresentationAvailability,
} from '../reporting/presentation';
import {
  registeredReportingSource,
  reportingContractPath,
  reportingOwnership,
} from '../reporting/registry';

interface FilterDescriptor {
  name: string;
  label: string;
  values: Array<{ value: string; label: string }>;
}

interface DashboardReportingFamily {
  id: string;
  label: string;
  kind: 'structured' | 'provider';
  endpoint: string | null;
  exportEndpoint: string | null;
  htmlPath: string | null;
  sourcePaths: string[];
  filters: FilterDescriptor[];
  initial?: ReportingQueryResult<ReportingRecord>;
}

function structuredKinds(): string[] {
  const kinds: string[] = [];
  for (const resource of assuranceRegistryResources) {
    if (resource.visibility !== 'public') continue;
    if (!resource.capabilities.includes('runtime') || !resource.capabilities.includes('records')) continue;
    if (!kinds.includes(resource.kind)) kinds.push(resource.kind);
  }
  return kinds;
}

function structuredAvailability(status: ReturnType<typeof assuranceCollectionState>['status']): ReportingAvailability {
  if (status === 'available' || status === 'empty') return 'available';
  if (status === 'partial') return 'partial';
  return 'unavailable';
}

function structuredResult(dataset: string): ReportingQueryResult<PublishedAssuranceRuntimeRecord> {
  const state = assuranceCollectionState(dataset);
  const records = listPublishedAssuranceRecords(dataset);
  const sources = new Map<string, ReportingSource>();
  for (const collection of assuranceReportingCollections(dataset)) sources.set(collection.source.id, collection.source);
  return {
    schemaVersion: 1,
    contract: reportingContractPath,
    dataset,
    datasets: [dataset],
    availability: { [dataset]: structuredAvailability(state.status) },
    sources: [...sources.values()],
    qualifications: { [dataset]: assuranceDatasetQualification(dataset) ?? null },
    query: { filters: {} },
    records,
    derived: {
      count: records.length,
      totalAvailable: records.length,
      facets: deriveAssuranceCounts(dataset, records).byFilter,
    },
  };
}

function routeOwnerMatchesDataset(dataset: string): boolean {
  const owner = assuranceRouteOwnerResource(dataset);
  return Boolean(owner && owner.kind === dataset);
}

function exportEndpoint(path: string | null | undefined): string | null {
  if (!path) return null;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}export=1`;
}

function structuredFamily(dataset: string): DashboardReportingFamily {
  const routable = routeOwnerMatchesDataset(dataset);
  const urls = routable ? assuranceRecordUrls(dataset) : {};
  const resources = assuranceRegistryResources.filter((resource) => resource.kind === dataset && resource.visibility === 'public');
  const definitions = assuranceFilterDefinitions(dataset);
  return {
    id: dataset,
    label: reportingPresentationLabel(dataset),
    kind: 'structured',
    endpoint: routable ? urls.api ?? null : null,
    exportEndpoint: routable ? exportEndpoint(urls.api) : null,
    htmlPath: routable ? urls.html ?? null : null,
    sourcePaths: [...new Set(resources.map((resource) => resource.path))],
    filters: Object.entries(definitions).map(([name, definition]) => ({
      name,
      label: definition.label,
      values: assuranceFilterValues(dataset, name).map((value) => ({
        value,
        label: labelAssuranceFilterValue(dataset, name, value),
      })),
    })),
    initial: structuredResult(dataset),
  };
}

function providerEndpoint(source: ReportingSource, exporting: boolean): string | null {
  if (source.provider === 'github') {
    const params = new URLSearchParams({ source: source.id, limit: exporting ? '100' : '10' });
    if (exporting) params.set('export', '1');
    return `/__api/git/evidence?${params.toString()}`;
  }
  if (source.provider === 'cloudflare') {
    return exporting
      ? '/__api/operations/cloudflare-usage?export=1&limit=100'
      : '/__api/operations/cloudflare-usage?limit=10';
  }
  return null;
}

function providerFamilies(env: Env, usage: CloudflareUsageSnapshot): DashboardReportingFamily[] {
  const families: DashboardReportingFamily[] = [];
  for (const owner of reportingOwnership) {
    let source: ReportingSource;
    try {
      source = registeredReportingSource(owner.source);
    } catch {
      continue;
    }
    if (source.visibility !== 'public') continue;
    if (families.some((family) => family.id === owner.domain)) continue;
    const initial = source.provider === 'cloudflare'
      ? cloudflareUsageQueryResult(env, usage) as ReportingQueryResult<ReportingRecord>
      : undefined;
    families.push({
      id: owner.domain,
      label: reportingPresentationLabel(owner.domain),
      kind: 'provider',
      endpoint: providerEndpoint(source, false),
      exportEndpoint: source.capabilities.includes('export') ? providerEndpoint(source, true) : null,
      htmlPath: null,
      sourcePaths: [],
      filters: [],
      ...(initial ? { initial } : {}),
    });
  }
  return families;
}

export function dashboardReportingFamilies(env: Env, usage: CloudflareUsageSnapshot): DashboardReportingFamily[] {
  const structured = structuredKinds().map(structuredFamily);
  const providers = providerFamilies(env, usage)
    .filter((family) => !structured.some((candidate) => candidate.id === family.id));
  return [...structured, ...providers];
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

function availabilityLabel(availability: ReportingPresentationAvailability): string {
  if (availability === 'empty') return 'No records';
  if (availability === 'unconfigured') return 'Not configured';
  if (availability === 'rate-limited') return 'Rate limited';
  return reportingPresentationLabel(availability);
}

function badgeTone(availability: ReportingPresentationAvailability): string {
  if (availability === 'available') return 'badge badge-ok';
  if (availability === 'partial' || availability === 'empty' || availability === 'unconfigured' || availability === 'rate-limited' || availability === 'stale') return 'badge badge-warn';
  return 'badge badge-down';
}

function familyCard(env: Env, family: DashboardReportingFamily): string {
  const presentation = family.initial ? presentReportingQuery(family.initial) : null;
  const status = presentation
    ? `<span class="${badgeTone(presentation.availability)}">${escapeHtml(availabilityLabel(presentation.availability))}</span>`
    : '<span class="badge">Check source</span>';
  const count = presentation
    ? family.kind === 'structured'
      ? `${presentation.count} canonical record${presentation.count === 1 ? '' : 's'}`
      : `${presentation.count} selected record${presentation.count === 1 ? '' : 's'}`
    : 'Count is resolved from the authorized source on selection.';
  const links = [`<a href="/dashboard?report=${encodeURIComponent(family.id)}#reporting-browser">Inspect <span aria-hidden="true">→</span></a>`];
  if (family.htmlPath) links.push(`<a href="${escapeHtml(family.htmlPath)}">Domain view</a>`);
  if (family.kind === 'structured' && family.endpoint) links.push(`<a href="${escapeHtml(family.endpoint)}">JSON</a>`);
  for (const path of family.sourcePaths.slice(0, 1)) links.push(`<a href="${escapeHtml(sourceUrl(env, path))}">Source ↗</a>`);
  return `<article class="usage-product"><div><p class="eyebrow">${family.kind === 'structured' ? 'Registered records' : 'Registered source'}</p><h3>${escapeHtml(family.label)}</h3>${status}</div><p>${escapeHtml(count)}</p><div class="link-row">${links.join('')}</div></article>`;
}

function clientConfig(families: DashboardReportingFamily[]): string {
  return JSON.stringify(families.map((family) => ({
    id: family.id,
    label: family.label,
    endpoint: family.endpoint,
    exportEndpoint: family.exportEndpoint,
    filters: family.filters,
  }))).replace(/</g, '\\u003c');
}

function reportingBrowserScript(): string {
  return `<script>(()=>{
const root=document.querySelector('[data-reporting-browser]');if(!root)return;
const configNode=document.getElementById('reporting-family-config');if(!configNode)return;
let families=[];try{families=JSON.parse(configNode.textContent||'[]')}catch{return}
const params=new URLSearchParams(location.search);const requested=params.get('report');
const family=families.find((candidate)=>candidate.id===requested)||families[0];if(!family)return;
const form=root.querySelector('form');const familySelect=form.querySelector('[name="report"]');familySelect.value=family.id;
const filterHost=form.querySelector('[data-reporting-filters]');
for(const filter of family.filters||[]){const label=document.createElement('label');label.textContent=filter.label+' ';const select=document.createElement('select');select.name=filter.name;const all=document.createElement('option');all.value='';all.textContent='All';select.append(all);for(const option of filter.values){const node=document.createElement('option');node.value=option.value;node.textContent=option.label;select.append(node)}select.value=params.get(filter.name)||'';label.append(select);filterHost.append(label)}
const limit=form.querySelector('[name="limit"]');limit.value=params.get('limit')||'10';
const output=root.querySelector('[data-reporting-output]');const exportLink=root.querySelector('[data-reporting-export]');
const setText=(parent,tag,text)=>{const node=document.createElement(tag);node.textContent=text;parent.append(node);return node};
const safeLink=(parent,label,url)=>{try{const parsed=new URL(url,location.origin);if(parsed.origin!==location.origin&&parsed.protocol!=='https:')return;const link=document.createElement('a');link.href=parsed.toString();link.textContent=label;parent.append(link)}catch{}};
const endpoint=family.endpoint;if(!endpoint){output.textContent='This registered collection has no independent public HTTP projection. Use its domain/source links above; it remains a distinct registered collection.';exportLink.hidden=true;return}
const target=new URL(endpoint,location.origin);for(const filter of family.filters||[]){const value=params.get(filter.name);if(value)target.searchParams.set(filter.name,value)}if(!target.searchParams.has('limit'))target.searchParams.set('limit',limit.value);const cursor=params.get('cursor');if(cursor)target.searchParams.set('cursor',cursor);
if(family.exportEndpoint){const exportUrl=new URL(family.exportEndpoint,location.origin);for(const filter of family.filters||[]){const value=params.get(filter.name);if(value)exportUrl.searchParams.set(filter.name,value)}exportLink.href=exportUrl.toString();exportLink.hidden=false}else exportLink.hidden=true;
output.textContent='Loading authorized reporting selection…';
fetch(target,{credentials:'same-origin',headers:{accept:'application/json'}}).then(async(response)=>{if(!response.ok){const messages={401:'Authentication is required for this source.',403:'This source is not authorized for the current visitor.',409:'The approved public projection is not current.',429:'The provider is rate limited.',503:'The reporting source is unavailable.'};throw new Error(messages[response.status]||'The reporting source could not be loaded.')}return response.json()}).then(result=>{
output.textContent='';const availability=Object.values(result.availability||{});const summary=document.createElement('div');summary.className='operations-section-heading';const left=document.createElement('div');setText(left,'p',family.label);setText(left,'h3',String(result.derived?.count??result.records?.length??0)+' selected records');summary.append(left);setText(summary,'span',availability.join(', ')||'available');output.append(summary);
const note=document.createElement('p');note.className='subtle';note.textContent='Source availability is shown separately from record status. Publication review does not imply operational success.';output.append(note);
const facets=result.derived?.facets||{};if(Object.keys(facets).length){const details=document.createElement('details');const sum=document.createElement('summary');sum.textContent='Facets';details.append(sum);const list=document.createElement('ul');for(const [name,values] of Object.entries(facets)){const item=document.createElement('li');item.textContent=name+': '+Object.entries(values).map(([value,count])=>value+' '+count).join(' · ');list.append(item)}details.append(list);output.append(details)}
const records=Array.isArray(result.records)?result.records:[];if(!records.length){const empty=document.createElement('div');empty.className='availability-empty';empty.textContent=availability.includes('unavailable')?'Source unavailable.':availability.includes('partial')?'No records were returned from the partial source selection.':'No records in this authorized selection.';output.append(empty)}
const list=document.createElement('div');list.className='activity-list';for(const record of records){const article=document.createElement('article');article.className='activity-item';const body=document.createElement('div');const title=record.title||record.name||record.reference||record.metric||record.id;setText(body,'h3',String(title));const meta=[];for(const key of ['recordType','status','availability','framework','metric','unit','observedAt','validUntil','updatedAt'])if(record[key]!==undefined&&record[key]!==null)meta.push(key+' '+String(record[key]));if(meta.length)setText(body,'p',meta.join(' · '));let relationshipCount=0;if(Array.isArray(record.relationships))relationshipCount=record.relationships.length;else if(record.relationships&&typeof record.relationships==='object')for(const value of Object.values(record.relationships))if(Array.isArray(value))relationshipCount+=value.length;if(relationshipCount)setText(body,'small',relationshipCount+' authorized relationship'+(relationshipCount===1?'':'s'));if(typeof record.url==='string')safeLink(body,'Open source ↗',record.url);article.append(body);list.append(article)}output.append(list);
const page=result.query?.pagination;if(page){const nav=document.createElement('nav');nav.className='link-row';nav.setAttribute('aria-label','Reporting pagination');setText(nav,'span','Showing '+page.returned+' of '+page.total);if(page.nextCursor&&typeof page.nextCursor==='string'){const next=new URL(location.href);next.searchParams.set('report',family.id);next.searchParams.set('cursor',page.nextCursor);safeLink(nav,'Next page →',next.toString())}else if(page.completeness==='partial')setText(nav,'span','Partial result: '+String(page.partialReason||'provider unavailable'));output.append(nav)}
}).catch(error=>{output.textContent=error instanceof Error?error.message:'The reporting source could not be loaded.'});
})();</script>`;
}

export function renderUnifiedReportingPresentation(env: Env, usage: CloudflareUsageSnapshot): string {
  const families = dashboardReportingFamilies(env, usage);
  const defaultFamily = families[0];
  return `<section class="operations-section" id="reporting" aria-labelledby="reporting-heading">
  <div class="operations-section-heading"><div><p class="eyebrow">Reporting / shared records</p><h2 id="reporting-heading">Unified reporting</h2></div><a href="${escapeHtml(assuranceRegistryApiRoute())}">Assurance JSON <span aria-hidden="true">→</span></a></div>
  <p>Compliance &amp; Assurance, evidence, reports, issues, risks, incidents, exercises, security, governance, and operational observations are presented from registered sources and common query results. Source availability stays distinct from the status of records inside it.</p>
  <div class="usage-products" aria-label="Registered reporting collections">${families.map((family) => familyCard(env, family)).join('')}</div>
  </section>
  <section class="operations-section" id="reporting-browser" data-reporting-browser aria-labelledby="reporting-browser-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Authorized selection</p><h2 id="reporting-browser-heading">Reporting browser</h2></div><a data-reporting-export hidden>Export authorized selection</a></div>
    <form method="get" action="/dashboard" class="filter-form">
      <label>Collection <select name="report">${families.map((family) => `<option value="${escapeHtml(family.id)}"${family.id === defaultFamily?.id ? ' selected' : ''}>${escapeHtml(family.label)}</option>`).join('')}</select></label>
      <span data-reporting-filters></span>
      <label>Page size <select name="limit"><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label>
      <button type="submit">Apply</button>
    </form>
    <div data-reporting-output aria-live="polite"><p class="subtle">Select a registered collection to load its authorized API projection.</p></div>
  </section>
  <script type="application/json" id="reporting-family-config">${clientConfig(families)}</script>
  ${reportingBrowserScript()}`;
}
