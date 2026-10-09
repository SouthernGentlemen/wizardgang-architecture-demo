export interface AssuranceReviewState {
  page: string;
  state: string;
  recordId: string;
}

export interface AssuranceRecordPane {
  ready: boolean;
  headingText: string;
  recordId: string;
}

export interface AssuranceRecordPaneOptions<Cdp> {
  origin: string;
  assurancePath: string;
  evaluatePage: (cdp: Cdp, expression: string, label: string) => Promise<AssuranceRecordPane>;
  sleep: (milliseconds: number) => Promise<unknown>;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export function assuranceReviewState(pathname: string, origin: string, assurancePath: string): AssuranceReviewState | null {
  const url = new URL(pathname, origin);
  if (url.pathname !== assurancePath) return null;

  let recordId = '';
  if (url.hash) {
    try {
      recordId = decodeURIComponent(url.hash.slice(1));
    } catch {
      recordId = url.hash.slice(1);
    }
  }

  return {
    page: url.pathname,
    state: url.hash || '(default)',
    recordId,
  };
}

export async function waitForAssuranceRecordPane<Cdp>(
  cdp: Cdp,
  pathname: string,
  locale: string,
  {
    origin,
    assurancePath,
    evaluatePage,
    sleep,
    timeoutMs = 5_000,
    pollIntervalMs = 50,
  }: AssuranceRecordPaneOptions<Cdp>,
): Promise<AssuranceRecordPane | null> {
  const state = assuranceReviewState(pathname, origin, assurancePath);
  if (!state) return null;

  return waitForBrowserState(async () => {
    const result = await evaluatePage(cdp, `(()=>{
      const expectedId=${JSON.stringify(state.recordId)};
      const panes=[...document.querySelectorAll('[data-assurance-record]')];
      const pane=expectedId ? panes.find((candidate)=>candidate.dataset.assuranceRecord===expectedId) : panes[0];
      const heading=pane?.querySelector('.assurance-record-heading h2');
      const inspector=pane?.querySelector('.assurance-inspector');
      const headingText=(heading?.textContent||'').trim().replace(/\\s+/g,' ').slice(0,120);
      const detail=document.querySelector('[data-assurance-detail]');
      const busy=detail?.getAttribute('aria-busy');
      const current=document.querySelector('[data-assurance-record-link][aria-current="true"]')?.getAttribute('data-assurance-record-link');
      return {ready:!!pane&&!!headingText&&!!inspector&&busy==='false'&&current===pane.dataset.assuranceRecord,headingText,recordId:pane?.dataset.assuranceRecord||'',busy,current};
    })()`, `Assurance content readiness ${pathname} ${locale}`);
    return result;
  }, (result) => result.ready, `Assurance content review page=${state.page} state=${state.state} locale=${locale}${state.recordId ? ` record=${state.recordId}` : ''}`, {
    timeoutMs, intervalMs: pollIntervalMs, pause: sleep,
  });
}

// Poll observations only: never refocus, scroll, reload, or repeat an interaction.
export async function waitForBrowserState<T>(read: () => Promise<T>, ready: (state: T) => boolean, label: string,
  { timeoutMs = 5_000, intervalMs = 50, pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  const deadline = Date.now() + timeoutMs;
  let state: T;
  do {
    state = await read();
    if (ready(state)) return state;
    if (Date.now() >= deadline) break;
    await pause(Math.min(intervalMs, Math.max(0, deadline - Date.now())));
  } while (true);
  throw new Error(`${label} timed out after ${timeoutMs}ms; state=${JSON.stringify(state)}`);
}

export function requireCategoryFocus(state: { selected: string | null; focused: string | null; selectedFocused: boolean }, label: string) {
  if (!state.selected || !state.selectedFocused || state.focused !== state.selected) {
    throw new Error(`${label}: selected category does not own keyboard focus; state=${JSON.stringify(state)}`);
  }
}

export async function settledGeometry<T extends Record<string, unknown>>(read: () => Promise<T>, label: string, options = {}) {
  let previous: T | undefined;
  let consecutive = 0;
  return waitForBrowserState(read, (state) => {
    const finite = Object.values(state).every((value) => typeof value !== 'number' || Number.isFinite(value));
    const same = previous && Object.keys(state).every((key) => typeof state[key] === 'number'
      ? typeof previous![key] === 'number' && Math.abs(Number(state[key]) - Number(previous![key])) <= 0.25
      : state[key] === previous![key]);
    consecutive = finite && same ? consecutive + 1 : 0;
    previous = state;
    return consecutive >= 2;
  }, `${label} geometry settlement`, options);
}

export function requireFirstViewport(top: number, bottom: number, height: number, label: string) {
  if (!(top >= -1 && bottom <= height + 1)) {
    throw new Error(`${label}: heading outside first viewport=${top}..${bottom}/${height}`);
  }
}
