import swagger from '../../contracts/openapi/swagger.json';
import { escapeHtml } from '../lib/html';

type JsonObject = Record<string, unknown>;

interface SwaggerDocument extends JsonObject {
  basePath?: string;
  consumes?: string[];
  definitions?: Record<string, JsonObject>;
  paths: Record<string, JsonObject>;
  securityDefinitions?: Record<string, JsonObject>;
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

function asObjects(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.map(asObject) : [];
}

function operationEntries(spec: SwaggerDocument): OperationEntry[] {
  return Object.entries(spec.paths).flatMap(([path, item]) => Object.entries(asObject(item))
    .filter(([method]) => HTTP_METHODS.has(method.toLowerCase()))
    .map(([method, operation]) => ({ method: method.toUpperCase(), path, operation: asObject(operation) })));
}

function refName(schema: JsonObject): string | null {
  const ref = typeof schema.$ref === 'string' ? schema.$ref : '';
  return ref.startsWith('#/definitions/') ? ref.slice('#/definitions/'.length) : null;
}

function resolveSchema(schema: JsonObject, definitions: Record<string, JsonObject>): JsonObject {
  const name = refName(schema);
  return name ? asObject(definitions[name]) : schema;
}

function schemaType(schema: JsonObject): string {
  const reference = refName(schema);
  if (reference) return reference;
  if (schema.type === 'array') return `array<${schemaType(asObject(schema.items)) || 'any'}>`;
  return typeof schema.type === 'string' ? schema.type : 'any';
}

function constraintSummary(schema: JsonObject): string {
  const constraints: string[] = [];
  if (schema.default !== undefined) constraints.push(`default ${JSON.stringify(schema.default)}`);
  if (Array.isArray(schema.enum)) constraints.push(`one of ${schema.enum.map((value) => JSON.stringify(value)).join(', ')}`);
  if (typeof schema.format === 'string') constraints.push(schema.format);
  if (typeof schema.pattern === 'string') constraints.push(`pattern ${schema.pattern}`);
  if (typeof schema.minLength === 'number') constraints.push(`min ${schema.minLength}`);
  if (typeof schema.maxLength === 'number') constraints.push(`max ${schema.maxLength}`);
  return constraints.join(' · ');
}

function renderSchemaFields(schema: JsonObject, definitions: Record<string, JsonObject>, label: string): string {
  const resolved = resolveSchema(schema, definitions);
  const properties = asObject(resolved.properties);
  const required = new Set(Array.isArray(resolved.required) ? resolved.required.map(String) : []);
  const reference = refName(schema);
  const referenceLink = reference
    ? `<p class="subtle">Schema: <a href="#swagger-definition-${escapeHtml(reference)}"><code>${escapeHtml(reference)}</code></a></p>`
    : '';

  if (!Object.keys(properties).length) {
    return `${referenceLink}<pre class="schema-source" aria-label="${escapeHtml(label)} JSON schema">${escapeHtml(JSON.stringify(resolved, null, 2))}</pre>`;
  }

  const rows = Object.entries(properties).map(([name, property]) => {
    const propertySchema = asObject(property);
    const propertyReference = refName(propertySchema);
    const type = propertyReference
      ? `<a href="#swagger-definition-${escapeHtml(propertyReference)}"><code>${escapeHtml(propertyReference)}</code></a>`
      : `<code>${escapeHtml(schemaType(propertySchema))}</code>`;
    return `<tr><th scope="row"><code>${escapeHtml(name)}</code></th><td>${required.has(name) ? 'yes' : 'no'}</td><td>${type}</td><td>${escapeHtml(constraintSummary(propertySchema))}</td></tr>`;
  }).join('');

  return `${referenceLink}<div class="table-wrap"><table class="swagger-schema-table"><caption class="sr-only">${escapeHtml(label)} fields</caption><thead><tr><th scope="col">Field</th><th scope="col">Required</th><th scope="col">Type</th><th scope="col">Constraints</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function exampleForSchema(schema: JsonObject, definitions: Record<string, JsonObject>, depth = 0): unknown {
  if (depth > 5) return null;
  const resolved = resolveSchema(schema, definitions);
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  if (Array.isArray(resolved.enum) && resolved.enum.length) return resolved.enum[0];
  if (resolved.type === 'array') return [exampleForSchema(asObject(resolved.items), definitions, depth + 1)];
  if (resolved.type === 'object' || resolved.properties) {
    return Object.fromEntries(Object.entries(asObject(resolved.properties)).map(([name, property]) => [name, exampleForSchema(asObject(property), definitions, depth + 1)]));
  }
  if (resolved.type === 'integer' || resolved.type === 'number') return 0;
  if (resolved.type === 'boolean') return false;
  if (resolved.type === 'string') return resolved.format === 'date-time' ? '2026-08-31T12:00:00.000Z' : 'string';
  return null;
}

function inputValue(parameter: JsonObject): string {
  if (parameter['x-example'] !== undefined) return String(parameter['x-example']);
  if (parameter.default !== undefined) return String(parameter.default);
  return '';
}

function renderParameterInput(parameter: JsonObject, operationIndex: number): string {
  const name = String(parameter.name ?? 'parameter');
  const location = String(parameter.in ?? 'query');
  const required = Boolean(parameter.required);
  const description = typeof parameter.description === 'string' ? parameter.description : '';
  const sensitive = location === 'header' && /(authorization|signature|token|secret)/i.test(name);
  const helpId = `help-${operationIndex}-${location}-${name.replace(/[^a-zA-Z0-9]+/g, '-')}`;
  const inputType = parameter.type === 'integer' || parameter.type === 'number' ? 'number' : sensitive ? 'password' : 'text';
  const maximumLength = typeof parameter.maxLength === 'number' ? ` maxlength="${parameter.maxLength}"` : '';
  const pattern = typeof parameter.pattern === 'string' ? ` pattern="${escapeHtml(parameter.pattern)}"` : '';
  return `<label>${escapeHtml(name)} <span class="parameter-meta">${escapeHtml(location)} · ${required ? 'required' : 'optional'} · ${escapeHtml(schemaType(parameter))}</span>
    <input type="${inputType}" data-swagger-param data-parameter-name="${escapeHtml(name)}" data-parameter-in="${escapeHtml(location)}" value="${escapeHtml(inputValue(parameter))}"${required ? ' required' : ''}${maximumLength}${pattern} autocomplete="off"${description ? ` aria-describedby="${escapeHtml(helpId)}"` : ''}>
    ${description ? `<span class="input-help" id="${escapeHtml(helpId)}">${escapeHtml(description)}</span>` : ''}
  </label>`;
}

function renderSecurityInputs(operation: JsonObject, spec: SwaggerDocument): string {
  const requirements = Array.isArray(operation.security) ? operation.security.map(asObject) : [];
  const schemes = spec.securityDefinitions ?? {};
  return requirements.flatMap((requirement) => Object.keys(requirement)).map((name) => {
    const scheme = asObject(schemes[name]);
    if (scheme.in !== 'header' || typeof scheme.name !== 'string') return '';
    const prefix = typeof scheme['x-value-prefix'] === 'string' ? scheme['x-value-prefix'] : '';
    return `<label>${escapeHtml(name)} <span class="parameter-meta">${escapeHtml(String(scheme.name))} header · optional in explorer</span>
      <input type="password" data-swagger-auth data-auth-name="${escapeHtml(scheme.name)}" data-auth-prefix="${escapeHtml(prefix)}" autocomplete="off" placeholder="Leave empty to demonstrate the authorization boundary">
      <span class="input-help">Used for this request only; never stored by this page.</span>
    </label>`;
  }).join('');
}

function renderRequestContract(parameters: JsonObject[], definitions: Record<string, JsonObject>): string {
  const body = parameters.find((parameter) => parameter.in === 'body');
  const nonBody = parameters.filter((parameter) => parameter.in !== 'body');
  if (!body && !nonBody.length) return '';
  const parameterRows = nonBody.map((parameter) => `<tr><th scope="row"><code>${escapeHtml(String(parameter.name ?? ''))}</code></th><td>${escapeHtml(String(parameter.in ?? ''))}</td><td>${parameter.required ? 'yes' : 'no'}</td><td><code>${escapeHtml(schemaType(parameter))}</code></td><td>${escapeHtml(constraintSummary(parameter))}</td></tr>`).join('');
  return `<section class="contract-block"><h4>Request</h4>
    ${parameterRows ? `<div class="table-wrap"><table><caption class="sr-only">Request parameters</caption><thead><tr><th scope="col">Name</th><th scope="col">In</th><th scope="col">Required</th><th scope="col">Type</th><th scope="col">Constraints</th></tr></thead><tbody>${parameterRows}</tbody></table></div>` : ''}
    ${body ? `${renderSchemaFields(asObject(body.schema), definitions, 'Request body schema')}` : ''}
  </section>`;
}

function renderResponses(responses: JsonObject, definitions: Record<string, JsonObject>): string {
  const rows = Object.entries(responses).map(([status, response]) => {
    const value = asObject(response);
    const schema = asObject(value.schema);
    const reference = refName(schema);
    const type = Object.keys(schema).length
      ? reference ? `<a href="#swagger-definition-${escapeHtml(reference)}"><code>${escapeHtml(reference)}</code></a>` : `<code>${escapeHtml(schemaType(schema))}</code>`
      : '—';
    return `<tr><th scope="row"><code>${escapeHtml(status)}</code></th><td>${escapeHtml(String(value.description ?? ''))}</td><td>${type}</td></tr>`;
  }).join('');
  return `<section class="contract-block"><h4>Responses</h4><div class="table-wrap"><table><caption class="sr-only">Documented responses</caption><thead><tr><th scope="col">Status</th><th scope="col">Meaning</th><th scope="col">Schema</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function operationAnchor(method: string, path: string): string {
  return `swagger-${method.toLowerCase()}-${path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}`;
}

function renderOperation(entry: OperationEntry, index: number, spec: SwaggerDocument): string {
  const { method, path, operation } = entry;
  const parameters = asObjects(operation.parameters);
  const definitions = spec.definitions ?? {};
  const body = parameters.find((parameter) => parameter.in === 'body');
  const bodySchema = body ? asObject(body.schema) : {};
  const bodyExample = body ? JSON.stringify(exampleForSchema(bodySchema, definitions), null, 2) : '';
  const inputs = parameters.filter((parameter) => parameter.in !== 'body').map((parameter) => renderParameterInput(parameter, index)).join('');
  const securityInputs = renderSecurityInputs(operation, spec);
  const consumes = Array.isArray(operation.consumes) ? operation.consumes : spec.consumes;
  const contentType = consumes?.[0] ?? 'application/json';
  const title = `${method} ${spec.basePath ?? ''}${path}`;

  return `<details class="swagger-operation" id="${escapeHtml(operationAnchor(method, path))}">
    <summary><span class="swagger-route"><span class="http-method http-${method.toLowerCase()}">${escapeHtml(method)}</span><code>${escapeHtml(`${spec.basePath ?? ''}${path}`)}</code></span><strong>${escapeHtml(String(operation.summary ?? title))}</strong></summary>
    <div class="swagger-operation-body">
      ${operation.description ? `<p class="subtle">${escapeHtml(String(operation.description))}</p>` : ''}
      ${renderRequestContract(parameters, definitions)}
      ${renderResponses(asObject(operation.responses), definitions)}
      <form data-swagger-form data-method="${escapeHtml(method)}" data-path="${escapeHtml(path)}" data-base-path="${escapeHtml(spec.basePath ?? '')}" data-content-type="${escapeHtml(contentType)}" data-operation-index="${index}">
        ${inputs || securityInputs || body ? `<fieldset><legend>Try it</legend><div class="swagger-inputs">${inputs}${securityInputs}${body ? `<label class="swagger-body">JSON body <span class="parameter-meta">${body.required ? 'required' : 'optional'}</span><textarea data-swagger-body spellcheck="false"${body.required ? ' required' : ''}>${escapeHtml(bodyExample)}</textarea></label>` : ''}</div></fieldset>` : ''}
        <button class="button-primary" type="submit">Send ${escapeHtml(method)}</button>
        <div class="swagger-result" data-swagger-result hidden>
          <div class="field"><span>Request sent</span><pre data-swagger-request></pre></div>
          <div class="field"><span>Response</span><pre aria-live="polite" data-swagger-output></pre></div>
        </div>
      </form>
    </div>
  </details>`;
}

function renderDefinitions(definitions: Record<string, JsonObject>): string {
  return Object.entries(definitions).map(([name, schema]) => `<article class="schema-card" id="swagger-definition-${escapeHtml(name)}"><h3>${escapeHtml(name)}</h3>${renderSchemaFields(schema, definitions, `${name} schema`)}</article>`).join('');
}

const SWAGGER_RUNNER = `(() => {
  const redact = (name, value) => /(authorization|signature|token|secret)/i.test(name) && value ? '[redacted]' : value;
  const responseBody = async (response) => {
    if (response.status === 204) return '(no content)';
    const type = response.headers.get('content-type') || '';
    return type.includes('application/json') ? response.json() : response.text();
  };
  document.querySelectorAll('[data-swagger-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const method = form.dataset.method;
    let path = (form.dataset.basePath || '') + form.dataset.path;
    const query = new URLSearchParams();
    const headers = {};
    const previewHeaders = {};
    try {
      form.querySelectorAll('[data-swagger-param]').forEach((input) => {
        const name = input.dataset.parameterName;
        const location = input.dataset.parameterIn;
        const value = input.value.trim();
        if (input.required && !value) throw new Error(name + ' is required.');
        if (!value) return;
        if (location === 'path') path = path.replace('{' + name + '}', encodeURIComponent(value));
        if (location === 'query') query.append(name, value);
        if (location === 'header') { headers[name] = value; previewHeaders[name] = redact(name, value); }
      });
      const auth = form.querySelector('[data-swagger-auth]');
      if (auth && auth.value.trim()) {
        const name = auth.dataset.authName;
        headers[name] = (auth.dataset.authPrefix || '') + auth.value.trim();
        previewHeaders[name] = '[redacted]';
      }
      if ([...path.matchAll(/\\{([^}]+)\\}/g)].length) throw new Error('Every path parameter is required.');
      if ([...query].length) path += '?' + query.toString();
      const bodyInput = form.querySelector('[data-swagger-body]');
      let body;
      if (bodyInput) {
        const parsed = JSON.parse(bodyInput.value);
        body = JSON.stringify(parsed);
        headers['content-type'] = form.dataset.contentType || 'application/json';
        previewHeaders['content-type'] = headers['content-type'];
      }
      const requestPreview = form.querySelector('[data-swagger-request]');
      form.querySelector('[data-swagger-result]').hidden = false;
      requestPreview.textContent = method + ' ' + path + (Object.keys(previewHeaders).length ? '\\n' + Object.entries(previewHeaders).map(([name, value]) => name + ': ' + value).join('\\n') : '') + (body ? '\\n\\n' + JSON.stringify(JSON.parse(body), null, 2) : '');
      const output = form.querySelector('[data-swagger-output]');
      output.textContent = 'Running…';
      const response = await fetch(path, { method, headers, ...(body === undefined ? {} : { body }) });
      const payload = await responseBody(response);
      output.textContent = response.status + ' ' + response.statusText + '\\n\\n' + (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
    } catch (error) {
      form.querySelector('[data-swagger-result]').hidden = false;
      form.querySelector('[data-swagger-output]').textContent = 'Request not sent.\\n\\n' + String(error);
    }
  }));
  document.querySelectorAll('a[href^="#swagger-definition-"]').forEach((link) => link.addEventListener('click', () => {
    const browser = document.querySelector('[data-schema-browser]');
    if (browser) browser.open = true;
  }));
})();`;

/**
 * Render and run every REST operation from the served Swagger 2.0 contract.
 *
 * The contract owns paths, methods, inputs, security, request examples, and response
 * schemas. This renderer deliberately contains no endpoint-specific request logic.
 */
export function swaggerConsole(): string {
  const spec = swagger as SwaggerDocument;
  const entries = operationEntries(spec);

  return `<section class="api-heading" id="rest" aria-labelledby="rest-heading">
    <span id="openapi" aria-hidden="true"></span>
    <div><p class="eyebrow">Swagger 2.0</p><h2 id="rest-heading">REST API</h2></div>
    <a class="text-link" href="/v1/openapi.json">Raw contract →</a>
  </section>
  <div class="swagger-operation-list">${entries.map((entry, indexNumber) => renderOperation(entry, indexNumber, spec)).join('')}</div>
  <details class="schema-browser" data-schema-browser><summary><span>Schemas</span><span>${Object.keys(spec.definitions ?? {}).length}</span></summary><div class="schema-grid">${renderDefinitions(spec.definitions ?? {})}</div></details>
  <script>${SWAGGER_RUNNER}</script>`;
}
