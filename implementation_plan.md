# Implementation plan

## Execution rules

Priority: reduce runtime first, then handoffs/complexity and redundant ownership; explicitly remove legacy support throughout.

- The remaining parent deliveries are assigned **DEMO-504 through DEMO-508** in execution order.
- IDs are assigned by the agent. Reconcile new reservations automatically with authoritative main/open work through the normal delivery process; never ask the owner to calculate IDs or silently renumber published tasks. Start implementation only on the owner's delivery instruction.
- Work the first open parent task only. Each parent is one controlled delivery/commit/PR; its checkboxes are implementation units, not separate PRs or IDs. Retire only the parent completed by its delivery and preserve the remaining queue.
- Each checkbox targets roughly **10 minutes of hands-on work**. Dependency installation, CI/runner waits, upstream merge waits and Jacob's approval are outside that estimate. Split an unexpectedly large checkbox within its parent rather than inventing another delivery or weakening validation.
- Delete fixtures whose sole purpose is a retired workflow, old provider pin, historical metadata failure or obsolete schema/interface. Do not preserve them with compatibility flags, aliases, exception tables, shims or a legacy suite. Keep a fixture only for a supported current behavior or failure contract.
- Code, current tests, obsolete-fixture deletion and authority/documentation changes travel together. Use existing diagnostics/timings; do not add a readiness service, aggregate status job, flake ledger or benchmarking workflow.
- Common delivery validation remains focused current evidence plus canonical final-exact-head CI and every active required check, pinned toolchains, current-base protected squash, post-merge verification and branch cleanup. Advisory queries and committed-range checks stay explicitly separate from credential-free check.
- Implement baseline-owned work in its owning repository and vendor its merged commit; never patch platform/ independently. Production secrets/settings/traffic are not cleanup targets. Release only one completed authorized batch through Jacob's protected production approval.

## Open tasks

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
