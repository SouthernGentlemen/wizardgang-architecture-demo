interface McpConfig {
  messages?: Readonly<Record<string, string>>;
}

function config(root: HTMLElement): McpConfig {
  try { return JSON.parse(root.dataset.config ?? '{}') as McpConfig; } catch { return {}; }
}

export function mount(root: HTMLElement): void {
  const messages = config(root).messages ?? {};
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const output = root.querySelector<HTMLElement>('[data-mcp-output]');
  const run = root.querySelector<HTMLButtonElement>('[data-mcp-run]');
  const copyStatus = root.querySelector<HTMLElement>('[data-copy-status]');
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });

  run?.addEventListener('click', async () => {
    if (!output) return;
    output.hidden = false;
    output.textContent = message('running', 'Running ping…');
    try {
      const response = await fetch('/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2026-07-28',
          'Mcp-Method': 'tools/call',
          'Mcp-Name': 'ping',
        },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'tools/call',
          params: {
            name: 'ping', arguments: {},
            _meta: {
              'io.modelcontextprotocol/protocolVersion': '2026-07-28',
              'io.modelcontextprotocol/clientInfo': { name: 'wizardgang-browser-demo', version: '1.0' },
              'io.modelcontextprotocol/clientCapabilities': {},
            },
          },
        }),
        signal: lifecycle.signal,
      });
      output.textContent = `${response.status} ${response.statusText}\n\n${await response.text()}`;
    } catch (error) {
      if (!lifecycle.signal.aborted) output.textContent = String(error);
    }
  }, { signal: lifecycle.signal });

  root.querySelectorAll<HTMLButtonElement>('[data-copy-value]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyValue ?? '');
        if (copyStatus) copyStatus.textContent = message('copied', 'Endpoint copied.');
      } catch {
        if (copyStatus) copyStatus.textContent = message('clipboardUnavailable', 'Clipboard access was unavailable. Select the endpoint above and copy it manually.');
      }
    }, { signal: lifecycle.signal });
  });
}
