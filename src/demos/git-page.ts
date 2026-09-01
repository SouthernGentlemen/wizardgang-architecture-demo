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

export function renderGitDemo(env: Env): Response {
  const cardMarkup = cards.map(([key, title, description]) => `<article class="evidence-card" data-evidence-card="${key}"><p class="eyebrow">GitHub API</p><h2>${title}</h2><p>${description}</p><p class="subtle" data-evidence-status>Loading evidence…</p><div data-evidence-items></div></article>`).join('');
  return shell(env, 'Git / GitHub', `
  <section class="page-header"><p class="eyebrow">Delivery &amp; Governance / /git</p><h1>Delivery evidence, live.</h1><p class="lede">Public repository facts are loaded from GitHub at runtime. Missing data is shown as empty and API failures as unavailable—never replaced with invented evidence.</p><div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/demos/git.ts')}">Route source</a>${referenceDetails([
    { label: 'Page source', href: sourceUrl(env, 'src/demos/git-page.ts') },
    { label: 'GitHub client', href: sourceUrl(env, 'src/lib/github-api.ts') },
    { label: 'Change policy', href: sourceUrl(env, 'docs/CHANGE-MANAGEMENT.md') },
    { label: 'CI workflow', href: sourceUrl(env, '.github/workflows/ci.yml') },
    { label: 'Deploy workflow', href: sourceUrl(env, '.github/workflows/deploy.yml') },
  ])}</div></section>
  <section class="panel" id="source-of-truth"><div class="lab-heading"><div><p class="eyebrow">Configured repository only</p><h2>Public source of truth</h2></div><button type="button" data-evidence-refresh>Refresh evidence</button></div><p data-evidence-meta aria-live="polite">Connecting to GitHub…</p></section>
  <nav class="pipeline" aria-label="Delivery pipeline"><span>Commit</span><span>Pull request</span><span>Typecheck</span><span>Unit tests</span><span>WCAG scan</span><span>Build</span><span>Annotated tag</span><span>Deploy</span><span>Health check</span><span>GitHub Release</span></nav>
  <span id="versioning" aria-hidden="true"></span><span id="branching" aria-hidden="true"></span><span id="actions" aria-hidden="true"></span><span id="releases" aria-hidden="true"></span>
  <div class="evidence-grid">${cardMarkup}</div>
  <section class="panel" id="environments"><div class="lab-heading"><div><p class="eyebrow">Repository control evidence</p><h2>Default-branch controls</h2></div><span class="badge" data-controls-state>Checking</span></div><div data-controls-detail><p class="subtle">Loading branch-protection visibility…</p></div></section>
  <script>
  (()=>{
    const labels={branches:['name','commit'],commits:['message','author','date'],openPullRequest:['title','author','head','base'],mergedPullRequest:['title','author','mergedAt'],actions:['name','event','status','conclusion','branch'],tags:['name','commit'],release:['name','tag','publishedAt']};
    const value=(item,key)=>item[key]===null||item[key]===undefined?'—':String(item[key]);
    const renderCard=(key,card)=>{
      const root=document.querySelector('[data-evidence-card="'+key+'"]');if(!root)return;
      const status=root.querySelector('[data-evidence-status]');const items=root.querySelector('[data-evidence-items]');items.innerHTML='';
      status.textContent=card.status==='available'?card.items.length+' verified item'+(card.items.length===1?'':'s'):card.status==='empty'?'No matching public data.':'Evidence unavailable: '+(card.error||'GitHub request failed.');
      card.items.forEach((item)=>{const row=document.createElement('div');row.className='evidence-row';const link=item.url?document.createElement('a'):document.createElement('strong');link.textContent=value(item,labels[key][0]);if(item.url)link.href=item.url;row.append(link);const detail=document.createElement('p');detail.className='subtle';detail.textContent=labels[key].slice(1).map((field)=>value(item,field)).join(' · ');row.append(detail);items.append(row)});
    };
    const renderControls=(controls)=>{const state=document.querySelector('[data-controls-state]');const detail=document.querySelector('[data-controls-detail]');detail.innerHTML='';state.textContent=controls.status==='verified'?'Verified response':'Not publicly verifiable';if(controls.status==='verified'){const list=document.createElement('dl');Object.entries(controls.details||{}).forEach(([name,enabled])=>{const term=document.createElement('dt');term.textContent=name.replace(/([A-Z])/g,' $1');const definition=document.createElement('dd');definition.textContent=enabled?'Enabled':'Not shown enabled';list.append(term,definition)});detail.append(list)}else{const paragraph=document.createElement('p');paragraph.className='subtle';paragraph.textContent='GitHub did not expose branch-protection details to this read boundary. No protection claim is made.';detail.append(paragraph)}const link=document.createElement('a');link.href=controls.evidenceUrl;link.className='text-link';link.textContent=controls.status==='verified'?'View repository settings':'View repository change policy';detail.append(link)};
    const load=async()=>{const meta=document.querySelector('[data-evidence-meta]');meta.textContent='Loading bounded GitHub evidence…';try{const response=await fetch('/__api/git/evidence');const payload=await response.json();if(!response.ok)throw new Error(payload.error||'unavailable');Object.entries(payload.cards).forEach(([key,card])=>renderCard(key,card));renderControls(payload.controls);meta.textContent=payload.repository.fullName+' · default '+(payload.repository.defaultBranch||'unknown')+' · checked '+new Date(payload.generatedAt).toLocaleString()+' · '+(payload.partialFailures.length?payload.partialFailures.length+' partial failure(s)':'all public cards reached')}catch(error){meta.textContent='Evidence unavailable. '+String(error);document.querySelectorAll('[data-evidence-status]').forEach((node)=>node.textContent='Evidence unavailable.')}};
    document.querySelector('[data-evidence-refresh]').addEventListener('click',()=>{document.querySelectorAll('[data-evidence-items]').forEach((node)=>node.innerHTML='');load()});load();
  })();
  </script>`, { activeRoute: '/git', cacheControl: 'no-store' });
}
