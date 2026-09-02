import type { Env } from '../types';

export type VersionBump = 'patch' | 'minor' | 'major';

interface GitHubResult<T> {
  ok: boolean;
  value?: T;
  status?: number;
  error?: string;
}

interface RepositoryIdentity {
  fullName: string;
  owner: string;
  repository: string;
  url: string;
  apiPath: string;
}

interface DemoPullRequest {
  number: number;
  title: string;
  state: string;
  branch: string;
  base: string;
  headSha: string | null;
  mergeSha: string | null;
  mergedAt: string | null;
  requestId: string | null;
  baseVersion: string | null;
  targetVersion: string | null;
  url: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  displayTitle: string;
  status: string;
  conclusion: string | null;
  branch: string | null;
  sha: string | null;
  event: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  url: string;
}

interface WorkflowStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number | null;
}

interface WorkflowJob {
  name: string;
  status: string;
  conclusion: string | null;
  url: string | null;
  steps: WorkflowStep[];
}

interface StatusCacheEntry {
  expiresAt: number;
  value: GitDemoStatus;
}

export interface GitDemoStatus {
  repository: { fullName: string; url: string; defaultBranch: string };
  generatedAt: string;
  active: boolean;
  stage: 'idle' | 'requested' | 'creating' | 'ci' | 'review' | 'releasing' | 'complete' | 'failed';
  requestId: string | null;
  currentVersion: string | null;
  targetVersion: string | null;
  branch: { name: string; url: string } | null;
  commit: { sha: string; url: string } | null;
  pullRequest: ({ ciReady: boolean } & DemoPullRequest) | null;
  controller: { start: WorkflowRun | null; release: WorkflowRun | null; jobs: WorkflowJob[] };
  ci: { run: WorkflowRun | null; jobs: WorkflowJob[] };
  delivery: { releaseRun: WorkflowRun | null; deployRun: WorkflowRun | null; jobs: WorkflowJob[]; releaseUrl: string | null };
  releaseReady: boolean;
  failures: string[];
  pollAfterMs: number;
  stages: Array<{ key: string; label: string; state: 'complete' | 'current' | 'queued' | 'failed' }>;
}

const GITHUB_API = 'https://api.github.com';
const WORKFLOW_FILE = 'git-demo.yml';
const ACTIVE_STATUS_CACHE_MS = 900;
const IDLE_STATUS_CACHE_MS = 2_000;
const REQUEST_TIMEOUT_MS = 5_000;
const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const responseCache = new Map<string, StatusCacheEntry>();

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function rows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : [];
}

function bounded(value: unknown, maximum = 240): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maximum) : null;
}

function integer(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function repositoryIdentity(env: Env): RepositoryIdentity | null {
  try {
    const url = new URL(env.GITHUB_REPO_URL);
    const fullName = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) return null;
    const [owner, repository] = fullName.split('/');
    return {
      fullName,
      owner,
      repository,
      url: `https://github.com/${fullName}`,
      apiPath: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
    };
  } catch {
    return null;
  }
}

function safeRepoUrl(value: unknown, identity: RepositoryIdentity): string | null {
  const candidate = bounded(value, 600);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    const allowed = new URL(identity.url);
    return url.protocol === 'https:'
      && url.hostname === allowed.hostname
      && (url.pathname === allowed.pathname || url.pathname.startsWith(`${allowed.pathname}/`))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

async function githubRequest<T>(path: string, env: Env, init: RequestInit = {}, write = false): Promise<GitHubResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': 'wizardgang-architecture-demo',
      'x-github-api-version': '2022-11-28',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    };
    const token = write ? env.GITHUB_DEMO_TOKEN : env.GITHUB_READ_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${GITHUB_API}${path}`, { ...init, headers, signal: controller.signal });
    if (!response.ok) return { ok: false, status: response.status, error: `GitHub returned HTTP ${response.status}` };
    if (response.status === 204) return { ok: true, status: response.status };
    return { ok: true, value: await response.json() as T, status: response.status };
  } catch (error) {
    return { ok: false, error: error instanceof DOMException && error.name === 'AbortError' ? 'GitHub request timed out' : 'GitHub request unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

function semverFromPackage(value: unknown): string | null {
  const version = bounded(object(value).version, 40);
  return version && /^\d+\.\d+\.\d+$/.test(version) ? version : null;
}

function nextVersion(current: string, bump: VersionBump): string {
  const [major, minor, patch] = current.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function requestIdFromBody(value: unknown): string | null {
  const body = bounded(value, 20_000);
  const match = body?.match(/<!-- git-demo-request:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}) -->/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function baseVersionFromBody(value: unknown): string | null {
  const body = bounded(value, 20_000);
  return body?.match(/^- Previous version: `([0-9]+\.[0-9]+\.[0-9]+)`$/m)?.[1] ?? null;
}

function pullRequest(entry: Record<string, unknown>, identity: RepositoryIdentity): DemoPullRequest | null {
  const number = integer(entry.number);
  const title = bounded(entry.title, 240);
  const state = bounded(entry.state, 20);
  const head = object(entry.head);
  const base = object(entry.base);
  const branch = bounded(head.ref, 180);
  const targetVersion = branch?.match(/^demo\/live-v(\d+\.\d+\.\d+)-[a-z0-9]+$/i)?.[1] ?? null;
  const url = safeRepoUrl(entry.html_url, identity);
  if (!number || !title || !state || !branch || !url || !branch.startsWith('demo/live-v')) return null;
  return {
    number,
    title,
    state,
    branch,
    base: bounded(base.ref, 180) ?? '',
    headSha: bounded(head.sha, 40),
    mergeSha: bounded(entry.merge_commit_sha, 40),
    mergedAt: bounded(entry.merged_at, 40),
    requestId: requestIdFromBody(entry.body),
    baseVersion: baseVersionFromBody(entry.body),
    targetVersion,
    url,
  };
}

function workflowRun(entry: Record<string, unknown>, identity: RepositoryIdentity): WorkflowRun | null {
  const id = integer(entry.id);
  const name = bounded(entry.name, 180);
  const displayTitle = bounded(entry.display_title, 300) ?? name;
  const status = bounded(entry.status, 40);
  const url = safeRepoUrl(entry.html_url, identity);
  if (!id || !name || !displayTitle || !status || !url) return null;
  return {
    id,
    name,
    displayTitle,
    status,
    conclusion: bounded(entry.conclusion, 40),
    branch: bounded(entry.head_branch, 180),
    sha: bounded(entry.head_sha, 40),
    event: bounded(entry.event, 60),
    createdAt: bounded(entry.created_at, 40),
    updatedAt: bounded(entry.updated_at, 40),
    url,
  };
}

function workflowJobs(value: unknown, identity: RepositoryIdentity): WorkflowJob[] {
  return rows(object(value).jobs).map((entry) => {
    const status = bounded(entry.status, 40);
    const name = bounded(entry.name, 200);
    if (!name || !status) return null;
    const steps = rows(entry.steps).map((step) => {
      const stepName = bounded(step.name, 200);
      const stepStatus = bounded(step.status, 40);
      if (!stepName || !stepStatus) return null;
      return { name: stepName, status: stepStatus, conclusion: bounded(step.conclusion, 40), number: integer(step.number) };
    }).filter((step): step is WorkflowStep => step !== null);
    return { name, status, conclusion: bounded(entry.conclusion, 40), url: safeRepoUrl(entry.html_url, identity), steps };
  }).filter((job): job is WorkflowJob => job !== null);
}

function workflowState(run: WorkflowRun | null): 'complete' | 'current' | 'queued' | 'failed' {
  if (!run) return 'queued';
  if (run.status !== 'completed') return 'current';
  return run.conclusion === 'success' ? 'complete' : 'failed';
}

function buildStages(input: {
  requested: boolean;
  pullRequest: DemoPullRequest | null;
  ciRun: WorkflowRun | null;
  releaseController: WorkflowRun | null;
  releaseRun: WorkflowRun | null;
  deployRun: WorkflowRun | null;
  releasePublished: boolean;
}): GitDemoStatus['stages'] {
  const values = [
    input.requested ? 'complete' : 'queued',
    input.pullRequest ? 'complete' : input.requested ? 'current' : 'queued',
    input.pullRequest?.headSha ? 'complete' : 'queued',
    input.pullRequest ? 'complete' : 'queued',
    workflowState(input.ciRun),
    input.pullRequest?.mergedAt ? 'complete' : input.ciRun?.conclusion === 'success' ? 'current' : 'queued',
    input.pullRequest?.mergedAt ? 'complete' : input.releaseController ? workflowState(input.releaseController) : 'queued',
    input.releaseRun ? 'complete' : input.pullRequest?.mergedAt ? 'current' : 'queued',
    input.releasePublished ? 'complete' : workflowState(input.releaseRun),
    workflowState(input.deployRun ?? input.releaseRun),
    input.releaseRun?.conclusion === 'success' ? 'complete' : input.releaseRun ? 'current' : 'queued',
    input.releasePublished && input.releaseRun?.conclusion === 'success' ? 'complete' : 'queued',
  ] as const;
  const labels = [
    ['change', 'Change'], ['branch', 'Branch'], ['commit', 'Commit'], ['pr', 'Pull request'],
    ['ci', 'CI'], ['review', 'Review gate'], ['merge', 'Merge'], ['tag', 'Tag'],
    ['release', 'Release'], ['deploy', 'Deploy'], ['health', 'Health check'], ['live', 'Live'],
  ];
  return labels.map(([key, label], index) => ({ key, label, state: values[index] }));
}

async function packageVersion(identity: RepositoryIdentity, env: Env, ref: string): Promise<GitHubResult<string>> {
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/contents/package.json?ref=${encodeURIComponent(ref)}`, env);
  if (!result.ok) return { ok: false, status: result.status, error: result.error };
  const encoded = bounded(object(result.value).content, 20_000)?.replace(/\s/g, '');
  try {
    const parsed = JSON.parse(atob(encoded ?? '')) as unknown;
    const version = semverFromPackage(parsed);
    return version ? { ok: true, value: version, status: result.status } : { ok: false, error: 'Repository package version is invalid' };
  } catch {
    return { ok: false, error: 'Repository package version is unavailable' };
  }
}

async function listDemoPullRequests(identity: RepositoryIdentity, env: Env): Promise<GitHubResult<DemoPullRequest[]>> {
  const result = await githubRequest<unknown[]>(`${identity.apiPath}/pulls?state=all&sort=updated&direction=desc&per_page=100`, env);
  if (!result.ok) return { ok: false, status: result.status, error: result.error };
  return { ok: true, value: rows(result.value).map((entry) => pullRequest(entry, identity)).filter((entry): entry is DemoPullRequest => entry !== null), status: result.status };
}

async function listControllerRuns(identity: RepositoryIdentity, env: Env): Promise<GitHubResult<WorkflowRun[]>> {
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/runs?event=workflow_dispatch&per_page=30`, env);
  if (!result.ok) return { ok: false, status: result.status, error: result.error };
  return { ok: true, value: rows(object(result.value).workflow_runs).map((entry) => workflowRun(entry, identity)).filter((entry): entry is WorkflowRun => entry !== null), status: result.status };
}

async function listRunsForSha(identity: RepositoryIdentity, env: Env, sha: string | null): Promise<WorkflowRun[]> {
  if (!sha) return [];
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=30`, env);
  if (!result.ok) return [];
  return rows(object(result.value).workflow_runs).map((entry) => workflowRun(entry, identity)).filter((entry): entry is WorkflowRun => entry !== null);
}

async function jobsForRun(identity: RepositoryIdentity, env: Env, run: WorkflowRun | null): Promise<WorkflowJob[]> {
  if (!run) return [];
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`, env);
  return result.ok ? workflowJobs(result.value, identity) : [];
}

async function releaseForTag(identity: RepositoryIdentity, env: Env, version: string | null): Promise<string | null> {
  if (!version) return null;
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/releases/tags/${encodeURIComponent(`v${version}`)}`, env);
  return result.ok ? safeRepoUrl(object(result.value).html_url, identity) : null;
}

export async function collectGitDemoStatus(env: Env, requestedId: string | null = null, force = false): Promise<GitDemoStatus> {
  const identity = repositoryIdentity(env);
  if (!identity) throw new Error('Configured GitHub repository is invalid.');
  const normalizedId = requestedId && REQUEST_ID_PATTERN.test(requestedId) ? requestedId.toLowerCase() : null;
  const cacheKey = `${identity.fullName}:${normalizedId ?? 'latest'}`;
  const cached = responseCache.get(cacheKey);
  if (!force && cached && cached.expiresAt > Date.now()) return cached.value;

  const defaultBranch = env.GITHUB_BRANCH || 'main';
  const [versionResult, pullsResult, controllersResult] = await Promise.all([
    packageVersion(identity, env, defaultBranch),
    listDemoPullRequests(identity, env),
    listControllerRuns(identity, env),
  ]);
  const failures: string[] = [];
  if (!versionResult.ok) failures.push('version');
  if (!pullsResult.ok) failures.push('pullRequests');
  if (!controllersResult.ok) failures.push('controllerRuns');

  const pulls = pullsResult.value ?? [];
  const controllers = controllersResult.value ?? [];
  const selectedPull = normalizedId
    ? pulls.find((entry) => entry.requestId === normalizedId) ?? null
    : pulls.find((entry) => entry.state === 'open') ?? pulls[0] ?? null;
  const requestId = normalizedId ?? selectedPull?.requestId ?? null;
  const startController = requestId
    ? controllers.find((run) => run.displayTitle.includes(' start ') && run.displayTitle.includes(requestId)) ?? null
    : controllers.find((run) => run.displayTitle.includes(' start ') && run.status !== 'completed') ?? null;
  const releaseController = requestId
    ? controllers.find((run) => run.displayTitle.includes(' release ') && run.displayTitle.includes(requestId)) ?? null
    : controllers.find((run) => run.displayTitle.includes(' release ') && run.status !== 'completed') ?? null;
  const [headRuns, mergedRuns, releaseUrl] = await Promise.all([
    listRunsForSha(identity, env, selectedPull?.headSha ?? null),
    listRunsForSha(identity, env, selectedPull?.mergedAt ? selectedPull.mergeSha : null),
    releaseForTag(identity, env, selectedPull?.mergedAt ? selectedPull.targetVersion : null),
  ]);
  const ciRun = headRuns.find((run) => run.name === 'CI' && run.event === 'pull_request') ?? null;
  const deliveryRuns = [...mergedRuns].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  const releaseRun = deliveryRuns.find((run) => run.name === 'Release') ?? null;
  const deployRun = deliveryRuns.find((run) => run.name === 'Deploy') ?? null;
  const controllerForJobs = releaseController ?? (!selectedPull || !ciRun ? startController : null);
  const [ciJobs, controllerJobs, releaseJobs, deployJobs] = await Promise.all([
    jobsForRun(identity, env, ciRun),
    jobsForRun(identity, env, controllerForJobs),
    jobsForRun(identity, env, releaseRun),
    jobsForRun(identity, env, deployRun),
  ]);
  const releaseReady = selectedPull?.state === 'open' && ciRun?.status === 'completed' && ciRun.conclusion === 'success';
  const releaseInProgress = Boolean(releaseController && releaseController.status !== 'completed')
    || Boolean(releaseRun && releaseRun.status !== 'completed')
    || Boolean(deployRun && deployRun.status !== 'completed');
  const controllerFailed = [startController, releaseController].some((run) => run?.status === 'completed' && run.conclusion !== 'success');
  const deliveryFailed = [ciRun, releaseRun, deployRun].some((run) => run?.status === 'completed' && run.conclusion !== 'success');
  const startCompletedAt = startController?.updatedAt ? Date.parse(startController.updatedAt) : 0;
  const awaitingPullRequest = !selectedPull
    && startController?.status === 'completed'
    && startController.conclusion === 'success'
    && startCompletedAt > Date.now() - 120_000;
  const active = Boolean(selectedPull?.state === 'open') || Boolean(startController && startController.status !== 'completed') || awaitingPullRequest || releaseInProgress;
  let stage: GitDemoStatus['stage'] = 'idle';
  if (controllerFailed || deliveryFailed) stage = 'failed';
  else if (releaseUrl && releaseRun?.conclusion === 'success') stage = 'complete';
  else if (releaseController || selectedPull?.mergedAt || releaseRun || deployRun) stage = 'releasing';
  else if (releaseReady) stage = 'review';
  else if (selectedPull && ciRun) stage = 'ci';
  else if (selectedPull || awaitingPullRequest) stage = 'creating';
  else if (startController) stage = startController.status === 'completed' ? 'failed' : 'requested';

  const status: GitDemoStatus = {
    repository: { fullName: identity.fullName, url: identity.url, defaultBranch },
    generatedAt: new Date().toISOString(),
    active,
    stage,
    requestId,
    currentVersion: selectedPull?.baseVersion ?? versionResult.value ?? null,
    targetVersion: selectedPull?.targetVersion ?? null,
    branch: selectedPull ? { name: selectedPull.branch, url: `${identity.url}/tree/${encodeURIComponent(selectedPull.branch)}` } : null,
    commit: selectedPull?.headSha ? { sha: selectedPull.headSha, url: `${identity.url}/commit/${encodeURIComponent(selectedPull.headSha)}` } : null,
    pullRequest: selectedPull ? { ...selectedPull, ciReady: releaseReady } : null,
    controller: { start: startController, release: releaseController, jobs: controllerJobs },
    ci: { run: ciRun, jobs: ciJobs },
    delivery: { releaseRun, deployRun, jobs: [...(releaseController ? controllerJobs : []), ...releaseJobs, ...deployJobs], releaseUrl },
    releaseReady,
    failures,
    pollAfterMs: active ? 500 : 60_000,
    stages: buildStages({
      requested: Boolean(startController || selectedPull),
      pullRequest: selectedPull,
      ciRun,
      releaseController,
      releaseRun,
      deployRun,
      releasePublished: Boolean(releaseUrl),
    }),
  };
  responseCache.set(cacheKey, {
    expiresAt: Date.now() + (active ? ACTIVE_STATUS_CACHE_MS : IDLE_STATUS_CACHE_MS),
    value: status,
  });
  return status;
}

export async function dispatchGitDemo(
  env: Env,
  input: { operation: 'start'; bump: VersionBump; requestId: string } | { operation: 'release'; pullRequest: number; requestId: string },
): Promise<GitHubResult<void>> {
  const identity = repositoryIdentity(env);
  if (!identity) return { ok: false, error: 'Configured GitHub repository is invalid.' };
  if (!env.GITHUB_DEMO_TOKEN) return { ok: false, status: 503, error: 'Git demo dispatch is not configured.' };
  const inputs = input.operation === 'start'
    ? { operation: 'start', bump: input.bump, request_id: input.requestId, pull_request: '' }
    : { operation: 'release', bump: 'patch', request_id: input.requestId, pull_request: String(input.pullRequest) };
  const result = await githubRequest<void>(
    `${identity.apiPath}/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/dispatches`,
    env,
    { method: 'POST', body: JSON.stringify({ ref: env.GITHUB_BRANCH || 'main', inputs }) },
    true,
  );
  if (result.ok) responseCache.clear();
  return result;
}

export async function gitDemoPreflight(env: Env, bump: VersionBump): Promise<{
  currentVersion: string;
  targetVersion: string;
  active: DemoPullRequest | null;
}> {
  const identity = repositoryIdentity(env);
  if (!identity) throw new Error('Configured GitHub repository is invalid.');
  const [version, pulls] = await Promise.all([
    packageVersion(identity, env, env.GITHUB_BRANCH || 'main'),
    listDemoPullRequests(identity, env),
  ]);
  if (!version.ok || !version.value || !pulls.ok) throw new Error('GitHub preflight evidence is unavailable.');
  return {
    currentVersion: version.value,
    targetVersion: nextVersion(version.value, bump),
    active: pulls.value?.find((entry) => entry.state === 'open') ?? null,
  };
}

export function clearGitDemoCacheForTest(): void {
  responseCache.clear();
}
