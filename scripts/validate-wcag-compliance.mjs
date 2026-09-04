import {
  loadAssuranceRecordInventory,
  loadAssuranceRegistry,
  readJsonFile,
  requireRegistryResource,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const errors = [];
const registry = loadAssuranceRegistry(root);
const inventory = loadAssuranceRecordInventory(root, registry);
const manifestResource = requireRegistryResource(
  registry,
  (resource) => resource.kind === 'compliance' && resource.capabilities?.includes('manifest') && resource.framework?.id === 'wcag-2.2',
  'WCAG 2.2 manifest resource',
);
const manifestPath = manifestResource.path;
const manifest = readJsonFile(root, manifestPath);
const framework = manifestResource.framework;
const partitionResources = (manifestResource.resources ?? []).filter((resource) => resource.kind === 'compliance' && resource.role === 'partition');
const evidenceIds = inventory.idsForKind('evidence');
const allowedStatuses = new Set(['demonstrated', 'partial', 'gap', 'not-observed']);
const freshnessRules = new Set(['release-bound', 'content-change', 'interaction-change', 'quarterly-manual']);
const principleMap = new Map([['1', 'Perceivable'], ['2', 'Operable'], ['3', 'Understandable'], ['4', 'Robust']]);

const schemaPaths = new Set([manifestResource.schema, ...partitionResources.map((resource) => resource.schema)]);
for (const schemaPath of schemaPaths) {
  const schema = readJsonFile(root, schemaPath);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${schemaPath}: expected JSON Schema draft 2020-12`);
}
if (manifest.schemaVersion !== 1 || manifest.id !== 'wcag-2-2-public-registry') errors.push(`${manifestPath}: stable registry identity changed`);
if (!framework || framework.id !== 'wcag-2.2' || framework.label !== 'WCAG 2.2' || framework.edition !== '2.2') errors.push(`${manifestPath}: framework metadata must be owned by the registered manifest resource`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(framework?.assessmentDate ?? '')) errors.push(`${manifestPath}: registered framework assessmentDate must be an ISO date`);
for (const duplicate of ['standard', 'edition', 'assessmentDate', 'qualification', 'partitions', 'framework']) if (duplicate in manifest) errors.push(`${manifestPath}: ${duplicate} is registry-owned and must not be stored in the manifest`);
if (manifest.visibility !== 'public') errors.push(`${manifestPath}: registry must remain public`);
if ('counts' in manifest || 'registryEvidenceIds' in manifest) errors.push(`${manifestPath}: derived counts and legacy registryEvidenceIds are not allowed`);
for (const evidenceId of manifest.registryRelationships?.evidence ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${manifestPath}: unresolved registry evidence ${evidenceId}`);
const qualification = String(framework?.qualification ?? '').toLowerCase();
for (const phrase of ['does not claim', 'conformance', 'level a', 'aa', 'aaa', 'certification']) if (!qualification.includes(phrase)) errors.push(`${manifestPath}: qualification must preserve non-conformance wording: ${phrase}`);
if (manifest.sources?.normative !== 'https://www.w3.org/TR/WCAG22/' || manifest.sources?.machineReadable !== 'https://www.w3.org/WAI/WCAG22/wcag.json') errors.push(`${manifestPath}: W3C WCAG 2.2 sources must remain canonical`);
for (const rule of freshnessRules) if (!manifest.freshnessRules?.[rule]) errors.push(`${manifestPath}: missing freshness rule ${rule}`);

if (partitionResources.length !== 4) errors.push(`${manifestPath}: exactly four registry-owned WCAG principle partitions are required`);
const seenPrinciples = new Set();
const records = [];
for (const resource of partitionResources) {
  const partition = resource.partition;
  if (!partition || principleMap.get(partition.number) !== partition.label) errors.push(`${resource.path}: invalid registry-owned principle identity`);
  if (seenPrinciples.has(partition?.number)) errors.push(`${resource.path}: duplicate principle partition`);
  seenPrinciples.add(partition?.number);
  const data = inventory.documentForResource(resource.id);
  for (const duplicate of ['principle', 'framework', 'frameworkLabel', 'sourcePath']) if (duplicate in data) errors.push(`${resource.path}: ${duplicate} is registry-owned and must not be stored in the partition`);
  const resourceRecords = inventory.entries.filter((entry) => entry.resource.id === resource.id).map((entry) => entry.record);
  for (const record of resourceRecords) {
    if (!String(record.reference).startsWith(`${partition?.number}.`)) errors.push(`${record.id}: criterion is in the wrong principle partition`);
    for (const duplicate of ['framework', 'frameworkLabel', 'section', 'sourcePath']) if (duplicate in record) errors.push(`${record.id}: ${duplicate} is derived from registry metadata`);
    records.push(record);
  }
}
if (records.length !== 86) errors.push(`${manifestPath}: expected 86 current WCAG 2.2 A/AA/AAA success criteria, found ${records.length}`);
const seen = new Set();
for (const record of records) {
  if (record.id !== `WCAG-${record.reference}`) errors.push(`${record.reference}: explicit canonical ID must remain WCAG-${record.reference}`);
  if (seen.has(record.id)) errors.push(`${record.id}: duplicate WCAG criterion`);
  seen.add(record.id);
  if (record.kind !== 'criterion') errors.push(`${record.id}: canonical WCAG record kind is invalid`);
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
if (errors.length) { console.error('WCAG 2.2 public registry validation failed:'); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log(`WCAG 2.2 public registry validation passed from canonical normalized data: ${records.length} explicit criterion IDs across ${partitionResources.length} registry partitions.`);
