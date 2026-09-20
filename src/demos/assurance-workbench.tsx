import { Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import {
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import {
  assuranceRecordUrlsById,
  complianceFrameworks,
} from '../assurance/service';
import { resolveAssuranceDocumentationReference } from '../assurance/presentation';
import { resolveLocalization, type LocalizationContext } from '../i18n/runtime';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import { useRequestLocalization } from '../ui/document';
import { reactPageResponse } from '../ui/page';

type ComplianceRecord = PublishedAssuranceRecordMap['compliance'];
type ComplianceStatus = ComplianceRecord['status'];
type PresentedEvidenceRecord = ReturnType<typeof presentedPublishedEvidenceRecords>[number];

const DEFAULT_RECORD_ID = 'ISO27001-A.5.1';
const FRAMEWORK_ORDER = ['iso-27001', 'iso-42001', 'wcag-2.2'] as const;
const STATUS_ORDER = ['pass', 'partial', 'gap', 'not-applicable'] as const;
const WCAG_DOCUMENTATION_PATH = 'docs/ACCESSIBILITY.md';
const SOA_PATHS = [
  ['assurance.workbench.soa_27001', 'ISO/IEC 27001 statement of applicability', 'assurance/compliance/iso-27001-2022.json'],
  ['assurance.workbench.soa_42001', 'ISO/IEC 42001 statement of applicability', 'assurance/compliance/iso-42001-2023.json'],
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

export interface AssuranceWorkbenchData {
  summaries: RecordSummary[];
  initialRecord: ComplianceRecord;
  initialSummary: RecordSummary;
  initialFrameworkRecords: RecordSummary[];
  initialSectionRecords: RecordSummary[];
  evidence: PresentedEvidenceRecord[];
}

function statusLabel(status: ComplianceStatus, localization: LocalizationContext): string {
  if (status === 'not-applicable') return 'N/A';
  const english = `${status[0].toUpperCase()}${status.slice(1)}`;
  return localization.exact(english);
}

function statusGlyph(status: ComplianceStatus): string {
  if (status === 'pass') return '✓';
  if (status === 'partial') return '◐';
  if (status === 'gap') return '!';
  return '—';
}

function StatusBadge({ status, localization }: Readonly<{ status: ComplianceStatus; localization: LocalizationContext }>) {
  return <span className="assurance-status" data-status={status}>
    <span aria-hidden="true">{statusGlyph(status)}</span>{statusLabel(status, localization)}
  </span>;
}

function frameworkFor(record: ComplianceRecord) {
  return complianceFrameworks.find((framework) => framework.id === record.framework);
}

function assessmentDate(record: ComplianceRecord): string | undefined {
  return frameworkFor(record)?.assessmentDate;
}

function DocumentationReferences({ record, env, localization }: Readonly<{
  record: ComplianceRecord;
  env: Env;
  localization: LocalizationContext;
}>) {
  const references = assuranceRelationshipIds(record.relationships, 'documentation') as string[];
  if (!references.length) return <p>{localization.t('assurance.workbench.no_documentation', 'No Markdown references are recorded yet.')}</p>;
  const linkLabel = localization.t('assurance.workbench.open_documentation', 'Open documentation');
  return <ul className="assurance-reference-list">
    {references.map((reference) => {
      const resolved = resolveAssuranceDocumentationReference(reference, env);
      return <li key={reference}>
        <code lang="en">{reference}</code>
        <div><a href={resolved.url}>{linkLabel}<span className="sr-only">: {reference}</span></a></div>
      </li>;
    })}
  </ul>;
}

function EvidenceReferences({ record, evidence, localization }: Readonly<{
  record: ComplianceRecord;
  evidence: PresentedEvidenceRecord[];
  localization: LocalizationContext;
}>) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const items = (assuranceRelationshipIds(record.relationships, 'evidence') as string[]).flatMap((id) => {
    const value = evidenceById.get(id);
    return value ? [value] : [];
  });
  if (!items.length) return <p>{localization.t('assurance.workbench.no_evidence', 'No evidence records are linked yet.')}</p>;
  const locationLabel = localization.t('assurance.workbench.open_location', 'Open location');
  const recordLabel = localization.t('assurance.workbench.open_evidence_record', 'Open evidence record');
  return <ul className="assurance-evidence-list">
    {items.map((item) => {
      const recordUrl = assuranceRecordUrlsById(item.id).api;
      const locationUrl = item.resolved.url;
      return <li key={item.id}>
        <strong lang="en">{item.title}</strong>
        <div className="assurance-evidence-meta">
          <span lang="en">{item.kind}</span>
          <span>{localization.t('assurance.workbench.freshness', 'Freshness')}: {item.freshness.policy}</span>
        </div>
        <div className="assurance-evidence-links">
          {locationUrl ? <a href={locationUrl}>{locationLabel}<span className="sr-only">: {item.title}</span></a> : null}
          {recordUrl ? <a href={recordUrl}>{recordLabel}<span className="sr-only">: {item.title}</span></a> : null}
        </div>
      </li>;
    })}
  </ul>;
}

export function AssuranceRecordPane({
  record,
  evidence,
  env,
  localization,
}: Readonly<{
  record: ComplianceRecord;
  evidence: PresentedEvidenceRecord[];
  env: Env;
  localization: LocalizationContext;
}>) {
  const assessed = assessmentDate(record);
  const assessment = record.rationale || record.implementation || localization.t('assurance.workbench.no_assessment', 'No assessment rationale is recorded yet.');
  const gaps = record.gaps ?? [];
  const recordApi = assuranceRecordUrlsById(record.id).api;
  const requirementUrl = sourceUrl(env, record.sourcePath);
  const stableId = record.id.replace(/[^A-Za-z0-9_-]/g, '-');
  const docsPanelId = `assurance-docs-${stableId}`;
  const evidencePanelId = `assurance-evidence-${stableId}`;
  const assessmentLabel = localization.t('assurance.workbench.assessment', 'Assessment');
  const inspectorLabel = localization.t('assurance.workbench.record_inspector', 'Record inspector');
  return <article className="assurance-record-pane" data-assurance-record={record.id}>
    <header className="assurance-record-heading">
      <div>
        <p className="eyebrow" lang="en">{record.frameworkLabel} · {record.section}</p>
        <h2><span lang="en">{record.reference} · {record.title}</span></h2>
      </div>
      <StatusBadge status={record.status} localization={localization} />
    </header>
    <div className="assurance-record-body">
      <section className="assurance-assessment" aria-label={assessmentLabel}>
        <dl>
          <div><dt>{assessmentLabel}</dt><dd lang="en">{assessment}</dd></div>
          <div>
            <dt>{localization.t('assurance.workbench.missing', 'What is missing')}</dt>
            <dd>{gaps.length
              ? <ul lang="en">{gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
              : localization.t('assurance.workbench.no_gaps', 'No gaps are recorded for this assessment.')}</dd>
          </div>
          <div>
            <dt>{localization.t('assurance.workbench.assessed', 'Assessed')}</dt>
            <dd>{assessed
              ? record.framework === 'wcag-2.2'
                ? <a href={sourceUrl(env, WCAG_DOCUMENTATION_PATH)} aria-label={`WCAG 2.2 assessed ${assessed} — open accessibility documentation`}><time dateTime={assessed} lang="en">{assessed}</time></a>
                : <time dateTime={assessed} lang="en">{assessed}</time>
              : localization.t('assurance.workbench.no_assessed_date', 'No assessment date is recorded.')}</dd>
          </div>
        </dl>
        <div className="assurance-record-tools">
          <a href={requirementUrl}>{localization.t('assurance.workbench.open_requirement', 'Open requirement source')}</a>
          {recordApi ? <a href={recordApi}>{localization.t('assurance.workbench.open_assessment_record', 'Open assessment record')}</a> : null}
        </div>
      </section>
      <section className="assurance-inspector" aria-label={inspectorLabel}>
        <div className="assurance-inspector-tabs" role="tablist" aria-label={inspectorLabel}>
          <button className="assurance-inspector-tab" type="button" role="tab" id={`${docsPanelId}-tab`} aria-controls={docsPanelId} aria-selected="true" tabIndex={0} data-assurance-inspector-mode="documentation">{localization.t('common.documentation', 'Documentation')}</button>
          <button className="assurance-inspector-tab" type="button" role="tab" id={`${evidencePanelId}-tab`} aria-controls={evidencePanelId} aria-selected="false" tabIndex={-1} data-assurance-inspector-mode="evidence">{localization.t('assurance.section.evidence', 'Evidence')}</button>
        </div>
        <div className="assurance-inspector-panel" id={docsPanelId} role="tabpanel" aria-labelledby={`${docsPanelId}-tab`} data-assurance-inspector-panel="documentation">
          <DocumentationReferences record={record} env={env} localization={localization} />
        </div>
        <div className="assurance-inspector-panel" id={evidencePanelId} role="tabpanel" aria-labelledby={`${evidencePanelId}-tab`} data-assurance-inspector-panel="evidence" hidden>
          <EvidenceReferences record={record} evidence={evidence} localization={localization} />
        </div>
      </section>
    </div>
  </article>;
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

function Posture({ label, records, localization }: Readonly<{
  label: string;
  records: RecordSummary[];
  localization: LocalizationContext;
}>) {
  const counts = postureCounts(records);
  return <section className="assurance-posture">
    <strong>{label}</strong>
    <dl>{STATUS_ORDER.map((status) => <div key={status} data-status={status}>
      <dt><span aria-hidden="true">{statusGlyph(status)}</span> {statusLabel(status, localization)}</dt>
      <dd data-posture-count={status}>{localization.number(counts[status])}</dd>
    </div>)}</dl>
  </section>;
}

function RecordLink({ record, activeId, localization }: Readonly<{
  record: RecordSummary;
  activeId: string;
  localization: LocalizationContext;
}>) {
  return <a
    className="assurance-record-link"
    id={record.id}
    href={`#${encodeURIComponent(record.id)}`}
    data-assurance-record-link={record.id}
    aria-current={record.id === activeId ? 'true' : undefined}
  >
    <code lang="en">{record.reference}</code>
    {' '}
    <strong lang="en">{record.title}</strong>
    {' '}
    <StatusBadge status={record.status} localization={localization} />
  </a>;
}

function AssuranceBrowserModule({ records, initialId, env, localization }: Readonly<{
  records: RecordSummary[];
  initialId: string;
  env: Env;
  localization: LocalizationContext;
}>) {
  const source = routeUrl('operations.assets', { asset: browserAssetName('scripts.assurance') });
  const config = JSON.stringify({
    records,
    statuses: STATUS_ORDER,
    defaultId: initialId,
    deployedSha: env.DEPLOYED_SHA?.trim() ?? '',
    endpointTemplate: routeUrl('assurance.presentation', { record: '__record__' }),
  });
  const statusLabels = Object.fromEntries(STATUS_ORDER.map((status) => [status, statusLabel(status, localization)]));
  const messages = JSON.stringify({
    loading: localization.t('assurance.workbench.loading', 'Loading assessment record…'),
    loaded: localization.t('assurance.workbench.loaded', 'Assessment record loaded.'),
    failed: localization.t('assurance.workbench.failed', 'The assurance record could not be loaded.'),
    statusLabels,
  });
  return <script type="module" src={source} data-assurance-browser="" data-config={config} data-messages={messages} />;
}

export function AssuranceWorkbenchPage({ data, env }: Readonly<{ data: AssuranceWorkbenchData; env: Env }>) {
  const localization = useRequestLocalization();
  const sectionOptions = [...new Set(data.initialFrameworkRecords.map((record) => record.section))];
  return <>
    <section className="page-header assurance-workbench-header">
      <h1>{localization.t('nav.assurance.index', 'Assurance')}</h1>
      <p className="lede">{localization.t('assurance.workbench.lede', 'Inspect published assessment records, evidence, and documentation against the deployed source revision.')}</p>
    </section>
    <div className="assurance-workbench" data-assurance-workbench="">
      <div className="assurance-framework-tabs" role="tablist" aria-label={localization.t('assurance.workbench.frameworks', 'Frameworks')}>
        {FRAMEWORK_ORDER.map((frameworkId) => {
          const framework = complianceFrameworks.find((candidate) => candidate.id === frameworkId);
          if (!framework) return null;
          const selected = frameworkId === data.initialSummary.framework;
          return <button
            key={frameworkId}
            className="assurance-framework-tab"
            type="button"
            role="tab"
            aria-controls="assurance-workbench-panel"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            data-assurance-framework={frameworkId}
          ><span lang="en">{framework.label}</span></button>;
        })}
      </div>
      <div className="assurance-workbench-layout" id="assurance-workbench-panel" role="tabpanel">
        <aside className="assurance-workbench-controls">
          <label className="assurance-section-control">
            <span>{localization.t('assurance.workbench.section', 'Section')}</span>
            <select data-assurance-section="" defaultValue={data.initialSummary.section}>
              {sectionOptions.map((section) => <option key={section} value={section}>
                {section} · {localization.number(data.initialFrameworkRecords.filter((record) => record.section === section).length)}
              </option>)}
            </select>
          </label>
          {' '}
          <div className="assurance-posture-stack">
            <div data-assurance-section-posture=""><Posture label={localization.t('assurance.workbench.section_posture', 'Section posture')} records={data.initialSectionRecords} localization={localization} /></div>
            {' '}
            <div data-assurance-framework-posture=""><Posture label={localization.t('assurance.workbench.framework_posture', 'Framework posture')} records={data.initialFrameworkRecords} localization={localization} /></div>
          </div>
        </aside>
        {' '}
        <section className="assurance-records" aria-label={localization.t('assurance.workbench.records', 'Records')}>
          <div className="assurance-records-heading">
            <h2>{localization.t('assurance.workbench.records', 'Records')}</h2>
            <span className="assurance-record-count"><span data-assurance-record-count="">{localization.number(data.initialSectionRecords.length)}</span></span>
          </div>
          {' '}
          <div className="assurance-record-grid" data-assurance-record-grid="" aria-label={localization.t('assurance.workbench.selected_records', 'Records in selected section')}>
            {data.initialSectionRecords.map((record) => <Fragment key={record.id}><RecordLink record={record} activeId={data.initialRecord.id} localization={localization} />{' '}</Fragment>)}
          </div>
        </section>
      </div>
      <p className="assurance-workbench-status" data-assurance-status="" role="status" aria-live="polite" />
      <section className="assurance-workbench-detail" data-assurance-detail="" aria-live="off" aria-busy="false">
        <AssuranceRecordPane record={data.initialRecord} evidence={data.evidence} env={env} localization={localization} />
      </section>
      <noscript><div className="assurance-noscript">
        <p>{localization.t('assurance.workbench.noscript', 'JavaScript is required for interactive framework and section switching. You can still inspect the statements of applicability:')}</p>
        <ul>
          {SOA_PATHS.map(([key, label, path]) => <li key={path}><a href={sourceUrl(env, path)}>{localization.t(key, label)}</a></li>)}
          <li><a lang="en" href={sourceUrl(env, WCAG_DOCUMENTATION_PATH)}>WCAG 2.2 accessibility documentation</a></li>
        </ul>
      </div></noscript>
    </div>
    <AssuranceBrowserModule records={data.summaries} initialId={data.initialRecord.id} env={env} localization={localization} />
  </>;
}

export function loadAssuranceWorkbenchData(request: Request, env: Env): AssuranceWorkbenchData {
  const records = listPublishedAssuranceRecords('compliance') as ComplianceRecord[];
  const summaries = records.map(summaryFor);
  const initialRecord = records.find((record) => record.id === DEFAULT_RECORD_ID)
    ?? records.find((record) => record.framework === 'iso-27001')
    ?? records[0];
  if (!initialRecord) throw new Error('The assurance workbench requires at least one published compliance record.');
  const initialSummary = summaryFor(initialRecord);
  const initialFrameworkRecords = summaries.filter((record) => record.framework === initialSummary.framework);
  return {
    summaries,
    initialRecord,
    initialSummary,
    initialFrameworkRecords,
    initialSectionRecords: sectionRecords(summaries, initialSummary.framework, initialSummary.section),
    evidence: presentedPublishedEvidenceRecords(env, new URL(request.url).origin),
  };
}

export function renderAssuranceWorkbench(env: Env, data: AssuranceWorkbenchData): Response {
  return reactPageResponse(env, 'Assurance', <AssuranceWorkbenchPage data={data} env={env} />, {
    routeId: 'assurance.index',
    canonicalPath: routeUrl('assurance.index'),
    description: 'Browse framework assessment records, posture, evidence, and documentation in one assurance workbench.',
  });
}

export function assurancePresentationResponse(request: Request, env: Env, recordId: string): Response {
  const record = findPublishedAssuranceRecord('compliance', recordId) as ComplianceRecord | undefined;
  if (!record) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  const localization = resolveLocalization(request);
  const url = new URL(request.url);
  const revision = env.DEPLOYED_SHA?.trim();
  const cacheable = Boolean(revision && url.searchParams.get('rev') === revision);
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': cacheable ? 'public, max-age=31536000, immutable' : 'no-store',
    'content-language': localization.lang,
  });
  const evidence = presentedPublishedEvidenceRecords(env, url.origin);
  return new Response(renderToStaticMarkup(<AssuranceRecordPane record={record} evidence={evidence} env={env} localization={localization} />), { headers });
}
