import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import {
  listPublishedAssuranceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import {
  assuranceRecordUrlsById,
  complianceQualification,
  deriveComplianceCounts,
} from '../assurance/service';
import { escapeHtml } from '../lib/html';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { pageContent, type PageContent } from '../ui/page';

type ComplianceRecord = PublishedAssuranceRecordMap['compliance'];
type ClaimRecord = PublishedAssuranceRecordMap['claims'];

const CHECKS = [
  {
    id: 'security-controls',
    eyebrow: 'Security controls',
    title: 'ISO/IEC 27001-aligned control evidence',
    explanation: 'Inspect how published security-control claims connect to deployed implementation evidence. Alignment only; no certification is claimed.',
  },
  {
    id: 'ai-boundary',
    eyebrow: 'AI boundary',
    title: 'ISO/IEC 42001-aligned MCP boundary evaluation',
    explanation: 'Execute approved, unknown-method, and invalid-scope cases against the controlled MCP boundary.',
  },
  {
    id: 'traceability',
    eyebrow: 'Traceability',
    title: 'Requirement-to-deployment evidence chain',
    explanation: 'Inspect the public chain from requirement and source through validation, release identity, deployment, and recent operational observation.',
  },
] as const;

function statusClass(value: string): string {
  if (['pass', 'passed'].includes(value)) return 'badge badge-ok';
  if (value === 'partial') return 'badge badge-warn';
  if (['gap', 'failed'].includes(value)) return 'badge badge-down';
  return 'badge';
}

function frameworkRecords(framework: string): ComplianceRecord[] {
  return listPublishedAssuranceRecords('compliance').filter((record) => record.framework === framework);
}

function frameworkPosture(framework: string): string {
  const records = frameworkRecords(framework);
  const counts = deriveComplianceCounts(records);
  return `${counts.byStatus.pass} pass · ${counts.byStatus.partial} partial · ${counts.byStatus.gap} gap · ${counts.byStatus['not-applicable']} not applicable`;
}

function evidenceLinks(ids: string[]): string {
  if (!ids.length) return '<span class="subtle">No published evidence relationship.</span>';
  return ids.slice(0, 4).map((id) => {
    const api = assuranceRecordUrlsById(id).api;
    return api ? `<a href="${escapeHtml(api)}"><code>${escapeHtml(id)}</code></a>` : `<code>${escapeHtml(id)}</code>`;
  }).join(' · ');
}

function complianceEvidence(framework: string, limit = 4): string {
  const records = frameworkRecords(framework).slice(0, limit);
  if (!records.length) return '<p class="subtle">No published records are available for this framework.</p>';
  return `<div class="info-grid">${records.map((record) => {
    const ids = assuranceRelationshipIds(record.relationships, 'evidence') as string[];
    const recordApi = assuranceRecordUrlsById(record.id).api;
    return `<article class="info-card">
      <p class="eyebrow">${escapeHtml(record.reference)}</p>
      <h3>${escapeHtml(record.title)}</h3>
      <p><span class="${statusClass(record.status)}">${escapeHtml(record.status)}</span></p>
      <p><strong>Evidence:</strong> ${evidenceLinks(ids)}</p>
      ${recordApi ? `<p><a href="${escapeHtml(recordApi)}">Inspect record JSON</a></p>` : ''}
    </article>`;
  }).join('')}</div>`;
}

function traceabilityEvidence(limit = 4): string {
  const claims = listPublishedAssuranceRecords('claims').slice(0, limit) as ClaimRecord[];
  if (!claims.length) return '<p class="subtle">No published assurance claims are available.</p>';
  return `<div class="info-grid">${claims.map((claim) => {
    const ids = assuranceRelationshipIds(claim.relationships, 'evidence') as string[];
    return `<article class="info-card">
      <p class="eyebrow">${escapeHtml(claim.area)}</p>
      <h3>${escapeHtml(claim.title)}</h3>
      <p>${escapeHtml(claim.statement)}</p>
      <p><strong>Evidence:</strong> ${evidenceLinks(ids)}</p>
    </article>`;
  }).join('')}</div>`;
}

function assuranceCheck(check: typeof CHECKS[number], posture: string, evidence: string): string {
  return `<section class="assurance-check" id="${check.id}" aria-labelledby="${check.id}-heading">
    <div class="section-head"><div><p class="eyebrow">${check.eyebrow}</p><h2 id="${check.id}-heading">${check.title}</h2></div><span class="badge">${escapeHtml(posture)}</span></div>
    <p>${escapeHtml(check.explanation)}</p>
    <details class="implementation-notes"><summary>Inspect focused evidence</summary>${evidence}</details>
  </section>`;
}

function accessibilityCheck(): string {
  const posture = frameworkPosture('wcag-2.2');
  return `<section class="assurance-check" id="accessibility-posture" aria-labelledby="accessibility-posture-heading">
    <div class="section-head"><div><p class="eyebrow">Accessibility posture</p><h2 id="accessibility-posture-heading">Bounded WCAG 2.2 evidence</h2></div><span class="badge">${escapeHtml(posture)}</span></div>
    <p>Inspect the published WCAG 2.2-aligned evidence used by this demo. This is an engineering-alignment statement, not an accessibility certification.</p>
    <a class="button-primary" href="#accessibility-evidence">Inspect accessibility evidence</a>
    <details class="implementation-notes" id="accessibility-evidence"><summary>Focused WCAG evidence</summary>${complianceEvidence('wcag-2.2', 6)}</details>
  </section>`;
}

export async function minimalAssuranceContent(_request: Request, env: Env): Promise<PageContent> {
  const claims = listPublishedAssuranceRecords('claims');
  const evidence = listPublishedAssuranceRecords('evidence');
  const securityPosture = frameworkPosture('iso-27001');
  const aiPosture = frameworkPosture('iso-42001');
  const traceabilityPosture = `${claims.length} published claims · ${evidence.length} evidence records`;

  const body = `<section class="page-header assurance-header">
    <h1>Assurance</h1>
    <p class="lede">Verify four bounded engineering claims without navigating the internal management-system inventory.</p>
    <p class="assurance-notice">${escapeHtml(complianceQualification)} No ISO/IEC or WCAG certification is claimed. Sensitive vulnerability reporting remains on <a href="${escapeHtml(routeUrl('security.index'))}">Security</a>.</p>
  </section>
  <nav class="link-row" aria-label="Assurance checks">
    <a href="#security-controls">Security controls</a>
    <a href="#ai-boundary">AI boundary</a>
    <a href="#traceability">Traceability</a>
    <a href="#accessibility-posture">Accessibility posture</a>
  </nav>
  ${assuranceCheck(CHECKS[0], securityPosture, complianceEvidence('iso-27001'))}
  ${assuranceCheck(CHECKS[1], aiPosture, complianceEvidence('iso-42001'))}
  ${assuranceCheck(CHECKS[2], traceabilityPosture, traceabilityEvidence())}
  ${accessibilityCheck()}`;

  return pageContent(env, 'Assurance', body, {
    routeId: 'assurance.index',
    canonicalPath: routeUrl('assurance.index'),
    description: 'Four focused assurance checks for security controls, AI/MCP boundary behavior, traceability, and accessibility posture.',
  });
}
