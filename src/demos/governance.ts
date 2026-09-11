import { authorize, type Principal } from '../lib/authorization';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import {
  presentReportingQuery,
  reportingPresentationLabel,
  type ReportingQueryPresentation,
} from '../reporting/presentation';
import {
  queryReportingCollection,
  reportingCollectionInventory,
  type ReportingCollectionDescriptor,
} from '../reporting/service';
import { demoContent, referenceDetails, type PageContent } from '../ui/page';
import type { DemoDefinition, Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import {
  renderGovernanceActions,
  renderGovernanceRecordInspector,
} from './assurance-workbench-renderers';

const demo: DemoDefinition = {
  "id": "governance",
  "route": routeUrl('assurance.governance'),
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
      "path": "/api/labs/governance-security-controls"
    },
    {
      "id": "iso-42001",
      "title": "ISO/IEC 42001 alignment",
      "description": "Execute and audit the approved, unknown-method, and invalid-scope cases at the controlled MCP boundary.",
      "label": "Run the AI boundary evaluation",
      "method": "POST",
      "path": "/api/labs/governance-ai-evaluation"
    },
    {
      "id": "traceability",
      "title": "Traceability & evidence",
      "description": "Inspect the requirement-to-operation chain across source, validation, release metadata, deployment identity, and recent application audit events.",
      "label": "Inspect the live evidence chain",
      "method": "GET",
      "path": "/api/labs/governance-traceability"
    }
  ]
};

interface GovernanceResourceSummary {
  id: string;
  label: string;
  count: number;
  path: string;
}

function anonymousPrincipal(): Principal {
  return { subject: 'public-visitor', authentication: 'anonymous', role: 'viewer', permissions: ['demo:read'] };
}

async function governancePrincipal(request: Request, env: Env): Promise<Principal> {
  const authorized = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  return authorized instanceof Response ? anonymousPrincipal() : authorized;
}

function requestedLimit(url: URL): number {
  const value = Number(url.searchParams.get('limit') || '20');
  if (!Number.isInteger(value)) return 20;
  return Math.max(1, Math.min(50, value));
}

function nextHref(request: Request, cursor: string | null | undefined): string | null {
  if (!cursor) return null;
  const url = new URL(request.url);
  url.searchParams.set('cursor', cursor);
  return `${url.pathname}${url.search}`;
}

function governanceResourceLabel(id: string): string {
  const suffix = id === 'governance.records'
    ? 'asset-inventory'
    : id.replace(/^governance\.records\./, '');
  return reportingPresentationLabel(suffix);
}

function scopedCollection(
  collection: ReportingCollectionDescriptor,
  resourceId: string | null,
): ReportingCollectionDescriptor {
  if (!resourceId) return collection;
  const index = collection.resourceIds.indexOf(resourceId);
  if (index < 0) return collection;
  return {
    ...collection,
    sourceIds: [collection.sourceIds[index]],
    resourceIds: [collection.resourceIds[index]],
    sourcePaths: [collection.sourcePaths[index]],
  };
}

async function governanceResourceSummaries(
  env: Env,
  principal: Principal,
  collection: ReportingCollectionDescriptor,
): Promise<GovernanceResourceSummary[]> {
  return Promise.all(collection.resourceIds.map(async (resourceId, index) => {
    const result = await queryReportingCollection(env, principal, scopedCollection(collection, resourceId), { limit: 1 });
    return {
      id: resourceId,
      label: governanceResourceLabel(resourceId),
      count: result.derived.totalAvailable,
      path: collection.sourcePaths[index],
    };
  }));
}

function renderGovernanceInventory(
  env: Env,
  request: Request,
  presentation: ReportingQueryPresentation,
  resources: GovernanceResourceSummary[],
  selectedResourceId: string | null,
  limit: number,
): string {
  const totalRecords = resources.reduce((total, resource) => total + resource.count, 0);
  const selectedResource = resources.find((resource) => resource.id === selectedResourceId) ?? null;
  const sourceLabels = new Map<string, string>(presentation.sources.map((source) => [
    source.id,
    resources.find((resource) => resource.path === source.resource)?.label ?? source.label,
  ]));
  const options = resources.map((resource) => `<option value="${escapeHtml(resource.id)}"${resource.id === selectedResourceId ? ' selected' : ''}>${escapeHtml(resource.label)} · ${resource.count}</option>`).join('');
  const records = presentation.records.map((record) => renderGovernanceRecordInspector(
    record,
    record.sourceId ? (sourceLabels.get(record.sourceId) ?? selectedResource?.label ?? 'Governance') : (selectedResource?.label ?? 'Governance'),
  )).join('');
  const pagination = presentation.pagination;
  const next = nextHref(request, pagination?.nextCursor);
  const paginationHtml = pagination
    ? `<nav class="link-row" aria-label="Governance record pagination"><span>Showing ${pagination.returned} of ${pagination.total}</span>${next ? `<a href="${escapeHtml(next)}">Next page →</a>` : ''}</nav>`
    : '';
  const sourceReferences = resources.map((resource) => ({
    label: `${resource.label} · ${resource.count} record${resource.count === 1 ? '' : 's'}`,
    href: sourceUrl(env, resource.path),
  }));
  return `<section id="governance-records" aria-labelledby="governance-records-heading">
    <div class="section-head"><h2 id="governance-records-heading">Governance records</h2><span>${totalRecords} records · ${resources.length} registers</span></div>
    <p class="subtle">Browse the canonical governance registers through one reporting contract. Counts describe each full register, not just the current page.</p>
    <div class="info-card">
      <h3>Choose a register</h3>
      <form method="get" action="${escapeHtml(routeUrl('assurance.governance'))}">
        <p>
          <label>Register
            <select name="dataset"><option value=""${selectedResourceId ? '' : ' selected'}>All registers · ${totalRecords}</option>${options}</select>
          </label>
          <label>Rows
            <input type="number" name="limit" min="1" max="50" value="${limit}">
          </label>
          <button type="submit">Apply</button>
          <a class="text-link" href="${escapeHtml(routeUrl('assurance.governance'))}">Reset</a>
        </p>
      </form>
      <p><strong>${presentation.totalAvailable}</strong> record${presentation.totalAvailable === 1 ? '' : 's'} in ${escapeHtml(selectedResource?.label ?? 'all registers')} · ${presentation.count} shown on this page.</p>
    </div>
    ${records || '<div class="availability-empty">No governance records in this selection.</div>'}
    ${paginationHtml}
    ${referenceDetails(sourceReferences, 'Register sources')}
  </section>`;
}

export async function governanceContent(
  request: Request,
  env: Env,
  all: DemoDefinition[],
): Promise<PageContent> {
  const principal = await governancePrincipal(request, env);
  const collection = reportingCollectionInventory(principal).find((candidate) => candidate.id === 'governance');
  if (!collection) throw new Error('Registered governance reporting collection is unavailable.');
  const url = new URL(request.url);
  const requestedResourceId = url.searchParams.get('dataset');
  const selectedResourceId = requestedResourceId && collection.resourceIds.includes(requestedResourceId)
    ? requestedResourceId
    : null;
  const limit = requestedLimit(url);
  const [result, resources] = await Promise.all([
    queryReportingCollection(env, principal, scopedCollection(collection, selectedResourceId), {
      limit,
      cursor: url.searchParams.get('cursor'),
    }),
    governanceResourceSummaries(env, principal, collection),
  ]);
  const presentation = presentReportingQuery(result, {
    label: selectedResourceId ? governanceResourceLabel(selectedResourceId) : collection.label,
  });
  const actions = demo.actions ?? [];
  const content = `${renderGovernanceActions(actions, {
    headingId: 'governance-demonstrations-heading',
    heading: 'Governance demonstrations',
    intro: 'Start with the executable controls. The register below is supporting evidence, not the primary task.',
  })}${renderGovernanceInventory(env, request, presentation, resources, selectedResourceId, limit)}`;
  return demoContent(env, { ...demo, actions: [] }, all, content);
}

export default demo;
