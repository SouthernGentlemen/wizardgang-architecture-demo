# CI diagnostics and complete failure evidence

The `validate` job runs `npm run validate:ci`. The command is intentionally strict: it executes the same locked install, generated-artifact parity, repository checks, migration check, Chromium/browser audit, dependency audit, build, and whitespace validation used by CI; it stops at the first non-zero command and returns that command's exit code.

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
