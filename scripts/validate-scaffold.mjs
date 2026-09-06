import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

for (const requiredFile of [
  'docs/ARCHITECTURE-STANDARD.md',
  'docs/OPERATIONS.md',
  'docs/ROUTES.md',
  'docs/ROUTE-REGISTRY.md',
  'docs/route-manifest.json',
  'src/router.ts',
  'src/routing/registry.ts',
  'src/routing/application-routes.ts',
  'src/routing/navigation.ts',
  'src/routing/artifacts.ts',
  'src/routing/operational-routes.ts',
  'src/routing/assurance-routes.ts',
  'src/routing/platform-laboratory-routes.ts',
  'src/routing/interface-identity-routes.ts',
  'src/platform/route-capability.ts',
  'src/interfaces/route-capability.ts',
  'src/interfaces/route-capabilities/index.ts',
  'src/assurance/model.ts',
  'src/assurance/route-contract.js',
  'src/assurance/service.ts',
  'src/assurance/publication.ts',
  'src/assurance/presentation.ts',
  'src/lib/demo-control.ts',
  'src/lib/crawler-control.ts',
  'src/lib/logs.ts',
  'src/ui/admin.ts',
  'tests/route-registry.test.ts',
  'tests/application-route-registry.test.ts',
  'tests/route-artifacts.test.ts',
]) {
  if (!exists(requiredFile)) failures.push(`missing required file: ${requiredFile}`);
}

let manifest = [];
try {
  manifest = JSON.parse(read('docs/route-manifest.json'));
} catch (error) {
  failures.push(`route manifest is not valid JSON: ${String(error)}`);
}
if (!Array.isArray(manifest) || manifest.length === 0) failures.push('route manifest must contain registered routes');
const ids = new Set();
const patterns = new Set();
for (const entry of manifest) {
  if (!entry || typeof entry !== 'object') {
    failures.push('route manifest contains a non-object entry');
    continue;
  }
  for (const field of ['id', 'route', 'kind', 'visibility', 'title', 'description', 'source']) {
    if (!(field in entry)) failures.push(`route manifest entry missing ${field}: ${JSON.stringify(entry)}`);
  }
  if (ids.has(entry.id)) failures.push(`route manifest contains duplicate ID: ${entry.id}`);
  if (patterns.has(entry.route)) failures.push(`route manifest contains duplicate pattern: ${entry.route}`);
  ids.add(entry.id);
  patterns.add(entry.route);
  if (!Array.isArray(entry.methods) || entry.methods.length === 0) failures.push(`route manifest missing methods: ${entry.id}`);
  if (!Array.isArray(entry.docs) || entry.docs.length === 0) failures.push(`route manifest missing documentation links: ${entry.id}`);
  const sourceModule = entry.source?.module;
  if (!sourceModule || !exists(sourceModule)) failures.push(`route manifest source does not exist: ${entry.id} -> ${sourceModule}`);
}

const router = read('src/router.ts');
for (const token of ['applicationRouteRegistry', 'matchRoute', 'normalizeRoutePath', 'safeError', 'getDemoControl', 'route.handler']) {
  if (!router.includes(token)) failures.push(`router missing final declarative invariant: ${token}`);
}
for (const retiredToken of [
  'API_PREFIXES',
  'routeOperationalRequest',
  'routeAssuranceRequest',
  'routePlatformLaboratoryRequest',
  'routeInterfaceIdentityRequest',
  'interfaceIdentityWantsHtml',
  'isInterfaceIdentityApiLike',
  'demosByRoute',
  'LEGACY_OFFLINE_AVAILABLE_PATHS',
  'ASSURANCE_API_HANDLERS',
  'ASSURANCE_HTML_HANDLERS',
]) {
  if (router.includes(retiredToken)) failures.push(`router still contains retired dispatch logic: ${retiredToken}`);
}
if (/\bpath\s*===/.test(router) || /\bpath\.startsWith\(/.test(router)) {
  failures.push('router still contains application path dispatch or prefix detection');
}

const applicationRoutes = read('src/routing/application-routes.ts');
for (const token of [
  'operationalRouteRegistry',
  'assuranceDeclarativeRouteRegistry',
  'interfaceIdentityRouteRegistry',
  'platformLaboratoryRouteRegistry',
  'createApplicationRouteRegistry',
  'validateApplicationDeclaration',
  'routeUrlFromRegistry',
  'configureRegisteredRoutes',
]) {
  if (!applicationRoutes.includes(token)) failures.push(`application registry missing invariant: ${token}`);
}

const generator = read('scripts/generate-route-manifest.mjs');
for (const retiredToken of ['const machine =', 'requiredRoutes =', '/__api/', '/v1/']) {
  if (generator.includes(retiredToken)) failures.push(`route generator still contains a hardcoded route inventory: ${retiredToken}`);
}

const demoRegistry = read('src/demos/registry.ts');
if (demoRegistry.includes('demosByRoute')) failures.push('retired demosByRoute lookup remains in the demo registry');

const assuranceRegistryModule = read('src/assurance/registry.ts');
if (assuranceRegistryModule.includes('export *')) failures.push('src/assurance/registry.ts must not remain a compatibility barrel');
const assurancePresentationModule = read('src/assurance/presentation.ts');
if (assurancePresentationModule.includes('export *')) failures.push('src/assurance/presentation.ts must not remain a compatibility barrel');
if (exists('src/api/assurance-v1.ts')) failures.push('retired v1 assurance serializer must not remain in the current contract');

const adminUi = read('src/ui/admin.ts');
if (!adminUi.includes('Oops! demo is down.')) failures.push('offline UI missing required recovery message');
const crawlerControl = read('src/lib/crawler-control.ts');
for (const token of ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'chatgpt_crawl_access_changed']) {
  if (!crawlerControl.includes(token)) failures.push(`crawler control invariant missing: ${token}`);
}
const logsLib = read('src/lib/logs.ts');
for (const token of ['application_logs', 'SENSITIVE_KEY', '[redacted]', 'recentApplicationLogs']) {
  if (!logsLib.includes(token)) failures.push(`application log invariant missing: ${token}`);
}

function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.git') continue;
    const full = path.join(directory, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.name.toLowerCase().endsWith('.pdf')) failures.push(`PDF is not allowed in this package: ${path.relative(root, full)}`);
  }
}
walk(root);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Scaffold validation passed for ${manifest.length} registry-generated routes.`);
