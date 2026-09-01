# Release and deployment evidence

`main` is the accepted production baseline. Production changes follow this evidence path:

```text
branch -> DEMO commit(s) -> pull request -> CI -> review -> merge
       -> semantic version tag -> GitHub Release -> tagged deployment
       -> smoke check -> operational observation
```

Pushing an annotated semantic tag runs the release workflow. It reproduces the tagged state, publishes the matching record from `docs/releases/`, and calls the deployment workflow with that exact tag. The deploy workflow also accepts a manually selected existing semantic tag for recovery. It checks out the tag, runs the full validation suite, applies D1 migrations, injects `DEPLOYED_VERSION` and `DEPLOYED_SHA`, deploys the Worker, and verifies `/version` and `/health`.

Required managed repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Required Cloudflare-managed Worker secrets:

- `DEMO_ADMIN_USER`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_API_TOKEN`
- `WEBHOOK_DEMO_SECRET`
- `DEMO_SESSION_SECRET`
- `GITHUB_WEBHOOK_SECRET`

Optional Worker secret:

- `GITHUB_READ_TOKEN` — enables evidence that GitHub does not expose anonymously, such as private branch-protection details; the public evidence dashboard remains functional without it and reports unverifiable controls honestly.

The first public release should be tagged only after the intended GitHub repository exists, Cloudflare resource identifiers replace local placeholders, migrations apply, and the custom domain resolves. Do not describe an untagged or unverified deployment as a released production baseline. The controlled change model is in [`CHANGE-MANAGEMENT.md`](CHANGE-MANAGEMENT.md); the release record and rollback requirements are in [`RELEASE-MANAGEMENT.md`](RELEASE-MANAGEMENT.md).
