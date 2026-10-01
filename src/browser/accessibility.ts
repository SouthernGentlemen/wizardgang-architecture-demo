interface AccessibilityRule { id: string; impact?: string; help: string }
interface AccessibilityReport { type: string; version: number; mode: string; rules: AccessibilityRule[]; durationMs: number; error?: string }
interface AccessibilityReady { type: string; version: number; mode: string }
interface AccessibilitySize { type: string; version: number; mode: string; height: number }

function config(root: HTMLElement): { locale?: string; messages?: Readonly<Record<string, string>> } {
  try { return JSON.parse(root.dataset.config ?? '{}') as { locale?: string; messages?: Readonly<Record<string, string>> }; } catch { return {}; }
}

function validReport(data: unknown): data is AccessibilityReport {
  if (!data || typeof data !== 'object') return false;
  const report = data as Partial<AccessibilityReport>;
  return report.type === 'wg-accessibility-report'
    && report.version === 1
    && report.mode === 'accessible'
    && Array.isArray(report.rules)
    && report.rules.every((rule) => rule && typeof rule.id === 'string' && typeof rule.help === 'string')
    && typeof report.durationMs === 'number';
}

function validReady(data: unknown): data is AccessibilityReady {
  if (!data || typeof data !== 'object') return false;
  const ready = data as Partial<AccessibilityReady>;
  return ready.type === 'wg-accessibility-ready' && ready.version === 1 && ready.mode === 'accessible';
}

function validSize(data: unknown): data is AccessibilitySize {
  if (!data || typeof data !== 'object') return false;
  const size = data as Partial<AccessibilitySize>;
  return size.type === 'wg-accessibility-size' && size.version === 1 && size.mode === 'accessible'
    && typeof size.height === 'number' && Number.isFinite(size.height) && size.height >= 200 && size.height < 4000;
}

export function mount(root: HTMLElement): void {
  const { locale = 'en', messages = {} } = config(root);
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const number = new Intl.NumberFormat(locale);
  const frame = root.querySelector<HTMLIFrameElement>('[data-a11y-frame]');
  const state = root.querySelector<HTMLElement>('[data-scan-state]');
  const meta = root.querySelector<HTMLElement>('[data-scan-meta]');
  const rules = root.querySelector<HTMLElement>('[data-scan-rules]');
  const run = root.querySelector<HTMLButtonElement>('[data-run-a11y-scan]');
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });
  if (!frame || !state || !meta || !rules || !run) return;
  let ready = false;
  let requested = false;
  const startScan = () => frame.contentWindow?.postMessage({ type: 'wg-accessibility-start', version: 1 }, '*');
  const ping = () => frame.contentWindow?.postMessage({ type: 'wg-accessibility-ping', version: 1 }, '*');
  frame.addEventListener('load', ping, { signal: lifecycle.signal });
  ping();
  run.addEventListener('click', () => {
    if (!ready || requested) return;
    requested = true;
    run.disabled = true;
    state.textContent = message('scanning', 'Scanning');
    meta.textContent = message('loading', 'Loading the accessible behavior…');
    startScan();
  }, { signal: lifecycle.signal });
  run.disabled = true;

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow) return;
    if (validSize(event.data)) {
      frame.style.height = `${event.data.height}px`;
      return;
    }
    if (validReady(event.data)) {
      ready = true;
      run.disabled = false;
      state.textContent = message('ready', 'Ready to run the automated check.');
      meta.textContent = message('ready', 'Ready to run the automated check.');
      return;
    }
    if (!validReport(event.data) || !requested) return;
    if (event.data.error) {
      state.textContent = message('unavailable', 'Unavailable');
      meta.textContent = message('unavailableDetail', 'The accessible behavior and automated scan are unavailable.');
      return;
    }
    const counts: Record<string, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const rule of event.data.rules) if (Object.hasOwn(counts, rule.impact ?? '')) counts[rule.impact ?? ''] += 1;
    for (const [impact, count] of Object.entries(counts)) {
      const target = root.querySelector<HTMLElement>(`[data-impact="${impact}"]`);
      if (target) target.textContent = number.format(count);
    }
    rules.replaceChildren();
    if (event.data.rules.length === 0) {
      const item = root.ownerDocument.createElement('li');
      item.textContent = message('noViolations', 'No axe violations were reported in the live accessible behavior. The inert failure fixtures were not scanned.');
      rules.append(item);
    } else {
      for (const rule of event.data.rules) {
        const item = root.ownerDocument.createElement('li');
        const code = root.ownerDocument.createElement('code');
        code.textContent = rule.id;
        item.append(code, root.ownerDocument.createTextNode(` — ${rule.help}`));
        rules.append(item);
      }
    }
    state.textContent = event.data.rules.length ? message('reviewFindings', 'Review findings') : message('noFindings', 'No automated findings');
    meta.dataset.durationMs = String(event.data.durationMs);
    meta.textContent = `${message('totalFindings', 'Automated findings:')} ${number.format(event.data.rules.length)}. ${message('scannedPrefix', 'Scanned the accessible behavior in')} ${number.format(event.data.durationMs)} ${message('scannedSuffix', 'ms. Partial automated coverage; manual verification remains required.')}`;
  }, { signal: lifecycle.signal });
}
