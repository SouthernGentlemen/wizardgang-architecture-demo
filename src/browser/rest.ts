interface RestBrowserConfig {
  locale?: string;
  messages?: Readonly<Record<string, string>>;
}

function parseConfig(root: HTMLElement): RestBrowserConfig {
  try {
    return JSON.parse(root.dataset.config ?? '{}') as RestBrowserConfig;
  } catch {
    return {};
  }
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`REST presentation is missing ${selector}`);
  return element;
}

export function mount(root: HTMLElement): void {
  const config = parseConfig(root);
  const messages = config.messages ?? {};
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const lifecycle = new AbortController();
  const timeoutIds = new Set<number>();
  root.addEventListener('demo:deactivate', () => {
    lifecycle.abort();
    timeoutIds.forEach((id) => window.clearTimeout(id));
    timeoutIds.clear();
  }, { once: true });

  const all = <T extends Element>(selector: string, parent: ParentNode = root) => [...parent.querySelectorAll<T>(selector)];
  const resetButtonText = (button: HTMLButtonElement, value: string) => {
    button.textContent = value;
    const id = window.setTimeout(() => {
      timeoutIds.delete(id);
      if (!lifecycle.signal.aborted) button.textContent = message('copy', 'Copy');
    }, 1200);
    timeoutIds.add(id);
  };
  const selectTabs = (buttons: HTMLButtonElement[], panels: HTMLElement[], selected: number, moveFocus = false) => {
    buttons.forEach((button, index) => {
      button.setAttribute('aria-selected', String(index === selected));
      button.tabIndex = index === selected ? 0 : -1;
    });
    panels.forEach((panel, index) => { panel.hidden = index !== selected; });
    if (moveFocus) buttons[selected]?.focus();
  };
  const selectOperation = (operationId: string) => {
    all<HTMLButtonElement>('[data-rest-operation-select]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.restOperationSelect === operationId));
    });
    all<HTMLElement>('[data-rest-operation-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.restOperationPanel !== operationId;
    });
  };

  all<HTMLButtonElement>('[data-rest-operation-select]').forEach((button) => {
    button.addEventListener('click', () => selectOperation(button.dataset.restOperationSelect ?? ''), { signal: lifecycle.signal });
  });
  root.querySelector<HTMLButtonElement>('[data-copy-server]')?.addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    void navigator.clipboard.writeText(button.dataset.copyServer ?? '').then(() => {
      resetButtonText(button, message('copied', 'Copied'));
    });
  }, { signal: lifecycle.signal });
  all<HTMLButtonElement>('[data-code-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const operation = button.closest<HTMLElement>('[data-rest-operation-panel]');
      if (!operation) return;
      selectTabs(all('[data-code-tab]', operation), all('[data-code-panel]', operation), Number(button.dataset.codeTab));
    }, { signal: lifecycle.signal });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const operation = button.closest<HTMLElement>('[data-rest-operation-panel]');
      if (!operation) return;
      const buttons = all<HTMLButtonElement>('[data-code-tab]', operation);
      const panels = all<HTMLElement>('[data-code-panel]', operation);
      const current = buttons.indexOf(button);
      const tablist = button.closest<HTMLElement>('[role="tablist"]');
      const rtl = tablist ? getComputedStyle(tablist).direction === 'rtl' : false;
      let next = current;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else if (event.key === 'ArrowRight') next = (current + (rtl ? -1 : 1) + buttons.length) % buttons.length;
      else next = (current + (rtl ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      selectTabs(buttons, panels, next, true);
    }, { signal: lifecycle.signal });
  });
  all<HTMLButtonElement>('[data-copy-code]').forEach((button) => button.addEventListener('click', () => {
    const operation = button.closest<HTMLElement>('[data-rest-operation-panel]');
    if (!operation) return;
    const selected = all<HTMLElement>('[data-code-panel]', operation).find((panel) => !panel.hidden);
    void navigator.clipboard.writeText(selected?.textContent ?? '').then(() => {
      button.textContent = message('copied', 'Copied');
      const id = window.setTimeout(() => {
        timeoutIds.delete(id);
        if (!lifecycle.signal.aborted) button.textContent = message('copySelected', 'Copy selected code sample');
      }, 1200);
      timeoutIds.add(id);
    });
  }, { signal: lifecycle.signal }));
  all<HTMLFormElement>('[data-rest-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const panel = form.closest<HTMLElement>('[data-rest-operation-panel]');
    if (!panel) return;
    const result = required<HTMLElement>(panel, '[data-rest-result]');
    const empty = required<HTMLElement>(result, '[data-rest-response-empty]');
    const details = required<HTMLElement>(result, '[data-rest-response-details]');
    const requestUrl = required<HTMLElement>(result, '[data-rest-request-url]');
    const requestOutput = required<HTMLElement>(result, '[data-rest-request]');
    const status = required<HTMLElement>(result, '[data-rest-status]');
    const responseHeaders = required<HTMLElement>(result, '[data-rest-response-headers]');
    const responseBody = required<HTMLElement>(result, '[data-rest-response-body]');
    const execute = required<HTMLButtonElement>(form, '[data-rest-execute]');
    let path = form.dataset.path ?? '';
    all<HTMLInputElement>('[data-rest-parameter]', panel).forEach((input) => {
      path = path.replace(`{${input.dataset.restParameter}}`, encodeURIComponent(input.value.trim()));
    });
    const url = new URL(path, window.location.origin).toString();
    const bodyInput = panel.querySelector<HTMLTextAreaElement>('[data-rest-body]');
    const headers: Record<string, string> = {};
    let body: string | undefined;
    try {
      if (bodyInput) {
        body = JSON.stringify(JSON.parse(bodyInput.value));
        headers['content-type'] = 'application/json';
      }
    } catch (error) {
      empty.hidden = true;
      details.hidden = false;
      requestUrl.textContent = url;
      requestOutput.textContent = message('invalidJson', 'Body could not be parsed as JSON.');
      status.textContent = message('requestNotSent', 'Request not sent');
      responseHeaders.textContent = '—';
      responseBody.textContent = String(error);
      return;
    }
    empty.hidden = true;
    details.hidden = false;
    requestUrl.textContent = url;
    requestOutput.textContent = JSON.stringify({ method: form.dataset.method, headers, ...(body ? { body: JSON.parse(body) } : {}) }, null, 2);
    status.textContent = message('sending', 'Sending…');
    responseHeaders.textContent = message('waitingForResponse', 'Waiting for response…');
    responseBody.textContent = message('waitingForResponse', 'Waiting for response…');
    execute.disabled = true;
    void (async () => {
      try {
        const response = await fetch(path, {
          method: form.dataset.method,
          headers,
          ...(body ? { body } : {}),
          signal: lifecycle.signal,
        });
        const text = await response.text();
        let formatted = text || message('noContent', '(no content)');
        try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch { /* Preserve non-JSON response text. */ }
        status.textContent = `${response.status} ${response.statusText}`;
        responseHeaders.textContent = [...response.headers.entries()].map(([name, value]) => `${name}: ${value}`).join('\n') || message('noHeaders', '(no headers)');
        responseBody.textContent = formatted;
      } catch (error) {
        if (!lifecycle.signal.aborted) {
          status.textContent = message('requestFailed', 'Request failed');
          responseHeaders.textContent = '—';
          responseBody.textContent = String(error);
        }
      } finally {
        execute.disabled = false;
      }
    })();
  }, { signal: lifecycle.signal }));
}
