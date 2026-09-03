import type { Env } from '../types';
import { collectHealth, type HealthSnapshot } from '../api/operations';
import { currentBudgetState, recentUsage } from '../lib/billing';
import { latestCloudflareUsage, recentCloudflareUsage, type CloudflareUsageSnapshot } from '../lib/cloudflare-usage';
import { publicComplianceRegistry } from '../assurance/registry';
import { getDemoControl } from '../lib/demo-control';
import { getCrawlerControl } from '../lib/crawler-control';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { recentApplicationLogs, type ApplicationLogRow } from '../lib/logs';
import { referenceDetails, shell } from '../ui/page';

interface HealthRow {
  id: number;
  service_key: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  response_ms: number | null;
  detail_json: string | null;
  checked_at: string;
}

interface AvailabilitySummary {
  total: number;
  operational: number;
  intentional: number;
  unexpected: number;
  raw: number | null;
  excludingPlanned: number | null;
}

export function operationsNavigation(active: string): string {
  const links: Array<[string, string]> = [
    ['/dashboard', 'Overview'], ['/dashboard/uptime', 'Availability'],
    ['/dashboard/logs', 'Logs'], ['/dashboard/billing', 'Usage & Cost'], ['/dashboard/docs', 'Docs'],
  ];
  return `<div class="operations-navigation"><nav class="section-nav" aria-label="Operations">${links.map(([href, label]) =>
    `<a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
  <details class="machine-endpoints"><summary>Machine endpoints</summary><nav class="link-row" aria-label="Operations machine endpoints"><a href="/health">/health</a><a href="/version">/version</a><a href="/__api/operations/logs">/__api/operations/logs</a><a href="/__api/operations/cloudflare-usage">/__api/operations/cloudflare-usage</a></nav></details></div>`;
}

function tone(value: string): 'ok' | 'warn' | 'down' | '' {
  if (value === 'operational' || value === 'online' || value === 'normal' || value === 'live') return 'ok';
  if (value === 'degraded' || value === 'warning' || value === 'partial' || value === 'planned') return 'warn';
  if (value === 'down' || value === 'offline' || value === 'unavailable') return 'down';
  return '';
}

const statusClass = (value: string) => `stat${tone(value) ? ` stat-${tone(value)}` : ''}`;
const badgeClass = (value: string) => `badge${tone(value) ? ` badge-${tone(value)}` : ''}`;

function operationalPage(
  env: Env,
  route: string,
  title: string,
  eyebrow: string,
  heading: string,
  description: string,
  primarySource: string,
  content: string,
  liveState = '',
): Response {
  return shell(env, title, `<section class="page-header operations-header">
  <p class="eyebrow">${escapeHtml(eyebrow)}</p>
  <h1>${escapeHtml(heading)}</h1>
  <p class="lede">${escapeHtml(description)}</p>
  ${liveState}
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, primarySource))}">View source <span aria-hidden="true">↗</span></a></div>
</section>
${operationsNavigation(route)}
${content}`, { cacheControl: 'no-store', activeRoute: route, description });
}

function isIntentional(row: HealthRow): boolean {
  try { return Boolean(row.detail_json && (JSON.parse(row.detail_json) as { intentionalOffline?: boolean }).intentionalOffline); } catch { return false; }
}

function availabilitySummary(rows: HealthRow[]): AvailabilitySummary {
  const intentional = rows.filter(isIntentional).length;
  const operational = rows.filter((row) => row.status === 'operational').length;
  const unexpected = Math.max(0, rows.filter((row) => row.status !== 'operational').length - intentional);
  const measured = rows.length - intentional;
  return {
    total: rows.length,
    operational,
    intentional,
    unexpected,
    raw: rows.length ? operational / rows.length * 100 : null,
    excludingPlanned: measured ? operational / measured * 100 : rows.length ? 100 : null,
  };
}

function availabilityTimeline(rows: HealthRow[], limit = 40): string {
  const observations = rows.slice(0, limit).reverse();
  if (!observations.length) return '<div class="availability-empty">Awaiting the first scheduled observation.</div>';
  return `<div class="availability-timeline" role="img" aria-label="${escapeHtml(`${observations.length} availability observations: ${observations.filter((row) => row.status === 'operational').length} operational, ${observations.filter(isIntentional).length} planned, ${observations.filter((row) => row.status !== 'operational' && !isIntentional(row)).length} unexpected degraded or down`)}">${observations.map((row) => {
    const state = isIntentional(row) ? 'planned' : row.status;
    return `<span data-state="${state}" title="${escapeHtml(`${row.checked_at} · ${state}`)}"></span>`;
  }).join('')}</div>`;
}

function relativeTime(value: string | null): string {
  if (!value) return 'not yet updated';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatNumber(value: number, compact = true): string {
  return new Intl.NumberFormat('en-US', compact ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(value);
}

function formatBytes(value: number): string {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1000)), units.length - 1);
  return `${(value / 1000 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function serviceLabel(value: string): string {
  return value === 'operational' ? 'Operational' : value === 'unconfigured' ? 'Not configured' : value === 'unavailable' ? 'Unavailable' : value;
}

function activityTitle(log: ApplicationLogRow): string {
  const special: Record<string, string> = {
    health_check: 'Health check', github_webhook_verified: 'GitHub webhook verified',
    synthetic_budget_changed: 'Cost guardrail changed', cloudflare_usage_collected: 'Cloudflare usage refreshed',
  };
  return special[log.event_key] ?? log.event_key.split('_').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

function dashboardActivity(logs: ApplicationLogRow[], health: HealthSnapshot): string {
  const ranked = logs.map((log, index) => ({ log, index, priority: ['error', 'warn'].includes(log.level) ? 0 : ['deployment', 'git', 'admin', 'identity', 'mcp', 'webhook', 'cloudflare'].includes(log.source) ? 1 : log.source === 'health' ? 3 : 2 }))
    .sort((a, b) => a.priority - b.priority || a.index - b.index);
  const selected: ApplicationLogRow[] = [];
  let healthIncluded = false;
  for (const { log } of ranked) {
    if (log.source === 'health' && healthIncluded) continue;
    selected.push(log); healthIncluded ||= log.source === 'health';
    if (selected.length === 5) break;
  }
  if (!selected.length) {
    return `<article class="activity-item"><span class="activity-dot" data-tone="${tone(health.status)}"></span><div><h3>Current health snapshot</h3><p>${health.status === 'operational' ? 'All configured dependency probes passed.' : health.status === 'offline' ? 'Demo is intentionally offline.' : 'One or more dependency probes are unavailable.'}</p><small>health · ${relativeTime(health.checkedAt)}</small></div></article>`;
  }
  return selected.map((log) => `<article class="activity-item"><span class="activity-dot" data-tone="${log.level === 'error' ? 'down' : log.level === 'warn' ? 'warn' : 'ok'}"></span><div><h3>${escapeHtml(activityTitle(log))}</h3><p>${escapeHtml(log.message)}</p><small>${escapeHtml(log.source)} · ${relativeTime(log.created_at)}</small></div></article>`).join('');
}

export async function renderDashboard(env: Env): Promise<Response> {
  const healthHistory = env.DEMO_DB.prepare(
    `SELECT id, service_key, status, response_ms, detail_json, checked_at FROM service_health_checks WHERE service_key = 'public-demo' ORDER BY id DESC LIMIT 100`,
  ).all<HealthRow>();
  const [control, crawlerControl, health, historyResult, logs, usage] = await Promise.all([
    getDemoControl(env), getCrawlerControl(env), collectHealth(env, false), healthHistory,
    recentApplicationLogs(env, { limit: 30 }), latestCloudflareUsage(env),
  ]);
  const availability = availabilitySummary(historyResult.results);
  const version = env.DEPLOYED_VERSION || 'development';
  const overall = control.state === 'offline' ? 'planned' : health.status;
  const overallLabel = overall === 'planned' ? 'PLANNED MAINTENANCE' : overall.toUpperCase();
  const services = [
    { name: 'Worker', state: health.services.worker, latency: null as number | null },
    { name: 'D1', state: health.services.d1, latency: health.responseMs.d1 ?? null },
    { name: 'R2', state: health.services.r2, latency: health.responseMs.r2 ?? null },
    { name: 'Durable Objects', state: health.services.durableObjects, latency: health.responseMs.durableObjects ?? null },
  ];
  const healthy = services.filter((service) => service.state === 'operational').length;
  const usageReady = usage.status === 'live' || usage.status === 'partial';
  const usageState = usageReady ? usage.status.toUpperCase() : usage.status === 'unconfigured' ? 'SETUP NEEDED' : 'STALE';
  const availabilityValue = availability.excludingPlanned === null ? 'AWAITING DATA' : `${availability.excludingPlanned.toFixed(3)}%`;
  const sha = env.DEPLOYED_SHA || '';
  const commitUrl = sha ? `${repoUrl(env)}/commit/${encodeURIComponent(sha)}` : `${repoUrl(env)}/commits/${encodeURIComponent(env.GITHUB_BRANCH || 'main')}`;
  const currentStatus = `<div class="operations-live-state"><span class="status-pulse" data-state="${overall}"></span><strong>${escapeHtml(overallLabel)}</strong><span>Checked ${relativeTime(health.checkedAt)}</span><span>${escapeHtml(env.DEPLOYMENT_ENVIRONMENT || 'local')} · ${escapeHtml(version)}</span></div>`;

  return operationalPage(env, '/dashboard', 'System Operations', 'OPERATIONS / LIVE', 'System Operations', 'Live health, availability, deployment, Cloudflare usage, activity, and cost-control evidence for the architecture demo.', 'src/demos/dashboard.ts', `
  <section class="operations-kpis" aria-label="Current operational state">
    <article><p class="eyebrow">System</p><strong class="${statusClass(overall)}">${escapeHtml(overallLabel)}</strong><span>${healthy} / 4 dependencies healthy</span></article>
    <article><p class="eyebrow">Availability</p><strong>${availabilityValue}</strong><span>${availability.unexpected} unexpected outage${availability.unexpected === 1 ? '' : 's'}</span></article>
    <article><p class="eyebrow">Cloudflare usage</p><strong class="${statusClass(usage.status)}">${usageState}</strong><span>${usageReady ? `Updated ${relativeTime(usage.capturedAt)}` : usage.cost.note}</span></article>
    <article><p class="eyebrow">Deployment</p><strong>${escapeHtml(version)}</strong><span>${escapeHtml(env.DEPLOYMENT_ENVIRONMENT || 'local')} · ${escapeHtml(env.GITHUB_BRANCH || 'unknown branch')}</span></article>
  </section>

  <section class="operations-section" id="health" aria-labelledby="service-health-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Runtime</p><h2 id="service-health-heading">Service health</h2></div><a href="/health">Inspect health JSON <span aria-hidden="true">→</span></a></div>
    <div class="service-health-table" role="table" aria-label="Service health and current response times">
      <div class="service-health-row service-health-head" role="row"><span role="columnheader">Service</span><span role="columnheader">Status</span><span role="columnheader">Latency</span><span aria-hidden="true"></span></div>
      ${services.map((service) => `<div class="service-health-row" role="row"><strong role="cell">${escapeHtml(service.name)}</strong><span role="cell" class="service-state" data-state="${service.state}">${escapeHtml(serviceLabel(service.state))}</span><span role="cell" class="service-latency">${service.latency === null ? '—' : `${service.latency} ms`}</span><span class="latency-track" aria-hidden="true"><span style="width:${service.latency === null ? 0 : Math.min(100, Math.max(4, service.latency / 2.5))}%"></span></span></div>`).join('')}
    </div>
  </section>

  <section class="operations-split">
    <article class="operations-section availability-overview" aria-labelledby="availability-heading">
      <div class="operations-section-heading"><div><p class="eyebrow">Monitoring window</p><h2 id="availability-heading">Availability</h2></div><a href="/dashboard/uptime">View history <span aria-hidden="true">→</span></a></div>
      <p class="operations-hero-value">${availabilityValue}</p><p class="subtle">Excluding planned maintenance across ${availability.total} stored observation${availability.total === 1 ? '' : 's'}.</p>
      ${availabilityTimeline(historyResult.results)}
      <div class="availability-legend"><span><i data-state="operational"></i>Operational</span><span><i data-state="planned"></i>${availability.intentional} planned</span><span><i data-state="degraded"></i>${availability.unexpected} unexpected</span></div>
    </article>
    <article class="operations-section" aria-labelledby="activity-heading">
      <div class="operations-section-heading"><div><p class="eyebrow">Public-safe events</p><h2 id="activity-heading">Recent activity</h2></div><a href="/dashboard/logs">View all logs <span aria-hidden="true">→</span></a></div>
      <div class="activity-list">${dashboardActivity(logs, health)}</div>
    </article>
  </section>

  <section class="operations-split">
    <article class="operations-section usage-overview" aria-labelledby="usage-heading">
      <div class="operations-section-heading"><div><p class="eyebrow">${usageReady ? 'Latest account telemetry' : 'Telemetry status'}</p><h2 id="usage-heading">Cloudflare usage</h2></div><a href="/dashboard/billing">View usage &amp; cost <span aria-hidden="true">→</span></a></div>
      <div class="usage-state-line"><span class="${badgeClass(usage.status)}">${usageState}</span><span>${usageReady ? `Updated ${relativeTime(usage.capturedAt)}` : escapeHtml(usage.cost.note)}</span></div>
      <dl class="usage-compact"><dt>Workers</dt><dd>${usage.products.workers.available ? `${formatNumber(usage.products.workers.requests)} requests` : 'Awaiting telemetry'}</dd><dt>D1</dt><dd>${usage.products.d1.available ? `${formatNumber(usage.products.d1.rowsRead)} rows read` : 'Awaiting telemetry'}</dd><dt>R2</dt><dd>${usage.products.r2.available ? `${formatBytes(usage.products.r2.storageBytes)} stored` : 'Awaiting telemetry'}</dd><dt>Durable Objects</dt><dd>${usage.products.durableObjects.available ? `${formatNumber(usage.products.durableObjects.requests)} requests` : 'Awaiting telemetry'}</dd></dl>
    </article>
    <article class="operations-section deployment-card" aria-labelledby="deployment-heading">
      <div class="operations-section-heading"><div><p class="eyebrow">Release evidence</p><h2 id="deployment-heading">Deployment</h2></div><a href="/version">Version JSON <span aria-hidden="true">→</span></a></div>
      <p class="operations-hero-value">${escapeHtml(version)}</p><span class="badge badge-ok">${escapeHtml((env.DEPLOYMENT_ENVIRONMENT || 'local').toUpperCase())}</span>
      <dl><dt>Branch</dt><dd>${escapeHtml(env.GITHUB_BRANCH || 'not supplied')}</dd><dt>Commit</dt><dd><a href="${escapeHtml(commitUrl)}"><code>${escapeHtml(sha ? sha.slice(0, 7) : 'not supplied')}</code></a></dd><dt>CI</dt><dd>${escapeHtml((env.DEPLOYMENT_CI_STATUS || 'not verified').replace(/-/g, ' ').toUpperCase())}</dd></dl>
      <div class="link-row"><a href="${escapeHtml(commitUrl)}">View commit ↗</a><a href="${escapeHtml(repoUrl(env))}/releases">View releases ↗</a></div>
    </article>
  </section>

  <section class="operations-section assurance-dashboard-card" aria-labelledby="assurance-heading">
    <div>
      <p class="eyebrow">Assurance / canonical registry</p>
      <h2 id="assurance-heading">Compliance &amp; Assurance</h2>
      <p>WCAG 2.2 · ISO/IEC 27001 · ISO/IEC 42001</p>
    </div>
    <div>
      <strong>${publicComplianceRegistry.counts.total} canonical records</strong>
      <div class="link-row"><a href="/compliance">Browse records <span aria-hidden="true">→</span></a><a href="/v1/assurance/compliance">Compliance JSON <span aria-hidden="true">→</span></a></div>
    </div>
  </section>

  <section class="operations-section policy-card" aria-labelledby="policy-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Read-only public state</p><h2 id="policy-heading">Operational policy</h2></div><a href="/admin">Admin controls <span aria-hidden="true">→</span></a></div>
    <div class="policy-grid"><div><span>Demo</span><strong class="${statusClass(control.state)}">${escapeHtml(control.state.toUpperCase())}</strong><small>${escapeHtml(control.publicMessage)}</small></div><div><span>User-requested ChatGPT fetch</span><strong class="${statusClass(crawlerControl.state === 'enabled' ? 'online' : 'offline')}">${escapeHtml(crawlerControl.state.toUpperCase())}</strong><small>Search and user-requested fetch policy</small></div><div><span>Model-training crawl</span><strong class="stat-down">BLOCKED</strong><small><a href="/robots.txt">Inspect robots.txt →</a></small></div></div>
  </section>
  ${referenceDetails([
    { label: 'Dashboard implementation', href: sourceUrl(env, 'src/demos/operations-pages.ts') },
    { label: 'Compliance registry projection', href: sourceUrl(env, 'src/assurance/registry.ts') },
    { label: 'Scheduled collection', href: sourceUrl(env, 'src/index.ts') },
    { label: 'Cloudflare usage collector', href: sourceUrl(env, 'src/lib/cloudflare-usage.ts') },
    { label: 'Operations standard', href: sourceUrl(env, 'docs/OPERATIONS.md') },
  ], 'Implementation evidence')}`, currentStatus);
}

function historyRows(rows: HealthRow[]): string {
  return rows.map((row) => `<tr><td><time datetime="${escapeHtml(row.checked_at)}">${escapeHtml(row.checked_at)}</time></td><td><span class="${badgeClass(isIntentional(row) ? 'planned' : row.status)}">${escapeHtml(isIntentional(row) ? 'planned maintenance' : row.status)}</span></td><td>${row.response_ms ?? '—'} ms</td><td>${isIntentional(row) ? 'planned/manual offline' : row.status === 'operational' ? 'operational observation' : 'unexpected dependency failure'}</td></tr>`).join('');
}

export async function renderUptime(env: Env): Promise<Response> {
  const result = await env.DEMO_DB.prepare(
    `SELECT id, service_key, status, response_ms, detail_json, checked_at FROM service_health_checks WHERE service_key = 'public-demo' ORDER BY id DESC LIMIT 100`,
  ).all<HealthRow>();
  const rows = result.results;
  const summary = availabilitySummary(rows);
  const latest = rows[0];
  const state = latest ? isIntentional(latest) ? 'planned' : latest.status : 'unknown';
  const statusLabel = latest ? state === 'planned' ? 'PLANNED MAINTENANCE' : state.toUpperCase() : 'AWAITING DATA';
  const recent = rows.slice(0, 20); const remainder = rows.slice(20);
  const liveState = `<div class="operations-live-state"><span class="status-pulse" data-state="${state}"></span><strong>${statusLabel}</strong><span>${latest ? `Last observation ${relativeTime(latest.checked_at)}` : 'Cron monitoring has not stored an observation yet'}</span></div>`;
  return operationalPage(env, '/dashboard/uptime', 'Availability', 'OPERATIONS / AVAILABILITY', 'Availability', 'Measured runtime availability with planned maintenance kept separate from unexpected dependency failures.', 'src/demos/uptime.ts', `
  <section class="availability-kpis"><article><p class="eyebrow">Current window</p><strong>${summary.excludingPlanned === null ? '—' : `${summary.excludingPlanned.toFixed(3)}%`}</strong><span>excluding planned maintenance</span></article><article><p class="eyebrow">Raw observations</p><strong>${summary.raw === null ? '—' : `${summary.raw.toFixed(3)}%`}</strong><span>all stored states included</span></article><article><p class="eyebrow">Events</p><strong>${summary.intentional} / ${summary.unexpected}</strong><span>planned / unexpected</span></article></section>
  <section class="operations-section"><div class="operations-section-heading"><div><p class="eyebrow">Latest ${Math.min(rows.length, 40)} observations</p><h2>Availability history</h2></div><span class="subtle">Every 5 minutes</span></div>${availabilityTimeline(rows)}<div class="availability-legend"><span><i data-state="operational"></i>Operational</span><span><i data-state="planned"></i>Planned maintenance</span><span><i data-state="degraded"></i>Unexpected failure</span></div><p class="subtle">This is measured history, not an SLA.</p></section>
  <section class="operations-section"><div class="operations-section-heading"><div><p class="eyebrow">Most recent first</p><h2>Observations</h2></div><span class="subtle">Showing ${recent.length} of ${rows.length}</span></div><div class="table-wrap"><table><thead><tr><th>Checked</th><th>State</th><th>D1 latency</th><th>Classification</th></tr></thead><tbody>${historyRows(recent) || '<tr><td colspan="4">Scheduled monitoring will populate this history after deployment.</td></tr>'}</tbody></table></div>${remainder.length ? `<details class="full-history"><summary>Show full history</summary><div class="table-wrap"><table><thead><tr><th>Checked</th><th>State</th><th>D1 latency</th><th>Classification</th></tr></thead><tbody>${historyRows(remainder)}</tbody></table></div></details>` : ''}<p><a href="${escapeHtml(sourceUrl(env, 'migrations/0002_operations_dashboard.sql'))}">View history schema</a></p></section>`, liveState);
}

export function renderDocs(env: Env): Response {
  const links: Array<[string, string]> = [
    ['Architecture standard', 'docs/ARCHITECTURE-STANDARD.md'], ['Operations standard', 'docs/OPERATIONS.md'], ['Assurance guide', 'docs/ASSURANCE.md'], ['Stable route map', 'docs/ROUTES.md'], ['Machine route manifest', 'docs/route-manifest.json'], ['Router', 'src/router.ts'], ['Implementation plan', 'docs/IMPLEMENTATION-PLAN.md'], ['Interactive demo specification', 'docs/INTERACTIVE-DEMO-SPEC.md'], ['Evidence map', 'docs/EVIDENCE.md'], ['Accessibility guidance', 'docs/ACCESSIBILITY.md'], ['ISO/IEC 27001 compliance dataset', 'assurance/compliance/iso-27001-2022.json'], ['ISO/IEC 42001 compliance dataset', 'assurance/compliance/iso-42001-2023.json'], ['WCAG 2.2 compliance manifest', 'assurance/compliance/wcag-2.2.json'], ['Identity guidance', 'docs/IDENTITY.md'], ['README', 'README.md'], ['Contributing', 'CONTRIBUTING.md'], ['Agent guidance', 'AGENTS.md'], ['Security', 'SECURITY.md'], ['Changelog', 'CHANGELOG.md'], ['Swagger 2.0 contract', 'contracts/openapi/swagger.json'], ['GraphQL schema', 'contracts/graphql/schema.graphql'], ['MCP tools', 'contracts/mcp/tools.json'], ['Webhook events', 'contracts/webhooks/events.json'], ['CI workflow', '.github/workflows/ci.yml'], ['Deploy workflow', '.github/workflows/deploy.yml'], ['D1 migrations', 'migrations/0001_demo_blob.sql'],
  ];
  return operationalPage(env, '/dashboard/docs', 'Documentation', 'OPERATIONS / DOCS', 'Documentation', 'Repository-native standards, contracts, implementation sources, and live machine interfaces.', 'src/demos/docs.ts', `<section class="resource-list" aria-label="Repository documentation">${links.map(([label, path]) => `<a href="${escapeHtml(sourceUrl(env, path))}"><strong>${escapeHtml(label)}</strong><code>${escapeHtml(path)}</code></a>`).join('')}</section><section class="machine-links"><h2>Live interfaces</h2><nav class="link-row" aria-label="Live machine interfaces"><a href="/v1/openapi.json">Swagger JSON</a><a href="/graphql/schema">GraphQL schema</a><a href="/v1/assurance/compliance">Compliance JSON</a><a href="/health">Health JSON</a><a href="/version">Version JSON</a><a href="/__api/operations/logs">Logs JSON</a><a href="/__api/operations/cloudflare-usage">Usage JSON</a><a href="${escapeHtml(repoUrl(env))}/releases">Releases</a><a href="${escapeHtml(repoUrl(env))}/tags">Tags</a></nav></section>`);
}

function productCard(label: string, state: boolean, metrics: Array<[string, string]>): string {
  return `<article class="usage-product"><div><p class="eyebrow">Cloudflare</p><h3>${escapeHtml(label)}</h3><span class="${badgeClass(state ? 'live' : 'unavailable')}">${state ? 'Live usage' : 'Unavailable'}</span></div><dl>${metrics.map(([name, value]) => `<dt>${escapeHtml(name)}</dt><dd>${escapeHtml(state ? value : '—')}</dd>`).join('')}</dl></article>`;
}

function usageTrend(usage: CloudflareUsageSnapshot): string {
  const points = usage.trend.slice(-7);
  if (!points.length) return '<div class="availability-empty">Trend data will appear after Cloudflare returns daily usage buckets.</div>';
  const costMode = points.some((point) => point.costUsd !== null);
  const maximum = Math.max(1, ...points.map((point) => costMode ? point.costUsd ?? 0 : point.requests));
  return `<div class="usage-chart" role="img" aria-label="Seven day ${costMode ? 'usage-based cost' : 'Worker request'} trend">${points.map((point) => {
    const value = costMode ? point.costUsd ?? 0 : point.requests;
    return `<div><span class="usage-bar" style="height:${Math.max(3, value / maximum * 100)}%"></span><strong>${costMode ? `$${value.toFixed(2)}` : formatNumber(value)}</strong><small>${escapeHtml(point.date.slice(5))}</small></div>`;
  }).join('')}</div>`;
}

export async function renderBilling(env: Env): Promise<Response> {
  const [current, syntheticHistory, usage, snapshots] = await Promise.all([currentBudgetState(env), recentUsage(env), latestCloudflareUsage(env), recentCloudflareUsage(env)]);
  const syntheticRows = syntheticHistory.map((row) => `<tr><td>${escapeHtml(row.captured_at)}</td><td>${row.quantity.toLocaleString('en-US')} ${escapeHtml(row.unit)}</td><td>$${row.estimated_cost_usd.toFixed(4)}</td><td>$${(row.budget_limit_usd ?? 0).toFixed(2)}</td><td>${budgetLabel(row.estimated_cost_usd, row.budget_limit_usd ?? 0)}</td></tr>`).join('');
  const usageRows = snapshots.map((row) => `<tr><td>${escapeHtml(row.capturedAt || '—')}</td><td><span class="${badgeClass(row.status)}">${escapeHtml(row.status)}</span></td><td>${row.products.workers.available ? formatNumber(row.products.workers.requests, false) : '—'}</td><td>${row.products.d1.available ? formatNumber(row.products.d1.rowsRead, false) : '—'}</td><td>${row.products.r2.available ? formatBytes(row.products.r2.storageBytes) : '—'}</td><td>${row.cost.amountUsd === null ? '—' : `$${row.cost.amountUsd.toFixed(4)}`} ${row.cost.kind}</td></tr>`).join('');
  const telemetryReady = usage.status === 'live' || usage.status === 'partial';
  const costLabel = usage.cost.kind === 'billed' ? 'Usage-based spend' : usage.cost.kind === 'estimated' ? 'Estimated overage' : 'Usage-based spend';
  const costValue = usage.cost.amountUsd === null ? '—' : `$${usage.cost.amountUsd.toFixed(2)}`;
  const breakdownMaximum = Math.max(0.0001, ...usage.cost.breakdown.map((row) => row.amountUsd));
  const liveState = `<div class="operations-live-state"><span class="status-pulse" data-state="${usage.status}"></span><strong>${telemetryReady ? usage.status.toUpperCase() : usage.status === 'unconfigured' ? 'SETUP NEEDED' : 'TELEMETRY UNAVAILABLE'}</strong><span>${usage.capturedAt ? `Updated ${relativeTime(usage.capturedAt)}` : escapeHtml(usage.cost.note)}</span></div>`;
  return operationalPage(env, '/dashboard/billing', 'Cloudflare Usage & Cost', 'OPERATIONS / USAGE', 'Cloudflare Usage & Cost', 'Live Cloudflare resource consumption with controlled cost-degradation scenarios.', 'src/demos/billing.ts', `
  <section class="billing-period"><div><p class="eyebrow">Current usage window</p><strong>${escapeHtml(usage.cost.periodStart.slice(0, 10))} → ${escapeHtml(usage.cost.periodEnd.slice(0, 10))}</strong></div><div><p class="eyebrow">${escapeHtml(costLabel)}</p><strong>${costValue}</strong><span class="${badgeClass(usage.cost.kind === 'billed' ? 'live' : usage.cost.kind === 'estimated' ? 'warning' : 'unavailable')}">${escapeHtml(usage.cost.kind)}</span></div><p>${escapeHtml(usage.cost.note)}</p></section>
  <section class="operations-section"><div class="operations-section-heading"><div><p class="eyebrow">Normalized, public-safe metrics</p><h2>Resource usage</h2></div><span class="subtle">${usage.capturedAt ? `Updated ${relativeTime(usage.capturedAt)}` : 'Awaiting first refresh'}</span></div><div class="usage-products">
    ${productCard('Workers', usage.products.workers.available, [['Requests', formatNumber(usage.products.workers.requests, false)], ['Errors', formatNumber(usage.products.workers.errors, false)], ['Success rate', usage.products.workers.requests ? `${((usage.products.workers.requests - usage.products.workers.errors) / usage.products.workers.requests * 100).toFixed(3)}%` : '—'], ['CPU p50', usage.products.workers.cpuP50Ms === null ? '—' : `${usage.products.workers.cpuP50Ms.toFixed(1)} ms`], ['CPU p99', usage.products.workers.cpuP99Ms === null ? '—' : `${usage.products.workers.cpuP99Ms.toFixed(1)} ms`], ['Subrequests', formatNumber(usage.products.workers.subrequests, false)]])}
    ${productCard('D1', usage.products.d1.available, [['Rows read', formatNumber(usage.products.d1.rowsRead, false)], ['Rows written', formatNumber(usage.products.d1.rowsWritten, false)], ['Storage', formatBytes(usage.products.d1.storageBytes)], ['Published paid allowance', '25B read · 50M written · 5 GB']])}
    ${productCard('R2', usage.products.r2.available, [['Storage', formatBytes(usage.products.r2.storageBytes)], ['Objects', formatNumber(usage.products.r2.objects, false)], ['Class A', formatNumber(usage.products.r2.classAOperations, false)], ['Class B', formatNumber(usage.products.r2.classBOperations, false)], ['Egress', '$0']])}
    ${productCard('Durable Objects', usage.products.durableObjects.available, [['Requests', formatNumber(usage.products.durableObjects.requests, false)], ['CPU', `${formatNumber(usage.products.durableObjects.cpuTimeMs, false)} ms`], ['Storage', formatBytes(usage.products.durableObjects.storageBytes)]])}
  </div>${usage.failures.length ? `<p class="telemetry-notice"><strong>${usage.status === 'partial' ? 'Partial telemetry:' : 'Refresh detail:'}</strong> ${escapeHtml(usage.failures.join(', '))} did not return a usable dataset in the latest refresh.</p>` : ''}</section>
  <section class="operations-split"><article class="operations-section"><div class="operations-section-heading"><div><p class="eyebrow">Last 7 days</p><h2>Usage trend</h2></div><span class="subtle">${usage.trend.some((point) => point.costUsd !== null) ? 'Usage-based cost' : 'Worker requests'}</span></div>${usageTrend(usage)}</article><article class="operations-section"><div class="operations-section-heading"><div><p class="eyebrow">${escapeHtml(usage.cost.kind)}</p><h2>Cost breakdown</h2></div></div><div class="cost-breakdown">${usage.cost.breakdown.map((row) => `<div><span>${escapeHtml(row.product)}</span><span class="cost-track" aria-hidden="true"><i style="width:${row.amountUsd ? Math.max(3, row.amountUsd / breakdownMaximum * 100) : 0}%"></i></span><strong>$${row.amountUsd.toFixed(4)}</strong></div>`).join('') || '<p class="subtle">Cost fields are not available from this account.</p>'}</div></article></section>
  <section class="operations-section guardrail-simulator"><div class="operations-section-heading"><div><p class="eyebrow">Controlled demonstration</p><h2>Cost guardrail simulator</h2></div><span class="${badgeClass(current.state)}">${escapeHtml(current.state)} · ${current.percent.toFixed(1)}%</span></div><p>Simulate application behavior when cost thresholds are crossed. This does not change Cloudflare billing, thresholds, or account configuration.</p><div class="guardrail-states"><div data-state="normal"><strong>Normal</strong><span>40%</span><p>Optional workloads available.</p></div><div data-state="warning"><strong>Warning</strong><span>75%</span><p>Operators warned. Core behavior unchanged.</p></div><div data-state="degraded"><strong>Degraded</strong><span>95%</span><p>Optional compute paused. Operations stay online.</p></div></div><div class="button-row" aria-label="Guardrail scenario"><button type="button" data-budget="normal" aria-pressed="${current.state === 'normal'}">Normal</button><button type="button" data-budget="warning" aria-pressed="${current.state === 'warning'}">Warning</button><button type="button" data-budget="degraded" aria-pressed="${current.state === 'degraded'}">Degraded</button></div><pre aria-live="polite" data-budget-output hidden></pre></section>
  <section class="operations-section"><div class="operations-section-heading"><div><p class="eyebrow">Cached normalized data</p><h2>Usage history</h2></div><span class="subtle">Latest ${snapshots.length} snapshots</span></div><div class="table-wrap"><table><thead><tr><th>Captured</th><th>Status</th><th>Worker requests</th><th>D1 rows read</th><th>R2 storage</th><th>Cost</th></tr></thead><tbody>${usageRows || '<tr><td colspan="6">Scheduled collection has not stored a Cloudflare snapshot yet.</td></tr>'}</tbody></table></div><details class="full-history"><summary>Synthetic scenario history</summary><div class="table-wrap"><table><thead><tr><th>Captured</th><th>Quantity</th><th>Estimated cost</th><th>Budget</th><th>State</th></tr></thead><tbody>${syntheticRows || '<tr><td colspan="5">No synthetic scenarios have been selected yet.</td></tr>'}</tbody></table></div></details>${referenceDetails([
    { label: 'Cloudflare collector', href: sourceUrl(env, 'src/lib/cloudflare-usage.ts') },
    { label: 'Scheduled pipeline', href: sourceUrl(env, 'src/index.ts') },
    { label: 'Scenario implementation', href: sourceUrl(env, 'src/api/billing.ts') },
    { label: 'Usage schema', href: sourceUrl(env, 'migrations/0011_cloudflare_usage.sql') },
  ], 'Cloudflare API evidence')}</section><script>(()=>{const out=document.querySelector('[data-budget-output]');document.querySelectorAll('[data-budget]').forEach((button)=>button.addEventListener('click',async()=>{out.hidden=false;out.textContent='Updating…';const response=await fetch('/__api/operations/billing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:button.dataset.budget})});out.textContent=JSON.stringify(await response.json(),null,2);if(response.ok)setTimeout(()=>location.reload(),500)}))})()</script>`, liveState);
}

function budgetLabel(cost: number, budget: number): string {
  const percent = budget > 0 ? cost / budget * 100 : 100;
  return percent >= 90 ? 'degraded' : percent >= 70 ? 'warning' : 'normal';
}
