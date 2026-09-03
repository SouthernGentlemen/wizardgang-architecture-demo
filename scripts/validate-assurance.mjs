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
const allowedIncidentStatuses = new Set(['investigating', 'contained', 'recovering', 'monitoring', 'closed', 'superseded']);
const allowedExerciseStatuses = new Set(['planned', 'in-progress', 'completed', 'follow-up-open', 'closed', 'superseded']);
const allowedIncidentCategories = new Set(['security', 'ai-mcp', 'supplier', 'data', 'operational', 'privacy-confidentiality', 'accessibility', 'governance-evidence']);
const evidenceIdPattern = /^EVD-[A-Z]+-[0-9]{3,}$/;
const claimIdPattern = /^CLM-[A-Z]+-[0-9]{3,}$/;
const riskIdPattern = /^(SEC|AI)-RISK-[0-9]{3}$/;
const incidentIdPattern = /^INC-[0-9]{3,}$/;
const exerciseIdPattern = /^EX-[0-9]{3,}$/;
const allowedRiskKeys = new Set(['id', 'framework', 'title', 'inherent', 'residual', 'treatment', 'status', 'reviewDue', 'relationships']);
const allowedIncidentKeys = new Set(['id', 'recordType', 'simulated', 'title', 'status', 'detectedAt', 'initialSeverity', 'finalSeverity', 'categories', 'summary', 'closedAt', 'relationships']);
const allowedExerciseKeys = new Set(['id', 'recordType', 'simulated', 'exerciseType', 'scenario', 'scope', 'owner', 'status', 'dueDate', 'completedAt', 'resultSummary', 'publicNote', 'relationships']);

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

function normalizeStatus(value) {
  return String(value).trim().toLowerCase().replaceAll(' ', '-');
}

function parseExerciseRows(source) {
  const rows = new Map();
  for (const line of source.split(/\r?\n/)) {
    if (!/^\|\s*EX-[0-9]{3,}\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 8) continue;
    const dueMatch = /\b(\d{4}-\d{2}-\d{2})\b/.exec(cells[4]);
    rows.set(cells[0], {
      exerciseType: cells[1],
      scenario: cells[2],
      scope: cells[3],
      dueDate: dueMatch?.[1],
      owner: cells[5],
      status: normalizeStatus(cells[6]),
      evidence: cells[7],
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

for (const required of ['evidence', 'claims', 'risks', 'incidents', 'exercises']) {
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
  const normalizedReferences = [...(record.relationships?.compliance ?? []), ...(record.relationships?.frameworks ?? [])];
  if (normalizedReferences.length === 0) errors.push(`${record.id}: at least one compliance or framework relationship is required`);
  const claimEvidence = record.relationships?.evidence ?? [];
  if (claimEvidence.length === 0) errors.push(`${record.id}: at least one evidence relationship is required`);
  for (const evidenceId of claimEvidence) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);
}

const governance = read('docs/governance/REFERENCE-REGISTRY.json');
const governancePaths = new Map((governance.records ?? []).map((record) => [record.reference, record.path]));
const risks = read(datasets.get('risks') ?? 'assurance/risks/risks.json');
const riskIds = new Set();
if (risks.schemaVersion !== registry.schemaVersion) errors.push('risks: schemaVersion must match the registry');
if ('counts' in risks) errors.push('risks: counts must be derived, not stored');
const sourceRegisters = new Map();
for (const source of risks.sourceRegisters ?? []) {
  if (!source.id || sourceRegisters.has(source.id)) errors.push(`risks: invalid or duplicate source register ${source.id}`);
  const repositoryPath = governancePaths.get(source.governanceDocumentReference);
  sourceRegisters.set(source.id, repositoryPath);
  if (!repositoryPath || !fs.existsSync(path.join(root, repositoryPath))) errors.push(`risks: governance source register does not resolve: ${source.governanceDocumentReference}`);
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

  const riskEvidence = record.relationships?.evidence ?? [];
  if (riskEvidence.length === 0) errors.push(`${record.id}: evidence relationships are required`);
  for (const evidenceId of riskEvidence) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);

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

const incidentRegisterPath = 'docs/governance/registers/INCIDENT-REGISTER.md';
const incidentRegister = fs.readFileSync(path.join(root, incidentRegisterPath), 'utf8');
const sourceIncidentIds = new Set(incidentRegister.match(/\bINC-[0-9]{3,}\b/g) ?? []);
const sourceExercises = parseExerciseRows(incidentRegister);

const incidents = read(datasets.get('incidents') ?? 'assurance/incidents/incidents.json');
const incidentIds = new Set();
if (incidents.schemaVersion !== registry.schemaVersion) errors.push('incidents: schemaVersion must match the registry');
if (incidents.sourceRegister !== incidentRegisterPath) errors.push(`incidents: sourceRegister must be ${incidentRegisterPath}`);
if ('counts' in incidents) errors.push('incidents: counts must be derived, not stored');
for (const record of incidents.records ?? []) {
  if (!incidentIdPattern.test(record.id)) errors.push(`incidents: invalid stable ID ${record.id}`);
  if (incidentIds.has(record.id)) errors.push(`incidents: duplicate stable ID ${record.id}`);
  incidentIds.add(record.id);
  const extraKeys = Object.keys(record).filter((key) => !allowedIncidentKeys.has(key));
  if (extraKeys.length) errors.push(`${record.id}: disclosure-safe incident contains unsupported fields: ${extraKeys.join(', ')}`);
  if (record.recordType !== 'incident') errors.push(`${record.id}: recordType must be incident`);
  if (record.simulated !== false) errors.push(`${record.id}: actual incidents must be explicitly simulated=false`);
  if (!allowedIncidentStatuses.has(record.status)) errors.push(`${record.id}: unsupported incident status ${record.status}`);
  if (!sourceIncidentIds.has(record.id)) errors.push(`${record.id}: no retained incident with this permanent ID exists in ${incidentRegisterPath}`);
  if (!Array.isArray(record.categories) || record.categories.length === 0) errors.push(`${record.id}: at least one public-safe incident category is required`);
  for (const category of record.categories ?? []) if (!allowedIncidentCategories.has(category)) errors.push(`${record.id}: unsupported incident category ${category}`);
  if (new Set(record.categories ?? []).size !== record.categories?.length) errors.push(`${record.id}: duplicate incident category`);
  for (const riskId of record.relationships?.risks ?? []) if (!riskIds.has(riskId)) errors.push(`${record.id}: unresolved risk ${riskId}`);
  for (const evidenceId of record.relationships?.evidence ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);
  if (record.status === 'closed' && !record.closedAt) errors.push(`${record.id}: closed incidents require closedAt`);
}

const exercises = read(datasets.get('exercises') ?? 'assurance/incidents/exercises.json');
const exerciseIds = new Set();
if (exercises.schemaVersion !== registry.schemaVersion) errors.push('exercises: schemaVersion must match the registry');
if (exercises.sourceRegister !== incidentRegisterPath) errors.push(`exercises: sourceRegister must be ${incidentRegisterPath}`);
if ('counts' in exercises) errors.push('exercises: counts must be derived, not stored');
for (const record of exercises.records ?? []) {
  if (!exerciseIdPattern.test(record.id)) errors.push(`exercises: invalid stable ID ${record.id}`);
  if (exerciseIds.has(record.id)) errors.push(`exercises: duplicate stable ID ${record.id}`);
  exerciseIds.add(record.id);
  const extraKeys = Object.keys(record).filter((key) => !allowedExerciseKeys.has(key));
  if (extraKeys.length) errors.push(`${record.id}: disclosure-safe exercise contains unsupported fields: ${extraKeys.join(', ')}`);
  if (record.recordType !== 'exercise') errors.push(`${record.id}: recordType must be exercise`);
  if (record.simulated !== true) errors.push(`${record.id}: exercises must be explicitly simulated=true`);
  if (!allowedExerciseStatuses.has(record.status)) errors.push(`${record.id}: unsupported exercise status ${record.status}`);
  for (const riskId of record.relationships?.risks ?? []) if (!riskIds.has(riskId)) errors.push(`${record.id}: unresolved risk ${riskId}`);
  for (const evidenceId of record.relationships?.evidence ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);

  const source = sourceExercises.get(record.id);
  if (!source) {
    errors.push(`${record.id}: stable ID is missing from the controlled exercise table`);
  } else {
    if (source.exerciseType !== record.exerciseType) errors.push(`${record.id}: exercise type differs from source register`);
    if (source.scenario !== record.scenario) errors.push(`${record.id}: scenario differs from source register`);
    if (source.scope !== record.scope) errors.push(`${record.id}: scope differs from source register`);
    if (source.owner !== record.owner) errors.push(`${record.id}: owner differs from source register`);
    if (source.status !== record.status) errors.push(`${record.id}: status differs from source register`);
    if (source.dueDate !== record.dueDate) errors.push(`${record.id}: due date differs from source register`);
  }

  if (record.status === 'planned') {
    if (!record.dueDate) errors.push(`${record.id}: planned exercises require dueDate`);
    if (record.completedAt) errors.push(`${record.id}: planned exercise cannot have completedAt`);
    if (record.resultSummary) errors.push(`${record.id}: planned exercise cannot have resultSummary`);
    if ((record.relationships?.evidence ?? []).length !== 0) errors.push(`${record.id}: planned exercise cannot carry completion evidence`);
  }
  if (['completed', 'follow-up-open', 'closed'].includes(record.status)) {
    if (!record.completedAt) errors.push(`${record.id}: completed/post-exercise status requires completedAt`);
    if (!record.resultSummary) errors.push(`${record.id}: completed/post-exercise status requires resultSummary`);
    if ((record.relationships?.evidence ?? []).length === 0) errors.push(`${record.id}: completed/post-exercise status requires evidence`);
  }
}

for (const id of incidentIds) if (exerciseIds.has(id)) errors.push(`${id}: record cannot be both an actual incident and an exercise`);
for (const sourceId of sourceExercises.keys()) if (!exerciseIds.has(sourceId)) errors.push(`exercises: source-register exercise is missing from public assurance JSON: ${sourceId}`);
if (exerciseIds.size !== sourceExercises.size) errors.push(`exercises: expected ${sourceExercises.size} controlled records, found ${exerciseIds.size}`);

if (errors.length) {
  console.error('Public assurance validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public assurance validation passed: ${claimIds.size} claims, ${evidenceIds.size} evidence records, ${riskIds.size} risk records, ${incidentIds.size} incidents, ${exerciseIds.size} exercises, ${datasets.size} datasets.`);
