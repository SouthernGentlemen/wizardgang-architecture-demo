import { mountDemoPresentation } from './demo-presentation';

type InspectorMode = 'Guide' | 'Request' | 'Evidence';

interface DemoRequestField {
  label: string;
  selector: string;
  empty: string;
}

interface DemoMetadata {
  id: string;
  category: string;
  categoryLabel: string;
  group: string;
  label: string;
  summary: string;
  tryThis: string;
  guide: string[];
  status: string[];
  sourcePath: string;
  sourceUrl: string;
  inspectorLabel: string;
  request: { intro: string; fields: DemoRequestField[] } | null;
}

interface DemosBrowserConfig {
  demos: DemoMetadata[];
  defaultDemoId: string;
  presentationPattern: string;
}

interface DemosBrowserMessages {
  modes: Record<InspectorMode, string>;
  loading: string;
  failed: string;
  retry: string;
  stableFragment: string;
  implementation: string;
}

function parseData<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function parseServerFragment(markup: string): DocumentFragment {
  const parsed = new DOMParser().parseFromString(markup, 'text/html');
  const fragment = document.createDocumentFragment();
  for (const child of [...parsed.body.childNodes]) fragment.append(document.importNode(child, true));
  return fragment;
}

function initializeDemosWorkbench(): void {
  const script = document.querySelector<HTMLScriptElement>('script[data-demos-browser]');
  const config = parseData<DemosBrowserConfig>(script?.dataset.config);
  const messages = parseData<DemosBrowserMessages>(script?.dataset.messages);
  if (!config || !messages) return;

  const byId = new Map(config.demos.map((demo) => [demo.id, demo]));
  const htmlCache = new Map<string, string>();
  const pending = new Map<string, AbortController>();
  const navigationLinks = [...document.querySelectorAll<HTMLElement>('[data-demo-link]')];
  const categoryTabs = [...document.querySelectorAll<HTMLElement>('[data-demo-category]')];
  const localSelectors = [...document.querySelectorAll<HTMLElement>('[data-demo-selector-category]')];
  const selectorSlot = document.querySelector<HTMLElement>('[data-demo-selector-slot]');
  const workbench = document.querySelector<HTMLElement>('[data-demo-workbench]');
  const panel = document.querySelector<HTMLElement>('[data-demo-panel]');
  const context = document.querySelector<HTMLElement>('[data-demo-active-context]');
  const title = document.querySelector<HTMLElement>('[data-demo-active-title]');
  const purpose = document.querySelector<HTMLElement>('[data-demo-purpose]');
  const tryThis = document.querySelector<HTMLElement>('[data-demo-try]');
  const statuses = document.querySelector<HTMLElement>('[data-demo-statuses]');
  const inspector = document.querySelector<HTMLElement>('[data-demo-inspector]');
  const inspectorContext = document.querySelector<HTMLElement>('[data-demo-inspector-context]');
  const inspectorTabs = document.querySelector<HTMLElement>('[data-demo-inspector-tabs]');
  const inspectorPanel = document.querySelector<HTMLElement>('[data-demo-inspector-panel]');
  const resetControl = document.querySelector<HTMLButtonElement>('[data-demo-reset]');
  const sourceControl = document.querySelector<HTMLAnchorElement>('[data-demo-source]');
  let activeId = '';
  let inspectorMode: InspectorMode = 'Guide';
  let requestObserver: MutationObserver | null = null;

  if (!workbench || !panel || !inspector || !inspectorTabs || !inspectorPanel) return;

  const selectedId = () => {
    let id = '';
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return config.defaultDemoId;
    }
    return byId.has(id) ? id : config.defaultDemoId;
  };

  const presentationUrl = (id: string) => {
    const path = config.presentationPattern.replace('__demo__', encodeURIComponent(id));
    const url = new URL(path, window.location.origin);
    const current = new URLSearchParams(window.location.search);
    current.delete('view');
    for (const [name, value] of current) url.searchParams.append(name, value);
    return url;
  };

  const modesFor = (demo: DemoMetadata): InspectorMode[] => demo.request
    ? ['Guide', 'Request', 'Evidence']
    : ['Guide', 'Evidence'];

  const appendText = <K extends keyof HTMLElementTagNameMap>(
    parent: Element,
    tagName: K,
    text: string,
    className = '',
  ): HTMLElementTagNameMap[K] => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  };

  const requestValue = (field: DemoRequestField) => {
    const target = panel.querySelector(field.selector);
    const value = target?.textContent?.trim() ?? '';
    return value || field.empty;
  };

  const renderInspectorPanel = (demo: DemoMetadata) => {
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
    appendText(fragment, 'strong', messages.stableFragment);
    appendText(fragment, 'code', `#${demo.id}`);
    list.append(fragment);
    const source = document.createElement('li');
    appendText(source, 'strong', messages.implementation);
    const link = document.createElement('a');
    link.href = demo.sourceUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = demo.sourcePath;
    source.append(link);
    list.append(source);
    inspectorPanel.append(list);
  };

  const selectInspectorMode = (demo: DemoMetadata, mode: InspectorMode, focus = false) => {
    const modes = modesFor(demo);
    inspectorMode = modes.includes(mode) ? mode : modes[0];
    inspectorTabs.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => {
      const selected = tab.dataset.demoInspectorMode === inspectorMode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) inspectorPanel.setAttribute('aria-labelledby', tab.id);
      if (selected && focus) tab.focus();
    });
    renderInspectorPanel(demo);
  };

  const bindInspectorTabs = (demo: DemoMetadata) => {
    inspectorTabs.replaceChildren();
    const modes = modesFor(demo);
    if (!modes.includes(inspectorMode)) inspectorMode = modes[0];
    modes.forEach((mode) => {
      const button = document.createElement('button');
      button.className = 'demo-inspector-tab';
      button.type = 'button';
      button.id = `demo-inspector-tab-${mode.toLowerCase()}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', 'demo-inspector-panel');
      button.setAttribute('aria-selected', String(mode === inspectorMode));
      button.tabIndex = mode === inspectorMode ? 0 : -1;
      button.dataset.demoInspectorMode = mode;
      button.textContent = messages.modes[mode];
      button.addEventListener('click', () => selectInspectorMode(demo, mode));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = modes.indexOf(button.dataset.demoInspectorMode as InspectorMode);
        const forward = document.documentElement.dir === 'rtl' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
        const next = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? modes.length - 1
            : forward
              ? (current + 1) % modes.length
              : (current - 1 + modes.length) % modes.length;
        selectInspectorMode(demo, modes[next], true);
      });
      inspectorTabs.append(button);
    });
    renderInspectorPanel(demo);
  };

  const observeRequestEvidence = (demo: DemoMetadata) => {
    requestObserver?.disconnect();
    requestObserver = null;
    if (!demo.request) return;
    requestObserver = new MutationObserver(() => {
      if (inspectorMode === 'Request' && activeId === demo.id) renderInspectorPanel(demo);
    });
    requestObserver.observe(panel, { subtree: true, childList: true, characterData: true });
  };

  const syncTools = (demo: DemoMetadata) => {
    if (resetControl) resetControl.hidden = !panel.querySelector('[data-reset]');
    if (sourceControl) sourceControl.href = demo.sourceUrl;
  };

  const renderState = (message: string, role = 'status', error = false, retryId = '') => {
    const state = document.createElement('div');
    state.className = `demo-panel-state${error ? ' error' : ''}`;
    state.setAttribute('role', role);
    appendText(state, 'span', message);
    if (error && retryId) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = messages.retry;
      retry.addEventListener('click', () => void mount(retryId));
      state.append(retry);
    }
    panel.replaceChildren(state);
    panel.setAttribute('aria-busy', String(!error));
    if (resetControl) resetControl.hidden = true;
  };

  const deactivate = () => {
    requestObserver?.disconnect();
    requestObserver = null;
    if (!activeId) return;
    pending.get(activeId)?.abort();
    pending.delete(activeId);
    panel.querySelector('[data-demo-section]')?.dispatchEvent(new CustomEvent('demo:deactivate'));
    panel.replaceChildren();
    delete workbench.dataset.demoMounted;
  };

  const syncNavigation = (demo: DemoMetadata) => {
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
    if (selectorSlot) selectorSlot.hidden = !hasLocalSelector;
    workbench.dataset.demoId = demo.id;
    if (context) context.textContent = `${demo.categoryLabel} / ${demo.group}`;
    if (title) title.textContent = demo.label;
    if (purpose) purpose.textContent = demo.summary;
    if (tryThis) tryThis.textContent = demo.tryThis;
    if (statuses) {
      statuses.replaceChildren();
      demo.status.forEach((status) => appendText(statuses, 'span', status, 'demo-status-chip'));
      statuses.hidden = demo.status.length === 0;
    }
    inspector.setAttribute('aria-label', demo.inspectorLabel);
    if (inspectorContext) inspectorContext.textContent = demo.categoryLabel;
    if (sourceControl) sourceControl.href = demo.sourceUrl;
    bindInspectorTabs(demo);
  };

  const cachePresentation = (id: string, html: string) => {
    if (htmlCache.size >= config.demos.length && !htmlCache.has(id)) {
      const oldest = htmlCache.keys().next().value;
      if (oldest) htmlCache.delete(oldest);
    }
    htmlCache.set(id, html);
  };

  const mount = async (id: string) => {
    const demo = byId.get(id);
    if (!demo) return;
    activeId = id;
    const controller = new AbortController();
    pending.set(id, controller);
    renderState(messages.loading.replace('{label}', demo.label));
    try {
      let html = htmlCache.get(id);
      if (!html) {
        const response = await fetch(presentationUrl(id), {
          headers: { accept: 'text/html' },
          credentials: 'same-origin',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(messages.failed);
        html = await response.text();
        cachePresentation(id, html);
      }
      if (activeId !== id || controller.signal.aborted) return;
      panel.replaceChildren(parseServerFragment(html));
      const root = panel.querySelector<HTMLElement>('[data-demo-section]');
      if (!root) throw new Error(messages.failed);
      await mountDemoPresentation(root);
      if (activeId !== id || controller.signal.aborted) return;
      panel.setAttribute('aria-busy', 'false');
      workbench.dataset.demoMounted = 'true';
      syncTools(demo);
      observeRequestEvidence(demo);
      if (inspectorMode === 'Request') renderInspectorPanel(demo);
    } catch (error) {
      if (controller.signal.aborted || activeId !== id) return;
      renderState(error instanceof Error ? error.message : messages.failed, 'alert', true, id);
      activeId = '';
    } finally {
      if (pending.get(id) === controller) pending.delete(id);
    }
  };

  const applySelection = () => {
    const id = selectedId();
    const demo = byId.get(id) ?? byId.get(config.defaultDemoId);
    if (!demo) return;
    syncNavigation(demo);
    if (id !== activeId) {
      deactivate();
      void mount(id);
    }
  };

  const navigate = (event: Event) => {
    const link = event.currentTarget as HTMLElement;
    const id = link.dataset.demoLink;
    if (!id || !byId.has(id)) return;
    event.preventDefault();
    const nextHash = `#${encodeURIComponent(id)}`;
    if (window.location.hash !== nextHash) history.pushState(null, '', nextHash);
    applySelection();
  };

  const activateCategoryFromKeyboard = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const current = categoryTabs.indexOf(event.currentTarget as HTMLElement);
    if (current < 0) return;
    event.preventDefault();
    const forward = document.documentElement.dir === 'rtl' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? categoryTabs.length - 1
        : forward
          ? (current + 1) % categoryTabs.length
          : (current - 1 + categoryTabs.length) % categoryTabs.length;
    const tab = categoryTabs[next];
    if (tab instanceof HTMLAnchorElement) {
      tab.focus();
      tab.click();
    }
  };

  resetControl?.addEventListener('click', () => {
    const target = panel.querySelector<HTMLButtonElement>('[data-reset]');
    target?.click();
  });
  navigationLinks.forEach((link) => link.addEventListener('click', navigate));
  categoryTabs.forEach((tab) => tab.addEventListener('keydown', activateCategoryFromKeyboard));
  window.addEventListener('hashchange', applySelection);
  window.addEventListener('popstate', applySelection);
  applySelection();
}

initializeDemosWorkbench();
