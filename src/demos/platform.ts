import type { DemoDefinition, Env } from '../types';
import { frontendSurface, frontendViewUrl } from './registry';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { demoContent, renderNotFound, renderPage, type PageContent } from '../ui/page';
import edgeDemo from './edge';
import workersDemo from './workers';
import durableObjectsDemo from './durable-objects';
import d1Demo from './d1';
import r2Demo from './r2';
import { d1Content } from './d1-page';
import { r2Content } from './r2-page';

export const platformViews = ['edge', 'workers', 'durable-objects', 'd1', 'r2'] as const;
export type PlatformView = (typeof platformViews)[number];

const platformSurface = frontendSurface('platform.page');

function viewHref(view: PlatformView): string {
  return frontendViewUrl('platform.page', view);
}

const viewDemos: Record<PlatformView, DemoDefinition> = {
  edge: { ...edgeDemo, route: viewHref('edge') },
  workers: { ...workersDemo, route: viewHref('workers') },
  'durable-objects': { ...durableObjectsDemo, route: viewHref('durable-objects') },
  d1: { ...d1Demo, route: viewHref('d1') },
  r2: { ...r2Demo, route: viewHref('r2') },
};

const viewLabels = Object.fromEntries(platformSurface.views.map((view) => [view.id, view.label])) as Record<PlatformView, string>;

function isPlatformView(value: string): value is PlatformView {
  return (platformViews as readonly string[]).includes(value);
}

async function selectedLaboratoryContent(env: Env, view: PlatformView): Promise<PageContent> {
  if (view === 'd1') return d1Content(env);
  if (view === 'r2') return r2Content(env);
  return demoContent(env, viewDemos[view], platformViews.map((name) => viewDemos[name]));
}

function viewNavigation(view: PlatformView): string {
  return `<section class="platform-view-selector" aria-label="Platform view selection">
    <div class="section-head"><span class="surface-view-heading">Platform demonstrations</span><span>Server-rendered views</span></div>
    <nav class="meta" aria-label="Platform demonstrations">
      ${platformViews.map((name) => `<a href="${escapeHtml(viewHref(name))}"${name === view ? ' aria-current="page"' : ''}>${escapeHtml(viewLabels[name])}</a>`).join('')}
    </nav>
  </section>`;
}

export async function renderPlatform(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const rawView = url.searchParams.get('view');
  const requestedView = rawView === null ? 'edge' : rawView;
  if (!isPlatformView(requestedView)) return renderNotFound(env);

  const content = await selectedLaboratoryContent(env, requestedView);
  const beforeMain = `<div class="site-main surface-before-main">${viewNavigation(requestedView)}
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/platform.ts'))}">Platform route source</a></div>
  </div>`;
  return renderPage(env, {
    ...content,
    beforeMain,
    canonicalPath: rawView === null ? platformSurface.route : viewHref(requestedView),
  });
}
