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

The controlled public assurance data layer lives under `assurance/` and is described in `docs/ASSURANCE.md`. It assigns stable identifiers to disclosure-safe evidence and derives counts, claim/risk/incident/exercise/advisory-to-evidence relationships, and reverse `usedBy` relationships without duplicating URLs or counts in canonical JSON. Registry-declared `governance.records` partitions own reportable register facts; narrative governance records remain authoritative for policy, method, rationale, and professional judgment.

`GET /api/reporting` is the canonical public collection index and `GET /api/reporting/evidence` exposes the exhaustive published evidence collection. Stable records retain exact machine lookup URLs. Repository locators resolve only against the exact deployed commit identified by `DEPLOYED_SHA`; when that identity is unavailable, the projection reports `not-supplied` rather than falling back to `main`. Route evidence resolves against the current request origin.

Freshness is explicit rather than implied: `release-bound` evidence changes with a deployed release/commit, `event-driven` evidence changes when its controlled governance or release event is published, and `observation-bound` evidence is current only for the time of the observation.

`/assurance` is a focused verification front door across those sources. Its four checks cover security controls, the AI/MCP boundary, traceability, and accessibility posture at `/assurance#security-controls`, `/assurance#ai-boundary`, `/assurance#traceability`, and `/assurance#accessibility-posture`. The checks link to exact reporting records and detailed demonstrations where useful; they do not reproduce the full management-system inventory or turn alignment into a certification claim.

The reporting API remains the exhaustive structured assurance surface. The former Assurance inventory fragments, its child pages, and the older top-level assurance HTML paths are intentionally unregistered and return the ordinary 404 without redirects. `/security` remains separate for private vulnerability reporting, published advisories, and the contextual handoff to public issue forms for non-sensitive feedback.

Do not reconstruct evidence after the fact when the engineering workflow can create it automatically.

The traceability API reports missing `DEPLOYED_VERSION` / `DEPLOYED_SHA` as `not-supplied`; it never invents a release. CI and assurance-monitor evidence remains in GitHub's native workflow runs, attempts, and artifacts and is queried through the canonical reporting contract without a report-copy branch. Tagged deployment separately injects the version and SHA, then verifies the public `/api/operations/version` and `/api/operations/health` surfaces.
