import type { DemoDefinition, Env } from '../types';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { pageContent, referenceDetails, type PageContent } from '../ui/page';

const demo: DemoDefinition = {
  id: 'workers',
  title: 'Cloudflare Workers',
  group: 'Platform',
  sourcePath: 'src/demos/workers.ts',
  summary: 'Change request properties and discover the real edge routing and cache policy.',
  proves: ['A Worker inspects method, path, and credentials at the edge', 'Cacheability and routing are decided before origin work', 'The policy is stateless'],
  status: 'working',
  interfaces: [{ method: 'POST', path: '/api/labs/workers', description: 'Apply an edge cache and routing policy to a request.' }],
};

export function workersContent(env: Env): PageContent {
  const workersUrl = `${routeUrl('demos.index')}#workers`;
  return pageContent(env, demo.title, `
  <section class="page-header lab-page-header"><h1>Cloudflare Workers</h1><p class="lede">Change a request and let the live Worker explain its routing, caching, and origin-work decision.</p><div class="page-tools">${referenceDetails([
    { label: 'Route source', href: sourceUrl(env, 'src/demos/workers.ts') },
    { label: 'Runtime policy', href: sourceUrl(env, 'src/api/runtime.ts') },
    { label: 'Worker entry point', href: sourceUrl(env, 'src/index.ts') },
  ])}</div></section>
  <section class="panel" aria-labelledby="policy-heading">
    <p class="eyebrow">Interactive policy explorer</p><h2 id="policy-heading">Compose a request</h2>
    <form class="lab-form worker-policy-form" data-worker-policy>
      <label>Method<select name="method"><option>GET</option><option>POST</option></select></label>
      <label>Resource<select name="resource"><option value="asset">Static asset</option><option value="dynamic">Dynamic route</option></select></label>
      <label class="worker-policy-check"><input type="checkbox" name="cookie"> Cookie present</label>
      <label class="worker-policy-check"><input type="checkbox" name="authorization"> Authorization present</label>
      <div class="button-row"><button class="button-primary" type="submit">Apply edge request policy</button></div>
    </form>
    <p class="subtle" data-worker-status role="status" aria-live="polite">Choose request properties, then run the real policy.</p>
    <div class="worker-decision-grid" data-worker-result hidden>
      <article><span>Cacheable?</span><strong data-worker-cacheable>—</strong></article>
      <article><span>Route</span><strong data-worker-route>—</strong></article>
      <article><span>Origin work</span><strong data-worker-origin>—</strong></article>
    </div>
    <p data-worker-reason></p>
    <details><summary>Inspect request and response</summary><pre data-worker-raw>No response yet.</pre></details>
  </section>
  <script>(()=>{
    const form=document.querySelector('[data-worker-policy]');
    const status=document.querySelector('[data-worker-status]');
    const result=document.querySelector('[data-worker-result]');
    const reason=document.querySelector('[data-worker-reason]');
    const raw=document.querySelector('[data-worker-raw]');
    form.addEventListener('submit',async(event)=>{
      event.preventDefault();const data=new FormData(form);const resource=String(data.get('resource'));const request={method:String(data.get('method')),path:resource==='asset'?'/assets/architecture-map.svg':'/app/dashboard',hasCookie:data.has('cookie'),hasAuthorization:data.has('authorization')};
      const submit=form.querySelector('[type="submit"]');submit.disabled=true;status.textContent='Applying the edge policy…';
      try{const response=await fetch('/api/labs/workers',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({operation:'edge-policy',request})});const payload=await response.json();raw.textContent=JSON.stringify(payload,null,2);if(!response.ok)throw new Error(payload.message||payload.error||'Policy unavailable');result.hidden=false;document.querySelector('[data-worker-cacheable]').textContent=payload.decision.cache==='public'?'YES':'NO';document.querySelector('[data-worker-route]').textContent=String(payload.decision.route).toUpperCase();document.querySelector('[data-worker-origin]').textContent=payload.decision.originRequired?'REQUIRED':'SKIPPED';reason.textContent=payload.reason;status.textContent='The stateless Worker returned its decision.'}catch(error){status.textContent='Policy unavailable. '+String(error)}finally{submit.disabled=false}
    });
  })()</script>`, { canonicalPath: workersUrl, description: demo.summary });
}

export default demo;
