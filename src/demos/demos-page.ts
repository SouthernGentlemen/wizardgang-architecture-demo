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

type DemoTier = 'primary' | 'secondary';

interface ArchitectureDemo {
  id: string;
  label: string;
  group: string;
  tier: DemoTier;
  summary: string;
  render: (request: Request, env: Env, options: DemoSectionOptions) => DemoSection | Promise<DemoSection>;
}

export const demonstrations: readonly ArchitectureDemo[] = [
  { id: 'd1', label: 'D1', group: 'Data', tier: 'primary', summary: 'Run relational CRUD against resettable shared demo state.', render: (_request, env, options) => d1Section(env, options) },
  { id: 'r2', label: 'R2', group: 'Data', tier: 'primary', summary: 'Upload, inspect, and remove bounded objects in live storage.', render: (_request, env, options) => r2Section(env, options) },
  { id: 'rest', label: 'REST / OpenAPI', group: 'APIs', tier: 'primary', summary: 'Run the focused REST contract and inspect its OpenAPI description.', render: (_request, env, options) => restSection(env, options) },
  { id: 'graphql', label: 'GraphQL', group: 'APIs', tier: 'primary', summary: 'Execute GraphQL operations against the live protocol endpoint.', render: (_request, env, options) => graphqlSection(env, options) },
  { id: 'webhooks', label: 'Webhooks', group: 'Integrations', tier: 'primary', summary: 'Generate and inspect signed synthetic webhook delivery behavior.', render: (_request, env, options) => webhooksSection(env, options) },
  { id: 'identity', label: 'Identity', group: 'Identity', tier: 'primary', summary: 'Inspect the OAuth, OIDC, SAML, session, and authorization behavior available here.', render: (_request, env, options) => identitySection(env, options) },
  { id: 'mcp', label: 'MCP', group: 'AI / MCP', tier: 'primary', summary: 'Inspect the endpoint, available tools, and one executable read-only MCP call.', render: (request, env, options) => mcpSection(request, env, options) },
  { id: 'edge', label: 'Edge', group: 'Runtime architecture', tier: 'secondary', summary: 'Inspect the public DNS, TLS, CDN, routing, and request boundary.', render: (_request, env, options) => edgeSection(env, options) },
  { id: 'workers', label: 'Workers', group: 'Runtime architecture', tier: 'secondary', summary: 'Exercise stateless edge compute and request policy behavior.', render: (_request, env, options) => workersSection(env, options) },
  { id: 'durable-objects', label: 'Durable Objects', group: 'Runtime architecture', tier: 'secondary', summary: 'Coordinate stateful requests against one shared object.', render: (_request, env, options) => durableObjectsSection(env, options) },
  { id: 'accessibility', label: 'Accessibility', group: 'Quality', tier: 'secondary', summary: 'Operate accessible behavior and inspect bounded failure analysis.', render: (request, env, options) => accessibilitySection(request, env, options) },
  { id: 'i18n', label: 'Internationalization', group: 'Quality', tier: 'secondary', summary: 'Exercise locale, formatting, pluralization, and RTL behavior.', render: (request, env, options) => i18nSection(request, env, options) },
] as const;

function demoHref(id: string): string {
  return `${routeUrl(ROUTE_ID)}#${id}`;
}

const pageStyles = `<style>
.demo-tier{margin:1rem 0 1.5rem}.demo-tier-heading{display:flex;align-items:end;justify-content:space-between;gap:1rem;margin-bottom:.65rem}.demo-tier-heading h2{margin:0}.demo-tier-heading span{color:var(--muted);font-size:.9rem}.demo-selector{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.demo-selector-group{display:grid;align-content:start;gap:.5rem}.demo-selector-group>strong{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.demo-selector-links{display:flex;flex-wrap:wrap;gap:.5rem}.demo-selector a{display:inline-flex;align-items:center;min-height:2.5rem;padding:.4rem .7rem;border:1px solid var(--line);border-radius:999px;text-decoration:none}.demo-selector a[aria-current="location"]{border-color:var(--acid);background:var(--panel-2);color:var(--paper)}.demo-secondary{padding-top:.25rem;border-top:1px solid var(--line)}.demo-list{display:grid;gap:.75rem}.demo-list-heading{margin:1.75rem 0 .75rem}.demo-disclosure{border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}.demo-disclosure>summary{cursor:pointer;display:grid;gap:.2rem;padding:1rem;list-style-position:inside}.demo-disclosure>summary strong{font-size:1.05rem}.demo-disclosure>summary span:last-child{color:var(--muted)}.demo-disclosure[open]>summary{border-bottom:1px solid var(--line)}.demo-panel{padding:1rem}.demo-panel-state{margin:0;color:var(--muted)}.demo-disclosure:target{scroll-margin-top:1rem}@media(max-width:760px){.demo-selector{grid-template-columns:1fr}.demo-tier-heading{align-items:start;flex-direction:column}}
</style>`;

function fragmentScript(): string {
  const ids = JSON.stringify(demonstrations.map((demo) => demo.id));
  const presentationRoot = JSON.stringify(routeUrl(PRESENTATION_ROUTE_ID, { demo: '__demo__' }));
  return `<script>
(() => {
  const demoIds = new Set(${ids});
  const presentationPattern = ${presentationRoot};
  const htmlCache = new Map();
  const pending = new Map();
  const links = [...document.querySelectorAll('[data-demo-link]')];
  const details = [...document.querySelectorAll('[data-architecture-demo]')];
  const selectedId = () => {
    let id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return ''; }
    return demoIds.has(id) ? id : '';
  };
  const syncSelection = () => {
    const selected = selectedId();
    links.forEach((link) => {
      if (link.dataset.demoLink === selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
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
  const mount = async (target) => {
    const id = target.id;
    const panel = target.querySelector('[data-demo-panel]');
    if (!panel || target.dataset.demoMounted === 'true' || pending.has(id)) return;
    const controller = new AbortController();
    pending.set(id, controller);
    panel.innerHTML = '<p class="demo-panel-state" role="status">Loading demonstration…</p>';
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
        htmlCache.set(id, html);
      }
      if (!target.open || controller.signal.aborted) return;
      panel.innerHTML = html;
      target.dataset.demoMounted = 'true';
      runScripts(panel);
    } catch (error) {
      if (controller.signal.aborted) return;
      panel.innerHTML = '<p class="demo-panel-state error" role="alert">' + String(error) + '</p>';
    } finally {
      if (pending.get(id) === controller) pending.delete(id);
    }
  };
  const unmount = (target) => {
    const controller = pending.get(target.id);
    if (controller) controller.abort();
    pending.delete(target.id);
    const section = target.querySelector('[data-demo-section]');
    if (section) section.dispatchEvent(new CustomEvent('demo:deactivate'));
    const panel = target.querySelector('[data-demo-panel]');
    if (panel) panel.innerHTML = '<p class="demo-panel-state">Open this demonstration to initialize it.</p>';
    delete target.dataset.demoMounted;
  };
  details.forEach((target) => target.addEventListener('toggle', () => {
    syncSelection();
    if (target.open) void mount(target);
    else unmount(target);
  }));
  const revealHashDemo = () => {
    const id = selectedId();
    syncSelection();
    if (!id) return;
    const target = document.getElementById(id);
    if (!(target instanceof HTMLDetailsElement)) return;
    target.open = true;
    const summary = target.querySelector('summary');
    window.requestAnimationFrame(() => {
      if (summary instanceof HTMLElement) summary.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    });
  };
  window.addEventListener('hashchange', revealHashDemo);
  syncSelection();
  revealHashDemo();
})();
</script>`;
}

function selectorFor(tier: DemoTier, label: string): string {
  const tierDemos = demonstrations.filter((demo) => demo.tier === tier);
  const groups = [...new Set(tierDemos.map((demo) => demo.group))];
  return `<section class="demo-tier${tier === 'secondary' ? ' demo-secondary' : ''}" aria-labelledby="demo-${tier}-heading">
    <div class="demo-tier-heading"><h2 id="demo-${tier}-heading">${escapeHtml(label)}</h2><span>${tier === 'primary' ? 'Start here' : 'Supporting architecture and quality evidence'}</span></div>
    <nav class="demo-selector" aria-label="${escapeHtml(label)}">${groups.map((group, index) => `<section class="demo-selector-group" aria-labelledby="demo-${tier}-group-${index}"><strong id="demo-${tier}-group-${index}">${escapeHtml(group)}</strong><div class="demo-selector-links">${tierDemos.filter((demo) => demo.group === group).map((demo) => `<a href="#${escapeHtml(demo.id)}" data-demo-link="${escapeHtml(demo.id)}">${escapeHtml(demo.label)}</a>`).join('')}</div></section>`).join('')}</nav>
  </section>`;
}

function disclosuresFor(tier: DemoTier): string {
  return demonstrations.filter((demo) => demo.tier === tier).map((demo) => `<details class="demo-disclosure" id="${escapeHtml(demo.id)}" name="architecture-demo" data-architecture-demo>
    <summary><span class="eyebrow">${escapeHtml(demo.group)}</span><strong>${escapeHtml(demo.label)}</strong><span>${escapeHtml(demo.summary)}</span></summary>
    <div class="demo-panel" data-demo-panel><p class="demo-panel-state">Open this demonstration to initialize it.</p></div>
  </details>`).join('');
}

export async function demosContent(request: Request, env: Env): Promise<PageContent> {
  const canonicalPath = routeUrl(ROUTE_ID);
  const body = `<section class="page-header">
    <h1>Architecture Demos</h1>
    <p class="lede">Start with the primary capabilities below. Open one demonstration to run or inspect it; deeper implementation detail stays optional.</p>
  </section>
  ${selectorFor('primary', 'Primary capabilities')}
  ${selectorFor('secondary', 'Supporting proof')}
  <section aria-label="Architecture demonstrations">
    <h2 class="demo-list-heading">Primary demonstrations</h2>
    <div class="demo-list">${disclosuresFor('primary')}</div>
    <h2 class="demo-list-heading">Supporting proof</h2>
    <div class="demo-list">${disclosuresFor('secondary')}</div>
  </section>
  ${fragmentScript()}`;

  return pageContent(env, 'Architecture Demos', body, {
    routeId: ROUTE_ID,
    canonicalPath,
    description: 'Curated executable architecture demonstrations for data, APIs, integrations, identity, MCP, runtime architecture, and quality.',
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
