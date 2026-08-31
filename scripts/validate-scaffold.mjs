import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'docs', 'route-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const routes = new Set(manifest.map((entry) => entry.route));

const requiredRoutes = [
  '/', '/edge', '/workers', '/durable-objects', '/d1', '/r2',
  '/api', '/api/rest', '/api/openapi', '/api/graphql', '/api/webhooks',
  '/identity', '/identity/oauth', '/identity/sso', '/identity/saml',
  '/mcp', '/i18n', '/accessibility', '/git', '/git/versioning',
  '/git/branching', '/git/releases', '/git/actions', '/environments',
  '/traceability', '/governance', '/governance/iso-27001',
  '/governance/iso-42001', '/evidence', '/dashboard',
  '/dashboard/uptime', '/dashboard/health', '/dashboard/docs',
  '/dashboard/logs', '/dashboard/billing', '/admin', '/offline', '/health', '/version',
  '/__api/demo/run', '/__api/demo/events', '/__api/operations/logs'
];

const failures = [];
for (const route of requiredRoutes) {
  if (!routes.has(route)) failures.push(`missing route in manifest: ${route}`);
}

for (const entry of manifest) {
  if (!entry.source) continue;
  const sourcePath = path.join(root, entry.source);
  if (!fs.existsSync(sourcePath)) failures.push(`manifest source does not exist: ${entry.route} -> ${entry.source}`);
}

for (const requiredFile of [
  'docs/ARCHITECTURE-STANDARD.md',
  'docs/OPERATIONS.md',
  'docs/ROUTES.md',
  'docs/IMPLEMENTATION-PLAN.md',
  'src/ui/admin.ts',
  'src/lib/demo-control.ts',
  'src/api/operations.ts',
  'src/demos/logs.ts',
  'src/lib/logs.ts',
  'migrations/0002_operations_dashboard.sql',
  'migrations/0003_demo_control.sql',
  'migrations/0004_application_logs.sql',
  'KICKOFF-SOL-VERY-HIGH.md'
]) {
  if (!fs.existsSync(path.join(root, requiredFile))) failures.push(`missing required file: ${requiredFile}`);
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
for (const token of ['/dashboard', '/dashboard/logs', '/__api/operations/logs', '/admin', '/offline', '/health', '/version', 'offlineApiResponse', 'wantsHtml']) {
  if (!router.includes(token)) failures.push(`router missing operations/admin invariant: ${token}`);
}

const adminUi = fs.readFileSync(path.join(root, 'src/ui/admin.ts'), 'utf8');
if (!adminUi.includes('Oops! demo is down.')) failures.push('offline UI missing required Oops! demo is down. message');

const control = fs.readFileSync(path.join(root, 'src/lib/demo-control.ts'), 'utf8');
if (!control.includes('demo_state_changed')) failures.push('admin state changes are not auditable');


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
