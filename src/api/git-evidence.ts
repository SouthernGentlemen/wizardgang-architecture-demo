import type { Env } from '../types';
import { authorize } from '../lib/authorization';
import { json, methodNotAllowed, readJson } from '../lib/http';
import {
  GitHubReportingError,
  importGitHubReporting,
  type GitHubReportingImportRequest,
} from '../reporting/github';
import {
  exportGitHubReporting,
  queryGitHubReportingPage,
} from '../reporting/github-query';
import { ReportingCursorError } from '../reporting/pagination';

const DEFAULT_PAGE_LIMIT = 50;

function sourceIds(url: URL): string[] | undefined {
  const values = url.searchParams.getAll('source')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? [...new Set(values)] : undefined;
}

function limit(url: URL): number {
  const values = url.searchParams.getAll('limit');
  if (values.length > 1) throw new GitHubReportingError(400, 'github_reporting_limit_invalid');
  const value = values[0];
  if (value === undefined) return DEFAULT_PAGE_LIMIT;
  if (!/^[1-9]\d*$/.test(value)) throw new GitHubReportingError(400, 'github_reporting_limit_invalid');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) throw new GitHubReportingError(400, 'github_reporting_limit_invalid');
  return parsed;
}

function cursor(url: URL): string | null {
  const values = url.searchParams.getAll('cursor');
  if (values.length > 1 || values[0] === '') throw new GitHubReportingError(400, 'github_reporting_cursor_invalid');
  return values[0] ?? null;
}

function exportRequested(url: URL): boolean {
  if (url.searchParams.has('mode')) {
    throw new GitHubReportingError(400, 'github_reporting_mode_removed', 'Use export=1 for a complete bounded export; browsing uses the same paginated query contract.');
  }
  const values = url.searchParams.getAll('export');
  if (values.length > 1) throw new GitHubReportingError(400, 'github_reporting_export_invalid');
  const value = values[0];
  if (value === undefined) return false;
  if (value !== '1') throw new GitHubReportingError(400, 'github_reporting_export_invalid');
  return true;
}

function errorResponse(error: GitHubReportingError | ReportingCursorError): Response {
  const status = error instanceof GitHubReportingError ? error.status : 400;
  const detail = error.detail;
  const code = error instanceof GitHubReportingError ? error.code : error.code;
  return json({ error: code, ...(detail ? { detail } : {}) }, {
    status,
    headers: {
      'cache-control': 'no-store',
      ...(status === 401 ? { 'www-authenticate': 'Bearer realm="WizardGang architecture demo"' } : {}),
      ...(status === 429 ? { 'retry-after': '60' } : {}),
    },
  });
}

export async function gitEvidenceResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') return methodNotAllowed(['GET', 'POST']);
  try {
    if (request.method === 'POST') {
      const principal = await authorize(request, env, 'reporting:write', { allowIdentitySession: true });
      if (principal instanceof Response) return principal;
      const input = await readJson<GitHubReportingImportRequest>(request, 32_768);
      const record = await importGitHubReporting(env, principal, input);
      return json({
        contract: 'contracts/assurance/reporting.schema.json',
        source: input.source,
        operation: input.operation,
        record,
      }, { headers: { 'cache-control': 'private, no-store', vary: 'Authorization, Cookie' } });
    }

    // Authorization is intentionally evaluated before cursor decoding on every page. A
    // cursor never carries or restores authority from a previous request.
    const principal = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
    if (principal instanceof Response) return principal;
    const url = new URL(request.url);
    const query = {
      repository: url.searchParams.get('repository') || undefined,
      sourceIds: sourceIds(url),
      limit: limit(url),
    };
    const outcome = exportRequested(url)
      ? await exportGitHubReporting(env, principal, query)
      : await queryGitHubReportingPage(env, principal, { ...query, cursor: cursor(url) });
    return json(outcome.result, {
      headers: outcome.protected
        ? { 'cache-control': 'private, no-store', vary: 'Authorization, Cookie' }
        : { 'cache-control': 'public, max-age=30, s-maxage=30', vary: 'Accept' },
    });
  } catch (error) {
    if (error instanceof GitHubReportingError || error instanceof ReportingCursorError) return errorResponse(error);
    throw error;
  }
}
