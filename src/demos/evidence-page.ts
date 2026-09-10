import {
  assuranceAnchor,
  assuranceDatasetSource,
  assuranceRecordUrlsById,
} from '../assurance/service';
import {
  assuranceCollectionApiRoute,
  assuranceHtmlRoute,
  assuranceRegistryApiRoute,
} from '../assurance/routes';
import { FRESHNESS_SEMANTICS } from '../assurance/presentation';
import {
  presentedPublishedEvidenceRecords,
  type PresentedPublishedEvidence,
} from '../assurance/publication';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import type { Env } from '../types';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';
import { routeUrl } from '../routing/application-routes';

const EVIDENCE_ROUTE = assuranceHtmlRoute('evidence');
const EVIDENCE_API_ROUTE = assuranceCollectionApiRoute('evidence');
const ASSURANCE_API_ROUTE = assuranceRegistryApiRoute();

const KIND_LABELS: Readonly<Record<string, string>> = {
  source: 'Source',
  'governance-record': 'Governance',
  test: 'Test',
  workflow: 'Workflow',
  'live-route': 'Live',
};

const RELATIONSHIP_GROUPS = [
  { key: 'iso27001', label: 'ISO 27001' },
  { key: 'iso42001', label: 'ISO 42001' },
  { key: 'wcag', label: 'WCAG 2.2' },
  { key: 'risk', label: 'Risks' },
  { key: 'claim', label: 'Claims' },
  { key: 'other', label: 'Other assurance' },
] as const;

type RelationshipGroupKey = typeof RELATIONSHIP_GROUPS[number]['key'];

function canonicalEvidenceRoute(route: string): string {
  const parsed = new URL(route, 'https://demo.wizardgang.ai');
  if (parsed.pathname !== routeUrl('demos.index')) return route;
  return `${routeUrl('demos.index')}${parsed.search}${parsed.hash}`;
}

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? titleCase(kind);
}

function relationshipGroup(id: string): RelationshipGroupKey {
  const normalized = id.toUpperCase();
  if (normalized.includes('ISO27001') || normalized.includes('ISO-27001')) return 'iso27001';
  if (normalized.includes('ISO42001') || normalized.includes('ISO-42001')) return 'iso42001';
  if (normalized.startsWith('WCAG')) return 'wcag';
  if (normalized.startsWith('RISK') || normalized.startsWith('RSK')) return 'risk';
  if (normalized.startsWith('CLAIM') || normalized.startsWith('CLM')) return 'claim';
  return 'other';
}

function relationshipSummary(record: PresentedPublishedEvidence): string {
  if (!record.usedBy.length) return 'No public assurance record currently references this evidence.';
  const counts = new Map<RelationshipGroupKey, number>();
  for (const id of record.usedBy) {
    const group = relationshipGroup(id);
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return RELATIONSHIP_GROUPS
    .filter(({ key }) => counts.has(key))
    .map(({ key, label }) => `${escapeHtml(label)} (${counts.get(key)})`)
    .join(' · ');
}

function relationshipFrameworks(record: PresentedPublishedEvidence): string[] {
  const frameworks = new Set<string>();
  for (const id of record.usedBy) {
    const group = relationshipGroup(id);
    if (group === 'iso27001' || group === 'iso42001' || group === 'wcag') frameworks.add(group);
  }
  return [...frameworks];
}

function renderLocator(record: PresentedPublishedEvidence): string {
  if (record.resolved.kind === 'route') {
    const route = canonicalEvidenceRoute(record.resolved.route);
    return `<a href="${escapeHtml(route)}"><code>${escapeHtml(route)}</code></a>`;
  }
  if (record.resolved.url) {
    return `<a href="${escapeHtml(record.resolved.url)}"><code>${escapeHtml(record.resolved.repositoryPath)}</code></a><span class="subtle"> · ${escapeHtml(record.resolved.revision ?? '')}</span>`;
  }
  return `<code>${escapeHtml(record.resolved.repositoryPath)}</code><span class="subtle"> · deployed commit not supplied</span>`;
}

function usedByLinks(record: PresentedPublishedEvidence): string {
  if (!record.usedBy.length) return 'No public assurance record currently references this evidence.';
  return record.usedBy.map((id) => {
    const href = assuranceRecordUrlsById(id).html;
    return href ? `<a href="${escapeHtml(href)}"><code>${escapeHtml(id)}</code></a>` : `<code>${escapeHtml(id)}</code>`;
  }).join(', ');
}

function observationLine(record: PresentedPublishedEvidence): string {
  if (!record.observation) return '';
  const observedAt = record.observation.observedAt
    ? ` · observed <time datetime="${escapeHtml(record.observation.observedAt)}">${escapeHtml(record.observation.observedAt)}</time>`
    : '';
  const validUntil = record.observation.validUntil
    ? ` · valid until <time datetime="${escapeHtml(record.observation.validUntil)}">${escapeHtml(record.observation.validUntil)}</time>`
    : '';
  return `<p><strong>Observed state:</strong> ${escapeHtml(titleCase(record.observation.state))}${observedAt}${validUntil}</p>`;
}

export function evidenceContent(request: Request, env: Env): PageContent {
  const origin = new URL(request.url).origin;
  const records = presentedPublishedEvidenceRecords(env, origin);
  const kindCounts = new Map<string, number>();
  for (const record of records) kindCounts.set(record.kind, (kindCounts.get(record.kind) ?? 0) + 1);
  const kindSummary = Object.keys(KIND_LABELS)
    .filter((kind) => kindCounts.has(kind))
    .map((kind) => `${kindLabel(kind)} ${kindCounts.get(kind)}`)
    .join(' · ');
  const observationBoundCount = records.filter((record) => record.freshness.policy === 'observation-bound').length;

  const freshnessCards = Object.entries(FRESHNESS_SEMANTICS).map(([policy, semantics]) => `<article class="assurance-evidence-card">
    <p class="eyebrow">${escapeHtml(policy)}</p>
    <h3>${escapeHtml(semantics.scope)}</h3>
    <p>${escapeHtml(semantics.meaning)}</p>
  </article>`).join('');

  const evidenceCards = records.map((record) => {
    const canonicalRoute = record.resolved.kind === 'route' ? canonicalEvidenceRoute(record.resolved.route) : '';
    const frameworks = relationshipFrameworks(record);
    const searchable = [
      record.id,
      record.kind,
      kindLabel(record.kind),
      record.title,
      record.description,
      record.freshness.policy,
      record.freshness.scope,
      record.publication.lifecycle,
      record.publication.disclosureReview,
      record.observation?.state ?? '',
      ...record.usedBy,
      ...frameworks,
      record.locator.repositoryPath ?? '',
      canonicalRoute,
    ].join(' ').toLowerCase();
    return `<article class="assurance-evidence-card" id="${escapeHtml(assuranceAnchor(record.id))}" data-evidence-record data-kind="${escapeHtml(record.kind)}" data-freshness="${escapeHtml(record.freshness.policy)}" data-frameworks="${escapeHtml(frameworks.join(' '))}" data-search="${escapeHtml(searchable)}">
      <p class="eyebrow">${escapeHtml(record.id)}</p>
      <h3>${escapeHtml(record.title)}</h3>
      <p class="subtle">${escapeHtml(kindLabel(record.kind))} · ${escapeHtml(titleCase(record.freshness.policy))} · ${escapeHtml(titleCase(record.publication.lifecycle))} · ${escapeHtml(titleCase(record.publication.disclosureReview))}</p>
      <p>${escapeHtml(record.description)}</p>
      <p><strong>Evidence:</strong> ${renderLocator(record)}</p>
      ${observationLine(record)}
      <p class="subtle"><strong>Supports:</strong> ${relationshipSummary(record)}</p>
      <details>
        <summary>Traceability and status</summary>
        <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
        <p><strong>Freshness:</strong> ${escapeHtml(record.freshness.policy)} · ${escapeHtml(record.freshness.scope)}</p>
        <p><strong>Referenced by:</strong> ${usedByLinks(record)}</p>
      </details>
    </article>`;
  }).join('');

  return pageContent(env, 'Evidence Registry', `
  <section class="page-header assurance-header">
    <h1>Evidence you can inspect.</h1>
    <p class="lede">Find the source code, tests, governance records, workflows, and live observations that support public assurance claims. Open the evidence first; expand traceability only when you need it.</p>
    <div class="page-tools">
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/evidence-page.ts'))}">Route source</a>
      <a class="text-link" href="${escapeHtml(EVIDENCE_API_ROUTE)}">Evidence JSON</a>
      <a class="text-link" href="${escapeHtml(ASSURANCE_API_ROUTE)}">Assurance API</a>
      ${referenceDetails([
        { label: 'Canonical assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
        { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
        { label: 'Canonical evidence dataset', href: sourceUrl(env, assuranceDatasetSource('evidence')) },
        { label: 'Assurance guide', href: sourceUrl(env, 'docs/ASSURANCE.md') },
      ])}
    </div>
  </section>
  <section id="traceability" aria-labelledby="registry-heading">
    <div class="section-head"><h2 id="registry-heading">Evidence registry</h2><span>${records.length} public records</span></div>
    <p class="assurance-notice"><strong>${records.length} evidence records</strong> · ${escapeHtml(kindSummary)} · ${observationBoundCount} require current observation.</p>
    <label for="evidence-search"><strong>Search evidence</strong></label>
    <input id="evidence-search" data-evidence-search type="search" inputmode="search" autocomplete="off" placeholder="ID, title, framework, path, or route…" aria-describedby="evidence-search-status" style="display:block;width:min(720px,100%);min-height:48px;margin:.55rem 0 1rem;padding:.75rem .9rem;border:1px solid var(--line);background:var(--panel);color:var(--paper);font:inherit">
    <div class="link-row" data-evidence-filters style="align-items:flex-end;gap:.75rem;flex-wrap:wrap;margin-bottom:1rem">
      <label><strong>Type</strong><select data-evidence-kind style="display:block;min-height:44px;margin-top:.35rem;padding:.55rem .7rem;border:1px solid var(--line);background:var(--panel);color:var(--paper);font:inherit"><option value="">All types</option><option value="source">Source</option><option value="governance-record">Governance</option><option value="test">Test</option><option value="workflow">Workflow</option><option value="live-route">Live</option></select></label>
      <label><strong>Framework</strong><select data-evidence-framework style="display:block;min-height:44px;margin-top:.35rem;padding:.55rem .7rem;border:1px solid var(--line);background:var(--panel);color:var(--paper);font:inherit"><option value="">All frameworks</option><option value="iso27001">ISO 27001</option><option value="iso42001">ISO 42001</option><option value="wcag">WCAG 2.2</option></select></label>
      <label><strong>Freshness</strong><select data-evidence-freshness style="display:block;min-height:44px;margin-top:.35rem;padding:.55rem .7rem;border:1px solid var(--line);background:var(--panel);color:var(--paper);font:inherit"><option value="">All freshness</option><option value="release-bound">Release-bound</option><option value="event-driven">Event-driven</option><option value="observation-bound">Observation-bound</option></select></label>
      <button type="button" data-evidence-reset style="min-height:44px;padding:.55rem .8rem">Reset filters</button>
    </div>
    <p class="subtle" id="evidence-search-status" aria-live="polite">${records.length} of ${records.length} evidence records shown.</p>
    <div class="assurance-evidence-grid" data-evidence-list>${evidenceCards}</div>
  </section>
  <section aria-labelledby="freshness-heading">
    <details>
      <summary><strong id="freshness-heading">How evidence freshness works</strong></summary>
      <p class="subtle">Freshness policy describes when evidence must be re-established. Time-sensitive observation state is reported separately.</p>
      <div class="assurance-evidence-grid">${freshnessCards}</div>
    </details>
  </section>
  <script>
  (() => {
    const search = document.querySelector('[data-evidence-search]');
    const kind = document.querySelector('[data-evidence-kind]');
    const framework = document.querySelector('[data-evidence-framework]');
    const freshness = document.querySelector('[data-evidence-freshness]');
    const reset = document.querySelector('[data-evidence-reset]');
    const records = [...document.querySelectorAll('[data-evidence-record]')];
    const status = document.getElementById('evidence-search-status');
    if (!search || !kind || !framework || !freshness || !reset || !status) return;

    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    const selectParam = (control, name) => {
      const value = params.get(name) || '';
      control.value = [...control.options].some((option) => option.value === value) ? value : '';
    };
    selectParam(kind, 'kind');
    selectParam(framework, 'framework');
    selectParam(freshness, 'freshness');

    const apply = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      for (const record of records) {
        const matchesSearch = !query || (record.getAttribute('data-search') || '').includes(query);
        const matchesKind = !kind.value || record.getAttribute('data-kind') === kind.value;
        const matchesFreshness = !freshness.value || record.getAttribute('data-freshness') === freshness.value;
        const recordFrameworks = (record.getAttribute('data-frameworks') || '').split(' ').filter(Boolean);
        const matchesFramework = !framework.value || recordFrameworks.includes(framework.value);
        const matches = matchesSearch && matchesKind && matchesFreshness && matchesFramework;
        record.hidden = !matches;
        if (matches) visible += 1;
      }
      status.textContent = visible + ' of ' + records.length + ' evidence records shown.';
      const next = new URL(location.href);
      const values = [
        ['q', search.value.trim()],
        ['kind', kind.value],
        ['framework', framework.value],
        ['freshness', freshness.value],
      ];
      for (const [name, value] of values) {
        if (value) next.searchParams.set(name, value);
        else next.searchParams.delete(name);
      }
      history.replaceState(null, '', next.pathname + next.search + next.hash);
    };

    search.addEventListener('input', apply);
    kind.addEventListener('change', apply);
    framework.addEventListener('change', apply);
    freshness.addEventListener('change', apply);
    reset.addEventListener('click', () => {
      search.value = '';
      kind.value = '';
      framework.value = '';
      freshness.value = '';
      apply();
      search.focus();
    });
    apply();
  })();
  </script>`, {
    canonicalPath: EVIDENCE_ROUTE,
    description: 'Public assurance evidence catalog with source-first inspection, compact status, framework and freshness filters, and expandable traceability.',
  });
}
