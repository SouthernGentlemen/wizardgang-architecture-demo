import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  loadAssuranceRecordInventory,
  loadAssuranceRegistry,
} from './lib/assurance-registry.mjs';
import {
  ASSURANCE_DOCUMENTATION_SOURCE,
  assuranceRelationshipsForRelation,
  parseAssuranceDocumentationReference,
} from '../src/assurance/relationship-contract.js';

const root = process.cwd();
const errors = [];
const registry = loadAssuranceRegistry(root);
const inventory = loadAssuranceRecordInventory(root, registry);
const complianceEntries = inventory.entries.filter((entry) => entry.resource.kind === 'compliance');
const complianceById = new Map(
  complianceEntries
    .filter((entry) => entry.record && typeof entry.record.id === 'string')
    .map((entry) => [entry.record.id, entry]),
);

function trackedMarkdownFiles() {
  const result = spawnSync('git', ['ls-files', '--', '*.md'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`unable to list tracked Markdown: ${result.stderr.trim() || result.stdout.trim()}`);
  return result.stdout.split('\n').map((value) => value.trim()).filter(Boolean);
}

function plainHeadingText(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '')
    .trim();
}

function githubSlug(value) {
  return plainHeadingText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function headingAnchors(markdown) {
  const anchors = new Set();
  const counts = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = githubSlug(match[2]);
    if (!base) continue;
    const duplicate = counts.get(base) ?? 0;
    counts.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }
  return anchors;
}

function controlsInAlignment(markdown) {
  const references = new Set();
  const lines = markdown.split(/\r?\n/);
  let alignmentLevel = null;
  for (const line of lines) {
    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      if (alignmentLevel !== null && level <= alignmentLevel) alignmentLevel = null;
      const text = plainHeadingText(heading[2]).toLowerCase();
      if (text === 'alignment' || text.endsWith(' alignment')) alignmentLevel = level;
      continue;
    }
    if (alignmentLevel === null) continue;
    const controls = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?Controls:(?:\*\*)?\s*(.*)$/i);
    if (!controls) continue;
    const ids = controls[1].match(/(?:ISO27001|ISO42001)-[A0-9.]+|WCAG-[0-9]+\.[0-9]+\.[0-9]+/g) ?? [];
    for (const id of ids) references.add(id);
  }
  return references;
}

function isDatedRecord(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  return normalized.includes('/soa/')
    || normalized.includes('/assessments/')
    || /(?:^|\/)[^/]*(?:ASSESSMENT|EVALUATION|REPORT)[^/]*\.md$/i.test(normalized);
}

const markdownFiles = trackedMarkdownFiles();
const markdownSet = new Set(markdownFiles);
const markdownCache = new Map();
const anchorsCache = new Map();
const controlsCache = new Map();

function markdown(relativePath) {
  if (!markdownCache.has(relativePath)) markdownCache.set(relativePath, fs.readFileSync(path.join(root, relativePath), 'utf8'));
  return markdownCache.get(relativePath);
}

function anchors(relativePath) {
  if (!anchorsCache.has(relativePath)) anchorsCache.set(relativePath, headingAnchors(markdown(relativePath)));
  return anchorsCache.get(relativePath);
}

function controls(relativePath) {
  if (!controlsCache.has(relativePath)) controlsCache.set(relativePath, controlsInAlignment(markdown(relativePath)));
  return controlsCache.get(relativePath);
}

const documentedPathsByRecord = new Map();
const referencedGoverningPaths = new Set();
let documentationReferences = 0;
for (const entry of complianceEntries) {
  const record = entry.record;
  if (!record || typeof record.id !== 'string') continue;
  const edges = assuranceRelationshipsForRelation(record.relationships, 'documentation');
  for (const edge of edges) {
    documentationReferences += 1;
    if (edge?.to?.source !== ASSURANCE_DOCUMENTATION_SOURCE) {
      errors.push(`${record.id}: documentation source must be ${ASSURANCE_DOCUMENTATION_SOURCE}`);
      continue;
    }
    const parsed = parseAssuranceDocumentationReference(edge?.to?.native);
    if (!parsed) {
      errors.push(`${record.id}: invalid documentation reference ${String(edge?.to?.native)}`);
      continue;
    }
    if (!markdownSet.has(parsed.repositoryPath)) {
      errors.push(`${record.id}: documentation file is not a tracked Markdown file: ${parsed.repositoryPath}`);
      continue;
    }
    if (!anchors(parsed.repositoryPath).has(parsed.anchor)) {
      errors.push(`${record.id}: documentation anchor #${parsed.anchor} does not match a heading in ${parsed.repositoryPath}`);
    }
    const paths = documentedPathsByRecord.get(record.id) ?? new Set();
    paths.add(parsed.repositoryPath);
    documentedPathsByRecord.set(record.id, paths);
    if (!isDatedRecord(parsed.repositoryPath)) {
      referencedGoverningPaths.add(parsed.repositoryPath);
      const named = controls(parsed.repositoryPath);
      if (!named.has(record.id)) {
        errors.push(`${record.id}: ${parsed.repositoryPath} must name the record on a Controls: line in its Alignment section`);
      }
    }
  }
}

for (const relativePath of referencedGoverningPaths) {
  for (const recordId of controls(relativePath)) {
    if (!complianceById.has(recordId)) {
      errors.push(`${relativePath}: Alignment Controls: line names unknown compliance record ${recordId}`);
      continue;
    }
    if (!documentedPathsByRecord.get(recordId)?.has(relativePath)) {
      errors.push(`${relativePath}: Alignment Controls: line names ${recordId}, but that record has no documentation relationship back to this file`);
    }
  }
}

if (errors.length > 0) {
  console.error('Assurance documentation reference validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance documentation reference validation passed for ${complianceById.size} compliance records and ${documentationReferences} documentation references.`);
console.log('Validation reads Markdown headings and Alignment Controls: lines only; compliance status is never read from Markdown.');
