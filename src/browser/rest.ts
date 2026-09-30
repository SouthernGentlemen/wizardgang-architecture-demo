interface RestBrowserConfig {
  locale?: string;
  messages?: Readonly<Record<string, string>>;
}

export interface RestRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

function parseConfig(root: HTMLElement): RestBrowserConfig {
  try { return JSON.parse(root.dataset.config ?? '{}') as RestBrowserConfig; }
  catch { return {}; }
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`REST presentation is missing ${selector}`);
  return element;
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function showUrl(element: HTMLElement, value: string): void {
  element.replaceChildren();
  for (const [index, segment] of value.split('/').entries()) {
    if (index > 0) element.append('/');
    element.append(segment);
    if (index > 1) element.append(document.createElement('wbr'));
  }
}

export function curlForRequest(request: RestRequest): string {
  const parts = [
    'curl --cookie ./wg-rest-demo.cookies --cookie-jar ./wg-rest-demo.cookies',
    '--include',
    `--request ${request.method}`,
    shellQuote(request.url),
  ];
  for (const [name, value] of Object.entries(request.headers)) {
    parts.push(`--header ${shellQuote(`${name}: ${value}`)}`);
  }
  if (request.body !== undefined) parts.push(`--data-raw ${shellQuote(request.body)}`);
  return parts.join(' \\\n  ');
}

export function buildRestRequest(form: HTMLFormElement, origin: string): RestRequest {
  let path = form.dataset.path ?? '';
  const query = new URLSearchParams();
  form.querySelectorAll<HTMLInputElement>('[data-rest-parameter]').forEach((input) => {
    const name = input.dataset.restParameter ?? '';
    if (input.dataset.restParameterIn === 'query') query.set(name, input.value);
    else path = path.replace(`{${name}}`, encodeURIComponent(input.value.trim()));
  });
  const url = new URL(path, origin);
  query.forEach((value, name) => url.searchParams.set(name, value));
  const bodyInput = form.querySelector<HTMLTextAreaElement>('[data-rest-body]');
  const body = bodyInput ? JSON.stringify(JSON.parse(bodyInput.value)) : undefined;
  return {
    method: form.dataset.method ?? 'GET',
    url: url.toString(),
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body }),
  };
}

export function mount(root: HTMLElement): void {
  const config = parseConfig(root);
  const messages = config.messages ?? {};
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });

  root.querySelectorAll<HTMLFormElement>('[data-rest-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const panel = form.closest<HTMLElement>('[data-rest-operation-panel]');
    if (!panel) return;
    const result = required<HTMLElement>(panel, '[data-rest-result]');
    const empty = required<HTMLElement>(result, '[data-rest-response-empty]');
    const details = required<HTMLElement>(result, '[data-rest-response-details]');
    const requestUrl = required<HTMLElement>(result, '[data-rest-request-url]');
    const curl = required<HTMLElement>(result, '[data-rest-curl]');
    const requestOutput = required<HTMLElement>(result, '[data-rest-request]');
    const status = required<HTMLElement>(result, '[data-rest-status]');
    const duration = required<HTMLElement>(result, '[data-rest-duration]');
    const responseHeaders = required<HTMLElement>(result, '[data-rest-response-headers]');
    const responseBody = required<HTMLElement>(result, '[data-rest-response-body]');
    const execute = required<HTMLButtonElement>(form, '[data-rest-execute]');
    empty.hidden = true;
    details.hidden = false;
    let request: RestRequest;
    try {
      request = buildRestRequest(form, window.location.origin);
    } catch {
      requestUrl.textContent = '';
      curl.textContent = '';
      requestOutput.textContent = message('invalidJson', 'Body could not be parsed as JSON.');
      status.textContent = message('requestNotSent', 'Request not sent');
      duration.textContent = '—';
      responseHeaders.textContent = '—';
      responseBody.textContent = message('invalidJson', 'Body could not be parsed as JSON.');
      return;
    }
    showUrl(requestUrl, request.url);
    curl.textContent = curlForRequest(request);
    requestOutput.textContent = JSON.stringify({
      method: request.method,
      headers: request.headers,
      ...(request.body === undefined ? {} : { body: JSON.parse(request.body) }),
    }, null, 2);
    status.textContent = message('sending', 'Sending…');
    duration.textContent = '—';
    responseHeaders.textContent = message('waitingForResponse', 'Waiting for response…');
    responseBody.textContent = message('waitingForResponse', 'Waiting for response…');
    execute.disabled = true;
    const started = performance.now();
    void (async () => {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          ...(request.body === undefined ? {} : { body: request.body }),
          credentials: 'same-origin',
          signal: lifecycle.signal,
        });
        const body = await response.text();
        let formatted = body || message('noContent', '(no content)');
        try { formatted = JSON.stringify(JSON.parse(body), null, 2); } catch { /* Preserve non-JSON response text. */ }
        status.textContent = `${response.status} ${response.statusText}`.trim();
        duration.textContent = `${Math.round(performance.now() - started)} ms`;
        responseHeaders.textContent = [...response.headers.entries()].map(([name, value]) => `${name}: ${value}`).join('\n') || message('noHeaders', '(no headers)');
        responseBody.textContent = formatted;
      } catch (error) {
        if (!lifecycle.signal.aborted) {
          status.textContent = message('requestFailed', 'Request failed');
          duration.textContent = `${Math.round(performance.now() - started)} ms`;
          responseHeaders.textContent = '—';
          responseBody.textContent = String(error);
        }
      } finally {
        execute.disabled = false;
      }
    })();
  }, { signal: lifecycle.signal }));
}
