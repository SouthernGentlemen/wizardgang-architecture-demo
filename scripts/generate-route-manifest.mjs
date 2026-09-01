import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
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

const demos = registryList.split(',').map((value) => value.trim()).filter(Boolean).map((symbol) => {
  const sourcePath = imports.get(symbol);
  if (!sourcePath) throw new Error(`Missing import for registered demo ${symbol}.`);
  const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
  const entry = {
    route: stringField(source, 'route'),
    title: stringField(source, 'title'),
    group: stringField(source, 'group'),
    source: stringField(source, 'sourcePath'),
    status: stringField(source, 'status'),
  };
  if (entry.route === '/mcp') entry.method = 'GET, POST';
  return entry;
});

const machine = [
  { route: '/admin', title: 'Demo Admin', group: 'Operations', source: 'src/ui/admin.ts', protected: true },
  { route: '/offline', title: 'Demo Offline', group: 'Operations', source: 'src/ui/admin.ts' },
  { route: '/health', title: 'Health JSON', group: 'Operations', source: 'src/api/operations.ts', machine: true, offline_reachable: true },
  { route: '/version', title: 'Version JSON', group: 'Operations', source: 'src/api/operations.ts', machine: true, offline_reachable: true },
  { route: '/sitemap.xml', title: 'Public Route Sitemap', group: 'Navigation', source: 'src/api/sitemap.ts', machine: true },
  { route: '/__api/operations/logs', title: 'Operational Logs JSON', group: 'Operations', source: 'src/api/operations.ts', machine: true, offline_reachable: true },
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
  { route: '/__api/git/evidence', title: 'Live GitHub Delivery Evidence', group: 'Delivery & Governance API', source: 'src/api/git-evidence.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/v1/demo-records', title: 'REST Demo Records', group: 'Interfaces API', source: 'src/api/records.ts', method: 'GET, POST', machine: true, offline_behavior: '503' },
  { route: '/v1/demo-records/{key}', title: 'REST Demo Record', group: 'Interfaces API', source: 'src/api/records.ts', method: 'GET, DELETE', machine: true, offline_behavior: '503' },
  { route: '/v1/openapi.json', title: 'Swagger 2.0 Contract', group: 'Interfaces API', source: 'src/api/openapi.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/graphql', title: 'GraphQL API and GraphiQL', group: 'Interfaces API', source: 'src/api/graphql.ts', method: 'GET, POST', machine: true, offline_behavior: '503' },
  { route: '/graphql/schema', title: 'GraphQL Schema', group: 'Interfaces API', source: 'src/api/graphql.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/v1/webhooks/demo', title: 'Signed Webhook Receiver', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/v1/webhooks/github', title: 'Verified GitHub Webhook Receiver', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/webhooks/demo', title: 'Visitor Signed Webhook Action', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/webhooks/events', title: 'Verified Webhook Events', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/webhooks/reset', title: 'Visitor Webhook Reset', group: 'Interfaces API', source: 'src/api/webhooks.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/oauth-pkce', title: 'OAuth PKCE Material', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/authorize', title: 'Authorization Policy Evaluation', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'POST', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/sso', title: 'SSO Trust Boundary', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/identity/saml/metadata', title: 'SAML Service Provider Metadata', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/identity/saml/inspect', title: 'SAML Validation Boundary', group: 'Interfaces API', source: 'src/api/identity.ts', method: 'GET', machine: true, offline_behavior: '503' },
  { route: '/__api/operations/billing', title: 'Synthetic Budget Scenario', group: 'Operations', source: 'src/api/billing.ts', method: 'POST', machine: true, offline_reachable: true },
  { route: '/__api/evidence/traceability', title: 'Traceability Evidence JSON', group: 'Delivery & Governance API', source: 'src/api/governance.ts', method: 'GET', machine: true, offline_behavior: '503' },
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
