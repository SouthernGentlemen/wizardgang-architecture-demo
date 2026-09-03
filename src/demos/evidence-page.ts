import {
  FRESHNESS_SEMANTICS,
  assuranceAnchor,
  assuranceDatasetSource,
  assuranceRecordUrlsById,
} from '../assurance/service';
import {
  presentedPublishedEvidenceRecords,
  type PresentedPublishedEvidence,
} from '../assurance/publication';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import type { Env } from '../types';
import { referenceDetails, shell } from '../ui/page';

function titleCase(value: string): string {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function renderLocator(record: PresentedPublishedEvidence): string {
  if (record.resolved.kind === 'route') {
    return `<a href="${escapeHtml(record.resolved.route)}"><code>${escapeHtml(record.resolved.route)}</code></a>`;
  }
  if (record.resolved.url) {
    return `<a href="${escapeHtml(record.resolved.url)}"><code>${escapeHtml(record.resolved.repositoryPath)}</code></a><span class="subtle"> · ${escapeHtml(record.resolved.revision ?? '')}</span>`;
  }
  return `<code>${escapeHtml(record.resolved.repositoryPath)}</code><span class="subtle"> · deployed commit not supplied</span>`;
}

function usedByLinks(record: PresentedPublishedEvidence): string {
  if (!record.usedBy.length) return 'No public claim references this record.';
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

export function renderEvidenceDemo(request: Request, env: Env): Response {
  const origin = new URL(request.url).origin;
  const records = presentedPublishedEvidenceRecords(env, origin);
  const freshnessCards = Object.entries(FRESHNESS_SEMANTICS).map(([policy, semantics]) => `<article class="assurance-evidence-card">
    <p class="eyebrow">${escapeHtml(policy)}</p>
    <h3>${escapeHtml(semantics.scope)}</h3>
    <p>${escapeHtml(semantics.meaning)}</p>
  </article>`).join('');
  const evidenceCards = records.map((record) => {
    const searchable = [
      record.id,
      record.kind,
      record.title,
      record.description,
      record.freshness.policy,
      record.freshness.scope,
      record.freshness.meaning,
      record.publication.lifecycle,
      record.publication.disclosureReview,
      record.observation?.state ?? '',
      ...record.usedBy,
      record.locator.repositoryPath ?? '',
      record.locator.route ?? '',
    ].join(' ').toLowerCase();
    return `<article class="assurance-evidence-card" id="${escapeHtml(assuranceAnchor(record.id))}" data-evidence-record data-search="${escapeHtml(searchable)}">
      <p class="eyebrow">${escapeHtml(record.id)} · ${escapeHtml(record.kind)}</p>
      <h3>${escapeHtml(record.title)}</h3>
      <p>${escapeHtml(record.description)}</p>
      <p><strong>Lifecycle:</strong> ${escapeHtml(record.publication.lifecycle)} · <strong>Disclosure:</strong> ${escapeHtml(record.publication.disclosureReview)}</p>
      <p><strong>Freshness policy:</strong> ${escapeHtml(record.freshness.policy)} · ${escapeHtml(record.freshness.meaning)}</p>
      ${observationLine(record)}
      <p><strong>Used by:</strong> ${usedByLinks(record)}</p>
      <div class="link-row">${renderLocator(record)}</div>
    </article>`;
  }).join('');

  return shell(env, 'Evidence Registry', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /evidence</p>
    <h1>Evidence you can trace.</h1>
    <p class="lede">Search stable public evidence IDs, see which assurance records use them, understand how freshness is determined, and open repository evidence at the exact deployed commit.</p>
    <p class="assurance-notice"><strong>Projection rule:</strong> canonical JSON stores IDs, paths, routes, and policies. Counts, URLs, exact source revisions, lifecycle presentation, time-sensitive observation state, and reverse <code>usedBy</code> relationships are derived when this route or the assurance API is served.</p>
    <div class="page-tools">
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/evidence.ts'))}">Route source</a>
      <a class="text-link" href="/v1/assurance">Assurance API</a>
      <a class="text-link" href="/v1/assurance/evidence">Evidence JSON</a>
      ${referenceDetails([
        { label: 'Common assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
        { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
        { label: 'Canonical evidence dataset', href: sourceUrl(env, assuranceDatasetSource('evidence')) },
        { label: 'Assurance guide', href: sourceUrl(env, 'docs/ASSURANCE.md') },
      ])}
    </div>
  </section>
  <section aria-labelledby="freshness-heading">
    <div class="section-head"><h2 id="freshness-heading">Freshness policy</h2><span>Policy meaning, separate from observed state</span></div>
    <div class="assurance-evidence-grid">${freshnessCards}</div>
  </section>
  <section id="traceability" aria-labelledby="registry-heading">
    <div class="section-head"><h2 id="registry-heading">Public evidence</h2><span>${records.length} derived records</span></div>
    <label for="evidence-search"><strong>Search evidence</strong></label>
    <input id="evidence-search" data-evidence-search type="search" inputmode="search" autocomplete="off" placeholder="ID, title, kind, claim, path, lifecycle, freshness…" aria-describedby="evidence-search-status" style="display:block;width:min(720px,100%);min-height:48px;margin:.55rem 0 1rem;padding:.75rem .9rem;border:1px solid var(--line);background:var(--panel);color:var(--paper);font:inherit">
    <p class="subtle" id="evidence-search-status" aria-live="polite">${records.length} of ${records.length} evidence records shown.</p>
    <div class="assurance-evidence-grid" data-evidence-list>${evidenceCards}</div>
  </section>
  <script>
  (() => {
    const input = document.querySelector('[data-evidence-search]');
    const records = [...document.querySelectorAll('[data-evidence-record]')];
    const status = document.getElementById('evidence-search-status');
    if (!input || !status) return;
    const params = new URLSearchParams(location.search);
    input.value = params.get('q') || '';
    const apply = () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      for (const record of records) {
        const matches = !query || (record.getAttribute('data-search') || '').includes(query);
        record.hidden = !matches;
        if (matches) visible += 1;
      }
      status.textContent = visible + ' of ' + records.length + ' evidence records shown.';
      const next = new URL(location.href);
      if (input.value.trim()) next.searchParams.set('q', input.value.trim());
      else next.searchParams.delete('q');
      history.replaceState(null, '', next.pathname + next.search + next.hash);
    };
    input.addEventListener('input', apply);
    apply();
  })();
  </script>`, {
    activeRoute: '/evidence',
    description: 'Searchable public assurance evidence with lifecycle presentation, exact deployed-commit source resolution, reverse record usage, and freshness policy separated from observed state.',
  });
}
