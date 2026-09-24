# Active implementation plan

This is the architecture demo's current/future process-convergence queue under WG-ARCH-001 §27. The repository is the upstream reference implementation for the shared WizardGang delivery model, so this wave closes the remaining gaps before downstream repositories treat it as common authority.

Start every `do needful` turn from freshly fetched `main`, `AGENTS.md`, this plan, open PRs, exact-head CI, repository settings, rulesets, tags, GitHub Releases and production deployment state. Finish an authoritative open PR for the first task instead of duplicating it. Deliver exactly one queued task per controlled change, remove that task in the same delivery, and delete this file in the final delivery.

Keep credential-free repository acceptance, network-dependent dependency advisories, live provider verification, release publication and production deployment as separate boundaries. Preserve the architecture demo's application/runtime/assurance contracts unless a task explicitly names them. Published history, annotated tags and GitHub Releases are immutable evidence and are never rewritten.

Current observed process facts that motivate this wave:

- repository toolchain authority is Node 26.9.0 with npm 11.19.1 and is now aligned to the current shared baseline; exact patch drift is rejected before locked installation;
- exact-head CI validates the PR title but does not yet bind branch name, head controlled commit identity and one-controlled-commit range together;
- the portable repository-baseline validator still mixes universal process requirements with this reference stack's TypeScript/React/Vite/Vitest/Wrangler capabilities;
- the release workflow calls `npm run security:dependencies` while the current package command is `security:dependency-advisories`;
- raw `npm run deploy` still exposes arbitrary-checkout Wrangler deployment;
- manual deployment accepts a `ref` and proves an exact tag at HEAD, but does not yet bind the requested ref, package version and existing GitHub Release into one immutable deployment identity;
- current-tree secret scanning is narrower than the strongest public-history safety boundary already used by sibling repositories.

## Open tasks

### DEMO-361 — [REFACTOR] Split universal process checks from reference-stack checks

- Dependency: none; first open task.
- Why: `validate-repository-baseline` is presented as portable but currently requires this repository's Worker/React/Vite/Vitest/browser/release capabilities.
- Scope: Introduce an explicit repository capability declaration, extract the truly universal process contract, add non-Worker/non-React fixtures, and keep reference-stack validation as a separate layer.
- Non-goals: No weakening of this repository's own TypeScript/React/Vite/Vitest/Wrangler controls and no downstream repository mutation.
- Acceptance: A minimal non-Worker repository can satisfy the universal process fixture without pretending to own reference-stack capabilities, while this repo still passes the stronger reference profile.
- Validation: Baseline fixture suite; `npm run check`; patch whitespace.
- Authorities: `scripts/validate-repository-baseline.mjs`, WG-ARCH-001 §27.

### DEMO-364 — [TEST] Bind controlled PR identity and queue sequence

- Dependency: DEMO-361 merged.
- Why: Exact-head CI currently validates PR title but not the complete branch/head/range identity, and active-plan validation does not yet enforce the next controlled ID strongly enough for the common process.
- Scope: Add deterministic rules/tests binding branch `demo-NNN-...`, PR title, exact head controlled commit ID/type, one controlled commit in the PR range, first-open-task/next-ID selection, same-delivery task retirement and blocked-head behavior.
- Preserve: Pre-controlled legacy history and published merge history; no history rewrite.
- Non-goals: No provider merge-policy mutation yet.
- Acceptance: Duplicate/out-of-sequence IDs, branch/title/head mismatch, multiple controlled commits, retained delivered task blocks and skipped blocked-head selection fail focused validation.
- Validation: Disposable Git/plan fixtures; `npm run check`; exact-head CI; patch whitespace.
- Authorities: `AGENTS.md`, history/plan validators, CI change-id boundary.

### DEMO-365 — [FIX] Repair exact release reproduction command ownership

- Dependency: DEMO-364 merged; the DEMO-362 live GitHub settings baseline remains verified.
- Why: The current release workflow calls `npm run security:dependencies`, while the repository's canonical network advisory command is `security:dependency-advisories`.
- Scope: Repair the release reproduction path to invoke the current named advisory gate exactly once, preserve credential-free `check`, keep annotated semantic tag/package/commit identity checks and retain GitHub Release publication before deployment.
- Non-goals: No version bump, tag creation, GitHub Release publication or deployment in this task.
- Acceptance: Release workflow contract tests prove the tagged reproduction command set is executable from current `package.json` and no stale command name remains.
- Validation: Release workflow tests; `npm run check`; explicit network advisory command; exact-head CI; patch whitespace.
- Authorities: `.github/workflows/release.yml`, `package.json`, `docs/RELEASE-MANAGEMENT.md`.

### DEMO-366 — [BUILD] Bind every production deploy to one published immutable release

- Dependency: DEMO-365 merged.
- Why: Manual deployment accepts an arbitrary input ref and raw `npm run deploy` can publish an arbitrary checkout.
- Scope: Remove or fail-close the raw arbitrary-checkout production command; require deploy input to be exact `vMAJOR.MINOR.PATCH`; prove requested ref equals the annotated tag at HEAD; require package version match; require the corresponding GitHub Release already exists and identifies the same tag/commit before any production mutation. Preserve release-triggered deployment and intentional published-tag recovery.
- Non-goals: No alternate hosting provider, tag rewrite, release publication or production deployment during implementation.
- Acceptance: Branch/SHA/lightweight/unpublished/mismatched-tag inputs cannot deploy; a previously published immutable release can still be intentionally redeployed.
- Validation: Deploy-boundary fixtures/workflow tests; Wrangler dry run; `npm run check`; exact-head CI; patch whitespace.
- Authorities: `.github/workflows/deploy.yml`, release identity scripts, `docs/RELEASE-MANAGEMENT.md`.

### DEMO-367 — [TEST] Prove release-to-deployment identity and provider version

- Dependency: DEMO-366 merged.
- Why: The reference process should prove both public application identity and the provider-side deployed version/traffic state for the exact published release.
- Scope: Add focused regression tests for release -> publication -> deploy ordering, exact requested tag/package/commit continuity and provider deployment-version confirmation. Preserve existing public version/health/identity/browser-asset verification.
- Non-goals: No release solely to satisfy this test task.
- Acceptance: Deployment cannot bypass publication, cannot substitute another tag/commit, and verification fails when Cloudflare provider version/traffic evidence does not match the deployment result.
- Validation: Focused workflow/process tests; `npm run check`; provider evidence on the next real deployment.
- Authorities: release/deploy workflows, Cloudflare deployment evidence, public operations identity endpoints.

### DEMO-368 — [SEC] Extend secret safety across public Git history

- Dependency: DEMO-367 merged.
- Why: Current-tree secret scanning is narrower than the public-history safety boundary already proven in sibling repositories.
- Scope: Add bounded public-history blob/path scanning for secret-like material while preserving current worker-secret names and assurance controls. Keep known-safe fixtures explicit and narrow.
- Non-goals: No secret rotation unless fresh evidence finds an exposed credential; no scanning of unrelated external repositories.
- Acceptance: A secret-like value committed anywhere in reachable public history is detected by focused fixtures without dumping sensitive content into logs.
- Validation: Security fixtures; `npm run check`; exact-head CI; patch whitespace.
- Authorities: current security validator, Git object/history semantics, public repository boundary.

### DEMO-369 — [DOCS] Complete reference-process parity acceptance

- Dependency: DEMO-368 merged.
- Why: The upstream process authority should finish with one fresh proof that all shared semantics now agree.
- Scope: Re-audit shared Node/npm, safe `dev`, universal/reference baseline split, controlled history/PR identity, canonical `check`, network advisory gate, patch integrity, exact-head/main CI, squash-only provider policy, settings CLI, branch cleanup, immutable tags, exact release reproduction, GitHub Release authority, release-only production deployment, Cloudflare provider/public identity verification and public-history secret safety. Reconcile current-state docs only and delete `IMPLEMENTATION_PLAN.md` when all applicable evidence is green.
- Non-goals: No product feature, version bump, tag creation, release publication or production deployment solely for the audit.
- Acceptance: Fresh repository/provider evidence shows the architecture demo is a coherent common process reference with no remaining active implementation queue.
- Validation: `npm ci`; `npm run check`; `npm run security:dependency-advisories`; provider verification; release/deploy evidence; exact-head/main CI; patch whitespace.
- Authorities: current repository state, live GitHub/Cloudflare state and WG-ARCH-001 §27.

## Target process

Controlled delivery after convergence:

`branch -> one controlled DEMO commit -> PR -> npm ci -> npm run check -> network advisory + committed-patch CI gates -> exact-head CI -> squash merge -> merged-main CI -> automatic branch cleanup`

Release/deployment:

`reviewed main -> version change -> annotated vX.Y.Z -> reproduce exact tag -> GitHub Release -> deploy exact published tag -> verify Cloudflare version/traffic + public release/commit identity`

## Recheck after this wave

After DEMO-369, perform a fresh cross-repository comparison before reserving more IDs. Downstream repositories may implement the universal process with capability-specific N/A boundaries; they must not copy reference-stack requirements they do not own.
