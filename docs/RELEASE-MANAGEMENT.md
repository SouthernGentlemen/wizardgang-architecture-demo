# Release management

WizardGang Architecture Demo uses semantic versioning. Controlled change IDs identify accepted changes; annotated semantic-version tags identify immutable product states. Not every change is tagged.

## Authenticated live release

The live Git delivery controller is an explicit release operation in `/demos#webhooks`. Visitors can inspect the public read-only Actions feed at `/api/labs/git-delivery`; every release control is under `/admin/*` and therefore crosses the shared `WG_OPS_TOKEN` shell gate. Before an operator confirms a start, `GET /admin/api/labs/git-delivery?preflight=patch` (or `minor`/`major`) returns the target version, latest published release, every commit since that release, and a fingerprint of that evidence; incomplete GitHub comparison data fails closed. Start requires the matching fingerprint so a changed target or commit range must be reviewed again. The start response and workflow/PR summaries repeat that range so the operator can see all accumulated changes that the new tag would ship.

Start re-reads the shared accepted/queued/open reservations before branching and publication, recomputing only unpublished collisions. One controlled record carries the request correlation and release range through commit, PR and explicit squash. The live controller uses the ordinary protected delivery adapter, including mutable title/body, current-base/head, canonical CI, every active required check and mergeability re-reads; merged identity and queue preservation are verified against the validated head.

Start opens one version-metadata-only controlled `[BUILD] Demonstrate vX.Y.Z release lifecycle` PR under an unused DEMO ID. Its marker, full structured body, hyphen-only branch, unchanged queue, and package/lockfile versions are checked by PR and history validation. Merge & Release requires both exact-head CI jobs, current `main`, and ordinary squash-only protection. After the squash commit, successful CI on exact current `main` creates or verifies the annotated version tag and explicitly dispatches Release at that tag and accepted commit. The same cutter serves controlled version-only PRs delivered through GitHub without the live controller. A completed production deployment requires a separate controlled `OPS` record in `docs/history/DEPLOYMENTS.md` with the actual post-deployment evidence. Starting or merging an ordinary implementation PR at an already-published version does not trigger a new release.

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
9. deploy only after release reproduction and publication succeed.

Historical release notes are read from GitHub Releases. Superseded repository state remains reconstructable from the corresponding annotated tag and Git history.

## Flow

```text
isolated branch -> controlled commit -> pull request -> CI -> review -> merge to main
                -> annotated semantic tag -> reproduce exact tag
                -> GitHub Release + assurance snapshot
                -> deploy exact tag -> verify Cloudflare Worker version / 100% traffic
                -> verify /version.json and Worker health
                -> deployment record
```

Production identity comes from the immutable release tag and commit, not from an arbitrary `main` commit. A security or release defect is corrected forward with a new controlled change and patch version.

## Tag-triggered deployment

The release workflow operates on an existing annotated semantic-version tag. After publication it calls baseline's `deploy-worker.yml` reusable workflow at the exact commit pinned by `platform/vendor.lock.json`, passing Worker `demo`, the exact tag and the accepted commit. Manual recovery uses that same baseline deployment path at an already-published immutable tag; this repository has no second production deploy workflow.

The baseline deploy workflow then:

- accepts only an exact requested `vMAJOR.MINOR.PATCH` tag;
- proves the requested local ref is an annotated tag whose peeled commit is checked-out `HEAD` and whose version matches `package.json`;
- requires an already-published, non-draft GitHub Release for that exact tag;
- resolves the live GitHub tag ref and annotated tag object and requires their commit to equal checked-out `HEAD`;
- installs the locked dependencies and validates the reviewed tagged source;
- builds the exact tagged Worker source with `WG_VERSION` and `WG_COMMIT`, deploys the conforming `demo` Worker with provisioning disabled, and captures Wrangler's deployment result;
- requires Cloudflare's current deployment status to identify the new Worker version as the sole version receiving 100% of production traffic;
- polls `https://demo.wizardgang.ai/version.json` until it identifies app `demo`, the exact version and the exact commit.

Tagged-source validation in the protected deploy job uses a fresh temporary local D1 persistence directory for both migration validation and browser audits during `npm run check`. The directory is removed before the production deploy step.

A manual recovery deployment may select an already published immutable semantic tag through the baseline reusable deployment path; it does not deploy an arbitrary branch head, raw SHA, lightweight tag, unpublished tag, or package/tag mismatch. The repository-level `npm run deploy` command is intentionally fail-closed so an arbitrary local checkout cannot use the package command as a production publish path. Repository and Worker credentials remain managed secrets and are documented by their owning security/identity configuration rather than duplicated in release prose.

### Worker secret provisioning

`config/worker-secrets.json` remains the checked-in source of truth for the demo's seven Worker secret names. Their values are provisioned and rotated with the baseline secrets runbook, while the shared shell receives `WG_OPS_TOKEN` and `WG_SESSION_KEY` from the account Secrets Store. The baseline deployment workflow does not print or move secret values; it deploys the already-provisioned bindings declared by the reviewed Worker configuration.

## Deployment record

After a release has been deployed and its post-deployment verification is complete, record that deployment in `docs/history/DEPLOYMENTS.md` as its own controlled `OPS` change. The deployment record is created after verification because its evidence does not exist until the release has actually run in production.

Each deployment record carries:

- **Product:** the deployed product.
- **Release:** the immutable annotated semantic-version tag.
- **Commit:** the commit identified by that tag.
- **Environment:** the deployment target.
- **Date:** the deployment date.
- **URL:** the production endpoint.
- **Changes:** the controlled-change range included in the release.
- **Validation:** only the release, deployment, migration, and post-deployment checks that actually occurred; include the relevant workflow run when available and do not infer missing verification.
- **Previous:** the previously deployed release.
- **Rollback:** the immutable rollback tag or the reason no rollback target exists.
- **Note:** optional operator context needed to interpret the record without rewriting historical evidence.

Do not edit an existing deployment record to claim checks that were not recorded when that deployment occurred. Historical gaps may be summarized retrospectively from immutable tag and GitHub Actions evidence, but must be labeled retrospective and must state when no further post-deployment verification was recorded.

## Rollback

Rollback means deploying a previously published immutable tag identified by GitHub Release/deployment evidence. Do not move a published tag to simulate rollback. Prefer a forward correction under a new controlled change and release.

If a proposed rollback target is older than a `SEC` change in the currently deployed release line, the rollback analysis must state the security behavior or control that the older target would reinstate. The deployment record must capture the owner's explicit acceptance of that reinstatement; without that acceptance, correct forward instead. If data/schema compatibility prevents safe tag rollback, correct forward instead.
