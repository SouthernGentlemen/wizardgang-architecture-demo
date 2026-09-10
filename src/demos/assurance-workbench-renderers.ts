import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import { assuranceAnchor, assuranceRecordUrls } from '../assurance/service';
import type { PublishedAssuranceRecordMap } from '../assurance/publication';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import type { ReportingRecordPresentation } from '../reporting/presentation';
import type { DemoAction, Env } from '../types';

type ComplianceRecord = PublishedAssuranceRecordMap['compliance'];

export interface AssuranceWorkbenchSectionOptions {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  meta?: string;
  body: string;
}

export function renderAssuranceWorkbenchSection(options: AssuranceWorkbenchSectionOptions): string {
  const headingId = `${options.id}-heading`;
  return `<section id="${escapeHtml(options.id)}" aria-labelledby="${escapeHtml(headingId)}" data-assurance-workbench-section="${escapeHtml(options.id)}">
    <div class="section-head"><div><p class="eyebrow">${escapeHtml(options.eyebrow)}</p><h2 id="${escapeHtml(headingId)}">${escapeHtml(options.title)}</h2></div>${options.meta ? `<span>${escapeHtml(options.meta)}</span>` : ''}</div>
    <p class="subtle">${escapeHtml(options.summary)}</p>
    ${options.body}
  </section>`;
}

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function complianceStatusClass(value: string): string {
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

function complianceStatusLabel(value: string): string {
  if (value === 'not-applicable') return 'Not applicable';
  if (value === 'not-observed') return 'Not observed';
  return titleCase(value);
}

function complianceEvidenceIds(record: ComplianceRecord): string[] {
  return assuranceRelationshipIds(record.relationships, 'evidence');
}

function complianceRecordEvidence(record: ComplianceRecord): string {
  const links = complianceEvidenceIds(record).map((id) => {
    const href = assuranceRecordUrls('evidence', id).html;
    if (!href) throw new Error(`Evidence record ${id} has no canonical HTML route.`);
    return `<li><a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a></li>`;
  }).join('');
  return links ? `<ul>${links}</ul>` : '<p class="subtle">No public evidence relationship is registered.</p>';
}

function complianceRecordNarrative(record: ComplianceRecord): string {
  if (record.implementation) return escapeHtml(record.implementation);
  if (record.rationale) return escapeHtml(record.rationale);
  return `The public assurance dataset records this item as ${escapeHtml(complianceStatusLabel(record.status))}. Inspect the linked evidence and source record for the implementation proof behind that posture.`;
}

function complianceRecordGaps(record: ComplianceRecord): string {
  if (!record.gaps?.length) return '';
  return `<div><strong>Open gaps</strong><ul>${record.gaps.map((gap) => `<li>${escapeHtml(gap)}</li>`).join('')}</ul></div>`;
}

function complianceRecordValidation(record: ComplianceRecord): string {
  if (!record.validation) return '';
  return `<p><strong>Validation:</strong> automated ${escapeHtml(record.validation.automated)} · manual ${escapeHtml(record.validation.manual)}</p>`;
}

export function renderComplianceRecordInspector(env: Env, record: ComplianceRecord): string {
  const anchor = assuranceAnchor(record.id);
  const urls = assuranceRecordUrls('compliance', record.id);
  if (!urls.api) throw new Error(`Compliance record ${record.id} has no canonical exact-record API route.`);
  return `<details class="implementation-notes" id="${escapeHtml(anchor)}">
    <summary>
      <span><code>${escapeHtml(record.reference)}</code> · ${escapeHtml(record.title)}</span>
      <span class="${complianceStatusClass(record.status)}">${escapeHtml(complianceStatusLabel(record.status))}</span>
    </summary>
    <p class="eyebrow">${escapeHtml(record.kind)} · ${escapeHtml(record.section)}</p>
    <p><strong>Current implementation:</strong> ${complianceRecordNarrative(record)}</p>
    ${complianceRecordGaps(record)}
    ${complianceRecordValidation(record)}
    <div class="info-card">
      <h4>Evidence</h4>
      ${complianceRecordEvidence(record)}
    </div>
    <details class="implementation-notes">
      <summary>Traceability and source</summary>
      <p><strong>Canonical ID:</strong> <code>${escapeHtml(record.id)}</code></p>
      <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · disclosure review ${escapeHtml(record.publication.disclosureReview)}</p>
      <p><a href="${escapeHtml(urls.api)}">Exact JSON record</a> · <a href="${escapeHtml(sourceUrl(env, record.sourcePath))}">Dataset source</a></p>
    </details>
  </details>`;
}

function normalizedFieldName(value: string): string {
  const leaf = value.split('.').at(-1) ?? value;
  return leaf.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function humanizeFieldName(value: string): string {
  const leaf = value.split('.').at(-1) ?? value;
  const spaced = leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
  return spaced ? `${spaced[0].toUpperCase()}${spaced.slice(1)}` : value;
}

function fieldByName(record: ReportingRecordPresentation, names: readonly string[]) {
  const normalized = new Set(names.map((name) => normalizedFieldName(name)));
  return record.fields.find((field) => normalized.has(normalizedFieldName(field.name)));
}

function recordHeading(record: ReportingRecordPresentation): { title: string; fieldName: string | null } {
  if (record.title && record.title !== record.id) return { title: record.title, fieldName: null };
  const preferred = fieldByName(record, [
    'assetClass',
    'accessClass',
    'supplier',
    'service',
    'configurationItem',
    'system',
    'requirement',
    'obligation',
    'activity',
    'objective',
    'description',
    'name',
    'title',
  ]);
  if (preferred) return { title: preferred.value, fieldName: preferred.name };
  const fallback = record.fields.find((field) => ![
    'view', 'order', 'status', 'reviewstate', 'state', 'owner', 'primaryowner',
  ].includes(normalizedFieldName(field.name)));
  return fallback ? { title: fallback.value, fieldName: fallback.name } : { title: record.id, fieldName: null };
}

function recordStatus(record: ReportingRecordPresentation) {
  if (record.status) return { value: record.status, fieldName: null as string | null };
  const field = fieldByName(record, ['status', 'reviewState', 'state', 'result', 'posture', 'progress']);
  return field ? { value: field.value, fieldName: field.name } : null;
}

function reportingStatusClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (/\b(met|complete|completed|approved|current|available|pass|passed)\b/.test(normalized)) return 'badge badge-ok';
  if (/\b(partial|planned|pending|review|warning)\b/.test(normalized) || normalized.includes('in progress')) return 'badge badge-warn';
  if (/\b(gap|failed|fail|overdue|expired|unavailable)\b/.test(normalized)) return 'badge badge-down';
  return 'badge';
}

export function renderGovernanceRecordInspector(
  record: ReportingRecordPresentation,
  registerLabel: string,
): string {
  const heading = recordHeading(record);
  const status = recordStatus(record);
  const omitted = new Set([
    'view',
    'order',
    ...(heading.fieldName ? [normalizedFieldName(heading.fieldName)] : []),
    ...(status?.fieldName ? [normalizedFieldName(status.fieldName)] : []),
  ]);
  const details = record.fields
    .filter((field) => !omitted.has(normalizedFieldName(field.name)))
    .slice(0, 6)
    .map((field) => `<p><strong>${escapeHtml(humanizeFieldName(field.name))}:</strong> ${escapeHtml(field.value)}</p>`)
    .join('');
  const relationships = record.relationships.length
    ? `<p><strong>Relationships:</strong> ${record.relationships.map((relationship) => `${escapeHtml(relationship.label)} — ${relationship.targets.map(escapeHtml).join(', ')}`).join('; ')}</p>`
    : '';
  return `<details class="implementation-notes" id="${escapeHtml(record.id)}">
    <summary><span><code>${escapeHtml(record.id)}</code> · ${escapeHtml(heading.title)}</span>${status ? `<span class="${reportingStatusClass(status.value)}">${escapeHtml(status.value)}</span>` : ''}</summary>
    <p class="eyebrow">${escapeHtml(registerLabel)}</p>
    ${details}${relationships}
  </details>`;
}

export interface GovernanceActionsOptions {
  headingId?: string;
  heading?: string;
  intro?: string;
}

export function renderGovernanceActions(actions: DemoAction[], options: GovernanceActionsOptions = {}): string {
  const cards = actions.map((action, index) => `<article class="action-card" id="${escapeHtml(action.id ?? `governance-action-${index + 1}`)}">
    <p class="eyebrow">Live governance check</p>
    <h3>${escapeHtml(action.title ?? action.label)}</h3>
    ${action.description ? `<p>${escapeHtml(action.description)}</p>` : ''}
    <div class="request-line"><span class="http-method http-${action.method.toLowerCase()}">${escapeHtml(action.method)}</span><code>${escapeHtml(action.path)}</code></div>
    <button class="button-primary" type="button" data-governance-run="${index}">${escapeHtml(action.label)}</button>
    <pre class="action-output" aria-live="polite" data-governance-output="${index}" hidden></pre>
  </article>`).join('');
  const actionGrid = `<div class="action-grid">${cards}</div>`;
  const body = options.heading
    ? `<section aria-labelledby="${escapeHtml(options.headingId ?? 'governance-demonstrations-heading')}">
      <div class="section-head"><h2 id="${escapeHtml(options.headingId ?? 'governance-demonstrations-heading')}">${escapeHtml(options.heading)}</h2><span>${actions.length} live checks</span></div>
      ${options.intro ? `<p class="subtle">${escapeHtml(options.intro)}</p>` : ''}
      ${actionGrid}
    </section>`
    : actionGrid;
  return `${body}
  <script>
  (() => {
    const actions = ${JSON.stringify(actions)};
    document.querySelectorAll('[data-governance-run]').forEach((button) => button.addEventListener('click', async () => {
      const index = Number(button.dataset.governanceRun);
      const action = actions[index];
      const output = document.querySelector('[data-governance-output="' + index + '"]');
      if (!action || !output) return;
      output.hidden = false;
      output.textContent = 'Running…';
      try {
        const response = await fetch(action.path, {
          method: action.method,
          ...(action.body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(action.body) })
        });
        const contentType = response.headers.get('content-type') || '';
        const result = contentType.includes('application/json') ? await response.json() : await response.text();
        output.textContent = response.status + ' ' + response.statusText + '\\n\\n' + (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      } catch (error) {
        output.textContent = String(error);
      }
    }));
  })();
  </script>`;
}
