import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

const CONCERNS_ROUTE = routeUrl('assurance.concerns');
const issueUrl = (env: Env, template: string) => `${repoUrl(env)}/issues/new?template=${encodeURIComponent(template)}`;
const privateReportUrl = (env: Env) => `${repoUrl(env)}/security/advisories/new`;

export function concernsContent(env: Env): PageContent {
  const cards = [
    ['Bug', 'Something behaves incorrectly and the report contains no sensitive security information.', issueUrl(env, 'bug.yml')],
    ['Feature request', 'A capability or workflow should be added or improved.', issueUrl(env, 'feature.yml')],
    ['Other concern', 'Accessibility, AI/MCP, governance, documentation, or another non-sensitive concern needs review.', issueUrl(env, 'concern.yml')],
  ].map(([title, description, href]) => `<article class="info-card">
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(description)}</p>
    <p><a href="${escapeHtml(href)}">Open public issue form →</a></p>
  </article>`).join('');

  return pageContent(env, 'Report a Concern', `
  <section class="page-header assurance-header">
    <h1>Choose the right intake path.</h1>
    <p class="lede">Use a structured GitHub form for non-sensitive concerns. That issue becomes the public starting point for triage, controlled change, validation, and release history.</p>
    <p class="assurance-notice"><strong>Public intake only:</strong> remove credentials, personal data, private infrastructure details, and unreleased exploit information. GitHub sign-in is required to submit an issue.</p>
    <div class="page-tools">
      <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/concerns-page.ts'))}">Route source</a>
      ${referenceDetails([
        { label: 'Issue form configuration', href: sourceUrl(env, '.github/ISSUE_TEMPLATE/config.yml') },
        { label: 'Communication and concern governance', href: sourceUrl(env, 'docs/governance/COMPETENCE-AWARENESS-COMMUNICATION.md') },
        { label: 'Change management', href: sourceUrl(env, 'docs/CHANGE-MANAGEMENT.md') },
      ])}
    </div>
  </section>

  <section aria-labelledby="public-intake-heading">
    <div class="section-head"><h2 id="public-intake-heading">Public non-sensitive intake</h2><span>GitHub issue forms</span></div>
    <div class="info-grid">${cards}</div>
  </section>

  <section aria-labelledby="concern-lifecycle-heading">
    <div class="section-head"><h2 id="concern-lifecycle-heading">What happens next</h2><span>Concern → controlled work</span></div>
    <div class="info-grid">
      <article class="info-card"><p class="eyebrow">1 · Submitted</p><h3>Structured issue</h3><p>The report captures the problem, expected outcome, and reproducible context without sensitive material.</p></article>
      <article class="info-card"><p class="eyebrow">2 · Triaged</p><h3>Scope and severity</h3><p>The concern is reviewed, classified, and either routed to controlled work or redirected to the appropriate private process.</p></article>
      <article class="info-card"><p class="eyebrow">3 · Controlled change</p><h3>DEMO change and PR</h3><p>Accepted work is implemented under the repository change-management contract with reviewable source and tests.</p></article>
      <article class="info-card"><p class="eyebrow">4 · Validated</p><h3>Checks and evidence</h3><p>Required validation proves the change before it is eligible to land.</p></article>
      <article class="info-card"><p class="eyebrow">5 · Released</p><h3>Release history</h3><p>Production changes are deployed from the controlled release process, preserving the issue-to-change history.</p></article>
    </div>
  </section>

  <section class="assurance-notice" aria-labelledby="security-concern-heading">
    <h2 id="security-concern-heading">Security vulnerability or sensitive incident?</h2>
    <p>Do not open a public issue. Use the private security channel so triage and remediation can happen before disclosure.</p>
    <p><a href="${escapeHtml(privateReportUrl(env))}">Open a private security report →</a></p>
  </section>`, {
    canonicalPath: CONCERNS_ROUTE,
    description: 'Structured public intake for non-sensitive WizardGang Architecture Demo bugs, features, accessibility, AI/MCP, governance, and documentation concerns.',
  });
}