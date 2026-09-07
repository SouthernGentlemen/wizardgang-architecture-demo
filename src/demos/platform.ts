import type { DemoDefinition, Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { renderDemo, renderNotFound, shell } from '../ui/page';
import edgeDemo from './edge';
import workersDemo from './workers';
import durableObjectsDemo from './durable-objects';
import d1Demo from './d1';
import r2Demo from './r2';
import { renderD1Demo } from './d1-page';
import { renderR2Demo } from './r2-page';

export const platformViews = ['edge', 'workers', 'durable-objects', 'd1', 'r2'] as const;
export type PlatformView = (typeof platformViews)[number];

const platformDemo: DemoDefinition = {
  id: 'platform',
  route: '/platform',
  title: 'Cloudflare Platform',
  group: 'Platform',
  sourcePath: 'src/demos/platform.ts',
  summary: 'One server-rendered surface for the edge, Worker, Durable Object, D1, and R2 architecture laboratories.',
  proves: [
    'Platform demonstrations share one canonical HTML route without a client-side router',
    'Each view preserves its existing platform API and storage boundary',
    'Deep links are ordinary query-selected server-rendered documents',
  ],
  status: 'working',
};

function viewHref(view: PlatformView): string {
  return `/platform?view=${view}`;
}

const viewDemos: Record<PlatformView, DemoDefinition> = {
  edge: { ...edgeDemo, route: viewHref('edge') },
  workers: { ...workersDemo, route: viewHref('workers') },
  'durable-objects': { ...durableObjectsDemo, route: viewHref('durable-objects') },
  d1: { ...d1Demo, route: viewHref('d1') },
  r2: { ...r2Demo, route: viewHref('r2') },
};

const viewLabels: Record<PlatformView, string> = {
  edge: 'Edge',
  workers: 'Workers',
  'durable-objects': 'Durable Objects',
  d1: 'D1',
  r2: 'R2',
};

function isPlatformView(value: string): value is PlatformView {
  return (platformViews as readonly string[]).includes(value);
}

async function mainContent(response: Response): Promise<string> {
  const html = await response.text();
  const marker = '<main class="site-main" id="main">';
  const start = html.indexOf(marker);
  const end = start === -1 ? -1 : html.indexOf('</main>', start + marker.length);
  if (start === -1 || end === -1) throw new Error('Platform laboratory renderer did not return the shared page shell.');
  return html.slice(start + marker.length, end);
}

async function renderSelectedLaboratory(env: Env, view: PlatformView): Promise<string> {
  if (view === 'd1') return mainContent(renderD1Demo(env));
  if (view === 'r2') return mainContent(renderR2Demo(env));
  return mainContent(renderDemo(env, viewDemos[view], platformViews.map((name) => viewDemos[name])));
}

function viewNavigation(view: PlatformView): string {
  return `<section class="platform-view-selector" aria-label="Platform view selection">
    <div class="section-head"><h2>Platform demonstrations</h2><span>Server-rendered views</span></div>
    <nav class="meta" aria-label="Platform demonstrations">
      ${platformViews.map((name) => `<a href="${escapeHtml(viewHref(name))}"${name === view ? ' aria-current="page"' : ''}>${escapeHtml(viewLabels[name])}</a>`).join('')}
    </nav>
  </section>`;
}

async function addCanonical(response: Response, canonicalPath: string): Promise<Response> {
  const html = await response.text();
  const canonicalHref = new URL(canonicalPath, 'https://demo.wizardgang.ai').toString();
  const tag = `<link rel="canonical" href="${escapeHtml(canonicalHref)}">`;
  const rendered = html.replace('  <link rel="icon"', `  ${tag}\n  <link rel="icon"`);
  return new Response(rendered, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function renderPlatform(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const rawView = url.searchParams.get('view');
  const requestedView = rawView === null ? 'edge' : rawView;
  if (!isPlatformView(requestedView)) return renderNotFound(env);

  const selected = viewDemos[requestedView];
  const body = `${viewNavigation(requestedView)}
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, platformDemo.sourcePath))}">Platform route source</a></div>
  ${await renderSelectedLaboratory(env, requestedView)}`;
  const response = shell(env, `${selected.title} · Platform`, body, {
    activeRoute: platformDemo.route,
    description: selected.summary,
  });
  return addCanonical(response, rawView === null ? platformDemo.route : viewHref(requestedView));
}

export default platformDemo;
