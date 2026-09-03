import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const errors = [];
const manifestPath = 'assurance/compliance/wcag-2.2.json';
const manifestSchemaPath = 'contracts/assurance/wcag-2.2-registry.schema.json';
const criterionSchemaPath = 'contracts/assurance/wcag-2.2-criteria.schema.json';
const evidencePath = 'assurance/evidence/evidence.json';

const manifest = readJson(manifestPath);
const manifestSchema = readJson(manifestSchemaPath);
const criterionSchema = readJson(criterionSchemaPath);
const evidence = readJson(evidencePath);
const evidenceIds = new Set((evidence.records ?? []).map((record) => record.id));
const expected = [
  ['1.1.1', "Non-text Content", 'A', 'non-text-content'],
  ['1.2.1', "Audio-only and Video-only (Prerecorded)", 'A', 'audio-only-and-video-only-prerecorded'],
  ['1.2.2', "Captions (Prerecorded)", 'A', 'captions-prerecorded'],
  ['1.2.3', "Audio Description or Media Alternative (Prerecorded)", 'A', 'audio-description-or-media-alternative-prerecorded'],
  ['1.2.4', "Captions (Live)", 'AA', 'captions-live'],
  ['1.2.5', "Audio Description (Prerecorded)", 'AA', 'audio-description-prerecorded'],
  ['1.2.6', "Sign Language (Prerecorded)", 'AAA', 'sign-language-prerecorded'],
  ['1.2.7', "Extended Audio Description (Prerecorded)", 'AAA', 'extended-audio-description-prerecorded'],
  ['1.2.8', "Media Alternative (Prerecorded)", 'AAA', 'media-alternative-prerecorded'],
  ['1.2.9', "Audio-only (Live)", 'AAA', 'audio-only-live'],
  ['1.3.1', "Info and Relationships", 'A', 'info-and-relationships'],
  ['1.3.2', "Meaningful Sequence", 'A', 'meaningful-sequence'],
  ['1.3.3', "Sensory Characteristics", 'A', 'sensory-characteristics'],
  ['1.3.4', "Orientation", 'AA', 'orientation'],
  ['1.3.5', "Identify Input Purpose", 'AA', 'identify-input-purpose'],
  ['1.3.6', "Identify Purpose", 'AAA', 'identify-purpose'],
  ['1.4.1', "Use of Color", 'A', 'use-of-color'],
  ['1.4.2', "Audio Control", 'A', 'audio-control'],
  ['1.4.3', "Contrast (Minimum)", 'AA', 'contrast-minimum'],
  ['1.4.4', "Resize Text", 'AA', 'resize-text'],
  ['1.4.5', "Images of Text", 'AA', 'images-of-text'],
  ['1.4.6', "Contrast (Enhanced)", 'AAA', 'contrast-enhanced'],
  ['1.4.7', "Low or No Background Audio", 'AAA', 'low-or-no-background-audio'],
  ['1.4.8', "Visual Presentation", 'AAA', 'visual-presentation'],
  ['1.4.9', "Images of Text (No Exception)", 'AAA', 'images-of-text-no-exception'],
  ['1.4.10', "Reflow", 'AA', 'reflow'],
  ['1.4.11', "Non-text Contrast", 'AA', 'non-text-contrast'],
  ['1.4.12', "Text Spacing", 'AA', 'text-spacing'],
  ['1.4.13', "Content on Hover or Focus", 'AA', 'content-on-hover-or-focus'],
  ['2.1.1', "Keyboard", 'A', 'keyboard'],
  ['2.1.2', "No Keyboard Trap", 'A', 'no-keyboard-trap'],
  ['2.1.3', "Keyboard (No Exception)", 'AAA', 'keyboard-no-exception'],
  ['2.1.4', "Character Key Shortcuts", 'A', 'character-key-shortcuts'],
  ['2.2.1', "Timing Adjustable", 'A', 'timing-adjustable'],
  ['2.2.2', "Pause, Stop, Hide", 'A', 'pause-stop-hide'],
  ['2.2.3', "No Timing", 'AAA', 'no-timing'],
  ['2.2.4', "Interruptions", 'AAA', 'interruptions'],
  ['2.2.5', "Re-authenticating", 'AAA', 're-authenticating'],
  ['2.2.6', "Timeouts", 'AAA', 'timeouts'],
  ['2.3.1', "Three Flashes or Below Threshold", 'A', 'three-flashes-or-below-threshold'],
  ['2.3.2', "Three Flashes", 'AAA', 'three-flashes'],
  ['2.3.3', "Animation from Interactions", 'AAA', 'animation-from-interactions'],
  ['2.4.1', "Bypass Blocks", 'A', 'bypass-blocks'],
  ['2.4.2', "Page Titled", 'A', 'page-titled'],
  ['2.4.3', "Focus Order", 'A', 'focus-order'],
  ['2.4.4', "Link Purpose (In Context)", 'A', 'link-purpose-in-context'],
  ['2.4.5', "Multiple Ways", 'AA', 'multiple-ways'],
  ['2.4.6', "Headings and Labels", 'AA', 'headings-and-labels'],
  ['2.4.7', "Focus Visible", 'AA', 'focus-visible'],
  ['2.4.8', "Location", 'AAA', 'location'],
  ['2.4.9', "Link Purpose (Link Only)", 'AAA', 'link-purpose-link-only'],
  ['2.4.10', "Section Headings", 'AAA', 'section-headings'],
  ['2.4.11', "Focus Not Obscured (Minimum)", 'AA', 'focus-not-obscured-minimum'],
  ['2.4.12', "Focus Not Obscured (Enhanced)", 'AAA', 'focus-not-obscured-enhanced'],
  ['2.4.13', "Focus Appearance", 'AAA', 'focus-appearance'],
  ['2.5.1', "Pointer Gestures", 'A', 'pointer-gestures'],
  ['2.5.2', "Pointer Cancellation", 'A', 'pointer-cancellation'],
  ['2.5.3', "Label in Name", 'A', 'label-in-name'],
  ['2.5.4', "Motion Actuation", 'A', 'motion-actuation'],
  ['2.5.5', "Target Size (Enhanced)", 'AAA', 'target-size-enhanced'],
  ['2.5.6', "Concurrent Input Mechanisms", 'AAA', 'concurrent-input-mechanisms'],
  ['2.5.7', "Dragging Movements", 'AA', 'dragging-movements'],
  ['2.5.8', "Target Size (Minimum)", 'AA', 'target-size-minimum'],
  ['3.1.1', "Language of Page", 'A', 'language-of-page'],
  ['3.1.2', "Language of Parts", 'AA', 'language-of-parts'],
  ['3.1.3', "Unusual Words", 'AAA', 'unusual-words'],
  ['3.1.4', "Abbreviations", 'AAA', 'abbreviations'],
  ['3.1.5', "Reading Level", 'AAA', 'reading-level'],
  ['3.1.6', "Pronunciation", 'AAA', 'pronunciation'],
  ['3.2.1', "On Focus", 'A', 'on-focus'],
  ['3.2.2', "On Input", 'A', 'on-input'],
  ['3.2.3', "Consistent Navigation", 'AA', 'consistent-navigation'],
  ['3.2.4', "Consistent Identification", 'AA', 'consistent-identification'],
  ['3.2.5', "Change on Request", 'AAA', 'change-on-request'],
  ['3.2.6', "Consistent Help", 'A', 'consistent-help'],
  ['3.3.1', "Error Identification", 'A', 'error-identification'],
  ['3.3.2', "Labels or Instructions", 'A', 'labels-or-instructions'],
  ['3.3.3', "Error Suggestion", 'AA', 'error-suggestion'],
  ['3.3.4', "Error Prevention (Legal, Financial, Data)", 'AA', 'error-prevention-legal-financial-data'],
  ['3.3.5', "Help", 'AAA', 'help'],
  ['3.3.6', "Error Prevention (All)", 'AAA', 'error-prevention-all'],
  ['3.3.7', "Redundant Entry", 'A', 'redundant-entry'],
  ['3.3.8', "Accessible Authentication (Minimum)", 'AA', 'accessible-authentication-minimum'],
  ['3.3.9', "Accessible Authentication (Enhanced)", 'AAA', 'accessible-authentication-enhanced'],
  ['4.1.2', "Name, Role, Value", 'A', 'name-role-value'],
  ['4.1.3', "Status Messages", 'AA', 'status-messages']
];
const expectedById = new Map(expected.map(([criterionId, name, level, slug]) => [criterionId, { name, level, slug }]));
const allowedStatuses = new Set(['demonstrated', 'partial', 'gap', 'not-observed']);
const allowedAutomation = new Set(['partial', 'none']);
const freshnessRules = new Set(['release-bound', 'content-change', 'interaction-change', 'quarterly-manual']);
const principleMap = new Map([['1', 'Perceivable'], ['2', 'Operable'], ['3', 'Understandable'], ['4', 'Robust']]);

if (manifestSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${manifestSchemaPath}: expected JSON Schema draft 2020-12`);
if (criterionSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${criterionSchemaPath}: expected JSON Schema draft 2020-12`);
if (manifest.schemaVersion !== 1 || manifest.id !== 'wcag-2-2-public-registry') errors.push(`${manifestPath}: stable registry identity changed`);
if (manifest.standard !== 'Web Content Accessibility Guidelines (WCAG) 2.2' || manifest.edition !== '2.2') errors.push(`${manifestPath}: standard identity must remain WCAG 2.2`);
if (manifest.visibility !== 'public') errors.push(`${manifestPath}: registry must remain public`);
if ('counts' in manifest) errors.push(`${manifestPath}: counts must be derived, not stored`);

const qualification = String(manifest.qualification ?? '').toLowerCase();
for (const phrase of ['does not claim', 'conformance', 'level a', 'aa', 'aaa', 'certification']) {
  if (!qualification.includes(phrase)) errors.push(`${manifestPath}: qualification must preserve non-conformance wording: ${phrase}`);
}

if (manifest.sources?.normative !== 'https://www.w3.org/TR/WCAG22/') errors.push(`${manifestPath}: normative source must be W3C WCAG 2.2`);
if (manifest.sources?.machineReadable !== 'https://www.w3.org/WAI/WCAG22/wcag.json') errors.push(`${manifestPath}: machine-readable source must be W3C WCAG 2.2 JSON`);
if (manifest.sources?.conformanceUnderstanding !== 'https://www.w3.org/WAI/WCAG22/Understanding/conformance.html') errors.push(`${manifestPath}: conformance source must remain W3C`);
if (manifest.sources?.techniquesUnderstanding !== 'https://www.w3.org/WAI/WCAG22/Understanding/understanding-techniques.html') errors.push(`${manifestPath}: techniques source must remain W3C`);
if (!String(manifest.sources?.attribution ?? '').includes('W3C')) errors.push(`${manifestPath}: W3C attribution is required`);

for (const rule of freshnessRules) if (!manifest.freshnessRules?.[rule]) errors.push(`${manifestPath}: missing freshness rule ${rule}`);
for (const evidenceId of manifest.registryEvidenceIds ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${manifestPath}: unresolved registry evidence ${evidenceId}`);

const partitions = manifest.partitions ?? [];
if (partitions.length !== 4) errors.push(`${manifestPath}: exactly four WCAG principle partitions are required`);
const seenPrinciples = new Set();
const records = [];
for (const partition of partitions) {
  const relative = partition.path;
  if (!relative || path.isAbsolute(relative) || relative.includes('..') || !fs.existsSync(path.join(root, relative))) {
    errors.push(`${manifestPath}: unresolved partition ${relative}`);
    continue;
  }
  const data = readJson(relative);
  const principleNumber = data.principle?.number;
  const principleName = data.principle?.name;
  if (principleMap.get(principleNumber) !== principleName) errors.push(`${relative}: principle number/name mismatch`);
  if (partition.principle !== principleName) errors.push(`${relative}: manifest principle differs from partition`);
  if (seenPrinciples.has(principleNumber)) errors.push(`${relative}: duplicate principle partition`);
  seenPrinciples.add(principleNumber);
  for (const record of data.criteria ?? []) {
    if (!String(record.criterionId).startsWith(`${principleNumber}.`)) errors.push(`${record.criterionId}: criterion is in the wrong principle partition`);
    records.push(record);
  }
}

if (records.length !== 86) errors.push(`${manifestPath}: expected 86 current WCAG 2.2 A/AA/AAA success criteria, found ${records.length}`);
const seen = new Set();
const levelCounts = { A: 0, AA: 0, AAA: 0 };
for (const record of records) {
  const id = record.criterionId;
  const expectedRecord = expectedById.get(id);
  if (!expectedRecord) {
    errors.push(`${id}: unexpected or obsolete WCAG criterion`);
    continue;
  }
  if (seen.has(id)) errors.push(`${id}: duplicate criterion`);
  seen.add(id);
  if (record.name !== expectedRecord.name) errors.push(`${id}: name differs from W3C WCAG 2.2 source`);
  if (record.level !== expectedRecord.level) errors.push(`${id}: level differs from W3C WCAG 2.2 source`);
  if (!allowedStatuses.has(record.status)) errors.push(`${id}: unsupported registry status ${record.status}`);
  if (!record.implementation) errors.push(`${id}: implementation is required`);
  if (!record.owner) errors.push(`${id}: owner is required`);
  if (!Array.isArray(record.gaps) || record.gaps.length === 0) errors.push(`${id}: explicit gaps/limitations are required`);
  if (!allowedAutomation.has(record.validation?.automated)) errors.push(`${id}: automated validation must be partial or none`);
  if (record.validation?.manual !== 'required') errors.push(`${id}: manual validation must remain required`);
  if (!Array.isArray(record.evidenceIds) || record.evidenceIds.length === 0) errors.push(`${id}: evidence IDs are required`);
  if (new Set(record.evidenceIds ?? []).size !== (record.evidenceIds ?? []).length) errors.push(`${id}: duplicate evidence ID`);
  for (const evidenceId of record.evidenceIds ?? []) {
    if (!/^EVD-[A-Z]+-[0-9]{3,}$/.test(evidenceId)) errors.push(`${id}: invalid evidence ID ${evidenceId}`);
    if (!evidenceIds.has(evidenceId)) errors.push(`${id}: unresolved evidence ${evidenceId}`);
  }
  if (!Array.isArray(record.freshnessRules) || record.freshnessRules.length === 0) errors.push(`${id}: freshness rules are required`);
  for (const rule of record.freshnessRules ?? []) if (!freshnessRules.has(rule)) errors.push(`${id}: unknown freshness rule ${rule}`);
  levelCounts[record.level] += 1;
}

for (const [criterionId] of expected) if (!seen.has(criterionId)) errors.push(`${criterionId}: required WCAG 2.2 criterion is missing`);
if (seen.has('4.1.1')) errors.push('4.1.1: Parsing is obsolete and removed in WCAG 2.2 and must not appear in the A/AA/AAA registry');
for (const [level, expectedCount] of Object.entries({ A: 31, AA: 24, AAA: 31 })) {
  if (levelCounts[level] !== expectedCount) errors.push(`${manifestPath}: expected ${expectedCount} Level ${level} criteria, found ${levelCounts[level]}`);
}

const serialized = JSON.stringify({ manifest, records }).toLowerCase();
for (const forbidden of ['wcag 2.2 conformant', 'wcag 2.2 compliant', 'certified wcag']) {
  if (serialized.includes(forbidden)) errors.push(`${manifestPath}: forbidden blanket claim wording: ${forbidden}`);
}

if (errors.length) {
  console.error('WCAG 2.2 public registry validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`WCAG 2.2 public registry validation passed: ${records.length} criteria (A ${levelCounts.A}, AA ${levelCounts.AA}, AAA ${levelCounts.AAA}).`);
