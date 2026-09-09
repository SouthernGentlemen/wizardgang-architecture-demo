import { authorize, type Principal } from '../lib/authorization';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import {
  presentReportingQuery,
  reportingPresentationLabel,
  type ReportingQueryPresentation,
  type ReportingRecordPresentation,
} from '../reporting/presentation';
import {
  queryReportingCollection,
  reportingCollectionInventory,
  type ReportingCollectionDescriptor,
} from '../reporting/service';
import { demoContent, referenceDetails, type PageContent } from '../ui/page';
import type { DemoAction, DemoDefinition, Env } from '../types';
import { routeUrl } from '../routing/application-routes';

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

function normalizedFieldName(value: string): string {
  const leaf = value.split('.').at(-1) ?? value;
  return leaf.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function humanizeFieldName(value: string): string {
  const leaf = value.split('.').at(-1) ?? value;
  const spaced = leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
  return spaced ? `${spaced[0].toUpperCase()}${spaced.slice(1)}` : value;
}

function fieldByName(record: ReportingRecordPresentation, names: readonly string[]) {
  const normalized = new Set(names.map((name) => normalizedFieldName(name)));
  return record.fields.find((field) => normalized.has(normalizedFieldName(field.name)));
}

function recordHeading(record: ReportingRecordPresentation): { title: string; fieldName: string | null } {
  if (record.title && record.title !== record.id) return { title: record.title, fieldName: null };
  const preferred = fieldByName(record, [
    'assetClass',
    'accessClass',
    'supplier',
    'service',
    'configurationItem',
    'system',
    'requirement',
    'obligation',
    'activity',
    'objective',
    'description',
    'name',
    'title',
  ]);
  if (preferred) return { title: preferred.value, fieldName: preferred.name };
  const fallback = record.fields.find((field) => ![
    'view', 'order', 'status', 'reviewstate', 'state', 'owner', 'primaryowner',
  ].includes(normalizedFieldName(field.name)));
  return fallback ? { title: fallback.value, fieldName: fallback.name } : { title: record.id, fieldName: null };
}

function recordStatus(record: ReportingRecordPresentation) {
  if (record.status) return { value: record.status, fieldName: null as string | null };
  const field = fieldByName(record, ['status', 'reviewState', 'state', 'result', 'posture', 'progress']);
  return field ? { value: field.value, fieldName: field.name } : null;
}

function statusClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (/\b(met|complete|completed|approved|current|available|pass|passed)\b/.test(normalized)) return 'badge badge-ok';
  if (/\b(partial|planned|pending|review|warning)\b/.test(normalized) || normalized.includes('in progress')) return 'badge badge-warn';
  if (/\b(gap|failed|fail|overdue|expired|unavailable)\b/.test(normalized)) return 'badge badge-down';
  return 'badge';
}

function renderGovernanceRecord(
  record: ReportingRecordPresentation,
  registerLabel: string,
): string {
  const heading = recordHeading(record);
  const status = recordStatus(record);
  const omitted = new Set([
    'view',
    'order',
    ...(heading.fieldName ? [normalizedFieldName(heading.fieldName)] : []),
    ...(status?.fieldName ? [normalizedFieldName(status.fieldName)] : []),
  ]);
  const details = record.fields
    .filter((field) => !omitted.has(normalizedFieldName(field.name)))
    .slice(0, 6)
    .map((field) => `<p><strong>${escapeHtml(humanizeFieldName(field.name))}:</strong> ${escapeHtml(field.value)}</p>`)
    .join('');
  const relationships = record.relationships.length
    ? `<p><strong>Relationships:</strong> ${record.relationships.map((relationship) => `${escapeHtml(relationship.label)} — ${relationship.targets.map(escapeHtml).join(', ')}`).join('; ')}</p>`
    : '';
  return `<details class="implementation-notes" id="${escapeHtml(record.id)}">
    <summary><span><code>${escapeHtml(record.id)}</code> · ${escapeHtml(heading.title)}</span>${status ? `<span class="${statusClass(status.value)}">${escapeHtml(status.value)}</span>` : ''}</summary>
    <p class="eyebrow">${escapeHtml(registerLabel)}</p>
    ${details}${relationships}
  </details>`;
}

function renderGovernanceActions(actions: DemoAction[]): string {
  const cards = actions.map((action, index) => `<article class="action-card" id="${escapeHtml(action.id ?? `governance-action-${index + 1}`)}">
    <p class="eyebrow">Live governance check</p>
    <h3>${escapeHtml(action.title ?? action.label)}</h3>
    ${action.description ? `<p>${escapeHtml(action.description)}</p>` : ''}
    <div class="request-line"><span class="http-method http-${action.method.toLowerCase()}">${escapeHtml(action.method)}</span><code>${escapeHtml(action.path)}</code></div>
    <button class="button-primary" type="button" data-governance-run="${index}">${escapeHtml(action.label)}</button>
    <pre class="action-output" aria-live="polite" data-governance-output="${index}" hidden></pre>
  </article>`).join('');
  return `<section aria-labelledby="governance-demonstrations-heading">
    <div class="section-head"><h2 id="governance-demonstrations-heading">Governance demonstrations</h2><span>${actions.length} live checks</span></div>
    <p class="subtle">Start with the executable controls. The register below is supporting evidence, not the primary task.</p>
    <div class="action-grid">${cards}</div>
  </section>
  <script>
  (() => {
    const actions = ${JSON.stringify(actions)};
    document.querySelectorAll('[data-governance-run]').forEach((button) => button.addEventListener('click', async () => {
      const index = Number(button.dataset.governanceRun);
      const action = actions[index];
      const output = document.querySelector('[data-governance-output="' + index + '"]');
      if (!action || !output) return;
      output.hidden = false;
      output.textContent = 'Running…';
      try {
        const response = await fetch(action.path, {
          method: action.method,
          ...(action.body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(action.body) })
        });
        const contentType = response.headers.get('content-type') || '';
        const result = contentType.includes('application/json') ? await response.json() : await response.text();
        output.textContent = response.status + ' ' + response.statusText + '\\n\\n' + (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      } catch (error) {
        output.textContent = String(error);
      }
    }));
  })();
  </script>`;
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
  const records = presentation.records.map((record) => renderGovernanceRecord(
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
  const content = `${renderGovernanceActions(actions)}${renderGovernanceInventory(env, request, presentation, resources, selectedResourceId, limit)}`;
  return demoContent(env, { ...demo, actions: [] }, all, content);
}

export default demo;
