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
const allowedRiskFrameworks = new Set(['security', 'ai']);
const allowedRiskStatuses = new Set(['open', 'treating']);
const allowedRiskTreatments = new Set(['avoid', 'reduce', 'share']);
const allowedRatings = new Set(['low', 'moderate', 'high', 'critical']);
const evidenceIdPattern = /^EVD-[A-Z]+-[0-9]{3,}$/;
const claimIdPattern = /^CLM-[A-Z]+-[0-9]{3,}$/;
const riskIdPattern = /^(SEC|AI)-RISK-[0-9]{3}$/;
const allowedRiskKeys = new Set(['id', 'framework', 'title', 'inherent', 'residual', 'treatment', 'status', 'controls', 'evidence', 'reviewDue']);

function ratingFor(score) {
  if (score <= 4) return 'low';
  if (score <= 9) return 'moderate';
  if (score <= 16) return 'high';
  return 'critical';
}

function normalizeTreatment(value) {
  return String(value).toLowerCase().split('/').map((item) => item.trim()).filter(Boolean).sort();
}

function parseRegisterSummary(relative, prefix) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const rows = new Map();
  const pattern = new RegExp(`^\\| (${prefix}-RISK-[0-9]{3}) \\| (.*?) \\| ([0-9]+) (Low|Moderate|High|Critical) \\| ([0-9]+) (Low|Moderate|High|Critical) \\| (.*?) \\| (.*?) \\|$`, 'gm');
  for (const match of source.matchAll(pattern)) {
    rows.set(match[1], {
      title: match[2],
      inherent: { score: Number(match[3]), rating: match[4].toLowerCase() },
      residual: { score: Number(match[5]), rating: match[6].toLowerCase() },
      treatment: normalizeTreatment(match[7]),
      status: match[8].toLowerCase(),
    });
  }
  return rows;
}

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

for (const required of ['evidence', 'claims', 'risks']) {
  if (!datasets.has(required)) errors.push(`assurance/registry.json: missing ${required} dataset`);
}

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

const risks = read(datasets.get('risks') ?? 'assurance/risks/risks.json');
const riskIds = new Set();
if (risks.schemaVersion !== registry.schemaVersion) errors.push('risks: schemaVersion must match the registry');
if ('counts' in risks) errors.push('risks: counts must be derived, not stored');
const sourceRegisters = new Map();
for (const source of risks.sourceRegisters ?? []) {
  if (!source.id || sourceRegisters.has(source.id)) errors.push(`risks: invalid or duplicate source register ${source.id}`);
  sourceRegisters.set(source.id, source.repositoryPath);
  if (!source.repositoryPath || !fs.existsSync(path.join(root, source.repositoryPath))) errors.push(`risks: source register does not exist: ${source.repositoryPath}`);
}
if (sourceRegisters.get('WG-REG-001') !== 'docs/governance/registers/SECURITY-RISK-REGISTER.md') errors.push('risks: WG-REG-001 source register is missing');
if (sourceRegisters.get('WG-REG-002') !== 'docs/governance/registers/AI-RISK-REGISTER.md') errors.push('risks: WG-REG-002 source register is missing');

const registerRows = new Map([
  ...parseRegisterSummary('docs/governance/registers/SECURITY-RISK-REGISTER.md', 'SEC'),
  ...parseRegisterSummary('docs/governance/registers/AI-RISK-REGISTER.md', 'AI'),
]);

for (const record of risks.records ?? []) {
  if (!riskIdPattern.test(record.id)) errors.push(`risks: invalid stable ID ${record.id}`);
  if (riskIds.has(record.id)) errors.push(`risks: duplicate stable ID ${record.id}`);
  riskIds.add(record.id);

  const extraKeys = Object.keys(record).filter((key) => !allowedRiskKeys.has(key));
  if (extraKeys.length) errors.push(`${record.id}: disclosure-safe record contains unsupported fields: ${extraKeys.join(', ')}`);

  if (!allowedRiskFrameworks.has(record.framework)) errors.push(`${record.id}: unsupported framework ${record.framework}`);
  if (record.framework === 'security' && !record.id.startsWith('SEC-RISK-')) errors.push(`${record.id}: framework must match SEC-RISK prefix`);
  if (record.framework === 'ai' && !record.id.startsWith('AI-RISK-')) errors.push(`${record.id}: framework must match AI-RISK prefix`);
  if (!record.title || record.title.length > 160) errors.push(`${record.id}: invalid public title`);
  if (!allowedRiskStatuses.has(record.status)) errors.push(`${record.id}: unsupported public status ${record.status}`);

  for (const field of ['inherent', 'residual']) {
    const score = record[field]?.score;
    const rating = record[field]?.rating;
    if (!Number.isInteger(score) || score < 1 || score > 25) errors.push(`${record.id}: invalid ${field} score`);
    if (!allowedRatings.has(rating)) errors.push(`${record.id}: invalid ${field} rating ${rating}`);
    if (Number.isInteger(score) && ratingFor(score) !== rating) errors.push(`${record.id}: ${field} rating does not match score ${score}`);
  }

  if (!Array.isArray(record.treatment) || record.treatment.length === 0) errors.push(`${record.id}: treatment direction is required`);
  if (new Set(record.treatment).size !== record.treatment?.length) errors.push(`${record.id}: duplicate treatment direction`);
  for (const treatment of record.treatment ?? []) if (!allowedRiskTreatments.has(treatment)) errors.push(`${record.id}: unsupported treatment direction ${treatment}`);

  if (!Array.isArray(record.evidence) || record.evidence.length === 0) errors.push(`${record.id}: evidence links are required`);
  if (new Set(record.evidence).size !== record.evidence?.length) errors.push(`${record.id}: duplicate evidence link`);
  for (const evidenceId of record.evidence ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);

  if (!Array.isArray(record.controls) || record.controls.length === 0) errors.push(`${record.id}: control links are required`);
  for (const control of record.controls ?? []) {
    if (!control.reference || !control.repositoryPath) errors.push(`${record.id}: incomplete control link`);
    if (control.repositoryPath && !fs.existsSync(path.join(root, control.repositoryPath))) errors.push(`${record.id}: unresolved control source ${control.repositoryPath}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.reviewDue ?? '')) errors.push(`${record.id}: reviewDue must be an ISO date`);

  const source = registerRows.get(record.id);
  if (!source) {
    errors.push(`${record.id}: stable ID is missing from the controlled source-register summary`);
  } else {
    if (source.title.toLowerCase() !== record.title.toLowerCase()) errors.push(`${record.id}: title differs from source register`);
    if (source.inherent.score !== record.inherent?.score || source.inherent.rating !== record.inherent?.rating) errors.push(`${record.id}: inherent assessment differs from source register`);
    if (source.residual.score !== record.residual?.score || source.residual.rating !== record.residual?.rating) errors.push(`${record.id}: residual assessment differs from source register`);
    if (source.status !== record.status) errors.push(`${record.id}: status differs from source register`);
    if (JSON.stringify(source.treatment) !== JSON.stringify([...(record.treatment ?? [])].sort())) errors.push(`${record.id}: treatment direction differs from source register`);
  }
}

for (const sourceId of registerRows.keys()) if (!riskIds.has(sourceId)) errors.push(`risks: source-register record is missing from public assurance JSON: ${sourceId}`);
if (riskIds.size !== registerRows.size) errors.push(`risks: expected ${registerRows.size} controlled records, found ${riskIds.size}`);

if (errors.length) {
  console.error('Public assurance validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public assurance validation passed: ${claimIds.size} claims, ${evidenceIds.size} evidence records, ${riskIds.size} risk records, ${datasets.size} datasets.`);
