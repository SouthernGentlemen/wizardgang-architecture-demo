/**
 * Live console shared by /d1 and /api/rest.
 *
 * Reads are anonymous (`demo:read`); writes require a bearer token (`demo:write`).
 * Running a write with an empty token is the point: the visitor sees the shared
 * authorization boundary reject the request instead of reading about it.
 */
export function recordsConsole(): string {
  return `
<section class="panel" aria-labelledby="records-console-heading">
  <h2 id="records-console-heading">Live record console</h2>
  <p class="subtle">These controls call <code>/v1/demo-records</code> — the same D1-backed resource that <a href="/api/graphql">GraphQL</a> and the <a href="/mcp">MCP tool</a> read through the same authorization policy.</p>

  <h3>Read — public</h3>
  <div class="filters">
    <label for="rc-namespace">Namespace<input id="rc-namespace" value="public" maxlength="64" autocomplete="off"></label>
    <button type="button" data-rc="list">GET /v1/demo-records</button>
  </div>
  <div class="table-wrap" style="margin-top:1rem"><table>
    <thead><tr><th>Key</th><th>Value</th><th>Updated</th><th></th></tr></thead>
    <tbody data-rc-rows><tr><td colspan="4">Choose <strong>GET</strong> to load records.</td></tr></tbody>
  </table></div>

  <h3 style="margin-top:2rem">Write — bearer protected</h3>
  <p class="subtle">Leave the token empty and submit. The request is refused before it reaches D1 — <code>401 authentication_required</code> where a token is configured, <code>503 protected_demo_not_configured</code> where none is. Either way the write never happens, and that refusal is the demonstration. An operator holding <code>DEMO_API_TOKEN</code> can paste it to complete the round trip; it is used for this one request and never stored.</p>
  <div class="filters">
    <label for="rc-key">Record key<input id="rc-key" value="visitor-note" maxlength="64" autocomplete="off"></label>
    <label for="rc-value">Value (JSON)<input id="rc-value" value='{"note":"hello"}' autocomplete="off"></label>
    <label for="rc-token">Bearer token (optional)<input id="rc-token" type="password" autocomplete="off" placeholder="empty → 401"></label>
  </div>
  <div class="meta" style="margin-top:1rem">
    <button type="button" data-rc="write">POST /v1/demo-records</button>
    <button type="button" data-rc="delete">DELETE /v1/demo-records/{key}</button>
  </div>
  <div class="field" style="margin-top:1rem"><span>Response</span><pre aria-live="polite" data-rc-out>Ready.</pre></div>
</section>
<script>
(() => {
  const $ = (selector) => document.querySelector(selector);
  const out = $('[data-rc-out]');
  const rows = $('[data-rc-rows]');
  const escape = (value) => String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));

  const show = (status, statusText, payload) => {
    out.textContent = status + ' ' + statusText + '\\n\\n' + (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
  };

  const read = async (response) => {
    if (response.status === 204) return '(no content)';
    const type = response.headers.get('content-type') || '';
    return type.includes('application/json') ? response.json() : response.text();
  };

  const namespace = () => encodeURIComponent($('#rc-namespace').value.trim() || 'public');
  const authorization = () => {
    const token = $('#rc-token').value.trim();
    return token ? { authorization: 'Bearer ' + token } : {};
  };

  async function list() {
    out.textContent = 'Running…';
    const response = await fetch('/v1/demo-records?namespace=' + namespace());
    const payload = await read(response);
    show(response.status, response.statusText, payload);
    const results = (payload && payload.results) || [];
    rows.innerHTML = results.length
      ? results.map((record) =>
          '<tr><td><code>' + escape(record.key) + '</code></td><td><code>' + escape(JSON.stringify(record.value)) +
          '</code></td><td>' + escape(record.updatedAt) + '</td><td><a href="/v1/demo-records/' +
          encodeURIComponent(record.key) + '?namespace=' + namespace() + '">Open</a></td></tr>').join('')
      : '<tr><td colspan="4">No records in this namespace.</td></tr>';
  }

  async function write() {
    out.textContent = 'Running…';
    let value;
    try {
      value = JSON.parse($('#rc-value').value);
    } catch (error) {
      show('—', 'invalid input', 'Value must be valid JSON. ' + error.message);
      return;
    }
    const response = await fetch('/v1/demo-records', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authorization() },
      body: JSON.stringify({ namespace: $('#rc-namespace').value.trim() || 'public', key: $('#rc-key').value.trim(), value }),
    });
    show(response.status, response.statusText, await read(response));
    if (response.ok) await list();
  }

  async function remove() {
    out.textContent = 'Running…';
    const response = await fetch('/v1/demo-records/' + encodeURIComponent($('#rc-key').value.trim()) + '?namespace=' + namespace(), {
      method: 'DELETE',
      headers: authorization(),
    });
    show(response.status, response.statusText, await read(response));
    if (response.ok) await list();
  }

  const handlers = { list, write, delete: remove };
  document.querySelectorAll('[data-rc]').forEach((button) => {
    button.addEventListener('click', () => handlers[button.dataset.rc]().catch((error) => show('—', 'network error', String(error))));
  });

  list().catch(() => {});
})();
</script>`;
}
