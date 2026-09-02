# Backup, Recovery, and Restore Assurance

**Reference:** WG-GOV-018  
**Applies to:** ISO/IEC 27001:2022 backup, continuity, recovery, operational resilience, and information-protection controls · ISO/IEC 42001:2023 operational continuity, data, logging, supplier, and AI-boundary requirements where recovery affects the AIMS  
**Status:** Proposed  
**Owner:** Operations Owner / Management-System Owner  
**Approval:** Controlled pull request and merge  
**Review:** At least annually, after a material data/storage/runtime/supplier change, after a failed recovery test, and after an incident that invokes recovery

## 1. Purpose

This procedure defines how the WizardGang Architecture Demo plans for backup, reconstruction, recovery, and restore testing across the scoped application, data, configuration, release, evidence, and AI/MCP boundaries.

The objective is to make recoverability testable rather than assumed. The repository already preserves source and release history and supports redeployment of an existing tagged release, but persistent D1/R2 recovery and broader configuration reconstruction still require explicit backup/export evidence and completed restore tests.

Approval of this procedure establishes the recovery process. It does **not** claim that D1 or R2 backups already exist, that a restore has been successfully completed, that provider-internal backups have been independently verified, or that a formal recovery-time or recovery-point objective has been achieved.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Recovery Principles

Recovery follows these rules:

1. **Recover from known-good state.** Source and application recovery starts from an identified reviewed commit and semantic release/tag rather than an arbitrary working tree.
2. **Source recovery and data recovery are different controls.** A reproducible application build does not restore lost D1 rows, R2 objects, secrets, or provider configuration.
3. **Provider capability is not evidence by itself.** Cloudflare or GitHub may provide platform resilience or backup features, but WizardGang does not call them effective recovery controls until the relevant capability, configuration, and restore path have been verified.
4. **Backup success is not restore success.** A backup/export record is useful evidence only when its integrity and restore usability can be demonstrated proportionately.
5. **Secrets stay secret.** Recovery documentation identifies required secret names, owners, and provisioning steps but never stores secret values in public source or public evidence.
6. **Evidence is preserved where practical.** Recovery should restore the service without silently destroying the audit trail needed to understand the event.
7. **Recovery must preserve control boundaries.** Restored systems must retain authentication, authorization, logging, supplier, accessibility, admin, and AI/MCP restrictions.
8. **Degraded operation is acceptable when safer.** A partial service or intentional offline state is preferable to restoring an unverified or unsafe production state.
9. **Actual performance is measured.** Recovery time and recovered data point are recorded during real tests or incidents before stronger RTO/RPO claims are made.

## 3. Recovery Asset Classes

### 3.1 Source, governance, and release history

Includes:

- application source;
- migrations;
- infrastructure/application configuration stored in source;
- management-system documents and registers;
- `DEMO-###` controlled history;
- semantic tags and release records;
- CI/workflow definitions;
- release and deployment documentation.

**Primary recovery source:** Git repository history and retained semantic tags/releases.

The existing release process can manually deploy an existing semantic tag, checks out the exact tag, runs validation, applies D1 migrations, injects version/SHA metadata, deploys the Worker, and verifies `/version` and `/health`.

**Current evidence posture:** Strong reconstruction path for source-controlled state. This does not prove independent GitHub-hosted backup or availability during a GitHub outage.

### 3.2 Cloudflare Worker and runtime configuration

Includes:

- Worker source and deployable bundle state;
- `wrangler` configuration and bindings stored in source;
- non-secret resource identifiers supplied through controlled deployment configuration;
- DNS/custom-domain and provider-side settings not fully represented in source;
- runtime service bindings for D1, R2, and Durable Objects where configured.

**Recovery expectation:** Reconstruct from reviewed source plus authorized provider configuration and verified resource bindings.

Provider-side configuration not represented in Git must be included in recovery checklists or export evidence where practical. Unknown or undocumented provider settings remain a recovery gap.

### 3.3 D1 persistent data

D1 stores dynamic system and evidence data including application/demo records, audit events, operational/control state, health observations, public-safe application logs, usage snapshots, and other tables defined by migrations.

Not all D1 data has the same recovery priority:

- **authoritative/current state** — data required for correct application, admin, authorization, governance, or demo behavior;
- **audit/evidence state** — records whose loss weakens traceability or investigation;
- **reconstructable telemetry** — health, usage, and diagnostic history that may be useful but can begin accumulating again after recovery.

**Current evidence posture:** Schema/migrations are source-controlled, but a completed independent D1 backup/export and restore test has not yet been evidenced. D1 recovery therefore remains a material open treatment under `SEC-RISK-007` and `SEC-OBJ-004`.

### 3.4 R2 object data

R2 may contain demo objects or other content that cannot always be reconstructed from the application repository.

Each material object set should be classified as either:

- **reconstructable** — can be regenerated from retained source or another authoritative input; or
- **non-reconstructable** — requires a retained backup/copy/export strategy.

**Current evidence posture:** R2 readiness is part of operational health where configured, but a completed R2 backup/restore test has not yet been evidenced.

### 3.5 Secrets and credential recovery

Required secret names and responsibility boundaries are documented in `SECURITY.md` and release/identity documentation. Secret **values** are intentionally excluded from source.

Recovery must therefore include a controlled way to re-provision required credentials, such as:

- Cloudflare-managed Worker secrets;
- GitHub-managed repository/action secrets;
- deployment and analytics credentials;
- webhook signing secrets;
- identity-provider secrets/signing material where an identity scenario is active;
- administrator credentials;
- session/signing secrets.

The public repository may document names, purpose, scope, owner, and rotation/re-provisioning steps, but never the values.

**Current evidence posture:** Secret separation is established. Independent recoverability of all secret values is not assumed from that separation and must be verified by the authorized operator without exposing them publicly.

### 3.6 Management-system and operational evidence

Repository-controlled governance records are retained through Git history. Operational evidence stored only in D1 or provider systems may be lost if those systems are lost and no export exists.

Recovery planning must therefore distinguish:

- evidence reconstructable from GitHub source/release history;
- evidence retained in Cloudflare/D1/R2;
- evidence available only from a supplier;
- and evidence whose loss is accepted as low-priority telemetry versus evidence required for audit, incident, risk, or public-assurance traceability.

## 4. Recovery Priority

The current internal recovery priority is:

| Priority | Capability / asset | Recovery intent |
|---|---|---|
| P0 | Authorized control of repository/provider accounts, known-good release identity, required credentials | Re-establish trustworthy control before restoring service |
| P1 | Worker/runtime, `/version`, `/health`, critical D1 application/control state | Restore safe and identifiable service operation |
| P2 | Required R2 objects and other non-reconstructable demo content | Restore functional content after core trust boundary is operating |
| P3 | Historical telemetry, usage snapshots, public-safe logs, nonessential diagnostic history | Restore when retained/needed; otherwise resume collection with loss documented |

Priority does not authorize unsafe shortcuts. If critical control state cannot be trusted, the demo may remain intentionally offline while recovery continues.

## 5. Backup and Export Expectations

The following are management-system expectations after approval. Planned work remains a gap until implemented and evidenced.

### 5.1 Git/source

- retain complete source history and semantic tags/releases in the authoritative repository;
- preserve local or alternate clones where maintained as practical resilience, without representing an unverified clone as a formal backup;
- ensure tagged source remains sufficient to reproduce the intended build;
- verify release identity through commit SHA and semantic tag.

### 5.2 D1

A controlled D1 backup/export mechanism must be established and documented.

Minimum expectations:

- capture data needed to restore authoritative/current state and required audit evidence;
- perform a backup/export before material destructive migrations or bulk data changes where practical;
- establish a recurring backup/export cadence proportionate to data change and recovery need;
- record backup/export timestamp, scope, source environment, integrity information where available, location class, owner, and retention;
- keep backup data protected from public disclosure and unauthorized modification;
- document tables intentionally excluded because they are reconstructable or low-value telemetry.

Until the actual mechanism and cadence are implemented and verified, this requirement remains **Planned / Gap** rather than an operating control.

### 5.3 R2

For each material R2 data set:

- classify reconstructable versus non-reconstructable content;
- retain an inventory or manifest sufficient to determine what should exist;
- establish backup/copy/export for non-reconstructable objects;
- capture pre-destructive-change backup evidence where practical;
- validate selected object integrity during restore tests.

Until an actual R2 backup/restore method is evidenced, recovery assurance remains incomplete.

### 5.4 Configuration and secrets

- keep non-secret configuration and deployment definitions in controlled source where practical;
- maintain an authorized recovery inventory for secret names, owners, purpose, source-of-truth location, and re-provisioning path;
- review recovery metadata after secret/provider changes;
- never copy secret values into Git, public issues, public logs, test records, or management-system evidence.

### 5.5 Retention

Retention must be based on recovery need, evidence need, storage sensitivity, and supplier capability. This procedure does not invent a universal legal retention period.

When a retention period becomes contractually, legally, or operationally required, it must be recorded in the relevant data, supplier, incident, or management-system record.

## 6. Recovery Triggers

Recovery or restore procedures may be invoked for:

- failed or harmful release;
- D1 corruption or loss;
- R2 loss or unintended deletion;
- Cloudflare configuration loss or environment reconstruction;
- credential compromise requiring rotation/re-provisioning;
- supplier incident;
- accidental destructive change;
- security or AI/MCP incident;
- failed migration;
- repository or release-history loss/unavailability;
- or planned restore testing.

Not every incident requires full restoration. The Incident Owner and Operations Owner choose the least disruptive safe recovery path appropriate to the event.

## 7. Restore Workflow

A normal restore/reconstruction follows this sequence where applicable:

1. **Authorize and define scope.** Identify the incident/test, recovery owner, target environment, affected assets, and whether production changes are permitted.
2. **Preserve evidence.** Capture relevant logs, audit events, release identity, data state, error evidence, and supplier information before overwriting recoverable evidence where practical.
3. **Contain unsafe state.** Use rollback, maintenance/offline state, credential rotation, access restriction, or other containment when necessary.
4. **Select known-good application state.** Identify reviewed commit and semantic tag/release.
5. **Validate recovery inputs.** Confirm source/release identity and backup/export scope, timestamp, integrity, and authorization.
6. **Reconstruct platform state.** Re-establish Worker/configuration/bindings and required secrets using authorized sources.
7. **Apply schema/migrations carefully.** Use the expected migration sequence for the recovered release and data state.
8. **Restore D1/R2 as applicable.** Restore only the intended data sets into an isolated/non-production target first when feasible.
9. **Validate application integrity.** Confirm `/version`, `/health`, routes, data access, expected records/objects, and important control behavior.
10. **Validate security and AI boundaries.** Confirm authentication/authorization, admin state, public-safe logging, webhook controls, MCP read-only tool inventory, namespace validation, and the approved Codex/Claude-only AI/MCP supplier boundary.
11. **Return service deliberately.** Move from offline/degraded/test state to normal operation only after required validation passes or an explicit residual limitation is accepted.
12. **Record outcome.** Capture actual duration, recovered data point, missing data/evidence, defects, follow-up actions, and whether risk/SoA/objectives/supplier/incident records require update.

## 8. Restore Validation

A restore is not successful merely because deployment completes.

Validation should include, as applicable:

- expected commit SHA and semantic version;
- build/CI validation appropriate to the release;
- `/version` consistency;
- `/health` and dependency readiness;
- D1 schema and selected record counts/content checks;
- R2 manifest/object presence and selected integrity checks;
- admin/offline state behavior;
- authentication and authorization boundaries;
- secrets absent from public source/logs/evidence;
- public logging and audit-event behavior;
- expected webhook or integration validation where in test scope;
- accessibility-critical navigation/failure behavior where recovery affects UI;
- MCP tool inventory and read-only/non-destructive annotations;
- approved-read, unknown-method, invalid-scope, and other current MCP evaluation cases;
- Codex and Claude remaining the only approved AI/MCP connection families;
- absence of unintended new provider or permission paths;
- and explicit recording of lost/unrecoverable evidence.

Failed validation keeps the recovered environment out of normal production service unless management explicitly accepts a bounded temporary limitation.

## 9. Recovery Time and Recovery Point

The current public demo has no contractual SLA, RTO, or RPO defined by this procedure.

The first restore exercise must record:

- time from exercise start to safe service availability;
- time to restore each major asset class;
- timestamp/data point represented by the restored D1/R2 data;
- data or evidence not restored;
- manual dependencies;
- supplier dependencies;
- and blockers.

Those observed results will inform future internal recovery objectives. Until measured, WizardGang must not claim an achieved RTO/RPO unsupported by evidence.

## 10. Recovery Testing

At least one documented restore/recovery exercise is required annually after this process becomes approved.

The initial exercise is recorded as `RT-001` in `docs/governance/registers/RECOVERY-TEST-REGISTER.md` and is due **2026-12-02**, consistent with `SEC-OBJ-004`.

The first exercise should test, in an isolated or otherwise controlled environment where practical:

- checkout of a known-good semantic tag;
- clean application reconstruction;
- configuration/binding reconstruction;
- authorized secret re-provisioning without exposing values;
- D1 export/restore using the implemented mechanism;
- selected R2 object restore or reconstruction;
- `/version` and `/health` verification;
- selected data-integrity checks;
- admin/offline behavior;
- release/deployment traceability;
- public-safe logging;
- and MCP/AI boundary validation including the Codex/Claude supplier restriction.

A tabletop walkthrough may support planning but does not replace the required technical restore exercise for `SEC-OBJ-004`.

## 11. Failed Tests and Recovery Findings

A failed or materially incomplete restore test must not be reported as a pass.

The result must identify:

- failed stage;
- missing backup/export;
- corrupt or unusable recovery input;
- configuration/secret dependency;
- supplier limitation;
- excessive manual work;
- data/evidence loss;
- control regression;
- measured recovery time/point where available;
- and required corrective/treatment action.

Material findings feed:

- `SEC-RISK-007` and related security risks;
- supplier review for GitHub/Cloudflare or another involved supplier;
- `SEC-OBJ-004` status;
- Statements of Applicability;
- incident/corrective-action records where applicable;
- management review;
- and controlled `DEMO-###` changes.

## 12. Recovery During Security or AI Incidents

Recovery must not erase the distinction between restoring operation and resolving an incident.

For security or AI/MCP incidents:

- preserve evidence before destructive restoration where practical;
- rotate or revoke compromised credentials before reuse;
- do not restore a known-vulnerable release merely because it is operational;
- reassess AI authority/data/provider/impact assumptions if the incident involved the MCP boundary;
- do not add another AI/MCP provider as an emergency substitute without the supplier and AI governance process;
- retain Codex and Claude as the only approved AI/MCP families unless a separate controlled change approves otherwise;
- connect recurring/systemic recovery defects to corrective action.

## 13. Supplier Considerations

GitHub and Cloudflare are Critical suppliers in the current register.

A supplier outage may prevent normal recovery steps. Therefore:

- GitHub unavailability may block hosted PR/workflow/release evidence even when a local clone exists;
- Cloudflare unavailability may prevent runtime or managed-data restoration until the provider recovers or a separately planned migration exists;
- provider resilience, backup, or disaster-recovery claims are supplier evidence and are not represented as WizardGang restore evidence without validation;
- recovery plans must document when they rely on provider availability rather than pretending an immediate alternate platform exists.

## 14. Records and Evidence

Recovery evidence may include:

- test identifier and date;
- trigger/scenario;
- owner and participants;
- source semantic tag/commit;
- backup/export identifiers and timestamps without exposing sensitive location details;
- asset classes restored;
- start/end timestamps and measured duration;
- recovered data point;
- validation checks/results;
- defects and lost data/evidence;
- screenshots/logs where safe;
- related incident/risk/supplier/SoA/objective references;
- corrective actions;
- approval/closure decision;
- and next test date.

Sensitive backup contents, secret values, private infrastructure identifiers, and credentials must not be committed to the public repository.

## 15. Current Posture

After approval of this procedure:

- source/release reconstruction is **documented and supported by existing Git/release mechanics**;
- D1 backup/export and restore assurance remains **incomplete until an actual mechanism and test are evidenced**;
- R2 backup/restore assurance remains **incomplete until material objects are classified and tested**;
- secret/configuration recovery remains **partially evidenced** because required names and managed-secret boundaries exist but full re-provisioning has not been demonstrated as a recovery exercise;
- formal recovery-time/recovery-point performance remains **unmeasured**;
- `SEC-OBJ-004` remains **Planned** until the required technical restore exercise is completed and evidenced.

Procedure approval must not automatically change a Gap/Partial control to Met.

## 16. Supporting Records

- `docs/governance/registers/RECOVERY-TEST-REGISTER.md`
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`
- `docs/governance/registers/OBJECTIVES.md`
- `docs/governance/registers/SUPPLIER-REGISTER.md`
- `docs/governance/INCIDENT-MANAGEMENT.md`
- `docs/governance/NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md`
- `docs/RELEASE.md`
- `docs/RELEASE-MANAGEMENT.md`
- `docs/OPERATIONS.md`
- `docs/EVIDENCE.md`
- `SECURITY.md`
- migrations and deployment workflows

## 17. Alignment

This procedure supports the scoped ISO/IEC 27001 backup, ICT readiness, continuity, recovery, logging/evidence, supplier, and operational-control requirements and the ISO/IEC 42001 requirements affected by operational recovery of the AI/MCP boundary.

**Current posture after approval:** Recovery process defined; source reconstruction path exists; D1/R2 restore effectiveness and measured recovery performance remain operating-evidence gaps. Alignment is uncertified.
