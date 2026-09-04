import type { Env } from '../types';
import { authorize } from '../lib/authorization';
import { json, methodNotAllowed, readJson } from '../lib/http';
import {
  GitHubReportingError,
  importGitHubReporting,
  queryGitHubReporting,
  type GitHubReportingImportRequest,
  type GitHubReportingMode,
} from '../reporting/github';

function sourceIds(url: URL): string[] | undefined {
  const values = url.searchParams.getAll('source')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? [...new Set(values)] : undefined;
}

function mode(url: URL): GitHubReportingMode {
  const value = url.searchParams.get('mode');
  if (value === null || value === 'sample') return 'sample';
  if (value === 'export') return 'export';
  throw new GitHubReportingError(400, 'github_reporting_mode_invalid', 'mode must be sample or export.');
}

function limit(url: URL): number | undefined {
  const value = url.searchParams.get('limit');
  if (value === null) return undefined;
  if (!/^\d+$/.test(value)) throw new GitHubReportingError(400, 'github_reporting_limit_invalid');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) throw new GitHubReportingError(400, 'github_reporting_limit_invalid');
  return parsed;
}

function errorResponse(error: GitHubReportingError): Response {
  return json({ error: error.code, ...(error.detail ? { detail: error.detail } : {}) }, {
    status: error.status,
    headers: {
      'cache-control': 'no-store',
      ...(error.status === 401 ? { 'www-authenticate': 'Bearer realm="WizardGang architecture demo"' } : {}),
      ...(error.status === 429 ? { 'retry-after': '60' } : {}),
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

    const principal = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
    if (principal instanceof Response) return principal;
    const url = new URL(request.url);
    const outcome = await queryGitHubReporting(env, principal, {
      repository: url.searchParams.get('repository') || undefined,
      sourceIds: sourceIds(url),
      mode: mode(url),
      limit: limit(url),
    });
    return json(outcome.result, {
      headers: outcome.protected
        ? { 'cache-control': 'private, no-store', vary: 'Authorization, Cookie' }
        : { 'cache-control': 'public, max-age=30, s-maxage=30', vary: 'Accept' },
    });
  } catch (error) {
    if (error instanceof GitHubReportingError) return errorResponse(error);
    throw error;
  }
}
