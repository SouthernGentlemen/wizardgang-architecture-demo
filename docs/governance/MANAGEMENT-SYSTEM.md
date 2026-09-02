# Management System Framework

**Reference:** WG-GOV-004  
**Applies to:** ISO/IEC 27001:2022 §4.4 · ISO/IEC 42001:2023 §4.4  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material changes to scope, risk, architecture, suppliers, AI capability, or management-system requirements

## 1. Purpose

This document defines how WizardGang establishes, operates, maintains, reviews, and improves the information security management system (ISMS) and AI management system (AIMS) for the WizardGang Architecture Demo.

The ISMS and AIMS use the same repository-native management structure wherever requirements overlap. Separate treatment is used where information-security and AI-management requirements differ.

The management system is designed to remain proportional to the size and operating model of the in-scope system while retaining explicit ownership, traceability, evidence, review, and continual improvement.

This document does not represent certification under ISO/IEC 27001 or ISO/IEC 42001.

## 2. Management-System Boundary

The management-system boundary is defined by:

- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- `docs/governance/SCOPE.md`;
- the WizardGang Architecture Demo source repository;
- the production `demo.wizardgang.ai` runtime and associated Cloudflare resources;
- the controlled GitHub delivery and release process;
- the system's administrative, operational, security, accessibility, and AI/MCP controls;
- and the evidence used to demonstrate operation of those controls.

Assets, suppliers, processes, responsibilities, interfaces, and risks are evaluated against that boundary.

## 3. Management-System Model

The ISMS and AIMS operate as a continuous management cycle:

`context → interested parties → scope → policy → risk and impact assessment → control selection → implementation → operation → monitoring → audit and review → corrective action → improvement`

The cycle is implemented through controlled repository artifacts and operational evidence rather than through a separate document-management platform.

## 4. Git as the Management-System Record

GitHub is the authoritative management-system record for documented information that can be safely maintained in the repository.

The repository records:

- management-system policies and procedures;
- scope and context decisions;
- risk and impact records suitable for repository storage;
- Statements of Applicability;
- objectives and review criteria;
- controlled engineering changes;
- pull-request review and approval;
- automated validation results;
- corrective actions;
- release records;
- and management-system history.

Sensitive records that should not be public are retained in an appropriate protected system and referenced without exposing confidential content.

Repository history must not be used as a substitute for controls that require an actual activity to occur. An audit, management review, risk acceptance, incident response, or corrective action is evidenced only when the corresponding activity has actually been performed and recorded.

## 5. Controlled Change and Approval

Management-system documents are subject to the same controlled-change model used by the application.

Meaningful changes receive a permanent `DEMO-###` identifier and proceed through the established lifecycle:

`branch → controlled commit → pull request → automated validation → review → merge`

Where a document states that approval occurs through pull request and merge:

- the pull request provides the review context;
- review comments provide challenge or requested correction where applicable;
- the accepted merge identifies the approved repository state;
- and the resulting commit history provides the retained approval record.

A later change does not overwrite the historical decision; it creates a new controlled revision.

## 6. Policies

Management establishes and maintains policies appropriate to the in-scope system.

At minimum, the management system must include policy direction for:

- information security;
- AI management and responsible AI use;
- risk management;
- access and identity;
- secure development and change;
- incident management;
- supplier and dependency management;
- documented information;
- and other areas required by risk, law, contract, or the Statements of Applicability.

Policies must identify ownership, applicability, approval state, and review expectations.

## 7. Risk and Impact Management

Information-security risks and AI-related risks are managed through documented methods rather than informal engineering judgment alone.

The management system must define:

- risk criteria;
- likelihood and consequence criteria;
- risk ownership;
- treatment options;
- acceptance rules;
- review triggers;
- and retained evidence of risk decisions.

ISO/IEC 42001-related AI risk management additionally includes impact assessment where the intended use, affected parties, foreseeable misuse, limitations, human oversight, or potential consequences require explicit evaluation.

Change risk recorded in individual `DEMO-###` commits is an engineering change-control input and does not replace formal ISMS or AIMS risk assessment.

## 8. Control Selection and Applicability

Controls are selected based on:

- management-system requirements;
- identified risks and impacts;
- interested-party requirements;
- legal, regulatory, and contractual obligations;
- architecture and operating context;
- and applicable ISO control references.

The ISO/IEC 27001 and ISO/IEC 42001 Statements of Applicability record whether each relevant Annex A control is applicable, the rationale for inclusion or exclusion, implementation status, and supporting evidence.

A control marked not applicable must include a documented rationale. Provider ownership of an activity does not automatically make a control not applicable when WizardGang still has configuration, contractual, oversight, integration, or supplier-governance responsibilities.

## 9. Operational Control

The management system is operated through existing technical and procedural mechanisms wherever they already satisfy the intended control outcome.

Examples include:

- Git branch and pull-request control;
- CI validation;
- dependency and source security validation;
- controlled migrations;
- semantic releases and annotated tags;
- exact-tag deployment;
- runtime health and version verification;
- managed secrets;
- authorization boundaries;
- signed webhook validation;
- application and audit logging;
- health and availability observations;
- MCP boundary validation;
- and fail-closed administrative behavior.

Management-system documentation maps these existing mechanisms to the appropriate requirements rather than creating duplicate processes without a defined need.

## 10. Evidence

Evidence must be sufficient to show that a control or management activity actually operated.

Evidence may include:

- repository source;
- controlled commits;
- pull requests and reviews;
- CI workflow results;
- generated validation artifacts;
- test results;
- annotated release tags;
- GitHub Releases;
- deployment records;
- runtime version and health observations;
- security and audit events;
- sanitized operational logs;
- D1 or R2 evidence records;
- accessibility manual-test records;
- AI evaluation results;
- risk acceptance records;
- audit records;
- and management-review records.

Evidence status is not a certification score. A control may have technical evidence while the broader management-system requirement remains incomplete.

## 11. Monitoring and Measurement

The management system defines objectives and measures appropriate to the in-scope system.

Monitoring may include:

- system availability;
- dependency health;
- failed validation;
- security-relevant events;
- release and deployment success;
- corrective-action status;
- risk-treatment progress;
- accessibility verification status;
- AI evaluation results;
- supplier or dependency changes;
- and stale management-system evidence.

Measures are reviewed for usefulness and adjusted when they no longer provide meaningful management information.

## 12. Internal Audit and Self-Assessment

The management system must be periodically evaluated against its defined requirements.

Internal audit or structured self-assessment must:

- define the review scope and criteria;
- examine objective evidence;
- identify conforming, partial, missing, or ineffective practices;
- record findings;
- assign corrective actions where required;
- and retain the completed review record.

Where independence cannot reasonably be demonstrated because of the small operating model, the activity must be described accurately as a self-assessment rather than overstating auditor independence.

## 13. Management Review

Management review evaluates whether the ISMS and AIMS remain suitable, adequate, and effective for the in-scope system.

Review inputs include, as applicable:

- changes to context and interested parties;
- scope changes;
- security and AI risks;
- AI impact assessments;
- objectives and performance;
- incidents and significant failures;
- audit or self-assessment findings;
- corrective actions;
- supplier and dependency changes;
- resource needs;
- opportunities for improvement;
- and changes to applicable standards, laws, contracts, or architecture.

Review outputs include decisions, actions, ownership, and any required management-system changes.

## 14. Nonconformity and Corrective Action

A management-system failure is not closed merely because the immediate technical symptom was fixed.

Where appropriate, corrective action includes:

1. contain or correct the immediate issue;
2. determine whether a broader or recurring cause exists;
3. identify required corrective action;
4. implement the action through controlled change;
5. verify effectiveness;
6. update risks, controls, procedures, or documentation where necessary;
7. retain evidence of closure.

GitHub issues, controlled commits, pull requests, tests, and releases may provide the execution and evidence path for corrective actions.

## 15. Continual Improvement

Improvement is driven by evidence rather than by an assumption that the management system is complete.

Inputs to improvement include:

- identified gaps;
- risk reviews;
- incidents;
- audit findings;
- failed tests;
- accessibility findings;
- AI evaluation results;
- supplier changes;
- operational degradation;
- user or stakeholder feedback;
- and management review decisions.

Improvements are prioritized according to risk, impact, value, feasibility, and management objectives and are implemented through the controlled change process.

## 16. Roles and Responsibility

WizardGang management retains accountability for the ISMS and AIMS within the defined scope.

Specific responsibilities may be assigned for:

- system ownership;
- security;
- AI governance;
- development;
- operations;
- risk ownership;
- control ownership;
- supplier oversight;
- incident response;
- audit or self-assessment;
- and management review.

Where one person performs multiple roles, the responsibilities must still be explicit so that required activities are not lost through assumption.

## 17. Review and Maintenance

This framework must be reviewed:

- at least annually;
- when the management-system scope materially changes;
- when significant new AI capability is introduced;
- following a material security or AI incident;
- following a significant audit finding;
- when the delivery or hosting model materially changes;
- or when applicable management-system requirements materially change.

Changes to this document follow the controlled Git process.

## 18. Supporting Management-System Records

The management system currently includes or is expected to include:

- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- `docs/governance/SCOPE.md`;
- information-security policy;
- AI policy;
- risk-management methodology;
- information-security risk register;
- AI risk register;
- AI impact assessments;
- ISO/IEC 27001 Statement of Applicability;
- ISO/IEC 42001 Statement of Applicability;
- management-system objectives;
- competence and awareness records;
- supplier register and reviews;
- incident and corrective-action records;
- internal audit or self-assessment records;
- management-review records;
- and the repository-native technical and operational evidence already maintained by the project.

## 19. Alignment

This document supports:

- **ISO/IEC 27001:2022 §4.4 — Information security management system**
- **ISO/IEC 42001:2023 §4.4 — AI management system**

**Current posture after approval:** The repository-native ISMS/AIMS operating model is defined and controlled; certification is not claimed.
