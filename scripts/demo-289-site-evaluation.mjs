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
import { assuranceReviewState, waitForAssuranceRecordPane } from './lib/demo-289-content-review.mjs';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync('docs/route-manifest.json', 'utf8'));
const auditConfig = JSON.parse(fs.readFileSync('config/site-audit-states.json', 'utf8'));
const port = Number(process.env.DEMO289_AUDIT_PORT || 8791);
const debugPort = Number(process.env.DEMO289_DEBUG_PORT || 9224);
const origin = `http://127.0.0.1:${port}`;
const demosPath = manifest.find((route) => route.id === 'demos.index')?.route;
const assurancePath = manifest.find((route) => route.id === 'assurance.index')?.route;
if (!demosPath) throw new Error('DEMO-289 could not resolve demos.index from the route manifest.');
if (!assurancePath) throw new Error('DEMO-289 could not resolve assurance.index from the route manifest.');

function elapsedMs(started) {
  return Math.round(Number(process.hrtime.bigint() - started) / 1e6);
}

function publicPages() {
  return manifest.filter((route) => route.kind === 'page' && route.visibility === 'public' && route.methods.includes('GET') && !route.route.includes(':'));
}

function localized(pathname, locale) {
  const url = new URL(pathname, origin);
  url.searchParams.set('lang', locale);
  return `${url.pathname}${url.search}${url.hash}`;
}

async function navigateForAudit(cdp, pathname, locale, phase) {
  await navigate(cdp, `${origin}${localized(pathname, locale)}`, {
    label: `DEMO-289 ${phase} navigation ${pathname} ${locale}`,
  });
  const url = new URL(pathname, origin);
  if (url.pathname !== demosPath) return;
  const expectedDemo = url.hash.slice(1) || 'd1';
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(cdp, `(()=>{const workbench=document.querySelector('[data-demo-workbench]');return workbench?.dataset.demoId===${JSON.stringify(expectedDemo)}&&workbench?.dataset.demoMounted==='true'&&document.querySelectorAll('[data-demo-panel] [data-demo-section]').length===1})()`, `DEMO-289 ${phase} workbench readiness ${pathname} ${locale}`);
    if (ready) return;
    await sleep(50);
  }
  throw new Error(`DEMO-289 ${phase} ${pathname} ${locale}: timed out waiting for ${expectedDemo} workbench presentation.`);
}

async function dispatchTab(cdp, shift = false) {
  const params = { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: shift ? 8 : 0 };
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
}

function recordFinding(findings, category, label, detail, expected = false) {
  const finding = {
    classification: expected ? 'expected/documented finding' : 'new/unrecorded regression',
    category,
    label,
    detail,
  };
  findings.push(finding);
  console.warn(`DEMO289 finding ${finding.classification}: ${JSON.stringify(finding)}`);
}

async function captureStep(findings, category, label, callback) {
  const started = process.hrtime.bigint();
  try {
    return { ok: true, value: await callback() };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    recordFinding(findings, category, label, detail, false);
    if (/timed out/i.test(detail)) throw new Error(`DEMO-289 ${category} ${label}: ${detail}`);
    return { ok: false, value: undefined };
  } finally {
    console.log(`DEMO-289 timing ${category} ${label}: ${elapsedMs(started)}ms`);
  }
}

function baseGeometryExpression() {
  return `(()=>{
    window.scrollTo({left:0,top:window.scrollY,behavior:'instant'});
    const viewport=window.innerWidth;
    const clientWidth=document.documentElement.clientWidth;
    const scrollWidth=document.documentElement.scrollWidth;
    const bodyScrollWidth=document.body.scrollWidth;
    const overflow=scrollWidth>viewport+1;
    const visible=(el)=>{const s=getComputedStyle(el);const r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&(r.width||r.height)};
    const clipped=[...document.querySelectorAll('button,select,input:not([type="hidden"]),textarea,summary,[role="button"],[role="tab"]')].filter((el)=>{
      if(!visible(el))return false; const r=el.getBoundingClientRect();
      return r.left < -1 || r.right > viewport + 1;
    }).map((el)=>el.id||el.getAttribute('role')||el.tagName).slice(0,12);
    const containedByHorizontalScroller=(el)=>{for(let parent=el.parentElement;parent&&parent!==document.body;parent=parent.parentElement){const overflowX=getComputedStyle(parent).overflowX;if(['auto','scroll','hidden','clip'].includes(overflowX))return true}return false};
    const protruding=[...document.querySelectorAll('body *')].filter((el)=>{
      if(!visible(el)||containedByHorizontalScroller(el))return false; const r=el.getBoundingClientRect();
      return r.left < -1 || r.right > viewport + 1;
    }).map((el)=>{const r=el.getBoundingClientRect();return {tag:el.tagName,id:el.id||'',className:typeof el.className==='string'?el.className.slice(0,120):'',left:Math.round(r.left*10)/10,right:Math.round(r.right*10)/10,width:Math.round(r.width*10)/10}}).slice(0,20);
    const d1Tabs=[...document.querySelectorAll('.d1-table-tabs button')].map((el)=>{const r=el.getBoundingClientRect();return {id:el.id,text:(el.textContent||'').trim().slice(0,80),minWidth:parseFloat(getComputedStyle(el).minWidth)||0,width:r.width,left:r.left,right:r.right}});
    const scrollbarWidth=viewport-clientWidth;
    const scrollbarAccountingOnly=overflow&&clipped.length===0&&protruding.length===0&&scrollbarWidth>0&&Math.abs((scrollWidth-viewport)-scrollbarWidth)<=1&&bodyScrollWidth===scrollWidth;
    return {overflow,scrollbarAccountingOnly,clipped,width:viewport,clientWidth,scrollWidth,bodyScrollWidth,scrollX:window.scrollX,protruding,d1Tabs};
  })()`;
}

function isDocumentedD1Reflow(pathname, zoom, value) {
  const sharedBoundary = pathname === demosPath
    && zoom === 400
    && value?.width === 320
    && value?.d1Tabs?.length === 2
    && value.d1Tabs.every((tab) => Math.abs(tab.minWidth - 145) < 0.5);
  if (!sharedBoundary) return false;
  const linuxDocumentOverflow = value.overflow === true
    && Math.abs((value.scrollWidth ?? 0) - 334) <= 1
    && value.clipped.every((id) => value.d1Tabs.some((tab) => tab.id === id));
  const macControlClipping = value.overflow === false
    && value.scrollWidth === value.width
    && value.clipped.length > 0
    && value.clipped.every((id) => value.d1Tabs.some((tab) => tab.id === id));
  return linuxDocumentOverflow || macControlClipping;
}

async function inspectGeometry(cdp, label, findings, context = {}) {
  const value = await evaluate(cdp, baseGeometryExpression());
  if ((value.overflow && !value.scrollbarAccountingOnly) || value.clipped.length) {
    const expected = isDocumentedD1Reflow(context.pathname, context.zoom, value);
    recordFinding(findings, 'reflow/clipping', label, value, expected);
  }
  return value;
}

async function runContrastAndTargets(cdp, label, findings) {
  const result = await evaluate(cdp, `(async()=>{
    ${axeSource}
    const contrastStarted=performance.now();
    const contrast=await axe.run(document,{runOnly:{type:'rule',values:['color-contrast']},resultTypes:['violations']});
    const contrastDurationMs=Math.round(performance.now()-contrastStarted);
    const targetStarted=performance.now();
    const targets=[...document.querySelectorAll('button,select,input:not([type="hidden"]),textarea,summary,[role="button"],[role="tab"]')].flatMap((el)=>{
      const s=getComputedStyle(el); const r=el.getBoundingClientRect();
      if(s.display==='none'||s.visibility==='hidden'||r.width===0||r.height===0)return [];
      return [{name:el.id||el.getAttribute('data-assurance-framework')||el.getAttribute('role')||el.tagName,width:r.width,height:r.height}];
    });
    const below24=targets.filter((t)=>t.width<24||t.height<24);
    const below44=targets.filter((t)=>t.width<44||t.height<44);
    const targetDurationMs=Math.round(performance.now()-targetStarted);
    return {contrast:contrast.violations.map((v)=>({id:v.id,nodes:v.nodes.length,targets:v.nodes.slice(0,5).flatMap((n)=>n.target)})),below24,below44:below44.length,total:targets.length,contrastDurationMs,targetDurationMs};
  })()`, `DEMO-289 axe/computed contrast and target-size calculation ${label}`);
  console.log(`DEMO-289 timing axe/computed contrast ${label}: ${result.contrastDurationMs}ms`);
  console.log(`DEMO-289 timing target-size calculation ${label}: ${result.targetDurationMs}ms`);
  if (result.contrast.length) recordFinding(findings, 'computed contrast', label, result.contrast, false);
  if (result.below24.length) recordFinding(findings, 'WCAG 2.5.8 target size', label, result.below24.slice(0,12), false);
  return result;
}

async function runTextSpacing(cdp, label, findings) {
  await evaluate(cdp, `(()=>{const style=document.createElement('style');style.id='demo289-text-spacing';style.textContent='*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';document.head.append(style);return true})()`);
  await new Promise((resolve) => setTimeout(resolve, 50));
  await inspectGeometry(cdp, `${label} text spacing`, findings);
}

async function runFocusAndTrap(cdp, label, findings) {
  await evaluate(cdp, `document.body.focus();document.activeElement?.blur();true`);
  const visited = [];
  let invisible = 0;
  const obscured = [];
  for (let i = 0; i < 32; i += 1) {
    await dispatchTab(cdp);
    const state = await evaluate(cdp, `(()=>{
      const el=document.activeElement;if(!el||el===document.body)return {id:'body',visible:false,obscured:false,offscreen:false};
      let r=el.getBoundingClientRect();
      if(r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight){el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});r=el.getBoundingClientRect()}
      const s=getComputedStyle(el);const visible=(parseFloat(s.outlineWidth||'0')>0&&s.outlineStyle!=='none')||s.boxShadow!=='none'||s.borderColor==='CanvasText';
      const left=Math.max(r.left,0);const right=Math.min(r.right,innerWidth);const top=Math.max(r.top,0);const bottom=Math.min(r.bottom,innerHeight);
      const offscreen=right-left<=1||bottom-top<=1;
      const points=offscreen?[]:[[.5,.5],[.15,.15],[.85,.15],[.15,.85],[.85,.85]].map(([px,py])=>[left+(right-left)*px,top+(bottom-top)*py]);
      const hits=points.map(([x,y])=>document.elementFromPoint(x,y));
      const exposed=hits.some((hit)=>!!hit&&(hit===el||el.contains(hit)));
      const id=el.id||el.getAttribute('href')||el.getAttribute('data-assurance-framework')||el.tagName;
      const order=[...document.querySelectorAll('*')].indexOf(el);
      return {id,order,visible,nestedFrame:el instanceof HTMLIFrameElement,obscured:offscreen||!exposed,offscreen,rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},hits:hits.map((hit)=>hit?.id||hit?.getAttribute?.('href')||hit?.tagName||null)};
    })()`);
    visited.push(state);
    if (state.id !== 'body' && !state.visible && !state.nestedFrame) invisible += 1;
    if (state.obscured) obscured.push(state);
  }
  const unique = new Set(visited.filter((state)=>state.id).map((state)=>`${state.order}:${state.id}`));
  if (unique.size < 4) recordFinding(findings, 'keyboard trap', label, { focusTargetsReached: unique.size, visited:visited.map((state)=>state.id) }, false);
  if (invisible) recordFinding(findings, 'focus visibility', label, { stepsWithoutVisibleIndicator: invisible }, false);
  if (obscured.length) recordFinding(findings, 'focus obscuring', label, obscured.slice(0,8), false);
  const before = visited.at(-1);
  await dispatchTab(cdp, true);
  const after = await evaluate(cdp, `(()=>{const el=document.activeElement;return {id:el?.id||el?.getAttribute?.('href')||el?.tagName||'',order:el?[...document.querySelectorAll('*')].indexOf(el):-1}})()`);
  const stayedAtNestedFrameBoundary = before.nestedFrame && after.id === 'IFRAME';
  if (before.order === after.order && unique.size > 1 && !stayedAtNestedFrameBoundary) recordFinding(findings, 'reverse keyboard traversal', label, { before:before.id, after:after.id, order:after.order }, false);
}

async function contentSnapshot(cdp, label, locale, expectedAssuranceHeading = null) {
  const snapshot = await evaluate(cdp, `(()=>{
    const headings=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h)=>({level:Number(h.tagName.slice(1)),text:(h.textContent||'').trim().replace(/\\s+/g,' ').slice(0,120)}));
    const links=[...document.querySelectorAll('a[href]')].map((a)=>({name:(a.getAttribute('aria-label')||a.textContent||'').trim().replace(/\\s+/g,' ').slice(0,160),href:a.getAttribute('href')}));
    const vague=links.filter((l)=>/^(here|more|details|source|open|read more)$/i.test(l.name));
    const byName=new Map();for(const link of links){const key=link.name.toLowerCase();if(!key)continue;const set=byName.get(key)||new Set();set.add(link.href);byName.set(key,set)}
    const ambiguous=[...byName.entries()].filter(([,set])=>set.size>1).map(([name,set])=>({name,hrefs:[...set]})).slice(0,12);
    const explicitLang=[...document.querySelectorAll('[lang]')].filter((el)=>el!==document.documentElement).length;
    const text=(document.querySelector('main')?.innerText||'').replace(/\\s+/g,' ').trim();
    const words=text.match(/[A-Za-z][A-Za-z'-]*/g)||[];const sentences=text.split(/[.!?]+/).filter((x)=>x.trim()).length||1;
    const abbreviations=[...new Set((text.match(/\\b[A-Z][A-Z0-9-]{1,9}\\b/g)||[]))].slice(0,30);
    return {headings,linkCount:links.length,vague,ambiguous,explicitLang,abbreviations,englishWords:words.length,avgSentenceWords:Number((words.length/sentences).toFixed(1))};
  })()`);
  console.log(`DEMO289 content-review ${label} ${locale}: ${JSON.stringify(snapshot)}`);
  if (expectedAssuranceHeading && !snapshot.headings.some((heading) => heading.text === expectedAssuranceHeading)) {
    const state = assuranceReviewState(label, origin, assurancePath);
    throw new Error(`DEMO-289 content review heading inventory is missing the selected assurance record heading "${expectedAssuranceHeading}": page=${state?.page ?? label} state=${state?.state ?? '(unknown)'} locale=${locale}.`);
  }
  if (snapshot.ambiguous.length) {
    const state = assuranceReviewState(label, origin, assurancePath);
    throw new Error(`DEMO-289 content review found repeated link accessible names with different destinations: page=${state?.page ?? label} state=${state?.state ?? '(default)'} locale=${locale} ambiguous=${JSON.stringify(snapshot.ambiguous)}.`);
  }
  return snapshot;
}

async function main() {
  const auditStarted = process.hrtime.bigint();
  const pages = publicPages();
  const scope = [...new Set([...pages.map((r)=>r.route), ...auditConfig.states.map((s)=>s.path)])];
  if (!scope.length) throw new Error('DEMO-289 found no public HTML scope.');
  console.log(`DEMO-289 evaluation start: ${scope.length} unique page/state paths, ${pages.length} canonical public pages, ${auditConfig.states.length} configured states, English and Arabic.`);

  const wranglerStarted = process.hrtime.bigint();
  const wrangler = spawn(path.resolve('node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler'), ['dev','--local','--ip','127.0.0.1','--port',String(port)], { stdio: ['ignore','pipe','pipe'], env: { ...process.env, NO_UPDATE_NOTIFIER: '1' } });
  let wranglerError='';wrangler.stderr.on('data',(chunk)=>{wranglerError+=String(chunk)});
  let chrome; let cdp;
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'wg-demo289-'));
  const enhancedTargetSummary=[];
  const findings=[];
  try {
    await waitForUrl(`${origin}/`);
    console.log(`DEMO-289 timing Wrangler startup: ${elapsedMs(wranglerStarted)}ms`);

    const chromeStarted = process.hrtime.bigint();
    chrome=spawn(chromeExecutable('DEMO-289 scripted evaluation'),['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'--window-size=1280,1000','about:blank'],{stdio:'ignore'});
    await waitForUrl(`http://127.0.0.1:${debugPort}/json/version`);
    console.log(`DEMO-289 timing Chrome startup: ${elapsedMs(chromeStarted)}ms`);

    const connectionStarted = process.hrtime.bigint();
    const target=await waitForPageTarget(debugPort);
    cdp=await CdpClient.connect(target.webSocketDebuggerUrl);
    await cdp.call('Page.enable', {}, { label: 'DEMO-289 page target Page.enable' });
    await cdp.call('Runtime.enable', {}, { label: 'DEMO-289 page target Runtime.enable' });
    console.log(`DEMO-289 timing page target connection: ${elapsedMs(connectionStarted)}ms`);

    for (const [pageIndex, pathname] of scope.entries()) {
      const pageStarted = process.hrtime.bigint();
      console.log(`DEMO-289 page ${pageIndex + 1}/${scope.length} start: ${pathname}`);
      for (const locale of ['en','ar']) {
        const localeStarted = process.hrtime.bigint();
        console.log(`DEMO-289 locale start: ${pathname} ${locale}`);
        await cdp.call('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},{label:`DEMO-289 viewport ${pathname} ${locale}`});
        const initialNavigation=await captureStep(findings,'navigation',`${pathname} ${locale}`,async()=>{
          await navigateForAudit(cdp, pathname, locale, 'initial');
          return true;
        });
        if (!initialNavigation.ok) continue;
        await captureStep(findings,'content snapshot',`${pathname} ${locale}`,async()=>{
          const assurancePane=await waitForAssuranceRecordPane(cdp, pathname, locale, { origin, assurancePath, evaluatePage: evaluate, sleep });
          return contentSnapshot(cdp,pathname,locale,assurancePane?.headingText ?? null);
        });
        const targets=await captureStep(findings,'contrast/target harness',`${pathname} ${locale}`,()=>runContrastAndTargets(cdp,`${pathname} ${locale}`,findings));
        if (targets.ok) enhancedTargetSummary.push({pathname,locale,below44:targets.value.below44,total:targets.value.total});
        await captureStep(findings,'keyboard/focus harness',`${pathname} ${locale}`,()=>runFocusAndTrap(cdp,`${pathname} ${locale}`,findings));

        const spacingNavigation=await captureStep(findings,'navigation',`${pathname} ${locale} text spacing`,async()=>{
          await navigateForAudit(cdp, pathname, locale, 'text-spacing');
          return true;
        });
        if (spacingNavigation.ok) await captureStep(findings,'text spacing harness',`${pathname} ${locale}`,()=>runTextSpacing(cdp,`${pathname} ${locale}`,findings));

        for (const [zoom,width] of [[200,640],[400,320]]) {
          await cdp.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},{label:`DEMO-289 ${zoom}% viewport ${pathname} ${locale}`});
          const zoomNavigation=await captureStep(findings,'navigation',`${pathname} ${locale} ${zoom}% zoom-equivalent`,async()=>{
            await navigateForAudit(cdp, pathname, locale, `${zoom}%`);
            return true;
          });
          if (!zoomNavigation.ok) continue;
          await captureStep(findings,'geometry harness',`${pathname} ${locale} ${zoom}% zoom-equivalent`,()=>inspectGeometry(cdp,`${pathname} ${locale} ${zoom}% zoom-equivalent`,findings,{pathname,locale,zoom}));
        }
        console.log(`DEMO-289 locale complete: ${pathname} ${locale} (${elapsedMs(localeStarted)}ms)`);
      }
      console.log(`DEMO-289 page ${pageIndex + 1}/${scope.length} complete: ${pathname} (${elapsedMs(pageStarted)}ms)`);
    }

    await cdp.call('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},{label:'DEMO-289 media sweep viewport'});
    for (const [pageIndex, pathname] of scope.entries()) {
      console.log(`DEMO-289 media page ${pageIndex + 1}/${scope.length}: ${pathname}`);
      await captureStep(findings,'reduced motion',pathname,async()=>{
        await cdp.call('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'prefers-reduced-motion',value:'reduce'}]},{label:`DEMO-289 reduced-motion emulation ${pathname}`});
        await navigateForAudit(cdp, pathname, 'en', 'reduced-motion');
        const reduced=await evaluate(cdp,`({matches:matchMedia('(prefers-reduced-motion: reduce)').matches,active:document.getAnimations().filter((a)=>a.playState==='running').length})`,`DEMO-289 reduced-motion evaluation ${pathname}`);
        if(!reduced.matches||reduced.active)recordFinding(findings,'reduced motion',pathname,reduced,false);
      });
      await captureStep(findings,'forced colors',pathname,async()=>{
        await cdp.call('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'forced-colors',value:'active'}]},{label:`DEMO-289 forced-colors emulation ${pathname}`});
        await navigateForAudit(cdp, pathname, 'en', 'forced-colors');
        const forced=await evaluate(cdp,`(()=>{const focusable=document.querySelector('a[href],button,select,input,summary,[tabindex]:not([tabindex="-1"])');focusable?.focus();const s=focusable?getComputedStyle(focusable):null;return {matches:matchMedia('(forced-colors: active)').matches,focusable:!!focusable,outline:s?.outlineStyle,border:s?.borderStyle}})()`,`DEMO-289 forced-colors evaluation ${pathname}`);
        if(!forced.matches||!forced.focusable)recordFinding(findings,'forced colors',pathname,forced,false);
      });
      await cdp.call('Emulation.setEmulatedMedia',{media:'screen',features:[]},{label:`DEMO-289 media reset ${pathname}`});
    }

    const expectedFindings=findings.filter((finding)=>finding.classification==='expected/documented finding');
    const unrecordedFindings=findings.filter((finding)=>finding.classification==='new/unrecorded regression');
    console.log(`DEMO-289 scripted WCAG browser evaluation completed across ${pages.length} canonical public pages and ${auditConfig.states.length} configured states, English and Arabic.`);
    console.log(`DEMO-289 target-size review: ${JSON.stringify(enhancedTargetSummary)}`);
    console.log(`DEMO-289 finding summary: ${JSON.stringify({expectedDocumented:expectedFindings,newUnrecorded:unrecordedFindings})}`);
    console.log('DEMO-289 methods: 320 CSS px, 200%/400% zoom-equivalent viewports, WCAG text spacing, rendered 24px target geometry with 44px enhanced-target inventory, computed axe contrast, keyboard trap/reverse traversal, focus visibility/obscuring, reduced motion, and forced colors. No screen reader was used.');
    console.log(`DEMO-289 evaluation complete: ${elapsedMs(auditStarted)}ms`);
    if (unrecordedFindings.length) throw new Error(`DEMO-289 found ${unrecordedFindings.length} new/unrecorded browser regression(s) after completing the full matrix.`);
  } catch (error) {
    if (wrangler.exitCode !== null) console.error(`wrangler exited ${wrangler.exitCode}: ${wranglerError.slice(-3000)}`);
    throw error;
  } finally {
    const teardownStarted = process.hrtime.bigint();
    await cdp?.close();
    await terminateProcess(chrome);
    await terminateProcess(wrangler);
    fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
    console.log(`DEMO-289 timing teardown: ${elapsedMs(teardownStarted)}ms`);
  }
}

main().catch((error)=>{console.error(error instanceof Error?error.stack:error);process.exit(1)});
