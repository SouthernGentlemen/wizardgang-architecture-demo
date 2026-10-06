import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import {
  mergedCommit, packageVersion, planLiveReleaseStart, requireExactBase, requireSuccessfulChecks, verifyLivePullRequest,
} from './lib/git-demo-workflow.ts';

function env(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is required.`);
  return value;
}

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: 'utf8' });
}

function writeOutputs(values: Record<string, string>): void {
  fs.appendFileSync(env('GITHUB_OUTPUT'), Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
}

const [operation] = process.argv.slice(2);
switch (operation) {
  case 'start': {
    const bump = env('BUMP');
    if (bump !== 'patch' && bump !== 'minor' && bump !== 'major') throw new Error('bump must be patch, minor, or major');
    const start = planLiveReleaseStart({
      packageJson: fs.readFileSync('package.json', 'utf8'),
      bump,
      requestId: env('REQUEST_ID'),
      subjects: run('git', ['log', '--format=%s']).split('\n'),
      planMarkdown: fs.readFileSync('implementation_plan.md', 'utf8'),
      openPullRequests: JSON.parse(run('gh', ['pr', 'list', '--state', 'open', '--limit', '1000', '--json', 'title,headRefName'])),
      existingTag: (tag) => run('git', ['tag', '--list', tag]).trim() !== '',
    });
    writeOutputs({ ...start });
    break;
  }
  case 'verify-pull':
    writeOutputs({ ...verifyLivePullRequest(JSON.parse(env('PR_JSON')), env('REQUEST_ID')) });
    break;
  case 'require-checks':
    requireSuccessfulChecks(JSON.parse(env('CHECKS_JSON')));
    break;
  case 'recheck-base':
    requireExactBase(JSON.parse(env('PR_JSON')), env('SHA'), run('git', ['rev-parse', 'origin/main']).trim());
    break;
  case 'merged-commit':
    console.log(mergedCommit(JSON.parse(env('PR_JSON'))));
    break;
  case 'package-version':
    console.log(packageVersion(fs.readFileSync(0, 'utf8')));
    break;
  default:
    console.error(`Unknown live Git demo operation: ${operation ?? '(none)'}`);
    process.exitCode = 64;
}
