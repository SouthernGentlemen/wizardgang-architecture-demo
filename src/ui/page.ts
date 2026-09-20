import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { localizationForEnv } from '../i18n/runtime';
import { localizePresentation } from '../i18n/presentation';
import { withSecurityHeaders } from '../lib/http';
import {
  DEFAULT_DESCRIPTION,
  ROOT_ROUTE_ID,
  renderDocument,
  type PageContent,
  type PageContentOptions,
} from './document';

export type { HeadMetadata, PageContent, PageContentOptions } from './document';

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

function documentResponse(env: Env, content: PageContent): Response {
  const localization = localizationForEnv(env);
  const html = renderDocument(env, content, localization);
  const headers = withSecurityHeaders(new Headers({ 'content-type': 'text/html; charset=utf-8' }));
  if (content.cacheControl) headers.set('cache-control', content.cacheControl);
  if (content.noindex) {
    headers.set('x-robots-tag', 'noindex, nofollow');
    headers.set('referrer-policy', 'no-referrer');
  }
  return new Response(html, { status: content.status ?? 200, headers });
}

export function renderPage(env: Env, content: PageContent): Response {
  return documentResponse(env, content);
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
