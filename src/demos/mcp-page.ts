import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { recentApplicationLogs, type ApplicationLogRow } from '../lib/logs';
import { MCP_MODERN_PROTOCOL_VERSION, MCP_SERVER_PATH, mcpMetaKeys } from '../api/mcp';
import { referenceDetails, shell } from '../ui/page';

interface McpActivity {
  id: number;
  createdAt: string;
  clientName: string;
  clientVersion: string;
  protocolVersion: string;
  method: string;
  tool: string;
  authMode: string;
  result: string;
  durationMs: number;
  resultCount?: number;
}

function activityFromLog(log: ApplicationLogRow | undefined): McpActivity | undefined {
  if (!log?.detail_json) return undefined;
  try {
    const detail = JSON.parse(log.detail_json) as Record<string, unknown>;
    if (detail.method !== 'tools/call' || typeof detail.tool !== 'string') return undefined;
    return {
      id: log.id,
      createdAt: log.created_at,
      clientName: typeof detail.clientName === 'string' ? detail.clientName : 'unknown-mcp-client',
      clientVersion: typeof detail.clientVersion === 'string' ? detail.clientVersion : 'unreported',
      protocolVersion: typeof detail.protocolVersion === 'string' ? detail.protocolVersion : 'unreported',
      method: detail.method,
      tool: detail.tool,
      authMode: `${typeof detail.authMode === 'string' ? detail.authMode : 'public'} / demo:read`,
      result: typeof detail.result === 'string' ? detail.result : 'success',
      durationMs: typeof detail.durationMs === 'number' ? detail.durationMs : 0,
      ...(typeof detail.resultCount === 'number' ? { resultCount: detail.resultCount } : {}),
    };
  } catch {
    return undefined;
  }
}

function activityValue(activity: McpActivity | undefined, key: keyof McpActivity, fallback = '—'): string {
  const value = activity?.[key];
  return value === undefined ? fallback : String(value);
}

export async function renderMcpDemo(request: Request, env: Env): Promise<Response> {
  const endpoint = `${new URL(request.url).origin}${MCP_SERVER_PATH}`;
  const activity = activityFromLog((await recentApplicationLogs(env, { source: 'mcp', limit: 1 }))[0]);
  const claudeCommand = `claude mcp add --transport http wizardgang ${endpoint}`;
  const codexCommand = `codex mcp add wizardgang --url ${endpoint}`;
  const inspectorCommand = `npx @modelcontextprotocol/inspector --web --server-url ${endpoint} --transport http`;
  const curlCommand = `curl ${endpoint} \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -H 'MCP-Protocol-Version: ${MCP_MODERN_PROTOCOL_VERSION}' \\
  -H 'Mcp-Method: tools/call' \\
  -H 'Mcp-Name: ping' \\
  --data '${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'ping',
      arguments: {},
      _meta: {
        [mcpMetaKeys.protocolVersion]: MCP_MODERN_PROTOCOL_VERSION,
        [mcpMetaKeys.clientInfo]: { name: 'curl', version: '1.0' },
        [mcpMetaKeys.clientCapabilities]: {},
      },
    },
  }, null, 2)}'`;
  const initialRequest = activity
    ? { method: activity.method, params: { name: activity.tool, arguments: activity.tool === 'ping' ? {} : { namespace: 'public' } } }
    : { method: 'tools/call', params: { name: 'ping', arguments: {} } };
  const initialResponse = activity
    ? { result: activity.result, ...(activity.resultCount === undefined ? {} : { resultCount: activity.resultCount }) }
    : { status: 'waiting for the first invocation' };

  const body = `
<section class="page-header mcp-page-header">
  <p class="eyebrow"><a href="/#interfaces">Interfaces</a> / MCP</p>
  <h1>Model Context Protocol</h1>
  <p class="lede">Connect Claude, Codex, or any compatible MCP client to the live demo and invoke read-only tools through the same application permissions used by the rest of the platform.</p>
  <div class="mcp-badges" aria-label="MCP server characteristics">
    <span class="badge badge-ok">Streamable HTTP</span>
    <span class="badge">Public read-only</span>
    <span class="badge">MCP ${MCP_MODERN_PROTOCOL_VERSION}</span>
    <span class="badge">Legacy compatible</span>
  </div>
  <div class="mcp-endpoint">
    <span>Endpoint</span>
    <code id="mcp-endpoint">${escapeHtml(endpoint)}</code>
    <button type="button" data-copy-target="mcp-endpoint">Copy endpoint</button>
  </div>
  <div class="page-tools">
    <a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/mcp.ts'))}">Route source</a>
    ${referenceDetails([
      { label: 'MCP server', href: sourceUrl(env, 'src/api/mcp.ts') },
      { label: 'Tool contract', href: sourceUrl(env, 'contracts/mcp/tools.json') },
      { label: 'Interoperability tests', href: sourceUrl(env, 'tests/mcp-client.test.ts') },
      { label: 'Shared authorization', href: sourceUrl(env, 'src/lib/authorization.ts') },
    ], 'Implementation details')}
  </div>
</section>

<section class="mcp-section" aria-labelledby="mcp-connect-heading">
  <div class="section-head"><h2 id="mcp-connect-heading">Connect</h2><span>Choose a client</span></div>
  <div class="mcp-connect panel">
    <div class="mcp-tabs" role="tablist" aria-label="MCP client setup">
      ${['Claude Code', 'Codex CLI', 'curl', 'Inspector'].map((label, index) => `<button type="button" role="tab" id="mcp-tab-${index}" aria-controls="mcp-panel-${index}" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}" data-mcp-tab="${index}">${label}</button>`).join('')}
    </div>
    <div class="mcp-tab-panel" role="tabpanel" id="mcp-panel-0" aria-labelledby="mcp-tab-0" data-mcp-panel="0">
      <p class="eyebrow">Claude Code</p>
      <h3>Add the remote HTTP server</h3>
      <div class="mcp-command"><pre id="mcp-claude-command">${escapeHtml(claudeCommand)}</pre><button type="button" data-copy-target="mcp-claude-command">Copy</button></div>
      <p>Confirm it with <code>claude mcp get wizardgang</code>, launch <code>claude</code>, open <code>/interfaces?view=mcp</code>, then ask:</p>
      <blockquote>Use the wizardgang MCP server and call its ping tool.</blockquote>
    </div>
    <div class="mcp-tab-panel" role="tabpanel" id="mcp-panel-1" aria-labelledby="mcp-tab-1" data-mcp-panel="1" hidden>
      <p class="eyebrow">Codex CLI <span>OpenAI / ChatGPT</span></p>
      <h3>Add the remote HTTP server</h3>
      <div class="mcp-command"><pre id="mcp-codex-command">${escapeHtml(codexCommand)}</pre><button type="button" data-copy-target="mcp-codex-command">Copy</button></div>
      <p>Confirm it with <code>codex mcp list</code>, launch <code>codex</code>, open <code>/interfaces?view=mcp</code>, then ask:</p>
      <blockquote>Use the wizardgang MCP server and ping it.</blockquote>
      <p class="subtle">Codex CLI, the ChatGPT desktop app, and the IDE extension share MCP configuration on the same Codex host. ChatGPT web uses plugin-provided remote MCP tools instead of local Codex configuration.</p>
    </div>
    <div class="mcp-tab-panel" role="tabpanel" id="mcp-panel-2" aria-labelledby="mcp-tab-2" data-mcp-panel="2" hidden>
      <p class="eyebrow">Wire-level verification</p>
      <h3>Call <code>ping</code> without a handshake</h3>
      <div class="mcp-command mcp-command-tall"><pre id="mcp-curl-command">${escapeHtml(curlCommand)}</pre><button type="button" data-copy-target="mcp-curl-command">Copy</button></div>
      <p class="subtle">The request carries the modern protocol version, method, tool name, client identity, and capabilities in the headers and per-request metadata required by MCP ${MCP_MODERN_PROTOCOL_VERSION}.</p>
    </div>
    <div class="mcp-tab-panel" role="tabpanel" id="mcp-panel-3" aria-labelledby="mcp-tab-3" data-mcp-panel="3" hidden>
      <p class="eyebrow">MCP Inspector</p>
      <h3>Inspect discovery, schemas, and calls visually</h3>
      <div class="mcp-command"><pre id="mcp-inspector-command">${escapeHtml(inspectorCommand)}</pre><button type="button" data-copy-target="mcp-inspector-command">Copy</button></div>
      <p>The Inspector opens locally with this Streamable HTTP server preconfigured.</p>
    </div>
    <p class="mcp-copy-status" data-copy-status aria-live="polite"></p>
  </div>
</section>

<section class="mcp-section" aria-labelledby="mcp-tools-heading">
  <div class="section-head"><h2 id="mcp-tools-heading">Available tools</h2><span>2 read-only tools</span></div>
  <div class="mcp-tool-grid">
    <article class="panel mcp-tool-card">
      <div><code>ping</code><span class="badge badge-ok">Read only</span></div>
      <p>Verify that an MCP client can reach the WizardGang server.</p>
      <dl><dt>Input</dt><dd><pre>{}</pre></dd><dt>Output</dt><dd><pre>{ "ok": true, "server": "wizardgang-architecture-demo", "transport": "streamable-http", "timestamp": "…" }</pre></dd></dl>
    </article>
    <article class="panel mcp-tool-card">
      <div><code>list_demo_records</code><span class="badge badge-ok">Read only</span></div>
      <p>Read bounded public demonstration records through the normal D1 authorization boundary.</p>
      <dl><dt>Input</dt><dd><pre>{ "namespace": "public" }</pre></dd><dt>Output</dt><dd><pre>{ "results": [{ "id": 7, "namespace": "public", "key": "architecture", "valueJson": "{…}" }] }</pre></dd></dl>
    </article>
  </div>
</section>

<section class="mcp-section" aria-labelledby="mcp-activity-heading" data-mcp-activity-id="${activity?.id ?? 0}">
  <div class="section-head"><h2 id="mcp-activity-heading">Live MCP activity</h2><span>Sanitized operational evidence</span></div>
  <div class="panel mcp-activity">
    <div class="mcp-activity-state"><span class="mcp-pulse" aria-hidden="true"></span><strong data-mcp-field="state">${activity ? 'CONNECTED' : 'WAITING'}</strong><span data-mcp-field="createdAt">${escapeHtml(activityValue(activity, 'createdAt', 'Run ping from a client'))}</span></div>
    <dl class="mcp-activity-grid">
      <div><dt>Client</dt><dd data-mcp-field="clientName">${escapeHtml(activityValue(activity, 'clientName'))}</dd></div>
      <div><dt>Client version</dt><dd data-mcp-field="clientVersion">${escapeHtml(activityValue(activity, 'clientVersion'))}</dd></div>
      <div><dt>Protocol</dt><dd data-mcp-field="protocolVersion">${escapeHtml(activityValue(activity, 'protocolVersion'))}</dd></div>
      <div><dt>Tool</dt><dd data-mcp-field="tool">${escapeHtml(activityValue(activity, 'tool'))}</dd></div>
      <div><dt>Authorization</dt><dd data-mcp-field="authMode">${escapeHtml(activityValue(activity, 'authMode'))}</dd></div>
      <div><dt>Result</dt><dd data-mcp-field="result">${escapeHtml(activityValue(activity, 'result'))}</dd></div>
      <div><dt>Server duration</dt><dd><span data-mcp-field="durationMs">${escapeHtml(activity ? `${activity.durationMs} ms` : '—')}</span></dd></div>
    </dl>
    <div class="mcp-evidence-grid">
      <details><summary>View sanitized request</summary><pre data-mcp-request>${escapeHtml(JSON.stringify(initialRequest, null, 2))}</pre></details>
      <details><summary>View sanitized response</summary><pre data-mcp-response>${escapeHtml(JSON.stringify(initialResponse, null, 2))}</pre></details>
    </div>
    <p class="subtle">Client name, version, protocol, tool, authorization mode, result, and duration are retained. Credentials, IP addresses, request bodies, and arbitrary client metadata are not.</p>
  </div>
</section>

<section class="mcp-section" aria-labelledby="mcp-architecture-heading">
  <div class="section-head"><h2 id="mcp-architecture-heading">Architecture</h2><span>One shared trust boundary</span></div>
  <div class="panel mcp-architecture">
    <div class="mcp-flow" aria-label="AI client through Streamable HTTP, MCP, authorization, D1, and audit log">
      ${['AI Client', 'Streamable HTTP', 'MCP', 'Application Authorization', 'D1', 'Audit Log'].map((label, index) => `${index ? '<span aria-hidden="true">→</span>' : ''}<strong>${label}</strong>`).join('')}
    </div>
    <h3>MCP is another interface—not another trust boundary.</h3>
    <p>The same application policy governs REST, GraphQL, and MCP. Anonymous clients receive <code>demo:read</code>; bearer-authenticated clients can receive <code>demo:read</code> and <code>demo:write</code>, although this public MCP catalog exposes only read-only tools.</p>
  </div>
</section>

<details class="implementation-notes"><summary>What this route proves</summary><ul>
  <li>Real MCP clients connect through the official Streamable HTTP transport.</li>
  <li>MCP ${MCP_MODERN_PROTOCOL_VERSION} and stateless 2025-era clients share one SDK-backed tool implementation.</li>
  <li>Tool discovery exposes explicit input schemas, output schemas, and read-only behavioral annotations.</li>
  <li><code>list_demo_records</code> returns one normalized public contract while D1 column names remain behind the repository boundary.</li>
  <li>Every successful tool invocation records bounded, sanitized operational evidence.</li>
  <li>The official TypeScript MCP client performs discovery and both tool calls in CI.</li>
</ul></details>
<nav class="meta mcp-pager" aria-label="Interfaces routes"><a href="/interfaces?view=identity">← Authentication &amp; Authorization</a><a href="/interfaces?view=i18n">Internationalization →</a></nav>

<script>
(() => {
  const tabs = [...document.querySelectorAll('[data-mcp-tab]')];
  const panels = [...document.querySelectorAll('[data-mcp-panel]')];
  const selectTab = (index, focus = false) => {
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panels.forEach((panel, panelIndex) => { panel.hidden = panelIndex !== index; });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      selectTab((index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
    });
  });

  const copyStatus = document.querySelector('[data-copy-status]');
  document.querySelectorAll('[data-copy-target]').forEach((button) => button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyTarget || '');
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent || '');
      if (copyStatus) copyStatus.textContent = 'Copied to clipboard.';
    } catch {
      if (copyStatus) copyStatus.textContent = 'Clipboard access was unavailable. Select and copy the command above.';
    }
  }));

  const activityRoot = document.querySelector('[data-mcp-activity-id]');
  const setField = (name, value) => {
    const slot = activityRoot?.querySelector('[data-mcp-field="' + name + '"]');
    if (slot) slot.textContent = String(value);
  };
  const refreshActivity = async () => {
    if (!activityRoot || document.hidden) return;
    try {
      const response = await fetch('/__api/operations/logs?source=mcp&limit=1', { headers: { accept: 'application/json' } });
      if (!response.ok) return;
      const row = (await response.json()).results?.[0];
      if (!row || String(row.id) === activityRoot.dataset.mcpActivityId || !row.detail_json) return;
      const detail = JSON.parse(row.detail_json);
      if (detail.method !== 'tools/call' || !detail.tool) return;
      activityRoot.dataset.mcpActivityId = String(row.id);
      setField('state', 'CONNECTED');
      setField('createdAt', row.created_at);
      for (const key of ['clientName', 'clientVersion', 'protocolVersion', 'tool', 'result']) setField(key, detail[key] ?? '—');
      setField('authMode', (detail.authMode || 'public') + ' / demo:read');
      setField('durationMs', typeof detail.durationMs === 'number' ? detail.durationMs + ' ms' : '—');
      const requestSlot = activityRoot.querySelector('[data-mcp-request]');
      const responseSlot = activityRoot.querySelector('[data-mcp-response]');
      if (requestSlot) requestSlot.textContent = JSON.stringify({ method: detail.method, params: { name: detail.tool, arguments: detail.tool === 'ping' ? {} : { namespace: detail.namespace || 'public' } } }, null, 2);
      if (responseSlot) responseSlot.textContent = JSON.stringify({ result: detail.result, ...(typeof detail.resultCount === 'number' ? { resultCount: detail.resultCount } : {}) }, null, 2);
    } catch {
      // The last known activity remains visible when polling is temporarily unavailable.
    }
  };
  window.setInterval(refreshActivity, 3000);
})();
</script>`;

  return shell(env, 'Model Context Protocol', body, {
    activeRoute: '/interfaces',
    cacheControl: 'no-store',
    description: 'Connect a real MCP client to the live WizardGang server, discover read-only tools, invoke ping, and inspect sanitized activity evidence.',
  });
}
