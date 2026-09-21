interface EdgePayload {
  error?: unknown;
  request?: { method?: unknown; protocol?: unknown; host?: unknown; accepts?: unknown };
  edge?: Record<string, unknown>;
  delivery?: { cacheControl?: unknown };
}

function messages(root: HTMLElement): Readonly<Record<string, string>> {
  try { return (JSON.parse(root.dataset.config ?? '{}') as { messages?: Readonly<Record<string, string>> }).messages ?? {}; } catch { return {}; }
}

export function mount(root: HTMLElement): void {
  const text = messages(root);
  const message = (key: string, fallback: string) => text[key] ?? fallback;
  const button = root.querySelector<HTMLButtonElement>('[data-edge-run]');
  const status = root.querySelector<HTMLElement>('[data-edge-status]');
  const raw = root.querySelector<HTMLElement>('[data-edge-raw]');
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });
  if (!button || !status || !raw) return;

  const render = (target: Element | null, entries: ReadonlyArray<readonly [string, unknown]>) => {
    if (!target) return;
    target.replaceChildren();
    for (const [label, value] of entries) {
      const term = root.ownerDocument.createElement('dt');
      term.textContent = label;
      const detail = root.ownerDocument.createElement('dd');
      detail.textContent = value === null || value === undefined || value === '' ? message('notSupplied', 'Not supplied') : String(value);
      target.append(term, detail);
    }
  };

  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = message('inspecting', 'Inspecting the current request…');
    try {
      const response = await fetch('/api/labs/edge', { headers: { accept: 'application/json' }, signal: lifecycle.signal });
      const payload = await response.json() as EdgePayload;
      raw.textContent = JSON.stringify(payload, null, 2);
      if (!response.ok) throw new Error(String(payload.error ?? message('failed', 'Inspection failed')));
      render(root.querySelector('[data-edge-received]'), [
        [message('method', 'Method'), payload.request?.method],
        [message('protocol', 'Protocol'), payload.request?.protocol],
        [message('host', 'Host'), payload.request?.host],
        [message('accepts', 'Accepts'), payload.request?.accepts],
      ]);
      const edgeEntries: Array<readonly [string, unknown]> = Object.entries(payload.edge ?? {});
      edgeEntries.push([message('cachePolicy', 'Cache policy'), payload.delivery?.cacheControl ?? 'no-store']);
      render(root.querySelector('[data-edge-derived]'), edgeEntries);
      status.textContent = message('categorized', 'Categorized the allowlisted response. Private request data remained excluded.');
    } catch (error) {
      if (!lifecycle.signal.aborted) status.textContent = `${message('unavailable', 'Inspection unavailable.')} ${String(error)}`;
    } finally {
      button.disabled = false;
    }
  }, { signal: lifecycle.signal });
}
