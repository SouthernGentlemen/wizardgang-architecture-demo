import fs from 'node:fs';
import path from 'node:path';
import { loadAssuranceRegistry } from './lib/assurance-registry.mjs';
import { assuranceRouteDeclarations } from '../src/assurance/route-contract.js';

const root = process.cwd();
const manifestPath = path.join(root, 'docs', 'route-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const routes = new Set(manifest.map((entry) => entry.route));
const assuranceRegistry = loadAssuranceRegistry(root);
const assuranceRequiredRoutes = assuranceRouteDeclarations(assuranceRegistry).flatMap((declaration) => {
  const declared = declaration.routes ?? {};
  return [
    declared.html,
    declared.api,
    declared.apiRecord?.replace('{id}', '{recordId}'),
  ].filter(Boolean);
});

const requiredRoutes = [
  '/', '/edge', '/workers', '/durable-objects', '/d1', '/r2',
  '/api', '/identity', '/mcp', '/i18n', '/accessibility', '/git',
  '/governance', '/governance/concerns', '/dashboard', '/dashboard/uptime', '/dashboard/docs',
  '/dashboard/logs', '/dashboard/billing', '/admin', '/offline', '/health', '/version',
  '/sitemap.xml', '/og.png', '/robots.txt', '/.well-known/security.txt', '/__api/operations/logs',
  '/__api/operations/cloudflare-usage',
  '/__api/edge/inspect', '/__api/workers/compute', '/__api/durable/counter', '/__api/d1/users', '/__api/d1/users/{id}', '/__api/d1/tasks', '/__api/d1/tasks/{id}', '/__api/d1/reset',
  '/__api/r2/files', '/__api/r2/files/{id}', '/__api/r2/reset',
  '/__api/accessibility/lab',
  '/__api/git/evidence',
  '/__api/r2/demo', '/__api/r2/object', '/v1/demo-records', '/v1/demo-records/{key}', '/__api/api-sandbox/reset',
  '/v1/openapi.json', '/v1/openapi.yaml', '/graphql', '/graphql/console', '/graphql/schema', '/__assets/graphiql/{asset}', '/v1/webhooks/demo', '/v1/webhooks/github',
  '/__api/webhooks/demo', '/__api/webhooks/events', '/__api/webhooks/reset', '/__api/identity/oauth-pkce', '/__api/identity/authorize', '/__api/identity/token',
  '/__api/identity/sso', '/identity/saml/metadata', '/__api/identity/saml/inspect',
  '/identity/microsoft', '/identity/microsoft/callback', '/identity/google', '/identity/google/callback',
  '/identity/github', '/identity/github/callback', '/identity/saml', '/identity/saml/acs', '/identity/session', '/identity/logout',
  '/__api/operations/billing', '/__api/evidence/traceability',
  '/__api/governance/security-controls', '/__api/governance/ai-evaluation',
  ...assuranceRequiredRoutes,
];

const disallowedManifestRoutes = ['/__api/demo/run', '/__api/demo/events'];

const failures = [];
if (routes.size !== manifest.length) failures.push('manifest contains duplicate routes');
const htmlDemos = manifest.filter((entry) => entry.source?.startsWith('src/demos/'));
if (htmlDemos.length !== 25) failures.push(`expected 25 registered HTML demos; found ${htmlDemos.length}`);
const expectedGroups = ['Platform', 'Interfaces', 'Standards', 'Delivery & Governance', 'Operations'];
const actualGroups = [...new Set(htmlDemos.map((entry) => entry.group))];
if (JSON.stringify(actualGroups) !== JSON.stringify(expectedGroups)) failures.push(`unexpected HTML demo groups: ${actualGroups.join(', ')}`);
for (const route of requiredRoutes) {
  if (!routes.has(route)) failures.push(`missing route in manifest: ${route}`);
}
for (const route of disallowedManifestRoutes) {
  if (routes.has(route)) failures.push(`removed route remains in manifest: ${route}`);
}

for (const entry of manifest) {
  if (entry.status !== 'working') failures.push(`route is not marked working: ${entry.route}`);
  if (!entry.source) continue;
  const sourcePath = path.join(root, entry.source);
  if (!fs.existsSync(sourcePath)) failures.push(`manifest source does not exist: ${entry.route} -> ${entry.source}`);
}

for (const requiredFile of [
  'docs/ARCHITECTURE-STANDARD.md',
  'docs/OPERATIONS.md',
  'docs/ROUTES.md',
  'docs/ASSURANCE.md',
  'docs/ASSURANCE-API.md',
  'docs/EVIDENCE.md',
  'docs/IMPLEMENTATION-PLAN.md',
  'src/ui/admin.ts',
  'src/lib/demo-control.ts',
  'src/lib/crawler-control.ts',
  'src/api/operations.ts',
  'src/api/assurance.ts',
  'src/api/advisories.ts',
  'src/api/assurance-registry.ts',
  'src/assurance/model.ts',
  'src/assurance/route-contract.js',
  'src/assurance/routes.ts',
  'src/assurance/service.ts',
  'src/assurance/publication.ts',
  'src/assurance/presentation.ts',
  'src/demos/evidence.ts',
  'src/demos/evidence-page.ts',
  'src/demos/security-page.ts',
  'src/demos/risks.ts',
  'src/demos/incidents.ts',
  'src/demos/logs.ts',
  'src/lib/logs.ts',
  'scripts/assurance-interchange.mjs',
  'scripts/validate-advisories.mjs',
  'scripts/validate-assurance-projection.mjs',
  'assurance/risks/risks.json',
  'assurance/incidents/incidents.json',
  'assurance/incidents/exercises.json',
  'assurance/advisories/advisories.json',
  'contracts/assurance/reporting.schema.json',
  'contracts/assurance/risk.schema.json',
  'contracts/assurance/incident.schema.json',
  'contracts/assurance/exercise.schema.json',
  'contracts/assurance/advisory.schema.json',
  'migrations/0002_operations_dashboard.sql',
  'migrations/0003_demo_control.sql',
  'migrations/0004_application_logs.sql',
  'migrations/0009_crawler_control.sql',
  'migrations/0010_identity_sessions.sql',
  'migrations/0011_cloudflare_usage.sql',
  'src/demos/identity-page.ts',
  'src/lib/identity-session.ts',
  'KICKOFF-SOL-VERY-HIGH.md'
]) {
  if (!fs.existsSync(path.join(root, requiredFile))) failures.push(`missing required file: ${requiredFile}`);
}

const assuranceRegistryModule = fs.readFileSync(path.join(root, 'src/assurance/registry.ts'), 'utf8');
if (assuranceRegistryModule.includes('export *')) {
  failures.push('src/assurance/registry.ts must not remain a compatibility barrel');
}
const assurancePresentationModule = fs.readFileSync(path.join(root, 'src/assurance/presentation.ts'), 'utf8');
if (assurancePresentationModule.includes('export *')) {
  failures.push('src/assurance/presentation.ts must not remain a compatibility barrel');
}

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.git') continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.name.toLowerCase().endsWith('.pdf')) failures.push(`PDF is not allowed in this package: ${path.relative(root, full)}`);
  }
}
walk(root);

const router = fs.readFileSync(path.join(root, 'src/router.ts'), 'utf8');
for (const token of ['/dashboard', '/dashboard/logs', '/__api/operations/logs', '/__api/operations/cloudflare-usage', '/admin', '/offline', '/health', '/version', '/robots.txt', 'routeAssuranceRequest', 'matchAssuranceRoute', 'offlineApiResponse', 'wantsHtml']) {
  if (!router.includes(token)) failures.push(`router missing operations/admin invariant: ${token}`);
}

const assuranceModel = fs.readFileSync(path.join(root, 'src/assurance/model.ts'), 'utf8');
for (const legacyToken of ['v1BoundaryAdapters', 'frameworkReferences:', 'riskLinks:', 'objectiveLinks:', 'incidentLinks:']) {
  if (assuranceModel.includes(legacyToken)) failures.push(`canonical assurance model still contains v1 compatibility token: ${legacyToken}`);
}
const retiredSerializerPath = path.join(root, 'src/api/assurance-v1.ts');
if (fs.existsSync(retiredSerializerPath)) failures.push('retired v1 assurance serializer must not remain in the current contract');
for (const apiFile of ['src/api/assurance.ts', 'src/api/advisories.ts', 'src/api/assurance-registry.ts']) {
  const apiSource = fs.readFileSync(path.join(root, apiFile), 'utf8');
  if (apiSource.includes('serializeAssuranceV1')) failures.push(`${apiFile} still references the retired v1 assurance serializer`);
}

const adminUi = fs.readFileSync(path.join(root, 'src/ui/admin.ts'), 'utf8');
if (!adminUi.includes('Oops! demo is down.')) failures.push('offline UI missing required Oops! demo is down. message');

const control = fs.readFileSync(path.join(root, 'src/lib/demo-control.ts'), 'utf8');
if (!control.includes('demo_state_changed')) failures.push('admin state changes are not auditable');

const crawlerControl = fs.readFileSync(path.join(root, 'src/lib/crawler-control.ts'), 'utf8');
for (const token of ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'chatgpt_crawl_access_changed']) {
  if (!crawlerControl.includes(token)) failures.push(`crawler control invariant missing: ${token}`);
}

const logsLib = fs.readFileSync(path.join(root, 'src/lib/logs.ts'), 'utf8');
for (const token of ['application_logs', 'SENSITIVE_KEY', '[redacted]', 'recentApplicationLogs']) {
  if (!logsLib.includes(token)) failures.push(`log viewer safety/persistence invariant missing: ${token}`);
}

if (failures.length) {
  console.error('Scaffold validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Scaffold validation passed: ${manifest.length} route entries, operations/admin invariants present, no PDFs.`);
