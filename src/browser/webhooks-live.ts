type Evidence = { id?: number | null; name: string; status: string; conclusion: string | null; url?: string | null; startedAt?: string | null; completedAt?: string | null };
type Step = Evidence & { number?: number | null };
type Job = Evidence & { steps: Step[] };
type Run = Evidence & { id: number; createdAt?: string | null; updatedAt?: string | null };
type GitStatus = {
  requestId: string | null;
  active: boolean;
  targetVersion: string | null;
  branch: { name: string; url: string } | null;
  pullRequest: { number: number; state: string; url: string } | null;
  releaseReady: boolean;
  failures: string[];
  stages: Array<{ key: string; label: string; state: string }>;
  ci: { run: Run | null; checks: Evidence[]; jobs: Job[]; available: boolean };
  controller: { start: Run | null; release: Run | null; startJobs: Job[]; releaseJobs: Job[] };
  delivery: { releaseRun: Run | null; deployRun: Run | null; releaseJobs: Job[]; deployJobs: Job[]; releaseUrl: string | null };
};
type Preflight = { mainSha: string; currentVersion: string; targetVersion: string; lastRelease: string; fingerprint: string; commitsSinceRelease: Array<{ sha: string; subject: string; url: string }>; active: unknown };

function required<T extends Element>(root: ParentNode, selector: string): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Live Git presentation is missing ${selector}`);
  return node;
}

function node<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, className = ''): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  result.className = className;
  return result;
}

function setLink(container: HTMLElement, label: string, url: string | null | undefined): void {
  const safe = url && /^https:\/\/github\.com\/Wizard-Gang\/wizardgang-architecture-demo(?:\/|$)/.test(url) ? url : null;
  const current = container.firstElementChild;
  if (safe) {
    const link = current?.tagName === 'A' ? current as HTMLAnchorElement : node(container.ownerDocument, 'a');
    link.href = safe;
    link.textContent = label;
    link.rel = 'noopener noreferrer';
    if (link !== current) container.replaceChildren(link);
  } else container.textContent = label;
}

function keyed(parent: HTMLElement, key: string, tag: 'article' | 'div' | 'li'): HTMLElement {
  let child = [...parent.children].find((entry) => (entry as HTMLElement).dataset.key === key) as HTMLElement | undefined;
  if (!child) {
    child = node(parent.ownerDocument, tag);
    child.dataset.key = key;
    parent.append(child);
  }
  return child;
}

function prune(parent: HTMLElement, keys: Set<string>): void {
  for (const child of [...parent.children] as HTMLElement[]) if (child.dataset.key && !keys.has(child.dataset.key)) child.remove();
}

function timing(item: Evidence | Run): string {
  const start = item.startedAt ?? ('createdAt' in item ? item.createdAt : null);
  const completed = item.completedAt;
  const updated = 'updatedAt' in item ? item.updatedAt : null;
  return [start && `Started ${start}`, completed && `Completed ${completed}`, updated && `Updated ${updated}`].filter(Boolean).join(' · ');
}

function renderEvidence(parent: HTMLElement, key: string, value: Evidence, tag: 'li' | 'article' = 'li'): HTMLElement {
  const item = keyed(parent, key, tag);
  item.className = 'webhook-live-item';
  item.dataset.state = value.conclusion ?? value.status;
  let heading = item.querySelector<HTMLElement>(':scope > .webhook-live-item-heading');
  if (!heading) { heading = node(parent.ownerDocument, 'div', 'webhook-live-item-heading'); item.prepend(heading); }
  setLink(heading, value.name, value.url);
  let detail = item.querySelector<HTMLElement>(':scope > .webhook-live-item-detail');
  if (!detail) { detail = node(parent.ownerDocument, 'p', 'webhook-live-item-detail'); item.append(detail); }
  detail.textContent = [value.status, value.conclusion, timing(value)].filter(Boolean).join(' · ');
  return item;
}

function renderJobs(parent: HTMLElement, jobs: Job[], prefix: string): void {
  const keys = new Set<string>();
  jobs.forEach((job, index) => {
    const key = `${prefix}-job-${job.id ?? index}-${job.name}`;
    keys.add(key);
    const item = renderEvidence(parent, key, job);
    let steps = item.querySelector<HTMLOListElement>(':scope > ol');
    if (!steps) { steps = node(parent.ownerDocument, 'ol', 'webhook-live-steps'); item.append(steps); }
    const stepKeys = new Set<string>();
    job.steps.forEach((step, stepIndex) => {
      const stepKey = `${key}-step-${step.number ?? stepIndex}-${step.name}`;
      stepKeys.add(stepKey);
      renderEvidence(steps!, stepKey, step);
    });
    prune(steps, stepKeys);
  });
  prune(parent, keys);
}

function renderRun(parent: HTMLElement, key: string, run: Run | null, jobs: Job[]): void {
  if (!run) { parent.querySelector<HTMLElement>(`[data-key="${key}"]`)?.remove(); return; }
  const item = renderEvidence(parent, key, run, 'article');
  let list = item.querySelector<HTMLOListElement>(':scope > ol');
  if (!list) { list = node(parent.ownerDocument, 'ol', 'webhook-live-jobs'); item.append(list); }
  renderJobs(list, jobs, key);
}

export function mountLiveGit(root: HTMLElement, signal: AbortSignal, messages: Readonly<Record<string, string>>): void {
  const panel = required<HTMLElement>(root, '[data-live-git]');
  const document = root.ownerDocument;
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const state = required<HTMLElement>(panel, '[data-live-state]');
  const notice = required<HTMLElement>(panel, '[data-live-message]');
  const feed = required<HTMLElement>(panel, '[data-live-feed]');
  const form = required<HTMLFormElement>(panel, '[data-live-auth]');
  const controls = required<HTMLElement>(panel, '[data-live-controls]');
  const bump = required<HTMLSelectElement>(panel, '[data-live-bump]');
  const preflightButton = required<HTMLButtonElement>(panel, '[data-live-preflight]');
  const startButton = required<HTMLButtonElement>(panel, '[data-live-start]');
  const releaseButton = required<HTMLButtonElement>(panel, '[data-live-release]');
  const preflightPanel = required<HTMLElement>(panel, '[data-live-preflight-panel]');
  const target = required<HTMLElement>(panel, '[data-live-target]');
  const commits = required<HTMLOListElement>(panel, '[data-live-commits]');
  const confirmation = required<HTMLInputElement>(panel, '[data-live-confirm]');
  const lifecycle = required<HTMLOListElement>(panel, '[data-live-lifecycle]');
  let authorization = '';
  let preflight: Preflight | null = null;
  let status: GitStatus | null = null;
  let requestId: string | null = null;
  let busy = false;

  const updateControls = () => {
    startButton.disabled = busy || !authorization || !preflight || !confirmation.checked || Boolean(preflight.active) || Boolean(status?.active);
    releaseButton.disabled = busy || !authorization || !status?.releaseReady || !status.pullRequest || !status.requestId || status.pullRequest.state !== 'open';
  };
  const request = async (path: string, init: RequestInit = {}): Promise<Record<string, unknown>> => {
    const response = await fetch(path, { ...init, credentials: 'same-origin', signal, headers: { accept: 'application/json', ...(authorization ? { authorization } : {}), ...(init.body ? { 'content-type': 'application/json' } : {}) } });
    if (!response.ok) throw new Error(response.status === 401 ? 'Admin authentication required.' : `GitHub evidence or release request unavailable (HTTP ${response.status}).`);
    return await response.json() as Record<string, unknown>;
  };
  const render = (value: GitStatus) => {
    status = value;
    if (!requestId && value.requestId) requestId = value.requestId;
    state.textContent = value.failures.length ? message('liveUnavailable', 'Live GitHub data is unavailable.') : value.active ? 'Live' : 'Read-only';
    notice.textContent = value.failures.length ? `${message('liveUnavailable', 'Live GitHub data is unavailable.')} ${value.failures.join(', ')}`
      : value.releaseReady ? message('liveReady', 'All required CI checks passed on this pull request.')
        : authorization ? message('liveWaiting', 'Merge & Release is available after all required CI checks pass.')
          : message('liveReadOnly', 'Live feed is read-only. Sign in as a demo admin to start a release.');
    const states = new Map(value.stages.map((entry) => [entry.key, entry.state]));
    const keys = ['branch', 'pr', 'ci', 'merge', 'tag', 'release', 'deploy', 'health'];
    [...lifecycle.children].forEach((item, index) => {
      const phase = states.get(keys[index]) ?? 'unavailable';
      (item as HTMLElement).dataset.state = phase;
      const label = item.querySelector<HTMLElement>('span');
      if (label) {
        if (keys[index] === 'branch') setLink(label, value.branch?.name ?? 'Branch', value.branch?.url);
        else if (keys[index] === 'pr') setLink(label, value.pullRequest ? `PR #${value.pullRequest.number}` : 'Pull request', value.pullRequest?.url);
        else if (keys[index] === 'ci') setLink(label, 'CI', value.ci.run?.url);
        else if (keys[index] === 'release') setLink(label, value.targetVersion ? `Release v${value.targetVersion}` : 'Release', value.delivery.releaseUrl);
      }
      const outcome = item.querySelector('strong');
      if (outcome) outcome.textContent = phase;
    });
    if (!value.ci.available || value.failures.length) {
      let warning = feed.querySelector<HTMLElement>('[data-live-warning]');
      if (!warning) { warning = node(document, 'p', 'webhook-live-warning'); warning.dataset.liveWarning = ''; feed.prepend(warning); }
      warning.textContent = message('liveUnavailable', 'Live GitHub data is unavailable.');
    } else feed.querySelector('[data-live-warning]')?.remove();
    let checks = feed.querySelector<HTMLOListElement>('[data-live-checks]');
    if (!checks) { checks = node(document, 'ol', 'webhook-live-checks'); checks.dataset.liveChecks = ''; feed.append(checks); }
    const checkKeys = new Set<string>();
    value.ci.checks.forEach((check, index) => { const key = `check-${check.id ?? index}-${check.name}`; checkKeys.add(key); renderEvidence(checks!, key, check); });
    prune(checks, checkKeys);
    for (const [key, run, jobs] of [
      ['controller-start', value.controller.start, value.controller.startJobs],
      ['ci', value.ci.run, value.ci.jobs],
      ['controller-release', value.controller.release, value.controller.releaseJobs],
      ['release', value.delivery.releaseRun, value.delivery.releaseJobs],
      ['deploy', value.delivery.deployRun, value.delivery.deployJobs],
    ] as Array<[string, Run | null, Job[]]>) renderRun(feed, key, run, jobs);
    if (!value.ci.checks.length && !value.ci.run && !value.controller.start) {
      let empty = feed.querySelector<HTMLElement>('[data-live-empty]');
      if (!empty) { empty = node(document, 'p'); empty.dataset.liveEmpty = ''; feed.append(empty); }
      empty.textContent = 'No live release run is available.';
    } else feed.querySelector('[data-live-empty]')?.remove();
    updateControls();
  };
  const refresh = async () => {
    try {
      const path = `/api/labs/git-delivery${requestId ? `?request_id=${encodeURIComponent(requestId)}` : ''}`;
      render(await request(path) as unknown as GitStatus);
    } catch {
      if (!signal.aborted) { state.textContent = 'Unavailable'; notice.textContent = message('liveUnavailable', 'Live GitHub data is unavailable.'); releaseButton.disabled = true; }
    }
  };
  const loadPreflight = async () => {
    preflight = null;
    confirmation.checked = false;
    preflightPanel.hidden = true;
    updateControls();
    const value = await request(`/api/labs/git-delivery?preflight=${encodeURIComponent(bump.value)}`);
    preflight = value as unknown as Preflight;
    target.textContent = `${preflight.lastRelease} → v${preflight.targetVersion} · main ${preflight.mainSha}`;
    commits.replaceChildren();
    for (const commit of preflight.commitsSinceRelease) {
      const row = node(document, 'li');
      setLink(row, `${commit.sha.slice(0, 7)} ${commit.subject}`, commit.url);
      commits.append(row);
    }
    if (!preflight.commitsSinceRelease.length) {
      const empty = node(document, 'li');
      empty.textContent = 'No commits since the last release.';
      commits.append(empty);
    }
    preflightPanel.hidden = false;
    notice.textContent = preflight.active ? 'A live release is already active.' : 'Review the release preflight before starting.';
    updateControls();
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = required<HTMLInputElement>(form, '[name="username"]');
    const password = required<HTMLInputElement>(form, '[name="password"]');
    authorization = `Basic ${btoa(`${user.value}:${password.value}`)}`;
    password.value = '';
    void loadPreflight().then(() => { controls.hidden = false; form.hidden = true; }).catch(() => {
      authorization = '';
      notice.textContent = 'Admin authentication or release preflight is unavailable.';
      updateControls();
    });
  }, { signal });
  bump.addEventListener('change', () => { void loadPreflight().catch(() => { notice.textContent = message('liveUnavailable', 'Live GitHub data is unavailable.'); }); }, { signal });
  preflightButton.addEventListener('click', () => { void loadPreflight().catch(() => { notice.textContent = message('liveUnavailable', 'Live GitHub data is unavailable.'); }); }, { signal });
  confirmation.addEventListener('change', updateControls, { signal });
  startButton.addEventListener('click', () => {
    if (!preflight || !confirmation.checked || startButton.disabled) return;
    busy = true; updateControls();
    void request('/api/labs/git-delivery', { method: 'POST', body: JSON.stringify({ bump: bump.value, preflightFingerprint: preflight.fingerprint }) }).then((result) => {
      requestId = typeof result.requestId === 'string' ? result.requestId : null;
      preflight = null; confirmation.checked = false; preflightPanel.hidden = true;
      notice.textContent = 'Live release requested. Following actual GitHub Actions evidence.';
      return refresh();
    }).catch((error: unknown) => { notice.textContent = error instanceof Error ? error.message : String(error); }).finally(() => { busy = false; updateControls(); });
  }, { signal });
  releaseButton.addEventListener('click', () => {
    if (!status?.releaseReady || !status.pullRequest || !status.requestId || releaseButton.disabled) return;
    busy = true; updateControls();
    void request('/api/labs/git-release', { method: 'POST', body: JSON.stringify({ pullRequest: status.pullRequest.number, requestId: status.requestId }) }).then(() => {
      notice.textContent = 'Merge & Release requested. Following actual GitHub Actions evidence.';
      return refresh();
    }).catch((error: unknown) => { notice.textContent = error instanceof Error ? error.message : String(error); }).finally(() => { busy = false; updateControls(); });
  }, { signal });
  void refresh();
  const timer = window.setInterval(() => { if (document.visibilityState === 'visible' && !signal.aborted) void refresh(); }, 2_000);
  signal.addEventListener('abort', () => { authorization = ''; window.clearInterval(timer); }, { once: true });
}
