import { escapeHtml } from '../lib/html';
import { withSecurityHeaders } from '../lib/http';
import { bindLocalization, resolveLocalization } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { pageContent, type PageContent } from '../ui/page';
import {
  accessibilitySection,
  d1Section,
  durableObjectsSection,
  edgeSection,
  graphqlSection,
  i18nSection,
  identitySection,
  mcpSection,
  r2Section,
  restSection,
  webhooksSection,
  workersSection,
} from './composable-presentations';

const ROUTE_ID = 'demos.index';
const PRESENTATION_ROUTE_ID = 'demos.presentation';
const DEFAULT_DEMO_ID = 'd1';

type DemoTier = 'primary' | 'secondary';
export type DemoCategory = 'Data' | 'APIs' | 'Integrations' | 'Identity' | 'AI' | 'Platform' | 'Quality';

interface ArchitectureDemo {
  id: string;
  label: string;
  selectorLabel: string;
  group: string;
  category: DemoCategory;
  tier: DemoTier;
  summary: string;
  render: (request: Request, env: Env, options: DemoSectionOptions) => DemoSection | Promise<DemoSection>;
}

export const demoCategories: readonly DemoCategory[] = [
  'Data',
  'APIs',
  'Integrations',
  'Identity',
  'AI',
  'Platform',
  'Quality',
] as const;

export const demonstrations: readonly ArchitectureDemo[] = [
  { id: 'd1', label: 'D1', selectorLabel: 'D1', group: 'Data', category: 'Data', tier: 'primary', summary: 'Run relational CRUD against resettable shared demo state.', render: (_request, env, options) => d1Section(env, options) },
  { id: 'r2', label: 'R2', selectorLabel: 'R2', group: 'Data', category: 'Data', tier: 'primary', summary: 'Upload, inspect, and remove bounded objects in live storage.', render: (_request, env, options) => r2Section(env, options) },
  { id: 'rest', label: 'REST / OpenAPI', selectorLabel: 'REST', group: 'APIs', category: 'APIs', tier: 'primary', summary: 'Run the focused REST contract and inspect its OpenAPI description.', render: (_request, env, options) => restSection(env, options) },
  { id: 'graphql', label: 'GraphQL', selectorLabel: 'GraphQL', group: 'APIs', category: 'APIs', tier: 'primary', summary: 'Execute GraphQL operations against the live protocol endpoint.', render: (_request, env, options) => graphqlSection(env, options) },
  { id: 'webhooks', label: 'Webhooks', selectorLabel: 'Webhooks', group: 'Integrations', category: 'Integrations', tier: 'primary', summary: 'Generate and inspect signed synthetic webhook delivery behavior.', render: (_request, env, options) => webhooksSection(env, options) },
  { id: 'identity', label: 'Identity', selectorLabel: 'Identity', group: 'Identity', category: 'Identity', tier: 'primary', summary: 'Inspect the OAuth, OIDC, SAML, session, and authorization behavior available here.', render: (_request, env, options) => identitySection(env, options) },
  { id: 'mcp', label: 'MCP', selectorLabel: 'MCP', group: 'AI / MCP', category: 'AI', tier: 'primary', summary: 'Inspect the endpoint, available tools, and one executable read-only MCP call.', render: (request, env, options) => mcpSection(request, env, options) },
  { id: 'edge', label: 'Edge', selectorLabel: 'Edge', group: 'Runtime architecture', category: 'Platform', tier: 'secondary', summary: 'Inspect the public DNS, TLS, CDN, routing, and request boundary.', render: (_request, env, options) => edgeSection(env, options) },
  { id: 'workers', label: 'Workers', selectorLabel: 'Workers', group: 'Runtime architecture', category: 'Platform', tier: 'secondary', summary: 'Exercise stateless edge compute and request policy behavior.', render: (_request, env, options) => workersSection(env, options) },
  { id: 'durable-objects', label: 'Durable Objects', selectorLabel: 'Durable Objects', group: 'Runtime architecture', category: 'Platform', tier: 'secondary', summary: 'Coordinate stateful requests against one shared object.', render: (_request, env, options) => durableObjectsSection(env, options) },
  { id: 'accessibility', label: 'Accessibility', selectorLabel: 'Accessibility', group: 'Quality', category: 'Quality', tier: 'secondary', summary: 'Operate accessible behavior and inspect bounded failure analysis.', render: (request, env, options) => accessibilitySection(request, env, options) },
  { id: 'i18n', label: 'Internationalization', selectorLabel: 'Internationalization', group: 'Quality', category: 'Quality', tier: 'secondary', summary: 'Exercise locale, formatting, pluralization, and RTL behavior.', render: (request, env, options) => i18nSection(request, env, options) },
] as const;

function demoHref(id: string): string {
  return `${routeUrl(ROUTE_ID)}#${id}`;
}

function demosForCategory(category: DemoCategory): readonly ArchitectureDemo[] {
  return demonstrations.filter((demo) => demo.category === category);
}

function defaultDemoForCategory(category: DemoCategory): ArchitectureDemo {
  const demo = demosForCategory(category)[0];
  if (!demo) throw new Error(`No demonstration registered for ${category}.`);
  return demo;
}

const pageStyles = `<style>
.demo-workbench-nav{display:grid;gap:.75rem;margin:1rem 0}.demo-category-tabs{display:flex;gap:.2rem;overflow-x:auto;border-bottom:1px solid var(--line);scrollbar-width:thin}.demo-category-tab{display:inline-flex;align-items:center;min-height:2.75rem;padding:.55rem .8rem;border-bottom:2px solid transparent;color:var(--muted);text-decoration:none;white-space:nowrap}.demo-category-tab:hover{color:var(--paper)}.demo-category-tab[aria-current="location"]{border-bottom-color:var(--acid);color:var(--paper)}.demo-selector-slot{min-height:2.75rem}.demo-local-selector{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}.demo-local-selector a{display:inline-flex;align-items:center;min-height:2.5rem;padding:.4rem .7rem;border:1px solid var(--line);border-radius:999px;text-decoration:none}.demo-local-selector a[aria-current="location"]{border-color:var(--acid);background:var(--panel-2);color:var(--paper)}.demo-workbench{min-height:20rem;border:1px solid var(--line);border-radius:var(--radius);background:var(--panel);overflow:hidden}.demo-workbench:focus{outline:2px solid var(--acid);outline-offset:3px}.demo-panel{min-height:20rem;padding:1rem}.demo-panel-state{margin:0;color:var(--muted)}.demo-panel-state.error{color:var(--danger)}@media(max-width:760px){.demo-category-tabs{margin-inline:-.25rem;padding-inline:.25rem}.demo-workbench,.demo-panel{min-height:16rem}}
</style>`;

function categoryTabs(): string {
  return `<nav class="demo-category-tabs" aria-label="Demo categories">${demoCategories.map((category) => {
    const demos = demosForCategory(category);
    const defaultDemo = defaultDemoForCategory(category);
    const selected = category === 'Data' ? ' aria-current="location"' : '';
    const fragmentId = demos.length === 1 ? ` id="${escapeHtml(defaultDemo.id)}"` : '';
    const legacyAiGroup = category === 'AI' ? '<span hidden><strong>AI / MCP</strong></span>' : '';
    return `<a class="demo-category-tab"${fragmentId} href="#${escapeHtml(defaultDemo.id)}" data-demo-link="${escapeHtml(defaultDemo.id)}" data-demo-category="${escapeHtml(category)}"${selected}>${legacyAiGroup}<strong>${escapeHtml(category)}</strong></a>`;
  }).join('')}</nav>`;
}

function localSelectors(): string {
  return `<div class="demo-selector-slot" data-demo-selector-slot>${demoCategories.map((category) => {
    const demos = demosForCategory(category);
    if (demos.length < 2) return '';
    const hidden = category === 'Data' ? '' : ' hidden';
    return `<nav class="demo-local-selector" aria-label="${escapeHtml(category)} demos" data-demo-selector-category="${escapeHtml(category)}"${hidden}>${demos.map((demo) => {
      const selected = demo.id === DEFAULT_DEMO_ID ? ' aria-current="location"' : '';
      return `<a id="${escapeHtml(demo.id)}" href="#${escapeHtml(demo.id)}" data-demo-link="${escapeHtml(demo.id)}"${selected}>${escapeHtml(demo.selectorLabel)}</a>`;
    }).join('')}</nav>`;
  }).join('')}</div>`;
}

function workbenchScript(): string {
  const demoMetadata = JSON.stringify(demonstrations.map((demo) => ({ id: demo.id, category: demo.category, label: demo.label })));
  const presentationRoot = JSON.stringify(routeUrl(PRESENTATION_ROUTE_ID, { demo: '__demo__' }));
  return `<script>
(() => {
  const demos = ${demoMetadata};
  const defaultDemoId = ${JSON.stringify(DEFAULT_DEMO_ID)};
  const presentationPattern = ${presentationRoot};
  const byId = new Map(demos.map((demo) => [demo.id, demo]));
  const htmlCache = new Map();
  const pending = new Map();
  const navigationLinks = [...document.querySelectorAll('[data-demo-link]')];
  const categoryTabs = [...document.querySelectorAll('[data-demo-category]')];
  const localSelectors = [...document.querySelectorAll('[data-demo-selector-category]')];
  const selectorSlot = document.querySelector('[data-demo-selector-slot]');
  const workbench = document.querySelector('[data-demo-workbench]');
  const panel = document.querySelector('[data-demo-panel]');
  let activeId = '';

  if (!(workbench instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;

  const selectedId = () => {
    let id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return defaultDemoId; }
    return byId.has(id) ? id : defaultDemoId;
  };

  const runScripts = (root) => {
    root.querySelectorAll('script').forEach((script) => {
      const replacement = document.createElement('script');
      for (const attribute of script.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.textContent = script.textContent;
      script.replaceWith(replacement);
    });
  };

  const presentationUrl = (id) => {
    const path = presentationPattern.replace('__demo__', encodeURIComponent(id));
    const url = new URL(path, window.location.origin);
    const current = new URLSearchParams(window.location.search);
    current.delete('view');
    for (const [name, value] of current) url.searchParams.append(name, value);
    return url;
  };

  const renderState = (message, role = 'status', error = false) => {
    const state = document.createElement('p');
    state.className = 'demo-panel-state' + (error ? ' error' : '');
    state.setAttribute('role', role);
    state.textContent = message;
    panel.replaceChildren(state);
  };

  const deactivate = () => {
    if (!activeId) return;
    const controller = pending.get(activeId);
    if (controller) controller.abort();
    pending.delete(activeId);
    const section = panel.querySelector('[data-demo-section]');
    if (section) section.dispatchEvent(new CustomEvent('demo:deactivate'));
    panel.replaceChildren();
    delete workbench.dataset.demoMounted;
  };

  const syncNavigation = (demo) => {
    navigationLinks.forEach((link) => {
      if (link.dataset.demoLink === demo.id) link.setAttribute('aria-current', 'location');
      else if (!link.dataset.demoCategory || link.dataset.demoCategory !== demo.category) link.removeAttribute('aria-current');
    });
    categoryTabs.forEach((tab) => {
      if (tab.dataset.demoCategory === demo.category) tab.setAttribute('aria-current', 'location');
      else tab.removeAttribute('aria-current');
    });
    let hasLocalSelector = false;
    localSelectors.forEach((selector) => {
      const active = selector.dataset.demoSelectorCategory === demo.category;
      selector.hidden = !active;
      if (active) hasLocalSelector = true;
    });
    if (selectorSlot instanceof HTMLElement) selectorSlot.hidden = !hasLocalSelector;
    workbench.dataset.demoId = demo.id;
    workbench.setAttribute('aria-label', demo.label + ' demonstration');
  };

  const cachePresentation = (id, html) => {
    if (htmlCache.size >= demos.length && !htmlCache.has(id)) {
      const oldest = htmlCache.keys().next().value;
      if (oldest) htmlCache.delete(oldest);
    }
    htmlCache.set(id, html);
  };

  const mount = async (id) => {
    activeId = id;
    const controller = new AbortController();
    pending.set(id, controller);
    renderState('Loading demonstration…');
    try {
      let html = htmlCache.get(id);
      if (!html) {
        const response = await fetch(presentationUrl(id), {
          headers: { accept: 'text/html' },
          credentials: 'same-origin',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('The demonstration could not be loaded.');
        html = await response.text();
        cachePresentation(id, html);
      }
      if (activeId !== id || controller.signal.aborted) return;
      panel.innerHTML = html;
      workbench.dataset.demoMounted = 'true';
      runScripts(panel);
    } catch (error) {
      if (controller.signal.aborted || activeId !== id) return;
      renderState(error instanceof Error ? error.message : 'The demonstration could not be loaded.', 'alert', true);
      activeId = '';
    } finally {
      if (pending.get(id) === controller) pending.delete(id);
    }
  };

  const applySelection = (focusWorkbench = false) => {
    const id = selectedId();
    const demo = byId.get(id) ?? byId.get(defaultDemoId);
    if (!demo) return;
    syncNavigation(demo);
    if (id !== activeId) {
      deactivate();
      void mount(id);
    }
    if (focusWorkbench) window.requestAnimationFrame(() => workbench.focus({ preventScroll: true }));
  };

  const navigate = (event) => {
    const link = event.currentTarget;
    const id = link.dataset.demoLink;
    if (!id || !byId.has(id)) return;
    event.preventDefault();
    const nextHash = '#' + encodeURIComponent(id);
    if (window.location.hash !== nextHash) history.pushState(null, '', nextHash);
    applySelection(true);
  };

  navigationLinks.forEach((link) => link.addEventListener('click', navigate));
  window.addEventListener('hashchange', () => applySelection(true));
  window.addEventListener('popstate', () => applySelection(true));
  applySelection(false);
})();
</script>`;
}

export async function demosContent(request: Request, env: Env): Promise<PageContent> {
  const canonicalPath = routeUrl(ROUTE_ID);
  const body = `<section class="page-header">
    <h1>Architecture Demos</h1>
    <p class="lede">Choose a capability, run one focused demonstration, and switch without loading the rest of the catalog.</p>
  </section>
  <section class="demo-workbench-nav" aria-label="Architecture demo navigation">
    ${categoryTabs()}
    ${localSelectors()}
  </section>
  <section id="demo-workbench" class="demo-workbench" data-demo-workbench data-demo-id="${DEFAULT_DEMO_ID}" aria-label="D1 demonstration" tabindex="-1">
    <div class="demo-panel" data-demo-panel><p class="demo-panel-state" role="status">Loading demonstration…</p></div>
  </section>
  ${workbenchScript()}`;

  return pageContent(env, 'Architecture Demos', body, {
    routeId: ROUTE_ID,
    canonicalPath,
    description: 'Focused executable architecture demonstrations for data, APIs, integrations, identity, AI, platform runtime, and quality.',
    headExtra: pageStyles,
  });
}

export async function demoPresentationResponse(request: Request, env: Env, demoId: string): Promise<Response> {
  const demo = demonstrations.find((candidate) => candidate.id === demoId);
  const headers = withSecurityHeaders(new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'private, no-store',
  }));
  if (!demo) return new Response('<p role="alert">Unknown demonstration.</p>', { status: 404, headers });

  const localizedEnv = bindLocalization(env, resolveLocalization(request));
  const canonicalPath = routeUrl(ROUTE_ID);
  const section = await demo.render(request, localizedEnv, {
    scope: demo.id,
    idPrefix: demo.id,
    headingLevel: 2,
    canonicalPath,
    presentationPath: demoHref(demo.id),
  });
  return new Response(section.body, { headers });
}
