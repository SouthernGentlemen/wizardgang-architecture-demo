import openapi from '../../contracts/openapi/openapi.json';
import { escapeHtml } from '../lib/html';

type JsonObject = Record<string, unknown>;

interface OpenApiDocument extends JsonObject {
  openapi: string;
  jsonSchemaDialect?: string;
  info?: JsonObject;
  servers?: Array<{ url?: string }>;
  components?: {
    schemas?: Record<string, JsonObject>;
  };
  paths: Record<string, JsonObject>;
}

interface OperationEntry {
  method: string;
  path: string;
  operation: JsonObject;
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

function resolveRef(value: JsonObject, spec: OpenApiDocument): JsonObject {
  const ref = typeof value.$ref === 'string' ? value.$ref : '';
  if (!ref.startsWith('#/')) return value;
  const resolved = ref.slice(2).split('/').reduce<unknown>((current, segment) => {
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~');
    return asObject(current)[key];
  }, spec);
  return asObject(resolved);
}

function parameters(value: unknown, spec: OpenApiDocument): JsonObject[] {
  return Array.isArray(value) ? value.map(asObject).map((parameter) => resolveRef(parameter, spec)) : [];
}

function operationEntries(spec: OpenApiDocument): OperationEntry[] {
  return Object.entries(spec.paths).flatMap(([path, item]) => Object.entries(asObject(item))
    .filter(([method, operation]) => HTTP_METHODS.has(method.toLowerCase()) && asObject(operation)['x-explorer-hidden'] !== true)
    .map(([method, operation]) => ({ method: method.toUpperCase(), path, operation: asObject(operation) })));
}

function refName(schema: JsonObject): string | null {
  const ref = typeof schema.$ref === 'string' ? schema.$ref : '';
  return ref.startsWith('#/components/schemas/') ? ref.slice('#/components/schemas/'.length).split('/')[0] : null;
}

function resolveSchema(schema: JsonObject, spec: OpenApiDocument): JsonObject {
  return resolveRef(schema, spec);
}

function schemaType(schema: JsonObject, spec: OpenApiDocument): string {
  const reference = refName(schema);
  if (reference) return reference;
  const resolved = resolveSchema(schema, spec);
  if (resolved.type === 'array') return `array<${schemaType(asObject(resolved.items), spec) || 'any'}>`;
  return typeof resolved.type === 'string' ? resolved.type : 'any';
}

function exampleForSchema(schema: JsonObject, spec: OpenApiDocument, depth = 0): unknown {
  if (depth > 5) return null;
  const resolved = resolveSchema(schema, spec);
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  if (Array.isArray(resolved.enum) && resolved.enum.length) return resolved.enum[0];
  if (resolved.const !== undefined) return resolved.const;
  if (resolved.type === 'array') return [exampleForSchema(asObject(resolved.items), spec, depth + 1)];
  if (resolved.type === 'object' || resolved.properties) {
    return Object.fromEntries(Object.entries(asObject(resolved.properties)).map(([name, property]) => [name, exampleForSchema(asObject(property), spec, depth + 1)]));
  }
  if (resolved.type === 'integer' || resolved.type === 'number') return 0;
  if (resolved.type === 'boolean') return false;
  if (resolved.type === 'string') return resolved.format === 'date-time' ? '2026-09-02T12:00:00.000Z' : 'string';
  return null;
}

function operationId(entry: OperationEntry): string {
  return `api-${entry.method.toLowerCase()}-${entry.path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function inputValue(parameter: JsonObject): string {
  const schema = asObject(parameter.schema);
  if (parameter.example !== undefined) return String(parameter.example);
  if (schema.example !== undefined) return String(schema.example);
  if (schema.default !== undefined) return String(schema.default);
  return '';
}

function renderParameterInput(parameter: JsonObject, id: string, spec: OpenApiDocument): string {
  const name = String(parameter.name ?? 'parameter');
  const location = String(parameter.in ?? 'query');
  const required = Boolean(parameter.required);
  const description = typeof parameter.description === 'string' ? parameter.description : '';
  const schema = asObject(parameter.schema);
  return `<label for="${escapeHtml(`${id}-${location}-${name}`)}">${escapeHtml(name)} <span class="parameter-meta">${escapeHtml(location)} · ${required ? 'required' : 'optional'} · ${escapeHtml(schemaType(schema, spec))}</span>
    <input id="${escapeHtml(`${id}-${location}-${name}`)}" data-api-param data-parameter-name="${escapeHtml(name)}" data-parameter-in="${escapeHtml(location)}" value="${escapeHtml(inputValue(parameter))}"${required ? ' required' : ''} autocomplete="off">
    ${description ? `<span class="input-help">${escapeHtml(description)}</span>` : ''}
  </label>`;
}

function requestBody(operation: JsonObject, spec: OpenApiDocument): { schema: JsonObject; example?: unknown } | null {
  const body = resolveRef(asObject(operation.requestBody), spec);
  if (!Object.keys(body).length) return null;
  const media = asObject(asObject(body.content)['application/json']);
  const schema = asObject(media.schema);
  if (!Object.keys(schema).length) return null;
  return { schema, ...(media.example !== undefined ? { example: media.example } : {}) };
}

function serverUrl(spec: OpenApiDocument): string {
  return spec.servers?.[0]?.url?.replace(/\/$/, '') || 'https://demo.wizardgang.ai/v1';
}

function basePath(spec: OpenApiDocument): string {
  try {
    return new URL(serverUrl(spec)).pathname.replace(/\/$/, '');
  } catch {
    return '/v1';
  }
}

function exampleRequest(entry: OperationEntry, spec: OpenApiDocument): { url: string; body?: string } {
  const operationParameters = parameters(entry.operation.parameters, spec);
  let path = entry.path;
  const query = new URLSearchParams();
  for (const parameter of operationParameters) {
    const value = inputValue(parameter);
    if (!value) continue;
    if (parameter.in === 'path') path = path.replace(`{${String(parameter.name)}}`, encodeURIComponent(value));
    if (parameter.in === 'query') query.set(String(parameter.name), value);
  }
  const bodyDefinition = requestBody(entry.operation, spec);
  const bodyValue = bodyDefinition?.example ?? (bodyDefinition ? exampleForSchema(bodyDefinition.schema, spec) : undefined);
  const body = bodyDefinition ? JSON.stringify(bodyValue, null, 2) : undefined;
  return { url: `${serverUrl(spec)}${path}${query.size ? `?${query}` : ''}`, ...(body ? { body } : {}) };
}

function codeExamples(entry: OperationEntry, spec: OpenApiDocument): string[] {
  const example = exampleRequest(entry, spec);
  const secured = Array.isArray(entry.operation.security) && entry.operation.security.length > 0;
  const body = example.body;
  const curl = [`curl${entry.method === 'GET' ? '' : ` -X ${entry.method}`} "${example.url}"`, ...(secured ? ['  -H "Authorization: Bearer $DEMO_TOKEN"'] : []), ...(body ? ['  -H "Content-Type: application/json"', `  --data '${body.replaceAll('\n', '')}'`] : [])].join(' \\\n');
  const javascript = `const response = await fetch('${example.url}', {\n  method: '${entry.method}',${secured ? "\n  headers: { Authorization: 'Bearer ' + demoToken" + (body ? ", 'Content-Type': 'application/json'" : '') + ' },' : body ? "\n  headers: { 'Content-Type': 'application/json' }," : ''}${body ? `\n  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),` : ''}\n});\nconsole.log(await response${entry.method === 'DELETE' ? '.text()' : '.json()'});`;
  const python = `import os\nimport requests\n\nresponse = requests.${entry.method.toLowerCase()}(\n    '${example.url}',${secured ? "\n    headers={'Authorization': 'Bearer ' + os.environ['DEMO_TOKEN']}," : ''}${body ? `\n    json=${body.replaceAll('null', 'None').replaceAll('true', 'True').replaceAll('false', 'False')},` : ''}\n)\nprint(response.status_code, response.text)`;
  const csharp = `using System.Net.Http.Headers;${body ? '\nusing System.Text;' : ''}\n\nusing var client = new HttpClient();${secured ? "\nclient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(\"Bearer\", Environment.GetEnvironmentVariable(\"DEMO_TOKEN\"));" : ''}\nvar request = new HttpRequestMessage(HttpMethod.${entry.method[0]}${entry.method.slice(1).toLowerCase()}, "${example.url}");${body ? `\nrequest.Content = new StringContent(\"\"\"\n${body}\n\"\"\", Encoding.UTF8, \"application/json\");` : ''}\nvar response = await client.SendAsync(request);\nConsole.WriteLine(await response.Content.ReadAsStringAsync());`;
  return [curl, javascript, python, csharp];
}

function renderOperation(entry: OperationEntry, index: number, spec: OpenApiDocument): string {
  const id = operationId(entry);
  const operationParameters = parameters(entry.operation.parameters, spec);
  const bodyDefinition = requestBody(entry.operation, spec);
  const bodyValue = bodyDefinition?.example ?? (bodyDefinition ? exampleForSchema(bodyDefinition.schema, spec) : undefined);
  const bodyExample = bodyDefinition ? JSON.stringify(bodyValue, null, 2) : '';
  const inputs = operationParameters.map((parameter) => renderParameterInput(parameter, id, spec)).join('');
  const examples = codeExamples(entry, spec);
  const secured = Array.isArray(entry.operation.security) && entry.operation.security.length > 0;
  return `<article class="api-operation" id="${escapeHtml(id)}" role="tabpanel" data-api-operation="${index}"${index ? ' hidden' : ''}>
    <div class="api-operation-heading">
      <div><p class="eyebrow">${secured ? 'Authenticated · visitor sandbox' : 'Public'}</p><h2><span class="http-method http-${entry.method.toLowerCase()}">${entry.method}</span> <code>${escapeHtml(`${basePath(spec)}${entry.path}`)}</code></h2></div>
      <span class="badge${secured ? '' : ' badge-ok'}">${secured ? 'Scoped write' : 'Public'}</span>
    </div>
    <p class="lede api-operation-summary">${escapeHtml(String(entry.operation.description ?? entry.operation.summary ?? 'Execute this operation.'))}</p>
    <form data-api-form data-method="${entry.method}" data-path="${escapeHtml(entry.path)}" data-base-path="${escapeHtml(basePath(spec))}" data-secured="${secured}">
      <section class="api-request-controls" aria-labelledby="${id}-parameters"><h3 id="${id}-parameters">Parameters</h3><div class="openapi-inputs">${inputs || '<p class="subtle">This operation has no path or query parameters.</p>'}${bodyDefinition ? `<label class="openapi-body" for="${id}-body">JSON body <span class="parameter-meta">required · application/json</span><textarea id="${id}-body" data-api-body spellcheck="false" required>${escapeHtml(bodyExample)}</textarea></label>` : ''}</div><button class="button-primary" type="submit">Send request</button></section>
    </form>
    <section class="api-code" aria-labelledby="${id}-request"><div class="api-subheading"><h3 id="${id}-request">Request</h3><button type="button" data-copy-code>Copy code</button></div>
      <div class="api-tabs" role="tablist" aria-label="Code example language">
        ${['curl', 'JavaScript', 'Python', 'C#'].map((label, tabIndex) => `<button type="button" role="tab" aria-selected="${tabIndex === 0}" data-code-tab="${tabIndex}"${tabIndex ? ' tabindex="-1"' : ''}>${label}</button>`).join('')}
      </div>
      ${examples.map((example, tabIndex) => `<pre data-code-panel="${tabIndex}"${tabIndex ? ' hidden' : ''}>${escapeHtml(example)}</pre>`).join('')}
    </section>
    <section class="api-response" data-api-result hidden aria-live="polite">
      <div class="api-response-heading"><div><p class="eyebrow">Response</p><h3 data-response-status>Waiting</h3></div><p data-response-meta></p></div>
      <div class="api-response-message" data-response-message hidden></div>
      <div class="api-tabs" role="tablist" aria-label="Response details">
        ${['Body', 'Headers', 'Request'].map((label, tabIndex) => `<button type="button" role="tab" aria-selected="${tabIndex === 0}" data-response-tab="${tabIndex}"${tabIndex ? ' tabindex="-1"' : ''}>${label}</button>`).join('')}
      </div>
      <pre data-response-panel="0" data-response-body></pre><pre data-response-panel="1" data-response-headers hidden></pre><pre data-response-panel="2" data-response-request hidden></pre>
      <a class="text-link" data-request-log hidden>View request in logs →</a>
    </section>
  </article>`;
}

function renderSchemas(schemas: Record<string, JsonObject>): string {
  const visible = Object.entries(schemas).filter(([name]) => name !== 'ReportingContract' && name !== 'AssuranceRegistryContract');
  return visible.map(([name, schema]) => `<details class="schema-card" id="openapi-schema-${escapeHtml(name)}"><summary><code>${escapeHtml(name)}</code></summary><pre>${escapeHtml(JSON.stringify(schema, null, 2))}</pre></details>`).join('');
}

const API_RUNNER = `(() => {
  let demoToken = '';
  let tokenExpiresAt = '';
  const query = (selector, root = document) => root.querySelector(selector);
  const queryAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const bytes = (value) => new TextEncoder().encode(value).byteLength;
  const securedHeaders = () => demoToken ? { authorization: 'Bearer ' + demoToken } : {};
  const selectPanels = (buttons, panels, selected) => {
    buttons.forEach((button, index) => { const active = index === selected; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    panels.forEach((panel, index) => { panel.hidden = index !== selected; });
  };
  queryAll('[data-api-endpoint]').forEach((button, index) => button.addEventListener('click', () => {
    selectPanels(queryAll('[data-api-endpoint]'), queryAll('[data-api-operation]'), index);
    query('[data-api-operation="' + index + '"]').focus?.();
  }));
  queryAll('[data-api-operation]').forEach((operation) => {
    const codeButtons = queryAll('[data-code-tab]', operation);
    const codePanels = queryAll('[data-code-panel]', operation);
    codeButtons.forEach((button, index) => button.addEventListener('click', () => selectPanels(codeButtons, codePanels, index)));
    const responseButtons = queryAll('[data-response-tab]', operation);
    const responsePanels = queryAll('[data-response-panel]', operation);
    responseButtons.forEach((button, index) => button.addEventListener('click', () => selectPanels(responseButtons, responsePanels, index)));
    query('[data-copy-code]', operation).addEventListener('click', async (event) => {
      const code = codePanels.find((panel) => !panel.hidden)?.textContent || '';
      await navigator.clipboard.writeText(code); event.currentTarget.textContent = 'Copied'; setTimeout(() => { event.currentTarget.textContent = 'Copy code'; }, 1200);
    });
  });
  const buildRequest = (form) => {
    let path = (form.dataset.basePath || '') + form.dataset.path;
    const search = new URLSearchParams();
    queryAll('[data-api-param]', form).forEach((input) => {
      if (input.disabled) return;
      const value = input.value.trim();
      if (input.required && !value) throw new Error(input.dataset.parameterName + ' is required.');
      if (!value) return;
      if (input.dataset.parameterIn === 'path') path = path.replace('{' + input.dataset.parameterName + '}', encodeURIComponent(value));
      if (input.dataset.parameterIn === 'query') search.set(input.dataset.parameterName, value);
    });
    if (path.includes('{')) throw new Error('Every path parameter is required.');
    if ([...search].length) path += '?' + search.toString();
    const headers = { ...(form.dataset.secured === 'true' ? securedHeaders() : {}) };
    let body;
    const bodyInput = query('[data-api-body]', form);
    if (bodyInput) { body = JSON.stringify(JSON.parse(bodyInput.value)); headers['content-type'] = 'application/json'; }
    return { path, headers, body };
  };
  const updateCount = async () => {
    if (!demoToken) return;
    const response = await fetch('/v1/demo-records', { headers: securedHeaders() });
    if (!response.ok) return;
    const payload = await response.json();
    query('[data-sandbox-count]').textContent = (payload.results || []).length + ' record' + ((payload.results || []).length === 1 ? '' : 's');
  };
  queryAll('[data-api-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const operation = form.closest('[data-api-operation]');
    const result = query('[data-api-result]', operation);
    result.hidden = false;
    query('[data-response-status]', result).textContent = 'Sending…';
    query('[data-response-meta]', result).textContent = '';
    query('[data-response-message]', result).hidden = true;
    try {
      const request = buildRequest(form);
      const previewHeaders = { ...request.headers };
      if (previewHeaders.authorization) previewHeaders.authorization = 'Bearer [short-lived scoped token]';
      const started = performance.now();
      const response = await fetch(request.path, { method: form.dataset.method, headers: request.headers, ...(request.body === undefined ? {} : { body: request.body }) });
      const text = await response.text();
      const duration = Math.max(0, Math.round(performance.now() - started));
      let formatted = text || '(no content)';
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      query('[data-response-status]', result).textContent = response.status + ' ' + response.statusText;
      query('[data-response-meta]', result).textContent = duration + ' ms · ' + (response.headers.get('content-type') || 'no content type').split(';')[0] + ' · ' + bytes(text) + ' B';
      query('[data-response-body]', result).textContent = formatted;
      query('[data-response-headers]', result).textContent = [...response.headers].map(([name, value]) => name + ': ' + value).join('\\n') || '(no response headers)';
      query('[data-response-request]', result).textContent = form.dataset.method + ' ' + request.path + (Object.keys(previewHeaders).length ? '\\n' + Object.entries(previewHeaders).map(([name, value]) => name + ': ' + value).join('\\n') : '') + (request.body ? '\\n\\n' + JSON.stringify(JSON.parse(request.body), null, 2) : '');
      const message = query('[data-response-message]', result);
      if (response.status === 401) { message.hidden = false; message.innerHTML = '<strong>Authentication required</strong><span>Sign in to enable write requests.</span><a href="/identity">Sign in →</a>'; }
      else if (response.status === 409) { message.hidden = false; message.innerHTML = '<strong>That key already exists</strong><span>Choose PUT to replace the complete resource.</span>'; }
      else if (response.status === 404) { message.hidden = false; message.innerHTML = '<strong>Record not found</strong><span>Check the key or create it with POST or PUT.</span>'; }
      else if (!response.ok) { message.hidden = false; message.innerHTML = '<strong>Request failed</strong><span>The raw response is available below.</span>'; }
      const id = response.headers.get('x-request-id');
      const log = query('[data-request-log]', result);
      if (id) { log.hidden = false; log.href = '/dashboard/logs?source=rest&requestId=' + encodeURIComponent(id); log.textContent = 'View ' + id + ' in logs →'; } else log.hidden = true;
      if (response.ok && form.dataset.method !== 'GET') updateCount().catch(() => {});
    } catch (error) {
      query('[data-response-status]', result).textContent = 'Request not sent';
      query('[data-response-body]', result).textContent = String(error);
      query('[data-response-meta]', result).textContent = 'Fix the request inputs and try again.';
    }
  }));
  const setAuthenticated = (payload) => {
    demoToken = payload.accessToken; tokenExpiresAt = payload.expiresAt;
    query('[data-api-auth-state]').textContent = 'Authenticated';
    query('[data-api-auth-state]').classList.add('badge-ok');
    query('[data-api-auth-copy]').textContent = payload.provider + ' · ' + payload.authentication.toUpperCase() + ' · demo:read · demo:write';
    query('[data-token-panel]').hidden = false;
    query('[data-token-preview]').textContent = '••••••••••••' + demoToken.slice(-10);
    query('[data-token-expiry]').textContent = 'Expires ' + new Date(tokenExpiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · visitor sandbox only';
    query('[data-sign-in]').hidden = true;
    query('[data-sandbox-reset]').hidden = false;
    queryAll('[data-api-param][data-parameter-name="namespace"]').forEach((input) => { input.value = 'Your API sandbox'; input.disabled = true; });
    updateCount().catch(() => {});
  };
  const loadIdentity = async () => {
    const sessionResponse = await fetch('/identity/session', { headers: { accept: 'application/json' }, credentials: 'same-origin' });
    if (!sessionResponse.ok) return;
    const session = await sessionResponse.json();
    if (!session.authenticated) return;
    const tokenResponse = await fetch('/__api/identity/token', { method: 'POST', headers: { accept: 'application/json' }, credentials: 'same-origin' });
    if (tokenResponse.ok) setAuthenticated(await tokenResponse.json());
  };
  query('[data-copy-base]').addEventListener('click', async (event) => { await navigator.clipboard.writeText('https://demo.wizardgang.ai/v1'); event.currentTarget.textContent = 'Copied'; });
  query('[data-copy-token]').addEventListener('click', async (event) => { await navigator.clipboard.writeText(demoToken); event.currentTarget.textContent = 'Copied'; setTimeout(() => { event.currentTarget.textContent = 'Copy token'; }, 1200); });
  query('[data-sandbox-reset]').addEventListener('click', async (event) => {
    event.currentTarget.disabled = true;
    try { const response = await fetch('/__api/api-sandbox/reset', { method: 'POST', headers: securedHeaders() }); if (!response.ok) throw new Error('Reset failed'); await updateCount(); }
    finally { event.currentTarget.disabled = false; }
  });
  loadIdentity().catch(() => {});
})();`;

export function openApiConsole(): string {
  const spec = openapi as OpenApiDocument;
  const entries = operationEntries(spec);
  const schemas = spec.components?.schemas ?? {};
  const visibleSchemaCount = Object.keys(schemas).filter((name) => name !== 'ReportingContract' && name !== 'AssuranceRegistryContract').length;
  return `<section class="api-base" aria-labelledby="api-base-heading">
    <div><p class="eyebrow">Base URL</p><h2 id="api-base-heading"><code>${escapeHtml(serverUrl(spec))}</code></h2></div><button type="button" data-copy-base>Copy</button>
  </section>
  <section class="api-sandbox" aria-labelledby="api-sandbox-heading">
    <div class="api-sandbox-heading"><div><p class="eyebrow">Authorization</p><h2 id="api-sandbox-heading">Your API sandbox</h2></div><span class="badge" data-api-auth-state>Public read</span></div>
    <p data-api-auth-copy>Anonymous requests can read <code>public</code>. Authenticate to receive a ten-minute token for isolated writes.</p>
    <div class="api-sandbox-actions"><a class="button button-primary" href="/identity" data-sign-in>Sign in to enable writes →</a><button type="button" data-sandbox-reset hidden>Reset sandbox</button><span data-sandbox-count>Public records</span></div>
    <div class="api-token" data-token-panel hidden><div><span>Short-lived bearer token</span><code data-token-preview></code><small data-token-expiry></small></div><button type="button" data-copy-token>Copy token</button></div>
  </section>
  <section class="api-explorer" id="rest" aria-labelledby="endpoints-heading">
    <aside class="api-endpoint-nav"><div><p class="eyebrow">OpenAPI generated</p><h2 id="endpoints-heading">Endpoints</h2></div><div role="tablist" aria-label="REST operations">
      ${entries.map((entry, index) => `<button type="button" role="tab" aria-selected="${index === 0}" aria-controls="${escapeHtml(operationId(entry))}" data-api-endpoint="${index}"${index ? ' tabindex="-1"' : ''}><span class="http-method http-${entry.method.toLowerCase()}">${entry.method}</span><code>${escapeHtml(entry.path)}</code></button>`).join('')}
    </div></aside>
    <div class="api-operation-stage">${entries.map((entry, index) => renderOperation(entry, index, spec)).join('')}</div>
  </section>
  <section class="api-contract" id="openapi" aria-labelledby="openapi-heading">
    <div class="api-contract-heading"><div><p class="eyebrow">Machine-readable source of truth</p><h2 id="openapi-heading">OpenAPI contract</h2></div><span class="badge badge-ok">OpenAPI 3.1</span></div>
    <dl><dt>Version</dt><dd><code>${escapeHtml(spec.openapi)}</code></dd><dt>API version</dt><dd><code>${escapeHtml(String(spec.info?.version ?? ''))}</code></dd><dt>JSON Schema dialect</dt><dd><code>${escapeHtml(String(spec.jsonSchemaDialect ?? ''))}</code></dd><dt>Base URL</dt><dd><code>${escapeHtml(serverUrl(spec))}</code></dd><dt>Format</dt><dd>Canonical JSON</dd></dl>
    <div class="button-row"><a class="button" href="/v1/openapi.json">View JSON</a></div>
    <details class="schema-browser" data-schema-browser><summary><span>Schemas</span><span>${visibleSchemaCount}</span></summary><div class="schema-grid">${renderSchemas(schemas)}</div></details>
  </section>
  <script>${API_RUNNER}</script>`;
}
