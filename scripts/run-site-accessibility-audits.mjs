import { spawn } from 'node:child_process';
import process from 'node:process';

const audits = [
  ['site-browser-audit', 'scripts/site-browser-audit.mjs'],
  ['demo-268-rest-browser-audit', 'scripts/demo-268-rest-browser-audit.mjs'],
  ['demo-289-site-evaluation', 'scripts/demo-289-site-evaluation.mjs'],
];

function durationMs(started) {
  return Math.round(Number(process.hrtime.bigint() - started) / 1e6);
}

async function run(name, script) {
  const started = process.hrtime.bigint();
  console.log(`${name} start`);
  const child = spawn(process.execPath, [script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  const result = await new Promise((resolve) => {
    child.once('error', (error) => resolve({ code: 1, signal: null, error }));
    child.once('close', (code, signal) => resolve({ code: code ?? 1, signal, error: null }));
  });
  const elapsed = durationMs(started);
  if (result.error) throw new Error(`${name} failed to start after ${elapsed}ms: ${result.error.message}`);
  if (result.code !== 0) {
    throw new Error(`${name} failed after ${elapsed}ms with exit ${result.code}${result.signal ? ` (${result.signal})` : ''}`);
  }
  console.log(`${name} complete: ${elapsed}ms`);
  return elapsed;
}

const overallStarted = process.hrtime.bigint();
const durations = {};
for (const [name, script] of audits) durations[name] = await run(name, script);
console.log(`site accessibility audit suite complete: ${durationMs(overallStarted)}ms; ${JSON.stringify(durations)}`);
