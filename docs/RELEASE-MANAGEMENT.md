# Release management

WizardGang Architecture Demo uses semantic versioning. Controlled change IDs identify accepted changes; annotated semantic-version tags identify immutable product states. Not every change is tagged.

## One release per authorized batch

A release is the end of one owner-authorized batch, not a per-fix event or a follow-up version PR. During batch planning the owner names the target version: the plan-only change is planned with `npm run delivery -- plan <input.json>`, where the input's optional `release` object carries `version` and `authorizedBy` beside the ordered `tasks`. The shared allocator reserves the planning identity and queued identities once and validates that the version advances the current package version. That same controlled `Portfolio-Plan-Maintenance: true` record carries `Release-Intent: vX.Y.Z`, a `Release:` section naming the version, and the only `package.json`/`package-lock.json` version change. A batch planned without that object releases nothing. PR and forward-history validation reject any other package version change, a mismatched or duplicate intent, and an intent outside plan maintenance.

The intent survives the batch in accepted Git history and in the package version; each delivery still retires only its own task, and the final delivery restores the byte-identical shared empty queue without recording completed work. An empty queue alone never authorizes a release, and an authorized but unpublished version cannot release while any task remains.

The exact-tag cutter is a separate, serialized `workflow_run` after completed CI on `main`. For each successful run it reads current `main`, its package version, `implementation_plan.md`, the newest intent among `package.json`-changing records, both required CI jobs, the version tag and Release. It leaves an already-published version alone and otherwise acts only when the run is for exact current `main`, both `validate` and `browser` succeeded, the intent matches the package version and the queue is empty. It re-reads all of those inputs and requires the same decision before creating the annotated tag or dispatching Release; an existing tag at another commit fails closed and is never moved, and an active dispatch for the exact tag is not duplicated. The cutter writes the shared readiness summary (version, intent, open queue, decision) to its Actions summary. Release dispatch validation applies the same readiness to the checked-out tagged commit before publication or deployment.

### Authenticated live release

The live Git delivery controller in `/demos#webhooks` demonstrates the same path for a completed batch. Visitors can inspect the public read-only Actions feed at `/api/labs/git-delivery`; every release control is under `/admin/*` and therefore crosses the shared `WG_OPS_TOKEN` shell gate. `GET /admin/api/labs/git-delivery?preflight=patch` (or `minor`/`major`) returns the target version, latest published release, every commit since that release, open queue tasks, any blocking reason and a fingerprint of that evidence; incomplete GitHub data fails closed. Start is refused while the queue has tasks or the current package version is still unreleased, and it requires the matching fingerprint.

Start re-reads the shared reservations, allocates through the same planning primitive and opens one `[BUILD] Authorize vX.Y.Z batch release` plan-maintenance PR on `demo-###-release-vX-Y-Z-<request>` carrying the intent, request correlation and release range. Merge & Release uses the ordinary protected delivery adapter: mutable title/body, current-base/head, canonical CI, every active required check and mergeability are re-read before the explicit squash. Successful CI on the accepted commit then lets the cutter tag and dispatch Release.

## Release rule

A release may be published only when the exact tagged state reproduces successfully:

```text
npm ci
npm run check
npm run security:dependency-advisories
```

Release reproduction installs locked dependencies once, then runs `npm run check` and `npm run security:dependency-advisories` in that order. During `npm run check`, Release provides one fresh temporary local D1 persistence directory to migration validation and the later browser audits. `npm run check` owns the single migration invocation; no second standalone migration runs during reproduction. The step's EXIT trap removes that temporary directory on success or failure. `npm run check` also owns the sole unbound `npm run build`, covering client assets, the Worker dry run and bundle validation. Release does not invoke a second unbound build. The pinned baseline deploy workflow separately performs the production identity-bound build using `WG_VERSION` and `WG_COMMIT` for the exact tagged commit.

The tagged-state gate does not launch standalone successful-checkout history, Worker-inventory, documentation, repository-settings, or assurance validators after `check`. Those checks retain one execution owner inside the expanded `check` command, and their distinct invalid-input and fail-closed fixtures remain in the Vitest suite. Release's explicit advisory query is separate from the CI `validate` job's labelled advisory query; neither is a credential-free `check` command. The committed-range patch gate remains separate in `validate:ci`, while protected production authentication, tag identity, and post-deploy verification remain independent of reproduction.

Release tags use `vMAJOR.MINOR.PATCH`, are annotated, and must point to the exact checked-out commit whose `package.json` version matches the tag. Published tags are never moved or deleted during ordinary development. Corrections move forward under a new controlled change and version.

## Release authority and notes

The annotated tag and GitHub Release are the historical release authority. The repository does not maintain a parallel per-version Markdown release archive or root changelog.

The Release workflow accepts either an exact tag push or an exact-tag dispatch bound to successful CI on current `main`. A workflow-token tag creation does not generate a new tag-push workflow event, so the cutter dispatches Release explicitly. Both paths derive publication from Git/GitHub state:

1. verify the tag is semantic and annotated;
2. resolve the exact tagged commit and require the checkout to match it;
3. require the package version to match the tag;
4. capture the annotated tag date in UTC and the closest preceding published semantic release when one exists, skipping tags whose Release did not publish;
5. reproduce the tagged source with the required validation gates;
6. generate and retain the release-bound assurance registry snapshot;
7. create the GitHub Release with an identity header derived from the tag and GitHub-generated notes for the changes since the preceding published release;
8. attach the assurance registry snapshot to the GitHub Release, retaining an already-published release on retry;
9. deploy only after release reproduction and publication succeed;
10. attach the verified deployment result to the same GitHub Release.

Historical release notes are read from GitHub Releases. Superseded repository state remains reconstructable from the corresponding annotated tag and Git history.

## Flow

```text
batch plan + Release-Intent -> queued deliveries -> last task retired (empty queue)
                -> successful exact-current-main CI -> cutter readiness
                -> annotated semantic tag -> reproduce exact tag
                -> GitHub Release + assurance snapshot
                -> prove reproduction in this run attempt -> deploy exact tag
                -> verify Cloudflare Worker version / 100% traffic
                -> verify /version.json, /health.json and same-origin assets
                -> deployment result attached to the GitHub Release
```

Production identity comes from the immutable release tag and commit, not from an arbitrary `main` commit. A security or release defect is corrected forward with a new controlled change, planned under a fresh authorized patch intent.

## Tag-triggered deployment

The release workflow operates on an existing annotated semantic-version tag. After publication its `deploy` job, which needs `reproduce`, calls baseline's `deploy-worker.yml` reusable workflow at the exact commit pinned by `platform/vendor.lock.json`, passing Worker `demo`, the exact tag and the accepted commit, with only `actions: read` and `contents: read`. The baseline verify job fails when the call and the vendored lock name different commits. This repository has no second production deploy workflow.

The baseline deploy workflow then:

- accepts only an exact requested `vMAJOR.MINOR.PATCH` tag, proves it is an annotated tag on `main` whose peeled commit is checked-out `HEAD` and whose version matches `package.json`;
- proves from the Actions API, never from an input, that this run attempt is at that commit, references the vendored deploy-worker commit, and that `reproduce` (the one job the call needs that sets up Node from `.node-version` and runs `npm ci` then `npm run check`) succeeded in this attempt, and that the tag's GitHub Release is published and non-draft. It does not install, build or run the suite again;
- checks the vendored platform pin and Wrangler conformance;
- in the protected `production` environment, builds the exact tagged Worker source with `WG_VERSION` and `WG_COMMIT`, deploys the conforming `demo` Worker with provisioning disabled, and captures Wrangler's deployment result;
- requires Cloudflare's current deployment status to identify the new Worker version as the sole version receiving 100% of production traffic;
- polls `https://demo.wizardgang.ai/version.json` until it identifies app `demo`, the exact version and the exact commit, reporting a Cloudflare challenge apart from a timeout;
- requires `/health.json` to answer 200 with status `ok`, app `demo` and the exact version;
- loads the root page (at most three same-origin redirects) and requires each same-origin script, module preload and stylesheet it names (at most 20) to answer 200 with a JavaScript or CSS type and a non-empty body. This is an availability check, not a browser or accessibility suite;
- only when every observation passes, exports one whitelisted result line.

A rerun of a failed reproduction or deployment re-runs all jobs, so the reproduction belongs to the new attempt; a rerun of failed jobs only cannot deploy. A recovery deployment uses a Release run at an already published immutable semantic tag, which reproduces that tag; it does not deploy an arbitrary branch head, raw SHA, lightweight tag, unpublished tag, or package/tag mismatch. The repository-level `npm run deploy` command is intentionally fail-closed so an arbitrary local checkout cannot use the package command as a production publish path. Repository and Worker credentials remain managed secrets and are documented by their owning security/identity configuration rather than duplicated in release prose.

### Worker secret provisioning

`config/worker-secrets.json` remains the checked-in source of truth for the demo's seven Worker secret names. Their values are provisioned and rotated with the baseline secrets runbook, while the shared shell receives `WG_OPS_TOKEN` and `WG_SESSION_KEY` from the account Secrets Store. The baseline deployment workflow does not print or move secret values; it deploys the already-provisioned bindings declared by the reviewed Worker configuration.

## Deployment result

A verified deployment records itself; there is no follow-up record branch, pull request or Markdown ledger. The Release workflow's `record` job needs `deploy` and holds only `contents: write`. It has no checkout, install, build, test, credential or environment approval, and it never deploys.

It accepts `needs.deploy.outputs.result` only as one bounded JSON line holding exactly the baseline result fields — `schema` 1, `worker` `demo`, `host` `demo.wizardgang.ai`, `repository`, `run_id`, `run_attempt`, `tag`, full `commit`, `observed_at`, `worker_version_id`, `traffic_percentage` 100, `assets_checked` and `checks` with `reproduction`, `traffic`, `version`, `health` and `assets` all `passed` — in canonical compact form. The repository, run, tag and commit must be this run's own and the producing attempt no later than the current one. A missing, malformed, extra, private, unperformed, stale or mismatched result is refused and nothing is recorded; a failed deployment produces no result.

The accepted line is attached to the tag's published GitHub Release as `deployment-<run_id>-<run_attempt>.json`, named by the producing run attempt, and the same fields are rendered in the job summary with a link to that attempt, where the production approval is visible. An existing asset of that name must match byte for byte; a different one is refused and never replaced. A later redeploying attempt adds its own asset.

If the result is verified but the asset cannot be attached, the job reports the deployment verified and the record incomplete, and the run stays failed until the record exists. Re-running failed jobs re-runs only `record` against the retained result of the producing attempt, which adds the missing asset or matches the existing one, without another deployment or approval.

## Rollback

Rollback means deploying a previously published immutable tag, identified by its GitHub Release and deployment result, through a Release run at that tag that reproduces it. Do not move a published tag to simulate rollback. Prefer a forward correction under a new controlled change and release.

If a proposed rollback target is older than a `SEC` change in the currently deployed release line, the rollback analysis must state the security behavior or control that the older target would reinstate. The owner must explicitly accept that reinstatement before approving the production deployment; without that acceptance, correct forward instead. If data/schema compatibility prevents safe tag rollback, correct forward instead.
