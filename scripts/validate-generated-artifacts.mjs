import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { boundedDiagnosticText } from './lib/ci-diagnostics.mjs';

const root = process.cwd();
const diagnosticsDir = process.env.CI_DIAGNOSTICS_DIR || '.ci-diagnostics';

function listFiles(relativeDirectory) {
  const absolute = path.join(root, relativeDirectory);
  if (!fs.existsSync(absolute)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absoluteEntry = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absoluteEntry);
      else files.push(path.relative(root, absoluteEntry).split(path.sep).join('/'));
    }
  };
  visit(absolute);
  return files;
}

const definitions = [
  {
    id: 'routes',
    command: ['npm', ['run', 'generate:routes']],
    inputs: listFiles('src/routing'),
    outputs: ['docs/ROUTES.md', 'docs/route-manifest.json'],
  },
  {
    id: 'openapi',
    command: ['npm', ['run', 'generate:openapi']],
    inputs: ['contracts/assurance/reporting.schema.json', 'docs/route-manifest.json', 'contracts/openapi/openapi.json'],
    outputs: ['contracts/openapi/openapi.json'],
  },
  {
    id: 'assurance-runtime-binding',
    command: ['npm', ['run', 'generate:assurance-runtime-binding']],
    inputs: listFiles('assurance'),
    outputs: ['src/assurance/generated/registry-bindings.ts', 'src/assurance/generated/lifecycle-baseline-membership.json'],
  },
];

function sha256(file, cwd = root) {
  const absolute = path.join(cwd, file);
  return fs.existsSync(absolute) ? createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') : null;
}

function snapshot(files, cwd = root) {
  return Object.fromEntries([...new Set(files)].sort().map((file) => [file, sha256(file, cwd)]));
}

function statusPaths(cwd = root) {
  const result = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd, encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout.trim().split('\n').filter(Boolean).map((line) => line.slice(3).replace(/ -> .+$/, ''));
}

function runGenerator(definition, cwd = root) {
  const [file, args] = definition.command;
  const started = Date.now();
  const result = spawnSync(file, args, { cwd, encoding: 'utf8', env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  return {
    command: [file, ...args].join(' '),
    exitCode: result.status ?? 1,
    signal: result.signal,
    durationMs: Date.now() - started,
    output: boundedDiagnosticText(output),
  };
}

function diffFor(outputs, cwd = root) {
  const result = spawnSync('git', ['diff', '--no-ext-diff', '--unified=3', '--', ...outputs], { cwd, encoding: 'utf8' });
  return boundedDiagnosticText(result.status === 0 ? result.stdout : `${result.stdout || ''}\n${result.stderr || ''}`);
}

export function runGeneratedArtifactParity({ definitions: selected = definitions, diagnosticsDirectory = diagnosticsDir, cwd = root } = {}) {
  const absoluteDiagnostics = path.resolve(cwd, diagnosticsDirectory);
  fs.mkdirSync(absoluteDiagnostics, { recursive: true });
  const baselineStatus = new Set(statusPaths(cwd));
  const records = [];
  const failures = [];
  let aggregateDiff = '';

  for (const definition of selected) {
    const allFiles = [...definition.inputs, ...definition.outputs];
    const before = snapshot(allFiles, cwd);
    const first = runGenerator(definition, cwd);
    const afterFirst = snapshot(allFiles, cwd);
    const firstChanged = definition.outputs.filter((file) => before[file] !== afterFirst[file]);
    const firstStatus = statusPaths(cwd);
    const second = runGenerator(definition, cwd);
    const afterSecond = snapshot(allFiles, cwd);
    const secondChanged = definition.outputs.filter((file) => afterFirst[file] !== afterSecond[file]);
    const secondStatus = statusPaths(cwd);
    const introducedStatus = [...firstStatus, ...secondStatus].filter((file) => !baselineStatus.has(file) && !definition.outputs.includes(file));
    const record = {
      id: definition.id,
      command: first.command,
      inputs: [...definition.inputs].sort(),
      outputs: [...definition.outputs].sort(),
      firstPass: { ...first, changedOutputs: firstChanged },
      secondPass: { ...second, changedOutputs: secondChanged },
      idempotent: secondChanged.length === 0,
      unexpectedChangedFiles: [...new Set(introducedStatus)].sort(),
      outputHashes: Object.fromEntries(definition.outputs.map((file) => [file, afterSecond[file]])),
    };
    records.push(record);
    if (firstChanged.length || secondChanged.length || first.exitCode !== 0 || second.exitCode !== 0 || record.unexpectedChangedFiles.length) {
      failures.push({
        id: definition.id,
        firstChanged,
        secondChanged,
        unexpectedChangedFiles: record.unexpectedChangedFiles,
        firstExitCode: first.exitCode,
        secondExitCode: second.exitCode,
      });
      aggregateDiff += `\n===== ${definition.id} =====\n${diffFor(definition.outputs, cwd)}\n`;
    }
  }

  const report = {
    schemaVersion: 1,
    status: failures.length ? 'failure' : 'success',
    generatedAt: new Date().toISOString(),
    definitions: records,
    failures,
  };
  fs.writeFileSync(path.join(absoluteDiagnostics, 'generated-artifacts.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(absoluteDiagnostics, 'generated-artifact.diff'), boundedDiagnosticText(aggregateDiff));
  if (failures.length) {
    console.error('Generated-artifact parity failed; inspect .ci-diagnostics/generated-artifacts.json and generated-artifact.diff.');
    for (const failure of failures) console.error(`- ${failure.id}: first-pass drift=${failure.firstChanged.length}, second-pass drift=${failure.secondChanged.length}, exit=${failure.firstExitCode}/${failure.secondExitCode}`);
    return report;
  }
  console.log(`Generated-artifact parity passed for ${records.length} generator definitions; all second passes were idempotent.`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runGeneratedArtifactParity();
  process.exitCode = report.status === 'failure' ? 1 : 0;
}

export { definitions as generatedArtifactDefinitions };
