export function assuranceReviewState(pathname, origin, assurancePath) {
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

export async function waitForAssuranceRecordPane(
  cdp,
  pathname,
  locale,
  {
    origin,
    assurancePath,
    evaluatePage,
    sleep,
    timeoutMs = 5_000,
    pollIntervalMs = 50,
  },
) {
  const state = assuranceReviewState(pathname, origin, assurancePath);
  if (!state) return null;

  const attempts = Math.max(1, Math.ceil(timeoutMs / pollIntervalMs));
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await evaluatePage(cdp, `(()=>{
      const expectedId=${JSON.stringify(state.recordId)};
      const panes=[...document.querySelectorAll('[data-assurance-record]')];
      const pane=expectedId ? panes.find((candidate)=>candidate.dataset.assuranceRecord===expectedId) : panes[0];
      const heading=pane?.querySelector('.assurance-record-heading h2');
      const inspector=pane?.querySelector('.assurance-inspector');
      const headingText=(heading?.textContent||'').trim().replace(/\\s+/g,' ').slice(0,120);
      return {ready:!!pane&&!!headingText&&!!inspector,headingText,recordId:pane?.dataset.assuranceRecord||''};
    })()`, `DEMO-289 content review readiness ${pathname} ${locale}`);
    if (result.ready) return result;
    if (attempt + 1 < attempts) await sleep(pollIntervalMs);
  }

  throw new Error(
    `DEMO-289 content review timed out after ${timeoutMs}ms waiting for the assurance record pane: page=${state.page} state=${state.state} locale=${locale}${state.recordId ? ` record=${state.recordId}` : ''}.`,
  );
}
