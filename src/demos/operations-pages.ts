import type { Env } from '../types';
import { collectHealth } from '../api/operations';
import { currentBudgetState, recentUsage } from '../lib/billing';
import { getDemoControl } from '../lib/demo-control';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

interface HealthRow {
  id: number;
  service_key: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  response_ms: number | null;
  detail_json: string | null;
  checked_at: string;
}

function navigation(active: string): string {
  const links: Array<[string, string]> = [
    ['/dashboard', 'Dashboard'], ['/dashboard/uptime', 'Uptime'],
    ['/dashboard/docs', 'Docs'], ['/dashboard/logs', 'Logs'], ['/dashboard/billing', 'Billing'],
    ['/health', 'Health JSON'], ['/version', 'Version JSON'],
  ];
  return `<nav class="section-nav" aria-label="Operations">${links.map(([href, label]) =>
    `<a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
}

/** Maps an operational state onto the shared ok/warn/down colour scale. */
function tone(value: string): 'ok' | 'warn' | 'down' | '' {
  if (value === 'operational' || value === 'online' || value === 'normal') return 'ok';
  if (value === 'degraded' || value === 'warning') return 'warn';
  if (value === 'down' || value === 'offline') return 'down';
  return '';
}

const statusClass = (value: string) => `stat${tone(value) ? ` stat-${tone(value)}` : ''}`;
const badgeClass = (value: string) => `badge${tone(value) ? ` badge-${tone(value)}` : ''}`;

function operationalPage(env: Env, route: string, title: string, heading: string, primarySource: string, content: string): Response {
  return shell(env, title, `<section class="page-header">
  <p class="eyebrow">Operations / public proof</p>
  <h1>${escapeHtml(heading)}</h1>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, primarySource))}">Route source</a></div>
</section>
${route === '/dashboard' ? '' : navigation(route)}
${content}`, { cacheControl: 'no-store', activeRoute: route });
}

export async function renderDashboard(env: Env): Promise<Response> {
  const [control, health, budget] = await Promise.all([getDemoControl(env), collectHealth(env, false), currentBudgetState(env)]);
  const version = env.DEPLOYED_VERSION || 'development';
  return operationalPage(env, '/dashboard', 'Operations Dashboard', 'Operations Dashboard', 'src/demos/dashboard.ts', `
  <section class="grid" aria-label="Current operational state">
    <article class="card"><h2 class="eyebrow">Demo control</h2><p class="${statusClass(control.state)}">${escapeHtml(control.state)}</p><p>${escapeHtml(control.publicMessage)}</p><a href="/admin">Protected control</a></article>
    <article class="card" id="health"><h2 class="eyebrow">Health</h2><p class="${statusClass(health.status)}">${escapeHtml(health.status)}</p><dl><dt>Worker/runtime</dt><dd>${health.services.worker}</dd><dt>D1</dt><dd>${health.services.d1}</dd><dt>R2</dt><dd>${health.services.r2}</dd><dt>Durable Objects</dt><dd>${health.services.durableObjects}</dd><dt>Intentional demo state</dt><dd>${escapeHtml(health.demo.state)} — ${escapeHtml(health.demo.message)}</dd><dt>Checked</dt><dd>${escapeHtml(health.checkedAt)}</dd></dl><a href="/health">Inspect health JSON</a></article>
    <article class="card"><h2 class="eyebrow">Synthetic budget</h2><p class="${statusClass(budget.state)}">${escapeHtml(budget.state)}</p><p>${budget.percent.toFixed(1)}% of the controlled demonstration budget.</p><a href="/dashboard/billing">Exercise degradation</a></article>
    <article class="card"><h2 class="eyebrow">Deployed version</h2><p class="stat">${escapeHtml(version)}</p><p>Commit: ${escapeHtml(env.DEPLOYED_SHA || 'not supplied')}</p><a href="/version">Inspect version JSON</a></article>
  </section>
  ${referenceDetails([
    { label: 'Dashboard implementation', href: sourceUrl(env, 'src/demos/operations-pages.ts') },
    { label: 'Health implementation', href: sourceUrl(env, 'src/api/operations.ts') },
    { label: 'Operations standard', href: sourceUrl(env, 'docs/OPERATIONS.md') },
    { label: 'Operations tests', href: sourceUrl(env, 'tests/operations.test.ts') },
  ], 'Source evidence')}`);
}

export async function renderUptime(env: Env): Promise<Response> {
  const result = await env.DEMO_DB.prepare(
    `SELECT id, service_key, status, response_ms, detail_json, checked_at
     FROM service_health_checks WHERE service_key = 'public-demo' ORDER BY id DESC LIMIT 100`,
  ).all<HealthRow>();
  const rows = result.results;
  const intentional = rows.filter((row) => {
    try { return Boolean(row.detail_json && (JSON.parse(row.detail_json) as { intentionalOffline?: boolean }).intentionalOffline); } catch { return false; }
  }).length;
  const operational = rows.filter((row) => row.status === 'operational').length;
  const unexpected = rows.filter((row) => row.status !== 'operational').length - intentional;
  const raw = rows.length ? (operational / rows.length) * 100 : 0;
  const excludingPlanned = rows.length - intentional > 0 ? (operational / (rows.length - intentional)) * 100 : 100;
  const table = rows.map((row) => `<tr><td><time datetime="${escapeHtml(row.checked_at)}">${escapeHtml(row.checked_at)}</time></td><td>${escapeHtml(row.status)}</td><td>${row.response_ms ?? '—'}</td><td>${row.detail_json?.includes('"intentionalOffline":true') ? 'planned/manual offline' : row.status === 'operational' ? 'operational observation' : 'unexpected dependency failure'}</td></tr>`).join('');
  return operationalPage(env, '/dashboard/uptime', 'Uptime', 'Measured availability', 'src/demos/uptime.ts', `<section class="panel"><h2>Window</h2><p>Measurement: the <code>public-demo</code> Worker dependency check. Window: latest ${rows.length} stored observation${rows.length === 1 ? '' : 's'}, up to 100.</p><dl><dt>Raw operational observations</dt><dd>${raw.toFixed(3)}%</dd><dt>Availability excluding planned/manual offline observations</dt><dd>${excludingPlanned.toFixed(3)}%</dd><dt>Planned/manual offline</dt><dd>${intentional}</dd><dt>Unexpected degraded/down</dt><dd>${Math.max(0, unexpected)}</dd></dl><p class="subtle">This is measured history, not an SLA.</p></section><section class="panel"><h2>History</h2><div class="table-wrap"><table><thead><tr><th>Checked</th><th>Status</th><th>D1 response ms</th><th>Classification</th></tr></thead><tbody>${table || '<tr><td colspan="4">No health observations yet. Request <a href="/health">/health</a> to create one.</td></tr>'}</tbody></table></div><p><a href="${escapeHtml(sourceUrl(env, 'migrations/0002_operations_dashboard.sql'))}">View history schema</a></p></section>`);
}

export function renderDocs(env: Env): Response {
  const links: Array<[string, string]> = [
    ['Architecture standard', 'docs/ARCHITECTURE-STANDARD.md'], ['Operations standard', 'docs/OPERATIONS.md'], ['Stable route map', 'docs/ROUTES.md'], ['Machine route manifest', 'docs/route-manifest.json'], ['Router', 'src/router.ts'], ['Implementation plan', 'docs/IMPLEMENTATION-PLAN.md'], ['Evidence map', 'docs/EVIDENCE.md'], ['Accessibility guidance', 'docs/ACCESSIBILITY.md'], ['Identity guidance', 'docs/IDENTITY.md'], ['README', 'README.md'], ['Contributing', 'CONTRIBUTING.md'], ['Agent guidance', 'AGENTS.md'], ['Security', 'SECURITY.md'], ['Changelog', 'CHANGELOG.md'], ['Swagger 2.0 contract', 'contracts/openapi/swagger.json'], ['GraphQL schema', 'contracts/graphql/schema.graphql'], ['MCP tools', 'contracts/mcp/tools.json'], ['Webhook events', 'contracts/webhooks/events.json'], ['CI workflow', '.github/workflows/ci.yml'], ['Deploy workflow', '.github/workflows/deploy.yml'], ['D1 migrations', 'migrations/0001_demo_blob.sql'],
  ];
  return operationalPage(env, '/dashboard/docs', 'Documentation', 'Documentation', 'src/demos/docs.ts', `<section class="resource-list" aria-label="Repository documentation">${links.map(([label, path]) => `<a href="${escapeHtml(sourceUrl(env, path))}"><strong>${escapeHtml(label)}</strong><code>${escapeHtml(path)}</code></a>`).join('')}</section><section class="machine-links"><h2>Live interfaces</h2><nav class="link-row" aria-label="Live machine interfaces"><a href="/v1/openapi.json">Swagger JSON</a><a href="/graphql/schema">GraphQL schema</a><a href="/health">Health JSON</a><a href="/version">Version JSON</a><a href="/__api/operations/logs">Logs JSON</a><a href="${escapeHtml(repoUrl(env))}/releases">Releases</a><a href="${escapeHtml(repoUrl(env))}/tags">Tags</a></nav></section>`);
}

export async function renderBilling(env: Env): Promise<Response> {
  const [current, history] = await Promise.all([currentBudgetState(env), recentUsage(env)]);
  const rows = history.map((row) => `<tr><td>${escapeHtml(row.captured_at)}</td><td>${row.quantity.toLocaleString('en-US')} ${escapeHtml(row.unit)}</td><td>$${row.estimated_cost_usd.toFixed(4)}</td><td>$${(row.budget_limit_usd ?? 0).toFixed(2)}</td><td>${budgetLabel(row.estimated_cost_usd, row.budget_limit_usd ?? 0)}</td></tr>`).join('');
  return operationalPage(env, '/dashboard/billing', 'Billing & Usage', 'Synthetic billing and graceful degradation', 'src/demos/billing.ts', `<section class="panel"><h2>Current state</h2><p><span class="${badgeClass(current.state)}">${escapeHtml(current.state)}</span> ${current.percent.toFixed(1)}% of the synthetic monthly budget.</p><div class="button-row"><button type="button" data-budget="normal">Normal · 40%</button><button type="button" data-budget="warning">Warning · 75%</button><button type="button" data-budget="degraded">Degraded · 95%</button></div><pre aria-live="polite" data-budget-output hidden></pre></section><section class="panel"><h2>Behavior</h2><dl><dt>Normal</dt><dd>Optional compute remains available.</dd><dt>Warning</dt><dd>Warnings are visible; operations remain available.</dd><dt>Degraded</dt><dd>Optional Worker compute pauses while operational routes remain available.</dd></dl></section><section class="panel"><h2>Usage history</h2><div class="table-wrap"><table><thead><tr><th>Captured</th><th>Quantity</th><th>Estimated cost</th><th>Budget</th><th>State</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No synthetic snapshots yet.</td></tr>'}</tbody></table></div>${referenceDetails([
    { label: 'Scenario implementation', href: sourceUrl(env, 'src/api/billing.ts') },
    { label: 'Policy config', href: sourceUrl(env, 'config/billing-demo.json') },
    { label: 'Usage schema', href: sourceUrl(env, 'migrations/0002_operations_dashboard.sql') },
  ])}</section><script>(()=>{const out=document.querySelector('[data-budget-output]');document.querySelectorAll('[data-budget]').forEach((button)=>button.addEventListener('click',async()=>{out.hidden=false;out.textContent='Updating…';const response=await fetch('/__api/operations/billing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:button.dataset.budget})});out.textContent=JSON.stringify(await response.json(),null,2);if(response.ok)setTimeout(()=>location.reload(),500)}))})()</script>`);
}

function budgetLabel(cost: number, budget: number): string {
  const percent = budget > 0 ? (cost / budget) * 100 : 100;
  return percent >= 90 ? 'degraded' : percent >= 70 ? 'warning' : 'normal';
}
