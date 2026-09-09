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
  return operation.parameters.reduce((path, parameter) => path.replace(`{${parameter.name}}`, encodeURIComponent(String(parameter.example ?? parameter.schema.example ?? parameter.name))), operation.path);
}

function requestExample(operation: RestDemoOperation): unknown {
  return firstMediaType(operation.requestBody?.content)?.[1].example;
}

function codeExamples(rendered: RenderedOperation): string[] {
  const { method, operation } = rendered;
  const url = `${spec.servers[0].url}${examplePath(rendered)}`;
  const example = requestExample(operation);
  const body = example === undefined ? '' : JSON.stringify(example, null, 2);
  const curl = [`curl${method === 'GET' ? '' : ` -X ${method}`} "${url}"`, ...(body ? ['  -H "Content-Type: application/json"', `  --data '${JSON.stringify(example)}'`] : [])].join(' \\\n');
  const javascript = `const response = await fetch('${url}', {\n  method: '${method}',${body ? "\n  headers: { 'Content-Type': 'application/json' }," : ''}${body ? `\n  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),` : ''}\n});\n\nconsole.log(response.status, await response.text());`;
  const python = `import requests\n\nresponse = requests.${method.toLowerCase()}('${url}'${body ? `, json=${body.replaceAll('null', 'None').replaceAll('true', 'True').replaceAll('false', 'False')}` : ''})\nprint(response.status_code, response.text)`;
  return [curl, javascript, python];
}

function renderParameters(parameters: RestDemoParameter[]): string {
  const rows = parameters.length
    ? parameters.map((parameter) => `<tr><td><code>${escapeHtml(parameter.name)}</code></td><td>${escapeHtml(parameter.in)}</td><td>${parameter.required ? 'Yes' : 'No'}</td><td><code>${escapeHtml(referenceName(parameter.schema))}</code></td><td>${escapeHtml(parameter.description)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="rest-empty-cell">No parameters</td></tr>';
  return `<section class="rest-detail-block"><h3>Parameters</h3><div class="table-wrap"><table><thead><tr><th>Parameter</th><th>In</th><th>Required</th><th>Type</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function renderRequestBody(operation: RestDemoOperation): string {
  if (!operation.requestBody) return '<section class="rest-detail-block"><h3>Request body</h3><p class="subtle">No request body.</p></section>';
  const [contentType, media] = firstMediaType(operation.requestBody.content) as [string, RestDemoMediaType];
  return `<section class="rest-detail-block"><h3>Request body</h3><p>${escapeHtml(operation.requestBody.description)}</p><div class="table-wrap"><table><thead><tr><th>Content type</th><th>Required</th><th>Schema</th></tr></thead><tbody><tr><td><code>${escapeHtml(contentType)}</code></td><td>${operation.requestBody.required ? 'Yes' : 'No'}</td><td><code>${escapeHtml(referenceName(media.schema))}</code></td></tr></tbody></table></div></section>`;
}

function responseSchema(response: RestDemoResponseDefinition): string {
  return referenceName(firstMediaType(response.content)?.[1].schema);
}

function renderResponses(operation: RestDemoOperation): string {
  const rows = Object.entries(operation.responses).map(([code, response]) => `<tr><td><code>${escapeHtml(code)}</code></td><td>${escapeHtml(response.description)}</td><td><code>${escapeHtml(responseSchema(response))}</code></td></tr>`).join('');
  return `<section class="rest-detail-block"><h3>Responses</h3><div class="table-wrap"><table><thead><tr><th>Code</th><th>Meaning</th><th>Schema</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function renderCodeSamples(rendered: RenderedOperation): string {
  const id = operationId(rendered.operation);
  const examples = codeExamples(rendered);
  return `<details class="rest-code-samples"><summary>Code samples</summary><div class="rest-code-samples-body"><div class="api-subheading"><div class="api-tabs" role="tablist" aria-label="Code sample language">${['curl', 'JavaScript', 'Python'].map((label, tabIndex) => `<button type="button" role="tab" aria-selected="${tabIndex === 0}" data-code-tab="${tabIndex}"${tabIndex ? ' tabindex="-1"' : ''}>${label}</button>`).join('')}</div><button type="button" data-copy-code>Copy</button></div>${examples.map((example, tabIndex) => `<pre id="${id}-code-${tabIndex}" data-code-panel="${tabIndex}"${tabIndex ? ' hidden' : ''}>${escapeHtml(example)}</pre>`).join('')}</div></details>`;
}

function renderTryItOut(rendered: RenderedOperation): string {
  const { operation, method, path, parameters } = rendered;
  const id = operationId(operation);
  const media = firstMediaType(operation.requestBody?.content);
  const body = media?.[1].example === undefined ? '' : JSON.stringify(media[1].example, null, 2);
  return `<section class="rest-detail-block rest-try" aria-labelledby="${id}-try-heading"><div class="rest-try-heading"><h3 id="${id}-try-heading">Try it out</h3><button type="button" data-rest-enable>Try it out</button></div><form data-rest-form data-method="${method}" data-path="${escapeHtml(path)}"><div class="openapi-inputs" data-rest-inputs hidden>${parameters.map((parameter) => `<label for="${id}-${escapeHtml(parameter.name)}">${escapeHtml(parameter.name)} <span class="parameter-meta">${escapeHtml(parameter.in)} · ${parameter.required ? 'required' : 'optional'} · ${escapeHtml(referenceName(parameter.schema))}</span><input id="${id}-${escapeHtml(parameter.name)}" data-rest-parameter="${escapeHtml(parameter.name)}" value="${escapeHtml(String(parameter.example ?? parameter.schema.example ?? ''))}"${parameter.required ? ' required' : ''} autocomplete="off" disabled></label>`).join('')}${media ? `<label class="openapi-body" for="${id}-body">Request body <span class="parameter-meta">${escapeHtml(media[0])}</span><textarea id="${id}-body" data-rest-body spellcheck="false" required disabled>${escapeHtml(body)}</textarea></label>` : ''}<button class="button-primary" type="submit" data-rest-execute disabled>Execute</button></div></form><section class="rest-exchange" data-rest-result hidden aria-live="polite"><h3>Generated request and response</h3><dl><dt>Request URL</dt><dd><code data-rest-request-url></code></dd><dt>Request headers/body</dt><dd><pre data-rest-request></pre></dd><dt>Response status</dt><dd><strong data-rest-status></strong></dd><dt>Response headers</dt><dd><pre data-rest-response-headers></pre></dd><dt>Response body</dt><dd><pre data-rest-response-body></pre></dd></dl></section></section>`;
}

function renderOperation(rendered: RenderedOperation): string {
  const { method, path, operation, parameters } = rendered;
  const id = operationId(operation);
  return `<details class="openapi-operation" id="${id}" data-rest-operation><summary><span class="http-method http-${method.toLowerCase()}">${method}</span><code>${escapeHtml(path)}</code><strong>${escapeHtml(operation.summary)}</strong><span class="rest-expand-label" aria-hidden="true">Expand</span></summary><div class="openapi-operation-body"><section class="rest-detail-block rest-description"><h3>Description</h3><p>${escapeHtml(operation.description)}</p></section>${renderParameters(parameters)}${renderRequestBody(operation)}${renderResponses(operation)}${renderCodeSamples(rendered)}${renderTryItOut(rendered)}</div></details>`;
}

function renderSchema(name: string, schema: RestDemoSchema): string {
  const required = new Set(schema.required || []);
  const rows = Object.entries(schema.properties || {}).map(([property, definition]) => `<tr><td><code>${escapeHtml(property)}</code></td><td><code>${escapeHtml(referenceName(definition))}</code></td><td>${required.has(property) ? 'Yes' : 'No'}</td><td>${escapeHtml(definition.description || '—')}</td><td><code>${escapeHtml(definition.example === undefined ? '—' : JSON.stringify(definition.example))}</code></td></tr>`).join('');
  return `<details class="rest-schema"><summary><code>${escapeHtml(name)}</code><span>${escapeHtml(schema.description || referenceName(schema))}</span></summary><div class="table-wrap"><table><thead><tr><th>Property</th><th>Type</th><th>Required</th><th>Description</th><th>Example</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

const REST_RUNNER = `(() => {
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const select = (buttons, panels, selected) => { buttons.forEach((button, index) => { button.setAttribute('aria-selected', String(index === selected)); button.tabIndex = index === selected ? 0 : -1; }); panels.forEach((panel, index) => { panel.hidden = index !== selected; }); };
  q('[data-copy-server]')?.addEventListener('click', async (event) => { await navigator.clipboard.writeText(event.currentTarget.dataset.copyServer); event.currentTarget.textContent = 'Copied'; setTimeout(() => { event.currentTarget.textContent = 'Copy'; }, 1200); });
  qa('[data-code-tab]').forEach((button) => button.addEventListener('click', () => { const operation = button.closest('[data-rest-operation]'); select(qa('[data-code-tab]', operation), qa('[data-code-panel]', operation), Number(button.dataset.codeTab)); }));
  qa('[data-copy-code]').forEach((button) => button.addEventListener('click', async () => { const operation = button.closest('[data-rest-operation]'); await navigator.clipboard.writeText(qa('[data-code-panel]', operation).find((panel) => !panel.hidden)?.textContent || ''); button.textContent = 'Copied'; setTimeout(() => { button.textContent = 'Copy'; }, 1200); }));
  qa('[data-rest-enable]').forEach((button) => button.addEventListener('click', () => { const section = button.closest('.rest-try'); const inputs = q('[data-rest-inputs]', section); inputs.hidden = false; qa('input, textarea, button[data-rest-execute]', inputs).forEach((control) => { control.disabled = false; }); button.hidden = true; q('input, textarea', inputs)?.focus(); }));
  qa('[data-rest-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const section = form.closest('.rest-try'); const result = q('[data-rest-result]', section); const requestUrl = q('[data-rest-request-url]', result); const requestOutput = q('[data-rest-request]', result); const status = q('[data-rest-status]', result); const responseHeaders = q('[data-rest-response-headers]', result); const responseBody = q('[data-rest-response-body]', result); const execute = q('[data-rest-execute]', form);
    let path = form.dataset.path; qa('[data-rest-parameter]', form).forEach((input) => { path = path.replace('{' + input.dataset.restParameter + '}', encodeURIComponent(input.value.trim())); });
    const url = new URL(path, window.location.origin).toString(); const bodyInput = q('[data-rest-body]', form); const headers = {}; let body;
    try { if (bodyInput) { body = JSON.stringify(JSON.parse(bodyInput.value)); headers['content-type'] = 'application/json'; } } catch (error) { result.hidden = false; requestUrl.textContent = url; requestOutput.textContent = 'Body could not be parsed as JSON.'; status.textContent = 'Request not sent'; responseHeaders.textContent = '—'; responseBody.textContent = String(error); return; }
    result.hidden = false; requestUrl.textContent = url; requestOutput.textContent = JSON.stringify({ headers, ...(body ? { body: JSON.parse(body) } : {}) }, null, 2); status.textContent = 'Sending…'; responseHeaders.textContent = 'Waiting for response…'; responseBody.textContent = 'Waiting for response…'; execute.disabled = true;
    try { const response = await fetch(path, { method: form.dataset.method, headers, ...(body ? { body } : {}) }); const text = await response.text(); let formatted = text || '(no content)'; try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {} status.textContent = response.status + ' ' + response.statusText; responseHeaders.textContent = [...response.headers.entries()].map(([name, value]) => name + ': ' + value).join('\\n') || '(no headers)'; responseBody.textContent = formatted; }
    catch (error) { status.textContent = 'Request failed'; responseHeaders.textContent = '—'; responseBody.textContent = String(error); }
    finally { execute.disabled = false; }
  }));
})();`;

export function openApiConsole(documentPath: string): string {
  const operations = operationsFromDocument();
  const server = spec.servers[0];
  return `<div class="rest-docs"><section class="rest-overview" aria-labelledby="rest-document-heading"><h2 id="rest-document-heading">${escapeHtml(spec.info.title)} <span>· OpenAPI ${escapeHtml(spec.openapi)} · v${escapeHtml(spec.info.version)}</span></h2><p>${escapeHtml(spec.info.description)}</p><div class="rest-server"><div><span>Server</span><code>${escapeHtml(server.url)}</code></div><button type="button" data-copy-server="${escapeHtml(server.url)}">Copy</button></div><nav class="rest-artifacts" aria-label="OpenAPI document actions"><a class="button" href="${escapeHtml(documentPath)}">OpenAPI JSON</a><a class="button" href="${escapeHtml(documentPath)}?download=1" download>Download</a></nav></section>${spec.tags.map((tag) => `<section class="rest-tag" id="rest" aria-labelledby="rest-tag-${escapeHtml(tag.name)}"><div class="rest-tag-heading"><h2 id="rest-tag-${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</h2><p>${escapeHtml(tag.description)}</p></div><div class="openapi-operation-list">${operations.filter(({ operation }) => operation.tags.includes(tag.name)).map(renderOperation).join('')}</div></section>`).join('')}<details class="rest-schemas" id="openapi"><summary><h2>Schemas</h2><span>${Object.keys(spec.components.schemas).length} definitions</span></summary><div class="rest-schema-list">${Object.entries(spec.components.schemas).map(([name, schema]) => renderSchema(name, schema)).join('')}</div></details></div><script>${REST_RUNNER}</script>`;
}
