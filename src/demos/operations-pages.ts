import type { Env } from '../types';
import { collectHealth } from '../api/operations';
import { currentBudgetState, recentUsage } from '../lib/billing';
import { getDemoControl } from '../lib/demo-control';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { recentApplicationLogs } from '../lib/logs';
import { shell } from '../ui/page';

interface HealthRow {
  id: number;
  service_key: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  response_ms: number | null;
  detail_json: string | null;
  checked_at: string;
}

function navigation(): string {
  return `<nav aria-label="Operations"><div class="meta"><a href="/dashboard">Dashboard</a><a href="/dashboard/uptime">Uptime</a><a href="/dashboard/health">Health</a><a href="/dashboard/docs">Docs</a><a href="/dashboard/logs">Logs</a><a href="/dashboard/billing">Billing</a><a href="/health">Health JSON</a><a href="/version">Version JSON</a></div></nav>`;
}

function operationalPage(env: Env, title: string, heading: string, primarySource: string, content: string): Response {
  return shell(env, title, `${navigation()}<section><div class="eyebrow">Operations / public proof</div><h1>${escapeHtml(heading)}</h1><div class="meta"><span class="badge">working</span><a href="${escapeHtml(sourceUrl(env, primarySource))}">View primary route source</a></div></section>${content}`, { cacheControl: 'no-store' });
}

export async function renderDashboard(env: Env): Promise<Response> {
  const [control, health, budget, logs] = await Promise.all([getDemoControl(env), collectHealth(env, false), currentBudgetState(env), recentApplicationLogs(env, { limit: 5 })]);
  const version = env.DEPLOYED_VERSION || 'development';
  return operationalPage(env, 'Operations Dashboard', 'Operations Dashboard', 'src/demos/dashboard.ts', `
  <section class="grid" aria-label="Current operational state">
    <article class="card"><div class="eyebrow">Demo control</div><h2>${escapeHtml(control.state)}</h2><p>${escapeHtml(control.publicMessage)}</p><a href="/admin">Protected control</a></article>
    <article class="card"><div class="eyebrow">Health</div><h2>${escapeHtml(health.status)}</h2><p>Worker: ${health.services.worker}; D1: ${health.services.d1}; R2: ${health.services.r2}; Durable Objects: ${health.services.durableObjects}.</p><a href="/dashboard/health">Inspect health</a></article>
    <article class="card"><div class="eyebrow">Synthetic budget</div><h2>${escapeHtml(budget.state)}</h2><p>${budget.percent.toFixed(1)}% of the controlled demonstration budget.</p><a href="/dashboard/billing">Exercise degradation</a></article>
    <article class="card"><div class="eyebrow">Deployed version</div><h2>${escapeHtml(version)}</h2><p>Commit: ${escapeHtml(env.DEPLOYED_SHA || 'not supplied')}</p><a href="/version">Inspect version JSON</a></article>
  </section>
  <section class="panel"><h2>Operational proof surfaces</h2><ul><li><a href="/dashboard/uptime">Timestamped uptime history and availability calculation</a></li><li><a href="/dashboard/docs">Architecture, contracts, source, security, contribution, release, and evidence index</a></li><li><a href="/dashboard/logs">Bounded public-safe application logs</a> (${logs.length} recent row${logs.length === 1 ? '' : 's'} sampled)</li><li><a href="${escapeHtml(repoUrl(env))}">Public GitHub evidence</a></li></ul></section>
  <section class="panel"><h2>Source evidence</h2><div class="meta"><a href="${escapeHtml(sourceUrl(env, 'src/demos/operations-pages.ts'))}">Dashboard implementation</a><a href="${escapeHtml(sourceUrl(env, 'src/api/operations.ts'))}">Health implementation</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Operations standard</a><a href="${escapeHtml(sourceUrl(env, 'tests/operations.test.ts'))}">Operations tests</a></div></section>`);
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
  return operationalPage(env, 'Uptime', 'Measured availability', 'src/demos/uptime.ts', `<section class="panel"><h2>Window</h2><p>Measurement: the <code>public-demo</code> Worker dependency check. Window: latest ${rows.length} stored observation${rows.length === 1 ? '' : 's'}, up to 100.</p><dl><dt>Raw operational observations</dt><dd>${raw.toFixed(3)}%</dd><dt>Availability excluding planned/manual offline observations</dt><dd>${excludingPlanned.toFixed(3)}%</dd><dt>Planned/manual offline</dt><dd>${intentional}</dd><dt>Unexpected degraded/down</dt><dd>${Math.max(0, unexpected)}</dd></dl><p class="subtle">This is measured history, not an SLA.</p></section><section class="panel"><h2>History</h2><div class="table-wrap"><table><thead><tr><th>Checked</th><th>Status</th><th>D1 response ms</th><th>Classification</th></tr></thead><tbody>${table || '<tr><td colspan="4">No health observations yet. Request <a href="/health">/health</a> to create one.</td></tr>'}</tbody></table></div><p><a href="${escapeHtml(sourceUrl(env, 'migrations/0002_operations_dashboard.sql'))}">View history schema</a></p></section>`);
}

export async function renderHealth(env: Env): Promise<Response> {
  const health = await collectHealth(env, false);
  return operationalPage(env, 'Health', 'Runtime and dependency health', 'src/demos/health.ts', `<section class="panel"><h2>Current snapshot</h2><p><span class="badge">${escapeHtml(health.status)}</span></p><dl><dt>Worker/runtime</dt><dd>${health.services.worker}</dd><dt>D1</dt><dd>${health.services.d1}</dd><dt>R2</dt><dd>${health.services.r2}</dd><dt>Durable Objects</dt><dd>${health.services.durableObjects}</dd><dt>Intentional demo state</dt><dd>${escapeHtml(health.demo.state)} — ${escapeHtml(health.demo.message)}</dd><dt>Checked</dt><dd>${escapeHtml(health.checkedAt)}</dd></dl><p>Runtime health, dependency readiness, and intentional public demo state are reported independently.</p><div class="meta"><a href="/health">Machine-readable health</a><a href="${escapeHtml(sourceUrl(env, 'src/api/operations.ts'))}">View implementation</a></div></section>`);
}

export function renderDocs(env: Env): Response {
  const links: Array<[string, string]> = [
    ['Architecture standard', 'docs/ARCHITECTURE-STANDARD.md'], ['Operations standard', 'docs/OPERATIONS.md'], ['Stable route map', 'docs/ROUTES.md'], ['Machine route manifest', 'docs/route-manifest.json'], ['Implementation plan', 'docs/IMPLEMENTATION-PLAN.md'], ['Evidence map', 'docs/EVIDENCE.md'], ['Accessibility guidance', 'docs/ACCESSIBILITY.md'], ['Identity guidance', 'docs/IDENTITY.md'], ['README', 'README.md'], ['Contributing', 'CONTRIBUTING.md'], ['Agent guidance', 'AGENTS.md'], ['Security', 'SECURITY.md'], ['Changelog', 'CHANGELOG.md'], ['Swagger 2.0 contract', 'contracts/openapi/swagger.json'], ['GraphQL schema', 'contracts/graphql/schema.graphql'], ['MCP tools', 'contracts/mcp/tools.json'], ['Webhook events', 'contracts/webhooks/events.json'], ['CI workflow', '.github/workflows/ci.yml'], ['Deploy workflow', '.github/workflows/deploy.yml'], ['D1 migrations', 'migrations/0001_demo_blob.sql'],
  ];
  return operationalPage(env, 'Documentation', 'Live documentation index', 'src/demos/docs.ts', `<section class="grid">${links.map(([label, path]) => `<a class="card" href="${escapeHtml(sourceUrl(env, path))}"><h2>${escapeHtml(label)}</h2><code>${escapeHtml(path)}</code></a>`).join('')}</section><section class="panel"><h2>Live machine surfaces</h2><div class="meta"><a href="/v1/openapi.json">Swagger JSON</a><a href="/graphql/schema">GraphQL schema</a><a href="/health">Health JSON</a><a href="/version">Version JSON</a><a href="/__api/operations/logs">Logs JSON</a><a href="${escapeHtml(repoUrl(env))}/releases">GitHub Releases</a><a href="${escapeHtml(repoUrl(env))}/tags">Git tags</a></div></section>`);
}

export async function renderBilling(env: Env): Promise<Response> {
  const [current, history] = await Promise.all([currentBudgetState(env), recentUsage(env)]);
  const rows = history.map((row) => `<tr><td>${escapeHtml(row.captured_at)}</td><td>${row.quantity.toLocaleString('en-US')} ${escapeHtml(row.unit)}</td><td>$${row.estimated_cost_usd.toFixed(4)}</td><td>$${(row.budget_limit_usd ?? 0).toFixed(2)}</td><td>${budgetLabel(row.estimated_cost_usd, row.budget_limit_usd ?? 0)}</td></tr>`).join('');
  return operationalPage(env, 'Billing & Usage', 'Synthetic billing and graceful degradation', 'src/demos/billing.ts', `<section class="panel"><h2>Current controlled state</h2><p><span class="badge">${escapeHtml(current.state)}</span> ${current.percent.toFixed(1)}% of the synthetic monthly budget.</p><p>This surface never reads a real invoice, payment method, Cloudflare account identifier, or private billing API.</p><div class="meta"><button type="button" data-budget="normal">Set normal (40%)</button><button type="button" data-budget="warning">Set warning (75%)</button><button type="button" data-budget="degraded">Set degraded (95%)</button></div><pre aria-live="polite" data-budget-output>Choose a scenario.</pre></section><section class="panel"><h2>Behavior policy</h2><ul><li><strong>Normal:</strong> optional stateless compute remains available.</li><li><strong>Warning:</strong> warnings are visible; critical and optional operations remain available.</li><li><strong>Degraded:</strong> optional Worker compute pauses with a structured response; dashboard, health, version, admin, and offline routes remain available.</li></ul><p><a href="/workers">Exercise the optional Worker workload</a></p></section><section class="panel"><h2>Stored usage history</h2><div class="table-wrap"><table><thead><tr><th>Captured</th><th>Quantity</th><th>Estimated cost</th><th>Budget</th><th>State</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No synthetic snapshots yet.</td></tr>'}</tbody></table></div><div class="meta"><a href="${escapeHtml(sourceUrl(env, 'src/api/billing.ts'))}">Scenario implementation</a><a href="${escapeHtml(sourceUrl(env, 'config/billing-demo.json'))}">Policy config</a><a href="${escapeHtml(sourceUrl(env, 'migrations/0002_operations_dashboard.sql'))}">Usage schema</a></div></section><script>(()=>{const out=document.querySelector('[data-budget-output]');document.querySelectorAll('[data-budget]').forEach((button)=>button.addEventListener('click',async()=>{out.textContent='Updating…';const response=await fetch('/__api/operations/billing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:button.dataset.budget})});out.textContent=JSON.stringify(await response.json(),null,2);if(response.ok)setTimeout(()=>location.reload(),500)}))})()</script>`);
}

function budgetLabel(cost: number, budget: number): string {
  const percent = budget > 0 ? (cost / budget) * 100 : 100;
  return percent >= 90 ? 'degraded' : percent >= 70 ? 'warning' : 'normal';
}
