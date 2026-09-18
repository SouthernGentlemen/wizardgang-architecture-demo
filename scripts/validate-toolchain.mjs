import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const pinnedNodeVersion = fs.readFileSync(path.join(root, '.node-version'), 'utf8').trim();
const packageManager = packageJson.packageManager || '';

function major(version, label) {
  const match = /^(\d+)/.exec(version);
  if (!match) throw new Error(`Unable to read ${label} major version from "${version}".`);
  return Number(match[1]);
}

function engineMajor(spec, label) {
  const match = /^(\d+)\.x$/.exec(spec || '');
  if (!match) throw new Error(`${label} must use an explicit major.x engine range.`);
  return Number(match[1]);
}

const npmPackageManagerMatch = /^npm@(\d+\.\d+\.\d+)$/.exec(packageManager);
if (!npmPackageManagerMatch) throw new Error('packageManager must pin an exact npm version.');
const pinnedNpmVersion = npmPackageManagerMatch[1];

const expectedNodeMajor = major(pinnedNodeVersion, '.node-version');
const expectedNpmMajor = major(pinnedNpmVersion, 'packageManager');
const engineNodeMajor = engineMajor(packageJson.engines?.node, 'engines.node');
const engineNpmMajor = engineMajor(packageJson.engines?.npm, 'engines.npm');

if (engineNodeMajor !== expectedNodeMajor) {
  throw new Error(`engines.node (${packageJson.engines.node}) disagrees with .node-version (${pinnedNodeVersion}).`);
}
if (engineNpmMajor !== expectedNpmMajor) {
  throw new Error(`engines.npm (${packageJson.engines.npm}) disagrees with packageManager (${packageManager}).`);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const actualNodeVersion = process.versions.node;
const actualNpmVersion = execFileSync(npm, ['--version'], { encoding: 'utf8' }).trim();
const actualNodeMajor = major(actualNodeVersion, 'current Node');
const actualNpmMajor = major(actualNpmVersion, 'current npm');

console.log(`Pinned toolchain: Node ${pinnedNodeVersion} (supported major ${expectedNodeMajor}), npm ${pinnedNpmVersion} (supported major ${expectedNpmMajor}).`);
console.log(`Current toolchain: Node ${actualNodeVersion}, npm ${actualNpmVersion}.`);

const mismatches = [];
if (actualNodeMajor !== expectedNodeMajor) mismatches.push(`Node major ${actualNodeMajor}; expected ${expectedNodeMajor}`);
if (actualNpmMajor !== expectedNpmMajor) mismatches.push(`npm major ${actualNpmMajor}; expected ${expectedNpmMajor}`);

if (mismatches.length) {
  const message = `Toolchain mismatch: ${mismatches.join('; ')}. Use .node-version and ${packageManager}.`;
  if (process.env.CI) {
    console.error(message);
    process.exitCode = 1;
  } else {
    console.warn(message);
  }
} else {
  console.log('Toolchain major versions match the repository contract.');
}
