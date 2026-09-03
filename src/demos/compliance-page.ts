import {
  assuranceAnchor,
  assuranceFilterDefinitions,
  assuranceFilterValues,
  assuranceRecordUrls,
  complianceFiltersFromUrl,
  deriveComplianceCounts,
  labelAssuranceFilterValue,
  publicComplianceFrameworks,
  publicComplianceQualification,
  type PublicComplianceFilters,
  type PublicComplianceRecord,
} from '../assurance/service';
import {
  filterPublishedCompliance,
  listPublishedAssuranceRecords,
} from '../assurance/publication';
import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

function filterQuery(filters: PublicComplianceFilters): string {
  const params = new URLSearchParams();
  if (filters.framework) params.set('framework', filters.framework);
  if (filters.status) params.set('status', filters.status);
  if (filters.level) params.set('level', filters.level);
  const query = params.toString();
  return query ? `?${query}` : '';
}

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function recordEvidence(record: PublicComplianceRecord): string {
  return record.evidence.map((id) => {
    const href = assuranceRecordUrls('evidence', id).html ?? '/evidence';
    return `<a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a>`;
  }).join(', ');
}

function recordDetail(record: PublicComplianceRecord): string {
  if (record.rationale) return `<strong>Rationale:</strong> ${escapeHtml(record.rationale)}`;
  if (record.implementation) return escapeHtml(record.implementation);
  return `${escapeHtml(titleCase(record.kind))} mapped to the canonical public assurance dataset.`;
}

function filterSelect(
  parameter: 'framework' | 'status' | 'level',
  current: string | undefined,
  emptyLabel: string,
  describedBy = '',
): string {
  const definition = assuranceFilterDefinitions('compliance')[parameter];
  const options = assuranceFilterValues('compliance', parameter).map((value) => {
    const label = labelAssuranceFilterValue('compliance', parameter, value);
    return `<option value="${escapeHtml(value)}"${current === value ? ' selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');
  return `<label for="compliance-${parameter}">${escapeHtml(definition?.label ?? parameter)}</label>
    <select id="compliance-${parameter}" name="${parameter}"${describedBy ? ` aria-describedby="${describedBy}"` : ''}>
      <option value="">${escapeHtml(emptyLabel)}</option>
      ${options}
    </select>`;
}

function countSummary(counts: ReturnType<typeof deriveComplianceCounts>, totalAvailable: number): string {
  return `<p><strong>${counts.total}</strong> matching of ${totalAvailable} records · ${counts.byFramework['iso-27001']} ISO 27001 · ${counts.byFramework['iso-42001']} ISO 42001 · ${counts.byFramework['wcag-2.2']} WCAG.</p>
    <p class="subtle">Statuses: ${counts.byStatus.met} met · ${counts.byStatus.partial} partial · ${counts.byStatus.gap} gap · ${counts.byStatus['not-applicable']} not applicable · ${counts.byStatus.demonstrated} demonstrated · ${counts.byStatus['not-observed']} not observed. WCAG levels: ${counts.byLevel.A} A · ${counts.byLevel.AA} AA · ${counts.byLevel.AAA} AAA.</p>`;
}

export function renderComplianceDemo(request: Request, env: Env): Response {
  const filters = complianceFiltersFromUrl(new URL(request.url));
  const records = filterPublishedCompliance(filters);
  const allRecords = listPublishedAssuranceRecords('compliance');
  const counts = deriveComplianceCounts(records);
  const query = filterQuery(filters);
  const frameworkCards = publicComplianceFrameworks.map((framework) => {
    const frameworkRecords = filterPublishedCompliance({ framework: framework.id });
    return `<a class="assurance-posture-card" href="/compliance?framework=${encodeURIComponent(framework.id)}">
      <p class="eyebrow">Canonical dataset</p>
      <h2>${escapeHtml(framework.label)}</h2>
      <strong>${frameworkRecords.length} records</strong>
      <span>${framework.assessmentDate ? `Assessed ${escapeHtml(framework.assessmentDate)} · ` : ''}Inspect records <span aria-hidden="true">→</span></span>
    </a>`;
  }).join('');

  const rows = records.map((record) => {
    const anchor = assuranceAnchor(record.id);
    const urls = assuranceRecordUrls('compliance', record.id);
    return `<tr id="${escapeHtml(anchor)}">
    <th scope="row">
      <a href="#${escapeHtml(anchor)}"><code>${escapeHtml(record.id)}</code></a>
      <strong>${escapeHtml(record.reference)} · ${escapeHtml(record.title)}</strong>
      <span class="subtle">${escapeHtml(record.section)} · ${escapeHtml(record.kind)}</span>
    </th>
    <td>${escapeHtml(record.frameworkLabel)}</td>
    <td><span class="status-pill">${escapeHtml(titleCase(record.status))}</span>${record.level ? ` <span class="status-pill">Level ${escapeHtml(record.level)}</span>` : ''}<br><span class="subtle">Lifecycle: ${escapeHtml(record.publication.lifecycle)} · ${escapeHtml(record.publication.disclosureReview)}</span></td>
    <td>${recordEvidence(record)}</td>
    <td>${recordDetail(record)}</td>
    <td><a href="${escapeHtml(urls.api ?? '/v1/assurance/compliance')}">JSON</a><br><a href="${escapeHtml(sourceUrl(env, record.sourcePath))}">Dataset source</a></td>
  </tr>`;
  }).join('');

  const frameworkNames = publicComplianceFrameworks.map((framework) => framework.label).join(', ');
  const frameworkReferences = publicComplianceFrameworks.map((framework) => ({
    label: `${framework.label} canonical dataset`,
    href: sourceUrl(env, framework.sourcePath),
  }));

  return shell(env, 'Compliance & Assurance', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /compliance</p>
    <h1>Compliance evidence, record by record.</h1>
    <p class="lede">Browse the canonical ${escapeHtml(frameworkNames)} public assurance datasets through one derived view with stable record anchors and evidence links.</p>
    <p class="assurance-notice"><strong>Scope:</strong> ${escapeHtml(publicComplianceQualification)} WCAG statuses are engineering-evidence states, while ISO statuses reflect the approved public mapping; they are not interchangeable pass/fail claims.</p>
    <div class="page-tools">
      <a class="button button-primary" href="/v1/assurance/compliance${escapeHtml(query)}">View matching JSON</a>
      <a class="text-link" href="/evidence">Search evidence</a>
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/compliance.ts'))}">Route source</a>
      ${referenceDetails([
        { label: 'Common assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
        { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
        ...frameworkReferences,
        { label: 'Assurance guide', href: sourceUrl(env, 'docs/ASSURANCE.md') },
      ])}
    </div>
  </section>
  <section aria-labelledby="framework-heading">
    <div class="section-head"><h2 id="framework-heading">Canonical frameworks</h2><span>${allRecords.length} derived records</span></div>
    <div class="assurance-posture-grid">${frameworkCards}</div>
  </section>
  <section class="info-card" aria-labelledby="compliance-filter-heading">
    <h2 id="compliance-filter-heading">Filter records</h2>
    <form method="get" action="/compliance">
      <fieldset>
        <legend class="subtle">Framework, status, and WCAG level</legend>
        <p>
          ${filterSelect('framework', filters.framework, 'All frameworks')}
          ${filterSelect('status', filters.status, 'All statuses')}
          ${filterSelect('level', filters.level, 'All levels / ISO records', 'compliance-level-help')}
          <button type="submit">Apply filters</button>
          <a href="/compliance">Clear</a>
        </p>
        <p class="subtle" id="compliance-level-help">A level filter matches WCAG criteria only; ISO records do not carry WCAG levels.</p>
      </fieldset>
    </form>
    ${countSummary(counts, allRecords.length)}
  </section>
  <section aria-labelledby="compliance-records-heading">
    <div class="section-head"><h2 id="compliance-records-heading">Compliance records</h2><span>Stable anchors · canonical evidence IDs</span></div>
    <div class="table-wrap">
      <table>
        <caption class="subtle">${counts.total} matching public compliance records. Each record ID is a permanent page anchor and exact API lookup key.</caption>
        <thead><tr><th scope="col">Record</th><th scope="col">Framework</th><th scope="col">Status</th><th scope="col">Evidence</th><th scope="col">Detail</th><th scope="col">Inspect</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">No canonical records match the selected filters. Clear or change the filters to continue.</td></tr>'}</tbody>
      </table>
    </div>
  </section>`, {
    activeRoute: '/compliance',
    description: `Filterable canonical ${frameworkNames} public assurance records with stable anchors, derived counts, lifecycle presentation, and evidence links.`,
  });
}
