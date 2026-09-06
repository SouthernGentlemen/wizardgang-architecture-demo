import assert from 'node:assert/strict';
import fs from 'node:fs';

const failures = [];
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']);
const openapi = JSON.parse(fs.readFileSync('contracts/openapi/openapi.json', 'utf8'));
const reporting = JSON.parse(fs.readFileSync('contracts/assurance/reporting.schema.json', 'utf8'));
const registry = JSON.parse(fs.readFileSync('contracts/assurance/registry.schema.json', 'utf8'));

function fail(message) {
  failures.push(message);
}

function resolveLocalRef(ref, root = openapi) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined;
  return ref.slice(2).split('/').reduce((value, segment) => {
    if (!value || typeof value !== 'object') return undefined;
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~');
    return value[key];
  }, root);
}

function visit(value, pointer = '#', resourceRoot = openapi) {
  if (!value || typeof value !== 'object') return;
  const currentResourceRoot = !Array.isArray(value) && typeof value.$id === 'string' ? value : resourceRoot;
  if (
    typeof value.$ref === 'string'
    && value.$ref.startsWith('#/')
    && resolveLocalRef(value.$ref, currentResourceRoot) === undefined
  ) {
    fail(`unresolved OpenAPI reference at ${pointer}: ${value.$ref}`);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, `${pointer}/${index}`, currentResourceRoot));
    return;
  }
  for (const [key, entry] of Object.entries(value)) visit(entry, `${pointer}/${key}`, currentResourceRoot);
}

if (openapi.openapi !== '3.1.0') fail('REST contract must be OpenAPI 3.1.0');
if (openapi.jsonSchemaDialect !== 'https://json-schema.org/draft/2020-12/schema') {
  fail('OpenAPI must declare the JSON Schema 2020-12 dialect');
}
const serverPath = (() => {
  try {
    return new URL(openapi.servers?.[0]?.url ?? '').pathname.replace(/\/$/, '') || '/';
  } catch {
    return '';
  }
})();
if (serverPath !== '/v1') fail('OpenAPI server URL must expose the stable /v1 base path');
if (!openapi.components?.securitySchemes?.BearerToken) fail('BearerToken security scheme is missing');
if (openapi.components?.['x-assurance-query-responses']) {
  fail('OpenAPI must not reuse a Responses Object through components.x-assurance-query-responses');
}

try {
  assert.deepStrictEqual(openapi.components?.schemas?.ReportingContract, reporting);
} catch {
  fail('ReportingContract drifted from contracts/assurance/reporting.schema.json; run npm run generate:openapi');
}
try {
  assert.deepStrictEqual(openapi.components?.schemas?.AssuranceRegistryContract, registry);
} catch {
  fail('AssuranceRegistryContract drifted from contracts/assurance/registry.schema.json; run npm run generate:openapi');
}

let operationCount = 0;
for (const [path, pathItem] of Object.entries(openapi.paths ?? {})) {
  if (!path.startsWith('/')) fail(`OpenAPI path must be relative to the /v1 server: ${path}`);
  for (const [method, operation] of Object.entries(pathItem ?? {})) {
    if (!HTTP_METHODS.has(method.toLowerCase())) continue;
    operationCount += 1;
    if (!operation || typeof operation !== 'object') {
      fail(`invalid OpenAPI operation: ${method.toUpperCase()} ${path}`);
      continue;
    }
    if (typeof operation['x-route-id'] !== 'string' || !operation['x-route-id'].trim()) {
      fail(`documented operation is missing x-route-id: ${method.toUpperCase()} ${path}`);
    }
    if (!operation.responses || typeof operation.responses !== 'object' || Array.isArray(operation.responses)) {
      fail(`documented operation is missing a Responses Object: ${method.toUpperCase()} ${path}`);
    } else if ('$ref' in operation.responses) {
      fail(`Responses Object cannot be replaced by $ref: ${method.toUpperCase()} ${path}`);
    }
  }
}
if (operationCount === 0) fail('OpenAPI contract documents no REST operations');
visit(openapi);

if (fs.existsSync('contracts/openapi/swagger.json')) fail('legacy contracts/openapi/swagger.json must not exist');

const graphql = fs.readFileSync('contracts/graphql/schema.graphql', 'utf8');
if (!graphql.includes('demoRecords')) fail('GraphQL schema is missing demoRecords');
const mcp = JSON.parse(fs.readFileSync('contracts/mcp/tools.json', 'utf8'));
if (mcp.status !== 'working' || mcp.transport?.path !== '/mcp/server' || mcp.protocol?.current !== '2026-07-28') {
  fail('MCP manifest does not match the live transport');
}
for (const name of ['ping', 'list_demo_records']) {
  const tool = mcp.tools?.find((candidate) => candidate.name === name);
  if (!tool?.inputSchema || !tool?.outputSchema || tool.annotations?.readOnlyHint !== true) {
    fail(`MCP manifest is missing the complete ${name} contract`);
  }
}
const webhooks = JSON.parse(fs.readFileSync('contracts/webhooks/events.json', 'utf8'));
if (webhooks.status !== 'working' || !webhooks.events?.some((event) => event.type === 'demo.record.changed')) {
  fail('webhook contract does not match the live event');
}

if (failures.length) {
  console.error('Contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Contract validation passed: ${operationCount} OpenAPI operations plus synchronized assurance, GraphQL, MCP, and webhook contracts.`);
