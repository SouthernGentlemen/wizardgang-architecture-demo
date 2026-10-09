import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  acceptedControlledIds,
  validateControlledPullRequestIdentity,
} from './lib/controlled-pr-identity.ts';
import { validateReleaseIntentChange } from './lib/release-intent.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredEnvironment = ['PR_BRANCH', 'PR_TITLE', 'PR_BODY', 'BASE_SHA', 'HEAD_SHA'];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length) {
  console.error(`Missing pull-request identity environment: ${missingEnvironment.join(', ')}`);
  process.exit(1);
}

const runGit = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA;
const checkedOutSha = runGit(['rev-parse', 'HEAD']);
const errors = [];

if (checkedOutSha !== headSha) errors.push(`Checked out HEAD ${checkedOutSha} does not equal PR head ${headSha}.`);
try {
  execFileSync('git', ['merge-base', '--is-ancestor', baseSha, headSha], { cwd: root, stdio: 'ignore' });
} catch {
  errors.push(`PR head ${headSha} is not based on current base ${baseSha}; refresh the branch before validation.`);
}

let basePlanMarkdown = null;
try {
  basePlanMarkdown = execFileSync('git', ['show', `${baseSha}:implementation_plan.md`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch { basePlanMarkdown = null;
}

const headPlanPath = path.join(root, 'implementation_plan.md');
const headPlanMarkdown = existsSync(headPlanPath) ? readFileSync(headPlanPath, 'utf8') : null;
const headSubject = runGit(['show', '-s', '--format=%s', headSha]);
const headBody = runGit(['show', '-s', '--format=%b', headSha]);
const rangeOutput = runGit(['log', '--reverse', '--format=%s', `${baseSha}..${headSha}`]);
const rangeSubjects = rangeOutput ? rangeOutput.split('\n').filter(Boolean) : [];
const baseHistoryOutput = runGit(['log', '--format=%s', baseSha]);
const baseAcceptedIds = acceptedControlledIds(baseHistoryOutput ? baseHistoryOutput.split('\n').filter(Boolean) : []);
const gitFile = (revision, file) => execFileSync('git', ['show', `${revision}:${file}`], { cwd: root, encoding: 'utf8' });
const releaseIntentErrors = validateReleaseIntentChange({
  body: headBody,
  beforePackage: gitFile(baseSha, 'package.json'),
  afterPackage: gitFile(headSha, 'package.json'),
  beforeLock: gitFile(baseSha, 'package-lock.json'),
  afterLock: gitFile(headSha, 'package-lock.json'),
});

errors.push(...validateControlledPullRequestIdentity({
  branchName: process.env.PR_BRANCH,
  title: process.env.PR_TITLE,
  prBody: process.env.PR_BODY,
  headSubject,
  headBody,
  rangeSubjects,
  basePlanMarkdown,
  headPlanMarkdown,
  baseAcceptedIds,
  baseSha,
  releaseIntentErrors,
}));

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('Controlled PR identity, queue selection, range, dependencies, and task retirement are valid.');
}
