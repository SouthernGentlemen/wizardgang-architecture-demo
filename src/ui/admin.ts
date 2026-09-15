import type { Env } from '../types';
import type { DemoControl } from '../lib/demo-control';
import type { CrawlerControl } from '../lib/crawler-control';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { localizationForEnv } from '../i18n/runtime';
import { referenceDetails, pageResponse } from './page';

export function renderAdmin(env: Env, control: DemoControl, crawlerControl: CrawlerControl, notice = ''): Response {
  const offline = control.state === 'offline';
  const crawlEnabled = crawlerControl.state === 'enabled';
  const adminRoute = routeUrl('operations.admin');
  const robotsRoute = routeUrl('operations.robots');
  return pageResponse(env, 'Demo Admin', `
<section class="page-header">
  <h1>Demo Admin</h1>
  <p class="lede">Control public demo availability and ChatGPT web access without disabling the operations, security, health, recovery, or administration surfaces.</p>
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
  <form method="post" action="${escapeHtml(adminRoute)}">
    <input type="hidden" name="control" value="demo">
    <div class="field">
      <label for="message">Public message</label>
      <p class="subtle" id="message-help">Displayed on the offline page. Maximum 500 characters. Do not place secrets or internal incident details here.</p>
      <textarea id="message" name="message" rows="4" maxlength="500" aria-describedby="message-help" style="width:100%">${escapeHtml(control.publicMessage)}</textarea>
      <aside class="offline-message-preview"><span>Public offline preview</span><strong>Demo temporarily offline</strong><p data-offline-message-preview>${escapeHtml(control.publicMessage)}</p></aside>
    </div>
    <div class="meta" style="margin-top:1.2rem">
      <button class="button-primary" name="state" value="online" type="submit"${offline ? '' : ' disabled'}>Take demo online</button>
      <button name="state" value="offline" type="submit" data-confirm-change="Ordinary public demos will become unavailable and visitors will see the offline message. Continue?"${offline ? ' disabled' : ''}>Take demo offline</button>
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
    <dt>Published policy</dt><dd><a href="${escapeHtml(robotsRoute)}">Inspect <code>${escapeHtml(robotsRoute)}</code></a></dd>
    <dt>Agent reference</dt><dd><a href="https://developers.openai.com/api/docs/bots">OpenAI crawler documentation</a></dd>
  </dl>
  <form method="post" action="${escapeHtml(adminRoute)}">
    <input type="hidden" name="control" value="chatgpt-crawl">
    <div class="meta">
      <button class="button-primary" name="state" value="enabled" type="submit"${crawlEnabled ? ' disabled' : ''}>Enable ChatGPT access</button>
      <button name="state" value="disabled" type="submit" data-confirm-change="OAI-SearchBot and ChatGPT-User will immediately receive 403 responses. Continue?"${crawlEnabled ? '' : ' disabled'}>Disable ChatGPT access</button>
    </div>
  </form>
</section>
<section class="panel">
  <h2>Offline invariants</h2>
  <ul>
    <li>Ordinary browser demo pages redirect to the public offline message.</li>
    <li>Ordinary gated API, non-HTML, and write requests return structured <code>503</code> responses.</li>
    <li>Operations, security, <code>${escapeHtml(routeUrl('operations.health'))}</code>, <code>${escapeHtml(routeUrl('operations.version'))}</code>, offline, admin, and required machine recovery routes remain reachable.</li>
    <li>Every state transition is written to the shared audit event stream.</li>
  </ul>
</section>
<script>(()=>{const message=document.querySelector('#message');const preview=document.querySelector('[data-offline-message-preview]');message?.addEventListener('input',()=>{if(preview)preview.textContent=message.value||'No public message supplied.'});document.querySelectorAll('[data-confirm-change]').forEach((button)=>button.addEventListener('click',(event)=>{if(!window.confirm(button.dataset.confirmChange||'Continue?'))event.preventDefault()}))})()</script>`, { routeId: 'operations.admin', cacheControl: 'no-store', noindex: true, canonicalPath: adminRoute });
}

export function renderOffline(env: Env, control: DemoControl, requestedPath: string): Response {
  const offline = control.state === 'offline';
  const localization = localizationForEnv(env);
  const safePath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
  const operationsRoute = routeUrl('operations.index');
  const body = offline
    ? `<section>
  <p class="eyebrow">Demo status / offline</p>
  <h1>${escapeHtml(localization.t('offline.title', 'Demo temporarily offline'))}</h1>
  <p class="lede">${escapeHtml(control.publicMessage)}</p>
  <p class="subtle">Requested route: <code>${escapeHtml(safePath)}</code></p>
</section>`
    : `<section>
  <p class="eyebrow">Demo status / online</p>
  <h1>The demo is running.</h1>
  <p class="lede">${escapeHtml(control.publicMessage)} This page is the maintenance surface visitors see when an operator intentionally takes the demonstrations offline.</p>
  <p class="subtle"><a href="${escapeHtml(safePath)}">Continue to <code>${escapeHtml(safePath)}</code></a></p>
</section>`;
  return pageResponse(env, offline ? 'Demo offline' : 'Demo online', `${body}
<section class="panel">
  <h2>Still available</h2>
  <p class="subtle">Status, security reporting, and public source remain reachable during an intentional offline window.</p>
  <div class="meta">
    <a href="${escapeHtml(operationsRoute)}">View system status</a>
    <a href="${escapeHtml(routeUrl('security.index'))}">Security</a>
    <a href="${escapeHtml(repoUrl(env))}">Public source</a>
  </div>
  <details class="operations-inspection"><summary>Operator and developer recovery links</summary><div class="meta"><a href="${escapeHtml(operationsRoute)}#availability">Availability</a><a href="${escapeHtml(operationsRoute)}#activity">Activity</a><a href="${escapeHtml(routeUrl('operations.health'))}">Health JSON</a><a href="${escapeHtml(routeUrl('operations.version'))}">Version JSON</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Operations docs ↗</a></div></details>
</section>`, { routeId: 'operations.offline', cacheControl: 'no-store', noindex: true, status: offline ? 503 : 200, canonicalPath: routeUrl('operations.offline') });
}
