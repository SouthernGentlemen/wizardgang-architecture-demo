import { cloudflareUsageQueryResult, type CloudflareUsageSnapshot } from '../lib/cloudflare-usage';
import type { Env } from '../types';
import type { ReportingObservation, ReportingQueryResult } from './contracts';
import { exportReportingPages, paginateReportingRecords, reportingCursorSecret } from './query';

export interface CloudflareReportingQuery {
  limit: number;
  cursor?: string | null;
}

function baseResult(env: Env, snapshot: CloudflareUsageSnapshot): ReportingQueryResult<ReportingObservation<number | null>> {
  return cloudflareUsageQueryResult(env, snapshot);
}

function terminalPartial(snapshot: CloudflareUsageSnapshot): 'provider-unavailable' | null {
  return snapshot.status === 'live' ? null : 'provider-unavailable';
}

async function pageFromResult(
  env: Env,
  snapshot: CloudflareUsageSnapshot,
  result: ReportingQueryResult<ReportingObservation<number | null>>,
  limit: number,
  cursor: string | null,
): Promise<ReportingQueryResult<ReportingObservation<number | null>>> {
  const page = await paginateReportingRecords(result.records, {
    context: {
      schemaVersion: result.schemaVersion,
      collection: 'cloudflare-observations',
      source: result.sources.map((source) => source.id).sort().join(','),
      filters: result.query.filters,
      ordering: [
        { field: 'resource', direction: 'asc' },
        { field: 'metric', direction: 'asc' },
      ],
    },
    limit,
    cursor,
    secret: reportingCursorSecret(env),
    terminalPartialReason: terminalPartial(snapshot),
  });
  return {
    ...result,
    query: { ...result.query, pagination: page.pagination },
    records: page.records,
    derived: { ...result.derived, count: page.records.length },
  };
}

export async function queryCloudflareReportingPage(
  env: Env,
  snapshot: CloudflareUsageSnapshot,
  query: CloudflareReportingQuery,
): Promise<ReportingQueryResult<ReportingObservation<number | null>>> {
  const result = baseResult(env, snapshot);
  return pageFromResult(env, snapshot, result, query.limit, query.cursor ?? null);
}

export async function exportCloudflareReporting(
  env: Env,
  snapshot: CloudflareUsageSnapshot,
  query: Omit<CloudflareReportingQuery, 'cursor'>,
): Promise<ReportingQueryResult<ReportingObservation<number | null>>> {
  const result = baseResult(env, snapshot);
  const exported = await exportReportingPages(async (cursor) => {
    const page = await pageFromResult(env, snapshot, result, query.limit, cursor);
    return { records: page.records, pagination: page.query.pagination! };
  }, query.limit);
  return {
    ...result,
    query: { ...result.query, pagination: exported.pagination },
    records: exported.records,
    derived: { ...result.derived, count: exported.records.length },
  };
}
