# Release management

WizardGang Architecture Demo uses semantic versioning. Change IDs identify controlled changes; release tags identify reproducible product states. Not every change is tagged.

## Release rule

A release tag may exist only when checking out that exact tag reproduces the recorded state:

```text
npm ci
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
```

Release tags are annotated. Published tags are never moved or deleted during ordinary development. Historical corrections move forward under a new change ID/version unless an explicitly documented immutable-history exception already exists.

## Release record

Every `docs/releases/vX.Y.Z.md` record states the product, version, release date, commit, scope, included changes, validation, deployment, known limitations, previous release, and rollback target. Historical release/deployment records describe the state that existed at that tag and are not rewritten merely to match the current browser presentation.

## Flow

```text
isolated branch -> controlled commit -> pull request -> CI -> review -> merge to main
                -> release change -> annotated tag -> reproduce -> GitHub Release
                -> deploy exact tag -> verify /api/operations/version and /api/operations/health
                -> deployment record
```

Production identity comes from the immutable release tag and commit, not from an arbitrary `main` commit. A security or release defect is corrected forward with a new change ID and patch version.

## Tag-triggered deployment

The release workflow operates on an existing annotated semantic-version tag. Deployment checks out that exact tag, repeats required validation, applies pending D1 migrations, injects deployed version/commit identity, deploys the Worker, then verifies the public version and health machine endpoints against the released tag.

A manual recovery deployment may select an already existing semantic tag; it does not deploy an arbitrary branch head. Repository and Worker credentials remain managed secrets and are documented by their owning security/identity configuration rather than duplicated in this release policy.

### Worker secret preflight and provisioning

`config/worker-secrets.json` is the checked-in source of truth for production Worker secret names, required/optional status, consuming capability, enforced minimum length, and owner. Before production migrations, the deploy workflow runs `wrangler secret list --json` and compares names only. A missing required name fails deployment; a provisioned name not declared by the inventory is reported for reconciliation. The preflight never reads or prints a secret value, and the Cloudflare permission it adds is only the ability to list secret names. Provider-side secret APIs do not expose values or prove entropy/length, so runtime readiness remains the strength check where the application enforces one.

For application-generated random secrets, use the non-echo provisioning command instead of the interactive Wrangler prompt:

```text
npm run provision:worker-secret -- IDENTITY_AUDIT_HMAC_SECRET
```

The command generates high-entropy random material in-process and streams it directly to `wrangler secret put` on standard input. It does not print the generated value or place it on the command line. Use provider-specific provisioning for OAuth/client tokens, identifiers, certificates, and other provider-issued/operator-selected values.

Deployment also captures the live identity-provider configuration before migrations. After the Worker deploys, verification requires DEMO-296 identity readiness not to regress from ready and requires every provider that was configured before deployment to remain configured. The first deployment that introduces the DEMO-296 health field derives the pre-deployment ready baseline from configured `/auth/session` providers when the older health payload does not yet expose that field.

## Deployment record

After a release has been deployed and its post-deployment verification is complete, record that deployment in `docs/history/DEPLOYMENTS.md` as its own controlled `OPS` change. The deployment record is created after verification rather than folded into the release change, because its evidence does not exist until the release has actually run in production.

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

Rollback means deploying a previously published immutable tag identified by the release/deployment record. Do not move a published tag to simulate rollback. If data/schema compatibility prevents safe tag rollback, publish a forward correction under a new controlled change and release instead.
