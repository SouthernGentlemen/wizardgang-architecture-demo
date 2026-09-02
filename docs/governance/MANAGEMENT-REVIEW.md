# Management Review

**Reference:** WG-GOV-014  
**Applies to:** ISO/IEC 27001:2022 §9.3.1–§9.3.3 · ISO/IEC 42001:2023 §9.3.1–§9.3.3  
**Status:** Approved
**Owner:** Management-System Owner  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review cadence:** At least annually and after material events that justify an out-of-cycle review

## 1. Purpose

This document defines the management-review process for the WizardGang Architecture Demo integrated information-security management system (ISMS) and AI management system (AIMS).

Management review is the point where management evaluates whether the management system remains suitable, adequate, and effective and makes explicit decisions about priorities, resources, risk, controls, objectives, corrective actions, and improvement.

The review process reuses repository-native evidence wherever practical. It does not create a separate reporting bureaucracy and does not treat automated checks as a substitute for management judgment.

Approval of this document establishes the process only. It does **not** claim that a management review has already been completed.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Review Authority

The **Management-System Owner** is accountable for management review.

The owner may obtain input from the roles defined in `docs/governance/ROLES-RESPONSIBILITIES.md`, including:

- Information Security Owner;
- AI Governance Owner;
- Technical System Owner;
- Change and Release Authority;
- Operations Owner;
- Evidence and Document Custodian;
- Risk Owners;
- Supplier and External-Service Owner;
- Incident and Corrective-Action Owner;
- Accessibility Verification Owner;
- and an Internal Auditor / Independent Reviewer where one has been used.

The same person may hold several roles in the current small-operator model, but management decisions must remain explicit and attributable.

Automation may summarize evidence or calculate measurements, but it may not:

- accept material residual risk;
- approve policy exceptions;
- approve management-system scope changes;
- close material nonconformities without accountable review;
- or substitute for the management-review decision itself.

## 3. Cadence

A full management review is performed at least annually.

The initial management-system review should occur after enough operating evidence exists to evaluate the first objective period, risk-treatment progress, monitoring results, and assurance activities.

An out-of-cycle review should be considered when any of the following occurs:

- a material security or AI incident;
- a Critical residual risk or material increase in risk;
- a significant audit or self-assessment finding;
- repeated or serious objective failure;
- a major supplier failure or dependency change;
- a material change to scope or architecture;
- a material change to AI intended use, authority, data, provider, affected parties, or human oversight;
- a significant legal, contractual, interested-party, or standards change;
- a major continuity or recovery failure;
- persistent evidence staleness or control failure;
- or another condition indicating the management system may no longer be adequate or effective.

## 4. Review Inputs

The review uses current evidence rather than unsupported statements of compliance.

At minimum, the following inputs are considered where applicable.

### 4.1 Status of previous management-review actions

For reviews after the first, management considers:

- completed actions;
- overdue actions;
- actions found ineffective;
- decisions that changed scope, policy, risk acceptance, objectives, controls, resources, or suppliers;
- and any unresolved items carried forward.

The first review records that no previous management-review actions exist rather than fabricating historical actions.

### 4.2 Changes in internal and external issues

Management reviews material changes to:

- organizational context;
- management-system scope;
- public exposure and operating model;
- architecture and hosting;
- GitHub and Cloudflare dependencies;
- identity providers;
- open-source dependencies;
- legal, contractual, or interested-party requirements where identified;
- accessibility commitments;
- AI capability and intended use;
- AI provider/model dependencies;
- and other conditions that can affect the ISMS or AIMS.

Relevant sources include:

- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- `docs/governance/SCOPE.md`;
- architecture and operations records;
- supplier records when established;
- and controlled changes since the previous review.

### 4.3 Interested-party requirements and communications

Management considers material feedback, requests, concerns, incidents, security reports, accessibility findings, AI-related concerns, supplier communications, and other relevant input from interested parties.

The review does not invent feedback where no record exists.

### 4.4 Policy suitability

Management reviews whether the information-security and AI policies remain appropriate to:

- current scope;
- current architecture;
- current risk;
- current AI capability;
- interested-party requirements;
- and operating practice.

Material changes use the controlled Git process.

### 4.5 Objectives and measurements

Management reviews the security, AI, and governance objectives in `docs/governance/registers/OBJECTIVES.md` and the supporting measurements defined in `docs/governance/MONITORING-MEASUREMENT-EVALUATION.md`.

For each objective, the review should determine:

- current status;
- measured result;
- evidence freshness and reliability;
- variance from target;
- whether the metric remains useful;
- whether the target remains proportionate;
- required action;
- and whether resources or priorities should change.

`Not measured` and `Not enough evidence` are valid management inputs and must not be converted into synthetic success.

### 4.6 Security risks and treatments

Management reviews:

- High and Critical security risks;
- material changes in likelihood or impact;
- overdue treatment actions;
- treatments awaiting effectiveness verification;
- residual risks requiring acceptance or rejection;
- new risks from changes, incidents, vulnerabilities, suppliers, or reviews;
- and risks that may be closed or superseded.

Primary evidence includes:

- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/OPERATIONAL-RISK-AND-AI-REASSESSMENT.md`;
- and linked implementation/effectiveness evidence.

Management review does not automatically accept residual risk. Acceptance remains an explicit decision under the risk-management methodology.

### 4.7 AI risks and impact assessment

Management reviews:

- High and Critical AI risks;
- material AI risk-treatment progress;
- evaluation failures or coverage gaps;
- changes in AI authority, intended use, data, provider, affected parties, or oversight;
- foreseeable misuse;
- known limitations;
- AI-related incidents or concerns;
- and whether the current impact assessment remains valid.

Primary evidence includes:

- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- AI/MCP evaluation evidence;
- and controlled AI-related changes.

The current impact assessment applies only to the assessed read-only public MCP capability. Management must not reuse that conclusion after a material capability change without reassessment.

### 4.8 Statements of Applicability and control posture

Management considers whether:

- control applicability remains valid;
- N/A rationales remain valid;
- Partial or Gap controls need changed priorities;
- implemented controls have sufficient evidence;
- risk treatment or scope changes require SoA updates;
- and public assurance statements still match the actual control posture.

Primary evidence includes both Statements of Applicability under `docs/governance/soa/`.

SoA review does not convert Partial or Gap controls to Met without evidence.

### 4.9 Monitoring and operational performance

Management reviews relevant performance and control signals, including where available:

- production traceability;
- CI and validation results;
- health and availability;
- logs and audit-event trends;
- administrative state changes;
- vulnerability/dependency findings;
- secret-protection findings;
- usage and degradation behavior;
- evidence freshness;
- and recurring control failures.

The monitoring catalog defines measurement sources and limitations.

### 4.10 Incidents, nonconformities, and corrective action

Management reviews:

- material security incidents;
- AI incidents or harmful/unexpected behavior;
- operational incidents;
- material near misses;
- management-system nonconformities;
- corrective actions;
- overdue actions;
- root or contributing causes where analysis was warranted;
- and evidence of corrective-action effectiveness.

Absence of recorded incidents does not by itself prove incident readiness.

### 4.11 Audit and self-assessment results

Management reviews:

- completed internal-audit results where available;
- self-assessment results;
- open findings;
- overdue findings;
- repeated findings;
- auditor or reviewer observations;
- corrective-action status;
- and whether the audit program remains appropriate.

The distinction in `docs/governance/INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` remains mandatory: an operator's own review is not represented as an independent audit where independence is absent.

### 4.12 Supplier and external dependency performance

Management considers material external dependencies, including:

- GitHub;
- Cloudflare;
- identity providers when configured;
- package registries and critical open-source dependencies;
- AI/model providers or clients where applicable;
- and other material externally provided services.

Review topics may include:

- availability;
- material incidents;
- security or privacy changes;
- terms or capability changes;
- dependency/version risk;
- concentration risk;
- integration permissions;
- and whether fallback or treatment remains adequate.

Provider-operated controls remain provider controls. Management evaluates WizardGang's supplier selection, configuration, integration, monitoring, and residual dependency risk.

### 4.13 Recovery and continuity evidence

Management considers:

- release rollback capability;
- source reconstructability;
- backup/recovery procedures;
- completed restore tests;
- recovery failures;
- unresolved data-recovery gaps;
- and continuity assumptions for material suppliers.

A documented recovery intention is not equivalent to a demonstrated restore test.

### 4.14 Competence, awareness, communication, and resources

Management reviews whether the roles in scope have adequate:

- competence;
- awareness of policy and risk;
- access to required documentation and evidence;
- communication channels;
- time and technical resources;
- and specialist or independent expertise where required.

Where competence, training, communication, or awareness records are incomplete, that condition is recorded as a gap rather than assumed satisfied.

### 4.15 Opportunities for improvement

Management considers improvements identified through:

- monitoring;
- risks;
- audits;
- self-assessment;
- incidents;
- accessibility findings;
- supplier reviews;
- AI evaluations;
- user feedback;
- operational experience;
- cost/degradation observations;
- and engineering simplification opportunities.

Improvement does not require waiting for a formal nonconformity.

## 5. Review Outputs

A management review must result in explicit conclusions and, where needed, actions.

Outputs should include decisions concerning:

- continuing suitability, adequacy, and effectiveness of the ISMS and AIMS;
- required changes to management-system scope;
- required policy changes;
- objective changes or new objectives;
- risk-treatment priorities;
- residual-risk acceptance, rejection, or escalation decisions where applicable;
- control or SoA changes;
- AI impact reassessment;
- resource needs;
- competence or independent-review needs;
- supplier treatment or replacement;
- incident/corrective-action priorities;
- recovery or continuity improvements;
- monitoring or evidence improvements;
- audit-program changes;
- and continual-improvement actions.

A review may conclude that no change is required for a particular area. That conclusion should still be attributable to the review rather than inferred from silence.

## 6. Decision and Action Record

Every completed management review should retain at least:

- review ID;
- review date;
- review type (`Annual`, `Scheduled`, or `Out-of-cycle`);
- management authority conducting/approving the review;
- participants or contributors;
- evidence period covered;
- scope of the review;
- input summary;
- significant measurements and trends;
- risk decisions;
- AI impact decisions;
- audit/self-assessment findings considered;
- incident/corrective-action status;
- supplier issues considered;
- resource decisions;
- decisions and actions;
- owner for each action;
- target date for each action;
- explicit risk acceptances, if any;
- unresolved matters;
- next planned review;
- and approval evidence.

Recommended repository path:

```text
docs/governance/reviews/MANAGEMENT-REVIEW-YYYY-QN.md
```

A full annual review may use `YYYY-ANNUAL` instead of a quarter where that is clearer.

## 7. Action Tracking

Management-review actions use the ordinary controlled work system rather than a separate hidden tracker.

Where implementation is required, actions should reference as applicable:

- issue/work item;
- `DEMO-###` change;
- risk ID;
- objective ID;
- audit/self-assessment finding ID;
- incident/corrective-action ID;
- supplier record;
- AI impact-assessment reference;
- validation evidence;
- release/deployment evidence;
- and effectiveness verification.

An action is not complete merely because a commit exists. Where the action is intended to change an outcome or control effectiveness, the relevant evidence must be reviewed before closure.

## 8. Approval and Signoff

The management-review record is approved through the controlled repository process.

A completed record should include metadata such as:

```text
Owner: Management-System Owner
Status: Approved
Review date: YYYY-MM-DD
Evidence period: YYYY-MM-DD through YYYY-MM-DD
Approved via: PR #...
Approval commit: <sha>
Next review due: YYYY-MM-DD
```

Merge provides the attributable approval event for the retained record.

Merge does not implicitly:

- accept every residual risk discussed in the review;
- close every finding;
- prove every objective is met;
- or certify the management system.

Any decision requiring distinct acceptance must remain explicitly recorded.

## 9. First Management Review

The first completed management review should explicitly recognize that the management-system layer is newly established.

It should distinguish:

- **processes defined** by the governance baseline;
- **controls already operating** in the engineering/runtime system;
- **initial assessments completed**, such as risk registers and the MCP impact assessment;
- **recurring evidence still pending**, such as formal supplier reviews, recovery tests, competence records, incident exercises, objective history, completed formal internal audit, and corrective-action effectiveness records;
- and **decisions required** to prioritize those gaps.

The first review must not backfill fictional historical reviews, training, incidents, supplier assessments, or audits.

## 10. Relationship to Internal Audit

Internal audit and management review are separate activities.

Internal audit or self-assessment evaluates evidence against defined criteria and identifies findings.

Management review evaluates the broader continuing suitability, adequacy, and effectiveness of the management system and makes management decisions.

Management review may use audit findings as an input, but it does not replace the audit program. Likewise, an audit does not replace management review.

## 11. Relationship to Corrective Action and Continual Improvement

Management-review outputs can trigger:

- correction;
- corrective action;
- risk reassessment;
- risk treatment;
- policy or scope change;
- objective change;
- supplier change;
- AI impact reassessment;
- new monitoring;
- new audit focus;
- or another controlled improvement.

Actions flow back through normal operation and are re-evaluated through monitoring, audit/self-assessment, subsequent management review, or direct effectiveness verification.

## 12. Evidence

Primary supporting evidence includes:

- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- `docs/governance/SCOPE.md`;
- `docs/governance/INFORMATION-SECURITY-POLICY.md`;
- `docs/governance/AI-POLICY.md`;
- `docs/governance/registers/OBJECTIVES.md`;
- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- `docs/governance/soa/ISO-27001-SOA.md`;
- `docs/governance/soa/ISO-42001-SOA.md`;
- `docs/governance/MONITORING-MEASUREMENT-EVALUATION.md`;
- `docs/governance/INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md`;
- `docs/governance/OPERATIONAL-PLANNING-CONTROL.md`;
- `docs/governance/OPERATIONAL-RISK-AND-AI-REASSESSMENT.md`;
- `docs/OPERATIONS.md`;
- `docs/EVIDENCE.md`;
- Git history, PRs, releases, workflow evidence, deployment evidence, logs, audit events, health observations, and other retained operating records.

## 13. Alignment

This process supports:

- **ISO/IEC 27001:2022 §9.3 — Management review**;
- **ISO/IEC 42001:2023 §9.3 — Management review**.

**Current posture after approval:** the management-review process, required inputs, outputs, decisions, evidence, action tracking, and approval model are defined. A completed management-review record remains required operational evidence and is not implied by approval of this procedure.
