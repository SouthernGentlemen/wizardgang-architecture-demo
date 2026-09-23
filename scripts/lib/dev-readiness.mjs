import { execFile } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

export const DEVELOPMENT_HOST = '127.0.0.1';
export const DEVELOPMENT_PORT = 8787;
export const DEVELOPMENT_URL = `http://${DEVELOPMENT_HOST}:${DEVELOPMENT_PORT}/`;

export function resolveDevelopmentOptions(argv = process.argv.slice(2)) {
  return Object.freeze({
    openBrowser: argv.includes('--open'),
    url: DEVELOPMENT_URL,
  });
}

export async function waitForDevelopmentReady({
  url = DEVELOPMENT_URL,
  attempts = 40,
  intervalMs = 250,
  requestTimeoutMs = 1_000,
  request = globalThis.fetch,
  sleep = delay,
  isCancelled = () => false,
} = {}) {
  if (!Number.isSafeInteger(attempts) || attempts < 1) throw new Error('Development readiness attempts must be a positive integer.');
  if (!Number.isFinite(intervalMs) || intervalMs < 0) throw new Error('Development readiness interval must be non-negative.');
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) throw new Error('Development readiness request timeout must be positive.');
  if (typeof request !== 'function' || typeof sleep !== 'function' || typeof isCancelled !== 'function') {
    throw new Error('Development readiness requires request, sleep, and cancellation functions.');
  }

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (isCancelled()) return null;
    try {
      const response = await request(url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (typeof response?.body?.cancel === 'function') {
        try {
          await response.body.cancel();
        } catch {
          // The server already proved readiness; body cleanup must not hide that result.
        }
      }
      return url;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(intervalMs);
    }
  }

  throw new Error(`Development server did not become ready at ${url} after ${attempts} attempts.`, {
    cause: lastError,
  });
}

export function browserOpenCommand(url, platform = process.platform) {
  if (platform === 'darwin') return Object.freeze({ command: 'open', args: [url] });
  if (platform === 'win32') {
    return Object.freeze({
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', 'start', '""', url],
    });
  }
  if (platform === 'linux') return Object.freeze({ command: 'xdg-open', args: [url] });
  return null;
}

export async function openDevelopmentBrowser(url, {
  platform = process.platform,
  timeoutMs = 3_000,
  execFileImpl = execFile,
} = {}) {
  const opener = browserOpenCommand(url, platform);
  if (!opener) return false;
  return new Promise((resolve) => {
    execFileImpl(opener.command, opener.args, {
      timeout: timeoutMs,
      windowsHide: true,
    }, (error) => resolve(!error));
  });
}
