import fs from 'node:fs';
import path from 'node:path';
import {
  canonicalAssuranceDatasetPaths,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
  primaryRegistryDataset,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const nowValue = process.env.ASSURANCE_VALIDATION_NOW ?? new Date().toISOString();
const validationNow = Date.parse(nowValue);
const errors = [];
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const exists = (relative) => Boolean(relative) && !path.isAbsolute(relative) && !relative.includes('..') && fs.existsSync(path.join(root, relative));

if (Number.isNaN(validationNow)) errors.push(`ASSURANCE_VALIDATION_NOW is not a valid date-time: ${nowValue}`);

const registry = loadAssuranceRegistry(root);
const resources = flattenAssuranceRegistry(registry);
const routeManifest = readJson('docs/route-manifest.json');
const publicRoutes = new Set(routeManifest.map((entry) => entry.route));
const requiredRoutes = [
  '/evidence', '/compliance', '/governance/risks', '/governance/incidents', '/security',
  '/v1/assurance', '/v1/assurance/evidence', '/v1/assurance/risks', '/v1/assurance/incidents',
  '/v1/assurance/advisories', '/v1/assurance/compliance', '/v1/assurance/compliance/{recordId}',
];
for (const route of requiredRoutes) if (!publicRoutes.has(route)) errors.push(`required public assurance route is missing: ${route}`);

const canonicalPaths = new Set(canonicalAssuranceDatasetPaths(registry).filter((relative) => exists(relative)));
const derivedOnlyKeys = new Set(['counts', 'usedBy', 'url', 'urls', 'href', 'hrefs', 'resolved']);
const legacyCompatibilityKeys = new Set(['notApplicable', 'frameworkReferences', 'evidenceIds', 'registryEvidenceIds', 'riskLinks', 'controlLinks', 'objectiveLinks', 'incidentLinks']);
const unsafePublicKeys = new Set([
  'acceptanceauthority', 'acceptancerationale', 'accountmetadata', 'authorization', 'authorizationheader', 'cookie', 'cookies',
  'credential', 'credentials', 'infrastructuredetail', 'infrastructuredetails', 'password', 'paymentdata', 'privatetreatment',
  'privatetreatmentdetail', 'reporteridentity', 'requestbody', 'secret', 'secrets', 'token', 'tokens', 'treatmentactions',
]);
function normalizedKey(key) { return String(key).replaceAll('-', '').replaceAll('_', '').toLowerCase(); }
function scanCanonical(relative, value, pointer = '$') {
  if (Array.isArray(value)) { value.forEach((entry, index) => scanCanonical(relative, entry, `${pointer}[${index}]`)); return; }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (derivedOnlyKeys.has(key)) errors.push(`${relative}: ${key} is derived presentation data and must not be stored (${pointer}.${key})`);
    if (legacyCompatibilityKeys.has(key)) errors.push(`${relative}: legacy compatibility field ${key} is not allowed (${pointer}.${key})`);
    if (unsafePublicKeys.has(normalizedKey(key))) errors.push(`${relative}: unsafe public field ${key} is not allowed (${pointer}.${key})`);
    scanCanonical(relative, child, `${pointer}.${key}`);
  }
}
for (const relative of canonicalPaths) scanCanonical(relative, readJson(relative));

const evidencePath = primaryRegistryDataset(registry, 'evidence').path;
const claimsPath = primaryRegistryDataset(registry, 'claims').path;
const risksPath = primaryRegistryDataset(registry, 'risks').path;
const incidentsPath = primaryRegistryDataset(registry, 'incidents').path;
const exercisesPath = primaryRegistryDataset(registry, 'exercises').path;
const advisoriesPath = primaryRegistryDataset(registry, 'advisories').path;
const evidence = readJson(evidencePath);
const claims = readJson(claimsPath);
const risks = readJson(risksPath);
const incidents = readJson(incidentsPath);
const exercises = readJson(exercisesPath);
const advisories = readJson(advisoriesPath);
const governance = readJson('docs/governance/REFERENCE-REGISTRY.json');
const objectiveCatalogReference = 'WG-OBJ-001';
const objectiveCatalogEntry = (governance.records ?? []).find((record) => record.reference === objectiveCatalogReference);
const objectiveIds = new Set();
if (!objectiveCatalogEntry) {
  errors.push(`governance catalog is missing ${objectiveCatalogReference} for objective relationship resolution`);
} else if (!exists(objectiveCatalogEntry.path)) {
  errors.push(`${objectiveCatalogReference}: governance objective catalog path is missing: ${objectiveCatalogEntry.path}`);
} else {
  const objectiveDocument = fs.readFileSync(path.join(root, objectiveCatalogEntry.path), 'utf8');
  for (const match of objectiveDocument.matchAll(/\|\s*([A-Z]+-OBJ-[0-9]{3})\s*\|/g)) objectiveIds.add(match[1]);
  if (objectiveIds.size === 0) errors.push(`${objectiveCatalogReference}: no permanent objective IDs were found in ${objectiveCatalogEntry.path}`);
}

const idOwners = new Map();
function registerPublicId(id, owner) {
  if (!id || typeof id !== 'string') { errors.push(`${owner}: missing public stable ID`); return; }
  const previous = idOwners.get(id);
  if (previous) errors.push(`duplicate public ID ${id}: ${previous} and ${owner}`);
  else idOwners.set(id, owner);
}

for (const record of evidence.records ?? []) {
  registerPublicId(record.id, 'evidence');
  if (record.locator?.route && !publicRoutes.has(record.locator.route)) errors.push(`${record.id}: evidence route is missing from the route manifest: ${record.locator.route}`);
  const isTimeBound = record.kind === 'observation' || record.observedAt !== undefined || record.validUntil !== undefined;
  if (isTimeBound) {
    if (record.freshnessPolicy !== 'observation-bound') errors.push(`${record.id}: time-bound evidence must use observation-bound freshness`);
    if (record.observedAt && record.validUntil) {
      const observedAt = Date.parse(record.observedAt);
      const validUntil = Date.parse(record.validUntil);
      if (!Number.isNaN(observedAt) && !Number.isNaN(validUntil) && validUntil <= observedAt) errors.push(`${record.id}: validUntil must be after observedAt`);
      if (!Number.isNaN(validUntil) && !Number.isNaN(validationNow) && validUntil <= validationNow) errors.push(`${record.id}: time-bound evidence is stale as of ${nowValue}`);
    }
  }
}
for (const record of claims.records ?? []) registerPublicId(record.id, 'claim');
for (const record of risks.records ?? []) registerPublicId(record.id, 'risk');
for (const record of incidents.records ?? []) registerPublicId(record.id, 'incident');
for (const record of exercises.records ?? []) registerPublicId(record.id, 'exercise');
for (const record of advisories.records ?? []) registerPublicId(record.id, 'advisory');

const complianceRecords = [];
const frameworkIds = new Set();
for (const resource of resources.filter((entry) => entry.kind === 'compliance' && entry.capabilities?.includes('records'))) {
  const data = readJson(resource.path);
  if (Array.isArray(data.records)) {
    if (data.framework?.id) frameworkIds.add(data.framework.id);
    for (const record of data.records) complianceRecords.push(record);
  } else if (Array.isArray(data.criteria)) {
    if (data.framework) frameworkIds.add(data.framework);
    for (const record of data.criteria) complianceRecords.push(record);
  }
}
const manifestResources = resources.filter((entry) => entry.kind === 'compliance' && entry.capabilities?.includes('manifest'));
for (const resource of manifestResources) {
  const data = readJson(resource.path);
  if (data.framework?.id) frameworkIds.add(data.framework.id);
}
for (const record of complianceRecords) {
  registerPublicId(record.id, 'compliance');
  const prefix = record.framework === 'wcag-2.2' ? 'WCAG' : record.framework === 'iso-27001' ? 'ISO27001' : 'ISO42001';
  if (record.id !== `${prefix}-${record.reference}`) errors.push(`${record.id}: compliance identity must be explicit and canonical`);
}

const targetFamilies = new Map([
  ['evidence', new Set((evidence.records ?? []).map((record) => record.id))],
  ['compliance', new Set(complianceRecords.map((record) => record.id))],
  ['frameworks', frameworkIds],
  ['claims', new Set((claims.records ?? []).map((record) => record.id))],
  ['risks', new Set((risks.records ?? []).map((record) => record.id))],
  ['controls', new Set(complianceRecords.filter((record) => record.kind === 'control').map((record) => record.id))],
  ['incidents', new Set((incidents.records ?? []).map((record) => record.id))],
  ['exercises', new Set((exercises.records ?? []).map((record) => record.id))],
  ['advisories', new Set((advisories.records ?? []).map((record) => record.id))],
  ['governanceDocuments', new Set((governance.records ?? []).map((record) => record.reference))],
  ['objectives', objectiveIds],
]);

export function validateRelationshipSet(relationships, families = targetFamilies, label = 'relationships') {
  const relationshipErrors = [];
  for (const [family, targets] of families) {
    const values = Array.isArray(relationships?.[family]) ? relationships[family] : [];
    for (const id of values) {
      if (!targets.has(id)) relationshipErrors.push(`${label}.${family}: unresolved ${family} relationship ${id}`);
    }
  }
  return relationshipErrors;
}

const relationshipDatasets = [
  [claimsPath, claims.records ?? []], [risksPath, risks.records ?? []], [incidentsPath, incidents.records ?? []],
  [exercisesPath, exercises.records ?? []], [advisoriesPath, advisories.records ?? []],
];
for (const [relative, records] of relationshipDatasets) {
  for (const record of records) errors.push(...validateRelationshipSet(record.relationships, targetFamilies, `${relative}:${record.id}`));
}
for (const record of complianceRecords) errors.push(...validateRelationshipSet(record.relationships, targetFamilies, `compliance:${record.id}`));
for (const resource of manifestResources) {
  const data = readJson(resource.path);
  if (data.registryRelationships) errors.push(...validateRelationshipSet(data.registryRelationships, targetFamilies, `${resource.path}:registry`));
}
for (const source of risks.sourceRegisters ?? []) {
  if (!targetFamilies.get('governanceDocuments').has(source.governanceDocumentReference)) errors.push(`${risksPath}: unresolved governance document ${source.governanceDocumentReference}`);
}

if (errors.length) {
  console.error('Assurance integrity validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Assurance integrity validation passed: ${idOwners.size} globally unique public IDs, ${canonicalPaths.size} registry-discovered canonical files, ${requiredRoutes.length} required routes, and ${complianceRecords.length} explicit compliance IDs.`);
