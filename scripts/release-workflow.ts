import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import { releaseDispatchFromEnvironment, validateExactTagDispatch } from './lib/exact-tag-release.ts';
import { packageVersion } from './lib/git-demo-workflow.ts';
import { latestReleaseIntent } from './lib/release-intent.ts';

// The checked-out tagged commit must itself be the authorized completed batch.
function checkoutReadinessInputs() {
  const log = execFileSync('git', ['log', '--format=%H%x00%B%x1e', 'HEAD', '--', 'package.json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const commits = log.split('\x1e').map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    const [sha, message = ''] = entry.split('\0');
    return { sha, message };
  });
  return {
    version: packageVersion(fs.readFileSync('package.json', 'utf8')),
    planMarkdown: fs.existsSync('implementation_plan.md') ? fs.readFileSync('implementation_plan.md', 'utf8') : null,
    intent: latestReleaseIntent(commits)?.version ?? null,
  };
}

const [operation] = process.argv.slice(2);
switch (operation) {
  case 'validate-dispatch':
    validateExactTagDispatch({ ...releaseDispatchFromEnvironment(process.env), ...checkoutReadinessInputs() });
    break;
  case 'package-version':
    console.log(packageVersion(fs.readFileSync(0, 'utf8')));
    break;
  default:
    console.error(`Unknown Release workflow operation: ${operation ?? '(none)'}`);
    process.exitCode = 64;
}
