interface CounterPayload { counter?: unknown; error?: unknown }

function config(root: HTMLElement): { locale?: string; messages?: Readonly<Record<string, string>> } {
  try { return JSON.parse(root.dataset.config ?? '{}') as { locale?: string; messages?: Readonly<Record<string, string>> }; } catch { return {}; }
}

export async function mount(root: HTMLElement): Promise<void> {
  const { locale = 'en', messages = {} } = config(root);
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const number = new Intl.NumberFormat(locale);
  const status = root.querySelector<HTMLElement>('[data-durable-status]');
  const current = root.querySelector<HTMLElement>('[data-durable-current]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-durable-run]')];
  const raw = root.querySelector<HTMLElement>('[data-durable-raw]');
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });
  if (!status || !current || !raw || buttons.length === 0) return;

  const read = async () => {
    const response = await fetch('/api/labs/durable-counter', { headers: { accept: 'application/json' }, signal: lifecycle.signal });
    const payload = await response.json() as CounterPayload;
    if (!response.ok) throw new Error(String(payload.error ?? message('counterUnavailable', 'Counter unavailable')));
    return Number(payload.counter);
  };
  const set = (name: string, value: string | number) => {
    const target = root.querySelector<HTMLElement>(`[data-durable-${name}]`);
    if (target) target.textContent = String(value);
  };
  const load = async () => {
    try {
      const count = await read();
      current.textContent = `${message('currentCount', 'Current count')} ${number.format(count)}`;
      status.textContent = message('ready', 'Ready to coordinate requests.');
    } catch (error) {
      if (lifecycle.signal.aborted) return;
      current.textContent = message('unavailable', 'Unavailable');
      status.textContent = String(error);
    }
  };

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      const requested = Number(button.dataset.durableRun);
      buttons.forEach((item) => { item.disabled = true; });
      status.textContent = requested === 10 ? message('dispatchingTen', 'Dispatching ten requests concurrently…') : message('sendingOne', 'Sending one request…');
      try {
        const start = await read();
        const started = performance.now();
        const responses = await Promise.allSettled(Array.from({ length: requested }, async () => {
          const response = await fetch('/api/labs/durable-counter', { method: 'POST', headers: { accept: 'application/json' }, signal: lifecycle.signal });
          const payload = await response.json() as CounterPayload;
          if (!response.ok) throw new Error(String(payload.error ?? message('incrementFailed', 'Increment failed')));
          return payload;
        }));
        const duration = performance.now() - started;
        const successes = responses.filter((item) => item.status === 'fulfilled');
        const final = await read();
        const expected = start + successes.length;
        set('start', number.format(start));
        set('expected', number.format(expected));
        set('final', number.format(final));
        set('success', `${number.format(successes.length)} / ${number.format(requested)}`);
        set('duration', `${number.format(duration)} ms`);
        current.textContent = `${message('currentCount', 'Current count')} ${number.format(final)}`;
        raw.textContent = JSON.stringify(responses.map((item) => item.status === 'fulfilled' ? item.value : { error: String(item.reason) }), null, 2);
        if (successes.length !== requested) status.textContent = message('incomplete', 'Some increments failed; the result is not presented as a complete coordination proof.');
        else if (final === expected) status.textContent = `${number.format(requested)} ${message('complete', 'requests reached one object and produced the exact expected final count.')}`;
        else status.textContent = `${number.format(requested)} ${message('otherActivity', 'requests succeeded. The shared public counter also changed during this run, so the final count includes other activity.')}`;
      } catch (error) {
        if (!lifecycle.signal.aborted) status.textContent = `${message('runUnavailable', 'Coordination run unavailable.')} ${String(error)}`;
      } finally {
        buttons.forEach((item) => { item.disabled = false; });
      }
    }, { signal: lifecycle.signal });
  }
  await load();
}
