import type { ReactNode } from 'react';
import {
  restDemoOpenApiDocument as spec,
  type RestDemoMediaType,
  type RestDemoOperation,
  type RestDemoParameter,
  type RestDemoResponseDefinition,
  type RestDemoSchema,
} from '../api/rest-demo-openapi';
import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';

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

export function restCodeExamples(rendered: RenderedOperation): readonly string[] {
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

function restBrowserMessages(localization: LocalizationContext): Readonly<Record<string, string>> {
  const exact = (english: string) => localization.exact(english);
  return Object.freeze({
    copied: exact('Copied'),
    copy: exact('Copy'),
    copySelected: exact('Copy selected code sample'),
    invalidJson: exact('Body could not be parsed as JSON.'),
    requestNotSent: exact('Request not sent'),
    sending: exact('Sending…'),
    waitingForResponse: exact('Waiting for response…'),
    noContent: exact('(no content)'),
    noHeaders: exact('(no headers)'),
    requestFailed: exact('Request failed'),
  });
}

function Parameters({ parameters, localization }: Readonly<{ parameters: RestDemoParameter[]; localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  if (!parameters.length) return <p className="subtle">{exact('No parameters.')}</p>;
  return <div className="table-wrap" tabIndex={0} aria-label={exact('Operation parameters')}>
    <table><thead><tr><th>{exact('Parameter')}</th><th>{exact('In')}</th><th>{exact('Required')}</th><th>{exact('Type')}</th></tr></thead>
      <tbody>{parameters.map((parameter) => <tr key={`${parameter.in}:${parameter.name}`}>
        <td><code>{parameter.name}</code></td><td>{parameter.in}</td><td>{exact(parameter.required ? 'Yes' : 'No')}</td><td><code>{referenceName(parameter.schema)}</code></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function RequestFields({ rendered, localization }: Readonly<{ rendered: RenderedOperation; localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  const { operation, parameters } = rendered;
  const scope = useDemoPresentationScope();
  const id = operationId(operation);
  const media = firstMediaType(operation.requestBody?.content);
  const body = media?.[1].example === undefined ? '' : JSON.stringify(media[1].example, null, 2);
  const fields = parameters.map((parameter) => {
    const inputId = scope.id(`${id}-${parameter.name}`);
    return <label htmlFor={inputId} key={`${parameter.in}:${parameter.name}`}>
      {parameter.name} <span className="parameter-meta">{parameter.in} · {exact(parameter.required ? 'required' : 'optional')} · {referenceName(parameter.schema)}</span>
      <input
        id={inputId}
        data-rest-parameter={parameter.name}
        defaultValue={String(parameter.example ?? parameter.schema.example ?? '')}
        required={parameter.required}
        autoComplete="off"
      />
    </label>;
  });
  const bodyField = media ? <label className="openapi-body" htmlFor={scope.id(`${id}-body`)}>
    {exact('Request body')} <span className="parameter-meta">{media[0]} · {referenceName(media[1].schema)}</span>
    <textarea id={scope.id(`${id}-body`)} data-rest-body="" spellCheck="false" required defaultValue={body} />
  </label> : null;
  return fields.length || bodyField
    ? <div className="openapi-inputs">{fields}{bodyField}</div>
    : <p className="subtle">{exact('This operation has no request inputs.')}</p>;
}

function responseSchema(response: RestDemoResponseDefinition): string {
  return referenceName(firstMediaType(response.content)?.[1].schema);
}

function Responses({ operation, localization }: Readonly<{ operation: RestDemoOperation; localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  return <div className="table-wrap" tabIndex={0} aria-label={exact('Declared responses')}>
    <table><thead><tr><th>{exact('Status')}</th><th>{exact('Meaning')}</th><th>{exact('Schema')}</th></tr></thead>
      <tbody>{Object.entries(operation.responses).map(([code, response]) => <tr key={code}>
        <td><code>{code}</code></td><td>{exact(response.description)}</td><td><code>{responseSchema(response)}</code></td>
      </tr>)}</tbody>
    </table>
  </div>;
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
  referencedSchemaNames(firstMediaType(rendered.operation.requestBody?.content)?.[1].schema, names);
  for (const response of Object.values(rendered.operation.responses)) {
    referencedSchemaNames(firstMediaType(response.content)?.[1].schema, names);
  }
  return [...names];
}

function Schema({ name, schema, localization }: Readonly<{ name: string; schema: RestDemoSchema; localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  const required = new Set(schema.required || []);
  const properties = Object.entries(schema.properties || {});
  return <article className="rest-contract-schema">
    <DemoHeading level={4}><code>{name}</code></DemoHeading>
    <p>{exact(schema.description || (properties.length ? '' : referenceName(schema)))}</p>
    {properties.length ? <div className="table-wrap" tabIndex={0} aria-label={exact(`${name} schema properties`)}>
      <table><thead><tr><th>{exact('Property')}</th><th>{exact('Type')}</th><th>{exact('Required')}</th><th>{exact('Description')}</th></tr></thead>
        <tbody>{properties.map(([property, definition]) => <tr key={property}>
          <td><code>{property}</code></td><td><code>{referenceName(definition)}</code></td><td>{exact(required.has(property) ? 'Yes' : 'No')}</td><td>{exact(definition.description || '—')}</td>
        </tr>)}</tbody>
      </table>
    </div> : null}
  </article>;
}

function RelevantSchemas({ rendered, localization }: Readonly<{ rendered: RenderedOperation; localization: LocalizationContext }>) {
  const names = relevantSchemaNames(rendered);
  if (!names.length) return <p className="subtle">{localization.exact('No component schemas are referenced by this operation.')}</p>;
  return <div className="rest-contract-schemas">{names.map((name) => <Schema key={name} name={name} schema={spec.components.schemas[name]} localization={localization} />)}</div>;
}

function CodeSamples({ rendered, localization }: Readonly<{ rendered: RenderedOperation; localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  const scope = useDemoPresentationScope();
  const id = operationId(rendered.operation);
  const examples = restCodeExamples(rendered);
  const labels = ['curl', 'JavaScript', 'Python'];
  return <details className="rest-code-samples">
    <summary>{exact('Code samples for this operation')}</summary>
    <div className="rest-code-samples-body">
      <div className="api-subheading">
        <div className="api-tabs" role="tablist" aria-label={exact('Code sample language')}>
          {labels.map((label, index) => <button
            id={scope.id(`${id}-tab-${index}`)}
            key={label}
            type="button"
            role="tab"
            aria-selected={index === 0}
            aria-controls={scope.id(`${id}-code-${index}`)}
            data-code-tab={index}
            tabIndex={index ? -1 : undefined}
          >{label}</button>)}
        </div>
        <button type="button" data-copy-code="">{exact('Copy selected code sample')}</button>
      </div>
      {examples.map((example, index) => <pre
        id={scope.id(`${id}-code-${index}`)}
        key={labels[index]}
        role="tabpanel"
        aria-labelledby={scope.id(`${id}-tab-${index}`)}
        tabIndex={0}
        data-code-panel={index}
        hidden={index > 0}
      >{example}</pre>)}
    </div>
  </details>;
}

function OperationSelector({ rendered, index, localization }: Readonly<{ rendered: RenderedOperation; index: number; localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const id = operationId(rendered.operation);
  return <button
    type="button"
    className="rest-operation-choice"
    data-rest-operation-select={rendered.operation.operationId}
    aria-pressed={index === 0}
    aria-controls={scope.id(`${id}-panel`)}
  >
    <span className={`http-method http-${rendered.method.toLowerCase()}`}>{rendered.method}</span>
    <span className="rest-operation-choice-copy"><code>{rendered.path}</code><strong>{localization.exact(rendered.operation.summary)}</strong></span>
  </button>;
}

function OperationPanel({ rendered, index, localization }: Readonly<{ rendered: RenderedOperation; index: number; localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  const scope = useDemoPresentationScope();
  const { method, path, operation, parameters } = rendered;
  const id = operationId(operation);
  const scoped = (suffix: string) => scope.id(`${id}-${suffix}`);
  return <section
    className="rest-operation-panel"
    id={scoped('panel')}
    data-rest-operation-panel={operation.operationId}
    aria-labelledby={scoped('heading')}
    hidden={index > 0}
  >
    <header className="rest-operation-header">
      <p className="eyebrow">{exact('Selected operation')}</p>
      <div className="rest-operation-title"><span className={`http-method http-${method.toLowerCase()}`}>{method}</span><code>{path}</code></div>
      <DemoHeading level={2} id={scoped('heading')}>{exact(operation.summary)}</DemoHeading>
      <p>{exact(operation.description)}</p>
    </header>
    <section className="rest-task-block" aria-labelledby={scoped('request-heading')}>
      <DemoHeading level={3} id={scoped('request-heading')}>{exact('Request')}</DemoHeading>
      <form data-rest-form="" data-method={method} data-path={path}>
        <RequestFields rendered={rendered} localization={localization} />{' '}
        <button className="button-primary" type="submit" data-rest-execute="">{exact(`Execute ${method}`)}</button>
      </form>
    </section>
    <section className="rest-task-block rest-response" aria-labelledby={scoped('response-heading')}>
      <DemoHeading level={3} id={scoped('response-heading')}>{exact('Response')}</DemoHeading>
      <div data-rest-result="" aria-live="polite">
        <p className="subtle" data-rest-response-empty="">{exact('Execute this operation to inspect the actual response.')}</p>
        <dl data-rest-response-details="" hidden>
          <dt>{exact('Request URL')}</dt><dd><code data-rest-request-url="" /></dd>
          <dt>{exact('Request')}</dt><dd><pre data-rest-request="" /></dd>
          <dt>{exact('Status')}</dt><dd><strong data-rest-status="" /></dd>
          <dt>{exact('Headers')}</dt><dd><pre data-rest-response-headers="" /></dd>
          <dt>{exact('Body')}</dt><dd><pre data-rest-response-body="" /></dd>
        </dl>
      </div>
    </section>
    <section className="rest-task-block rest-contract" aria-labelledby={scoped('contract-heading')}>
      <DemoHeading level={3} id={scoped('contract-heading')}>{exact('Contract')}</DemoHeading>
      <p className="subtle">{exact('Only the OpenAPI material used by the selected operation is shown here.')}</p>
      <DemoHeading level={4}>{exact('Parameters')}</DemoHeading>
      <Parameters parameters={parameters} localization={localization} />
      <DemoHeading level={4}>{exact('Declared responses')}</DemoHeading>
      <Responses operation={operation} localization={localization} />
      <DemoHeading level={4}>{exact('Referenced schemas')}</DemoHeading>
      <RelevantSchemas rendered={rendered} localization={localization} />
    </section>
    <section className="rest-task-block rest-operation-evidence" aria-labelledby={scoped('evidence-heading')}>
      <DemoHeading level={3} id={scoped('evidence-heading')}>{exact('Deeper evidence')}</DemoHeading>
      <CodeSamples rendered={rendered} localization={localization} />
    </section>
  </section>;
}

function OpenApiConsole({ documentPath, localization }: Readonly<{ documentPath: string; localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  const scope = useDemoPresentationScope();
  const operations = operationsFromDocument();
  const server = spec.servers[0];
  const pickerHeading = scope.id('rest-operation-picker-heading');
  return <div className="rest-operation-browser" data-rest-operation-browser="">
    <section className="rest-operation-picker" aria-labelledby={pickerHeading}>
      <p className="eyebrow">{exact('Operation selector')}</p>
      <DemoHeading level={2} id={pickerHeading}>{exact('Choose one request')}</DemoHeading>
      <p>{exact(spec.info.description)}</p>
      <div className="rest-server"><div><span>{exact('Server')}</span><code>{server.url}</code></div><button type="button" data-copy-server={server.url}>{exact('Copy')}</button></div>
      <div className="rest-operation-choices">{operations.map((rendered, index) => <OperationSelector key={rendered.operation.operationId} rendered={rendered} index={index} localization={localization} />)}</div>
      <details className="rest-deeper-evidence">
        <summary>{exact('Full OpenAPI evidence')}</summary>
        <p>{exact(`The complete OpenAPI ${spec.openapi} document remains authoritative, but it is kept out of the primary execution flow.`)}</p>
        <div className="rest-artifacts" aria-label={exact('Full OpenAPI document actions')}>
          <a className="button" href={documentPath} data-rest-full-openapi="">{exact('Open full OpenAPI JSON')}</a>
          <a className="button" href={`${documentPath}?download=1`} download>{exact('Download JSON')}</a>
        </div>
      </details>
    </section>
    <div className="rest-operation-detail">{operations.map((rendered, index) => <OperationPanel key={rendered.operation.operationId} rendered={rendered} index={index} localization={localization} />)}</div>
  </div>;
}

export function RestPresentation({ localization }: Readonly<{ localization: LocalizationContext }>): ReactNode {
  const exact = (english: string) => localization.exact(english);
  return <>
    <section className="page-header lab-page-header api-page-header">
      <DemoHeading level={1}>{exact('REST API')}</DemoHeading>
      <p className="lede">{exact('Choose one operation, run it, inspect the actual response, then compare that behavior with the matching OpenAPI contract.')}</p>
    </section>
    <aside className="assurance-notice" aria-label={exact('REST API boundary')}>
      <strong>{exact('Focused browser tutorial.')}</strong>{' '}
      {exact('These operations use the anonymous signed-cookie visitor API at')} <code>/api/labs/rest-demo-records</code>.{' '}
      {exact('The separate bearer-capable machine API remains documented by')} <code>/api/openapi.json</code>.
    </aside>
    <OpenApiConsole documentPath={routeUrl('interfaces.rest.openapi.json')} localization={localization} />
  </>;
}

export function restSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const presentationPath = `${routeUrl('demos.index')}#rest`;
  return createReactDemoSection(env, {
    key: 'rest',
    title: 'REST API',
    defaultPresentationPath: presentationPath,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.rest') }),
    browserMessages: restBrowserMessages(localization),
    children: <RestPresentation localization={localization} />,
  }, options);
}
