import {
  restDemoOpenApiDocument as spec,
  type RestDemoMediaType,
  type RestDemoOperation,
  type RestDemoParameter,
  type RestDemoResponseDefinition,
  type RestDemoSchema,
} from '../api/rest-demo-openapi';
import { escapeHtml } from '../lib/html';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface RenderedOperation {
  method: Uppercase<(typeof HTTP_METHODS)[number]>;
  path: string;
  operation: RestDemoOperation;
  parameters: RestDemoParameter[];
}

function referenceName(schema?: RestDemoSchema): string {
  if (!schema) return '—';
  if (schema.$ref) return schema.$ref.split('/').pop() || schema.$ref;
  if (schema.type === 'array') return `array<${referenceName(schema.items)}>`;
  return schema.format ? `${schema.type || 'value'} (${schema.format})` : schema.type || 'object';
}

function firstMediaType(content?: Record<string, RestDemoMediaType>): [string, RestDemoMediaType] | undefined {
  return content ? Object.entries(content)[0] : undefined;
}

function operationsFromDocument(): RenderedOperation[] {
  return Object.entries(spec.paths).flatMap(([path, pathItem]) => HTTP_METHODS.flatMap((method) => {
    const operation = pathItem[method] as RestDemoOperation | undefined;
    return operation ? [{
      method: method.toUpperCase() as RenderedOperation['method'],
      path,
      operation,
      parameters: [...(pathItem.parameters || []), ...(operation.parameters || [])],
    }] : [];
  }));
}

function operationId(operation: RestDemoOperation): string {
  return `rest-demo-${operation.operationId}`;
}

function examplePath(operation: RenderedOperation): string {
  return operation.parameters.reduce(
    (path, parameter) => path.replace(
      `{${parameter.name}}`,
      encodeURIComponent(String(parameter.example ?? parameter.schema.example ?? parameter.name)),
    ),
    operation.path,
  );
}

function requestExample(operation: RestDemoOperation): unknown {
  return firstMediaType(operation.requestBody?.content)?.[1].example;
}

function codeExamples(rendered: RenderedOperation): string[] {
  const { method, operation } = rendered;
  const url = `${spec.servers[0].url}${examplePath(rendered)}`;
  const example = requestExample(operation);
  const body = example === undefined ? '' : JSON.stringify(example, null, 2);
  const curl = [
    `curl${method === 'GET' ? '' : ` -X ${method}`} "${url}"`,
    ...(body ? ['  -H "Content-Type: application/json"', `  --data '${JSON.stringify(example)}'`] : []),
  ].join(' \\\n');
  const javascript = `const response = await fetch('${url}', {\n  method: '${method}',${body ? "\n  headers: { 'Content-Type': 'application/json' }," : ''}${body ? `\n  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),` : ''}\n});\n\nconsole.log(response.status, await response.text());`;
  const python = `import requests\n\nresponse = requests.${method.toLowerCase()}('${url}'${body ? `, json=${body.replaceAll('null', 'None').replaceAll('true', 'True').replaceAll('false', 'False')}` : ''})\nprint(response.status_code, response.text)`;
  return [curl, javascript, python];
}

function renderParameters(parameters: RestDemoParameter[]): string {
  if (!parameters.length) return '<p class="subtle">No parameters.</p>';
  return `<div class="table-wrap" tabindex="0" aria-label="Operation parameters"><table><thead><tr><th>Parameter</th><th>In</th><th>Required</th><th>Type</th></tr></thead><tbody>${parameters.map((parameter) => `<tr><td><code>${escapeHtml(parameter.name)}</code></td><td>${escapeHtml(parameter.in)}</td><td>${parameter.required ? 'Yes' : 'No'}</td><td><code>${escapeHtml(referenceName(parameter.schema))}</code></td></tr>`).join('')}</tbody></table></div>`;
}

function renderRequestFields(rendered: RenderedOperation): string {
  const { operation, parameters } = rendered;
  const id = operationId(operation);
  const media = firstMediaType(operation.requestBody?.content);
  const body = media?.[1].example === undefined ? '' : JSON.stringify(media[1].example, null, 2);
  const fields = parameters.map((parameter) => `<label for="${id}-${escapeHtml(parameter.name)}">${escapeHtml(parameter.name)} <span class="parameter-meta">${escapeHtml(parameter.in)} · ${parameter.required ? 'required' : 'optional'} · ${escapeHtml(referenceName(parameter.schema))}</span><input id="${id}-${escapeHtml(parameter.name)}" data-rest-parameter="${escapeHtml(parameter.name)}" value="${escapeHtml(String(parameter.example ?? parameter.schema.example ?? ''))}"${parameter.required ? ' required' : ''} autocomplete="off"></label>`).join('');
  const bodyField = media
    ? `<label class="openapi-body" for="${id}-body">Request body <span class="parameter-meta">${escapeHtml(media[0])} · ${escapeHtml(referenceName(media[1].schema))}</span><textarea id="${id}-body" data-rest-body spellcheck="false" required>${escapeHtml(body)}</textarea></label>`
    : '';
  return fields || bodyField
    ? `<div class="openapi-inputs">${fields}${bodyField}</div>`
    : '<p class="subtle">This operation has no request inputs.</p>';
}

function responseSchema(response: RestDemoResponseDefinition): string {
  return referenceName(firstMediaType(response.content)?.[1].schema);
}

function renderResponses(operation: RestDemoOperation): string {
  const rows = Object.entries(operation.responses)
    .map(([code, response]) => `<tr><td><code>${escapeHtml(code)}</code></td><td>${escapeHtml(response.description)}</td><td><code>${escapeHtml(responseSchema(response))}</code></td></tr>`)
    .join('');
  return `<div class="table-wrap" tabindex="0" aria-label="Declared responses"><table><thead><tr><th>Status</th><th>Meaning</th><th>Schema</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function referencedSchemaNames(schema: RestDemoSchema | undefined, names = new Set<string>()): Set<string> {
  if (!schema) return names;
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop();
    if (name && !names.has(name)) {
      names.add(name);
      referencedSchemaNames(spec.components.schemas[name], names);
    }
  }
  if (schema.items) referencedSchemaNames(schema.items, names);
  for (const property of Object.values(schema.properties || {})) referencedSchemaNames(property, names);
  return names;
}

function relevantSchemaNames(rendered: RenderedOperation): string[] {
  const names = new Set<string>();
  for (const parameter of rendered.parameters) referencedSchemaNames(parameter.schema, names);
  const request = firstMediaType(rendered.operation.requestBody?.content);
  referencedSchemaNames(request?.[1].schema, names);
  for (const response of Object.values(rendered.operation.responses)) {
    referencedSchemaNames(firstMediaType(response.content)?.[1].schema, names);
  }
  return [...names];
}

function renderSchema(name: string, schema: RestDemoSchema): string {
  const required = new Set(schema.required || []);
  const rows = Object.entries(schema.properties || {}).map(([property, definition]) => `<tr><td><code>${escapeHtml(property)}</code></td><td><code>${escapeHtml(referenceName(definition))}</code></td><td>${required.has(property) ? 'Yes' : 'No'}</td><td>${escapeHtml(definition.description || '—')}</td></tr>`).join('');
  if (!rows) return `<article class="rest-contract-schema"><h4><code>${escapeHtml(name)}</code></h4><p>${escapeHtml(schema.description || referenceName(schema))}</p></article>`;
  return `<article class="rest-contract-schema"><h4><code>${escapeHtml(name)}</code></h4><p>${escapeHtml(schema.description || '')}</p><div class="table-wrap" tabindex="0" aria-label="${escapeHtml(name)} schema properties"><table><thead><tr><th>Property</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

function renderRelevantSchemas(rendered: RenderedOperation): string {
  const names = relevantSchemaNames(rendered);
  if (!names.length) return '<p class="subtle">No component schemas are referenced by this operation.</p>';
  return `<div class="rest-contract-schemas">${names.map((name) => renderSchema(name, spec.components.schemas[name])).join('')}</div>`;
}

function renderCodeSamples(rendered: RenderedOperation): string {
  const id = operationId(rendered.operation);
  const examples = codeExamples(rendered);
  return `<details class="rest-code-samples"><summary>Code samples for this operation</summary><div class="rest-code-samples-body"><div class="api-subheading"><div class="api-tabs" role="tablist" aria-label="Code sample language">${['curl', 'JavaScript', 'Python'].map((label, tabIndex) => `<button id="${id}-tab-${tabIndex}" type="button" role="tab" aria-selected="${tabIndex === 0}" aria-controls="${id}-code-${tabIndex}" data-code-tab="${tabIndex}"${tabIndex ? ' tabindex="-1"' : ''}>${label}</button>`).join('')}</div><button type="button" data-copy-code>Copy selected code sample</button></div>${examples.map((example, tabIndex) => `<pre id="${id}-code-${tabIndex}" role="tabpanel" aria-labelledby="${id}-tab-${tabIndex}" tabindex="0" data-code-panel="${tabIndex}"${tabIndex ? ' hidden' : ''}>${escapeHtml(example)}</pre>`).join('')}</div></details>`;
}

function renderOperationSelector(rendered: RenderedOperation, index: number): string {
  const id = operationId(rendered.operation);
  return `<button type="button" class="rest-operation-choice" data-rest-operation-select="${escapeHtml(rendered.operation.operationId)}" aria-pressed="${index === 0}" aria-controls="${id}-panel"><span class="http-method http-${rendered.method.toLowerCase()}">${rendered.method}</span><span class="rest-operation-choice-copy"><code>${escapeHtml(rendered.path)}</code><strong>${escapeHtml(rendered.operation.summary)}</strong></span></button>`;
}

function renderOperationPanel(rendered: RenderedOperation, index: number): string {
  const { method, path, operation, parameters } = rendered;
  const id = operationId(operation);
  return `<section class="rest-operation-panel" id="${id}-panel" data-rest-operation-panel="${escapeHtml(operation.operationId)}" aria-labelledby="${id}-heading"${index ? ' hidden' : ''}>
    <header class="rest-operation-header">
      <p class="eyebrow">Selected operation</p>
      <div class="rest-operation-title"><span class="http-method http-${method.toLowerCase()}">${method}</span><code>${escapeHtml(path)}</code></div>
      <h2 id="${id}-heading">${escapeHtml(operation.summary)}</h2>
      <p>${escapeHtml(operation.description)}</p>
    </header>
    <section class="rest-task-block" aria-labelledby="${id}-request-heading">
      <h3 id="${id}-request-heading">Request</h3>
      <form data-rest-form data-method="${method}" data-path="${escapeHtml(path)}">
        ${renderRequestFields(rendered)}
        <button class="button-primary" type="submit" data-rest-execute>Execute ${method}</button>
      </form>
    </section>
    <section class="rest-task-block rest-response" aria-labelledby="${id}-response-heading">
      <h3 id="${id}-response-heading">Response</h3>
      <div data-rest-result aria-live="polite">
        <p class="subtle" data-rest-response-empty>Execute this operation to inspect the actual response.</p>
        <dl data-rest-response-details hidden>
          <dt>Request URL</dt><dd><code data-rest-request-url></code></dd>
          <dt>Request</dt><dd><pre data-rest-request></pre></dd>
          <dt>Status</dt><dd><strong data-rest-status></strong></dd>
          <dt>Headers</dt><dd><pre data-rest-response-headers></pre></dd>
          <dt>Body</dt><dd><pre data-rest-response-body></pre></dd>
        </dl>
      </div>
    </section>
    <section class="rest-task-block rest-contract" aria-labelledby="${id}-contract-heading">
      <h3 id="${id}-contract-heading">Contract</h3>
      <p class="subtle">Only the OpenAPI material used by the selected operation is shown here.</p>
      <h4>Parameters</h4>
      ${renderParameters(parameters)}
      <h4>Declared responses</h4>
      ${renderResponses(operation)}
      <h4>Referenced schemas</h4>
      ${renderRelevantSchemas(rendered)}
    </section>
    <section class="rest-task-block rest-operation-evidence" aria-labelledby="${id}-evidence-heading">
      <h3 id="${id}-evidence-heading">Deeper evidence</h3>
      ${renderCodeSamples(rendered)}
    </section>
  </section>`;
}

const REST_RUNNER = `(() => {
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const selectTabs = (buttons, panels, selected, moveFocus = false) => {
    buttons.forEach((button, index) => {
      button.setAttribute('aria-selected', String(index === selected));
      button.tabIndex = index === selected ? 0 : -1;
    });
    panels.forEach((panel, index) => { panel.hidden = index !== selected; });
    if (moveFocus) buttons[selected]?.focus();
  };
  const selectOperation = (operationId) => {
    qa('[data-rest-operation-select]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.restOperationSelect === operationId));
    });
    qa('[data-rest-operation-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.restOperationPanel !== operationId;
    });
  };
  qa('[data-rest-operation-select]').forEach((button) => {
    button.addEventListener('click', () => selectOperation(button.dataset.restOperationSelect));
  });
  q('[data-copy-server]')?.addEventListener('click', async (event) => {
    await navigator.clipboard.writeText(event.currentTarget.dataset.copyServer);
    event.currentTarget.textContent = 'Copied';
    setTimeout(() => { event.currentTarget.textContent = 'Copy'; }, 1200);
  });
  qa('[data-code-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const operation = button.closest('[data-rest-operation-panel]');
      selectTabs(qa('[data-code-tab]', operation), qa('[data-code-panel]', operation), Number(button.dataset.codeTab));
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const operation = button.closest('[data-rest-operation-panel]');
      const buttons = qa('[data-code-tab]', operation);
      const panels = qa('[data-code-panel]', operation);
      const current = buttons.indexOf(button);
      const rtl = getComputedStyle(button.closest('[role="tablist"]')).direction === 'rtl';
      let next = current;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else if (event.key === 'ArrowRight') next = (current + (rtl ? -1 : 1) + buttons.length) % buttons.length;
      else next = (current + (rtl ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      selectTabs(buttons, panels, next, true);
    });
  });
  qa('[data-copy-code]').forEach((button) => button.addEventListener('click', async () => {
    const operation = button.closest('[data-rest-operation-panel]');
    await navigator.clipboard.writeText(qa('[data-code-panel]', operation).find((panel) => !panel.hidden)?.textContent || '');
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = 'Copy selected code sample'; }, 1200);
  }));
  qa('[data-rest-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const panel = form.closest('[data-rest-operation-panel]');
    const result = q('[data-rest-result]', panel);
    const empty = q('[data-rest-response-empty]', result);
    const details = q('[data-rest-response-details]', result);
    const requestUrl = q('[data-rest-request-url]', result);
    const requestOutput = q('[data-rest-request]', result);
    const status = q('[data-rest-status]', result);
    const responseHeaders = q('[data-rest-response-headers]', result);
    const responseBody = q('[data-rest-response-body]', result);
    const execute = q('[data-rest-execute]', form);
    let path = form.dataset.path;
    qa('[data-rest-parameter]', panel).forEach((input) => {
      path = path.replace('{' + input.dataset.restParameter + '}', encodeURIComponent(input.value.trim()));
    });
    const url = new URL(path, window.location.origin).toString();
    const bodyInput = q('[data-rest-body]', panel);
    const headers = {};
    let body;
    try {
      if (bodyInput) {
        body = JSON.stringify(JSON.parse(bodyInput.value));
        headers['content-type'] = 'application/json';
      }
    } catch (error) {
      empty.hidden = true;
      details.hidden = false;
      requestUrl.textContent = url;
      requestOutput.textContent = 'Body could not be parsed as JSON.';
      status.textContent = 'Request not sent';
      responseHeaders.textContent = '—';
      responseBody.textContent = String(error);
      return;
    }
    empty.hidden = true;
    details.hidden = false;
    requestUrl.textContent = url;
    requestOutput.textContent = JSON.stringify({ method: form.dataset.method, headers, ...(body ? { body: JSON.parse(body) } : {}) }, null, 2);
    status.textContent = 'Sending…';
    responseHeaders.textContent = 'Waiting for response…';
    responseBody.textContent = 'Waiting for response…';
    execute.disabled = true;
    try {
      const response = await fetch(path, { method: form.dataset.method, headers, ...(body ? { body } : {}) });
      const text = await response.text();
      let formatted = text || '(no content)';
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      status.textContent = response.status + ' ' + response.statusText;
      responseHeaders.textContent = [...response.headers.entries()].map(([name, value]) => name + ': ' + value).join('\\n') || '(no headers)';
      responseBody.textContent = formatted;
    } catch (error) {
      status.textContent = 'Request failed';
      responseHeaders.textContent = '—';
      responseBody.textContent = String(error);
    } finally {
      execute.disabled = false;
    }
  }));
})();`;

export function openApiConsole(documentPath: string): string {
  const operations = operationsFromDocument();
  const server = spec.servers[0];
  return `<div class="rest-operation-browser" data-rest-operation-browser>
    <section class="rest-operation-picker" aria-labelledby="rest-operation-picker-heading">
      <p class="eyebrow">Operation selector</p>
      <h2 id="rest-operation-picker-heading">Choose one request</h2>
      <p>${escapeHtml(spec.info.description)}</p>
      <div class="rest-server"><div><span>Server</span><code>${escapeHtml(server.url)}</code></div><button type="button" data-copy-server="${escapeHtml(server.url)}">Copy</button></div>
      <div class="rest-operation-choices">${operations.map(renderOperationSelector).join('')}</div>
      <details class="rest-deeper-evidence">
        <summary>Full OpenAPI evidence</summary>
        <p>The complete OpenAPI ${escapeHtml(spec.openapi)} document remains authoritative, but it is kept out of the primary execution flow.</p>
        <div class="rest-artifacts" aria-label="Full OpenAPI document actions">
          <a class="button" href="${escapeHtml(documentPath)}" data-rest-full-openapi>Open full OpenAPI JSON</a>
          <a class="button" href="${escapeHtml(documentPath)}?download=1" download>Download JSON</a>
        </div>
      </details>
    </section>
    <div class="rest-operation-detail">${operations.map(renderOperationPanel).join('')}</div>
  </div>
  <script>${REST_RUNNER}</script>`;
}
