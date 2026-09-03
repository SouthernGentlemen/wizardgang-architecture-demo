import {
  complianceFiltersFromUrl,
  deriveComplianceCounts,
  filterPublicCompliance,
  publicComplianceFrameworks,
  publicComplianceQualification,
  publicComplianceRecords,
  type PublicComplianceFilters,
  type PublicComplianceRecord,
} from '../assurance/registry';
import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

function selected(actual: string | undefined, expected: string): string {
  return actual === expected ? ' selected' : '';
}

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
  return record.evidence.map((id) => `<a href="/evidence#${escapeHtml(id)}"><code>${escapeHtml(id)}</code></a>`).join(', ');
}

function recordDetail(record: PublicComplianceRecord): string {
  if (record.rationale) return `<strong>Rationale:</strong> ${escapeHtml(record.rationale)}`;
  if (record.implementation) return escapeHtml(record.implementation);
  return `${escapeHtml(titleCase(record.kind))} mapped to the canonical public assurance dataset.`;
}

export function renderComplianceDemo(request: Request, env: Env): Response {
  const filters = complianceFiltersFromUrl(new URL(request.url));
  const records = filterPublicCompliance(filters);
  const counts = deriveComplianceCounts(records);
  const query = filterQuery(filters);
  const frameworkCards = publicComplianceFrameworks.map((framework) => {
    const frameworkCounts = deriveComplianceCounts(filterPublicCompliance({ framework: framework.id }));
    return `<a class="assurance-posture-card" href="/compliance?framework=${encodeURIComponent(framework.id)}">
      <p class="eyebrow">Canonical dataset</p>
      <h2>${escapeHtml(framework.label)}</h2>
      <strong>${frameworkCounts.total} records</strong>
      <span>${framework.assessmentDate ? `Assessed ${escapeHtml(framework.assessmentDate)} · ` : ''}Inspect records <span aria-hidden="true">→</span></span>
    </a>`;
  }).join('');

  const rows = records.map((record) => `<tr id="${escapeHtml(record.id)}">
    <th scope="row">
      <a href="#${escapeHtml(record.id)}"><code>${escapeHtml(record.id)}</code></a>
      <strong>${escapeHtml(record.reference)} · ${escapeHtml(record.title)}</strong>
      <span class="subtle">${escapeHtml(record.section)} · ${escapeHtml(record.kind)}</span>
    </th>
    <td>${escapeHtml(record.frameworkLabel)}</td>
    <td><span class="status-pill">${escapeHtml(titleCase(record.status))}</span>${record.level ? ` <span class="status-pill">Level ${escapeHtml(record.level)}</span>` : ''}</td>
    <td>${recordEvidence(record)}</td>
    <td>${recordDetail(record)}</td>
    <td><a href="/v1/assurance/compliance/${encodeURIComponent(record.id)}">JSON</a><br><a href="${escapeHtml(sourceUrl(env, record.sourcePath))}">Dataset source</a></td>
  </tr>`).join('');

  return shell(env, 'Compliance & Assurance', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /compliance</p>
    <h1>Compliance evidence, record by record.</h1>
    <p class="lede">Browse the canonical ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 public assurance datasets through one derived view with stable record anchors and evidence links.</p>
    <p class="assurance-notice"><strong>Scope:</strong> ${escapeHtml(publicComplianceQualification)} WCAG statuses are engineering-evidence states, while ISO statuses reflect the approved public mapping; they are not interchangeable pass/fail claims.</p>
    <div class="page-tools">
      <a class="button button-primary" href="/v1/assurance/compliance${escapeHtml(query)}">View matching JSON</a>
      <a class="text-link" href="/evidence">Search evidence</a>
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/compliance.ts'))}">Route source</a>
      ${referenceDetails([
        { label: 'Rendered compliance registry', href: sourceUrl(env, 'src/demos/compliance-page.ts') },
        { label: 'ISO/IEC 27001 canonical dataset', href: sourceUrl(env, 'assurance/compliance/iso-27001-2022.json') },
        { label: 'ISO/IEC 42001 canonical dataset', href: sourceUrl(env, 'assurance/compliance/iso-42001-2023.json') },
        { label: 'WCAG 2.2 canonical manifest', href: sourceUrl(env, 'assurance/compliance/wcag-2.2.json') },
        { label: 'Assurance guide', href: sourceUrl(env, 'docs/ASSURANCE.md') },
      ])}
    </div>
  </section>
  <section aria-labelledby="framework-heading">
    <div class="section-head"><h2 id="framework-heading">Canonical frameworks</h2><span>${publicComplianceRecords.length} derived records</span></div>
    <div class="assurance-posture-grid">${frameworkCards}</div>
  </section>
  <section class="info-card" aria-labelledby="compliance-filter-heading">
    <h2 id="compliance-filter-heading">Filter records</h2>
    <form method="get" action="/compliance">
      <fieldset>
        <legend class="subtle">Framework, status, and WCAG level</legend>
        <p>
          <label for="compliance-framework">Framework</label>
          <select id="compliance-framework" name="framework">
            <option value="">All frameworks</option>
            <option value="iso-27001"${selected(filters.framework, 'iso-27001')}>ISO/IEC 27001:2022</option>
            <option value="iso-42001"${selected(filters.framework, 'iso-42001')}>ISO/IEC 42001:2023</option>
            <option value="wcag-2.2"${selected(filters.framework, 'wcag-2.2')}>WCAG 2.2</option>
          </select>
          <label for="compliance-status">Status</label>
          <select id="compliance-status" name="status">
            <option value="">All statuses</option>
            <option value="met"${selected(filters.status, 'met')}>Met</option>
            <option value="partial"${selected(filters.status, 'partial')}>Partial</option>
            <option value="gap"${selected(filters.status, 'gap')}>Gap</option>
            <option value="not-applicable"${selected(filters.status, 'not-applicable')}>Not applicable</option>
            <option value="demonstrated"${selected(filters.status, 'demonstrated')}>Demonstrated</option>
            <option value="not-observed"${selected(filters.status, 'not-observed')}>Not observed</option>
          </select>
          <label for="compliance-level">WCAG level</label>
          <select id="compliance-level" name="level" aria-describedby="compliance-level-help">
            <option value="">All levels / ISO records</option>
            <option value="A"${selected(filters.level, 'A')}>A</option>
            <option value="AA"${selected(filters.level, 'AA')}>AA</option>
            <option value="AAA"${selected(filters.level, 'AAA')}>AAA</option>
          </select>
          <button type="submit">Apply filters</button>
          <a href="/compliance">Clear</a>
        </p>
        <p class="subtle" id="compliance-level-help">A level filter matches WCAG criteria only; ISO records do not carry WCAG levels.</p>
      </fieldset>
    </form>
    <p><strong>${counts.total}</strong> matching of ${publicComplianceRecords.length} records · ${counts.byFramework['iso-27001']} ISO 27001 · ${counts.byFramework['iso-42001']} ISO 42001 · ${counts.byFramework['wcag-2.2']} WCAG.</p>
    <p class="subtle">Statuses: ${counts.byStatus.met} met · ${counts.byStatus.partial} partial · ${counts.byStatus.gap} gap · ${counts.byStatus['not-applicable']} not applicable · ${counts.byStatus.demonstrated} demonstrated · ${counts.byStatus['not-observed']} not observed. WCAG levels: ${counts.byLevel.A} A · ${counts.byLevel.AA} AA · ${counts.byLevel.AAA} AAA.</p>
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
    description: 'Filterable canonical ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 public assurance records with stable anchors, derived counts, and evidence links.',
  });
}
