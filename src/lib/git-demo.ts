import type { Env } from '../types';
import { GitHubAppError, githubAppConfigured, githubAppTokenFor } from './github-app';
import type { GitHubAppPermissions } from './github-app';

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
  suiteId: number | null;
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
  startedAt: string | null;
  completedAt: string | null;
}

interface WorkflowJob {
  id: number | null;
  name: string;
  status: string;
  conclusion: string | null;
  url: string | null;
  startedAt: string | null;
  completedAt: string | null;
  steps: WorkflowStep[];
}

interface CheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string | null;
  startedAt: string | null;
  completedAt: string | null;
  suiteId: number | null;
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
  controller: { start: WorkflowRun | null; release: WorkflowRun | null; startJobs: WorkflowJob[]; releaseJobs: WorkflowJob[] };
  ci: { run: WorkflowRun | null; jobs: WorkflowJob[]; checks: CheckRun[]; available: boolean };
  delivery: { releaseRun: WorkflowRun | null; deployRun: WorkflowRun | null; releaseJobs: WorkflowJob[]; deployJobs: WorkflowJob[]; releaseUrl: string | null };
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

// The least wg-github-app permission each GitHub call needs; Metadata read comes with every installation token.
const CONTENTS_READ: GitHubAppPermissions = { contents: 'read' };
const PULL_REQUESTS_READ: GitHubAppPermissions = { pull_requests: 'read' };
const ACTIONS_READ: GitHubAppPermissions = { actions: 'read' };
const CHECKS_READ: GitHubAppPermissions = { checks: 'read' };
const ACTIONS_WRITE: GitHubAppPermissions = { actions: 'write' };

async function githubRequest<T>(path: string, env: Env, permissions: GitHubAppPermissions, init: RequestInit = {}): Promise<GitHubResult<T>> {
  let token: string | null;
  try {
    token = await githubAppTokenFor(env, permissions);
  } catch (error) {
    if (error instanceof GitHubAppError) return { ok: false, status: 503, error: 'GitHub App token unavailable' };
    throw error;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': 'wizardgang-architecture-demo',
      'x-github-api-version': '2022-11-28',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    };
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
  const versionParts = branch?.match(/^demo-\d{3,}-release-v(\d+)-(\d+)-(\d+)-[0-9a-f]{8}$/);
  const targetVersion = versionParts ? `${versionParts[1]}.${versionParts[2]}.${versionParts[3]}` : null;
  const url = safeRepoUrl(entry.html_url, identity);
  if (!number || !title || !state || !branch || !url || !targetVersion) return null;
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
    suiteId: integer(entry.check_suite_id),
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
      return { name: stepName, status: stepStatus, conclusion: bounded(step.conclusion, 40), number: integer(step.number), startedAt: bounded(step.started_at, 40), completedAt: bounded(step.completed_at, 40) };
    }).filter((step): step is WorkflowStep => step !== null);
    return { id: integer(entry.id), name, status, conclusion: bounded(entry.conclusion, 40), url: safeRepoUrl(entry.html_url, identity), startedAt: bounded(entry.started_at, 40), completedAt: bounded(entry.completed_at, 40), steps };
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
  ciReady: boolean;
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
    input.ciReady ? 'complete' : input.ciRun?.conclusion === 'success' ? 'current' : workflowState(input.ciRun),
    input.pullRequest?.mergedAt ? 'complete' : input.ciRun?.conclusion === 'success' ? 'current' : 'queued',
    input.pullRequest?.mergedAt ? 'complete' : input.releaseController ? workflowState(input.releaseController) : 'queued',
    input.releaseRun ? 'complete' : input.pullRequest?.mergedAt ? 'current' : 'queued',
    input.releasePublished ? 'complete' : workflowState(input.releaseRun),
    workflowState(input.deployRun),
    input.deployRun?.conclusion === 'success' ? 'complete' : input.deployRun ? workflowState(input.deployRun) : 'queued',
    input.releasePublished && input.deployRun?.conclusion === 'success' ? 'complete' : 'queued',
  ] as const;
  const labels = [
    ['change', 'Change'], ['branch', 'Branch'], ['commit', 'Commit'], ['pr', 'Pull request'],
    ['ci', 'CI'], ['review', 'Review gate'], ['merge', 'Merge'], ['tag', 'Tag'],
    ['release', 'Release'], ['deploy', 'Deploy'], ['health', 'Health check'], ['live', 'Live'],
  ];
  return labels.map(([key, label], index) => ({ key, label, state: values[index] }));
}

async function packageVersion(identity: RepositoryIdentity, env: Env, ref: string): Promise<GitHubResult<string>> {
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/contents/package.json?ref=${encodeURIComponent(ref)}`, env, CONTENTS_READ);
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

// The live controller authorizes only a completed batch: no queued task and no unreleased intent.
async function openQueueTasks(identity: RepositoryIdentity, env: Env, ref: string): Promise<GitHubResult<string[]>> {
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/contents/implementation_plan.md?ref=${encodeURIComponent(ref)}`, env, CONTENTS_READ);
  if (!result.ok) return { ok: false, status: result.status, error: result.error };
  try {
    const bytes = Uint8Array.from(atob(bounded(object(result.value).content, 400_000)?.replace(/\s/g, '') ?? ''), (character) => character.charCodeAt(0));
    const markdown = new TextDecoder().decode(bytes);
    return { ok: true, value: [...markdown.matchAll(/^### (DEMO-\d{3,}) — \[[A-Z0-9]+\] /gm)].map((match) => match[1]), status: result.status };
  } catch {
    return { ok: false, error: 'Implementation queue is unavailable' };
  }
}

async function listDemoPullRequests(identity: RepositoryIdentity, env: Env): Promise<GitHubResult<DemoPullRequest[]>> {
  const result = await githubRequest<unknown[]>(`${identity.apiPath}/pulls?state=all&sort=updated&direction=desc&per_page=100`, env, PULL_REQUESTS_READ);
  if (!result.ok) return { ok: false, status: result.status, error: result.error };
  return { ok: true, value: rows(result.value).map((entry) => pullRequest(entry, identity)).filter((entry): entry is DemoPullRequest => entry !== null), status: result.status };
}

async function listControllerRuns(identity: RepositoryIdentity, env: Env): Promise<GitHubResult<WorkflowRun[]>> {
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/runs?event=workflow_dispatch&per_page=30`, env, ACTIONS_READ);
  if (!result.ok) return { ok: false, status: result.status, error: result.error };
  return { ok: true, value: rows(object(result.value).workflow_runs).map((entry) => workflowRun(entry, identity)).filter((entry): entry is WorkflowRun => entry !== null), status: result.status };
}

async function listRunsForSha(identity: RepositoryIdentity, env: Env, sha: string | null): Promise<{ runs: WorkflowRun[]; available: boolean }> {
  if (!sha) return { runs: [], available: true };
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=30`, env, ACTIONS_READ);
  if (!result.ok) return { runs: [], available: false };
  const value = object(result.value);
  const entries = rows(value.workflow_runs);
  return { runs: entries.map((entry) => workflowRun(entry, identity)).filter((entry): entry is WorkflowRun => entry !== null), available: typeof value.total_count === 'number' && value.total_count === entries.length };
}

async function jobsForRun(identity: RepositoryIdentity, env: Env, run: WorkflowRun | null): Promise<{ jobs: WorkflowJob[]; available: boolean }> {
  if (!run) return { jobs: [], available: true };
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`, env, ACTIONS_READ);
  const value = object(result.value);
  const jobs = result.ok ? workflowJobs(value, identity) : [];
  return { jobs, available: Boolean(result.ok && typeof value.total_count === 'number' && value.total_count === jobs.length) };
}

const REQUIRED_CHECKS = ['validate', 'browser'] as const;

async function checksForSha(identity: RepositoryIdentity, env: Env, sha: string | null): Promise<{ checks: CheckRun[]; available: boolean }> {
  if (!sha) return { checks: [], available: true };
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/commits/${encodeURIComponent(sha)}/check-runs?per_page=100`, env, CHECKS_READ);
  if (!result.ok) return { checks: [], available: false };
  const value = object(result.value);
  const entries = rows(value.check_runs);
  if (typeof value.total_count !== 'number' || value.total_count !== entries.length) return { checks: [], available: false };
  return { available: true, checks: entries.map((entry) => ({
    id: integer(entry.id) ?? 0,
    name: bounded(entry.name, 200) ?? '',
    status: bounded(entry.status, 40) ?? 'unknown',
    conclusion: bounded(entry.conclusion, 40),
    url: safeRepoUrl(entry.html_url, identity),
    startedAt: bounded(entry.started_at, 40),
    completedAt: bounded(entry.completed_at, 40),
    suiteId: integer(object(entry.check_suite).id),
  })) };
}

async function releaseForTag(identity: RepositoryIdentity, env: Env, version: string | null): Promise<{ url: string | null; available: boolean }> {
  if (!version) return { url: null, available: true };
  const result = await githubRequest<Record<string, unknown>>(`${identity.apiPath}/releases/tags/${encodeURIComponent(`v${version}`)}`, env, CONTENTS_READ);
  return { url: result.ok ? safeRepoUrl(object(result.value).html_url, identity) : null, available: result.ok || result.status === 404 };
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
  const [headRunEvidence, mergedRunEvidence, releaseEvidence] = await Promise.all([
    listRunsForSha(identity, env, selectedPull?.headSha ?? null),
    listRunsForSha(identity, env, selectedPull?.mergedAt ? selectedPull.mergeSha : null),
    releaseForTag(identity, env, selectedPull?.mergedAt ? selectedPull.targetVersion : null),
  ]);
  if (!headRunEvidence.available) failures.push('ciRuns');
  if (!mergedRunEvidence.available) failures.push('deliveryRuns');
  if (!releaseEvidence.available) failures.push('release');
  const headRuns = headRunEvidence.runs;
  const mergedRuns = mergedRunEvidence.runs;
  const releaseUrl = releaseEvidence.url;
  const ciRun = headRuns.find((run) => run.name === 'CI' && run.event === 'pull_request' && run.sha === selectedPull?.headSha) ?? null;
  const deliveryRuns = [...mergedRuns].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  const releaseRun = deliveryRuns.find((run) => run.name === 'Release') ?? null;
  const deployRun = deliveryRuns.find((run) => run.name === 'Deploy') ?? null;
  const [ciJobEvidence, startJobEvidence, releaseControllerJobEvidence, releaseJobEvidence, deployJobEvidence, checkEvidence] = await Promise.all([
    jobsForRun(identity, env, ciRun),
    jobsForRun(identity, env, startController),
    jobsForRun(identity, env, releaseController),
    jobsForRun(identity, env, releaseRun),
    jobsForRun(identity, env, deployRun),
    checksForSha(identity, env, selectedPull?.headSha ?? null),
  ]);
  if (!checkEvidence.available) failures.push('ciChecks');
  for (const [key, evidence] of [['ciJobs', ciJobEvidence], ['startJobs', startJobEvidence], ['releaseControllerJobs', releaseControllerJobEvidence], ['releaseJobs', releaseJobEvidence], ['deployJobs', deployJobEvidence]] as const) {
    if (!evidence.available) failures.push(key);
  }
  const currentChecks = new Map<string, CheckRun>();
  for (const check of checkEvidence.checks) {
    if (!check.id || check.suiteId !== ciRun?.suiteId) continue;
    const previous = currentChecks.get(check.name);
    if (!previous || check.id > previous.id) currentChecks.set(check.name, check);
  }
  const releaseReady = Boolean(selectedPull?.state === 'open' && ciRun?.status === 'completed' && ciRun.conclusion === 'success'
    && headRunEvidence.available && ciJobEvidence.available && checkEvidence.available && ciRun.suiteId
    && REQUIRED_CHECKS.every((name) => currentChecks.get(name)?.status === 'completed' && currentChecks.get(name)?.conclusion === 'success'));
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
    controller: { start: startController, release: releaseController, startJobs: startJobEvidence.jobs, releaseJobs: releaseControllerJobEvidence.jobs },
    ci: { run: ciRun, jobs: ciJobEvidence.jobs, checks: checkEvidence.checks, available: checkEvidence.available },
    delivery: { releaseRun, deployRun, releaseJobs: releaseJobEvidence.jobs, deployJobs: deployJobEvidence.jobs, releaseUrl },
    releaseReady,
    failures,
    pollAfterMs: active ? 500 : 60_000,
    stages: buildStages({
      requested: Boolean(startController || selectedPull),
      pullRequest: selectedPull,
      ciRun,
      ciReady: releaseReady,
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
  if (!githubAppConfigured(env)) return { ok: false, status: 503, error: 'Git demo dispatch is not configured.' };
  const inputs = input.operation === 'start'
    ? { operation: 'start', bump: input.bump, request_id: input.requestId, pull_request: '' }
    : { operation: 'release', bump: 'patch', request_id: input.requestId, pull_request: String(input.pullRequest) };
  const result = await githubRequest<void>(
    `${identity.apiPath}/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/dispatches`,
    env,
    ACTIONS_WRITE,
    { method: 'POST', body: JSON.stringify({ ref: env.GITHUB_BRANCH || 'main', inputs }) },
  );
  if (result.ok) responseCache.clear();
  return result;
}

export async function gitDemoPreflight(env: Env, bump: VersionBump): Promise<{
  mainSha: string;
  currentVersion: string;
  targetVersion: string;
  fingerprint: string;
  active: DemoPullRequest | null;
  blocked: string | null;
  openTasks: string[];
  lastRelease: string;
  commitsSinceRelease: Array<{ sha: string; subject: string; url: string }>;
}> {
  const identity = repositoryIdentity(env);
  if (!identity) throw new Error('Configured GitHub repository is invalid.');
  const mainRef = await githubRequest<Record<string, unknown>>(
    `${identity.apiPath}/git/ref/heads/${encodeURIComponent(env.GITHUB_BRANCH || 'main')}`,
    env,
    CONTENTS_READ,
  );
  const mainSha = bounded(object(object(mainRef.value).object).sha, 40);
  if (!mainRef.ok || !mainSha || !/^[0-9a-f]{40}$/.test(mainSha)) throw new Error('Current main identity is unavailable.');
  const [version, queue, pulls, latest] = await Promise.all([
    packageVersion(identity, env, mainSha),
    openQueueTasks(identity, env, mainSha),
    listDemoPullRequests(identity, env),
    githubRequest<Record<string, unknown>>(`${identity.apiPath}/releases/latest`, env, CONTENTS_READ),
  ]);
  const lastRelease = bounded(object(latest.value).tag_name, 60);
  if (!version.ok || !version.value || !queue.ok || !queue.value || !pulls.ok || !latest.ok || !lastRelease || !/^v\d+\.\d+\.\d+$/.test(lastRelease)) {
    throw new Error('GitHub preflight evidence is unavailable.');
  }
  const comparison = await githubRequest<Record<string, unknown>>(
    `${identity.apiPath}/compare/${encodeURIComponent(lastRelease)}...${mainSha}`,
    env,
    CONTENTS_READ,
  );
  const comparisonValue = object(comparison.value);
  const commits = rows(comparisonValue.commits);
  if (!comparison.ok || !['ahead', 'identical'].includes(String(comparisonValue.status))
    || typeof comparisonValue.total_commits !== 'number' || comparisonValue.total_commits !== commits.length) {
    throw new Error('Complete commits-since-release evidence is unavailable.');
  }
  const targetVersion = nextVersion(version.value, bump);
  const openTasks = queue.value;
  const blocked = `v${version.value}` !== lastRelease
    ? `v${version.value} already has an unreleased authorized intent; complete that batch first.`
    : openTasks.length ? `The live controller releases only a completed batch; open tasks: ${openTasks.join(', ')}.` : null;
  const preflightBytes = new TextEncoder().encode(JSON.stringify([mainSha, version.value, targetVersion, lastRelease, openTasks, commits.map((entry) => entry.sha)]));
  const fingerprint = [...new Uint8Array(await crypto.subtle.digest('SHA-256', preflightBytes))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return {
    mainSha,
    currentVersion: version.value,
    targetVersion,
    fingerprint,
    active: pulls.value?.find((entry) => entry.state === 'open') ?? null,
    blocked,
    openTasks,
    lastRelease,
    commitsSinceRelease: commits.map((entry) => ({
      sha: bounded(entry.sha, 40) ?? '',
      subject: bounded(object(entry.commit).message, 300)?.split('\n')[0] ?? '',
      url: safeRepoUrl(entry.html_url, identity) ?? '',
    })),
  };
}

export function clearGitDemoCacheForTest(): void {
  responseCache.clear();
}
