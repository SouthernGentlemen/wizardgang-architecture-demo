import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

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
