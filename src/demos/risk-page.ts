import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import {
  assuranceAnchor,
  assuranceDatasetSchema,
  assuranceDatasetSource,
  assuranceFilterDefinitions,
  assuranceFilterValues,
  assuranceFiltersFromUrl,
  assuranceRecordUrls,
  deriveRiskCounts,
  labelAssuranceFilterValue,
  type AssuranceFilterValues,
} from '../assurance/service';
import {
  assuranceCollectionApiRoute,
  assuranceHtmlRoute,
} from '../assurance/routes';
import { governanceDocumentLinks } from '../assurance/presentation';
import {
  filterPublishedAssuranceRecords,
  listPublishedAssuranceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import type { Env } from '../types';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

const RISK_ROUTE = assuranceHtmlRoute('risks');
const EVIDENCE_ROUTE = assuranceHtmlRoute('evidence');

type PublishedRisk = PublishedAssuranceRecordMap['risks'];

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function riskFilterSelect(parameter: string, current?: string): string {
  const definition = assuranceFilterDefinitions('risks')[parameter];
  if (!definition) return '';
  const options = assuranceFilterValues('risks', parameter).map((value) =>
    `<option value="${escapeHtml(value)}"${current === value ? ' selected' : ''}>${escapeHtml(labelAssuranceFilterValue('risks', parameter, value))}</option>`,
  ).join('');
  return `<label for="risk-${escapeHtml(parameter)}">${escapeHtml(definition.label)}</label>
    <select id="risk-${escapeHtml(parameter)}" name="${escapeHtml(parameter)}">
      <option value="">All</option>
      ${options}
    </select>`;
}

function riskFilterControls(filters: AssuranceFilterValues): string {
  return Object.keys(assuranceFilterDefinitions('risks'))
    .map((parameter) => riskFilterSelect(parameter, filters[parameter]))
    .join('\n          ');
}

function evidenceLinks(record: PublishedRisk): string {
  const evidence = assuranceRelationshipIds(record.relationships, 'evidence');
  if (evidence.length === 0) return '<span class="subtle">No public evidence linked.</span>';
  return evidence.map((id) => {
    const href = assuranceRecordUrls('evidence', id).html;
    if (!href) throw new Error(`Risk evidence ${id} has no canonical HTML route.`);
    return `<a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a>`;
  }).join(', ');
}

function controlLinks(env: Env, record: PublishedRisk): string {
  const controls = governanceDocumentLinks(assuranceRelationshipIds(record.relationships, 'governanceDocuments'));
  if (controls.length === 0) return '<span class="subtle">No public control references linked.</span>';
  return controls.map((control) =>
    `<a href="${escapeHtml(sourceUrl(env, control.repositoryPath))}"><code>${escapeHtml(control.reference)}</code></a>`,
  ).join(', ');
}

function scoreTransition(record: PublishedRisk): string {
  return `${escapeHtml(titleCase(record.inherent.rating))} ${record.inherent.score} <span aria-hidden="true">→</span> ${escapeHtml(titleCase(record.residual.rating))} ${record.residual.score}`;
}

function priorityRows(records: PublishedRisk[]): string {
  if (records.length === 0) {
    return '<tr><td colspan="4">No high or critical residual risks are currently published.</td></tr>';
  }
  return records.map((record) => {
    const href = assuranceRecordUrls('risks', record.id).html;
    if (!href) throw new Error(`Risk ${record.id} has no canonical HTML route.`);
    const evidenceCount = assuranceRelationshipIds(record.relationships, 'evidence').length;
    return `<tr>
      <th scope="row"><a href="${escapeHtml(href)}"><code>${escapeHtml(record.id)}</code></a><br><strong>${escapeHtml(record.title)}</strong><br><span class="subtle">${escapeHtml(titleCase(record.framework))}</span></th>
      <td><strong>${scoreTransition(record)}</strong></td>
      <td>${escapeHtml(titleCase(record.status))}<br><span class="subtle">${escapeHtml(record.treatment.map(titleCase).join(' / '))}</span></td>
      <td>${evidenceCount} public evidence link${evidenceCount === 1 ? '' : 's'}</td>
    </tr>`;
  }).join('');
}

function registerRows(env: Env, records: PublishedRisk[]): string {
  if (records.length === 0) {
    return '<tr><td colspan="5">No canonical risk records match the selected filters. Clear or change the filters to continue.</td></tr>';
  }
  return records.map((record) => {
    const anchor = assuranceAnchor(record.id);
    const urls = assuranceRecordUrls('risks', record.id);
    if (!urls.api) throw new Error(`Risk ${record.id} has no canonical exact-record API route.`);
    return `<tr id="${escapeHtml(anchor)}">
      <th scope="row">
        <a href="#${escapeHtml(anchor)}"><code>${escapeHtml(record.id)}</code></a>
        <strong>${escapeHtml(record.title)}</strong>
        <span class="subtle">${escapeHtml(titleCase(record.framework))}</span>
      </th>
      <td><strong>${scoreTransition(record)}</strong></td>
      <td><span class="status-pill">${escapeHtml(titleCase(record.status))}</span><br><span class="subtle">Treatment: ${escapeHtml(record.treatment.map(titleCase).join(' / '))}</span></td>
      <td>${evidenceLinks(record)}</td>
      <td>
        <details>
          <summary>Traceability and publication</summary>
          <p><strong>Review due:</strong> <time datetime="${escapeHtml(record.reviewDue)}">${escapeHtml(record.reviewDue)}</time></p>
          <p><strong>Controls:</strong> ${controlLinks(env, record)}</p>
          <p><strong>Publication:</strong> ${escapeHtml(record.publication.lifecycle)} · ${escapeHtml(record.publication.disclosureReview)}</p>
          <p><a href="${escapeHtml(urls.api)}">Exact record JSON</a></p>
        </details>
      </td>
    </tr>`;
  }).join('');
}

function postureCards(records: PublishedRisk[]): string {
  const counts = deriveRiskCounts(records);
  return `<div class="info-grid">
    <article class="info-card"><p class="eyebrow">Published register</p><h2>${counts.total} public risks</h2><p>Stable disclosure-safe records from the canonical risk register.</p></article>
    <article class="info-card"><p class="eyebrow">Domains</p><h2>${counts.byFramework.security} security · ${counts.byFramework.ai} AI</h2><p>Security and AI risks remain distinct while using one scoring model.</p></article>
    <article class="info-card"><p class="eyebrow">Residual posture</p><h2>${counts.byResidualRating.critical} critical · ${counts.byResidualRating.high} high</h2><p>${counts.byResidualRating.moderate} moderate · ${counts.byResidualRating.low} low after current treatment evidence.</p></article>
    <article class="info-card"><p class="eyebrow">Treatment state</p><h2>${counts.byStatus.open} open · ${counts.byStatus.treating} treating</h2><p>Status reports treatment workflow, not risk acceptance.</p></article>
  </div>`;
}

export function riskContent(request: Request, env: Env): PageContent {
  const url = new URL(request.url);
  const filters = assuranceFiltersFromUrl('risks', url);
  const allRecords = listPublishedAssuranceRecords('risks');
  const records = filterPublishedAssuranceRecords('risks', filters)
    .slice()
    .sort((left, right) => right.residual.score - left.residual.score || right.inherent.score - left.inherent.score || left.id.localeCompare(right.id));
  const counts = deriveRiskCounts(records);
  const priority = allRecords
    .filter((record) => record.residual.rating === 'critical' || record.residual.rating === 'high')
    .slice()
    .sort((left, right) => right.residual.score - left.residual.score || right.inherent.score - left.inherent.score || left.id.localeCompare(right.id));
  const matchingApiRoute = assuranceCollectionApiRoute('risks', filters);

  return pageContent(env, 'Risk Assurance', `
  <section class="page-header assurance-header">
    <h1>Risk posture you can inspect.</h1>
    <p class="lede">Start with current residual exposure, focus on the risks that still need attention, then trace each score and treatment state to public evidence and control references.</p>
    <p class="assurance-notice"><strong>Public boundary:</strong> owner identity, acceptance rationale, sensitive infrastructure context, and private treatment actions are intentionally omitted. Residual scores are engineering-assurance signals, not claims of formal acceptance or certification.</p>
    <div class="page-tools">
      <a class="button button-primary" href="${escapeHtml(matchingApiRoute)}">View matching JSON</a>
      <a class="text-link" href="${escapeHtml(EVIDENCE_ROUTE)}">Search evidence</a>
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/risk-page.ts'))}">Route source</a>
      ${referenceDetails([
        { label: 'Risk-management method', href: sourceUrl(env, 'docs/governance/RISK-MANAGEMENT.md') },
        { label: 'Canonical risk dataset', href: sourceUrl(env, assuranceDatasetSource('risks')) },
        { label: 'Risk schema', href: sourceUrl(env, assuranceDatasetSchema('risks')) },
        { label: 'Canonical assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
        { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
      ])}
    </div>
  </section>

  <section aria-labelledby="risk-posture-heading">
    <div class="section-head"><h2 id="risk-posture-heading">Current risk posture</h2><span>Derived from ${allRecords.length} published records</span></div>
    ${postureCards(allRecords)}
  </section>

  <section aria-labelledby="priority-risk-heading">
    <div class="section-head"><h2 id="priority-risk-heading">Priority residual risks</h2><span>High and critical residual exposure first</span></div>
    <p class="subtle">These are the published risks whose residual rating remains high or critical after the currently evidenced treatment. Open a record to inspect the complete evidence chain.</p>
    <div class="table-wrap">
      <table>
        <caption class="subtle">${priority.length} published risks currently have high or critical residual exposure.</caption>
        <thead><tr><th scope="col">Risk</th><th scope="col">Inherent → residual</th><th scope="col">Treatment state</th><th scope="col">Evidence</th></tr></thead>
        <tbody>${priorityRows(priority)}</tbody>
      </table>
    </div>
  </section>

  <section aria-labelledby="risk-reading-heading">
    <div class="section-head"><h2 id="risk-reading-heading">How to read the register</h2><span>Scoring and treatment semantics</span></div>
    <div class="info-grid">
      <article class="info-card"><h3>Inherent</h3><p>Exposure before the currently documented treatment is applied.</p></article>
      <article class="info-card"><h3>Residual</h3><p>Exposure remaining after the treatment represented by the public evidence and controls. It does not mean the risk has been accepted.</p></article>
      <article class="info-card"><h3>Treatment</h3><p><strong>Reduce</strong> lowers exposure, <strong>Share</strong> transfers part of it, and <strong>Avoid</strong> removes the activity or condition that creates it.</p></article>
    </div>
  </section>

  <section class="info-card" aria-labelledby="risk-filter-heading">
    <h2 id="risk-filter-heading">Filter the complete register</h2>
    <form method="get" action="${escapeHtml(RISK_ROUTE)}">
      <fieldset>
        <legend class="subtle">Framework, treatment status, and residual rating</legend>
        <p>
          ${riskFilterControls(filters)}
          <button type="submit">Apply filters</button>
          <a href="${escapeHtml(RISK_ROUTE)}">Clear</a>
        </p>
      </fieldset>
    </form>
    <p><strong>${counts.total}</strong> matching of ${allRecords.length} records · ${counts.byFramework.security} security · ${counts.byFramework.ai} AI.</p>
    <p class="subtle">Residual: ${counts.byResidualRating.critical} critical · ${counts.byResidualRating.high} high · ${counts.byResidualRating.moderate} moderate · ${counts.byResidualRating.low} low. Status: ${counts.byStatus.open} open · ${counts.byStatus.treating} treating.</p>
  </section>

  <section aria-labelledby="risk-register-heading">
    <div class="section-head"><h2 id="risk-register-heading">Complete risk register</h2><span>Stable anchors · canonical evidence IDs</span></div>
    <div class="table-wrap">
      <table>
        <caption class="subtle">${counts.total} matching public risk records. Publication metadata is available in each row without dominating the primary risk view.</caption>
        <thead><tr><th scope="col">Risk</th><th scope="col">Inherent → residual</th><th scope="col">Status</th><th scope="col">Evidence</th><th scope="col">Inspect</th></tr></thead>
        <tbody>${registerRows(env, records)}</tbody>
      </table>
    </div>
  </section>`, {
    canonicalPath: RISK_ROUTE,
    description: 'Instructional public risk assurance showing current posture, priority residual exposure, filterable canonical records, treatment state, and evidence traceability.',
  });
}
