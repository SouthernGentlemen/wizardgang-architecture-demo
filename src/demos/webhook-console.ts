import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { routeUrl } from '../routing/application-routes';
import { pageContent, type PageContent } from '../ui/page';

function repositoryName(env: Env): string {
  try {
    const url = new URL(env.GITHUB_REPO_URL);
    return url.hostname === 'github.com' ? url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '') : 'Configured GitHub repository';
  } catch {
    return 'Configured GitHub repository';
  }
}

export function webhooksContent(env: Env): PageContent {
  const repository = repositoryName(env);
  const webhooksUrl = `${routeUrl('demos.index')}#webhooks`;
  return pageContent(env, 'Signed Webhooks', `
<section class="page-header lab-page-header webhook-page-header" id="webhooks">
  <h1>Signed Webhooks</h1>
  <p class="lede">Receive a release notification, verify it like a GitHub delivery, and inspect the sanitized result.</p>
</section>
<section class="webhook-connection" aria-labelledby="webhook-connection-heading">
  <div><p class="eyebrow">GitHub webhooks</p><h2 id="webhook-connection-heading">Connected receiver</h2></div><span class="badge badge-ok" data-webhook-state>Connecting</span>
  <dl><dt>Endpoint</dt><dd><code>https://demo.wizardgang.ai/webhooks/github</code></dd><dt>Repository</dt><dd><a href="${escapeHtml(env.GITHUB_REPO_URL)}">${escapeHtml(repository)}</a></dd><dt>Supported</dt><dd class="webhook-tags"><span>push</span><span>pull_request</span><span>workflow_run</span><span>release</span><span>ping</span></dd></dl>
</section>
<section class="webhook-test panel" aria-labelledby="webhook-test-heading">
  <div class="webhook-section-heading"><div><p class="eyebrow">Executable proof</p><h2 id="webhook-test-heading">Simulate a signed release webhook</h2><p>Uses the current release as realistic <code>release.published</code> event data. The Worker signs it, then sends it through the same verifier and persistence path as a configured GitHub delivery.</p></div><button class="button-primary" type="button" data-webhook-send>Simulate signed release webhook</button></div>
  <ol class="webhook-pipeline" aria-label="Webhook verification stages"><li data-webhook-stage data-state="idle"><span>1</span><strong>Payload received</strong></li><li data-webhook-stage data-state="idle"><span>2</span><strong>Signature valid</strong></li><li data-webhook-stage data-state="idle"><span>3</span><strong>Repository allowed</strong></li><li data-webhook-stage data-state="idle"><span>4</span><strong>Delivery unique</strong></li><li data-webhook-stage data-state="idle"><span>5</span><strong>Event allowed</strong></li><li data-webhook-stage data-state="idle"><span>6</span><strong>Summary stored</strong></li></ol>
</section>
<section class="webhook-deliveries" aria-labelledby="webhook-deliveries-heading">
  <div class="webhook-section-heading"><div><p class="eyebrow">Sanitized D1 history</p><h2 id="webhook-deliveries-heading">Verified deliveries</h2><p class="subtle" data-webhook-meta aria-live="polite">Loading verified deliveries…</p></div><button type="button" data-webhook-reset>Reset my synthetic events</button></div>
  <div class="webhook-events" data-webhook-events></div>
</section>
<script>
(()=>{
  const list=document.querySelector('[data-webhook-events]');
  const state=document.querySelector('[data-webhook-state]');
  const meta=document.querySelector('[data-webhook-meta]');
  let lastFingerprint='';
  const stages=[...document.querySelectorAll('[data-webhook-stage]')];
  const setStages=(value)=>stages.forEach((stage)=>{stage.dataset.state=value});
  const render=(payload)=>{
    const events=Array.isArray(payload.events)?payload.events:[];
    const fingerprint=JSON.stringify(events.map((event)=>[event.id,event.receivedAt]));
    if(fingerprint===lastFingerprint)return;
    lastFingerprint=fingerprint;list.innerHTML='';
    if(!events.length){const empty=document.createElement('div');empty.className='webhook-empty';empty.innerHTML='<strong>No release deliveries yet</strong><span>Simulate a signed release webhook to run the complete validation path.</span>';list.append(empty)}
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
  const refresh=async()=>{try{const response=await fetch('/api/labs/webhook-events');if(!response.ok)throw new Error('unavailable');render(await response.json());state.textContent='Connected';state.classList.add('badge-ok')}catch{state.textContent='Unavailable';state.classList.remove('badge-ok');meta.textContent='Verified delivery evidence is unavailable.'}};
  const mutate=async(path)=>{state.textContent='Working';const response=await fetch(path,{method:'POST'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'request failed');lastFingerprint='';await refresh()};
  const sendButton=document.querySelector('[data-webhook-send]');
  sendButton.addEventListener('click',async()=>{sendButton.disabled=true;setStages('pending');try{await mutate('/api/labs/webhook-demo');setStages('complete')}catch(error){setStages('failed');state.textContent='Failed';meta.textContent=String(error)}finally{sendButton.disabled=false}});
  document.querySelector('[data-webhook-reset]').addEventListener('click',async()=>{try{await mutate('/api/labs/webhook-reset')}catch(error){state.textContent='Failed';meta.textContent=String(error)}});
  refresh();setInterval(()=>{if(document.visibilityState==='visible')refresh()},2000);
})();
</script>`, { canonicalPath: webhooksUrl, description: 'Verify signed GitHub-compatible webhooks and inspect replay-protected delivery evidence.', cacheControl: 'no-store' });
}
