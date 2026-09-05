import fs from 'node:fs';
import path from 'node:path';
import {
  loadAssuranceRegistry,
  readJsonFile,
  registryResourcesByKind,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const registry = loadAssuranceRegistry(root);
const resources = registryResourcesByKind(registry, 'governance-records')
  .filter((candidate) => candidate.capabilities?.includes('summary-source'));
if (resources.length === 0) throw new Error('assurance/registry.json: no governance register summary sources are registered');
const partitions = resources.map((resource) => ({ resource, data: readJsonFile(root, resource.path) }));

function marker(view, edge) {
  return `<!-- GENERATED:governance-records:${view.id}:${edge} -->`;
}

function renderTable(view, records) {
  const keys = view.columns.map((column) => column.key);
  if (new Set(keys).size !== keys.length) throw new Error(`${view.id}: generated column keys must be unique`);
  const rows = records
    .filter((record) => record.view === view.id)
    .sort((left, right) => left.order - right.order);
  const seenOrders = new Set();
  for (const record of rows) {
    if (seenOrders.has(record.order)) throw new Error(`${view.id}: duplicate order ${record.order}`);
    seenOrders.add(record.order);
    const expected = keys.filter((key) => key !== 'id').sort();
    const actual = Object.keys(record.fields).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${record.id}: fields do not match ${view.id} columns`);
    }
  }
  return [
    `| ${view.columns.map((column) => column.label).join(' | ')} |`,
    `|${view.columns.map(() => '---').join('|')}|`,
    ...rows.map((record) => `| ${keys.map((key) => key === 'id' ? record.id : record.fields[key]).join(' | ')} |`),
  ].join('\n');
}

function renderDocument(source, view, table) {
  const start = marker(view, 'start');
  const end = marker(view, 'end');
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error(`${view.document}: missing generated markers for ${view.id}`);
  }
  const before = source.slice(0, startIndex + start.length);
  const after = source.slice(endIndex);
  return `${before}\n${table}\n${after}`;
}

const viewIds = new Set();
const recordIds = new Set();
for (const { resource, data } of partitions) {
  if (data.source !== 'governance.records') throw new Error(`${resource.path}: source must be governance.records`);
  const partitionViews = new Set();
  for (const view of data.views ?? []) {
    if (viewIds.has(view.id)) throw new Error(`duplicate governance view ${view.id}`);
    viewIds.add(view.id);
    partitionViews.add(view.id);
  }
  for (const record of data.records ?? []) {
    if (recordIds.has(record.id)) throw new Error(`duplicate governance record ${record.id}`);
    recordIds.add(record.id);
    if (!partitionViews.has(record.view)) throw new Error(`${record.id}: unknown governance view ${record.view} in ${resource.path}`);
  }
}

const expectedByDocument = new Map();
for (const { data } of partitions) {
  for (const view of data.views ?? []) {
    const absolute = path.join(root, view.document);
    const current = expectedByDocument.get(view.document) ?? fs.readFileSync(absolute, 'utf8');
    const expected = renderDocument(current, view, renderTable(view, data.records ?? []));
    expectedByDocument.set(view.document, expected);
  }
}

const stale = [];
for (const [document, expected] of expectedByDocument) {
  const absolute = path.join(root, document);
  const current = fs.readFileSync(absolute, 'utf8');
  if (current === expected) continue;
  if (checkOnly) stale.push(document);
  else fs.writeFileSync(absolute, expected);
}

if (stale.length) {
  console.error('Generated governance register views are stale:');
  for (const document of stale) console.error(`- ${document}`);
  process.exit(1);
}

console.log(`${checkOnly ? 'Validated' : 'Generated'} ${viewIds.size} governance register views from ${resources.length} registry partitions (${recordIds.size} records).`);
