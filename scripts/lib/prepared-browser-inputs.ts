import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { acceptedBuildOutputPaths } from './acceptance-plan.ts';

const MAX_BYTES = 32 * 1024 * 1024;
export const browserManifestPath = 'dist/browser-inputs.json';
function inventory(root) {
  const files = {};
  let bytes = 0;
  function visit(relative) {
    const absolute = path.join(root, relative);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Prepared browser input cannot be a symlink: ${relative}`);
    if (stat.isDirectory()) {
      const children = fs.readdirSync(absolute).sort();
      if (!children.length) throw new Error(`Empty prepared browser input directory: ${relative}`);
      for (const child of children) visit(`${relative}/${child}`);
    } else {
      if (!stat.isFile() || !stat.size || (bytes += stat.size) > MAX_BYTES) throw new Error(`Invalid or oversized prepared browser input: ${relative}`);
      files[relative] = createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    }
  }
  for (const relative of Object.values(acceptedBuildOutputPaths)) visit(relative);
  return files;
}
function identity({ sha, runId }) {
  if (!/^[a-f0-9]{40}$/.test(sha || '') || !/^\d+$/.test(runId || '')) throw new Error('Prepared browser inputs require exact head and producing run identity.');
  return { sha, runId };
}
export function prepareBrowserInputs(root, context) {
  const manifest = { schemaVersion: 1, ...identity(context), files: inventory(root) };
  fs.writeFileSync(path.join(root, browserManifestPath), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
export function verifyBrowserInputs(root, context) {
  const expected = identity(context);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, browserManifestPath), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.sha !== expected.sha || manifest.runId !== expected.runId) throw new Error('Prepared browser inputs belong to another run/head.');
  if (JSON.stringify(manifest.files) !== JSON.stringify(inventory(root))) throw new Error('Prepared browser inputs are missing, changed or unexpected.');
  return manifest;
}
