import { authorize, type Principal } from '../lib/authorization';
import { renderReportingPresentation } from '../reporting/html';
import { presentReportingQuery } from '../reporting/presentation';
import { queryReportingCollection, reportingCollectionInventory } from '../reporting/service';
import { renderDemo } from '../ui/page';
import type { DemoDefinition, Env } from '../types';

const demo: DemoDefinition = {
  "id": "governance",
  "route": "/governance",
  "title": "Governance",
  "group": "Delivery & Governance",
  "sourcePath": "src/demos/governance.ts",
  "summary": "Security controls, AI-system boundary evaluation, traceability, and audit evidence implemented through ordinary engineering work and inspected together.",
  "notice": "WCAG 2.2 / ISO 27001 / ISO 42001 references are alignment targets, not certification claims.",
  "proves": [
    "ISO/IEC 27001-aligned controls map to inspectable implementation evidence",
    "ISO/IEC 42001-aligned evaluation exercises approved, unknown-method, and invalid-scope cases",
    "Release metadata and recent D1 audit events form a visible evidence chain",
    "All alignment language remains explicitly uncertified"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View governance implementation", "path": "src/api/governance.ts" },
    { "label": "View evidence map", "path": "docs/EVIDENCE.md" },
    { "label": "View security guidance", "path": "SECURITY.md" },
    { "label": "View MCP implementation", "path": "src/api/mcp.ts" },
    { "label": "View audit persistence", "path": "src/lib/audit.ts" }
  ],
  "repositoryLinks": [{ "label": "Inspect commits", "path": "/commits/main" }, { "label": "Inspect Actions", "path": "/actions" }, { "label": "Inspect Releases", "path": "/releases" }],
  "actions": [
    {
      "id": "iso-27001",
      "title": "ISO/IEC 27001 alignment",
      "description": "Inspect the published ISO/IEC 27001-related assurance claims and their deployment-aware canonical evidence.",
      "label": "Inspect the security-control map",
      "method": "GET",
      "path": "/__api/governance/security-controls"
    },
    {
      "id": "iso-42001",
      "title": "ISO/IEC 42001 alignment",
      "description": "Execute and audit the approved, unknown-method, and invalid-scope cases at the controlled MCP boundary.",
      "label": "Run the AI boundary evaluation",
      "method": "POST",
      "path": "/__api/governance/ai-evaluation"
    },
    {
      "id": "traceability",
      "aliases": ["evidence"],
      "title": "Traceability & evidence",
      "description": "Inspect the requirement-to-operation chain across source, validation, release metadata, deployment identity, and recent application audit events.",
      "label": "Inspect the live evidence chain",
      "method": "GET",
      "path": "/__api/evidence/traceability"
    }
  ]
};

function anonymousPrincipal(): Principal {
  return { subject: 'public-visitor', authentication: 'anonymous', role: 'viewer', permissions: ['demo:read'] };
}

async function governancePrincipal(request: Request, env: Env): Promise<Principal> {
  const authorized = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  return authorized instanceof Response ? anonymousPrincipal() : authorized;
}

function requestedLimit(url: URL): number {
  const value = Number(url.searchParams.get('limit') || '25');
  if (!Number.isInteger(value)) return 25;
  return Math.max(1, Math.min(50, value));
}

function nextHref(request: Request, cursor: string | null | undefined): string | null {
  if (!cursor) return null;
  const url = new URL(request.url);
  url.searchParams.set('cursor', cursor);
  return `${url.pathname}${url.search}`;
}

export async function renderGovernance(
  request: Request,
  env: Env,
  all: DemoDefinition[],
): Promise<Response> {
  const principal = await governancePrincipal(request, env);
  const collection = reportingCollectionInventory(principal).find((candidate) => candidate.id === 'governance');
  if (!collection) throw new Error('Registered governance reporting collection is unavailable.');
  const url = new URL(request.url);
  const result = await queryReportingCollection(env, principal, collection, {
    limit: requestedLimit(url),
    cursor: url.searchParams.get('cursor'),
  });
  const presentation = presentReportingQuery(result, { label: collection.label });
  const reporting = `<section class="operations-section" id="governance-records" aria-labelledby="governance-records-heading">
    <p class="subtle">Governance inventory is discovered from reporting ownership and registry capabilities, including every registered governance partition.</p>
    ${renderReportingPresentation(presentation, {
      headingId: 'governance-records-heading',
      nextHref: nextHref(request, presentation.pagination?.nextCursor),
    })}
  </section>`;
  return renderDemo(env, demo, all, reporting);
}

export default demo;