import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const errors = [];
const manifestPath = 'assurance/compliance/wcag-2.2.json';
const manifestSchemaPath = 'contracts/assurance/wcag-2.2-registry.schema.json';
const criterionSchemaPath = 'contracts/assurance/wcag-2.2-criteria.schema.json';
const manifest = readJson(manifestPath);
const manifestSchema = readJson(manifestSchemaPath);
const criterionSchema = readJson(criterionSchemaPath);
const evidence = readJson('assurance/evidence/evidence.json');
const evidenceIds = new Set((evidence.records ?? []).map((record) => record.id));
const allowedStatuses = new Set(['demonstrated', 'partial', 'gap', 'not-observed']);
const freshnessRules = new Set(['release-bound', 'content-change', 'interaction-change', 'quarterly-manual']);
const principleMap = new Map([['1', 'Perceivable'], ['2', 'Operable'], ['3', 'Understandable'], ['4', 'Robust']]);

if (manifestSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${manifestSchemaPath}: expected JSON Schema draft 2020-12`);
if (criterionSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${criterionSchemaPath}: expected JSON Schema draft 2020-12`);
if (manifest.schemaVersion !== 1 || manifest.id !== 'wcag-2-2-public-registry') errors.push(`${manifestPath}: stable registry identity changed`);
if (manifest.standard !== 'Web Content Accessibility Guidelines (WCAG) 2.2' || manifest.edition !== '2.2') errors.push(`${manifestPath}: standard identity must remain WCAG 2.2`);
if (manifest.framework?.id !== 'wcag-2.2' || manifest.framework?.label !== 'WCAG 2.2' || manifest.framework?.sourcePath !== manifestPath) errors.push(`${manifestPath}: canonical framework presentation metadata is required`);
if (manifest.visibility !== 'public') errors.push(`${manifestPath}: registry must remain public`);
if ('counts' in manifest || 'registryEvidenceIds' in manifest) errors.push(`${manifestPath}: derived counts and legacy registryEvidenceIds are not allowed`);
for (const evidenceId of manifest.registryRelationships?.evidence ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${manifestPath}: unresolved registry evidence ${evidenceId}`);

const qualification = String(manifest.qualification ?? '').toLowerCase();
for (const phrase of ['does not claim', 'conformance', 'level a', 'aa', 'aaa', 'certification']) if (!qualification.includes(phrase)) errors.push(`${manifestPath}: qualification must preserve non-conformance wording: ${phrase}`);
if (manifest.sources?.normative !== 'https://www.w3.org/TR/WCAG22/' || manifest.sources?.machineReadable !== 'https://www.w3.org/WAI/WCAG22/wcag.json') errors.push(`${manifestPath}: W3C WCAG 2.2 sources must remain canonical`);
for (const rule of freshnessRules) if (!manifest.freshnessRules?.[rule]) errors.push(`${manifestPath}: missing freshness rule ${rule}`);

const partitions = manifest.partitions ?? [];
if (partitions.length !== 4) errors.push(`${manifestPath}: exactly four WCAG principle partitions are required`);
const seenPrinciples = new Set();
const records = [];
for (const partition of partitions) {
  if (!partition.path || path.isAbsolute(partition.path) || partition.path.includes('..') || !fs.existsSync(path.join(root, partition.path))) {
    errors.push(`${manifestPath}: unresolved partition ${partition.path}`);
    continue;
  }
  const data = readJson(partition.path);
  const principleNumber = data.principle?.number;
  const principleName = data.principle?.name;
  if (principleMap.get(principleNumber) !== principleName || partition.principle !== principleName) errors.push(`${partition.path}: principle identity mismatch`);
  if (seenPrinciples.has(principleNumber)) errors.push(`${partition.path}: duplicate principle partition`);
  seenPrinciples.add(principleNumber);
  if (data.framework !== 'wcag-2.2' || data.frameworkLabel !== 'WCAG 2.2' || data.sourcePath !== partition.path) errors.push(`${partition.path}: partition framework/source metadata must be canonical`);
  for (const record of data.criteria ?? []) {
    if (!String(record.reference).startsWith(`${principleNumber}.`)) errors.push(`${record.id}: criterion is in the wrong principle partition`);
    records.push(record);
  }
}

if (records.length !== 86) errors.push(`${manifestPath}: expected 86 current WCAG 2.2 A/AA/AAA success criteria, found ${records.length}`);
const seen = new Set();
for (const record of records) {
  if (record.id !== `WCAG-${record.reference}`) errors.push(`${record.reference}: explicit canonical ID must remain WCAG-${record.reference}`);
  if (seen.has(record.id)) errors.push(`${record.id}: duplicate WCAG criterion`);
  seen.add(record.id);
  if (record.framework !== 'wcag-2.2' || record.frameworkLabel !== 'WCAG 2.2' || record.kind !== 'criterion') errors.push(`${record.id}: canonical WCAG identity fields are invalid`);
  if (!allowedStatuses.has(record.status)) errors.push(`${record.id}: unsupported registry status ${record.status}`);
  if (record.applicability !== 'applicable') errors.push(`${record.id}: WCAG applicability must remain explicit`);
  if ('criterionId' in record || 'name' in record || 'evidenceIds' in record) errors.push(`${record.id}: legacy WCAG compatibility fields are not allowed`);
  if (!record.implementation || !record.owner) errors.push(`${record.id}: implementation and owner are required`);
  if (!Array.isArray(record.gaps) || record.gaps.length === 0) errors.push(`${record.id}: explicit gaps/limitations are required`);
  if (!['partial', 'none'].includes(record.validation?.automated) || record.validation?.manual !== 'required') errors.push(`${record.id}: validation semantics changed`);
  const refs = record.relationships?.evidence;
  if (!Array.isArray(refs) || refs.length === 0) errors.push(`${record.id}: evidence relationships are required`);
  for (const evidenceId of refs ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);
  for (const rule of record.freshnessRules ?? []) if (!freshnessRules.has(rule)) errors.push(`${record.id}: unknown freshness rule ${rule}`);
}

if (errors.length) {
  console.error('WCAG 2.2 public registry validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`WCAG 2.2 public registry validation passed from canonical normalized data: ${records.length} explicit criterion IDs across ${partitions.length} partitions.`);
