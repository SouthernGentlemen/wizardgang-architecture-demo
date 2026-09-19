# Assurance, Monitoring, and Audit

**Reference:** WG-GOV-012  
**Applies to:** ISO/IEC 27001:2022 §6.2 and §9.1–§9.2 · ISO/IEC 42001:2023 §6.2 and §9.1–§9.2  
**Status:** Approved  
**Owner:** Management-System Owner  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material scope, risk, objective, audit, supplier, architecture, security, or AI-capability change

## 1. Purpose

This document defines how the WizardGang Architecture Demo measures management-system performance, evaluates evidence, performs self-assessment and internal audit, records findings, and feeds reliable results into management review and corrective action.

It separates operating evidence from conclusions. Automated checks, monitoring, source review, human review, and independent audit may all contribute evidence, but none is represented as something it is not.

Structured assurance records under `assurance/**` remain authoritative for current statuses, relationships, objectives, evidence, findings, and lifecycle state.

## 2. Evidence model and independence

Assurance conclusions must be based on retained, attributable evidence appropriate to the question being evaluated. Missing, stale, inaccessible, or unreliable evidence is recorded as a limitation or finding rather than converted into a pass.

Evidence may include source and contracts, pull requests, CI runs, tests, release/deployment records, provider observations, logs, audit events, structured assurance records, risk and incident records, accessibility evidence, AI evaluations, supplier reviews, and dated assessment records.

A self-assessment is useful but is not described as an independent internal audit when the reviewer is evaluating their own work or decisions without a meaningful safeguard. Formal internal-audit conclusions require sufficient objectivity for the audited subject.

## 3. Monitoring, measurement, analysis, and evaluation

Monitoring and measurement are selected because they help determine whether objectives, controls, risks, and management-system processes are operating as intended.

Each material measurement should identify, as applicable:

- what is measured or evaluated;
- the reason it matters;
- method and data source;
- owner;
- frequency or trigger;
- acceptable threshold, target, or interpretation rule;
- evidence location and retention;
- action expected when results are outside tolerance.

Automated measurements may establish machine-observable facts. Manual or specialist evaluations remain required where judgment, environment, independence, or human interaction is material.

Results are analyzed for trends, repeated failures, material variance, stale evidence, and changes that should affect risk, objectives, controls, suppliers, corrective action, or management review.

## 4. Measurement catalog and objectives

The structured objectives dataset under `assurance/objectives/` is authoritative for current objectives and their relationships. The management system may measure, among other things:

- release and deployment success;
- availability and health;
- failed CI or security validation;
- dependency and vulnerability condition;
- incident and corrective-action status;
- risk-treatment progress and overdue review;
- supplier review status;
- recovery/continuity test results;
- accessibility verification;
- AI/MCP evaluation and boundary results;
- evidence freshness;
- audit/self-assessment findings.

A metric is not retained merely because it is easy to collect. Measurements should be changed or removed when they no longer support a decision, objective, control, or risk.

## 5. Evaluation methods and evidence quality

Evaluation methods include:

- deterministic repository validation;
- unit, integration, protocol, security, accessibility, and AI/MCP tests;
- rendered browser evaluation;
- operational observation;
- source/content review;
- human/manual review;
- supplier review;
- structured self-assessment;
- formal internal audit;
- management review.

Evidence quality depends on scope, freshness, provenance, repeatability, completeness, and whether the method actually evaluates the claimed behavior. One evidence type does not silently substitute for another.

Dated assessments record what was evaluated at that time. Current compliance status remains in structured assurance records and is not inferred from a historical report.

## 6. AI, accessibility, supplier, and operational evaluation

AI evaluation considers intended use, application authority, tool boundaries, data, provider dependencies, foreseeable misuse, invalid-scope behavior, logging, human oversight, and impact/risk assumptions relevant to the scoped capability.

Accessibility evaluation preserves the distinction between automated evidence, source/content review, human browser review, assistive-technology testing, and conformance claims as defined in `docs/ACCESSIBILITY.md`.

Supplier evaluation considers criticality, access, data, service performance, incidents, material provider changes, contractual/technical obligations, concentration risk, and exit or continuity implications.

Operational evaluation considers health, degradation, security events, evidence integrity, continuity/recovery behavior, release/deployment traceability, and any other monitored condition that can affect intended management-system results.

## 7. Audit and self-assessment program

The Management-System Owner maintains an audit program based on process importance, risk, prior findings, material change, incidents, supplier changes, missed objectives, stale evidence, and management-review decisions.

The integrated management system should receive formal internal-audit coverage at least annually once the program is operational. Coverage may be one integrated audit or multiple focused audits whose combined scope covers the required processes during the audit cycle.

Event-driven audits or focused reviews may be initiated after a material security or AI incident, significant control failure, major architecture or supplier change, material AI authority/data expansion, repeated objective failure, serious evidence regression, or management-review decision.

Continuous technical controls and routine reviews are audit evidence but do not by themselves constitute a formal internal audit.

## 8. Audit planning, criteria, and sampling

A formal audit or self-assessment record identifies:

- audit type and whether independence is claimed;
- scope and criteria;
- reviewer and any conflict/independence limitations;
- timing;
- records, systems, processes, and samples reviewed;
- evidence examined;
- findings and their basis;
- required follow-up.

Audit criteria may include WizardGang policies and governance requirements, structured ISO mappings, Statements of Applicability, objectives, risk/treatment requirements, operating procedures, contractual/obligation records, and the actual technical controls represented by the repository.

Sampling is risk based. A sample must be sufficient for the stated conclusion and must not be represented as exhaustive when it is not.

## 9. Auditor competence, objectivity, and independence

The reviewer must have competence appropriate to the scope and disclose material conflicts.

Where the owner/operator is responsible for the audited work, objectivity may be improved by using another competent reviewer, an external specialist, dividing the audit scope, or another documented safeguard. If sufficient objectivity cannot be established, the activity remains a self-assessment.

Nothing in this repository is represented as an accredited certification audit unless such an audit is separately performed and evidenced.

## 10. Findings, reports, and follow-up

Findings identify the requirement or criterion, evidence, condition observed, significance, owner, and required action where applicable.

An audit report states:

- scope, criteria, reviewer, and date;
- method and samples;
- conclusions and limitations;
- findings and evidence;
- unresolved risks or dependencies;
- required follow-up.

Findings feed risk management and corrective action according to significance. Closure requires evidence that the assigned action was completed and, where required, that effectiveness was verified.

## 11. Management review interface

Management review consumes assurance results but remains an accountable management activity governed by `docs/governance/GOVERNANCE.md`.

Assurance inputs include objective performance, risk/treatment status, monitoring trends, audit/self-assessment findings, incidents, nonconformities, corrective actions, supplier performance, recovery/continuity evidence, accessibility evidence, AI evaluations, evidence freshness, and resource or competence limitations.

The audit function does not approve its own unresolved material findings through management review.

## 12. Corrective-action evidence rules

Corrective action is evidenced at the level appropriate to the failure. Evidence should establish:

1. the observed condition and immediate correction or containment where applicable;
2. analysis of cause or recurrence potential when material;
3. the assigned action and owner;
4. controlled implementation;
5. validation that the intended change occurred;
6. effectiveness verification when required;
7. resulting updates to risk, controls, objectives, procedures, or structured assurance state;
8. explicit closure by the authorized owner.

A merged commit or green test alone is not sufficient when the corrective action also requires risk acceptance, human review, operating observation, supplier action, or another non-code result.

## 13. Records, retention, and reporting

Audit plans, reports, findings, evaluations, measurements, and corrective-action evidence are retained through the authority appropriate to the record:

- structured records under `assurance/**`;
- dated assessments under `docs/governance/assessments/`;
- Git/GitHub for controlled changes and historical execution;
- runtime/provider evidence where the observation originates outside the repository.

Reports must distinguish current structured state from dated evidence and avoid presenting counts, scores, or historical summaries as a separate manually maintained assurance authority.

## 14. Review and maintenance

Review this assurance and audit model at least annually and when scope, risk, objectives, evidence methods, audit requirements, suppliers, architecture, security controls, or AI capability materially change.

## Alignment

This document provides the current monitoring, measurement, evaluation, self-assessment, and internal-audit operating model for the in-scope ISO/IEC 27001 and ISO/IEC 42001 requirements. Exact requirement status, applicability, rationale, and documentation relationships remain in structured compliance records.
