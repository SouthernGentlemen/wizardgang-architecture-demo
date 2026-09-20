type ComplianceStatus = 'pass' | 'partial' | 'gap' | 'not-applicable';

interface RecordSummary {
  id: string;
  framework: string;
  frameworkLabel: string;
  section: string;
  reference: string;
  title: string;
  status: ComplianceStatus;
}

interface AssuranceBrowserConfig {
  records: RecordSummary[];
  statuses: ComplianceStatus[];
  defaultId: string;
  deployedSha: string;
  endpointTemplate: string;
}

interface AssuranceBrowserMessages {
  loading: string;
  loaded: string;
  failed: string;
  statusLabels: Record<ComplianceStatus, string>;
}

function parseData<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function statusGlyph(status: ComplianceStatus): string {
  if (status === 'pass') return '✓';
  if (status === 'partial') return '◐';
  if (status === 'gap') return '!';
  return '—';
}

function createStatusBadge(status: ComplianceStatus, messages: AssuranceBrowserMessages): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = 'assurance-status';
  badge.dataset.status = status;
  const glyph = document.createElement('span');
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = statusGlyph(status);
  badge.append(glyph, messages.statusLabels[status]);
  return badge;
}

function createRecordLink(record: RecordSummary, activeId: string, messages: AssuranceBrowserMessages): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = 'assurance-record-link';
  link.id = record.id;
  link.href = `#${encodeURIComponent(record.id)}`;
  link.dataset.assuranceRecordLink = record.id;
  if (record.id === activeId) link.setAttribute('aria-current', 'true');

  const reference = document.createElement('code');
  reference.lang = 'en';
  reference.textContent = record.reference;
  const title = document.createElement('strong');
  title.lang = 'en';
  title.textContent = record.title;
  link.append(reference, document.createTextNode(' '), title, document.createTextNode(' '), createStatusBadge(record.status, messages));
  return link;
}

function parseServerFragment(markup: string): DocumentFragment {
  const parsed = new DOMParser().parseFromString(markup, 'text/html');
  const fragment = document.createDocumentFragment();
  for (const child of [...parsed.body.childNodes]) fragment.append(document.importNode(child, true));
  return fragment;
}

function cloneFragment(fragment: DocumentFragment): DocumentFragment {
  return fragment.cloneNode(true) as DocumentFragment;
}

function closestElement<T extends Element>(event: Event, selector: string): T | null {
  const target = event.target;
  if (target instanceof Element) return target.closest<T>(selector);
  if (target instanceof Node) return target.parentElement?.closest<T>(selector) ?? null;
  return null;
}

function initializeAssuranceWorkbench(): void {
  const script = document.querySelector<HTMLScriptElement>('script[data-assurance-browser]');
  const config = parseData<AssuranceBrowserConfig>(script?.dataset.config);
  const messages = parseData<AssuranceBrowserMessages>(script?.dataset.messages);
  if (!config || !messages) return;

  const byId = new Map(config.records.map((record) => [record.id, record]));
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-assurance-framework]')];
  const sectionSelect = document.querySelector<HTMLSelectElement>('[data-assurance-section]');
  const grid = document.querySelector<HTMLElement>('[data-assurance-record-grid]');
  const detail = document.querySelector<HTMLElement>('[data-assurance-detail]');
  const status = document.querySelector<HTMLElement>('[data-assurance-status]');
  const recordCount = document.querySelector<HTMLElement>('[data-assurance-record-count]');
  const sectionPosture = document.querySelector<HTMLElement>('[data-assurance-section-posture]');
  const frameworkPosture = document.querySelector<HTMLElement>('[data-assurance-framework-posture]');
  if (!sectionSelect || !grid || !detail || !status || !recordCount || !sectionPosture || !frameworkPosture) return;

  const cache = new Map<string, DocumentFragment>();
  let activeId = config.defaultId;
  let controller: AbortController | null = null;

  const frameworkRecords = (framework: string) => config.records.filter((record) => record.framework === framework);
  const sections = (framework: string) => [...new Set(frameworkRecords(framework).map((record) => record.section))];
  const currentRecord = () => byId.get(activeId) ?? byId.get(config.defaultId) ?? config.records[0];
  const counts = (records: RecordSummary[]) => Object.fromEntries(
    config.statuses.map((value) => [value, records.filter((record) => record.status === value).length]),
  ) as Record<ComplianceStatus, number>;
  const endpoint = (id: string) => {
    const url = new URL(config.endpointTemplate.replace('__record__', encodeURIComponent(id)), window.location.origin);
    const lang = new URL(window.location.href).searchParams.get('lang');
    if (lang) url.searchParams.set('lang', lang);
    if (config.deployedSha) url.searchParams.set('rev', config.deployedSha);
    return `${url.pathname}${url.search}`;
  };
  const announce = (message: string) => { status.textContent = message; };
  const renderState = (message: string, role = 'status') => {
    const state = document.createElement('p');
    state.className = 'panel';
    state.setAttribute('role', role);
    state.textContent = message;
    detail.replaceChildren(state);
  };
  const renderPosture = (root: HTMLElement, records: RecordSummary[]) => {
    const values = counts(records);
    for (const value of config.statuses) {
      const target = root.querySelector<HTMLElement>(`[data-posture-count="${value}"]`);
      if (target) target.textContent = String(values[value]);
    }
  };
  const syncTabs = (record: RecordSummary) => {
    for (const tab of tabs) {
      const selected = tab.dataset.assuranceFramework === record.framework;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
  };
  const syncSections = (record: RecordSummary) => {
    const records = frameworkRecords(record.framework);
    const options = sections(record.framework).map((section) => {
      const option = document.createElement('option');
      option.value = section;
      option.selected = section === record.section;
      option.textContent = `${section} · ${records.filter((candidate) => candidate.section === section).length}`;
      return option;
    });
    sectionSelect.replaceChildren(...options);
  };
  const syncGrid = (record: RecordSummary) => {
    const records = config.records.filter((candidate) => candidate.framework === record.framework && candidate.section === record.section);
    recordCount.textContent = String(records.length);
    grid.replaceChildren(...records.map((item) => createRecordLink(item, record.id, messages)));
    renderPosture(sectionPosture, records);
    renderPosture(frameworkPosture, frameworkRecords(record.framework));
  };
  const syncControls = (record: RecordSummary) => {
    syncTabs(record);
    syncSections(record);
    syncGrid(record);
  };
  const load = async (id: string) => {
    const cached = cache.get(id);
    if (cached) {
      detail.replaceChildren(cloneFragment(cached));
      detail.setAttribute('aria-busy', 'false');
      announce(messages.loaded);
      return;
    }
    if (controller) controller.abort();
    controller = new AbortController();
    const local = controller;
    detail.setAttribute('aria-busy', 'true');
    renderState(messages.loading);
    try {
      const response = await fetch(endpoint(id), { headers: { accept: 'text/html' }, signal: local.signal });
      if (!response.ok) throw new Error(messages.failed);
      const fragment = parseServerFragment(await response.text());
      if (activeId !== id || local.signal.aborted) return;
      cache.set(id, fragment);
      detail.replaceChildren(cloneFragment(fragment));
      detail.setAttribute('aria-busy', 'false');
      announce(messages.loaded);
    } catch (error) {
      if (local.signal.aborted) return;
      detail.setAttribute('aria-busy', 'false');
      renderState(error instanceof Error ? error.message : messages.failed, 'alert');
    }
  };
  const select = (id: string, historyMode: 'push' | 'replace' | 'none' = 'push') => {
    const record = byId.get(id) ?? byId.get(config.defaultId) ?? config.records[0];
    if (!record) return;
    activeId = record.id;
    syncControls(record);
    const hash = `#${encodeURIComponent(record.id)}`;
    if (window.location.hash !== hash) {
      if (historyMode === 'replace') window.history.replaceState(null, '', hash);
      else if (historyMode === 'push') window.history.pushState(null, '', hash);
    }
    void load(record.id);
  };
  const fragmentId = () => {
    if (!window.location.hash) return config.defaultId;
    try {
      return decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return config.defaultId;
    }
  };
  const applySelection = () => {
    const requested = fragmentId();
    select(byId.has(requested) ? requested : config.defaultId, byId.has(requested) ? 'none' : 'replace');
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const record = config.records.find((candidate) => candidate.framework === tab.dataset.assuranceFramework);
      if (record) select(record.id);
    });
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const rtl = window.getComputedStyle(document.documentElement).direction === 'rtl';
      const current = tabs.indexOf(tab);
      let next = current;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === 'ArrowRight') next = (current + (rtl ? -1 : 1) + tabs.length) % tabs.length;
      else next = (current + (rtl ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next]?.focus();
      tabs[next]?.click();
    });
  }
  sectionSelect.addEventListener('change', () => {
    const record = currentRecord();
    const first = record && config.records.find((candidate) => candidate.framework === record.framework && candidate.section === sectionSelect.value);
    if (first) select(first.id);
  });
  grid.addEventListener('click', (event) => {
    const link = closestElement<HTMLElement>(event, '[data-assurance-record-link]');
    if (!link) return;
    event.preventDefault();
    select(link.dataset.assuranceRecordLink ?? config.defaultId);
  });
  detail.addEventListener('click', (event) => {
    const tab = closestElement<HTMLButtonElement>(event, '[data-assurance-inspector-mode]');
    const root = tab?.closest<HTMLElement>('.assurance-inspector');
    if (!tab || !root) return;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-assurance-inspector-mode]')) {
      const selected = button === tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    for (const panel of root.querySelectorAll<HTMLElement>('[data-assurance-inspector-panel]')) {
      panel.hidden = panel.dataset.assuranceInspectorPanel !== tab.dataset.assuranceInspectorMode;
    }
  });
  detail.addEventListener('keydown', (event) => {
    const tab = closestElement<HTMLButtonElement>(event, '[data-assurance-inspector-mode]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const root = tab.closest<HTMLElement>('.assurance-inspector');
    if (!root) return;
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-assurance-inspector-mode]')];
    const current = buttons.indexOf(tab);
    const rtl = window.getComputedStyle(document.documentElement).direction === 'rtl';
    let next = current;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else if (event.key === 'ArrowRight') next = (current + (rtl ? -1 : 1) + buttons.length) % buttons.length;
    else next = (current + (rtl ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
    buttons[next]?.click();
  });
  window.addEventListener('hashchange', applySelection);
  window.addEventListener('popstate', applySelection);
  applySelection();
}

initializeAssuranceWorkbench();
