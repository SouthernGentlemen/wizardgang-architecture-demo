import type { Env } from '../types';
import type { ReactNode } from 'react';
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
  type PageContentOptions,
  type ReactPageContent,
} from './document';

export type { HeadMetadata, PageContentOptions, ReactPageContent } from './document';

/** Legacy presentation payload retained until DEMO-337 migrates every demo fragment. */
export interface PageContent extends Omit<ReactPageContent, 'body'> {
  body: string;
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

export function reactPageContent(
  env: Env,
  title: string,
  body: ReactNode,
  options: PageContentOptions = {},
): ReactPageContent {
  const localization = localizationForEnv(env);
  const { description = DEFAULT_DESCRIPTION, ...contentOptions } = options;
  return {
    title: localization.exact(title),
    description: localization.exact(description),
    body,
    ...contentOptions,
    canonicalPath: contentOptions.canonicalPath ?? routeUrl(ROOT_ROUTE_ID),
  };
}

function documentResponse(env: Env, content: ReactPageContent): Response {
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

export function renderReactPage(env: Env, content: ReactPageContent): Response {
  return documentResponse(env, content);
}

export function reactPageResponse(
  env: Env,
  title: string,
  body: ReactNode,
  options: PageContentOptions = {},
): Response {
  return renderReactPage(env, reactPageContent(env, title, body, options));
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
