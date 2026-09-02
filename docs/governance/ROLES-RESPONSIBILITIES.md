# Roles, Responsibilities, and Authorities

**Reference:** WG-GOV-006  
**Applies to:** ISO/IEC 27001:2022 §5.3 · ISO/IEC 42001:2023 §5.3  
**Status:** Approved
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually, during management review, and whenever ownership, operating responsibilities, scope, suppliers, or AI capabilities materially change

## 1. Purpose

This document assigns and communicates the roles, responsibilities, and authorities required to operate the information security management system and AI management system for the WizardGang Architecture Demo.

WizardGang uses a deliberately small operating model. One person may perform several roles, but the responsibilities remain distinct and must still be performed, evidenced, and reviewed.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Assignment Model

The accountable management authority for the in-scope system is the **WizardGang owner/operator** with authority over the repository, production configuration, releases, policies, scope, risk acceptance, and operating practices.

The role assignments below describe functions rather than requiring separate employees.

Where the same person performs multiple functions:

- accountability does not disappear;
- conflicts of interest must be recognized;
- approvals and risk decisions must remain explicit;
- automated controls may provide evidence but do not replace accountable judgment;
- and activities requiring meaningful independence must be handled separately or accurately described as self-assessment.

Role changes are controlled through the normal Git process and reflected in this record or a linked assignment record.

## 3. Role Definitions

### 3.1 Management-System Owner

**Accountable for:** Overall effectiveness of the ISMS and AIMS.

Responsibilities include:

- maintaining management-system context and scope;
- approving management-system policies and objectives;
- ensuring required resources are available;
- assigning relevant responsibilities;
- approving Statements of Applicability;
- approving material risk treatment and residual-risk acceptance;
- approving significant control exceptions;
- ensuring internal audit and management review occur when required;
- ensuring corrective actions are assigned and followed through;
- and ensuring public assurance statements do not exceed available evidence.

Authority includes:

- approving or rejecting management-system documents;
- changing management-system scope;
- accepting or rejecting residual risk;
- requiring corrective action;
- requiring additional validation or independent review;
- and preventing release or operation where unacceptable risk remains unresolved.

### 3.2 Technical System Owner

**Responsible for:** Architecture, implementation, runtime behavior, and technical integrity of the in-scope system.

Responsibilities include:

- maintaining the architecture baseline;
- implementing technical controls;
- maintaining application and infrastructure configuration;
- preserving environment separation;
- maintaining D1, R2, Worker, Durable Object, identity, API, webhook, and MCP boundaries;
- maintaining health, logging, degradation, and administrative behavior;
- identifying technical changes that require risk or impact reassessment;
- and supporting technical evidence collection.

Authority includes:

- proposing architecture and implementation changes;
- rejecting technically unsafe implementation approaches;
- and requiring technical remediation before a change is considered ready for release.

### 3.3 Information Security Owner

**Responsible for:** Day-to-day security governance within the defined scope.

Responsibilities include:

- maintaining security requirements;
- coordinating security risk assessment and treatment;
- reviewing authentication, authorization, secrets, logging, dependency, and configuration controls;
- reviewing security-relevant changes;
- tracking vulnerabilities and security findings;
- coordinating security incidents and corrective actions;
- maintaining security-control evidence;
- and escalating material residual risk to the Management-System Owner.

The Information Security Owner may recommend risk acceptance but does not silently accept material residual risk on behalf of management.

### 3.4 AI Governance Owner

**Responsible for:** Day-to-day AI governance for in-scope AI and MCP capabilities.

Responsibilities include:

- maintaining the AI policy and AI system boundary;
- defining and reviewing intended use and foreseeable misuse;
- coordinating AI risk and impact assessments;
- reviewing AI permissions, tools, data access, logging, fallback, and human-oversight controls;
- maintaining AI evaluation evidence;
- identifying changes that require renewed risk or impact assessment;
- tracking AI-related findings and incidents;
- and escalating material residual AI risk to the Management-System Owner.

The AI Governance Owner may recommend risk acceptance but does not silently accept material residual risk on behalf of management.

### 3.5 Change and Release Authority

**Responsible for:** Controlled movement of accepted changes into the production baseline.

Responsibilities include:

- enforcing the `DEMO-###` controlled-change model;
- ensuring changes are reviewed and validated before merge;
- maintaining semantic versioning and release records;
- ensuring production deployments correspond to reviewed tagged versions;
- confirming required deployment verification occurs;
- ensuring rollback information exists where required;
- and preventing uncontrolled or untraceable production releases.

Authority includes:

- approving a release when required controls have passed;
- delaying or rejecting a release when validation, risk, evidence, or rollback requirements are incomplete;
- and initiating rollback or recovery where production behavior is unacceptable.

### 3.6 Operations Owner

**Responsible for:** Routine operation and operational evidence of the in-scope service.

Responsibilities include:

- monitoring health and availability;
- reviewing operational logs and service observations;
- maintaining administrative and offline controls;
- tracking degradation and cost-guardrail behavior;
- identifying operational incidents or abnormal conditions;
- maintaining operational records;
- and escalating material operational risks or incidents.

### 3.7 Evidence and Document Custodian

**Responsible for:** Integrity, accessibility, versioning, and traceability of management-system records and engineering evidence.

Responsibilities include:

- keeping management-system documents in controlled source history;
- maintaining evidence references and traceability;
- preserving required release, validation, deployment, operational, audit, and assessment records;
- ensuring superseded records remain reconstructable through version history where required;
- identifying stale or missing evidence;
- and ensuring evidence does not contain secrets or inappropriate private data.

For repository-controlled documents, Git history is the authoritative revision record unless another record is explicitly designated.

### 3.8 Risk Owner

**Accountable for:** A specific identified security or AI risk.

Responsibilities include:

- understanding the assigned risk;
- ensuring treatment actions are defined;
- tracking treatment progress;
- reviewing residual risk after treatment;
- escalating overdue or ineffective treatment;
- and participating in periodic reassessment.

A risk owner may be the Management-System Owner, Technical System Owner, Information Security Owner, AI Governance Owner, Operations Owner, or another explicitly assigned person.

Material residual-risk acceptance remains an accountable management decision.

### 3.9 Supplier and External-Service Owner

**Responsible for:** Governance of in-scope external service dependencies.

Responsibilities include:

- maintaining the supplier register;
- identifying dependencies such as Cloudflare, GitHub, identity providers, and material third-party services;
- evaluating relevant security, availability, privacy, AI, continuity, and service risks;
- maintaining evidence of supplier review where appropriate;
- monitoring material supplier changes or incidents;
- and escalating risks that require treatment or acceptance.

Provider-operated controls do not become WizardGang controls merely because the provider performs them. WizardGang remains responsible for appropriate provider selection, configuration, integration, and monitoring within its scope.

### 3.10 Incident and Corrective-Action Owner

**Responsible for:** Coordination of an assigned security, AI, operational, or management-system incident or nonconformity.

Responsibilities include:

- recording the issue;
- preserving relevant evidence;
- coordinating containment or correction;
- determining whether root-cause analysis is warranted;
- identifying corrective actions;
- assigning and tracking follow-up work;
- verifying effectiveness where appropriate;
- and documenting closure.

Material incidents must be escalated to the Management-System Owner.

### 3.11 Accessibility Verification Owner

**Responsible for:** Coordinating accessibility verification for in-scope public interfaces.

Responsibilities include:

- maintaining the WCAG-oriented verification matrix;
- distinguishing automated checks from manual verification;
- coordinating keyboard, focus, zoom/reflow, assistive-technology, target-size, contrast, authentication, and other relevant checks;
- retaining verification results and dates;
- identifying accessibility regressions;
- and escalating material accessibility gaps.

Where specialist assistive-technology knowledge or independent verification is required, suitable external or independent support should be used rather than overstating internal evidence.

### 3.12 Internal Auditor

**Responsible for:** Performing planned internal audits of the management system with appropriate objectivity and impartiality.

Responsibilities include:

- following the approved audit scope and criteria;
- reviewing evidence rather than implementation claims alone;
- recording findings accurately;
- identifying nonconformities, observations, and improvement opportunities;
- and reporting results to the Management-System Owner.

The auditor should not audit work for which they are directly responsible when doing so would compromise objectivity.

If the current operating model cannot provide sufficient independence, the activity must be labeled **self-assessment** rather than represented as an independent internal audit. External or otherwise independent review may be used to satisfy the independence requirement.

### 3.13 Management Reviewer

**Accountable for:** Conducting management review and recording resulting decisions.

Responsibilities include reviewing, as applicable:

- prior review actions;
- changes in internal and external context;
- interested-party requirements;
- policy and objective performance;
- risk and treatment status;
- incidents and corrective actions;
- monitoring and measurement results;
- audit or self-assessment results;
- supplier issues;
- security and AI performance;
- resource needs;
- opportunities for improvement;
- and required changes to the ISMS or AIMS.

Management review must produce explicit decisions and actions where needed rather than functioning only as a status summary.

## 4. Responsibility Matrix

The following matrix establishes the default operating responsibility model.

**A — Accountable:** final decision authority.  
**R — Responsible:** performs or coordinates the work.  
**C — Consulted:** provides required input or specialist review.  
**I — Informed:** receives relevant outcome or status.

| Activity | Management-System Owner | Technical Owner | Security Owner | AI Governance Owner | Release Authority | Operations Owner | Evidence Custodian |
|---|---|---|---|---|---|---|---|
| Context and scope | A/R | C | C | C | I | C | R |
| Policy approval | A | C | R | R | I | I | R |
| Security risk assessment | A | C | R | C | I | C | R |
| AI risk/impact assessment | A | C | C | R | I | C | R |
| Residual-risk acceptance | A | C | R | R | I | C | I |
| Statement of Applicability | A | C | R | R | I | C | R |
| Technical control implementation | I | A/R | C | C | C | C | I |
| Controlled change | I | R | C | C | A/R | I | I |
| Release and deployment | I | R | C | C | A/R | R | I |
| Monitoring and operation | I | C | C | C | I | A/R | R |
| Incident coordination | A | R | R | R | C | R | R |
| Corrective action | A | R | R | R | C | R | R |
| Supplier governance | A | C | R | C | I | R | R |
| Accessibility verification | I | R | C | I | C | C | R |
| Evidence and document control | I | C | C | C | C | C | A/R |
| Internal audit | A/I | C | C | C | C | C | C |
| Management review | A/R | C | C | C | C | C | R |

The matrix is a default. A specific risk, incident, audit, assessment, or change record may assign a different responsible owner where that assignment is explicit.

## 5. Approval and Decision Authorities

The following decisions require explicit accountable approval:

| Decision | Required authority |
|---|---|
| Management-system scope | Management-System Owner |
| Information security policy | Management-System Owner |
| AI policy | Management-System Owner |
| Management-system objectives | Management-System Owner |
| Material residual-risk acceptance | Management-System Owner |
| Statement of Applicability | Management-System Owner |
| Material control exception | Management-System Owner |
| Expansion of privileged AI authority | Management-System Owner with AI Governance and Security review |
| Production release | Change and Release Authority under approved release controls |
| Significant supplier-risk acceptance | Management-System Owner |
| Closure of material corrective action | Management-System Owner or explicitly delegated authority |
| Management-review outputs | Management-System Owner |

Approval may be evidenced through the repository-native Git and pull-request model when the decision is explicitly represented in the relevant controlled record.

## 6. Delegation

Responsibilities may be delegated, but accountability remains with the assigned accountable authority unless the accountability itself is formally reassigned.

Delegation must not:

- bypass required approval;
- silently transfer risk acceptance;
- bypass separation or independence requirements;
- grant broader technical access than necessary;
- or remove traceability from a controlled decision.

Temporary delegation for incident handling, release operations, specialist testing, or external review should be documented when material to evidence or authority.

## 7. Independence and Conflict of Interest

The small operating model creates situations where one person may design, implement, review, release, and operate the same system.

This is acceptable for many routine activities when controls remain explicit and evidence is retained, but it does not automatically establish independent assurance.

Activities requiring heightened objectivity include:

- internal audit;
- formal independent security assessment;
- specialist accessibility assessment;
- external certification assessment;
- and other reviews whose value depends on independence from the work being assessed.

Where sufficient independence cannot be achieved internally:

1. label the activity accurately as self-assessment or internal review;
2. record the limitation;
3. use external or independent review when the assurance objective requires it;
4. do not claim independent assurance without evidence.

## 8. Communication of Responsibilities

Management-system responsibilities are communicated through:

- this controlled record;
- the associated policies and procedures;
- controlled change and pull-request records;
- risk, incident, audit, assessment, and corrective-action records;
- release-management records;
- and management review.

A person accepting an assigned role must have access to the information and authority necessary to perform it.

## 9. Review of Assignments

Role assignments must be reviewed:

- at least annually;
- during management review;
- when ownership changes;
- when the management-system scope changes;
- when a new material supplier or AI capability is introduced;
- following a material incident where unclear responsibility contributed to the outcome;
- or when an audit or assessment identifies an ownership gap.

Changes are handled through the controlled Git lifecycle.

## 10. Evidence

Evidence supporting this responsibility model includes:

- `docs/governance/CONTEXT.md`;
- `docs/governance/SCOPE.md`;
- `docs/governance/MANAGEMENT-SYSTEM.md`;
- `docs/governance/LEADERSHIP.md`;
- `docs/governance/INFORMATION-SECURITY-POLICY.md`;
- `docs/governance/AI-POLICY.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/OPERATIONS.md`;
- `docs/EVIDENCE.md`;
- pull requests and controlled commits;
- release and deployment records;
- risk and impact-assessment records once established;
- incident and corrective-action records once established;
- audit records once established;
- and management-review records once established.

## 11. Alignment

This document supports:

- **ISO/IEC 27001:2022 §5.3 — Organizational roles, responsibilities and authorities**
- **ISO/IEC 42001:2023 §5.3 — Roles, responsibilities and authorities**

**Current posture after approval:** Management-system responsibilities and decision authorities are defined and communicated for the declared scope; certification is not claimed.
