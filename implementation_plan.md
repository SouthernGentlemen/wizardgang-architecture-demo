# Implementation plan

## Open tasks

### DEMO-393 — [I18N] Localize the demos workbench and isolate bidi values

- Dependency: DEMO-392 has merged.
- Why: `localization.exact()` silently returns English for any string without a presentation-catalog entry, so `/demos?lang=ar` is mostly English with misplaced punctuation (".happened"), category tabs mix Arabic and English, and ratios reverse in RTL (3 of 10 users renders as "10 / 3"). `docs/INTERNATIONALIZATION.md` forbids broad English-text exemptions, but no validator detects the fallback.
- Scope: Catalog every user-facing workbench and demo string rendered through `exact()` for all six locales, keeping canonical technical tokens on the narrow allowlist; make site i18n validation fail when a non-default locale renders uncatalogued English; isolate counters, ratios, sizes, paths and identifiers with `bdi` or `dir="ltr"` so RTL keeps their order.
- Non-goals: Do not add locales, claim professional translation quality or change locale resolution. Translate only strings that remain after the preceding UX tasks.
- Acceptance: `/demos`, `/assurance` and every released fragment in `es`, `fr`, `de`, `ja` and `ar` render no uncatalogued English beyond allowlisted tokens; ratios and counters keep their order in `ar`; the new validator fails on an injected uncatalogued string; existing locale validators pass.
- Validation: Pinned `npm ci`; `npm run validate:locales` and `npm run validate:site-i18n` with the fallback detector; runtime tests; browser audit in `ar`; credential-free `npm run check`; dependency advisory gate; committed-range whitespace; exact-head required CI.
- Authorities: `docs/INTERNATIONALIZATION.md`, `config/i18n.json`, `src/i18n/runtime.ts`, `src/i18n/presentation.json`, `src/i18n/locales/`, `scripts/validate-locales.mjs`, `tests/site-accessibility-i18n.test.ts`.

### DEMO-395 — [OPS] Cut exact-tag releases from validated main delivery

- Dependency: DEMO-391 through DEMO-393 have merged, and the live Git delivery path is reconciled with controlled release identity.
- Why: Chat-driven controlled PR delivery should be able to publish an intentionally prepared version without a local tag push. A tag created with the workflow token does not trigger another workflow, while this repository's Release and protected Deploy paths require the exact tag event and identity.
- Scope: On successful CI for a push to exact current `main`, create or verify an annotated semantic tag only when `package.json` names a version not already released. Explicitly dispatch Release at that exact tag and accepted commit, adapt Release and Deploy guards to distinguish an authorized exact-tag dispatch from a manual recovery run, and keep the release-bound assurance snapshot, GitHub Release, protected production approval, Worker secret preflight, migration and health verification. Integrate with the DEMO-391 live Git delivery path without duplicate tags or duplicate publication. Keep `0.28.0` and its published tag unchanged; a later controlled version change is the first eligible new release.
- Non-goals: Do not create a tag or Release, deploy production, move a published tag, change version or secrets, bypass production approval, or weaken main and tag rules as part of this task.
- Acceptance: Pure tests prove a stale or failed CI run cannot cut a tag; an existing version tag is never moved; a new version is annotated at the accepted main commit and explicitly dispatches the exact-tag Release; Release/Deploy reject mismatched tag or commit, preserve the human production gate, and remain retry-safe. The implementation merge at unchanged `0.28.0` performs no publication or deployment.
- Validation: Pinned `npm ci`; workflow and release/deploy guard tests; workflow YAML validation; credential-free `npm run check`; dependency advisory gate; committed-range whitespace; exact-head required CI; read-only live settings verification; postmerge CI and no-op cutter evidence.
- Authorities: `AGENTS.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`, `.github/workflows/ci.yml`, `.github/workflows/git-demo.yml`, `.github/workflows/release.yml`, `.github/workflows/deploy.yml`, `scripts/validate-release-identity.mjs`, `config/github-repository-settings.json`, and GitHub provider state.
