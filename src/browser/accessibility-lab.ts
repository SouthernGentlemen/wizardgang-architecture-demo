interface AxeRule { id: string; impact: string | null; help: string }
interface AxeResult { violations: AxeRule[] }

declare const axe: {
  run(document: Document, options: { resultTypes: string[] }): Promise<AxeResult>;
};

function initializeAccessibilityLab(): void {
  const mode = document.body.dataset.mode === 'broken' ? 'broken' : 'accessible';
  const open = document.querySelector<HTMLButtonElement>('[data-open]');
  const overlay = document.querySelector<HTMLElement>('[data-overlay]');
  const close = document.querySelector<HTMLButtonElement>('[data-close]');
  let returnFocus: HTMLButtonElement | null = null;
  if (open && overlay && close) {
    open.addEventListener('click', () => {
      returnFocus = open;
      overlay.hidden = false;
      close.focus();
    });
    close.addEventListener('click', () => {
      overlay.hidden = true;
      returnFocus?.focus();
    });
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        overlay.hidden = true;
        returnFocus?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = [...overlay.querySelectorAll<HTMLElement>('button,input,a[href]')];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
  }

  const reportHeight = () => parent.postMessage({ type: 'wg-accessibility-size', version: 1, mode, height: Math.ceil(document.body.scrollHeight) }, '*');
  if (parent !== window) {
    new ResizeObserver(reportHeight).observe(document.body);
    window.addEventListener('load', reportHeight);
    reportHeight();
  }
  let scanStarted = false;
  const scan = () => {
    if (scanStarted) return;
    scanStarted = true;
    const started = performance.now();
    axe.run(document, { resultTypes: ['violations'] }).then((result) => {
      const rules = result.violations.map((item) => ({ id: item.id, impact: item.impact || 'minor', help: item.help }));
      parent.postMessage({ type: 'wg-accessibility-report', version: 1, mode, rules, durationMs: Math.round(performance.now() - started) }, '*');
    }).catch(() => parent.postMessage({ type: 'wg-accessibility-report', version: 1, mode, rules: [], durationMs: 0, error: 'scan unavailable' }, '*'));
  };
  window.addEventListener('message', (event) => {
    if (event.source === parent && event.data?.type === 'wg-accessibility-start' && event.data?.version === 1) scan();
    if (event.source === parent && event.data?.type === 'wg-accessibility-ping' && event.data?.version === 1) parent.postMessage({ type: 'wg-accessibility-ready', version: 1, mode }, '*');
  });
  if (parent !== window) parent.postMessage({ type: 'wg-accessibility-ready', version: 1, mode }, '*');
}

initializeAccessibilityLab();
