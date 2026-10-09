# CI diagnostics and complete failure evidence

The [`validate` and `browser` jobs](../.github/workflows/ci.yml) execute source and browser groups of the single [canonical acceptance plan](../scripts/lib/acceptance-plan.ts). `npm run check` runs all stages in their declared order; `npm run check -- source` and `npm run check -- browser` select the same stages. No group is an aggregate status or a separate hand-maintained suite.

`npm run validate:ci -- source` validates the toolchain, installs locked dependencies, validates PR identity early on PRs, runs source stages (including history, inventory and full reachable-history secret scanning), queries advisories, validates the committed patch and prepares browser inputs. `npm run validate:ci -- browser` installs the same locked dependencies, verifies the producing run/head and input hashes, applies fresh D1 migrations, then executes the bounded browser audit. Both jobs have 15-minute limits. PR-number concurrency cancels only superseded PR runs; main runs are never cancelled by this policy.

The source job uploads only `dist/client`, `src/worker-entry.mjs` and a bounded hashed manifest as `browser-inputs-<run_id>-<head_sha>`. No database, dependency tree or credentials are transferred. Browser downloads from its own run and rejects missing, changed, unexpected or other-run/head inputs. It uses a new temporary D1 store and guaranteed cleanup. A failed-browser-only rerun retains completed source evidence and its prepared artifact on that same run/head; after one-day artifact expiry, rerun the producing source job too. No cross-head reuse or hidden acceptance rebuild is allowed.

Diagnostics stop at the first failed command and preserve its exit code, redacted complete log, duration and failed/not-run stage statuses. Each job uploads its own failure evidence. Checkout/download/setup failures preceding the diagnostic runner are diagnosed from the complete job log.

The site-wide browser command reports the start, completion, and duration of the surviving main audit. Compare before/after CI cost from existing successful `validate` job logs and their stage timestamps: use the exact-head run, record the duration of `npm run check`, the browser audit, the Vitest suite, and other instrumented stages, and distinguish job scheduling/install variance from removed subprocess cost. Success diagnostics are in the live Actions log; `.ci-diagnostics/` artifacts are uploaded only on failure. Do not treat missing timing evidence as a speedup. Focus, content review, WCAG text spacing, 200%/400% reflow, reduced-motion, and forced-colors checks run inside that same Wrangler/Chromium process and reuse its canonical page/state visits; failures identify the affected path, locale, and audit phase.

The keyboard smoke selects French through native-select typeahead and requires real navigation plus the expected locale; it does not rely on OS popup behavior in headless browsers. The browser command invokes the audit directly; the diagnostic runner owns command exit/signal and duration evidence. The audit owns its Chromium, Wrangler, profile and fresh local D1 cleanup, including bootstrap failures. To repeat the affected keyboard and assurance cases three times with the same pinned runtime and built inputs, use `node scripts/site-browser-audit.ts --focused`. This focused command is diagnostic evidence; the full browser command remains in canonical acceptance. Both paths exercise deliberate wrong-focus, broken-navigation, missing-mount and 375px out-of-viewport defects before positive cases.

Readiness observes mounted/current panes and `aria-busy`; keyboard input requires the selected category to own focus after reset-dialog focus return. Geometry requires three consecutive samples within 0.25px under a five-second budget, then applies the unchanged first-viewport bounds. Timeout messages include the last safe selected/focused/mounted/busy state. Observations never refocus, scroll, reload or replay the failed action. Stable bad geometry fails. Identical localized route/state visits share coverage; locale, viewport, theme, no-JavaScript, reflow and keyboard states remain distinct. The workbench teardown observation and keyboard traversal timing retain their specific behavior checks.

## Committed patch-integrity gate

`npm run validate:patch-whitespace` checks the committed change range; its exact command wiring lives in [`package.json`](../package.json). GitHub Actions supplies `BASE_SHA` from the pull-request base or the previous `main` push commit.

With usable base context, the helper runs `git diff --check BASE_SHA...HEAD`. Git's three-dot form evaluates the patch from the merge base of `BASE_SHA` and `HEAD` through `HEAD`, so whitespace introduced by committed branch changes is checked even when the working tree is clean.

The helper does not guess an authoritative PR base. If `BASE_SHA` is missing, malformed, absent from local history, or cannot produce a merge base with `HEAD`, it fails and prints the exact reproduction path: resolve the open PR's base with `gh pr view --json baseRefOid`, or fetch the target branch and supply its current commit explicitly before the PR exists. A bare `git diff --check` is only an additional working-tree sanity check; it is not evidence that the committed PR range is clean.

The diagnostics wrapper captures the helper's ordinary stdout/stderr and preserves its non-zero exit code, including the original `git diff --check` failure output for trailing whitespace.

## Dependency advisory gate

`npm run audit:dependencies` invokes `npm run security:dependency-advisories` (`npm audit --audit-level=high`). The source `validate` job owns the sole labelled CI advisory stage. Default `validate:ci` retains the local install/check/patch path without a network query. Run `npm run security:dependency-advisories` explicitly for local pre-PR advisory validation, separate from credential-free `npm run check`.

The audit requires npm registry/network access. A high/critical advisory finding is a failing result. A registry, DNS, TLS, timeout, or other transport/query error is also fatal, but it means the advisory result is **unknown/unavailable**, not clean. The `validate` job fails on either an advisory finding or an unavailable query; inspect that job's complete Actions log to distinguish them. The source job's `.ci-diagnostics/validation.log` captures the advisory command separately from credential-free acceptance and the committed-range check.

## Pinned Node/npm toolchain

Exact Node/npm pins live in [`.node-version`](../.node-version) and [`package.json`](../package.json); `.npmrc` and the package `allowScripts` policy own install-script restrictions. `validate:ci` checks the pins before the locked install and reports a mismatch before dependency installation begins. Any toolchain or dependency change must review those authorities with the lockfile.

Every run writes `.ci-diagnostics/` (ignored by Git):

- `validation.log` — complete redacted stdout/stderr, with the exact command, exit code, timestamps, and duration for every attempted step;
- `report.json`, `environment.json`, `changed-files.txt`, and `diff-stat.txt` — structured status and bounded safe runtime/repository facts (never a full environment dump);
- `summary.md` — concise GitHub Actions step summary;
- `generated-artifacts.json` and `generated-artifact.diff` — authoritative generator inputs/outputs, output hashes, first-pass drift, second-pass drift, idempotence, unexpected changed files, and bounded diffs.

## Exact-head failure retrieval

All interfaces below enforce the same sequence: bind the investigation to the current PR head SHA, select the workflow run and attempt for that SHA, enumerate its jobs, and retrieve complete evidence for every failing job. A status/check summary is navigation metadata, not failure diagnosis. A cancelled job with zero executed steps provides no assertion evidence; distinguish runner cancellation from a command that actually failed.

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
  --name "ci-diagnostics-source-${RUN_ID}-${RUN_ATTEMPT}" \
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

The job-log endpoint returns a temporary `302` redirect to the plain-text log; the client must follow the `Location` URL before treating retrieval as successful. For the artifact fallback, select the artifact named `ci-diagnostics-<source|browser>-<run_id>-<run_attempt>`, download its ZIP, and inspect `validation.log` plus `report.json`.

For private repositories or restricted integrations, Actions read access is required for these log/artifact endpoints. If an authenticated connector, `gh`, or REST request is denied or cannot expose the complete body, preserve and report the exact error/permission limitation, try another available authenticated interface when possible, and never infer the failure from status summaries.

### Reporting boundary

Retrieve complete evidence for diagnosis, but report only the failing command/assertion, relevant file and line when available, and remediation needed. Do not copy an entire large job log, artifact, or encoded payload into another log or report. Continue through controlled fixes until every required check on the exact PR head is green.

The repository does not enumerate the process environment. Secret-like environment values and GitHub/Bearer tokens are redacted before they are written to the diagnostic log or report. A failure remains a failure even when diagnostics or artifact upload succeeds.

## Generated-artifact parity

`validate:generated-artifacts` runs the authoritative asset, route, OpenAPI, and assurance runtime-binding generators twice. It identifies declared inputs and tracked outputs, records hashes before and after each pass, reports first-pass stale output separately from second-pass non-determinism, and fails on drift, generator errors, or unexpected changed paths. This parity runner is the sole tracked freshness owner for route manifests, OpenAPI schemas, and assurance runtime bindings; focused route/contract/registry tests retain their distinct semantic checks rather than regenerating files to compare them.

The asset generator cleans `dist/client` before *each* pass and verifies the generated asset mapping, Vite inventory, complete nonempty files, no unexpected client files, and identical second-pass bytes. Its accepted second-pass distribution remains available to `npm run build:worker`, which generates the Worker entry, performs the Wrangler dry run into `dist/worker`, and validates the bundle without another Vite build. Standalone `npm run build` intentionally starts with fresh client generation before that Worker sequence. The source CI group transfers only the accepted client distribution and generated Worker entry with a hashed same-run/head manifest. Worker dry-run output remains source validation evidence and is not needed by the browser runtime.
