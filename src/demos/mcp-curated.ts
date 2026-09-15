import { MCP_PROTOCOL_VERSION, MCP_SERVER_PATH, mcpMetaKeys } from '../api/mcp';
import { escapeHtml } from '../lib/html';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { pageContent, type PageContent } from '../ui/page';

export function curatedMcpContent(request: Request, env: Env): PageContent {
  const endpoint = `${new URL(request.url).origin}${MCP_SERVER_PATH}`;
  const claudeCommand = `claude mcp add --transport http wizardgang ${endpoint}`;
  const codexCommand = `codex mcp add wizardgang --url ${endpoint}`;
  const inspectorCommand = `npx @modelcontextprotocol/inspector --web --server-url ${endpoint} --transport http`;
  const requestBody = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'ping',
      arguments: {},
      _meta: {
        [mcpMetaKeys.protocolVersion]: MCP_PROTOCOL_VERSION,
        [mcpMetaKeys.clientInfo]: { name: 'wizardgang-browser-demo', version: '1.0' },
        [mcpMetaKeys.clientCapabilities]: {},
      },
    },
  };

  const body = `
<section class="page-header">
  <p class="eyebrow">AI / MCP</p>
  <h1>Model Context Protocol</h1>
  <p class="lede">Inspect the live MCP boundary, run one representative read-only tool, then copy the endpoint into a compatible client.</p>
  <div class="request-line"><span class="http-method http-post">MCP</span><code id="mcp-endpoint">${escapeHtml(endpoint)}</code></div>
</section>

<section aria-labelledby="mcp-tools-heading">
  <div class="section-head"><h2 id="mcp-tools-heading">Available tools</h2><span>2 read-only tools</span></div>
  <div class="grid">
    <article class="card"><p class="eyebrow">Tool</p><h3><code>ping</code></h3><p>Verify that an MCP client can reach the live server boundary.</p></article>
    <article class="card"><p class="eyebrow">Tool</p><h3><code>list_demo_records</code></h3><p>Read bounded public demonstration records through the normal D1 authorization path.</p></article>
  </div>
</section>

<section class="action-card" aria-labelledby="mcp-run-heading">
  <h2 id="mcp-run-heading">Run <code>ping</code></h2>
  <p>Execute the representative tool directly against the deployed MCP endpoint.</p>
  <button class="button-primary" type="button" data-mcp-run>Run ping</button>
  <pre class="action-output" aria-live="polite" data-mcp-output hidden></pre>
</section>

<section aria-labelledby="mcp-connect-heading">
  <div class="section-head"><h2 id="mcp-connect-heading">Connect a client</h2><span>Copy the endpoint or one command</span></div>
  <div class="link-row">
    <button type="button" data-copy-value="${escapeHtml(endpoint)}">Copy endpoint</button>
  </div>
  <p class="subtle" data-copy-status aria-live="polite"></p>
  <details class="implementation-notes">
    <summary>Advanced client setup and wire details</summary>
    <div class="info-grid">
      <article class="info-card"><h3>Claude Code</h3><pre>${escapeHtml(claudeCommand)}</pre></article>
      <article class="info-card"><h3>Codex CLI</h3><pre>${escapeHtml(codexCommand)}</pre></article>
      <article class="info-card"><h3>MCP Inspector</h3><pre>${escapeHtml(inspectorCommand)}</pre></article>
    </div>
    <details><summary>Representative request headers</summary><pre>MCP-Protocol-Version: ${escapeHtml(MCP_PROTOCOL_VERSION)}
Mcp-Method: tools/call
Mcp-Name: ping</pre></details>
    <details><summary>Representative JSON-RPC request</summary><pre>${escapeHtml(JSON.stringify(requestBody, null, 2))}</pre></details>
    <details><summary>Latest public demo MCP activity</summary><p class="subtle">Activity history remains outside the default success path so the primary walkthrough stays focused on endpoint, tools, one executable call, result, and connection guidance.</p></details>
    <p class="subtle">Transport: Streamable HTTP · protocol ${escapeHtml(MCP_PROTOCOL_VERSION)} · public read-only demo authorization.</p>
  </details>
</section>

<script>
(() => {
  const output = document.querySelector('[data-mcp-output]');
  const run = document.querySelector('[data-mcp-run]');
  const copyStatus = document.querySelector('[data-copy-status]');
  if (run && output) run.addEventListener('click', async () => {
    output.hidden = false;
    output.textContent = 'Running ping…';
    try {
      const response = await fetch(${JSON.stringify(MCP_SERVER_PATH)}, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json, text/event-stream',
          'MCP-Protocol-Version': ${JSON.stringify(MCP_PROTOCOL_VERSION)},
          'Mcp-Method': 'tools/call',
          'Mcp-Name': 'ping',
        },
        body: ${JSON.stringify(JSON.stringify(requestBody))},
      });
      output.textContent = response.status + ' ' + response.statusText + '\\n\\n' + await response.text();
    } catch (error) {
      output.textContent = String(error);
    }
  });
  document.querySelectorAll('[data-copy-value]').forEach((button) => button.addEventListener('click', async () => {
    const value = button.getAttribute('data-copy-value') || '';
    try {
      await navigator.clipboard.writeText(value);
      if (copyStatus) copyStatus.textContent = 'Endpoint copied.';
    } catch {
      if (copyStatus) copyStatus.textContent = 'Clipboard access was unavailable. Select the endpoint above and copy it manually.';
    }
  }));
})();
</script>`;

  return pageContent(env, 'Model Context Protocol', body, {
    canonicalPath: `${routeUrl('demos.index')}#mcp`,
    description: 'Live MCP endpoint, read-only tool inventory, representative executable call, and optional client connection guidance.',
  });
}
