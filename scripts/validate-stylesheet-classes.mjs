import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');
const WRITE = process.argv.includes('--write');
const MAX_REPORTED = 20;

// These classes are emitted from the bounded HTTP action method vocabulary through
// `class="http-method http-${action.method.toLowerCase()}"` and therefore do not
// appear as complete literals in src/.
const GENERATED_CLASS_ALLOWLIST = new Set([
  'http-put',
  'http-patch',
  'http-delete',
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function isStylesheetModule(file) {
  return path.dirname(file).startsWith(path.join(SRC_DIR, 'styles'))
    && file.endsWith('.css');
}

function stripComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function classNamesFromSelector(selector) {
  const names = new Set();
  const cleaned = stripComments(selector);
  for (const match of cleaned.matchAll(/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g)) {
    names.add(match[1]);
  }
  return [...names];
}

function boundaryPattern(className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^_a-zA-Z0-9-])${escaped}($|[^_a-zA-Z0-9-])`);
}

function findOpenBrace(css, from) {
  let quote = null;
  for (let index = from; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (!quote && char === '/' && next === '*') {
      const close = css.indexOf('*/', index + 2);
      return close === -1 ? -1 : findOpenBrace(css, close + 2);
    }
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') return index;
  }
  return -1;
}

function findMatchingBrace(css, open) {
  let depth = 1;
  let quote = null;
  for (let index = open + 1; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (!quote && char === '/' && next === '*') {
      const close = css.indexOf('*/', index + 2);
      if (close === -1) return -1;
      index = close + 1;
      continue;
    }
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function isGroupingAtRule(prelude) {
  return /^@(media|supports|container|layer|document)\b/i.test(prelude);
}

function isOpaqueAtRule(prelude) {
  return /^@(keyframes|-webkit-keyframes|font-face|page|property|counter-style)\b/i.test(prelude);
}

function meaningfulCss(css) {
  return stripComments(css).trim().length > 0;
}

function transformCss(css, classIsLive, findings) {
  let cursor = 0;
  let output = '';

  while (cursor < css.length) {
    const open = findOpenBrace(css, cursor);
    if (open === -1) {
      output += css.slice(cursor);
      break;
    }
    const close = findMatchingBrace(css, open);
    if (close === -1) throw new Error('Unbalanced stylesheet block');

    const rawPrelude = css.slice(cursor, open);
    const prelude = stripComments(rawPrelude).trim();
    const body = css.slice(open + 1, close);

    if (isGroupingAtRule(prelude)) {
      const transformedBody = transformCss(body, classIsLive, findings);
      if (meaningfulCss(transformedBody)) {
        output += `${rawPrelude}{${transformedBody}}`;
      }
    } else if (isOpaqueAtRule(prelude) || prelude.startsWith('@')) {
      output += `${rawPrelude}{${body}}`;
    } else {
      const classes = classNamesFromSelector(prelude);
      const dead = classes.length > 0 && classes.every((name) => !classIsLive(name));
      if (dead) {
        findings.push({ selector: prelude.replace(/\s+/g, ' ').trim(), classes });
      } else {
        output += `${rawPrelude}{${body}}`;
      }
    }

    cursor = close + 1;
  }

  return output;
}

const allSourceFiles = await walk(SRC_DIR);
const stylesheetFiles = allSourceFiles.filter(isStylesheetModule);
const stylesheetSet = new Set(stylesheetFiles);
const sourceCorpus = (await Promise.all(
  allSourceFiles
    .filter((file) => !stylesheetSet.has(file))
    .map((file) => readFile(file, 'utf8').catch(() => '')),
)).join('\n');

const liveCache = new Map();
function classIsLive(name) {
  if (GENERATED_CLASS_ALLOWLIST.has(name)) return true;
  if (!liveCache.has(name)) liveCache.set(name, boundaryPattern(name).test(sourceCorpus));
  return liveCache.get(name);
}

const allFindings = [];
let changedFiles = 0;

for (const file of stylesheetFiles) {
  const source = await readFile(file, 'utf8');
  const findings = [];
  const transformed = transformCss(source, classIsLive, findings);
  if (findings.length === 0) continue;

  const relative = path.relative(ROOT, file);
  allFindings.push(...findings.map((finding) => ({ ...finding, file: relative })));

  if (WRITE) {
    await writeFile(file, transformed, 'utf8');
    changedFiles += 1;
  }
}

if (WRITE) {
  console.log(`Removed ${allFindings.length} stylesheet rules from ${changedFiles} file(s).`);
  process.exitCode = 0;
} else if (allFindings.length > 0) {
  console.error(`Found ${allFindings.length} stylesheet rules whose class selectors are absent from src/.`);
  for (const finding of allFindings.slice(0, MAX_REPORTED)) {
    console.error(`- ${finding.file}: ${finding.selector}`);
  }
  if (allFindings.length > MAX_REPORTED) {
    console.error(`- ... ${allFindings.length - MAX_REPORTED} additional rule(s) omitted`);
  }
  console.error('Remove the retired rules or, for a bounded generated class, document it in GENERATED_CLASS_ALLOWLIST.');
  process.exitCode = 1;
} else {
  console.log(`Stylesheet class reachability OK (${stylesheetFiles.length} stylesheet module(s)).`);
}
