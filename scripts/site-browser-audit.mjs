import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
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

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync('docs/route-manifest.json', 'utf8'));
const auditConfig = JSON.parse(fs.readFileSync('config/site-audit-states.json', 'utf8'));
const serverPort = Number(process.env.SITE_AUDIT_PORT || 8787);
const debugPort = Number(process.env.SITE_AUDIT_DEBUG_PORT || 9222);
const origin = `http://127.0.0.1:${serverPort}`;
const localSessionSecret = 'demo-334-local-browser-audit-session-key';
const axeTags = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const workbenchDemos = {
  d1: ['Data', 'D1'], r2: ['Data', 'R2'], rest: ['APIs', 'REST / OpenAPI'], graphql: ['APIs', 'GraphQL'],
  webhooks: ['Integrations', 'Webhooks'], identity: ['Identity', 'Identity'], mcp: ['AI', 'MCP'],
  edge: ['Platform', 'Edge'], workers: ['Platform', 'Workers'], 'durable-objects': ['Platform', 'Durable Objects'],
  accessibility: ['Quality', 'Accessibility'], i18n: ['Quality', 'Internationalization'],
};

function patternMatches(pattern, pathname) {
  const expected = pattern.split('/').filter(Boolean);
  const actual = pathname.split('/').filter(Boolean);
  if (expected.length !== actual.length) return false;
  return expected.every((segment, index) => segment.startsWith(':') || segment === actual[index]);
}

function publicPages() {
  return manifest.filter((route) => route.kind === 'page'
    && route.visibility === 'public'
    && route.methods.includes('GET'));
}

function routePath(route) {
  if (!route.route.includes(':')) return route.route;
  const fixture = auditConfig.states.find((state) => patternMatches(route.route, new URL(state.path, origin).pathname));
  if (!fixture) throw new Error(`new public surface requires accessibility/i18n coverage: ${route.id}`);
  return fixture.path;
}

function localizedPath(routePathname, locale) {
  const url = new URL(routePathname, origin);
  // Browser runs share a profile, so make even the default locale explicit.
  // Otherwise the preceding Arabic navigation persists an RTL cookie and makes
  // the next nominally English case depend on execution order.
  url.searchParams.set('lang', locale);
  return `${url.pathname}${url.search}${url.hash}`;
}

function inspectionExpression(expectedLocale) {
  return `(async()=>{
    ${axeSource}
    const axeResult = await axe.run(document, { runOnly: { type: 'tag', values: ${JSON.stringify(axeTags)} }, resultTypes: ['violations'] });
    const ids = [...document.querySelectorAll('[id]')].map((node)=>node.id);
    const duplicateIds = [...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
    const skip = document.querySelector('.skip-link[href^="#"]');
    const skipTarget = skip ? document.querySelector(skip.getAttribute('href')) : null;
    const imagesWithoutAlt = [...document.querySelectorAll('img:not([alt])')].length;
    const tablesWithoutHeaders = [...document.querySelectorAll('table')].filter((table)=>!table.querySelector('th')).length;
    // Linux Chromium subtracts the classic vertical scrollbar from clientWidth
    // while scrollWidth remains the full emulated viewport. That difference is
    // not horizontal page overflow.
    const viewportWidth = window.innerWidth;
    const ordinaryHorizontalOverflow = document.documentElement.scrollWidth > viewportWidth + 1;
    const overflowingElements = [...document.querySelectorAll('body *')]
      .filter((node)=>{ const rect=node.getBoundingClientRect(); return rect.left < -1 || rect.right > viewportWidth + 1; })
      .slice(0, 8)
      .map((node)=>{
        const rect=node.getBoundingClientRect();
        const identity=node.id ? '#' + node.id : node.classList.length ? node.tagName.toLowerCase() + '.' + [...node.classList].join('.') : node.tagName.toLowerCase();
        return identity + '[' + Math.round(rect.left) + '..' + Math.round(rect.right) + ']:' + (node.textContent||'').trim().slice(0,40);
      });
    const clippedControls = [...document.querySelectorAll('button,select,input:not([type="hidden"]),textarea,[role="button"],[role="tab"]')]
      .filter((node)=>{
        const style=getComputedStyle(node); if(style.display==='none'||style.visibility==='hidden') return false;
        for (let ancestor=node.parentElement; ancestor; ancestor=ancestor.parentElement) {
          if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
            const summary=ancestor.querySelector(':scope > summary');
            if (!summary || !summary.contains(node)) return false;
          }
        }
        const rect=node.getBoundingClientRect(); if(rect.width===0&&rect.height===0) return false;
        return rect.left < -1 || rect.right > viewportWidth + 1;
      })
      .map((node)=>{
        const rect=node.getBoundingClientRect();
        const identity=node.id ? '#' + node.id : node.classList.length ? node.tagName.toLowerCase() + '.' + [...node.classList].join('.') : node.tagName.toLowerCase();
        return identity + '[' + Math.round(rect.left) + '..' + Math.round(rect.right) + ']';
      });
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      mains: document.querySelectorAll('main').length,
      skipResolves: Boolean(skipTarget),
      duplicateIds,
      imagesWithoutAlt,
      tablesWithoutHeaders,
      ordinaryHorizontalOverflow,
      overflowingElements,
      clippedControls,
      localeSelectorNamed: Boolean(document.querySelector('#global-language[aria-label]')),
      violations: axeResult.violations.map((violation)=>({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
        targets: violation.nodes.slice(0, 5).flatMap((node)=>node.target),
      })),
      expectedLocale: ${JSON.stringify(expectedLocale)}
    };
  })()`;
}

async function inspectCurrentPage(cdp, expectedLocale, label) {
  const report = await evaluate(cdp, inspectionExpression(expectedLocale));
  const expectedDir = expectedLocale === 'ar' ? 'rtl' : 'ltr';
  const failures = [];
  if (report.lang !== expectedLocale) failures.push(`lang=${report.lang}`);
  if (report.dir !== expectedDir) failures.push(`dir=${report.dir}`);
  if (report.mains !== 1) failures.push(`main landmarks=${report.mains}`);
  if (!report.skipResolves) failures.push('skip link does not resolve');
  if (report.duplicateIds.length) failures.push(`duplicate ids=${report.duplicateIds.join(',')}`);
  if (report.imagesWithoutAlt) failures.push(`images without alt=${report.imagesWithoutAlt}`);
  if (report.tablesWithoutHeaders) failures.push(`tables without headers=${report.tablesWithoutHeaders}`);
  if (!report.localeSelectorNamed) failures.push('locale selector is not named');
  if (report.ordinaryHorizontalOverflow) failures.push(`page-level horizontal overflow (${report.overflowingElements.join(', ')})`);
  if (report.clippedControls.length) failures.push(`horizontally clipped controls=${report.clippedControls.join(', ')}`);
  if (report.violations.length) failures.push(`axe=${report.violations.map((item)=>`${item.id}(${item.nodes}: ${item.targets.join(', ')})`).join('; ')}`);
  if (failures.length) throw new Error(`${label}: ${failures.join('; ')}`);
  return report;
}

async function inspectPath(cdp, pathname, locale, label) {
  await navigate(cdp, `${origin}${localizedPath(pathname, locale)}`);
  return inspectCurrentPage(cdp, locale, label);
}

async function dispatchKey(cdp, key, code = key) {
  const virtualKeyCodes = { Tab: 9, Enter: 13, ' ': 32, Home: 36, End: 35, ArrowLeft: 37, ArrowRight: 39, ArrowDown: 40 };
  const virtualKeyCode = virtualKeyCodes[key] ?? 0;
  const params = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode };
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
}

async function waitForExpression(cdp, expression, label, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(cdp, expression)) return;
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function assertWorkbenchState(cdp, expectedId, label, expectedHash = `#${expectedId}`, expectedLocale = 'en') {
  await waitForExpression(
    cdp,
    `document.querySelector('[data-demo-workbench]')?.dataset.demoId === ${JSON.stringify(expectedId)} && document.querySelector('[data-demo-workbench]')?.dataset.demoMounted === 'true'`,
    `${label} to mount`,
  );
  const state = await evaluate(cdp, `(()=>{
    const selectedCategories=[...document.querySelectorAll('[data-demo-category][aria-selected="true"]')];
    const categoryTabStops=[...document.querySelectorAll('[data-demo-category]')].filter((node)=>node.tabIndex===0);
    const visibleSections=[...document.querySelectorAll('[data-demo-panel] [data-demo-section]')].filter((node)=>!node.hidden);
    return {
      hash: location.hash,
      id: document.querySelector('[data-demo-workbench]')?.dataset.demoId,
      category: selectedCategories[0]?.getAttribute('data-demo-category'),
      heading: document.querySelector('[data-demo-active-title]')?.textContent?.trim(),
      mounted: visibleSections.length,
      currentDemoLinks: document.querySelectorAll('[data-demo-link][aria-current="location"]').length,
      selectedCategories: selectedCategories.length,
      categoryTabStops: categoryTabStops.length,
      busy: document.querySelector('[data-demo-panel]')?.getAttribute('aria-busy'),
    };
  })()`);
  const failures = [];
  if (state.hash !== expectedHash) failures.push(`hash=${state.hash}`);
  if (state.id !== expectedId) failures.push(`demo=${state.id}`);
  if (state.category !== workbenchDemos[expectedId]?.[0]) failures.push(`category=${state.category}`);
  if (expectedLocale === 'en' && state.heading !== workbenchDemos[expectedId]?.[1]) failures.push(`heading=${state.heading}`);
  if (expectedLocale !== 'en' && !state.heading) failures.push('heading is empty');
  if (state.mounted !== 1) failures.push(`mounted presentations=${state.mounted}`);
  const expectedCurrentLinks = ['webhooks', 'identity', 'mcp'].includes(expectedId) ? 0 : 1;
  if (state.currentDemoLinks !== expectedCurrentLinks) failures.push(`current demo links=${state.currentDemoLinks}`);
  if (state.selectedCategories !== 1) failures.push(`selected categories=${state.selectedCategories}`);
  if (state.categoryTabStops !== 1) failures.push(`category tab stops=${state.categoryTabStops}`);
  if (state.busy !== 'false') failures.push(`aria-busy=${state.busy}`);
  if (failures.length) throw new Error(`${label}: ${failures.join('; ')}`);
}

async function switchWorkbenchLocale(cdp, locale, expectedId) {
  const loaded = cdp.once('Page.loadEventFired', {
    label: `${expectedId} ${locale} locale switch load`,
    timeoutMs: 30_000,
  });
  await evaluate(cdp, `(()=>{
    const form=document.querySelector('[data-preserve-fragment]');
    const select=document.querySelector('#global-language');
    if (!(form instanceof HTMLFormElement) || !(select instanceof HTMLSelectElement)) return false;
    select.value=${JSON.stringify(locale)};
    form.requestSubmit();
    return true;
  })()`);
  await loaded;
  await assertWorkbenchState(cdp, expectedId, `${expectedId} ${locale} locale switch`, `#${expectedId}`, locale);
  const localeState = await evaluate(cdp, `({lang:document.documentElement.lang,dir:document.documentElement.dir,hash:location.hash})`);
  if (localeState.lang !== locale || localeState.dir !== (locale === 'ar' ? 'rtl' : 'ltr') || localeState.hash !== `#${expectedId}`) {
    throw new Error(`${expectedId}: locale switch lost state (${JSON.stringify(localeState)})`);
  }
}

async function traverseBrowserHistory(cdp, offset, expectedId, label) {
  const history = await cdp.call('Page.getNavigationHistory');
  const entry = history.entries[history.currentIndex + offset];
  if (!entry) throw new Error(`${label}: browser history has no entry at offset ${offset}`);
  await cdp.call('Page.navigateToHistoryEntry', { entryId: entry.id });
  await assertWorkbenchState(cdp, expectedId, label);
}

async function exerciseD1Workflow(cdp, locale) {
  const label = `D1 ${locale} CRUD/reset`;
  const name = `DEMO 334 ${locale} user`;
  const editedName = `${name} edited`;
  const email = `demo-334-${locale}@example.test`;
  await navigate(cdp, `${origin}/demos?lang=${locale}#d1`);
  await assertWorkbenchState(cdp, 'd1', label, '#d1', locale);
  await waitForExpression(cdp, `document.querySelector('[data-count="users"]')?.textContent !== '—'`, `${label} initial users`);

  await evaluate(cdp, `(()=>{
    document.querySelector('[data-demo-reset]')?.click();
    document.querySelector('[data-demo-panel] [data-confirm-action]')?.click();
    return true;
  })()`);
  await waitForExpression(cdp, `document.querySelector('[data-count="users"]')?.textContent === '3' && !document.querySelector('[data-confirm-dialog]')?.open`, `${label} reset`);

  await evaluate(cdp, `(()=>{
    document.querySelector('[data-demo-panel] [data-add="users"]')?.click();
    const form=document.querySelector('[data-demo-panel] [data-form="users"]');
    form.elements.name.value=${JSON.stringify(name)};
    form.elements.email.value=${JSON.stringify(email)};
    form.elements.role.value='member';
    form.requestSubmit();
    return true;
  })()`);
  await waitForExpression(cdp, `(()=>[...document.querySelectorAll('[data-rows="users"] tr')].some((row)=>row.querySelector('strong')?.textContent===${JSON.stringify(name)}))()`, `${label} create`, 160);

  await evaluate(cdp, `(()=>{
    const row=[...document.querySelectorAll('[data-rows="users"] tr')].find((item)=>item.querySelector('strong')?.textContent===${JSON.stringify(name)});
    row?.querySelector('[data-edit-user]')?.click();
    const form=document.querySelector('[data-demo-panel] [data-form="users"]');
    form.elements.name.value=${JSON.stringify(editedName)};
    form.requestSubmit();
    return true;
  })()`);
  await waitForExpression(cdp, `(()=>[...document.querySelectorAll('[data-rows="users"] tr')].some((row)=>row.querySelector('strong')?.textContent===${JSON.stringify(editedName)}))()`, `${label} edit`, 160);

  await evaluate(cdp, `(()=>{
    const row=[...document.querySelectorAll('[data-rows="users"] tr')].find((item)=>item.querySelector('strong')?.textContent===${JSON.stringify(editedName)});
    row?.querySelector('[data-delete-user]')?.click();
    document.querySelector('[data-demo-panel] [data-confirm-action]')?.click();
    return true;
  })()`);
  await waitForExpression(cdp, `(()=>![...document.querySelectorAll('[data-rows="users"] tr')].some((row)=>row.querySelector('strong')?.textContent===${JSON.stringify(editedName)}))()`, `${label} delete`, 160);

  await evaluate(cdp, `(()=>{
    document.querySelector('[data-demo-reset]')?.click();
    document.querySelector('[data-demo-panel] [data-confirm-action]')?.click();
    return true;
  })()`);
  await waitForExpression(cdp, `document.querySelector('[data-count="users"]')?.textContent === '3' && !document.querySelector('[data-confirm-dialog]')?.open`, `${label} final reset`, 160);
  const result = await evaluate(cdp, `(()=>({
    lang:document.documentElement.lang,
    dir:document.documentElement.dir,
    users:document.querySelector('[data-count="users"]')?.textContent,
    sql:document.querySelector('[data-inspector-sql]')?.textContent?.trim(),
    response:document.querySelector('[data-state-output]')?.textContent?.trim(),
    status:document.querySelector('[data-inspector-status]')?.textContent?.trim()
  }))()`);
  if (result.lang !== locale || result.dir !== (locale === 'ar' ? 'rtl' : 'ltr') || result.users !== '3' || !result.sql || !result.response || !result.status) {
    throw new Error(`${label} did not preserve localized CRUD/reset and SQL inspector behavior: ${JSON.stringify(result)}`);
  }
}

async function exerciseR2Workflow(cdp, locale) {
  const label = `R2 ${locale} upload/preview/delete`;
  const fileName = `demo-334-${locale}.txt`;
  const fileBody = `DEMO-334 ${locale} R2 preview`;
  await navigate(cdp, `${origin}/demos?lang=${locale}#r2`);
  await assertWorkbenchState(cdp, 'r2', label, '#r2', locale);
  await waitForExpression(cdp, `!document.querySelector('[data-sandbox-usage]')?.textContent?.includes('Loading')`, `${label} initial inventory`, 160);

  const resetNeeded = await evaluate(cdp, `!document.querySelector('[data-r2-reset]')?.disabled`);
  if (resetNeeded) {
    await evaluate(cdp, `(()=>{document.querySelector('[data-r2-reset]')?.click();document.querySelector('[data-confirm-reset]')?.click();return true})()`);
    await waitForExpression(cdp, `document.querySelector('[data-r2-reset]')?.disabled === true`, `${label} clean sandbox`, 160);
  }

  await evaluate(cdp, `(()=>{
    const input=document.querySelector('[data-file-input]');
    const transfer=new DataTransfer();
    transfer.items.add(new File([${JSON.stringify(fileBody)}],${JSON.stringify(fileName)},{type:'text/plain'}));
    input.files=transfer.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('[data-upload-form]')?.requestSubmit();
    return true;
  })()`);
  await waitForExpression(cdp, `(()=>[...document.querySelectorAll('.file-row')].some((row)=>row.querySelector('strong')?.textContent===${JSON.stringify(fileName)}))()`, `${label} upload`, 240);

  await evaluate(cdp, `(()=>{
    const row=[...document.querySelectorAll('.file-row')].find((item)=>item.querySelector('strong')?.textContent===${JSON.stringify(fileName)});
    row?.querySelector('[data-preview-id]')?.click();
    return true;
  })()`);
  await waitForExpression(cdp, `document.querySelector('[data-preview-text]')?.textContent === ${JSON.stringify(fileBody)}`, `${label} text preview`, 160);

  await evaluate(cdp, `(()=>{
    const row=[...document.querySelectorAll('.file-row')].find((item)=>item.querySelector('strong')?.textContent===${JSON.stringify(fileName)});
    row?.querySelector('[data-delete-id]')?.click();
    document.querySelector('[data-confirm-delete]')?.click();
    return true;
  })()`);
  await waitForExpression(cdp, `(()=>![...document.querySelectorAll('.file-row')].some((row)=>row.querySelector('strong')?.textContent===${JSON.stringify(fileName)}))()`, `${label} delete`, 240);
  const result = await evaluate(cdp, `(()=>({
    lang:document.documentElement.lang,
    dir:document.documentElement.dir,
    method:document.querySelector('[data-request-method]')?.textContent?.trim(),
    status:document.querySelector('[data-request-status]')?.textContent?.trim(),
    response:document.querySelector('[data-r2-output]')?.textContent?.trim(),
    preview:document.querySelector('[data-preview-text]')?.textContent ?? null
  }))()`);
  if (result.lang !== locale || result.dir !== (locale === 'ar' ? 'rtl' : 'ltr') || result.method !== 'DELETE' || !result.status || !result.response || result.preview !== null) {
    throw new Error(`${label} did not preserve localized storage and request inspector behavior: ${JSON.stringify(result)}`);
  }
}

async function workbenchInteractionAudit(cdp) {
  await navigate(cdp, `${origin}/demos?lang=en`);
  await assertWorkbenchState(cdp, 'd1', 'missing fragment default', '');
  await navigate(cdp, `${origin}/demos?lang=en#not-a-demo`);
  await waitForExpression(cdp, `document.querySelector('[data-demo-workbench]')?.dataset.demoMounted === 'true'`, 'invalid fragment fallback');
  const invalidFallback = await evaluate(cdp, `({id:document.querySelector('[data-demo-workbench]')?.dataset.demoId,heading:document.querySelector('[data-demo-active-title]')?.textContent?.trim(),mounted:document.querySelectorAll('[data-demo-panel] [data-demo-section]').length})`);
  if (invalidFallback.id !== 'd1' || invalidFallback.heading !== 'D1' || invalidFallback.mounted !== 1) throw new Error(`Invalid fragment did not safely fall back to D1: ${JSON.stringify(invalidFallback)}`);

  for (const id of Object.keys(workbenchDemos)) {
    await navigate(cdp, `${origin}/demos?lang=en#${id}`);
    await assertWorkbenchState(cdp, id, `${id} released fragment`);
  }

  await navigate(cdp, `${origin}/demos?lang=en#d1`);
  await assertWorkbenchState(cdp, 'd1', 'D1 default');
  await inspectCurrentPage(cdp, 'en', 'D1 workbench');

  const resetState = await evaluate(cdp, `(()=>{
    const reset=document.querySelector('[data-demo-reset]');
    reset?.click();
    const dialog=document.querySelector('[data-demo-panel] [data-confirm-dialog]');
    return {visible:reset instanceof HTMLButtonElement&&!reset.hidden,open:dialog instanceof HTMLDialogElement&&dialog.open,title:dialog?.querySelector('[data-confirm-title]')?.textContent?.trim()};
  })()`);
  if (!resetState.visible || !resetState.open || resetState.title !== 'Reset sample data?') {
    throw new Error(`Workbench reset did not delegate to D1: ${JSON.stringify(resetState)}`);
  }
  await evaluate(cdp, `document.querySelector('[data-demo-panel] [data-confirm-cancel]')?.click();true`);

  for (const mode of ['Guide', 'Request', 'Evidence']) {
    const modeState = await evaluate(cdp, `(()=>{
      const tab=document.querySelector('[data-demo-inspector-mode=${JSON.stringify(mode)}]');
      tab?.click();
      const panel=document.querySelector('[data-demo-inspector-panel]');
      return {selected:tab?.getAttribute('aria-selected'),labelledBy:panel?.getAttribute('aria-labelledby'),text:panel?.textContent?.trim()};
    })()`);
    if (modeState.selected !== 'true' || modeState.labelledBy !== `demo-inspector-tab-${mode.toLowerCase()}` || !modeState.text) {
      throw new Error(`Workbench ${mode} inspector mode failed: ${JSON.stringify(modeState)}`);
    }
  }

  await evaluate(cdp, `document.querySelector('[data-demo-category][aria-selected="true"]')?.focus()`);
  await dispatchKey(cdp, 'ArrowRight', 'ArrowRight');
  await assertWorkbenchState(cdp, 'rest', 'category ArrowRight');
  const categoryFocus = await evaluate(cdp, `document.activeElement?.getAttribute('data-demo-category')`);
  if (categoryFocus !== 'APIs') throw new Error(`Category navigation lost focus: ${categoryFocus}`);

  await dispatchKey(cdp, 'End', 'End');
  await assertWorkbenchState(cdp, 'accessibility', 'category End');
  await dispatchKey(cdp, 'Home', 'Home');
  await assertWorkbenchState(cdp, 'd1', 'category Home');
  await dispatchKey(cdp, 'ArrowLeft', 'ArrowLeft');
  await assertWorkbenchState(cdp, 'accessibility', 'category ArrowLeft wrap');

  for (const id of ['d1', 'r2', 'rest', 'graphql', 'workers', 'd1']) {
    await evaluate(cdp, `document.querySelector('[data-demo-link=${JSON.stringify(id)}]')?.click()`);
    await assertWorkbenchState(cdp, id, `${id} rapid sequence`);
  }

  await evaluate(cdp, `document.querySelector('[data-demo-link="rest"]')?.click()`);
  await assertWorkbenchState(cdp, 'rest', 'REST history sequence');
  await evaluate(cdp, `document.querySelector('[data-demo-link="graphql"]')?.click()`);
  await assertWorkbenchState(cdp, 'graphql', 'GraphQL secondary selector');
  await evaluate(cdp, `document.querySelector('[data-demo-link="workers"]')?.click()`);
  await assertWorkbenchState(cdp, 'workers', 'Workers selection');
  await evaluate(cdp, `document.querySelector('[data-demo-link="accessibility"]')?.click()`);
  await assertWorkbenchState(cdp, 'accessibility', 'Accessibility selection');

  await traverseBrowserHistory(cdp, -1, 'workers', 'first Back');
  await traverseBrowserHistory(cdp, -1, 'graphql', 'second Back');
  await traverseBrowserHistory(cdp, 1, 'workers', 'Forward');

  await evaluate(cdp, `document.querySelector('[data-demo-inspector-mode="Guide"]')?.focus()`);
  await dispatchKey(cdp, 'End', 'End');
  const inspector = await evaluate(cdp, `(()=>{const tab=document.activeElement;const panel=document.querySelector('[data-demo-inspector-panel]');return {mode:tab?.getAttribute('data-demo-inspector-mode'),selected:tab?.getAttribute('aria-selected'),labelledBy:panel?.getAttribute('aria-labelledby')}})()`);
  if (inspector.mode !== 'Evidence' || inspector.selected !== 'true' || inspector.labelledBy !== 'demo-inspector-tab-evidence') {
    throw new Error(`Inspector keyboard relationship failed: ${JSON.stringify(inspector)}`);
  }

  await navigate(cdp, `${origin}/demos?lang=en#d1`);
  await assertWorkbenchState(cdp, 'd1', 'deterministic loading baseline');
  await evaluate(cdp, `(()=>{const nativeFetch=window.fetch.bind(window);window.__demoNativeFetch=nativeFetch;window.fetch=(input,init)=>String(input).includes('/api/demos/r2')?Promise.reject(new Error('DEMO-271 deterministic load failure')):nativeFetch(input,init);document.querySelector('[data-demo-link="r2"]').click();return true})()`);
  await waitForExpression(cdp, `document.querySelector('[data-demo-panel] [role="alert"]')?.textContent.includes('DEMO-271 deterministic load failure')`, 'contained workbench error');
  const errorState = await evaluate(cdp, `(()=>({demo:document.querySelector('[data-demo-workbench]')?.dataset.demoId,busy:document.querySelector('[data-demo-panel]')?.getAttribute('aria-busy'),retry:document.querySelector('[data-demo-panel] button')?.textContent,nav:document.querySelectorAll('[data-demo-category]').length}))()`);
  if (errorState.demo !== 'r2' || errorState.busy !== 'false' || errorState.retry !== 'Retry demo' || errorState.nav !== 7) throw new Error(`Workbench error containment failed: ${JSON.stringify(errorState)}`);
  const retryFocusable = await evaluate(cdp, `(()=>{window.fetch=window.__demoNativeFetch;const button=document.querySelector('[data-demo-panel] button');button?.focus();return button instanceof HTMLButtonElement&&document.activeElement===button})()`);
  if (!retryFocusable) throw new Error('Workbench retry is not a keyboard-focusable native button.');
  await evaluate(cdp, `document.querySelector('[data-demo-panel] button')?.click();true`);
  await assertWorkbenchState(cdp, 'r2', 'keyboard-accessible retry');

  await navigate(cdp, `${origin}/demos?lang=en#d1`);
  await assertWorkbenchState(cdp, 'd1', 'stale response baseline');
  await evaluate(cdp, `(()=>{const nativeFetch=window.fetch.bind(window);window.fetch=(input,init)=>String(input).includes('/api/demos/graphql')?new Promise((resolve)=>setTimeout(()=>nativeFetch(input,init).then(resolve),350)):nativeFetch(input,init);document.querySelector('[data-demo-link="graphql"]').click();document.querySelector('[data-demo-link="workers"]').click();return true})()`);
  await assertWorkbenchState(cdp, 'workers', 'late inactive response containment');
  await sleep(500);
  await assertWorkbenchState(cdp, 'workers', 'late inactive response remained contained');

  for (const id of Object.keys(workbenchDemos)) {
    await navigate(cdp, `${origin}/demos?lang=en#${id}`);
    await assertWorkbenchState(cdp, id, `${id} English direct fragment`);
    await switchWorkbenchLocale(cdp, 'ar', id);
    await inspectCurrentPage(cdp, 'ar', `${id} Arabic workbench`);
    await switchWorkbenchLocale(cdp, 'en', id);
  }

  for (const locale of ['en', 'ar']) {
    await exerciseD1Workflow(cdp, locale);
    await exerciseR2Workflow(cdp, locale);
  }
}

async function keyboardSmoke(cdp, pathname) {
  await navigate(cdp, `${origin}${localizedPath(pathname, 'en')}`);
  await evaluate(cdp, `document.body.focus(); document.activeElement?.blur(); true`);
  const visited = [];
  for (let index = 0; index < 8; index += 1) {
    await dispatchKey(cdp, 'Tab', 'Tab');
    visited.push(await evaluate(cdp, `document.activeElement ? (document.activeElement.id || document.activeElement.getAttribute('data-theme-toggle') || document.activeElement.tagName + ':' + (document.activeElement.textContent||'').trim().slice(0,30)) : ''`));
  }
  if (new Set(visited.filter(Boolean)).size < 2) throw new Error(`${pathname}: keyboard focus did not advance through multiple controls`);

  const themeBefore = await evaluate(cdp, `(()=>{const b=document.querySelector('[data-theme-toggle]'); if(!b)return null; b.focus(); return b.getAttribute('aria-pressed')})()`);
  if (themeBefore !== null) {
    await dispatchKey(cdp, ' ', 'Space');
    const themeAfter = await evaluate(cdp, `document.querySelector('[data-theme-toggle]')?.getAttribute('aria-pressed') ?? null`);
    if (themeAfter === themeBefore) throw new Error(`${pathname}: theme control did not activate from the keyboard`);
  }

  const disclosure = await evaluate(cdp, `(()=>{const s=[...document.querySelectorAll('details > summary')].find((node)=>{const r=node.getBoundingClientRect();const style=getComputedStyle(node);return r.width>0&&r.height>0&&style.visibility!=='hidden'}); if(!s)return null; s.focus(); return s.parentElement.open})()`);
  if (disclosure !== null) {
    await dispatchKey(cdp, ' ', 'Space');
    await sleep(50);
    const disclosureAfter = await evaluate(cdp, `document.activeElement?.matches('details > summary') ? document.activeElement.parentElement.open : null`);
    if (disclosureAfter === disclosure) throw new Error(`${pathname}: disclosure did not activate from the keyboard`);
  }

  // Keep the locale selector last: its change handler intentionally navigates,
  // so subsequent checks would otherwise race the replacement document.
  const languageBefore = await evaluate(cdp, `(()=>{const s=document.querySelector('#global-language'); if(!s)return null; s.focus(); return s.selectedIndex})()`);
  if (languageBefore !== null) {
    const loaded = cdp.once('Page.loadEventFired', {
      label: `${pathname} language-selector load`,
      timeoutMs: 30_000,
    });
    await dispatchKey(cdp, 'ArrowDown', 'ArrowDown');
    await loaded;
    const languageAfter = await evaluate(cdp, `document.querySelector('#global-language')?.selectedIndex ?? null`);
    if (languageAfter === languageBefore) throw new Error(`${pathname}: language selector did not respond to keyboard navigation`);
  }
}

async function main() {
  const pages = publicPages();
  if (!pages.length) throw new Error('Expected application-wide public-page coverage, found no registered public pages');
  if (!pages.some((route) => route.id === 'demos.index')) throw new Error('Application-wide browser coverage is missing the consolidated demos route');
  for (const state of auditConfig.states) {
    const pathname = new URL(state.path, origin).pathname;
    if (!pages.some((route) => patternMatches(route.route, pathname))) {
      throw new Error(`Audit state '${state.name}' is not owned by a canonical public route: ${state.path}`);
    }
  }

  const wranglerBin = path.resolve('node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
  const wrangler = spawn(wranglerBin, [
    'dev',
    '--local',
    '--ip',
    '127.0.0.1',
    '--port',
    String(serverPort),
    '--var',
    `DEMO_SESSION_SECRET:${localSessionSecret}`,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
  });
  let wranglerError = '';
  wrangler.stderr.on('data', (chunk) => { wranglerError += String(chunk); });

  let chrome;
  let cdp;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wg-site-audit-'));
  try {
    await waitForUrl(`${origin}/`);
    const executable = chromeExecutable('test:site-accessibility');
    chrome = spawn(executable, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      '--window-size=1280,1000',
      'about:blank',
    ], { stdio: 'ignore' });
    await waitForUrl(`http://127.0.0.1:${debugPort}/json/version`);
    const target = await waitForPageTarget(debugPort);
    cdp = await CdpClient.connect(target.webSocketDebuggerUrl);
    await cdp.call('Page.enable');
    await cdp.call('Runtime.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });

    let browserPages = 0;
    let axeRuns = 0;
    for (const route of pages) {
      const pathname = routePath(route);
      for (const locale of ['en', 'ar']) {
        await inspectPath(cdp, pathname, locale, `${route.id} ${locale}`);
        browserPages += 1;
        axeRuns += 1;
      }
    }

    for (const state of auditConfig.states) {
      for (const locale of ['en', 'ar']) {
        await inspectPath(cdp, state.path, locale, `${state.name} ${locale}`);
        axeRuns += 1;
      }
    }

    await inspectPath(cdp, '/', 'en', 'home dark theme');
    axeRuns += 1;
    await evaluate(cdp, `(async()=>{
      document.documentElement.dataset.theme='light';
      await new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      await Promise.all(document.getAnimations().map((animation)=>animation.finished.catch(()=>{})));
      return true;
    })()`);
    await inspectCurrentPage(cdp, 'en', 'home light theme');
    axeRuns += 1;

    await workbenchInteractionAudit(cdp);
    axeRuns += 6;

    for (const pathname of auditConfig.narrowViewportPaths) {
      const isWorkbench = new URL(pathname, origin).pathname === manifest.find((route) => route.id === 'demos.index')?.route;
      for (const locale of isWorkbench ? ['en', 'ar'] : ['en']) {
        await cdp.call('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: true });
        await inspectPath(cdp, pathname, locale, `${pathname} ${locale} 320px`);
        if (isWorkbench) {
          const expectedId = new URL(pathname, origin).hash.slice(1) || 'd1';
          await assertWorkbenchState(cdp, expectedId, `${pathname} ${locale} narrow workbench`, `#${expectedId}`, locale);
          const reflow = await evaluate(cdp, `(()=>{
            const stage=document.querySelector('.demo-stage')?.getBoundingClientRect();
            const inspector=document.querySelector('.demo-inspector')?.getBoundingClientRect();
            const layout=document.querySelector('.demo-workbench-layout');
            return {stageBottom:stage?.bottom,inspectorTop:inspector?.top,columns:layout ? getComputedStyle(layout).gridTemplateColumns : ''};
          })()`);
          if (!(reflow.inspectorTop >= reflow.stageBottom - 1) || reflow.columns.trim().split(/\s+/).length !== 1) {
            throw new Error(`${pathname} ${locale}: inspector did not stack below the live demonstration (${JSON.stringify(reflow)})`);
          }
        }
        axeRuns += 1;
      }
    }
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });

    await cdp.call('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await navigate(cdp, `${origin}/`);
    if (!await evaluate(cdp, `matchMedia('(prefers-reduced-motion: reduce)').matches`)) throw new Error('Reduced-motion emulation did not activate');
    await cdp.call('Emulation.setEmulatedMedia', { media: 'screen', features: [] });

    await cdp.call('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'forced-colors', value: 'active' }] });
    await navigate(cdp, `${origin}/`);
    if (!await evaluate(cdp, `matchMedia('(forced-colors: active)').matches`)) throw new Error('Forced-colors emulation did not activate');
    await cdp.call('Emulation.setEmulatedMedia', { media: 'screen', features: [] });

    for (const pathname of auditConfig.keyboardPaths) await keyboardSmoke(cdp, pathname);

    console.log(`Site browser audit passed: ${pages.length} canonical public routes, ${browserPages} route/locale renders, ${auditConfig.states.length} explicit state fixtures, ${axeRuns} axe runs, one complete Demo Workbench interaction/history/locale audit, D1 CRUD/reset and R2 upload/preview/delete in English and Arabic, ${auditConfig.narrowViewportPaths.length} narrow reflow samples, and ${auditConfig.keyboardPaths.length} keyboard smoke samples.`);
    console.log('Automated accessibility result: no automatically detectable violation observed in the bounded Chromium/axe matrix. This is not WCAG conformance or AAA certification.');
  } catch (error) {
    if (wrangler.exitCode !== null) console.error(`wrangler exited ${wrangler.exitCode}: ${wranglerError.slice(-4000)}`);
    throw error;
  } finally {
    await cdp?.close();
    await terminateProcess(chrome);
    await terminateProcess(wrangler);
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
