import { nextLiveReleaseId } from './live-release-identity.ts';

export type ReleaseBump = 'patch' | 'minor' | 'major';
export const REQUIRED_LIVE_RELEASE_CHECKS = ['validate', 'change-id', 'security', 'secrets'];
const liveBranchPattern = /^demo-(\d{3,})-live-v(\d+)-(\d+)-(\d+)-[0-9a-f]{8}$/;

export interface OpenPullRequest {
  title: string;
  headRefName: string;
}

export interface LiveReleaseStart {
  current: string;
  version: string;
  change_id: string;
  branch: string;
}

export interface LivePullRequestView {
  state: string;
  title: string;
  body: string;
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
}

export interface LivePullRequest {
  branch: string;
  sha: string;
  version: string;
}

export interface PullRequestCheck {
  bucket: string;
  name: string;
  workflow: string;
}

export interface PullRequestApiView {
  state: string;
  mergeable: boolean | null;
  head: { sha: string };
  base: { sha: string };
}

export interface PullRequestMergeView {
  state: string;
  mergeCommit?: { oid?: string } | null;
}

export function packageVersion(packageJson: string): string {
  const version: unknown = JSON.parse(packageJson).version;
  if (typeof version !== 'string') throw new Error('package.json has no version.');
  return version;
}

export function nextSemanticVersion(current: string, bump: ReleaseBump): string {
  if (!/^\d+\.\d+\.\d+$/.test(current)) throw new Error(`Invalid package version: ${current}`);
  const [major, minor, patch] = current.split('.').map(Number);
  return bump === 'major' ? `${major + 1}.0.0` : bump === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
}

export function planLiveReleaseStart({
  packageJson, bump, requestId, subjects, planMarkdown, openPullRequests, existingTag,
}: {
  packageJson: string;
  bump: ReleaseBump;
  requestId: string;
  subjects: string[];
  planMarkdown: string;
  openPullRequests: OpenPullRequest[];
  existingTag: (tag: string) => boolean;
}): LiveReleaseStart {
  const current = packageVersion(packageJson);
  const version = nextSemanticVersion(current, bump);
  if (existingTag(`v${version}`)) throw new Error(`Release tag v${version} already exists.`);
  const changeId = nextLiveReleaseId(subjects, planMarkdown, openPullRequests);
  const shortId = requestId.replace(/[^a-f0-9]/gi, '').slice(0, 8).toLowerCase();
  return {
    current,
    version,
    change_id: changeId,
    branch: `demo-${changeId.slice(5)}-live-v${version.replaceAll('.', '-')}-${shortId}`,
  };
}

export function verifyLivePullRequest(pr: LivePullRequestView, requestId: string): LivePullRequest {
  if (pr.state !== 'OPEN' || pr.baseRefName !== 'main') throw new Error('Pull request is not an open live-demo change against main.');
  const branch = liveBranchPattern.exec(pr.headRefName);
  const version = branch ? `${branch[2]}.${branch[3]}.${branch[4]}` : null;
  if (!branch || !version || pr.title !== `[DEMO-${branch[1]}] [BUILD] Demonstrate v${version} release lifecycle`) {
    throw new Error('Pull request does not match the controlled live-demo contract.');
  }
  if (!pr.body.includes(`<!-- git-demo-request:${requestId} -->`)) throw new Error('Pull request request ID does not match.');
  return { branch: pr.headRefName, sha: pr.headRefOid, version };
}

export function requireSuccessfulChecks(checks: PullRequestCheck[]): void {
  for (const name of REQUIRED_LIVE_RELEASE_CHECKS) {
    const check = checks.find((entry) => entry.workflow === 'CI' && entry.name === name);
    if (!check || check.bucket !== 'pass') throw new Error(`Required CI ${name} is not successful on the exact PR head.`);
  }
}

export function requireExactBase(pr: PullRequestApiView, headSha: string, mainSha: string): void {
  if (pr.state !== 'open' || pr.head.sha !== headSha || pr.base.sha !== mainSha || pr.mergeable !== true) {
    throw new Error('Live release PR head, current main, or mergeability changed; revalidate CI on the new exact head.');
  }
}

export function mergedCommit(pr: PullRequestMergeView): string {
  return pr.state === 'MERGED' ? pr.mergeCommit?.oid || '' : '';
}
