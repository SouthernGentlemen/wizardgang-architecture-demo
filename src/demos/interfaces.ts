import type { DemoDefinition, Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { renderNotFound, shell } from '../ui/page';
import apiDemo from './api';
import graphqlDemo from './graphql';
import webhooksDemo from './webhooks';
import identityDemo from './identity';
import mcpDemo from './mcp';
import i18nDemo from './i18n';
import accessibilityDemo from './accessibility';
import { renderApiDemo } from './api-page';
import { renderGraphqlDemo } from './graphql-console';
import { renderWebhooksDemo } from './webhook-console';
import { renderIdentityDemo } from './identity-page';
import { renderMcpDemo } from './mcp-page';
import { renderI18nDemo } from './i18n-page';
import { renderAccessibilityDemo } from './accessibility-page';

export const interfaceViews = ['rest', 'graphql', 'webhooks', 'identity', 'mcp', 'i18n', 'accessibility'] as const;
export type InterfaceView = (typeof interfaceViews)[number];

const interfacesDemo: DemoDefinition = {
  id: 'interfaces',
  route: '/interfaces',
  title: 'Interfaces',
  group: 'Interfaces',
  sourcePath: 'src/demos/interfaces.ts',
  summary: 'One server-rendered surface for the REST, GraphQL, webhook, identity, MCP, internationalization, and accessibility demonstrations.',
  proves: [
    'Interface demonstrations share one canonical HTML route without a client-side router',
    'GraphQL and MCP keep their machine endpoints separate from browser presentation',
    'Identity callbacks land on the consolidated identity view without changing protocol validation',
    'Deep links remain ordinary server-rendered query-selected documents',
  ],
  status: 'working',
};

function viewHref(view: InterfaceView): string {
  return `/interfaces?view=${view}`;
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

const viewLabels: Record<InterfaceView, string> = {
  rest: 'REST',
  graphql: 'GraphQL',
  webhooks: 'Webhooks',
  identity: 'Identity',
  mcp: 'MCP',
  i18n: 'I18n',
  accessibility: 'Accessibility',
};

function isInterfaceView(value: string): value is InterfaceView {
  return (interfaceViews as readonly string[]).includes(value);
}

async function mainContent(response: Response): Promise<string> {
  const html = await response.text();
  const marker = '<main class="site-main" id="main">';
  const start = html.indexOf(marker);
  const end = start === -1 ? -1 : html.indexOf('</main>', start + marker.length);
  if (start === -1 || end === -1) throw new Error('Interface renderer did not return the shared page shell.');
  return html.slice(start + marker.length, end);
}

async function renderSelectedInterface(request: Request, env: Env, view: InterfaceView): Promise<string> {
  let response: Response;
  if (view === 'rest') response = renderApiDemo(env);
  else if (view === 'graphql') response = renderGraphqlDemo(env);
  else if (view === 'webhooks') response = renderWebhooksDemo(env);
  else if (view === 'identity') response = renderIdentityDemo(env);
  else if (view === 'mcp') response = await renderMcpDemo(request, env);
  else if (view === 'i18n') response = await renderI18nDemo(request, env);
  else response = renderAccessibilityDemo(request, env);
  return mainContent(response);
}

function viewNavigation(view: InterfaceView): string {
  return `<section class="platform-view-selector interface-view-selector" aria-label="Interface view selection">
    <div class="section-head"><h2>Interface demonstrations</h2><span>Server-rendered views</span></div>
    <nav class="meta" aria-label="Interface demonstrations">
      ${interfaceViews.map((name) => `<a href="${escapeHtml(viewHref(name))}"${name === view ? ' aria-current="page"' : ''}>${escapeHtml(viewLabels[name])}</a>`).join('')}
    </nav>
  </section>`;
}

function localeDocumentAttributes(html: string, request: Request, view: InterfaceView): string {
  if (view !== 'i18n') return html;
  const requested = new URL(request.url).searchParams.get('locale');
  const locale = requested === 'es' || requested === 'fr' || requested === 'de' || requested === 'ja' || requested === 'ar' ? requested : 'en';
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  return html.replace('<html lang="en">', `<html lang="${locale}" dir="${direction}">`);
}

async function finalizeResponse(
  response: Response,
  request: Request,
  view: InterfaceView,
  canonicalPath: string,
): Promise<Response> {
  let html = await response.text();
  const canonicalHref = new URL(canonicalPath, 'https://demo.wizardgang.ai').toString();
  const tag = `<link rel="canonical" href="${escapeHtml(canonicalHref)}">`;
  html = html.replace('  <link rel="icon"', `  ${tag}\n  <link rel="icon"`);
  html = localeDocumentAttributes(html, request, view);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function renderInterfaces(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const rawView = url.searchParams.get('view');
  const requestedView = rawView === null ? 'rest' : rawView;
  if (!isInterfaceView(requestedView)) return renderNotFound(env);

  const selected = viewDemos[requestedView];
  const body = `${viewNavigation(requestedView)}
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, interfacesDemo.sourcePath))}">Interfaces route source</a></div>
  ${await renderSelectedInterface(request, env, requestedView)}`;
  const response = shell(env, `${selected.title} · Interfaces`, body, {
    activeRoute: interfacesDemo.route,
    description: selected.summary,
    cacheControl: 'no-store',
  });
  return finalizeResponse(response, request, requestedView, rawView === null ? interfacesDemo.route : viewHref(requestedView));
}

export default interfacesDemo;
