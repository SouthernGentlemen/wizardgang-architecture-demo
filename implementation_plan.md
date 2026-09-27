# Implementation plan

## Open tasks

### DEMO-379 — [SEC] Require distinct security and secrets checks

- Dependency: DEMO-378 plan-only queue publication has merged; start from its exact main and preserve current release and deployment boundaries.
- Why: Dependency advisories and secret controls run inside broad validation, but the protected main ruleset does not require separately visible `security` and `secrets` statuses.
- Scope: Add exact-head `security` and `secrets` CI jobs. Run the existing network dependency-advisory gate in `security`; run the existing public-history secret scan and Worker secret-inventory validator in `secrets`. Keep the jobs credential-free, use pinned checkout and Node/npm tooling, and run on PR heads and main. Add both check names to the committed main ruleset authority and baseline validator, update pure drift tests and current-state README guidance, and retire this task into the permanent empty queue. Preserve `validate` and `change-id` exactly.
- Non-goals: Do not change application behavior, secret values or provisioning, dependency thresholds, package versions, release tags, GitHub Releases, production deployment, or existing required-check names.
- Acceptance: New jobs pass on the exact PR head while live protection still requires the old checks. Focused settings and workflow tests reject missing or weakened `security` or `secrets`; canonical check passes in CI. Apply the committed four-check ruleset only after all four exact-head statuses are green, independently re-read live settings and rulesets, then squash the exact validated head. Require green post-merge CI, branch deletion, strict current-with-main checks, zero bypass actors, squash-only merges, and immutable `v*` tags.
- Validation: Pinned npm ci; focused policy and workflow cases; credential-free npm run check; separate dependency-advisory gate; committed-range whitespace; exact-head required CI; read-only live settings verification; post-merge CI and branch cleanup.
- Authorities: AGENTS.md, README.md, .github/workflows/ci.yml, package.json, config/github-repository-settings.json, scripts/validate-github-repository-settings.mjs, settings policy/provider scripts and pure cases, current live GitHub rulesets.
