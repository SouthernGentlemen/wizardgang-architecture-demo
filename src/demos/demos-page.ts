import { escapeHtml } from '../lib/html';
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

interface ArchitectureDemo {
  id: string;
  label: string;
  group: string;
  summary: string;
  render: (request: Request, env: Env, options: DemoSectionOptions) => DemoSection | Promise<DemoSection>;
}

const demonstrations: readonly ArchitectureDemo[] = [
  { id: 'edge', label: 'Edge', group: 'Cloudflare', summary: 'Inspect the public DNS, TLS, CDN, routing, and request boundary.', render: (_request, env, options) => edgeSection(env, options) },
  { id: 'workers', label: 'Workers', group: 'Cloudflare', summary: 'Exercise stateless edge compute and request policy behavior.', render: (_request, env, options) => workersSection(env, options) },
  { id: 'durable-objects', label: 'Durable Objects', group: 'Cloudflare', summary: 'Coordinate stateful requests against one shared object.', render: (_request, env, options) => durableObjectsSection(env, options) },
  { id: 'd1', label: 'D1', group: 'Cloudflare', summary: 'Explore relational CRUD, parameterized SQL, and resettable state.', render: (_request, env, options) => d1Section(env, options) },
  { id: 'r2', label: 'R2', group: 'Cloudflare', summary: 'Inspect bounded object storage and file lifecycle behavior.', render: (_request, env, options) => r2Section(env, options) },
  { id: 'rest', label: 'REST / OpenAPI', group: 'Interfaces', summary: 'Run the focused anonymous CRUD contract and inspect its OpenAPI description.', render: (_request, env, options) => restSection(env, options) },
  { id: 'graphql', label: 'GraphQL', group: 'Interfaces', summary: 'Execute GraphQL operations against the live protocol endpoint.', render: (_request, env, options) => graphqlSection(env, options) },
  { id: 'webhooks', label: 'Webhooks', group: 'Interfaces', summary: 'Generate and inspect signed synthetic webhook delivery behavior.', render: (_request, env, options) => webhooksSection(env, options) },
  { id: 'identity', label: 'Identity', group: 'Interfaces', summary: 'Inspect OAuth, OIDC, SAML, session, and authorization demonstrations.', render: (_request, env, options) => identitySection(env, options) },
  { id: 'mcp', label: 'MCP', group: 'Interfaces', summary: 'Inspect the Model Context Protocol boundary and authorized tool behavior.', render: (request, env, options) => mcpSection(request, env, options) },
  { id: 'accessibility', label: 'Accessibility', group: 'Experience', summary: 'Compare accessible and intentionally broken teaching states.', render: (request, env, options) => accessibilitySection(request, env, options) },
  { id: 'i18n', label: 'Internationalization', group: 'Experience', summary: 'Exercise locale, formatting, pluralization, and RTL behavior.', render: (request, env, options) => i18nSection(request, env, options) },
] as const;

function demoHref(id: string): string {
  return `${routeUrl(ROUTE_ID)}#${id}`;
}

const pageStyles = `<style>
.demo-selector{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0 1.5rem}.demo-selector a{display:inline-flex;align-items:center;min-height:2.5rem;padding:.4rem .7rem;border:1px solid var(--line);border-radius:999px;text-decoration:none}.demo-list{display:grid;gap:.75rem}.demo-disclosure{border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}.demo-disclosure>summary{cursor:pointer;display:grid;gap:.2rem;padding:1rem;list-style-position:inside}.demo-disclosure>summary strong{font-size:1.05rem}.demo-disclosure>summary span:last-child{color:var(--muted)}.demo-disclosure[open]>summary{border-bottom:1px solid var(--line)}.demo-panel{padding:1rem}.demo-disclosure:target{scroll-margin-top:1rem}
</style>`;

function fragmentScript(): string {
  const ids = JSON.stringify(demonstrations.map((demo) => demo.id));
  return `<script>
(() => {
  const demoIds = new Set(${ids});
  const revealHashDemo = () => {
    let id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!demoIds.has(id)) return;
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
  revealHashDemo();
})();
</script>`;
}

export async function demosContent(request: Request, env: Env): Promise<PageContent> {
  const canonicalPath = routeUrl(ROUTE_ID);
  const sections = await Promise.all(demonstrations.map(async (demo) => ({
    demo,
    section: await demo.render(request, env, {
      scope: demo.id,
      idPrefix: demo.id,
      headingLevel: 2,
      canonicalPath,
      presentationPath: demoHref(demo.id),
    }),
  })));

  const selector = `<nav class="demo-selector" aria-label="Choose an architecture demonstration">${demonstrations.map((demo) => `<a href="#${escapeHtml(demo.id)}">${escapeHtml(demo.label)}</a>`).join('')}</nav>`;
  const disclosures = sections.map(({ demo, section }) => `<details class="demo-disclosure" id="${escapeHtml(demo.id)}" name="architecture-demo" data-architecture-demo>
    <summary><span class="eyebrow">${escapeHtml(demo.group)}</span><strong>${escapeHtml(demo.label)}</strong><span>${escapeHtml(demo.summary)}</span></summary>
    <div class="demo-panel">${section.body}</div>
  </details>`).join('');
  const body = `<section class="page-header">
    <h1>Architecture Demos</h1>
    <p class="lede">Choose one demonstration, inspect the live behavior, and follow the evidence without navigating a technology-shaped page hierarchy.</p>
    ${selector}
  </section>
  <section aria-labelledby="demo-list-heading">
    <div class="section-head"><h2 id="demo-list-heading">Demonstrations</h2><span>${demonstrations.length} stable fragments</span></div>
    <div class="demo-list">${disclosures}</div>
  </section>
  ${fragmentScript()}`;

  return pageContent(env, 'Architecture Demos', body, {
    routeId: ROUTE_ID,
    canonicalPath,
    description: 'Interactive architecture demonstrations consolidated under one task-oriented browser destination.',
    headExtra: pageStyles,
  });
}
