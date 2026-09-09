import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import {
  assuranceAnchor,
  assuranceDatasetSchema,
  assuranceDatasetSource,
  assuranceRecordUrls,
  assuranceRecordUrlsById,
  deriveIncidentCounts,
  incidentQualifications,
} from '../assurance/service';
import {
  assuranceCollectionApiRoute,
  assuranceHtmlRoute,
} from '../assurance/routes';
import { governanceDocumentLinks } from '../assurance/presentation';
import {
  listPublishedAssuranceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import type { Env } from '../types';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

const INCIDENT_ROUTE = assuranceHtmlRoute('incidents');
const INCIDENT_API_ROUTE = assuranceCollectionApiRoute('incidents');
const EXERCISE_API_ROUTE = assuranceCollectionApiRoute('exercises');
const SECURITY_ROUTE = assuranceHtmlRoute('advisories');

type PublishedIncident = PublishedAssuranceRecordMap['incidents'];
type PublishedExercise = PublishedAssuranceRecordMap['exercises'];

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function relationshipLinks(ids: string[]): string {
  if (ids.length === 0) return '<span class="subtle">None linked.</span>';
  return ids.map((id) => {
    const href = assuranceRecordUrlsById(id).html;
    return href
      ? `<a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a>`
      : `<code>${escapeHtml(id)}</code>`;
  }).join(', ');
}

function objectiveLinks(env: Env, record: PublishedExercise): string {
  const ids = assuranceRelationshipIds(record.relationships, 'objectives');
  if (ids.length === 0) return '<span class="subtle">No assurance objective linked.</span>';
  const source = sourceUrl(env, assuranceDatasetSource('objectives'));
  return ids.map((id) => `<a href="${escapeHtml(source)}"><code>${escapeHtml(id)}</code></a>`).join(', ');
}

function governanceLinks(env: Env, record: PublishedExercise): string {
  const links = governanceDocumentLinks(assuranceRelationshipIds(record.relationships, 'governanceDocuments'));
  if (links.length === 0) return '<span class="subtle">No governance document linked.</span>';
  return links.map((link) =>
    `<a href="${escapeHtml(sourceUrl(env, link.repositoryPath))}"><code>${escapeHtml(link.reference)}</code></a>`,
  ).join(', ');
}

function evidenceLinks(record: PublishedExercise): string {
  const evidence = assuranceRelationshipIds(record.relationships, 'evidence');
  if (evidence.length === 0) {
    return '<span class="subtle">None yet. Completion evidence is created only after the exercise is performed.</span>';
  }
  return relationshipLinks(evidence);
}

function exerciseCard(env: Env, record: PublishedExercise): string {
  const anchor = assuranceAnchor(record.id);
  const urls = assuranceRecordUrls('exercises', record.id);
  if (!urls.api) throw new Error(`Exercise ${record.id} has no canonical exact-record API route.`);

  return `<article class="info-card" id="${escapeHtml(anchor)}">
    <p class="eyebrow">Response exercise · <a href="#${escapeHtml(anchor)}"><code>${escapeHtml(record.id)}</code></a></p>
    <h3>${escapeHtml(record.exerciseType)}</h3>
    <p><span class="status-pill">${escapeHtml(titleCase(record.status))}</span>${record.dueDate ? ` · <strong>Due:</strong> <time datetime="${escapeHtml(record.dueDate)}">${escapeHtml(record.dueDate)}</time>` : ''}</p>
    <p><strong>Scenario:</strong> ${escapeHtml(record.scenario)}</p>
    <p><strong>Scope:</strong> ${escapeHtml(record.scope)}</p>
    <p><strong>Accountable role:</strong> ${escapeHtml(record.owner)}</p>
    <details>
      <summary>Trace the exercise</summary>
      <p><strong>Assurance objective:</strong> ${objectiveLinks(env, record)}</p>
      <p><strong>Governance objective:</strong> ${governanceLinks(env, record)}</p>
      <p><strong>Completion evidence:</strong> ${evidenceLinks(record)}</p>
      <p><strong>Publication:</strong> ${escapeHtml(record.publication.lifecycle)} · ${escapeHtml(record.publication.disclosureReview)}</p>
      <p><a href="${escapeHtml(urls.api)}">Exact exercise JSON</a></p>
    </details>
    <p class="subtle">${escapeHtml(record.publicNote)}</p>
  </article>`;
}

function incidentCard(record: PublishedIncident): string {
  const anchor = assuranceAnchor(record.id);
  const urls = assuranceRecordUrls('incidents', record.id);
  if (!urls.api) throw new Error(`Incident ${record.id} has no canonical exact-record API route.`);

  return `<article class="info-card" id="${escapeHtml(anchor)}">
    <p class="eyebrow">Established incident · <a href="#${escapeHtml(anchor)}"><code>${escapeHtml(record.id)}</code></a></p>
    <h3>${escapeHtml(record.title)}</h3>
    <p><span class="status-pill">${escapeHtml(titleCase(record.status))}</span></p>
    <p>${escapeHtml(record.summary)}</p>
    <details>
      <summary>Trace the incident</summary>
      <p><strong>Categories:</strong> ${record.categories.map((category) => escapeHtml(titleCase(category))).join(', ') || 'None recorded.'}</p>
      <p><strong>Risks:</strong> ${relationshipLinks(assuranceRelationshipIds(record.relationships, 'risks'))}</p>
      <p><strong>Controls:</strong> ${relationshipLinks(assuranceRelationshipIds(record.relationships, 'controls'))}</p>
      <p><strong>Evidence:</strong> ${relationshipLinks(assuranceRelationshipIds(record.relationships, 'evidence'))}</p>
      <p><strong>Publication:</strong> ${escapeHtml(record.publication.lifecycle)} · ${escapeHtml(record.publication.disclosureReview)}</p>
      <p><a href="${escapeHtml(urls.api)}">Exact incident JSON</a></p>
    </details>
  </article>`;
}

function postureCards(
  incidents: PublishedIncident[],
  exercises: PublishedExercise[],
): string {
  const counts = deriveIncidentCounts(incidents, exercises);
  const nextExercise = exercises
    .filter((record) => record.status === 'planned' && record.dueDate)
    .slice()
    .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? ''))[0];

  return `<div class="info-grid">
    <article class="info-card"><p class="eyebrow">Established incidents</p><h2>${counts.actualIncidents}</h2><p>Disclosure-safe incident records currently retained in the public register.</p></article>
    <article class="info-card"><p class="eyebrow">Response exercises</p><h2>${counts.exercises}</h2><p>${counts.plannedExercises} planned · ${counts.completedExercises} completed or in follow-up.</p></article>
    <article class="info-card"><p class="eyebrow">Next exercise</p><h2>${nextExercise?.dueDate ? escapeHtml(nextExercise.dueDate) : 'None scheduled'}</h2><p>${nextExercise ? `<a href="#${escapeHtml(assuranceAnchor(nextExercise.id))}"><code>${escapeHtml(nextExercise.id)}</code></a> · ${escapeHtml(nextExercise.exerciseType)}` : 'No planned public exercise currently has a due date.'}</p></article>
  </div>`;
}

export function incidentsContent(env: Env): PageContent {
  const incidents = listPublishedAssuranceRecords('incidents');
  const exercises = listPublishedAssuranceRecords('exercises');
  const incidentCards = incidents.map(incidentCard).join('');
  const exerciseCards = exercises.map((record) => exerciseCard(env, record)).join('');

  return pageContent(env, 'Incidents & Exercises', `
  <section class="page-header assurance-header">
    <h1>Incident response readiness you can inspect.</h1>
    <p class="lede">See the current public incident posture first, then inspect planned or completed response exercises and trace them into the assurance record.</p>
    <div class="page-tools">
      <a class="button button-primary" href="${escapeHtml(EXERCISE_API_ROUTE)}">Exercise JSON</a>
      <a class="text-link" href="${escapeHtml(INCIDENT_API_ROUTE)}">Incident JSON</a>
      <a class="text-link" href="${escapeHtml(SECURITY_ROUTE)}">Security reporting</a>
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/incidents-page.ts'))}">Route source</a>
      ${referenceDetails([
        { label: 'Incident register', href: sourceUrl(env, 'docs/governance/registers/INCIDENT-REGISTER.md') },
        { label: 'Incident dataset', href: sourceUrl(env, assuranceDatasetSource('incidents')) },
        { label: 'Exercise dataset', href: sourceUrl(env, assuranceDatasetSource('exercises')) },
        { label: 'Incident schema', href: sourceUrl(env, assuranceDatasetSchema('incidents')) },
        { label: 'Exercise schema', href: sourceUrl(env, assuranceDatasetSchema('exercises')) },
        { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
      ])}
    </div>
  </section>

  <section aria-labelledby="incident-posture-heading">
    <div class="section-head"><h2 id="incident-posture-heading">Current response posture</h2><span>Incidents and simulations stay distinct</span></div>
    ${postureCards(incidents, exercises)}
  </section>

  <section aria-labelledby="response-exercises-heading">
    <div class="section-head"><h2 id="response-exercises-heading">Response exercises</h2><span>Readiness work with permanent EX-* anchors</span></div>
    <p class="subtle">Exercises are simulations, not historical incidents. Planned exercises become completion evidence only after the activity is actually performed and reviewed.</p>
    <div class="info-grid">${exerciseCards || '<article class="info-card"><h3>No response exercises published</h3><p>No disclosure-safe exercise records are currently retained.</p></article>'}</div>
  </section>

  <section aria-labelledby="actual-incidents-heading">
    <div class="section-head"><h2 id="actual-incidents-heading">Actual incidents</h2><span>Permanent INC-* records only when established</span></div>
    ${incidentCards || `<div class="assurance-notice"><p><strong>No established public incident records are in the current retained register.</strong> ${escapeHtml(incidentQualifications.incidents ?? '')}</p><p><a href="${escapeHtml(INCIDENT_API_ROUTE)}">Inspect the incident JSON collection →</a></p></div>`}
  </section>

  <details class="info-card">
    <summary>What belongs on this page?</summary>
    <p><strong>Incidents</strong> are established operational events with permanent <code>INC-*</code> records. <strong>Exercises</strong> are simulated readiness activities with <code>EX-*</code> records. Vulnerabilities and public advisories use the separate security-reporting lifecycle.</p>
  </details>`, {
    canonicalPath: INCIDENT_ROUTE,
    description: 'Instructional public incident-response assurance showing retained incident posture, response exercises, machine-readable records, and traceable readiness evidence.',
  });
}
