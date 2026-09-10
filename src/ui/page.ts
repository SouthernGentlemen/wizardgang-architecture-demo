import type { DemoDefinition, Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import {
  primaryNavigation,
  registeredRouteMetadata,
  secondaryNavigation,
  type RegisteredRouteMetadataView,
} from '../routing/navigation';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import {
  localeNames,
  localeQueryParameter,
  localizationForEnv,
  supportedLocales,
  type LocalizationContext,
} from '../i18n/runtime';
import { localizePresentation } from '../i18n/presentation';
import { navigationStyles } from './navigation-styles';
import { runtimeStyles } from './runtime-styles';
import { styles } from './styles';
import { withSecurityHeaders } from '../lib/http';

const SITE_NAME = 'WizardGang Architecture Demo';
const DEFAULT_DESCRIPTION = 'Executable companion to the WizardGang architecture. Every concept has a stable route, a live implementation, and a direct link to the public code behind it.';
const ROOT_ROUTE_ID = 'interfaces.frontend.index';
const OPERATIONS_ROUTE_ID = 'operations.index';
const RELATED_NAVIGATION: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'assurance.index': Object.freeze(['security.index']),
});

/** Acid square with an offset violet square — the same mark as the wordmark. */
const FAVICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#08080b"/><rect x="5" y="15" width="12" height="12" fill="#d9ff43"/><rect x="15" y="5" width="12" height="12" fill="#a489ff"/></svg>')}`;

/** Restores the reader's stored theme before first paint so the page never flashes. */
const THEME_BOOT = `try{var t=localStorage.getItem('wg-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

function safeScriptJson(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function themeToggleScript(localization: LocalizationContext): string {
  const light = safeScriptJson(localization.t('shell.theme.light', 'Light'));
  const dark = safeScriptJson(localization.t('shell.theme.dark', 'Dark'));
  const label = safeScriptJson(localization.t('shell.theme.label', 'Theme: {theme}'));
  const switchLabel = safeScriptJson(localization.t('shell.theme.switch', 'Switch to {theme} theme'));
  return `(()=>{const b=document.querySelector('[data-theme-toggle]');if(!b)return;const r=document.documentElement;const light=${light};const dark=${dark};const label=${label};const switchLabel=${switchLabel};const format=(template,value)=>template.replace('{theme}',value);const sync=()=>{const isLight=r.dataset.theme==='light';const current=isLight?light:dark;const next=isLight?dark:light;b.textContent=format(label,current);b.setAttribute('aria-label',format(switchLabel,next));b.setAttribute('aria-pressed',String(!isLight))};sync();b.addEventListener('click',()=>{const next=r.dataset.theme==='light'?'dark':'light';r.dataset.theme=next;try{localStorage.setItem('wg-theme',next)}catch(e){}sync()})})()`;
}

export interface PageContent {
  title: string;
  description: string;
  body: string;
  headExtra?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  status?: number;
  cacheControl?: string;
  noindex?: boolean;
  canonicalPath?: string;
  routeId?: string;
}

export interface PageContentOptions extends Partial<Omit<PageContent, 'title' | 'description' | 'body'>> {
  description?: string;
}

export function pageContent(
  env: Env,
  title: string,
  body: string,
  options: PageContentOptions = {},
): PageContent {
  const { description = DEFAULT_DESCRIPTION, ...contentOptions } = options;
  const localized = localizePresentation(title, description, body, localizationForEnv(env));
  return {
    title: localized.title,
    description: localized.description,
    body: localized.body,
    ...contentOptions,
    canonicalPath: contentOptions.canonicalPath ?? routeUrl(ROOT_ROUTE_ID),
  };
}

function routeMetadata(routeId: string | undefined): RegisteredRouteMetadataView | undefined {
  if (!routeId) return undefined;
  return registeredRouteMetadata().find((route) => route.id === routeId);
}

function localizedRouteLabel(localization: LocalizationContext, route: RegisteredRouteMetadataView): string {
  return localization.t(`nav.${route.id}`, route.page?.label ?? route.id);
}

function ancestorRouteIds(routeId: string | undefined): ReadonlySet<string> {
  if (!routeId) return new Set();
  const byId = new Map(registeredRouteMetadata().map((route) => [route.id, route]));
  const ancestors = new Set<string>();
  let current = byId.get(routeId);
  while (current?.page?.parent) {
    const parentId = current.page.parent;
    if (ancestors.has(parentId)) break;
    ancestors.add(parentId);
    current = byId.get(parentId);
  }
  return ancestors;
}

function primaryNavigationHtml(localization: LocalizationContext, currentRouteId: string | undefined): string {
  const ancestors = ancestorRouteIds(currentRouteId);
  return primaryNavigation().map((route) => {
    const current = route.id === currentRouteId;
    const sectionCurrent = !current && ancestors.has(route.id);
    return `<a href="${escapeHtml(localization.href(routeUrl(route.id)))}"${current ? ' aria-current="page"' : ''}${sectionCurrent ? ' data-section-current' : ''}>${escapeHtml(localizedRouteLabel(localization, route))}</a>`;
  }).join('\n    ');
}

/** Project the registered parent chain into a single canonical breadcrumb trail. */
export function breadcrumbNavigation(
  currentRouteId: string | undefined,
  localization: LocalizationContext = localizationForEnv({} as Env),
): string {
  const current = routeMetadata(currentRouteId);
  if (!current?.page) return '';
  const byId = new Map(registeredRouteMetadata().map((route) => [route.id, route]));
  const chain: RegisteredRouteMetadataView[] = [current];
  const seen = new Set([current.id]);
  let parentId = current.page.parent;
  while (parentId) {
    if (seen.has(parentId)) throw new Error(`Breadcrumb parent cycle detected at '${parentId}'`);
    const parent = byId.get(parentId);
    if (!parent?.page) throw new Error(`Breadcrumb parent '${parentId}' is not a registered page`);
    chain.push(parent);
    seen.add(parentId);
    parentId = parent.page.parent;
  }
  chain.reverse();
  return `<nav class="breadcrumb" aria-label="${escapeHtml(localization.t('shell.breadcrumb', 'Breadcrumb'))}"><ol>${chain.map((route, index) => {
    const final = index === chain.length - 1;
    const label = localizedRouteLabel(localization, route);
    return final
      ? `<li aria-current="page">${escapeHtml(label)}</li>`
      : `<li><a href="${escapeHtml(localization.href(routeUrl(route.id)))}">${escapeHtml(label)}</a></li>`;
  }).join('')}</ol></nav>`;
}

function secondaryParent(current: RegisteredRouteMetadataView): { id: string; routes: RegisteredRouteMetadataView[] } | undefined {
  if (current.page?.parent) {
    const siblingRoutes = secondaryNavigation(current.page.parent);
    if (siblingRoutes.length && (current.page.navigation === 'secondary' || siblingRoutes.some((route) => route.id === current.id))) {
      return { id: current.page.parent, routes: siblingRoutes };
    }
  }
  const childRoutes = secondaryNavigation(current.id);
  return childRoutes.length ? { id: current.id, routes: childRoutes } : undefined;
}

/** Project child-route navigation once in the shell; related domains remain a separate landmark. */
export function secondaryNavigationHtml(
  currentRouteId: string | undefined,
  localization: LocalizationContext = localizationForEnv({} as Env),
): string {
  const current = routeMetadata(currentRouteId);
  if (!current?.page) return '';
  const projection = secondaryParent(current);
  if (!projection) return '';
  const parent = routeMetadata(projection.id);
  if (!parent?.page) return '';
  const parentLabel = localizedRouteLabel(localization, parent);
  const siblingLabel = localization.t('shell.sections', '{section} sections', { section: parentLabel });
  const siblingList = `<nav class="secondary-navigation" aria-label="${escapeHtml(siblingLabel)}"><ul class="secondary-navigation-list">${projection.routes.map((route) =>
    `<li><a href="${escapeHtml(localization.href(routeUrl(route.id)))}"${route.id === current.id ? ' aria-current="page" data-route-current' : ''}>${escapeHtml(localizedRouteLabel(localization, route))}</a></li>`
  ).join('')}</ul></nav>`;
  const relatedIds = RELATED_NAVIGATION[projection.id] ?? [];
  const relatedRoutes = relatedIds.map((routeId) => routeMetadata(routeId)).filter((route): route is RegisteredRouteMetadataView => Boolean(route?.page));
  const relatedLabel = localization.t('shell.related_destinations', '{section} related destinations', { section: parentLabel });
  const relatedList = relatedRoutes.length
    ? `<nav class="related-navigation" aria-label="${escapeHtml(relatedLabel)}"><ul class="related-navigation-list">${relatedRoutes.map((route) => `<li><a href="${escapeHtml(localization.href(routeUrl(route.id)))}">${escapeHtml(localizedRouteLabel(localization, route))}</a></li>`).join('')}</ul></nav>`
    : '';
  return `<div class="secondary-navigation-shell">${siblingList}${relatedList}</div>`;
}

function shellNavigation(localization: LocalizationContext, currentRouteId: string | undefined): string {
  const breadcrumb = breadcrumbNavigation(currentRouteId, localization);
  const secondary = secondaryNavigationHtml(currentRouteId, localization);
  return breadcrumb || secondary ? `<div class="shell-navigation">${breadcrumb}${secondary}</div>` : '';
}

function languageSelector(localization: LocalizationContext): string {
  const parameter = localeQueryParameter();
  const preserved = [...localization.currentUrl.searchParams.entries()]
    .filter(([name]) => name !== parameter)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join('');
  const options = supportedLocales.map((locale) => `<option value="${escapeHtml(locale)}"${locale === localization.locale ? ' selected' : ''}>${escapeHtml(localeNames[locale])}</option>`).join('');
  const languageLabel = localization.t('shell.language', 'Language');
  return `<form class="language-selector" method="get" action="${escapeHtml(localization.currentUrl.pathname)}">
    ${preserved}
    <label for="global-language">${escapeHtml(languageLabel)}</label>
    <select id="global-language" name="${escapeHtml(parameter)}" aria-label="${escapeHtml(languageLabel)}">${options}</select>
    <button type="submit">${escapeHtml(localization.t('shell.apply_language', 'Apply'))}</button>
  </form>`;
}

function shell(env: Env, content: PageContent): Response {
  const localization = localizationForEnv(env);
  const homeRoute = localization.href(routeUrl(ROOT_ROUTE_ID));
  const routeSourceModule = content.routeId
    ? registeredRouteMetadata().find((route) => route.id === content.routeId)?.source.module
    : undefined;
  const routeSourceLink = routeSourceModule
    ? ` · <a href="${escapeHtml(sourceUrl(env, routeSourceModule))}">${escapeHtml(localization.t('shell.route_source', 'Route source'))}</a>`
    : '';
  const canonicalHref = new URL(content.canonicalPath ?? routeUrl(ROOT_ROUTE_ID), 'https://demo.wizardgang.ai').toString();
  const lang = content.lang ?? localization.lang;
  const dir = content.dir ?? localization.dir;
  const siteName = localization.t('app.title', SITE_NAME);
  const darkLabel = localization.t('shell.theme.dark', 'Dark');
  const lightLabel = localization.t('shell.theme.light', 'Light');
  const themeText = localization.t('shell.theme.label', 'Theme: {theme}', { theme: darkLabel });
  const themeAria = localization.t('shell.theme.switch', 'Switch to {theme} theme', { theme: lightLabel });
  const ogImageAlt = localization.t('meta.og_image_alt', 'WizardGang Architecture — Architecture you can inspect.');
  const html = `<!doctype html>
<html lang="${escapeHtml(lang)}" dir="${escapeHtml(dir)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(content.title)} · ${escapeHtml(siteName)}</title>
  <meta name="description" content="${escapeHtml(content.description)}">
  <meta name="color-scheme" content="dark light">
  ${content.noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:title" content="${escapeHtml(content.title)}">
  <meta property="og:description" content="${escapeHtml(content.description)}">
  <meta property="og:url" content="${escapeHtml(canonicalHref)}">
  <meta property="og:image" content="https://demo.wizardgang.ai/assets/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://demo.wizardgang.ai/assets/og.png">
  <link rel="canonical" href="${escapeHtml(canonicalHref)}">
  ${content.headExtra ?? ''}
  <link rel="icon" href="${FAVICON}">
  <style>${styles}${navigationStyles}${runtimeStyles}</style>
  <script>${THEME_BOOT}</script>
</head>
<body${content.routeId ? ` data-route-id="${escapeHtml(content.routeId)}"` : ''}>
<a class="skip-link" href="#main">${escapeHtml(localization.t('shell.skip_main', 'Skip to main content'))}</a>
<header class="site-header">
  <a class="brand" href="${escapeHtml(homeRoute)}" aria-label="${escapeHtml(localization.t('shell.home', 'WizardGang Architecture Demo home'))}">
    <span class="brand-mark" aria-hidden="true"></span>
    <span class="brand-copy"><strong>WIZARDGANG</strong><small>${escapeHtml(localization.t('shell.brand.subtitle', 'Architecture demo'))}</small></span>
  </a>
  <nav class="nav" aria-label="${escapeHtml(localization.t('shell.primary_navigation', 'Primary navigation'))}">
    ${primaryNavigationHtml(localization, content.routeId)}
    <a href="https://wizardgang.ai/">${escapeHtml(localization.t('shell.main_site', 'Main site'))} <span aria-hidden="true">↗</span></a>
    <button type="button" data-theme-toggle aria-label="${escapeHtml(themeAria)}" aria-pressed="true">${escapeHtml(themeText)}</button>
    ${languageSelector(localization)}
  </nav>
</header>
${shellNavigation(localization, content.routeId)}
<main class="site-main" id="main">${content.body}</main>
<footer class="site-footer">
  <span><a href="${escapeHtml(repoUrl(env))}">${escapeHtml(localization.t('shell.public_source', 'Public source'))}</a>${routeSourceLink}</span>
</footer>
<script>${themeToggleScript(localization)}</script>
</body>
</html>`;
  const headers = withSecurityHeaders(new Headers({ 'content-type': 'text/html; charset=utf-8' }));
  if (content.cacheControl) headers.set('cache-control', content.cacheControl);
  if (content.noindex) {
    headers.set('x-robots-tag', 'noindex, nofollow');
    headers.set('referrer-policy', 'no-referrer');
  }
  return new Response(html, { status: content.status ?? 200, headers });
}

export function renderPage(env: Env, content: PageContent): Response {
  return shell(env, content);
}

export function pageResponse(
  env: Env,
  title: string,
  body: string,
  options: PageContentOptions = {},
): Response {
  return renderPage(env, pageContent(env, title, body, options));
}

function architectureMapSections(
  list: RegisteredRouteMetadataView[],
  localization: LocalizationContext,
): string {
  const byId = new Map(registeredRouteMetadata().map((route) => [route.id, route]));
  const groups = new Map<string, RegisteredRouteMetadataView[]>();
  for (const route of list) {
    if (!route.page) continue;
    const parentId = route.page.parent ?? ROOT_ROUTE_ID;
    const entries = groups.get(parentId) ?? [];
    entries.push(route);
    groups.set(parentId, entries);
  }
  const orderedGroups = [...groups.entries()].sort(([leftId], [rightId]) => {
    const left = byId.get(leftId)?.page?.order ?? Number.MAX_SAFE_INTEGER;
    const right = byId.get(rightId)?.page?.order ?? Number.MAX_SAFE_INTEGER;
    return left - right || leftId.localeCompare(rightId);
  });
  return orderedGroups.map(([parentId, entries]) => {
    const parent = byId.get(parentId);
    const isRoot = parentId === ROOT_ROUTE_ID;
    const heading = isRoot ? localization.t('home.public_domains', 'Public domains') : (parent?.page ? localizedRouteLabel(localization, parent) : parentId);
    const headingHtml = !isRoot && parent?.page
      ? `<a href="${escapeHtml(localization.href(routeUrl(parent.id)))}">${escapeHtml(heading)}</a>`
      : escapeHtml(heading);
    const destinationCount = localization.t(entries.length === 1 ? 'home.destination_one' : 'home.destination_other', `${entries.length} destination${entries.length === 1 ? '' : 's'}`, { count: localization.number(entries.length) });
    return `<section class="architecture-domain" data-parent-route="${escapeHtml(parentId)}">
  <div class="section-head"><h2>${headingHtml}</h2><span>${escapeHtml(destinationCount)}</span></div>
  <div class="grid">
    ${entries.map((route) => {
      const href = routeUrl(route.id);
      return `<a class="card" href="${escapeHtml(localization.href(href))}">
        <p class="eyebrow"><bdi dir="ltr">${escapeHtml(href)}</bdi></p>
        <h3>${escapeHtml(localizedRouteLabel(localization, route))}</h3>
        <p>${escapeHtml(localization.t(`summary.${route.id}`, route.page!.summary))}</p>
      </a>`;
    }).join('')}
  </div>
</section>`;
  }).join('\n');
}

export function renderIndex(env: Env, list: RegisteredRouteMetadataView[]): Response {
  const localization = localizationForEnv(env);
  const homeRoute = routeUrl(ROOT_ROUTE_ID);
  const operationsRoute = localization.href(routeUrl(OPERATIONS_ROUTE_ID));
  const liveDestinations = localization.t('home.live_destinations', '{count} live destinations expose the platform, interfaces, assurance, security, and operations behind a production edge system.', { count: localization.number(list.length) });
  const healthLabels = safeScriptJson(JSON.stringify({
    healthy: localization.t('common.healthy', 'Healthy'),
    degraded: localization.t('common.degraded', 'Degraded'),
    unavailable: localization.t('common.unavailable', 'Unavailable'),
  }));
  const body = `
<section class="page-header home-header">
  <h1>${escapeHtml(localization.t('nav.interfaces.frontend.index', 'Architecture'))} <span>${escapeHtml(localization.t('home.inspectable', 'you can inspect.'))}</span></h1>
  <p class="lede home-lede">${escapeHtml(liveDestinations)}</p>
</section>
<section class="status-strip" aria-label="${escapeHtml(localization.t('home.live_state', 'Live service state'))}">
  <a href="/api/operations/version"><span>${escapeHtml(localization.t('home.version', 'Version'))}</span><strong><bdi dir="ltr">${escapeHtml(env.DEPLOYED_VERSION || 'development')}</bdi></strong></a>
  <a href="${escapeHtml(operationsRoute)}#health"><span>${escapeHtml(localization.t('home.health', 'Health'))}</span><strong data-health>${escapeHtml(localization.t('common.checking', 'Checking…'))}</strong></a>
</section>
<section id="architecture-map">
  ${architectureMapSections(list, localization)}
</section>
<script>
const healthLabels = JSON.parse(${healthLabels});
fetch('/api/operations/health').then((r) => r.json()).then((h) => {
  const slot = document.querySelector('[data-health]');
  if (slot) slot.textContent = healthLabels[h.status] || h.status;
}).catch(() => {
  const slot = document.querySelector('[data-health]');
  if (slot) slot.textContent = healthLabels.unavailable;
});
</script>`;
  return pageResponse(env, localization.t('nav.interfaces.frontend.index', 'Architecture'), body, {
    routeId: ROOT_ROUTE_ID,
    canonicalPath: homeRoute,
    description: localization.t('meta.default_description', DEFAULT_DESCRIPTION),
  });
}

function demoRoute(demo: DemoDefinition): string {
  if (!demo.route) throw new Error(`Demo '${demo.id}' requires a registered route before rendering.`);
  return demo.route;
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

export function demoContent(env: Env, demo: DemoDefinition, _all: DemoDefinition[] = [], extra = ''): PageContent {
  const route = demoRoute(demo);
  const isPlatformDemo = demo.group === 'Platform';
  const actions = demo.actions ?? (demo.action ? [{
    ...demo.action,
    description: demo.action.description ?? demo.interfaces?.find((item) => item.path === demo.action?.path)?.description,
  }] : []);
  const runPanelItems = extra && !demo.actions ? '' : actions.map((action, index) => {
    const headingId = `${action.id ?? `run-${index + 1}`}-heading`;
    return `<section class="action-card"${action.id ? ` id="${escapeHtml(action.id)}"` : ''} aria-labelledby="${escapeHtml(headingId)}">
  <h2 id="${escapeHtml(headingId)}">${escapeHtml(action.title ?? 'Run it')}</h2>
  ${action.description ? `<p>${escapeHtml(action.description)}</p>` : ''}
  <div class="request-line"><span class="http-method http-${action.method.toLowerCase()}">${escapeHtml(action.method)}</span><code>${escapeHtml(action.path)}</code></div>
  ${action.body === undefined || isPlatformDemo ? '' : `<details class="request-example"><summary>Request body</summary><pre>${escapeHtml(JSON.stringify(action.body, null, 2))}</pre></details>`}
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
  const pageTools = isPlatformDemo ? '' : `<div class="page-tools">
    <a class="text-link" href="${escapeHtml(sourceUrl(env, demo.sourcePath))}">Route source</a>
    ${referenceDetails(references)}
  </div>`;
  const body = `
<section class="page-header">
  <h1>${escapeHtml(demo.title)}</h1>
  <p class="lede">${escapeHtml(demo.summary)}</p>
  ${demo.notice ? `<p class="subtle">${escapeHtml(demo.notice)}</p>` : ''}
  ${pageTools}
</section>
${sections}
${extra}
${runPanels}
${isPlatformDemo ? '' : `<details class="implementation-notes"><summary id="proves-heading">Implementation notes</summary><ul>${demo.proves.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>`}
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
      output.textContent = response.status + ' ' + response.statusText + '\\n\\n' + (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (error) {
      output.textContent = String(error);
    }
  }));
})();
</script>`;
  return pageContent(env, demo.title, body, { canonicalPath: route, description: demo.summary });
}

export function renderNotFound(env: Env): Response {
  const localization = localizationForEnv(env);
  return pageResponse(env, 'Not found', `
<section>
  <p class="eyebrow">404 / unknown route</p>
  <h1>That route does not exist.</h1>
  <p class="lede">Every published route is registered in the route map and backed by a source module.</p>
  <div class="meta"><a href="${escapeHtml(localization.href(routeUrl(ROOT_ROUTE_ID)))}">Architecture map</a><a href="${escapeHtml(localization.href(routeUrl(OPERATIONS_ROUTE_ID)))}">Operations</a><a href="${escapeHtml(sourceUrl(env, 'docs/ROUTES.md'))}">Route map</a></div>
</section>`, { status: 404, noindex: true });
}
