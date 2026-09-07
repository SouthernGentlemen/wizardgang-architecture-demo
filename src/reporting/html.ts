import { escapeHtml } from '../lib/html';
import type {
  ReportingPresentationAvailability,
  ReportingQueryPresentation,
  ReportingRecordPresentation,
} from './presentation';

export interface ReportingHtmlOptions {
  headingId?: string;
  nextHref?: string | null;
}

function availabilityLabel(value: ReportingPresentationAvailability): string {
  if (value === 'empty') return 'No records';
  if (value === 'unconfigured') return 'Not configured';
  if (value === 'rate-limited') return 'Rate limited';
  return value.replaceAll('-', ' ').replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function badgeClass(value: ReportingPresentationAvailability): string {
  if (value === 'available') return 'badge badge-ok';
  if (value === 'empty' || value === 'partial' || value === 'stale' || value === 'rate-limited' || value === 'unconfigured') return 'badge badge-warn';
  return 'badge badge-down';
}

function renderRecord(record: ReportingRecordPresentation): string {
  const metadata = [
    record.recordType ? `Type ${record.recordType}` : '',
    record.status ? `Status ${record.status}` : '',
    record.availability ? `Availability ${availabilityLabel(record.availability)}` : '',
  ].filter(Boolean);
  const fields = record.fields.length
    ? `<dl>${record.fields.map((field) => `<dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd>`).join('')}</dl>`
    : '';
  const relationships = record.relationships.length
    ? `<details><summary>${record.relationshipCount} authorized relationship${record.relationshipCount === 1 ? '' : 's'}</summary><ul>${record.relationships.map((relationship) => `<li><strong>${escapeHtml(relationship.label)}</strong>: ${relationship.targets.map(escapeHtml).join(', ')}</li>`).join('')}</ul></details>`
    : '';
  return `<article class="activity-item"><div><h3>${escapeHtml(record.title)}</h3>${metadata.length ? `<p>${metadata.map(escapeHtml).join(' · ')}</p>` : ''}${fields}${relationships}${record.sourceLink ? `<p><a href="${escapeHtml(record.sourceLink)}">Open source ↗</a></p>` : ''}</div></article>`;
}

export function renderReportingPresentation(
  presentation: ReportingQueryPresentation,
  options: ReportingHtmlOptions = {},
): string {
  const headingId = options.headingId ?? 'reporting-results-heading';
  const sources = presentation.sources.length
    ? `<div class="usage-products" aria-label="Reporting sources">${presentation.sources.map((source) => `<article class="usage-product"><div><p class="eyebrow">${escapeHtml(source.provider)}</p><h3>${escapeHtml(source.label)}</h3><span class="${badgeClass(source.availability)}">${escapeHtml(availabilityLabel(source.availability))}</span></div><p>${source.recordCount} record${source.recordCount === 1 ? '' : 's'} on this page</p><small>${escapeHtml(source.resource)}${source.repository ? ` · ${escapeHtml(source.repository)}` : ''}</small></article>`).join('')}</div>`
    : '';
  const facets = Object.keys(presentation.facets).length
    ? `<details><summary>Facets</summary><ul>${Object.entries(presentation.facets).map(([name, values]) => `<li><strong>${escapeHtml(name)}</strong>: ${Object.entries(values).map(([value, count]) => `${escapeHtml(value)} ${count}`).join(' · ')}</li>`).join('')}</ul></details>`
    : '';
  const empty = presentation.records.length === 0
    ? `<div class="availability-empty">${presentation.availability === 'empty' ? 'No records in this authorized selection.' : `Source ${escapeHtml(availabilityLabel(presentation.availability).toLowerCase())}.`}</div>`
    : '';
  const pagination = presentation.pagination
    ? `<nav class="link-row" aria-label="Reporting pagination"><span>Showing ${presentation.pagination.returned} of ${presentation.pagination.total}</span>${presentation.pagination.nextCursor && options.nextHref ? `<a href="${escapeHtml(options.nextHref)}">Next page →</a>` : presentation.pagination.completeness === 'partial' ? `<span>Partial result${presentation.pagination.partialReason ? ` · ${escapeHtml(presentation.pagination.partialReason)}` : ''}</span>` : ''}</nav>`
    : '';
  return `<section aria-labelledby="${escapeHtml(headingId)}">
    <div class="operations-section-heading"><div><p class="eyebrow">Shared reporting presenter</p><h2 id="${escapeHtml(headingId)}">${escapeHtml(presentation.label)}</h2></div><span class="${badgeClass(presentation.availability)}">${escapeHtml(availabilityLabel(presentation.availability))}</span></div>
    <p>${presentation.count} record${presentation.count === 1 ? '' : 's'} shown · ${presentation.totalAvailable} available in the authorized selection.</p>
    <p class="subtle">Source availability is independent from record status. A current record may come from an unavailable source snapshot, and an available source may contain no records.</p>
    ${sources}${facets}${empty}<div class="activity-list">${presentation.records.map(renderRecord).join('')}</div>${pagination}
  </section>`;
}
