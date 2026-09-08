import type { Principal } from '../lib/authorization';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import { renderReportingPresentation } from '../reporting/html';
import { presentReportingQuery } from '../reporting/presentation';
import { queryReportingCollection, reportingCollectionInventory } from '../reporting/service';
import { routeUrl } from '../routing/application-routes';
import { cursorLink } from '../routing/cursor-link';
import { secondaryNavigation } from '../routing/navigation';
import type { Env } from '../types';
import { pageContent, type PageContent } from '../ui/page';

export type AssurancePresentation =
  | 'index'
  | 'delivery'
  | 'governance'
  | 'evidence'
  | 'compliance'
  | 'risks'
  | 'incidents'
  | 'concerns';

const presentationLabels: Record<AssurancePresentation, string> = {
  index: 'Assurance',
  delivery: 'Delivery',
  governance: 'Governance',
  evidence: 'Evidence',
  compliance: 'Compliance',
  risks: 'Risks',
  incidents: 'Incidents',
  concerns: 'Concerns',
};

const presentationCollections: Record<AssurancePresentation, string> = {
  index: 'claims',
  delivery: 'evidence',
  governance: 'governance',
  evidence: 'evidence',
  compliance: 'compliance',
  risks: 'risks',
  incidents: 'incidents',
  concerns: 'governance',
};

const indexDescription = 'Public assurance posture, qualifications, and inspectable delivery, governance, evidence, compliance, risk, incident, and concern resources.';

function publicPrincipal(): Principal {
  return { subject: 'public-visitor', authentication: 'anonymous', role: 'viewer', permissions: ['demo:read'] };
}

function requestedLimit(url: URL): number {
  const value = Number(url.searchParams.get('limit') || '25');
  if (!Number.isInteger(value)) return 25;
  return Math.max(1, Math.min(50, value));
}

export function assuranceIndexContent(env: Env): PageContent {
  const assuranceRoute = routeUrl('assurance.index');
  const securityRoute = routeUrl('security.index');
  const qualificationNotice = `WCAG 2.2 / ISO 27001 / ISO 42001 references are alignment targets, not certification claims. Private vulnerability reporting remains at ${securityRoute}.`;
  const cards = secondaryNavigation('assurance.index').map((route) => `<a class="card" href="${escapeHtml(routeUrl(route.id))}">
    <p class="eyebrow">${escapeHtml(route.pattern)}</p>
    <h3>${escapeHtml(route.page!.label)}</h3>
    <p>${escapeHtml(route.page!.summary)}</p>
  </a>`).join('');

  return pageContent(env, 'Assurance', `<section class="page-header assurance-header">
    <h1>Public assurance, one inspectable surface.</h1>
    <p class="lede">Browse delivery, governance, evidence, compliance, risk, incident, and concern records without duplicating the canonical reporting or publication contracts behind them.</p>
    <p class="assurance-notice"><strong>Qualification:</strong> ${escapeHtml(qualificationNotice)}</p>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/assurance.ts'))}">Assurance route source</a></div>
  </section>
  <section aria-labelledby="assurance-areas-heading">
    <div class="section-head"><h2 id="assurance-areas-heading">Assurance areas</h2><span>Canonical child routes</span></div>
    <div class="grid">${cards}</div>
  </section>
  <section class="assurance-notice" aria-labelledby="security-boundary-heading">
    <h2 id="security-boundary-heading">Security stays separate</h2>
    <p>Suspected vulnerabilities, active security incidents, credentials, exploit detail, and other sensitive material belong in private vulnerability reporting. Published advisories remain on the canonical <a href="${escapeHtml(securityRoute)}">security page</a>.</p>
  </section>`, {
    description: indexDescription,
    canonicalPath: assuranceRoute,
  });
}

export async function renderSharedReporting(
  request: Request,
  env: Env,
  presentation: AssurancePresentation,
): Promise<string> {
  const principal = publicPrincipal();
  const collectionId = presentationCollections[presentation];
  const collection = reportingCollectionInventory(principal).find((candidate) => candidate.id === collectionId);
  if (!collection) {
    return `<div class="operations-section" id="assurance-reporting"><div class="availability-empty">No compatible public reporting collection is registered for this presentation.</div></div>`;
  }
  const url = new URL(request.url);
  const result = await queryReportingCollection(env, principal, collection, {
    searchParams: url.searchParams,
    limit: requestedLimit(url),
    cursor: url.searchParams.get('cursor'),
  });
  const label = presentationLabels[presentation];
  const rendered = presentReportingQuery(result, { label: `${label} reporting` });
  return `<div class="operations-section" id="assurance-reporting">
    <div class="operations-section-heading"><div><p class="eyebrow">Shared reporting projection</p><h2 id="assurance-reporting-heading">${escapeHtml(label)} reporting</h2></div><a href="${escapeHtml(sourceUrl(env, 'src/reporting/service.ts'))}">Reporting source <span aria-hidden="true">↗</span></a></div>
    <p class="subtle">This route queries the registered reporting collection and renders it through the shared disclosure-aware presentation layer. Canonical lifecycle, qualification, provenance, and public/private boundaries remain upstream of this page.</p>
    ${renderReportingPresentation(rendered, {
      headingId: `assurance-${presentation}-records-heading`,
      nextHref: cursorLink(request, rendered.pagination?.nextCursor),
      recordAnchors: presentation === 'index',
    })}
  </div>`;
}
