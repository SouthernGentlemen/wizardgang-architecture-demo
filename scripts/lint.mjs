import fs from 'node:fs';
import path from 'node:path';
import { findCanonicalPageLiteral } from './lint-rules.mjs';

const failures = [];
const maxReportedFailures = 100;
const extensions = new Set(['.ts', '.mjs', '.json', '.jsonc', '.md', '.yml', '.yaml', '.graphql', '.sql', '.xml']);
const urlLiteralExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function allowsCanonicalPageLiteral(file) {
  const normalized = file.replaceAll('\\', '/');
  return normalized.startsWith('src/routing/')
    || /^src\/[^/]+\/route-capabilities\//.test(normalized)
    || normalized.startsWith('tests/fixtures/');
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.wrangler', 'dist', 'coverage'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name)) || urlLiteralExtensions.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, 'utf8');
      text.split(/\r?\n/).forEach((line, index) => {
        if (path.extname(entry.name) !== '.md' && /[ \t]+$/.test(line)) failures.push(`${full}:${index + 1} trailing whitespace`);
        if (line.includes('\t')) failures.push(`${full}:${index + 1} tab character`);
      });
      if (urlLiteralExtensions.has(path.extname(entry.name)) && !allowsCanonicalPageLiteral(full)) {
        const failure = findCanonicalPageLiteral(full, text);
        if (failure) failures.push(failure);
      }
    }
  }
}
walk('.');
if (failures.length) {
  console.error('Lint failed:');
  failures.slice(0, maxReportedFailures).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > maxReportedFailures) {
    console.error(`- ${failures.length - maxReportedFailures} additional failure(s) omitted`);
  }
  process.exit(1);
}
console.log('Lightweight repository lint passed.');
