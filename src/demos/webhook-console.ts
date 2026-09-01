export function webhookConsole(): string {
  return `<section class="api-heading" id="webhooks" aria-labelledby="webhooks-heading"><div><p class="eyebrow">GitHub-compatible / near-live</p><h2 id="webhooks-heading">Verified webhook viewer</h2></div><span class="badge" data-webhook-state>Connecting</span></section>
  <section class="panel"><p>Generate a GitHub-shaped, server-signed visitor event or connect the configured repository to <code>POST /v1/webhooks/github</code>. Only verified, allowlisted, sanitized summaries are stored; raw payloads and signing secrets are never displayed.</p>
  <div class="button-row"><button class="button-primary" type="button" data-webhook-send>Generate signed event</button><button type="button" data-webhook-reset>Reset my synthetic events</button></div>
  <p class="subtle" data-webhook-meta aria-live="polite">Loading verified deliveries…</p><div class="webhook-events" data-webhook-events></div></section>
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
      if(!events.length){const empty=document.createElement('p');empty.className='subtle';empty.textContent='No verified deliveries yet.';list.append(empty)}
      events.forEach((event)=>{
        const card=document.createElement('article');card.className='webhook-event';
        const heading=document.createElement('div');heading.className='lab-heading';
        const title=document.createElement('h3');title.textContent=String(event.eventType||'event');
        const badge=document.createElement('span');badge.className='badge '+(event.provider==='github'?'badge-ok':'');badge.textContent=String(event.provider||'unknown');
        heading.append(title,badge);
        const detail=document.createElement('p');detail.className='subtle';detail.textContent=[event.action,event.actor,event.repository,event.receivedAt].filter(Boolean).join(' · ');
        const summary=document.createElement('pre');summary.textContent=JSON.stringify(event.summary||{},null,2);
        card.append(heading,detail,summary);list.append(card);
      });
      meta.textContent=events.length+' verified deliver'+(events.length===1?'y':'ies')+' · polling every '+payload.pollingIntervalMs+' ms · '+payload.repository;
    };
    const refresh=async()=>{try{const response=await fetch('/__api/webhooks/events');if(!response.ok)throw new Error('unavailable');render(await response.json());state.textContent='Live polling'}catch{state.textContent='Unavailable';meta.textContent='Verified delivery evidence is unavailable.'}};
    const mutate=async(path)=>{state.textContent='Working';const response=await fetch(path,{method:'POST'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'request failed');lastFingerprint='';await refresh()};
    document.querySelector('[data-webhook-send]').addEventListener('click',async()=>{try{await mutate('/__api/webhooks/demo')}catch(error){state.textContent='Failed';meta.textContent=String(error)}});
    document.querySelector('[data-webhook-reset]').addEventListener('click',async()=>{try{await mutate('/__api/webhooks/reset')}catch(error){state.textContent='Failed';meta.textContent=String(error)}});
    refresh();setInterval(()=>{if(document.visibilityState==='visible')refresh()},2000);
  })();
  </script>`;
}
