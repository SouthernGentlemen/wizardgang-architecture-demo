import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const DEFAULT_CDP_TIMEOUT_MS = 15_000;
const DEFAULT_NAVIGATION_TIMEOUT_MS = 30_000;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      await response.body?.cancel();
      return { response, value: null };
    }
    return { response, value: await response.json() };
  } finally {
    clearTimeout(timer);
  }
}

async function settleWithin(promise, timeoutMs) {
  let timer;
  const timedOut = new Promise((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  try {
    return await Promise.race([promise.then(() => true), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

export function chromeExecutable(purpose = 'browser audit') {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidates = process.platform === 'win32'
    ? ['chrome.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'google-chrome', 'chromium']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  for (const candidate of candidates) {
    if (candidate.includes('/') && fs.existsSync(candidate)) return candidate;
    if (!candidate.includes('/') && spawnSync('which', [candidate], { stdio: 'ignore' }).status === 0) return candidate;
  }
  throw new Error(`Chromium/Chrome is required for ${purpose}. Set CHROME_BIN to an installed browser.`);
}

export async function terminateProcess(child, graceMs = 5_000) {
  if (!child) return;
  const openStreams = () => [child.stdin, child.stdout, child.stderr].some((stream) => stream && !stream.destroyed);
  const closeStreams = () => {
    for (const stream of [child.stdin, child.stdout, child.stderr]) stream?.destroy();
  };
  if ((child.exitCode !== null || child.signalCode !== null) && !openStreams()) return;
  const closed = new Promise((resolve) => child.once('close', resolve));
  if (child.exitCode !== null || child.signalCode !== null) {
    if (!await settleWithin(closed, graceMs)) closeStreams();
    return;
  }
  child.kill('SIGTERM');
  let didClose = await settleWithin(closed, graceMs);
  if (!didClose && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    didClose = await settleWithin(closed, graceMs);
  }
  if (!didClose) closeStreams();
}

export async function waitForUrl(url, { attempts = 120, intervalMs = 250, requestTimeoutMs = 5_000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: { connection: 'close' },
      }, requestTimeoutMs);
      if (response.ok || response.status < 500) {
        await response.body?.cancel();
        return response.status;
      }
      lastError = new Error(`${url} returned ${response.status}`);
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }
  throw lastError ?? new Error(`Unable to reach ${url}`);
}

export async function waitForPageTarget(debugPort, { attempts = 120, intervalMs = 250 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const { response, value: targets } = await fetchJsonWithTimeout(`http://127.0.0.1:${debugPort}/json/list`, {
        headers: { connection: 'close' },
      }, 5_000);
      if (response.ok) {
        const target = targets.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
        if (target) return target;
      }
      if (attempt === 0 || attempt % 20 === 0) {
        const { response: created, value: target } = await fetchJsonWithTimeout(`http://127.0.0.1:${debugPort}/json/new?about%3Ablank`, {
          headers: { connection: 'close' },
          method: 'PUT',
        }, 5_000);
        if (created.ok) {
          if (target.type === 'page' && target.webSocketDebuggerUrl) return target;
        }
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }
  throw lastError ?? new Error('No Chromium page target was available.');
}

export class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.waiters = new Set();
    socket.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(String(event.data));
      } catch (error) {
        this.fail(new Error(`Chromium DevTools sent invalid JSON: ${error instanceof Error ? error.message : String(error)}`));
        return;
      }
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(`${pending.label}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      const listeners = this.listeners.get(message.method);
      if (!listeners) return;
      for (const listener of [...listeners]) listener(message.method, message.params ?? {});
    });
    socket.addEventListener('error', () => this.fail(new Error('Chromium DevTools socket failed.')));
    socket.addEventListener('close', () => this.fail(new Error('Chromium DevTools socket closed.')));
  }

  static async connect(url, timeoutMs = 10_000) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.close();
        reject(new Error(`Timed out connecting to Chromium after ${timeoutMs}ms.`));
      }, timeoutMs);
      socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      socket.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('Chromium DevTools socket failed while connecting.'));
      }, { once: true });
    });
    return new CdpClient(socket);
  }

  call(method, params = {}, { timeoutMs = DEFAULT_CDP_TIMEOUT_MS, label = method } = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, label });
      try {
        this.socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  waitForAny(methods, { timeoutMs = DEFAULT_CDP_TIMEOUT_MS, label = methods.join(' or ') } = {}) {
    let settled = false;
    let resolvePromise;
    let rejectPromise;
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      for (const method of methods) {
        const listeners = this.listeners.get(method);
        listeners?.delete(listener);
        if (listeners?.size === 0) this.listeners.delete(method);
      }
      this.waiters.delete(waiter);
    };
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const listener = (method, params) => finish(resolvePromise, { method, params });
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    const waiter = {
      reject: (error) => finish(rejectPromise, error),
    };
    this.waiters.add(waiter);
    for (const method of methods) {
      const listeners = this.listeners.get(method) ?? new Set();
      listeners.add(listener);
      this.listeners.set(method, listeners);
    }
    timer = setTimeout(() => finish(rejectPromise, new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
    return {
      promise,
      cancel: () => finish(resolvePromise, null),
    };
  }

  once(method, options = {}) {
    return this.waitForAny([method], options).promise.then((event) => event?.params);
  }

  fail(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    for (const waiter of [...this.waiters]) waiter.reject(error);
  }

  async close(timeoutMs = 2_000) {
    this.fail(new Error('Chromium DevTools client closed.'));
    if (this.socket.readyState === WebSocket.CLOSED) return;
    const closed = new Promise((resolve) => this.socket.addEventListener('close', resolve, { once: true }));
    this.socket.close();
    await settleWithin(closed, timeoutMs);
  }
}

export async function evaluate(cdp, expression, label = 'Runtime.evaluate') {
  const result = await cdp.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, { label });
  if (result.exceptionDetails) {
    const message = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'Runtime evaluation failed';
    throw new Error(`${label}: ${message}`);
  }
  return result.result?.value;
}

export async function navigate(cdp, url, { timeoutMs = DEFAULT_NAVIGATION_TIMEOUT_MS, label = `navigation for ${url}` } = {}) {
  const current = await cdp.call('Runtime.evaluate', {
    expression: 'location.href',
    returnByValue: true,
  }, { timeoutMs, label: `${label} current URL` });
  const reloadCurrentDocument = current.result?.value === url;
  const events = reloadCurrentDocument
    ? ['Page.loadEventFired']
    : ['Page.loadEventFired', 'Page.navigatedWithinDocument'];
  const completion = cdp.waitForAny(events, { timeoutMs, label: `${label} completion` });
  try {
    const result = reloadCurrentDocument
      ? await cdp.call('Page.reload', {}, { timeoutMs, label: `${label} reload` })
      : await cdp.call('Page.navigate', { url }, { timeoutMs, label });
    if (result?.errorText) throw new Error(`${label} failed: ${result.errorText}`);
    await completion.promise;
  } catch (error) {
    completion.cancel();
    throw error;
  }
}
