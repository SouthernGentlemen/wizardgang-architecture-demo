const sha = /^[0-9a-f]{40}$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export interface WorkflowRun {
  name?: string;
  event?: string;
  head_branch?: string;
  head_sha?: string;
  status?: string;
  conclusion?: string | null;
}

export interface WorkflowJob {
  name: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
}

export interface ExistingRelease {
  tag_name: string;
  draft: boolean;
  published_at: string | null;
}

export interface ExistingTag {
  ref: string;
  object?: { type?: string; sha?: string };
  tagName?: string;
  commitSha?: string | null;
}

export type ExactTagReleasePlan =
  | { action: 'skip'; reason: string }
  | { action: 'dispatch' | 'create-and-dispatch'; tag: string; commit: string };

export interface ExactTagDispatch {
  eventName?: string;
  ref?: string;
  refName?: string;
  tag?: string;
  commit?: string;
  checkoutCommit?: string;
  ciRun: WorkflowRun | null;
  mainSha?: string;
}

export function planExactTagRelease({ run, mainSha, version, tag, release, jobs, releaseRuns }: {
  run: WorkflowRun | null;
  mainSha: string;
  version: string;
  tag: ExistingTag | null;
  release: ExistingRelease | null;
  jobs: WorkflowJob[];
  releaseRuns: WorkflowRun[];
}): ExactTagReleasePlan {
  if (run?.name !== 'CI' || run.event !== 'push' || run.head_branch !== 'main' || run.status !== 'completed' || run.conclusion !== 'success') return { action: 'skip', reason: 'CI is not a successful main push' };
  if (!sha.test(run.head_sha ?? '') || run.head_sha !== mainSha) return { action: 'skip', reason: 'CI is stale against current main' };
  if (!['validate', 'browser'].every((name) => jobs?.some((job) => job.name === name && job.status === 'completed' && job.conclusion === 'success' && job.head_sha === mainSha))) {
    return { action: 'skip', reason: 'required main CI jobs are incomplete' };
  }
  if (!versionPattern.test(version ?? '')) throw new Error('Current package version is not semantic.');
  const name = `v${version}`;
  if (release) {
    if (release.tag_name !== name || release.draft || !release.published_at) throw new Error('Existing release is not a published exact-version release.');
    if (!tag || tag.ref !== `refs/tags/${name}` || tag.object?.type !== 'tag' || tag.tagName !== name || !sha.test(tag.commitSha ?? '')) throw new Error('Published release has no matching annotated semantic tag.');
    return { action: 'skip', reason: `${name} is already published` };
  }
  if (tag) {
    if (tag.ref !== `refs/tags/${name}` || tag.object?.type !== 'tag' || tag.tagName !== name || !sha.test(tag.object.sha ?? '') || tag.commitSha !== mainSha) {
      throw new Error(`Existing ${name} tag does not identify the validated current main commit; it must never be moved.`);
    }
    if (releaseRuns?.some((item) => item.event === 'workflow_dispatch' && item.head_sha === mainSha && item.head_branch === name && ['queued', 'in_progress', 'completed', 'waiting', 'pending'].includes(item.status ?? '') && item.conclusion !== 'failure')) {
      return { action: 'skip', reason: `${name} release is already dispatched` };
    }
    return { action: 'dispatch', tag: name, commit: mainSha };
  }
  return { action: 'create-and-dispatch', tag: name, commit: mainSha };
}

export function validateExactTagDispatch({ eventName, ref, refName, tag, commit, checkoutCommit, ciRun, mainSha }: ExactTagDispatch): void {
  if (eventName === 'push') {
    if (ref !== `refs/tags/${tag}` || refName !== tag) throw new Error('Tag push does not retain the exact release ref.');
  } else if (eventName === 'workflow_dispatch') {
    if (ref !== `refs/tags/${tag}` || refName !== tag || !sha.test(commit ?? '') || commit !== checkoutCommit) throw new Error('Release dispatch tag or commit differs from the checked-out tag.');
    if (!ciRun || ciRun.event !== 'push' || ciRun.head_branch !== 'main' || ciRun.head_sha !== commit || ciRun.status !== 'completed' || ciRun.conclusion !== 'success') throw new Error('Release dispatch has no successful exact-commit main CI run.');
    if (mainSha !== commit) throw new Error('Release dispatch commit is no longer current main.');
  } else throw new Error('Unsupported release event.');
  if (checkoutCommit !== commit && eventName === 'workflow_dispatch') throw new Error('Checked-out commit differs from dispatch.');
}

export function validateDeployTrigger({ eventName, ref, tag, releaseOrigin, expectedCommit, checkoutCommit }: {
  eventName?: string;
  ref?: string;
  tag?: string;
  releaseOrigin?: string;
  expectedCommit?: string;
  checkoutCommit?: string;
}): 'manual-recovery' | 'tag-push' | 'exact-tag-dispatch' {
  if (eventName === 'workflow_dispatch' && ref === 'refs/heads/main' && !releaseOrigin) return 'manual-recovery';
  if (eventName === 'push' && ref === `refs/tags/${tag}` && releaseOrigin === 'tag-push') return 'tag-push';
  if (eventName === 'workflow_dispatch' && ref === `refs/tags/${tag}` && releaseOrigin === 'exact-tag-dispatch' && sha.test(expectedCommit ?? '') && expectedCommit === checkoutCommit) return 'exact-tag-dispatch';
  throw new Error('Deployment event, tag, or accepted commit is inconsistent.');
}

export function releaseDispatchFromEnvironment(env: Record<string, string | undefined>): ExactTagDispatch {
  const ciJson = env.RELEASE_CI_JSON;
  if (ciJson === undefined) throw new Error('RELEASE_CI_JSON is required.');
  const ciRun: unknown = JSON.parse(ciJson);
  if (ciRun !== null && typeof ciRun !== 'object') throw new Error('RELEASE_CI_JSON must be a workflow run or null.');
  return {
    eventName: env.GITHUB_EVENT_NAME,
    ref: env.GITHUB_REF,
    refName: env.GITHUB_REF_NAME,
    tag: env.GITHUB_REF_NAME,
    commit: env.REQUESTED_COMMIT,
    checkoutCommit: env.RELEASE_CHECKOUT_COMMIT,
    ciRun: ciRun as WorkflowRun | null,
    mainSha: env.RELEASE_MAIN_SHA,
  };
}
