import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { requireMatchingRecord } from './controlled-record.ts';
import { acceptedControlledIds, validateControlledPullRequestIdentity } from './controlled-pr-identity.ts';
import { LIVE_RELEASE_MARKER, validateLiveReleaseIdentity } from './live-release-identity.ts';
import { protectedSquash, verifyMergedIdentity, type DeliverySnapshot } from './controlled-delivery.ts';
import { verifyLivePullRequest } from './git-demo-workflow.ts';

// Repository identity is committed authority, never an operator-controlled override.
export const repository = JSON.parse(fs.readFileSync(new URL('../../config/github-repository-settings.json', import.meta.url), 'utf8')).repository;
export const git = (args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
export function api(path: string, method = 'GET', body?: unknown) {
  const args = ['api', `https://api.github.com/repos/${repository}${path ? `/${path}` : ''}`, '--method', method];
  if (body !== undefined) args.push('--input', '-');
  return JSON.parse(execFileSync('gh', args, { input: body === undefined ? undefined : JSON.stringify(body), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
}
function paged(path: string): any[] {
  const result: any[] = [];
  for (let page = 1; page <= 100; page++) {
    const items = api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    result.push(...items);
    if (items.length < 100) return result;
  }
  throw new Error('Provider pagination budget exceeded; reservations are incomplete.');
}
export function readReservations() {
  git(['fetch', 'origin', 'main']);
  const mainSha = api('git/ref/heads/main').object.sha;
  if (git(['rev-parse', 'origin/main']) !== mainSha) throw new Error('Main moved while reading identity reservations.');
  return {
    mainSha,
    subjects: git(['log', '--format=%s', mainSha]).split('\n'),
    planMarkdown: git(['show', `${mainSha}:implementation_plan.md`]),
    openPullRequests: paged('pulls?state=open').map((pr) => ({ title: pr.title, headRefName: pr.head.ref })),
    branches: paged('branches').map((branch) => branch.name),
  };
}
export function readDeliverySnapshot(number: number, requestId?: string): DeliverySnapshot {
  const mainSha = api('git/ref/heads/main').object.sha;
  const pr = api(`pulls/${number}`);
  if (requestId) verifyLivePullRequest({ state: pr.state.toUpperCase(), title: pr.title, body: pr.body, baseRefName: pr.base.ref, headRefName: pr.head.ref, headRefOid: pr.head.sha }, requestId);
  git(['fetch', 'origin', mainSha, pr.head.sha]);
  const identity = publicationIdentity(pr.head.sha, mainSha, pr.head.ref, pr.title, pr.body);
  if (git(['rev-parse', `${pr.head.sha}^`]) !== mainSha) throw new Error('Head parent is not exact current main; revalidate the rebased head.');
  const settings = api('');
  if (!settings.allow_squash_merge || settings.allow_merge_commit || settings.allow_rebase_merge || !settings.delete_branch_on_merge) throw new Error('Squash-only merge or automatic branch cleanup policy drifted.');
  const rules = api('rules/branches/main');
  const requiredChecks = rules.flatMap((rule) => rule.type === 'required_status_checks' ? rule.parameters.required_status_checks.map((check) => check.context) : []);
  if (!rules.some((rule) => rule.type === 'pull_request' && JSON.stringify(rule.parameters.allowed_merge_methods) === JSON.stringify(['squash']))) throw new Error('Protected squash-only PR rule is absent.');
  if (!rules.some((rule) => rule.type === 'required_status_checks' && rule.parameters.strict_required_status_checks_policy)) throw new Error('Strict current-base protection is absent.');
  const checks = api(`commits/${pr.head.sha}/check-runs?per_page=100`).check_runs.map((check) => ({ name: check.name, sha: check.head_sha, conclusion: check.conclusion }));
  checks.push(...api(`commits/${pr.head.sha}/status`).statuses.map((status) => ({ name: status.context, sha: pr.head.sha, conclusion: status.state === 'success' ? 'success' : status.state })));
  const runs = api(`actions/workflows/ci.yml/runs?head_sha=${pr.head.sha}&event=pull_request&per_page=100`).workflow_runs;
  const ci = runs[0];
  if (ci) {
    const jobs = api(`actions/runs/${ci.id}/jobs?per_page=100`).jobs;
    for (const name of ['validate', 'browser']) {
      if (!jobs.some((job) => job.name === name && job.conclusion === 'success' && job.head_sha === pr.head.sha)) throw new Error(`Canonical CI job ${name} is missing on the exact head.`);
    }
  }
  return { mainSha, pr, identity, checks, requiredChecks, canonicalCi: { sha: ci?.head_sha ?? '', conclusion: ci?.status === 'completed' ? ci.conclusion : null } };
}
export async function deliverProtectedPull(number: number, head: string, base: string, apply: boolean, requestId?: string) {
  const result = await protectedSquash({
    read: async () => readDeliverySnapshot(number, requestId),
    merge: async (body) => {
      const pr = api(`pulls/${number}`);
      if (api('git/ref/heads/main').object.sha !== base || pr.base.sha !== base || pr.head.sha !== head || pr.state !== 'open' || pr.mergeable !== true) throw new Error('Base/head or mergeability moved immediately before squash.');
      requireMatchingRecord(body.commit_title, body.commit_message, pr.title, pr.body);
      return api(`pulls/${number}/merge`, 'PUT', body);
    },
    validatedHead: head, validatedBase: base, apply,
  });
  if (result.sha) {
    git(['fetch', 'origin', 'main']);
    const at = (format: string) => git(['show', '-s', `--format=${format}`, result.sha]);
    verifyMergedIdentity({ subject: at('%s'), body: at('%b'), parent: at('%P'), planMarkdown: git(['show', `${result.sha}:implementation_plan.md`]) }, {
      subject: result.plan.commit_title, body: result.plan.commit_message, base,
      planMarkdown: git(['show', `${head}:implementation_plan.md`]),
    });
  }
  return result;
}

export function openControlledPull(head: string, base: string) {
  const branch = git(['branch', '--show-current']);
  const subject = git(['show', '-s', '--format=%s', head]);
  const body = git(['show', '-s', '--format=%b', head]);
  // Publication reads are independent of the allocation performed before branching.
  const reservations = readReservations();
  if (reservations.mainSha !== base || git(['rev-parse', 'HEAD']) !== head || git(['rev-parse', `${head}^`]) !== base) throw new Error('Base/head moved before PR publication.');
  const id = /^\[(DEMO-\d+)\]/.exec(subject)?.[1];
  const collisions = reservations.openPullRequests.filter((pr) => pr.title.startsWith(`[${id}]`) || pr.headRefName.startsWith(`demo-${id?.slice(5)}-`));
  if (reservations.branches.some((name) => name !== branch && name.startsWith(`demo-${id?.slice(5)}-`))) throw new Error('Another published branch reserves this identity.');
  if (collisions.length) throw new Error('Published identity collision; preserve the branch and reconcile without renumbering.');
  const remote = api(`git/ref/heads/${branch}`);
  if (remote.object.sha !== head) throw new Error('Published branch head moved before PR creation.');
  requireMatchingRecord(subject, body, subject, body);
  const identity = publicationIdentity(head, base, branch, subject, body);
  const errors = validateControlledPullRequestIdentity(identity);
  if (errors.length) throw new Error(errors.join('\n'));
  if (api('git/ref/heads/main').object.sha !== base) throw new Error('Main moved immediately before PR creation.');
  return api('pulls', 'POST', { base: 'main', head: branch, title: subject, body });
}

function publicationIdentity(head: string, base: string, branch: string, title: string, prBody: string) {
  const file = (sha: string, name: string) => git(['show', `${sha}:${name}`]);
  const headSubject = git(['show', '-s', '--format=%s', head]);
  const headBody = git(['show', '-s', '--format=%b', head]);
  const basePlanMarkdown = file(base, 'implementation_plan.md');
  const headPlanMarkdown = file(head, 'implementation_plan.md');
  const baseAcceptedIds = acceptedControlledIds(git(['log', '--format=%s', base]).split('\n'));
  return {
    branchName: branch, title, prBody, headSubject, headBody,
    rangeSubjects: git(['log', '--format=%s', `${base}..${head}`]).split('\n').filter(Boolean),
    basePlanMarkdown, headPlanMarkdown, baseAcceptedIds, baseSha: base,
    liveReleaseErrors: headBody.includes(LIVE_RELEASE_MARKER) ? validateLiveReleaseIdentity({
      title: headSubject, body: headBody, branchName: branch,
      changedFiles: git(['diff', '--name-only', base, head]).split('\n').filter(Boolean),
      beforePackage: file(base, 'package.json'), afterPackage: file(head, 'package.json'),
      beforeLock: file(base, 'package-lock.json'), afterLock: file(head, 'package-lock.json'),
      basePlanMarkdown, headPlanMarkdown, baseAcceptedIds,
    }) : null,
  };
}
