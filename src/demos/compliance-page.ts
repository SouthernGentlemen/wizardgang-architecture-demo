import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

const posture = [
  ['WCAG 2.2', 'Aligned / supported, uncertified', '/accessibility'],
  ['ISO/IEC 27001', 'Aligned, uncertified', '/governance#iso-27001'],
  ['ISO/IEC 42001', 'Aligned, uncertified', '/governance#iso-42001'],
] as const;

const evidence = [
  ['WCAG 2.2', 'Accessible and intentionally broken behavior comparisons, partial automated analysis, and a manual verification matrix.', [['Accessibility demonstration', '/accessibility']]],
  ['Internationalization', 'Locale, direction, fallback, plural, number, date, and currency behavior relevant to accessible interfaces.', [['Internationalization demonstration', '/i18n']]],
  ['ISO/IEC 27001 controls', 'Inspectable access, secure-development, change, logging, secrets, availability, and evidence mappings.', [['Governance controls', '/governance#iso-27001'], ['Change evidence', '/git']]],
  ['ISO/IEC 42001 controls', 'Executable evaluation of approved, unknown-method, and invalid-scope cases at the controlled AI interface boundary.', [['Governance evaluation', '/governance#iso-42001'], ['MCP boundary', '/mcp']]],
  ['Availability & resilience', 'Scheduled availability history with planned maintenance separated from unexpected dependency failures.', [['Availability history', '/dashboard/uptime']]],
  ['Auditability', 'Bounded public-safe application events and their implementation evidence.', [['Public logs', '/dashboard/logs']]],
  ['Change management', 'Commit, pull request, validation, tag, release, deployment, and runtime traceability.', [['Git & release evidence', '/git']]],
  ['Documentation', 'Repository-native standards, contracts, route maps, operating guidance, and implementation sources.', [['Documentation index', '/dashboard/docs']]],
  ['Operational health', 'Current dependency state, activity, deployment identity, usage telemetry, and cost controls.', [['Operations dashboard', '/dashboard']]],
] as const;

export function renderComplianceDemo(env: Env): Response {
  const postureCards = posture.map(([standard, status, href]) => `<a class="assurance-posture-card" href="${href}">
    <p class="eyebrow">Assurance posture</p>
    <h2>${standard}</h2>
    <strong>${status}</strong>
    <span>Inspect evidence <span aria-hidden="true">→</span></span>
  </a>`).join('');
  const evidenceCards = evidence.map(([area, description, links]) => `<article class="assurance-evidence-card">
    <h3>${area}</h3>
    <p>${description}</p>
    <div class="link-row">${links.map(([label, href]) => `<a href="${href}">${label} <span aria-hidden="true">→</span></a>`).join('')}</div>
  </article>`).join('');

  return shell(env, 'Compliance & Assurance', `
  <section class="page-header assurance-header">
    <p class="eyebrow"><a href="/#delivery-governance">Delivery &amp; Governance</a> / /compliance</p>
    <h1>Compliance evidence, not a badge.</h1>
    <p class="lede">This index connects assurance statements to the working controls and evidence that already have canonical owners across the architecture demo.</p>
    <p class="assurance-notice"><strong>Scope:</strong> public architecture demonstration. These are alignment and support statements, not third-party certifications.</p>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/compliance.ts'))}">Route source</a>${referenceDetails([
      { label: 'Rendered assurance index', href: sourceUrl(env, 'src/demos/compliance-page.ts') },
      { label: 'Evidence map', href: sourceUrl(env, 'docs/EVIDENCE.md') },
      { label: 'Route contract', href: sourceUrl(env, 'docs/ROUTES.md') },
    ])}</div>
  </section>
  <section aria-labelledby="posture-heading">
    <div class="section-head"><h2 id="posture-heading">Standards posture</h2><span>Aligned · Uncertified</span></div>
    <div class="assurance-posture-grid">${postureCards}</div>
  </section>
  <section aria-labelledby="evidence-heading">
    <div class="section-head"><h2 id="evidence-heading">Controls &amp; evidence</h2><span>Canonical destinations</span></div>
    <div class="assurance-evidence-grid">${evidenceCards}</div>
  </section>`, {
    activeRoute: '/compliance',
    description: 'Assurance index for WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 alignment evidence across the WizardGang Architecture Demo.',
  });
}
