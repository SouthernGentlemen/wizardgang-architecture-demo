import fs from 'node:fs';
import path from 'node:path';
import {
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  canonicalAssuranceDatasetPaths,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
} from './lib/assurance-registry.mjs';
import { validateRelationshipSet } from './lib/assurance-relationships.mjs';

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

const recordResources = assuranceRecordResources(registry);
const recordEntries = [];
const recordsByKind = new Map();
const documentsByResource = new Map();
for (const resource of recordResources) {
  if (!resource.capabilities?.includes('runtime')) {
    errors.push(`${resource.id}: records capability is unsupported without runtime capability`);
    continue;
  }
  const data = readJson(resource.path);
  documentsByResource.set(resource.id, data);
  let records;
  try {
    records = assuranceRecordsFromDocument(resource, data);
  } catch (error) {
    errors.push(`${resource.path}: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }
  const family = recordsByKind.get(resource.kind) ?? [];
  for (const record of records) {
    const entry = { resource, record };
    recordEntries.push(entry);
    family.push(entry);
  }
  recordsByKind.set(resource.kind, family);
}

function recordsForKind(kind) {
  return (recordsByKind.get(kind) ?? []).map((entry) => entry.record);
}

function idsForKind(kind) {
  return new Set(recordsForKind(kind).map((record) => record.id).filter((id) => typeof id === 'string'));
}

const idOwners = new Map();
function registerPublicId(id, owner) {
  if (!id || typeof id !== 'string') { errors.push(`${owner}: missing public stable ID`); return; }
  const previous = idOwners.get(id);
  if (previous) errors.push(`duplicate public ID ${id}: ${previous} and ${owner}`);
  else idOwners.set(id, owner);
}

for (const { resource, record } of recordEntries) {
  registerPublicId(record.id, resource.id);
  if (resource.kind !== 'evidence') continue;
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

const complianceEntries = recordEntries.filter(({ resource }) => resource.kind === 'compliance');
const complianceRecords = complianceEntries.map(({ record }) => record);
const frameworkIds = new Set(resources.map((resource) => resource.framework?.id).filter((value) => typeof value === 'string'));
const frameworkByResourceId = new Map();
function indexFrameworkOwnership(resource, inheritedFrameworkId) {
  const frameworkId = resource.framework?.id ?? inheritedFrameworkId;
  if (frameworkId) frameworkByResourceId.set(resource.id, frameworkId);
  for (const child of resource.resources ?? []) indexFrameworkOwnership(child, frameworkId);
}
for (const dataset of registry.datasets ?? []) indexFrameworkOwnership(dataset);
const manifestResources = resources.filter((entry) => entry.kind === 'compliance' && entry.capabilities?.includes('manifest'));
const compliancePrefixes = new Map([
  ['iso-27001', 'ISO27001'],
  ['iso-42001', 'ISO42001'],
  ['wcag-2.2', 'WCAG'],
]);
for (const { resource, record } of complianceEntries) {
  const frameworkId = frameworkByResourceId.get(resource.id);
  if (!frameworkId) {
    errors.push(`${resource.id}: compliance records require canonical registry framework ownership`);
    continue;
  }
  const prefix = compliancePrefixes.get(frameworkId);
  if (prefix && record.id !== `${prefix}-${record.reference}`) errors.push(`${record.id}: compliance identity must be explicit and canonical`);
}

const targetFamilies = new Map([
  ['evidence', idsForKind('evidence')],
  ['compliance', idsForKind('compliance')],
  ['frameworks', frameworkIds],
  ['claims', idsForKind('claims')],
  ['risks', idsForKind('risks')],
  ['controls', new Set(complianceRecords.filter((record) => record.kind === 'control').map((record) => record.id))],
  ['incidents', idsForKind('incidents')],
  ['exercises', idsForKind('exercises')],
  ['advisories', idsForKind('advisories')],
  ['governanceDocuments', new Set((governance.records ?? []).map((record) => record.reference))],
  ['objectives', objectiveIds],
]);

for (const { resource, record } of recordEntries) {
  if (record?.relationships) errors.push(...validateRelationshipSet(record.relationships, targetFamilies, `${resource.path}:${record.id}`));
}
for (const resource of manifestResources) {
  const data = readJson(resource.path);
  if (data.registryRelationships) errors.push(...validateRelationshipSet(data.registryRelationships, targetFamilies, `${resource.path}:registry`));
}
for (const resource of recordResources.filter((entry) => entry.kind === 'risks')) {
  const data = documentsByResource.get(resource.id);
  for (const source of data?.sourceRegisters ?? []) {
    if (!targetFamilies.get('governanceDocuments').has(source.governanceDocumentReference)) errors.push(`${resource.path}: unresolved governance document ${source.governanceDocumentReference}`);
  }
}

if (errors.length) {
  console.error('Assurance integrity validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Assurance integrity validation passed: ${idOwners.size} globally unique public IDs from ${recordEntries.length} registry-discovered records, ${canonicalPaths.size} canonical files, ${requiredRoutes.length} required routes, and ${complianceRecords.length} explicit compliance IDs.`);
