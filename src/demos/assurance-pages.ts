import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';
import {
  assuranceAnchor,
  assuranceDatasetSchema,
  assuranceDatasetSource,
  assuranceFilterDefinitions,
  assuranceFilterValues,
  assuranceRecordUrlsById,
  deriveIncidentCounts,
  deriveRiskCounts,
  labelAssuranceFilterValue,
  riskFiltersFromUrl,
} from '../assurance/service';
import {
  filterPublishedRisks,
  listPublishedAssuranceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';

const issueUrl = (env: Env, template: string) => `${repoUrl(env)}/issues/new?template=${encodeURIComponent(template)}`;
const privateReportUrl = (env: Env) => `${repoUrl(env)}/security/advisories/new`;

export function renderConcerns(env: Env): Response {
  const cards = [
    ['Bug', 'Report reproducible incorrect behavior that contains no sensitive security information.', issueUrl(env, 'bug.yml')],
    ['Feature request', 'Propose a new capability or improvement and explain the problem it would solve.', issueUrl(env, 'feature.yml')],
    ['Other concern', 'Report an accessibility, AI/MCP, governance, documentation, or other non-sensitive concern.', issueUrl(env, 'concern.yml')],
  ].map(([title, description, href]) => `<article class="info-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><p><a href="${escapeHtml(href)}">Open public issue form →</a></p></article>`).join('');

  return shell(env, 'Report a Concern', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /governance/concerns</p>
    <h1>Put concerns into controlled work.</h1>
    <p class="lede">Choose a structured public issue form. The submitted issue becomes part of the reviewable work and change history for this demonstration.</p>
    <p class="assurance-notice"><strong>Public intake only:</strong> remove credentials, personal data, private infrastructure details, and unreleased exploit information.</p>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/concerns.ts'))}">Route source</a>${referenceDetails([
      { label: 'Issue form configuration', href: sourceUrl(env, '.github/ISSUE_TEMPLATE/config.yml') },
      { label: 'Communication and concern governance', href: sourceUrl(env, 'docs/governance/COMPETENCE-AWARENESS-COMMUNICATION.md') },
    ])}</div>
  </section>
  <div class="info-grid">${cards}</div>
  <section class="assurance-notice" aria-labelledby="security-concern-heading">
    <h2 id="security-concern-heading">Security vulnerability or incident?</h2>
    <p>Keep it private. Use the dedicated security channel so triage and remediation can happen before public disclosure.</p>
    <p><a href="${escapeHtml(privateReportUrl(env))}">Open a private security report →</a></p>
  </section>`, {
    activeRoute: '/governance/concerns',
    description: 'Public issue intake for non-sensitive WizardGang Architecture Demo bugs, features, accessibility, AI/MCP, and other concerns.',
  });
}

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function riskFilterQuery(filters: ReturnType<typeof riskFiltersFromUrl>): string {
  const params = new URLSearchParams();
  if (filters.framework) params.set('framework', filters.framework);
  if (filters.status) params.set('status', filters.status);
  if (filters.residualRating) params.set('residual', filters.residualRating);
  const query = params.toString();
  return query ? `?${query}` : '';
}

function riskFilterSelect(parameter: 'framework' | 'status' | 'residual', current?: string): string {
  const definition = assuranceFilterDefinitions('risks')[parameter];
  const options = assuranceFilterValues('risks', parameter).map((value) =>
    `<option value="${escapeHtml(value)}"${current === value ? ' selected' : ''}>${escapeHtml(labelAssuranceFilterValue('risks', parameter, value))}</option>`,
  ).join('');
  return `<label>${escapeHtml(definition?.label ?? parameter)}
    <select name="${parameter}"><option value="">All</option>${options}</select>
  </label>`;
}

function riskCard(env: Env, risk: PublishedAssuranceRecordMap['risks']): string {
  const evidenceLinks = risk.evidence.map((id) => {
    const href = assuranceRecordUrlsById(id).html;
    return href ? `<a href="${escapeHtml(href)}">${escapeHtml(id)}</a>` : `<code>${escapeHtml(id)}</code>`;
  }).join(', ');
  const controlLinks = risk.controls.map((control) => `<a href="${escapeHtml(sourceUrl(env, control.repositoryPath))}">${escapeHtml(control.reference)}</a>`).join('; ');
  const anchor = assuranceAnchor(risk.id);
  return `<article class="info-card" id="${escapeHtml(anchor)}">
    <p class="eyebrow"><a href="#${escapeHtml(anchor)}">${escapeHtml(risk.id)}</a> · ${escapeHtml(titleCase(risk.framework))}</p>
    <h2>${escapeHtml(risk.title)}</h2>
    <p><strong>Inherent:</strong> ${risk.inherent.score} ${escapeHtml(titleCase(risk.inherent.rating))} · <strong>Residual:</strong> ${risk.residual.score} ${escapeHtml(titleCase(risk.residual.rating))}</p>
    <p><strong>Status:</strong> ${escapeHtml(titleCase(risk.status))} · <strong>Treatment direction:</strong> ${escapeHtml(risk.treatment.map(titleCase).join(' / '))}</p>
    <p><strong>Lifecycle:</strong> ${escapeHtml(risk.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(risk.publication.disclosureReview)}</p>
    <p><strong>Review due:</strong> <time datetime="${escapeHtml(risk.reviewDue)}">${escapeHtml(risk.reviewDue)}</time></p>
    <p><strong>Evidence:</strong> ${evidenceLinks}</p>
    <p><strong>Control references:</strong> ${controlLinks}</p>
  </article>`;
}

export function renderRisks(request: Request, env: Env): Response {
  const filters = riskFiltersFromUrl(new URL(request.url));
  const records = filterPublishedRisks(filters);
  const counts = deriveRiskCounts(records);
  const query = riskFilterQuery(filters);
  const cards = records.map((record) => riskCard(env, record)).join('');
  const results = cards || '<article class="info-card"><h2>No matching risks</h2><p>Change or clear the filters to view the public assurance records.</p></article>';

  return shell(env, 'Risk Assurance', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /governance/risks</p>
    <h1>Review the public risk assurance record.</h1>
    <p class="lede">This disclosure-safe view carries stable security and AI risk identifiers, current scores, treatment direction, lifecycle state, and reviewable evidence/control links from the controlled registers.</p>
    <p class="assurance-notice"><strong>Public assurance boundary:</strong> private treatment actions, risk-owner and acceptance detail, sensitive infrastructure context, and acceptance rationale are intentionally omitted. These records do not claim certification or residual-risk acceptance.</p>
    <div class="page-tools"><a class="button button-primary" href="/v1/assurance/risks${escapeHtml(query)}">View JSON</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/risks.ts'))}">Route source</a><a class="text-link" href="${escapeHtml(sourceUrl(env, assuranceDatasetSource('risks')))}">Dataset source</a>${referenceDetails([
      { label: 'Risk schema', href: sourceUrl(env, assuranceDatasetSchema('risks')) },
      { label: 'Common assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
      { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
      { label: 'Risk-management method', href: sourceUrl(env, 'docs/governance/RISK-MANAGEMENT.md') },
    ])}</div>
  </section>
  <section class="info-card" aria-labelledby="risk-filter-heading">
    <h2 id="risk-filter-heading">Filter records</h2>
    <form method="get" action="/governance/risks">
      <p>
        ${riskFilterSelect('framework', filters.framework)}
        ${riskFilterSelect('status', filters.status)}
        ${riskFilterSelect('residual', filters.residualRating)}
        <button type="submit">Apply filters</button>
        <a href="/governance/risks">Clear</a>
      </p>
    </form>
    <p><strong>${counts.total}</strong> matching records · ${counts.byFramework.security} security · ${counts.byFramework.ai} AI · ${counts.byResidualRating.high} high residual · ${counts.byResidualRating.moderate} moderate residual · ${counts.byResidualRating.low} low residual.</p>
  </section>
  <div class="info-grid">${results}</div>`, {
    activeRoute: '/governance/risks',
    description: 'Disclosure-safe security and AI risk assurance with stable identifiers, lifecycle state, evidence links, control references, and derived counts.',
  });
}

function recordTags(values: string[], linkRecords = false): string {
  if (values.length === 0) return '<span class="status-pill">None recorded</span>';
  return values.map((value) => {
    const href = linkRecords ? assuranceRecordUrlsById(value).html : undefined;
    return href
      ? `<a class="status-pill" href="${escapeHtml(href)}">${escapeHtml(value)}</a>`
      : `<span class="status-pill">${escapeHtml(value)}</span>`;
  }).join(' ');
}

export function renderIncidents(env: Env): Response {
  const incidents = listPublishedAssuranceRecords('incidents');
  const exercises = listPublishedAssuranceRecords('exercises');
  const counts = deriveIncidentCounts(incidents, exercises);
  const incidentCards = incidents.map((record) => {
    const anchor = assuranceAnchor(record.id);
    return `<article class="info-card" id="${escapeHtml(anchor)}">
      <p class="eyebrow">Actual incident · <a href="#${escapeHtml(anchor)}">${escapeHtml(record.id)}</a></p>
      <h2>${escapeHtml(record.title)}</h2>
      <p><strong>Status:</strong> ${escapeHtml(titleCase(record.status))}</p>
      <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
      <p>${escapeHtml(record.summary)}</p>
      <p><strong>Categories:</strong> ${recordTags(record.categories)}</p>
      <p><strong>Risk links:</strong> ${recordTags(record.riskLinks, true)}</p>
      <p><strong>Control links:</strong> ${recordTags(record.controlLinks, true)}</p>
      <p><strong>Evidence:</strong> ${recordTags(record.evidence, true)}</p>
    </article>`;
  }).join('');

  const exerciseCards = exercises.map((record) => {
    const anchor = assuranceAnchor(record.id);
    return `<article class="info-card" id="${escapeHtml(anchor)}">
      <p class="eyebrow">Simulated exercise · <a href="#${escapeHtml(anchor)}">${escapeHtml(record.id)}</a></p>
      <h2>${escapeHtml(record.exerciseType)}</h2>
      <p><strong>Status:</strong> ${escapeHtml(titleCase(record.status))} · <strong>Simulated:</strong> yes${record.dueDate ? ` · <strong>Due:</strong> <time datetime="${escapeHtml(record.dueDate)}">${escapeHtml(record.dueDate)}</time>` : ''}</p>
      <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
      <p><strong>Scenario:</strong> ${escapeHtml(record.scenario)}</p>
      <p><strong>Scope:</strong> ${escapeHtml(record.scope)}</p>
      <p><strong>Owner:</strong> ${escapeHtml(record.owner)}</p>
      <p><strong>Objective links:</strong> ${recordTags(record.objectiveLinks)}</p>
      <p><strong>Evidence:</strong> ${record.evidence.length === 0 ? 'None yet; completion evidence is created only when the exercise is performed.' : recordTags(record.evidence, true)}</p>
      <p>${escapeHtml(record.publicNote)}</p>
    </article>`;
  }).join('');

  return shell(env, 'Incidents & Exercises', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /governance/incidents</p>
    <h1>Incidents and exercises stay distinct.</h1>
    <p class="lede">This public register exposes disclosure-safe incident and response-exercise records without turning vulnerabilities, advisories, simulations, or unknown history into incidents.</p>
    <p class="assurance-notice"><strong>Current retained posture:</strong> ${counts.actualIncidents} established actual incident records; ${counts.exercises} exercise record, of which ${counts.plannedExercises} is planned and ${counts.completedExercises} is completed or in post-exercise follow-up. Zero retained incident records is not a claim that an incident has never occurred.</p>
    <div class="page-tools"><a class="button button-primary" href="/v1/assurance/incidents">View canonical JSON API</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/incidents.ts'))}">Route source</a>${referenceDetails([
      { label: 'Incident dataset', href: sourceUrl(env, assuranceDatasetSource('incidents')) },
      { label: 'Exercise dataset', href: sourceUrl(env, assuranceDatasetSource('exercises')) },
      { label: 'Common assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
      { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
      { label: 'Incident schema', href: sourceUrl(env, assuranceDatasetSchema('incidents')) },
      { label: 'Exercise schema', href: sourceUrl(env, assuranceDatasetSchema('exercises')) },
    ])}</div>
  </section>

  <section aria-labelledby="record-boundaries">
    <h2 id="record-boundaries">Record boundaries</h2>
    <div class="info-grid">
      <article class="info-card"><h3>Actual incidents · INC-*</h3><p>Only established real incident records receive permanent <code>INC-*</code> IDs and matching page anchors. No placeholder incident ID is created merely to prove the route.</p></article>
      <article class="info-card"><h3>Exercises · EX-*</h3><p>Exercises are simulated readiness activities. Permanent <code>EX-*</code> anchors identify the exercise record, not a historical incident.</p></article>
      <article class="info-card"><h3>Vulnerabilities</h3><p>Suspected or confirmed vulnerabilities use the private security-reporting lifecycle. A vulnerability is not automatically an operational incident.</p><p><a href="/security">Security reporting →</a></p></article>
      <article class="info-card"><h3>Advisories</h3><p>Published security advisories and CVEs are disclosure artifacts for confirmed vulnerabilities. They remain separate from incident and exercise records.</p></article>
    </div>
  </section>

  <section aria-labelledby="actual-incidents">
    <h2 id="actual-incidents">Actual incidents</h2>
    ${incidentCards || '<div class="assurance-notice"><p><strong>No actual incident records are established in the current retained register.</strong> Future disclosure-safe records will appear here under permanent <code>INC-*</code> anchors only after they are actually established.</p></div>'}
  </section>

  <section aria-labelledby="response-exercises">
    <h2 id="response-exercises">Response exercises</h2>
    <div class="info-grid">${exerciseCards}</div>
  </section>`, {
    activeRoute: '/governance/incidents',
    description: 'Disclosure-safe public incident and response-exercise register with lifecycle presentation and permanent INC-* and EX-* record anchors.',
  });
}
