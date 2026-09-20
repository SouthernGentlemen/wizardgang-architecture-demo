import { GRAPHQL_EXAMPLES } from '../demos/graphql-examples';

interface GraphqlBrowserConfig {
  locale?: string;
  messages?: Readonly<Record<string, string>>;
}

function parseConfig(root: HTMLElement): GraphqlBrowserConfig {
  try {
    return JSON.parse(root.dataset.config ?? '{}') as GraphqlBrowserConfig;
  } catch {
    return {};
  }
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`GraphQL presentation is missing ${selector}`);
  return element;
}

export function mount(root: HTMLElement): void {
  const config = parseConfig(root);
  const messages = config.messages ?? {};
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const durationFormat = new Intl.NumberFormat(config.locale ?? 'en', { maximumFractionDigits: 0 });
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });

  const execute = async (query: string, output: HTMLElement, status: HTMLElement, trigger?: HTMLButtonElement) => {
    if (!query.trim()) {
      status.textContent = message('enterQuery', 'Enter a GraphQL query before running it.');
      return;
    }
    if (trigger) trigger.disabled = true;
    status.textContent = message('runningQuery', 'Running query…');
    output.hidden = false;
    output.textContent = message('waitingForResponse', 'Waiting for response…');
    const started = performance.now();
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ query }),
        signal: lifecycle.signal,
      });
      const text = await response.text();
      let formatted = text || message('emptyResponse', '(empty response)');
      let payload: { errors?: unknown[] } | undefined;
      try {
        payload = JSON.parse(text) as { errors?: unknown[] };
        formatted = JSON.stringify(payload, null, 2);
      } catch { /* Preserve non-JSON response text. */ }
      output.textContent = formatted;
      const duration = `${durationFormat.format(performance.now() - started)} ms`;
      const graphQlErrors = Array.isArray(payload?.errors) ? payload.errors.length : 0;
      const outcome = graphQlErrors
        ? `${durationFormat.format(graphQlErrors)} ${message(graphQlErrors === 1 ? 'graphqlError' : 'graphqlErrors', graphQlErrors === 1 ? 'GraphQL error' : 'GraphQL errors')}`
        : response.ok
          ? message('queryComplete', 'Query complete')
          : message('errorResponse', 'Error response');
      status.textContent = `HTTP ${response.status} · ${duration} · ${outcome}`;
    } catch (error) {
      if (!lifecycle.signal.aborted) {
        output.textContent = String(error);
        const duration = `${durationFormat.format(performance.now() - started)} ms`;
        status.textContent = `${message('networkFailure', 'Network failure')} · ${duration}. ${message('reviewError', 'Review the error below.')}`;
      }
    } finally {
      if (trigger) trigger.disabled = false;
    }
  };

  root.querySelectorAll<HTMLButtonElement>('[data-graphql-example]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.graphqlExample);
    const example = GRAPHQL_EXAMPLES[index];
    if (!example) return;
    void execute(
      example.query,
      required(root, `[data-graphql-result="${index}"]`),
      required(root, `[data-graphql-example-status="${index}"]`),
      button,
    );
  }, { signal: lifecycle.signal }));
  required<HTMLFormElement>(root, '[data-graphql-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    void execute(
      required<HTMLTextAreaElement>(root, '[name="query"]').value,
      required(root, '[data-graphql-workspace-result]'),
      required(root, '[data-graphql-runner-status]'),
      required(root, '[data-graphql-run]'),
    );
  }, { signal: lifecycle.signal });
}
