# Implementation plan

## Execution rules

Priority: reduce runtime first, then handoffs/complexity and redundant ownership; explicitly remove legacy support throughout.

- The remaining parent deliveries are assigned **DEMO-507 through DEMO-508** in execution order.
- IDs are assigned by the agent. Reconcile new reservations automatically with authoritative main/open work through the normal delivery process; never ask the owner to calculate IDs or silently renumber published tasks. Start implementation only on the owner's delivery instruction.
- Work the first open parent task only. Each parent is one controlled delivery/commit/PR; its checkboxes are implementation units, not separate PRs or IDs. Retire only the parent completed by its delivery and preserve the remaining queue.
- Each checkbox targets roughly **10 minutes of hands-on work**. Dependency installation, CI/runner waits, upstream merge waits and Jacob's approval are outside that estimate. Split an unexpectedly large checkbox within its parent rather than inventing another delivery or weakening validation.
- Delete fixtures whose sole purpose is a retired workflow, old provider pin, historical metadata failure or obsolete schema/interface. Do not preserve them with compatibility flags, aliases, exception tables, shims or a legacy suite. Keep a fixture only for a supported current behavior or failure contract.
- Code, current tests, obsolete-fixture deletion and authority/documentation changes travel together. Use existing diagnostics/timings; do not add a readiness service, aggregate status job, flake ledger or benchmarking workflow.
- Common delivery validation remains focused current evidence plus canonical final-exact-head CI and every active required check, pinned toolchains, current-base protected squash, post-merge verification and branch cleanup. Advisory queries and committed-range checks stay explicitly separate from credential-free check.
- Implement baseline-owned work in its owning repository and vendor its merged commit; never patch platform/ independently. Production secrets/settings/traffic are not cleanup targets. Release only one completed authorized batch through Jacob's protected production approval.

## Open tasks

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
