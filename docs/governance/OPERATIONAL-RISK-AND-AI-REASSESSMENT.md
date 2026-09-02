# Operational Risk Assessment, Treatment, and AI Impact Reassessment

**Reference:** WG-GOV-011  
**Applies to:** ISO/IEC 27001:2022 §8.2–§8.3 · ISO/IEC 42001:2023 §8.2–§8.4  
**Status:** Approved
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually and after any material risk, incident, control, scope, supplier, data, architecture, or AI-capability change

## 1. Purpose

This document defines how the WizardGang Architecture Demo performs recurring operational information-security risk assessment, AI risk assessment, risk treatment, and AI impact reassessment after the initial planning baseline has been established.

The initial risk methodology, risk registers, Statements of Applicability, and MCP AI impact assessment define the starting position. This document defines how those records are kept current through actual operation.

It does not create a separate scoring method or parallel work-management system.

The authoritative methodology remains `docs/governance/RISK-MANAGEMENT.md`; implementation and evidence continue through controlled `DEMO-###` work, operational records, tests, releases, incidents, reviews, and retained evidence.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Operational Principle

Risk assessment is not a one-time project artifact.

The operational loop is:

```text
change / incident / finding / supplier event / objective result / AI evaluation
        ↓
identify affected risks and assumptions
        ↓
reassess likelihood, impact, controls, and residual risk
        ↓
select or revise treatment
        ↓
implement treatment through controlled work
        ↓
validate the control or treatment
        ↓
recalculate residual risk
        ↓
record explicit acceptance, continued treatment, closure, or escalation
        ↓
update SoA / objectives / impact assessment / operating controls where required
```

A risk record is current only when its assumptions remain valid and its treatment status reflects actual evidence.

## 3. Relationship to the Initial Planning Baseline

The current management-system baseline includes:

- the shared risk methodology;
- the initial information-security risk register;
- the initial AI risk register;
- the initial MCP AI impact assessment;
- the ISO/IEC 27001 Statement of Applicability;
- the ISO/IEC 42001 Statement of Applicability;
- management-system objectives;
- and operational planning and control.

Those documents are not frozen after approval.

Operational evidence may:

- confirm an existing score;
- lower or increase likelihood or impact;
- show that an existing control is more or less effective than expected;
- create a new risk;
- make an existing risk obsolete;
- change treatment priority;
- invalidate an N/A decision;
- require a new control;
- require an updated AI impact assessment;
- or require explicit residual-risk acceptance.

## 4. Information-Security Risk Reassessment

Information-security risks are reassessed:

- at planned review intervals;
- before or after material changes, depending on whether the risk can be evaluated prior to implementation;
- after security incidents or near misses;
- after material vulnerability or dependency findings;
- after failed security, recovery, availability, or authorization controls;
- after material supplier changes or outages;
- after significant authentication, authorization, secrets, network, data, persistence, or deployment changes;
- when legal, contractual, or interested-party requirements materially change;
- after audit, self-assessment, or management-review findings;
- and when objective results indicate a control or process is not performing as intended.

The reassessment must use the established likelihood and impact scales unless a documented reason requires another method.

## 5. AI Risk Reassessment

AI risks are reassessed under the same core method, while preserving AI-specific considerations.

Reassessment is required when there is a material change to:

- MCP tool inventory;
- tool permissions or authority;
- public versus private data exposure;
- namespaces or systems reachable through AI-facing tools;
- intended use;
- foreseeable misuse;
- human oversight;
- model or provider dependency;
- protocol behavior;
- output handling;
- evaluation coverage;
- downstream automation assumptions;
- affected parties;
- or known limitations.

AI risk reassessment must consider more than confidentiality, integrity, and availability. It must also consider, where relevant:

- misleading or incorrect output;
- excessive automation;
- loss of human control;
- data quality and provenance;
- indirect instruction or prompt manipulation;
- inappropriate downstream reliance;
- affected users or groups;
- accessibility or usability impacts;
- transparency and limitation communication;
- and external model or agent behavior that may materially affect the WizardGang integration boundary.

## 6. Risk Review Triggers

A recorded risk or related assessment must be reopened when any of the following occurs and the event can materially change the prior conclusion:

### Change triggers

- a new route, API, integration, persistence store, or externally exposed interface;
- authentication or authorization change;
- new privileged administrative function;
- secrets or credential-management change;
- new supplier or material supplier change;
- new data category or material data-flow change;
- material recovery, backup, retention, or availability change;
- new AI tool, permission, model/provider dependency, or data source;
- AI intended-use or human-oversight change;
- or a management-system scope change.

### Evidence triggers

- failed CI or security validation with management-system relevance;
- repeated production errors or degraded health;
- vulnerability or dependency finding;
- failed restore or continuity test;
- authorization or data-boundary regression;
- AI evaluation failure;
- evidence that an existing control is not functioning as assumed;
- objective target miss;
- stale or missing evidence that prevents a prior conclusion from being supported;
- or conflicting evidence across source, runtime, logs, releases, or management records.

### Governance triggers

- incident or near miss;
- user, security-researcher, or affected-party concern;
- internal audit or self-assessment finding;
- management-review decision;
- corrective-action record;
- new legal, contractual, accessibility, or standards obligation;
- or material change in an interested-party requirement.

A trigger does not automatically mean the risk score must change. It means the prior assumptions must be checked and the result recorded.

## 7. Performing a Reassessment

A reassessment should answer, at minimum:

1. What changed or what evidence triggered review?
2. Which risk records, objectives, controls, assets, interested parties, or impact assumptions are affected?
3. Are the existing threat/cause and consequence descriptions still accurate?
4. Are existing controls actually operating as previously assumed?
5. Has likelihood changed?
6. Has impact changed?
7. Is the residual score still supportable?
8. Is the current treatment strategy still appropriate?
9. Does the SoA or applicability rationale need to change?
10. Does an AI impact assessment need to be updated?
11. Is explicit risk acceptance required?
12. What evidence supports the new conclusion?

Where no material change is found, the review record may retain the existing score while updating `lastReviewed`, evidence, and rationale.

## 8. Treatment Planning

Treatment remains one or more of:

- **Avoid** — remove the risky capability, dependency, data use, permission, or activity;
- **Reduce** — apply controls that reduce likelihood or impact;
- **Transfer / Share** — allocate part of the exposure through a provider, contract, or other shared responsibility;
- **Accept** — explicitly retain the residual risk with authorized rationale.

Treatment must identify:

- affected risk ID;
- treatment objective;
- responsible owner;
- required work or operating action;
- applicable controls or SoA references;
- target date or review point where useful;
- validation required;
- evidence expected;
- and acceptance authority where residual risk may remain.

A treatment plan is not the same as an implemented treatment.

## 9. Treatment Implementation Through Git and Operations

Engineering and documentation treatments use the existing controlled change process.

A treatment may be implemented through:

- source-code change;
- authentication or authorization change;
- configuration change;
- infrastructure or provider configuration;
- new test or evaluation;
- logging or monitoring improvement;
- backup/recovery procedure;
- incident-management process;
- supplier review or contractual action;
- policy or procedure change;
- accessibility remediation;
- AI tool restriction;
- revised human-oversight requirement;
- data minimization;
- or another documented control.

Where implementation uses repository work, the risk record should reference the associated `DEMO-###` change, pull request, validation, release, and deployment evidence where applicable.

Operational or supplier treatments that do not naturally create source changes still require a retained record sufficient to demonstrate the activity occurred.

## 10. Treatment Verification

A treatment may be represented as implemented only after the action exists.

A treatment may be represented as **effective** only after appropriate evidence shows that it addresses the intended risk.

Verification may include:

- unit or contract tests;
- negative authorization tests;
- security testing;
- dependency or vulnerability validation;
- release/deployment verification;
- runtime observation;
- log or audit evidence;
- restore or recovery testing;
- incident exercise results;
- supplier evidence;
- accessibility/manual testing;
- AI evaluation results;
- AI impact reassessment;
- or management review of a non-technical control.

Passing a test proves only the behavior exercised by that test.

## 11. Residual Risk Recalculation

After treatment is implemented and validated, residual likelihood and impact must be reconsidered.

The resulting decision is one of:

- **continue treating** — residual exposure remains above the desired level or treatment is incomplete;
- **accept** — residual exposure is explicitly accepted by the authorized authority;
- **close** — the source of risk has been removed or active tracking is no longer justified;
- **supersede** — a more accurate risk record replaces the prior one;
- or **escalate** — the new evidence shows greater urgency or consequence than previously understood.

Residual-risk reduction must not be claimed solely because a treatment change was merged.

## 12. Risk Acceptance During Operation

Operational convenience is not implicit risk acceptance.

If a risk is to remain accepted, the record must include:

- accepting authority;
- acceptance date;
- residual score and rating;
- rationale;
- conditions or assumptions;
- review due date;
- and evidence supporting the decision.

High and Critical residual risks require the management-system approval level defined in the risk methodology.

If an acceptance condition becomes false, the risk returns to active review.

## 13. Statement of Applicability Updates

Risk treatment and operational evidence may change control applicability or status.

The relevant SoA must be reviewed when:

- a new risk requires a control not previously selected;
- an N/A rationale is invalidated by scope or architecture change;
- implementation evidence moves a control from Gap to Partial or Partial to Met;
- control effectiveness is shown to be weaker than previously represented;
- a treatment removes the need for a control and a justified exclusion becomes appropriate;
- or supplier/physical/personnel assumptions change.

A control remains applicable even when implementation is incomplete.

SoA status must represent evidence, not intent.

## 14. AI Impact Reassessment

The current MCP AI impact assessment applies only to the capability and assumptions stated in that record.

The assessment must be reopened before relying on its prior conclusion when there is a material change to:

- AI authority or permissions;
- write, destructive, administrative, deployment, source-control, or other privileged capability;
- data categories or data sensitivity;
- affected users or groups;
- intended use;
- foreseeable misuse;
- human oversight;
- downstream automation;
- model/provider dependency where it materially changes the integration;
- output semantics or consequences;
- significant evaluation findings;
- or the system boundary.

It must also be reconsidered after an AI-related incident, concern, or unexpected behavior that materially challenges the previous impact assumptions.

## 15. AI Impact Assessment Update Content

An updated AI impact assessment should reconsider, as applicable:

- system purpose and intended use;
- direct and indirect affected parties;
- data and inputs;
- outputs and actions;
- authority and permissions;
- human oversight;
- foreseeable misuse;
- positive impacts;
- adverse impacts;
- accessibility and usability effects;
- data quality and provenance;
- provider/model dependencies;
- known limitations;
- control measures;
- residual impacts;
- and whether operation should proceed, proceed with conditions, be reduced, or be avoided.

A minor implementation change that does not materially change these factors may be documented as reviewed with no assessment update required.

## 16. Current MCP Boundary

The current approved baseline remains intentionally narrow:

- public read-oriented MCP use;
- server-side application authorization;
- validated namespace/input boundaries;
- bounded record retrieval;
- read-only/non-destructive tool annotations;
- no MCP write, delete, admin, source-control, deployment, or privileged production tools;
- human control over source, releases, administration, policy, and risk acceptance;
- bounded operational logging;
- and selected executable boundary evaluation.

These controls materially limit current impact but do not permanently authorize a broader future AI boundary.

A future privileged or consequential AI capability requires reassessment before release, not after it becomes normal operation.

## 17. Incidents, Near Misses, and Unexpected Behavior

A security or AI incident, near miss, or material unexpected behavior can create new evidence about likelihood, impact, control effectiveness, affected parties, or foreseeable misuse.

The response must determine whether to:

- create a new risk;
- increase or otherwise revise an existing risk;
- change treatment priority;
- update the SoA;
- update the AI impact assessment;
- open corrective action;
- modify objectives or monitoring;
- suspend or degrade a capability;
- or require management review.

Incident closure does not automatically close related risks.

## 18. Supplier and Dependency Events

Supplier and dependency events must feed the same reassessment process when they materially affect the scoped system.

Examples include:

- GitHub or Cloudflare control/availability changes;
- identity-provider changes;
- dependency or registry compromise;
- material licensing or contractual changes;
- AI model/provider changes that affect the integration boundary;
- service-limit changes;
- security advisories;
- or provider control evidence that invalidates an existing assumption.

Provider responsibility does not eliminate WizardGang's responsibility for selection, configuration, access, monitoring, fallback, data exposure, and residual risk within the declared scope.

## 19. Evidence and Traceability

A completed reassessment should be traceable to the evidence that caused or supported it.

Useful evidence includes:

- risk-register history;
- controlled commits and pull requests;
- tests and CI artifacts;
- release and deployment evidence;
- runtime health and logs;
- audit events;
- vulnerability or dependency findings;
- supplier information;
- restore/recovery results;
- incident or near-miss records;
- AI evaluations;
- AI impact assessments;
- objective measurements;
- audit findings;
- management-review decisions;
- and corrective-action records.

Where a treatment changes production behavior, the preferred trace remains:

```text
risk → treatment → DEMO change → validation → review → release → deployment → operational verification → residual-risk decision
```

## 20. Review Cadence

The initial risk registers currently use a planned review date of 2026-12-02.

That date is a maximum planned review point, not permission to defer event-driven reassessment.

Material triggers identified in this document require review when they occur.

At management review, the owner should consider at least:

- High/Critical risks and treatment progress;
- overdue treatment actions;
- accepted risks approaching review dates;
- new incidents or near misses;
- supplier/dependency changes;
- failed controls or objective misses;
- AI capability changes;
- AI impact reassessment status;
- and whether SoA status still reflects evidence.

## 21. Current Posture and Remaining Evidence

The project now has an established methodology, initial security and AI risk registers, SoAs, an MCP AI impact assessment, management-system objectives, change planning, and operational control documentation.

The remaining maturity requirement is repeated execution.

Evidence still needs to accumulate through activities such as:

- completed risk reviews at the defined cadence;
- treatment work linked back to risk IDs;
- treatment-effectiveness verification;
- explicit risk-acceptance records where appropriate;
- supplier reviews;
- restore/recovery testing;
- incident exercises or actual incident records;
- expanded AI evaluations;
- AI impact reassessment after future material changes;
- objective measurement;
- internal audit;
- management review;
- and corrective-action effectiveness checks.

This document must not be used to imply those activities have already occurred.

## 22. Supporting Evidence

Primary supporting records include:

- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- `docs/governance/soa/ISO-27001-SOA.md`;
- `docs/governance/soa/ISO-42001-SOA.md`;
- `docs/governance/registers/OBJECTIVES.md`;
- `docs/governance/MANAGEMENT-SYSTEM-CHANGE-PLANNING.md`;
- `docs/governance/OPERATIONAL-PLANNING-CONTROL.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/OPERATIONS.md`;
- `SECURITY.md`;
- CI, release, deployment, logging, audit, and MCP evaluation evidence;
- and future incident, supplier, audit, review, and corrective-action records.

## 23. Alignment

This document supports:

- **ISO/IEC 27001:2022 §8.2 — Information-security risk assessment**;
- **ISO/IEC 27001:2022 §8.3 — Information-security risk treatment**;
- **ISO/IEC 42001:2023 §8.2 — AI risk assessment**;
- **ISO/IEC 42001:2023 §8.3 — AI risk treatment**;
- **ISO/IEC 42001:2023 §8.4 — AI system impact assessment**.

**Current posture after approval:** The management system defines a repeatable operational reassessment and treatment loop tied to actual changes, evidence, incidents, suppliers, and AI capability. Effectiveness and maturity depend on repeated execution and retained evidence; certification is not claimed.
