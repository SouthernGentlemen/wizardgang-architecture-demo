# Recovery Test Register

**Reference:** WG-REG-005  
**Framework:** Integrated ISMS / AIMS recovery assurance  
**Status:** Approved
**Owner:** Operations Owner / Management-System Owner  
**Initial review due:** 2026-12-02  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register records planned and completed backup/recovery tests for the WizardGang Architecture Demo.

It is intentionally separate from incident history. A restore exercise is not represented as an actual production outage, and a planned exercise is not represented as completed recovery evidence.

The current management-system objective `SEC-OBJ-004` requires a documented procedure and at least one evidenced recovery test by **2026-12-02** for in-scope deployable state and data where WizardGang is responsible.

## 2. Record Types

- `RT-###` — technical recovery/restore test.
- `DR-###` — broader disaster-recovery or provider-loss exercise if one is later performed.

Each record should retain:

- identifier;
- status (`Planned`, `In progress`, `Passed`, `Passed with limitations`, `Failed`, `Cancelled`);
- scheduled/completed date;
- scenario;
- target environment;
- owner/participants;
- source release/tag/commit;
- backup/export inputs;
- assets restored;
- start/end timestamps;
- measured recovery duration;
- recovered data point;
- validation checks;
- lost/unrecoverable data or evidence;
- defects/limitations;
- related risk/objective/supplier/incident/SoA references;
- corrective actions;
- closure decision;
- and next test date.

A record must not be marked `Passed` merely because a deployment succeeded.

## 3. Current Summary

<!-- GENERATED:governance-records:recovery-tests:start -->
| ID | Scenario | Scope | Due | Status | Evidence state |
|---|---|---|---|---|---|
| RT-001 | Clean reconstruction + D1/R2 restore exercise | Known-good release, runtime/config, D1, selected R2, health/version, admin/security/MCP validation | 2026-12-02 | Planned | No completed restore evidence yet |
<!-- GENERATED:governance-records:recovery-tests:end -->

There are currently **no completed recovery tests** recorded in this register.

## 4. RT-001 — Initial Technical Restore Exercise

**Status:** Planned  
**Due:** 2026-12-02  
**Owner:** Operations Owner  
**Related objective:** `SEC-OBJ-004`  
**Primary risk:** `SEC-RISK-007`  
**Supplier dependencies:** `SUP-001` GitHub, `SUP-002` Cloudflare  
**Procedure:** `docs/governance/BACKUP-RECOVERY-RESTORE.md`

### Scenario

Demonstrate that a known-good tagged WizardGang release and its required data/configuration can be reconstructed in a controlled environment after assumed loss of deployable runtime state and selected persistent data.

The exercise should not perform destructive production restoration merely to create evidence. An isolated test environment, temporary database/bucket, or other controlled target is preferred where practical.

### Minimum Preconditions

Before execution:

- select an existing reviewed semantic tag and record the commit SHA;
- identify the target recovery environment;
- identify the D1 backup/export mechanism actually being tested;
- identify selected R2 objects or reconstructable content to test;
- identify authorized secret re-provisioning sources without exposing values;
- record required bindings/resource classes;
- define expected data/object validation samples;
- confirm rollback/cleanup path for the test environment;
- ensure no new AI/MCP provider is introduced as part of the exercise.

If no usable D1 or R2 backup/export mechanism exists when the test begins, the exercise records that condition as a **Failed** or **Passed with limitations** result as appropriate; it must not synthesize backup evidence.

### Test Steps

The planned test covers:

1. obtain/checkout the selected semantic tag;
2. validate source and commit identity;
3. perform clean install/build/validation from the tagged state;
4. reconstruct Worker/configuration/bindings in the controlled target;
5. re-provision required secrets from authorized sources without copying values into the test record;
6. apply the expected migration sequence;
7. restore D1 data using the implemented backup/export method;
8. restore or reconstruct selected R2 objects;
9. deploy/start the recovered application;
10. verify `/version` matches the selected release/commit;
11. verify `/health` and required dependency readiness;
12. validate selected D1 records/schema and R2 object presence/integrity;
13. verify admin/offline behavior;
14. verify authentication/authorization and public-safe logging boundaries;
15. verify the current MCP tool inventory remains bounded/read-only/non-destructive;
16. run current MCP boundary evaluation cases, including approved read, unknown method, and invalid scope;
17. confirm **Codex and Claude remain the only approved AI/MCP client/provider families** and no recovered configuration creates a third provider path;
18. record actual duration, recovered data point, missing data/evidence, manual steps, supplier dependencies, and defects;
19. create corrective actions for material failures;
20. clean up the test target safely.

### Acceptance Criteria

`RT-001` may be marked **Passed** only when the defined exercise scope is restored and validation demonstrates, at minimum:

- exact source/release identity;
- successful application reconstruction;
- required D1 restore for the tested data set;
- selected R2 restore/reconstruction;
- expected version/health behavior;
- no identified secret exposure;
- required admin/auth/logging controls remain effective for the tested scope;
- MCP authority remains within the approved boundary;
- Codex/Claude-only supplier restriction remains intact;
- measured recovery duration and recovered data point are recorded;
- material limitations and lost evidence are recorded rather than hidden.

If D1 or R2 restoration is omitted because no mechanism exists, the test cannot be represented as full recovery assurance for that asset class.

### Evidence to Retain

The completed record should retain public-safe references to:

- selected tag/commit;
- relevant workflow/command/test outputs;
- backup/export identifier and timestamp without sensitive storage details;
- D1/R2 validation summary;
- `/version` and `/health` results;
- MCP boundary/evaluation result;
- measured timestamps;
- observed recovery point;
- defects/limitations;
- related `DEMO-###`, issue, incident, risk, or corrective-action records;
- and final review/closure decision.

Do not retain credentials, secret values, private keys, raw private backup content, private provider account identifiers, or sensitive incident material in this public register.

## 5. Future Test Coverage

After `RT-001`, additional recovery scenarios should be selected based on observed risk and prior results. Candidates include:

- failed D1 migration rollback/recovery;
- accidental R2 object deletion;
- lost/rotated deployment credential re-provisioning;
- GitHub outage with source available from an alternate retained clone;
- Cloudflare provider outage tabletop/migration decision exercise;
- loss of operational evidence while application data remains intact;
- recovery after a security incident requiring secret rotation;
- recovery after an MCP/AI incident while preserving the Codex/Claude-only approved boundary.

Future scenarios are not considered completed until a dated result is entered.

## 6. Measurement and Management Review

Recovery testing feeds:

- `SEC-OBJ-004` status;
- `SEC-RISK-007` residual-risk review;
- supplier review for GitHub/Cloudflare as applicable;
- backup/continuity SoA status and evidence;
- incident/corrective-action processes;
- monitoring and measurement;
- and management review.

Useful measurements include:

- tests planned/completed;
- pass/fail/limitation state;
- measured recovery duration;
- measured recovered data point;
- manual recovery steps;
- failed validation checks;
- data/evidence loss;
- overdue corrective actions;
- time since last successful test.

No contractual SLA, RTO, or RPO is inferred from these measurements unless separately approved and documented.

## 7. Current Posture

The register currently establishes the **planned evidence path**, not a completed recovery result.

`RT-001` remains **Planned** until a real technical restore exercise is performed and reviewed. Therefore `SEC-OBJ-004`, D1/R2 recovery assurance, and related backup controls remain incomplete.

**Current posture after approval:** Restore-test register established; first technical restore exercise due 2026-12-02; no successful restore evidence claimed; alignment is uncertified.
