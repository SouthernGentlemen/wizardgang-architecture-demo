import type { Principal } from '../lib/authorization';
import type { Env } from '../types';
import type {
  ReportingAvailability,
  ReportingIdentity,
  ReportingQueryResult,
  ReportingRelationship,
  ReportingSource,
} from './contracts';
import { registeredReportingSources } from './registry';

const GITHUB_API_ROOT = 'https://api.github.com';
const REPORTING_CONTRACT = 'contracts/assurance/reporting.schema.json';
const DEFAULT_PAGE_LIMIT = 5;
const DEFAULT_MAX_PAGES = 20;
const MAX_PAGE_LIMIT = 100;
const MAX_EXPORT_PAGES = 50;
const ISSUE_WRITE_FIELDS = new Set(['title', 'body', 'state', 'labels', 'assignees', 'milestone']);

type JsonObject = Record<string, unknown>;
export type GitHubReportingMode = 'sample' | 'export';

export interface GitHubReportingBinding {
  repository: string;
  branch?: string;
  sources?: readonly string[];
  issueLabels?: readonly string[];
}

export interface GitHubReportingRecord extends JsonObject {
  id: string;
  source: string;
  provider: 'github';
  repository: string;
  resource: string;
  nativeId: string;
  identity: ReportingIdentity;
  revision: string | null;
  url: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  availability: ReportingAvailability;
  relationships: readonly ReportingRelationship[];
  native: JsonObject;
}

export interface GitHubReportingQuery {
  repository?: string;
  sourceIds?: readonly string[];
  mode?: GitHubReportingMode;
  limit?: number;
}

export interface GitHubReportingQueryOutcome {
  result: ReportingQueryResult<GitHubReportingRecord>;
  protected: boolean;
}

export interface GitHubReportingImportRequest {
  source: string;
  repository: string;
  operation: 'update';
  nativeId: string;
  revision: string;
  fields: Readonly<Record<string, unknown>>;
}

export class GitHubReportingError extends Error {
  constructor(readonly status: number, readonly code: string, readonly detail?: string) {
    super(code);
  }
}

interface SourceFetchResult {
  source: ReportingSource;
  records: GitHubReportingRecord[];
  availability: ReportingAvailability;
  complete: boolean;
  nextCursor: string | null;
  detail: string | null;
}

interface PageResult {
  items: JsonObject[];
  availability: ReportingAvailability;
  complete: boolean;
  nextCursor: string | null;
  detail: string | null;
}

interface RepositoryContext {
  binding: GitHubReportingBinding;
  repository: JsonObject;
  private: boolean;
  defaultBranch: string;
  maxPages: number;
  readToken?: string;
}

function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null;
}

function asObjects(value: unknown): JsonObject[] {
  if (!Array.isArray(value)) return [];
  return value.map(asObject).filter((candidate): candidate is JsonObject => Boolean(candidate));
}

function text(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function nested(object: JsonObject, ...path: string[]): unknown {
  let current: unknown = object;
  for (const segment of path) {
    const record = asObject(current);
    if (!record) return undefined;
    current = record[segment];
  }
  return current;
}

function repositoryFromUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]+$/.test(part))) return null;
    return `${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

function validRepository(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

function normalizedStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value
    .filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
    .map((candidate) => candidate.trim());
  return values.length > 0 ? [...new Set(values)] : undefined;
}

function githubNativeSources(): ReportingSource[] {
  return registeredReportingSources()
    .filter((source) => source.provider === 'github' && source.authority === 'native-object');
}

export function configuredGitHubReportingBindings(env: Env): readonly GitHubReportingBinding[] {
  const registeredIds = new Set(githubNativeSources().map((source) => source.id));
  if (env.GITHUB_REPORTING_BINDINGS) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(env.GITHUB_REPORTING_BINDINGS);
    } catch {
      throw new GitHubReportingError(503, 'github_reporting_binding_invalid', 'GITHUB_REPORTING_BINDINGS is not valid JSON.');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new GitHubReportingError(503, 'github_reporting_binding_invalid', 'GITHUB_REPORTING_BINDINGS must be a non-empty array.');
    }
    const bindings = parsed.map((entry): GitHubReportingBinding => {
      const object = asObject(entry);
      if (!object || !validRepository(object.repository)) {
        throw new GitHubReportingError(503, 'github_reporting_binding_invalid', 'Each GitHub reporting binding requires owner/repository.');
      }
      const sources = normalizedStringList(object.sources);
      if (sources?.some((source) => !registeredIds.has(source))) {
        throw new GitHubReportingError(503, 'github_reporting_source_unregistered', 'A configured GitHub source is not registered.');
      }
      const branch = text(object.branch) ?? undefined;
      const issueLabels = normalizedStringList(object.issueLabels);
      return {
        repository: object.repository,
        ...(branch ? { branch } : {}),
        ...(sources ? { sources } : {}),
        ...(issueLabels ? { issueLabels } : {}),
      };
    });
    if (new Set(bindings.map((binding) => binding.repository)).size !== bindings.length) {
      throw new GitHubReportingError(503, 'github_reporting_duplicate_binding', 'Repository bindings must be unique.');
    }
    return bindings;
  }

  const repository = repositoryFromUrl(env.GITHUB_REPO_URL);
  if (!repository) {
    throw new GitHubReportingError(503, 'github_reporting_binding_missing', 'No valid configured GitHub repository binding is available.');
  }
  return [{ repository, branch: env.GITHUB_BRANCH || undefined }];
}

function boundSource(source: ReportingSource, repository: string): ReportingSource {
  return { ...source, scope: { ...source.scope, repository } };
}

function sourceFor(id: string, repository: string): ReportingSource {
  const source = githubNativeSources().find((candidate) => candidate.id === id);
  if (!source) throw new GitHubReportingError(400, 'github_reporting_source_unregistered', id);
  return boundSource(source, repository);
}

function bindingFor(env: Env, repository?: string): GitHubReportingBinding {
  const bindings = configuredGitHubReportingBindings(env);
  const selected = repository ? bindings.find((binding) => binding.repository === repository) : bindings[0];
  if (!selected) throw new GitHubReportingError(404, 'github_reporting_binding_not_found', repository);
  return selected;
}

function requireBoundSource(binding: GitHubReportingBinding, source: ReportingSource): void {
  if (binding.sources && !binding.sources.includes(source.id)) {
    throw new GitHubReportingError(404, 'github_reporting_source_not_bound', `${binding.repository}:${source.id}`);
  }
}

function isAuthenticated(principal: Principal): boolean {
  return principal.authentication !== 'anonymous';
}

function requirePrivate(principal: Principal): void {
  if (principal.permissions.includes('reporting:private')) return;
  throw new GitHubReportingError(
    isAuthenticated(principal) ? 403 : 401,
    isAuthenticated(principal) ? 'permission_denied' : 'authentication_required',
  );
}

function configuredMaxPages(env: Env): number {
  const configured = Number(env.GITHUB_REPORTING_MAX_PAGES || DEFAULT_MAX_PAGES);
  if (!Number.isInteger(configured)) return DEFAULT_MAX_PAGES;
  return Math.max(1, Math.min(MAX_EXPORT_PAGES, configured));
}

function githubHeaders(token?: string, extra?: HeadersInit): Headers {
  const result = new Headers({
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  });
  if (token) result.set('authorization', `Bearer ${token}`);
  if (extra) new Headers(extra).forEach((value, name) => result.set(name, value));
  return result;
}

function classifyFailure(response: Response): { availability: ReportingAvailability; detail: string } {
  if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) {
    return { availability: 'rate-limited', detail: 'github_rate_limited' };
  }
  if (response.status === 410) return { availability: 'expired', detail: 'github_resource_expired' };
  if (response.status === 401 || response.status === 403) return { availability: 'unavailable', detail: 'github_scope_insufficient' };
  if (response.status === 404) return { availability: 'unavailable', detail: 'github_resource_not_found' };
  return { availability: 'unavailable', detail: 'github_provider_unavailable' };
}

async function githubJson(url: string, token?: string, init: RequestInit = {}): Promise<{ response: Response; value: unknown }> {
  try {
    const response = await fetch(url, { ...init, headers: githubHeaders(token, init.headers) });
    let value: unknown = null;
    if (response.status !== 204) {
      try { value = await response.json(); } catch { value = null; }
    }
    return { response, value };
  } catch {
    throw new GitHubReportingError(503, 'github_provider_unavailable', 'The configured GitHub source could not be reached.');
  }
}

async function repositoryContext(
  env: Env,
  principal: Principal,
  binding: GitHubReportingBinding,
  needsProtectedSource: boolean,
): Promise<RepositoryContext> {
  const endpoint = `${GITHUB_API_ROOT}/repos/${binding.repository}`;
  const publicProbe = await githubJson(endpoint);
  if (publicProbe.response.ok) {
    const repository = asObject(publicProbe.value);
    if (!repository) throw new GitHubReportingError(503, 'github_provider_invalid_response');
    if (needsProtectedSource) {
      requirePrivate(principal);
      if (!env.GITHUB_READ_TOKEN) {
        throw new GitHubReportingError(503, 'github_read_credential_missing', 'Protected GitHub reporting requires GITHUB_READ_TOKEN.');
      }
    }
    return {
      binding,
      repository,
      private: false,
      defaultBranch: text(repository.default_branch) || binding.branch || env.GITHUB_BRANCH || 'main',
      maxPages: configuredMaxPages(env),
      ...(needsProtectedSource && env.GITHUB_READ_TOKEN ? { readToken: env.GITHUB_READ_TOKEN } : {}),
    };
  }

  if (publicProbe.response.status !== 403 && publicProbe.response.status !== 404) {
    const failure = classifyFailure(publicProbe.response);
    throw new GitHubReportingError(failure.availability === 'rate-limited' ? 429 : 503, failure.detail);
  }
  requirePrivate(principal);
  if (!env.GITHUB_READ_TOKEN) {
    throw new GitHubReportingError(503, 'github_read_credential_missing', 'Private repository reporting requires GITHUB_READ_TOKEN.');
  }
  const protectedProbe = await githubJson(endpoint, env.GITHUB_READ_TOKEN);
  if (!protectedProbe.response.ok) {
    const failure = classifyFailure(protectedProbe.response);
    throw new GitHubReportingError(failure.availability === 'rate-limited' ? 429 : 503, failure.detail);
  }
  const repository = asObject(protectedProbe.value);
  if (!repository) throw new GitHubReportingError(503, 'github_provider_invalid_response');
  return {
    binding,
    repository,
    private: repository.private === true,
    defaultBranch: text(repository.default_branch) || binding.branch || env.GITHUB_BRANCH || 'main',
    maxPages: configuredMaxPages(env),
    readToken: env.GITHUB_READ_TOKEN,
  };
}

function linkHasNext(header: string | null): boolean {
  return Boolean(header?.split(',').some((part) => /rel="next"/.test(part)));
}

function collection(value: unknown, key?: string): { items: JsonObject[]; totalCount: number | null } {
  if (!key) return { items: asObjects(value), totalCount: null };
  const object = asObject(value);
  if (!object) return { items: [], totalCount: null };
  return {
    items: asObjects(object[key]),
    totalCount: typeof object.total_count === 'number' && Number.isFinite(object.total_count) ? object.total_count : null,
  };
}

async function fetchPaged(
  context: RepositoryContext,
  path: string,
  mode: GitHubReportingMode,
  limit: number,
  key?: string,
): Promise<PageResult> {
  const items: JsonObject[] = [];
  const pageLimit = mode === 'export' ? MAX_PAGE_LIMIT : Math.max(1, Math.min(MAX_PAGE_LIMIT, limit));
  let page = 1;
  let exactTotal: number | null = null;

  while (true) {
    const url = new URL(`${GITHUB_API_ROOT}/repos/${context.binding.repository}${path}`);
    url.searchParams.set('per_page', String(pageLimit));
    url.searchParams.set('page', String(page));
    const { response, value } = await githubJson(url.toString(), context.readToken);
    if (!response.ok) {
      const failure = classifyFailure(response);
      return { items, availability: failure.availability, complete: false, nextCursor: null, detail: failure.detail };
    }

    const current = collection(value, key);
    items.push(...current.items);
    exactTotal = current.totalCount ?? exactTotal;
    const next = linkHasNext(response.headers.get('link')) || (exactTotal !== null && items.length < exactTotal);
    if (!next) return { items, availability: 'available', complete: true, nextCursor: null, detail: null };
    if (mode === 'sample') {
      return { items, availability: 'partial', complete: false, nextCursor: `page:${page + 1}`, detail: 'dashboard_sample' };
    }
    if (page >= context.maxPages) {
      return { items, availability: 'partial', complete: false, nextCursor: `page:${page + 1}`, detail: 'pagination_bound_reached' };
    }
    page += 1;
  }
}

async function fetchSingle(context: RepositoryContext, path: string): Promise<PageResult> {
  const { response, value } = await githubJson(`${GITHUB_API_ROOT}/repos/${context.binding.repository}${path}`, context.readToken);
  if (!response.ok) {
    const failure = classifyFailure(response);
    return { items: [], availability: failure.availability, complete: false, nextCursor: null, detail: failure.detail };
  }
  const object = asObject(value);
  if (!object) {
    return { items: [], availability: 'unavailable', complete: false, nextCursor: null, detail: 'github_provider_invalid_response' };
  }
  return { items: [object], availability: 'available', complete: true, nextCursor: null, detail: null };
}

function nativeParts(sourceId: string, raw: JsonObject, repository: string, defaultBranch: string): string[] | null {
  switch (sourceId) {
    case 'github.repositories': return [text(raw.id) || repository];
    case 'github.branches': return [text(raw.name) || ''];
    case 'github.commits': return [text(raw.sha) || ''];
    case 'github.issues': return [text(raw.number) || ''];
    case 'github.pull-requests': return [text(raw.number) || ''];
    case 'github.workflow-runs': return [text(raw.id) || ''];
    case 'github.workflow-attempts': return [text(raw.id) || '', text(raw.run_attempt) || '1'];
    case 'github.workflow-artifacts': return [text(raw.id) || ''];
    case 'github.tags': return [text(raw.name) || ''];
    case 'github.releases': return [text(raw.id) || text(raw.tag_name) || ''];
    case 'github.branch-protection': return [defaultBranch];
    case 'github.code-scanning-alerts': return [text(raw.number) || ''];
    case 'github.secret-scanning-alerts': return [text(raw.number) || ''];
    case 'github.dependabot-alerts': return [text(raw.number) || ''];
    case 'github.repository-security-advisories': return [text(raw.ghsa_id) || text(raw.cve_id) || ''];
    default: return null;
  }
}

function revisionParts(sourceId: string, raw: JsonObject): string[] {
  switch (sourceId) {
    case 'github.repositories': return [text(raw.updated_at), text(raw.pushed_at)].filter((value): value is string => Boolean(value));
    case 'github.branches': return [text(nested(raw, 'commit', 'sha'))].filter((value): value is string => Boolean(value));
    case 'github.commits': return [text(raw.sha)].filter((value): value is string => Boolean(value));
    case 'github.pull-requests': return [text(nested(raw, 'head', 'sha')), text(raw.updated_at)].filter((value): value is string => Boolean(value));
    case 'github.workflow-runs':
    case 'github.workflow-attempts': return [text(raw.run_attempt), text(raw.updated_at)].filter((value): value is string => Boolean(value));
    case 'github.workflow-artifacts': return [text(raw.updated_at), text(raw.expires_at)].filter((value): value is string => Boolean(value));
    case 'github.tags': return [text(nested(raw, 'commit', 'sha'))].filter((value): value is string => Boolean(value));
    case 'github.releases': return [text(raw.updated_at), text(raw.tag_name)].filter((value): value is string => Boolean(value));
    case 'github.branch-protection': return [];
    default: return [text(raw.updated_at)].filter((value): value is string => Boolean(value));
  }
}

function reportingIdentity(
  sourceId: string,
  repository: string,
  parts: readonly string[],
  revision?: string | null,
): ReportingIdentity {
  const native = [repository, sourceId, ...parts].join('|');
  return { source: sourceId, native, ...(revision ? { revision } : {}) };
}

function relationships(
  sourceId: string,
  repository: string,
  raw: JsonObject,
  current: ReportingIdentity,
): ReportingRelationship[] {
  const values: ReportingRelationship[] = [];
  if (sourceId === 'github.pull-requests') {
    const sha = text(nested(raw, 'head', 'sha'));
    if (sha) values.push({ relation: 'headRevision', from: current, to: reportingIdentity('github.commits', repository, [sha], sha) });
  }
  if (sourceId === 'github.workflow-attempts') {
    const runId = text(raw.id);
    if (runId) values.push({ relation: 'attemptOf', from: current, to: reportingIdentity('github.workflow-runs', repository, [runId]) });
  }
  if (sourceId === 'github.workflow-artifacts') {
    const runId = text(nested(raw, 'workflow_run', 'id'));
    if (runId) values.push({ relation: 'producedBy', from: current, to: reportingIdentity('github.workflow-runs', repository, [runId]) });
  }
  if (sourceId === 'github.releases') {
    const tag = text(raw.tag_name);
    if (tag) values.push({ relation: 'taggedBy', from: current, to: reportingIdentity('github.tags', repository, [tag]) });
  }
  return values;
}

function providerStatus(sourceId: string, raw: JsonObject): string | null {
  if (sourceId === 'github.workflow-artifacts' && raw.expired === true) return 'expired';
  return text(raw.status) || text(raw.state) || null;
}

function providerUrl(raw: JsonObject): string | null {
  return text(raw.html_url) || text(raw.archive_download_url) || text(raw.url) || null;
}

function mapRecord(
  source: ReportingSource,
  repository: string,
  raw: JsonObject,
  defaultBranch: string,
): GitHubReportingRecord | null {
  const parts = nativeParts(source.id, raw, repository, defaultBranch);
  if (!parts || parts.some((part) => !part)) return null;
  const revisions = revisionParts(source.id, raw);
  const revision = revisions.length > 0 ? revisions.join('|') : null;
  const identity = reportingIdentity(source.id, repository, parts, revision);
  return {
    id: identity.native,
    source: source.id,
    provider: 'github',
    repository,
    resource: source.scope.resource,
    nativeId: parts.join('|'),
    identity,
    revision,
    url: providerUrl(raw),
    status: providerStatus(source.id, raw),
    createdAt: text(raw.created_at),
    updatedAt: text(raw.updated_at),
    availability: source.id === 'github.workflow-artifacts' && raw.expired === true ? 'expired' : 'available',
    relationships: relationships(source.id, repository, raw, identity),
    native: structuredClone(raw),
  };
}

function sourceDescriptor(sourceId: string, context: RepositoryContext): { path: string; key?: string; single?: boolean } {
  const branch = encodeURIComponent(context.binding.branch || context.defaultBranch);
  const labels = context.binding.issueLabels?.length ? `&labels=${encodeURIComponent(context.binding.issueLabels.join(','))}` : '';
  switch (sourceId) {
    case 'github.repositories': return { path: '', single: true };
    case 'github.branches': return { path: '/branches' };
    case 'github.commits': return { path: `/commits?sha=${branch}` };
    case 'github.issues': return { path: `/issues?state=all&sort=updated&direction=desc${labels}` };
    case 'github.pull-requests': return { path: '/pulls?state=all&sort=updated&direction=desc' };
    case 'github.workflow-runs': return { path: '/actions/runs', key: 'workflow_runs' };
    case 'github.workflow-artifacts': return { path: '/actions/artifacts', key: 'artifacts' };
    case 'github.tags': return { path: '/tags' };
    case 'github.releases': return { path: '/releases' };
    case 'github.branch-protection': return { path: `/branches/${branch}/protection`, single: true };
    case 'github.code-scanning-alerts': return { path: '/code-scanning/alerts' };
    case 'github.secret-scanning-alerts': return { path: '/secret-scanning/alerts' };
    case 'github.dependabot-alerts': return { path: '/dependabot/alerts' };
    case 'github.repository-security-advisories': return { path: '/security-advisories' };
    default: throw new GitHubReportingError(400, 'github_reporting_source_unsupported', sourceId);
  }
}

async function workflowAttempts(
  context: RepositoryContext,
  mode: GitHubReportingMode,
  limit: number,
): Promise<PageResult> {
  const runs = await fetchPaged(context, '/actions/runs', mode, limit, 'workflow_runs');
  if (runs.items.length === 0) return runs;

  const attempts: JsonObject[] = [];
  let availability = runs.availability;
  let complete = runs.complete;
  let detail = runs.detail;
  for (const run of runs.items) {
    const runId = text(run.id);
    const attemptCount = Math.max(1, Number(run.run_attempt || 1));
    if (!runId || !Number.isInteger(attemptCount)) continue;
    for (let attempt = 1; attempt <= attemptCount; attempt += 1) {
      if (attempt === attemptCount) {
        attempts.push({ ...run, run_attempt: attempt });
        continue;
      }
      const previous = await fetchSingle(context, `/actions/runs/${encodeURIComponent(runId)}/attempts/${attempt}`);
      if (previous.items[0]) attempts.push(previous.items[0]);
      if (previous.availability !== 'available') {
        availability = previous.availability;
        complete = false;
        detail = previous.detail;
      }
    }
  }
  return { items: attempts, availability, complete, nextCursor: runs.nextCursor, detail };
}

async function fetchSource(
  context: RepositoryContext,
  source: ReportingSource,
  mode: GitHubReportingMode,
  limit: number,
): Promise<SourceFetchResult> {
  let page: PageResult;
  if (source.id === 'github.workflow-attempts') {
    page = await workflowAttempts(context, mode, limit);
  } else if (source.id === 'github.repositories') {
    page = { items: [context.repository], availability: 'available', complete: true, nextCursor: null, detail: null };
  } else {
    const descriptor = sourceDescriptor(source.id, context);
    page = descriptor.single
      ? await fetchSingle(context, descriptor.path)
      : await fetchPaged(context, descriptor.path, mode, limit, descriptor.key);
  }

  const records: GitHubReportingRecord[] = [];
  const identities = new Set<string>();
  let complete = page.complete;
  let availability = page.availability;
  let detail = page.detail;
  for (const raw of page.items) {
    if (source.id === 'github.issues' && asObject(raw.pull_request)) continue;
    const record = mapRecord(source, context.binding.repository, raw, context.defaultBranch);
    if (!record) {
      complete = false;
      if (availability === 'available') availability = 'partial';
      detail = detail || 'native_identity_missing';
      continue;
    }
    if (identities.has(record.identity.native)) {
      complete = false;
      if (availability === 'available') availability = 'partial';
      detail = 'duplicate_native_identity';
      continue;
    }
    identities.add(record.identity.native);
    records.push(record);
  }
  return { source, records, availability, complete, nextCursor: page.nextCursor, detail };
}

function facets(records: readonly GitHubReportingRecord[]): Readonly<Record<string, Readonly<Record<string, number>>>> {
  const source: Record<string, number> = {};
  const status: Record<string, number> = {};
  for (const record of records) {
    source[record.source] = (source[record.source] || 0) + 1;
    if (record.status) status[record.status] = (status[record.status] || 0) + 1;
  }
  return { source, status };
}

export async function queryGitHubReporting(
  env: Env,
  principal: Principal,
  query: GitHubReportingQuery = {},
): Promise<GitHubReportingQueryOutcome> {
  const binding = bindingFor(env, query.repository);
  const mode = query.mode || 'sample';
  const requestedLimit = typeof query.limit === 'number' && Number.isInteger(query.limit) ? query.limit : DEFAULT_PAGE_LIMIT;
  const limit = Math.max(1, Math.min(MAX_PAGE_LIMIT, requestedLimit));
  const requested = query.sourceIds?.length
    ? [...new Set(query.sourceIds)]
    : githubNativeSources().filter((source) => source.visibility === 'public').map((source) => source.id);
  if (requested.length === 0) throw new GitHubReportingError(400, 'github_reporting_source_required');

  const selected = requested.map((id) => sourceFor(id, binding.repository));
  selected.forEach((source) => requireBoundSource(binding, source));
  const needsProtectedSource = selected.some((source) => source.visibility === 'private');
  if (needsProtectedSource) requirePrivate(principal);
  const context = await repositoryContext(env, principal, binding, needsProtectedSource);
  if (context.private) requirePrivate(principal);

  const results = await Promise.all(selected.map((source) => fetchSource(context, source, mode, limit)));
  const records = results.flatMap((entry) => mode === 'sample' ? entry.records.slice(0, limit) : entry.records);
  const availability = Object.fromEntries(results.map((entry) => [entry.source.id, entry.availability]));
  const qualifications: Record<string, string | null> = {
    repository: binding.repository,
    mode,
    generatedAt: new Date().toISOString(),
  };
  for (const entry of results) {
    qualifications[`${entry.source.id}.completeness`] = entry.complete ? 'complete' : 'partial';
    qualifications[`${entry.source.id}.detail`] = entry.detail;
    qualifications[`${entry.source.id}.nextCursor`] = entry.nextCursor;
  }
  const totalObserved = results.reduce((sum, entry) => sum + entry.records.length, 0);
  const partialSources = results.filter((entry) => !entry.complete).map((entry) => entry.source.id);

  const result: ReportingQueryResult<GitHubReportingRecord> = {
    schemaVersion: 1,
    contract: REPORTING_CONTRACT,
    dataset: 'github',
    datasets: selected.map((source) => source.id),
    availability,
    sources: selected,
    qualifications,
    query: {
      filters: {
        repository: binding.repository,
        mode,
        source: selected.map((source) => source.id).join(','),
      },
      pagination: {
        limit,
        returned: records.length,
        total: totalObserved,
        nextCursor: partialSources.length > 0 ? `provider:${partialSources[0]}` : null,
      },
    },
    records,
    derived: { count: records.length, totalAvailable: totalObserved, facets: facets(records) },
  };
  return { result, protected: context.private || needsProtectedSource };
}

function issueNumber(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new GitHubReportingError(400, 'github_native_identity_invalid', 'Issue nativeId must be a positive issue number.');
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new GitHubReportingError(400, 'github_native_identity_invalid');
  return number;
}

function validateIssueFields(fields: Readonly<Record<string, unknown>>): JsonObject {
  const entries = Object.entries(fields);
  if (entries.length === 0) throw new GitHubReportingError(400, 'github_import_fields_required');
  const unsupported = entries.map(([name]) => name).filter((name) => !ISSUE_WRITE_FIELDS.has(name));
  if (unsupported.length > 0) throw new GitHubReportingError(400, 'github_import_field_unsupported', unsupported.join(','));

  const result: JsonObject = {};
  for (const [name, value] of entries) {
    if ((name === 'title' || name === 'body' || name === 'state') && typeof value !== 'string') {
      throw new GitHubReportingError(400, 'github_import_field_invalid', name);
    }
    if ((name === 'labels' || name === 'assignees') && (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))) {
      throw new GitHubReportingError(400, 'github_import_field_invalid', name);
    }
    if (name === 'milestone' && value !== null && (typeof value !== 'number' || !Number.isInteger(value) || value < 1)) {
      throw new GitHubReportingError(400, 'github_import_field_invalid', name);
    }
    result[name] = structuredClone(value);
  }
  if (result.state !== undefined && result.state !== 'open' && result.state !== 'closed') {
    throw new GitHubReportingError(400, 'github_import_field_invalid', 'state');
  }
  return result;
}

export async function importGitHubReporting(
  env: Env,
  principal: Principal,
  input: GitHubReportingImportRequest,
): Promise<GitHubReportingRecord> {
  if (!principal.permissions.includes('reporting:write')) {
    throw new GitHubReportingError(
      isAuthenticated(principal) ? 403 : 401,
      isAuthenticated(principal) ? 'permission_denied' : 'authentication_required',
    );
  }
  if (!input || input.operation !== 'update') {
    throw new GitHubReportingError(400, 'github_import_operation_unsupported', 'Only update is supported for native GitHub reporting sources.');
  }

  const binding = bindingFor(env, input.repository);
  const source = sourceFor(input.source, binding.repository);
  requireBoundSource(binding, source);
  if (!source.capabilities.includes('import') || source.ingestion !== 'enabled') {
    throw new GitHubReportingError(400, 'github_import_not_supported', source.id);
  }
  if (source.id !== 'github.issues') throw new GitHubReportingError(400, 'github_import_not_supported', source.id);
  if (!env.GITHUB_REPORTING_WRITE_TOKEN) {
    throw new GitHubReportingError(503, 'github_write_credential_missing', 'Native GitHub source writes require GITHUB_REPORTING_WRITE_TOKEN.');
  }

  const number = issueNumber(input.nativeId);
  const fields = validateIssueFields(input.fields);
  const endpoint = `${GITHUB_API_ROOT}/repos/${binding.repository}/issues/${number}`;
  const current = await githubJson(endpoint, env.GITHUB_REPORTING_WRITE_TOKEN);
  if (!current.response.ok) {
    const failure = classifyFailure(current.response);
    throw new GitHubReportingError(
      failure.availability === 'rate-limited' ? 429 : failure.detail === 'github_resource_not_found' ? 404 : 503,
      failure.detail,
    );
  }
  const currentObject = asObject(current.value);
  if (!currentObject) throw new GitHubReportingError(503, 'github_provider_invalid_response');
  const revision = text(currentObject.updated_at);
  if (!revision || revision !== input.revision) {
    throw new GitHubReportingError(409, 'github_revision_conflict', 'The native GitHub object changed after the supplied revision.');
  }

  const updated = await githubJson(endpoint, env.GITHUB_REPORTING_WRITE_TOKEN, {
    method: 'PATCH',
    body: JSON.stringify(fields),
    headers: { 'content-type': 'application/json' },
  });
  if (!updated.response.ok) {
    const failure = classifyFailure(updated.response);
    throw new GitHubReportingError(failure.availability === 'rate-limited' ? 429 : 503, failure.detail);
  }
  const object = asObject(updated.value);
  if (!object) throw new GitHubReportingError(503, 'github_provider_invalid_response');
  const record = mapRecord(source, binding.repository, object, binding.branch || env.GITHUB_BRANCH || 'main');
  if (!record) throw new GitHubReportingError(503, 'github_provider_invalid_response');
  return record;
}
