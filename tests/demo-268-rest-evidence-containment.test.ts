import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { restDemoOpenApiDocument } from '../src/api/rest-demo-openapi';
import { openApiConsole } from '../src/demos/openapi-console';
import { demonstrations } from '../src/demos/demos-page';
import { applicationRouteRegistry } from '../src/routing/application-routes';

const releasedFragments = [
  'd1',
  'r2',
  'rest',
  'graphql',
  'webhooks',
  'identity',
  'mcp',
  'edge',
  'workers',
  'durable-objects',
  'accessibility',
  'i18n',
] as const;

describe('DEMO-268 REST evidence containment', () => {
  it('keeps REST at the stable fragment and all twelve released demonstrations registered', () => {
    expect(demonstrations.map((demo) => demo.id)).toEqual(releasedFragments);
    expect(demonstrations.find((demo) => demo.id === 'rest')?.id).toBe('rest');

    const registrySource = readFileSync('src/demos/demos-page.ts', 'utf8');
    const browserSource = readFileSync('src/browser/demos.ts', 'utf8');
    expect(registrySource).toContain("export const DEFAULT_DEMO_ID = 'd1'");
    expect(browserSource).toContain("history.pushState(null, '', nextHash)");
    expect(browserSource).toContain("window.addEventListener('hashchange', applySelection)");
    expect(browserSource).toContain("window.addEventListener('popstate', applySelection)");
    expect(registrySource).not.toContain('All demos');
  });

  it('renders an operation-first REST task surface with only one operation visible by default', () => {
    const html = openApiConsole('/api/labs/rest-demo-openapi.json');
    const operationCount = 6;

    expect(Object.keys(restDemoOpenApiDocument.paths)).toHaveLength(2);
    expect(html).toContain('data-rest-operation-browser');
    expect(html.match(/data-rest-operation-select=/g)).toHaveLength(operationCount);
    expect(html.match(/data-rest-operation-panel=/g)).toHaveLength(operationCount);
    expect(html.match(/data-rest-operation-panel="[^"]+"[^>]* hidden/g)).toHaveLength(operationCount - 1);
    expect(html).toContain('<h3 id="rest-demo-listRecords-request-heading">Request</h3>');
    expect(html).toContain('<h3 id="rest-demo-listRecords-response-heading">Response</h3>');
    expect(html).toContain('<h3 id="rest-demo-listRecords-contract-heading">Contract</h3>');
    expect(html).not.toContain('Full OpenAPI contract');
    expect(html).not.toContain('<div class="rest-schema-list">');
  });

  it('keeps the full OpenAPI document reachable only as deeper evidence', () => {
    const html = openApiConsole('/api/labs/rest-demo-openapi.json');
    expect(html).toContain('<details class="rest-deeper-evidence">');
    expect(html).toContain('data-rest-full-openapi>Open full OpenAPI JSON</a>');
    expect(html).toContain('href="/api/labs/rest-demo-openapi.json?download=1" download');
    expect(html).not.toContain(JSON.stringify(restDemoOpenApiDocument));
  });

  it('binds request, execution, response, and contract context to the selected operation', () => {
    const html = openApiConsole('/api/labs/rest-demo-openapi.json');
    expect(html).toContain('data-rest-operation-select="listRecords"');
    expect(html).toContain('data-rest-operation-panel="listRecords"');
    expect(html).toContain('data-rest-form data-method="GET" data-path="/api/labs/rest-demo-records"');
    expect(html).toContain('data-rest-operation-select="updateRecord"');
    expect(html).toContain('data-rest-form data-method="PATCH" data-path="/api/labs/rest-demo-records/{id}"');
    expect(html).toContain('Only the OpenAPI material used by the selected operation is shown here.');
    expect(html).toContain("panel.hidden = panel.dataset.restOperationPanel !== operationId");
  });

  it('does not change REST machine routes, route inventory, or canonical OpenAPI source', () => {
    const routes = applicationRouteRegistry.declarations.map((route) => ({
      route: route.pattern,
      methods: route.methods,
      kind: route.kind,
    }));

    for (const expected of [
      '/api/labs/rest-demo-openapi.json',
      '/api/labs/rest-demo-records',
      '/api/labs/rest-demo-records/:id',
      '/api/openapi.json',
      '/api/labs/rest-records',
      '/api/labs/rest-records/:id',
    ]) {
      expect(routes.some((route) => route.route === expected && route.kind === 'api')).toBe(true);
    }
    expect(routes.some((route) => route.kind === 'page' && route.route.includes('rest'))).toBe(false);
    expect(readFileSync('src/api/rest-demo-openapi.ts', 'utf8')).toContain("openapi: '3.0.3'");
    expect(readFileSync('contracts/openapi/openapi.json', 'utf8')).toContain('"/api/labs/rest-records"');
  });

  it('preserves the DEMO-267 persistent pane/inspector contract and removes the old REST disclosure dump', () => {
    const demosSource = readFileSync('src/browser/demos.ts', 'utf8');
    const apiSource = readFileSync('src/demos/api-page.ts', 'utf8');
    const demosStyles = readFileSync('src/styles/demos.css', 'utf8');

    expect(demosStyles).toContain('grid-template-columns:minmax(0,7fr) minmax(16rem,3fr)');
    expect(demosSource).toContain('pending.get(activeId)?.abort()');
    expect(demosSource).toContain("panel.querySelector('[data-demo-section]')?.dispatchEvent(new CustomEvent('demo:deactivate'))");
    expect(demosSource).toContain('if (htmlCache.size >= config.demos.length');
    expect(demosSource).toContain("type InspectorMode = 'Guide' | 'Request' | 'Evidence'");
    expect(apiSource).not.toContain('rest-full-contract');
    expect(apiSource).not.toContain('rest-guided-flow');
    expect(apiSource).not.toContain('durationMs');
    expect(apiSource).not.toContain('Full OpenAPI contract');
  });
});
