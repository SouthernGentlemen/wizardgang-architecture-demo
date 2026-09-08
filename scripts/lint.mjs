import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const failures = [];
const maxReportedFailures = 100;
const extensions = new Set(['.ts', '.mjs', '.json', '.jsonc', '.md', '.yml', '.yaml', '.graphql', '.sql', '.xml']);
const urlLiteralExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const canonicalPageSegments = ['platform', 'interfaces', 'assurance', 'operations', 'security'];

function allowsCanonicalPageLiteral(file) {
  const normalized = file.replaceAll('\\', '/');
  return normalized.startsWith('src/routing/')
    || /^src\/[^/]+\/route-capabilities\//.test(normalized)
    || normalized.startsWith('tests/fixtures/');
}

function isCanonicalPageLiteral(value) {
  return canonicalPageSegments.some((segment) => {
    const root = `/${segment}`;
    return value === root || value.startsWith(`${root}/`) || value.startsWith(`${root}?`) || value.startsWith(`${root}#`);
  });
}

function scriptKind(file) {
  switch (path.extname(file)) {
    case '.ts': return ts.ScriptKind.TS;
    case '.tsx': return ts.ScriptKind.TSX;
    case '.jsx': return ts.ScriptKind.JSX;
    default: return ts.ScriptKind.JS;
  }
}

function findCanonicalPageLiteral(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind(file));
  let failure;
  function visit(node) {
    if (failure) return;
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && isCanonicalPageLiteral(node.text)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      failure = `${file}:${line + 1} canonical pathname literal outside a route declaration; use routeUrl(routeId) or move deliberate dead-route data under tests/fixtures/; rerun: npm run lint`;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return failure;
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
