import fs from 'node:fs';
import path from 'node:path';
import { loadJsonSchema, validateJsonSchema } from './lib/json-schema.mjs';

const [outputPath] = process.argv.slice(2);
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const runId = Number(process.env.REPORT_WORKFLOW_RUN_ID);
const defaultBranch = process.env.REPORT_DEFAULT_BRANCH || 'main';

if (!outputPath) throw new Error('Usage: node scripts/generate-retained-report.mjs <output-path>');
if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('GITHUB_REPOSITORY is required.');
if (!token) throw new Error('GITHUB_TOKEN is required.');
if (!Number.isInteger(runId) || runId < 1) throw new Error('REPORT_WORKFLOW_RUN_ID must be a positive integer.');

const headers = {
  accept: 'application/vnd.github+json',
  authorization: `Bearer ${token}`,
  'x-github-api-version': '2022-11-28',
};

async function github(pathname) {
  const response = await fetch(`https://api.github.com/repos/${repository}${pathname}`, { headers });
  if (!response.ok) throw new Error(`GitHub reporting query failed (${response.status}) for ${pathname}.`);
  return response.json();
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function text(value) {
  return typeof value === 'string' && value.length ? value : null;
}

function providerOutcome(status, conclusion) {
  if (status !== 'completed') return 'incomplete';
  switch (conclusion) {
    case 'success': return 'passed';
    case 'failure':
    case 'timed_out':
    case 'action_required':
    case 'startup_failure': return 'failed';
    case 'cancelled': return 'cancelled';
    case 'skipped': return 'skipped';
    default: return 'incomplete';
  }
}

function workflowKind(name) {
  if (name === 'CI') return { reportType: 'ci-validation', idPrefix: 'CI' };
  if (name === 'Assurance Monitor') return { reportType: 'assurance-monitor', idPrefix: 'ASSURANCE-MONITOR' };
  throw new Error(`Workflow ${String(name)} is not approved to produce retained reports.`);
}

function validateProducer(run) {
  const headRepository = object(run.head_repository);
  if (text(headRepository?.full_name) !== repository) throw new Error('Workflow run repository does not match the publishing repository.');
  if (text(run.head_branch) !== defaultBranch) throw new Error(`Retained reports are restricted to ${defaultBranch}.`);
  if (run.status !== 'completed') throw new Error('Only completed workflow runs may be retained.');
  const kind = workflowKind(run.name);
  const event = text(run.event);
  if (kind.reportType === 'ci-validation' && event !== 'push') throw new Error('CI retained reports must come from a trusted push run.');
  if (kind.reportType === 'assurance-monitor' && !['schedule', 'workflow_dispatch'].includes(event)) {
    throw new Error('Assurance monitor retained reports must come from a trusted scheduled or manually dispatched run.');
  }
  if (!/^[0-9a-f]{40}$/.test(String(run.head_sha))) throw new Error('Workflow source revision is invalid.');
  if (!Number.isInteger(run.run_attempt) || run.run_attempt < 1) throw new Error('Workflow run attempt is invalid.');
  return kind;
}

function evidenceReference(kind, url) {
  if (!text(url) || !/^https:\/\/github\.com\//.test(url)) throw new Error(`Invalid ${kind} evidence URL.`);
  return { kind, url };
}

function normalizeStep(step) {
  const candidate = object(step) ?? {};
  return {
    number: Number(candidate.number),
    name: text(candidate.name) ?? 'unnamed-step',
    status: text(candidate.status) ?? 'unknown',
    outcome: providerOutcome(candidate.status, candidate.conclusion),
    startedAt: text(candidate.started_at),
    completedAt: text(candidate.completed_at),
  };
}

function normalizeJob(job) {
  const candidate = object(job) ?? {};
  const htmlUrl = text(candidate.html_url);
  if (!Number.isInteger(candidate.id) || candidate.id < 1 || !htmlUrl) throw new Error('GitHub returned an invalid workflow job.');
  return {
    id: candidate.id,
    name: text(candidate.name) ?? `job-${candidate.id}`,
    status: text(candidate.status) ?? 'unknown',
    outcome: providerOutcome(candidate.status, candidate.conclusion),
    startedAt: text(candidate.started_at),
    completedAt: text(candidate.completed_at),
    evidence: evidenceReference('job', htmlUrl),
    steps: Array.isArray(candidate.steps) ? candidate.steps.map(normalizeStep) : [],
  };
}

function qualification(status) {
  switch (status) {
    case 'passed': return 'GitHub marked the workflow run successful. Individual job and step outcomes remain explicit, including skipped execution; no unexecuted check is inferred to have passed.';
    case 'failed': return 'GitHub marked the workflow run failed. Failed, skipped, cancelled, and incomplete job or step outcomes remain explicit.';
    case 'cancelled': return 'GitHub marked the workflow run cancelled. Work that did not complete is not represented as passed.';
    case 'skipped': return 'GitHub marked the workflow run skipped. No execution is inferred from the skipped run.';
    default: return 'The workflow run is incomplete or has a provider conclusion that does not establish successful execution. No incomplete work is represented as passed.';
  }
}

const run = object(await github(`/actions/runs/${runId}`));
if (!run || Number(run.id) !== runId) throw new Error('GitHub returned an invalid workflow run.');
const kind = validateProducer(run);
const jobsPayload = object(await github(`/actions/runs/${runId}/attempts/${run.run_attempt}/jobs?per_page=100`));
const jobs = Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs.map(normalizeJob) : [];
if (!jobs.length) throw new Error('A retained report requires at least one observed GitHub workflow job.');
if (Number(jobsPayload.total_count) > jobs.length) throw new Error('Workflow job pagination is incomplete; report publication refused.');

const status = providerOutcome(run.status, run.conclusion);
const observedAt = text(run.updated_at) ?? text(run.run_started_at) ?? text(run.created_at);
if (!observedAt) throw new Error('Workflow run observation time is missing.');
const workflowRunUrl = text(run.html_url);
if (!workflowRunUrl) throw new Error('Workflow run evidence URL is missing.');
const commitUrl = `https://github.com/${repository}/commit/${run.head_sha}`;
const id = `RPT-${kind.idPrefix}-${runId}-A${run.run_attempt}`;
const reportIdentity = { source: 'github.retained-reports', native: id };

const report = {
  schemaVersion: 1,
  id,
  source: 'github.retained-reports',
  reportType: kind.reportType,
  producer: {
    provider: 'github-actions',
    repository,
    workflow: run.name,
    workflowRunId: runId,
    runAttempt: run.run_attempt,
    event: run.event,
  },
  sourceRevision: { commit: run.head_sha, branch: run.head_branch },
  observedAt,
  status,
  qualification: qualification(status),
  checks: jobs,
  evidence: [
    evidenceReference('workflow-run', workflowRunUrl),
    evidenceReference('source-revision', commitUrl),
    ...jobs.map((job) => job.evidence),
  ],
  relationships: [
    {
      relation: 'producedBy',
      from: reportIdentity,
      to: { source: 'github.workflow-runs', native: `${repository}:${runId}`, revision: String(run.run_attempt) },
    },
    {
      relation: 'evaluatesRevision',
      from: reportIdentity,
      to: { source: 'github.commits', native: `${repository}:${run.head_sha}`, revision: run.head_sha },
    },
  ],
};

const schemaPath = path.resolve('contracts/assurance/report.schema.json');
const schema = loadJsonSchema(schemaPath);
const errors = validateJsonSchema(report, schema, { rootDir: process.cwd(), schemaPath });
if (errors.length) throw new Error(`Retained report failed schema validation:\n${errors.join('\n')}`);

fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ id, workflowRunId: runId, runAttempt: run.run_attempt, sourceRevision: run.head_sha, observedAt, status }));
