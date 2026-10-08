# Implementation plan

## Execution rules

Priority: reduce runtime first, then handoffs/complexity and redundant ownership; explicitly remove legacy support throughout.

- The twelve parent deliveries below are assigned **DEMO-497 through DEMO-508** in execution order.
- IDs are assigned by the agent. Reconcile new reservations automatically with authoritative main/open work through the normal delivery process; never ask the owner to calculate IDs or silently renumber published tasks. Start implementation only on the owner's delivery instruction.
- Work the first open parent task only. Each parent is one controlled delivery/commit/PR; its checkboxes are implementation units, not separate PRs or IDs. Retire only the parent completed by its delivery and preserve the remaining queue.
- Each checkbox targets roughly **10 minutes of hands-on work**. Dependency installation, CI/runner waits, upstream merge waits and Jacob's approval are outside that estimate. Split an unexpectedly large checkbox within its parent rather than inventing another delivery or weakening validation.
- Delete fixtures whose sole purpose is a retired workflow, old provider pin, historical metadata failure or obsolete schema/interface. Do not preserve them with compatibility flags, aliases, exception tables, shims or a legacy suite. Keep a fixture only for a supported current behavior or failure contract.
- Code, current tests, obsolete-fixture deletion and authority/documentation changes travel together. Use existing diagnostics/timings; do not add a readiness service, aggregate status job, flake ledger or benchmarking workflow.
- Common delivery validation remains focused current evidence plus canonical final-exact-head CI and every active required check, pinned toolchains, current-base protected squash, post-merge verification and branch cleanup. Advisory queries and committed-range checks stay explicitly separate from credential-free check.
- Implement baseline-owned work in its owning repository and vendor its merged commit; never patch platform/ independently. Production secrets/settings/traffic are not cleanup targets. Release only one completed authorized batch through Jacob's protected production approval.

## Open tasks

### DEMO-497 — [TEST] Remove repeated acceptance executions

- Dependency: DEMO-496
- Why: Reduce repeated work immediately while retaining an execution owner for every current assertion.
- Scope: Demo acceptance wiring, duplicate positive checkout tests, Release reproduction, and their current command/documentation contracts.
- Non-goals: Do not change required status names yet, remove current rejection coverage, change versions, or publish/deploy.
- Acceptance: CI queries dependency advisories once; Release runs migration/build acceptance once; repeated real-checkout validator subprocesses are removed; failures and unavailable queries still fail.
- Validation: Focused acceptance-plan, reproduction and affected validator tests; inspect expanded command ownership; final exact-head canonical CI under the currently active checks.
- Authorities: package.json; scripts/lib/acceptance-plan.ts; scripts/ci-validation.ts; .github/workflows/ci.yml; .github/workflows/release.yml; docs/CI-DIAGNOSTICS.md; docs/RELEASE-MANAGEMENT.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Read recent authoritative CI stage timings during delivery and identify repeated successful-path commands; use existing diagnostics, not a new metrics file or workflow.
- [ ] 02. Remove the advisory invocation from validate:ci while the existing security job remains its sole CI owner; keep the explicit local advisory interface.
- [ ] 03. Remove the second migration invocation from Release reproduction; retain the one fresh D1 directory shared by migration and browser acceptance and its cleanup.
- [ ] 04. Remove the second unbound build from Release reproduction; retain check-owned build/bundle validation and the separate production identity-bound build.
- [ ] 05. Remove repeated real-history positive subprocess calls in the DEMO-366/422/478 tests; leave the real checkout gate once until forward cutover replaces it.
- [ ] 06. Remove the positive real-checkout Worker-inventory subprocess test; preserve current mismatch/rejection cases as focused fixtures or pure-function tests.
- [ ] 07. Remove duplicate real-checkout documentation, repository-settings and assurance validator launches from positive tests; retain distinct current invalid-input cases.
- [ ] 08. Rewrite acceptance ownership tests to evaluate expanded commands rather than freeze the redundant sequence; delete old fixtures that mandate duplicate work.
- [ ] 09. Update Release rules and diagnostics prose to match the reduced sequence, run focused verification, and compare the changed stage timings in existing CI.

### DEMO-498 — [BUILD] Give generation and builds one execution owner

- Dependency: DEMO-497
- Why: Remove repeated Vite builds and test-runner startup while preserving generated drift and determinism checks.
- Scope: Asset/route/OpenAPI/runtime-binding generation, build orchestration and current generated-artifact tests.
- Non-goals: Do not drop the two determinism passes, weaken Worker bundle validation, patch platform/, or introduce a competing build command.
- Acceptance: A full check uses two client-generation passes instead of three builds; direct route generation replaces Vitest write mode; freshness comparisons each have one owner; distributable Worker validation remains.
- Validation: Focused generated-artifact, route serializer, schema/binding and build ownership tests; deliberately stale/unstable output fails; final exact-head canonical CI.
- Authorities: scripts/validate-generated-artifacts.ts; scripts/generate-route-manifest.ts; scripts/generate-assurance-runtime-binding.ts; scripts/sync-openapi-schemas.ts; tests/route-artifacts.test.ts; package.json; docs/CI-DIAGNOSTICS.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Trace each generator output and build consumer; identify the second parity pass output that can satisfy the client-build input.
- [ ] 02. Refactor client-build orchestration to consume that output during full acceptance; keep standalone npm run build producing its own fresh distributable output.
- [ ] 03. Retain clean-output, drift, unexpected-path and second-pass idempotence assertions around the asset generator.
- [ ] 04. Keep Worker compilation, Wrangler dry run and bundle validation after the accepted client output; remove the redundant third Vite invocation.
- [ ] 05. Extract/use the existing route serializer in the actual route generator so generation does not start Vitest.
- [ ] 06. Change generate:routes/parity wiring to invoke the generator directly; remove WRITE-mode test/generator wrapping.
- [ ] 07. Retain route serializer and invalid-route fixtures in current domain tests; delete the redundant real-checkout generation assertion.
- [ ] 08. Make generated parity the sole OpenAPI freshness owner; keep unique contract schema, operation and routing assertions in contract validation.
- [ ] 09. Make generated parity the sole runtime-binding freshness owner; remove registry and extra binding output comparisons while retaining completeness/routing checks.
- [ ] 10. Expose the accepted build output paths to the canonical execution plan for later browser-job transfer, without adding a cross-head cache.
- [ ] 11. Delete obsolete generator/build-shape fixtures and update current generator/build ownership tests and command documentation.
- [ ] 12. Verify stale output, unexpected files and non-idempotent generation fail; confirm the full successful path contains only the intended builds.

### DEMO-499 — [BUILD] Cut over to forward-only controlled history

- Dependency: DEMO-497
- Why: Stop replaying old metadata failures and maintaining recovery exceptions for already-corrected repository states.
- Scope: Fixed accepted-history checkpoint, current namespace/queue predicates, forward history validation and removal of historical recovery support.
- Non-goals: Do not rewrite Git or tags, automatically advance the checkpoint, reuse identities, relax current queue discipline, or reduce reachable-history secret exposure scanning.
- Acceptance: Only commits after the fixed accepted checkpoint undergo controlled-history validation; checkpoint ancestry and current namespace/reservations are verified; new malformed commits fail; legacy exception maps and recovery fixtures are deleted.
- Validation: Current fixtures for missing/non-ancestor checkpoint, malformed new title/body, duplicate/reserved ID, queue order/dependency violations and valid forward correction; one real forward-history gate; exact-head CI.
- Authorities: scripts/validate-history.ts; scripts/lib/controlled-pr-identity.ts; scripts/validate-pull-request-identity.ts; scripts/validate-implementation-plan.ts; scripts/check-portfolio-contract.ts; docs/CHANGE-MANAGEMENT.md; AGENTS.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Reconcile authoritative main, open work and the accepted namespace during implementation; identify a fixed accepted checkpoint and current ID floor without assigning another task ID manually.
- [ ] 02. Represent the checkpoint and any consumed IDs above its sequential floor in one current boundary; preserve queued/open reservations and avoid a new historical narrative register.
- [ ] 03. Implement a pure checkpoint ancestry/range predicate that rejects a missing or unrelated checkpoint and does not silently move it.
- [ ] 04. Read controlled commit bodies only for the post-checkpoint range; keep raw accepted-ID lookup separate from replaying old body validation.
- [ ] 05. Share current controlled-subject/type parsing between history and PR identity instead of carrying separate historical parsing exceptions.
- [ ] 06. Share current queue parsing while retaining required task fields, first-task selection, dependency resolution and later-task preservation.
- [ ] 07. Initialize forward sequencing from the accepted namespace boundary; retain current portfolio-maintenance/live supported identity rules only where current behavior requires them.
- [ ] 08. Delete missing-body, suffix-normalization, published-continuation and historical renumbering exception maps and their special paths.
- [ ] 09. Remove generic Post-Merge-Recovery authoring support; require a new controlled identity for a future correction.
- [ ] 10. Delete legacy history/recovery fixtures, including museum cases for old malformed squashes; move any distinct current invariant into forward-only fixtures.
- [ ] 11. Verify new suffix/body defects, ID collisions and checkpoint tampering fail; verify an ordinary forward correction and valid queue transition pass.
- [ ] 12. Update change-management/current architecture authorities for the fixed forward boundary and removal of historical support; keep the secret exposure scan unchanged.

### DEMO-500 — [TEST] Consolidate assurance and repository validation

- Dependency: DEMO-497, DEMO-498, DEMO-499
- Why: Replace repeated process startup and data loading with one current assertion owner per domain.
- Scope: Assurance context/predicates, repository/toolchain and documentation/reference validation, queue parsing consumers and current focused tests.
- Non-goals: Do not discard unique schema/disclosure/framework/freshness assertions, alter public assurance data as cleanup, or loosen portfolio root-contract identity.
- Acceptance: One assurance execution loads shared inputs once; overlapping predicates execute once; repository/documentation/current queue assertions are consolidated; obsolete prose/layout/retired-generator fixtures are deleted.
- Validation: Focused current assurance, disclosure, relationship, publication, expiry, reference/link and queue rejection fixtures; expanded execution ownership; exact-head canonical CI.
- Authorities: scripts/validate-assurance*.ts; scripts/lib/assurance-validation.ts; scripts/validate-scaffold.ts; scripts/validate-repository-baseline.ts; scripts/validate-governance-metadata.ts; scripts/validate-documentation-cleanup.ts; scripts/validate-toolchain.ts; docs/ASSURANCE.md; docs/governance/REFERENCE-REGISTRY.json; docs/ARCHITECTURE-STANDARD.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Enumerate the thirteen assurance commands and map their distinct current assertions into the execution plan; identify shared registry/schema/inventory reads.
- [ ] 02. Create one assurance validation context with explicit readers and clock input so loaded data and time-sensitive checks can be reused safely.
- [ ] 03. Convert registry, record/schema and advisory predicates to consume that context without spawning their old entrypoints.
- [ ] 04. Merge projection/integrity overlap while retaining unique absolute-URL, derived-field, private-field and required-route constraints.
- [ ] 05. Move publication and lifecycle predicates into the shared execution without preserving retired publication formats or old-run fixtures.
- [ ] 06. Run ISO 27001, ISO 42001 and WCAG mapping assertions from the shared context; preserve unique current framework relationship checks.
- [ ] 07. Share documentation/reference/heading resolution with assurance documentation validation; retain actual links and required control relationships.
- [ ] 08. Integrate current observation/security-disclosure freshness and operations predicates with the same injected clock/context.
- [ ] 09. Consolidate overlapping scaffold/repository-baseline file, toolchain and capability assertions under their current owner.
- [ ] 10. Consolidate overlapping governance/documentation retired-path and exact-prose checks; replace brittle shape assertions with current semantic contracts.
- [ ] 11. Use the shared queue parser from forward history for portfolio/plan consumers while retaining byte-identical root authority and shared empty-template rules.
- [ ] 12. Wire validate:assurance to one execution and preserve focused access through the same predicates; remove superseded CLI orchestration and duplicate positive tests.
- [ ] 13. Delete fixtures whose only purpose is retired generators/documents or old command text; exercise unique current bad-input cases directly.
- [ ] 14. Update command/diagnostic authorities and confirm one assurance context and no duplicate current predicates in the expanded full check.

### DEMO-501 — [TEST] Stabilize browser acceptance and retire old harness paths

- Dependency: DEMO-498, DEMO-500
- Why: Reduce expensive flake reruns and unnecessary waits while preserving current rendered behavior and accessibility protection.
- Scope: The surviving local browser audit, shared readiness/focus/geometry helpers, D1/process lifecycle and current browser failure evidence.
- Non-goals: Do not relax keyboard/375px assertions, scroll a failing heading into compliance, add blanket retries, remove distinct locale/accessibility states, or add a production browser tour.
- Acceptance: Current ArrowRight and assurance-heading behavior is tested deterministically with bounded useful diagnostics; obsolete helpers/wrappers/fixtures and identical visits are removed; deliberate defects still fail.
- Validation: Focused affected-case repetition with pinned runtime/Chromium and fresh local D1; deliberate focus/navigation/layout defect cases; full exact-head browser acceptance and canonical CI.
- Authorities: scripts/site-browser-audit.ts; scripts/run-site-accessibility-audits.ts; scripts/lib/demo-289-content-review.ts; scripts/lib/ci-diagnostics.ts; docs/CI-DIAGNOSTICS.md; docs/ACCESSIBILITY.md; docs/accessibility-manual-verification.json.

#### Subtasks (about 10 minutes each)

- [ ] 01. Read complete current failing-run/attempt evidence for ArrowRight and the 375px heading; distinguish actual focus/layout defects, readiness races and zero-step runner cancellations.
- [ ] 02. Locate the existing selected-tab/pane and workbench mount/busy predicates; choose one shared readiness condition for the current UI.
- [ ] 03. Check actual selected-category focus before dispatching ArrowRight; keep the real keyboard path instead of directly invoking the controller.
- [ ] 04. Wait on the intended current workbench state with a bounded budget and emit safe selected/focused/busy state on failure.
- [ ] 05. Read heading geometry until consecutive measurements settle within a bounded budget, then apply the existing first-viewport assertion unchanged.
- [ ] 06. Replace scattered fixed waits where a current readiness condition exists; preserve any distinct required timing behavior until it is proved by that condition.
- [ ] 07. Remove the DEMO-289-specific readiness helper after its current consumers use the shared primitive; delete its legacy-only fixture cases.
- [ ] 08. Remove genuinely identical page/state/media visits while keeping distinct locale, viewport, no-JavaScript, reflow and keyboard coverage.
- [ ] 09. Fold the single-audit wrapper timing/error behavior into the existing diagnostic runner and preserve checkout-owned process/D1 cleanup.
- [ ] 10. Exercise affected cases with deliberate wrong focus/missing mount/out-of-viewport heading; confirm the assertions fail rather than retry into a pass.
- [ ] 11. Run bounded affected-case repetitions and one full browser pass, update diagnostics guidance, and compare durations/failure evidence using existing output.

### DEMO-502 — [BUILD] Replace redundant CI jobs with two real acceptance jobs

- Dependency: DEMO-497, DEMO-498, DEMO-499, DEMO-500, DEMO-501
- Why: Reduce runner setup and stale-head work and allow browser failures to rerun without repeating source acceptance.
- Scope: Canonical grouped acceptance runner, source/browser CI jobs, prepared browser inputs, diagnostics and the matching bounded required-check migration.
- Non-goals: Do not add aggregate/green-relay jobs, a second hand-maintained core suite, path-based skipped-suite passes, cross-head reuse, bypass actors, or cancellation of main/release/deploy jobs.
- Acceptance: Source validate and browser both execute the canonical required groups on the final head; identity/secrets/advisory/patch gates retain blocking behavior; old job/status surfaces are retired; protections and consumers match.
- Validation: Pure group-coverage and failure-propagation tests; fresh D1/build-input failure cases; exact-head executable CI; read-only live settings before and independently after the authorized bounded apply.
- Authorities: package.json; scripts/lib/acceptance-plan.ts; scripts/ci-validation.ts; scripts/lib/ci-diagnostics.ts; .github/workflows/ci.yml; config/github-repository-settings.json; scripts/validate-github-repository-settings.ts; scripts/lib/exact-tag-release.ts; scripts/lib/git-demo-workflow.ts; docs/CI-DIAGNOSTICS.md; docs/ARCHITECTURE-STANDARD.md section 27.

#### Subtasks (about 10 minutes each)

- [ ] 01. Define source/browser groups in the single canonical execution plan; show their union covers all current credential-free check stages exactly once.
- [ ] 02. Wire npm run check to run all groups by default and allow focused selection through the same runner; keep advisory and committed-range patch checks separate from credential-free check.
- [ ] 03. Make source validate run pinned setup/install, early PR identity, current source/unit/contract/governance/secret stages and committed-range validation.
- [ ] 04. Move the sole CI network advisory query from the old security job into its own labelled source diagnostic stage using the same locked install.
- [ ] 05. Declare the minimal prepared build outputs required by browser acceptance; create a bounded artifact from the producing run/head with no database, installed tree or credentials.
- [ ] 06. Make browser consume only the matching producing-run/head outputs; reject missing/stale inputs instead of borrowing another head or rebuilding a hidden acceptance suite.
- [ ] 07. Give browser its own fresh migration/D1 context, bounded audit and guaranteed cleanup; keep default local/tagged acceptance using the same logical plan.
- [ ] 08. Retain failed/not-run/exit-code diagnostics per actual stage and upload failure evidence through existing machinery in each executable job.
- [ ] 09. Set explicit source/browser time bounds and PR-number concurrency that cancels only superseded PR-head runs.
- [ ] 10. Update committed required checks to validate/browser and update settings-policy assertions without changing current-base strictness, squash-only, no-bypass or immutable-tag rules.
- [ ] 11. Update cutter and live-controller check consumers to require both real jobs and the exact head; delete hardcoded four-job fixtures and obsolete status consumers.
- [ ] 12. Exercise current identity, secret, inventory, advisory, patch and browser failures to prove merge blocking and no skipped/cancelled-child success.
- [ ] 13. Read live open PRs/rulesets before the bounded migration, stage exact-head coverage safely, apply only the reviewed check-list change and independently reread protection; maintain protection throughout.
- [ ] 14. Remove old change-id/security/secrets job surfaces without permanent compatibility wrappers; verify a failed-browser-only rerun preserves completed source evidence on the same head.
- [ ] 15. Update README, change-management, diagnostics and architecture command contracts together and compare existing PR/main runner and stage timings.

### DEMO-503 — [BUILD] Use one automatic identity and protected merge path

- Dependency: DEMO-499, DEMO-502
- Why: Eliminate repeated ID selection, metadata copying and merge-text recovery while retaining exact-head protection.
- Scope: Shared controlled identity allocation, authoring metadata, PR/squash validation and the current ordinary/live delivery boundary.
- Non-goals: Do not ask the owner to derive IDs, renumber published identities, bypass protection, rewrite history, add an independent merge service, or duplicate the live controller.
- Acceptance: Agents allocate identities from authoritative accepted/queued/open reservations; one controlled record supplies PR/squash text; stale base/head or mismatched metadata blocks mutation; current live delivery shares the same predicates.
- Validation: Current allocator collision/reservation/race cases; moved base/head, non-green checks, title/body drift and suffix cases; dry-run mutation planning; exact-head CI and post-merge identity verification.
- Authorities: scripts/lib/controlled-pr-identity.ts; scripts/lib/live-release-identity.ts; scripts/validate-pull-request-identity.ts; scripts/lib/git-demo-workflow.ts; scripts/git-demo-workflow.ts; .github/workflows/git-demo.yml; docs/CHANGE-MANAGEMENT.md; AGENTS.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Extract one allocator from existing live identity logic using accepted IDs, queued IDs and open-PR title/branch reservations; retain the committed repository identity.
- [ ] 02. Add automatic plan-only identity reservation followed by ordered task assignment so owners never calculate the next ID themselves.
- [ ] 03. Re-read reservations before branch/PR creation and handle a collision by recomputing before publication; never silently renumber an already-published task.
- [ ] 04. Define one controlled subject/body record and normalization rule; preserve required change/reason/risk/actual-validation/source/release fields and high-risk forward recovery controls.
- [ ] 05. Generate the PR title/body from that record, including current request correlation metadata in the same controlled record rather than a parallel narrative.
- [ ] 06. Use the same record for explicit squash subject/body and avoid including the subject twice in the body.
- [ ] 07. Share title/body/branch/queue predicates between the ordinary path, PR validator and current live controller.
- [ ] 08. Re-read mutable PR metadata, current base/head, required checks and mergeability immediately before mutation; require the exact validated head match.
- [ ] 09. Use one protected squash path and retire the auto-merge-stall/manual-text fallback recipe; repository auto-merge capability need not be disabled merely for cleanup.
- [ ] 10. Exercise allocation collisions, moved inputs, non-green checks and body/suffix drift with current pure/planned-mutation fixtures; delete historical recovery/template fixtures.
- [ ] 11. Verify the merged main subject/body and queue transition using existing post-merge evidence; keep branch cleanup and current-main checks.
- [ ] 12. Update current delivery/controller authorities and interfaces so automatic allocation and the single metadata/merge path are the documented behavior.

### DEMO-504 — [BUILD] Release each authorized batch without a routine version PR

- Dependency: DEMO-502, DEMO-503
- Why: Remove an entire routine PR/main CI cycle and make the existing cutter own the batch handoff.
- Scope: Batch version intent, queue retirement handoff, cutter/current deploy readiness and shared current live-release primitives.
- Non-goals: Do not tag each fix, add a readiness service/approval, block on old missing records, alter current versions as parity work, or publish an unapproved batch.
- Acceptance: Authorized target version is selected during batch planning; cutter acts only for that batch with empty queue and successful exact-current-main acceptance; the routine version-only PR and its legacy-only tests are removed.
- Validation: Current readiness fixtures for nonempty/moved queue, absent intent, wrong version, stale CI, conflicting immutable tag and already-published release; current live-demo integration; exact-head CI.
- Authorities: scripts/cut-main-release.ts; scripts/lib/exact-tag-release.ts; scripts/lib/live-release-identity.ts; scripts/release-workflow.ts; .github/workflows/release-cutter.yml; .github/workflows/git-demo.yml; docs/RELEASE-MANAGEMENT.md; docs/CHANGE-MANAGEMENT.md; implementation_plan.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Define target-version and explicit release-intent input in the existing batch planning operation; avoid inferring operator approval from an empty queue alone.
- [ ] 02. Have the automatic allocator reserve the planning identity and queued identities once; carry version intent through the existing controlled metadata.
- [ ] 03. Choose how approved intent survives final task retirement while restoring the byte-identical shared empty queue; do not retain completed-task history in this file.
- [ ] 04. Update current package/lock version metadata only at the designed owner-authorized batch point and preserve package/tag identity checks.
- [ ] 05. Add the queue-empty and authorized-batch predicates to cutter planning alongside exact-current-main CI and both new required jobs.
- [ ] 06. Re-read current main/queue/intent before tag mutation or dispatch and enforce the same current readiness at the existing deployment boundary.
- [ ] 07. Keep immutable annotated-tag conflict detection and already-published-version handling; delete retrospective record/unpublished-old-version blockers.
- [ ] 08. Remove the routine version-only PR route and fixtures requiring it; retain any current product demonstration through shared primitives rather than a legacy compatibility branch.
- [ ] 09. Share current range/version readiness summaries with the live controller and existing Actions summary instead of adding a separate readiness command/report.
- [ ] 10. Exercise absent intent, queue movement, stale CI, tag conflicts and duplicate dispatch against current pure fixtures without mutating production.
- [ ] 11. Update release/change/architecture authorities for one end-of-batch release and forward correction, deleting obsolete recovery/version-only prose.
- [ ] 12. Verify the configured cutter remains a separate serialized post-completed-CI workflow and that normal unpublished intent cannot release early.

### DEMO-505 — [BUILD] Deliver the current shared baseline deployment contract

- Dependency: DEMO-502, DEMO-504
- Why: Remove the duplicate full tagged acceptance run and produce one trustworthy deployment-verification result for automatic recording.
- Scope: Upstream baseline workflow/verifier contract, exact-tag reproduction inheritance, current production verification and safe structured workflow outputs; retire this demo task only once its upstream prerequisite is actually merged.
- Non-goals: Never edit vendored platform/ directly; do not use an unchecked caller, legacy fallback full-check mode, self-declared green proof, broader production token, new credential, provisioning or an additional approval.
- Acceptance: Merged baseline contract verifies trusted completed caller reproduction and exact immutable identity, performs the production build/traffic/version/essential smoke once, exports a safe actual result and retains protected least-privilege deployment.
- Validation: Baseline-owned focused contract/evidence/verification failure fixtures and exact-head CI; exercise wrong repository/run/head/attempt, absent proof, traffic/version/health/asset failure and redacted output; record the merged upstream pin in controlled delivery evidence, not this queue.
- Authorities: platform/deploy/README.md; platform/deploy/verify.mjs; platform/vendor.lock.json; upstream baseline .github/workflows/deploy-worker.yml and its repository/secret/deployment authorities; docs/RELEASE-MANAGEMENT.md; SECURITY.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Read authoritative current baseline source/caller contracts in an authorized baseline execution surface; allocate its own controlled identity automatically and respect its queue.
- [ ] 02. Define the required native caller workflow/run/reproduction identity contract and its safe outputs; do not invent an attestation service.
- [ ] 03. Implement pure evidence predicates for trusted repository/workflow, completed successful reproduction, exact tag/commit/attempt and current declared toolchain/inputs.
- [ ] 04. Implement the read-only native Actions evidence adapter with bounded failures and only the permissions needed for those reads.
- [ ] 05. Verify exact annotated tag, package version, published Release, expected SHA and conformance independently of source acceptance inheritance.
- [ ] 06. Remove baseline npm run check and duplicate migration/browser/unbound build from the verify handoff; missing proof fails to the single caller reproduction path, not a legacy fallback.
- [ ] 07. Retain the final production-bound dependency install/build with WG_VERSION/WG_COMMIT and current pin/conformance checks.
- [ ] 08. Retain protected production approval, per-Worker serialization, no cancellation and provisioning/auto-create disabled.
- [ ] 09. Keep binding Wrangler structured deployment output to the provider Worker Version ID at sole 100% traffic, with a bounded convergence poll.
- [ ] 10. Make public app/version/full-commit convergence a bounded observation of that deployment; report challenge/timeout distinctly and never redeploy just to wait for propagation.
- [ ] 11. Add essential operational health verification to the same verifier and retain identity readiness as information, not proof of an OAuth login.
- [ ] 12. Add the minimal expected browser-asset availability/identity assertions to the verifier; no second production browser suite.
- [ ] 13. Emit one compact result only after required observations succeed, with producing run/attempt, tag/full commit, target/time and actual Worker/traffic/check outcomes.
- [ ] 14. Whitelist safe output fields and reject private account data, credentials or arbitrary raw provider payloads; expose the result through reusable-workflow outputs.
- [ ] 15. Delete baseline legacy caller/recovery fixtures and update current contract tests/runbook; prove bad evidence and real verification defects still fail.
- [ ] 16. Deliver the upstream controlled change and verify its authoritative merge/CI; complete this demo parent with evidence of that upstream prerequisite, leaving the vendor adoption to the next task.

### DEMO-506 — [OPS] Record verified deployment success automatically

- Dependency: DEMO-505
- Why: Remove the follow-up OPS PR, its full CI cycle and the manually maintained deployment ledger.
- Scope: Re-vendor the merged baseline contract, consume its result in the existing Release publisher, durable current success schema, retry semantics and retirement of legacy deployment records/tests.
- Non-goals: Do not touch another session's DEMO-495 delivery, backfill old records, create an archive/database/service, repeat smoke/build/tests, add production credentials/approval, or record unperformed checks.
- Acceptance: A verified successful deploy writes a durable producing-run/attempt-bound Release result before pipeline success; persistence retry preserves deployment identity without redeploy/approval; legacy record PR/Markdown/schema support is deleted.
- Validation: Current pin/conformance, result schema, success/failed-verification/missing-output/write-failure/idempotent-retry cases; Release workflow contract and exact-head CI; actual production proof only in the later authorized final batch.
- Authorities: platform/vendor.lock.json; platform/deploy/README.md; .github/workflows/release.yml; scripts/release-workflow.ts; docs/RELEASE-MANAGEMENT.md; docs/OPERATIONS.md; scripts/validate-documentation-cleanup.ts; tests/demo-305-release-operations-acceptance.test.ts; SECURITY.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Resolve the exact upstream merged pin from the prior controlled delivery and re-vendor platform/ through its supported vendor mechanism.
- [ ] 02. Update the reusable workflow call pin/required inputs and verify vendor integrity, conformance and caller proof binding against that same commit.
- [ ] 03. Define a strict compact current success schema: immutable tag/full commit, target/time, producer run/attempt/approval link, Worker version/traffic and observed verification outcomes.
- [ ] 04. Consume only the successful trusted baseline output; reject absent, mismatched, malformed, private or unperformed result fields.
- [ ] 05. Choose an append-only asset identity from the producing deploy run/attempt; publication retries keep that producer identity.
- [ ] 06. Implement one lightweight result-publication job in the existing Release workflow using bounded Release permissions and no checkout/install/build/test/environment approval.
- [ ] 07. Attach the structured result durably to the existing GitHub Release and render the same safe result in the existing summary.
- [ ] 08. Treat verification success plus publication failure as deployment verified/record incomplete; keep overall pipeline completion red until persistence succeeds.
- [ ] 09. Implement idempotent record-only retry: match an existing asset or publish the retained result, refuse conflicting content and never redeploy solely for paperwork.
- [ ] 10. Retire docs/history/DEPLOYMENTS.md when automatic deployment results become authoritative; remove its presence/format requirements and legacy record/backfill fixtures.
- [ ] 11. Remove routine post-deploy OPS branches/PR instructions and previous-release archaeology/rollback-ledger fields from the current authority.
- [ ] 12. Point current release/operations/governance links at automatic results and reconcile documented health/assets guarantees with actual verifier behavior.
- [ ] 13. Exercise failed verification, forged/stale output, upload failure, matching retry and conflict cases with current safe fixtures.
- [ ] 14. Verify publication has no full acceptance, rebuild, production credential, second approval or separate smoke execution; require actual durable success rather than an expiring log.

### DEMO-507 — [OPS] Consolidate current assurance monitoring

- Dependency: DEMO-500, DEMO-506
- Why: Remove repeated scheduled validation and make present failures actionable without maintaining retrospective run evidence.
- Scope: One scheduled static/clock/live operations context, existing monitor diagnostics/tracking issue and current response ownership.
- Non-goals: Do not add a flake ledger, backfill history, duplicate deployment acceptance, change five-minute collection/365-day retention, invent login/cost proof, or create a new notification/automation service.
- Acceptance: Each current static/freshness/live assertion executes once per monitor run; failure/recovery is actionable under an explicit owner; native old runs need no curated reconstruction.
- Validation: Current expired-observation/security-disclosure, live-path/network failure, current recovery/issue transition and cancelled-run cases; focused monitor/availability contracts and exact-head CI.
- Authorities: .github/workflows/assurance-monitor.yml; scripts/validate-assurance-operations.ts; scripts/lib/assurance-validation.ts; docs/OPERATIONS.md; docs/ASSURANCE.md; SECURITY.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Trace the full assurance validation plus monitor:assurance path and identify the operations predicates currently executed twice.
- [ ] 02. Select one current monitor entrypoint/context that composes static, clock-sensitive and live checks without a second acceptance definition.
- [ ] 03. Reuse shared assurance inputs/predicates from the consolidation task and remove the second static operations invocation.
- [ ] 04. Keep observation freshness and security-disclosure expiry evaluated against the current run clock, not inherited source-time evidence.
- [ ] 05. Keep live disclosure/private-reporting requests and bounded network-error handling; preserve meaningful failed versus unknown outcomes.
- [ ] 06. Reuse the existing issue for failure/recovery with safe run/head links; make zero-step cancellation distinguishable from a tested assertion failure.
- [ ] 07. Name the responsible current operator/authorized repair session in the runbook and existing issue guidance without adding another approval or notification system.
- [ ] 08. Delete retired monitor fixtures, manual flake registers and retrospective failure-reconstruction requirements.
- [ ] 09. Verify five-minute Worker collection and 365-day retention contracts remain intact and are not replaced by the daily monitor.
- [ ] 10. Exercise current freshness/live/failure/recovery cases, update scheduled command guidance and compare existing run timings.

### DEMO-508 — [CHORE] Remove obsolete operational interfaces and complete current-only integration

- Dependency: DEMO-497, DEMO-498, DEMO-499, DEMO-500, DEMO-501, DEMO-502, DEMO-503, DEMO-504, DEMO-505, DEMO-506, DEMO-507
- Why: Finish removal of dead operational paths and ensure the resulting process has only supported current contracts.
- Scope: Remaining script aliases, demo-local secret provisioning/supersession helpers, obsolete validation/test/docs references and final integrated batch verification.
- Non-goals: Do not rotate/delete production secrets as cleanup, edit platform/ directly, restore retired fixtures with shims, add another umbrella gate, change unrelated product behavior or publish without explicit batch intent/Jacob approval.
- Acceptance: Only current interfaces/fixtures/authorities remain; every retained assertion has a current owner; obsolete paths have no consumers; two real CI groups, single tag reproduction and automatic recording work together; final publication requires approved version/intent and protected approval.
- Validation: Focused current tooling/security/command contracts; whole canonical acceptance and failure cases on final exact head; live protection/pin verification in authorized delivery; one final owner-authorized batch release/production approval/result, with no version/record PR.
- Authorities: package.json; scripts/provision-worker-secret.ts; scripts/validate-worker-secrets.ts; scripts/validate-security.ts; README.md; SECURITY.md; docs/CHANGE-MANAGEMENT.md; docs/RELEASE-MANAGEMENT.md; docs/CI-DIAGNOSTICS.md; docs/OPERATIONS.md; AGENTS.md.

#### Subtasks (about 10 minutes each)

- [ ] 01. Search current code/workflows/docs for remaining calls to superseded entrypoints; classify each by a supported current contract rather than its filename or historical ID.
- [ ] 02. Delete demo-local secret provisioning script/alias and the retired DEMO_ADMIN_PASSWORD branch; point current operators at baseline ownership without touching secret values.
- [ ] 03. Remove --superseded and obsolete deployment-era inventory branches; retain --provisioned only if it is an explicit current operator interface, with current-schema tests rather than legacy compatibility.
- [ ] 04. Remove unowned package aliases and dead wrapper/helper modules after their owning replacements are in place.
- [ ] 05. Replace duplicated hardcoded baseline SHA/no-local-deploy fixtures with one current pin/deployment-boundary contract derived from vendor.lock.json.
- [ ] 06. Delete remaining fixtures that freeze retired inline scripts, four-job topology, old recovery data, obsolete generated/register formats or legacy record fields; do not rename them to keep old support alive.
- [ ] 07. Keep distinct current negative/security/keyboard/schema cases in current domain tests, using current inputs and pure predicates instead of repeated checkout subprocesses.
- [ ] 08. Remove obsolete literal-prose/retired-token shape assertions while preserving actual reachable-secret detection and current shell/admin/namespace authorization boundaries.
- [ ] 09. Update README and current linked authorities so commands, ownership, two-job protection, release intent and success recording agree; preserve shared root contract and empty-plan bytes.
- [ ] 10. Run current canonical groups/negative cases and confirm removed paths have no active consumers, no conditional legacy fallback or green-relay job remains.
- [ ] 11. Compare existing CI stage durations/runner allocations to the initial baseline and summarize observed savings in the controlled delivery evidence, without a permanent benchmarking ledger.
- [ ] 12. Retire this final task and restore the shared empty queue in its controlled commit; after validated merge verify current main/protection/cleanup and, for Jacob's explicitly approved batch version/intent, complete one final cutter/reproduction/production approval/deploy/result handoff without another version or record PR.
