import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registry = read('assurance/registry.json');
const routeManifest = read('docs/route-manifest.json');
const publicRoutes = new Set(routeManifest.map((entry) => entry.route));
const errors = [];
const allowedKinds = new Set(['evidence', 'claims', 'compliance', 'risks', 'incidents', 'exercises', 'advisories']);
const allowedEvidenceKinds = new Set(['source', 'test', 'workflow', 'governance-record', 'release', 'live-route', 'observation']);
const allowedFreshness = new Set(['release-bound', 'event-driven', 'observation-bound']);
const allowedPostures = new Set(['met', 'partial', 'gap', 'not-applicable']);
const evidenceIdPattern = /^EVD-[A-Z]+-[0-9]{3,}$/;
const claimIdPattern = /^CLM-[A-Z]+-[0-9]{3,}$/;

if (registry.schemaVersion !== 1) errors.push('assurance/registry.json: schemaVersion must be 1');
if (registry.visibility !== 'public') errors.push('assurance/registry.json: registry must be explicitly public');
if ('counts' in registry) errors.push('assurance/registry.json: counts must be derived, not stored');
const registrySchemaPath = 'contracts/assurance/registry.schema.json';
if (!fs.existsSync(path.join(root, registrySchemaPath))) errors.push(`${registrySchemaPath}: registry contract is missing`);

const datasets = new Map();
for (const dataset of registry.datasets ?? []) {
  if (!allowedKinds.has(dataset.kind)) errors.push(`assurance/registry.json: unsupported dataset kind ${dataset.kind}`);
  if (datasets.has(dataset.kind)) errors.push(`assurance/registry.json: duplicate dataset kind ${dataset.kind}`);
  datasets.set(dataset.kind, dataset.path);
  for (const relative of [dataset.path, dataset.schema]) {
    if (!relative || path.isAbsolute(relative) || relative.includes('..') || !fs.existsSync(path.join(root, relative))) {
      errors.push(`assurance/registry.json: unresolved controlled path ${relative}`);
    }
  }
  const schema = read(dataset.schema);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${dataset.schema}: expected JSON Schema draft 2020-12`);
}

for (const required of ['evidence', 'claims']) if (!datasets.has(required)) errors.push(`assurance/registry.json: missing ${required} dataset`);

const evidence = read(datasets.get('evidence') ?? 'assurance/evidence/evidence.json');
const evidenceIds = new Set();
if (evidence.schemaVersion !== registry.schemaVersion) errors.push('evidence: schemaVersion must match the registry');
for (const record of evidence.records ?? []) {
  if (!evidenceIdPattern.test(record.id)) errors.push(`evidence: invalid ID ${record.id}`);
  if (evidenceIds.has(record.id)) errors.push(`evidence: duplicate ID ${record.id}`);
  evidenceIds.add(record.id);
  if (!allowedEvidenceKinds.has(record.kind)) errors.push(`${record.id}: unsupported evidence kind ${record.kind}`);
  if (!allowedFreshness.has(record.freshnessPolicy)) errors.push(`${record.id}: unsupported freshness policy ${record.freshnessPolicy}`);
  if (record.visibility !== 'public') errors.push(`${record.id}: public registry evidence must have public visibility`);
  const locators = [record.locator?.repositoryPath, record.locator?.route].filter(Boolean);
  if (locators.length !== 1) errors.push(`${record.id}: exactly one repositoryPath or route locator is required`);
  if (record.locator?.repositoryPath && !fs.existsSync(path.join(root, record.locator.repositoryPath))) errors.push(`${record.id}: repository path does not exist: ${record.locator.repositoryPath}`);
  if (record.locator?.route && !String(record.locator.route).startsWith('/')) errors.push(`${record.id}: route locator must start with /`);
  if (record.locator?.route && !publicRoutes.has(record.locator.route)) errors.push(`${record.id}: route is missing from the public route manifest: ${record.locator.route}`);
}

const claims = read(datasets.get('claims') ?? 'assurance/claims/claims.json');
const claimIds = new Set();
if (claims.schemaVersion !== registry.schemaVersion) errors.push('claims: schemaVersion must match the registry');
for (const record of claims.records ?? []) {
  if (!claimIdPattern.test(record.id)) errors.push(`claims: invalid ID ${record.id}`);
  if (claimIds.has(record.id)) errors.push(`claims: duplicate ID ${record.id}`);
  claimIds.add(record.id);
  if (!allowedPostures.has(record.posture)) errors.push(`${record.id}: unsupported posture ${record.posture}`);
  if (!Array.isArray(record.frameworkReferences) || record.frameworkReferences.length === 0) errors.push(`${record.id}: at least one framework reference is required`);
  if (new Set(record.frameworkReferences).size !== record.frameworkReferences.length) errors.push(`${record.id}: duplicate framework reference`);
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) errors.push(`${record.id}: at least one evidence reference is required`);
  if (new Set(record.evidence).size !== record.evidence.length) errors.push(`${record.id}: duplicate evidence reference`);
  for (const evidenceId of record.evidence ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);
}

if (errors.length) {
  console.error('Public assurance validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public assurance validation passed: ${claimIds.size} claims, ${evidenceIds.size} evidence records, ${datasets.size} datasets.`);
