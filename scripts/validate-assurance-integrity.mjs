import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nowValue = process.env.ASSURANCE_VALIDATION_NOW ?? new Date().toISOString();
const validationNow = Date.parse(nowValue);
const errors = [];
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const exists = (relative) => Boolean(relative) && !path.isAbsolute(relative) && !relative.includes('..') && fs.existsSync(path.join(root, relative));

if (Number.isNaN(validationNow)) {
  errors.push(`ASSURANCE_VALIDATION_NOW is not a valid date-time: ${nowValue}`);
}

const registry = readJson('assurance/registry.json');
const routeManifest = readJson('docs/route-manifest.json');
const publicRoutes = new Set(routeManifest.map((entry) => entry.route));
const allowedDatasetKinds = new Set(['evidence', 'claims', 'compliance', 'risks', 'incidents', 'exercises', 'advisories']);
const requiredRoutes = [
  '/evidence',
  '/compliance',
  '/governance/risks',
  '/governance/incidents',
  '/security',
  '/v1/assurance',
  '/v1/assurance/evidence',
  '/v1/assurance/risks',
  '/v1/assurance/incidents',
  '/v1/assurance/advisories',
  '/v1/assurance/compliance',
  '/v1/assurance/compliance/{recordId}',
];

const datasets = new Map();
for (const dataset of registry.datasets ?? []) {
  if (!allowedDatasetKinds.has(dataset.kind)) errors.push(`unsupported assurance dataset kind ${dataset.kind}`);
  if (datasets.has(dataset.kind)) errors.push(`duplicate assurance dataset kind ${dataset.kind}`);
  datasets.set(dataset.kind, dataset.path);
  if (!exists(dataset.path)) errors.push(`unresolved assurance dataset path ${dataset.path}`);
  if (!exists(dataset.schema)) errors.push(`unresolved assurance schema path ${dataset.schema}`);
}
for (const kind of allowedDatasetKinds) {
  if (!datasets.has(kind)) errors.push(`missing required assurance dataset reference: ${kind}`);
}
for (const route of requiredRoutes) {
  if (!publicRoutes.has(route)) errors.push(`required public assurance route is missing: ${route}`);
}

const wcagManifestPath = 'assurance/compliance/wcag-2.2.json';
const wcagManifest = readJson(wcagManifestPath);
const canonicalPaths = new Set([
  ...[...datasets.values()].filter((relative) => exists(relative)),
  'assurance/compliance/iso-27001-2022.json',
  'assurance/compliance/iso-42001-2023.json',
  wcagManifestPath,
]);
for (const partition of wcagManifest.partitions ?? []) {
  if (!exists(partition.path)) errors.push(`unresolved WCAG partition path ${partition.path}`);
  else canonicalPaths.add(partition.path);
}

const derivedOnlyKeys = new Set(['counts', 'usedBy', 'url', 'urls', 'href', 'hrefs', 'resolved']);
const unsafePublicKeys = new Set([
  'acceptanceauthority',
  'acceptancerationale',
  'accountmetadata',
  'authorization',
  'authorizationheader',
  'cookie',
  'cookies',
  'credential',
  'credentials',
  'infrastructuredetail',
  'infrastructuredetails',
  'password',
  'paymentdata',
  'privatetreatment',
  'privatetreatmentdetail',
  'reporteridentity',
  'requestbody',
  'secret',
  'secrets',
  'token',
  'tokens',
  'treatmentactions',
]);

function normalizedKey(key) {
  return String(key).replaceAll('-', '').replaceAll('_', '').toLowerCase();
}

function scanCanonical(relative, value, pointer = '$') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanCanonical(relative, entry, `${pointer}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (derivedOnlyKeys.has(key)) errors.push(`${relative}: ${key} is derived presentation data and must not be stored (${pointer}.${key})`);
    if (unsafePublicKeys.has(normalizedKey(key))) errors.push(`${relative}: unsafe public field ${key} is not allowed (${pointer}.${key})`);
    scanCanonical(relative, child, `${pointer}.${key}`);
  }
}
for (const relative of canonicalPaths) scanCanonical(relative, readJson(relative));

const idOwners = new Map();
function registerPublicId(id, owner) {
  if (!id || typeof id !== 'string') {
    errors.push(`${owner}: missing public stable ID`);
    return;
  }
  const previous = idOwners.get(id);
  if (previous) errors.push(`duplicate public ID ${id}: ${previous} and ${owner}`);
  else idOwners.set(id, owner);
}

const evidence = readJson(datasets.get('evidence') ?? 'assurance/evidence/evidence.json');
const claims = readJson(datasets.get('claims') ?? 'assurance/claims/claims.json');
const risks = readJson(datasets.get('risks') ?? 'assurance/risks/risks.json');
const incidents = readJson(datasets.get('incidents') ?? 'assurance/incidents/incidents.json');
const exercises = readJson(datasets.get('exercises') ?? 'assurance/incidents/exercises.json');
const advisories = readJson(datasets.get('advisories') ?? 'assurance/advisories/advisories.json');
const iso27001 = readJson('assurance/compliance/iso-27001-2022.json');
const iso42001 = readJson('assurance/compliance/iso-42001-2023.json');

const allowedFreshnessPolicies = new Set(['release-bound', 'event-driven', 'observation-bound']);
const allowedClaimPostures = new Set(['met', 'partial', 'gap', 'not-applicable']);
const allowedRiskStatuses = new Set(['open', 'treating']);
const allowedIncidentStatuses = new Set(['investigating', 'contained', 'recovering', 'monitoring', 'closed', 'superseded']);
const allowedExerciseStatuses = new Set(['planned', 'in-progress', 'completed', 'follow-up-open', 'closed', 'superseded']);
const allowedAdvisorySeverities = new Set(['low', 'moderate', 'high', 'critical']);
const allowedIsoStatusKeys = new Set(['met', 'partial', 'gap', 'notApplicable']);
const allowedWcagStatuses = new Set(['demonstrated', 'partial', 'gap', 'not-observed']);

for (const record of evidence.records ?? []) {
  registerPublicId(record.id, 'evidence');
  if (!allowedFreshnessPolicies.has(record.freshnessPolicy)) errors.push(`${record.id}: unsupported freshness policy ${record.freshnessPolicy}`);
  if (record.visibility !== 'public') errors.push(`${record.id}: evidence visibility must remain public`);
  if (record.locator?.route && !publicRoutes.has(record.locator.route)) errors.push(`${record.id}: evidence route is missing from the route manifest: ${record.locator.route}`);

  const isTimeBound = record.kind === 'observation' || record.observedAt !== undefined || record.validUntil !== undefined;
  if (isTimeBound) {
    if (record.freshnessPolicy !== 'observation-bound') errors.push(`${record.id}: time-bound evidence must use observation-bound freshness`);
    if (!record.observedAt || !record.validUntil) {
      errors.push(`${record.id}: time-bound evidence requires observedAt and validUntil`);
    } else {
      const observedAt = Date.parse(record.observedAt);
      const validUntil = Date.parse(record.validUntil);
      if (Number.isNaN(observedAt)) errors.push(`${record.id}: observedAt must be an ISO date-time`);
      if (Number.isNaN(validUntil)) errors.push(`${record.id}: validUntil must be an ISO date-time`);
      if (!Number.isNaN(observedAt) && !Number.isNaN(validUntil) && validUntil <= observedAt) errors.push(`${record.id}: validUntil must be after observedAt`);
      if (!Number.isNaN(validUntil) && !Number.isNaN(validationNow) && validUntil <= validationNow) errors.push(`${record.id}: time-bound evidence is stale as of ${nowValue}`);
    }
  }
}

for (const record of claims.records ?? []) {
  registerPublicId(record.id, 'claim');
  if (!allowedClaimPostures.has(record.posture)) errors.push(`${record.id}: unsupported claim posture ${record.posture}`);
}
for (const record of risks.records ?? []) {
  registerPublicId(record.id, 'risk');
  if (!allowedRiskStatuses.has(record.status)) errors.push(`${record.id}: unsupported risk status ${record.status}`);
}
for (const record of incidents.records ?? []) {
  registerPublicId(record.id, 'incident');
  if (!allowedIncidentStatuses.has(record.status)) errors.push(`${record.id}: unsupported incident status ${record.status}`);
}
for (const record of exercises.records ?? []) {
  registerPublicId(record.id, 'exercise');
  if (!allowedExerciseStatuses.has(record.status)) errors.push(`${record.id}: unsupported exercise status ${record.status}`);
}
for (const record of advisories.records ?? []) {
  registerPublicId(record.id, 'advisory');
  if (!allowedAdvisorySeverities.has(record.severity)) errors.push(`${record.id}: unsupported advisory severity ${record.severity}`);
}

function validateIsoGroups(data, idPrefix, label) {
  const sections = [['clauses', data.clauses], ...Object.entries(data.annexA ?? {}).map(([name, groups]) => [`annexA.${name}`, groups])];
  for (const [section, groups] of sections) {
    for (const [status, records] of Object.entries(groups ?? {})) {
      if (!allowedIsoStatusKeys.has(status)) errors.push(`${label} ${section}: unsupported compliance status group ${status}`);
      for (const record of records ?? []) {
        registerPublicId(`${idPrefix}-${record.reference}`, `${label} compliance`);
        if (status === 'notApplicable' && (!record.rationale || record.rationale.trim().length < 10)) {
          errors.push(`${label} ${record.reference}: N/A rationale is required`);
        }
      }
    }
  }
}
validateIsoGroups(iso27001, 'ISO27001', 'ISO/IEC 27001');
validateIsoGroups(iso42001, 'ISO42001', 'ISO/IEC 42001');

for (const partition of wcagManifest.partitions ?? []) {
  if (!exists(partition.path)) continue;
  const data = readJson(partition.path);
  for (const record of data.criteria ?? []) {
    registerPublicId(`WCAG-${record.criterionId}`, 'WCAG compliance');
    if (!allowedWcagStatuses.has(record.status)) errors.push(`WCAG ${record.criterionId}: unsupported compliance status ${record.status}`);
  }
}

const evidenceIds = new Set((evidence.records ?? []).map((record) => record.id));
const riskIds = new Set((risks.records ?? []).map((record) => record.id));
const incidentIds = new Set((incidents.records ?? []).map((record) => record.id));
const advisoryIds = new Set((advisories.records ?? []).map((record) => record.id));
const linkTargets = new Map([
  ['evidence', ['evidence', evidenceIds]],
  ['evidenceIds', ['evidence', evidenceIds]],
  ['registryEvidenceIds', ['evidence', evidenceIds]],
  ['riskLinks', ['risk', riskIds]],
  ['incidentLinks', ['incident', incidentIds]],
  ['advisoryLinks', ['advisory', advisoryIds]],
]);

function validateReferences(relative, value, pointer = '$') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateReferences(relative, entry, `${pointer}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const target = linkTargets.get(key);
    if (target) {
      const [kind, ids] = target;
      if (!Array.isArray(child)) {
        errors.push(`${relative}: ${pointer}.${key} must be an array of ${kind} references`);
        continue;
      }
      if (new Set(child).size !== child.length) errors.push(`${relative}: ${pointer}.${key} contains duplicate ${kind} references`);
      for (const id of child) {
        if (!ids.has(id)) errors.push(`${relative}: unresolved ${kind} ${id} (${pointer}.${key})`);
      }
      continue;
    }
    validateReferences(relative, child, `${pointer}.${key}`);
  }
}
for (const relative of canonicalPaths) validateReferences(relative, readJson(relative));

if (errors.length) {
  console.error('Assurance integrity validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance integrity validation passed: ${idOwners.size} globally unique public IDs, ${canonicalPaths.size} canonical files, ${requiredRoutes.length} required routes.`);
