import type { DemoDefinition, Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { recentApplicationLogs } from '../lib/logs';
import { routeUrl } from '../routing/application-routes';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

const demo: DemoDefinition = {
  id: 'logs',
  route: routeUrl('operations.logs'),
  title: 'Log Viewer',
  group: 'Operations',
  sourcePath: 'src/demos/logs.ts',
  summary: 'Public-safe D1-backed application log viewer with bounded history, level/source filtering, and direct links to the code that emits and stores each log.',
  proves: [
    'Operational logs can be inspected without exposing Cloudflare credentials or private account data',
    'Application events are persisted separately from audit/evidence records',
    'Log retention and query limits are intentionally bounded for a public demo'
  ],
  status: 'working',
  interfaces: [{ method: 'GET', path: routeUrl('operations.api-logs'), description: 'Read bounded, sanitized log rows as JSON.' }],
  supportingSources: [{ label: 'View redaction tests', path: 'tests/logs.test.ts' }]
};

function detailText(value: string | null): string {
  if (!value) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export async function logsContent(request: Request, env: Env): Promise<PageContent> {
  const url = new URL(request.url);
  const level = url.searchParams.get('level') || '';
  const source = url.searchParams.get('source') || '';
  const requestId = url.searchParams.get('requestId') || '';
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || '50') || 50, 200));
  const logs = await recentApplicationLogs(env, { level, source, requestId, limit });
  const logsRoute = routeUrl('operations.logs');
  const logsApiRoute = routeUrl('operations.api-logs', {}, {
    limit: String(limit),
    level: level || undefined,
    source: source || undefined,
    requestId: requestId || undefined,
  });

  const filtered = Boolean(level || source || requestId);
  const explorerOpen = ['level', 'source', 'requestId', 'limit'].some((key) => url.searchParams.has(key));
  const eventKinds = new Set<string>();
  const examples = logs.filter((log) => {
    const key = JSON.stringify([log.source, log.event_key]);
    if (eventKinds.has(key)) return false;
    eventKinds.add(key);
    return true;
  }).slice(0, 3);
  const preview = examples.map((log) => `<article class="operations-tour-card log-example">
    <p class="eyebrow">${escapeHtml(log.level)} · ${escapeHtml(log.source)}</p>
    <h3><code>${escapeHtml(log.event_key)}</code></h3>
    <p>${escapeHtml(log.message)}</p>
    <p class="subtle"><strong>Recorded</strong> <time datetime="${escapeHtml(log.created_at)}">${escapeHtml(log.created_at)}</time></p>
    <p class="subtle"><strong>Route</strong> <code>${escapeHtml(log.route || 'Not recorded')}</code></p>
    <p class="subtle"><strong>Request ID</strong> <code>${escapeHtml(log.request_id || 'Not recorded')}</code></p>
  </article>`).join('');

  const rows = logs.map((log) => `
    <tr>
      <td><time datetime="${escapeHtml(log.created_at)}">${escapeHtml(log.created_at)}</time></td>
      <td><span class="badge">${escapeHtml(log.level)}</span></td>
      <td><code>${escapeHtml(log.source)}</code></td>
      <td><code>${escapeHtml(log.event_key)}</code></td>
      <td>${log.request_id ? `<code>${escapeHtml(log.request_id)}</code>` : '—'}</td>
      <td>${escapeHtml(log.message)}</td>
      <td>${log.route ? `<code>${escapeHtml(log.route)}</code>` : '—'}</td>
      <td>${log.detail_json ? `<details><summary>View</summary><pre>${escapeHtml(detailText(log.detail_json))}</pre></details>` : '—'}</td>
    </tr>`).join('');

  const body = `
<section class="page-header">
  <h1>Application Logs</h1>
  <p class="lede">Can we explain what happened without exposing sensitive data?</p>
  <div class="page-tools">
    <a class="text-link" href="${escapeHtml(sourceUrl(env, demo.sourcePath))}">Route source</a>
  </div>
</section>
<section class="operations-tour" aria-labelledby="logging-demonstrates-heading">
  <p class="eyebrow">What this demonstrates</p><h2 id="logging-demonstrates-heading">Explain runtime behavior with public-safe events</h2>
  <div class="operations-tour-grid">
    <article class="operations-tour-card"><h3>Structured events</h3><p>Named events, levels, and sources make behavior queryable. Structured detail provides context beyond an arbitrary message string.</p></article>
    <article class="operations-tour-card"><h3>Sanitized telemetry</h3><p>This public demonstration exposes bounded diagnostic records. Sensitive detail keys and recognized credential values are redacted before storage, and log queries have a capped size.</p></article>
    <article class="operations-tour-card"><h3>Traceability</h3><p>Sources identify the emitting subsystem. When recorded, routes and request IDs help connect an event to the activity that produced it.</p></article>
  </div>
</section>
<section class="operations-tour" aria-labelledby="log-examples-heading">
  <p class="eyebrow">See the result</p><h2 id="log-examples-heading">Recent event examples</h2>
  <p>Up to three distinct source and event pairs from the latest ${logs.length} ${filtered ? 'matching ' : ''}record${logs.length === 1 ? '' : 's'}, newest first. These are real stored events; repeated event types remain available in the explorer.</p>
  ${preview ? `<div class="operations-tour-grid">${preview}</div>` : `<p class="availability-empty">${filtered ? 'No events match the selected filters. Adjust or reset them in the log explorer.' : 'No logs have been recorded yet. Stored events will appear here as the application runs.'}</p>`}
</section>
<details class="operations-inspection" id="log-explorer"${explorerOpen ? ' open' : ''}>
  <summary>Open log explorer</summary>
<section class="panel" aria-labelledby="filters-heading">
  <h2 id="filters-heading">Filter logs</h2>
  <form method="get" action="${escapeHtml(logsRoute)}" class="filters">
    <label>Level
      <select name="level">
        <option value="">All</option>
        ${['debug', 'info', 'warn', 'error'].map((item) => `<option value="${item}"${level === item ? ' selected' : ''}>${item}</option>`).join('')}
      </select>
    </label>
    <label>Source
      <input name="source" value="${escapeHtml(source)}" maxlength="80" placeholder="health, admin, d1…">
    </label>
    <label>Limit
      <input name="limit" type="number" min="1" max="200" value="${limit}">
    </label>
    <label>Request ID
      <input name="requestId" value="${escapeHtml(requestId)}" maxlength="120" placeholder="req_…">
    </label>
    <button type="submit">Apply</button>
    <a href="${escapeHtml(logsRoute)}">Reset</a>
  </form>
</section>
<section class="panel" aria-labelledby="viewer-heading">
  <h2 id="viewer-heading">Recent application logs</h2>
  <p class="subtle">Showing ${logs.length} sanitized row${logs.length === 1 ? '' : 's'}.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Time</th><th>Level</th><th>Source</th><th>Event</th><th>Request ID</th><th>Message</th><th>Route</th><th>Detail</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="8">${filtered ? 'No events match the selected filters.' : 'No logs have been recorded yet.'}</td></tr>`}</tbody>
    </table>
  </div>
  <p><a href="${escapeHtml(logsApiRoute)}">View JSON</a></p>
</section>
</details>
${referenceDetails([
  { label: 'Log persistence and redaction', href: sourceUrl(env, 'src/lib/logs.ts') },
  { label: 'Log schema', href: sourceUrl(env, 'migrations/0004_application_logs.sql') },
  { label: 'Redaction tests', href: sourceUrl(env, 'tests/logs.test.ts') },
  { label: 'Operations design', href: sourceUrl(env, 'docs/OPERATIONS.md') },
], 'Implementation sources')}`;

  return pageContent(env, demo.title, body, { cacheControl: 'no-store', canonicalPath: logsRoute, description: demo.summary });
}

export default demo;
