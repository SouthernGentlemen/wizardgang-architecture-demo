import type { DemoDefinition, Env } from '../types';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { styles } from './styles';
import { withSecurityHeaders } from '../lib/http';

const SITE_NAME = 'WizardGang Architecture Demo';
const DEFAULT_DESCRIPTION = 'Executable companion to WG-ARCH-001. Every architecture concept has a stable route, a live implementation, and a direct link to the public code behind it.';

/** Acid square with an offset violet square — the same mark as the wordmark. */
const FAVICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#08080b"/><rect x="5" y="15" width="12" height="12" fill="#d9ff43"/><rect x="15" y="5" width="12" height="12" fill="#a489ff"/></svg>')}`;

/** Restores the reader's stored theme before first paint so the page never flashes. */
const THEME_BOOT = `try{var t=localStorage.getItem('wg-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

const THEME_TOGGLE = `(()=>{const b=document.querySelector('[data-theme-toggle]');if(!b)return;const r=document.documentElement;const sync=()=>{const light=r.dataset.theme==='light';b.textContent=light?'Dark':'Light';b.setAttribute('aria-pressed',String(light))};sync();b.addEventListener('click',()=>{const next=r.dataset.theme==='light'?'dark':'light';r.dataset.theme=next;try{localStorage.setItem('wg-theme',next)}catch(e){}sync()})})()`;

export interface ShellOptions {
  cacheControl?: string;
  description?: string;
  activeRoute?: string;
  noindex?: boolean;
  status?: number;
}

export function shell(env: Env, title: string, body: string, options: ShellOptions = {}): Response {
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const current = (href: string) => (options.activeRoute === href ? ' aria-current="page"' : '');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="color-scheme" content="dark light">
  ${options.noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="${FAVICON}">
  <style>${styles}</style>
  <script>${THEME_BOOT}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
<header>
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span>WizardGang / Architecture</a>
  <nav class="nav" aria-label="Primary">
    <a href="/"${current('/')}>Map</a>
    <a href="/dashboard"${current('/dashboard')}>Operations</a>
    <a href="/dashboard/docs"${current('/dashboard/docs')}>Docs</a>
    <a href="${escapeHtml(repoUrl(env))}">GitHub</a>
    <button type="button" data-theme-toggle aria-pressed="false">Light</button>
  </nav>
</header>
<main id="main">${body}</main>
<footer>
  <span>WG-ARCH-001 companion · <a href="${escapeHtml(repoUrl(env))}">Public source</a></span>
</footer>
<script>${THEME_TOGGLE}</script>
</body>
</html>`;
  const headers = withSecurityHeaders(new Headers({ 'content-type': 'text/html; charset=utf-8' }));
  if (options.cacheControl) headers.set('cache-control', options.cacheControl);
  if (options.noindex) {
    headers.set('x-robots-tag', 'noindex, nofollow');
    headers.set('referrer-policy', 'no-referrer');
  }
  return new Response(html, { status: options.status ?? 200, headers });
}

export function renderIndex(env: Env, list: DemoDefinition[]): Response {
  const groups = [...new Set(list.map((demo) => demo.group))];
  const body = `
<section>
  <p class="eyebrow">WG-ARCH-001 / executable companion</p>
  <h1>Architecture you can inspect.</h1>
  <p class="lede">Every concept below has a stable route, a dedicated source module, a live implementation you can run from the page, and a direct link to the public code behind it.</p>
  <div class="meta">
    <a href="#runtime">Jump to routes</a>
    <a href="/dashboard">Operations dashboard</a>
    <a href="/dashboard/docs">Documentation index</a>
    <a href="/v1/openapi.json">OpenAPI contract</a>
  </div>
</section>
<section class="grid" aria-label="Live service state">
  <div class="card"><h2 class="eyebrow">Routes</h2><p class="stat">${list.length}</p><p>Registered architecture routes, each with its own source module.</p></div>
  <div class="card"><h2 class="eyebrow">Groups</h2><p class="stat">${groups.length}</p><p>Runtime, integration, identity, AI, interface, delivery, governance, operations.</p></div>
  <div class="card"><h2 class="eyebrow">Version</h2><p class="stat">${escapeHtml(env.DEPLOYED_VERSION || 'development')}</p><p>Deployed from a tag. <a href="/version">Inspect version JSON</a>.</p></div>
  <div class="card"><h2 class="eyebrow">Health</h2><p class="stat" data-health>—</p><p>Live dependency check. <a href="/dashboard/health">Inspect health</a>.</p></div>
</section>
${groups.map((group) => {
    const inGroup = list.filter((demo) => demo.group === group);
    return `
<section id="${escapeHtml(slug(group))}">
  <div class="section-head"><h2>${escapeHtml(group)}</h2><span>${inGroup.length} route${inGroup.length === 1 ? '' : 's'}</span></div>
  <div class="grid">
    ${inGroup.map((demo) => `
      <a class="card" href="${escapeHtml(demo.route)}">
        <p class="eyebrow">${escapeHtml(demo.route)}</p>
        <h3>${escapeHtml(demo.title)}</h3>
        <p>${escapeHtml(demo.summary)}</p>
        <span class="badge badge-ok">${escapeHtml(demo.status)}</span>
      </a>`).join('')}
  </div>
</section>`;
  }).join('')}
<script>
fetch('/health').then((r) => r.json()).then((h) => {
  const slot = document.querySelector('[data-health]');
  if (slot) slot.textContent = h.status;
}).catch(() => {});
</script>`;
  return shell(env, 'Architecture', body, { activeRoute: '/', description: DEFAULT_DESCRIPTION });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Previous/next within the same group keeps a 34-route site navigable without a menu. */
function groupPager(demo: DemoDefinition, all: DemoDefinition[]): string {
  const siblings = all.filter((candidate) => candidate.group === demo.group);
  const index = siblings.findIndex((candidate) => candidate.route === demo.route);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  if (!previous && !next) return '';
  return `<nav class="meta" aria-label="${escapeHtml(demo.group)} routes" style="margin-top:2.5rem;padding-top:1.1rem;border-top:1px solid var(--line)">
    ${previous ? `<a href="${escapeHtml(previous.route)}">← ${escapeHtml(previous.title)}</a>` : ''}
    <a href="/#${escapeHtml(slug(demo.group))}">All ${escapeHtml(demo.group)}</a>
    ${next ? `<a href="${escapeHtml(next.route)}">${escapeHtml(next.title)} →</a>` : ''}
  </nav>`;
}

export function renderDemo(env: Env, demo: DemoDefinition, all: DemoDefinition[] = [], extra = ''): Response {
  const actions = demo.actions ?? [demo.action ?? { label: 'Run baseline demo', method: 'POST' as const, path: '/__api/demo/run', body: { demoId: demo.id } }];
  const operationsNav = demo.group === 'Operations' ? `
<section class="panel" aria-labelledby="operations-heading">
  <h2 id="operations-heading">Operations surface</h2>
  <div class="meta">
    <a href="/dashboard">Dashboard</a>
    <a href="/dashboard/uptime">Uptime</a>
    <a href="/dashboard/health">Health</a>
    <a href="/dashboard/docs">Docs</a>
    <a href="/dashboard/logs">Logs</a>
    <a href="/dashboard/billing">Billing &amp; usage</a>
    <a href="/health">Health JSON</a>
    <a href="/version">Version JSON</a>
    <a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Operations design</a>
  </div>
  <p class="subtle">Operations routes stay reachable during intentional demo-offline windows. Billing data is synthetic and public-safe by design.</p>
</section>` : '';
  // A route with its own live console demonstrates itself; the generic runner would only duplicate it.
  const runPanels = extra && !demo.actions ? '' : actions.map((action, index) => {
    const requestPreview = `${action.method} ${action.path}${action.body === undefined ? '' : `\n\n${JSON.stringify(action.body, null, 2)}`}`;
    const headingId = `${action.id ?? `run-${index + 1}`}-heading`;
    return `<section class="panel"${action.id ? ` id="${escapeHtml(action.id)}"` : ''} aria-labelledby="${escapeHtml(headingId)}">
  ${(action.aliases ?? []).map((alias) => `<span id="${escapeHtml(alias)}" aria-hidden="true"></span>`).join('')}
  <h2 id="${escapeHtml(headingId)}">${escapeHtml(action.title ?? 'Run it')}</h2>
  ${action.description ? `<p>${escapeHtml(action.description)}</p>` : ''}
  <p class="subtle">This button calls the live Worker interface below. Meaningful actions write public-safe audit evidence to <code>demo-blob</code>.</p>
  <div class="field" style="margin-bottom:1rem"><span>Request</span><pre style="min-height:0">${escapeHtml(requestPreview)}</pre></div>
  <button type="button" data-run-demo="${index}">${escapeHtml(action.label)}</button>
  <div class="field" style="margin-top:1rem"><span>Response</span><pre aria-live="polite" data-demo-output="${index}">Ready.</pre></div>
</section>`;
  }).join('');
  const sections = (demo.sections ?? []).map((section) => `<section class="panel" id="${escapeHtml(section.id)}" aria-labelledby="${escapeHtml(section.id)}-heading">
  <h2 id="${escapeHtml(section.id)}-heading">${escapeHtml(section.title)}</h2>
  <p>${escapeHtml(section.description)}</p>
  ${section.points?.length ? `<ul>${section.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>` : ''}
</section>`).join('');
  const body = `
<section>
  <p class="eyebrow"><a href="/#${escapeHtml(slug(demo.group))}">${escapeHtml(demo.group)}</a> / ${escapeHtml(demo.route)}</p>
  <h1>${escapeHtml(demo.title)}</h1>
  <p class="lede">${escapeHtml(demo.summary)}</p>
  ${demo.notice ? `<p class="subtle">${escapeHtml(demo.notice)}</p>` : ''}
  <div class="meta">
    <span class="badge badge-ok">${escapeHtml(demo.status)}</span>
    <a href="${escapeHtml(sourceUrl(env, demo.sourcePath))}">Route source</a>
    <a href="${escapeHtml(sourceUrl(env, 'src/router.ts'))}">Router</a>
    <a href="${escapeHtml(sourceUrl(env, 'migrations/0001_demo_blob.sql'))}">D1 schema</a>
    <a href="${escapeHtml(sourceUrl(env, 'docs/ROUTES.md'))}">Route map</a>
    ${(demo.supportingSources ?? []).map((source) => `<a href="${escapeHtml(sourceUrl(env, source.path))}">${escapeHtml(source.label)}</a>`).join('')}
    ${(demo.repositoryLinks ?? []).map((link) => `<a href="${escapeHtml(`${repoUrl(env)}${link.path}`)}">${escapeHtml(link.label)}</a>`).join('')}
  </div>
</section>
${operationsNav}
${sections}
${extra}
${runPanels}
${demo.interfaces?.length ? `<section class="panel" aria-labelledby="interfaces-heading"><h2 id="interfaces-heading">Live interfaces</h2><ul>${demo.interfaces.map((item) => `<li><code>${escapeHtml(item.method)} ${escapeHtml(item.path)}</code> — ${escapeHtml(item.description)}</li>`).join('')}</ul></section>` : ''}
<section class="panel" aria-labelledby="proves-heading">
  <h2 id="proves-heading">This route proves</h2>
  <ul>${demo.proves.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
</section>
${groupPager(demo, all)}
<script>
(() => {
  const actions = ${JSON.stringify(actions)};
  document.querySelectorAll('[data-run-demo]').forEach((button) => button.addEventListener('click', async () => {
    const index = Number(button.dataset.runDemo);
    const action = actions[index];
    const output = document.querySelector('[data-demo-output="' + index + '"]');
    if (!action || !output) return;
    output.textContent = 'Running…';
    try {
      const response = await fetch(action.path, {
        method: action.method,
        ...(action.body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(action.body) })
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json') ? await response.json() : await response.text();
      output.textContent = response.status + ' ' + response.statusText + '\\n\\n' + (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (error) {
      output.textContent = String(error);
    }
  }));
})();
</script>`;
  return shell(env, demo.title, body, { activeRoute: demo.route, description: demo.summary });
}

export function renderNotFound(env: Env): Response {
  return shell(env, 'Not found', `
<section>
  <p class="eyebrow">404 / unknown route</p>
  <h1>That route does not exist.</h1>
  <p class="lede">Every published route is registered in the route map and backed by a source module.</p>
  <div class="meta"><a href="/">Architecture map</a><a href="/dashboard">Operations dashboard</a><a href="${escapeHtml(sourceUrl(env, 'docs/ROUTES.md'))}">Route map</a></div>
</section>`, { status: 404, noindex: true });
}
