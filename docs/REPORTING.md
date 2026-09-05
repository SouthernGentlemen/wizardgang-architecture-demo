# Authoritative Reporting Contracts

## Purpose

Reporting is a projection and provider-integration layer, not a second system of record. Every reportable fact has one authoritative source. Structured assurance records remain Git-controlled JSON in this repository, native GitHub concerns remain native GitHub objects, and Cloudflare operational facts remain native observations.

The common contract is `contracts/assurance/reporting.schema.json`. All source declarations live in the existing `assurance/registry.json`; there is no second reporting registry.

## Authority model

| Domain | Authoritative source | Rule |
| --- | --- | --- |
| Evidence | GitHub structured assurance records | Registered evidence JSON owns assurance evidence facts. |
| Internal reports | `github.retained-reports` | Schema-valid CI and assurance-monitor reports are retained once on the `assurance-reports` Git branch; the 30-day Actions artifact is transport/recovery only. |
| Issues / corrective actions | Native GitHub issues | Repository + issue number is identity; GitHub `updated_at` is revision. Configured labels may select corrective-action concerns without copying them into a register. |
| Delivery evidence | Native GitHub repository objects | Repository, branch, commit, pull request, Actions run/attempt/artifact, tag, release, and branch-protection objects remain provider-owned. |
| Security findings | Native protected GitHub security objects | Code scanning, secret scanning, Dependabot, and repository security advisories remain provider-owned and protected. |
| Private vulnerability reporting | Native GitHub repository security advisories | Private vulnerability reports stay on GitHub's repository-security-advisory workflow. They are never converted into public issues. |
| Risks / public advisories | GitHub structured assurance records | Registered domain JSON remains authoritative for public assurance facts. |
| Governance registers | `governance.records` structured partitions | Reportable table facts live in registry-declared JSON and Markdown tables are deterministic views; policy prose and professional judgment remain authored in Markdown. |
| Operations | Native Cloudflare observations | Cloudflare owns native operational observations. |

## Registered GitHub provider sources

`assurance/registry.json` declares the GitHub native object types. Runtime repository bindings are configuration, not canonical data. The provider binds each selected source to an authorized repository at request time and preserves the repository scope in every returned identity.

Public source types include repositories, branches, commits, issues, pull requests, workflow runs, workflow attempts, workflow artifacts, tags, releases, configured-branch protection, and the `github.retained-reports` structured source. Protected source types include code-scanning alerts, secret-scanning alerts, Dependabot alerts, and repository security advisories.

Source objects advertise only capabilities the provider adapter actually supports. GitHub issues advertise `import` because update-only issue writes are implemented. Other native objects do not advertise import. Protected security sources remain read/query/export only and `privateIngestion` remains disabled.

## Native identity and revisions

The provider does not allocate report IDs that compete with GitHub. The required reporting `id` is a deterministic serialization of the registered source identity, while the response also preserves the source-native identifier, repository, timestamps, URLs, provider status/state, revision components, and the native provider payload. Missing required native identity or revision components qualify the source as partial instead of creating fallback identity.

Examples:

- issue: repository + issue number, revised by `updated_at`;
- pull request: repository + PR number, revised by head SHA and `updated_at`;
- workflow run: repository + run ID, revised by attempt number and `updated_at`;
- workflow attempt: repository + run ID + attempt number, revised by `updated_at`;
- artifact: repository + artifact ID, revised by update/expiration metadata;
- release: repository + release ID, revised by update time/tag;
- branch protection: repository + configured branch, revised by that branch's commit SHA;
- repository security advisory: repository + GHSA ID, revised by `updated_at`.

Relationships are identities, not copied register rows. For example, an artifact can point to its producing workflow run, an attempt can point to its run, a pull request can point to its head commit, and a release can point to its tag.

## Retained report production

`.github/workflows/report-publisher.yml` runs only after completion of the approved `CI` or `Assurance Monitor` workflows on the trusted default branch. It checks out publisher code from the default branch—not the producer revision or pull-request checkout—and queries the GitHub run/job/step APIs directly. CI push runs are accepted only for the `push` event; assurance-monitor runs are accepted only for `schedule` or `workflow_dispatch`. A repository mismatch, unapproved producer/event, non-default branch, incomplete run, invalid provenance, incomplete job pagination, or schema-invalid report fails publication.

Provider conclusions map without reinterpretation: `success` is `passed`; `failure`, `timed_out`, `action_required`, and `startup_failure` are `failed`; `cancelled` is `cancelled`; `skipped` is `skipped`; and any other or unfinished outcome is `incomplete`. A completed run with zero observed jobs remains representable and explicitly says that no check execution was inferred.

The publisher writes each run attempt once to `reports/YYYY/MM/<family>-<run>-attempt-<attempt>.json` on the `assurance-reports` branch. That Git history is the durable authority with a minimum 400-day retention policy and controlled-change deletion. Its 30-day Actions artifact is not a second report authority. If GitHub repository Actions settings do not grant `GITHUB_TOKEN` write authority, the publisher fails at the branch push and the setting must be corrected; no Worker token, D1 copy, external storage, or invented credential is used as a fallback.

## Query and export behavior

The existing `/__api/git/evidence` route returns the current shared reporting `queryResult`; the legacy `GitHubEvidence`, `EvidenceCard`, `cards`, and `controls` response model is not supported in parallel.

GET accepts:

- `repository` — one configured repository binding; omitted uses the first configured binding;
- `source` — one or more registered source IDs, repeatable or comma-separated;
- `mode=sample|export` — `sample` is intended for dashboards, `export` follows provider pagination;
- `limit=1..100` — per-source dashboard page size.

A sample request fetches one provider page and marks the source `partial` when GitHub reports a next page. A sample is therefore never described as a complete export. `mode=export` follows provider pagination until the source is complete or the configured hard page bound is reached. If the hard bound is reached, the result remains explicit `partial` with a provider cursor qualification.

The common schema-defined provider availability vocabulary is `available`, `partial`, `unavailable`, `rate-limited`, `stale`, and `expired`. `stale` means an authoritative observation is retained but its freshness window has elapsed; it is not counted as currently available. `expired` is reserved for provider resources that are themselves expired, such as an expired GitHub Actions artifact. `empty` and `unconfigured` are presentation states derived from an available zero-record result or an unavailable source with explicit configuration qualification; they are not provider availability values. A missing or inaccessible `assurance-reports` branch is `unavailable`, while an existing branch with no report files is an available empty source. Upstream error bodies are not returned to clients.

`query.pagination.total` and `derived.totalAvailable` are the number of native objects actually observed by the bounded query. When a source is partial, its qualification says so; those numbers must not be interpreted as an authoritative global total.

## Configuration

The existing `GITHUB_REPO_URL` and `GITHUB_BRANCH` remain the default repository binding so the functioning Git demo requires no duplicate repository configuration.

Optional `GITHUB_REPORTING_BINDINGS` is a JSON array for explicit multi-repository/source bindings. Each entry accepts:

```json
{
  "repository": "owner/repository",
  "branch": "main",
  "sources": ["github.issues", "github.workflow-runs"],
  "issueLabels": ["corrective-action"]
}
```

Bindings are fail-closed: invalid repositories, duplicate repository entries, unregistered source IDs, or a request for a source excluded by the binding produce precise configuration errors. The application never invents or creates a private repository to satisfy reporting.

`GITHUB_REPORTING_MAX_PAGES` bounds `mode=export` provider pagination. The implementation clamps it to a safe maximum.

## Access controls

A server-side provider credential establishes the Worker's ability to query a source; it does not establish the visitor's right to receive that source.

Public repositories and public source types are probed without a credential. If that probe indicates a private repository, private content is not fetched until the current application principal has `reporting:private`. Protected security source types require `reporting:private` even when the repository itself is public.

`reporting:private` is granted only to a validated, revocable application identity normalized to the `operator` role. Viewer identities and the legacy static demo API token do not receive it. Protected HTTP responses are `private, no-store` and vary on `Authorization, Cookie`.

### Read credential

`GITHUB_READ_TOKEN` is optional for public-only reporting. Configure it as a dedicated, repository-scoped fine-grained credential when a bound repository is private or a protected GitHub security source is enabled. Grant only the native read permissions required by the configured sources, for example:

- Metadata / Contents / Pull requests: read for repository/commit/PR evidence as applicable;
- Actions: read for workflow runs, attempts, and artifacts;
- Issues: read for issue/corrective-action reporting;
- code scanning / secret scanning / Dependabot / repository security advisory read permissions for protected security sources;
- Administration: read only if branch-protection retrieval is required.

Do not expose the token in browser payloads, logs, registry JSON, fixtures, or report objects.

## Supported source writes

Native provider writes use the same registered source capability model. POST `/__api/git/evidence` requires an operator principal with `reporting:write` and a dedicated server-side `GITHUB_REPORTING_WRITE_TOKEN`.

The current supported native operation is **update an existing GitHub issue**. The request supplies the registered source, configured repository, `operation: "update"`, native issue number, expected native revision, and fields.

Allowed issue fields are `title`, `body`, `state`, `labels`, `assignees`, and `milestone`. Unknown fields are rejected rather than ignored. The adapter fetches the current issue and requires its `updated_at` revision to match the request before PATCH, preventing stale writes. Create, delete, repository creation, release creation, advisory creation, and security-object conversion are unsupported and rejected.

The live Git demo credential is not reused for reporting writes. `GITHUB_REPORTING_WRITE_TOKEN` should be a separate fine-grained credential with only Issues: write for the configured repository. If it is not configured, the write path returns `github_write_credential_missing`; validation does not create resources or credentials.

Structured-record import/export remains the repository CLI introduced by DEMO-157:

```text
npm run assurance:interchange -- export [--output <file>]
npm run assurance:interchange -- import --input <file> [--dry-run]
```

That CLI continues to own Git-controlled structured records. Native provider writes occur through the provider adapter and are never rewritten into the structured assurance register.

## Git demo migration

`/git` retains the functioning live branch/commit/PR/CI/release demonstration. Its source-of-truth evidence panel consumes the shared reporting query contract directly. It groups returned native records and canonical retained reports by registered source ID and displays completeness/availability from the contract. It does not reconstruct an independent issue, finding, report, or evidence-card state model.

## Test boundaries

Fixtures cover:

- native identity and revision preservation;
- duplicate native identities across provider pages;
- bounded sample vs complete export pagination;
- open/closed issue status without reinterpretation;
- unavailable, rate-limited, stale, and provider-expired states;
- Actions run/artifact relationships;
- retained-report branch discovery, report relationships, and missing-source versus empty-source behavior;
- successful, failed, skipped, cancelled, zero-job, incomplete, and rejected report production;
- protected repository-security-advisory access without issue conversion;
- public/private repository isolation;
- update-only issue writes, unsupported fields/operations, stale revisions, and missing write credentials.

Live provider reads are permitted only when the deployment already has the required source configuration and authorization. CI fixture success is tested code; it is not evidence that a protected live GitHub integration is configured.

## Rollback

Rollback of the native provider integration remains one controlled revert of DEMO-158. Rollback of retained reports and governance projections is one controlled revert of DEMO-159; do not operate the retired validation-artifact producer or independently edited Markdown state in parallel with the canonical sources.

Reverting publisher code does not delete already retained reports. Any deletion from `assurance-reports` is a separate controlled change so durable evidence is not silently erased.

If rollback occurs after a permitted native issue update, reverting application code does **not** revert that provider-side issue change. Provider writes are separately auditable GitHub operations and must be reversed in GitHub through an authorized corrective update if required.

No release or deployment is part of this reporting refactor series.
