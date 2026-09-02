import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';

function repositoryName(env: Env): string {
  try {
    const url = new URL(env.GITHUB_REPO_URL);
    return url.hostname === 'github.com' ? url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '') : 'Configured GitHub repository';
  } catch {
    return 'Configured GitHub repository';
  }
}

export function renderWebhooksDemo(env: Env): Response {
  const repository = repositoryName(env);
  const sources = [
    ['Route definition', 'src/demos/webhooks.ts'],
    ['Webhook receiver', 'src/api/webhooks.ts'],
    ['Event contract', 'contracts/webhooks/events.json'],
    ['Signature and replay tests', 'tests/webhooks.test.ts'],
  ];
  return shell(env, 'Signed Webhooks', `
<section class="page-header lab-page-header webhook-page-header" id="webhooks">
  <p class="eyebrow">Interfaces / Webhooks</p>
  <h1>Signed Webhooks</h1>
  <p class="lede">Receive GitHub-shaped events, verify every trust condition, and inspect only the sanitized delivery evidence.</p>
  <div class="api-hero-badges"><span class="badge">HMAC-SHA256</span><span class="badge">GitHub</span><span class="badge">Replay protection</span><span class="badge">D1</span></div>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/webhooks.ts'))}">View source ↗</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'contracts/webhooks/events.json'))}">Event contract ↗</a></div>
</section>
<section class="webhook-connection" aria-labelledby="webhook-connection-heading">
  <div><p class="eyebrow">GitHub webhooks</p><h2 id="webhook-connection-heading">Connected receiver</h2></div><span class="badge badge-ok" data-webhook-state>Connecting</span>
  <dl><dt>Endpoint</dt><dd><code>https://demo.wizardgang.ai/v1/webhooks/github</code></dd><dt>Repository</dt><dd><a href="${escapeHtml(env.GITHUB_REPO_URL)}">${escapeHtml(repository)}</a></dd><dt>Supported</dt><dd class="webhook-tags"><span>push</span><span>pull_request</span><span>workflow_run</span><span>release</span><span>ping</span></dd></dl>
</section>
<section class="webhook-test panel" aria-labelledby="webhook-test-heading">
  <div class="webhook-section-heading"><div><p class="eyebrow">Executable proof</p><h2 id="webhook-test-heading">Send a test event</h2><p>Generate a GitHub-shaped payload. The Worker signs it server-side and sends it through the same verifier and persistence path as a configured GitHub delivery.</p></div><button class="button-primary" type="button" data-webhook-send>Generate signed event</button></div>
  <ol class="webhook-pipeline" aria-label="Webhook verification stages"><li><span>1</span><strong>Payload received</strong></li><li><span>2</span><strong>Signature valid</strong></li><li><span>3</span><strong>Repository allowed</strong></li><li><span>4</span><strong>Delivery unique</strong></li><li><span>5</span><strong>Event allowed</strong></li><li><span>6</span><strong>Summary stored</strong></li></ol>
</section>
<section class="webhook-deliveries" aria-labelledby="webhook-deliveries-heading">
  <div class="webhook-section-heading"><div><p class="eyebrow">Sanitized D1 history</p><h2 id="webhook-deliveries-heading">Verified deliveries</h2><p class="subtle" data-webhook-meta aria-live="polite">Loading verified deliveries…</p></div><button type="button" data-webhook-reset>Reset my synthetic events</button></div>
  <div class="webhook-events" data-webhook-events></div>
</section>
<section class="related-interfaces" aria-labelledby="webhook-related-heading"><p class="eyebrow">Application interfaces</p><h2 id="webhook-related-heading">Related interfaces</h2><nav class="resource-list" aria-label="Related application interfaces"><a href="/api"><strong>REST API →</strong><code>/api</code></a><a href="/graphql"><strong>GraphQL →</strong><code>/graphql</code></a><a href="/mcp"><strong>MCP →</strong><code>/mcp</code></a><a href="/identity"><strong>Identity →</strong><code>/identity</code></a></nav></section>
<details class="implementation-notes"><summary>Implementation details</summary><div class="reference-links">${sources.map(([label, path]) => `<a href="${escapeHtml(sourceUrl(env, path))}">${escapeHtml(label)}</a>`).join('')}</div></details>
<script>
(()=>{
  const list=document.querySelector('[data-webhook-events]');
  const state=document.querySelector('[data-webhook-state]');
  const meta=document.querySelector('[data-webhook-meta]');
  let lastFingerprint='';
  const render=(payload)=>{
    const events=Array.isArray(payload.events)?payload.events:[];
    const fingerprint=JSON.stringify(events.map((event)=>[event.id,event.receivedAt]));
    if(fingerprint===lastFingerprint)return;
    lastFingerprint=fingerprint;list.innerHTML='';
    if(!events.length){const empty=document.createElement('div');empty.className='webhook-empty';empty.innerHTML='<strong>No verified deliveries yet</strong><span>Generate a signed event to run the complete validation path.</span>';list.append(empty)}
    events.forEach((event)=>{
      const card=document.createElement('article');card.className='webhook-event';
      const heading=document.createElement('div');heading.className='lab-heading';
      const title=document.createElement('h3');title.textContent=String(event.eventType||'event');
      const badge=document.createElement('span');badge.className='badge badge-ok';badge.textContent='Verified · '+String(event.provider||'unknown');
      heading.append(title,badge);
      const detail=document.createElement('p');detail.className='subtle';detail.textContent=[event.action,event.actor,event.repository,event.receivedAt].filter(Boolean).join(' · ');
      const checks=document.createElement('div');checks.className='webhook-event-checks';['Signature valid','Repository allowed','Delivery unique','Event allowed','Sanitized'].forEach((label)=>{const item=document.createElement('span');item.textContent='✓ '+label;checks.append(item)});
      const summary=document.createElement('details');summary.innerHTML='<summary>Sanitized event summary</summary><pre></pre>';summary.querySelector('pre').textContent=JSON.stringify(event.summary||{},null,2);
      card.append(heading,detail,checks,summary);list.append(card);
    });
    meta.textContent=events.length+' verified deliver'+(events.length===1?'y':'ies')+' · polling every '+payload.pollingIntervalMs+' ms · '+payload.repository;
  };
  const refresh=async()=>{try{const response=await fetch('/__api/webhooks/events');if(!response.ok)throw new Error('unavailable');render(await response.json());state.textContent='Connected';state.classList.add('badge-ok')}catch{state.textContent='Unavailable';state.classList.remove('badge-ok');meta.textContent='Verified delivery evidence is unavailable.'}};
  const mutate=async(path)=>{state.textContent='Working';const response=await fetch(path,{method:'POST'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'request failed');lastFingerprint='';await refresh()};
  document.querySelector('[data-webhook-send]').addEventListener('click',async(event)=>{event.currentTarget.disabled=true;try{await mutate('/__api/webhooks/demo')}catch(error){state.textContent='Failed';meta.textContent=String(error)}finally{event.currentTarget.disabled=false}});
  document.querySelector('[data-webhook-reset]').addEventListener('click',async()=>{try{await mutate('/__api/webhooks/reset')}catch(error){state.textContent='Failed';meta.textContent=String(error)}});
  refresh();setInterval(()=>{if(document.visibilityState==='visible')refresh()},2000);
})();
</script>`, { activeRoute: '/webhooks', description: 'Verify signed GitHub-compatible webhooks and inspect replay-protected delivery evidence.', cacheControl: 'no-store' });
}
