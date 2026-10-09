import fs from 'node:fs';
import { planExactTagRelease } from './lib/exact-tag-release.ts';
import { latestReleaseIntent, renderReadinessSummary } from './lib/release-intent.ts';

const repository = 'Wizard-Gang/wizardgang-architecture-demo';
const token = process.env.GH_TOKEN;
const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : null;
if (process.env.GITHUB_REPOSITORY !== repository || !token || !event?.workflow_run?.id) {
  throw new Error('Exact-tag cutter requires the repository workflow_run event and its scoped token.');
}

async function api(path, { method = 'GET', body, allow404 = false } = {}) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  if (allow404 && response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${method} ${path} returned HTTP ${response.status}: ${(await response.text()).slice(0, 400)}`);
  return response.status === 204 ? null : response.json();
}

const runId = Number(event.workflow_run.id);
const fileAt = async (path, ref) => {
  const file = await api(`contents/${path}?ref=${ref}`, { allow404: true });
  return file ? Buffer.from(file.content, 'base64').toString('utf8') : null;
};

// Every mutable input is read here; the decision is recomputed from a fresh read before any mutation.
async function readDecision() {
  const [run, jobsPage, main] = await Promise.all([
    api(`actions/runs/${runId}`),
    api(`actions/runs/${runId}/jobs?per_page=100`),
    api('git/ref/heads/main'),
  ]);
  const mainSha = main.object?.sha;
  if (run.head_sha !== mainSha || run.event !== 'push' || run.head_branch !== 'main' || run.conclusion !== 'success') {
    return { mainSha, decision: { action: 'skip', reason: 'CI is not a successful run on current main' } };
  }
  const [packageJson, planMarkdown, packageCommits] = await Promise.all([
    fileAt('package.json', mainSha),
    fileAt('implementation_plan.md', mainSha),
    api(`commits?sha=${mainSha}&path=package.json&per_page=100`),
  ]);
  const version = JSON.parse(packageJson ?? '{}').version;
  const tagName = `v${version}`;
  const [tagRef, release, runsPage] = await Promise.all([
    api(`git/ref/tags/${tagName}`, { allow404: true }),
    api(`releases/tags/${tagName}`, { allow404: true }),
    api('actions/workflows/release.yml/runs?event=workflow_dispatch&per_page=100'),
  ]);
  const tagObject = tagRef?.object?.type === 'tag' ? await api(`git/tags/${tagRef.object.sha}`) : null;
  const tag = tagRef ? { ...tagRef, tagName: tagObject?.tag, commitSha: tagObject?.object?.type === 'commit' ? tagObject.object.sha : null } : null;
  const intent = latestReleaseIntent(packageCommits.map((item) => ({ sha: item.sha, message: item.commit?.message ?? '' })));
  const decision = planExactTagRelease({ run, mainSha, version, planMarkdown, intent: intent?.version ?? null, tag, release, jobs: jobsPage.jobs, releaseRuns: runsPage.workflow_runs });
  return { mainSha, tagName, intent, decision };
}

const summarize = (decision, intent) => {
  if (process.env.GITHUB_STEP_SUMMARY && decision.readiness) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, renderReadinessSummary(decision.readiness, [`Intent record: ${intent?.sha ?? 'none'}`, `CI run: ${runId}`]));
  }
};

const first = await readDecision();
summarize(first.decision, first.intent);
if (first.decision.action === 'skip') {
  console.log(`Exact-tag cutter skipped: ${first.decision.reason}.`);
  process.exit(0);
}
const final = await readDecision();
if (JSON.stringify(final.decision) !== JSON.stringify(first.decision) || final.intent?.sha !== first.intent?.sha) {
  throw new Error('Main, queue, intent, tag or Release state moved before release-tag creation or dispatch.');
}
const { mainSha, tagName, decision } = final;

const current = await api('git/ref/heads/main');
if (current.object?.sha !== mainSha) throw new Error('Main moved before release-tag creation or dispatch.');
if (decision.action === 'create-and-dispatch') {
  const created = await api('git/tags', {
    method: 'POST',
    body: {
      tag: tagName,
      message: `WizardGang Architecture Demo ${tagName}`,
      object: mainSha,
      type: 'commit',
      tagger: { name: 'WizardGang Release Cutter', email: 'release-cutter@users.noreply.github.com', date: new Date().toISOString() },
    },
  });
  try {
    await api('git/refs', { method: 'POST', body: { ref: `refs/tags/${tagName}`, sha: created.sha } });
  } catch (error) {
    const raced = await api(`git/ref/tags/${tagName}`, { allow404: true });
    const racedObject = raced?.object?.type === 'tag' ? await api(`git/tags/${raced.object.sha}`) : null;
    if (racedObject?.object?.sha !== mainSha || racedObject.object.type !== 'commit') throw error;
  }
  console.log(`Created annotated ${tagName} at validated main ${mainSha}.`);
}

const finalRef = await api(`git/ref/tags/${tagName}`);
const finalObject = finalRef?.object?.type === 'tag' ? await api(`git/tags/${finalRef.object.sha}`) : null;
if (finalObject?.tag !== tagName || finalObject.object?.type !== 'commit' || finalObject.object.sha !== mainSha) {
  throw new Error('Remote annotated tag does not identify the accepted main commit.');
}
await api('actions/workflows/release.yml/dispatches', {
  method: 'POST',
  body: { ref: tagName, inputs: { tag: tagName, commit: mainSha, ci_run_id: String(runId) } },
});
console.log(`Dispatched exact-tag Release for ${tagName} (${mainSha}) from successful CI ${runId}.`);
