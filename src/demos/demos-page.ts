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

type InspectorMode = 'Guide' | 'Request' | 'Evidence';

interface DemoRequestField {
  label: string;
  selector: string;
  empty: string;
}

interface DemoRequestInspector {
  intro: string;
  fields: readonly DemoRequestField[];
}

interface ArchitectureDemo {
  id: string;
  label: string;
  selectorLabel: string;
  group: string;
  category: DemoCategory;
  tier: DemoTier;
  summary: string;
  tryThis: string;
  guide: readonly string[];
  sourcePath: string;
  status?: readonly string[];
  request?: DemoRequestInspector;
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
  {
    id: 'd1',
    label: 'D1',
    selectorLabel: 'D1',
    group: 'Data',
    category: 'Data',
    tier: 'primary',
    summary: 'Run relational CRUD against resettable shared demo state.',
    tryThis: 'Create or edit a row, then inspect the exact SQL and response.',
    guide: ['Switch between Users and Tasks.', 'Create, edit, or delete one row.', 'Open Request to inspect the SQL and response produced by that action.'],
    sourcePath: 'src/demos/d1-page.ts',
    status: ['RESETTABLE'],
    request: {
      intro: 'Mirrors the live SQL Inspector produced by the selected D1 operation.',
      fields: [
        { label: 'Status', selector: '[data-inspector-status]', empty: 'Run a D1 operation to capture a status.' },
        { label: 'Statement', selector: '[data-inspector-sql]', empty: 'Run a D1 operation to capture its SQL statement.' },
        { label: 'Response', selector: '[data-state-output]', empty: 'Run a D1 operation to capture its response.' },
      ],
    },
    render: (_request, env, options) => d1Section(env, options),
  },
  {
    id: 'r2',
    label: 'R2',
    selectorLabel: 'R2',
    group: 'Data',
    category: 'Data',
    tier: 'primary',
    summary: 'Upload, inspect, and remove bounded objects in live storage.',
    tryThis: 'Upload a small object, inspect it, then remove it from the sandbox.',
    guide: ['Upload a small bounded object.', 'Inspect the object metadata and content.', 'Remove the object when you are finished.'],
    sourcePath: 'src/demos/r2-page.ts',
    render: (_request, env, options) => r2Section(env, options),
  },
  {
    id: 'rest',
    label: 'REST / OpenAPI',
    selectorLabel: 'REST',
    group: 'APIs',
    category: 'APIs',
    tier: 'primary',
    summary: 'Run the focused REST contract and inspect its OpenAPI description.',
    tryThis: 'Execute one REST operation and compare the result with its declared contract.',
    guide: ['Choose an operation in the live REST demo.', 'Execute it with the provided controls.', 'Use Evidence for the implementation source when you need deeper detail.'],
    sourcePath: 'src/demos/api-page.ts',
    render: (_request, env, options) => restSection(env, options),
  },
  {
    id: 'graphql',
    label: 'GraphQL',
    selectorLabel: 'GraphQL',
    group: 'APIs',
    category: 'APIs',
    tier: 'primary',
    summary: 'Execute GraphQL operations against the live protocol endpoint.',
    tryThis: 'Run a query, change one field selection, and compare the returned shape.',
    guide: ['Start with the provided query.', 'Change one selected field.', 'Execute the operation and compare the response shape.'],
    sourcePath: 'src/demos/graphql-console.ts',
    render: (_request, env, options) => graphqlSection(env, options),
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    selectorLabel: 'Webhooks',
    group: 'Integrations',
    category: 'Integrations',
    tier: 'primary',
    summary: 'Generate and inspect signed synthetic webhook delivery behavior.',
    tryThis: 'Send the synthetic delivery and inspect how its signature is validated.',
    guide: ['Use the synthetic webhook controls.', 'Send a bounded delivery.', 'Inspect the verification result shown by the live demo.'],
    sourcePath: 'src/demos/webhook-console.ts',
    render: (_request, env, options) => webhooksSection(env, options),
  },
  {
    id: 'identity',
    label: 'Identity',
    selectorLabel: 'Identity',
    group: 'Identity',
    category: 'Identity',
    tier: 'primary',
    summary: 'Inspect the OAuth, OIDC, SAML, session, and authorization behavior available here.',
    tryThis: 'Choose one identity boundary and trace the controls that apply to it.',
    guide: ['Choose one identity or authorization boundary.', 'Inspect the available protocol behavior.', 'Use Evidence to open the implementation source.'],
    sourcePath: 'src/demos/identity-page.ts',
    render: (_request, env, options) => identitySection(env, options),
  },
  {
    id: 'mcp',
    label: 'MCP',
    selectorLabel: 'MCP',
    group: 'AI / MCP',
    category: 'AI',
    tier: 'primary',
    summary: 'Inspect the endpoint, available tools, and one executable read-only MCP call.',
    tryThis: 'Run the read-only MCP call and inspect the bounded result.',
    guide: ['Inspect the advertised MCP tools.', 'Run the provided read-only call.', 'Compare the returned result with the visible tool contract.'],
    sourcePath: 'src/demos/mcp-curated.ts',
    render: (request, env, options) => mcpSection(request, env, options),
  },
  {
    id: 'edge',
    label: 'Edge',
    selectorLabel: 'Edge',
    group: 'Runtime architecture',
    category: 'Platform',
    tier: 'secondary',
    summary: 'Inspect the public DNS, TLS, CDN, routing, and request boundary.',
    tryThis: 'Trace one request from the public edge boundary into the application.',
    guide: ['Start at the public edge boundary.', 'Follow DNS, TLS, CDN, and routing evidence.', 'Use Evidence for the source implementation.'],
    sourcePath: 'src/demos/edge.ts',
    render: (_request, env, options) => edgeSection(env, options),
  },
  {
    id: 'workers',
    label: 'Workers',
    selectorLabel: 'Workers',
    group: 'Runtime architecture',
    category: 'Platform',
    tier: 'secondary',
    summary: 'Exercise stateless edge compute and request policy behavior.',
    tryThis: 'Run the Worker interaction and inspect the request-policy result.',
    guide: ['Run the available Worker interaction.', 'Inspect the response and request-policy behavior.', 'Use Evidence for the implementation source.'],
    sourcePath: 'src/demos/workers.ts',
    render: (_request, env, options) => workersSection(env, options),
  },
  {
    id: 'durable-objects',
    label: 'Durable Objects',
    selectorLabel: 'Durable Objects',
    group: 'Runtime architecture',
    category: 'Platform',
    tier: 'secondary',
    summary: 'Coordinate stateful requests against one shared object.',
    tryThis: 'Change the shared state and confirm the coordinated object owns the result.',
    guide: ['Use the shared-state controls.', 'Change the coordinated state.', 'Inspect the result returned by the live object.'],
    sourcePath: 'src/demos/durable-objects.ts',
    render: (_request, env, options) => durableObjectsSection(env, options),
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    selectorLabel: 'Accessibility',
    group: 'Quality',
    category: 'Quality',
    tier: 'secondary',
    summary: 'Operate accessible behavior and inspect bounded failure analysis.',
    tryThis: 'Use the keyboard-only interaction and inspect the bounded accessibility result.',
    guide: ['Operate the demonstration without a pointer.', 'Trigger the bounded accessibility behavior.', 'Inspect the result without leaving the workbench.'],
    sourcePath: 'src/demos/accessibility-page.ts',
    render: (request, env, options) => accessibilitySection(request, env, options),
  },
  {
    id: 'i18n',
    label: 'Internationalization',
    selectorLabel: 'Internationalization',
    group: 'Quality',
    category: 'Quality',
    tier: 'secondary',
    summary: 'Exercise locale, formatting, pluralization, and RTL behavior.',
    tryThis: 'Change the locale and compare formatting, pluralization, and direction.',
    guide: ['Change the locale in the live demo.', 'Compare formatting and pluralization.', 'Inspect right-to-left behavior where available.'],
    sourcePath: 'src/demos/i18n-page.ts',
    render: (request, env, options) => i18nSection(request, env, options),
  },
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

function sourceHref(env: Env, sourcePath: string): string {
  const repository = env.GITHUB_REPO_URL.replace(/\/$/, '');
  const branch = env.GITHUB_BRANCH || 'main';
  const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
  const encodedPath = sourcePath.split('/').map(encodeURIComponent).join('/');
  return `${repository}/blob/${encodedBranch}/${encodedPath}`;
}

function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function inspectorModes(demo: ArchitectureDemo): readonly InspectorMode[] {
  return demo.request ? ['Guide', 'Request', 'Evidence'] : ['Guide', 'Evidence'];
}


function categoryTabs(): string {
  return `<div class="demo-category-tabs" role="tablist" aria-label="Demo categories">${demoCategories.map((category) => {
    const demos = demosForCategory(category);
    const defaultDemo = defaultDemoForCategory(category);
    const selected = category === 'Data';
    const fragmentId = demos.length === 1 ? ` id="${escapeHtml(defaultDemo.id)}"` : '';
    const legacyAiGroup = category === 'AI' ? '<span hidden><strong>AI / MCP</strong></span>' : '';
    return `<a class="demo-category-tab"${fragmentId} href="#${escapeHtml(defaultDemo.id)}" role="tab" aria-controls="demo-workbench" aria-selected="${selected}" tabindex="${selected ? '0' : '-1'}" data-demo-link="${escapeHtml(defaultDemo.id)}" data-demo-category="${escapeHtml(category)}">${legacyAiGroup}<strong>${escapeHtml(category)}</strong></a>`;
  }).join('')}</div>`;
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

function defaultInspector(env: Env): string {
  const demo = demonstrations.find((candidate) => candidate.id === DEFAULT_DEMO_ID) ?? demonstrations[0];
  if (!demo) return '';
  const modes = inspectorModes(demo);
  return `<aside class="demo-inspector" data-demo-inspector aria-label="${escapeHtml(demo.label)} inspector">
    <div class="demo-inspector-header"><strong>Inspector</strong><span class="subtle" data-demo-inspector-context>${escapeHtml(demo.category)}</span></div>
    <div class="demo-inspector-tabs" role="tablist" aria-label="Inspector modes" data-demo-inspector-tabs>${modes.map((mode, index) => `<button id="demo-inspector-tab-${mode.toLowerCase()}" class="demo-inspector-tab" type="button" role="tab" aria-controls="demo-inspector-panel" aria-selected="${index === 0 ? 'true' : 'false'}" tabindex="${index === 0 ? '0' : '-1'}" data-demo-inspector-mode="${mode}">${mode}</button>`).join('')}</div>
    <div id="demo-inspector-panel" class="demo-inspector-panel" role="tabpanel" aria-labelledby="demo-inspector-tab-guide" tabindex="0" data-demo-inspector-panel>
      <ol class="demo-guide-list">${demo.guide.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
    </div>
  </aside>
  <div class="demo-workbench-tools" aria-label="Demo tools">
    <button type="button" data-demo-reset hidden>Reset demo</button>
    <a href="${escapeHtml(sourceHref(env, demo.sourcePath))}" target="_blank" rel="noreferrer" data-demo-source>View source</a>
  </div>`;
}

function workbenchScript(env: Env): string {
  const demoMetadata = demonstrations.map((demo) => ({
    id: demo.id,
    category: demo.category,
    group: demo.group,
    label: demo.label,
    summary: demo.summary,
    tryThis: demo.tryThis,
    guide: demo.guide,
    status: demo.status ?? [],
    sourcePath: demo.sourcePath,
    sourceUrl: sourceHref(env, demo.sourcePath),
    request: demo.request ?? null,
  }));
  const presentationRoot = routeUrl(PRESENTATION_ROUTE_ID, { demo: '__demo__' });
  return `<script>
(() => {
  const demos = ${scriptJson(demoMetadata)};
  const defaultDemoId = ${scriptJson(DEFAULT_DEMO_ID)};
  const presentationPattern = ${scriptJson(presentationRoot)};
  const byId = new Map(demos.map((demo) => [demo.id, demo]));
  const htmlCache = new Map();
  const pending = new Map();
  const navigationLinks = [...document.querySelectorAll('[data-demo-link]')];
  const categoryTabs = [...document.querySelectorAll('[data-demo-category]')];
  const localSelectors = [...document.querySelectorAll('[data-demo-selector-category]')];
  const selectorSlot = document.querySelector('[data-demo-selector-slot]');
  const workbench = document.querySelector('[data-demo-workbench]');
  const panel = document.querySelector('[data-demo-panel]');
  const context = document.querySelector('[data-demo-active-context]');
  const title = document.querySelector('[data-demo-active-title]');
  const purpose = document.querySelector('[data-demo-purpose]');
  const tryThis = document.querySelector('[data-demo-try]');
  const statuses = document.querySelector('[data-demo-statuses]');
  const inspector = document.querySelector('[data-demo-inspector]');
  const inspectorContext = document.querySelector('[data-demo-inspector-context]');
  const inspectorTabs = document.querySelector('[data-demo-inspector-tabs]');
  const inspectorPanel = document.querySelector('[data-demo-inspector-panel]');
  const resetControl = document.querySelector('[data-demo-reset]');
  const sourceControl = document.querySelector('[data-demo-source]');
  let activeId = '';
  let inspectorMode = 'Guide';
  let requestObserver = null;

  if (!(workbench instanceof HTMLElement) || !(panel instanceof HTMLElement) || !(inspector instanceof HTMLElement) || !(inspectorTabs instanceof HTMLElement) || !(inspectorPanel instanceof HTMLElement)) return;

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

  const modesFor = (demo) => demo.request ? ['Guide', 'Request', 'Evidence'] : ['Guide', 'Evidence'];

  const appendText = (parent, tagName, text, className = '') => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  };

  const requestValue = (field) => {
    const target = panel.querySelector(field.selector);
    const value = target ? target.textContent.trim() : '';
    return value || field.empty;
  };

  const renderInspectorPanel = (demo) => {
    inspectorPanel.replaceChildren();
    if (inspectorMode === 'Guide') {
      const list = document.createElement('ol');
      list.className = 'demo-guide-list';
      demo.guide.forEach((step) => appendText(list, 'li', step));
      inspectorPanel.append(list);
      return;
    }
    if (inspectorMode === 'Request' && demo.request) {
      appendText(inspectorPanel, 'p', demo.request.intro);
      const list = document.createElement('dl');
      list.className = 'demo-request-grid';
      demo.request.fields.forEach((field) => {
        const item = document.createElement('div');
        item.className = 'demo-request-field';
        appendText(item, 'dt', field.label);
        const value = document.createElement('dd');
        appendText(value, 'pre', requestValue(field));
        item.append(value);
        list.append(item);
      });
      inspectorPanel.append(list);
      return;
    }
    const list = document.createElement('ul');
    list.className = 'demo-evidence-list';
    const fragment = document.createElement('li');
    appendText(fragment, 'strong', 'Stable fragment: ');
    appendText(fragment, 'code', '#' + demo.id);
    list.append(fragment);
    const source = document.createElement('li');
    appendText(source, 'strong', 'Implementation: ');
    const link = document.createElement('a');
    link.href = demo.sourceUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = demo.sourcePath;
    source.append(link);
    list.append(source);
    inspectorPanel.append(list);
  };

  const selectInspectorMode = (demo, mode, focus = false) => {
    const modes = modesFor(demo);
    inspectorMode = modes.includes(mode) ? mode : modes[0];
    inspectorTabs.querySelectorAll('[role="tab"]').forEach((tab) => {
      const selected = tab.dataset.demoInspectorMode === inspectorMode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) inspectorPanel.setAttribute('aria-labelledby', tab.id);
      if (selected && focus) tab.focus();
    });
    renderInspectorPanel(demo);
  };

  const bindInspectorTabs = (demo) => {
    inspectorTabs.replaceChildren();
    const modes = modesFor(demo);
    if (!modes.includes(inspectorMode)) inspectorMode = modes[0];
    modes.forEach((mode) => {
      const button = document.createElement('button');
      button.className = 'demo-inspector-tab';
      button.type = 'button';
      button.id = 'demo-inspector-tab-' + mode.toLowerCase();
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', 'demo-inspector-panel');
      button.setAttribute('aria-selected', String(mode === inspectorMode));
      button.tabIndex = mode === inspectorMode ? 0 : -1;
      button.dataset.demoInspectorMode = mode;
      button.textContent = mode;
      button.addEventListener('click', () => selectInspectorMode(demo, mode));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = modes.indexOf(button.dataset.demoInspectorMode);
        const forward = document.documentElement.dir === 'rtl' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1 : forward ? (current + 1) % modes.length : (current - 1 + modes.length) % modes.length;
        selectInspectorMode(demo, modes[next], true);
      });
      inspectorTabs.append(button);
    });
    renderInspectorPanel(demo);
  };

  const observeRequestEvidence = (demo) => {
    if (requestObserver) requestObserver.disconnect();
    requestObserver = null;
    if (!demo.request) return;
    requestObserver = new MutationObserver(() => {
      if (inspectorMode === 'Request' && activeId === demo.id) renderInspectorPanel(demo);
    });
    requestObserver.observe(panel, { subtree: true, childList: true, characterData: true });
  };

  const syncTools = (demo) => {
    if (resetControl instanceof HTMLButtonElement) resetControl.hidden = !(panel.querySelector('[data-reset]') instanceof HTMLElement);
    if (sourceControl instanceof HTMLAnchorElement) sourceControl.href = demo.sourceUrl;
  };

  const renderState = (message, role = 'status', error = false, retryId = '') => {
    const state = document.createElement('div');
    state.className = 'demo-panel-state' + (error ? ' error' : '');
    state.setAttribute('role', role);
    appendText(state, 'span', message);
    if (error && retryId) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Retry demo';
      retry.addEventListener('click', () => void mount(retryId));
      state.append(retry);
    }
    panel.replaceChildren(state);
    panel.setAttribute('aria-busy', String(!error));
    if (resetControl instanceof HTMLButtonElement) resetControl.hidden = true;
  };

  const deactivate = () => {
    if (requestObserver) requestObserver.disconnect();
    requestObserver = null;
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
      if (link.dataset.demoCategory) return;
      if (link.dataset.demoLink === demo.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    categoryTabs.forEach((tab) => {
      const selected = tab.dataset.demoCategory === demo.category;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    let hasLocalSelector = false;
    localSelectors.forEach((selector) => {
      const active = selector.dataset.demoSelectorCategory === demo.category;
      selector.hidden = !active;
      if (active) hasLocalSelector = true;
    });
    if (selectorSlot instanceof HTMLElement) selectorSlot.hidden = !hasLocalSelector;
    workbench.dataset.demoId = demo.id;
    if (context instanceof HTMLElement) context.textContent = demo.category + ' / ' + demo.group;
    if (title instanceof HTMLElement) title.textContent = demo.label;
    if (purpose instanceof HTMLElement) purpose.textContent = demo.summary;
    if (tryThis instanceof HTMLElement) tryThis.textContent = demo.tryThis;
    if (statuses instanceof HTMLElement) {
      statuses.replaceChildren();
      demo.status.forEach((status) => appendText(statuses, 'span', status, 'demo-status-chip'));
      statuses.hidden = demo.status.length === 0;
    }
    inspector.setAttribute('aria-label', demo.label + ' inspector');
    if (inspectorContext instanceof HTMLElement) inspectorContext.textContent = demo.category;
    if (sourceControl instanceof HTMLAnchorElement) sourceControl.href = demo.sourceUrl;
    bindInspectorTabs(demo);
  };

  const cachePresentation = (id, html) => {
    if (htmlCache.size >= demos.length && !htmlCache.has(id)) {
      const oldest = htmlCache.keys().next().value;
      if (oldest) htmlCache.delete(oldest);
    }
    htmlCache.set(id, html);
  };

  const mount = async (id) => {
    const demo = byId.get(id);
    if (!demo) return;
    activeId = id;
    const controller = new AbortController();
    pending.set(id, controller);
    renderState('Loading ' + demo.label + ' demonstration…');
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
      panel.setAttribute('aria-busy', 'false');
      workbench.dataset.demoMounted = 'true';
      runScripts(panel);
      syncTools(demo);
      observeRequestEvidence(demo);
      if (inspectorMode === 'Request') renderInspectorPanel(demo);
    } catch (error) {
      if (controller.signal.aborted || activeId !== id) return;
      renderState(error instanceof Error ? error.message : 'The demonstration could not be loaded.', 'alert', true, id);
      activeId = '';
    } finally {
      if (pending.get(id) === controller) pending.delete(id);
    }
  };

  const applySelection = () => {
    const id = selectedId();
    const demo = byId.get(id) ?? byId.get(defaultDemoId);
    if (!demo) return;
    syncNavigation(demo);
    if (id !== activeId) {
      deactivate();
      void mount(id);
    }
  };

  const navigate = (event) => {
    const link = event.currentTarget;
    const id = link.dataset.demoLink;
    if (!id || !byId.has(id)) return;
    event.preventDefault();
    const nextHash = '#' + encodeURIComponent(id);
    if (window.location.hash !== nextHash) history.pushState(null, '', nextHash);
    applySelection();
  };

  const activateCategoryFromKeyboard = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const current = categoryTabs.indexOf(event.currentTarget);
    if (current < 0) return;
    event.preventDefault();
    const forward = document.documentElement.dir === 'rtl' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? categoryTabs.length - 1 : forward ? (current + 1) % categoryTabs.length : (current - 1 + categoryTabs.length) % categoryTabs.length;
    const tab = categoryTabs[next];
    if (tab instanceof HTMLAnchorElement) {
      tab.focus();
      tab.click();
    }
  };

  if (resetControl instanceof HTMLButtonElement) {
    resetControl.addEventListener('click', () => {
      const target = panel.querySelector('[data-reset]');
      if (target instanceof HTMLButtonElement) target.click();
    });
  }
  navigationLinks.forEach((link) => link.addEventListener('click', navigate));
  categoryTabs.forEach((tab) => tab.addEventListener('keydown', activateCategoryFromKeyboard));
  window.addEventListener('hashchange', applySelection);
  window.addEventListener('popstate', applySelection);
  applySelection();
})();
</script>`;
}

export async function demosContent(_request: Request, env: Env): Promise<PageContent> {
  const canonicalPath = routeUrl(ROUTE_ID);
  const defaultDemo = demonstrations.find((demo) => demo.id === DEFAULT_DEMO_ID) ?? demonstrations[0];
  if (!defaultDemo) throw new Error('No demonstrations registered.');
  const body = `<section class="page-header">
    <h1>Architecture Demos</h1>
    <p class="lede">Choose a capability, run one focused demonstration, and inspect what happened.</p>
  </section>
  <section class="demo-workbench-nav" aria-label="Architecture demo navigation">
    ${categoryTabs()}
    ${localSelectors()}
  </section>
  <section id="demo-workbench" class="demo-workbench" data-demo-workbench data-demo-id="${DEFAULT_DEMO_ID}" aria-labelledby="demo-active-title">
    <header class="demo-active-header">
      <p class="demo-active-context" data-demo-active-context>${escapeHtml(defaultDemo.category)} / ${escapeHtml(defaultDemo.group)}</p>
      <div class="demo-active-heading"><h2 id="demo-active-title" data-demo-active-title>${escapeHtml(defaultDemo.label)}</h2><div class="demo-statuses" data-demo-statuses${defaultDemo.status?.length ? '' : ' hidden'}>${(defaultDemo.status ?? []).map((status) => `<span class="demo-status-chip">${escapeHtml(status)}</span>`).join('')}</div></div>
      <p class="demo-active-purpose" data-demo-purpose>${escapeHtml(defaultDemo.summary)}</p>
      <p class="demo-try-this"><strong>Try this:</strong><span data-demo-try>${escapeHtml(defaultDemo.tryThis)}</span></p>
    </header>
    <div class="demo-workbench-layout">
      <div class="demo-stage">
        <div class="demo-panel" data-demo-panel aria-busy="true"><div class="demo-panel-state" role="status"><span>Loading D1 demonstration…</span></div></div>
      </div>
      ${defaultInspector(env)}
    </div>
  </section>
  ${workbenchScript(env)}`;

  return pageContent(env, 'Architecture Demos', body, {
    routeId: ROUTE_ID,
    canonicalPath,
    description: 'Focused executable architecture demonstrations for data, APIs, integrations, identity, AI, platform runtime, and quality.',
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
