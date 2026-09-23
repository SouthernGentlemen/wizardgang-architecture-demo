import { readFile } from 'node:fs/promises';
import { compareGithubRepositorySettings, configuredMergeMethods, rulesetPayload } from './github-settings-policy.mjs';
import { adminToken, fetchLiveGithubSettings } from './github-settings-provider.mjs';

const baseline = JSON.parse(await readFile(new URL('../config/github-repository-settings.json', import.meta.url), 'utf8'));
const root = 'SouthernGentlemen/wizardgang-architecture-demo';
function assertBaseline(value) {
  if (value.repository !== root || value.defaultBranch !== 'main') throw new Error('GitHub settings authority must name this repository and main.');
  if (JSON.stringify(configuredMergeMethods(value)) !== JSON.stringify(['squash'])) throw new Error('GitHub settings authority must allow squash only.');
  if (value.deleteBranchOnMerge !== true) throw new Error('Completed branches must be deleted.');
  const policies = Object.values(value.rulesets ?? {});
  if (policies.length !== 2) throw new Error('Expected one main and one release-tag ruleset.');
  const fixture = {
    full_name: value.repository, default_branch: value.defaultBranch,
    allow_merge_commit: value.mergeMethods.mergeCommit,
    allow_squash_merge: value.mergeMethods.squash,
    allow_rebase_merge: value.mergeMethods.rebase,
    delete_branch_on_merge: value.deleteBranchOnMerge,
  };
  const main = value.rulesets.main;
  const tags = value.rulesets.releaseTags;
  if (main.name !== 'Protect main' || tags.name !== 'Protect release tags' ||
      JSON.stringify(main.requiredStatusChecks) !== JSON.stringify(['validate', 'change-id']) ||
      main.requireBranchUpToDate !== true ||
      JSON.stringify(main.bypassActors) !== '[]' || JSON.stringify(tags.bypassActors) !== '[]' ||
      JSON.stringify(tags.include) !== JSON.stringify(['refs/tags/v*'])) {
    throw new Error('GitHub settings authority weakens required checks, strictness, zero bypass, or release tags.');
  }
  const failures = compareGithubRepositorySettings(value, fixture, policies.map((policy) => rulesetPayload(value, policy)));
  if (failures.length) throw new Error(failures.join('\n'));
}

try {
  assertBaseline(baseline);
  if (process.argv.includes('--live')) {
    const live = await fetchLiveGithubSettings(baseline, { token: adminToken() });
    const failures = compareGithubRepositorySettings(baseline, live.repository, live.rulesets);
    if (failures.length) throw new Error(failures.join('\n'));
    console.log(`Live GitHub repository settings match config/github-repository-settings.json for ${root}.`);
  } else {
    console.log(`Validated committed GitHub repository-settings baseline for ${root}.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
