import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const serverPort = Number(process.env.DEMO_268_AUDIT_PORT || 8788);
const debugPort = Number(process.env.DEMO_268_DEBUG_PORT || 9223);
const origin = `http://127.0.0.1:${serverPort}`;
const localSessionSecret = 'demo-268-local-browser-audit-session-key';

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForUrl(url, attempts = 120) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) { lastError = error; }
    await sleep(250);
  }
  throw lastError ?? new Error(`Unable to reach ${url}`);
}

function chromeExecutable() {
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
  throw new Error('Chromium/Chrome is required for DEMO-268 browser validation.');
}

async function terminateProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill('SIGTERM');
  await Promise.race([exited, sleep(5000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await exited;
  }
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      const listeners = this.listeners.get(message.method) ?? [];
      this.listeners.delete(message.method);
      for (const resolve of listeners) resolve(message.params ?? {});
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out connecting to Chromium DevTools')), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Chromium DevTools socket failed')); }, { once: true });
    });
    return new CdpClient(socket);
  }

  call(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listeners = this.listeners.get(method) ?? [];
      listeners.push(resolve);
      this.listeners.set(method, listeners);
    });
  }

  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    const message = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'Runtime evaluation failed';
    throw new Error(message);
  }
  return result.result?.value;
}

async function navigate(cdp, url) {
  const loaded = cdp.once('Page.loadEventFired');
  const result = await cdp.call('Page.navigate', { url });
  if (result.errorText) throw new Error(`Navigation failed for ${url}: ${result.errorText}`);
  await loaded;
}

async function waitFor(cdp, expression, label, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(cdp, expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function waitForDemo(cdp, id) {
  await waitFor(
    cdp,
    `(()=>{const w=document.querySelector('[data-demo-workbench]');return w?.dataset.demoId===${JSON.stringify(id)}&&w?.dataset.demoMounted==='true'&&document.querySelectorAll('[data-demo-panel] [data-demo-section]').length===1})()`,
    `${id} demo mount`,
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const wranglerBin = path.resolve('node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
  const wrangler = spawn(wranglerBin, ['dev', '--local', '--ip', '127.0.0.1', '--port', String(serverPort), '--var', `DEMO_SESSION_SECRET:${localSessionSecret}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
  });
  let wranglerError = '';
  wrangler.stderr.on('data', (chunk) => { wranglerError += String(chunk); });

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wg-demo-268-audit-'));
  let chrome;
  let cdp;
  try {
    await waitForUrl(`${origin}/`);
    chrome = spawn(chromeExecutable(), [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ], { stdio: 'ignore' });

    await waitForUrl(`http://127.0.0.1:${debugPort}/json/version`);
    const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    const page = targets.find((target) => target.type === 'page');
    if (!page?.webSocketDebuggerUrl) throw new Error('Chromium page target was not available.');
    cdp = await CdpClient.connect(page.webSocketDebuggerUrl);
    await cdp.call('Page.enable');
    await cdp.call('Runtime.enable');

    await navigate(cdp, `${origin}/demos?lang=en#rest`);
    await waitForDemo(cdp, 'rest');

    const initial = await evaluate(cdp, `(()=>{
      const visiblePanels=[...document.querySelectorAll('[data-rest-operation-panel]')].filter((panel)=>!panel.hidden);
      return {
        hash:location.hash,
        demoId:document.querySelector('[data-demo-workbench]')?.dataset.demoId,
        mounted:document.querySelectorAll('[data-demo-panel] [data-demo-section]').length,
        released:[...new Set([...document.querySelectorAll('[data-demo-link]')].map((link)=>link.dataset.demoLink))].filter(Boolean).length,
        choices:document.querySelectorAll('[data-rest-operation-select]').length,
        visiblePanels:visiblePanels.length,
        fullOpenApi:Boolean(document.querySelector('[data-rest-full-openapi]')),
        oldInventory:document.body.textContent.includes('All demos'),
        oldFullContract:Boolean(document.querySelector('.rest-full-contract')),
      };
    })()`);
    assert(initial.hash === '#rest', `REST fragment was not preserved: ${initial.hash}`);
    assert(initial.demoId === 'rest' && initial.mounted === 1, 'REST did not mount as the one active demo.');
    assert(initial.released === 12, `Expected 12 released demos, found ${initial.released}.`);
    assert(initial.choices === 6 && initial.visiblePanels === 1, 'REST is not operation-first with one visible operation.');
    assert(initial.fullOpenApi, 'Full OpenAPI evidence link is missing.');
    assert(!initial.oldInventory && !initial.oldFullContract, 'Old demo/OpenAPI inventory resurfaced.');

    await evaluate(cdp, `document.querySelector('[data-rest-operation-select="listRecords"]').click(); document.querySelector('[data-rest-operation-panel="listRecords"] [data-rest-form]').requestSubmit(); true`);
    await waitFor(cdp, `(()=>{const s=document.querySelector('[data-rest-operation-panel="listRecords"] [data-rest-status]')?.textContent||'';return /^200\\b/.test(s)})()`, 'GET list response');
    const getResult = await evaluate(cdp, `(()=>{
      const panel=document.querySelector('[data-rest-operation-panel="listRecords"]');
      return {
        status:panel.querySelector('[data-rest-status]')?.textContent,
        body:panel.querySelector('[data-rest-response-body]')?.textContent,
        contract:panel.querySelector('.rest-contract')?.textContent,
      };
    })()`);
    assert(/^200\b/.test(getResult.status), `GET list did not return 200: ${getResult.status}`);
    assert(getResult.body.includes('"results"') && getResult.contract.includes('Declared responses'), 'GET response/contract evidence is incomplete.');

    const auditKey = `demo268-${Date.now().toString(36)}`;
    await evaluate(cdp, `(()=>{const panel=document.querySelector('[data-rest-operation-panel="createRecord"]');document.querySelector('[data-rest-operation-select="createRecord"]').click();panel.querySelector('[data-rest-body]').value=JSON.stringify({key:${JSON.stringify(auditKey)},value:{status:'created'}});panel.querySelector('[data-rest-form]').requestSubmit();return true})()`);
    await waitFor(cdp, `(()=>{const s=document.querySelector('[data-rest-operation-panel="createRecord"] [data-rest-status]')?.textContent||'';return /^201\\b/.test(s)})()`, 'POST create response');
    await evaluate(cdp, `(()=>{const panel=document.querySelector('[data-rest-operation-panel="updateRecord"]');document.querySelector('[data-rest-operation-select="updateRecord"]').click();panel.querySelector('[data-rest-parameter="id"]').value=${JSON.stringify(auditKey)};panel.querySelector('[data-rest-form]').requestSubmit();return true})()`);
    await waitFor(cdp, `(()=>{const s=document.querySelector('[data-rest-operation-panel="updateRecord"] [data-rest-status]')?.textContent||'';return /^(200|201)\\b/.test(s)})()`, 'PATCH response');
    const patch = await evaluate(cdp, `(()=>{
      const visible=[...document.querySelectorAll('[data-rest-operation-panel]')].filter((panel)=>!panel.hidden);
      const panel=visible[0];
      return { count:visible.length, operation:panel?.dataset.restOperationPanel, status:panel?.querySelector('[data-rest-status]')?.textContent, contract:panel?.querySelector('.rest-contract')?.textContent };
    })()`);
    assert(patch.count === 1 && patch.operation === 'updateRecord', 'Selecting PATCH exposed unrelated operation context.');
    assert(/^(200|201)\b/.test(patch.status) && patch.contract.includes('RecordPatch'), 'PATCH behavior was not paired with its relevant contract.');

    await evaluate(cdp, `document.querySelector('[data-demo-link="graphql"]').click(); true`);
    await waitForDemo(cdp, 'graphql');
    await evaluate(cdp, `document.querySelector('[data-demo-link="rest"]').click(); true`);
    await waitForDemo(cdp, 'rest');
    await cdp.call('Runtime.evaluate', { expression: 'history.back()' });
    await waitForDemo(cdp, 'graphql');
    await cdp.call('Runtime.evaluate', { expression: 'history.forward()' });
    await waitForDemo(cdp, 'rest');

    const inspector = await evaluate(cdp, `(()=>{
      const guide=document.querySelector('[data-demo-inspector-mode="Guide"]');
      guide.focus();
      guide.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
      return {
        selected:document.querySelector('[data-demo-inspector-mode][aria-selected="true"]')?.dataset.demoInspectorMode,
        focused:document.activeElement?.dataset.demoInspectorMode,
      };
    })()`);
    assert(inspector.selected === 'Evidence' && inspector.focused === 'Evidence', 'Inspector keyboard navigation did not remain operable.');

    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `(()=>{const width=window.innerWidth;const describe=(element)=>({element:element.id||element.className||element.tagName,left:Math.round(element.getBoundingClientRect().left),right:Math.round(element.getBoundingClientRect().right),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth});return {scrollWidth:document.documentElement.scrollWidth,innerWidth:width,visiblePanels:[...document.querySelectorAll('[data-rest-operation-panel]')].filter((panel)=>!panel.hidden).length,overflowing:[...document.body.querySelectorAll('*')].filter((element)=>{const rect=element.getBoundingClientRect();return rect.left < -1 || rect.right > width + 1}).slice(0,8).map(describe)}})()`);
    assert(narrow.scrollWidth <= narrow.innerWidth + 1, `REST caused page-level horizontal overflow: ${narrow.scrollWidth} > ${narrow.innerWidth}; ${JSON.stringify(narrow.overflowing)}`);
    assert(narrow.visiblePanels === 1, 'Narrow layout exposed more than one operation.');
    await cdp.call('Emulation.clearDeviceMetricsOverride');

    await navigate(cdp, `${origin}/demos?lang=ar#rest`);
    await waitForDemo(cdp, 'rest');
    const rtl = await evaluate(cdp, `({lang:document.documentElement.lang,dir:document.documentElement.dir,hash:location.hash,demo:document.querySelector('[data-demo-workbench]')?.dataset.demoId})`);
    assert(rtl.lang === 'ar' && rtl.dir === 'rtl' && rtl.hash === '#rest' && rtl.demo === 'rest', 'Arabic locale handling lost the REST fragment or RTL state.');

    console.log('DEMO-268 browser audit: PASS — operation selection, GET/PATCH execution, response/contract evidence, switching/history, inspector keyboard, narrow reflow, and EN/AR #rest state verified.');
  } finally {
    if (cdp) cdp.close();
    await terminateProcess(chrome);
    await terminateProcess(wrangler);
    fs.rmSync(profile, { recursive: true, force: true });
    if (wrangler.exitCode && wranglerError) process.stderr.write(wranglerError);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
