import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const governanceRoot = path.join(root, 'docs/governance');
const registryPath = path.join(governanceRoot, 'REFERENCE-REGISTRY.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const errors = [];
const canonical = new Map();
const referencePattern = /^WG-(?:GOV|POL|REG|OBJ|SOA|AIA)-\d{3}$/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

for (const record of registry.records ?? []) {
  if (!referencePattern.test(record.reference)) errors.push(`${record.path}: invalid canonical reference ${record.reference}`);
  if (canonical.has(record.reference)) errors.push(`${record.path}: duplicate canonical reference ${record.reference}; also ${canonical.get(record.reference)}`);
  canonical.set(record.reference, record.path);

  const absolute = path.join(root, record.path);
  if (!fs.existsSync(absolute)) {
    errors.push(`${record.path}: registered file does not exist`);
    continue;
  }
  const text = fs.readFileSync(absolute, 'utf8');
  const matches = [...text.matchAll(/^\*\*Reference:\*\*\s+([^\s]+)\s*$/gm)];
  if (matches.length !== 1) errors.push(`${record.path}: expected exactly one Reference header, found ${matches.length}`);
  else if (matches[0][1] !== record.reference) errors.push(`${record.path}: header ${matches[0][1]} does not match registry ${record.reference}`);
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
  if (/^(?:docs|scripts|src|tests|migrations|contracts|\.github)\//.test(token)) candidates.push(path.join(root, token));
  else if (/^(?:registers|soa|assessments)\//.test(token)) candidates.push(path.join(governanceRoot, token));
  else if (/\.md$/.test(token)) {
    candidates.push(path.join(governanceRoot, token));
    candidates.push(path.join(governanceRoot, 'registers', token));
    candidates.push(path.join(governanceRoot, 'assessments', token));
    candidates.push(path.join(governanceRoot, 'soa', token));
    candidates.push(path.join(root, 'docs', token));
    candidates.push(path.join(root, token));
  } else if (['SECURITY.md','README.md','CONTRIBUTING.md','AGENTS.md','CHANGELOG.md','LICENSE','package.json','wrangler.jsonc'].includes(token)) {
    candidates.push(path.join(root, token));
  } else return null;
  return candidates;
}

for (const token of codeTokens) {
  const candidates = resolveIndexToken(token);
  if (!candidates) continue;
  if (!candidates.some((candidate) => fs.existsSync(candidate))) errors.push(`CONTROL-AND-DOCUMENT-INDEX.md: unresolved local path token ${token}`);
}

if (errors.length) {
  console.error('Governance metadata validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Governance metadata validation passed: ${registry.records.length} canonical records; ${liveReferences.size} live Reference headers; index paths resolved.`);
