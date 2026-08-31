# Release and deployment evidence

`main` is the accepted production baseline. Production changes follow this evidence path:

```text
branch -> DEMO commit(s) -> pull request -> CI -> review -> merge
       -> semantic version tag -> GitHub Release -> tagged deployment
       -> smoke check -> operational observation
```

The deploy workflow accepts published GitHub Releases and manually selected semantic tags. It checks out the tag or release commit, runs the full validation suite, applies D1 migrations, injects `DEPLOYED_VERSION` and `DEPLOYED_SHA`, deploys the Worker, and verifies `/version` and `/health`.

Required managed repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Required Cloudflare-managed Worker secrets:

- `DEMO_ADMIN_USER`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_API_TOKEN`
- `WEBHOOK_DEMO_SECRET`

The first public release should be tagged only after the intended GitHub repository exists, Cloudflare resource identifiers replace local placeholders, migrations apply, and the custom domain resolves. Do not describe an untagged or unverified deployment as a released production baseline.
