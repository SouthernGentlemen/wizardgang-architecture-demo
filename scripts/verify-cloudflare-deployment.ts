import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

function fail(message) {
  throw new Error(message);
}

export function parseWranglerDeployOutput(text, expectedWorkerName) {
  const records = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        fail('Wrangler structured deploy output line ' + (index + 1) + ' is not valid JSON.');
      }
    });

  const deployRecords = records.filter((record) => record?.type === 'deploy');
  if (deployRecords.length !== 1) {
    fail('Wrangler structured deploy output must identify exactly one deploy result; found ' + deployRecords.length + '.');
  }

  const deploy = deployRecords[0];
  if (deploy.worker_name !== expectedWorkerName) {
    fail('Wrangler deploy result identifies worker ' + JSON.stringify(deploy.worker_name) + ', expected ' + expectedWorkerName + '.');
  }
  if (typeof deploy.version_id !== 'string' || !deploy.version_id.trim()) {
    fail('Wrangler deploy result does not identify a Worker Version ID.');
  }

  return deploy;
}

export function verifyCloudflareDeployment({ deployOutputText, deploymentStatus, expectedWorkerName }) {
  const deploy = parseWranglerDeployOutput(deployOutputText, expectedWorkerName);
  if (!deploymentStatus || typeof deploymentStatus !== 'object' || Array.isArray(deploymentStatus)) {
    fail('Cloudflare deployment status must be one deployment object.');
  }

  const versions = deploymentStatus.versions;
  if (!Array.isArray(versions) || versions.length !== 1) {
    fail('Cloudflare deployment status must identify exactly one active production version; found ' + (Array.isArray(versions) ? versions.length : 0) + '.');
  }

  const active = versions[0];
  if (active?.version_id !== deploy.version_id) {
    fail('Cloudflare active Worker Version ID ' + JSON.stringify(active?.version_id) + ' does not match Wrangler deploy result ' + deploy.version_id + '.');
  }
  if (Number(active?.percentage) !== 100) {
    fail('Cloudflare deployment traffic for ' + deploy.version_id + ' is ' + JSON.stringify(active?.percentage) + '%, expected 100%.');
  }

  return { versionId: deploy.version_id, percentage: 100 };
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || !value) fail('Expected --deploy-output, --deployment-status, and --worker arguments.');
    values[key.slice(2)] = value;
  }
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args['deploy-output'] || !args['deployment-status'] || !args.worker) {
    fail('Expected --deploy-output, --deployment-status, and --worker arguments.');
  }

  const deployOutputText = fs.readFileSync(args['deploy-output'], 'utf8');
  const deploymentStatus = JSON.parse(fs.readFileSync(args['deployment-status'], 'utf8'));
  const verified = verifyCloudflareDeployment({
    deployOutputText,
    deploymentStatus,
    expectedWorkerName: args.worker,
  });
  process.stdout.write('Verified Cloudflare Worker Version ID ' + verified.versionId + ' at 100% production traffic.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
    process.exitCode = 1;
  });
}
