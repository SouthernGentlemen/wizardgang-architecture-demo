interface WorkersPayload {
  error?: unknown;
  message?: unknown;
  reason?: unknown;
  decision?: { cache?: unknown; route?: unknown; originRequired?: unknown };
}

function messages(root: HTMLElement): Readonly<Record<string, string>> {
  try { return (JSON.parse(root.dataset.config ?? '{}') as { messages?: Readonly<Record<string, string>> }).messages ?? {}; } catch { return {}; }
}

export function mount(root: HTMLElement): void {
  const text = messages(root);
  const message = (key: string, fallback: string) => text[key] ?? fallback;
  const form = root.querySelector<HTMLFormElement>('[data-worker-policy]');
  const status = root.querySelector<HTMLElement>('[data-worker-status]');
  const result = root.querySelector<HTMLElement>('[data-worker-result]');
  const reason = root.querySelector<HTMLElement>('[data-worker-reason]');
  const raw = root.querySelector<HTMLElement>('[data-worker-raw]');
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });
  if (!form || !status || !result || !reason || !raw) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const resource = String(data.get('resource'));
    const request = {
      method: String(data.get('method')),
      path: resource === 'asset' ? '/assets/architecture-map.svg' : '/app/dashboard',
      hasCookie: data.has('cookie'),
      hasAuthorization: data.has('authorization'),
    };
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (!submit) return;
    submit.disabled = true;
    status.textContent = message('applying', 'Applying the edge policy…');
    try {
      const response = await fetch('/api/labs/workers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ operation: 'edge-policy', request }),
        signal: lifecycle.signal,
      });
      const payload = await response.json() as WorkersPayload;
      raw.textContent = JSON.stringify(payload, null, 2);
      if (!response.ok || !payload.decision) throw new Error(String(payload.message ?? payload.error ?? message('unavailable', 'Policy unavailable.')));
      result.hidden = false;
      const cacheable = root.querySelector<HTMLElement>('[data-worker-cacheable]');
      const route = root.querySelector<HTMLElement>('[data-worker-route]');
      const origin = root.querySelector<HTMLElement>('[data-worker-origin]');
      if (cacheable) cacheable.textContent = payload.decision.cache === 'public' ? message('yes', 'YES') : message('no', 'NO');
      if (route) route.textContent = String(payload.decision.route).toUpperCase();
      if (origin) origin.textContent = payload.decision.originRequired ? message('required', 'REQUIRED') : message('skipped', 'SKIPPED');
      reason.textContent = String(payload.reason ?? '');
      status.textContent = message('complete', 'The stateless Worker returned its decision.');
    } catch (error) {
      if (!lifecycle.signal.aborted) status.textContent = `${message('unavailable', 'Policy unavailable.')} ${String(error)}`;
    } finally {
      submit.disabled = false;
    }
  }, { signal: lifecycle.signal });
}
