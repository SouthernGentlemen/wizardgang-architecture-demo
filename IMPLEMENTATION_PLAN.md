# Active implementation plan

This is the current/future command-and-process convergence queue for the architecture repository, the upstream WizardGang process authority. Start from freshly fetched `main`, `AGENTS.md`, this plan, open PRs, exact-head CI, and live settings. Complete only the first open task per `do needful` turn unless the owner explicitly changes priority. A blocked first task is reported, not bypassed. Its delivering PR removes its own block and updates future blocks; the last delivery deletes this file. Git/GitHub retain completed work. Do not implement work from the later-finding inventory merely because it is visible here: research and sequence the next wave from fresh state after this one.

The shared command meanings are in WG-ARCH-001 §27. This wave makes the architecture repository honor that contract before other repositories inherit it. Keep credential-free acceptance, provider-aware verification, release publication, and production deployment separate. A short web turn is the sizing target; exact-head CI, review, and provider latency are external to implementation size, not reasons to omit them. If a task expands across independent outcomes, narrow or split its future block before implementing it.

## Current cross-repository command comparison

These are observed current behaviors to guide adoption, not permission to overwrite product-specific capabilities. Re-read current `main` before changing any repository.

| Repository | `dev` | `test` / `build` | Acceptance and release boundary |
| --- | --- | --- | --- |
| Architecture demo | Generate assets, then Vite watch plus Wrangler; child-only termination | Vitest; client generation plus Worker dry-run build | `check` omits several gates still run by `validate:ci`; release/tag flow is strong, but raw `deploy` remains exposed. |
| SharkTank | Raw `wrangler dev` | Vitest/PHP self-test; Vite build | Broad `check` includes PHP, local HTTP, audit, history, provenance, whitespace; tag release has provider-version confirmation. |
| Hexframe | Build and Wrangler with required local env | Vitest; Vite/version stamp | `check` includes release-boundary/content guards; tag-only protected deploy and provider-version confirmation. |
| YarReader | Vite offline viewer | `test` builds before Node/browser tests; `check` builds again | Strong public-history safety and offline release boundary; duplicate build in `check`/CI. |
| WizardGang | Managed checkout-owned reset, port protection, readiness, browser option, signal cleanup | Several named Node suites; custom build | `check` omits named dev/browser/a11y suites; no current CI or controlled repository baseline. |
| SVGLab | Managed local teardown/reset/build/start/readiness/browser | Vitest builds first; Vite build | `verify`, not `check`, owns rig, generated-artifact, footprint, cruft, local-only, Blender checks; no current CI/change baseline. |
| FightLab / Mix Up | Managed local lifecycle with pinned Boneyard input | Vitest; Vite build | `verify`, not `check`, owns pin/type/test/build; separate visual CI; no current full process baseline. |
| Boneyard | No running surface | Vitest; deterministic asset bundle build | `verify`, not `check`, owns generated outputs, footprint/cruft, type/test; no current CI/change baseline. |

The differences justify a common command *contract*, not identical shell bodies. `KeyLab` was not accessible under either known owner during this review; do not invent its package behavior. The architecture tasks below do not mutate downstream repositories.

## Open tasks

### DEMO-348 — [BUILD] Put generated-artifact parity inside `check`

- Dependency: DEMO-347 merged on `main`.
- Why: CI runs `validate:generated-artifacts` before `check`, so the advertised acceptance command alone misses generated drift.
- Scope: Compose the existing parity validator into `check` once; retain its first-pass/idempotence diagnostics and make the CI orchestrator avoid a second independent parity pass.
- Non-goals: Do not redesign generators, generated files, or other gates.
- Acceptance: Generated drift fails local `check` and exact-head CI with the same finding; clean artifacts pass without duplicate CI execution.
- Validation: Focused generated-artifact validator test; `npm run check`; `npm run validate:ci` where its full prerequisites are available; `git diff --check`.
- Authorities: `package.json`, `scripts/ci-validation.mjs`, `scripts/validate-generated-artifacts.mjs`.

### DEMO-349 — [BUILD] Make clean local D1 migration proof part of acceptance

- Dependency: DEMO-348 merged on `main`.
- Why: `validate:migrations` is an extra CI gate, while `check` alone does not prove the current migration chain can apply to an empty local database.
- Scope: Make the existing migration check use disposable local state and invoke it exactly once from `check`; remove its duplicate standalone CI invocation.
- Non-goals: Do not edit accepted migrations, touch remote D1, or reset user-owned local data.
- Acceptance: The migration chain applies to an empty isolated local database under `check`; failures identify the migration; no remote/provider mutation occurs.
- Validation: Focused migration command test; `npm run validate:migrations`; `npm run check`; `git diff --check`.
- Authorities: `package.json`, `scripts/ci-validation.mjs`, `wrangler.jsonc`, migration directory.

### DEMO-350 — [TEST] Include the browser accessibility/localization audit in acceptance

- Dependency: DEMO-349 merged on `main`.
- Why: The Chromium-backed site audit is a separate CI gate, while the similarly named Vitest suites already inside `check` do not execute that browser audit.
- Scope: Compose the existing `test:site-accessibility` once in `check`, retain an explicit Chromium preflight/error, and remove duplicate CI execution. Keep its a11y and i18n coverage intact.
- Non-goals: Do not change product UI, lower WCAG/i18n assertions, or silently skip when Chromium is missing.
- Acceptance: The same browser failure appears under local `check` and CI; missing browser tooling is an explicit prerequisite failure, not a pass.
- Validation: `npm run verify:chromium`; `npm run test:site-accessibility`; `npm run check`; `git diff --check`.
- Authorities: `package.json`, `scripts/ci-validation.mjs`, `scripts/run-site-accessibility-audits.mjs`.

### DEMO-351 — [BUILD] Include the Worker dry-run build in acceptance

- Dependency: DEMO-350 merged on `main`.
- Why: `check` validates Vite assets but not the Worker dry-run bundle; CI separately invokes `build` and catches Worker-bundle failures later.
- Scope: Run the existing production `build` path exactly once within `check`, removing redundant asset/build invocations from the CI orchestration without changing output semantics.
- Non-goals: Do not perform a live Wrangler deploy, change asset ownership, or rebuild unrelated runtime code.
- Acceptance: Worker-bundle failure makes `check` fail; successful `check` leaves reproducible client/Worker artifacts and CI has no second build pass.
- Validation: `npm run build`; `npm run check`; `git diff --check`.
- Authorities: `package.json`, `scripts/ci-validation.mjs`, Vite/Wrangler configuration.

### DEMO-352 — [BUILD] Name the network-dependent dependency-advisory gate

- Dependency: DEMO-351 merged on `main`.
- Why: `npm audit` currently runs outside `check`; cloud agent network may be unavailable even after `npm ci`, and a failed query must not be mistaken for a clean dependency result.
- Scope: Keep the high-severity advisory query as one explicit CI/local command with a documented network prerequisite and clear failure distinction between advisories and transport unavailability; keep lockfile/install-script safety in credential-free `check`.
- Non-goals: Do not silently omit the CI audit, require provider credentials, change dependency versions, or claim a no-network audit passed.
- Acceptance: CI still fails on high-severity advisories; a web-terminal agent can reproduce the gate when registry access exists and reports an exact blocker otherwise.
- Validation: Focused advisory-command tests; `npm run security:dependencies` when network is available; `npm run check`; `git diff --check`.
- Authorities: `package.json`, `.npmrc`, `scripts/ci-validation.mjs`, `CONTRIBUTING.md`.

### DEMO-353 — [TEST] Give patch whitespace one explicit PR-range owner

- Dependency: DEMO-352 merged on `main`.
- Why: CI uses a base-SHA-dependent `git diff --check`, while `check` has no equivalent and local instructions use the unstaged diff, which can miss a committed PR patch.
- Scope: Add a narrow local/CI patch-integrity helper that checks the actual PR range when base context exists and reports the correct local fallback; invoke it once from the acceptance flow.
- Non-goals: Do not rewrite history or impose a squash merge.
- Acceptance: Trailing whitespace in the committed PR range fails exact-head CI and the reproducible local command; clean commits pass.
- Validation: Focused helper tests; `npm run check` with appropriate base context; `git diff --check`.
- Authorities: `scripts/ci-validation.mjs`, `package.json`, `.github/workflows/ci.yml`.

### DEMO-354 — [TEST] Assert `check` and CI gate ownership without prose snapshots

- Dependency: DEMO-353 merged on `main`.
- Why: Several small composition edits can drift back into duplicate or missing CI gates without a test of the final orchestration.
- Scope: Add pure tests over the ordered `check`/CI command plan, ensuring each credential-free gate has one owner and the network-aware advisory/provider boundaries remain explicit.
- Non-goals: Do not rerun the full suite inside unit tests or freeze exact prose/script text.
- Acceptance: Removing an applicable gate or duplicating one causes a focused failure; provider-authenticated checks are not pulled into `check`.
- Validation: Focused orchestration tests; `npm run check`; `npm run validate:ci` where prerequisites exist; `git diff --check`.
- Authorities: `package.json`, `scripts/ci-validation.mjs`, process test suite.

### DEMO-355 — [TEST] Prove checkout-owned development process identity

- Dependency: DEMO-354 merged on `main`.
- Why: The current `scripts/dev.mjs` signals direct npm children; before broader cleanup, it needs a testable way to distinguish this checkout's descendants from unrelated processes.
- Scope: Extract a pure checkout/process-identity decision and add focused tests for owned child, stale PID, and foreign process cases. Do not change live teardown behavior yet.
- Non-goals: Do not kill processes, reset user outputs, auto-open a browser, change ports, or touch production.
- Acceptance: A later cleanup can consume one tested, fail-closed ownership decision; foreign and stale identities are rejected.
- Validation: Focused dev-identity tests; `npm run check`; `git diff --check`.
- Authorities: `scripts/dev.mjs`, dev-lifecycle tests, WG-ARCH-001 §27.

### DEMO-356 — [FIX] Stop checkout-owned development process trees

- Dependency: DEMO-355 merged on `main`.
- Why: Direct-child signaling can leave Vite/Wrangler descendants alive; the tested ownership decision from DEMO-355 gives cleanup a safe boundary.
- Scope: Use the owned-process decision to stop only this checkout's watcher/Worker process trees on interrupt, termination, and startup failure; add focused cleanup tests. Preserve current startup/port behavior.
- Non-goals: Do not kill foreign port owners, reset user output, open a browser, deploy, or change production configuration. Delete this plan in the delivering PR unless a fresh owner-approved future wave replaces it.
- Acceptance: The owned process tree exits with `dev`; unproven/foreign processes are never signaled; startup failure leaves no owned descendant.
- Validation: Focused cleanup tests; manual `npm run dev` start/stop with local prerequisites; `npm run check`; `git diff --check`.
- Authorities: `scripts/dev.mjs`, `package.json`, `README.md`, WG-ARCH-001 §27.

## Validated forward findings for the next fresh wave

These remain open candidates, not extra assignments or reserved IDs. Reconfirm them against then-current source/provider state; promote only justified, surgical outcomes. This inventory preserves the earlier process review without carrying completed React history.

- **Process enforcement:** the plan validator checks accepted IDs and field shape but not contiguous next IDs; process-conformance tests do not yet guard one-task handoff, same-delivery retirement, blocked-head behavior, or truthful provider actions. Split queue-sequence enforcement from behavior assertions.
- **Universal versus reference baseline:** `scripts/validate-repository-baseline.mjs` claims to be copyable yet requires this repo's Node 26/npm 11, root `LICENSE`, TypeScript/React/Vite/Vitest, Wrangler, browser assets, and release workflow. Define a capability declaration, then split universal-process validation, non-Worker fixtures, and reference-stack checks into separate changes. `LICENSE.md` with explicit attribution can satisfy a product's license model.
- **Controlled PR identity:** exact-head CI currently validates only PR title; it does not bind branch, head commit ID/type, or one controlled commit in the PR range. Keep merge-commit provider policy until a separate deliberate provider/validator decision. The live Git demonstration can allocate a queued ID because it reads history but not the active plan.
- **Provider protections:** the live architecture `main` ruleset has non-strict required status checks, unlike the three comparison repositories, and the settings-as-code projection does not compare that field. Pure settings comparison tests are missing. The live `production` environment has no protection rules or deployment-branch policy. Treat these as provider-control work, not documentation-only changes; verify any admin/provider constraint explicitly.
- **Deployment boundary:** manual `deploy.yml` accepts a ref, then finds an exact tag at HEAD without proving the selected ref equals a `vMAJOR.MINOR.PATCH` annotated tag and matching package version; raw `npm run deploy` exposes a live Wrangler deployment from an arbitrary checkout. Preserve intentional tag-based recovery while binding the requested immutable identity and protected environment. Do not weaken the release workflow's exact-tag reproduction, GitHub Release authority, secret preflight, identity continuity, or post-deploy version/asset checks. Consider Hexframe's event/input/tag proof and provider-version confirmation as separate reviewable improvements.
- **Security and product-specific gates:** current-tree secret scanning is narrower than YarReader's public-history safety gate. Reassess secret/blob/path scanning without duplicating architecture assurance controls. CSP, accessibility, localization, Worker/static-assets, and fail-closed persistence are currently intentional guarded architecture, not automatic defect tasks; create a task only for a demonstrated gap. Reassess repository cruft and duplicated validators from current source rather than inheriting an old finding.
- **Local lifecycle finish:** after owned-process cleanup is proven, add a separate bounded readiness/URL report and optional headless-safe browser open to architecture `dev`; do not combine it with process ownership or port-reclamation changes. WizardGang and SVGLab provide useful patterns, not a wholesale transplant.
- **Downstream adoption after upstream stabilization:** WizardGang lacks a controlled CI/policy baseline; SVGLab, FightLab, and Boneyard use `verify` as their real gate and lack pieces of the universal process; YarReader duplicates build execution; SharkTank and Hexframe have strong but differing command and release checks. Write separate repository-specific waves after this architecture contract is proven. Private-repository ruleset APIs currently report a plan/tier restriction for the lab repositories; that is a provider blocker, not a lab exemption. `KeyLab` remains unverified until its repository is identified or made accessible.
