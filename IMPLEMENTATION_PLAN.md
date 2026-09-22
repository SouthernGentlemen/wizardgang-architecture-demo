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
