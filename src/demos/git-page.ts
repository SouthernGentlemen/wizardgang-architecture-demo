import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

const cards = [
  ['branches', 'Branches', 'Default and recent repository branches.'],
  ['commits', 'Recent commits', 'Five commits from the configured default branch.'],
  ['openPullRequest', 'Open pull request', 'Most recently updated open pull request.'],
  ['mergedPullRequest', 'Merged pull request', 'Most recently merged pull request.'],
  ['actions', 'Actions runs', 'Recent workflow execution state and outcome.'],
  ['tags', 'Tags', 'Recent immutable source labels.'],
  ['release', 'Latest release', 'Latest published GitHub Release.'],
] as const;

const lifecycleStages = ['Change', 'Branch', 'Commit', 'Pull request', 'CI', 'Review gate', 'Merge', 'Tag', 'Release', 'Deploy', 'Health check', 'Live'];

export function renderGitDemo(env: Env): Response {
  const cardMarkup = cards.map(([key, title, description]) => `<article class="evidence-card" data-evidence-card="${key}"><p class="eyebrow">GitHub API</p><h2>${title}</h2><p>${description}</p><p class="subtle" data-evidence-status>Loading evidence…</p><div data-evidence-items></div></article>`).join('');
  const lifecycleMarkup = lifecycleStages.map((label) => `<span data-lifecycle-stage>${label}</span>`).join('');
  return shell(env, 'Git / GitHub', `
  <section class="page-header"><p class="eyebrow">Delivery &amp; Governance / /git</p><h1>Ship a real release, live.</h1><p class="lede">Create a controlled branch, commit, and open pull request in this repository; watch its real GitHub Actions jobs; then explicitly merge, tag, deploy, and verify the reviewed version.</p><div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/demos/git.ts')}">Route source</a>${referenceDetails([
    { label: 'Page source', href: sourceUrl(env, 'src/demos/git-page.ts') },
    { label: 'Lifecycle API', href: sourceUrl(env, 'src/api/git-demo.ts') },
    { label: 'Lifecycle workflow', href: sourceUrl(env, '.github/workflows/git-demo.yml') },
    { label: 'Change policy', href: sourceUrl(env, 'docs/CHANGE-MANAGEMENT.md') },
    { label: 'CI workflow', href: sourceUrl(env, '.github/workflows/ci.yml') },
    { label: 'Deploy workflow', href: sourceUrl(env, '.github/workflows/deploy.yml') },
  ])}</div></section>
  <section class="panel live-git-control" id="live-git-demo">
    <div class="lab-heading"><div><p class="eyebrow">Authenticated write path</p><h2>Run Live Git Demo</h2></div><span class="badge" data-live-stage>Connecting</span></div>
    <p>Choose the semantic version component. The existing demo-admin credentials authorize only this Worker request; GitHub credentials remain server-side managed secrets.</p>
    <div class="filters" data-live-controls>
      <label for="git-demo-bump">Version bump<select id="git-demo-bump"><option value="patch" selected>PATCH</option><option value="minor">MINOR</option><option value="major">MAJOR</option></select></label>
      <label for="git-demo-user">Admin user<input id="git-demo-user" name="username" autocomplete="username" maxlength="200"></label>
      <label for="git-demo-password">Admin password<input id="git-demo-password" name="password" type="password" autocomplete="current-password" maxlength="1000"></label>
      <button type="button" class="button-primary" data-live-start>Run Live Git Demo</button>
      <button type="button" data-live-release disabled>Merge &amp; Release</button>
    </div>
    <p class="subtle" data-live-message aria-live="polite">Checking for an active live release demonstration…</p>
  </section>
  <section class="panel live-git-lifecycle" aria-labelledby="live-lifecycle-title">
    <div class="lab-heading"><div><p class="eyebrow">Real repository lifecycle</p><h2 id="live-lifecycle-title">Live delivery state</h2></div><a class="text-link" data-live-primary-link hidden>Open in GitHub</a></div>
    <nav class="pipeline live-pipeline" aria-label="Live delivery pipeline">${lifecycleMarkup}</nav>
    <div class="lifecycle-facts">
      <article><span>Version</span><strong data-live-version>—</strong></article>
      <article><span>Branch</span><strong data-live-branch>—</strong></article>
      <article><span>Commit</span><strong data-live-commit>—</strong></article>
      <article><span>Pull request</span><strong data-live-pr>—</strong></article>
      <article><span>CI</span><strong data-live-ci>—</strong></article>
      <article><span>Production</span><strong data-live-production>—</strong></article>
    </div>
    <div class="workflow-columns">
      <article><h3>Pull-request CI jobs</h3><div data-ci-jobs><p class="subtle">Real job steps appear after GitHub creates the pull-request run.</p></div></article>
      <article><h3>Release &amp; deploy jobs</h3><div data-delivery-jobs><p class="subtle">Release jobs appear after the explicit merge gate.</p></div></article>
    </div>
  </section>
  <section class="panel" id="source-of-truth"><div class="lab-heading"><div><p class="eyebrow">Configured repository only</p><h2>Public source of truth</h2></div><button type="button" data-evidence-refresh>Refresh evidence</button></div><p data-evidence-meta aria-live="polite">Connecting to GitHub…</p></section>
  <span id="versioning" aria-hidden="true"></span><span id="branching" aria-hidden="true"></span><span id="actions" aria-hidden="true"></span><span id="releases" aria-hidden="true"></span>
  <div class="evidence-grid">${cardMarkup}</div>
  <section class="panel" id="environments"><div class="lab-heading"><div><p class="eyebrow">Repository control evidence</p><h2>Default-branch controls</h2></div><span class="badge" data-controls-state>Checking</span></div><div data-controls-detail><p class="subtle">Loading branch-protection visibility…</p></div></section>
  <script>
  (()=>{
    const q=(selector)=>document.querySelector(selector);
    const state={requestId:null,status:null,timer:null,checkingProduction:false};
    const symbols={completed:'✓',success:'✓',in_progress:'●',queued:'○',requested:'○',waiting:'○',pending:'○',failure:'×',failed:'×',cancelled:'×',skipped:'—',neutral:'—'};
    const text=(selector,value)=>{const node=q(selector);if(node)node.textContent=value??'—'};
    const shortSha=(value)=>value?String(value).slice(0,8):'—';
    const runState=(run)=>!run?'Queued':run.status==='completed'?(run.conclusion==='success'?'Passed':String(run.conclusion||'Failed')):run.status==='in_progress'?'Running':'Queued';
    const setLink=(node,value,label)=>{node.innerHTML='';if(!value){node.textContent='—';return}if(value.url){const link=document.createElement('a');link.href=value.url;link.textContent=label(value);node.append(link)}else node.textContent=label(value)};
    const credentialHeader=()=>{const username=q('#git-demo-user').value;const password=q('#git-demo-password').value;if(!username||!password)throw new Error('Enter the existing demo-admin user and password.');try{return 'Basic '+btoa(username+':'+password)}catch{return 'Basic '+btoa(unescape(encodeURIComponent(username+':'+password)))}};
    const message=(value,error=false)=>{const node=q('[data-live-message]');node.textContent=value;node.classList.toggle('error',error)};
    const describeError=(payload,status)=>payload?.detail||payload?.error||('Request failed with HTTP '+status+'.');
    const escape=(value)=>String(value).replace(/[&<>"']/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
    const attr=escape;
    const jobMarkup=(jobs,empty)=>{if(!jobs?.length)return '<p class="subtle">'+empty+'</p>';return jobs.map((job)=>'<section class="workflow-job"><h4><span class="job-symbol">'+(symbols[job.conclusion||job.status]||'○')+'</span>'+escape(job.name)+'</h4><ul>'+((job.steps||[]).map((step)=>'<li><span>'+(symbols[step.conclusion||step.status]||'○')+'</span><span>'+escape(step.name)+'</span></li>').join('')||'<li><span>○</span><span>Waiting for step data</span></li>')+'</ul>'+(job.url?'<a class="text-link" href="'+attr(job.url)+'">Open job</a>':'')+'</section>').join('')};
    const renderStages=(stages)=>{document.querySelectorAll('[data-lifecycle-stage]').forEach((node,index)=>{const stage=stages?.[index];node.className=stage?'stage-'+stage.state:'';if(stage)node.setAttribute('aria-label',stage.label+': '+stage.state)})};
    const checkProduction=async(status)=>{if(state.checkingProduction||status.stage!=='complete')return;state.checkingProduction=true;try{const [versionResponse,healthResponse]=await Promise.all([fetch('/version'),fetch('/health')]);const version=await versionResponse.json();const health=await healthResponse.json();const matches=version.version===status.targetVersion;const healthy=health.services?.worker==='operational';text('[data-live-production]',matches&&healthy?'v'+version.version+' LIVE':'Verification mismatch')}catch{text('[data-live-production]','Verification unavailable')}finally{state.checkingProduction=false}};
    const renderStatus=(status)=>{
      state.status=status;state.requestId=status.requestId||state.requestId;
      text('[data-live-stage]',status.stage);
      text('[data-live-version]',status.currentVersion&&status.targetVersion?status.currentVersion+' → '+status.targetVersion:status.currentVersion||status.targetVersion||'—');
      setLink(q('[data-live-branch]'),status.branch,(value)=>value.name);
      setLink(q('[data-live-commit]'),status.commit,(value)=>shortSha(value.sha)+' pushed');
      setLink(q('[data-live-pr]'),status.pullRequest?{...status.pullRequest,url:status.pullRequest.url}:null,(value)=>'PR #'+value.number+' '+String(value.state).toUpperCase());
      setLink(q('[data-live-ci]'),status.ci?.run,status.ci?.run?(value)=>runState(value):()=>status.pullRequest?'Queued':'—');
      renderStages(status.stages);
      q('[data-ci-jobs]').innerHTML=jobMarkup(status.ci?.jobs?.length?status.ci.jobs:status.controller?.jobs,'Real job steps appear after GitHub creates the controller or pull-request run.');
      q('[data-delivery-jobs]').innerHTML=jobMarkup(status.delivery?.jobs,'Release jobs appear after the explicit merge gate.');
      const primary=q('[data-live-primary-link]');const target=status.delivery?.releaseUrl||status.delivery?.releaseRun?.url||status.controller?.release?.url||status.pullRequest?.url||status.controller?.start?.url;
      if(target){primary.hidden=false;primary.href=target;primary.textContent=status.pullRequest?.state==='open'?'Open pull request':'Open in GitHub'}else primary.hidden=true;
      const start=q('[data-live-start]');const release=q('[data-live-release]');start.disabled=status.active;release.disabled=!status.releaseReady;
      release.textContent=status.targetVersion?'Merge & Release v'+status.targetVersion:'Merge & Release';
      if(status.stage==='idle')message('No live demo pull request is active. Choose a version bump to begin.');
      else if(status.stage==='review')message('CI passed. The pull request remains open until an authenticated operator selects Merge & Release.');
      else if(status.stage==='failed')message('A real GitHub run failed. Open the linked run for its exact logs; the Worker does not invent a success state.',true);
      else if(status.stage==='complete')message('Release v'+status.targetVersion+' completed. GitHub and production evidence are linked above.');
      else message('Live GitHub lifecycle is '+status.stage+'. Updates refresh every '+Math.round(status.pollAfterMs/100)/10+' seconds.');
      if(status.stage==='complete')checkProduction(status);else text('[data-live-production]',status.delivery?.releaseRun?runState(status.delivery.releaseRun):'—');
    };
    const schedule=(delay)=>{clearTimeout(state.timer);state.timer=setTimeout(loadStatus,delay)};
    const loadStatus=async()=>{try{const suffix=state.requestId?'?request_id='+encodeURIComponent(state.requestId):'';const response=await fetch('/__api/git/demo'+suffix,{headers:{accept:'application/json'}});const payload=await response.json();if(!response.ok)throw new Error(describeError(payload,response.status));renderStatus(payload);schedule(payload.pollAfterMs||60000)}catch(error){message('Live lifecycle unavailable. '+String(error),true);schedule(5000)}};
    const post=async(path,body)=>{const authorization=credentialHeader();const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{accept:'application/json','content-type':'application/json',authorization},body:JSON.stringify(body)});const payload=await response.json().catch(()=>({}));if(!response.ok){if(response.status===409&&payload.requestId){state.requestId=payload.requestId;loadStatus()}throw new Error(describeError(payload,response.status))}q('#git-demo-password').value='';state.requestId=payload.requestId||state.requestId;return payload};
    q('[data-live-start]').addEventListener('click',async(event)=>{const button=event.currentTarget;button.disabled=true;message('Authorizing and dispatching the controlled GitHub workflow…');try{const payload=await post('/__api/git/demo',{bump:q('#git-demo-bump').value});text('[data-live-version]',payload.currentVersion+' → '+payload.targetVersion);message('GitHub accepted the request. Waiting for the controlled branch and pull request…');loadStatus()}catch(error){message(String(error),true);button.disabled=Boolean(state.status?.active)}});
    q('[data-live-release]').addEventListener('click',async(event)=>{const button=event.currentTarget;const status=state.status;if(!status?.releaseReady||!status.pullRequest||!state.requestId)return;button.disabled=true;message('Authorizing merge and annotated release dispatch…');try{await post('/__api/git/demo/release',{pullRequest:status.pullRequest.number,requestId:state.requestId});message('GitHub accepted the merge and release request. Repository protections remain enforced.');loadStatus()}catch(error){message(String(error),true);button.disabled=!state.status?.releaseReady}});

    const labels={branches:['name','commit'],commits:['message','author','date'],openPullRequest:['title','author','head','base'],mergedPullRequest:['title','author','mergedAt'],actions:['name','event','status','conclusion','branch'],tags:['name','commit'],release:['name','tag','publishedAt']};
    const value=(item,key)=>item[key]===null||item[key]===undefined?'—':String(item[key]);
    const renderCard=(key,card)=>{const root=q('[data-evidence-card="'+key+'"]');if(!root)return;const status=root.querySelector('[data-evidence-status]');const items=root.querySelector('[data-evidence-items]');items.innerHTML='';status.textContent=card.status==='available'?card.items.length+' verified item'+(card.items.length===1?'':'s'):card.status==='empty'?'No matching public data.':'Evidence unavailable: '+(card.error||'GitHub request failed.');card.items.forEach((item)=>{const row=document.createElement('div');row.className='evidence-row';const link=item.url?document.createElement('a'):document.createElement('strong');link.textContent=value(item,labels[key][0]);if(item.url)link.href=item.url;row.append(link);const detail=document.createElement('p');detail.className='subtle';detail.textContent=labels[key].slice(1).map((field)=>value(item,field)).join(' · ');row.append(detail);items.append(row)})};
    const renderControls=(controls)=>{const status=q('[data-controls-state]');const detail=q('[data-controls-detail]');detail.innerHTML='';status.textContent=controls.status==='verified'?'Verified response':'Not publicly verifiable';if(controls.status==='verified'){const list=document.createElement('dl');Object.entries(controls.details||{}).forEach(([name,enabled])=>{const term=document.createElement('dt');term.textContent=name.replace(/([A-Z])/g,' $1');const definition=document.createElement('dd');definition.textContent=enabled?'Enabled':'Not shown enabled';list.append(term,definition)});detail.append(list)}else{const paragraph=document.createElement('p');paragraph.className='subtle';paragraph.textContent='GitHub did not expose branch-protection details to this read boundary. No protection claim is made.';detail.append(paragraph)}const link=document.createElement('a');link.href=controls.evidenceUrl;link.className='text-link';link.textContent=controls.status==='verified'?'View repository settings':'View repository change policy';detail.append(link)};
    const loadEvidence=async()=>{const meta=q('[data-evidence-meta]');meta.textContent='Loading bounded GitHub evidence…';try{const response=await fetch('/__api/git/evidence');const payload=await response.json();if(!response.ok)throw new Error(payload.error||'unavailable');Object.entries(payload.cards).forEach(([key,card])=>renderCard(key,card));renderControls(payload.controls);meta.textContent=payload.repository.fullName+' · default '+(payload.repository.defaultBranch||'unknown')+' · checked '+new Date(payload.generatedAt).toLocaleString()+' · '+(payload.partialFailures.length?payload.partialFailures.length+' partial failure(s)':'all public cards reached')}catch(error){meta.textContent='Evidence unavailable. '+String(error);document.querySelectorAll('[data-evidence-status]').forEach((node)=>node.textContent='Evidence unavailable.')}};
    q('[data-evidence-refresh]').addEventListener('click',()=>{document.querySelectorAll('[data-evidence-items]').forEach((node)=>node.innerHTML='');loadEvidence()});
    loadStatus();loadEvidence();
  })();
  </script>`, { activeRoute: '/git', cacheControl: 'no-store' });
}
