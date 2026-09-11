import type { DemoDefinition, Env } from '../types';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { pageContent, referenceDetails, type PageContent } from '../ui/page';

const demo: DemoDefinition = {
  id: 'durable-objects',
  title: 'Durable Objects',
  group: 'Platform',
  sourcePath: 'src/demos/durable-objects.ts',
  summary: 'Send concurrent requests to one coordinated object and inspect serialized state.',
  proves: ['A named Durable Object owns the shared counter', 'Concurrent increments are serialized at the object boundary', 'D1 records audit evidence but does not hold the counter'],
  status: 'working',
  interfaces: [{ method: 'GET / POST', path: '/api/labs/durable-counter', description: 'Read or atomically increment the public coordinated counter.' }],
};

export function durableObjectsContent(env: Env): PageContent {
  const durableUrl = `${routeUrl('demos.index')}#durable-objects`;
  return pageContent(env, demo.title, `
  <section class="page-header lab-page-header"><h1>Durable Objects</h1><p class="lede">Compare one increment with a burst of concurrent Worker requests coordinated through one state owner.</p><div class="page-tools">${referenceDetails([
    { label: 'Route source', href: sourceUrl(env, 'src/demos/durable-objects.ts') },
    { label: 'Durable Object API', href: sourceUrl(env, 'src/api/durable.ts') },
    { label: 'Coordinator class', href: sourceUrl(env, 'src/durable/demo-coordinator.ts') },
    { label: 'Binding configuration', href: sourceUrl(env, 'wrangler.jsonc') },
  ])}</div></section>
  <section class="panel" aria-labelledby="proof-heading">
    <div class="lab-heading"><div><p class="eyebrow">Coordination proof</p><h2 id="proof-heading">Many requests, one state owner</h2></div><span class="badge" data-durable-current>Loading counter</span></div>
    <div class="durable-flow" aria-label="Ten requests enter one Durable Object and produce serialized state"><strong>10 concurrent requests</strong><span aria-hidden="true">→</span><strong>One Durable Object</strong><span aria-hidden="true">→</span><strong>Serialized state</strong><span aria-hidden="true">→</span><strong>Final count</strong></div>
    <div class="button-row"><button type="button" data-durable-run="1">Increment once</button><button class="button-primary" type="button" data-durable-run="10">Send 10 concurrent increments</button></div>
    <p class="subtle" data-durable-status role="status" aria-live="polite">Reading the public coordinated counter…</p>
    <dl class="durable-results"><dt>Starting count</dt><dd data-durable-start>—</dd><dt>Expected from this run</dt><dd data-durable-expected>—</dd><dt>Final count</dt><dd data-durable-final>—</dd><dt>Successful requests</dt><dd data-durable-success>—</dd><dt>Duration</dt><dd data-durable-duration>—</dd></dl>
    <details><summary>Inspect concurrent responses</summary><pre data-durable-raw>No run yet.</pre></details>
  </section>
  <script>(()=>{
    const status=document.querySelector('[data-durable-status]');const current=document.querySelector('[data-durable-current]');const buttons=[...document.querySelectorAll('[data-durable-run]')];const raw=document.querySelector('[data-durable-raw]');
    const read=async()=>{const response=await fetch('/api/labs/durable-counter',{headers:{accept:'application/json'}});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Counter unavailable');return Number(payload.counter)};
    const set=(name,value)=>{document.querySelector('[data-durable-'+name+']').textContent=String(value)};
    const load=async()=>{try{const count=await read();current.textContent='Current count '+count;status.textContent='Ready to coordinate requests.'}catch(error){current.textContent='Unavailable';status.textContent=String(error)}};
    buttons.forEach((button)=>button.addEventListener('click',async()=>{
      const requested=Number(button.dataset.durableRun);buttons.forEach((item)=>{item.disabled=true});status.textContent=requested===10?'Dispatching ten requests concurrently…':'Sending one request…';
      try{const start=await read();const started=performance.now();const responses=await Promise.allSettled(Array.from({length:requested},async()=>{const response=await fetch('/api/labs/durable-counter',{method:'POST',headers:{accept:'application/json'}});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Increment failed');return payload}));const duration=performance.now()-started;const successes=responses.filter((item)=>item.status==='fulfilled');const final=await read();const expected=start+successes.length;set('start',start);set('expected',expected);set('final',final);set('success',successes.length+' / '+requested);set('duration',duration.toFixed(1)+' ms');current.textContent='Current count '+final;raw.textContent=JSON.stringify(responses.map((item)=>item.status==='fulfilled'?item.value:{error:String(item.reason)}),null,2);if(successes.length!==requested)status.textContent='Some increments failed; the result is not presented as a complete coordination proof.';else if(final===expected)status.textContent=requested+' requests reached one object and produced the exact expected final count.';else status.textContent=requested+' requests succeeded. The shared public counter also changed during this run, so the final count includes other activity.'}catch(error){status.textContent='Coordination run unavailable. '+String(error)}finally{buttons.forEach((item)=>{item.disabled=false})}
    }));
    load();
  })()</script>`, { canonicalPath: durableUrl, description: demo.summary });
}

export default demo;
