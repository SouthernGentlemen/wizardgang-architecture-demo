# Leadership and Commitment

**Reference:** WG-GOV-005  
**Applies to:** ISO/IEC 27001:2022 §5.1 · ISO/IEC 42001:2023 §5.1  
**Status:** Approved
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually, during management review, and after material changes to scope, ownership, risk, architecture, suppliers, or AI capability

## 1. Purpose

This document defines leadership accountability and management commitment for the information security management system and AI management system covering the WizardGang Architecture Demo.

The purpose is to ensure that security and AI governance are part of ordinary engineering and operational decision-making rather than separate documentation exercises.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Leadership Model

WizardGang operates the in-scope management systems through a deliberately small operating model.

For this scope, the management-system owner is the person or persons with authority to approve changes to the in-scope system, repository, production configuration, releases, risk decisions, policies, and operating practices.

Where one individual holds multiple roles, the responsibilities remain distinct even when performed by the same person.

The management-system owner is accountable for ensuring that:

- the ISMS and AIMS remain appropriate to the actual system and its risks;
- security and AI-governance requirements are incorporated into normal development, release, deployment, and operations;
- policies and objectives are established and maintained;
- required resources are made available;
- risk and impact decisions are explicitly recorded;
- responsibilities and authorities are understood;
- management-system performance is reviewed;
- identified failures or gaps result in corrective action where appropriate;
- continual improvement is supported;
- and public statements accurately represent an aligned, uncertified posture.

## 3. Integration with Normal Engineering Work

The management systems are not operated as a separate workflow from software delivery.

They are integrated into the repository-native lifecycle:

`requirement → controlled change → review → automated validation → merge → release → deployment → verification → operation → evidence`

Management-system requirements are incorporated through mechanisms including:

- permanent `DEMO-###` change identifiers;
- controlled commit records;
- isolated branches;
- pull requests and review;
- automated CI validation;
- security and dependency validation;
- accessibility and localization validation;
- release records;
- annotated version tags;
- exact-version deployment;
- health and version verification;
- operational monitoring;
- security and application logging;
- audit evidence;
- and management-system governance records under `docs/governance/`.

A control is not considered effective merely because it is documented. Where a control depends on technical behavior, retained evidence, review, assessment, or an actual management decision, that activity must occur.

## 4. Leadership Commitments

### 4.1 Maintain appropriate management systems

Leadership must ensure that the ISMS and AIMS continue to reflect:

- the documented organizational context;
- identified interested parties and relevant requirements;
- the approved management-system scope;
- applicable security and AI risks;
- applicable legal, contractual, supplier, and standards-related obligations;
- the actual deployed architecture;
- and material changes to system behavior or intended use.

### 4.2 Establish policy and objectives

Leadership is responsible for approving and maintaining:

- the information security policy;
- the AI policy;
- management-system objectives;
- risk-management expectations;
- control-selection and applicability decisions;
- and the operating rules required to achieve those objectives.

Policies and objectives must be consistent with the purpose and scope of the demo rather than copied from a generic enterprise template.

### 4.3 Provide resources

Leadership must ensure that the management systems have the resources needed to operate effectively.

Resources may include:

- development and review time;
- GitHub and Cloudflare platform capability;
- logging and evidence storage;
- automated testing and validation;
- security and dependency tooling;
- accessibility verification capability;
- AI evaluation capability;
- documentation and records;
- external expertise where independence or specialized competence is required;
- and time for risk assessment, internal review, corrective action, and management review.

A small operating model does not remove the need for resources; it increases the importance of automation and explicit prioritization.

### 4.4 Promote risk-based decision-making

Security and AI-management decisions must consider risk rather than relying solely on technical convenience.

Leadership is responsible for ensuring that:

- security risks are identified and evaluated;
- AI risks and impacts are identified and evaluated where applicable;
- treatment decisions are recorded;
- accepted residual risk is explicit;
- control exclusions have documented rationale;
- material changes trigger reassessment where appropriate;
- and unresolved high-risk conditions are not silently treated as acceptable.

### 4.5 Support secure and responsible system behavior

Leadership must support architectural and operational practices that preserve:

- least privilege;
- explicit authorization boundaries;
- secure secret handling;
- controlled production changes;
- reproducible releases;
- logging and auditability;
- fail-closed behavior where appropriate;
- graceful degradation;
- accessibility-oriented engineering;
- defined AI system boundaries;
- intended-use constraints;
- human control over privileged actions;
- and traceable evidence.

### 4.6 Support people performing management-system responsibilities

Anyone assigned management-system responsibilities must have sufficient authority, information, access, and competence to perform them.

Where a responsibility cannot be performed credibly by the current operator alone, leadership must either:

- obtain suitable assistance;
- document the limitation and treatment;
- or avoid making a claim that depends on that activity having occurred.

This is especially relevant to activities requiring meaningful independence, specialist accessibility verification, security review, or formal audit competence.

### 4.7 Communicate importance

Leadership must make clear through repository policy, review behavior, and operating decisions that:

- security requirements are part of product requirements;
- AI governance requirements are part of AI feature requirements;
- management-system records are controlled information;
- failed checks must be addressed rather than bypassed without justification;
- evidence must reflect actual behavior;
- and certification or conformance claims must not exceed available evidence.

### 4.8 Enable continual improvement

Leadership must support improvement based on:

- risk assessments;
- incidents and near misses;
- failed tests;
- accessibility findings;
- AI evaluation findings;
- vulnerability findings;
- supplier or platform changes;
- audit or self-assessment findings;
- operational observations;
- management review;
- and changes to relevant requirements.

Improvement work should use the same controlled Git lifecycle as other changes.

## 5. Decision Rights

Within the defined scope, leadership retains authority to:

- approve or reject management-system policies;
- approve or change management-system scope;
- accept or reject residual risks;
- approve risk-treatment plans;
- approve Statements of Applicability;
- approve AI impact and risk decisions;
- authorize production releases;
- approve exceptions to established controls;
- assign corrective actions;
- approve management-review outputs;
- and determine when external expertise or independent assessment is required.

Technical automation may enforce or verify controls, but it does not replace accountable management decisions where judgment or acceptance is required.

## 6. Git-Based Approval Model

GitHub is the primary approval and evidence mechanism for repository-controlled management-system records.

A governance document normally progresses through:

`Proposed → reviewed in pull request → approved by authorized merge → effective repository baseline`

The approval record is the combination of:

- the controlled change ID;
- the pull request;
- review comments or approval where applicable;
- the merge event;
- the resulting commit history;
- and the released version when the governance change is included in a formal release.

The repository history therefore provides the authoritative version and change record.

For material risk acceptance, policy approval, management review, or similar decisions, the relevant document must make the decision explicit rather than relying only on the fact that a commit was merged.

## 7. Management Review Responsibilities

Leadership must periodically review whether the ISMS and AIMS remain suitable, adequate, and effective for the declared scope.

Review inputs should include, as applicable:

- changes in internal or external context;
- interested-party requirements;
- security and AI risk status;
- management-system objectives and performance;
- incidents and significant events;
- audit or self-assessment results;
- accessibility findings;
- AI evaluations and impact findings;
- vulnerability and dependency findings;
- supplier and platform changes;
- corrective actions;
- resource needs;
- opportunities for improvement;
- and changes that may affect management-system scope.

Management-review outputs must identify decisions and actions rather than merely recording that a meeting occurred.

## 8. Evidence of Leadership Commitment

Evidence may include:

- approved governance records;
- pull-request review and merge history;
- security and AI risk decisions;
- Statements of Applicability;
- management-system objectives;
- release approvals and release records;
- corrective-action records;
- internal audit or self-assessment records;
- management-review records;
- allocation of tools or platform resources;
- approved exceptions;
- and controlled changes made in response to identified findings.

Evidence of good engineering alone does not automatically demonstrate all leadership obligations. Decisions that require approval, acceptance, review, or resource commitment must have a corresponding management record.

## 9. Relationship to Existing Controls

This leadership model is supported by existing repository and operational controls including:

- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/RELEASE.md`;
- `SECURITY.md`;
- `docs/OPERATIONS.md`;
- `docs/EVIDENCE.md`;
- GitHub Actions validation;
- GitHub Releases and annotated tags;
- deployment verification;
- health and availability observation;
- and application audit evidence.

These mechanisms provide implementation and evidence. Leadership remains accountable for ensuring that they are appropriate, maintained, reviewed, and improved.

## 10. Review Triggers

This record must be reviewed:

- during scheduled management review;
- when management-system ownership changes;
- when scope changes;
- after a material security or AI incident;
- when a significant AI capability or privileged integration is introduced;
- when a significant supplier or platform dependency changes;
- when management-system responsibilities materially change;
- or when an audit, assessment, or risk review identifies a leadership or governance deficiency.

Changes are controlled through the normal `DEMO-###` Git process.

## 11. Alignment

This document supports:

- **ISO/IEC 27001:2022 §5.1 — Leadership and commitment**
- **ISO/IEC 42001:2023 §5.1 — Leadership and commitment**

**Current posture after approval:** Leadership accountability and management commitment are defined and integrated into the repository-native ISMS/AIMS. Certification is not claimed.
