# Nonconformity, Corrective Action, and Continual Improvement

**Reference:** WG-GOV-015  
**Applies to:** ISO/IEC 27001:2022 §10.1–§10.2 · ISO/IEC 42001:2023 §10.1–§10.2  
**Status:** Approved
**Owner:** Management-System Owner / WizardGang  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually, during management review, and after material nonconformity, incident, recurring failure, audit finding, or management-system change

## 1. Purpose

This document defines how the WizardGang Architecture Demo identifies and responds to management-system nonconformities, implements corrective action, verifies effectiveness, and drives continual improvement across the integrated information security management system (ISMS) and AI management system (AIMS).

It uses the repository's existing controlled-change, risk, release, operational, monitoring, audit, and management-review processes rather than creating a parallel ticketing or approval system.

Approval of this procedure establishes the process. It does **not** prove that corrective actions have already been completed, that the management system is effective, or that ISO/IEC 27001 or ISO/IEC 42001 certification has been achieved.

## 2. Core Principles

Clause 10 operation follows these rules:

1. **Evidence over appearance.** A green dashboard, merged pull request, or closed issue does not by itself prove a nonconformity is resolved.
2. **Correction is not always corrective action.** Restoring service or fixing a defect addresses the immediate condition; corrective action addresses the cause or conditions that could allow recurrence when that additional work is warranted.
3. **Response is proportional.** A minor isolated documentation typo does not require the same analysis as a recurring authorization failure, lost evidence, or AI authority expansion outside approved scope.
4. **Accountability is explicit.** Material nonconformities and corrective actions have an owner, due date, evidence, and closure decision.
5. **Causes are analyzed when useful.** Root- or contributing-cause analysis is required when significance, recurrence, systemic exposure, or uncertainty makes it necessary; ceremonial root-cause paperwork is not required for every trivial defect.
6. **Effectiveness must be verified.** Implementation and verification are separate steps.
7. **Related records are updated.** Risks, SoAs, objectives, policies, AI impact assessments, monitoring, procedures, and public assurance claims are revised when findings invalidate prior assumptions.
8. **History is retained.** Closed and superseded records remain reconstructable through controlled repository history.
9. **Continual improvement is outcome-focused.** Improvement means making the management system more suitable, adequate, or effective—not merely adding documents.

## 3. Definitions

### Nonconformity

A condition where an applicable requirement, approved control, management-system process, policy expectation, operational criterion, or documented decision is not satisfied.

Examples may include:

- an approved security or AI control not operating as intended;
- a required review not performed by its due date;
- a release that cannot be traced to reviewed source;
- a material risk without required treatment ownership;
- a control represented as Met without supporting evidence;
- an AI capability operating outside its approved intended-use, data, authority, or human-oversight boundary;
- a failed internal-audit criterion;
- or recurring failure to meet a management-system objective.

### Correction

Immediate action to remove or contain the detected nonconforming condition.

Examples include:

- reverting a release;
- disabling an unsafe capability;
- rotating an exposed credential;
- correcting an inaccurate public assurance statement;
- restoring a missing document reference;
- or entering maintenance/offline state while a failure is investigated.

### Corrective action

Action intended to remove or reduce the cause of a nonconformity so that the same or a materially similar failure is less likely to recur.

Examples include:

- adding a missing authorization test after a bypass defect;
- narrowing a token scope after excessive permissions are identified;
- adding review triggers after an AI capability changed without reassessment;
- changing a supplier-review cadence after repeated dependency surprises;
- or automating an evidence-freshness check after stale governance records recur.

### Continual improvement

Ongoing improvement to management-system suitability, adequacy, or effectiveness based on evidence, findings, changes, risks, objectives, incidents, reviews, and opportunities.

## 4. Sources of Nonconformity and Improvement

Nonconformities and improvement opportunities may be identified through:

- CI or build failures;
- security testing;
- dependency or vulnerability findings;
- release or deployment verification;
- health and availability observations;
- application logs and audit events;
- administrative events;
- incidents and near misses;
- recovery or restore tests;
- objective measurements;
- security and AI risk reviews;
- AI evaluations;
- AI impact assessments;
- accessibility verification;
- evidence-freshness review;
- supplier review or supplier incidents;
- self-assessments;
- formal internal audits;
- management review;
- user or interested-party feedback;
- changes in legal, contractual, standards, or other requirements;
- and controlled `DEMO-###` change proposals.

A finding does not need to originate from an audit to qualify as a nonconformity.

## 5. Record Model

Material nonconformities and corrective actions should be recorded in a durable, reviewable form such as a controlled governance register, issue, pull request, or other repository record.

Where a dedicated register is used, identifiers should remain permanent, for example:

- `NC-001` — nonconformity record;
- `CA-001` — corrective-action record.

A material record should capture, as applicable:

- identifier;
- date detected;
- source;
- affected requirement/control/process;
- description and evidence;
- actual or potential impact;
- immediate correction/containment;
- owner;
- significance;
- cause or contributing factors where analysis is required;
- corrective action;
- related risk IDs;
- related SoA/control references;
- related AI impact-assessment reference where applicable;
- related issue / `DEMO-###` / PR / release;
- target date;
- implementation evidence;
- effectiveness-verification method;
- verification result;
- residual risk or remaining limitation;
- closure decision and date;
- and follow-up or review trigger.

Minor findings may be handled directly in a controlled change when the change record contains enough evidence and traceability to explain what was wrong and how it was resolved.

## 6. Significance and Escalation

The management system does not require a separate numerical severity scale for every nonconformity. Significance should consider:

- security or AI impact;
- user or interested-party impact;
- loss of confidentiality, integrity, availability, authorization, traceability, accessibility, or accountability;
- recurrence;
- scope of affected systems or data;
- whether a policy or management-system requirement failed;
- whether public assurance was inaccurate;
- whether residual risk changed materially;
- whether the issue indicates a systemic process weakness;
- and whether continued operation is appropriate before correction.

Material or systemic findings must be escalated to the Management-System Owner.

Potential Critical or High security/AI risk must also follow the risk-acceptance authority defined in `docs/governance/RISK-MANAGEMENT.md`.

## 7. Response Workflow

The normal process is:

```text
finding / failure / incident
        ↓
record and preserve evidence
        ↓
contain or correct immediate condition
        ↓
evaluate significance and related risk
        ↓
determine whether cause analysis is required
        ↓
define corrective action and owner
        ↓
implement through controlled work
        ↓
validate / deploy / operate
        ↓
verify effectiveness
        ↓
update affected management-system records
        ↓
close, retain, and review for broader improvement
```

Urgent containment may occur before complete analysis when necessary to prevent continued harm, unauthorized access, misleading public claims, data exposure, or unsafe AI behavior.

## 8. Immediate Correction and Containment

Upon detecting a material nonconformity, the responsible owner should first determine whether immediate action is needed.

Possible actions include:

- block a merge or release;
- roll back or disable a deployed feature;
- enter maintenance/offline mode;
- revoke or rotate credentials;
- narrow permissions;
- reject unsafe input or requests;
- disable an MCP tool or AI integration;
- correct an inaccurate compliance/status statement;
- preserve logs or audit evidence;
- or notify an appropriate interested party when required by an applicable obligation.

Containment must not destroy evidence needed to understand the failure.

## 9. Cause Analysis

Cause analysis should be performed when one or more of the following apply:

- the failure is material;
- the same or similar issue has recurred;
- the immediate cause is unclear;
- a systemic process weakness may exist;
- a High/Critical risk is involved;
- an audit or management-review finding requires it;
- an incident affected security, AI governance, recovery, or public assurance materially;
- or simple correction is unlikely to prevent recurrence.

Analysis may consider:

- direct technical cause;
- process or review failure;
- unclear ownership;
- missing competence or awareness;
- supplier dependency;
- incorrect assumptions;
- insufficient monitoring;
- inadequate validation;
- permission or configuration design;
- stale evidence;
- incorrect scope or applicability decision;
- poor data quality/provenance;
- AI capability drift;
- human-oversight weakness;
- or multiple contributing factors.

The process should avoid forcing a single artificial root cause when the evidence supports multiple contributing conditions.

## 10. Corrective-Action Planning

Corrective action must be appropriate to the significance and cause of the finding.

A plan should identify:

- what will change;
- why the action addresses the identified cause or contributing condition;
- accountable owner;
- required resources;
- due date;
- related risk treatment;
- required validation;
- whether an AI impact assessment or SoA review is triggered;
- expected evidence;
- and how effectiveness will be verified after implementation.

Corrective action may involve:

- code or configuration;
- architecture;
- authorization or secrets management;
- tests/evaluations;
- monitoring;
- operational procedure;
- supplier handling;
- recovery controls;
- training/competence;
- policy or governance records;
- public disclosure/assurance wording;
- or management-system objectives.

## 11. Controlled Implementation

Technical or documentation changes use the existing `DEMO-###` process.

Where implementation work is required, the corrective-action record should reference the applicable:

- issue/work item;
- `DEMO-###` identifier;
- branch and pull request;
- validation evidence;
- release/tag where applicable;
- deployment evidence;
- operating observation;
- and risk or assessment update.

A corrective action is **implemented** when the planned action has actually occurred.

It is not yet **verified effective** merely because the pull request merged or the release deployed.

## 12. Effectiveness Verification

Effectiveness verification asks whether the action actually addressed the identified problem or recurrence path.

Verification may use:

- targeted regression tests;
- negative authorization tests;
- AI boundary evaluations;
- production observations;
- monitoring over an appropriate interval;
- recovery testing;
- repeated accessibility verification;
- supplier evidence;
- document/evidence freshness checks;
- audit follow-up;
- objective trend improvement;
- or another method suited to the finding.

The verification method and observation period should be proportional to the problem.

Examples:

- a corrected broken internal link may be verified immediately;
- a recurring availability problem may require monitoring over time;
- a restore-control failure requires a subsequent restore test;
- an authorization bypass requires negative tests against the bypass path;
- an AI capability-drift finding may require updated tool inventory, tests, risk review, and impact reassessment.

When practical, effectiveness should be verified by someone other than the person who implemented the action. In the small-operator model, self-verification may be necessary; it must not be mislabeled as independent assurance.

## 13. Closure Criteria

A material nonconformity or corrective action may be closed when:

- the immediate condition has been corrected or appropriately contained;
- required corrective actions have been implemented;
- required validation is complete;
- effectiveness has been evaluated with sufficient evidence;
- related risks have been reassessed where necessary;
- affected SoA entries, objectives, policies, procedures, AI impact assessments, monitoring, or public claims have been updated where necessary;
- residual limitations are recorded;
- any required risk acceptance is explicit;
- and the authorized owner records a closure decision.

Closure must not be used merely to remove an overdue item from reporting.

If effectiveness is not demonstrated, the item remains open, returns to treatment, or is superseded by a more accurate corrective-action record.

## 14. Interfaces to Risk Management

A nonconformity may:

- reveal a new risk;
- increase likelihood or impact of an existing risk;
- show that an existing control is ineffective;
- invalidate residual-risk scoring;
- require a different treatment;
- or show that prior risk acceptance is no longer justified.

When this occurs, the applicable security or AI risk register must be updated.

Corrective-action closure does not automatically equal residual-risk acceptance.

## 15. Interfaces to AI Governance and Impact Assessment

AI-related findings must be evaluated for both risk and impact consequences.

A new or updated AI impact assessment is required before reusing the existing impact conclusion when a finding shows material change in:

- AI/MCP authority;
- write, privileged, destructive, or autonomous capability;
- accessible data;
- intended use;
- foreseeable misuse;
- human oversight;
- model/provider responsibility;
- affected parties;
- downstream actions;
- or potential impact.

A technical fix to an AI/MCP defect does not automatically prove the broader AI impact remains unchanged.

## 16. Interfaces to Statement of Applicability

A finding may require SoA review when it shows:

- an applicable control is not implemented;
- a previously Met control is only Partial or Gap;
- a control previously marked N/A has become applicable;
- an exclusion rationale is no longer valid;
- implementation evidence changed;
- or a different control is required by revised risk treatment.

SoA status must follow evidence rather than desired posture.

## 17. Interfaces to Objectives and Monitoring

Corrective actions may create or modify objectives when recurring evidence shows that the current target or metric is inadequate.

Monitoring should be changed when a nonconformity demonstrates that the system was not detecting a meaningful failure soon enough or was measuring the wrong condition.

Examples include:

- adding evidence-freshness monitoring after stale records recur;
- adding negative MCP test coverage after an authorization defect;
- adding restore cadence after a recovery gap;
- or strengthening supplier-review metrics after recurring provider issues.

## 18. Interfaces to Audit and Management Review

Internal audits and self-assessments may open nonconformity or corrective-action records.

Audit follow-up should verify whether findings were addressed and whether effectiveness evidence is sufficient.

Management review must consider, as applicable:

- open material nonconformities;
- overdue corrective actions;
- repeated findings;
- ineffective corrective actions;
- trends indicating systemic weakness;
- resource needs;
- residual risks;
- and improvement opportunities.

Management review may require new corrective action even when no formal audit finding exists.

## 19. Continual Improvement Sources

Continual improvement may be driven by:

- corrective actions;
- risk treatment;
- objective performance;
- monitoring trends;
- audit/self-assessment findings;
- management-review decisions;
- incidents and near misses;
- recovery testing;
- supplier changes;
- user feedback;
- accessibility findings;
- AI evaluations and impact assessments;
- architecture simplification;
- cost/degradation observations;
- tooling or automation opportunities;
- and lessons learned from releases or operations.

Improvement work should favor measurable reduction in risk, clearer accountability, stronger evidence, simpler operation, improved accessibility, safer AI boundaries, improved recoverability, or more reliable delivery over paperwork volume.

## 20. Improvement Workflow

Improvement opportunities that require controlled work normally follow:

```text
opportunity / lesson / trend
        ↓
evaluate value and risk
        ↓
assign objective, treatment, issue, or DEMO change
        ↓
implement and validate
        ↓
measure result
        ↓
retain evidence
        ↓
review whether further improvement is warranted
```

Not every improvement must become a corrective action. Corrective action addresses a detected nonconformity or recurrence risk; proactive improvement may be tracked through objectives, roadmap work, risks/opportunities, or controlled changes.

## 21. Preventing Paper Compliance

The following are not sufficient evidence of effective corrective action by themselves:

- creating this procedure;
- opening an issue;
- changing a checklist status without evidence;
- merging a remediation PR;
- adding a test that does not exercise the identified failure path;
- writing a management-review action without assigning ownership;
- or marking an item closed without effectiveness verification.

Where a requirement is operational, the evidence must come from operation, testing, review, or another activity capable of demonstrating the claimed result.

## 22. Records and Retention

Relevant Clause 10 evidence may include:

- issues and corrective-action records;
- `DEMO-###` commits and pull requests;
- CI/test evidence;
- releases and deployments;
- incident records;
- risk-register updates;
- SoA updates;
- AI impact assessments;
- monitoring results;
- audit/self-assessment reports;
- management-review decisions;
- recovery tests;
- supplier records;
- objective results;
- and effectiveness-verification evidence.

Repository history retains superseded and closed records unless another retention mechanism is explicitly designated.

Evidence must continue to follow security/redaction requirements and must not expose secrets or inappropriate private information.

## 23. Current Implementation State

At the time this procedure is proposed:

- controlled Git changes already support traceable remediation work;
- security and AI risk methodologies/registers exist on this branch;
- operational risk reassessment is defined;
- monitoring and measurement are defined;
- internal audit/self-assessment and management-review programs are defined;
- and the repository provides technical evidence through CI, releases, runtime logs, audit events, health, and AI evaluation.

The project does **not** yet claim a mature history of completed corrective actions, verified effectiveness records, or continual-improvement cycles under this newly defined management-system process.

Those become operating evidence only when real findings and improvements are processed through the workflow.

## 24. Initial Follow-On Evidence

After approval, the management system should use this process to address existing known gaps rather than inventing retrospective records.

Initial candidates include:

- recovery/restore procedure and evidenced restore test;
- incident-management procedure and exercise;
- supplier register and supplier review evidence;
- competence/awareness evidence;
- expanded AI/MCP evaluation coverage;
- AI data-governance/provenance evidence;
- evidence-freshness enforcement;
- outstanding High security-risk treatments;
- and any findings produced by the first formal self-assessment/internal audit and management review.

Each item should be treated according to its real source and significance; not every known improvement gap must be mislabeled as a historical nonconformity.

## 25. Alignment

This procedure supports:

- **ISO/IEC 27001:2022 §10.1–§10.2**;
- **ISO/IEC 42001:2023 §10.1–§10.2**.

**Current posture after approval:** the integrated management system has a defined process for nonconformity response, corrective action, effectiveness verification, and continual improvement. Completion and effectiveness must be demonstrated through future operating evidence; certification is not claimed.
