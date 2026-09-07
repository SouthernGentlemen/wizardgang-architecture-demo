import type { Principal } from '../lib/authorization';
import type { Env } from '../types';
import type { ReportingPaginationPartialReason, ReportingQueryResult } from './contracts';
import {
  type GitHubReportingQueryOutcome,
  type GitHubReportingRecord,
  queryGitHubReporting,
} from './github';
import type { ReportingCursorContext } from './pagination';
import {
  exportReportingPages,
  paginateReportingRecords,
  reportingCursorSecret,
} from './query';

export interface GitHubReportingPageQuery {
  repository?: string;
  sourceIds?: readonly string[];
  limit: number;
  cursor?: string | null;
}

interface GitHubReportingSnapshot {
  outcome: GitHubReportingQueryOutcome;
  context: ReportingCursorContext;
  filters: Readonly<Record<string, string>>;
  terminalPartialReason: ReportingPaginationPartialReason | null;
}

function normalizedSourceIds(sourceIds: readonly string[] | undefined): readonly string[] {
  return sourceIds ? [...new Set(sourceIds.map((value) => value.trim()).filter(Boolean))].sort() : [];
}

function publicFilters(query: GitHubReportingPageQuery, outcome: GitHubReportingQueryOutcome): Readonly<Record<string, string>> {
  const sourceIds = normalizedSourceIds(query.sourceIds);
  return {
    repository: outcome.result.query.filters.repository ?? query.repository?.trim() ?? '',
    source: sourceIds.join(','),
  };
}

function cursorContext(
  query: GitHubReportingPageQuery,
  filters: Readonly<Record<string, string>>,
): ReportingCursorContext {
  const sourceIds = normalizedSourceIds(query.sourceIds);
  return {
    schemaVersion: 1,
    collection: 'github-reporting',
    source: sourceIds.length > 0 ? sourceIds.join(',') : 'github:public',
    filters,
    ordering: [{ field: 'provider-order', direction: 'asc' }],
  };
}

function terminalPartialReason(outcome: GitHubReportingQueryOutcome): ReportingPaginationPartialReason | null {
  const entries = Object.entries(outcome.result.qualifications);
  const incomplete = entries.some(([key, value]) => key.endsWith('.completeness') && value !== 'complete');
  if (!incomplete) return null;
  const providerBound = entries.some(([key, value]) => key.endsWith('.detail') && value === 'pagination_bound_reached');
  return providerBound ? 'provider-export-bound' : 'provider-unavailable';
}

function sanitizedQualifications(
  qualifications: Readonly<Record<string, string | null>>,
): Readonly<Record<string, string | null>> {
  return Object.fromEntries(Object.entries(qualifications).filter(([key]) => key !== 'mode' && !key.endsWith('.nextCursor')));
}

async function reportingSnapshot(
  env: Env,
  principal: Principal,
  query: GitHubReportingPageQuery,
): Promise<GitHubReportingSnapshot> {
  // Native providers retain their own hard safety bound. The provider collector runs in
  // bounded export mode internally, but that mode and every provider cursor remain private.
  const outcome = await queryGitHubReporting(env, principal, {
    ...(query.repository ? { repository: query.repository } : {}),
    ...(query.sourceIds ? { sourceIds: normalizedSourceIds(query.sourceIds) } : {}),
    mode: 'export',
    limit: 100,
  });
  const filters = publicFilters(query, outcome);
  return {
    outcome,
    context: cursorContext(query, filters),
    filters,
    terminalPartialReason: terminalPartialReason(outcome),
  };
}

async function pageSnapshot(
  env: Env,
  snapshot: GitHubReportingSnapshot,
  limit: number,
  cursor: string | null,
): Promise<GitHubReportingQueryOutcome> {
  const page = await paginateReportingRecords(snapshot.outcome.result.records, {
    context: snapshot.context,
    limit,
    cursor,
    secret: reportingCursorSecret(env),
    terminalPartialReason: snapshot.terminalPartialReason,
  });
  const result: ReportingQueryResult<GitHubReportingRecord> = {
    ...snapshot.outcome.result,
    qualifications: sanitizedQualifications(snapshot.outcome.result.qualifications),
    query: { filters: snapshot.filters, pagination: page.pagination },
    records: page.records,
    derived: {
      ...snapshot.outcome.result.derived,
      count: page.records.length,
    },
  };
  return { result, protected: snapshot.outcome.protected };
}

export async function queryGitHubReportingPage(
  env: Env,
  principal: Principal,
  query: GitHubReportingPageQuery,
): Promise<GitHubReportingQueryOutcome> {
  const snapshot = await reportingSnapshot(env, principal, query);
  return pageSnapshot(env, snapshot, query.limit, query.cursor ?? null);
}

export async function exportGitHubReporting(
  env: Env,
  principal: Principal,
  query: Omit<GitHubReportingPageQuery, 'cursor'>,
): Promise<GitHubReportingQueryOutcome> {
  const snapshot = await reportingSnapshot(env, principal, query);
  const exported = await exportReportingPages(
    async (cursor) => {
      const page = await pageSnapshot(env, snapshot, query.limit, cursor);
      return { records: page.result.records, pagination: page.result.query.pagination! };
    },
    query.limit,
  );
  const result: ReportingQueryResult<GitHubReportingRecord> = {
    ...snapshot.outcome.result,
    qualifications: sanitizedQualifications(snapshot.outcome.result.qualifications),
    query: { filters: snapshot.filters, pagination: exported.pagination },
    records: exported.records,
    derived: {
      ...snapshot.outcome.result.derived,
      count: exported.records.length,
      totalAvailable: exported.records.length,
    },
  };
  return { result, protected: snapshot.outcome.protected };
}
