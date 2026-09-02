import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';
import { deriveRiskCounts, filterPublicRisks, publicAssuranceRegistry, riskFiltersFromUrl, type PublicEvidence, type PublicRisk } from '../assurance/registry';

const issueUrl = (env: Env, template: string) => `${repoUrl(env)}/issues/new?template=${encodeURIComponent(template)}`;
const privateReportUrl = (env: Env) => `${repoUrl(env)}/security/advisories/new`;

export function renderSecurity(env: Env): Response {
  const reportUrl = escapeHtml(privateReportUrl(env));
  return shell(env, 'Security', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /security</p>
    <h1>Report security privately.</h1>
    <p class="lede">Use the repository's private vulnerability channel for suspected vulnerabilities, active security incidents, credentials, exploit details, or sensitive infrastructure information.</p>
    <p class="assurance-notice"><strong>Do not open a public issue for sensitive security information.</strong> Public issues, comments, and attachments are visible to everyone.</p>
    <div class="page-tools"><a class="button button-primary" href="${reportUrl}">Open a private security report</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/security.ts'))}">Route source</a>${referenceDetails([
      { label: 'Security policy source', href: sourceUrl(env, 'SECURITY.md') },
      { label: 'Machine-readable security.txt', href: '/.well-known/security.txt' },
      { label: 'Published repository advisories', href: `${repoUrl(env)}/security/advisories` },
    ])}</div>
  </section>
  <div class="info-grid">
    <article class="info-card"><h2>What to report</h2><p>Describe the affected route, component, or release; the observed behavior and impact; reproducible steps; and any safe supporting evidence. Do not include credentials unless the private report specifically requires coordinated handling.</p></article>
    <article class="info-card"><h2>What happens next</h2><p>The report is privately triaged. Maintainers may request clarification, reject a non-security report, accept it into a draft advisory, coordinate a fix, and publish a sanitized advisory after remediation.</p></article>
    <article class="info-card"><h2>Advisories and CVEs</h2><p>A confirmed vulnerability may receive a GitHub Security Advisory and, when eligible, a CVE. Operational incidents use separate permanent incident records; neither classification is automatic.</p></article>
    <article class="info-card"><h2>Non-security concerns</h2><p>Bugs, feature requests, accessibility issues, AI/MCP concerns, and other non-sensitive feedback belong in the public concern intake.</p><p><a href="/governance/concerns">Choose a public concern form →</a></p></article>
  </div>`, {
    activeRoute: '/security',
    cacheControl: 'no-store',
    description: 'Private vulnerability disclosure policy and security reporting path for the WizardGang Architecture Demo.',
  });
}

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
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function evidenceHref(env: Env, evidence: PublicEvidence): string {
  return evidence.locator.route || sourceUrl(env, evidence.locator.repositoryPath || '');
}

function riskFilterQuery(filters: ReturnType<typeof riskFiltersFromUrl>): string {
  const params = new URLSearchParams();
  if (filters.framework) params.set('framework', filters.framework);
  if (filters.status) params.set('status', filters.status);
  if (filters.residualRating) params.set('residual', filters.residualRating);
  const query = params.toString();
  return query ? `?${query}` : '';
}

function selected(actual: string | undefined, expected: string): string {
  return actual === expected ? ' selected' : '';
}

function riskCard(env: Env, risk: PublicRisk, evidenceById: Map<string, PublicEvidence>): string {
  const evidence = risk.evidence.map((id) => evidenceById.get(id)).filter((record): record is PublicEvidence => Boolean(record));
  const evidenceLinks = evidence.map((record) => `<a href="${escapeHtml(evidenceHref(env, record))}">${escapeHtml(record.id)}</a>`).join(', ');
  const controlLinks = risk.controls.map((control) => `<a href="${escapeHtml(sourceUrl(env, control.repositoryPath))}">${escapeHtml(control.reference)}</a>`).join('; ');
  return `<article class="info-card" id="${escapeHtml(risk.id)}">
    <p class="eyebrow"><a href="#${escapeHtml(risk.id)}">${escapeHtml(risk.id)}</a> · ${escapeHtml(titleCase(risk.framework))}</p>
    <h2>${escapeHtml(risk.title)}</h2>
    <p><strong>Inherent:</strong> ${risk.inherent.score} ${escapeHtml(titleCase(risk.inherent.rating))} · <strong>Residual:</strong> ${risk.residual.score} ${escapeHtml(titleCase(risk.residual.rating))}</p>
    <p><strong>Status:</strong> ${escapeHtml(titleCase(risk.status))} · <strong>Treatment direction:</strong> ${escapeHtml(risk.treatment.map(titleCase).join(' / '))}</p>
    <p><strong>Review due:</strong> <time datetime="${escapeHtml(risk.reviewDue)}">${escapeHtml(risk.reviewDue)}</time></p>
    <p><strong>Evidence:</strong> ${evidenceLinks}</p>
    <p><strong>Control references:</strong> ${controlLinks}</p>
  </article>`;
}

export function renderRisks(request: Request, env: Env): Response {
  const filters = riskFiltersFromUrl(new URL(request.url));
  const records = filterPublicRisks(filters);
  const counts = deriveRiskCounts(records);
  const evidenceById = new Map<string, PublicEvidence>(publicAssuranceRegistry.evidence.map((record) => [record.id, record] as const));
  const query = riskFilterQuery(filters);
  const cards = records.map((record) => riskCard(env, record, evidenceById)).join('');
  const results = cards || '<article class="info-card"><h2>No matching risks</h2><p>Change or clear the filters to view the public assurance records.</p></article>';

  return shell(env, 'Risk Assurance', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /governance/risks</p>
    <h1>Review the public risk assurance record.</h1>
    <p class="lede">This disclosure-safe view carries the stable <code>SEC-RISK-*</code> and <code>AI-RISK-*</code> identifiers, current scores, treatment direction, and reviewable evidence/control links from the controlled registers.</p>
    <p class="assurance-notice"><strong>Public assurance boundary:</strong> private treatment actions, risk-owner and acceptance detail, sensitive infrastructure context, and acceptance rationale are intentionally omitted. These records do not claim certification or residual-risk acceptance.</p>
    <div class="page-tools"><a class="button button-primary" href="/v1/assurance/risks${escapeHtml(query)}">View JSON</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/risks.ts'))}">Route source</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'assurance/risks/risks.json'))}">Dataset source</a>${referenceDetails([
      { label: 'Risk schema', href: sourceUrl(env, 'contracts/assurance/risk.schema.json') },
      { label: 'Risk-management method', href: sourceUrl(env, 'docs/governance/RISK-MANAGEMENT.md') },
      { label: 'Assurance validation', href: sourceUrl(env, 'scripts/validate-assurance.mjs') },
    ])}</div>
  </section>
  <section class="info-card" aria-labelledby="risk-filter-heading">
    <h2 id="risk-filter-heading">Filter records</h2>
    <form method="get" action="/governance/risks">
      <p>
        <label>Framework
          <select name="framework">
            <option value="">All</option>
            <option value="security"${selected(filters.framework, 'security')}>Security</option>
            <option value="ai"${selected(filters.framework, 'ai')}>AI</option>
          </select>
        </label>
        <label>Status
          <select name="status">
            <option value="">All</option>
            <option value="treating"${selected(filters.status, 'treating')}>Treating</option>
            <option value="open"${selected(filters.status, 'open')}>Open</option>
          </select>
        </label>
        <label>Residual rating
          <select name="residual">
            <option value="">All</option>
            <option value="critical"${selected(filters.residualRating, 'critical')}>Critical</option>
            <option value="high"${selected(filters.residualRating, 'high')}>High</option>
            <option value="moderate"${selected(filters.residualRating, 'moderate')}>Moderate</option>
            <option value="low"${selected(filters.residualRating, 'low')}>Low</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
        <a href="/governance/risks">Clear</a>
      </p>
    </form>
    <p><strong>${counts.total}</strong> matching records · ${counts.byFramework.security} security · ${counts.byFramework.ai} AI · ${counts.byResidualRating.high} high residual · ${counts.byResidualRating.moderate} moderate residual · ${counts.byResidualRating.low} low residual.</p>
  </section>
  <div class="info-grid">${results}</div>`, {
    activeRoute: '/governance/risks',
    description: 'Disclosure-safe security and AI risk assurance with stable identifiers, evidence links, control references, and derived counts.',
  });
}
