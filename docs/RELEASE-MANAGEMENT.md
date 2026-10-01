# Release management

WizardGang Architecture Demo uses semantic versioning. Controlled change IDs identify accepted changes; annotated semantic-version tags identify immutable product states. Not every change is tagged.

## Authenticated live release

The live Git delivery controller is an explicit release operation in `/demos#webhooks`. Visitors can inspect the public read-only Actions feed; release controls use the same-origin demo-admin authentication. Before an operator confirms a start, `GET /api/labs/git-delivery?preflight=patch` (or `minor`/`major`) returns the target version, latest published release, every commit since that release, and a fingerprint of that evidence; incomplete GitHub comparison data fails closed. Start requires the matching fingerprint so a changed target or commit range must be reviewed again. The start response and workflow/PR summaries repeat that range so the operator can see all accumulated changes that the new tag would ship.

Start opens one version-metadata-only controlled `[BUILD] Demonstrate vX.Y.Z release lifecycle` PR under an unused DEMO ID. Its marker, full structured body, hyphen-only branch, unchanged queue, and package/lockfile versions are checked by PR and history validation. Merge & Release requires all four exact-head CI checks, current `main`, and ordinary squash-only protection. After the squash commit, successful CI on exact current `main` creates or verifies the annotated version tag and explicitly dispatches Release at that tag and accepted commit. The same cutter serves controlled version-only PRs delivered through GitHub without the live controller. A completed production deployment requires a separate controlled `OPS` record in `docs/history/DEPLOYMENTS.md` with the actual post-deployment evidence. Starting or merging an ordinary implementation PR at an already-published version does not trigger a new release.

## Release rule

A release may be published only when the exact tagged state reproduces successfully:

```text
npm ci
npm run check
npm run validate:migrations
npm run security:dependency-advisories
npm run build
```

During `npm run check`, Release provides one fresh temporary local D1 persistence directory to both migration validation and browser audits. It clears that directory after reproduction. The separate migration gate still runs independently.

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
                -> verify /api/operations/version and /api/operations/health
                -> deployment record
```

Production identity comes from the immutable release tag and commit, not from an arbitrary `main` commit. A security or release defect is corrected forward with a new controlled change and patch version.

## Tag-triggered deployment

The release workflow operates on an existing annotated semantic-version tag. Deployment checks out that exact tag and independently verifies that it is semantic and annotated before proceeding. Release's exact-tag dispatch passes its accepted commit and source to the reusable Deploy workflow; manual recovery still starts from the current `main` deploy workflow and can select only an already-published immutable tag.

The deploy workflow then:

- accepts only an exact requested `vMAJOR.MINOR.PATCH` tag;
- requires release-triggered runs to retain that exact tag event, while manual recovery runs must use the current `main` deploy workflow;
- proves the requested local ref is an annotated tag whose peeled commit is checked-out `HEAD` and whose version matches `package.json`;
- requires an already-published, non-draft GitHub Release for that exact tag;
- resolves the live GitHub tag ref and annotated tag object and requires their commit to equal checked-out `HEAD`;
- installs the locked dependencies and validates the reviewed tagged source;
- verifies required production Worker secret names before any migration;
- captures the live identity-provider baseline before production mutation;
- applies pending D1 migrations only after preflight checks pass;
- deploys the exact tagged Worker source with version and commit identity while capturing Wrangler's structured deployment result;
- requires Cloudflare's current deployment status to identify that exact Worker Version ID as the sole version receiving 100% of production traffic;
- verifies the public version and exact commit;
- verifies Worker health and identity readiness;
- verifies previously configured identity providers remain configured.

A manual recovery deployment may select an already published immutable semantic tag from the current `main` deploy workflow; it does not deploy an arbitrary branch head, raw SHA, lightweight tag, unpublished tag, or package/tag mismatch. The repository-level `npm run deploy` command is intentionally fail-closed so an arbitrary local checkout cannot use the package command as a production publish path. Repository and Worker credentials remain managed secrets and are documented by their owning security/identity configuration rather than duplicated in release prose.

### Worker secret preflight and provisioning

`config/worker-secrets.json` is the checked-in source of truth for production Worker secret names, required/optional status, consuming capability, enforced minimum length, and owner. Before production migrations, the deploy workflow runs `wrangler secret list --format json` and compares names only. A missing required name fails deployment; a provisioned name not declared by the inventory is reported for reconciliation. The preflight never reads or prints a secret value, and the Cloudflare permission it adds is only the ability to list secret names. Provider-side secret APIs do not expose values or prove entropy/length, so runtime readiness remains the strength check where the application enforces one.

For application-generated random secrets, use the non-echo provisioning command instead of the interactive Wrangler prompt:

```text
npm run provision:worker-secret -- IDENTITY_AUDIT_HMAC_SECRET
```

The command generates high-entropy random material in-process and streams it directly to `wrangler secret put` on standard input. It does not print the generated value or place it on the command line. Use provider-specific provisioning for OAuth/client tokens, identifiers, certificates, and other provider-issued/operator-selected values.

Deployment captures the live identity-provider configuration before migrations. After the Worker deploys, verification requires the current identity-readiness signal not to regress from ready and requires every provider configured before deployment to remain configured.

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
