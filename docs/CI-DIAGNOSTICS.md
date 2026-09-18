# CI diagnostics and complete failure evidence

The `validate` job runs `npm run validate:ci`. The command is intentionally strict: it executes the same locked install, generated-artifact parity, repository checks, migration check, Chromium/browser audit, dependency audit, build, and whitespace validation used by CI; it stops at the first non-zero command and returns that command's exit code. Command output is redacted and streamed to the ordinary Actions log line by line while the same complete redacted output is retained in the diagnostic artifact.

The site-wide browser command reports the start, completion, and duration of each of its three audit scripts. DEMO-289 additionally reports bounded page/state, locale, browser-operation, media-mode, and teardown progress so a timed-out CDP operation identifies its exact matrix coordinate and phase.

## Pinned Node/npm toolchain

The supported toolchain is Node 22 with npm 10. The exact workflow/runtime selection is recorded in `.node-version` and `packageManager`; `engines` records the supported majors, and `.npmrc` enables `engine-strict` so an unsupported Node or npm major cannot proceed with `npm ci`.

`validate:ci` checks the pinned Node/npm majors before the locked install. It prints the expected and current versions on every run. A mismatch is reported locally and is a hard failure when `CI` is set, before dependency installation begins.

npm 10 is intentional for this release line. Its locked install runs the install scripts required by `workerd@1.20260908.1`, Wrangler's nested `esbuild@0.28.1`, and the macOS-only optional `fsevents@2.3.3`. Do not run this repository's locked install under npm 11 or a later major and accept skipped-script warnings as equivalent behavior. A future npm-major change that introduces install-script approval must explicitly review and approve or deny these packages in the repository before changing `packageManager`.

Every run writes `.ci-diagnostics/` (ignored by Git):

- `validation.log` — complete redacted stdout/stderr, with the exact command, exit code, timestamps, and duration for every attempted step;
- `report.json`, `environment.json`, `changed-files.txt`, and `diff-stat.txt` — structured status and bounded safe runtime/repository facts (never a full environment dump);
- `summary.md` — concise GitHub Actions step summary;
- `generated-artifacts.json` and `generated-artifact.diff` — authoritative generator inputs/outputs, output hashes, first-pass drift, second-pass drift, idempotence, unexpected changed files, and bounded diffs.

## Retrieval order

1. Use the ordinary Actions job log first. It contains the live command headings and complete output from `validate:ci`.
2. If a UI or connector cannot expose a large or redirected job-log body, download the `ci-diagnostics-<run_id>-<run_attempt>` artifact from the failed run and inspect `validation.log` plus the JSON report. The artifact is retained for 14 days.
3. With GitHub CLI, use `gh run view <run-id> --log`, `gh run view <run-id> --log-failed`, or `gh run view --job <job-id> --log`. For the REST endpoint, `gh api --include --allow-escape-sequences repos/<owner>/<repo>/actions/jobs/<job-id>/logs` follows the temporary redirect safely; a `302` to an encrypted plain-text blob is normal. The run archive endpoint (`.../actions/runs/<run-id>/logs`) is a ZIP fallback.

The repository does not enumerate the process environment. Secret-like environment values and GitHub/Bearer tokens are redacted before they are written to the diagnostic log or report. A failure remains a failure even when diagnostics or artifact upload succeeds.

## Generated-artifact parity

`validate:generated-artifacts` runs each authoritative write-mode generator twice. It identifies exact inputs and outputs, records hashes before and after each pass, reports first-pass stale output separately from second-pass non-determinism, and fails on either drift, a generator error, or an unexpected changed path. The current definitions cover route docs/manifests, OpenAPI, assurance runtime bindings, assurance summaries, and governance registers.
