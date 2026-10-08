import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';

// A command-scoped context; never reuse reads across fixture roots, heads or runs.
const execution = new AsyncLocalStorage();

export function createAssuranceValidationContext({
  root = process.cwd(),
  now = process.env.ASSURANCE_VALIDATION_NOW ?? new Date().toISOString(),
  readBytes,
} = {}) {
  const absoluteRoot = path.resolve(root);
  const files = new Map();
  const json = new Map();
  const values = new Map();
  const bytes = (relative) => {
    if (!files.has(relative)) files.set(relative, readBytes
      ? readBytes(relative) : fs.readFileSync(path.join(absoluteRoot, relative)));
    return files.get(relative);
  };
  const readText = (relative) => bytes(relative).toString('utf8');
  const readJson = (relative) => {
    if (!json.has(relative)) json.set(relative, JSON.parse(readText(relative)));
    return json.get(relative);
  };
  const memo = (key, factory) => {
    if (!values.has(key)) values.set(key, factory());
    return values.get(key);
  };
  return { root: absoluteRoot, now, readBytes: bytes, readText, readJson, memo,
    registry: () => readJson('assurance/registry.json') };
}

export function currentAssuranceValidationContext(root = process.cwd()) {
  const context = execution.getStore();
  return context && context.root === path.resolve(root) ? context : null;
}

export function withAssuranceValidationContext(context, operation) {
  return execution.run(context, operation);
}
