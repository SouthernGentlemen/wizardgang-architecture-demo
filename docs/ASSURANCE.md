# Assurance architecture

The `assurance/**` tree owns current structured assurance state. It is the canonical disclosure-safe source for assurance claims, compliance records, objectives, risks, incidents, exercises, evidence, governance records, lifecycle metadata, and published advisories. Human presentation, APIs, generated runtime bindings, and exports project that structured state; they are not independent assurance authorities.

## Registry and schemas

`assurance/registry.json` is the authoritative inventory for assurance resources. Registered resources declare stable identities, paths, schemas, roles, visibility, capabilities, query/filter metadata, reporting participation, and lifecycle/runtime participation. Logical families may include multiple resources or partitions without introducing another registry.

Schemas under `contracts/assurance/**` define the structural boundary for registered assurance data. Registry validation rejects duplicate identities and paths, missing files or schemas, unregistered canonical assurance JSON, unsupported or unresolved schema references, and schema-invalid records.

Node tooling discovers controlled resources through `scripts/lib/assurance-registry.mjs`. Worker code uses the generated registry binding rather than dynamic filesystem discovery. `scripts/generate-assurance-runtime-binding.mjs` emits `src/assurance/generated/registry-bindings.ts` and the lifecycle baseline membership artifact from registry-declared runtime resources, and validation requires those generated artifacts to match current structured sources and reachable schema dependencies.

## Runtime binding and canonical record discovery

`src/assurance/model.ts` binds registry-declared runtime record resources into shared indexes. `src/assurance/service.ts` owns canonical record discovery, listing, exact-ID lookup, stable anchors, URL resolution, counts, filters, and relationship traversal.

Every runtime resource that declares the `records` capability participates in canonical record discovery. Runtime discoverability does not create a browser route or HTTP endpoint by itself.

Canonical relationship-bearing records store one normalized `relationships` edge array. Shared services derive reverse relationships instead of duplicating them in source JSON. Canonical IDs are globally unique across registered runtime record families.

Framework-specific normalization remains domain-owned before records enter the shared indexes. Compliance records retain normalized framework identity, reference/section ordering, and source metadata while using the common record and relationship services.

## Lifecycle control plane and publication

`assurance/lifecycle/records.json` is the lifecycle control plane for stable assurance IDs. It is registry-owned control-plane data, not another record collection. Exactly one registered resource owns the lifecycle capability, and publication/runtime validation resolve that owner through the registry.

Lifecycle values are `Draft`, `Approved`, `Published`, `Superseded`, and `Withdrawn`. Stable IDs are not recycled. Supersession and withdrawal require explicit metadata, and retained tombstones prevent retired identities from reappearing as current records.

Source approval is revision-bound. When a canonical structured source changes, its Git blob identity changes; publication validation requires the exact reviewed source revision before revised content is published. Baseline lifecycle inheritance is allowed only for identities proven to exist in the immutable baseline membership artifact. Unknown current IDs without explicit lifecycle metadata fail closed.

Lifecycle and disclosure are separate. Publication logic in `src/assurance/publication.ts` applies lifecycle and disclosure review without weakening field-level disclosure rules. Credentials, private treatment detail, reporter identity, exploit detail, unreleased vulnerability detail, and other prohibited public fields remain excluded independently of lifecycle state.

## Risk, compliance, and documentation relationships

Canonical risks store scores rather than duplicated rating labels. Shared risk derivation produces current inherent and residual ratings for runtime consumers.

Compliance is registry-driven across ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 resources and partitions. Current compliance status, rationale, gaps, applicability, evidence relationships, and documentation relationships live only in canonical structured assurance records.

A compliance record may carry a `documentation` relationship to `github.repository-markdown` with a current governing Markdown procedure and heading anchor. Presentation resolves repository documentation against the exact deployed revision. The documentation validator checks file existence, heading anchors, and reciprocal `Controls:` alignment where required; it does not infer compliance state from Markdown.

Stable presentation identities for governance registers, objectives, and Statements of Applicability are maintained in `assurance/presentation/documents.json` and resolve to canonical datasets under `assurance/**`. Human-readable browser views are projections of structured records; there are no checked-in generated register or SoA Markdown authorities.

## Evidence, freshness, and provenance

Evidence records keep canonical locators and relationships, not branch-relative presentation URLs. Repository locators are resolved against the exact deployed commit identified by deployment provenance. When the deployed revision is unavailable, presentation reports that provenance as unavailable rather than substituting a branch such as `main`.

Freshness policy, lifecycle state, and deployment provenance are separate concepts. `src/assurance/observation-window.js` is the shared authority for stored observation-window evaluation in runtime presentation and Node validation.

A stored observation window is the half-open interval `[observedAt, validUntil)`:

- before `observedAt`: `not-yet-observed`;
- at or after `observedAt` and before `validUntil`: `current`;
- at or after `validUntil`: `expired`.

When either boundary is present, both must be valid date-times and `validUntil` must be strictly later than `observedAt`. Missing windows are preserved for evidence whose freshness policy requires live observation rather than a stored validity interval.

Freshness categories remain explicit: release-bound evidence changes with the deployed release/revision, event-driven evidence changes when its controlled event is published, and observation-bound evidence is current only for its validated observation period.

## Browser and HTTP boundaries

`/assurance` is the single public assurance browser task. It is a presentation workbench over canonical assurance/reporting data, not a second assurance inventory.

Published assessment record IDs are stable fragments within `/assurance`. `GET /api/assurance/{record}` is the focused HTML presentation-fragment boundary used to render one published assurance record pane. It is not the structured reporting API and it does not create another canonical record store.

The exhaustive structured HTTP boundary is `/api/reporting`. Reporting discovery, collection queries, exact reads, exports, provider-backed updates, cursor handling, disclosure, and response policy are defined in `docs/REPORTING.md`. Structured assurance collections remain repository-governed and read-only through reporting.

`/security` remains the separate support/security presentation boundary for vulnerability reporting and published advisories.

## Validation responsibilities

`npm run validate:assurance` and the broader `npm run check` suite enforce registry completeness, schema validation, generated runtime binding parity, lifecycle ownership, exact source-revision approval, immutable identity, canonical-ID uniqueness, referential integrity, normalized relationships, publication/disclosure rules, risk derivation, filter contracts, documentation relationships, evidence freshness, observation windows, provenance handling, presentation metadata, runtime discovery, and assurance operational controls.

`npm run validate:contracts` verifies the reporting/OpenAPI contract relationship. `npm run validate:generated-artifacts` verifies generated assurance/runtime artifacts remain current. Tests exercise canonical discovery, exact-ID lookup, relationships, publication decisions, freshness boundaries, provider/reporting projections, and the assurance presentation fragment without creating another source of truth.
