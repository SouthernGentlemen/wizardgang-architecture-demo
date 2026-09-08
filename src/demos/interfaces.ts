import type { DemoDefinition, Env } from '../types';
import { frontendSurface, frontendViewUrl } from './registry';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { renderNotFound, renderPage, type PageContent } from '../ui/page';
import apiDemo from './api';
import graphqlDemo from './graphql';
import webhooksDemo from './webhooks';
import identityDemo from './identity';
import mcpDemo from './mcp';
import i18nDemo from './i18n';
import accessibilityDemo from './accessibility';
import { apiContent } from './api-page';
import { graphqlContent } from './graphql-console';
import { webhooksContent } from './webhook-console';
import { identityContent } from './identity-page';
import { mcpContent } from './mcp-page';
import { i18nContent } from './i18n-page';
import { accessibilityContent } from './accessibility-page';

export const interfaceViews = ['rest', 'graphql', 'webhooks', 'identity', 'mcp', 'i18n', 'accessibility'] as const;
export type InterfaceView = (typeof interfaceViews)[number];

const interfacesSurface = frontendSurface('interfaces.page');

function viewHref(view: InterfaceView): string {
  return frontendViewUrl('interfaces.page', view);
}

const viewDemos: Record<InterfaceView, DemoDefinition> = {
  rest: apiDemo,
  graphql: graphqlDemo,
  webhooks: webhooksDemo,
  identity: identityDemo,
  mcp: mcpDemo,
  i18n: i18nDemo,
  accessibility: accessibilityDemo,
};

const viewLabels = Object.fromEntries(interfacesSurface.views.map((view) => [view.id, view.label])) as Record<InterfaceView, string>;

function isInterfaceView(value: string): value is InterfaceView {
  return (interfaceViews as readonly string[]).includes(value);
}

async function selectedInterfaceContent(request: Request, env: Env, view: InterfaceView): Promise<PageContent> {
  if (view === 'rest') return apiContent(env);
  if (view === 'graphql') return graphqlContent(env);
  if (view === 'webhooks') return webhooksContent(env);
  if (view === 'identity') return identityContent(env);
  if (view === 'mcp') return mcpContent(request, env);
  if (view === 'i18n') return i18nContent(request, env);
  return accessibilityContent(request, env);
}

function viewNavigation(view: InterfaceView): string {
  return `<section class="platform-view-selector interface-view-selector" aria-label="Interface view selection">
    <div class="section-head"><span class="surface-view-heading">Interface demonstrations</span><span>Server-rendered views</span></div>
    <nav class="meta" aria-label="Interface demonstrations">
      ${interfaceViews.map((name) => `<a href="${escapeHtml(viewHref(name))}"${name === view ? ' aria-current="page"' : ''}>${escapeHtml(viewLabels[name])}</a>`).join('')}
    </nav>
  </section>`;
}

export async function renderInterfaces(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const rawView = url.searchParams.get('view');
  const requestedView = rawView === null ? 'rest' : rawView;
  if (!isInterfaceView(requestedView)) return renderNotFound(env);

  const content = await selectedInterfaceContent(request, env, requestedView);
  const beforeMain = `<div class="site-main surface-before-main">${viewNavigation(requestedView)}
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/interfaces.ts'))}">Interfaces route source</a></div>
  </div>`;
  return renderPage(env, {
    ...content,
    beforeMain,
    canonicalPath: rawView === null ? interfacesSurface.route : viewHref(requestedView),
  });
}
