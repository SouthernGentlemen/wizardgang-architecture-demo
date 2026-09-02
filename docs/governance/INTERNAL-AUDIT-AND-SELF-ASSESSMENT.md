# Internal Audit and Self-Assessment Program

**Reference:** WG-GOV-012  
**Applies to:** ISO/IEC 27001:2022 §9.2.1–§9.2.2 · ISO/IEC 42001:2023 §9.2.1–§9.2.2  
**Status:** Proposed  
**Owner:** Management-System Owner  
**Approval:** Controlled pull request and merge  
**Program review:** At least annually and after material scope, risk, audit, supplier, architecture, security, or AI-capability change

## 1. Purpose

This document establishes the internal-audit program for the WizardGang Architecture Demo information security management system (ISMS) and AI management system (AIMS).

The program is designed for a deliberately small operating model where the same person may perform several management and engineering roles. That operating model does not remove the requirement for objective evaluation.

For that reason, this program distinguishes between:

- **self-assessment** — a useful operator review of the system, controls, evidence, and management-system records; and
- **formal internal audit** — a planned, evidence-based evaluation performed with sufficient objectivity and impartiality for the audited subject.

A self-assessment is not represented as an independent internal audit when the reviewer is auditing their own decisions or work without meaningful safeguards.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification or evidence that a formal internal audit has already been completed.

## 2. Audit Objectives

The internal-audit program evaluates whether the integrated management system:

1. conforms to WizardGang's own management-system requirements;
2. is implemented and maintained as described;
3. addresses applicable ISO/IEC 27001 and ISO/IEC 42001 requirements within the declared scope;
4. uses applicable controls and exclusions consistently with the Statements of Applicability;
5. maintains traceable evidence for public assurance claims;
6. identifies material security, AI, supplier, accessibility, operational, and governance gaps rather than hiding them;
7. operates the approved risk, objective, monitoring, change, release, and corrective-action processes;
8. preserves the distinction between implemented controls and unverified assumptions;
9. produces findings that are assigned, tracked, and followed through; and
10. provides management review with a reliable view of management-system effectiveness and unresolved weaknesses.

## 3. Audit Principles

Audits and self-assessments follow these principles:

### 3.1 Evidence based

Conclusions must be based on retained evidence, observable behavior, records, interviews where applicable, tests, repository history, operational data, or other verifiable sources.

A requirement is not treated as satisfied solely because a policy says it should happen.

### 3.2 Proportionate

Audit depth is based on scope, risk, change, prior findings, operational importance, and the consequences of control failure.

### 3.3 Objective

The reviewer must disclose conflicts and avoid presenting self-review as independent assurance.

### 3.4 Traceable

Audit criteria, samples, evidence, findings, decisions, and follow-up must be reconstructable from the retained record.

### 3.5 No synthetic conformity

Missing, stale, inaccessible, or unreliable evidence is recorded as an evidence limitation or finding. It is not converted to a pass.

### 3.6 Improvement oriented

The purpose of an audit is to test the management system and drive corrective or improvement work where needed, not to manufacture a compliance score.

## 4. Audit Types

### 4.1 Continuous control review

Routine engineering and operational checks may continuously test parts of the management system, including:

- CI and controlled-history validation;
- dependency/security checks;
- release and deployment traceability;
- health and uptime monitoring;
- operational logs and audit events;
- MCP/AI evaluation cases;
- accessibility verification;
- risk-register review;
- objective measurement;
- evidence-freshness review;
- supplier monitoring; and
- corrective-action follow-up.

These checks provide useful audit evidence but are not, by themselves, a formal internal audit.

### 4.2 Self-assessment

A self-assessment is performed by the owner/operator or another person who may also be responsible for the audited work.

Self-assessment may be used to:

- prepare for a formal audit;
- identify obvious gaps;
- review checklist and SoA status;
- test whether evidence links still work;
- validate management-system records against current architecture;
- review risk and objective status;
- and identify corrective or improvement work.

A self-assessment record must be labeled **Self-Assessment** and must not imply independence that does not exist.

### 4.3 Formal internal audit

A formal internal audit is a planned evaluation against defined criteria and scope, performed with sufficient objectivity for the subject being audited.

Where the owner/operator is directly responsible for the audited activity, objectivity may be established by:

- using another competent reviewer who did not perform the audited work;
- using an external qualified reviewer;
- dividing the audit so the reviewer does not evaluate their own decisions where practical; or
- applying another documented safeguard that credibly reduces self-review bias.

If adequate objectivity cannot be established, the activity remains a self-assessment and the limitation is recorded.

### 4.4 External or certification audit

An external assessment or certification audit is outside this program unless separately commissioned.

Nothing in this repository represents an accredited certification audit or ISO certification.

## 5. Audit Program

The Management-System Owner maintains the audit program.

The program considers:

- importance of the processes being audited;
- current security and AI risks;
- residual risk level;
- material changes since the previous audit;
- supplier changes;
- incidents and near misses;
- previous findings;
- missed or at-risk objectives;
- stale or missing evidence;
- changes to ISO/WCAG alignment claims;
- changes to AI intended use, authority, data, providers, affected parties, or human oversight;
- and results of monitoring and management review.

### 5.1 Minimum cadence

The integrated management system should receive formal internal-audit coverage at least annually once the program is operational.

Higher-risk areas may be audited more frequently based on events or findings.

Event-driven audits or focused reviews may be initiated after:

- a material security or AI incident;
- a significant control failure;
- a major architecture or supplier change;
- material expansion of AI authority or data access;
- repeated failed objectives;
- a major compliance/evidence regression;
- or a management-review decision.

### 5.2 Coverage model

Full management-system coverage may be achieved through one integrated annual audit or several focused audits whose combined scope covers the required processes during the audit cycle.

The program should maintain visibility of which areas were:

- audited;
- self-assessed only;
- not yet audited;
- deferred with rationale; or
- outside scope.

## 6. Core Audit Areas

The audit program should consider the following areas over the audit cycle.

### Governance and management system

- organizational context;
- interested parties;
- scope;
- leadership and policies;
- roles and authorities;
- risk methodology and risk registers;
- objectives;
- management-system change planning;
- support/document control;
- operational planning;
- monitoring and measurement;
- management review;
- corrective action and continual improvement.

### ISO/IEC 27001 security management

- Statement of Applicability;
- authentication and authorization;
- secrets and credential handling;
- secure development and change;
- release integrity;
- logging and monitoring;
- incident readiness;
- supplier/cloud governance;
- vulnerability/dependency handling;
- backup/recovery and continuity evidence;
- data and persistence controls;
- privileged administration;
- evidence retention and traceability.

### ISO/IEC 42001 AI management

- AI policy and responsibility;
- AI system boundary and intended use;
- AI risk register;
- AI impact assessment;
- AI tool inventory and authority;
- data inputs and outputs;
- transparency and limitations;
- human oversight;
- evaluation and test evidence;
- foreseeable misuse;
- supplier/model/provider dependencies;
- incident and concern handling;
- capability-change reassessment;
- AI-specific SoA controls.

### Accessibility and public assurance

Accessibility is not an ISO 27001/42001 certification claim, but it is part of the declared public assurance posture and may be sampled where relevant to management-system objectives, risk, evidence freshness, or user-facing claims.

Audit sampling may therefore include:

- WCAG evidence freshness;
- manual versus automated evidence distinction;
- public claim wording;
- evidence links;
- and whether known gaps remain visible.

## 7. Audit Criteria

Each audit must define its criteria before conclusions are reached.

Criteria may include:

- approved WizardGang policies and governance documents;
- management-system scope;
- risk methodology;
- Statements of Applicability;
- security and AI objectives;
- repository change/release/operations procedures;
- ISO/IEC 27001 requirements applicable to the declared scope;
- ISO/IEC 42001 requirements applicable to the declared scope;
- contractual, legal, supplier, or interested-party requirements where actually identified and applicable;
- and other explicitly adopted internal requirements.

ISO control text should be paraphrased or referenced by identifier rather than copied into repository records.

## 8. Audit Plan

Before a formal internal audit, the audit record should define:

- audit identifier;
- audit type;
- date or period;
- auditor/reviewer;
- independence/objectivity statement;
- scope;
- criteria;
- objectives;
- systems/processes included;
- exclusions and rationale;
- sampling approach;
- evidence sources;
- prior findings to follow up;
- and planned report location.

A suggested audit ID format is:

- `AUDIT-2026-001` for formal internal audits; and
- `SELF-2026-001` for self-assessments.

Identifiers are retained even when a record is superseded or cancelled.

## 9. Auditor Competence and Objectivity

The auditor or reviewer should understand the portions of the management system they evaluate.

Relevant competence may include:

- security and AI management-system requirements;
- audit principles and evidence evaluation;
- the repository/change/release model;
- Cloudflare and GitHub architecture relevant to the audit;
- application security and authorization boundaries;
- AI/MCP architecture and limitations;
- risk assessment;
- accessibility where included in scope;
- and the ability to distinguish evidence from assertion.

### 9.1 Conflict disclosure

Each formal audit record must state whether the auditor:

- designed the audited control;
- implemented the audited control;
- approved the audited decision;
- owns the audited risk;
- owns the audited process; or
- has another relationship that may affect objectivity.

A conflict does not automatically prohibit all review, but the safeguard or limitation must be explicit.

### 9.2 Small-operator safeguard

For this project, the owner/operator may perform broad self-assessment because it is useful and efficient.

However, where a formal internal audit is claimed, material areas in which the owner/operator directly designed, implemented, and approved the control should receive independent review or a documented objectivity safeguard.

If that cannot be provided, the result is labeled self-assessment rather than independent internal audit.

## 10. Audit Evidence

Evidence may include:

- controlled governance documents;
- Git commits and branch history;
- pull requests and review discussion;
- workflow runs and CI artifacts;
- tags and releases;
- deployment/version metadata;
- D1 audit events;
- bounded application logs;
- health and availability observations;
- risk registers and treatment records;
- SoAs;
- AI impact assessments;
- MCP/AI evaluation results;
- accessibility manual/automated evidence;
- supplier records;
- incident records;
- recovery tests;
- objective measurements;
- corrective-action records;
- management-review records;
- and direct observation of system behavior.

Evidence must be sufficient for the conclusion being made.

## 11. Sampling

An audit does not need to inspect every record where representative sampling provides reasonable evidence.

Sampling should be risk based.

Examples include:

- recent production releases;
- high-risk `DEMO-###` changes;
- privileged/admin changes;
- a representative set of security and AI risks;
- selected SoA controls across different domains;
- recent supplier/dependency changes;
- MCP approved and prohibited cases;
- recent accessibility evidence;
- and any previously failed or overdue areas.

Sampling limitations must be documented where they materially affect the conclusion.

## 12. Finding Classification

Findings may be classified as:

- **Conforming** — sampled evidence supports the applicable criterion;
- **Observation** — noteworthy condition that does not currently demonstrate a requirement failure;
- **Opportunity for improvement** — improvement that is not required to correct a nonconformity;
- **Minor nonconformity** — a limited or isolated failure to meet an applicable management-system requirement;
- **Major nonconformity** — a systemic, repeated, or material failure that substantially undermines a required process, control, or management-system outcome;
- **Evidence limitation** — insufficient, stale, inaccessible, or unreliable evidence prevents a supported conclusion.

Classification is based on impact and evidence, not on the desire to minimize the number of findings.

## 13. Finding Record

Each material finding should record:

- finding ID;
- audit ID;
- criterion/reference;
- affected process/control;
- classification;
- condition observed;
- evidence;
- why the condition matters;
- responsible owner;
- required correction or corrective action where applicable;
- target date;
- status;
- verification method;
- effectiveness result when completed;
- and closure authority/date.

A suggested identifier is `FIND-2026-001`.

Findings that require engineering or documentation change should reference the normal issue and `DEMO-###` change process.

## 14. Audit Report

A formal audit report should contain at minimum:

1. audit identifier and dates;
2. auditor/reviewer and objectivity statement;
3. scope and criteria;
4. sampling performed;
5. evidence sources;
6. summary conclusion;
7. findings by classification;
8. unresolved previous findings;
9. limitations;
10. required follow-up;
11. report owner;
12. next audit/review expectation.

The report may conclude that the sampled system is generally effective while still containing findings. It must not imply certification.

## 15. Follow-Up and Corrective Action

Nonconformities and other material findings are tracked through the management system until appropriately resolved or otherwise dispositioned.

Follow-up should determine:

- whether immediate correction occurred;
- whether root or contributing causes need analysis;
- whether corrective action was assigned;
- whether related risks or SoA statuses require update;
- whether policies, objectives, monitoring, or controls require change;
- whether a related AI impact assessment requires reassessment;
- whether the treatment was implemented;
- and whether effectiveness was verified.

A finding is not closed solely because a remediation commit merged.

Closure requires evidence that the issue was appropriately resolved and, where applicable, that the corrective action was effective.

## 16. Relationship to Risk and Management Review

Audit results are inputs to:

- security and AI risk reassessment;
- objective status;
- Statements of Applicability;
- corrective action;
- resource decisions;
- supplier review;
- AI impact reassessment;
- and management review.

Management review should consider at minimum:

- completed audits and self-assessments;
- major/minor nonconformities;
- overdue findings;
- repeated findings;
- audit limitations;
- whether auditor competence/objectivity was adequate;
- and whether audit coverage remains appropriate for current scope and risk.

## 17. Audit Records and Retention

Audit records are controlled documented information.

Recommended repository structure:

```text
docs/governance/audits/
  AUDIT-PROGRAM.md        # optional rolling schedule/index
  AUDIT-2026-001.md       # formal internal audit
  SELF-2026-001.md        # self-assessment
```

Supporting evidence may remain in its authoritative system rather than being copied into the audit report. The audit record should reference it sufficiently to support later reconstruction.

Git history preserves revisions of repository-controlled audit records.

Sensitive evidence must not be placed into the public repository merely to support an audit. Where evidence cannot be public, the audit record should identify the evidence type and controlled location without exposing secrets or private data.

## 18. Initial Program State

At adoption of this document:

- the internal-audit process is **defined**;
- routine engineering review and management-system self-assessment evidence already exists in parts of the repository;
- a completed formal internal audit is **not** claimed;
- auditor independence for a future formal audit has **not** yet been established;
- no historical audit report is fabricated retroactively;
- and the first formal audit or explicitly labeled self-assessment must be recorded as a separate operational artifact.

The initial audit program should prioritize:

1. management-system scope and governance completeness;
2. security and AI risk/treatment records;
3. SoA accuracy;
4. privileged access, secrets, release integrity, and recovery gaps;
5. MCP authority, AI evaluation, and impact-assessment boundaries;
6. supplier governance;
7. incident and corrective-action readiness;
8. objective measurement and evidence freshness;
9. accessibility/public assurance evidence; and
10. follow-up of known Gap/Partial controls.

## 19. Supporting Evidence

Primary supporting material includes:

- `docs/governance/ROLES-RESPONSIBILITIES.md`;
- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/soa/ISO-27001-SOA.md`;
- `docs/governance/soa/ISO-42001-SOA.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- `docs/governance/registers/OBJECTIVES.md`;
- `docs/governance/MONITORING-MEASUREMENT-EVALUATION.md`;
- `docs/governance/OPERATIONAL-PLANNING-CONTROL.md`;
- `docs/governance/OPERATIONAL-RISK-AND-AI-REASSESSMENT.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/EVIDENCE.md`;
- `SECURITY.md`;
- and retained repository/runtime evidence.

## 20. Alignment

This program supports:

- **ISO/IEC 27001:2022 §9.2.1 — General internal-audit requirement**;
- **ISO/IEC 27001:2022 §9.2.2 — Internal-audit programme**;
- **ISO/IEC 42001:2023 §9.2.1 — General internal-audit requirement**;
- **ISO/IEC 42001:2023 §9.2.2 — Internal-audit programme**.

**Current posture after approval:** the internal-audit and self-assessment process, criteria, responsibilities, objectivity rules, finding model, evidence expectations, and follow-up process are defined. A completed formal internal audit remains future operational evidence and is not implied by approval of this document.
