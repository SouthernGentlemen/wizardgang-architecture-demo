import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

const cards = [
  ['github.branches', 'Branches', 'Configured repository branches from the registered GitHub source.'],
  ['github.commits', 'Recent commits', 'Native commit objects from the configured default branch.'],
  ['github.pull-requests', 'Pull requests', 'Native open and closed pull requests with provider state unchanged.'],
  ['github.workflow-runs', 'Actions runs', 'Native workflow runs and current attempt numbers.'],
  ['github.retained-reports', 'Retained reports', 'Canonical CI and assurance-monitor reports retained on the assurance-reports branch.'],
  ['github.workflow-artifacts', 'Transient artifacts', 'Workflow artifact metadata, including GitHub expiration state.'],
  ['github.tags', 'Tags', 'Native repository tags and target revisions.'],
  ['github.releases', 'Releases', 'Native GitHub Releases and their tag bindings.'],
] as const;

const lifecycleStages = ['Change', 'Branch', 'Commit', 'Pull request', 'CI', 'Review gate', 'Merge', 'Tag', 'Release', 'Deploy', 'Health check', 'Live'];

export function renderGitDemo(env: Env): Response {
  const cardMarkup = cards.map(([key, title, description]) => `<article class="evidence-card" data-evidence-card="${key}"><p class="eyebrow">Registered GitHub source</p><h2>${title}</h2><p>${description}</p><p class="subtle" data-evidence-status>Loading source…</p><div data-evidence-items></div></article>`).join('');
  const lifecycleMarkup = lifecycleStages.map((label) => `<span data-lifecycle-stage>${label}</span>`).join('');
  return shell(env, 'Git / GitHub', `
  <section class="page-header"><p class="eyebrow">Delivery &amp; Governance / /git</p><h1>Ship a real release, live.</h1><p class="lede">Create a controlled branch, commit, and open pull request in this repository; watch its real GitHub Actions jobs; then explicitly merge, tag, deploy, and verify the reviewed version.</p><div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/demos/git.ts')}">Route source</a>${referenceDetails([
    { label: 'Page source', href: sourceUrl(env, 'src/demos/git-page.ts') },
    { label: 'Lifecycle API', href: sourceUrl(env, 'src/api/git-demo.ts') },
    { label: 'Reporting provider', href: sourceUrl(env, 'src/reporting/github.ts') },
    { label: 'Reporting registry', href: sourceUrl(env, 'assurance/registry.json') },
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
    <div class="workflow-feed" aria-label="GitHub Actions live feed">
      <div class="workflow-feed-heading">
        <div><p class="eyebrow">GitHub Actions API</p><h3>Checks and jobs</h3></div>
        <div class="workflow-feed-connection" data-feed-state="idle"><span aria-hidden="true"></span><strong data-feed-cadence>Idle</strong><small data-feed-sync>Waiting for GitHub</small></div>
      </div>
      <section class="workflow-lane" aria-labelledby="pull-request-checks-title">
        <header><div><p class="eyebrow">Change &amp; pull request</p><h3 id="pull-request-checks-title">Checks</h3></div><span class="check-summary" data-ci-summary>Waiting</span></header>
        <div class="workflow-job-list" data-ci-jobs><p class="workflow-empty">Real job steps appear after GitHub creates the controller or pull-request run.</p></div>
      </section>
      <section class="workflow-lane" aria-labelledby="delivery-jobs-title">
        <header><div><p class="eyebrow">Merge, release &amp; deploy</p><h3 id="delivery-jobs-title">Jobs</h3></div><span class="check-summary" data-delivery-summary>Waiting</span></header>
        <div class="workflow-job-list" data-delivery-jobs><p class="workflow-empty">Release jobs appear after the explicit merge gate.</p></div>
      </section>
    </div>
  </section>
  <section class="panel" id="source-of-truth"><div class="lab-heading"><div><p class="eyebrow">Shared reporting contract</p><h2>GitHub source of truth</h2></div><button type="button" data-evidence-refresh>Refresh evidence</button></div><p>Each row is either a provider-native GitHub object or a canonical retained report derived from provider outcomes. This page intentionally requests a bounded sample; source completeness and provider availability are shown explicitly instead of presenting the sample as an export.</p><p data-evidence-meta aria-live="polite">Connecting to GitHub…</p></section>
  <span id="versioning" aria-hidden="true"></span><span id="branching" aria-hidden="true"></span><span id="actions" aria-hidden="true"></span><span id="releases" aria-hidden="true"></span>
  <div class="evidence-grid">${cardMarkup}</div>
  <section class="panel" id="environments"><div class="lab-heading"><div><p class="eyebrow">Native repository control object</p><h2>Default-branch controls</h2></div><span class="badge" data-controls-state>Not publicly verifiable</span></div><div data-controls-detail><p class="subtle">Loading branch-protection source…</p></div></section>
  <script>
  (()=>{
    const q=(selector)=>document.querySelector(selector);
    const state={requestId:null,status:null,timer:null,checkingProduction:false,feedStores:new WeakMap()};
    const symbols={completed:'✓',success:'✓',in_progress:'●',queued:'○',requested:'○',waiting:'○',pending:'○',failure:'×',failed:'×',cancelled:'×',skipped:'—',neutral:'—'};
    const text=(selector,value)=>{const node=q(selector);if(node)node.textContent=value??'—'};
    const shortSha=(value)=>value?String(value).slice(0,8):'—';
    const runState=(run)=>!run?'Queued':run.status==='completed'?(run.conclusion==='success'?'Passed':String(run.conclusion||'Failed')):run.status==='in_progress'?'Running':'Queued';
    const setLink=(node,value,label)=>{node.innerHTML='';if(!value){node.textContent='—';return}if(value.url){const link=document.createElement('a');link.href=value.url;link.textContent=label(value);node.append(link)}else node.textContent=label(value)};
    const credentialHeader=()=>{const username=q('#git-demo-user').value;const password=q('#git-demo-password').value;if(!username||!password)throw new Error('Enter the existing demo-admin user and password.');try{return 'Basic '+btoa(username+':'+password)}catch{return 'Basic '+btoa(unescape(encodeURIComponent(username+':'+password)))}};
    const message=(value,error=false)=>{const node=q('[data-live-message]');node.textContent=value;node.classList.toggle('error',error)};
    const describeError=(payload,status)=>payload?.detail||payload?.error||('Request failed with HTTP '+status+'.');
    const visualState=(item)=>{const value=String(item?.conclusion||item?.status||'queued').toLowerCase();if(value==='completed')return'success';if(value==='failure'||value==='failed'||value==='timed_out'||value==='action_required'||value==='startup_failure')return'failure';if(value==='cancelled'||value==='stale')return'cancelled';if(value==='in_progress')return'in_progress';if(value==='success')return'success';if(value==='skipped'||value==='neutral')return'skipped';return'queued'};
    const stateLabel=(item)=>{const value=visualState(item);return value==='success'?'Passed':value==='in_progress'?'In progress':value==='failure'?'Failed':value==='cancelled'?'Cancelled':value==='skipped'?'Skipped':'Queued'};
    const stateSymbol=(item)=>symbols[visualState(item)]||'○';
    const updateVisualState=(node,icon,item)=>{const next=visualState(item);if(node.dataset.state!==next){node.dataset.state=next;node.classList.remove('state-updated');requestAnimationFrame(()=>node.classList.add('state-updated'));setTimeout(()=>node.classList.remove('state-updated'),420)}icon.textContent=stateSymbol(item)};
    const feedStore=(root)=>{let store=state.feedStores.get(root);if(!store){root.textContent='';store={jobs:new Map(),empty:null};state.feedStores.set(root,store)}return store};
    const clearFeed=(root)=>{root.textContent='';state.feedStores.delete(root)};
    const clearFeeds=()=>{clearFeed(q('[data-ci-jobs]'));clearFeed(q('[data-delivery-jobs]'));text('[data-ci-summary]','Waiting');text('[data-delivery-summary]','Waiting')};
    const feedSummary=(jobs)=>{if(!jobs.length)return'Waiting';const counts={running:0,queued:0,passed:0,failed:0,skipped:0};jobs.forEach((job)=>{const value=visualState(job);if(value==='in_progress')counts.running+=1;else if(value==='queued')counts.queued+=1;else if(value==='success')counts.passed+=1;else if(value==='skipped')counts.skipped+=1;else counts.failed+=1});const detail=[];if(counts.running)detail.push(counts.running+' running');if(counts.queued)detail.push(counts.queued+' queued');if(counts.passed)detail.push(counts.passed+' passed');if(counts.failed)detail.push(counts.failed+' failed');if(counts.skipped)detail.push(counts.skipped+' skipped');return jobs.length+' job'+(jobs.length===1?'':'s')+' · '+detail.join(' · ')};
    const createJobView=(root,store,job,key)=>{const node=document.createElement('section');node.className='workflow-job';node.dataset.jobKey=key;const header=document.createElement('div');header.className='workflow-job-header';const icon=document.createElement('span');icon.className='workflow-state-icon';icon.setAttribute('aria-hidden','true');const identity=document.createElement('div');const name=document.createElement('h4');const meta=document.createElement('p');meta.className='workflow-job-meta';identity.append(name,meta);const link=document.createElement('a');link.className='workflow-job-link';link.target='_blank';link.rel='noreferrer';link.textContent='View job ↗';header.append(icon,identity,link);const steps=document.createElement('ol');steps.className='workflow-steps';node.append(header,steps);root.append(node);const view={node,icon,name,meta,link,steps,stepViews:new Map(),empty:null};store.jobs.set(key,view);return view};
    const createStepView=(jobView,key)=>{const node=document.createElement('li');node.dataset.stepKey=key;const icon=document.createElement('span');icon.className='workflow-state-icon';icon.setAttribute('aria-hidden','true');const name=document.createElement('span');name.className='workflow-step-name';const result=document.createElement('span');result.className='workflow-step-result';node.append(icon,name,result);jobView.steps.append(node);const view={node,icon,name,result};jobView.stepViews.set(key,view);return view};
    const renderFeed=(root,jobs,empty,summarySelector)=>{const values=Array.isArray(jobs)?jobs:[];const store=feedStore(root);text(summarySelector,feedSummary(values));if(!values.length&&store.jobs.size===0){if(!store.empty){store.empty=document.createElement('p');store.empty.className='workflow-empty';root.append(store.empty)}store.empty.textContent=empty;return}if(values.length&&store.empty){store.empty.remove();store.empty=null}values.forEach((job,index)=>{const key=String(job.url||job.name||index);const view=store.jobs.get(key)||createJobView(root,store,job,key);view.name.textContent=job.name;view.meta.textContent=stateLabel(job);view.link.hidden=!job.url;if(job.url)view.link.href=job.url;updateVisualState(view.node,view.icon,job);view.node.setAttribute('aria-label',job.name+': '+stateLabel(job));const steps=Array.isArray(job.steps)?job.steps:[];if(!steps.length){if(!view.empty){view.empty=document.createElement('li');view.empty.className='workflow-step-empty';view.steps.append(view.empty)}view.empty.textContent=visualState(job)==='skipped'?'Job skipped by workflow condition':'Waiting for step data from GitHub';return}if(view.empty){view.empty.remove();view.empty=null}steps.forEach((step,stepIndex)=>{const stepKey=String(step.number||step.name||stepIndex);const stepView=view.stepViews.get(stepKey)||createStepView(view,stepKey);stepView.name.textContent=step.name;stepView.result.textContent=stateLabel(step);updateVisualState(stepView.node,stepView.icon,step);stepView.node.setAttribute('aria-label',step.name+': '+stateLabel(step))})})};
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
      renderFeed(q('[data-ci-jobs]'),status.ci?.jobs?.length?status.ci.jobs:status.controller?.jobs||[],'Real job steps appear after GitHub creates the controller or pull-request run.','[data-ci-summary]');
      renderFeed(q('[data-delivery-jobs]'),status.delivery?.jobs||[],'Release jobs appear after the explicit merge gate.','[data-delivery-summary]');
      const feed=q('.workflow-feed-connection');feed.dataset.feedState=status.active?'live':status.stage==='failed'?'failed':'idle';
      text('[data-feed-cadence]',status.active?'LIVE · '+status.pollAfterMs+' ms':'IDLE · '+Math.round(status.pollAfterMs/1000)+' s');
      text('[data-feed-sync]','GitHub snapshot '+new Date(status.generatedAt).toLocaleTimeString());
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
    const loadStatus=async()=>{try{const suffix=state.requestId?'?request_id='+encodeURIComponent(state.requestId):'';const response=await fetch('/__api/git/demo'+suffix,{cache:'no-store',headers:{accept:'application/json'}});const payload=await response.json();if(!response.ok)throw new Error(describeError(payload,response.status));renderStatus(payload);schedule(payload.pollAfterMs||60000)}catch(error){message('Live lifecycle unavailable. '+String(error),true);schedule(5000)}};
    const post=async(path,body)=>{const authorization=credentialHeader();const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{accept:'application/json','content-type':'application/json',authorization},body:JSON.stringify(body)});const payload=await response.json().catch(()=>({}));if(!response.ok){if(response.status===409&&payload.requestId){state.requestId=payload.requestId;loadStatus()}throw new Error(describeError(payload,response.status))}q('#git-demo-password').value='';state.requestId=payload.requestId||state.requestId;return payload};
    q('[data-live-start]').addEventListener('click',async(event)=>{const button=event.currentTarget;button.disabled=true;message('Authorizing and dispatching the controlled GitHub workflow…');try{const payload=await post('/__api/git/demo',{bump:q('#git-demo-bump').value});clearFeeds();text('[data-live-version]',payload.currentVersion+' → '+payload.targetVersion);message('GitHub accepted the request. Waiting for the controlled branch and pull request…');loadStatus()}catch(error){message(String(error),true);button.disabled=Boolean(state.status?.active)}});
    q('[data-live-release]').addEventListener('click',async(event)=>{const button=event.currentTarget;const status=state.status;if(!status?.releaseReady||!status.pullRequest||!state.requestId)return;button.disabled=true;message('Authorizing merge and annotated release dispatch…');try{await post('/__api/git/demo/release',{pullRequest:status.pullRequest.number,requestId:state.requestId});message('GitHub accepted the merge and release request. Repository protections remain enforced.');loadStatus()}catch(error){message(String(error),true);button.disabled=!state.status?.releaseReady}});

    const labels={
      'github.branches':['name','protected'],
      'github.commits':['sha','commit'],
      'github.pull-requests':['title','state','updated_at'],
      'github.workflow-runs':['name','status','conclusion','run_attempt'],
      'github.retained-reports':['id','status','observedAt'],
      'github.workflow-artifacts':['name','expired','expires_at'],
      'github.tags':['name','commit'],
      'github.releases':['name','tag_name','published_at']
    };
    const nativeValue=(item,key)=>{const value=item?.native?.[key];if(value===null||value===undefined)return'—';if(key==='commit'&&value?.sha)return shortSha(value.sha);if(typeof value==='object')return JSON.stringify(value);return String(value)};
    const renderSource=(sourceId,records,availability,qualification)=>{const root=q('[data-evidence-card="'+sourceId+'"]');if(!root)return;const status=root.querySelector('[data-evidence-status]');const items=root.querySelector('[data-evidence-items]');items.innerHTML='';const complete=qualification==='complete';status.textContent=availability==='available'?(records.length+' item'+(records.length===1?'':'s')+' · '+(complete?'complete source':'bounded sample')):availability==='partial'?(records.length+' item'+(records.length===1?'':'s')+' · partial source'):availability==='rate-limited'?'GitHub rate limited this source.':availability==='expired'?'Source is expired.':'Source unavailable.';records.forEach((item)=>{const row=document.createElement('div');row.className='evidence-row';const first=labels[sourceId]?.[0]||'id';const link=item.url?document.createElement('a'):document.createElement('strong');link.textContent=nativeValue(item,first);if(item.url){link.href=item.url;link.target='_blank';link.rel='noreferrer'}row.append(link);const detail=document.createElement('p');detail.className='subtle';detail.textContent=(labels[sourceId]||[]).slice(1).map((field)=>nativeValue(item,field)).join(' · ');row.append(detail);items.append(row)})};
    const renderControls=(record,availability)=>{const status=q('[data-controls-state]');const detail=q('[data-controls-detail]');detail.innerHTML='';if(!record){status.textContent=availability==='rate-limited'?'Rate limited':'Not available';const paragraph=document.createElement('p');paragraph.className='subtle';paragraph.textContent='GitHub did not expose the registered branch-protection object to this read boundary. No protection claim is inferred.';detail.append(paragraph);return}status.textContent='Native object available';const value=record.native||{};const list=document.createElement('dl');[['Required status checks',Boolean(value.required_status_checks)],['Required pull-request reviews',Boolean(value.required_pull_request_reviews)],['Force pushes allowed',Boolean(value.allow_force_pushes?.enabled)],['Deletion allowed',Boolean(value.allow_deletions?.enabled)]].forEach(([name,enabled])=>{const term=document.createElement('dt');term.textContent=String(name);const definition=document.createElement('dd');definition.textContent=enabled?'Yes':'No / not exposed';list.append(term,definition)});detail.append(list)};
    const loadEvidence=async()=>{const meta=q('[data-evidence-meta]');meta.textContent='Loading bounded GitHub reporting sample…';try{const wanted=[...Object.keys(labels),'github.repositories','github.branch-protection'].map((source)=>'source='+encodeURIComponent(source)).join('&');const response=await fetch('/__api/git/evidence?mode=sample&limit=5&'+wanted,{headers:{accept:'application/json'}});const payload=await response.json();if(!response.ok)throw new Error(payload.detail||payload.error||'unavailable');if(payload.contract!=='contracts/assurance/reporting.schema.json'||payload.dataset!=='github')throw new Error('unexpected reporting contract');const bySource=new Map();(payload.records||[]).forEach((record)=>{const values=bySource.get(record.source)||[];values.push(record);bySource.set(record.source,values)});Object.keys(labels).forEach((source)=>renderSource(source,bySource.get(source)||[],payload.availability?.[source]||'unavailable',payload.qualifications?.[source+'.completeness']));renderControls((bySource.get('github.branch-protection')||[])[0],payload.availability?.['github.branch-protection']);const partial=payload.datasets.filter((source)=>payload.qualifications?.[source+'.completeness']==='partial');meta.textContent=(payload.qualifications?.repository||'Configured repository')+' · checked '+new Date(payload.qualifications?.generatedAt||Date.now()).toLocaleString()+' · '+(partial.length?partial.length+' bounded/partial source(s); use mode=export for complete bounded pagination':'all requested sources complete')}catch(error){meta.textContent='Reporting unavailable. '+String(error);document.querySelectorAll('[data-evidence-status]').forEach((node)=>node.textContent='Source unavailable.');renderControls(null,'unavailable')}};
    q('[data-evidence-refresh]').addEventListener('click',()=>{document.querySelectorAll('[data-evidence-items]').forEach((node)=>node.innerHTML='');loadEvidence()});
    loadStatus();loadEvidence();
  })();
  </script>`, { activeRoute: '/git', cacheControl: 'no-store' });
}
