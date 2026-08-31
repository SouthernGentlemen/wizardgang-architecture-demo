# Evidence map

The demo should let a reviewer move from a visible claim to the records that support it.

```text
Architecture requirement
-> route/source
-> issue/work item
-> branch/commit
-> pull request/review
-> automated validation
-> tag/release
-> Cloudflare deployment
-> operational observation
-> D1/R2 evidence where applicable
```

Primary sources:

- Git/GitHub: requirements, changes, review, tags, releases, Actions/test evidence;
- Cloudflare: deployment/runtime/edge configuration and operational behavior;
- D1: audit events, relational demo records, health observations, synthetic usage snapshots, demo control state;
- R2: actual demo objects/artifacts plus D1 references;
- application UI: accessibility/i18n behavior, AI evaluations/fallback demonstrations, operational views.

Do not reconstruct evidence after the fact when the engineering workflow can create it automatically.

The traceability API reports missing `DEPLOYED_VERSION` / `DEPLOYED_SHA` as `not-supplied`; it never invents a release. CI generates `artifacts/evidence/validation.json` for the exact tested commit and uploads it as a GitHub Actions artifact. Tagged deployment injects the version and SHA, then verifies the public `/version` and `/health` surfaces.
