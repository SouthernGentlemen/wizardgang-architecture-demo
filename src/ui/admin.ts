import type { Env } from '../types';
import type { DemoControl } from '../lib/demo-control';
import type { CrawlerControl } from '../lib/crawler-control';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { referenceDetails, shell } from './page';

export function renderAdmin(env: Env, control: DemoControl, crawlerControl: CrawlerControl, notice = ''): Response {
  const offline = control.state === 'offline';
  const crawlEnabled = crawlerControl.state === 'enabled';
  return shell(env, 'Demo Admin', `
<section class="page-header">
  <p class="eyebrow">Operations / protected</p>
  <h1>Demo Admin</h1>
  <p class="lede">Control public demo availability and ChatGPT web access without disabling the status, documentation, or administration surface.</p>
  <div class="page-tools">
    <span class="badge ${offline ? 'badge-down' : 'badge-ok'}">${escapeHtml(control.state)}</span>
    ${referenceDetails([
      { label: 'Admin UI source', href: sourceUrl(env, 'src/ui/admin.ts') },
      { label: 'Control logic', href: sourceUrl(env, 'src/lib/demo-control.ts') },
      { label: 'Crawler control', href: sourceUrl(env, 'src/lib/crawler-control.ts') },
      { label: 'Offline gate', href: sourceUrl(env, 'src/router.ts') },
      { label: 'D1 control schema', href: sourceUrl(env, 'migrations/0003_demo_control.sql') },
      { label: 'Crawler schema', href: sourceUrl(env, 'migrations/0009_crawler_control.sql') },
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
    <input type="hidden" name="control" value="demo">
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
<section class="panel" id="chatgpt-crawl">
  <p class="eyebrow">Crawler policy</p>
  <h2>ChatGPT web access</h2>
  <p><span class="badge ${crawlEnabled ? 'badge-ok' : 'badge-down'}">${escapeHtml(crawlerControl.state)}</span></p>
  <p>${crawlEnabled
    ? '<strong>OAI-SearchBot</strong> and <strong>ChatGPT-User</strong> can fetch public demo routes. The ordinary demo offline gate still applies.'
    : '<strong>OAI-SearchBot</strong> and <strong>ChatGPT-User</strong> receive a server-enforced <code>403</code> response.'}</p>
  <p class="subtle"><strong>GPTBot remains blocked</strong>, so enabling this switch does not opt the site into foundation-model training. Search systems may take about 24 hours to observe a robots policy change.</p>
  <dl style="margin-bottom:1.4rem">
    <dt>Current state</dt><dd><strong>${escapeHtml(crawlerControl.state)}</strong></dd>
    <dt>Last changed</dt><dd>${escapeHtml(crawlerControl.updatedAt)}${crawlerControl.updatedBy ? ` by ${escapeHtml(crawlerControl.updatedBy)}` : ''}</dd>
    <dt>Published policy</dt><dd><a href="/robots.txt">Inspect <code>/robots.txt</code></a></dd>
    <dt>Agent reference</dt><dd><a href="https://developers.openai.com/api/docs/bots">OpenAI crawler documentation</a></dd>
  </dl>
  <form method="post" action="/admin">
    <input type="hidden" name="control" value="chatgpt-crawl">
    <div class="meta">
      <button class="button-primary" name="state" value="enabled" type="submit">Enable ChatGPT access</button>
      <button name="state" value="disabled" type="submit">Disable ChatGPT access</button>
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
