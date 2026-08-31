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

Release tags are annotated. Published tags are never moved or deleted during ordinary development. The one-time pre-v0.2 history correction is recorded in `docs/history/CHANGE-MAP.csv`; future corrections move forward under a new change ID and version.

## Release record

Every `docs/releases/vX.Y.Z.md` record states the product, version, release date, commit, scope, included changes, validation, deployment, known limitations, previous release, and rollback target.

## Flow

```text
isolated branch -> controlled commits -> pull request -> CI -> review -> merge to main
                -> release change -> annotated tag -> reproduce -> GitHub Release
                -> deploy exact tag -> verify /version and /health -> deployment record
```

Production identity comes from the immutable release tag and commit, not from an arbitrary `main` commit. A security or release defect is corrected forward with a new change ID and patch version.
