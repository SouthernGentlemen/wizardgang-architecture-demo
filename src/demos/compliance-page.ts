import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import {
  assuranceAnchor,
  assuranceFiltersFromUrl,
  assuranceRecordUrls,
  complianceFrameworks,
  complianceQualification,
  deriveComplianceCounts,
  serializeAssuranceFilters,
  type AssuranceFilterValues,
} from '../assurance/service';
import {
  assuranceCollectionApiRoute,
  assuranceHtmlRoute,
} from '../assurance/routes';
import {
  filterPublishedAssuranceRecords,
  listPublishedAssuranceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

const COMPLIANCE_ROUTE = assuranceHtmlRoute('compliance');
const EVIDENCE_ROUTE = assuranceHtmlRoute('evidence');
type ComplianceRecord = PublishedAssuranceRecordMap['compliance'];

function filterQuery(filters: AssuranceFilterValues): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(serializeAssuranceFilters('compliance', filters)));
}

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function statusClass(value: string): string {
  switch (value) {
    case 'met':
    case 'demonstrated':
      return 'badge badge-ok';
    case 'partial':
      return 'badge badge-warn';
    case 'gap':
    case 'not-observed':
      return 'badge badge-down';
    default:
      return 'badge';
  }
}

function statusLabel(value: string): string {
  if (value === 'not-applicable') return 'Not applicable';
  if (value === 'not-observed') return 'Not observed';
  return titleCase(value);
}

function evidenceIds(record: ComplianceRecord): string[] {
  return assuranceRelationshipIds(record.relationships, 'evidence');
}

function recordEvidence(record: ComplianceRecord): string {
  const links = evidenceIds(record).map((id) => {
    const href = assuranceRecordUrls('evidence', id).html;
    if (!href) throw new Error(`Evidence record ${id} has no canonical HTML route.`);
    return `<li><a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a></li>`;
  }).join('');
  return links ? `<ul>${links}</ul>` : '<p class="subtle">No public evidence relationship is registered.</p>';
}

function recordNarrative(record: ComplianceRecord): string {
  if (record.implementation) return escapeHtml(record.implementation);
  if (record.rationale) return escapeHtml(record.rationale);
  return `The public assurance dataset records this item as ${escapeHtml(statusLabel(record.status))}. Inspect the linked evidence and source record for the implementation proof behind that posture.`;
}

function recordGaps(record: ComplianceRecord): string {
  if (!record.gaps?.length) return '';
  return `<div><strong>Open gaps</strong><ul>${record.gaps.map((gap) => `<li>${escapeHtml(gap)}</li>`).join('')}</ul></div>`;
}

function recordValidation(record: ComplianceRecord): string {
  if (!record.validation) return '';
  return `<p><strong>Validation:</strong> automated ${escapeHtml(record.validation.automated)} · manual ${escapeHtml(record.validation.manual)}</p>`;
}

function renderRecord(env: Env, record: ComplianceRecord): string {
  const anchor = assuranceAnchor(record.id);
  const urls = assuranceRecordUrls('compliance', record.id);
  if (!urls.api) throw new Error(`Compliance record ${record.id} has no canonical exact-record API route.`);
  return `<details class="implementation-notes" id="${escapeHtml(anchor)}">
    <summary>
      <span><code>${escapeHtml(record.reference)}</code> · ${escapeHtml(record.title)}</span>
      <span class="${statusClass(record.status)}">${escapeHtml(statusLabel(record.status))}</span>
    </summary>
    <p class="eyebrow">${escapeHtml(record.kind)} · ${escapeHtml(record.section)}</p>
    <p><strong>Current implementation:</strong> ${recordNarrative(record)}</p>
    ${recordGaps(record)}
    ${recordValidation(record)}
    <div class="info-card">
      <h4>Evidence</h4>
      ${recordEvidence(record)}
    </div>
    <details class="implementation-notes">
      <summary>Traceability and source</summary>
      <p><strong>Canonical ID:</strong> <code>${escapeHtml(record.id)}</code></p>
      <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · disclosure review ${escapeHtml(record.publication.disclosureReview)}</p>
      <p><a href="${escapeHtml(urls.api)}">Exact JSON record</a> · <a href="${escapeHtml(sourceUrl(env, record.sourcePath))}">Dataset source</a></p>
    </details>
  </details>`;
}

function frameworkDescription(id: string): string {
  switch (id) {
    case 'iso-27001': return 'Security-management clauses and Annex A controls.';
    case 'iso-42001': return 'AI-management clauses and control objectives.';
    case 'wcag-2.2': return 'Accessibility success criteria organized by principle and conformance level.';
    default: return 'Canonical public assurance records.';
  }
}

function frameworkStatusSummary(records: ComplianceRecord[]): string {
  const counts = deriveComplianceCounts(records);
  const framework = records[0]?.framework;
  if (framework === 'wcag-2.2') {
    return `${counts.byStatus.demonstrated} demonstrated · ${counts.byStatus['not-observed']} not observed`;
  }
  return `${counts.byStatus.met} met · ${counts.byStatus.partial} partial · ${counts.byStatus.gap} gap · ${counts.byStatus['not-applicable']} N/A`;
}

function frameworkCards(allRecords: ComplianceRecord[], selectedFramework?: string): string {
  return complianceFrameworks.map((framework) => {
    const records = allRecords.filter((record) => record.framework === framework.id);
    const href = assuranceHtmlRoute('compliance', { framework: framework.id });
    return `<a class="assurance-posture-card" href="${escapeHtml(href)}"${selectedFramework === framework.id ? ' aria-current="page"' : ''}>
      <p class="eyebrow">${selectedFramework === framework.id ? 'Current framework' : 'Framework review'}</p>
      <h2>${escapeHtml(framework.label)}</h2>
      <p>${escapeHtml(frameworkDescription(framework.id))}</p>
      <strong>${records.length} records</strong>
      <span>${escapeHtml(frameworkStatusSummary(records))}</span>
      <span>${framework.assessmentDate ? `Assessed ${escapeHtml(framework.assessmentDate)} · ` : ''}Inspect framework <span aria-hidden="true">→</span></span>
    </a>`;
  }).join('');
}

function needsAttention(record: ComplianceRecord): boolean {
  return record.status === 'gap' || record.status === 'not-observed' || record.status === 'partial';
}

function attentionPriority(record: ComplianceRecord): number {
  if (record.status === 'gap' || record.status === 'not-observed') return 0;
  if (record.status === 'partial') return 1;
  return 2;
}

function attentionHref(record: ComplianceRecord): string {
  const params = new URLSearchParams({ framework: record.framework, section: record.section });
  return `${COMPLIANCE_ROUTE}?${params.toString()}#${encodeURIComponent(assuranceAnchor(record.id))}`;
}

function attentionCards(records: ComplianceRecord[], selectedFramework?: string): string {
  const source = selectedFramework
    ? records.filter((record) => record.framework === selectedFramework)
    : complianceFrameworks.flatMap((framework) => records
      .filter((record) => record.framework === framework.id && needsAttention(record))
      .sort((left, right) => attentionPriority(left) - attentionPriority(right))
      .slice(0, 2));
  const attention = (selectedFramework ? source.filter(needsAttention) : source)
    .sort((left, right) => attentionPriority(left) - attentionPriority(right) || left.reference.localeCompare(right.reference, undefined, { numeric: true }))
    .slice(0, 6);
  if (!attention.length) return '<div class="availability-empty">No gap, not-observed, or partial records are currently published for this selection.</div>';
  return `<div class="assurance-posture-grid">${attention.map((record) => `<a class="assurance-posture-card" href="${escapeHtml(attentionHref(record))}">
    <p class="eyebrow">${escapeHtml(record.frameworkLabel)}</p>
    <h3>${escapeHtml(record.reference)} · ${escapeHtml(record.title)}</h3>
    <span class="${statusClass(record.status)}">${escapeHtml(statusLabel(record.status))}</span>
    <span>${evidenceIds(record).length} evidence link${evidenceIds(record).length === 1 ? '' : 's'} · Inspect record <span aria-hidden="true">→</span></span>
  </a>`).join('')}</div>`;
}

function pageHref(
  framework: string,
  filters: AssuranceFilterValues,
  local: { section?: string; kind?: string; q?: string } = {},
): string {
  const params = new URLSearchParams();
  params.set('framework', framework);
  if (filters.status) params.set('status', filters.status);
  if (filters.level) params.set('level', filters.level);
  if (local.section) params.set('section', local.section);
  if (local.kind) params.set('kind', local.kind);
  if (local.q) params.set('q', local.q);
  return `${COMPLIANCE_ROUTE}?${params.toString()}`;
}

function matchesSearch(record: ComplianceRecord, query: string): boolean {
  if (!query) return true;
  const haystack = [
    record.id,
    record.reference,
    record.title,
    record.section,
    record.kind,
    record.implementation,
    record.rationale,
    ...(record.gaps ?? []),
    ...evidenceIds(record),
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function refinementForm(
  selectedFramework: string,
  frameworkRecords: ComplianceRecord[],
  filters: AssuranceFilterValues,
  local: { section?: string; kind?: string; q?: string },
): string {
  const statuses = [...new Set(frameworkRecords.map((record) => record.status))];
  const kinds = [...new Set(frameworkRecords.map((record) => record.kind))];
  const statusOptions = statuses.map((status) => `<option value="${escapeHtml(status)}"${filters.status === status ? ' selected' : ''}>${escapeHtml(statusLabel(status))}</option>`).join('');
  const kindOptions = kinds.map((kind) => `<option value="${escapeHtml(kind)}"${local.kind === kind ? ' selected' : ''}>${escapeHtml(titleCase(kind))}</option>`).join('');
  const levelControl = selectedFramework === 'wcag-2.2' ? `<label for="compliance-level">Level</label>
    <select id="compliance-level" name="level">
      <option value="">All levels</option>
      ${['A', 'AA', 'AAA'].map((level) => `<option value="${level}"${filters.level === level ? ' selected' : ''}>${level}</option>`).join('')}
    </select>` : '';
  const resetHref = pageHref(selectedFramework, {}, local.section ? { section: local.section } : {});
  return `<section class="info-card" aria-labelledby="compliance-refine-heading">
    <h2 id="compliance-refine-heading">Refine this framework</h2>
    <form method="get" action="${escapeHtml(COMPLIANCE_ROUTE)}">
      <input type="hidden" name="framework" value="${escapeHtml(selectedFramework)}">
      ${local.section ? `<input type="hidden" name="section" value="${escapeHtml(local.section)}">` : ''}
      <p>
        <label for="compliance-status">Status</label>
        <select id="compliance-status" name="status"><option value="">All statuses</option>${statusOptions}</select>
        <label for="compliance-kind">Record type</label>
        <select id="compliance-kind" name="kind"><option value="">All record types</option>${kindOptions}</select>
        ${levelControl}
        <label for="compliance-search">Search</label>
        <input id="compliance-search" name="q" type="search" value="${escapeHtml(local.q ?? '')}" placeholder="Control, criterion, evidence ID…">
        <button type="submit">Apply</button>
        <a href="${escapeHtml(resetHref)}">Clear filters</a>
      </p>
    </form>
  </section>`;
}

function sectionCards(
  framework: string,
  frameworkRecords: ComplianceRecord[],
  filters: AssuranceFilterValues,
  local: { kind?: string; q?: string },
): string {
  const sections = [...new Set(frameworkRecords.map((record) => record.section))];
  return `<div class="assurance-posture-grid">${sections.map((section) => {
    const records = frameworkRecords.filter((record) => record.section === section);
    const attention = records.filter(needsAttention).length;
    const href = pageHref(framework, filters, { ...local, section });
    return `<a class="assurance-posture-card" href="${escapeHtml(href)}">
      <p class="eyebrow">Framework section</p>
      <h3>${escapeHtml(section)}</h3>
      <strong>${records.length} records</strong>
      <span>${attention} need attention · Inspect section <span aria-hidden="true">→</span></span>
    </a>`;
  }).join('')}</div>`;
}

function renderResults(
  env: Env,
  selectedFramework: string,
  selectedSection: string | undefined,
  query: string,
  records: ComplianceRecord[],
): string {
  if (!selectedSection && !query) {
    return `<section class="info-card" aria-labelledby="choose-section-heading">
      <h2 id="choose-section-heading">Choose a section to inspect</h2>
      <p>The framework overview stays compact until you select a clause family, control group, or WCAG principle. This avoids turning the page back into a raw record dump.</p>
    </section>`;
  }
  const heading = query && !selectedSection ? 'Search results' : selectedSection ?? 'Matching records';
  const visible = records.slice(0, 50);
  const overflow = records.length > visible.length
    ? `<p class="assurance-notice"><strong>${records.length - visible.length} more matches.</strong> Narrow the search, status, or record type to inspect a smaller result set.</p>`
    : '';
  return `<section aria-labelledby="compliance-results-heading">
    <div class="section-head"><h2 id="compliance-results-heading">${escapeHtml(heading)}</h2><span>${records.length} matching record${records.length === 1 ? '' : 's'}</span></div>
    ${overflow}
    ${visible.map((record) => renderRecord(env, record)).join('') || '<div class="availability-empty">No records match this framework selection. Clear or change the filters to continue.</div>'}
    <p class="subtle"><a href="${escapeHtml(pageHref(selectedFramework, {}))}">Back to framework overview</a></p>
  </section>`;
}

export function complianceContent(request: Request, env: Env): PageContent {
  const url = new URL(request.url);
  const filters = assuranceFiltersFromUrl('compliance', url);
  const allRecords = listPublishedAssuranceRecords('compliance');
  const selectedFramework = filters.framework;
  const framework = selectedFramework ? complianceFrameworks.find((candidate) => candidate.id === selectedFramework) : undefined;
  const frameworkRecords = selectedFramework ? allRecords.filter((record) => record.framework === selectedFramework) : [];
  const validSections = new Set(frameworkRecords.map((record) => record.section));
  const requestedSection = url.searchParams.get('section') || undefined;
  const selectedSection = requestedSection && validSections.has(requestedSection) ? requestedSection : undefined;
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
  const requestedKind = url.searchParams.get('kind') ?? '';
  const validKinds = new Set(frameworkRecords.map((record) => record.kind));
  const kind = validKinds.has(requestedKind as ComplianceRecord['kind']) ? requestedKind : '';
  const canonicalRecords = filterPublishedAssuranceRecords('compliance', filters);
  const locallyFiltered = canonicalRecords.filter((record) =>
    (!kind || record.kind === kind)
    && (!selectedSection || record.section === selectedSection)
    && matchesSearch(record, q));
  const matchingApiRoute = assuranceCollectionApiRoute('compliance', filterQuery(filters));
  const frameworkNames = complianceFrameworks.map((candidate) => candidate.label).join(', ');
  const frameworkSources = complianceFrameworks.map((candidate) => ({
    label: `${candidate.label} canonical dataset`,
    href: sourceUrl(env, candidate.sourcePath),
  }));

  const frameworkReview = framework ? `<section aria-labelledby="framework-review-heading">
    <div class="section-head"><h2 id="framework-review-heading">Framework review</h2><span>${frameworkRecords.length} canonical records</span></div>
    <div class="info-card">
      <p class="eyebrow">${escapeHtml(framework.label)}</p>
      <h3>${escapeHtml(frameworkDescription(framework.id))}</h3>
      <p><strong>Current posture:</strong> ${escapeHtml(frameworkStatusSummary(frameworkRecords))}</p>
      ${framework.assessmentDate ? `<p class="subtle">Assessment date: ${escapeHtml(framework.assessmentDate)}</p>` : ''}
      <p><a href="${escapeHtml(matchingApiRoute)}">Matching JSON</a> · <a href="${escapeHtml(sourceUrl(env, framework.sourcePath))}">Canonical dataset</a></p>
    </div>
    <div class="section-head"><h2>Framework sections</h2><span>Choose where to inspect</span></div>
    ${sectionCards(framework.id, frameworkRecords, filters, { kind: kind || undefined, q: q || undefined })}
  </section>
  ${refinementForm(framework.id, frameworkRecords, filters, { section: selectedSection, kind: kind || undefined, q: q || undefined })}
  ${renderResults(env, framework.id, selectedSection, q, locallyFiltered)}` : `<section class="info-card" aria-labelledby="choose-framework-heading">
    <h2 id="choose-framework-heading">Choose a framework to inspect</h2>
    <p>ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 use different control structures and status vocabularies. Select one framework before drilling into records so those semantics stay clear.</p>
  </section>`;

  return pageContent(env, 'Compliance & Assurance', `
  <section class="page-header assurance-header">
    <h1>Compliance posture you can actually inspect.</h1>
    <p class="lede">Start with a framework, identify the gaps or partial mappings that need attention, then drill into the relevant section, record, evidence, and source.</p>
    <p class="assurance-notice"><strong>Scope:</strong> ${escapeHtml(complianceQualification)} WCAG engineering states and ISO public-mapping statuses remain framework-specific; this page does not treat them as interchangeable pass/fail claims.</p>
    <div class="page-tools">
      <a class="button button-primary" href="${escapeHtml(matchingApiRoute)}">Machine-readable compliance API</a>
      <a class="text-link" href="${escapeHtml(EVIDENCE_ROUTE)}">Evidence catalog</a>
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/compliance-page.ts'))}">Route source</a>
      ${referenceDetails([
        { label: 'Canonical assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
        { label: 'Reporting API', href: sourceUrl(env, 'src/api/reporting.ts') },
        { label: 'Canonical reporting schema', href: sourceUrl(env, 'contracts/assurance/reporting.schema.json') },
        { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
        ...frameworkSources,
        { label: 'Assurance guide', href: sourceUrl(env, 'docs/ASSURANCE.md') },
      ])}
    </div>
  </section>
  <section aria-labelledby="framework-heading">
    <div class="section-head"><h2 id="framework-heading">Framework posture</h2><span>${allRecords.length} canonical records</span></div>
    <div class="assurance-posture-grid">${frameworkCards(allRecords, selectedFramework)}</div>
  </section>
  <section aria-labelledby="attention-heading">
    <div class="section-head"><h2 id="attention-heading">Needs attention</h2><span>${selectedFramework ? 'Current framework' : 'Top records by framework'}</span></div>
    <p class="subtle">Gap and not-observed records are shown first, followed by partial mappings. These are navigation shortcuts, not a cross-framework score.</p>
    ${attentionCards(allRecords, selectedFramework)}
  </section>
  ${frameworkReview}`, {
    canonicalPath: COMPLIANCE_ROUTE,
    description: `Instructional ${frameworkNames} assurance review with framework-specific posture, gap-first navigation, section drill-down, evidence links, and canonical JSON/source traceability.`,
  });
}
