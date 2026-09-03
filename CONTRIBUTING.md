# Contributing

Use small, reviewable changes. `main` is the accepted production baseline.

Project prefix: `DEMO`.

Commit pattern:

`[DEMO-NNN] [TYPE] Imperative summary`

Primary types follow WG-ARCH-001 conventions: `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, `CHORE`. One controlled change has one permanent ID and one primary type.

Use an isolated branch named for its first controlled change, such as `demo-NNN-imperative-summary`. A pull-request title follows the same controlled-title format. See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md).

Each architecture demo change must:

1. Preserve or intentionally version the stable route.
2. Keep a clear primary implementation module under `src/demos/` or a directly owned submodule.
3. Keep `src/demos/registry.ts`, `docs/ROUTES.md`, and `docs/route-manifest.json` consistent.
4. Link the running page back to its public GitHub source, schema/contracts, and tests where relevant.
5. Include tests for public routes and demo-specific backend behavior.
6. Use `DEMO_DB` / `demo-blob` for shared records/audit metadata unless another primitive is specifically being demonstrated.
7. Use R2 for real objects and Durable Objects for real coordination; do not fake those primitives with D1.
8. Preserve admin/offline routing invariants and public operations visibility.
9. Avoid secrets, real billing/account data, credential-bearing logs, and private infrastructure metadata.
10. Preserve WCAG/i18n readiness and accurately qualify ISO/WCAG alignment claims as uncertified.
11. Update the architecture/operations documentation when behavior changes.

## Assurance editing workflow

Canonical assurance JSON is the only authority for assurance record state. `assurance/registry.json` inventories every canonical structured resource, including the non-runtime document metadata used to project governance Markdown.

For the security risk register, AI risk register, incident/exercise register, and ISO 27001/42001 SoAs:

1. Edit record state only in the canonical JSON dataset registered for that resource.
2. Edit document ownership, review cadence, approval method, or presentation-document identity in `assurance/presentation/documents.json` when those fields are not already owned by the record dataset.
3. Keep manually authored Markdown outside generated markers limited to narrative such as purpose, methodology, interpretation, and governance process. Do not restate status, applicability, rationale, evidence, ownership, lifecycle/review state, or counts there.
4. Run `npm run generate:assurance-summaries` to refresh deterministic Markdown projections.
5. Run `npm run validate:assurance-summaries` or the full `npm run check` before review. Check mode rejects stale or independently edited generated presentation.

The ISO SoA Markdown files are fully generated. Risk and incident/exercise Markdown preserves narrative around explicitly delimited generated sections. Generated Markdown must never become an input to runtime code, APIs, dashboards, or assurance-state validators.

Before opening a pull request, run:

```text
npm ci
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
```

CI repeats these checks, validates the controlled history and pull-request title, and uploads commit-bound validation evidence. Never edit an applied migration; add the next numbered migration. Releases and production deployment follow [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md) and [`docs/RELEASE.md`](docs/RELEASE.md).

Do not add PDF documentation to this project unless explicitly requested; architecture and operational standards are maintained in reviewable Markdown/text.
