import type { Env } from '../types';

type CardStatus = 'available' | 'empty' | 'unavailable';

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

export interface GitHubEvidence {
  repository: { fullName: string; url: string; defaultBranch: string | null };
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

async function githubJson<T>(path: string, env: Env): Promise<GitHubResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': 'wizardgang-architecture-demo',
      'x-github-api-version': '2022-11-28',
    };
    if (env.GITHUB_READ_TOKEN) headers.authorization = `Bearer ${env.GITHUB_READ_TOKEN}`;
    const response = await fetch(`${GITHUB_API}${path}`, { headers, signal: controller.signal });
    if (!response.ok) return { ok: false, status: response.status, error: `GitHub returned HTTP ${response.status}` };
    return { ok: true, value: await response.json() as T, status: response.status };
  } catch (error) {
    return { ok: false, error: error instanceof DOMException && error.name === 'AbortError' ? 'GitHub request timed out' : 'GitHub evidence unavailable' };
  } finally {
    clearTimeout(timer);
  }
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

export async function collectGitHubEvidence(env: Env): Promise<GitHubEvidence> {
  const identity = repositoryIdentity(env);
  if (!identity) throw new Error('Configured GitHub repository is invalid.');
  const cached = responseCache.get(identity.fullName);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const encodedRepo = identity.fullName.split('/').map(encodeURIComponent).join('/');
  const repoResult = await githubJson<Record<string, unknown>>(`/repos/${encodedRepo}`, env);
  const repo = object(repoResult.value);
  const defaultBranch = bounded(repo.default_branch, 120) ?? env.GITHUB_BRANCH ?? null;
  const branchPath = defaultBranch ? encodeURIComponent(defaultBranch) : encodeURIComponent(env.GITHUB_BRANCH || 'main');
  const [branchesResult, commitsResult, openPrsResult, closedPrsResult, runsResult, tagsResult, releasesResult, protectionResult] = await Promise.all([
    githubJson<unknown[]>(`/repos/${encodedRepo}/branches?per_page=10`, env),
    githubJson<unknown[]>(`/repos/${encodedRepo}/commits?sha=${branchPath}&per_page=5`, env),
    githubJson<unknown[]>(`/repos/${encodedRepo}/pulls?state=open&sort=updated&direction=desc&per_page=1`, env),
    githubJson<unknown[]>(`/repos/${encodedRepo}/pulls?state=closed&sort=updated&direction=desc&per_page=10`, env),
    githubJson<{ workflow_runs?: unknown[] }>(`/repos/${encodedRepo}/actions/runs?per_page=5`, env),
    githubJson<unknown[]>(`/repos/${encodedRepo}/tags?per_page=5`, env),
    githubJson<unknown[]>(`/repos/${encodedRepo}/releases?per_page=1`, env),
    githubJson<Record<string, unknown>>(`/repos/${encodedRepo}/branches/${branchPath}/protection`, env),
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
  if (!repoResult.ok) partialFailures.unshift('repository');
  const value: GitHubEvidence = {
    repository: { fullName: identity.fullName, url: identity.url, defaultBranch },
    generatedAt: checkedAt,
    cacheSeconds: CACHE_SECONDS,
    cards,
    controls,
    pipeline: ['Commit', 'Pull request', 'Typecheck', 'Unit tests', 'WCAG scan', 'Build', 'Annotated tag', 'Deploy', 'Health check', 'GitHub Release'],
    partialFailures: [...new Set(partialFailures)],
  };
  responseCache.set(identity.fullName, { expiresAt: Date.now() + CACHE_SECONDS * 1_000, value });
  return value;
}

export function clearGitHubEvidenceCacheForTest(): void {
  responseCache.clear();
}
