# Contributing

Use small, reviewable changes. `main` is the accepted production baseline.

Project prefix: `DEMO`.

Commit pattern:

`[DEMO-001] FEAT Scaffold architecture demo routing`

Categories follow WG-ARCH-001 conventions: `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`.

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

Do not add PDF documentation to this project unless explicitly requested; architecture and operational standards are maintained in reviewable Markdown/text.
