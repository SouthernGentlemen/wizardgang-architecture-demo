import { spawn } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['exec', '--', 'vite', 'build', '--watch'], {
    env: { ...process.env, ASSET_MANIFEST_WRITE: '1' },
    stdio: 'inherit',
  }),
  spawn(npm, ['exec', '--', 'wrangler', 'dev'], { stdio: 'inherit' }),
];

let stopping = false;

function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stop(signal));
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(error);
    process.exitCode = 1;
    stop();
  });
  child.on('exit', (code, signal) => {
    if (!stopping && code !== 0) {
      console.error(`${child.spawnargs.join(' ')} exited with ${signal ?? code}.`);
      process.exitCode = code ?? 1;
    }
    stop();
  });
}
