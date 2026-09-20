interface WebhookEvent {
  id?: unknown;
  receivedAt?: unknown;
  eventType?: unknown;
  provider?: unknown;
  action?: unknown;
  actor?: unknown;
  repository?: unknown;
  summary?: unknown;
}

interface WebhookPayload {
  events?: unknown;
  pollingIntervalMs?: unknown;
  repository?: unknown;
  error?: unknown;
}

function parseConfig(root: HTMLElement): { locale?: string; messages?: Readonly<Record<string, string>> } {
  try {
    return JSON.parse(root.dataset.config ?? '{}') as { locale?: string; messages?: Readonly<Record<string, string>> };
  } catch {
    return {};
  }
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Webhook presentation is missing ${selector}`);
  return element;
}

function element<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: K,
  text = '',
  className = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function errorValue(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function mount(root: HTMLElement): Promise<void> {
  const { locale = 'en', messages = {} } = parseConfig(root);
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const document = root.ownerDocument;
  const lifecycle = new AbortController();
  let intervalId: number | undefined;
  root.addEventListener('demo:deactivate', () => {
    lifecycle.abort();
    if (intervalId !== undefined) window.clearInterval(intervalId);
  }, { once: true });

  const list = required<HTMLElement>(root, '[data-webhook-events]');
  const state = required<HTMLElement>(root, '[data-webhook-state]');
  const meta = required<HTMLElement>(root, '[data-webhook-meta]');
  const sendButton = required<HTMLButtonElement>(root, '[data-webhook-send]');
  const resetButton = required<HTMLButtonElement>(root, '[data-webhook-reset]');
  const stages = [...root.querySelectorAll<HTMLElement>('[data-webhook-stage]')];
  const number = new Intl.NumberFormat(locale);
  let lastFingerprint = '';

  const setStages = (value: 'pending' | 'complete' | 'failed') => {
    for (const stage of stages) stage.dataset.state = value;
  };
  const render = (payload: WebhookPayload) => {
    const events = Array.isArray(payload.events) ? payload.events as WebhookEvent[] : [];
    const fingerprint = JSON.stringify(events.map((event) => [event.id, event.receivedAt]));
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;
    list.replaceChildren();

    if (!events.length) {
      const empty = element(document, 'div', '', 'webhook-empty');
      empty.append(
        element(document, 'strong', message('noDeliveries', 'No release deliveries yet')),
        element(document, 'span', message('noDeliveriesHelp', 'Simulate a signed release webhook to run the complete validation path.')),
      );
      list.append(empty);
    }

    for (const event of events) {
      const card = element(document, 'article', '', 'webhook-event');
      const heading = element(document, 'div', '', 'lab-heading');
      const title = element(document, 'h3', String(event.eventType || 'event'));
      const badge = element(
        document,
        'span',
        `${message('verified', 'Verified')} · ${String(event.provider || message('unknown', 'unknown'))}`,
        'badge badge-ok',
      );
      heading.append(title, badge);
      const detail = element(
        document,
        'p',
        [event.action, event.actor, event.repository, event.receivedAt].filter(Boolean).join(' · '),
        'subtle',
      );
      const checks = element(document, 'div', '', 'webhook-event-checks');
      for (const [key, fallback] of [
        ['signatureValid', 'Signature valid'],
        ['repositoryAllowed', 'Repository allowed'],
        ['deliveryUnique', 'Delivery unique'],
        ['eventAllowed', 'Event allowed'],
        ['sanitized', 'Sanitized'],
      ] as const) checks.append(element(document, 'span', `✓ ${message(key, fallback)}`));
      const summary = element(document, 'details');
      summary.append(
        element(document, 'summary', message('sanitizedSummary', 'Sanitized event summary')),
        element(document, 'pre', JSON.stringify(event.summary || {}, null, 2)),
      );
      card.append(heading, detail, checks, summary);
      list.append(card);
    }

    const interval = typeof payload.pollingIntervalMs === 'number'
      ? number.format(payload.pollingIntervalMs)
      : String(payload.pollingIntervalMs ?? '');
    meta.textContent = `${number.format(events.length)} ${events.length === 1
      ? message('verifiedDelivery', 'verified delivery')
      : message('verifiedDeliveries', 'verified deliveries')} · ${message('pollingEvery', 'polling every')} ${interval} ms · ${String(payload.repository ?? '')}`;
  };
  const refresh = async () => {
    try {
      const response = await fetch('/api/labs/webhook-events', { signal: lifecycle.signal });
      if (!response.ok) throw new Error('unavailable');
      render(await response.json() as WebhookPayload);
      state.textContent = message('connected', 'Connected');
      state.classList.add('badge-ok');
    } catch (error) {
      if (lifecycle.signal.aborted) return;
      state.textContent = message('unavailable', 'Unavailable');
      state.classList.remove('badge-ok');
      meta.textContent = message('evidenceUnavailable', 'Verified delivery evidence is unavailable.');
    }
  };
  const mutate = async (path: string) => {
    state.textContent = message('working', 'Working');
    const response = await fetch(path, { method: 'POST', signal: lifecycle.signal });
    const payload = await response.json() as WebhookPayload;
    if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'request failed');
    lastFingerprint = '';
    await refresh();
  };

  sendButton.addEventListener('click', async () => {
    sendButton.disabled = true;
    setStages('pending');
    try {
      await mutate('/api/labs/webhook-demo');
      setStages('complete');
    } catch (error) {
      if (lifecycle.signal.aborted) return;
      setStages('failed');
      state.textContent = message('failed', 'Failed');
      meta.textContent = errorValue(error);
    } finally {
      sendButton.disabled = false;
    }
  }, { signal: lifecycle.signal });
  resetButton.addEventListener('click', async () => {
    try {
      await mutate('/api/labs/webhook-reset');
    } catch (error) {
      if (lifecycle.signal.aborted) return;
      state.textContent = message('failed', 'Failed');
      meta.textContent = errorValue(error);
    }
  }, { signal: lifecycle.signal });

  await refresh();
  if (!lifecycle.signal.aborted) {
    intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 2_000);
  }
}
