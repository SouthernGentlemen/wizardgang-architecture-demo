import type { Principal } from '../lib/authorization';
import { repoUrl, sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import {
  assuranceAnchor,
  assuranceFilterValues,
  assuranceFiltersFromUrl,
  assuranceRecordUrlsById,
  complianceFrameworks,
  complianceQualification,
  deriveComplianceCounts,
  deriveIncidentCounts,
  deriveRiskCounts,
} from '../assurance/service';
import {
  filterPublishedAssuranceRecords,
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
  type PresentedPublishedEvidence,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import { presentReportingQuery, type ReportingQueryPresentation } from '../reporting/presentation';
import { queryReportingCollection, reportingCollectionInventory } from '../reporting/service';
import { routeUrl } from '../routing/application-routes';
import type { DemoAction, Env } from '../types';
import { pageContent, type PageContent } from '../ui/page';
import {
  renderAssuranceWorkbenchSection,
  renderComplianceRecordInspector,
  renderGovernanceActions,
  renderGovernanceRecordInspector,
} from './assurance-workbench-renderers';
import { renderAssuranceDeliveryWorkbench } from './assurance-delivery';

type ComplianceRecord = PublishedAssuranceRecordMap['compliance'];
type ClaimRecord = PublishedAssuranceRecordMap['claims'];
type RiskRecord = PublishedAssuranceRecordMap['risks'];
type IncidentRecord = PublishedAssuranceRecordMap['incidents'];
type ExerciseRecord = PublishedAssuranceRecordMap['exercises'];

const indexDescription = 'Summary-first public assurance workbench for posture, framework demonstrations, risks, evidence, governance, and operational assurance activity.';

const governanceActions: DemoAction[] = [
  {
    id: 'iso-27001',
    title: 'ISO/IEC 27001 alignment',
    description: 'Inspect the published ISO/IEC 27001-related assurance claims and their deployment-aware canonical evidence.',
    label: 'Inspect the security-control map',
    method: 'GET',
    path: '/api/labs/governance-security-controls',
  },
  {
    id: 'iso-42001',
    title: 'ISO/IEC 42001 alignment',
    description: 'Execute and audit the approved, unknown-method, and invalid-scope cases at the controlled MCP boundary.',
    label: 'Run the AI boundary evaluation',
    method: 'POST',
    path: '/api/labs/governance-ai-evaluation',
  },
  {
    id: 'traceability',
    title: 'Traceability & evidence',
    description: 'Inspect the requirement-to-operation chain across source, validation, release metadata, deployment identity, and recent application audit events.',
    label: 'Inspect the live evidence chain',
    method: 'GET',
    path: '/api/labs/governance-traceability',
  },
];

function publicPrincipal(): Principal {
  return { subject: 'public-visitor', authentication: 'anonymous', role: 'viewer', permissions: ['demo:read'] };
}

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function includesQuery(query: string, values: Array<string | number | null | undefined>): boolean {
  if (!query) return true;
  const haystack = values.filter((value) => value !== undefined).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function scopedFilterValue(url: URL, parameter: string, allowed: readonly string[]): string | undefined {
  const value = url.searchParams.get(parameter) ?? undefined;
  return value && allowed.includes(value) ? value : undefined;
}

function filterOptions(values: readonly string[], current?: string): string {
  return values.map((value) => `<option value="${escapeHtml(value)}"${current === value ? ' selected' : ''}>${escapeHtml(titleCase(value))}</option>`).join('');
}

function assuranceFragmentScript(): string {
  return `<script>
  (()=>{
    const revealTarget=()=>{
      if(!location.hash)return;
      let id;
      try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
      const target=document.getElementById(id);
      if(!target)return;
      let current=target;
      while(current){if(current.tagName==='DETAILS')current.open=true;current=current.parentElement}
    };
    revealTarget();
    window.addEventListener('hashchange',revealTarget);
  })();
  </script>`;
}

function complianceEvidenceCount(record: ComplianceRecord): number {
  return record.relationships.filter((relationship) => relationship.relation === 'evidence').length;
}

function needsAttention(record: ComplianceRecord): boolean {
  return record.status === 'gap' || record.status === 'not-observed' || record.status === 'partial';
}

function attentionPriority(record: ComplianceRecord): number {
  if (record.status === 'gap' || record.status === 'not-observed') return 0;
  if (record.status === 'partial') return 1;
  return 2;
}

function statusClass(status: string): string {
  if (status === 'met' || status === 'demonstrated' || status === 'closed' || status === 'completed') return 'badge badge-ok';
  if (status === 'partial' || status === 'planned' || status === 'treating' || status === 'follow-up-open') return 'badge badge-warn';
  if (status === 'gap' || status === 'not-observed' || status === 'high' || status === 'critical') return 'badge badge-down';
  return 'badge';
}

function frameworkSummary(records: ComplianceRecord[]): string {
  const counts = deriveComplianceCounts(records);
  if (records[0]?.framework === 'wcag-2.2') {
    return `${counts.byStatus.demonstrated} demonstrated · ${counts.byStatus['not-observed']} not observed`;
  }
  return `${counts.byStatus.met} met · ${counts.byStatus.partial} partial · ${counts.byStatus.gap} gap · ${counts.byStatus['not-applicable']} N/A`;
}

function frameworkPostureCards(records: ComplianceRecord[], selectedFramework?: string): string {
  return `<div class="grid">${complianceFrameworks.map((framework) => {
    const frameworkRecords = records.filter((record) => record.framework === framework.id);
    const params = new URLSearchParams({ framework: framework.id });
    return `<a class="card" href="${escapeHtml(`${routeUrl('assurance.index')}?${params.toString()}#frameworks`)}"${selectedFramework === framework.id ? ' aria-current="page"' : ''}>
      <p class="eyebrow">${escapeHtml(framework.label)}</p>
      <h3>${frameworkRecords.length} published records</h3>
      <p>${escapeHtml(frameworkSummary(frameworkRecords))}</p>
      <span>${framework.assessmentDate ? `Assessed ${escapeHtml(framework.assessmentDate)} · ` : ''}Inspect framework <span aria-hidden="true">→</span></span>
    </a>`;
  }).join('')}</div>`;
}

function materialGapCards(compliance: ComplianceRecord[], risks: RiskRecord[]): string {
  const complianceAttention = compliance
    .filter(needsAttention)
    .sort((left, right) => attentionPriority(left) - attentionPriority(right) || left.reference.localeCompare(right.reference, undefined, { numeric: true }))
    .slice(0, 6)
    .map((record) => {
      const params = new URLSearchParams({ framework: record.framework, q: record.reference });
      return `<a class="card" href="${escapeHtml(`${routeUrl('assurance.index')}?${params.toString()}#frameworks`)}">
        <p class="eyebrow">${escapeHtml(record.frameworkLabel)}</p>
        <h3>${escapeHtml(record.reference)} · ${escapeHtml(record.title)}</h3>
        <span class="${statusClass(record.status)}">${escapeHtml(titleCase(record.status))}</span>
        <span>${complianceEvidenceCount(record)} evidence relationship${complianceEvidenceCount(record) === 1 ? '' : 's'} · Inspect <span aria-hidden="true">→</span></span>
      </a>`;
    });
  const highRisks = risks
    .filter((record) => record.residual.rating === 'high' || record.residual.rating === 'critical')
    .slice(0, 2)
    .map((record) => {
      const params = new URLSearchParams({ q: record.id });
      return `<a class="card" href="${escapeHtml(`${routeUrl('assurance.index')}?${params.toString()}#risks`)}">
      <p class="eyebrow">Material residual risk</p>
      <h3>${escapeHtml(record.id)} · ${escapeHtml(record.title)}</h3>
      <span class="${statusClass(record.residual.rating)}">${escapeHtml(titleCase(record.residual.rating))} residual</span>
      <span>Score ${record.residual.score} · Inspect risk <span aria-hidden="true">→</span></span>
    </a>`;
    });
  const cards = [...complianceAttention, ...highRisks];
  return cards.length
    ? `<div class="grid">${cards.join('')}</div>`
    : '<div class="availability-empty">No published gap, not-observed, partial, high, or critical items are currently present.</div>';
}

function complianceMatches(record: ComplianceRecord, query: string): boolean {
  return includesQuery(query, [
    record.id,
    record.framework,
    record.frameworkLabel,
    record.reference,
    record.title,
    record.kind,
    record.section,
    record.status,
    record.implementation,
    record.rationale,
    ...(record.gaps ?? []),
  ]);
}

function renderFrameworkRegistry(env: Env, records: ComplianceRecord[], query: string, selectedFramework?: string): string {
  const visible = records.filter((record) => complianceMatches(record, query));
  const label = selectedFramework
    ? complianceFrameworks.find((framework) => framework.id === selectedFramework)?.label ?? selectedFramework
    : 'all frameworks';
  return `<details class="implementation-notes" data-assurance-collection="frameworks">
    <summary><span>Browse framework records</span><span>${visible.length} matching · ${escapeHtml(label)}</span></summary>
    <p class="subtle">The complete published record collection stays collapsed until requested. Filters and search narrow this canonical projection; they do not select a different page.</p>
    ${visible.map((record) => renderComplianceRecordInspector(env, record)).join('') || '<div class="availability-empty">No framework records match the current filters.</div>'}
  </details>`;
}

function claimMatches(record: ClaimRecord, query: string): boolean {
  return includesQuery(query, [record.id, record.area, record.title, record.statement, record.posture]);
}

function renderClaimInspector(record: ClaimRecord): string {
  const relationships = record.relationships.map((relationship) => {
    const id = relationship.to.native;
    const href = assuranceRecordUrlsById(id).html;
    const target = href ? `<a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a>` : `<code>${escapeHtml(id)}</code>`;
    return `<li>${escapeHtml(titleCase(relationship.relation))}: ${target}</li>`;
  }).join('');
  return `<details class="implementation-notes" id="${escapeHtml(assuranceAnchor(record.id))}">
    <summary><span><code>${escapeHtml(record.id)}</code> · ${escapeHtml(record.title)}</span><span class="${statusClass(record.posture)}">${escapeHtml(titleCase(record.posture))}</span></summary>
    <p class="eyebrow">${escapeHtml(titleCase(record.area))}</p>
    <p>${escapeHtml(record.statement)}</p>
    ${relationships ? `<p><strong>Relationships:</strong></p><ul>${relationships}</ul>` : '<p class="subtle">No public relationships are registered.</p>'}
  </details>`;
}

function renderClaimRegistry(records: ClaimRecord[], query: string): string {
  const visible = records.filter((record) => claimMatches(record, query));
  return `<details class="implementation-notes" data-assurance-collection="claims">
    <summary><span>Browse public assurance claims</span><span>${visible.length} matching · ${records.length} published</span></summary>
    ${visible.map(renderClaimInspector).join('') || '<div class="availability-empty">No assurance claims match the current search.</div>'}
  </details>`;
}

function riskMatches(record: RiskRecord, query: string): boolean {
  return includesQuery(query, [
    record.id,
    record.framework,
    record.title,
    record.status,
    record.inherent.rating,
    record.residual.rating,
    ...record.treatment,
  ]);
}

function relationshipLinks(record: RiskRecord): string {
  const ids = record.relationships.filter((relationship) => relationship.relation === 'evidence').map((relationship) => relationship.to.native);
  if (!ids.length) return 'No public evidence relationship is registered.';
  return ids.map((id) => {
    const href = assuranceRecordUrlsById(id).html;
    return href ? `<a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a>` : `<code>${escapeHtml(id)}</code>`;
  }).join(', ');
}

function renderRiskInspector(record: RiskRecord): string {
  return `<details class="implementation-notes" id="${escapeHtml(assuranceAnchor(record.id))}">
    <summary><span><code>${escapeHtml(record.id)}</code> · ${escapeHtml(record.title)}</span><span class="${statusClass(record.residual.rating)}">${escapeHtml(titleCase(record.residual.rating))} residual</span></summary>
    <p class="eyebrow">${escapeHtml(titleCase(record.framework))} risk</p>
    <p><strong>Inherent:</strong> ${record.inherent.score} ${escapeHtml(titleCase(record.inherent.rating))} · <strong>Residual:</strong> ${record.residual.score} ${escapeHtml(titleCase(record.residual.rating))}</p>
    <p><strong>Status:</strong> ${escapeHtml(titleCase(record.status))} · <strong>Treatment:</strong> ${escapeHtml(record.treatment.map(titleCase).join(' / '))}</p>
    <p><strong>Review due:</strong> <time datetime="${escapeHtml(record.reviewDue)}">${escapeHtml(record.reviewDue)}</time></p>
    <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
    <p><strong>Evidence:</strong> ${relationshipLinks(record)}</p>
  </details>`;
}

function renderRiskRegistry(records: RiskRecord[], query: string): string {
  const visible = records.filter((record) => riskMatches(record, query));
  return `<details class="implementation-notes" data-assurance-collection="risks">
    <summary><span>Browse risk records</span><span>${visible.length} matching</span></summary>
    ${visible.map(renderRiskInspector).join('') || '<div class="availability-empty">No risk records match the current search.</div>'}
  </details>`;
}

function evidenceMatches(record: PresentedPublishedEvidence, query: string): boolean {
  return includesQuery(query, [
    record.id,
    record.kind,
    record.title,
    record.description,
    record.freshness.policy,
    record.freshness.scope,
    record.publication.lifecycle,
    record.publication.disclosureReview,
    record.locator.repositoryPath,
    record.resolved.kind === 'route' ? record.resolved.route : record.resolved.repositoryPath,
    ...record.usedBy,
  ]);
}

function evidenceLocator(record: PresentedPublishedEvidence): string {
  if (record.resolved.kind === 'route') {
    return `<a href="${escapeHtml(record.resolved.route)}"><code>${escapeHtml(record.resolved.route)}</code></a>`;
  }
  if (record.resolved.url) {
    return `<a href="${escapeHtml(record.resolved.url)}"><code>${escapeHtml(record.resolved.repositoryPath)}</code></a>`;
  }
  return `<code>${escapeHtml(record.resolved.repositoryPath)}</code>`;
}

function evidenceUsedBy(record: PresentedPublishedEvidence): string {
  if (!record.usedBy.length) return 'No public assurance record currently references this evidence.';
  return record.usedBy.map((id) => {
    const href = assuranceRecordUrlsById(id).html;
    return href ? `<a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a>` : `<code>${escapeHtml(id)}</code>`;
  }).join(', ');
}

function renderEvidenceInspector(record: PresentedPublishedEvidence): string {
  return `<details class="implementation-notes" id="${escapeHtml(assuranceAnchor(record.id))}">
    <summary><span><code>${escapeHtml(record.id)}</code> · ${escapeHtml(record.title)}</span><span>${escapeHtml(titleCase(record.freshness.policy))}</span></summary>
    <p class="eyebrow">${escapeHtml(titleCase(record.kind))}</p>
    <p>${escapeHtml(record.description)}</p>
    <p><strong>Evidence:</strong> ${evidenceLocator(record)}</p>
    <p><strong>Freshness:</strong> ${escapeHtml(record.freshness.policy)} · ${escapeHtml(record.freshness.scope)}</p>
    <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
    <p><strong>Referenced by:</strong> ${evidenceUsedBy(record)}</p>
  </details>`;
}

function renderEvidenceRegistry(records: PresentedPublishedEvidence[], query: string): string {
  const visible = records.filter((record) => evidenceMatches(record, query));
  return `<details class="implementation-notes" data-assurance-collection="evidence">
    <summary><span>Browse evidence records</span><span>${visible.length} matching</span></summary>
    ${visible.map(renderEvidenceInspector).join('') || '<div class="availability-empty">No evidence records match the current search.</div>'}
  </details>`;
}

function governanceMatches(record: ReportingQueryPresentation['records'][number], query: string): boolean {
  return includesQuery(query, [
    record.id,
    record.title,
    record.status,
    ...record.fields.flatMap((field) => [field.name, field.value]),
    ...record.relationships.flatMap((relationship) => [relationship.label, ...relationship.targets]),
  ]);
}

function renderGovernanceRegistry(presentation: ReportingQueryPresentation, query: string, sourceId?: string): string {
  const visible = presentation.records.filter((record) => governanceMatches(record, query) && (!sourceId || record.sourceId === sourceId));
  const sourceLabels = new Map(presentation.sources.map((source) => [source.id, source.label]));
  return `<details class="implementation-notes" data-assurance-collection="governance">
    <summary><span>Browse governance records</span><span>${visible.length} matching · ${presentation.totalAvailable} published</span></summary>
    ${visible.map((record) => renderGovernanceRecordInspector(record, record.sourceId ? (sourceLabels.get(record.sourceId) ?? 'Governance') : 'Governance')).join('') || '<div class="availability-empty">No governance records match the current filters.</div>'}
  </details>`;
}

function activityMatches(record: IncidentRecord | ExerciseRecord, query: string): boolean {
  if (record.recordType === 'incident') {
    return includesQuery(query, [record.id, record.title, record.status, record.summary, ...record.categories]);
  }
  return includesQuery(query, [record.id, record.exerciseType, record.status, record.scenario, record.scope, record.owner, record.publicNote, record.resultSummary]);
}

function renderActivityInspector(record: IncidentRecord | ExerciseRecord): string {
  const anchor = assuranceAnchor(record.id);
  if (record.recordType === 'incident') {
    return `<details class="implementation-notes" id="${escapeHtml(anchor)}">
      <summary><span><code>${escapeHtml(record.id)}</code> · ${escapeHtml(record.title)}</span><span class="${statusClass(record.status)}">${escapeHtml(titleCase(record.status))}</span></summary>
      <p class="eyebrow">Actual incident</p>
      <p>${escapeHtml(record.summary)}</p>
      <p><strong>Categories:</strong> ${escapeHtml(record.categories.join(', ') || 'None recorded')}</p>
      <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
    </details>`;
  }
  return `<details class="implementation-notes" id="${escapeHtml(anchor)}">
    <summary><span><code>${escapeHtml(record.id)}</code> · ${escapeHtml(record.exerciseType)}</span><span class="${statusClass(record.status)}">${escapeHtml(titleCase(record.status))}</span></summary>
    <p class="eyebrow">Simulated exercise</p>
    <p><strong>Scenario:</strong> ${escapeHtml(record.scenario)}</p>
    <p><strong>Scope:</strong> ${escapeHtml(record.scope)}</p>
    <p><strong>Owner:</strong> ${escapeHtml(record.owner)}</p>
    <p>${escapeHtml(record.publicNote)}</p>
    <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
  </details>`;
}

function renderActivityRegistry(incidents: IncidentRecord[], exercises: ExerciseRecord[], query: string): string {
  const visible = [...incidents, ...exercises].filter((record) => activityMatches(record, query));
  return `<details class="implementation-notes" data-assurance-collection="activity">
    <summary><span>Browse incident and exercise records</span><span>${visible.length} matching</span></summary>
    ${visible.map(renderActivityInspector).join('') || '<div class="availability-empty">No activity records match the current search.</div>'}
  </details>`;
}

async function governancePresentation(env: Env): Promise<ReportingQueryPresentation> {
  const principal = publicPrincipal();
  const collection = reportingCollectionInventory(principal).find((candidate) => candidate.id === 'governance');
  if (!collection) throw new Error('Registered governance reporting collection is unavailable.');

  let cursor: string | null = null;
  let firstPage: ReportingQueryPresentation | undefined;
  const records: ReportingQueryPresentation['records'] = [];
  const seenCursors = new Set<string>();
  do {
    const result = await queryReportingCollection(env, principal, collection, { limit: 100, cursor });
    const page = presentReportingQuery(result, { label: collection.label });
    if (!firstPage) firstPage = page;
    records.push(...page.records);
    cursor = result.query.pagination?.nextCursor ?? null;
    if (cursor && seenCursors.has(cursor)) throw new Error('Governance reporting pagination repeated a cursor.');
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  if (!firstPage) throw new Error('Governance reporting returned no presentation.');
  return {
    dataset: firstPage.dataset,
    label: firstPage.label,
    availability: firstPage.availability,
    count: records.length,
    totalAvailable: firstPage.totalAvailable,
    records,
    sources: firstPage.sources,
    facets: firstPage.facets,
    pagination: undefined,
  };
}

export async function assuranceIndexContent(request: Request, env: Env): Promise<PageContent> {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
  const complianceFilters = assuranceFiltersFromUrl('compliance', url);
  const selectedFramework = complianceFilters.framework;
  const selectedComplianceStatus = complianceFilters.status;
  const selectedComplianceLevel = complianceFilters.level;
  const assuranceRoute = routeUrl('assurance.index');
  const securityRoute = routeUrl('security.index');
  const concernUrl = `${repoUrl(env)}/issues/new?template=concern.yml`;
  const bugUrl = `${repoUrl(env)}/issues/new?template=bug.yml`;
  const featureUrl = `${repoUrl(env)}/issues/new?template=feature.yml`;

  const allCompliance = listPublishedAssuranceRecords('compliance');
  const claims = listPublishedAssuranceRecords('claims');
  const filteredCompliance = filterPublishedAssuranceRecords('compliance', complianceFilters);
  const allRisks = listPublishedAssuranceRecords('risks');
  const riskFramework = scopedFilterValue(url, 'riskFramework', assuranceFilterValues('risks', 'framework'));
  const riskStatus = scopedFilterValue(url, 'riskStatus', assuranceFilterValues('risks', 'status'));
  const riskResidual = scopedFilterValue(url, 'riskResidual', assuranceFilterValues('risks', 'residual'));
  const riskFilters: Record<string, string> = {};
  if (riskFramework) riskFilters.framework = riskFramework;
  if (riskStatus) riskFilters.status = riskStatus;
  if (riskResidual) riskFilters.residual = riskResidual;
  const risks = filterPublishedAssuranceRecords('risks', riskFilters);
  const incidents = listPublishedAssuranceRecords('incidents');
  const exercises = listPublishedAssuranceRecords('exercises');
  const allEvidence = presentedPublishedEvidenceRecords(env, url.origin);
  const evidenceKinds = [...new Set(allEvidence.map((record) => record.kind))].sort();
  const evidenceKind = scopedFilterValue(url, 'evidenceKind', evidenceKinds);
  const evidence = evidenceKind ? allEvidence.filter((record) => record.kind === evidenceKind) : allEvidence;
  const governance = await governancePresentation(env);
  const governanceSource = scopedFilterValue(url, 'governanceSource', governance.sources.map((source) => source.id));
  const deliveryWorkbench = renderAssuranceDeliveryWorkbench(env);

  const complianceCounts = deriveComplianceCounts(allCompliance);
  const riskCounts = deriveRiskCounts(risks);
  const incidentCounts = deriveIncidentCounts(incidents, exercises);
  const materialCompliance = allCompliance.filter(needsAttention).length;
  const materialRisks = allRisks.filter((record) => record.residual.rating === 'high' || record.residual.rating === 'critical').length;
  const observationBoundEvidence = evidence.filter((record) => record.freshness.policy === 'observation-bound').length;
  const qualificationNotice = `WCAG 2.2 / ISO 27001 / ISO 42001 references are alignment targets, not certification claims. ${complianceQualification} Private vulnerability reporting remains at ${securityRoute}.`;

  const posture = renderAssuranceWorkbenchSection({
    id: 'posture',
    eyebrow: 'Start here',
    title: 'Posture',
    meta: `${complianceCounts.total} framework records`,
    summary: 'Read the derived posture and material gaps before opening any registry. Framework status vocabularies remain distinct rather than being collapsed into one score.',
    body: `${frameworkPostureCards(allCompliance, selectedFramework)}
      <div class="section-head"><h3 id="material-gaps-heading">Material gaps and risks</h3><span>${materialCompliance} framework items · ${materialRisks} material residual risks</span></div>
      ${materialGapCards(allCompliance, allRisks)}
      ${renderClaimRegistry(claims, query)}`,
  });

  const wcagRecords = allCompliance.filter((record) => record.framework === 'wcag-2.2');
  const frameworks = renderAssuranceWorkbenchSection({
    id: 'frameworks',
    eyebrow: 'Demonstrate before enumerating',
    title: 'Frameworks',
    meta: '4 primary demonstrations',
    summary: 'Exercise the security-control, AI-boundary, accessibility, and traceability demonstrations before drilling into framework records.',
    body: `${renderGovernanceActions(governanceActions)}
      <article class="action-card" id="wcag-2-2-posture">
        <p class="eyebrow">Accessibility posture</p>
        <h3>WCAG 2.2 posture</h3>
        <p>${escapeHtml(frameworkSummary(wcagRecords))}. Inspect the framework-specific engineering posture without treating it as certification.</p>
        <a class="button button-primary" href="${escapeHtml(`${assuranceRoute}?framework=wcag-2.2#frameworks`)}">Inspect WCAG 2.2 records</a>
      </article>
      ${renderFrameworkRegistry(env, filteredCompliance, query, selectedFramework)}`,
  });

  const risksSection = renderAssuranceWorkbenchSection({
    id: 'risks',
    eyebrow: 'Prioritize exposure',
    title: 'Risks',
    meta: `${riskCounts.total} published risks`,
    summary: 'Review derived residual posture and treatment state first; expand the register only when record-level detail is needed.',
    body: `<div class="grid">
      <article class="card"><p class="eyebrow">Security</p><h3>${riskCounts.byFramework.security} risks</h3><span>Canonical risk register</span></article>
      <article class="card"><p class="eyebrow">AI</p><h3>${riskCounts.byFramework.ai} risks</h3><span>Canonical risk register</span></article>
      <article class="card"><p class="eyebrow">Residual posture</p><h3>${riskCounts.byResidualRating.high ?? 0} high</h3><span>${riskCounts.byResidualRating.moderate ?? 0} moderate · ${riskCounts.byResidualRating.low ?? 0} low</span></article>
    </div>
    ${renderRiskRegistry(risks, query)}`,
  });

  const evidenceSection = renderAssuranceWorkbenchSection({
    id: 'evidence',
    eyebrow: 'Follow the proof',
    title: 'Evidence',
    meta: `${evidence.length} published evidence records`,
    summary: 'Trace claims to source, tests, governance records, workflows, routes, and observations. Freshness remains explicit and separate from lifecycle state.',
    body: `<div class="grid">
      <article class="card"><p class="eyebrow">Published evidence</p><h3>${evidence.length} records</h3><span>Derived from the canonical publication service</span></article>
      <article class="card"><p class="eyebrow">Observation-bound</p><h3>${observationBoundEvidence} records</h3><span>Require current observation state</span></article>
      <a class="card" href="#traceability"><p class="eyebrow">Traceability</p><h3>Evidence chain</h3><span>Return to the live traceability check <span aria-hidden="true">↑</span></span></a>
    </div>
    ${renderEvidenceRegistry(evidence, query)}`,
  });

  const governanceSection = renderAssuranceWorkbenchSection({
    id: 'governance',
    eyebrow: 'Inspect controlled decisions',
    title: 'Governance',
    meta: `${governance.totalAvailable} published records`,
    summary: 'Governance registers remain supporting evidence for the executable framework demonstrations, not the first thing a visitor has to decode.',
    body: renderGovernanceRegistry(governance, query, governanceSource),
  });

  const activitySection = renderAssuranceWorkbenchSection({
    id: 'activity',
    eyebrow: 'Separate events from exercises',
    title: 'Activity',
    meta: `${incidentCounts.actualIncidents} incidents · ${incidentCounts.exercises} exercises`,
    summary: 'Actual incidents and simulated response exercises remain distinct canonical record families with their own lifecycle semantics.',
    body: `<div class="grid">
      <article class="card"><p class="eyebrow">Actual incidents</p><h3>${incidentCounts.actualIncidents} retained records</h3><span>Zero retained records is not a claim that an incident has never occurred.</span></article>
      <article class="card"><p class="eyebrow">Exercises</p><h3>${incidentCounts.exercises} records</h3><span>${incidentCounts.plannedExercises} planned · ${incidentCounts.completedExercises} completed or follow-up</span></article>
    </div>
    ${renderActivityRegistry(incidents, exercises, query)}
    <div class="section-head"><h3 id="delivery-release-heading">Delivery and release evidence</h3><span>Live controlled workflow</span></div>
    ${deliveryWorkbench}`,
  });

  const concernsSection = renderAssuranceWorkbenchSection({
    id: 'concerns',
    eyebrow: 'Act on what you find',
    title: 'Concerns',
    meta: 'GitHub issue forms',
    summary: 'Non-sensitive concerns go directly into controlled GitHub issue forms. Sensitive security material stays on the private vulnerability-reporting path.',
    body: `<div class="grid">
      <a class="card" href="${escapeHtml(concernUrl)}"><p class="eyebrow">Assurance concern</p><h3>Report a non-sensitive concern</h3><span>Accessibility, AI/MCP, governance, evidence, documentation, privacy, or other public-safe concerns <span aria-hidden="true">→</span></span></a>
      <a class="card" href="${escapeHtml(bugUrl)}"><p class="eyebrow">Defect</p><h3>Report a bug</h3><span>Open the purpose-built GitHub bug form <span aria-hidden="true">→</span></span></a>
      <a class="card" href="${escapeHtml(featureUrl)}"><p class="eyebrow">Improvement</p><h3>Request a feature</h3><span>Open the purpose-built GitHub feature form <span aria-hidden="true">→</span></span></a>
    </div>
    <p class="assurance-notice"><strong>Public issue boundary:</strong> do not put credentials, exploit details, active incidents, or sensitive infrastructure information in GitHub issues. Use <a href="${escapeHtml(securityRoute)}">private vulnerability reporting</a> for sensitive security material.</p>`,
  });

  return pageContent(env, 'Assurance', `<section class="page-header assurance-header">
    <h1>Assurance workbench.</h1>
    <p class="lede">Start with posture and live demonstrations, then drill into risks, evidence, governance, and activity without turning the page into an automatic record dump.</p>
    <p class="assurance-notice"><strong>Qualification:</strong> ${escapeHtml(qualificationNotice)}</p>
    <nav class="link-row" aria-label="Assurance workbench sections">
      <a href="#posture">Posture</a><a href="#frameworks">Frameworks</a><a href="#risks">Risks</a><a href="#evidence">Evidence</a><a href="#governance">Governance</a><a href="#activity">Activity</a><a href="#concerns">Concerns</a>
    </nav>
    <form method="get" action="${escapeHtml(assuranceRoute)}" class="info-card" aria-labelledby="assurance-search-heading">
      <h2 id="assurance-search-heading">Filter and search the workbench</h2>
      <p>
        <label for="assurance-framework">Framework</label>
        <select id="assurance-framework" name="framework">
          <option value="">All frameworks</option>
          ${complianceFrameworks.map((framework) => `<option value="${escapeHtml(framework.id)}"${selectedFramework === framework.id ? ' selected' : ''}>${escapeHtml(framework.label)}</option>`).join('')}
        </select>
        <label for="assurance-compliance-status">Framework status</label>
        <select id="assurance-compliance-status" name="status">
          <option value="">All framework statuses</option>
          ${filterOptions(assuranceFilterValues('compliance', 'status'), selectedComplianceStatus)}
        </select>
        <label for="assurance-compliance-level">WCAG level</label>
        <select id="assurance-compliance-level" name="level">
          <option value="">All WCAG levels</option>
          ${filterOptions(assuranceFilterValues('compliance', 'level'), selectedComplianceLevel)}
        </select>
        <label for="assurance-risk-framework">Risk domain</label>
        <select id="assurance-risk-framework" name="riskFramework">
          <option value="">All risk domains</option>
          ${filterOptions(assuranceFilterValues('risks', 'framework'), riskFramework)}
        </select>
        <label for="assurance-risk-status">Risk status</label>
        <select id="assurance-risk-status" name="riskStatus">
          <option value="">All risk statuses</option>
          ${filterOptions(assuranceFilterValues('risks', 'status'), riskStatus)}
        </select>
        <label for="assurance-risk-residual">Residual risk</label>
        <select id="assurance-risk-residual" name="riskResidual">
          <option value="">All residual ratings</option>
          ${filterOptions(assuranceFilterValues('risks', 'residual'), riskResidual)}
        </select>
        <label for="assurance-evidence-kind">Evidence kind</label>
        <select id="assurance-evidence-kind" name="evidenceKind">
          <option value="">All evidence kinds</option>
          ${filterOptions(evidenceKinds, evidenceKind)}
        </select>
        <label for="assurance-governance-source">Governance register</label>
        <select id="assurance-governance-source" name="governanceSource">
          <option value="">All governance registers</option>
          ${governance.sources.map((source) => `<option value="${escapeHtml(source.id)}"${governanceSource === source.id ? ' selected' : ''}>${escapeHtml(source.label)}</option>`).join('')}
        </select>
        <label for="assurance-search">Search records</label>
        <input id="assurance-search" name="q" type="search" value="${escapeHtml(query)}" maxlength="120" placeholder="ID, title, control, evidence, risk…">
        <button type="submit">Apply</button>
        <a href="${escapeHtml(assuranceRoute)}">Clear</a>
      </p>
      <p class="subtle">Fragments identify the seven workbench sections. Query parameters only filter or search records on this page; they never choose a different human-facing assurance destination.</p>
    </form>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/assurance.ts'))}">Assurance route source</a></div>
  </section>
  ${posture}
  ${frameworks}
  ${risksSection}
  ${evidenceSection}
  ${governanceSection}
  ${activitySection}
  ${concernsSection}
  <section class="assurance-notice" aria-labelledby="security-boundary-heading">
    <h2 id="security-boundary-heading">Security stays separate</h2>
    <p>Suspected vulnerabilities, active security incidents, credentials, exploit detail, and other sensitive material belong in private vulnerability reporting. Published advisories remain on the canonical <a href="${escapeHtml(securityRoute)}">security page</a>.</p>
  </section>
  ${assuranceFragmentScript()}`, {
    description: indexDescription,
    canonicalPath: assuranceRoute,
  });
}
