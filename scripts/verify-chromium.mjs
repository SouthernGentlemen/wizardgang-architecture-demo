import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

const candidates = process.env.CHROME_BIN
  ? [process.env.CHROME_BIN]
  : process.platform === 'win32'
    ? ['chrome.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'google-chrome', 'chromium']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

for (const candidate of candidates) {
  if (candidate.includes('/') && !fs.existsSync(candidate)) continue;
  const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
  if (result.status !== 0) continue;
  process.stdout.write(result.stdout || result.stderr);
  process.exit(0);
}

console.error('Chromium/Chrome is required for CI parity. Set CHROME_BIN to an installed browser.');
process.exit(1);
