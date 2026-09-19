import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import {
  primaryNavigation,
  registeredRouteMetadata,
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
import { criticalStyles, demoStyles, shellStylesheetAsset } from './style-delivery';
import { versionProof } from './version-proof';
import { withSecurityHeaders } from '../lib/http';

const SITE_NAME = 'WizardGang Architecture Demo';
const DEFAULT_DESCRIPTION = 'A live Cloudflare architecture lab with stable task routes and demonstration fragments, executable behavior, and direct links to the public code behind it.';
const ROOT_ROUTE_ID = 'interfaces.frontend.index';

/** Acid square with an offset violet square — the same mark as the wordmark. */
const FAVICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#08080b"/><rect x="5" y="15" width="12" height="12" fill="#d9ff43"/><rect x="15" y="5" width="12" height="12" fill="#a489ff"/></svg>')}`;

/** Restores the reader's stored theme before first paint so the page never flashes. */
const THEME_BOOT = `try{var t=localStorage.getItem('wg-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

function safeScriptJson(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function themeToggleScript(): string {
  return `(()=>{const b=document.querySelector('[data-theme-toggle]');if(!b)return;const r=document.documentElement;const sync=()=>{const isLight=r.dataset.theme==='light';b.setAttribute('aria-pressed',String(!isLight))};sync();b.addEventListener('click',()=>{const next=r.dataset.theme==='light'?'dark':'light';r.dataset.theme=next;try{localStorage.setItem('wg-theme',next)}catch(e){}sync()})})()`;
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

function localizedRouteLabel(localization: LocalizationContext, route: RegisteredRouteMetadataView): string {
  return localization.t(`nav.${route.id}`, route.page?.label ?? route.id);
}

function primaryNavigationHtml(localization: LocalizationContext, currentRouteId: string | undefined): string {
  return primaryNavigation().map((route) => {
    const current = route.id === currentRouteId;
    return `<a href="${escapeHtml(localization.href(routeUrl(route.id)))}"${current ? ' aria-current="page"' : ''}>${escapeHtml(localizedRouteLabel(localization, route))}</a>`;
  }).join('\n    ');
}

function languageSelector(localization: LocalizationContext): string {
  const parameter = localeQueryParameter();
  const preserved = [...localization.currentUrl.searchParams.entries()]
    .filter(([name]) => name !== parameter)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join('');
  const options = supportedLocales.map((locale) => `<option value="${escapeHtml(locale)}"${locale === localization.locale ? ' selected' : ''}>${escapeHtml(localeNames[locale])}</option>`).join('');
  const languageLabel = localization.t('shell.language', 'Language');
  return `<form class="language-selector" method="get" action="${escapeHtml(localization.currentUrl.pathname)}" data-preserve-fragment>
    ${preserved}
    <select id="global-language" name="${escapeHtml(parameter)}" aria-label="${escapeHtml(languageLabel)}" onchange="this.form.requestSubmit()">${options}</select>
    <noscript><button type="submit">${escapeHtml(localization.t('shell.apply_language', 'Apply'))}</button></noscript>
  </form>`;
}

function shell(env: Env, content: PageContent): Response {
  const localization = localizationForEnv(env);
  const homeRoute = localization.href(routeUrl(ROOT_ROUTE_ID));
  const securityRoute = localization.href(routeUrl('security.index'));
  const repositoryUrl = repoUrl(env);
  const issueUrl = `${repositoryUrl}/issues/new?template=bug.yml`;
  const version = versionProof(env);
  const routeSourceModule = content.routeId
    ? registeredRouteMetadata().find((route) => route.id === content.routeId)?.source.module
    : undefined;
  const routeSourceLink = routeSourceModule
    ? ` · <a href="${escapeHtml(sourceUrl(env, routeSourceModule))}">${escapeHtml(localization.t('shell.route_source', 'Route source'))}<span class="sr-only">: ${escapeHtml(routeSourceModule)}</span></a>`
    : '';
  const canonicalHref = new URL(content.canonicalPath ?? routeUrl(ROOT_ROUTE_ID), 'https://demo.wizardgang.ai').toString();
  const lang = content.lang ?? localization.lang;
  const dir = content.dir ?? localization.dir;
  const siteName = localization.t('app.title', SITE_NAME);
  const themeLabel = localization.t('shell.theme_toggle', 'Theme');
  const ogImageAlt = localization.t('meta.og_image_alt', 'WizardGang Architecture — Architecture you can inspect.');
  const shellStylesheetHref = routeUrl('operations.assets', { asset: shellStylesheetAsset });
  const headExtra = `${content.routeId === 'demos.index' ? `<style data-demo-styles>${demoStyles}</style>` : ''}${content.headExtra ?? ''}`;
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
  <style data-critical-shell>${criticalStyles}</style>
  <link rel="stylesheet" href="${escapeHtml(shellStylesheetHref)}">
  ${headExtra}
  <link rel="icon" href="${FAVICON}">
  <script>${THEME_BOOT}</script>
</head>
<body${content.routeId ? ` data-route-id="${escapeHtml(content.routeId)}"` : ''}>
<a class="skip-link" href="#main">${escapeHtml(localization.t('shell.skip_main', 'Skip to main content'))}</a>
<header class="site-header">
  <a class="brand" href="${escapeHtml(homeRoute)}" aria-label="${escapeHtml(localization.t('shell.home', 'WizardGang Architecture Demo home'))}">
    <span class="brand-mark" aria-hidden="true"></span>
    <span class="brand-copy"><strong>WIZARDGANG</strong></span>
  </a>
  <nav class="nav" aria-label="${escapeHtml(localization.t('shell.primary_navigation', 'Primary navigation'))}">
    ${primaryNavigationHtml(localization, content.routeId)}
  </nav>
  <div class="header-utilities" aria-label="Site utilities">
    <a href="${escapeHtml(repositoryUrl)}">${escapeHtml(localization.t('shell.source', 'Source'))} <span aria-hidden="true">↗</span></a>
    <button type="button" data-theme-toggle aria-label="${escapeHtml(themeLabel)}" aria-pressed="true">${escapeHtml(themeLabel)}</button>
    ${languageSelector(localization)}
  </div>
</header>

<main class="site-main" id="main">${content.body}</main>
<footer class="site-footer">
  <span class="site-footer-links"><a href="${escapeHtml(securityRoute)}">${escapeHtml(localization.t('nav.security.index', 'Security'))}</a> · <a href="${escapeHtml(issueUrl)}">${escapeHtml(localization.t('shell.report_issue', 'Report an issue'))}</a>${routeSourceLink}</span>
  <span class="site-footer-build"><a href="${escapeHtml(version.href)}">${escapeHtml(version.label)}</a> · <span>${escapeHtml(version.detail)}</span></span>
</footer>
<script>${themeToggleScript()};(()=>{const form=document.querySelector('[data-preserve-fragment]');if(!form)return;form.addEventListener('submit',()=>{form.action=location.pathname+location.hash})})()</script>
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

export interface ReferenceLink {
  label: string;
  href: string;
  accessibleSuffix?: string;
}

export function routeSourceReference(env: Env, module: string): ReferenceLink {
  return {
    label: 'Route source',
    href: sourceUrl(env, module),
    accessibleSuffix: module,
  };
}

/** Keep provenance available without making it compete with the page's primary task. */
export function referenceDetails(links: ReferenceLink[], label = 'References'): string {
  if (!links.length) return '';
  return `<details class="reference-details"><summary>${escapeHtml(label)}</summary><div class="reference-links">${links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}${link.accessibleSuffix ? `<span class="sr-only">: ${escapeHtml(link.accessibleSuffix)}</span>` : ''}</a>`).join('')}</div></details>`;
}
