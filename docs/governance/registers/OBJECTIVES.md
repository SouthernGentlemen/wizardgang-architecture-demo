# Security and AI Management-System Objectives

**Reference:** WG-OBJ-001  
**Applies to:** ISO/IEC 27001:2022 §6.2 · ISO/IEC 42001:2023 §6.2  
**Status:** Approved
**Owner:** WizardGang  
**Effective:** Upon approval and merge  
**Initial review due:** 2026-12-02  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register defines the initial measurable information-security and AI-management objectives for the WizardGang Architecture Demo.

The objectives convert policy, risk, interested-party, operational, and Statement-of-Applicability requirements into observable targets that can be reviewed through repository, release, runtime, assessment, and management evidence.

This register supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Objective Rules

Each objective must have:

- a permanent identifier;
- a defined owner;
- a measurable target;
- an evidence source;
- a review cadence;
- and a status that reflects observed evidence rather than assumption.

Status values are:

- **Planned** — approved objective but measurement or implementation is not yet established;
- **Active** — measurement is operating and progress can be evaluated;
- **Met** — target is currently satisfied for the defined measurement period;
- **At risk** — target is likely to be missed or evidence is incomplete;
- **Missed** — target was not achieved for the defined period;
- **Retired** — objective is no longer applicable and the reason is retained.

A target is not marked Met merely because a related control exists.

## 3. Initial Objectives

The table below is generated from `assurance/objectives/objectives.json`. It preserves the approved initial state; it is not a later or current objective assessment. Narrative policy remains in this document.

<!-- BEGIN GENERATED ASSURANCE PROJECTION -->

| ID | Area | Objective | Metric | Initial target | Owner | Evidence | Review | Initial status |
|---|---|---|---|---|---|---|---|---|
| AI-OBJ-001 | Bounded AI authority | Keep the public MCP capability within explicitly approved authority. | Exposed MCP tools with documented purpose, authorization boundary, and read/write/destructive classification. | 100% of exposed MCP tools inventoried and classified; 0 unapproved privileged/write/destructive public tools. | AI capability owner | src/api/mcp.ts, MCP tool inventory/evaluation, AI risk register | Each MCP change + quarterly | Active |
| AI-OBJ-002 | AI change reassessment | Ensure material AI capability changes trigger governance review before release. | Material AI changes with documented risk review and, where triggered, updated impact assessment before release. | 100% of material AI authority, data, provider, intended-use, or oversight changes. | Management-system owner / AI owner | DEMO-### history, AI risk register, impact assessments, PR evidence | Each material AI change | Active |
| AI-OBJ-003 | AI boundary evaluation | Expand and maintain executable tests for approved and prohibited AI/MCP behavior. | Defined AI evaluation cases implemented and passing for current capability. | Maintain existing approved-read/unknown-method/invalid-scope cases and add coverage for tool inventory, authorization parity, malformed input, sensitive-field exclusion, and indirect-instruction content by 2026-12-02. | AI capability owner / quality owner | src/api/governance.ts, MCP tests, CI evidence | Each release + quarterly | Planned |
| AI-OBJ-004 | AI data transparency | Make AI-accessible demo data boundaries and limitations inspectable. | AI-facing data surfaces with documented intended data class, provenance/freshness expectations, and limitation statement. | 100% of public AI-accessible data surfaces documented; no known sensitive field exposed through public MCP. | AI capability owner / data owner | MCP contract/source, data-governance record when established, impact assessment, tests | Quarterly + schema/data changes | Planned |
| AI-OBJ-005 | AI risk treatment | Maintain accountable treatment for material AI risks. | High/Critical AI risks with owner, treatment direction, review date, and linked impact assessment where relevant. | 100% of High/Critical recorded AI risks. | Management-system owner | AI-RISK-REGISTER.md, impact assessments, controlled changes | Monthly + management review | Active |
| GOV-OBJ-001 | Evidence freshness | Keep management-system evidence current enough to support public assurance claims. | Governance records past their required review date without review or explicit extension. | 0 critical governance records more than 30 days overdue. | Management-system owner | governance metadata, PR/review history, management review | Monthly + quarterly | Planned |
| SEC-OBJ-001 | Release integrity | Keep every production deployment traceable to reviewed source. | Percentage of production deployments that identify immutable commit SHA, semantic tag/release, and deployment evidence. | 100% of production deployments. | Release owner | Git tags/releases, deploy workflow, /version, docs/RELEASE.md, docs/EVIDENCE.md | Each release + quarterly | Active |
| SEC-OBJ-002 | Secret protection | Prevent credentials and secrets from entering public source or public evidence surfaces. | Confirmed secret exposures in repository, public logs, health/version, or public evidence. | 0 confirmed exposures. Any suspected exposure triggers immediate review and rotation decision. | Security owner | SECURITY.md, CI/security checks, public log behavior, incident/corrective-action records | Continuous + quarterly | Active |
| SEC-OBJ-003 | Risk treatment | Maintain accountable treatment for material security risks. | High/Critical security risks with assigned owner, treatment direction, and review date. | 100% of High/Critical recorded security risks. | Management-system owner | SECURITY-RISK-REGISTER.md, issues/DEMO changes, review records | Monthly + management review | Active |
| SEC-OBJ-004 | Recovery assurance | Establish and evidence recovery for data and deployable application state. | Defined recovery procedure and completed recovery test for in-scope deployable state/data where WizardGang is responsible. | Procedure documented and at least one evidenced recovery test by 2026-12-02. | Operations owner | release/rollback evidence, Cloudflare/D1/R2 recovery documentation, test record | Quarterly | Planned |
| SEC-OBJ-005 | Incident readiness | Ensure material security events are handled consistently and produce corrective evidence. | Material incidents with documented triage, containment/recovery decision, root/contributing-cause review where useful, and follow-up action. | 100% of material incidents after process adoption; incident procedure established by 2026-12-02. | Security owner | incident register/process, logs, audit events, corrective actions | After each incident + quarterly | Planned |
| SEC-OBJ-006 | Supplier governance | Maintain visibility of critical platform and dependency risks. | Critical suppliers/dependencies with owner, role, risk/applicability rationale, and review evidence. | 100% of identified critical suppliers reviewed at least annually and after material supplier change. | Management-system owner | interested-parties register, supplier register when established, risk registers, SoA | Quarterly progress + annual review | Planned |

<!-- END GENERATED ASSURANCE PROJECTION -->

## 4. Measurement Notes

### 4.1 Production deployment traceability

For `SEC-OBJ-001`, a production deployment is traceable when evidence identifies the deployed commit and connects it to the controlled release process. The objective does not require every local or experimental execution to be tagged as a production release.

### 4.2 Zero-exposure targets

`SEC-OBJ-002` uses a zero-tolerance target because confirmed credential exposure is not an acceptable steady-state condition. A suspected exposure is not automatically a confirmed failure, but it must be investigated.

### 4.3 Event-dependent objectives

`SEC-OBJ-005` may have no incident samples during a review period. In that case, absence of incidents does not prove incident readiness. Procedure, exercise, or other readiness evidence is reviewed separately.

### 4.4 AI authority target

`AI-OBJ-001` applies to the current public MCP boundary. The target does not prohibit all future write-capable AI integration. It requires any such authority to be explicitly designed, risk-assessed, impact-assessed where required, authorized, tested, and approved before it becomes part of the public or production capability.

### 4.5 Objective status versus control status

Objective status and checklist/SoA status are related but not interchangeable.

Examples:

- a control may be `Partial` while an associated short-term objective is `Met`;
- a control may be `Met` while an improvement objective remains `Active`;
- an objective may be `Missed` without proving the entire management system is ineffective.

## 5. Evidence and Reporting

Objective evidence should reuse existing operational evidence where possible rather than creating duplicate reporting systems.

Primary evidence sources include:

- Git commits, pull requests, tags, releases, and workflow runs;
- `/version`, `/health`, dashboard, uptime, and public-safe logs;
- D1 audit/event evidence;
- security and AI risk registers;
- Statements of Applicability;
- AI impact assessments and AI evaluations;
- incident and corrective-action records;
- supplier review records;
- and management-review records.

Quarterly or management-review summaries should record, for each objective:

- current status;
- observed metric/result;
- evidence reference;
- material variance from target;
- action required;
- owner;
- and next review date.

## 6. Changes to Objectives

Objectives may be added, changed, retired, or re-baselined when:

- management-system scope changes;
- risk treatment changes;
- a material incident occurs;
- supplier or architecture dependencies change;
- AI authority, intended use, provider, data, or affected parties change;
- a target proves ineffective or disproportionate;
- audit or management review identifies a better measure;
- or an objective has been achieved and a stronger target is appropriate.

Material changes use the normal controlled Git process and retain historical rationale.

## 7. Management Review Interface

Management review must consider:

- which objectives are Met, Active, At risk, or Missed;
- whether the metrics still measure useful outcomes;
- whether resources or treatment priorities should change;
- whether missed objectives require corrective action;
- and whether new objectives are needed because of changed risks, interested parties, incidents, suppliers, or AI capability.

## 8. Alignment

This register supports:

- **ISO/IEC 27001:2022 §6.2 — Information security objectives and planning to achieve them**;
- **ISO/IEC 42001:2023 §6.2 — AI objectives and planning to achieve them**.

**Current posture after approval:** measurable security and AI-management objectives are defined, assigned, reviewable, and connected to evidence; achievement must be demonstrated through future operating records and is not implied by document approval.