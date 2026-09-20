import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import {
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import {
  complianceFrameworks,
  assuranceRecordUrlsById,
} from '../assurance/service';
import {
  resolveAssuranceDocumentationReference,
} from '../assurance/presentation';
import { bindLocalization, localizationForEnv, resolveLocalization } from '../i18n/runtime';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { pageContent, type PageContent } from '../ui/page';

type ComplianceRecord = PublishedAssuranceRecordMap['compliance'];
type ComplianceStatus = ComplianceRecord['status'];

const DEFAULT_RECORD_ID = 'ISO27001-A.5.1';
const FRAMEWORK_ORDER = ['iso-27001', 'iso-42001', 'wcag-2.2'] as const;
const STATUS_ORDER = ['pass', 'partial', 'gap', 'not-applicable'] as const;
const WCAG_DOCUMENTATION_PATH = 'docs/ACCESSIBILITY.md';
const SOA_PATHS = [
  ['ISO/IEC 27001 statement of applicability', 'assurance/compliance/iso-27001-2022.json'],
  ['ISO/IEC 42001 statement of applicability', 'assurance/compliance/iso-42001-2023.json'],
] as const;


interface RecordSummary {
  id: string;
  framework: ComplianceRecord['framework'];
  frameworkLabel: string;
  section: string;
  reference: string;
  title: string;
  status: ComplianceStatus;
}

function safeScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function statusLabel(status: ComplianceStatus): string {
  return status === 'not-applicable' ? 'N/A' : `${status[0].toUpperCase()}${status.slice(1)}`;
}

function statusGlyph(status: ComplianceStatus): string {
  if (status === 'pass') return '✓';
  if (status === 'partial') return '◐';
  if (status === 'gap') return '!';
  return '—';
}

function statusBadge(status: ComplianceStatus): string {
  return `<span class="assurance-status" data-status="${escapeHtml(status)}"><span aria-hidden="true">${escapeHtml(statusGlyph(status))}</span>${escapeHtml(statusLabel(status))}</span>`;
}

function frameworkFor(record: ComplianceRecord) {
  return complianceFrameworks.find((framework) => framework.id === record.framework);
}

function assessmentDate(record: ComplianceRecord): string | undefined {
  return frameworkFor(record)?.assessmentDate;
}

function documentationReferences(record: ComplianceRecord, env: Env): string {
  const localization = localizationForEnv(env);
  const references = assuranceRelationshipIds(record.relationships, 'documentation') as string[];
  if (!references.length) return `<p>${escapeHtml(localization.t('assurance.workbench.no_documentation', 'No Markdown references are recorded yet.'))}</p>`;
  return `<ul class="assurance-reference-list">${references.map((reference) => {
    const resolved = resolveAssuranceDocumentationReference(reference, env);
    const linkLabel = localization.t('assurance.workbench.open_documentation', 'Open documentation');
    return `<li><code lang="en">${escapeHtml(reference)}</code><div><a href="${escapeHtml(resolved.url)}">${escapeHtml(linkLabel)}<span class="sr-only">: ${escapeHtml(reference)}</span></a></div></li>`;
  }).join('')}</ul>`;
}

function evidenceReferences(record: ComplianceRecord, env: Env, origin: string): string {
  const localization = localizationForEnv(env);
  const evidenceById = new Map(
    presentedPublishedEvidenceRecords(env, origin).map((evidence) => [evidence.id, evidence]),
  );
  const evidenceIds = assuranceRelationshipIds(record.relationships, 'evidence') as string[];
  const evidence = evidenceIds.flatMap((id) => {
    const value = evidenceById.get(id);
    return value ? [value] : [];
  });
  if (!evidence.length) return `<p>${escapeHtml(localization.t('assurance.workbench.no_evidence', 'No evidence records are linked yet.'))}</p>`;
  return `<ul class="assurance-evidence-list">${evidence.map((item) => {
    const recordUrl = assuranceRecordUrlsById(item.id).api;
    const locationUrl = item.resolved.url;
    const locationLabel = localization.t('assurance.workbench.open_location', 'Open location');
    const recordLabel = localization.t('assurance.workbench.open_evidence_record', 'Open evidence record');
    return `<li>
      <strong lang="en">${escapeHtml(item.title)}</strong>
      <div class="assurance-evidence-meta"><span lang="en">${escapeHtml(item.kind)}</span><span>${escapeHtml(localization.t('assurance.workbench.freshness', 'Freshness'))}: ${escapeHtml(item.freshness.policy)}</span></div>
      <div class="assurance-evidence-links">${locationUrl ? `<a href="${escapeHtml(locationUrl)}">${escapeHtml(locationLabel)}<span class="sr-only">: ${escapeHtml(item.title)}</span></a>` : ''}${recordUrl ? `<a href="${escapeHtml(recordUrl)}">${escapeHtml(recordLabel)}<span class="sr-only">: ${escapeHtml(item.title)}</span></a>` : ''}</div>
    </li>`;
  }).join('')}</ul>`;
}

function renderRecordPane(record: ComplianceRecord, env: Env, origin: string): string {
  const localization = localizationForEnv(env);
  const assessed = assessmentDate(record);
  const assessment = record.rationale || record.implementation || localization.t('assurance.workbench.no_assessment', 'No assessment rationale is recorded yet.');
  const gaps = record.gaps ?? [];
  const recordApi = assuranceRecordUrlsById(record.id).api;
  const requirementUrl = sourceUrl(env, record.sourcePath);
  const docsPanelId = `assurance-docs-${record.id.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  const evidencePanelId = `assurance-evidence-${record.id.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  return `<article class="assurance-record-pane" data-assurance-record="${escapeHtml(record.id)}">
    <header class="assurance-record-heading">
      <div><p class="eyebrow" lang="en">${escapeHtml(record.frameworkLabel)} · ${escapeHtml(record.section)}</p><h2><span lang="en">${escapeHtml(record.reference)} · ${escapeHtml(record.title)}</span></h2></div>
      ${statusBadge(record.status)}
    </header>
    <div class="assurance-record-body">
      <section class="assurance-assessment" aria-label="${escapeHtml(localization.t('assurance.workbench.assessment', 'Assessment'))}">
        <dl>
          <div><dt>${escapeHtml(localization.t('assurance.workbench.assessment', 'Assessment'))}</dt><dd lang="en">${escapeHtml(assessment)}</dd></div>
          <div><dt>${escapeHtml(localization.t('assurance.workbench.missing', 'What is missing'))}</dt><dd>${gaps.length ? `<ul lang="en">${gaps.map((gap) => `<li>${escapeHtml(gap)}</li>`).join('')}</ul>` : escapeHtml(localization.t('assurance.workbench.no_gaps', 'No gaps are recorded for this assessment.'))}</dd></div>
          <div><dt>${escapeHtml(localization.t('assurance.workbench.assessed', 'Assessed'))}</dt><dd>${assessed ? (record.framework === 'wcag-2.2' ? `<a href="${escapeHtml(sourceUrl(env, WCAG_DOCUMENTATION_PATH))}" aria-label="WCAG 2.2 assessed ${escapeHtml(assessed)} — open accessibility documentation"><time datetime="${escapeHtml(assessed)}" lang="en">${escapeHtml(assessed)}</time></a>` : `<time datetime="${escapeHtml(assessed)}" lang="en">${escapeHtml(assessed)}</time>`) : escapeHtml(localization.t('assurance.workbench.no_assessed_date', 'No assessment date is recorded.'))}</dd></div>
        </dl>
        <div class="assurance-record-tools">
          <a href="${escapeHtml(requirementUrl)}">${escapeHtml(localization.t('assurance.workbench.open_requirement', 'Open requirement source'))}</a>
          ${recordApi ? `<a href="${escapeHtml(recordApi)}">${escapeHtml(localization.t('assurance.workbench.open_assessment_record', 'Open assessment record'))}</a>` : ''}
        </div>
      </section>
      <section class="assurance-inspector" aria-label="${escapeHtml(localization.t('assurance.workbench.record_inspector', 'Record inspector'))}">
        <div class="assurance-inspector-tabs" role="tablist" aria-label="${escapeHtml(localization.t('assurance.workbench.record_inspector', 'Record inspector'))}">
          <button class="assurance-inspector-tab" type="button" role="tab" id="${docsPanelId}-tab" aria-controls="${docsPanelId}" aria-selected="true" tabindex="0" data-assurance-inspector-mode="documentation">${escapeHtml(localization.t('common.documentation', 'Documentation'))}</button>
          <button class="assurance-inspector-tab" type="button" role="tab" id="${evidencePanelId}-tab" aria-controls="${evidencePanelId}" aria-selected="false" tabindex="-1" data-assurance-inspector-mode="evidence">${escapeHtml(localization.t('assurance.section.evidence', 'Evidence'))}</button>
        </div>
        <div class="assurance-inspector-panel" id="${docsPanelId}" role="tabpanel" aria-labelledby="${docsPanelId}-tab" data-assurance-inspector-panel="documentation">${documentationReferences(record, env)}</div>
        <div class="assurance-inspector-panel" id="${evidencePanelId}" role="tabpanel" aria-labelledby="${evidencePanelId}-tab" data-assurance-inspector-panel="evidence" hidden>${evidenceReferences(record, env, origin)}</div>
      </section>
    </div>
  </article>`;
}

function summaryFor(record: ComplianceRecord): RecordSummary {
  return {
    id: record.id,
    framework: record.framework,
    frameworkLabel: record.frameworkLabel,
    section: record.section,
    reference: record.reference,
    title: record.title,
    status: record.status,
  };
}

function sectionRecords(records: RecordSummary[], framework: string, section: string): RecordSummary[] {
  return records.filter((record) => record.framework === framework && record.section === section);
}

function postureCounts(records: RecordSummary[]): Record<ComplianceStatus, number> {
  return STATUS_ORDER.reduce((counts, status) => {
    counts[status] = records.filter((record) => record.status === status).length;
    return counts;
  }, { pass: 0, partial: 0, gap: 0, 'not-applicable': 0 } as Record<ComplianceStatus, number>);
}

function postureHtml(label: string, counts: Record<ComplianceStatus, number>): string {
  return `<section class="assurance-posture"><strong>${escapeHtml(label)}</strong><dl>${STATUS_ORDER.map((status) => `<div data-status="${status}"><dt><span aria-hidden="true">${escapeHtml(statusGlyph(status))}</span> ${escapeHtml(statusLabel(status))}</dt><dd data-posture-count="${status}">${counts[status]}</dd></div>`).join('')}</dl></section>`;
}

function recordLink(record: RecordSummary, activeId: string): string {
  return `<a class="assurance-record-link" id="${escapeHtml(record.id)}" href="#${encodeURIComponent(record.id)}" data-assurance-record-link="${escapeHtml(record.id)}"${record.id === activeId ? ' aria-current="true"' : ''}>
    <code lang="en">${escapeHtml(record.reference)}</code>
    <strong lang="en">${escapeHtml(record.title)}</strong>
    ${statusBadge(record.status)}
  </a>`;
}

function workbenchScript(records: RecordSummary[], deployedSha: string | undefined, messages: Readonly<{ loading: string; loaded: string; failed: string }>): string {
  const endpointTemplate = routeUrl('assurance.presentation', { record: '__record__' });
  const initialId = records.some((record) => record.id === DEFAULT_RECORD_ID) ? DEFAULT_RECORD_ID : records[0]?.id ?? '';
  return `<script>(()=>{
const records=${safeScriptJson(records)};
const frameworkOrder=${safeScriptJson(FRAMEWORK_ORDER)};
const statuses=${safeScriptJson(STATUS_ORDER)};
const defaultId=${safeScriptJson(initialId)};
const deployedSha=${safeScriptJson(deployedSha ?? '')};
const endpointTemplate=${safeScriptJson(endpointTemplate)};
const messages=${safeScriptJson(messages)};
const byId=new Map(records.map((record)=>[record.id,record]));
const tabs=[...document.querySelectorAll('[data-assurance-framework]')];
const sectionSelect=document.querySelector('[data-assurance-section]');
const grid=document.querySelector('[data-assurance-record-grid]');
const detail=document.querySelector('[data-assurance-detail]');
const status=document.querySelector('[data-assurance-status]');
const recordCount=document.querySelector('[data-assurance-record-count]');
const sectionPosture=document.querySelector('[data-assurance-section-posture]');
const frameworkPosture=document.querySelector('[data-assurance-framework-posture]');
if(!sectionSelect||!grid||!detail||!status||!recordCount||!sectionPosture||!frameworkPosture)return;
const cache=new Map();let activeId=defaultId;let controller=null;
const label=(value)=>value==='not-applicable'?'N/A':value.charAt(0).toUpperCase()+value.slice(1);
const glyph=(value)=>value==='pass'?'✓':value==='partial'?'◐':value==='gap'?'!':'—';
const escape=(value)=>String(value).replace(/[&<>\"']/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[character]));
const counts=(items)=>Object.fromEntries(statuses.map((value)=>[value,items.filter((item)=>item.status===value).length]));
const endpoint=(id)=>{const url=new URL(endpointTemplate.replace('__record__',encodeURIComponent(id)),location.origin);const lang=new URL(location.href).searchParams.get('lang');if(lang)url.searchParams.set('lang',lang);if(deployedSha)url.searchParams.set('rev',deployedSha);return url.pathname+url.search};
const currentRecord=()=>byId.get(activeId)||byId.get(defaultId)||records[0];
const frameworkRecords=(framework)=>records.filter((record)=>record.framework===framework);
const sections=(framework)=>[...new Set(frameworkRecords(framework).map((record)=>record.section))];
const renderPosture=(root,items)=>{const values=counts(items);for(const value of statuses){const target=root.querySelector('[data-posture-count="'+value+'"]');if(target)target.textContent=String(values[value])}};
const syncTabs=(record)=>{for(const tab of tabs){const selected=tab.dataset.assuranceFramework===record.framework;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1}};
const syncSections=(record)=>{const options=sections(record.framework);sectionSelect.innerHTML=options.map((section)=>{const count=frameworkRecords(record.framework).filter((candidate)=>candidate.section===section).length;return '<option value="'+escape(section)+'"'+(section===record.section?' selected':'')+'>'+escape(section)+' · '+count+'</option>'}).join('')};
const syncGrid=(record)=>{const items=records.filter((candidate)=>candidate.framework===record.framework&&candidate.section===record.section);recordCount.textContent=String(items.length);grid.innerHTML=items.map((item)=>'<a class="assurance-record-link" id="'+escape(item.id)+'" href="#'+encodeURIComponent(item.id)+'" data-assurance-record-link="'+escape(item.id)+'"'+(item.id===record.id?' aria-current="true"':'')+'><code lang="en">'+escape(item.reference)+'</code><strong lang="en">'+escape(item.title)+'</strong><span class="assurance-status" data-status="'+escape(item.status)+'"><span aria-hidden="true">'+glyph(item.status)+'</span>'+escape(label(item.status))+'</span></a>').join('');renderPosture(sectionPosture,items);renderPosture(frameworkPosture,frameworkRecords(record.framework))};
const syncControls=(record)=>{syncTabs(record);syncSections(record);syncGrid(record)};
const announce=(message)=>{status.textContent=message};
const renderState=(message,role='status')=>{detail.innerHTML='<p class="panel" role="'+role+'">'+escape(message)+'</p>'};
const load=async(id)=>{if(cache.has(id)){detail.innerHTML=cache.get(id);detail.setAttribute('aria-busy','false');announce(messages.loaded);return}if(controller)controller.abort();controller=new AbortController();const local=controller;detail.setAttribute('aria-busy','true');renderState(messages.loading);try{const response=await fetch(endpoint(id),{headers:{accept:'text/html'},signal:local.signal});if(!response.ok)throw new Error(messages.failed);const html=await response.text();if(activeId!==id||local.signal.aborted)return;cache.set(id,html);detail.innerHTML=html;detail.setAttribute('aria-busy','false');announce(messages.loaded)}catch(error){if(local.signal.aborted)return;detail.setAttribute('aria-busy','false');renderState(error instanceof Error?error.message:messages.failed,'alert')}};
const select=(id,{history='push'}={})=>{const record=byId.get(id)||byId.get(defaultId)||records[0];if(!record)return;activeId=record.id;syncControls(record);const hash='#'+encodeURIComponent(record.id);if(location.hash!==hash){if(history==='replace')window.history.replaceState(null,'',hash);else if(history==='push')window.history.pushState(null,'',hash)}load(record.id)};
const fragmentId=()=>{if(!location.hash)return defaultId;try{return decodeURIComponent(location.hash.slice(1))}catch{return defaultId}};
const applySelection=()=>select(byId.has(fragmentId())?fragmentId():defaultId,{history:byId.has(fragmentId())?'none':'replace'});
tabs.forEach((tab)=>tab.addEventListener('click',()=>{const framework=tab.dataset.assuranceFramework;const record=records.find((candidate)=>candidate.framework===framework);if(record)select(record.id)}));
const activateFrameworkFromKeyboard=(event)=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const rtl=getComputedStyle(document.documentElement).direction==='rtl';const current=tabs.indexOf(event.currentTarget);let next=current;if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else if(event.key==='ArrowRight')next=(current+(rtl?-1:1)+tabs.length)%tabs.length;else next=(current+(rtl?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click()};
tabs.forEach((tab)=>tab.addEventListener('keydown',activateFrameworkFromKeyboard));
sectionSelect.addEventListener('change',()=>{const record=currentRecord();const first=record&&records.find((candidate)=>candidate.framework===record.framework&&candidate.section===sectionSelect.value);if(first)select(first.id)});
grid.addEventListener('click',(event)=>{const link=event.target.closest('[data-assurance-record-link]');if(!link)return;event.preventDefault();select(link.dataset.assuranceRecordLink)});
detail.addEventListener('click',(event)=>{const tab=event.target.closest('[data-assurance-inspector-mode]');if(!tab)return;const root=tab.closest('.assurance-inspector');if(!root)return;for(const button of root.querySelectorAll('[data-assurance-inspector-mode]')){const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1}for(const panel of root.querySelectorAll('[data-assurance-inspector-panel]'))panel.hidden=panel.dataset.assuranceInspectorPanel!==tab.dataset.assuranceInspectorMode});
detail.addEventListener('keydown',(event)=>{const tab=event.target.closest('[data-assurance-inspector-mode]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const root=tab.closest('.assurance-inspector');if(!root)return;const buttons=[...root.querySelectorAll('[data-assurance-inspector-mode]')];const current=buttons.indexOf(tab);const rtl=getComputedStyle(document.documentElement).direction==='rtl';let next=current;if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else if(event.key==='ArrowRight')next=(current+(rtl?-1:1)+buttons.length)%buttons.length;else next=(current+(rtl?1:-1)+buttons.length)%buttons.length;event.preventDefault();buttons[next].focus();buttons[next].click()});
window.addEventListener('hashchange',applySelection);window.addEventListener('popstate',applySelection);applySelection();
})()</script>`;
}

export async function assuranceWorkbenchContent(request: Request, env: Env): Promise<PageContent> {
  const localization = localizationForEnv(env);
  const records = listPublishedAssuranceRecords('compliance') as ComplianceRecord[];
  const summaries = records.map(summaryFor);
  const initialRecord = records.find((record) => record.id === DEFAULT_RECORD_ID)
    ?? records.find((record) => record.framework === 'iso-27001')
    ?? records[0];
  if (!initialRecord) throw new Error('The assurance workbench requires at least one published compliance record.');
  const initialSummary = summaryFor(initialRecord);
  const initialFrameworkRecords = summaries.filter((record) => record.framework === initialSummary.framework);
  const initialSectionRecords = sectionRecords(summaries, initialSummary.framework, initialSummary.section);
  const sectionOptions = [...new Set(initialFrameworkRecords.map((record) => record.section))];
  const body = `<section class="page-header assurance-workbench-header">
    <h1>${escapeHtml(localization.t('nav.assurance.index', 'Assurance'))}</h1>
    <p class="lede">${escapeHtml(localization.t('assurance.workbench.lede', 'Inspect published assessment records, evidence, and documentation against the deployed source revision.'))}</p>
  </section>
  <div class="assurance-workbench" data-assurance-workbench>
    <div class="assurance-framework-tabs" role="tablist" aria-label="${escapeHtml(localization.t('assurance.workbench.frameworks', 'Frameworks'))}">
      ${FRAMEWORK_ORDER.map((frameworkId) => {
        const framework = complianceFrameworks.find((candidate) => candidate.id === frameworkId);
        if (!framework) return '';
        const selected = frameworkId === initialSummary.framework;
        return `<button class="assurance-framework-tab" type="button" role="tab" aria-controls="assurance-workbench-panel" aria-selected="${selected}" tabindex="${selected ? '0' : '-1'}" data-assurance-framework="${escapeHtml(frameworkId)}"><span lang="en">${escapeHtml(framework.label)}</span></button>`;
      }).join('')}
    </div>
    <div class="assurance-workbench-layout" id="assurance-workbench-panel" role="tabpanel">
      <aside class="assurance-workbench-controls">
        <label class="assurance-section-control"><span>${escapeHtml(localization.t('assurance.workbench.section', 'Section'))}</span><select data-assurance-section>${sectionOptions.map((section) => `<option value="${escapeHtml(section)}"${section === initialSummary.section ? ' selected' : ''}>${escapeHtml(section)} · ${initialFrameworkRecords.filter((record) => record.section === section).length}</option>`).join('')}</select></label>
        <div class="assurance-posture-stack">
          <div data-assurance-section-posture>${postureHtml(localization.t('assurance.workbench.section_posture', 'Section posture'), postureCounts(initialSectionRecords))}</div>
          <div data-assurance-framework-posture>${postureHtml(localization.t('assurance.workbench.framework_posture', 'Framework posture'), postureCounts(initialFrameworkRecords))}</div>
        </div>
      </aside>
      <section class="assurance-records" aria-label="${escapeHtml(localization.t('assurance.workbench.records', 'Records'))}">
        <div class="assurance-records-heading"><h2>${escapeHtml(localization.t('assurance.workbench.records', 'Records'))}</h2><span class="assurance-record-count"><span data-assurance-record-count>${initialSectionRecords.length}</span></span></div>
        <div class="assurance-record-grid" data-assurance-record-grid aria-label="${escapeHtml(localization.t('assurance.workbench.selected_records', 'Records in selected section'))}">${initialSectionRecords.map((record) => recordLink(record, initialRecord.id)).join('')}</div>
      </section>
    </div>
    <p class="assurance-workbench-status" data-assurance-status role="status" aria-live="polite"></p>
    <section class="assurance-workbench-detail" data-assurance-detail aria-live="off" aria-busy="false">${renderRecordPane(initialRecord, env, new URL(request.url).origin)}</section>
    <noscript><div class="assurance-noscript"><p>${escapeHtml(localization.t('assurance.workbench.noscript', 'JavaScript is required for interactive framework and section switching. You can still inspect the statements of applicability:'))}</p><ul>${SOA_PATHS.map(([label, path]) => `<li><a href="${escapeHtml(sourceUrl(env, path))}">${escapeHtml(localization.t(path.includes('27001') ? 'assurance.workbench.soa_27001' : 'assurance.workbench.soa_42001', label))}</a></li>`).join('')}<li><a lang="en" href="${escapeHtml(sourceUrl(env, WCAG_DOCUMENTATION_PATH))}">WCAG 2.2 accessibility documentation</a></li></ul></div></noscript>
  </div>
  ${workbenchScript(summaries, env.DEPLOYED_SHA, {
    loading: localization.t('assurance.workbench.loading', 'Loading assessment record…'),
    loaded: localization.t('assurance.workbench.loaded', 'Assessment record loaded.'),
    failed: localization.t('assurance.workbench.failed', 'The assurance record could not be loaded.'),
  })}`;

  return pageContent(env, 'Assurance', body, {
    routeId: 'assurance.index',
    canonicalPath: routeUrl('assurance.index'),
    description: localization.t('assurance.workbench.description', 'Browse framework assessment records, posture, evidence, and documentation in one assurance workbench.'),
  });
}

export function assurancePresentationResponse(request: Request, env: Env, recordId: string): Response {
  const record = findPublishedAssuranceRecord('compliance', recordId) as ComplianceRecord | undefined;
  if (!record) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  const localization = resolveLocalization(request);
  const localizedEnv = bindLocalization(env, localization);
  const url = new URL(request.url);
  const revision = env.DEPLOYED_SHA?.trim();
  const cacheable = Boolean(revision && url.searchParams.get('rev') === revision);
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': cacheable ? 'public, max-age=31536000, immutable' : 'no-store',
    'content-language': localization.lang,
  });
  return new Response(renderRecordPane(record, localizedEnv, url.origin), { headers });
}
