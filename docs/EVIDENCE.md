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

The controlled public assurance data layer lives under `assurance/` and is described in `docs/ASSURANCE.md`. It assigns stable identifiers to disclosure-safe evidence and derives counts, claim/risk/incident/exercise-to-evidence relationships, and reverse `usedBy` relationships without duplicating URLs or counts in canonical JSON. Narrative governance records remain authoritative for policy and method; the registry is authoritative for the public machine-readable projection.

`/evidence` is the canonical searchable human evidence surface. `GET /v1/assurance` exposes the complete public assurance projection and `GET /v1/assurance/evidence` exposes the evidence-only projection. Repository locators resolve only against the exact deployed commit identified by `DEPLOYED_SHA`; when that identity is unavailable, the projection reports `not-supplied` rather than falling back to `main`. Route evidence resolves against the current request origin.

Freshness is explicit rather than implied: `release-bound` evidence changes with a deployed release/commit, `event-driven` evidence changes when its controlled governance or release event is published, and `observation-bound` evidence is current only for the time of the observation.

`/compliance` remains the assurance posture front door across those sources and links into `/evidence` for record-level inspection. It states the WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 posture as aligned or supported and uncertified, then links to the canonical working evidence at `/accessibility`, `/i18n`, `/governance`, `/mcp`, `/git`, and `/dashboard/*`. It does not reproduce their explanations or turn alignment into a certification claim.

Do not reconstruct evidence after the fact when the engineering workflow can create it automatically.

The traceability API reports missing `DEPLOYED_VERSION` / `DEPLOYED_SHA` as `not-supplied`; it never invents a release. CI generates `artifacts/evidence/validation.json` for the exact tested commit and uploads it as a GitHub Actions artifact. Tagged deployment injects the version and SHA, then verifies the public `/version` and `/health` surfaces.
