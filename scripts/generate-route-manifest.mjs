import fs from 'node:fs';
import path from 'node:path';
import { loadAssuranceRegistry } from './lib/assurance-registry.mjs';
import {
  assuranceRouteDeclarations,
  assuranceRoutesForDataset,
} from '../src/assurance/route-contract.js';

const root = process.cwd();
const assuranceRegistry = loadAssuranceRegistry(root);
const assuranceDeclarations = assuranceRouteDeclarations(assuranceRegistry);
const assuranceDemoKinds = new Map([
  ['src/demos/evidence.ts', 'evidence'],
  ['src/demos/compliance.ts', 'compliance'],
  ['src/demos/security.ts', 'advisories'],
  ['src/demos/risks.ts', 'risks'],
  ['src/demos/incidents.ts', 'incidents'],
]);
const registrySource = fs.readFileSync(path.join(root, 'src/demos/registry.ts'), 'utf8');
const imports = new Map(
  [...registrySource.matchAll(/import\s+(\w+)\s+from\s+'\.\/([^']+)'/g)]
    .map((match) => [match[1], `src/demos/${match[2]}.ts`]),
);
const registryList = /export const demos: DemoDefinition\[\] = \[([\s\S]*?)\];/.exec(registrySource)?.[1];
if (!registryList) throw new Error('Could not read the demo registry list.');

function stringField(source, field) {
  const value = new RegExp(`["']?${field}["']?\\s*:\\s*(["'])(.*?)\\1`).exec(source)?.[2];
  if (!value) throw new Error(`Missing ${field} in registered demo source.`);
  return value;
}

function assuranceDemoRoute(sourcePath) {
  const kind = assuranceDemoKinds.get(sourcePath);
  if (!kind) return undefined;
  const route = assuranceRoutesForDataset(assuranceRegistry, kind)?.html;
  if (!route) throw new Error(`${sourcePath} is registered as an assurance demo without a canonical HTML route.`);
  return route;
}

const demos = registryList.split(',').map((value) => value.trim()).filter(Boolean).map((symbol) => {
  const sourcePath = imports.get(symbol);
  if (!sourcePath) throw new Error(`Missing import for registered demo ${symbol}.`);
  const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
  const entry = {
    route: assuranceDemoRoute(sourcePath) ?? stringField(source, 'route'),
    title: stringField(source, 'title'),
    group: stringField(source, 'group'),
    source: stringField(source, 'sourcePath'),
    status: stringField(source, 'status'),
  };
  if (entry.route === '/graphql') entry.method = 'GET, POST';
  return entry;
});

function assuranceMachineRoute(owner, routeKind, metadata) {
  const declaration = assuranceDeclarations.find((candidate) => candidate.owner === owner);
  const route = routeKind === 'apiRecord' ? declaration?.routes?.apiRecord : declaration?.routes?.api;
  if (!route) throw new Error(`Missing canonical assurance ${routeKind} route for ${owner}.`);
  return {
    route: routeKind === 'apiRecord' ? route.replace('{id}', '{recordId}') : route,
    ...metadata,
    method: 'GET',
    machine: true,
    offline_behavior: '503',
  };
}

const machine = [
  { route: '/admin', title: 'Demo Admin', group: 'Operations', source: 'src/ui/admin.ts', protected: true },
  { route: '/offline', title: 'Demo Offline', group: 'Operations', source: 'src/ui/admin.ts' },
  { route: '/health', title: 'Health JSON', group: 'Operations', source: 'src/api/operations.ts', machine: true, offline_reachable: true },
  { route: '/version', title: 'Version JSON', group: 'Operations', source: 'src/api/operations.ts', machine: true, offline_reachable: true },
  { route: '/og.png', title: 'WizardGang Social Preview', group: 'Navigation', source: 'src/ui/brand-assets.ts', method: 'GET, HEAD', machine: true, offline_reachable: true },
  { route: '/robots.txt', title: 'ChatGPT Crawler Policy', group: 'Operations', source: 'src/lib/crawler-control.ts', method: 'GET, HEAD', machine: true, offline_reachable: true },
  { route: '/.well-known/security.txt', title: 'Vulnerability Reporting Contact', group: 'Delivery & Governance', source: 'src/api/security-policy.ts', method: 'GET, HEAD', machine: true, offline_reachable: true },
  { route: '/sitemap.xml', title: 'Public Route Sitemap', group: 'Navigation', source: 'src/api/sitemap.ts', machine: true },
  { route: '/__api/operations/logs', title: 'Operational Logs JSON', group: 'Operations', source: 'src/api/operations.ts', machine: true, offline_reachable: true },
  { route: '/__api/operations/cloudflare-usage', title: 'Sanitized Cloudflare Usage JSON', group: 'Operations', source: 'src/api/operations.ts', machine: true, offline_reachable: true },
  { route: '/__api/edge/inspect', title: 'Edge Context JSON', group: 'Platform API', source: 'src/api/runtime.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/workers/compute', title: 'Stateless Worker Compute', group: 'Platform API', source: 'src/api/runtime.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/durable/counter', title: 'Durable Object Counter', group: 'Platform API', source: 'src/api/durable.ts', method: 'GET, POST', machine: true, offline_behavior: '503' },
  { route: '/__api/d1/users', title: 'D1 Demo Users', group: 'Platform API', source: 'src/api/d1-lab.ts', method: 'GET, POST', machine: true, offline_behavior: '503' },
  { route: '/__api/d1/users/{id}', title: 'D1 Demo User', group: 'Platform API', source: 'src/api/d1-lab.ts', method: 'PATCH, DELETE', machine: true, offline_behavior: '503' },
  { route: '/__api/d1/tasks', title: 'D1 Demo Tasks', group: 'Platform API', source: 'src/api/d1-lab.ts', method: 'GET, POST', machine: true, offline_behavior: '503' },
  { route: '/__api/d1/tasks/{id}', title: 'D1 Demo Task', group: 'Platform API', source: 'src/api/d1-lab.ts', method: 'PATCH, DELETE', machine: true, offline_behavior: '503' },
  { route: '/__api/d1/reset', title: 'D1 Demo Reset', group: 'Platform API', source: 'src/api/d1-lab.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/r2/demo', title: 'Visitor R2 Object Action', group: 'Platform API', source: 'src/api/r2.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/r2/object', title: 'R2 Object API', group: 'Platform API', source: 'src/api/r2.ts', method: 'GET, PUT, DELETE', machine: true, offline_behavior: '503' },
  { route: '/__api/r2/files', title: 'R2 Visitor Files', group: 'Platform API', source: 'src/api/r2.ts', method: 'GET, POST', machine: true, offline_behavior: '503' },
  { route: '/__api/r2/files/{id}', title: 'R2 Visitor File', group: 'Platform API', source: 'src/api/r2.ts', method: 'GET, DELETE', machine: true, offline_behavior: '503' },
  { route: '/__api/r2/reset', title: 'R2 Visitor Reset', group: 'Platform API', source: 'src/api/r2.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/accessibility/lab', title: 'Sandboxed Accessibility Lab', group: 'Standards API', source: 'src/ui/accessibility-lab.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/git/evidence', title: 'Authoritative GitHub Reporting', group: 'Delivery & Governance API', source: 'src/api/git-evidence.ts', method: 'GET, POST', machine: true, protected_write: true, offline_behavior: '503' },
  { route: '/__api/git/demo', title: 'Live Git Delivery Lifecycle', group: 'Delivery & Governance API', source: 'src/api/git-demo.ts', method: 'GET, POST', machine: true, protected_write: true, offline_behavior: '503' },
  { route: '/__api/git/demo/release', title: 'Live Git Merge and Release', group: 'Delivery & Governance API', source: 'src/api/git-demo.ts', method: 'POST', machine: true, protected: true, offline_behavior: '503' },
  { route: '/v1/demo-records', title: 'REST Demo Records', group: 'Interfaces API', source: 'src/api/records.ts', method: 'GET, POST', machine: true, offline_behavior: '503' },
  { route: '/v1/demo-records/{key}', title: 'REST Demo Record', group: 'Interfaces API', source: 'src/api/records.ts', method: 'GET, PUT, DELETE', machine: true, offline_behavior: '503' },
  { route: '/__api/api-sandbox/reset', title: 'REST Visitor Sandbox Reset', group: 'Interfaces API', source: 'src/api/records.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/v1/openapi.json', title: 'Swagger 2.0 Contract', group: 'Interfaces API', source: 'src/api/openapi.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/v1/openapi.yaml', title: 'OpenAPI 2.0 YAML Contract', group: 'Interfaces API', source: 'src/api/openapi.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/graphql/console', title: 'Embedded GraphiQL', group: 'Interfaces API', source: 'src/ui/graphiql-assets.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/graphql/schema', title: 'GraphQL Schema', group: 'Interfaces API', source: 'src/api/graphql.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__assets/graphiql/{asset}', title: 'Locally Bundled GraphiQL Assets', group: 'Interfaces API', source: 'src/ui/graphiql-assets.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/v1/webhooks/demo', title: 'Signed Webhook Receiver', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/v1/webhooks/github', title: 'Verified GitHub Webhook Receiver', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/webhooks/demo', title: 'Visitor Signed Webhook Action', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/webhooks/events', title: 'Verified Webhook Events', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/webhooks/reset', title: 'Visitor Webhook Reset', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/mcp/server', title: 'MCP Streamable HTTP Server', group: 'Interfaces API', source: 'src/api/mcp.ts', method: 'GET, POST, DELETE', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/oauth-pkce', title: 'OAuth PKCE Material', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/authorize', title: 'Authorization Policy Evaluation', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/token', title: 'Short-lived Demo API Token', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/sso', title: 'SSO Trust Boundary', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/saml/metadata', title: 'SAML Service Provider Metadata', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/saml/inspect', title: 'SAML Validation Boundary', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/microsoft', title: 'Microsoft Entra ID OIDC Start', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/microsoft/callback', title: 'Microsoft Entra ID OIDC Callback', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/google', title: 'Google OIDC Start', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/google/callback', title: 'Google OIDC Callback', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/github', title: 'GitHub OAuth Start', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/github/callback', title: 'GitHub OAuth Callback', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/saml', title: 'Microsoft Entra ID SAML Start', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/saml/acs', title: 'Microsoft Entra ID SAML ACS', group: 'Identity', source: 'src/api/identity.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/identity/session', title: 'Identity Session', group: 'Identity', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/logout', title: 'Identity Logout', group: 'Identity', source: 'src/api/identity.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/operations/billing', title: 'Synthetic Budget Scenario', group: 'Operations', source: 'src/api/billing.ts', method: 'POST', machine: true, offline_reachable: true },
  assuranceMachineRoute('registry', 'api', { title: 'Public Assurance Registry', group: 'Delivery & Governance API', source: 'src/api/assurance-registry.ts' }),
  assuranceMachineRoute('evidence', 'api', { title: 'Public Assurance Evidence', group: 'Delivery & Governance API', source: 'src/api/assurance-registry.ts' }),
  assuranceMachineRoute('compliance', 'api', { title: 'Public Compliance Assurance JSON', group: 'Delivery & Governance API', source: 'src/api/assurance.ts' }),
  assuranceMachineRoute('compliance', 'apiRecord', { title: 'Public Compliance Assurance Record', group: 'Delivery & Governance API', source: 'src/api/assurance.ts' }),
  { route: '/__api/evidence/traceability', title: 'Traceability Evidence JSON', group: 'Delivery & Governance API', source: 'src/api/governance.ts', method: 'GET', machine: true, offline_behavior: '503' },
  assuranceMachineRoute('risks', 'api', { title: 'Disclosure-safe Risk Assurance JSON', group: 'Delivery & Governance API', source: 'src/api/assurance.ts' }),
  assuranceMachineRoute('incidents', 'api', { title: 'Disclosure-safe Incident and Exercise Assurance JSON', group: 'Delivery & Governance API', source: 'src/api/assurance.ts' }),
  assuranceMachineRoute('advisories', 'api', { title: 'Published Security Advisories', group: 'Delivery & Governance API', source: 'src/api/advisories.ts' }),
  { route: '/__api/governance/security-controls', title: 'Security Control Evidence JSON', group: 'Delivery & Governance API', source: 'src/api/governance.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/governance/ai-evaluation', title: 'AI Boundary Evaluation', group: 'Delivery & Governance API', source: 'src/api/governance.ts', method: 'POST', machine: true, offline_behavior: '503' },
].map((entry) => ({ ...entry, status: 'working' }));

const manifest = [
  { route: '/', title: 'Architecture Map', group: 'Navigation', source: 'src/ui/page.ts', status: 'working' },
  ...demos,
  ...machine,
];

const output = `${JSON.stringify(manifest, null, 2)}\n`;
const manifestPath = path.join(root, 'docs/route-manifest.json');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(manifestPath, 'utf8') !== output) {
    throw new Error('docs/route-manifest.json is stale; run npm run generate:routes.');
  }
  console.log(`Route manifest is current: ${demos.length} registered HTML demos and ${manifest.length} total contract entries.`);
} else {
  fs.writeFileSync(manifestPath, output);
  console.log(`Generated ${manifest.length} route entries from ${demos.length} registered HTML demos and the machine-route contract.`);
}
