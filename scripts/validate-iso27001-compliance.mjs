import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const errors = [];
const dataPath = 'assurance/compliance/iso-27001-2022.json';
const schemaPath = 'contracts/assurance/iso-27001-compliance.schema.json';
const soaPath = 'docs/governance/soa/ISO-27001-SOA.md';

const compliance = readJson(dataPath);
const schema = readJson(schemaPath);
const registry = readJson('assurance/registry.json');
const evidence = readJson('assurance/evidence/evidence.json');
const soa = fs.readFileSync(path.join(root, soaPath), 'utf8');

const expectedClauseRefs = [
  '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.2', '5.3',
  '6.1', '6.1.1', '6.1.2', '6.1.3', '6.2', '6.3',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.5.1', '7.5.2', '7.5.3',
  '8.1', '8.2', '8.3',
  '9.1', '9.2', '9.2.1', '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3',
  '10.1', '10.2',
];
const expectedAnnexRefs = [
  ...Array.from({ length: 37 }, (_, index) => `A.5.${index + 1}`),
  ...Array.from({ length: 8 }, (_, index) => `A.6.${index + 1}`),
  ...Array.from({ length: 14 }, (_, index) => `A.7.${index + 1}`),
  ...Array.from({ length: 34 }, (_, index) => `A.8.${index + 1}`),
];
const evidenceIds = new Set((evidence.records ?? []).map((record) => record.id));

function flattenPostures(groups, section) {
  const records = [];
  for (const posture of ['partial', 'gap', 'met']) {
    for (const record of groups?.[posture] ?? []) {
      records.push({ ...record, section, posture, applicability: 'applicable' });
    }
  }
  for (const record of groups?.notApplicable ?? []) {
    records.push({ ...record, section, posture: 'not-applicable', applicability: 'not-applicable' });
  }
  return records;
}

const clauseRecords = flattenPostures(compliance.clauses, 'clause');
const annexRecords = Object.entries(compliance.annexA ?? {}).flatMap(([theme, groups]) =>
  flattenPostures(groups, 'annex-a').map((record) => ({ ...record, theme }))
);
const allRecords = [...clauseRecords, ...annexRecords];

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${schemaPath}: expected JSON Schema draft 2020-12`);
if (compliance.schemaVersion !== 1) errors.push(`${dataPath}: schemaVersion must be 1`);
if (compliance.standard !== 'ISO/IEC 27001:2022' || compliance.edition !== '2022') errors.push(`${dataPath}: standard identity must remain ISO/IEC 27001:2022`);
if (compliance.visibility !== 'public') errors.push(`${dataPath}: visibility must be public`);
if ('counts' in compliance) errors.push(`${dataPath}: counts must be derived, not stored`);
if (!String(compliance.qualification ?? '').toLowerCase().includes('not claimed')) errors.push(`${dataPath}: qualification must avoid certification/conformance claims`);
if (!String(compliance.paraphraseNotice ?? '').toLowerCase().includes('paraphrase')) errors.push(`${dataPath}: paraphrase notice is required`);

if (compliance.sourceSoa?.id !== 'WG-SOA-001'
  || compliance.sourceSoa?.repositoryPath !== soaPath
  || compliance.sourceSoa?.status !== 'approved'
  || compliance.sourceSoa?.assessmentDate !== '2026-09-02'
  || compliance.sourceSoa?.approval?.pullRequest !== 56
  || compliance.sourceSoa?.approval?.mergeCommit !== '1ae105da8ab6466e334a2faf4e6c63f5885c91df') {
  errors.push(`${dataPath}: sourceSoa must identify the approved WG-SOA-001 baseline`);
}

const registryEntry = (registry.datasets ?? []).find((dataset) => dataset.kind === 'compliance');
if (!registryEntry || registryEntry.path !== dataPath || registryEntry.schema !== schemaPath) {
  errors.push('assurance/registry.json: compliance dataset must resolve to the ISO/IEC 27001 public mapping and schema');
}

if (clauseRecords.length !== 34) errors.push(`${dataPath}: expected 34 clause records, found ${clauseRecords.length}`);
if (annexRecords.length !== 93) errors.push(`${dataPath}: expected 93 Annex A records, found ${annexRecords.length}`);
const seen = new Set();
for (const record of allRecords) {
  if (seen.has(record.reference)) errors.push(`${record.reference}: duplicate ISO reference`);
  seen.add(record.reference);
  if (!record.title || record.title.length > 80) errors.push(`${record.reference}: title must be a short paraphrase`);
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) errors.push(`${record.reference}: at least one EVD-* reference is required`);
  if (new Set(record.evidence ?? []).size !== (record.evidence ?? []).length) errors.push(`${record.reference}: duplicate evidence reference`);
  for (const evidenceId of record.evidence ?? []) {
    if (!/^EVD-[A-Z]+-[0-9]{3,}$/.test(evidenceId)) errors.push(`${record.reference}: invalid evidence ID ${evidenceId}`);
    if (!evidenceIds.has(evidenceId)) errors.push(`${record.reference}: unresolved evidence ${evidenceId}`);
  }
  if (record.posture === 'not-applicable' && (!record.rationale || record.rationale.trim().length < 10)) {
    errors.push(`${record.reference}: N/A rationale is required`);
  }
  if (record.posture !== 'not-applicable' && record.rationale) errors.push(`${record.reference}: rationale is reserved for N/A controls`);
}
for (const ref of expectedClauseRefs) if (!seen.has(ref)) errors.push(`${ref}: required clause reference is missing`);
for (const ref of expectedAnnexRefs) if (!seen.has(ref)) errors.push(`${ref}: required Annex A control is missing`);

const sourceRows = new Map();
for (const line of soa.split(/\r?\n/)) {
  const match = /^\|\s*(A\.(?:5|6|7|8)\.\d+)\s*\|\s*[^|]+\|\s*(Yes|No)\s*\|\s*(Met|Partial|Gap|N\/A)\s*\|/.exec(line);
  if (!match) continue;
  sourceRows.set(match[1], {
    applicability: match[2] === 'Yes' ? 'applicable' : 'not-applicable',
    posture: match[3] === 'N/A' ? 'not-applicable' : match[3].toLowerCase(),
  });
}
if (sourceRows.size !== 93) errors.push(`${soaPath}: expected 93 Annex A source rows, found ${sourceRows.size}`);

for (const record of annexRecords) {
  const source = sourceRows.get(record.reference);
  if (!source) {
    errors.push(`${record.reference}: missing from approved SoA`);
    continue;
  }
  if (record.applicability !== source.applicability) errors.push(`${record.reference}: applicability differs from approved SoA`);
  if (record.posture !== source.posture) errors.push(`${record.reference}: posture differs from approved SoA`);
}

const postureCounts = annexRecords.reduce((counts, record) => {
  counts[record.posture] = (counts[record.posture] ?? 0) + 1;
  return counts;
}, {});
for (const [posture, expected] of Object.entries({ met: 3, partial: 62, gap: 3, 'not-applicable': 25 })) {
  if ((postureCounts[posture] ?? 0) !== expected) errors.push(`${dataPath}: expected ${expected} ${posture} Annex A controls, found ${postureCounts[posture] ?? 0}`);
}

if (errors.length) {
  console.error('ISO/IEC 27001 public compliance validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`ISO/IEC 27001 public compliance validation passed: ${clauseRecords.length} clause references and ${annexRecords.length} Annex A controls.`);
