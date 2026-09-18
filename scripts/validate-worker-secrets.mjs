import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'config', 'worker-secrets.json'), 'utf8'));

function fail(message) {
  process.stderr.write(message + '\n');
  process.exitCode = 1;
}

function sorted(values) {
  return [...new Set(values)].sort();
}

function sameNames(label, actual, expected) {
  const a = sorted(actual);
  const e = sorted(expected);
  const missing = e.filter((name) => !a.includes(name));
  const extra = a.filter((name) => !e.includes(name));
  if (missing.length || extra.length) {
    fail(`${label} does not match config/worker-secrets.json.`);
    if (missing.length) fail(`${label} is missing: ${missing.join(', ')}`);
    if (extra.length) fail(`${label} has undeclared names: ${extra.join(', ')}`);
  }
}

if (!inventory || inventory.schemaVersion !== 1 || !Array.isArray(inventory.secrets)) {
  throw new Error('config/worker-secrets.json must contain schemaVersion 1 and a secrets array.');
}

const expectedKeys = ['capability', 'minimumLength', 'name', 'owner', 'required'];
const inventoryNames = [];
for (const entry of inventory.secrets) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Worker secret inventory entries must be objects.');
  const keys = Object.keys(entry).sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`Worker secret inventory entry ${String(entry.name || '<unnamed>')} must contain only: ${expectedKeys.join(', ')}.`);
  }
  if (!/^[A-Z][A-Z0-9_]+$/.test(entry.name)) throw new Error(`Invalid Worker secret name: ${String(entry.name)}`);
  if (typeof entry.required !== 'boolean') throw new Error(`${entry.name} required must be boolean.`);
  if (typeof entry.capability !== 'string' || !entry.capability.trim()) throw new Error(`${entry.name} capability is required.`);
  if (!Number.isInteger(entry.minimumLength) || entry.minimumLength < 1) throw new Error(`${entry.name} minimumLength must be a positive integer.`);
  if (typeof entry.owner !== 'string' || !entry.owner.trim()) throw new Error(`${entry.name} owner is required.`);
  inventoryNames.push(entry.name);
}
if (new Set(inventoryNames).size !== inventoryNames.length) throw new Error('Worker secret inventory contains duplicate names.');

function markedNames(file, start, end, pattern) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  if (startIndex < 0 || endIndex <= startIndex) throw new Error(`${file} is missing Worker secret inventory markers.`);
  const block = content.slice(startIndex + start.length, endIndex);
  return [...block.matchAll(pattern)].map((match) => match[1]);
}

sameNames(
  'src/types.ts Worker secret fields',
  markedNames('src/types.ts', '// WORKER_SECRETS_START', '// WORKER_SECRETS_END', /^\s*([A-Z][A-Z0-9_]+)\??:\s*string;/gm),
  inventoryNames,
);
sameNames(
  '.dev.vars.example Worker secret names',
  markedNames('.dev.vars.example', '# WORKER_SECRETS_START', '# WORKER_SECRETS_END', /^\s*#?\s*([A-Z][A-Z0-9_]+)=/gm),
  inventoryNames,
);
sameNames(
  'SECURITY.md Worker secret names',
  markedNames('SECURITY.md', '<!-- WORKER_SECRETS_START -->', '<!-- WORKER_SECRETS_END -->', /`([A-Z][A-Z0-9_]+)`/g),
  inventoryNames,
);

const args = process.argv.slice(2);
if (!args.length) {
  if (!process.exitCode) process.stdout.write(`Validated ${inventoryNames.length} Worker secret names across inventory, Env, .dev.vars.example, and SECURITY.md.\n`);
} else if (args[0] === '--provisioned' && args[1] && args.length === 2) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(args[1]), 'utf8'));
  if (!Array.isArray(raw)) throw new Error('wrangler secret list --json output must be an array.');
  const provisioned = sorted(raw.map((entry) => typeof entry === 'string' ? entry : entry?.name).filter((name) => typeof name === 'string'));
  const required = inventory.secrets.filter((entry) => entry.required).map((entry) => entry.name);
  const missingRequired = required.filter((name) => !provisioned.includes(name));
  const undeclared = provisioned.filter((name) => !inventoryNames.includes(name));

  if (undeclared.length) {
    process.stdout.write(`Undeclared provisioned Worker secret names: ${undeclared.join(', ')}\n`);
  }
  if (missingRequired.length) {
    fail(`Missing required production Worker secret names: ${missingRequired.join(', ')}`);
  } else if (!process.exitCode) {
    process.stdout.write(`Worker secret preflight passed: ${required.length} required names are provisioned.\n`);
  }
} else {
  throw new Error('Usage: node scripts/validate-worker-secrets.mjs [--provisioned <wrangler-secret-list.json>]');
}
