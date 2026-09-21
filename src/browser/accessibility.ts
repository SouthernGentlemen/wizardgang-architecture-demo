interface AccessibilityRule { id: string; impact?: string; help: string }
interface AccessibilityReport { type: string; version: number; mode: string; rules: AccessibilityRule[]; durationMs: number }
interface AccessibilityReady { type: string; version: number; mode: string }

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

export function mount(root: HTMLElement): void {
  const { locale = 'en', messages = {} } = config(root);
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const number = new Intl.NumberFormat(locale);
  const frame = root.querySelector<HTMLIFrameElement>('[data-a11y-frame]');
  const state = root.querySelector<HTMLElement>('[data-scan-state]');
  const meta = root.querySelector<HTMLElement>('[data-scan-meta]');
  const rules = root.querySelector<HTMLElement>('[data-scan-rules]');
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });
  if (!frame || !state || !meta || !rules) return;
  const startScan = () => frame.contentWindow?.postMessage({ type: 'wg-accessibility-start', version: 1 }, '*');

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow) return;
    if (validReady(event.data)) {
      startScan();
      return;
    }
    if (!validReport(event.data)) return;
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
    meta.textContent = `${message('scannedPrefix', 'Scanned the accessible behavior in')} ${number.format(event.data.durationMs)} ${message('scannedSuffix', 'ms. Partial automated coverage; manual verification remains required.')}`;
  }, { signal: lifecycle.signal });

  state.textContent = message('scanning', 'Scanning');
  meta.textContent = message('loading', 'Loading the accessible behavior…');
  startScan();
}
