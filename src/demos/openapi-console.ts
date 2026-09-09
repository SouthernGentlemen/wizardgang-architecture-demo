import { escapeHtml } from '../lib/html';

interface DemoOperation {
  method: string;
  path: string;
  summary: string;
  description: string;
  request?: Record<string, unknown>;
  response: Record<string, unknown>;
}

const BASE_URL = 'https://demo.wizardgang.ai';
const COLLECTION_PATH = '/api/labs/rest-demo-records';
const ITEM_PATH = `${COLLECTION_PATH}/{id}`;

const operations: DemoOperation[] = [
  { method: 'GET', path: COLLECTION_PATH, summary: 'List records', description: 'Return the records in this browser session.', response: { results: [{ id: 1, key: 'hello', value: { message: 'Hello from a Worker' }, createdAt: '2026-09-08T12:00:00.000Z', updatedAt: '2026-09-08T12:00:00.000Z' }], count: 1 } },
  { method: 'POST', path: COLLECTION_PATH, summary: 'Create a record', description: 'Create a new record with a unique key.', request: { key: 'hello', value: { message: 'Hello from a Worker' } }, response: { id: 1, key: 'hello', value: { message: 'Hello from a Worker' }, createdAt: '2026-09-08T12:00:00.000Z', updatedAt: '2026-09-08T12:00:00.000Z' } },
  { method: 'GET', path: ITEM_PATH, summary: 'Read a record', description: 'Read one record by its key.', response: { id: 1, key: 'hello', value: { message: 'Hello from a Worker' }, createdAt: '2026-09-08T12:00:00.000Z', updatedAt: '2026-09-08T12:00:00.000Z' } },
  { method: 'PUT', path: ITEM_PATH, summary: 'Replace a record', description: 'Replace the complete value at a key, creating it when it does not exist.', request: { value: { message: 'Replaced by a Worker' } }, response: { id: 1, key: 'hello', value: { message: 'Replaced by a Worker' }, createdAt: '2026-09-08T12:00:00.000Z', updatedAt: '2026-09-08T12:01:00.000Z' } },
  { method: 'PATCH', path: ITEM_PATH, summary: 'Update a record', description: 'Update the value at a key without changing its identity.', request: { value: { message: 'Patched by a Worker', priority: 'high' } }, response: { id: 1, key: 'hello', value: { message: 'Patched by a Worker', priority: 'high' }, createdAt: '2026-09-08T12:00:00.000Z', updatedAt: '2026-09-08T12:02:00.000Z' } },
  { method: 'DELETE', path: ITEM_PATH, summary: 'Delete a record', description: 'Delete one record by its key.', response: {} },
];

function operationId(operation: DemoOperation, index: number): string {
  return `rest-demo-${operation.method.toLowerCase()}-${index}`;
}

function exampleUrl(operation: DemoOperation): string {
  return `${BASE_URL}${operation.path.replace('{id}', 'hello')}`;
}

function codeExamples(operation: DemoOperation): string[] {
  const body = operation.request ? JSON.stringify(operation.request, null, 2) : '';
  const curl = [`curl${operation.method === 'GET' ? '' : ` -X ${operation.method}`} "${exampleUrl(operation)}"`, ...(body ? ['  -H "Content-Type: application/json"', `  --data '${body.replaceAll('\n', '')}'`] : [])].join(' \\\n');
  const javascript = `const response = await fetch('${operation.path.replace('{id}', 'hello')}', {\n  method: '${operation.method}',${body ? "\n  headers: { 'Content-Type': 'application/json' }," : ''}${body ? `\n  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),` : ''}\n});\nconsole.log(response.status, await response.text());`;
  const python = `import requests\n\nresponse = requests.${operation.method.toLowerCase()}('${exampleUrl(operation)}'${body ? `, json=${body.replaceAll('null', 'None').replaceAll('true', 'True').replaceAll('false', 'False')}` : ''})\nprint(response.status_code, response.text)`;
  return [curl, javascript, python];
}

function renderOperation(operation: DemoOperation, index: number): string {
  const id = operationId(operation, index);
  const body = operation.request ? JSON.stringify(operation.request, null, 2) : '';
  const examples = codeExamples(operation);
  return `<details class="openapi-operation" id="${id}" data-rest-operation="${index}"${index === 0 ? ' open' : ''}>
    <summary><span class="http-method http-${operation.method.toLowerCase()}">${operation.method}</span><span class="openapi-route"><strong>${escapeHtml(operation.summary)}</strong><code>${escapeHtml(operation.path)}</code></span><span class="badge badge-ok">200–204</span></summary>
    <div class="openapi-operation-body">
      <p class="lede">${escapeHtml(operation.description)}</p>
      <form data-rest-form data-method="${operation.method}" data-path="${escapeHtml(operation.path)}">
        <fieldset><legend>Try it out</legend>
          ${operation.path.includes('{id}') ? `<label for="${id}-id">id <span class="parameter-meta">path · required · string</span><input id="${id}-id" data-rest-id value="hello" required autocomplete="off"></label>` : ''}
          ${operation.request ? `<label for="${id}-body">Request body <span class="parameter-meta">application/json</span><textarea id="${id}-body" data-rest-body spellcheck="false" required>${escapeHtml(body)}</textarea></label>` : ''}
          <button class="button-primary" type="submit">Execute</button>
        </fieldset>
      </form>
      <section class="api-code" aria-labelledby="${id}-code"><div class="api-subheading"><h3 id="${id}-code">Request</h3><button type="button" data-copy-code>Copy code</button></div>
        <div class="api-tabs" role="tablist" aria-label="Code example language">${['curl', 'JavaScript', 'Python'].map((label, tabIndex) => `<button type="button" role="tab" aria-selected="${tabIndex === 0}" data-code-tab="${tabIndex}"${tabIndex ? ' tabindex="-1"' : ''}>${label}</button>`).join('')}</div>
        ${examples.map((example, tabIndex) => `<pre data-code-panel="${tabIndex}"${tabIndex ? ' hidden' : ''}>${escapeHtml(example)}</pre>`).join('')}
      </section>
      <section class="api-response" data-rest-result hidden aria-live="polite"><div class="api-response-heading"><div><p class="eyebrow">Response</p><h3 data-rest-status>Waiting</h3></div><p data-rest-meta></p></div><pre data-rest-response></pre></section>
    </div>
  </details>`;
}

const REST_RUNNER = `(() => {
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const select = (buttons, panels, selected) => { buttons.forEach((button, index) => { button.setAttribute('aria-selected', String(index === selected)); button.tabIndex = index === selected ? 0 : -1; }); panels.forEach((panel, index) => { panel.hidden = index !== selected; }); };
  qa('[data-code-tab]').forEach((button) => button.addEventListener('click', () => { const operation = button.closest('[data-rest-operation]'); select(qa('[data-code-tab]', operation), qa('[data-code-panel]', operation), Number(button.dataset.codeTab)); }));
  qa('[data-copy-code]').forEach((button) => button.addEventListener('click', async () => { const operation = button.closest('[data-rest-operation]'); await navigator.clipboard.writeText(qa('[data-code-panel]', operation).find((panel) => !panel.hidden)?.textContent || ''); button.textContent = 'Copied'; setTimeout(() => { button.textContent = 'Copy code'; }, 1200); }));
  qa('[data-rest-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const operation = form.closest('[data-rest-operation]'); const result = q('[data-rest-result]', operation); const status = q('[data-rest-status]', result); const meta = q('[data-rest-meta]', result); const output = q('[data-rest-response]', result); result.hidden = false; status.textContent = 'Sending…'; meta.textContent = '';
    try {
      let path = form.dataset.path; const id = q('[data-rest-id]', form)?.value.trim(); if (id) path = path.replace('{id}', encodeURIComponent(id));
      const bodyInput = q('[data-rest-body]', form); const init = { method: form.dataset.method, headers: {}, ...(bodyInput ? { body: JSON.stringify(JSON.parse(bodyInput.value)) } : {}) }; if (bodyInput) init.headers['content-type'] = 'application/json';
      const started = performance.now(); const response = await fetch(path, init); const text = await response.text(); const duration = Math.round(performance.now() - started); let formatted = text || '(no content)'; try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      status.textContent = response.status + ' ' + response.statusText; meta.textContent = duration + ' ms · ' + (response.headers.get('content-type') || 'no content type').split(';')[0]; output.textContent = formatted;
    } catch (error) { status.textContent = 'Request not sent'; meta.textContent = 'Fix the request body and try again.'; output.textContent = String(error); }
  }));
})();`;

export function openApiConsole(): string {
  const spec = {
    openapi: '3.0.3',
    info: { title: 'WizardGang REST demo', version: '1.0.0', description: 'A small anonymous CRUD API for learning the shape of an OpenAPI 3.0 document.' },
    servers: [{ url: BASE_URL, description: 'Live demo server' }],
    tags: [{ name: 'Records', description: 'Visitor-scoped demo records' }],
    paths: {
      [COLLECTION_PATH]: {
        get: { tags: ['Records'], operationId: 'listRecords', summary: 'List records', responses: { '200': { description: 'A list of records.' } } },
        post: { tags: ['Records'], operationId: 'createRecord', summary: 'Create a record', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordInput' } } } }, responses: { '201': { description: 'The created record.' }, '409': { description: 'The key already exists.' } } },
      },
      [ITEM_PATH]: {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        get: { tags: ['Records'], operationId: 'getRecord', summary: 'Read a record', responses: { '200': { description: 'The requested record.' }, '404': { description: 'Record not found.' } } },
        put: { tags: ['Records'], operationId: 'replaceRecord', summary: 'Replace a record', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordValue' } } } }, responses: { '200': { description: 'The replaced record.' } } },
        patch: { tags: ['Records'], operationId: 'updateRecord', summary: 'Update a record', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordValue' } } } }, responses: { '200': { description: 'The updated record.' } } },
        delete: { tags: ['Records'], operationId: 'deleteRecord', summary: 'Delete a record', responses: { '204': { description: 'Record deleted.' } } },
      },
    },
    components: {
      schemas: {
        RecordInput: { type: 'object', required: ['key', 'value'], properties: { key: { type: 'string', example: 'hello' }, value: { type: 'object', additionalProperties: true, example: { message: 'Hello from a Worker' } } } },
        RecordValue: { type: 'object', required: ['value'], properties: { value: { type: 'object', additionalProperties: true, example: { message: 'Updated by a Worker' } } } },
      },
    },
  };
  return `<section class="api-base" aria-labelledby="rest-contract-heading"><div><p class="eyebrow">OpenAPI document</p><h2 id="rest-contract-heading"><code>${escapeHtml(spec.openapi)}</code> · ${escapeHtml(spec.info.title)}</h2><p class="subtle">${escapeHtml(spec.info.description)}</p></div><button type="button" data-copy-base="${BASE_URL}">Copy server URL</button></section>
  <section class="api-explorer" id="rest" aria-labelledby="rest-operations-heading"><aside class="api-endpoint-nav"><div><p class="eyebrow">Operations</p><h2 id="rest-operations-heading">REST resources</h2></div><div role="tablist" aria-label="REST operations">${operations.map((operation, index) => `<a href="#${operationId(operation, index)}"><span class="http-method http-${operation.method.toLowerCase()}">${operation.method}</span><code>${escapeHtml(operation.path)}</code></a>`).join('')}</div></aside><div class="api-operation-stage">${operations.map(renderOperation).join('')}</div></section>
  <section class="api-contract" id="openapi" aria-labelledby="rest-contract-details-heading"><div class="api-contract-heading"><div><p class="eyebrow">Contract shape</p><h2 id="rest-contract-details-heading">What this demo exposes</h2></div><span class="badge badge-ok">No authentication</span></div><dl><dt>Server</dt><dd><code>${BASE_URL}</code></dd><dt>Resources</dt><dd><code>${COLLECTION_PATH}</code> and <code>${ITEM_PATH}</code></dd><dt>Methods</dt><dd>GET · POST · PUT · PATCH · DELETE</dd><dt>Request format</dt><dd><code>application/json</code> for POST, PUT, and PATCH</dd></dl><p class="subtle">Every visitor gets an isolated session cookie. This intentionally small contract is for the demo; the full server contract is maintained separately.</p><details class="schema-browser"><summary>View this demo's OpenAPI JSON</summary><pre>${escapeHtml(JSON.stringify(spec, null, 2))}</pre></details></section>
  <script>${REST_RUNNER}</script>`;
}
