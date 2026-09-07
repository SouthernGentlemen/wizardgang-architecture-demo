import type { Env } from '../types';
import type { ReportingPagination, ReportingPaginationPartialReason } from './contracts';
import {
  createReportingPagination,
  decodeReportingCursor,
  encodeReportingCursor,
  ReportingCursorError,
  type ReportingCursorContext,
  validateReportingPageSize,
} from './pagination';

const EPHEMERAL_TEST_CURSOR_SECRET = crypto.getRandomValues(new Uint8Array(32));

export interface ReportingPage<T> {
  records: readonly T[];
  pagination: ReportingPagination;
}

export interface ReportingPageOptions {
  context: ReportingCursorContext;
  limit: number;
  cursor?: string | null;
  secret: string | Uint8Array;
  terminalPartialReason?: ReportingPaginationPartialReason | null;
}

export interface ReportingExportPage<T> {
  records: readonly T[];
  pagination: ReportingPagination;
}

export interface ReportingExportResult<T> {
  records: readonly T[];
  pagination: ReportingPagination;
}

export function reportingCursorSecret(env?: Pick<Env, 'DEMO_SESSION_SECRET'>): string | Uint8Array {
  const configured = env?.DEMO_SESSION_SECRET?.trim();
  if (configured) return configured;

  // Direct/local test helpers may omit Worker secrets. Deployed environments are expected
  // to provide DEMO_SESSION_SECRET (documented in .dev.vars.example) so cursors resume
  // across Worker isolates rather than relying on this process-local fallback.
  return EPHEMERAL_TEST_CURSOR_SECRET;
}

function cursorOffset(position: Readonly<Record<string, unknown>>, total: number): number {
  const offset = position.offset;
  if (!Number.isSafeInteger(offset) || (offset as number) < 0 || (offset as number) > total) {
    throw new ReportingCursorError('reporting_cursor_malformed', 'position.offset');
  }
  return offset as number;
}

export async function paginateReportingRecords<T>(
  records: readonly T[],
  options: ReportingPageOptions,
): Promise<ReportingPage<T>> {
  const limit = validateReportingPageSize(options.limit);
  let start = 0;
  if (options.cursor) {
    const continuation = await decodeReportingCursor(options.cursor, options.context, options.secret);
    if (continuation.provider) throw new ReportingCursorError('reporting_cursor_malformed', 'provider');
    start = cursorOffset(continuation.position, records.length);
  }

  const page = records.slice(start, start + limit);
  const nextOffset = start + page.length;
  const hasNext = nextOffset < records.length;
  const nextCursor = hasNext
    ? await encodeReportingCursor(options.context, { position: { offset: nextOffset } }, options.secret)
    : null;

  const terminalPartialReason = options.terminalPartialReason ?? null;
  return {
    records: page,
    pagination: createReportingPagination({
      limit,
      returned: page.length,
      total: records.length,
      nextCursor,
      completeness: hasNext || terminalPartialReason ? 'partial' : 'complete',
      partialReason: hasNext ? 'page-boundary' : terminalPartialReason,
    }),
  };
}

export async function exportReportingPages<T>(
  queryPage: (cursor: string | null) => Promise<ReportingExportPage<T>>,
  limit: number,
): Promise<ReportingExportResult<T>> {
  validateReportingPageSize(limit);
  const records: T[] = [];
  let cursor: string | null = null;
  let terminal: ReportingPagination | null = null;
  const seen = new Set<string>();

  do {
    if (cursor) {
      if (seen.has(cursor)) throw new Error('Reporting pagination returned a repeated cursor.');
      seen.add(cursor);
    }
    const page = await queryPage(cursor);
    records.push(...page.records);
    terminal = page.pagination;
    cursor = page.pagination.nextCursor;
  } while (cursor);

  const final = terminal ?? createReportingPagination({
    limit,
    returned: 0,
    total: 0,
    nextCursor: null,
    completeness: 'complete',
    partialReason: null,
  });

  return {
    records,
    pagination: createReportingPagination({
      limit,
      returned: records.length,
      total: records.length,
      nextCursor: null,
      completeness: final.completeness === 'partial' ? 'partial' : 'complete',
      partialReason: final.completeness === 'partial' ? final.partialReason ?? 'provider-unavailable' : null,
    }),
  };
}
