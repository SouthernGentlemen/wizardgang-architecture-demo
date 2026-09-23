import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import {
  observeDevelopmentProcesses,
  stopCheckoutOwnedDevelopmentProcesses,
} from './lib/dev-process-cleanup.mjs';
import {
  DEVELOPMENT_HOST,
  DEVELOPMENT_PORT,
  openDevelopmentBrowser,
  resolveDevelopmentOptions,
  waitForDevelopmentReady,
} from './lib/dev-readiness.mjs';

const checkoutRoot = realpathSync(process.cwd());
const ownerIdentity = observeDevelopmentProcesses().find(({ pid }) => pid === process.pid);
if (!ownerIdentity?.startToken) throw new Error('Cannot establish development coordinator process identity.');
const owner = { ...ownerIdentity, cwd: checkoutRoot };
const development = resolveDevelopmentOptions();
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['exec', '--', 'vite', 'build', '--watch'], {
    env: { ...process.env, ASSET_MANIFEST_WRITE: '1' },
    stdio: 'inherit',
  }),
  spawn(npm, [
    'exec',
    '--',
    'wrangler',
    'dev',
    '--ip',
    DEVELOPMENT_HOST,
    '--port',
    String(DEVELOPMENT_PORT),
  ], { stdio: 'inherit' }),
];

async function registerRoot(child) {
  if (!Number.isSafeInteger(child.pid)) return null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const root = observeDevelopmentProcesses().find(({ pid }) => pid === child.pid);
      if (root?.parentPid === owner.pid && root.startToken) return root;
    } catch (error) {
      console.error('Unable to inspect development process identity:', error);
      process.exitCode = 1;
      return null;
    }
    if (child.exitCode !== null || child.signalCode !== null) return null;
    await delay(25);
  }
  console.error(`Unable to establish start identity for development child PID ${child.pid}.`);
  process.exitCode = 1;
  return null;
}

const rootsPromise = Promise.all(children.map(registerRoot));
let stopping = false;

async function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  const roots = (await rootsPromise).filter(Boolean);
  if (roots.length !== children.filter(({ pid }) => Number.isSafeInteger(pid)).length) {
    console.error('Development cleanup is missing a direct child identity; refusing unproven PID signals.');
    process.exitCode = 1;
  }
  try {
    stopCheckoutOwnedDevelopmentProcesses({
      checkoutRoot,
      owner,
      roots,
      readCheckoutRoot: () => realpathSync(process.cwd()),
      signalProcess: (pid, requestedSignal) => process.kill(pid, requestedSignal),
      signal,
    });
  } catch (error) {
    console.error('Development process-tree cleanup failed:', error);
    process.exitCode = 1;
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { void stop(signal); });
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(error);
    process.exitCode = 1;
    void stop();
  });
  child.on('exit', (code, signal) => {
    if (!stopping && code !== 0) {
      console.error(`${child.spawnargs.join(' ')} exited with ${signal ?? code}.`);
      process.exitCode = code ?? 1;
    }
    void stop();
  });
}

async function reportReadiness() {
  try {
    const readyUrl = await waitForDevelopmentReady({
      url: development.url,
      isCancelled: () => stopping,
    });
    if (!readyUrl) return;
    console.log(`Development ready: ${readyUrl}`);
    if (development.openBrowser && !(await openDevelopmentBrowser(readyUrl))) {
      console.warn(`Browser opening unavailable; continue at ${readyUrl}`);
    }
  } catch (error) {
    if (stopping) return;
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    await stop();
  }
}

void reportReadiness();
