import type { DemoDefinition, Env } from '../types';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { styles } from './styles';
import { withSecurityHeaders } from '../lib/http';
import { assuranceHtmlRoute } from '../assurance/routes';

const SITE_NAME = 'WizardGang Architecture Demo';
const DEFAULT_DESCRIPTION = 'Executable companion to WG-ARCH-001. Every architecture concept has a stable route, a live implementation, and a direct link to the public code behind it.';
const COMPLIANCE_ROUTE = assuranceHtmlRoute('compliance');

/** Acid square with an offset violet square — the same mark as the wordmark. */
const FAVICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#08080b"/><rect x="5" y="15" width="12" height="12" fill="#d9ff43"/><rect x="15" y="5" width="12" height="12" fill="#a489ff"/></svg>')}`;

/** Restores the reader's stored theme before first paint so the page never flashes. */
const THEME_BOOT = `try{var t=localStorage.getItem('wg-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

const THEME_TOGGLE = `(()=>{const b=document.querySelector('[data-theme-toggle]');if(!b)return;const r=document.documentElement;const sync=()=>{const light=r.dataset.theme==='light';const next=light?'dark':'light';b.textContent='Theme: '+(light?'Dark':'Light');b.setAttribute('aria-label','Switch to '+next+' theme');b.setAttribute('aria-pressed',String(light))};sync();b.addEventListener('click',()=>{const next=r.dataset.theme==='light'?'dark':'light';r.dataset.theme=next;try{localStorage.setItem('wg-theme',next)}catch(e){}sync()})})()`;

export interface ShellOptions {
  cacheControl?: string;
  description?: string;
  activeRoute?: string;
  noindex?: boolean;
  status?: number;
}

export function shell(env: Env, title: string, body: string, options: ShellOptions = {}): Response {
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const dashboardCurrent = options.activeRoute?.startsWith('/dashboard') ? ' aria-current="page"' : '';
  const complianceCurrent = options.activeRoute === COMPLIANCE_ROUTE ? ' aria-current="page"' : '';
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
  <meta property="og:image" content="https://demo.wizardgang.ai/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="WizardGang Architecture — Architecture you can inspect.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://demo.wizardgang.ai/og.png">
  <link rel="icon" href="${FAVICON}">
  <style>${styles}</style>
  <script>${THEME_BOOT}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="WizardGang Architecture Demo home">
    <span class="brand-mark" aria-hidden="true"></span>
    <span class="brand-copy"><strong>WIZARDGANG</strong><small>Architecture demo</small></span>
  </a>
  <nav class="nav" aria-label="Primary">
    <a href="/dashboard"${dashboardCurrent}>Dashboard</a>
    <a href="${escapeHtml(COMPLIANCE_ROUTE)}"${complianceCurrent}>Compliance</a>
    <a href="https://wizardgang.ai/">Main site <span aria-hidden="true">↗</span></a>
    <button type="button" data-theme-toggle aria-label="Switch to light theme" aria-pressed="false">Theme: Light</button>
  </nav>
</header>
<main class="site-main" id="main">${body}</main>
<footer class="site-footer">
  <span>WG-ARCH-001 · <a href="${escapeHtml(repoUrl(env))}">Public source</a></span>
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
<section class="page-header home-header">
  <p class="eyebrow">WG-ARCH-001 / executable companion</p>
  <h1>Architecture <span>you can inspect.</span></h1>
  <p class="lede home-lede">${list.length} live routes expose the platform, interfaces, standards, delivery controls, and operations behind a production edge system.</p>
</section>
<section class="status-strip" aria-label="Live service state">
  <a href="/version"><span>Version</span><strong>${escapeHtml(env.DEPLOYED_VERSION || 'development')}</strong></a>
  <a href="/dashboard#health"><span>Health</span><strong data-health>Checking…</strong></a>
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
      </a>`).join('')}
  </div>
</section>`;
  }).join('')}
<script>
fetch('/health').then((r) => r.json()).then((h) => {
  const slot = document.querySelector('[data-health]');
  if (slot) slot.textContent = h.status;
}).catch(() => {
  const slot = document.querySelector('[data-health]');
  if (slot) slot.textContent = 'Unavailable';
});
</script>`;
  return shell(env, 'Architecture', body, { activeRoute: '/', description: DEFAULT_DESCRIPTION });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Previous/next within the same group keeps adjacent proofs easy to reach. */
function groupPager(demo: DemoDefinition, all: DemoDefinition[]): string {
  const siblings = all.filter((candidate) => candidate.group === demo.group);
  const index = siblings.findIndex((candidate) => candidate.route === demo.route);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  if (!previous && !next) return '';
  return `<nav class="meta" aria-label="${escapeHtml(demo.group)} routes" style="margin-top:2.5rem;padding-top:1.1rem;border-top:1px solid var(--line)">
    ${previous ? `<a href="${escapeHtml(previous.route)}">← ${escapeHtml(previous.title)}</a>` : ''}
    ${next ? `<a href="${escapeHtml(next.route)}">${escapeHtml(next.title)} →</a>` : ''}
  </nav>`;
}

export interface ReferenceLink {
  label: string;
  href: string;
}

/** Keep provenance available without making it compete with the page's primary task. */
export function referenceDetails(links: ReferenceLink[], label = 'References'): string {
  if (!links.length) return '';
  return `<details class="reference-details"><summary>${escapeHtml(label)}</summary><div class="reference-links">${links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div></details>`;
}

export function renderDemo(env: Env, demo: DemoDefinition, all: DemoDefinition[] = [], extra = ''): Response {
  const actions = demo.actions ?? (demo.action ? [{
    ...demo.action,
    description: demo.action.description ?? demo.interfaces?.find((item) => item.path === demo.action?.path)?.description,
  }] : []);
  const runPanelItems = extra && !demo.actions ? '' : actions.map((action, index) => {
    const headingId = `${action.id ?? `run-${index + 1}`}-heading`;
    return `<section class="action-card"${action.id ? ` id="${escapeHtml(action.id)}"` : ''} aria-labelledby="${escapeHtml(headingId)}">
  ${(action.aliases ?? []).map((alias) => `<span id="${escapeHtml(alias)}" aria-hidden="true"></span>`).join('')}
  <h2 id="${escapeHtml(headingId)}">${escapeHtml(action.title ?? 'Run it')}</h2>
  ${action.description ? `<p>${escapeHtml(action.description)}</p>` : ''}
  <div class="request-line"><span class="http-method http-${action.method.toLowerCase()}">${escapeHtml(action.method)}</span><code>${escapeHtml(action.path)}</code></div>
  ${action.body === undefined ? '' : `<details class="request-example"><summary>Request body</summary><pre>${escapeHtml(JSON.stringify(action.body, null, 2))}</pre></details>`}
  <button class="button-primary" type="button" data-run-demo="${index}">${escapeHtml(action.label)}</button>
  <pre class="action-output" aria-live="polite" data-demo-output="${index}" hidden></pre>
</section>`;
  }).join('');
  const runPanels = runPanelItems ? `<div class="action-grid">${runPanelItems}</div>` : '';
  const sectionItems = (demo.sections ?? []).map((section) => `<article class="info-card" id="${escapeHtml(section.id)}" aria-labelledby="${escapeHtml(section.id)}-heading">
  <h2 id="${escapeHtml(section.id)}-heading">${escapeHtml(section.title)}</h2>
  <p>${escapeHtml(section.description)}</p>
  ${section.points?.length ? `<ul>${section.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>` : ''}
</article>`).join('');
  const sections = sectionItems ? `<div class="info-grid">${sectionItems}</div>` : '';
  const references: ReferenceLink[] = [
    ...(demo.supportingSources ?? []).map((source) => ({ label: source.label, href: sourceUrl(env, source.path) })),
    ...(demo.repositoryLinks ?? []).map((link) => ({ label: link.label, href: `${repoUrl(env)}${link.path}` })),
  ];
  const body = `
<section class="page-header">
  <p class="eyebrow"><a href="/#${escapeHtml(slug(demo.group))}">${escapeHtml(demo.group)}</a> / ${escapeHtml(demo.route)}</p>
  <h1>${escapeHtml(demo.title)}</h1>
  <p class="lede">${escapeHtml(demo.summary)}</p>
  ${demo.notice ? `<p class="subtle">${escapeHtml(demo.notice)}</p>` : ''}
  <div class="page-tools">
    <a class="text-link" href="${escapeHtml(sourceUrl(env, demo.sourcePath))}">Route source</a>
    ${referenceDetails(references)}
  </div>
</section>
${sections}
${extra}
${runPanels}
<details class="implementation-notes"><summary id="proves-heading">Implementation notes</summary><ul>${demo.proves.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>
${groupPager(demo, all)}
<script>
(() => {
  const actions = ${JSON.stringify(actions)};
  document.querySelectorAll('[data-run-demo]').forEach((button) => button.addEventListener('click', async () => {
    const index = Number(button.dataset.runDemo);
    const action = actions[index];
    const output = document.querySelector('[data-demo-output="' + index + '"]');
    if (!action || !output) return;
    output.hidden = false;
    output.textContent = 'Running…';
    try {
      const response = await fetch(action.path, {
        method: action.method,
        ...(action.body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(action.body) })
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json') ? await response.json() : await response.text();
      output.textContent = response.status + ' ' + response.statusText + '\n\n' + (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
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
