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

## Rollback

Rollback means deploying a previously published immutable tag identified by the release/deployment record. Do not move a published tag to simulate rollback. If data/schema compatibility prevents safe tag rollback, publish a forward correction under a new controlled change and release instead.
