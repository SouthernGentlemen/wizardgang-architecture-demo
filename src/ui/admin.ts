import type { Env } from '../types';
import type { DemoControl } from '../lib/demo-control';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { referenceDetails, shell } from './page';

export function renderAdmin(env: Env, control: DemoControl, notice = ''): Response {
  const offline = control.state === 'offline';
  return shell(env, 'Demo Admin', `
<section class="page-header">
  <p class="eyebrow">Operations / protected</p>
  <h1>Demo Admin</h1>
  <p class="lede">Take ordinary public architecture demonstrations online or offline without disabling the public status, documentation, or administration surface.</p>
  <div class="page-tools">
    <span class="badge ${offline ? 'badge-down' : 'badge-ok'}">${escapeHtml(control.state)}</span>
    ${referenceDetails([
      { label: 'Admin UI source', href: sourceUrl(env, 'src/ui/admin.ts') },
      { label: 'Control logic', href: sourceUrl(env, 'src/lib/demo-control.ts') },
      { label: 'Offline gate', href: sourceUrl(env, 'src/router.ts') },
      { label: 'D1 control schema', href: sourceUrl(env, 'migrations/0003_demo_control.sql') },
      { label: 'Operations design', href: sourceUrl(env, 'docs/OPERATIONS.md') },
    ])}
  </div>
</section>
${notice ? `<section class="panel" role="status"><strong>${escapeHtml(notice)}</strong></section>` : ''}
<section class="panel">
  <h2>Public demo state</h2>
  <dl style="margin-bottom:1.4rem">
    <dt>Current state</dt><dd><strong>${escapeHtml(control.state)}</strong></dd>
    <dt>Last changed</dt><dd>${escapeHtml(control.updatedAt)}${control.updatedBy ? ` by ${escapeHtml(control.updatedBy)}` : ''}</dd>
  </dl>
  <form method="post" action="/admin">
    <div class="field">
      <label for="message">Public message</label>
      <p class="subtle" id="message-help">Displayed on the offline page. Maximum 500 characters. Do not place secrets or internal incident details here.</p>
      <textarea id="message" name="message" rows="4" maxlength="500" aria-describedby="message-help" style="width:100%">${escapeHtml(control.publicMessage)}</textarea>
    </div>
    <div class="meta" style="margin-top:1.2rem">
      <button class="button-primary" name="state" value="online" type="submit">Take demo online</button>
      <button name="state" value="offline" type="submit">Take demo offline</button>
    </div>
  </form>
</section>
<section class="panel">
  <h2>Offline invariants</h2>
  <ul>
    <li>Browser demo pages redirect to the public offline message.</li>
    <li>API, non-HTML, and write requests return structured <code>503</code> responses.</li>
    <li>Dashboard, health, version, offline, and admin routes remain reachable.</li>
    <li>Every state transition is written to the shared audit event stream.</li>
  </ul>
</section>`, { cacheControl: 'no-store', noindex: true });
}

export function renderOffline(env: Env, control: DemoControl, requestedPath: string): Response {
  const offline = control.state === 'offline';
  const safePath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
  const body = offline
    ? `<section>
  <p class="eyebrow">Demo status / offline</p>
  <h1>Oops! demo is down.</h1>
  <p class="lede">${escapeHtml(control.publicMessage)}</p>
  <p class="subtle">Requested route: <code>${escapeHtml(safePath)}</code></p>
</section>`
    : `<section>
  <p class="eyebrow">Demo status / online</p>
  <h1>The demo is running.</h1>
  <p class="lede">${escapeHtml(control.publicMessage)} This page is the maintenance surface visitors see when an operator intentionally takes the demonstrations offline.</p>
  <p class="subtle"><a href="${escapeHtml(safePath)}">Continue to <code>${escapeHtml(safePath)}</code></a></p>
</section>`;
  return shell(env, offline ? 'Demo offline' : 'Demo online', `${body}
<section class="panel">
  <h2>Always reachable</h2>
  <p class="subtle">Operational surfaces stay available during an intentional offline window so the demo can be observed while it is down.</p>
  <div class="meta">
    <a href="/dashboard">Operations dashboard</a>
    <a href="/dashboard#health">Health</a>
    <a href="/dashboard/uptime">Uptime</a>
    <a href="/dashboard/docs">Docs</a>
    <a href="${escapeHtml(repoUrl(env))}">Public source</a>
  </div>
</section>`, { cacheControl: 'no-store', noindex: true, status: offline ? 503 : 200 });
}
