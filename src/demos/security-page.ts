import type { Env } from '../types';
import {
  assuranceAnchor,
  assuranceDatasetSchema,
  assuranceDatasetSource,
  assuranceRecordUrlsById,
  listAssuranceRecords,
  type PublicAdvisory,
} from '../assurance/service';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

const privateReportUrl = (env: Env) => `${repoUrl(env)}/security/advisories/new`;
const publishedAdvisoriesUrl = (env: Env) => `${repoUrl(env)}/security/advisories`;

function advisoryCard(env: Env, advisory: PublicAdvisory): string {
  const advisoryUrl = `${publishedAdvisoriesUrl(env)}/${encodeURIComponent(advisory.id)}`;
  const releases = advisory.fixedReleases
    .map((release) => `<a href="${escapeHtml(`${repoUrl(env)}/releases/tag/${encodeURIComponent(release)}`)}">${escapeHtml(release)}</a>`)
    .join(', ');
  const incidentLinks = advisory.incidentLinks.length === 0
    ? 'None'
    : advisory.incidentLinks.map((id) => {
      const href = assuranceRecordUrlsById(id).html;
      return href ? `<a href="${escapeHtml(href)}">${escapeHtml(id)}</a>` : `<code>${escapeHtml(id)}</code>`;
    }).join(', ');

  return `<article class="info-card" id="${escapeHtml(assuranceAnchor(advisory.id))}">
    <p class="eyebrow">Published advisory · <a href="${escapeHtml(advisoryUrl)}">${escapeHtml(advisory.id)}</a></p>
    <h3>${escapeHtml(advisory.title)}</h3>
    <p><strong>Severity:</strong> ${escapeHtml(advisory.severity)} · <strong>Published:</strong> <time datetime="${escapeHtml(advisory.publishedAt)}">${escapeHtml(advisory.publishedAt)}</time>${advisory.cveId ? ` · <strong>CVE:</strong> ${escapeHtml(advisory.cveId)}` : ''}</p>
    <p>${escapeHtml(advisory.summary)}</p>
    <p><strong>Fixed release${advisory.fixedReleases.length === 1 ? '' : 's'}:</strong> ${releases}</p>
    <p><strong>Incident linkage:</strong> ${incidentLinks}</p>
  </article>`;
}

export function renderSecurity(env: Env): Response {
  const reportUrl = escapeHtml(privateReportUrl(env));
  const advisories = listAssuranceRecords('advisories');
  const advisoryCards = advisories.map((record) => advisoryCard(env, record)).join('');
  const published = advisoryCards || `<article class="info-card">
    <h3>No published advisories are established</h3>
    <p>The public assurance registry currently contains no published security advisory records. This is not a claim that no vulnerabilities, private reports, defects, or security investigations have existed.</p>
  </article>`;

  return shell(env, 'Security', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /security</p>
    <h1>Report security privately.</h1>
    <p class="lede">Use the repository's private vulnerability channel for suspected vulnerabilities, active security incidents, credentials, exploit details, or sensitive infrastructure information.</p>
    <p class="assurance-notice"><strong>Do not open a public issue for sensitive security information.</strong> Private report contents are never exposed through the public assurance registry.</p>
    <div class="page-tools"><a class="button button-primary" href="${reportUrl}">Open a private security report</a><a class="text-link" href="/v1/assurance/advisories">Published advisory JSON</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/security.ts'))}">Route source</a>${referenceDetails([
      { label: 'Security page implementation', href: sourceUrl(env, 'src/demos/security-page.ts') },
      { label: 'Security policy source', href: sourceUrl(env, 'SECURITY.md') },
      { label: 'Machine-readable security.txt', href: '/.well-known/security.txt' },
      { label: 'Published repository advisories', href: publishedAdvisoriesUrl(env) },
      { label: 'Advisory dataset', href: sourceUrl(env, assuranceDatasetSource('advisories')) },
      { label: 'Advisory schema', href: sourceUrl(env, assuranceDatasetSchema('advisories')) },
      { label: 'Common assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
    ])}</div>
  </section>
  <div class="info-grid">
    <article class="info-card"><h2>What to report</h2><p>Describe the affected route, component, or release; the observed behavior and impact; reproducible steps; and any safe supporting evidence. Keep reporter identity, exploit detail, and sensitive infrastructure context inside the private channel.</p></article>
    <article class="info-card"><h2>What happens next</h2><p>The report is privately triaged. Maintainers may request clarification, reject a non-security report, coordinate remediation in a draft GitHub Security Advisory, and publish only disclosure-safe information after a fix is released.</p></article>
    <article class="info-card"><h2>Advisories and CVEs</h2><p>A confirmed vulnerability may receive a GitHub Security Advisory. A CVE is recorded only when the vulnerability is eligible and a real identifier has been assigned; neither a GHSA nor a CVE is fabricated for demonstration purposes.</p></article>
    <article class="info-card"><h2>Non-security concerns</h2><p>Bugs, feature requests, accessibility issues, AI/MCP concerns, and other non-sensitive feedback belong in the public concern intake.</p><p><a href="/governance/concerns">Choose a public concern form →</a></p></article>
  </div>
  <section id="disclosure-lifecycle" class="assurance-section" aria-labelledby="disclosure-lifecycle-heading">
    <div class="section-heading">
      <p class="eyebrow">Coordinated disclosure</p>
      <h2 id="disclosure-lifecycle-heading">Private report → triage → GHSA → fix/release → eligible CVE → public advisory</h2>
    </div>
    <ol class="evidence-list">
      <li><strong>Private report.</strong> Suspected vulnerabilities enter GitHub private vulnerability reporting. Reporter identity, private reproduction detail, attachments, credentials, and sensitive infrastructure information remain private.</li>
      <li><strong>Triage.</strong> Maintainers validate scope and impact, request clarification when needed, and decide whether the report is a security vulnerability. Triage data is not public assurance data.</li>
      <li><strong>GHSA coordination.</strong> A confirmed issue may be managed in a draft GitHub Security Advisory while remediation is coordinated. Draft advisory content remains private.</li>
      <li><strong>Fix and release.</strong> The vulnerability is remediated and a fixed release is published before this registry creates a public advisory record.</li>
      <li><strong>Eligible CVE.</strong> A CVE is requested or associated only when appropriate and is included here only after an actual public identifier is assigned.</li>
      <li><strong>Public advisory.</strong> The sanitized GitHub Security Advisory is published, then its public GHSA identity, severity, summary, fixed release, optional CVE, evidence, and any valid incident linkage may enter the canonical public assurance dataset.</li>
    </ol>
    <p class="assurance-notice"><strong>Incident linkage is optional and never automatic.</strong> An advisory may reference an <code>INC-*</code> record only when that actual incident already exists in the retained incident register. Publishing an advisory does not create an incident record.</p>
  </section>
  <section id="published-advisories" class="assurance-section" aria-labelledby="published-advisories-heading">
    <div class="section-heading">
      <p class="eyebrow">Published disclosure</p>
      <h2 id="published-advisories-heading">Published advisories</h2>
      <p>${advisories.length} public advisory record${advisories.length === 1 ? '' : 's'} in the canonical assurance dataset. Private reports and draft advisories are deliberately excluded.</p>
    </div>
    <div class="info-grid">${published}</div>
  </section>`, {
    activeRoute: '/security',
    cacheControl: 'no-store',
    description: 'Private vulnerability reporting, coordinated disclosure lifecycle, and disclosure-safe published advisory assurance for the WizardGang Architecture Demo.',
  });
}
