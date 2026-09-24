import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const pinnedNodeVersion = fs.readFileSync(path.join(root, '.node-version'), 'utf8').trim();
const packageManager = packageJson.packageManager || '';

function exactVersion(version, label) {
  if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
    throw new Error(`${label} must pin an exact semantic version; got "${version}".`);
  }
  return version;
}

function major(version) {
  return Number(version.split('.')[0]);
}

function engineMajor(spec, label) {
  const match = /^(\d+)\.x$/.exec(spec || '');
  if (!match) throw new Error(`${label} must use an explicit major.x engine range.`);
  return Number(match[1]);
}

export function validateToolchainContract({
  packageJson: manifest,
  pinnedNodeVersion: nodePin,
  actualNodeVersion,
  actualNpmVersion,
}) {
  const failures = [];
  const exactNode = exactVersion(nodePin, '.node-version');
  const npmPackageManagerMatch = /^npm@(\d+\.\d+\.\d+)$/.exec(manifest.packageManager || '');
  if (!npmPackageManagerMatch) throw new Error('packageManager must pin an exact npm version.');
  const exactNpm = npmPackageManagerMatch[1];

  const expectedNodeMajor = major(exactNode);
  const expectedNpmMajor = major(exactNpm);
  const engineNodeMajor = engineMajor(manifest.engines?.node, 'engines.node');
  const engineNpmMajor = engineMajor(manifest.engines?.npm, 'engines.npm');

  if (engineNodeMajor !== expectedNodeMajor) {
    failures.push(`engines.node (${manifest.engines?.node}) disagrees with .node-version (${exactNode})`);
  }
  if (engineNpmMajor !== expectedNpmMajor) {
    failures.push(`engines.npm (${manifest.engines?.npm}) disagrees with packageManager (npm@${exactNpm})`);
  }
  if (actualNodeVersion !== exactNode) {
    failures.push(`Node ${actualNodeVersion}; expected ${exactNode}`);
  }
  if (actualNpmVersion !== exactNpm) {
    failures.push(`npm ${actualNpmVersion}; expected ${exactNpm}`);
  }

  return { failures, pinnedNodeVersion: exactNode, pinnedNpmVersion: exactNpm };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const actualNodeVersion = process.versions.node;
  const actualNpmVersion = execFileSync(npm, ['--version'], { encoding: 'utf8' }).trim();
  const result = validateToolchainContract({
    packageJson,
    pinnedNodeVersion,
    actualNodeVersion,
    actualNpmVersion,
  });

  console.log(`Pinned toolchain: Node ${result.pinnedNodeVersion}, npm ${result.pinnedNpmVersion}.`);
  console.log(`Current toolchain: Node ${actualNodeVersion}, npm ${actualNpmVersion}.`);

  if (result.failures.length) {
    for (const failure of result.failures) console.error(`Toolchain mismatch: ${failure}.`);
    console.error(`Use .node-version and ${packageManager} before running repository acceptance.`);
    process.exitCode = 1;
  } else {
    console.log('Exact Node/npm versions match the repository contract.');
  }
}
