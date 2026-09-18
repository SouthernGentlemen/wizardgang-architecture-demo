import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'config', 'github-repository-settings.json'), 'utf8'));
const live = process.argv.includes('--live');

function fail(message) {
  throw new Error(message);
}

function sorted(values) {
  return [...values].sort();
}

function assertBaseline(value) {
  if (!value || value.schemaVersion !== 1) fail('GitHub repository-settings baseline must use schemaVersion 1.');
  if (!/^[^/]+\/[^/]+$/.test(value.repository ?? '')) fail('GitHub repository-settings baseline must name one owner/repository.');

  const expectedSettings = {
    allowMergeCommit: true,
    allowSquashMerge: false,
    allowRebaseMerge: false,
    deleteBranchOnMerge: true,
  };
  if (JSON.stringify(value.repositorySettings) !== JSON.stringify(expectedSettings)) {
    fail('GitHub repository merge settings baseline does not match CFG-013.');
  }

  const byName = new Map((value.rulesets ?? []).map((ruleset) => [ruleset.name, ruleset]));
  if (byName.size !== 2) fail('GitHub repository-settings baseline must contain exactly the two CFG-013 rulesets.');

  const main = byName.get('Protect main');
  if (!main || main.target !== 'branch' || main.enforcement !== 'active') fail('Protect main baseline is missing or inactive.');
  if (JSON.stringify(main.conditions) !== JSON.stringify({ include: ['refs/heads/main'], exclude: [] })) {
    fail('Protect main target does not match CFG-013.');
  }
  if ((main.bypassActors ?? []).length) fail('Protect main must not define bypass actors.');
  const mainRules = new Map((main.rules ?? []).map((rule) => [rule.type, rule]));
  for (const type of ['deletion', 'non_fast_forward', 'pull_request', 'required_status_checks']) {
    if (!mainRules.has(type)) fail(`Protect main baseline is missing ${type}.`);
  }
  const pullRequest = mainRules.get('pull_request')?.parameters ?? {};
  if (pullRequest.requiredApprovingReviewCount !== 0) {
    fail('Protect main must require zero approving reviews for the single-maintainer model.');
  }
  if (JSON.stringify(pullRequest.allowedMergeMethods) !== JSON.stringify(['merge'])) {
    fail('Protect main must allow only merge commits.');
  }
  const checks = sorted(mainRules.get('required_status_checks')?.parameters?.requiredStatusChecks ?? []);
  if (JSON.stringify(checks) !== JSON.stringify(['change-id', 'validate'])) {
    fail('Protect main must require change-id and validate.');
  }

  const tags = byName.get('Protect release tags');
  if (!tags || tags.target !== 'tag' || tags.enforcement !== 'active') fail('Protect release tags baseline is missing or inactive.');
  if (JSON.stringify(tags.conditions) !== JSON.stringify({ include: ['refs/tags/v*'], exclude: [] })) {
    fail('Protect release tags target does not match CFG-013.');
  }
  if ((tags.bypassActors ?? []).length) fail('Protect release tags must not define bypass actors.');
  const tagRules = sorted((tags.rules ?? []).map((rule) => rule.type));
  if (JSON.stringify(tagRules) !== JSON.stringify(['deletion', 'update'])) {
    fail('Protect release tags must block update and deletion.');
  }
}

function ghJson(endpoint) {
  const result = spawnSync('gh', ['api', endpoint], { cwd: root, encoding: 'utf8' });
  if (result.error) fail(`Unable to run gh for live repository-settings verification: ${result.error.message}`);
  if (result.status !== 0) fail(`gh api ${endpoint} failed: ${result.stderr.trim() || 'unknown error'}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    fail(`gh api ${endpoint} returned non-JSON output.`);
  }
}

function projectRuleset(remote) {
  const rules = (remote.rules ?? []).map((rule) => {
    if (rule.type === 'pull_request') {
      return {
        type: rule.type,
        parameters: {
          requiredApprovingReviewCount: rule.parameters?.required_approving_review_count,
          allowedMergeMethods: rule.parameters?.allowed_merge_methods ?? [],
        },
      };
    }
    if (rule.type === 'required_status_checks') {
      return {
        type: rule.type,
        parameters: {
          requiredStatusChecks: sorted((rule.parameters?.required_status_checks ?? []).map((check) => check.context)),
        },
      };
    }
    return { type: rule.type };
  }).sort((a, b) => a.type.localeCompare(b.type));

  return {
    name: remote.name,
    target: remote.target,
    enforcement: remote.enforcement,
    conditions: {
      include: remote.conditions?.ref_name?.include ?? [],
      exclude: remote.conditions?.ref_name?.exclude ?? [],
    },
    bypassActors: remote.bypass_actors ?? [],
    rules,
  };
}

function normalizeRuleset(value) {
  return {
    ...value,
    rules: (value.rules ?? []).map((rule) => {
      if (rule.type === 'required_status_checks') {
        return {
          ...rule,
          parameters: {
            ...rule.parameters,
            requiredStatusChecks: sorted(rule.parameters?.requiredStatusChecks ?? []),
          },
        };
      }
      return rule;
    }).sort((a, b) => a.type.localeCompare(b.type)),
  };
}

assertBaseline(baseline);

if (!live) {
  process.stdout.write(`Validated committed GitHub repository-settings baseline for ${baseline.repository}.\n`);
  process.exit(0);
}

const repository = ghJson(`repos/${baseline.repository}`);
const rulesetIndex = ghJson(`repos/${baseline.repository}/rulesets`);
const remoteByName = new Map(rulesetIndex.map((entry) => [entry.name, entry]));
const projectedRulesets = baseline.rulesets.map((expected) => {
  const summary = remoteByName.get(expected.name);
  if (!summary) fail(`Live GitHub repository is missing ruleset: ${expected.name}`);
  return projectRuleset(ghJson(`repos/${baseline.repository}/rulesets/${summary.id}`));
});

const projected = {
  schemaVersion: 1,
  repository: baseline.repository,
  repositorySettings: {
    allowMergeCommit: repository.allow_merge_commit,
    allowSquashMerge: repository.allow_squash_merge,
    allowRebaseMerge: repository.allow_rebase_merge,
    deleteBranchOnMerge: repository.delete_branch_on_merge,
  },
  rulesets: projectedRulesets,
};

const normalizedBaseline = {
  ...baseline,
  rulesets: baseline.rulesets.map(normalizeRuleset),
};
const normalizedProjected = {
  ...projected,
  rulesets: projected.rulesets.map(normalizeRuleset),
};

if (JSON.stringify(normalizedProjected) !== JSON.stringify(normalizedBaseline)) {
  fail('Live GitHub repository settings or rulesets differ from config/github-repository-settings.json.');
}

process.stdout.write(`Live GitHub repository settings match config/github-repository-settings.json for ${baseline.repository}.\n`);
