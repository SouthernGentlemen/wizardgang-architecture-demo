import type { Env } from '../types';
import type { Principal } from './authorization';

type CardStatus = 'available' | 'empty' | 'unavailable';
type GitHubCredential = 'public' | 'server';

interface EvidenceCard<T> {
  status: CardStatus;
  items: T[];
  checkedAt: string;
  error?: string;
}

interface GitHubResult<T> {
  ok: boolean;
  value?: T;
  status?: number;
  error?: string;
}

interface CachedEvidence {
  expiresAt: number;
  value: GitHubEvidence;
}

interface RepositoryProbe {
  result: GitHubResult<Record<string, unknown>>;
  credential: GitHubCredential;
}

export class GitHubEvidenceAccessError extends Error {
  constructor(readonly status: 401 | 403, readonly code: 'authentication_required' | 'permission_denied') {
    super(code);
  }
}

export interface GitHubEvidence {
  repository: { fullName: string; url: string; defaultBranch: string | null; private: boolean };
  generatedAt: string;
  cacheSeconds: number;
  cards: Record<string, EvidenceCard<Record<string, unknown>>>;
  controls: { status: 'verified' | 'not-publicly-verifiable'; branch: string | null; details: Record<string, boolean> | null; evidenceUrl: string };
  pipeline: string[];
  partialFailures: string[];
}

const responseCache = new Map<string, CachedEvidence>();
const GITHUB_API = 'https://api.github.com';
const CACHE_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 4_000;
const encoder = new TextEncoder();

function repositoryIdentity(env: Env): { fullName: string; url: string } | null {
  try {
    const url = new URL(env.GITHUB_REPO_URL);
    const fullName = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) return null;
    return { fullName, url: `https://github.com/${fullName}` };
  } catch {
    return null;
  }
}

function bounded(value: unknown, maximum = 240): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maximum) : null;
}

function safeRepoUrl(value: unknown, repositoryUrl: string): string | null {
  const candidate = bounded(value, 600);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    const allowed = new URL(repositoryUrl);
    return url.protocol === 'https:' && url.hostname === allowed.hostname && (url.pathname === allowed.pathname || url.pathname.startsWith(`${allowed.pathname}/`)) ? url.toString() : null;
  } catch {
    return null;
  }
}

async function digest(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function githubJson<T>(path: string, env: Env, credential: GitHubCredential): Promise<GitHubResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': 'wizardgang-architecture-demo',
      'x-github-api-version': '2022-11-28',
    };
    if (credential === 'server') {
      const token = env.GITHUB_READ_TOKEN?.trim();
      if (!token) return { ok: false, status: 503, error: 'GitHub evidence unavailable' };
      headers.authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${GITHUB_API}${path}`, { headers, signal: controller.signal });
    if (!response.ok) return { ok: false, status: response.status, error: `GitHub returned HTTP ${response.status}` };
    return { ok: true, value: await response.json() as T, status: response.status };
  } catch (error) {
    return { ok: false, error: error instanceof DOMException && error.name === 'AbortError' ? 'GitHub request timed out' : 'GitHub evidence unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

async function probeRepository(path: string, env: Env): Promise<RepositoryProbe> {
  const publicResult = await githubJson<Record<string, unknown>>(path, env, 'public');
  if (publicResult.ok || ![403, 404].includes(publicResult.status ?? 0) || !env.GITHUB_READ_TOKEN?.trim()) {
    return { result: publicResult, credential: 'public' };
  }
  return { result: await githubJson<Record<string, unknown>>(path, env, 'server'), credential: 'server' };
}

function card<T extends Record<string, unknown>>(result: GitHubResult<unknown>, items: T[], checkedAt: string): EvidenceCard<T> {
  if (!result.ok) return { status: 'unavailable', items: [], checkedAt, error: result.error ?? 'GitHub evidence unavailable' };
  return { status: items.length ? 'available' : 'empty', items, checkedAt };
}

function rows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : [];
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function requirePrivateAccess(principal: Principal | undefined): void {
  if (principal?.permissions.includes('reporting:private')) return;
  if (principal && principal.authentication !== 'anonymous') throw new GitHubEvidenceAccessError(403, 'permission_denied');
  throw new GitHubEvidenceAccessError(401, 'authentication_required');
}

async function cacheContext(
  credential: GitHubCredential,
  env: Env,
  principal: Principal | undefined,
  privateRepository: boolean,
): Promise<string> {
  const credentialKey = credential === 'public'
    ? 'public'
    : `server-${(await digest(env.GITHUB_READ_TOKEN?.trim() || '')).slice(0, 24)}`;
  if (!privateRepository) return credentialKey;
  const principalKey = await digest([
    principal?.subject ?? 'anonymous',
    principal?.authentication ?? 'anonymous',
    ...(principal?.permissions ?? []).slice().sort(),
    principal?.expiresAt ?? '',
  ].join('|'));
  return `${credentialKey}|principal-${principalKey.slice(0, 24)}`;
}

export async function collectGitHubEvidence(env: Env, principal?: Principal): Promise<GitHubEvidence> {
  const identity = repositoryIdentity(env);
  if (!identity) throw new Error('Configured GitHub repository is invalid.');

  const encodedRepo = identity.fullName.split('/').map(encodeURIComponent).join('/');
  const probe = await probeRepository(`/repos/${encodedRepo}`, env);
  if (!probe.result.ok) throw new Error('Configured GitHub repository could not be queried.');
  const repo = object(probe.result.value);
  const privateRepository = repo.private === true;
  if (privateRepository) requirePrivateAccess(principal);

  const defaultBranch = bounded(repo.default_branch, 120) ?? env.GITHUB_BRANCH ?? null;
  const branchPath = encodeURIComponent(defaultBranch || env.GITHUB_BRANCH || 'main');
  const revisionResult = await githubJson<Record<string, unknown>>(`/repos/${encodedRepo}/branches/${branchPath}`, env, probe.credential);
  const revision = bounded(object(object(revisionResult.value).commit).sha, 40);
  const context = await cacheContext(probe.credential, env, principal, privateRepository);
  const cacheKey = `${identity.fullName}|${privateRepository ? 'private' : 'public'}|${context}|${revision ?? 'unresolved'}`;
  if (revision) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
  }

  const [branchesResult, commitsResult, openPrsResult, closedPrsResult, runsResult, tagsResult, releasesResult, protectionResult] = await Promise.all([
    githubJson<unknown[]>(`/repos/${encodedRepo}/branches?per_page=10`, env, probe.credential),
    githubJson<unknown[]>(`/repos/${encodedRepo}/commits?sha=${branchPath}&per_page=5`, env, probe.credential),
    githubJson<unknown[]>(`/repos/${encodedRepo}/pulls?state=open&sort=updated&direction=desc&per_page=1`, env, probe.credential),
    githubJson<unknown[]>(`/repos/${encodedRepo}/pulls?state=closed&sort=updated&direction=desc&per_page=10`, env, probe.credential),
    githubJson<{ workflow_runs?: unknown[] }>(`/repos/${encodedRepo}/actions/runs?per_page=5`, env, probe.credential),
    githubJson<unknown[]>(`/repos/${encodedRepo}/tags?per_page=5`, env, probe.credential),
    githubJson<unknown[]>(`/repos/${encodedRepo}/releases?per_page=1`, env, probe.credential),
    githubJson<Record<string, unknown>>(`/repos/${encodedRepo}/branches/${branchPath}/protection`, env, probe.credential),
  ]);
  const checkedAt = new Date().toISOString();

  const branches = rows(branchesResult.value).map((entry) => {
    const commit = object(entry.commit);
    return { name: bounded(entry.name, 120), protected: entry.protected === true, commit: bounded(commit.sha, 40), url: `${identity.url}/tree/${encodeURIComponent(bounded(entry.name, 120) || '')}` };
  }).filter((entry) => entry.name);
  const commits = rows(commitsResult.value).map((entry) => {
    const commit = object(entry.commit); const author = object(commit.author); const githubAuthor = object(entry.author);
    return { sha: bounded(entry.sha, 40), message: bounded(commit.message, 280), author: bounded(githubAuthor.login ?? author.name, 100), date: bounded(author.date, 40), url: safeRepoUrl(entry.html_url, identity.url) };
  }).filter((entry) => entry.sha && entry.url);
  const pullRequest = (entry: Record<string, unknown>) => {
    const user = object(entry.user); const base = object(entry.base); const head = object(entry.head);
    return { number: typeof entry.number === 'number' ? entry.number : null, title: bounded(entry.title, 240), state: bounded(entry.state, 20), mergedAt: bounded(entry.merged_at, 40), author: bounded(user.login, 100), base: bounded(base.ref, 120), head: bounded(head.ref, 120), url: safeRepoUrl(entry.html_url, identity.url) };
  };
  const openPrs = rows(openPrsResult.value).map(pullRequest).filter((entry) => entry.number && entry.url);
  const mergedPrs = rows(closedPrsResult.value).filter((entry) => Boolean(entry.merged_at)).slice(0, 1).map(pullRequest).filter((entry) => entry.number && entry.url);
  const runsContainer = object(runsResult.value);
  const runs = rows(runsContainer.workflow_runs).map((entry) => {
    const actor = object(entry.actor); const headCommit = object(entry.head_commit);
    return { name: bounded(entry.name, 160), event: bounded(entry.event, 60), status: bounded(entry.status, 40), conclusion: bounded(entry.conclusion, 40), branch: bounded(entry.head_branch, 120), sha: bounded(entry.head_sha ?? headCommit.id, 40), actor: bounded(actor.login, 100), updatedAt: bounded(entry.updated_at, 40), url: safeRepoUrl(entry.html_url, identity.url) };
  }).filter((entry) => entry.url);
  const tags = rows(tagsResult.value).map((entry) => {
    const commit = object(entry.commit);
    return { name: bounded(entry.name, 120), commit: bounded(commit.sha, 40), url: `${identity.url}/tree/${encodeURIComponent(bounded(entry.name, 120) || '')}` };
  }).filter((entry) => entry.name);
  const releases = rows(releasesResult.value).map((entry) => ({ name: bounded(entry.name ?? entry.tag_name, 180), tag: bounded(entry.tag_name, 120), publishedAt: bounded(entry.published_at, 40), prerelease: entry.prerelease === true, url: safeRepoUrl(entry.html_url, identity.url) })).filter((entry) => entry.tag && entry.url);

  const protection = object(protectionResult.value);
  const controls = protectionResult.ok ? {
    status: 'verified' as const,
    branch: defaultBranch,
    details: {
      pullRequestReviews: Boolean(protection.required_pull_request_reviews),
      statusChecks: Boolean(protection.required_status_checks),
      forcePushBlocked: protection.allow_force_pushes === undefined || object(protection.allow_force_pushes).enabled === false,
      deletionsBlocked: protection.allow_deletions === undefined || object(protection.allow_deletions).enabled === false,
    },
    evidenceUrl: `${identity.url}/settings/branches`,
  } : {
    status: 'not-publicly-verifiable' as const,
    branch: defaultBranch,
    details: null,
    evidenceUrl: `${identity.url}/blob/${encodeURIComponent(defaultBranch || 'main')}/docs/CHANGE-MANAGEMENT.md`,
  };
  const cards: GitHubEvidence['cards'] = {
    branches: card(branchesResult, branches, checkedAt),
    commits: card(commitsResult, commits, checkedAt),
    openPullRequest: card(openPrsResult, openPrs, checkedAt),
    mergedPullRequest: card(closedPrsResult, mergedPrs, checkedAt),
    actions: card(runsResult, runs, checkedAt),
    tags: card(tagsResult, tags, checkedAt),
    release: card(releasesResult, releases, checkedAt),
  };
  const partialFailures = Object.entries(cards).filter(([, value]) => value.status === 'unavailable').map(([name]) => name);
  const value: GitHubEvidence = {
    repository: { fullName: identity.fullName, url: identity.url, defaultBranch, private: privateRepository },
    generatedAt: checkedAt,
    cacheSeconds: privateRepository ? 0 : CACHE_SECONDS,
    cards,
    controls,
    pipeline: ['Commit', 'Pull request', 'Typecheck', 'Unit tests', 'WCAG scan', 'Build', 'Annotated tag', 'Deploy', 'Health check', 'GitHub Release'],
    partialFailures: [...new Set(partialFailures)],
  };
  if (revision) responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_SECONDS * 1_000, value });
  return value;
}

export function clearGitHubEvidenceCacheForTest(): void {
  responseCache.clear();
}
