import type { Env } from '../types';
import { AVAILABILITY_INTERVAL_MINUTES, AVAILABILITY_RETENTION_DAYS } from '../api/operations';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

type AvailabilityState = 'operational' | 'degraded' | 'down' | 'unknown';
type AvailabilityWindowKey = '24h' | '7d' | '30d' | '365d';

interface HealthRow {
  id: number;
  service_key: string;
  status: AvailabilityState;
  response_ms: number | null;
  detail_json: string | null;
  checked_at: string;
}

interface AvailabilityAggregate {
  stored: number;
  verified: number;
  legacy: number;
  operational: number;
  intentional: number;
  unexpected: number;
  first_checked_at: string | null;
  last_checked_at: string | null;
  monitoring_started_at: string | null;
}

interface DailyAvailabilityRow {
  day: string;
  total: number;
  operational: number;
  intentional: number;
  unexpected: number;
}

interface ObservationDetail {
  intentionalOffline?: boolean;
  observationSource?: string;
  observedAt?: string;
  scheduledAt?: string;
  services?: Record<string, string>;
}

const DAY_MS = 86_400_000;
const INTERVAL_MS = AVAILABILITY_INTERVAL_MINUTES * 60_000;
const WINDOWS: ReadonlyArray<{ key: AvailabilityWindowKey; label: string; durationMs: number }> = [
  { key: '24h', label: '24 hours', durationMs: DAY_MS },
  { key: '7d', label: '7 days', durationMs: 7 * DAY_MS },
  { key: '30d', label: '30 days', durationMs: 30 * DAY_MS },
  { key: '365d', label: '365 days', durationMs: AVAILABILITY_RETENTION_DAYS * DAY_MS },
];

function parseDetail(row: HealthRow): ObservationDetail {
  try {
    return row.detail_json ? JSON.parse(row.detail_json) as ObservationDetail : {};
  } catch {
    return {};
  }
}

function isPlanned(row: HealthRow): boolean {
  return Boolean(parseDetail(row).intentionalOffline);
}

function stateFor(row: HealthRow): string {
  return isPlanned(row) ? 'planned' : row.status;
}

function badgeClass(value: string): string {
  if (value === 'operational') return 'badge badge-ok';
  if (value === 'planned' || value === 'degraded') return 'badge badge-warn';
  if (value === 'down') return 'badge badge-down';
  return 'badge';
}

function selectedWindow(request: Request): { key: AvailabilityWindowKey; label: string; durationMs: number } {
  const requested = new URL(request.url).searchParams.get('window');
  return WINDOWS.find((candidate) => candidate.key === requested) ?? WINDOWS[3];
}

function percent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator * 100 : null;
}

function percentLabel(value: number | null, precision = 3): string {
  return value === null ? '—' : `${value.toFixed(precision)}%`;
}

function humanDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const remainder = minutes % 60;
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', remainder ? `${remainder}m` : ''].filter(Boolean).join(' ');
}

function formatUtc(value: string | null): string {
  if (!value) return 'Not yet observed';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
  }).format(parsed)} UTC`;
}

function relativeTime(value: string | null, now: number): string {
  if (!value) return 'not yet observed';
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

function dependencySummary(row: HealthRow): string {
  if (isPlanned(row)) return 'Intentional demo offline';
  const services = parseDetail(row).services ?? {};
  const unavailable = Object.entries(services)
    .filter(([, status]) => status === 'unavailable')
    .map(([service]) => service === 'durableObjects' ? 'Durable Objects' : service.toUpperCase() === 'D1' ? 'D1' : service.toUpperCase() === 'R2' ? 'R2' : service);
  if (unavailable.length) return unavailable.join(', ');
  return row.status === 'operational' ? 'None' : 'Dependency not retained';
}

function historyRows(rows: HealthRow[]): string {
  return rows.map((row) => {
    const state = stateFor(row);
    return `<tr>
      <td><time datetime="${escapeHtml(row.checked_at)}">${escapeHtml(formatUtc(row.checked_at))}</time></td>
      <td><span class="${badgeClass(state)}">${escapeHtml(state === 'planned' ? 'planned maintenance' : state)}</span></td>
      <td>${escapeHtml(dependencySummary(row))}</td>
      <td>${row.response_ms === null ? '—' : `${row.response_ms} ms`}</td>
    </tr>`;
  }).join('');
}

function recentTimeline(rows: HealthRow[], limit = 40): string {
  const observations = rows.slice(0, limit).reverse();
  if (!observations.length) return '<div class="availability-empty">Awaiting the first verified scheduled observation.</div>';
  const operational = observations.filter((row) => row.status === 'operational').length;
  const planned = observations.filter(isPlanned).length;
  const unexpected = observations.filter((row) => row.status !== 'operational' && !isPlanned(row)).length;
  return `<div class="availability-timeline" role="img" aria-label="${escapeHtml(`${observations.length} verified scheduled observations: ${operational} operational, ${planned} planned, ${unexpected} unexpected`)}">${observations.map((row) => `<span data-state="${escapeHtml(stateFor(row))}" title="${escapeHtml(`${formatUtc(row.checked_at)} · ${stateFor(row)}`)}"></span>`).join('')}</div>`;
}

function dailyTimeline(rows: DailyAvailabilityRow[], startMs: number | null, endMs: number): string {
  if (startMs === null) return '<div class="availability-empty">Daily history begins with the first verified scheduled observation.</div>';
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const spans: string[] = [];
  let gaps = 0;
  const cursor = new Date(startMs);
  cursor.setUTCHours(0, 0, 0, 0);
  const last = new Date(endMs);
  last.setUTCHours(0, 0, 0, 0);
  while (cursor.getTime() <= last.getTime()) {
    const day = cursor.toISOString().slice(0, 10);
    const row = byDay.get(day);
    if (!row) {
      gaps += 1;
      spans.push(`<span data-state="unknown" title="${day} · no verified scheduled observations"></span>`);
    } else {
      const state = row.unexpected > 0 ? 'degraded' : row.intentional > 0 ? 'planned' : 'operational';
      const measured = row.total - row.intentional;
      const availability = measured > 0 ? row.operational / measured * 100 : 100;
      spans.push(`<span data-state="${state}" title="${escapeHtml(`${day} · ${availability.toFixed(3)}% measured availability · ${row.total} observations`)}"></span>`);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const rowsByPeriod: string[] = [];
  for (let index = 0; index < spans.length; index += 90) {
    rowsByPeriod.push(`<div class="availability-timeline" aria-hidden="true">${spans.slice(index, index + 90).join('')}</div>`);
  }
  return `<div role="img" aria-label="Daily availability history with ${spans.length} day${spans.length === 1 ? '' : 's'} and ${gaps} day${gaps === 1 ? '' : 's'} without verified observations">${rowsByPeriod.join('')}</div>`;
}

export async function availabilityContent(request: Request, env: Env): Promise<PageContent> {
  const now = Date.now();
  const window = selectedWindow(request);
  const retentionStart = now - AVAILABILITY_RETENTION_DAYS * DAY_MS;
  const windowStart = Math.max(retentionStart, now - window.durationMs);
  const windowStartIso = new Date(windowStart).toISOString();
  const verifiedMarker = '%"observationSource":"scheduled"%';

  const [aggregateResult, dailyResult, recentResult] = await Promise.all([
    env.DEMO_DB.prepare(`
      SELECT
        COUNT(*) AS stored,
        SUM(CASE WHEN COALESCE(detail_json, '') LIKE ? THEN 1 ELSE 0 END) AS verified,
        SUM(CASE WHEN COALESCE(detail_json, '') NOT LIKE ? THEN 1 ELSE 0 END) AS legacy,
        SUM(CASE WHEN COALESCE(detail_json, '') LIKE ? AND status = 'operational' THEN 1 ELSE 0 END) AS operational,
        SUM(CASE WHEN COALESCE(detail_json, '') LIKE ? AND COALESCE(detail_json, '') LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS intentional,
        SUM(CASE WHEN COALESCE(detail_json, '') LIKE ? AND status <> 'operational' AND COALESCE(detail_json, '') NOT LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS unexpected,
        MIN(CASE WHEN COALESCE(detail_json, '') LIKE ? THEN checked_at END) AS first_checked_at,
        MAX(CASE WHEN COALESCE(detail_json, '') LIKE ? THEN checked_at END) AS last_checked_at,
        (SELECT MIN(h.checked_at) FROM service_health_checks h WHERE h.service_key = 'public-demo' AND COALESCE(h.detail_json, '') LIKE ?) AS monitoring_started_at
      FROM service_health_checks
      WHERE service_key = 'public-demo' AND checked_at >= ?
    `).bind(verifiedMarker, verifiedMarker, verifiedMarker, verifiedMarker, verifiedMarker, verifiedMarker, verifiedMarker, verifiedMarker, windowStartIso).all<AvailabilityAggregate>(),
    env.DEMO_DB.prepare(`
      SELECT
        substr(checked_at, 1, 10) AS day,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) AS operational,
        SUM(CASE WHEN COALESCE(detail_json, '') LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS intentional,
        SUM(CASE WHEN status <> 'operational' AND COALESCE(detail_json, '') NOT LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS unexpected
      FROM service_health_checks
      WHERE service_key = 'public-demo' AND checked_at >= ? AND COALESCE(detail_json, '') LIKE ?
      GROUP BY substr(checked_at, 1, 10)
      ORDER BY day ASC
    `).bind(windowStartIso, verifiedMarker).all<DailyAvailabilityRow>(),
    env.DEMO_DB.prepare(`
      SELECT id, service_key, status, response_ms, detail_json, checked_at
      FROM service_health_checks
      WHERE service_key = 'public-demo' AND checked_at >= ? AND COALESCE(detail_json, '') LIKE ?
      ORDER BY checked_at DESC
      LIMIT 50
    `).bind(windowStartIso, verifiedMarker).all<HealthRow>(),
  ]);

  const raw = aggregateResult.results[0] ?? {
    stored: 0, verified: 0, legacy: 0, operational: 0, intentional: 0, unexpected: 0,
    first_checked_at: null, last_checked_at: null, monitoring_started_at: null,
  };
  const aggregate: AvailabilityAggregate = {
    stored: Number(raw.stored ?? 0), verified: Number(raw.verified ?? 0), legacy: Number(raw.legacy ?? 0),
    operational: Number(raw.operational ?? 0), intentional: Number(raw.intentional ?? 0), unexpected: Number(raw.unexpected ?? 0),
    first_checked_at: raw.first_checked_at ?? null, last_checked_at: raw.last_checked_at ?? null,
    monitoring_started_at: raw.monitoring_started_at ?? null,
  };
  const daily = dailyResult.results.map((row) => ({
    ...row,
    total: Number(row.total ?? 0), operational: Number(row.operational ?? 0),
    intentional: Number(row.intentional ?? 0), unexpected: Number(row.unexpected ?? 0),
  }));
  const recent = recentResult.results;

  const measured = Math.max(0, aggregate.verified - aggregate.intentional);
  const measuredAvailability = percent(aggregate.operational, measured);
  const rawAvailability = percent(aggregate.operational, aggregate.verified);
  const monitoringStartedMs = aggregate.monitoring_started_at ? Date.parse(aggregate.monitoring_started_at) : Number.NaN;
  const coverageStart = Number.isFinite(monitoringStartedMs) ? Math.max(windowStart, monitoringStartedMs) : null;
  const latestExpectedSlot = Math.floor(now / INTERVAL_MS) * INTERVAL_MS;
  const expected = coverageStart === null || coverageStart > latestExpectedSlot
    ? 0
    : Math.floor((latestExpectedSlot - Math.ceil(coverageStart / INTERVAL_MS) * INTERVAL_MS) / INTERVAL_MS) + 1;
  const observed = aggregate.verified;
  const gaps = Math.max(0, expected - observed);
  const coverage = expected > 0 ? Math.min(100, observed / expected * 100) : null;
  const latest = recent[0];
  const liveState = latest
    ? `<div class="operations-live-state"><span class="status-pulse" data-state="${escapeHtml(stateFor(latest))}"></span><strong>${escapeHtml(stateFor(latest) === 'planned' ? 'PLANNED MAINTENANCE' : latest.status.toUpperCase())}</strong><span>Last scheduled observation ${relativeTime(latest.checked_at, now)}</span></div>`
    : '<div class="operations-live-state"><span class="status-pulse" data-state="unknown"></span><strong>AWAITING SCHEDULED DATA</strong><span>No verified scheduled observation in this window</span></div>';
  const windowLinks = WINDOWS.map((option) => {
    const href = routeUrl('operations.availability', {}, { window: option.key });
    return `<a href="${escapeHtml(href)}"${option.key === window.key ? ' aria-current="true"' : ''}>${escapeHtml(option.label)}</a>`;
  }).join('');
  const historyStart = coverageStart === null ? null : coverageStart;
  const legacyQualification = aggregate.legacy > 0
    ? `<p class="assurance-notice"><strong>Legacy qualification:</strong> ${aggregate.legacy} retained pre-DEMO-233 observation${aggregate.legacy === 1 ? '' : 's'} in this window may include interactive health reads. They remain visible in storage until normal 365-day expiry, but are excluded from availability and coverage calculations.</p>`
    : '';

  return pageContent(env, 'Availability', `<section class="page-header operations-header">
    <h1>Availability</h1>
    <p class="lede">A rolling, scheduler-owned record of whether the public demo and its configured dependencies were observable at five-minute intervals.</p>
    ${liveState}
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/availability-page.ts'))}">View source <span aria-hidden="true">↗</span></a></div>
  </section>

  <section class="operations-section" aria-labelledby="availability-window-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Review window</p><h2 id="availability-window-heading">${escapeHtml(window.label)} of measured history</h2></div><div class="link-row">${windowLinks}</div></div>
    <p>Only the scheduled five-minute collector writes availability evidence. Interactive health reads do not change history. Records are retained for ${AVAILABILITY_RETENTION_DAYS} days and purged automatically after they cross that boundary.</p>
    <p class="subtle">Selected window: ${escapeHtml(formatUtc(windowStartIso))} → ${escapeHtml(formatUtc(new Date(now).toISOString()))}. This is self-observed service telemetry, not an independent external SLA monitor.</p>
    ${legacyQualification}
  </section>

  <section class="availability-kpis" aria-label="Availability posture">
    <article><p class="eyebrow">Measured availability</p><strong>${percentLabel(measuredAvailability)}</strong><span>verified observations, excluding planned maintenance</span></article>
    <article><p class="eyebrow">Monitoring coverage</p><strong>${percentLabel(coverage, 2)}</strong><span>${observed} observed / ${expected} expected · ${gaps} gap${gaps === 1 ? '' : 's'}</span></article>
    <article><p class="eyebrow">Unexpected intervals</p><strong>${aggregate.unexpected}</strong><span>≈ ${humanDuration(aggregate.unexpected * AVAILABILITY_INTERVAL_MINUTES)} at five-minute sampling</span></article>
    <article><p class="eyebrow">Planned maintenance</p><strong>${aggregate.intentional}</strong><span>≈ ${humanDuration(aggregate.intentional * AVAILABILITY_INTERVAL_MINUTES)} excluded from measured availability</span></article>
  </section>

  <section class="operations-section" aria-labelledby="daily-history-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Long-term view</p><h2 id="daily-history-heading">Daily availability</h2></div><span class="subtle">${percentLabel(rawAvailability)} raw scheduled observations</span></div>
    ${dailyTimeline(daily, historyStart, now)}
    <div class="availability-legend"><span><i data-state="operational"></i>Operational day</span><span><i data-state="planned"></i>Planned maintenance observed</span><span><i data-state="degraded"></i>Unexpected failure observed</span><span><i data-state="unknown"></i>No verified observation</span></div>
    <p class="subtle">A day is marked unexpected when any verified interval is degraded or down. Missing monitoring is shown separately and never counted as healthy.</p>
  </section>

  <section class="operations-section" aria-labelledby="recent-observations-heading">
    <div class="operations-section-heading"><div><p class="eyebrow">Most recent ${Math.min(recent.length, 40)} verified intervals</p><h2 id="recent-observations-heading">Recent scheduled observations</h2></div><span class="subtle">Every ${AVAILABILITY_INTERVAL_MINUTES} minutes</span></div>
    ${recentTimeline(recent)}
    <div class="availability-legend"><span><i data-state="operational"></i>Operational</span><span><i data-state="planned"></i>Planned maintenance</span><span><i data-state="degraded"></i>Unexpected failure</span></div>
  </section>

  <details class="operations-inspection">
    <summary>Inspect recent observation records</summary>
    <section class="operations-section" aria-labelledby="observation-records-heading">
      <div class="operations-section-heading"><div><p class="eyebrow">Most recent first</p><h2 id="observation-records-heading">Verified scheduled records</h2></div><span class="subtle">Showing ${recent.length} recent record${recent.length === 1 ? '' : 's'}; annual history stays summarized above</span></div>
      <div class="table-wrap"><table><thead><tr><th>Scheduled</th><th>State</th><th>Affected dependency</th><th>D1 probe</th></tr></thead><tbody>${historyRows(recent) || '<tr><td colspan="4">Scheduled monitoring will populate this history after deployment.</td></tr>'}</tbody></table></div>
    </section>
  </details>

  <details class="operations-inspection">
    <summary>How measurement and retention work</summary>
    <section class="operations-section" aria-labelledby="measurement-policy-heading">
      <h2 id="measurement-policy-heading">Measurement policy</h2>
      <p>The Cloudflare scheduled handler owns availability persistence. Each run stores one deterministic five-minute slot, so retries replace the same slot instead of creating extra observations. The public health endpoint probes current state without writing history.</p>
      <p>Coverage begins when verified scheduled collection starts. If the Worker or D1 cannot execute or persist a scheduled probe, the missing interval becomes a monitoring gap rather than being silently treated as uptime. Planned maintenance remains visible but is excluded from the measured-availability denominator.</p>
      <p>On every scheduled run, records with a timestamp older than ${AVAILABILITY_RETENTION_DAYS} days are deleted. A record exactly ${AVAILABILITY_RETENTION_DAYS} days old remains until it crosses the boundary on a later run.</p>
    </section>
  </details>

  ${referenceDetails([
    { label: 'Availability presentation', href: sourceUrl(env, 'src/demos/availability-page.ts') },
    { label: 'Health collection and retention', href: sourceUrl(env, 'src/api/operations.ts') },
    { label: 'Scheduled operation', href: sourceUrl(env, 'src/index.ts') },
    { label: 'Availability history schema', href: sourceUrl(env, 'migrations/0002_operations_dashboard.sql') },
    { label: 'Operations standard', href: sourceUrl(env, 'docs/OPERATIONS.md') },
  ], 'Implementation sources')}`,
  {
    cacheControl: 'no-store',
    canonicalPath: routeUrl('operations.availability'),
    description: `Verified five-minute availability observations with rolling ${AVAILABILITY_RETENTION_DAYS}-day retention, monitoring coverage, and planned-maintenance qualification.`,
  });
}
