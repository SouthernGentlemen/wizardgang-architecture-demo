import type { DemoDefinition, Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { recentApplicationLogs } from '../lib/logs';
import { referenceDetails, shell } from '../ui/page';

const demo: DemoDefinition = {
  id: 'logs',
  route: '/dashboard/logs',
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
  interfaces: [{ method: 'GET', path: '/__api/operations/logs', description: 'Read bounded, sanitized log rows as JSON.' }],
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

export async function renderLogsDemo(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const level = url.searchParams.get('level') || '';
  const source = url.searchParams.get('source') || '';
  const requestId = url.searchParams.get('requestId') || '';
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || '50') || 50, 200));
  const logs = await recentApplicationLogs(env, { level, source, requestId, limit });

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
  <div class="eyebrow">Operations / /dashboard/logs</div>
  <h1>Log Viewer</h1>
  <p class="lede">${escapeHtml(demo.summary)}</p>
  <div class="page-tools">
    <a class="text-link" href="${escapeHtml(sourceUrl(env, demo.sourcePath))}">Route source</a>
    ${referenceDetails([
      { label: 'Log persistence', href: sourceUrl(env, 'src/lib/logs.ts') },
      { label: 'Log schema', href: sourceUrl(env, 'migrations/0004_application_logs.sql') },
      { label: 'Operations design', href: sourceUrl(env, 'docs/OPERATIONS.md') },
    ])}
  </div>
</section>
<section class="panel" aria-labelledby="filters-heading">
  <h2 id="filters-heading">Filter logs</h2>
  <form method="get" class="filters">
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
    <a href="/dashboard/logs">Reset</a>
  </form>
</section>
<section class="panel" aria-labelledby="viewer-heading">
  <h2 id="viewer-heading">Recent application logs</h2>
  <p class="subtle">Showing ${logs.length} sanitized row${logs.length === 1 ? '' : 's'}.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Time</th><th>Level</th><th>Source</th><th>Event</th><th>Request ID</th><th>Message</th><th>Route</th><th>Detail</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8">No logs have been recorded yet.</td></tr>'}</tbody>
    </table>
  </div>
  <p><a href="/__api/operations/logs?limit=${limit}${level ? `&level=${encodeURIComponent(level)}` : ''}${source ? `&source=${encodeURIComponent(source)}` : ''}${requestId ? `&requestId=${encodeURIComponent(requestId)}` : ''}">View JSON</a></p>
</section>`;

  return shell(env, demo.title, body, { cacheControl: 'no-store' });
}

export default demo;
