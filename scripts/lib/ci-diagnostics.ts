import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SECRET_KEY = /(authorization|cookie|credential|password|private.?key|secret|token)/i;

function sha256File(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function commandText(command) {
  const quote = (value) => /^[A-Za-z0-9_./:@=-]+$/.test(value) ? value : JSON.stringify(value);
  return [command.file, ...(command.args ?? [])].map(quote).join(' ');
}

function sensitiveValues(environment) {
  const values = Object.entries(environment)
    .filter(([key, value]) => SECRET_KEY.test(key) && typeof value === 'string' && value.length >= 4)
    .flatMap(([, value]) => [value, ...value.split(/\r?\n/).filter((line) => line.length >= 4)]);
  return [...new Set(values)]
    .sort((left, right) => right.length - left.length);
}

export function redactDiagnosticText(value, environment = process.env) {
  let safe = String(value);
  for (const secret of sensitiveValues(environment)) safe = safe.split(secret).join('***');
  return safe
    .replace(/\b(?:gh[opusr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, '***')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi, 'Bearer ***');
}

export function boundedDiagnosticText(value, { maxChars = 32_768, maxLines = 200 } = {}) {
  const text = String(value);
  const lines = text.split('\n');
  const selected = lines.slice(0, maxLines).join('\n');
  const bounded = selected.slice(0, maxChars);
  if (bounded.length === text.length) return bounded;
  return `${bounded}\n... diagnostic output truncated at ${maxLines} lines / ${maxChars} characters ...\n`;
}

function gitOutput(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trimEnd() : '';
}

export function repositoryState(cwd) {
  const status = gitOutput(cwd, ['status', '--porcelain=v1', '--untracked-files=all']);
  const changedFiles = status ? status.split('\n') : [];
  return {
    sha: gitOutput(cwd, ['rev-parse', 'HEAD']) || null,
    clean: changedFiles.length === 0,
    changedFiles,
    diffStat: gitOutput(cwd, ['diff', '--stat', '--no-ext-diff']),
  };
}

function runtimeManifest(cwd, environment) {
  const npm = spawnSync('npm', ['--version'], { cwd, encoding: 'utf8', env: environment });
  return {
    platform: process.platform,
    architecture: process.arch,
    osRelease: os.release(),
    node: process.version,
    npm: npm.status === 0 ? npm.stdout.trim() : 'unavailable',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unavailable',
    locale: Intl.DateTimeFormat().resolvedOptions().locale || 'unavailable',
    ci: environment.CI === 'true' || environment.GITHUB_ACTIONS === 'true',
    runnerOs: environment.RUNNER_OS || null,
    runnerArchitecture: environment.RUNNER_ARCH || null,
    gitSha: gitOutput(cwd, ['rev-parse', 'HEAD']) || null,
    lockfileSha256: sha256File(path.join(cwd, 'package-lock.json')),
  };
}

async function captureCommand(command, options) {
  const startedAt = new Date();
  const streams = { stdout: '', stderr: '' };
  const commandEnvironment = { ...options.environment, ...(command.env ?? {}) };
  const child = spawn(command.file, command.args ?? [], {
    cwd: options.cwd,
    env: commandEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const emit = (text) => {
    if (!text) return;
    const safe = redactDiagnosticText(text, commandEnvironment);
    options.onOutput?.(safe);
  };
  const consume = (stream, chunk) => {
    streams[stream] += String(chunk);
    const boundary = streams[stream].lastIndexOf('\n');
    if (boundary < 0) return;
    const complete = streams[stream].slice(0, boundary + 1);
    for (const line of complete.match(/[^\n]*\n/g) ?? []) emit(line);
    streams[stream] = streams[stream].slice(boundary + 1);
  };
  child.stdout.on('data', (chunk) => consume('stdout', chunk));
  child.stderr.on('data', (chunk) => consume('stderr', chunk));
  const result = await new Promise((resolve) => {
    child.on('error', (error) => resolve({ code: 1, signal: null, spawnError: error.message }));
    child.on('close', (code, signal) => resolve({ code: code ?? 1, signal, spawnError: null }));
  });
  emit(streams.stdout);
  emit(streams.stderr);
  if (result.spawnError) emit(`${result.spawnError}\n`);
  return {
    ...result,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
  };
}

export function renderDiagnosticSummary(report) {
  const lines = [
    '## CI validation diagnostics',
    '',
    `- Status: **${report.status.toUpperCase()}**`,
    `- Git SHA: \`${report.environment.gitSha ?? 'unavailable'}\``,
    `- Node / npm: \`${report.environment.node}\` / \`${report.environment.npm}\``,
    `- Lockfile SHA-256: \`${report.environment.lockfileSha256 ?? 'unavailable'}\``,
    `- Pre-check tree: ${report.preCheck.clean ? 'clean' : `dirty (${report.preCheck.changedFiles.length} path(s))`}`,
    `- Post-check tree: ${report.postCheck.clean ? 'clean' : `dirty (${report.postCheck.changedFiles.length} path(s))`}`,
    `- Full captured output: \`${report.fullLog}\``,
    `- Structured report: \`${report.reportFile}\``,
  ];
  if (report.failure) {
    lines.push(
      `- Failing command: \`${report.failure.command}\``,
      `- Exit code: \`${report.failure.exitCode}\`${report.failure.signal ? ` (signal \`${report.failure.signal}\`)` : ''}`,
      '- The ordinary Actions log is primary. Download the failure diagnostic artifact if the client cannot expose the complete log body.',
    );
  } else {
    lines.push(`- Commands completed: ${report.commands.length}`);
  }
  return `${lines.join('\n')}\n`;
}

export async function runDiagnosticCommands({ commands, cwd = process.cwd(), diagnosticsDir = '.ci-diagnostics', environment = process.env, emitAnnotations = true } = {}) {
  const absoluteDiagnostics = path.resolve(cwd, diagnosticsDir);
  fs.mkdirSync(absoluteDiagnostics, { recursive: true });
  const fullLogPath = path.join(absoluteDiagnostics, 'validation.log');
  fs.writeFileSync(fullLogPath, '');
  const preCheck = repositoryState(cwd);
  const manifest = runtimeManifest(cwd, environment);
  const commandResults = [];
  let failure = null;

  for (const command of commands ?? []) {
    const rendered = commandText(command);
    const heading = `\n===== ${command.label} =====\n$ ${rendered}\n`;
    process.stdout.write(heading);
    fs.appendFileSync(fullLogPath, heading);
    const result = await captureCommand(command, {
      cwd,
      environment,
      onOutput: (output) => {
        fs.appendFileSync(fullLogPath, output);
        process.stdout.write(boundedDiagnosticText(output, { maxChars: 8_192, maxLines: 2 }));
      },
    });
    const record = {
      label: command.label,
      command: rendered,
      exitCode: result.code,
      signal: result.signal,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      durationMs: result.durationMs,
    };
    commandResults.push(record);
    const completion = `\n===== exit ${result.code}${result.signal ? ` (${result.signal})` : ''}: ${rendered} =====\n`;
    process.stdout.write(completion);
    fs.appendFileSync(fullLogPath, completion);
    if (result.code !== 0) {
      failure = record;
      break;
    }
  }

  const postCheck = repositoryState(cwd);
  const reportFile = path.join(diagnosticsDir, 'report.json');
  const report = {
    schemaVersion: 1,
    status: failure ? 'failure' : 'success',
    environment: manifest,
    preCheck,
    postCheck,
    commands: commandResults,
    failure,
    fullLog: path.join(diagnosticsDir, 'validation.log'),
    reportFile,
  };
  fs.writeFileSync(path.join(absoluteDiagnostics, 'environment.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(absoluteDiagnostics, 'changed-files.txt'), `${postCheck.changedFiles.join('\n')}${postCheck.changedFiles.length ? '\n' : ''}`);
  fs.writeFileSync(path.join(absoluteDiagnostics, 'diff-stat.txt'), `${postCheck.diffStat}${postCheck.diffStat ? '\n' : ''}`);
  fs.writeFileSync(path.join(absoluteDiagnostics, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  const summary = renderDiagnosticSummary(report);
  fs.writeFileSync(path.join(absoluteDiagnostics, 'summary.md'), summary);
  if (environment.GITHUB_STEP_SUMMARY) fs.appendFileSync(environment.GITHUB_STEP_SUMMARY, summary);
  if (failure && emitAnnotations) process.stderr.write(`::error title=CI validation failed::${failure.command} exited ${failure.exitCode}; see ${report.fullLog}\n`);
  return report;
}
