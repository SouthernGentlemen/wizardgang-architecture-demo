import type { Env } from '../types';
import type { DemoControl } from '../lib/demo-control';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { styles } from './styles';

function document(env: Env, title: string, body: string, status = 200): Response {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} · WizardGang Architecture Demo</title><style>${styles}</style></head><body><header><a class="brand" href="/">WizardGang / Architecture Demo</a><a href="/dashboard">Operations dashboard</a><a href="${escapeHtml(repoUrl(env))}">Public repository</a></header><main>${body}</main><footer>WG-ARCH-001 companion · Admin controls are authenticated; credentials and secrets never belong in source or audit payloads.</footer></body></html>`, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer'
    }
  });
}

export function renderAdmin(env: Env, control: DemoControl, notice = ''): Response {
  return document(env, 'Demo Admin', `
<section><div class="eyebrow">Operations / protected</div><h1>Demo Admin</h1><p>Take ordinary public architecture demonstrations online or offline without disabling the public status, documentation, or administration surface.</p>
<div class="meta"><span class="badge">${escapeHtml(control.state)}</span><a href="${escapeHtml(sourceUrl(env, 'src/ui/admin.ts'))}">View admin UI source</a><a href="${escapeHtml(sourceUrl(env, 'src/lib/demo-control.ts'))}">View control logic</a><a href="${escapeHtml(sourceUrl(env, 'src/router.ts'))}">View offline gate</a><a href="${escapeHtml(sourceUrl(env, 'migrations/0003_demo_control.sql'))}">View D1 control schema</a><a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">View operations design</a></div></section>
${notice ? `<section class="panel" role="status"><strong>${escapeHtml(notice)}</strong></section>` : ''}
<section class="panel"><h2>Public demo state</h2><p>Current state: <strong>${escapeHtml(control.state)}</strong></p><p>Last changed: ${escapeHtml(control.updatedAt)}${control.updatedBy ? ` by ${escapeHtml(control.updatedBy)}` : ''}</p>
<form method="post" action="/admin"><label for="message"><strong>Public message</strong></label><p class="subtle">Displayed on the offline page. Maximum 500 characters. Do not place secrets or internal incident details here.</p><textarea id="message" name="message" rows="4" maxlength="500" style="width:100%;margin:8px 0 16px">${escapeHtml(control.publicMessage)}</textarea><div class="meta"><button name="state" value="online" type="submit">Take demo online</button><button name="state" value="offline" type="submit">Take demo offline</button></div></form></section>
<section class="panel"><h2>Offline invariants</h2><ul><li>Browser demo pages redirect to the public offline message.</li><li>API/non-HTML/write requests return structured 503 responses.</li><li>Dashboard, health, version, offline, and admin routes remain reachable.</li><li>Every state transition is written to the shared audit event stream.</li></ul></section>`);
}

export function renderOffline(env: Env, control: DemoControl, requestedPath: string): Response {
  return document(env, 'Demo offline', `
<section><div class="eyebrow">Demo status / offline</div><h1>Oops! demo is down.</h1><p>${escapeHtml(control.publicMessage)}</p><p class="subtle">Requested route: <code>${escapeHtml(requestedPath)}</code></p><div class="meta"><a href="/dashboard">Operations dashboard</a><a href="/dashboard/health">Health</a><a href="/dashboard/uptime">Uptime</a><a href="/dashboard/docs">Docs</a><a href="${escapeHtml(repoUrl(env))}">Public source</a></div></section>`, 503);
}
