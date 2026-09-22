import { spawnSync } from 'node:child_process';
import process from 'node:process';

const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;
const baseSha = process.env.BASE_SHA;

function contextFailure(message) {
  process.stderr.write(`${message}\n`);
  process.stderr.write('For an open PR, resolve the authoritative base with: BASE_SHA="$(gh pr view --json baseRefOid --jq .baseRefOid)" npm run validate:patch-whitespace\n');
  process.stderr.write('Before a PR exists, fetch the target branch and use its current commit explicitly, for example: git fetch origin main && BASE_SHA="$(git rev-parse origin/main)" npm run validate:patch-whitespace\n');
  process.stderr.write('A bare `git diff --check` is only an additional working-tree sanity check; without base context it does not prove the committed PR range.\n');
  process.exitCode = 2;
}

if (!baseSha) {
  contextFailure('Patch-integrity validation requires BASE_SHA so it can check the committed BASE_SHA...HEAD range.');
} else if (!SHA_PATTERN.test(baseSha)) {
  contextFailure(`Patch-integrity validation rejected invalid BASE_SHA: ${baseSha}`);
} else {
  const baseCommit = spawnSync('git', ['cat-file', '-e', `${baseSha}^{commit}`], { encoding: 'utf8' });
  if (baseCommit.status !== 0) {
    contextFailure(`Patch-integrity validation cannot find BASE_SHA ${baseSha} in local Git history. Fetch the PR base/history, then rerun the canonical command.`);
  } else {
    const mergeBase = spawnSync('git', ['merge-base', baseSha, 'HEAD'], { encoding: 'utf8' });
    if (mergeBase.status !== 0 || !mergeBase.stdout.trim()) {
      contextFailure(`Patch-integrity validation cannot resolve a merge base between BASE_SHA ${baseSha} and HEAD. Fetch sufficient Git history, then rerun the canonical command.`);
    } else {
      process.stdout.write(`Validating committed patch whitespace with git diff --check ${baseSha}...HEAD\n`);
      const result = spawnSync('git', ['diff', '--check', `${baseSha}...HEAD`], { stdio: 'inherit' });
      process.exitCode = result.status ?? 1;
    }
  }
}
