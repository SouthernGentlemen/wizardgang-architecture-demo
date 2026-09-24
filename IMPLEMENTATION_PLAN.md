# Active implementation plan

**Portfolio plan maintenance notice.** The owner may direct an additive update to this active queue while another task or pull request is in progress. Keep every existing open task and its order; a plan amendment neither implements nor retires it. After the shared policy setup, a routine amendment changes only this plan file. Before merging, re-fetch authoritative `main` and open pull requests, compare the current plan and exact head with the recorded base, and rebase/reconcile if either moved. Require current exact-head checks and mergeability so concurrent work is not overwritten. Any earlier “final task” or “no queue remains” wording applies to its original wave; it keeps this plan while appended tasks remain, and only the actual last task deletes it.

This is the architecture demo's current/future process-convergence queue under WG-ARCH-001 §27. The repository is the upstream reference implementation for the shared WizardGang delivery model, so this wave closes the remaining gaps before downstream repositories treat it as common authority.

Start every `do needful` turn from freshly fetched `main`, `AGENTS.md`, this plan, open PRs, exact-head CI, repository settings, rulesets, tags, GitHub Releases and production deployment state. Finish an authoritative open PR for the first task instead of duplicating it. Deliver exactly one queued task per controlled change, remove that task in the same delivery, and delete this file in the final delivery.

Keep credential-free repository acceptance, network-dependent dependency advisories, live provider verification, release publication and production deployment as separate boundaries. Preserve the architecture demo's application/runtime/assurance contracts unless a task explicitly names them. Published history, annotated tags and GitHub Releases are immutable evidence and are never rewritten.

Current observed process facts that motivate this wave:

- repository toolchain authority is Node 26.9.0 with npm 11.19.1 and is now aligned to the current shared baseline; exact patch drift is rejected before locked installation;
- raw `npm run deploy` still exposes arbitrary-checkout Wrangler deployment;
- manual deployment accepts a `ref` and proves an exact tag at HEAD, but does not yet bind the requested ref, package version and existing GitHub Release into one immutable deployment identity;
- current-tree secret scanning is narrower than the strongest public-history safety boundary already used by sibling repositories.

## Open tasks

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

### DEMO-371 — [OPS] Normalize shared package, workflow, and npm command contracts

- Dependency: DEMO-369 delivered; portfolio planning policy DEMO-370 merged. Coordinate with the same normalization task in every public sibling repository.
- Why: Shared versioned tooling, workflow behavior, and npm command meanings have drifted across the public repositories.
- Scope: Inventory every public repository's direct and transitive shared npm packages, package manager, Node pin, lockfile, versioned vendor code, GitHub Action pins, workflow triggers/permissions/toolchain/install/check/advisory/identity/release/deploy steps, and npm scripts. Select one supported version for each shared vendor dependency or document a concrete compatibility exception. Align common scripts and YAML workflows to the same behavior for equivalent capabilities. Keep product-specific commands and explicit local-only/library/no-deploy boundaries. Reconcile AGENTS.md and the byte-identical CONTRIBUTING.md contract across the public set.
- Non-goals: Do not add unused packages, a hosted runtime to a local-only product, or production deployment merely for parity. Do not rewrite published history or unrelated product behavior.
- Acceptance: A fresh cross-repository matrix shows the same version for every shared versioned package/vendor tool where compatible, identical CONTRIBUTING.md bytes, equivalent workflow and npm-script semantics for applicable capabilities, and recorded exceptions with technical reasons. No workflow invokes a missing script; every package lock matches its manifest.
- Validation: Install each public repository with its pinned toolchain and `npm ci`; run `npm run check`, focused workflow/script contract tests, `git diff --check`, exact-head CI, and the separate network/provider gates where applicable. Re-fetch every target's base and this documentation commit before merging to preserve concurrent work.
- Authorities: WG-ARCH-001 §27, current public repository manifests and lockfiles, GitHub workflow YAML, npm scripts, AGENTS.md, and shared CONTRIBUTING.md.

## Target process

Controlled delivery after convergence:

`branch -> one controlled DEMO commit -> PR -> npm ci -> npm run check -> network advisory + committed-patch CI gates -> exact-head CI -> squash merge -> merged-main CI -> automatic branch cleanup`

Release/deployment:

`reviewed main -> version change -> annotated vX.Y.Z -> reproduce exact tag -> GitHub Release -> deploy exact published tag -> verify Cloudflare version/traffic + public release/commit identity`

## Recheck after this wave

After DEMO-369, perform a fresh cross-repository comparison before reserving more IDs. Downstream repositories may implement the universal process with capability-specific N/A boundaries; they must not copy reference-stack requirements they do not own.
