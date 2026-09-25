# CI diagnostics and complete failure evidence

The `validate` job runs `npm run validate:ci`. The command is intentionally strict: it validates the pinned toolchain, installs locked dependencies, runs `check`, queries dependency advisories, and validates committed-patch whitespace. The `check` step includes generated-artifact parity, local migrations, build, and the Chromium/browser audit. It stops at the first non-zero command and returns that command's exit code. Command output is redacted and streamed to the ordinary Actions log line by line while the same complete redacted output is retained in the diagnostic artifact.

The site-wide browser command reports the start, completion, and duration of each audit script. The content-review audit also reports bounded page/state, locale, browser-operation, media-mode, and teardown progress so a timed-out CDP operation identifies its exact matrix coordinate and phase.

## Committed patch-integrity gate

`npm run validate:patch-whitespace` is the single owner of committed-patch whitespace validation. `validate:ci` invokes it exactly once after the network-dependent dependency-advisory gate. In GitHub Actions, `BASE_SHA` comes from `github.event.pull_request.base.sha` for pull-request runs and `github.event.before` for pushes to `main`.

With usable base context, the helper runs `git diff --check BASE_SHA...HEAD`. Git's three-dot form evaluates the patch from the merge base of `BASE_SHA` and `HEAD` through `HEAD`, so whitespace introduced by committed branch changes is checked even when the working tree is clean.

The helper does not guess an authoritative PR base. If `BASE_SHA` is missing, malformed, absent from local history, or cannot produce a merge base with `HEAD`, it fails and prints the exact reproduction path: resolve the open PR's base with `gh pr view --json baseRefOid`, or fetch the target branch and supply its current commit explicitly before the PR exists. A bare `git diff --check` is only an additional working-tree sanity check; it is not evidence that the committed PR range is clean.

The diagnostics wrapper captures the helper's ordinary stdout/stderr and preserves its non-zero exit code, including the original `git diff --check` failure output for trailing whitespace.

## Dependency advisory gate

`npm run security:dependency-advisories` is the single network-dependent advisory query used locally and by `validate:ci`. It runs `npm audit --audit-level=high` after `check`; it is intentionally not part of credential-free `check`.

The audit requires npm registry/network access. A high/critical advisory finding is a failing result. A registry, DNS, TLS, timeout, or other transport/query error is also fatal, but it means the advisory result is **unknown/unavailable**, not clean. The diagnostics wrapper preserves the exact non-zero exit code and complete redacted npm stdout/stderr in `.ci-diagnostics/validation.log`, so investigation must use that retained output to distinguish an advisory finding from an unavailable query.

## Pinned Node/npm toolchain

The supported toolchain is Node 26 with npm 11. The exact workflow/runtime selection is recorded in `.node-version` and `packageManager`; `engines` records the supported majors, and `.npmrc` enables `engine-strict` so an unsupported Node or npm major cannot proceed with `npm ci`.

`validate:ci` checks the exact pinned Node/npm versions before the locked install. It prints the expected and current versions on every run and fails on a mismatch before dependency installation begins.

npm 11 uses the reviewed `allowScripts` list in `package.json` for `workerd@1.20260908.1`, Wrangler's nested `esbuild@0.28.1`, and the macOS-only optional `fsevents@2.3.3`. A future toolchain or dependency change must review that list with the lockfile before accepting a new install script.

Every run writes `.ci-diagnostics/` (ignored by Git):

- `validation.log` — complete redacted stdout/stderr, with the exact command, exit code, timestamps, and duration for every attempted step;
- `report.json`, `environment.json`, `changed-files.txt`, and `diff-stat.txt` — structured status and bounded safe runtime/repository facts (never a full environment dump);
- `summary.md` — concise GitHub Actions step summary;
- `generated-artifacts.json` and `generated-artifact.diff` — authoritative generator inputs/outputs, output hashes, first-pass drift, second-pass drift, idempotence, unexpected changed files, and bounded diffs.

## Exact-head failure retrieval

All interfaces below enforce the same sequence: bind the investigation to the current PR head SHA, select the workflow run and attempt for that SHA, enumerate its jobs, and retrieve complete evidence for every failing job. A status/check summary is navigation metadata, not failure diagnosis.

### Connector actions

When workflow-run, job-list, and job-log actions are available, fetch the run associated with the exact PR head SHA, enumerate the selected run attempt's jobs, and fetch each failing job's complete log using its numeric Actions job ID. A connector is one transport option, not a prerequisite for troubleshooting.

### GitHub CLI

Use the current PR to obtain the authoritative head SHA, then select CI by that commit:

```sh
HEAD_SHA="$(gh pr view <pr-number> --json headRefOid --jq .headRefOid)"
gh run list --workflow ci.yml --event pull_request --commit "$HEAD_SHA" \
  --json databaseId,headSha,attempt,status,conclusion
```

Choose the run whose `headSha` exactly equals `HEAD_SHA`, record its `databaseId` as `RUN_ID` and its `attempt` as `RUN_ATTEMPT`, then enumerate that attempt's jobs:

```sh
gh run view "$RUN_ID" --attempt "$RUN_ATTEMPT" --json headSha,attempt,jobs \
  --jq '{headSha, attempt, jobs: [.jobs[] | {name, databaseId, status, conclusion}]}'
```

For every failing job, use its `databaseId` as `JOB_ID` and retrieve the complete job log:

```sh
gh run view --job "$JOB_ID" --log
```

`gh run view --log-failed` is useful for navigation but prints failed-step output rather than the complete failing job log; it is not sufficient evidence by itself.

If the failed `validate` job's direct log is unavailable or unsuitable for the client, download the retained diagnostics artifact for the same run attempt:

```sh
gh run download "$RUN_ID" \
  --name "ci-diagnostics-${RUN_ID}-${RUN_ATTEMPT}" \
  --dir .ci-diagnostics-recovered
```

Inspect `.ci-diagnostics-recovered/validation.log` and `.ci-diagnostics-recovered/report.json`. The workflow retains this artifact for 14 days and uploads it only on failure.

### REST

An authenticated REST client can perform the same sequence with these endpoints:

```text
GET /repos/{owner}/{repo}/actions/workflows/ci.yml/runs?event=pull_request&head_sha={head_sha}
GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs
GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs
GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts
GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/zip
```

The job-log endpoint returns a temporary `302` redirect to the plain-text log; the client must follow the `Location` URL before treating retrieval as successful. For the artifact fallback, select the artifact named `ci-diagnostics-<run_id>-<run_attempt>`, download its ZIP, and inspect `validation.log` plus `report.json`.

For private repositories or restricted integrations, Actions read access is required for these log/artifact endpoints. If an authenticated connector, `gh`, or REST request is denied or cannot expose the complete body, preserve and report the exact error/permission limitation, try another available authenticated interface when possible, and never infer the failure from status summaries.

### Reporting boundary

Retrieve complete evidence for diagnosis, but report only the failing command/assertion, relevant file and line when available, and remediation needed. Do not copy an entire large job log, artifact, or encoded payload into another log or report. Continue through controlled fixes until every required check on the exact PR head is green.

The repository does not enumerate the process environment. Secret-like environment values and GitHub/Bearer tokens are redacted before they are written to the diagnostic log or report. A failure remains a failure even when diagnostics or artifact upload succeeds.

## Generated-artifact parity

`validate:generated-artifacts` runs each authoritative write-mode generator twice. It identifies exact inputs and outputs, records hashes before and after each pass, reports first-pass stale output separately from second-pass non-determinism, and fails on either drift, a generator error, or an unexpected changed path. The current definitions cover route docs/manifests, OpenAPI, assurance runtime bindings, assurance summaries, and governance registers.
