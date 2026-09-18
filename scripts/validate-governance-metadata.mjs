import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const governanceRoot = path.join(root, 'docs/governance');
const registryPath = path.join(governanceRoot, 'REFERENCE-REGISTRY.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const presentation = JSON.parse(fs.readFileSync(path.join(root, 'assurance/presentation/documents.json'), 'utf8'));
const assuranceRegistry = JSON.parse(fs.readFileSync(path.join(root, 'assurance/registry.json'), 'utf8'));
function flattenResources(resources = []) { return resources.flatMap((resource) => [resource, ...flattenResources(resource.resources ?? [])]); }
const resourcePathById = new Map(flattenResources(assuranceRegistry.datasets ?? []).map((resource) => [resource.id, resource.path]));
const presentationById = new Map((presentation.documents ?? []).map((document) => [document.id, document]));
const errors = [];
const references = new Map();
const referencePattern = /^WG-(?:GOV|POL|REG|OBJ|SOA|AIA|A11Y)-\d{3}$/;
const currentStateAuthorityDocuments = [
  'AGENTS.md',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/ARCHITECTURE-STANDARD.md',
  'docs/CHANGE-MANAGEMENT.md',
  'docs/RELEASE-MANAGEMENT.md',
  'docs/governance/CONTROL-AND-DOCUMENT-INDEX.md',
];
const historicalNarrativePatterns = [
  { label: 'concrete DEMO change ID', pattern: /\bDEMO-\d{3,}\b/g },
  { label: 'historical pull-request number', pattern: /\b(?:PR|pull request)\s*#\d+\b/gi },
  { label: 'full Git SHA', pattern: /\b[0-9a-f]{40}\b/gi },
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

if (registry.authority !== 'reference-identity-only') {
  errors.push('REFERENCE-REGISTRY.json: authority must be reference-identity-only; registration must not become a second state authority');
}

for (const record of registry.records ?? []) {
  if (!referencePattern.test(record.reference)) errors.push(`${record.path}: invalid registered reference ${record.reference}`);
  if (references.has(record.reference)) errors.push(`${record.path}: duplicate registered reference ${record.reference}; also ${references.get(record.reference)}`);
  references.set(record.reference, record.path);

  const absolute = path.join(root, record.path);
  if (!fs.existsSync(absolute)) {
    errors.push(`${record.path}: registered file does not exist`);
    continue;
  }

  if (record.path.endsWith('.md')) {
    const text = fs.readFileSync(absolute, 'utf8');
    const matches = [...text.matchAll(/^\*\*Reference:\*\*\s+([^\s]+)\s*$/gm)];
    if (matches.length !== 1) errors.push(`${record.path}: expected exactly one Reference header, found ${matches.length}`);
    else if (matches[0][1] !== record.reference) errors.push(`${record.path}: header ${matches[0][1]} does not match registry ${record.reference}`);
    continue;
  }

  if (record.path.endsWith('.json') && /^WG-(?:REG|OBJ|SOA)-/.test(record.reference)) {
    const document = presentationById.get(record.reference);
    if (!document) {
      errors.push(`${record.reference}: structured identity is missing from assurance/presentation/documents.json`);
      continue;
    }
    const sourcePaths = new Set((document.sourceDatasets ?? []).map((id) => resourcePathById.get(id)).filter(Boolean));
    if (!sourcePaths.has(record.path)) {
      errors.push(`${record.reference}: registered structured authority ${record.path} is not one of its presentation source datasets`);
    }
    continue;
  }

  errors.push(`${record.path}: registered identity must resolve to governance Markdown or a structured assurance JSON authority`);
}

const registeredPaths = new Set((registry.records ?? []).map((record) => record.path));
const liveReferences = new Map();
for (const absolute of walk(governanceRoot).filter((file) => file.endsWith('.md'))) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const text = fs.readFileSync(absolute, 'utf8');
  const match = text.match(/^\*\*Reference:\*\*\s+([^\s]+)\s*$/m);
  if (!match) continue;
  if (!registeredPaths.has(relative)) errors.push(`${relative}: has Reference header but is missing from REFERENCE-REGISTRY.json`);
  if (liveReferences.has(match[1])) errors.push(`${relative}: duplicate live Reference ${match[1]}; also ${liveReferences.get(match[1])}`);
  liveReferences.set(match[1], relative);
}

const indexPath = path.join(governanceRoot, 'CONTROL-AND-DOCUMENT-INDEX.md');
const indexText = fs.readFileSync(indexPath, 'utf8');
const codeTokens = [...indexText.matchAll(/`([^`]+)`/g)].map((match) => match[1]);

function resolveIndexToken(token) {
  if (token.includes('*') || token.includes('→') || token.includes(' ') || token.startsWith('/')) return null;
  const candidates = [];
  if (/^(?:assurance|docs|scripts|src|tests|migrations|contracts|\.github)\//.test(token)) candidates.push(path.join(root, token));
  else if (/^(?:registers|soa|assessments)\//.test(token)) candidates.push(path.join(governanceRoot, token));
  else if (/\.md$/.test(token)) {
    candidates.push(path.join(governanceRoot, token));
    candidates.push(path.join(governanceRoot, 'registers', token));
    candidates.push(path.join(governanceRoot, 'assessments', token));
    candidates.push(path.join(governanceRoot, 'soa', token));
    candidates.push(path.join(root, 'docs', token));
    candidates.push(path.join(root, token));
  } else if (['SECURITY.md','README.md','CONTRIBUTING.md','AGENTS.md','LICENSE','package.json','wrangler.jsonc'].includes(token)) {
    candidates.push(path.join(root, token));
  } else return null;
  return candidates;
}

for (const token of codeTokens) {
  const candidates = resolveIndexToken(token);
  if (!candidates) continue;
  if (!candidates.some((candidate) => fs.existsSync(candidate))) errors.push(`CONTROL-AND-DOCUMENT-INDEX.md: unresolved local path token ${token}`);
}

for (const relativePath of currentStateAuthorityDocuments) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) {
    errors.push(`${relativePath}: current-state authority document does not exist`);
    continue;
  }
  const text = fs.readFileSync(absolute, 'utf8');
  for (const { label, pattern } of historicalNarrativePatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) errors.push(`${relativePath}: permanent current-state documentation contains ${label} "${match[0]}"; keep historical identity in Git/GitHub or validator/test exception data`);
  }
}

if (errors.length) {
  console.error('Governance metadata validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Governance metadata validation passed: ${registry.records.length} registered identities; ${liveReferences.size} live Markdown Reference headers; structured register/SoA identities, identity-only registry, current-state authority docs, and index paths validated.`);
