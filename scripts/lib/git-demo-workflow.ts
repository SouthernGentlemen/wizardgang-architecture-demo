import { allocatePlanIdentities } from './controlled-identity-allocation.ts';
import { parsePlanTasks } from './controlled-pr-identity.ts';
import { renderControlledRecord } from './controlled-record.ts';
import { nextSemanticVersion, releaseIntentVersion, type ReleaseBump } from './release-intent.ts';

// The live controller authorizes one empty-queue batch release through the ordinary planning record.
const branchPattern = /^demo-(\d{3,})-release-v(\d+)-(\d+)-(\d+)-([0-9a-f]{8})$/;
const titlePattern = /^\[DEMO-(\d{3,})\] \[BUILD\] Authorize v(\d+\.\d+\.\d+) batch release$/;

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

export function packageVersion(packageJson: string): string {
  const version: unknown = JSON.parse(packageJson).version;
  if (typeof version !== 'string') throw new Error('package.json has no version.');
  return version;
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
  if (!existingTag(`v${current}`)) throw new Error(`v${current} already has an unreleased authorized intent; complete that batch first.`);
  const open = parsePlanTasks(planMarkdown).map((task) => task.id);
  if (open.length) throw new Error(`The live controller releases only a completed batch; open tasks: ${open.join(', ')}.`);
  const version = nextSemanticVersion(current, bump);
  if (existingTag(`v${version}`)) throw new Error(`Release tag v${version} already exists.`);
  const plan = allocatePlanIdentities({ subjects, planMarkdown, openPullRequests, branches }, [], {
    version, authorizedBy: `authenticated live controller request ${requestId.toLowerCase()}`, currentVersion: current,
  });
  const shortId = requestId.replace(/[^a-f0-9]/gi, '').slice(0, 8).toLowerCase();
  return {
    current,
    version,
    change_id: plan.maintenanceId,
    branch: `demo-${plan.maintenanceId.slice(5)}-release-v${version.replaceAll('.', '-')}-${shortId}`,
  };
}

export function liveIntentRecord({ id, version, requestId, previousTag, commits }: { id: string; version: string; requestId: string; previousTag: string; commits: string }) {
  return renderControlledRecord({
    id, type: 'BUILD', summary: `Authorize v${version} batch release`,
    change: `Record the owner-authorized v${version} batch release intent and set the package version.`,
    reason: `Owner-confirmed /demos#webhooks release request for the completed batch. Previous release: ${previousTag}.\nCommits since ${previousTag}:\n${commits}`,
    impact: 'Package version metadata and release intent only; the queue stays empty and release notes derive from accepted Git/GitHub history.',
    risk: 'Medium',
    controls: '- Keep the isolated PR open until exact-head CI and explicit Merge & Release confirmation.\n- The cutter releases only this intent on an empty queue after successful exact-current-main CI; immutable tags are never moved.',
    validation: '- Read current main, the empty queue, open identity reservations and existing version tags before publication.\n- Locked version metadata was generated; exact-head CI and post-merge verification remain required before release.',
    evidence: '- package.json\n- package-lock.json', source: 'direct',
    release: `v${version} — authorized batch release`,
    maintenance: true, releaseIntent: version, requestId: requestId.toLowerCase(),
  });
}

export function verifyLiveIntentPull(pr: LivePullRequestView, requestId: string): { branch: string; sha: string; version: string } {
  if (pr.state !== 'OPEN' || pr.baseRefName !== 'main') throw new Error('Pull request is not an open live-demo change against main.');
  const title = titlePattern.exec(pr.title);
  const branch = branchPattern.exec(pr.headRefName);
  const version = title?.[2];
  if (!title || !branch || title[1] !== branch[1] || version !== `${branch[2]}.${branch[3]}.${branch[4]}` || releaseIntentVersion(pr.body) !== version) {
    throw new Error('Pull request does not match the controlled live release-intent contract.');
  }
  if (!pr.body.includes(`<!-- git-demo-request:${requestId.toLowerCase()} -->`)) throw new Error('Pull request request ID does not match.');
  return { branch: pr.headRefName, sha: pr.headRefOid, version };
}
