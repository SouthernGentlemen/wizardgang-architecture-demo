import axeSource from 'axe-core/axe.min.js';
import { methodNotAllowed, withSecurityHeaders } from '../lib/http';

export type AccessibilityMode = 'accessible' | 'broken';

function accessibleApp(): string {
  return `<a class="skip" href="#content">Skip to tasks</a>
  <header><strong>Edge release workspace</strong><a href="#help">Help</a></header>
  <main id="content">
    <img class="product" alt="Abstract violet and lime deployment tiles" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='70'%3E%3Crect width='70' height='70' fill='%23a489ff'/%3E%3Crect x='50' y='20' width='70' height='50' fill='%23d9ff43'/%3E%3C/svg%3E">
    <h1>Review deployment tasks</h1>
    <form><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" value="engineer@example.com"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password"><button type="button" data-open>Sign in options</button></form>
    <section aria-labelledby="tasks-heading"><h2 id="tasks-heading">Release tasks</h2><ul><li draggable="true">Verify health check <span><button type="button">Move up</button><button type="button">Move down</button></span></li></ul></section>
    <p id="help"><a href="mailto:help@example.com">Get account help</a></p>
  </main>
  <footer>Keyboard, paste, and password-manager access remain available.</footer>
  <div class="overlay" data-overlay hidden><div role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">Sign-in options</h2><p>Use a passkey or your saved password.</p><button type="button" data-passkey>Use a passkey</button><button type="button" data-close>Close</button></div></div>`;
}

function brokenApp(): string {
  return `<div class="site-head"><b>Edge release workspace</b></div>
  <div class="content">
    <img class="product" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='70'%3E%3Crect width='70' height='70' fill='%23a489ff'/%3E%3Crect x='50' y='20' width='70' height='50' fill='%23d9ff43'/%3E%3C/svg%3E">
    <h1>Review deployment tasks</h1>
    <input name="email" type="email" value=""><input name="password" type="password" onpaste="return false"><p>Solve 9 × 7 before continuing.</p><div class="click-control" onclick="document.querySelector('[data-overlay]').hidden=false">Sign in options</div>
    <h3>Release tasks</h3><div draggable="true">Verify health check</div>
    <div class="tiny-controls"><button type="button" aria-label="Previous">‹</button><button type="button" aria-label="Next">›</button></div>
  </div>
  <div class="overlay" data-overlay hidden><div><h2>Options</h2><input placeholder="Code"><button type="button" onclick="this.closest('.overlay').hidden=true">×</button></div></div>
  <footer class="obscuring">No keyboard alternative</footer>`;
}

function labHtml(mode: AccessibilityMode): string {
  const broken = mode === 'broken';
  const app = broken ? brokenApp() : accessibleApp();
  // Wrangler loads the locked minified asset through its Text rule; Vitest's ESM
  // loader exposes the package object, whose `source` field contains the same text.
  const loadedAxe = axeSource as unknown as string | { source: string };
  const axe = (typeof loadedAxe === 'string' ? loadedAxe : loadedAxe.source).replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html${broken ? '' : ' lang="en"'}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${broken ? 'Broken' : 'Accessible'} WCAG teaching frame</title><style>
  *{box-sizing:border-box}body{margin:0;padding:1rem 1rem 5rem;background:#fff;color:#17151b;font:16px/1.5 system-ui,sans-serif}a{color:#174ea6}.skip{position:absolute;top:-80px}.skip:focus{top:.5rem}header,.site-head{display:flex;justify-content:space-between;gap:1rem;padding:.8rem;border-bottom:2px solid #29262e}main,.content{max-width:42rem;margin:1.25rem auto}.product{display:block;width:120px;height:70px;margin-bottom:1rem}form{display:grid;gap:.55rem;max-width:26rem}input,button,.click-control{min-height:44px;padding:.6rem;border:2px solid #4c4653;background:#fff;color:#17151b;font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,a:focus-visible,.click-control:focus-visible{outline:3px solid #005fcc;outline-offset:3px}li{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:.8rem;border:1px solid #777}footer{position:fixed;inset:auto 0 0;padding:.7rem 1rem;background:#17151b;color:#fff}.overlay{position:fixed;inset:0;display:grid;place-items:center;padding:1rem;background:rgb(0 0 0 / 65%)}.overlay[hidden]{display:none}.overlay>div{width:min(28rem,100%);padding:1.2rem;background:#fff;color:#17151b}.overlay button{margin-right:.5rem}
  ${broken ? '*:focus{outline:none!important}.site-head{color:#c5c5c5;background:#fff}.content input{display:block;margin:.2rem 0}.click-control{display:inline-block;min-height:0;border:0;color:#aaa;background:#fff;cursor:pointer}.tiny-controls{display:flex;gap:0}.tiny-controls button{min-width:18px;min-height:18px;padding:0}.obscuring{height:82px;background:#eee;color:#ddd}' : ''}
  @media(max-width:320px){body{padding-inline:.5rem}li{align-items:start;flex-direction:column}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
  </style></head><body data-mode="${mode}">${app}<script>${axe}</script><script>
  (()=>{
    const mode=${JSON.stringify(mode)};
    const open=document.querySelector('[data-open]');
    const overlay=document.querySelector('[data-overlay]');
    const close=document.querySelector('[data-close]');
    let returnFocus=null;
    if(open&&overlay&&close){
      open.addEventListener('click',()=>{returnFocus=open;overlay.hidden=false;close.focus()});
      close.addEventListener('click',()=>{overlay.hidden=true;returnFocus.focus()});
      overlay.addEventListener('keydown',(event)=>{
        if(event.key==='Escape'){overlay.hidden=true;returnFocus.focus();return}
        if(event.key!=='Tab')return;
        const controls=[...overlay.querySelectorAll('button,input,a[href]')];
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      });
    }
    const started=performance.now();
    axe.run(document,{resultTypes:['violations']}).then((result)=>{
      const rules=result.violations.map((item)=>({id:item.id,impact:item.impact||'minor',help:item.help}));
      parent.postMessage({type:'wg-accessibility-report',version:1,mode,rules,durationMs:Math.round(performance.now()-started)},'*');
    }).catch(()=>parent.postMessage({type:'wg-accessibility-report',version:1,mode,rules:[],durationMs:0,error:'scan unavailable'},'*'));
  })();
  </script></body></html>`;
}

export function accessibilityLabResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const mode: AccessibilityMode = new URL(request.url).searchParams.get('mode') === 'broken' ? 'broken' : 'accessible';
  const headers = withSecurityHeaders(new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  }));
  return new Response(labHtml(mode), { headers });
}
