import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];

function trackedFiles() {
  const result = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`unable to list tracked files: ${result.stderr.trim() || result.stdout.trim()}`);
  return result.stdout
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((file) => fs.existsSync(path.join(root, file)));
}

function plainHeadingText(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '')
    .trim();
}

function githubSlug(value) {
  return plainHeadingText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function headingAnchors(markdown) {
  const anchors = new Set();
  const counts = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = githubSlug(match[2]);
    if (!base) continue;
    const duplicate = counts.get(base) ?? 0;
    counts.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }
  return anchors;
}

function normalizeRepositoryPath(source, target) {
  const withoutAngle = target.replace(/^<|>$/g, '');
  const [rawPath, rawAnchor = ''] = withoutAngle.split('#', 2);
  let decodedPath = rawPath;
  let decodedAnchor = rawAnchor;
  try { decodedPath = decodeURIComponent(rawPath); } catch {}
  try { decodedAnchor = decodeURIComponent(rawAnchor); } catch {}
  const resolved = decodedPath
    ? path.posix.normalize(path.posix.join(path.posix.dirname(source), decodedPath))
    : source;
  return { repositoryPath: resolved.replace(/^\.\//, ''), anchor: decodedAnchor };
}

const files = trackedFiles();
const fileSet = new Set(files);
const markdownFiles = files.filter((file) => file.endsWith('.md'));
// The root implementation plan is temporary coordination rather than current-state documentation,
// so it may name the change IDs it reserves until the release that completes it retires the plan.
const temporaryImplementationPlan = 'IMPLEMENTATION_PLAN.md';
const currentStateMarkdown = markdownFiles.filter((file) => (
  file !== temporaryImplementationPlan
  && !file.startsWith(['docs', 'history'].join('/') + '/')
));
const textFiles = files.filter((file) =>
  /^(?:src|tests|config|contracts|scripts|assurance|\.github)\//.test(file)
  && /\.(?:ts|mjs|js|json|ya?ml|toml|txt|csv)$/.test(file),
);

const docsRoot = 'docs';
const governanceRoot = [docsRoot, 'governance'].join('/');
const removedDirectoryPrefixes = [
  [docsRoot, 'rele' + 'ases'].join('/') + '/',
  [governanceRoot, 'regis' + 'ters'].join('/') + '/',
  [governanceRoot, 's' + 'oa'].join('/') + '/',
  [governanceRoot, 'assess' + 'ments'].join('/') + '/',
];

const retiredArchitectureNames = [
  ['ASSURANCE', 'API.md'].join('-'),
  ['ASSURANCE', 'FRESHNESS.md'].join('-'),
  ['ASSURANCE', 'REGISTRY.md'].join('-'),
  ['ASSURANCE', 'RUNTIME.md'].join('-'),
  'EVI' + 'DENCE.md',
  ['FRONTEND', 'ROU' + 'TES.md'].join('-'),
  ['REPORTING', 'CURSORS.md'].join('-'),
  'ROU' + 'TES.md',
  ['SITE', 'ACCESSIBILITY', 'VERIFICATION.md'].join('-'),
];
const retiredArchitectureMarkdown = new Set(retiredArchitectureNames.map((name) => [docsRoot, name].join('/')));

const canonicalGovernanceNames = [
  ['AI', 'GOVERNANCE.md'].join('-'),
  ['AI', 'IMPACT', 'ASSESSMENT.md'].join('-'),
  ['ASSURANCE', 'AND', 'AUDIT.md'].join('-'),
  ['DATA', 'AND', 'PRIVACY.md'].join('-'),
  ['ENGINEERING', 'CONTROLS.md'].join('-'),
  'GOVERNANCE.md',
  ['INCIDENT', 'AND', 'CONTINUITY.md'].join('-'),
  ['RISK', 'MANAGEMENT.md'].join('-'),
  ['SECURITY', 'GOVERNANCE.md'].join('-'),
];
const canonicalGovernanceMarkdown = new Set(canonicalGovernanceNames.map((name) => [governanceRoot, name].join('/')));

function isRetiredDocumentationPath(value) {
  return retiredArchitectureMarkdown.has(value)
    || removedDirectoryPrefixes.some((prefix) => value.startsWith(prefix));
}

for (const file of files) {
  if (isRetiredDocumentationPath(file)) {
    errors.push(`${file}: retired documentation source has been resurrected`);
  }
}

for (const file of markdownFiles.filter((value) => value.startsWith(governanceRoot + '/'))) {
  if (!canonicalGovernanceMarkdown.has(file)) {
    errors.push(`${file}: governance Markdown is outside the canonical current-state governance set`);
  }
}

if (fileSet.has('CHANGE' + 'LOG.md')) {
  errors.push('root release changelog is not allowed; annotated tags and GitHub Releases own release history');
}

const markdownCache = new Map();
const anchorCache = new Map();
function read(relativePath) {
  if (!markdownCache.has(relativePath)) markdownCache.set(relativePath, fs.readFileSync(path.join(root, relativePath), 'utf8'));
  return markdownCache.get(relativePath);
}
function anchors(relativePath) {
  if (!anchorCache.has(relativePath)) anchorCache.set(relativePath, headingAnchors(read(relativePath)));
  return anchorCache.get(relativePath);
}

const markdownLinkPattern = /!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
for (const source of markdownFiles) {
  const text = read(source);
  for (const match of text.matchAll(markdownLinkPattern)) {
    const target = match[1];
    if (!target || /^(?:https?:|mailto:|tel:|javascript:)/i.test(target) || target.startsWith('/')) continue;
    const resolved = normalizeRepositoryPath(source, target);
    if (!fileSet.has(resolved.repositoryPath)) {
      errors.push(`${source}: unresolved Markdown link target ${target}`);
      continue;
    }
    if (resolved.anchor && resolved.repositoryPath.endsWith('.md') && !anchors(resolved.repositoryPath).has(resolved.anchor)) {
      errors.push(`${source}: unresolved Markdown anchor ${target}`);
    }
  }
}

const concreteDemoHistory = /\bDEMO-\d{3,}\b/g;
for (const source of currentStateMarkdown) {
  const text = read(source);
  const match = concreteDemoHistory.exec(text);
  concreteDemoHistory.lastIndex = 0;
  if (match) {
    errors.push(`${source}: current-state Markdown contains concrete change narration ${match[0]}; retain change history in Git/GitHub or an explicit operating record`);
  }
}

const intentionalNegativeReferenceFiles = new Set([
  'scripts/validate-governance-metadata.mjs',
  'scripts/validate-documentation-cleanup.mjs',
  'tests/assurance-objectives.test.ts',
  'tests/assurance-semantic-partitions.test.ts',
  'tests/removed-routes.test.ts',
]);
function isIntentionalNegativeReferenceFile(file) {
  return intentionalNegativeReferenceFiles.has(file)
    || /^tests\/demo-(?:311|312|313|314|315|316|317|318|319)-/.test(file);
}

const markdownPathPattern = /(?:docs\/[A-Za-z0-9_./-]+\.md|README\.md|AGENTS\.md|CONTRIBUTING\.md|SECURITY\.md)(?:#[a-z0-9][a-z0-9._-]*)?/gi;
for (const source of textFiles) {
  const text = fs.readFileSync(path.join(root, source), 'utf8');
  for (const match of text.matchAll(markdownPathPattern)) {
    const reference = match[0];
    const repositoryPath = reference.split('#', 1)[0];
    if (fileSet.has(repositoryPath) || isIntentionalNegativeReferenceFile(source)) continue;
    errors.push(`${source}: references missing Markdown ${reference}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts ?? {};
for (const retiredScript of ['generate:assurance-summaries', 'validate:assurance-summaries', 'generate:governance-registers']) {
  if (retiredScript in scripts) errors.push(`package.json: retired documentation generator remains registered as ${retiredScript}`);
}
if (!String(scripts.check ?? '').includes('npm run validate:documentation')) {
  errors.push('package.json: npm run check must execute validate:documentation');
}

const registryPath = [governanceRoot, 'REFERENCE-REGISTRY.json'].join('/');
const registry = JSON.parse(fs.readFileSync(path.join(root, registryPath), 'utf8'));
for (const record of registry.records ?? []) {
  if (!fileSet.has(record.path)) errors.push(`REFERENCE-REGISTRY.json: ${record.reference} resolves to missing ${record.path}`);
  if (isRetiredDocumentationPath(record.path)) errors.push(`REFERENCE-REGISTRY.json: ${record.reference} resolves to retired documentation ${record.path}`);
}

const routeManifest = [docsRoot, 'route-manifest.json'].join('/');
const deploymentRecord = [docsRoot, 'history', 'DEPLOYMENTS.md'].join('/');
if (!fileSet.has(routeManifest)) errors.push(`${routeManifest}: generated route projection is missing`);
if (!fileSet.has(deploymentRecord)) errors.push(`${deploymentRecord}: intentional deployment operating record is missing`);

if (errors.length) {
  console.error('Documentation cleanup validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation cleanup validation passed: ${markdownFiles.length} tracked Markdown files; ${currentStateMarkdown.length} current-state Markdown files; retired documentation remains absent; links and current documentation references resolve.`);
