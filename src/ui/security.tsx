import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import {
  listPublishedAssuranceRecords,
  type PublishedAssuranceRecordMap,
} from '../assurance/publication';
import {
  assuranceAnchor,
  assuranceDatasetSchema,
  assuranceDatasetSource,
  assuranceRecordUrlsById,
} from '../assurance/service';
import {
  assuranceCollectionApiRoute,
  assuranceHtmlRoute,
} from '../assurance/routes';
import { repoUrl, sourceUrl } from '../lib/github';
import type { Env } from '../types';
import { useRequestLocalization } from './document';
import { reactPageResponse } from './page';
import { ReferenceDetails } from './reference-details';

const SECURITY_ROUTE = assuranceHtmlRoute('advisories');
const ADVISORIES_API_ROUTE = assuranceCollectionApiRoute('advisories');
const privateReportUrl = (env: Env) => `${repoUrl(env)}/security/advisories/new`;
const publishedAdvisoriesUrl = (env: Env) => `${repoUrl(env)}/security/advisories`;
const publicIssuesUrl = (env: Env) => `${repoUrl(env)}/issues/new/choose`;

export interface SecurityPageData {
  advisories: readonly PublishedAssuranceRecordMap['advisories'][];
}

export function loadSecurityPageData(): SecurityPageData {
  return { advisories: listPublishedAssuranceRecords('advisories') };
}

function AdvisoryCard({ env, advisory }: Readonly<{ env: Env; advisory: PublishedAssuranceRecordMap['advisories'] }>) {
  const localization = useRequestLocalization();
  const advisoryUrl = `${publishedAdvisoriesUrl(env)}/${encodeURIComponent(advisory.id)}`;
  const incidentIds = assuranceRelationshipIds(advisory.relationships, 'incidents');
  return <article className="info-card" id={assuranceAnchor(advisory.id)}>
    <p className="eyebrow">Published advisory · <a href={advisoryUrl}>{advisory.id}</a></p>
    <h3>{localization.exact(advisory.title)}</h3>
    <p><strong>Severity:</strong> {advisory.severity} · <strong>Published:</strong> <time dateTime={advisory.publishedAt}>{advisory.publishedAt}</time>{advisory.cveId ? <> · <strong>CVE:</strong> {advisory.cveId}</> : null}</p>
    <p><strong>Lifecycle:</strong> {advisory.publication.lifecycle} · <strong>Disclosure:</strong> {advisory.publication.disclosureReview}</p>
    <p>{advisory.summary}</p>
    <p><strong>Fixed release{advisory.fixedReleases.length === 1 ? '' : 's'}:</strong>{' '}
      {advisory.fixedReleases.map((release, index) => <span key={release}>{index > 0 ? ', ' : null}<a href={`${repoUrl(env)}/releases/tag/${encodeURIComponent(release)}`}>{release}</a></span>)}
    </p>
    <p><strong>Incident linkage:</strong>{' '}
      {incidentIds.length === 0 ? 'None' : incidentIds.map((id, index) => {
        const href = assuranceRecordUrlsById(id).html;
        return <span key={id}>{index > 0 ? ', ' : null}{href ? <a href={localization.href(href)}>{id}</a> : <code>{id}</code>}</span>;
      })}
    </p>
  </article>;
}

export function SecurityPage({ env, data }: Readonly<{ env: Env; data: SecurityPageData }>) {
  const localization = useRequestLocalization();
  const advisories = data.advisories;
  return <>
    <section className="page-header assurance-header">
      <h1>{localization.exact('Security')}</h1>
      <p className="lede">Report suspected vulnerabilities privately, understand the coordinated disclosure process, and review disclosure-safe published advisories.</p>
      <p className="assurance-notice"><strong>Do not open a public issue for sensitive security information.</strong> Private report contents are never exposed through the public assurance registry.</p>
      <nav className="link-row" aria-label="Security sections"><a href="#report-vulnerability">Report</a><a href="#disclosure-process">Process</a><a href="#published-advisories">Advisories</a></nav>
    </section>
    <section id="report-vulnerability" className="assurance-section" aria-labelledby="report-vulnerability-heading">
      <div className="section-heading">
        <p className="eyebrow">Private reporting</p>
        <h2 id="report-vulnerability-heading">{localization.t('security.report_vulnerability', 'Report vulnerability')}</h2>
        <p>Use the repository's private vulnerability channel for suspected vulnerabilities, active security incidents, credentials, exploit details, or sensitive infrastructure information.</p>
      </div>
      <div className="page-tools">
        <a className="button button-primary" href={privateReportUrl(env)}>{localization.t('security.open_private_report', 'Open a private security report')}</a>
        <a className="text-link" href={ADVISORIES_API_ROUTE}>Published advisory JSON</a>
        <ReferenceDetails links={[
          { label: 'Security page implementation', href: sourceUrl(env, 'src/ui/security.tsx') },
          { label: 'Security policy source', href: sourceUrl(env, 'SECURITY.md') },
          { label: 'Machine-readable security.txt', href: '/.well-known/security.txt' },
          { label: 'Published repository advisories', href: publishedAdvisoriesUrl(env) },
          { label: 'Advisory dataset', href: sourceUrl(env, assuranceDatasetSource('advisories')) },
          { label: 'Advisory schema', href: sourceUrl(env, assuranceDatasetSchema('advisories')) },
          { label: 'Canonical assurance service', href: sourceUrl(env, 'src/assurance/service.ts') },
          { label: 'Canonical reporting API', href: sourceUrl(env, 'src/api/reporting.ts') },
          { label: 'Publication policy', href: sourceUrl(env, 'src/assurance/publication-policy.js') },
        ]} />
      </div>
      <div className="info-grid">
        <article className="info-card"><h3>{localization.t('security.what_report', 'What to report')}</h3><p>Describe the affected route, component, or release; the observed behavior and impact; reproducible steps; and any safe supporting evidence. Keep reporter identity, exploit detail, and sensitive infrastructure context inside the private channel.</p></article>
        <article className="info-card"><h3>{localization.t('security.what_next', 'What happens next')}</h3><p>The report is privately triaged. Maintainers may request clarification, reject a non-security report, coordinate remediation in a draft GitHub Security Advisory, and publish only disclosure-safe information after a fix is released.</p></article>
        <article className="info-card" id="non-security-feedback"><h3>Non-security concerns</h3><p>Bugs, feature requests, accessibility issues, AI/MCP concerns, and other non-sensitive feedback belong in the repository's public issue forms.</p><p><a href={publicIssuesUrl(env)}>Choose a public issue form →</a></p></article>
      </div>
    </section>
    <section id="disclosure-process" className="assurance-section" aria-labelledby="disclosure-process-heading">
      <div className="section-heading">
        <p className="eyebrow">Coordinated disclosure</p>
        <h2 id="disclosure-process-heading">{localization.t('security.disclosure_process', 'Disclosure process')}</h2>
        <p>Private report → triage → GHSA → fix/release → eligible CVE → public advisory.</p>
      </div>
      <ol className="evidence-list disclosure-timeline">
        <li><strong>Private report.</strong> Suspected vulnerabilities enter GitHub private vulnerability reporting. Reporter identity, private reproduction detail, attachments, credentials, and sensitive infrastructure information remain private.</li>
        <li><strong>Triage.</strong> Maintainers validate scope and impact, request clarification when needed, and decide whether the report is a security vulnerability. Triage data is not public assurance data.</li>
        <li><strong>GHSA coordination.</strong> A confirmed issue may be managed in a draft GitHub Security Advisory while remediation is coordinated. Draft advisory content remains private.</li>
        <li><strong>Fix and release.</strong> The vulnerability is remediated and a fixed release is published before this registry creates a public advisory record.</li>
        <li><strong>Eligible CVE.</strong> A CVE is requested or associated only when appropriate and is included here only after an actual public identifier is assigned.</li>
        <li><strong>Public advisory.</strong> The sanitized GitHub Security Advisory is published, then its public GHSA identity, severity, summary, fixed release, optional CVE, evidence, and any valid incident linkage may enter the canonical public assurance dataset.</li>
      </ol>
      <p className="assurance-notice"><strong>Incident linkage is optional and never automatic.</strong> An advisory may reference an <code>INC-*</code> record only when that actual incident already exists in the retained incident register. Publishing an advisory does not create an incident record.</p>
    </section>
    <section id="published-advisories" className="assurance-section" aria-labelledby="published-advisories-heading">
      <div className="section-heading">
        <p className="eyebrow">Published disclosure</p>
        <h2 id="published-advisories-heading">{localization.t('security.published_advisories', 'Published advisories')}</h2>
        <p>{localization.number(advisories.length)} public advisory record{advisories.length === 1 ? '' : 's'} in the canonical assurance dataset. Private reports and private GitHub draft advisories are deliberately excluded; reviewed public assurance records may use the Draft lifecycle state.</p>
      </div>
      <div className="info-grid">
        {advisories.length > 0
          ? advisories.map((advisory) => <AdvisoryCard key={advisory.id} env={env} advisory={advisory} />)
          : <article className="info-card">
            <h3>No published advisories are established</h3>
            <p>The public assurance registry currently contains no published security advisory records. This is not a claim that no vulnerabilities, private reports, defects, or security investigations have existed.</p>
          </article>}
      </div>
    </section>
  </>;
}

export function renderSecurity(env: Env, data: SecurityPageData): Response {
  return reactPageResponse(env, 'Security', <SecurityPage env={env} data={data} />, {
    routeId: 'security.index',
    canonicalPath: SECURITY_ROUTE,
    cacheControl: 'no-store',
    description: 'Private vulnerability reporting, coordinated disclosure lifecycle, and disclosure-safe published advisory assurance for the WizardGang Architecture Demo.',
  });
}
