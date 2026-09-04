import fs from 'node:fs';

const failures = [];
const swagger = JSON.parse(fs.readFileSync('contracts/openapi/swagger.json', 'utf8'));
const routeManifest = JSON.parse(fs.readFileSync('docs/route-manifest.json', 'utf8'));
const routed = new Map(routeManifest.map((entry) => [entry.route, entry]));

if (swagger.swagger !== '2.0') failures.push('REST contract must remain Swagger 2.0');
if (swagger.basePath !== '/v1') failures.push('REST basePath must remain /v1');
for (const [path, operations] of Object.entries(swagger.paths || {})) {
  const route = `${swagger.basePath}${path}`.replace(/\/+/g, '/');
  const entry = routed.get(route);
  if (!entry) {
    failures.push(`contract path is not routed: ${route}`);
    continue;
  }
  const routedMethods = new Set(String(entry.method || 'GET').split(',').map((method) => method.trim().toUpperCase()));
  for (const method of Object.keys(operations || {})) {
    const normalizedMethod = method.toUpperCase();
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(normalizedMethod)) continue;
    if (!routedMethods.has(normalizedMethod)) failures.push(`contract method is not routed: ${normalizedMethod} ${route}`);
  }
}
if (!swagger.securityDefinitions?.BearerToken) failures.push('BearerToken security definition is missing');

const graphql = fs.readFileSync('contracts/graphql/schema.graphql', 'utf8');
if (!graphql.includes('demoRecords')) failures.push('GraphQL schema is missing demoRecords');
const mcp = JSON.parse(fs.readFileSync('contracts/mcp/tools.json', 'utf8'));
if (mcp.status !== 'working' || mcp.transport?.path !== '/mcp/server' || mcp.protocol?.current !== '2026-07-28') failures.push('MCP manifest does not match the live transport');
for (const name of ['ping', 'list_demo_records']) {
  const tool = mcp.tools?.find((candidate) => candidate.name === name);
  if (!tool?.inputSchema || !tool?.outputSchema || tool.annotations?.readOnlyHint !== true) failures.push(`MCP manifest is missing the complete ${name} contract`);
}
const webhooks = JSON.parse(fs.readFileSync('contracts/webhooks/events.json', 'utf8'));
if (webhooks.status !== 'working' || !webhooks.events?.some((event) => event.type === 'demo.record.changed')) failures.push('webhook contract does not match the live event');

if (failures.length) {
  console.error('Contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Contract validation passed: ${Object.keys(swagger.paths).length} REST paths plus GraphQL, MCP, and webhook contracts.`);
