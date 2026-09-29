import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CdpClient,
  chromeExecutable,
  evaluate,
  navigate,
  sleep,
  terminateProcess,
  waitForPageTarget,
  waitForUrl,
} from './lib/browser-audit.mjs';

const serverPort = Number(process.env.DEMO_268_AUDIT_PORT || 8788);
const debugPort = Number(process.env.DEMO_268_DEBUG_PORT || 9223);
const origin = `http://127.0.0.1:${serverPort}`;
const localSessionSecret = 'demo-268-local-browser-audit-session-key';
const localPersistenceArgs = process.env.WG_LOCAL_D1_PERSIST_TO ? ['--persist-to', process.env.WG_LOCAL_D1_PERSIST_TO] : [];

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
  const wrangler = spawn(wranglerBin, ['dev', '--local', ...localPersistenceArgs, '--ip', '127.0.0.1', '--port', String(serverPort), '--var', `DEMO_SESSION_SECRET:${localSessionSecret}`], {
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
    chrome = spawn(chromeExecutable('DEMO-268 browser validation'), [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ], { stdio: 'ignore' });

    await waitForUrl(`http://127.0.0.1:${debugPort}/json/version`);
    const page = await waitForPageTarget(debugPort);
    cdp = await CdpClient.connect(page.webSocketDebuggerUrl);
    await cdp.call('Page.enable');
    await cdp.call('Runtime.enable');

    await navigate(cdp, `${origin}/demos?lang=en#rest`);
    await waitForDemo(cdp, 'rest');

    const initial = await evaluate(cdp, `(()=>{
      const openPanels=[...document.querySelectorAll('[data-rest-operation-panel]')].filter((panel)=>panel.open);
      return {
        hash:location.hash,
        demoId:document.querySelector('[data-demo-workbench]')?.dataset.demoId,
        mounted:document.querySelectorAll('[data-demo-panel] [data-demo-section]').length,
        released:[...new Set([...document.querySelectorAll('[data-demo-link]')].map((link)=>link.dataset.demoLink))].filter(Boolean).length,
        choices:document.querySelectorAll('[data-rest-operation-select]').length,
        openPanels:openPanels.length,
        fullOpenApi:Boolean(document.querySelector('[data-rest-full-openapi]')),
        oldInventory:document.body.textContent.includes('All demos'),
        oldFullContract:Boolean(document.querySelector('.rest-full-contract')),
      };
    })()`);
    assert(initial.hash === '#rest', `REST fragment was not preserved: ${initial.hash}`);
    assert(initial.demoId === 'rest' && initial.mounted === 1, 'REST did not mount as the one active demo.');
    assert(initial.released === 14, `Expected 14 released demos, found ${initial.released}.`);
    assert(initial.choices === 6 && initial.openPanels === 0, 'REST operations are not six closed document disclosures.');
    assert(initial.fullOpenApi, 'Full OpenAPI evidence link is missing.');
    assert(!initial.oldInventory && !initial.oldFullContract, 'Old demo/OpenAPI inventory resurfaced.');

    await evaluate(cdp, `document.querySelector('[data-rest-operation-panel="listRecords"]').open=true; document.querySelector('[data-rest-operation-panel="listRecords"] [data-rest-form]').requestSubmit(); true`);
    await waitFor(cdp, `(()=>{const s=document.querySelector('[data-rest-operation-panel="listRecords"] [data-rest-status]')?.textContent||'';return /^200\\b/.test(s)})()`, 'GET list response');
    const getResult = await evaluate(cdp, `(()=>{
      const panel=document.querySelector('[data-rest-operation-panel="listRecords"]');
      return {
        status:panel.querySelector('[data-rest-status]')?.textContent,
        body:panel.querySelector('[data-rest-response-body]')?.textContent,
        contract:panel.querySelector('.rest-declared-responses')?.textContent,
        curl:panel.querySelector('[data-rest-curl]')?.textContent,
      };
    })()`);
    assert(/^200\b/.test(getResult.status), `GET list did not return 200: ${getResult.status}`);
    assert(getResult.body.includes('"results"') && getResult.contract.includes('200') && getResult.curl.includes('--cookie-jar'), 'GET response/contract/curl evidence is incomplete.');

    const auditKey = `demo268-${Date.now().toString(36)}`;
    await evaluate(cdp, `(()=>{const panel=document.querySelector('[data-rest-operation-panel="createRecord"]');panel.open=true;panel.querySelector('[data-rest-body]').value=JSON.stringify({key:${JSON.stringify(auditKey)},value:{status:'created'}});panel.querySelector('[data-rest-form]').requestSubmit();return true})()`);
    await waitFor(cdp, `(()=>{const s=document.querySelector('[data-rest-operation-panel="createRecord"] [data-rest-status]')?.textContent||'';return /^201\\b/.test(s)})()`, 'POST create response');
    await evaluate(cdp, `(()=>{const panel=document.querySelector('[data-rest-operation-panel="updateRecord"]');panel.open=true;panel.querySelector('[data-rest-parameter="id"]').value=${JSON.stringify(auditKey)};panel.querySelector('[data-rest-form]').requestSubmit();return true})()`);
    await waitFor(cdp, `(()=>{const s=document.querySelector('[data-rest-operation-panel="updateRecord"] [data-rest-status]')?.textContent||'';return /^(200|201)\\b/.test(s)})()`, 'PATCH response');
    const patch = await evaluate(cdp, `(()=>{
      const panel=document.querySelector('[data-rest-operation-panel="updateRecord"]');
      return { open:panel?.open, status:panel?.querySelector('[data-rest-status]')?.textContent, contract:panel?.querySelector('.rest-document-block')?.textContent };
    })()`);
    assert(patch.open && /^(200|201)\b/.test(patch.status) && patch.contract.includes('id'), 'PATCH behavior was not paired with its relevant contract.');

    await evaluate(cdp, `document.querySelector('[data-demo-link="graphql"]').click(); true`);
    await waitForDemo(cdp, 'graphql');
    await evaluate(cdp, `document.querySelector('[data-demo-link="rest"]').click(); true`);
    await waitForDemo(cdp, 'rest');
    await cdp.call('Runtime.evaluate', { expression: 'history.back()' });
    await waitForDemo(cdp, 'graphql');
    await cdp.call('Runtime.evaluate', { expression: 'history.forward()' });
    await waitForDemo(cdp, 'rest');

    const inspector = await evaluate(cdp, `(()=>{const element=document.querySelector('[data-demo-inspector]');return element && getComputedStyle(element).display !== 'none'})()`);
    assert(!inspector, 'REST inspector remained visible.');

    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(cdp, `(()=>{const width=window.innerWidth;const describe=(element)=>({element:element.id||element.className||element.tagName,left:Math.round(element.getBoundingClientRect().left),right:Math.round(element.getBoundingClientRect().right),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth});return {scrollWidth:document.documentElement.scrollWidth,innerWidth:width,operations:document.querySelectorAll('[data-rest-operation-panel]').length,overflowing:[...document.body.querySelectorAll('*')].filter((element)=>{const rect=element.getBoundingClientRect();return rect.left < -1 || rect.right > width + 1}).slice(0,8).map(describe)}})()`);
    assert(narrow.scrollWidth <= narrow.innerWidth + 1, `REST caused page-level horizontal overflow: ${narrow.scrollWidth} > ${narrow.innerWidth}; ${JSON.stringify(narrow.overflowing)}`);
    assert(narrow.operations === 6, 'Narrow layout lost an operation.');
    await cdp.call('Emulation.clearDeviceMetricsOverride');

    await navigate(cdp, `${origin}/demos?lang=ar#rest`);
    await waitForDemo(cdp, 'rest');
    const rtl = await evaluate(cdp, `({lang:document.documentElement.lang,dir:document.documentElement.dir,hash:location.hash,demo:document.querySelector('[data-demo-workbench]')?.dataset.demoId})`);
    assert(rtl.lang === 'ar' && rtl.dir === 'rtl' && rtl.hash === '#rest' && rtl.demo === 'rest', 'Arabic locale handling lost the REST fragment or RTL state.');

    console.log('REST browser audit: PASS — document disclosures, GET/PATCH execution, response/contract/curl evidence, switching/history, inspector removal, narrow reflow, and EN/AR #rest state verified.');
  } finally {
    await cdp?.close();
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
