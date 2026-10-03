import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'config', 'worker-secrets.json'), 'utf8'));
const name = process.argv[2];
const generatedNames = new Set([
  'DEMO_ADMIN_PASSWORD',
  'WEBHOOK_DEMO_SECRET',
  'GITHUB_WEBHOOK_SECRET',
  'DEMO_SESSION_SECRET',
  'IDENTITY_SESSION_SECRET',
  'IDENTITY_AUDIT_HMAC_SECRET',
]);

if (!name || process.argv.length !== 3) {
  throw new Error('Usage: npm run provision:worker-secret -- <NAME>');
}
const entry = inventory.secrets.find((candidate) => candidate.name === name);
if (!entry) throw new Error(`${name} is not declared in config/worker-secrets.json.`);
if (!generatedNames.has(name)) {
  throw new Error(`${name} is provider-issued or operator-selected; use its owning provider's non-echo provisioning path instead.`);
}

const raw = randomBytes(Math.max(48, entry.minimumLength));
const value = raw.toString('base64url');
raw.fill(0);

const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(executable, ['wrangler', 'secret', 'put', name], {
  cwd: root,
  stdio: ['pipe', 'inherit', 'inherit'],
});
child.stdin.end(value + '\n');

child.on('error', (error) => {
  throw error;
});
child.on('exit', (code, signal) => {
  if (signal) {
    process.stderr.write(`wrangler secret put terminated by ${signal}.\n`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
