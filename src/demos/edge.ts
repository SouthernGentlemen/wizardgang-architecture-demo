import type { DemoDefinition, Env } from '../types';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { pageContent, referenceDetails, type PageContent } from '../ui/page';

const demo: DemoDefinition = {
  id: 'edge',
  title: 'Cloudflare Edge',
  group: 'Platform',
  sourcePath: 'src/demos/edge.ts',
  summary: 'Inspect which request facts arrive at the Worker, which facts Cloudflare derives at the edge, and which private data is excluded.',
  proves: ['Safe Cloudflare request context without client identifiers', 'Edge-delivered security and no-store response headers', 'Public-safe operational evidence'],
  status: 'working',
  interfaces: [{ method: 'GET', path: '/api/labs/edge', description: 'Inspect allowlisted edge and protocol context.' }],
};

export function edgeContent(env: Env): PageContent {
  const edgeUrl = `${routeUrl('demos.index')}#edge`;
  return pageContent(env, demo.title, `
  <section class="page-header lab-page-header"><h1>Cloudflare Edge</h1><p class="lede">Follow one request into the Worker and separate received values from edge-derived context and deliberately excluded private data.</p><div class="page-tools">${referenceDetails([
    { label: 'Route source', href: sourceUrl(env, 'src/demos/edge.ts') },
    { label: 'Runtime API', href: sourceUrl(env, 'src/api/runtime.ts') },
    { label: 'Cloudflare configuration', href: sourceUrl(env, 'wrangler.jsonc') },
  ])}</div></section>
  <section class="panel edge-request-flow" aria-labelledby="flow-heading">
    <div class="lab-heading"><div><p class="eyebrow">Executable proof</p><h2 id="flow-heading">Request → Cloudflare edge → Worker</h2></div><button class="button-primary" type="button" data-edge-run>Inspect this edge request</button></div>
    <p class="subtle" data-edge-status role="status" aria-live="polite">Run the inspection to categorize the public-safe response.</p>
    <div class="edge-evidence-grid">
      <article><p class="eyebrow">Received</p><h3>Request supplied</h3><dl data-edge-received><dt>Status</dt><dd>Waiting</dd></dl></article>
      <article><p class="eyebrow">Edge-derived</p><h3>Cloudflare supplied</h3><dl data-edge-derived><dt>Status</dt><dd>Waiting</dd></dl></article>
      <article><p class="eyebrow">Intentionally excluded</p><h3>Privacy boundary</h3><ul><li>Client IP address</li><li>Cookies</li><li>Authorization</li><li>Raw request headers</li></ul></article>
    </div>
    <details><summary>Inspect response</summary><pre data-edge-raw>No response yet.</pre></details>
  </section>
  <script>(()=>{
    const button=document.querySelector('[data-edge-run]');
    const status=document.querySelector('[data-edge-status]');
    const raw=document.querySelector('[data-edge-raw]');
    const render=(target,entries)=>{target.innerHTML='';for(const [label,value] of entries){const term=document.createElement('dt');term.textContent=label;const detail=document.createElement('dd');detail.textContent=value===null||value===undefined||value===''?'Not supplied':String(value);target.append(term,detail)}};
    button.addEventListener('click',async()=>{
      button.disabled=true;status.textContent='Inspecting the current request…';
      try{
        const response=await fetch('/api/labs/edge',{headers:{accept:'application/json'}});
        const payload=await response.json();
        raw.textContent=JSON.stringify(payload,null,2);
        if(!response.ok)throw new Error(payload.error||'Inspection failed');
        render(document.querySelector('[data-edge-received]'),[['Method',payload.request?.method],['Protocol',payload.request?.protocol],['Host',payload.request?.host],['Accepts',payload.request?.accepts]]);
        const edgeEntries=Object.entries(payload.edge||{}).map(([key,value])=>[key,value]);
        edgeEntries.push(['Cache policy',payload.delivery?.cacheControl||'no-store']);
        render(document.querySelector('[data-edge-derived]'),edgeEntries);
        status.textContent='Categorized the allowlisted response. Private request data remained excluded.';
      }catch(error){status.textContent='Inspection unavailable. '+String(error)}finally{button.disabled=false}
    });
  })()</script>`, { canonicalPath: edgeUrl, description: demo.summary });
}

export default demo;
