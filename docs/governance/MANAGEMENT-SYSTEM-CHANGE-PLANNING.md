# Management-System Change Planning

**Reference:** WG-GOV-008  
**Applies to:** ISO/IEC 27001:2022 §6.3 · ISO/IEC 42001:2023 §6.3  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material change to the management-system operating model

## 1. Purpose

This document defines how changes that can affect the WizardGang Architecture Demo information security management system (ISMS) or AI management system (AIMS) are planned, reviewed, implemented, and evidenced.

It does not create a second change-management workflow.

The repository's existing `DEMO-###` process remains the authoritative engineering and documented-information change mechanism. This procedure adds the management-system question:

> Does this controlled change invalidate or materially alter any management-system assumption, risk decision, control applicability, objective, policy, supplier dependency, interested-party requirement, or AI impact conclusion?

If the answer is yes, the affected governance records must be reviewed as part of the same controlled change or a directly linked follow-on change.

This supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Existing Change System

`docs/CHANGE-MANAGEMENT.md` defines the repository-native controlled change process.

Every controlled change receives a permanent `DEMO-###` identifier and records, proportionate to risk:

- what changed;
- why it changed;
- affected boundaries;
- engineering change risk;
- required invariants;
- validation performed;
- evidence location;
- source lineage;
- and release status.

The standard delivery lifecycle remains:

`requirement → branch → controlled commit → pull request → automated validation → review → merge → tag/release → deployment → verification → operational evidence`

Management-system planning is integrated into this lifecycle rather than maintained in a separate ticketing or approval system.

## 3. Change-Risk Distinction

The repository's `Low / Medium / High` change-risk rating evaluates implementation and deployment risk.

Management-system risk is different.

A Low-risk documentation change can document or respond to a Critical management-system risk. A High-risk schema or authorization change can reduce a management-system risk. Neither rating substitutes for the other.

When a controlled change materially affects an existing security or AI risk, the change should reference the relevant `SEC-RISK-###` or `AI-RISK-###` record and trigger residual-risk review.

## 4. When Management-System Review Is Required

A management-system review is required when a proposed or discovered change may materially affect one or more of the following:

- organizational context;
- interested parties or their relevant requirements;
- ISMS or AIMS scope;
- information-security or AI policy;
- roles, responsibilities, authorities, or independence requirements;
- security or AI risks;
- risk treatment decisions;
- Statements of Applicability;
- management-system objectives or measurement methods;
- legal, regulatory, contractual, standards, or provider requirements;
- supplier relationships or critical external dependencies;
- information assets or data categories;
- authentication, authorization, secrets, or privileged access;
- architecture, hosting, storage, recovery, or operational dependencies;
- logging, monitoring, incident handling, or evidence retention;
- accessibility commitments where they affect stated objectives;
- AI intended use;
- AI tool inventory or permissions;
- AI-accessible data;
- AI model/provider dependency;
- human oversight of AI-enabled behavior;
- AI impact conclusions;
- or the accuracy of public assurance claims.

A change does not need to affect all of these areas. One material dependency is sufficient to trigger the relevant review.

## 5. Management-System Change Review

For a change that triggers management-system review, the responsible change owner should determine which records are affected.

The review asks:

1. **Purpose** — Why is the change needed and what management-system objective does it support or affect?
2. **Integrity** — Can the change be made without creating contradictory or stale governance records?
3. **Scope** — Does the change alter what systems, services, data, suppliers, people, or AI capabilities are inside the ISMS/AIMS boundary?
4. **Risk** — Does it create, remove, increase, reduce, or materially change an existing security or AI risk?
5. **Control applicability** — Does it change whether an Annex A control is applicable or alter the evidence/status of an applicable control?
6. **Resources and responsibility** — Are additional people, skills, tools, supplier services, or operating resources needed?
7. **Objectives and measurement** — Does an objective, target, evidence source, owner, or cadence need to change?
8. **Documented information** — Which policies, procedures, registers, assessments, or evidence records must be revised?
9. **Operational transition** — Are rollback, continuity, monitoring, migration, recovery, or communication steps required?
10. **Verification** — What evidence will establish that the management-system effect was handled as planned?

Not every controlled change requires a written response to all ten questions. The depth of the review is proportional to the management-system significance of the change.

## 6. Required Record Updates

When applicable, the controlled change must update or explicitly schedule review of the affected records.

### Context or interested-party change

Review:

- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- risk registers;
- objectives;
- and applicable policies or SoAs.

### Scope change

Review:

- `docs/governance/SCOPE.md`;
- both risk registers;
- both SoAs;
- policies;
- interested parties;
- objectives;
- N/A decisions;
- and any existing audit or assessment plan.

A scope change is a mandatory reason to revisit previously excluded controls.

### Security architecture or data change

Review, as relevant:

- `SECURITY-RISK-REGISTER.md`;
- ISO 27001 SoA;
- asset/data documentation;
- incident/recovery assumptions;
- supplier dependencies;
- and security-policy implementation evidence.

### Supplier or provider change

Review:

- supplier risks;
- affected service/data dependencies;
- availability and recovery assumptions;
- credential and configuration ownership;
- contractual/provider requirements where known;
- and affected SoA controls.

### Management-system process change

Review:

- affected procedure or policy;
- role ownership;
- objective metrics;
- audit criteria;
- management-review inputs;
- and evidence-retention expectations.

## 7. AI-Specific Mandatory Reassessment Triggers

The following changes require explicit AIMS review before the prior AI risk or impact conclusions are relied upon:

- adding a new MCP or AI-facing tool;
- adding write, delete, administrative, deployment, permission-changing, or destructive authority;
- expanding the set of systems an AI caller can control;
- expanding AI-accessible namespaces, fields, or data categories;
- introducing private, personal, confidential, regulated, or otherwise materially different data;
- introducing or materially changing an external AI model or provider dependency;
- changing intended use;
- changing the class of users or materially affected parties;
- reducing human approval or oversight;
- increasing autonomous execution;
- changing prompts, orchestration, routing, memory, or agent logic in a way that materially changes effective behavior;
- changing fallback or fail-closed behavior;
- discovering a material evaluation failure, misuse scenario, incident, or concern;
- or changing public claims about AI capability or assurance.

At minimum, the review must consider:

- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md` or a replacement assessment for the changed capability;
- `docs/governance/soa/ISO-42001-SOA.md`;
- `docs/governance/AI-POLICY.md`;
- intended use and foreseeable misuse;
- affected parties;
- data and outputs;
- human oversight;
- evaluation coverage;
- and whether the current capability boundary description is still accurate.

The current MCP impact assessment is not a standing approval for future authority expansion.

## 8. Planning Proportionality

Management-system planning must be proportionate to consequence.

### Routine changes

A routine change that does not alter scope, risk, control applicability, objectives, data classes, suppliers, AI authority, or interested-party requirements may use the normal `DEMO-###` process with no separate management-system artifact.

Examples may include:

- typo corrections;
- non-authoritative presentation changes;
- documentation cleanup that does not alter requirements;
- or implementation refactoring that preserves the validated control boundary.

### Material changes

A material change should explicitly identify the affected management-system records and update them in the same PR where practical.

If a full update cannot reasonably be completed in the same change, a follow-on controlled action must be identified and the existing record must not be represented as current when it is known to be stale.

### Emergency changes

Urgent security or availability changes may be implemented before every governance record is updated when delay would create greater risk.

The operational change still receives a controlled record and the affected management-system documentation, risk, SoA, and evidence must be reconciled afterward through a tracked follow-up change.

Emergency handling is not an exemption from retrospective review.

## 9. Roles and Approval

The change owner is responsible for identifying whether management-system review is required.

The management-system owner is accountable for:

- approving material scope changes;
- approving High or Critical residual-risk acceptance;
- approving policy changes;
- approving material AI authority or intended-use expansion;
- ensuring affected SoAs and risk records are reconsidered;
- and ensuring unresolved management-system impacts are not silently ignored.

Technical review may be performed by the same person in the current small-operator model, but responsibilities remain distinct and independent review should be introduced when required by audit, risk, or specialist subject matter.

## 10. Evidence of Planned Change

Evidence that a management-system change was planned may include:

- the `DEMO-###` commit record;
- pull-request description and review;
- updated governance documents;
- linked risk-register updates;
- revised SoA rows;
- an updated AI impact assessment;
- objective changes;
- supplier review evidence;
- test/evaluation results;
- CI evidence;
- release and deployment evidence;
- operational observations;
- or corrective-action records.

The objective is not to create paperwork for its own sake. The evidence must make it possible to understand what management-system assumption changed, what was reviewed, what decision was made, and how that decision was validated.

## 11. Review Triggers for This Procedure

This procedure must itself be reviewed when:

- the repository change model changes materially;
- scope or ownership changes materially;
- a management-system change is found not to have triggered needed reassessment;
- audit identifies a change-control weakness;
- management review changes the governance approach;
- or a material security or AI incident demonstrates that the existing trigger model was insufficient.

Changes to this procedure use the same controlled `DEMO-###` process.

## 12. Evidence

Primary related evidence includes:

- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/governance/SCOPE.md`;
- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/registers/OBJECTIVES.md`;
- `docs/governance/soa/ISO-27001-SOA.md`;
- `docs/governance/soa/ISO-42001-SOA.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- and repository pull-request, validation, release, and deployment evidence.

## 13. Alignment

This document supports:

- **ISO/IEC 27001:2022 §6.3 — planning changes to the information security management system**;
- **ISO/IEC 42001:2023 §6.3 — planning changes to the AI management system**.

**Current posture after approval:** Management-system changes are planned through the existing controlled Git process with explicit reassessment triggers for scope, risk, controls, objectives, suppliers, documented information, and AI impacts; certification is not claimed.
