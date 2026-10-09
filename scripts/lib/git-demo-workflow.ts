import { allocateControlledIdentity } from './controlled-identity-allocation.ts';

export type ReleaseBump = 'patch' | 'minor' | 'major';
import { liveReleaseCoordinates } from './live-release-identity.ts';

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
  packageJson, bump, requestId, subjects, planMarkdown, openPullRequests, branches = [], existingTag,
}: {
  packageJson: string;
  bump: ReleaseBump;
  requestId: string;
  subjects: string[];
  planMarkdown: string;
  openPullRequests: OpenPullRequest[];
  branches?: string[];
  existingTag: (tag: string) => boolean;
}): LiveReleaseStart {
  const current = packageVersion(packageJson);
  const version = nextSemanticVersion(current, bump);
  if (existingTag(`v${version}`)) throw new Error(`Release tag v${version} already exists.`);
  const changeId = allocateControlledIdentity({ subjects, planMarkdown, openPullRequests, branches });
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
  const coordinates = liveReleaseCoordinates(pr.title, pr.headRefName);
  if (!coordinates) {
    throw new Error('Pull request does not match the controlled live-demo contract.');
  }
  if (!pr.body.includes(`<!-- git-demo-request:${requestId} -->`)) throw new Error('Pull request request ID does not match.');
  return { branch: pr.headRefName, sha: pr.headRefOid, version: coordinates.version };
}
