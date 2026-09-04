import { describe, expect, it } from 'vitest';
import type { Principal } from '../src/lib/authorization';
import { createReportingCollection, type ReportingSource } from '../src/reporting/contracts';
import {
  discloseReportingCollection,
  downloadReportingView,
  exportReportingView,
  reportingFacets,
  reportingLinks,
  searchReportingView,
  type ReportingView,
} from '../src/reporting/disclosure';

interface PrivateReport {
  id: string;
  title: string;
  category: string;
  secret: string;
}

interface PublicReport {
  id: string;
  title: string;
  category: string;
}

const source: ReportingSource = {
  id: 'github.private-reports',
  provider: 'github',
  authority: 'structured-record',
  scope: { repository: 'example/private-authority', resource: 'reports/private' },
  nativeIdentity: ['repository', 'resource', 'id'],
  revisionIdentity: ['commit', 'blob'],
  schema: 'contracts/reporting/private-report.schema.json',
  visibility: 'private',
  capabilities: ['read', 'query', 'export'],
  ingestion: 'disabled',
};

const collection = createReportingCollection<PrivateReport>(source, [
  { id: 'REPORT-1', title: 'Approved summary', category: 'governance', secret: 'private-alpha' },
  { id: 'REPORT-2', title: 'Internal only', category: 'security', secret: 'private-bravo' },
], [
  { relation: 'supports', from: { source: source.id, native: 'REPORT-1' }, to: { source: source.id, native: 'REPORT-2' } },
  { relation: 'external', from: { source: source.id, native: 'REPORT-1' }, to: { source: 'github.other-private', native: 'HIDDEN-1' } },
]);

const anonymous: Principal = { subject: 'public-visitor', authentication: 'anonymous', permissions: ['demo:read'] };
const viewer: Principal = { subject: 'microsoft:viewer', authentication: 'oidc', provider: 'microsoft', permissions: ['demo:read', 'demo:write'] };
const operator: Principal = { subject: 'microsoft:operator', authentication: 'oidc', provider: 'microsoft', permissions: ['demo:read', 'demo:write', 'reporting:private'] };

function publication(revision = 'a'.repeat(40), approvedRevision = revision) {
  return {
    sourceRevision: revision,
    approvedRevision,
    project(record: PrivateReport): PublicReport | null {
      return record.id === 'REPORT-1' ? { id: record.id, title: record.title, category: record.category } : null;
    },
  };
}

describe('protected reporting disclosure', () => {
  it('requires authentication when a private source has no approved public projection', () => {
    expect(() => discloseReportingCollection(collection, anonymous)).toThrowError(expect.objectContaining({
      code: 'authentication_required', status: 401,
    }));
  });

  it('rejects authenticated principals without the private reporting permission', () => {
    expect(() => discloseReportingCollection(collection, viewer)).toThrowError(expect.objectContaining({
      code: 'permission_denied', status: 403,
    }));
  });

  it('returns the authoritative private collection only to an authorized principal', () => {
    const view = discloseReportingCollection(collection, operator) as ReportingView<PrivateReport>;
    expect(view.disclosure).toEqual({ kind: 'authorized' });
    expect(view.derived.count).toBe(2);
    expect(view.relationships).toHaveLength(2);
    expect(searchReportingView(view, 'private-bravo')).toHaveLength(1);
    expect(downloadReportingView(view)).toContain('private-bravo');
  });

  it('derives every public aggregate and traversal only after revision-bound projection', () => {
    const view = discloseReportingCollection(collection, anonymous, publication()) as ReportingView<PublicReport>;
    expect(view.disclosure).toEqual({ kind: 'published-projection', sourceRevision: 'a'.repeat(40) });
    expect(view.source).toMatchObject({ visibility: 'public', scope: { resource: 'reports/private' }, ingestion: 'disabled' });
    expect(view.source.scope).not.toHaveProperty('repository');
    expect(view.records).toEqual([{ id: 'REPORT-1', title: 'Approved summary', category: 'governance' }]);
    expect(view.derived.count).toBe(1);
    expect(reportingFacets(view, 'category')).toEqual({ governance: 1 });
    expect(searchReportingView(view, 'private-alpha')).toEqual([]);
    expect(searchReportingView(view, 'Internal only')).toEqual([]);
    expect(view.relationships).toEqual([]);
    expect(reportingLinks(view, (record) => `/reports/${record.id}`)).toEqual(['/reports/REPORT-1']);
    const exported = exportReportingView(view);
    expect(exported.records).toEqual(view.records);
    expect(exported.relationships).toEqual([]);
    expect(JSON.stringify(exported)).not.toMatch(/private-alpha|private-bravo|HIDDEN-1|example\/private-authority/);
    expect(downloadReportingView(view)).not.toMatch(/private-alpha|private-bravo|HIDDEN-1|example\/private-authority/);
  });

  it('fails closed when the source revision no longer matches the approved publication revision', () => {
    expect(() => discloseReportingCollection(collection, anonymous, publication('b'.repeat(40), 'a'.repeat(40))))
      .toThrowError(expect.objectContaining({ code: 'reporting_publication_revision_mismatch', status: 409 }));
  });
});
