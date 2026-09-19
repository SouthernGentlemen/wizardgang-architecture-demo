# Contributing

Use small, reviewable changes. `main` is the accepted production baseline.

Project prefix: `DEMO`.

Commit pattern:

`[DEMO-NNN] [TYPE] Imperative summary`

Primary types follow WG-ARCH-001 conventions: `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, `CHORE`. One controlled change has one permanent ID and one primary type.

Use an isolated branch named for its controlled change, such as `demo-NNN-imperative-summary`. A pull-request title follows the same controlled-title format. See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md).

Temporary implementation plans may coordinate active stacked or multi-step work, but they are not permanent architecture or policy. Remove them when they stop governing active work.

## Toolchain and dependency installation

Use Node.js 26.7.0 from `.node-version` and npm 11.19.0 from `packageManager`. The supported engine ranges are Node.js `26.x` and npm `11.x`, and `.npmrc` keeps `engine-strict=true` so unsupported toolchains fail before installation.

Dependency install scripts are denied unless the root `package.json` `allowScripts` policy approves the reviewed package and version. Before changing dependencies, run `npm install-scripts ls`, review each reported lifecycle script, and add only build-required approvals pinned to the installed version. Remove stale approvals with `npm install-scripts prune` after dependency removal or upgrade. Commit the policy and lockfile together so local `npm ci` and CI execute the same reviewed scripts.

## Architecture and runtime changes

Each architecture demo change must:

1. Preserve or deliberately change stable route behavior under the route contract.
2. Keep the primary implementation in the owning source module.
3. Update application route declarations and run `npm run generate:routes` when route metadata changes; `docs/route-manifest.json` is the generated machine projection.
4. Keep executable interface contracts and source links synchronized with the implementation.
5. Add or update tests for affected public routes, protocol behavior, authorization, and backend behavior.
6. Use `DEMO_DB` / `demo-blob` for shared relational state unless another primitive is the feature being demonstrated.
7. Use R2 for object storage and Durable Objects for coordinated state; do not emulate them with D1.
8. Preserve operational machine contracts, scheduled availability/retention, protected admin/offline boundaries, and the compact homepage operational proof.
9. Avoid secrets, private account data, credential-bearing logs, and unreviewed infrastructure metadata.
10. Preserve accessibility and localization behavior and qualify ISO/WCAG statements as alignment evidence, not certification.
11. Update only the current architecture, policy, or procedure documentation whose contract actually changed.

## Assurance and governance editing

Structured assurance data is authoritative for current status, applicability, rationale, gaps, lifecycle, evidence relationships, risks, incidents, objectives, and governed record rows. Human-readable Markdown explains current policy, process, responsibilities, and control intent; it is not a duplicate status store.

For ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 records:

1. Edit assessment state in the registered canonical JSON resource under `assurance/**`. Use only `pass`, `partial`, `gap`, or `not-applicable`.
2. Keep `rationale`, `gaps`, and evidence relationships in structured data.
3. Use a `documentation` relationship to a tracked current Markdown heading when a record needs human-readable policy/process traceability.
4. Maintain the reciprocal `Alignment` / `Controls:` mapping required by `npm run validate:assurance-documentation`.
5. Refresh lifecycle source approval for each changed published structured dataset so publication remains bound to its exact Git blob revision.
6. Run `npm run validate:assurance` after assurance changes.

For governance records, edit the registered structured resources under `assurance/governance/**`, `assurance/risks/**`, `assurance/incidents/**`, `assurance/objectives/**`, and other registry-declared datasets. Use `assurance/presentation/documents.json` only for presentation metadata it actually owns. Do not recreate Markdown registers, SoAs, assessment archives, or generated summary documents as parallel sources of truth.

## Validation

Before opening a pull request, run:

```text
npm ci
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
git diff --check
```

CI repeats the repository checks and validates controlled history and the pull-request title. When CI fails, follow the full-job-log troubleshooting sequence in [`AGENTS.md`](AGENTS.md). Never edit an applied migration; add the next numbered migration. Releases and production deployment follow [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md).

Keep architecture and operational documentation in reviewable Markdown/text. Do not add PDF documentation unless explicitly requested.
