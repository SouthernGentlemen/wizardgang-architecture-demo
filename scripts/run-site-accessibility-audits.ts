import { spawn } from 'node:child_process';
import process from 'node:process';

const audits: Array<[string, string]> = [
  ['site-browser-audit', 'scripts/site-browser-audit.ts'],
];

function durationMs(started: bigint): number {
  return Math.round(Number(process.hrtime.bigint() - started) / 1e6);
}

type RunResult = { code: number; signal: NodeJS.Signals | null; error: Error | null };

async function run(name: string, script: string): Promise<number> {
  const started = process.hrtime.bigint();
  console.log(`${name} start`);
  const child = spawn(process.execPath, [script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  const result = await new Promise<RunResult>((resolve) => {
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
const durations: Record<string, number> = {};
for (const [name, script] of audits) durations[name] = await run(name, script);
console.log(`site accessibility audit suite complete: ${durationMs(overallStarted)}ms; ${JSON.stringify(durations)}`);
