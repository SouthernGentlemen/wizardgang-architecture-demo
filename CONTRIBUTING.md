# Contributing

Use small, reviewable changes. `main` is the accepted production baseline.

Project prefix: `DEMO`.

Commit pattern:

`[DEMO-NNN] [TYPE] Imperative summary`

Primary types follow WG-ARCH-001 conventions: `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, `CHORE`. One controlled change has one permanent ID and one primary type.

Use an isolated branch named for its controlled change, such as `demo-NNN-imperative-summary`. A pull-request title follows the same controlled-title format. See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md).

Implementation plans and roadmap documents may be used to coordinate substantial, stacked, or multi-step work. Keep them scoped to the active effort, keep them current while they are authoritative, and retire or delete them when they become obsolete so stale planning does not compete with current contracts.

Each architecture demo change must:

1. Preserve or intentionally retire/version the stable route under the route contract.
2. Keep a clear primary implementation module under `src/demos/` or a directly owned submodule.
3. Keep application route declarations, `docs/ROUTES.md`, and `docs/route-manifest.json` consistent.
4. Link the running page back to public source, schema/contracts, and tests where relevant.
5. Include tests for public routes and demo-specific backend behavior.
6. Use `DEMO_DB` / `demo-blob` for shared records/audit metadata unless another primitive is specifically being demonstrated.
7. Use R2 for real objects and Durable Objects for real coordination; do not fake those primitives with D1.
8. Preserve operational machine contracts, scheduled availability/retention, hidden admin/offline boundaries, and the compact homepage proof without recreating a public `/operations` dashboard.
9. Avoid secrets, real billing/account data, credential-bearing logs, and private infrastructure metadata.
10. Preserve WCAG/i18n readiness and accurately qualify ISO/WCAG alignment claims as uncertified.
11. Update permanent architecture/operations documentation when the contract changes.

## Assurance editing workflow

Canonical assurance JSON is the authority for compliance status, applicability, rationale, gaps, lifecycle, and evidence relationships. `assurance/registry.json` inventories every canonical structured resource, including non-runtime document metadata used to project governance Markdown. Governing Markdown is authoritative for human-readable policy/process text and reciprocal documentation traceability, but it is never a status store.

For ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 compliance records:

1. Edit assessment state only in the registered canonical JSON record. Use only `pass`, `partial`, `gap`, or `not-applicable`; do not infer a status from document wording.
2. Keep `rationale` and `gaps` in structured data and satisfy the current registered schema and validation rules for the record status.
3. Add governing-document traceability with a `documentation` relationship targeting `github.repository-markdown`; the native target is a repository-relative `.md` path followed by a GitHub heading anchor. Do not replace or repurpose an `evidence` relationship.
4. In each non-dated governing document referenced by a compliance record, maintain an Alignment section with a `Controls:` line naming the canonical record IDs documented there. Every named record must link back to that document. Release records, SoAs, and assessment/evaluation reports are dated-record exemptions.
5. Run `npm run validate:assurance-documentation`. It validates file existence, heading anchors, and reciprocal `Controls:` mappings only; it never reads prose to derive or validate compliance status.
6. Run `npm run generate:assurance-summaries` after structured assurance changes, then `npm run validate:assurance-summaries` or the full `npm run check`.
7. Refresh lifecycle source approval for each changed public structured dataset so publication remains bound to the exact Git blob revision.

For the security risk register, AI risk register, incident/exercise register, and generated ISO SoAs, continue editing record state only in the canonical registered JSON. Edit presentation-document ownership, review cadence, approval method, or identity in `assurance/presentation/documents.json` when those fields are not already owned by the record dataset. Keep authored Markdown outside generated markers limited to narrative such as purpose, methodology, interpretation, governance process, Alignment metadata, and control documentation; do not duplicate structured status or counts.

The ISO SoA Markdown files are fully generated. Risk and incident/exercise Markdown preserves narrative around explicitly delimited generated sections. Generated Markdown never becomes input to runtime code, APIs, dashboards, or status/applicability assessment. The documentation validator may inspect Markdown headings and `Controls:` lines for structural traceability only; dated generated SoAs are exempt from reciprocal `Controls:` metadata.

Reportable rows in the asset/access, competence/awareness, configuration, cryptography/secrets, data/retention, obligations, recovery-test, security-maintenance, security-testing, and supplier registers are owned by registry-declared `assurance/governance/*.json` partitions. Edit those JSON records, then run `npm run generate:governance-registers`. Rating rules, templates, trigger matrices, policy prose, rationale, and professional judgment remain authored in Markdown outside deterministic governance markers.

Before opening a pull request, run:

```text
npm ci
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
git diff --check
```

CI repeats these checks and validates controlled history and the pull-request title. When CI fails, follow the mandatory full-job-log troubleshooting sequence in [`AGENTS.md`](AGENTS.md); status and check summaries are not substitutes for the complete failing GitHub Actions job log. Delivery evidence remains in GitHub's native workflow runs, attempts, and artifacts and is queried through the canonical reporting layer. Never edit an applied migration; add the next numbered migration. Releases and production deployment follow [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md).

Do not add PDF documentation unless explicitly requested; architecture and operational standards are maintained in reviewable Markdown/text.
