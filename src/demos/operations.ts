import type { Env } from '../types';
import { AVAILABILITY_INTERVAL_MINUTES, AVAILABILITY_RETENTION_DAYS, collectHealth, type HealthSnapshot } from '../api/operations';
import { currentBudgetState, recentUsage } from '../lib/billing';
import { latestCloudflareUsage } from '../lib/cloudflare-usage';
import { getCrawlerControl } from '../lib/crawler-control';
import { getDemoControl } from '../lib/demo-control';
import { repoUrl, sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import { recentApplicationLogs, type ApplicationLogRow } from '../lib/logs';
import { routeUrl } from '../routing/application-routes';
import { pageContent, referenceDetails, type PageContent } from '../ui/page';

interface AvailabilityAggregate {
  stored: number; verified: number; legacy: number; operational: number; intentional: number; unexpected: number;
  first_checked_at: string | null; last_checked_at: string | null; monitoring_started_at: string | null;
}
interface DailyAvailability { day: string; total: number; operational: number; intentional: number; unexpected: number }
interface HealthRow { status: string; response_ms: number | null; detail_json: string | null; checked_at: string }

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

const WINDOWS = {
  '24h': { label: '24 hours', ms: 86_400_000 },
  '7d': { label: '7 days', ms: 7 * 86_400_000 },
  '30d': { label: '30 days', ms: 30 * 86_400_000 },
  '365d': { label: '365 days', ms: AVAILABILITY_RETENTION_DAYS * 86_400_000 },
} as const;
type AvailabilityWindow = keyof typeof WINDOWS;

function selectedWindow(request: Request): AvailabilityWindow {
  const requested = new URL(request.url).searchParams.get('window') as AvailabilityWindow | null;
  return requested && requested in WINDOWS ? requested : '365d';
}
function number(value: unknown): number { return Number(value ?? 0); }
function percent(numerator: number, denominator: number): string { return denominator > 0 ? `${(numerator / denominator * 100).toFixed(3)}%` : '—'; }
function badge(value: string): string { return `badge${['operational', 'online', 'normal', 'available'].includes(value) ? ' badge-ok' : ['down', 'offline', 'unavailable'].includes(value) ? ' badge-down' : ' badge-warn'}`; }
function planned(row: HealthRow): boolean { try { return Boolean(row.detail_json && (JSON.parse(row.detail_json) as { intentionalOffline?: boolean }).intentionalOffline); } catch { return false; } }
function observationState(row: HealthRow): string { return planned(row) ? 'planned' : row.status; }
function dateLabel(value: string | null): string { return value ? new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC') : 'not yet observed'; }
function boundedLimit(value: string | null): number { const parsed = Number(value ?? '50'); return Number.isFinite(parsed) ? Math.max(1, Math.min(200, Math.floor(parsed))) : 50; }
function boundedFilter(value: string | null, maximum: number): string { return value?.trim().slice(0, maximum) || ''; }
function logTitle(row: ApplicationLogRow): string { return row.event_key.replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase()); }
function logDetail(value: string | null): string {
  if (!value) return '';
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export async function operationsAvailabilitySection(request: Request, env: Env): Promise<{ html: string; availabilityLabel: string; unexpected: number }> {
  const now = Date.now();
  const key = selectedWindow(request);
  const window = WINDOWS[key];
  const start = new Date(Math.max(now - window.ms, now - AVAILABILITY_RETENTION_DAYS * 86_400_000)).toISOString();
  const marker = '%"observationSource":"scheduled"%';
  const [aggregateResult, dailyResult, recentResult] = await Promise.all([
    env.DEMO_DB.prepare(`SELECT COUNT(*) AS stored,
      SUM(CASE WHEN COALESCE(detail_json,'') LIKE ? THEN 1 ELSE 0 END) AS verified,
      SUM(CASE WHEN COALESCE(detail_json,'') NOT LIKE ? THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN COALESCE(detail_json,'') LIKE ? AND status='operational' THEN 1 ELSE 0 END) AS operational,
      SUM(CASE WHEN COALESCE(detail_json,'') LIKE ? AND COALESCE(detail_json,'') LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS intentional,
      SUM(CASE WHEN COALESCE(detail_json,'') LIKE ? AND status<>'operational' AND COALESCE(detail_json,'') NOT LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS unexpected,
      MIN(CASE WHEN COALESCE(detail_json,'') LIKE ? THEN checked_at END) AS first_checked_at,
      MAX(CASE WHEN COALESCE(detail_json,'') LIKE ? THEN checked_at END) AS last_checked_at,
      (SELECT MIN(h.checked_at) FROM service_health_checks h WHERE h.service_key='public-demo' AND COALESCE(h.detail_json,'') LIKE ?) AS monitoring_started_at
      FROM service_health_checks WHERE service_key='public-demo' AND checked_at>=?`)
      .bind(marker, marker, marker, marker, marker, marker, marker, marker, start).all<AvailabilityAggregate>(),
    env.DEMO_DB.prepare(`SELECT substr(checked_at,1,10) AS day, COUNT(*) AS total,
      SUM(CASE WHEN status='operational' THEN 1 ELSE 0 END) AS operational,
      SUM(CASE WHEN COALESCE(detail_json,'') LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS intentional,
      SUM(CASE WHEN status<>'operational' AND COALESCE(detail_json,'') NOT LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS unexpected
      FROM service_health_checks WHERE service_key='public-demo' AND checked_at>=? AND COALESCE(detail_json,'') LIKE ?
      GROUP BY substr(checked_at,1,10) ORDER BY day DESC LIMIT 365`).bind(start, marker).all<DailyAvailability>(),
    env.DEMO_DB.prepare(`SELECT status,response_ms,detail_json,checked_at FROM service_health_checks
      WHERE service_key='public-demo' AND checked_at>=? AND COALESCE(detail_json,'') LIKE ? ORDER BY checked_at DESC LIMIT 50`)
      .bind(start, marker).all<HealthRow>(),
  ]);
  const raw = aggregateResult.results[0];
  const aggregate = {
    stored: number(raw?.stored), verified: number(raw?.verified), legacy: number(raw?.legacy), operational: number(raw?.operational),
    intentional: number(raw?.intentional), unexpected: number(raw?.unexpected), first: raw?.first_checked_at ?? null,
    last: raw?.last_checked_at ?? null, monitoringStarted: raw?.monitoring_started_at ?? null,
  };
  const measured = Math.max(0, aggregate.verified - aggregate.intentional);
  const availabilityLabel = percent(aggregate.operational, measured);
  const recent = recentResult.results;
  const dailyRows = dailyResult.results.map((row) => `<tr><td>${escapeHtml(String(row.day || '—'))}</td><td>${percent(number(row.operational), Math.max(0, number(row.total) - number(row.intentional)))}</td><td>${number(row.total)}</td><td>${number(row.intentional)}</td><td>${number(row.unexpected)}</td></tr>`).join('');
  const recentRows = recent.map((row) => `<tr><td>${escapeHtml(dateLabel(row.checked_at))}</td><td><span class="${badge(observationState(row))}">${escapeHtml(observationState(row))}</span></td><td>${row.response_ms === null ? '—' : `${row.response_ms} ms`}</td></tr>`).join('');
  const links = (Object.keys(WINDOWS) as AvailabilityWindow[]).map((candidate) => `<a href="${escapeHtml(routeUrl('operations.index', {}, { window: candidate }))}#availability"${candidate === key ? ' aria-current="true"' : ''}>${WINDOWS[candidate].label}</a>`).join('');
  return { availabilityLabel, unexpected: aggregate.unexpected, html: `<section class="operations-section" id="availability" aria-labelledby="availability-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Availability</p><h2 id="availability-heading">Measured service history</h2></div><div class="link-row"><a href="${escapeHtml(sourceUrl(env, 'src/api/operations.ts'))}">Source ↗</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Docs ↗</a></div></div>
    <p>Only scheduled ${AVAILABILITY_INTERVAL_MINUTES}-minute observations count toward measured availability. Interactive health reads do not write history. Records are retained for ${AVAILABILITY_RETENTION_DAYS} days.</p>
    <div class="availability-kpis"><article><strong>${availabilityLabel}</strong><span>measured availability</span></article><article><strong>${aggregate.verified}</strong><span>verified scheduled observations</span></article><article><strong>${aggregate.intentional}</strong><span>planned intervals excluded</span></article><article><strong>${aggregate.unexpected}</strong><span>unexpected intervals</span></article></div>
    ${aggregate.legacy ? `<p class="assurance-notice">${aggregate.legacy} legacy observation${aggregate.legacy === 1 ? '' : 's'} remain in storage but are excluded from availability calculations.</p>` : ''}
    <details class="operations-inspection"${new URL(request.url).searchParams.has('window') ? ' open' : ''}><summary>Inspect long availability history</summary>
      <div class="operations-section-heading"><h3>${window.label} of measured history</h3><div class="link-row">${links}</div></div>
      <p class="subtle">Monitoring began ${escapeHtml(dateLabel(aggregate.monitoringStarted))}; selected-window observations span ${escapeHtml(dateLabel(aggregate.first))} through ${escapeHtml(dateLabel(aggregate.last))}. This is self-observed evidence, not an independent SLA.</p>
      <div class="table-wrap"><table><thead><tr><th>Day</th><th>Availability</th><th>Observed</th><th>Planned</th><th>Unexpected</th></tr></thead><tbody>${dailyRows || '<tr><td colspan="5">Awaiting the first verified scheduled observation.</td></tr>'}</tbody></table></div>
      <details><summary>Recent scheduled observations</summary><div class="table-wrap"><table><thead><tr><th>Observed</th><th>State</th><th>D1 latency</th></tr></thead><tbody>${recentRows || '<tr><td colspan="3">Awaiting the first verified scheduled observation.</td></tr>'}</tbody></table></div></details>
    </details>
  </section>` };
}

export async function operationsActivitySection(request: Request, env: Env, health: HealthSnapshot): Promise<{ html: string; recent: ApplicationLogRow[] }> {
  const url = new URL(request.url);
  const requestedLevel = url.searchParams.get('level');
  const level = requestedLevel && LOG_LEVELS.includes(requestedLevel as typeof LOG_LEVELS[number]) ? requestedLevel : '';
  const source = boundedFilter(url.searchParams.get('source'), 80);
  const requestId = boundedFilter(url.searchParams.get('requestId'), 120);
  const limit = boundedLimit(url.searchParams.get('limit'));
  const recent = await recentApplicationLogs(env, { limit, level, source, requestId });
  const filtered = Boolean(level || source || requestId);
  const explorerOpen = ['level', 'source', 'requestId', 'limit'].some((key) => url.searchParams.has(key));
  const query: Record<string, string> = { limit: String(limit) };
  if (level) query.level = level; if (source) query.source = source; if (requestId) query.requestId = requestId;
  const apiHref = routeUrl('operations.api-logs', {}, query);
  const rows = recent.map((row) => `<tr><td><time datetime="${escapeHtml(row.created_at)}">${escapeHtml(row.created_at)}</time></td><td>${escapeHtml(row.level)}</td><td>${escapeHtml(row.source)}</td><td><strong>${escapeHtml(logTitle(row))}</strong><br><span>${escapeHtml(row.message)}</span></td><td>${escapeHtml(row.request_id || '—')}</td><td>${escapeHtml(row.route || '—')}</td><td>${row.detail_json ? `<details><summary>View</summary><pre>${escapeHtml(logDetail(row.detail_json))}</pre></details>` : '—'}</td></tr>`).join('');
  const preview = recent.slice(0, 3).map((row) => `<article class="activity-item"><span class="activity-dot" data-tone="${row.level === 'error' ? 'down' : row.level === 'warn' ? 'warn' : 'ok'}"></span><div><h3>${escapeHtml(logTitle(row))}</h3><p>${escapeHtml(row.message)}</p><small>${escapeHtml(row.source)} · ${escapeHtml(row.created_at)}</small></div></article>`).join('');
  const levelOptions = LOG_LEVELS.map((candidate) => `<option value="${candidate}"${candidate === level ? ' selected' : ''}>${candidate}</option>`).join('');
  return { recent, html: `<section class="operations-section" id="activity" aria-labelledby="activity-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Activity</p><h2 id="activity-heading">Public-safe application activity</h2></div><div class="link-row"><a href="${escapeHtml(sourceUrl(env, 'src/lib/logs.ts'))}">Source ↗</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Docs ↗</a></div></div>
    <p>Recent application events explain runtime behavior without exposing credentials or private provider payloads. Searches are bounded to at most 200 sanitized records.</p>
    <div class="activity-list">${preview || `<p>${health.status === 'offline' ? 'The demo is intentionally offline.' : 'No logs have been recorded yet.'}</p>`}</div>
    <details class="operations-inspection"${explorerOpen ? ' open' : ''}><summary>Open bounded log explorer</summary>
      <form method="get" action="${escapeHtml(routeUrl('operations.index'))}#activity" class="filters"><label>Level<select name="level"><option value="">All</option>${levelOptions}</select></label><label>Source<input name="source" maxlength="80" value="${escapeHtml(source)}"></label><label>Request ID<input name="requestId" maxlength="120" value="${escapeHtml(requestId)}"></label><label>Limit<input name="limit" type="number" min="1" max="200" value="${limit}"></label><button type="submit">Search</button><a href="${escapeHtml(routeUrl('operations.index'))}#activity">Reset</a><a href="${escapeHtml(apiHref)}">Matching JSON</a></form>
      <div class="table-wrap"><table><thead><tr><th>Time</th><th>Level</th><th>Source</th><th>Event</th><th>Request</th><th>Route</th><th>Detail</th></tr></thead><tbody>${rows || `<tr><td colspan="7">${filtered ? 'No events match the selected filters.' : 'No logs have been recorded yet.'}</td></tr>`}</tbody></table></div>
    </details>
  </section>` };
}

async function usageSection(env: Env): Promise<string> {
  const [budget, scenarios, usage] = await Promise.all([currentBudgetState(env), recentUsage(env), latestCloudflareUsage(env)]);
  const products = [
    ['Workers', usage.products.workers.availability, `${usage.products.workers.requests.toLocaleString('en-US')} requests`],
    ['D1', usage.products.d1.availability, `${usage.products.d1.rowsRead.toLocaleString('en-US')} rows read`],
    ['R2', usage.products.r2.availability, `${usage.products.r2.objects.toLocaleString('en-US')} objects`],
    ['Durable Objects', usage.products.durableObjects.availability, `${usage.products.durableObjects.requests.toLocaleString('en-US')} requests`],
  ];
  const scenarioRows = scenarios.map((row) => `<tr><td>${escapeHtml(row.captured_at)}</td><td>${row.quantity.toLocaleString('en-US')} ${escapeHtml(row.unit)}</td><td>$${row.estimated_cost_usd.toFixed(4)}</td><td>$${(row.budget_limit_usd ?? 0).toFixed(2)}</td></tr>`).join('');
  return `<section class="operations-section" id="usage" aria-labelledby="usage-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Usage &amp; cost</p><h2 id="usage-heading">Resource pressure and cost resilience</h2></div><div class="link-row"><a href="${escapeHtml(sourceUrl(env, 'src/lib/cloudflare-usage.ts'))}">Source ↗</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Docs ↗</a></div></div>
    <p>Provider telemetry and the synthetic cost guardrail are separate signals. Unavailable billing data does not establish an application outage.</p>
    <div class="usage-products">${products.map(([name, state, value]) => `<article class="usage-product"><div><strong>${escapeHtml(name)}</strong><span class="${badge(state)}">${escapeHtml(state)}</span></div><p>${escapeHtml(value)}</p></article>`).join('')}</div>
    <details class="operations-inspection"><summary>Inspect usage, cost, and guardrails</summary>
      <section><h3>Usage-based spend</h3><p><strong>${usage.cost.amountUsd === null ? '—' : `$${usage.cost.amountUsd.toFixed(2)}`}</strong> · ${escapeHtml(usage.cost.kind)} · ${escapeHtml(usage.cost.availability)}</p><p>${escapeHtml(usage.cost.note)}</p></section>
      <section class="guardrail-simulator"><h3>Cost guardrail simulator</h3><p>Warning begins at 70%; degradation begins at 90%. Degraded pauses optional Worker compute while core operations remain available.</p><div class="button-row"><button type="button" data-budget="normal" aria-pressed="${budget.state === 'normal'}">Normal</button><button type="button" data-budget="warning" aria-pressed="${budget.state === 'warning'}">Warning</button><button type="button" data-budget="degraded" aria-pressed="${budget.state === 'degraded'}">Degraded</button></div><pre aria-live="polite" data-budget-output hidden></pre></section>
      <details><summary>Synthetic scenario history</summary><div class="table-wrap"><table><thead><tr><th>Captured</th><th>Quantity</th><th>Estimated cost</th><th>Budget</th></tr></thead><tbody>${scenarioRows || '<tr><td colspan="4">No synthetic scenarios have been selected yet.</td></tr>'}</tbody></table></div></details>
    </details>
    <script>(()=>{const out=document.querySelector('[data-budget-output]');document.querySelectorAll('[data-budget]').forEach((button)=>button.addEventListener('click',async()=>{out.hidden=false;out.textContent='Updating…';const response=await fetch(${JSON.stringify(routeUrl('operations.api-budget'))},{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:button.dataset.budget})});out.textContent=JSON.stringify(await response.json(),null,2);if(response.ok)setTimeout(()=>location.reload(),500)}))})()</script>
  </section>`;
}

function deploymentSection(env: Env): string {
  const version = env.DEPLOYED_VERSION || 'development'; const sha = env.DEPLOYED_SHA || ''; const branch = env.GITHUB_BRANCH || 'main';
  const commit = sha ? `${repoUrl(env)}/commit/${encodeURIComponent(sha)}` : `${repoUrl(env)}/commits/${encodeURIComponent(branch)}`;
  return `<section class="operations-section" id="deployment" aria-labelledby="deployment-heading"><div class="operations-section-heading"><div><p class="eyebrow">Deployment</p><h2 id="deployment-heading">Release evidence</h2></div><div class="link-row"><a href="${escapeHtml(sourceUrl(env, '.github/workflows/deploy.yml'))}">Source ↗</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Docs ↗</a></div></div><p>Verify the running release against version metadata, repository source, and CI history.</p><dl><dt>Version</dt><dd>${escapeHtml(version)}</dd><dt>Environment</dt><dd>${escapeHtml(env.DEPLOYMENT_ENVIRONMENT || 'local')}</dd><dt>Branch</dt><dd>${escapeHtml(branch)}</dd><dt>Commit</dt><dd><a href="${escapeHtml(commit)}">${escapeHtml(sha ? sha.slice(0, 7) : 'not supplied')}</a></dd></dl><div class="link-row"><a href="${escapeHtml(routeUrl('operations.version'))}">Version JSON</a><a href="${escapeHtml(commit)}">Commit ↗</a><a href="${escapeHtml(repoUrl(env))}/actions">Actions ↗</a><a href="${escapeHtml(repoUrl(env))}/releases">Releases ↗</a><a href="${escapeHtml(sourceUrl(env, 'docs/ROUTES.md'))}">Route docs ↗</a></div></section>`;
}

export async function operationsContent(request: Request, env: Env): Promise<PageContent> {
  const [control, crawler, health, availability, usage] = await Promise.all([getDemoControl(env), getCrawlerControl(env), collectHealth(env, false), operationsAvailabilitySection(request, env), usageSection(env)]);
  const activity = await operationsActivitySection(request, env, health);
  const services = Object.values(health.services); const healthy = services.filter((state) => state === 'operational').length;
  const overall = control.state === 'offline' ? 'PLANNED MAINTENANCE' : health.status.toUpperCase();
  const body = `<section class="page-header operations-header"><h1>Operations</h1><p class="lede">One dashboard for status, measured availability, public-safe activity, usage and cost, and deployment evidence.</p><nav class="link-row" aria-label="Operations sections"><a href="#status">Status</a><a href="#availability">Availability</a><a href="#activity">Activity</a><a href="#usage">Usage</a><a href="#deployment">Deployment</a></nav></section>
  <section class="operations-kpis" aria-label="Current operational state"><article><strong>${escapeHtml(overall)}</strong><span>${healthy} / ${services.length} dependencies healthy</span></article><article><strong>${availability.availabilityLabel}</strong><span>${availability.unexpected} unexpected intervals</span></article><article><strong>${activity.recent.length}</strong><span>bounded matching events</span></article><article><strong>${escapeHtml(env.DEPLOYED_VERSION || 'development')}</strong><span>${escapeHtml(env.DEPLOYMENT_ENVIRONMENT || 'local')}</span></article></section>
  <section class="operations-section" id="status" aria-labelledby="status-heading"><div class="operations-section-heading"><div><p class="eyebrow">Status</p><h2 id="status-heading">Current service posture</h2></div><div class="link-row"><a href="${escapeHtml(sourceUrl(env, 'src/api/operations.ts'))}">Source ↗</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Docs ↗</a></div></div><p><strong>${escapeHtml(overall)}</strong> · observed ${escapeHtml(dateLabel(health.checkedAt))}</p><div class="usage-products">${Object.entries(health.services).map(([name, state]) => `<article class="usage-product"><div><strong>${escapeHtml(name)}</strong><span class="${badge(state)}">${escapeHtml(state)}</span></div></article>`).join('')}</div><div class="link-row"><a href="${routeUrl('operations.health')}">Health JSON</a><a href="${routeUrl('operations.version')}">Version JSON</a><a href="${routeUrl('operations.robots')}">robots.txt</a></div><details class="operations-inspection"><summary>Inspect operational policy</summary><p>Demo: <strong>${escapeHtml(control.state)}</strong> — ${escapeHtml(control.publicMessage)}</p><p>User-requested ChatGPT fetch: <strong>${escapeHtml(crawler.state)}</strong>. Model-training crawl remains blocked through robots policy.</p></details></section>
  ${availability.html}${activity.html}${usage}${deploymentSection(env)}
  ${referenceDetails([{ label: 'Operations source', href: sourceUrl(env, 'src/demos/operations.ts') }, { label: 'Operations docs', href: sourceUrl(env, 'docs/OPERATIONS.md') }, { label: 'Route contract', href: sourceUrl(env, 'docs/ROUTES.md') }, { label: 'Reporting API source', href: sourceUrl(env, 'src/api/reporting.ts') }], 'Source and documentation')}`;
  return pageContent(env, 'System Operations', body, { routeId: 'operations.index', cacheControl: 'no-store', canonicalPath: routeUrl('operations.index'), description: 'Single public operations dashboard for status, availability, activity, usage and cost, and deployment evidence.' });
}
