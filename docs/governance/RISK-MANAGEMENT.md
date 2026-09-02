# Risk Management Methodology

**Reference:** WG-GOV-008  
**Applies to:** ISO/IEC 27001:2022 §6.1.1–§6.1.3 · ISO/IEC 42001:2023 §6.1.1–§6.1.4  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material changes to scope, architecture, suppliers, identity, data handling, security posture, or AI capability

## 1. Purpose

This document defines the repeatable risk-management methodology used by the WizardGang Architecture Demo information security management system (ISMS) and AI management system (AIMS).

It establishes how risks and opportunities are identified, analyzed, evaluated, treated, accepted, reviewed, and evidenced.

This methodology is separate from the repository's Low / Medium / High **change-risk** classification. Change risk estimates the implementation risk of a controlled change. Management-system risk evaluates conditions that could affect information security, AI-system behavior, interested parties, or management-system objectives.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Scope

This methodology applies to risks within the approved management-system scope defined in `docs/governance/SCOPE.md`.

It includes, where relevant:

- public application behavior;
- GitHub source control and delivery;
- Cloudflare runtime and platform configuration;
- D1, R2, Durable Objects, and related application state;
- authentication and authorization;
- secrets and credentials;
- REST, GraphQL, webhook, identity, and MCP boundaries;
- logging and audit evidence;
- availability and graceful degradation;
- accessibility-related operational risk where it affects stated objectives;
- suppliers and external dependencies;
- open-source dependencies;
- AI/MCP capabilities;
- AI data, inputs, outputs, permissions, intended use, and foreseeable misuse;
- and management-system processes themselves.

Out-of-scope systems are not automatically risk-free. Dependencies crossing the scope boundary are evaluated when they can affect the in-scope system.

## 3. Risk Principles

Risk management follows these principles:

1. **Evidence over assumption.** Risk decisions should use observable system behavior, architecture, incidents, tests, supplier information, and documented requirements where available.
2. **Explicit ownership.** Every recorded risk has an accountable owner.
3. **Consistent scoring.** Likelihood and impact use the same defined scales across comparable risks.
4. **Residual risk matters.** Treatment does not make a risk disappear; residual risk is evaluated after controls are considered.
5. **Acceptance is a decision.** Accepted risk must be explicit and attributable to an authorized person.
6. **Controls follow risk.** Controls are selected because they address identified risks, requirements, or obligations—not merely because a standard lists them.
7. **AI impacts are not reduced to cybersecurity.** AI risks may involve people, misuse, incorrect behavior, transparency, human oversight, data quality, or other impacts even where confidentiality, integrity, and availability are unaffected.
8. **Reassessment follows change.** Material changes can invalidate prior risk decisions.
9. **No false precision.** Numerical scores support prioritization; they are not proof of safety or compliance.

## 4. Risk Sources

Risks and opportunities may be identified from:

- organizational context;
- interested-party requirements;
- management-system scope;
- architecture reviews;
- threat modeling;
- security testing;
- dependency and vulnerability findings;
- incidents and near misses;
- operational logs and health observations;
- failed CI or release checks;
- accessibility findings;
- supplier changes or outages;
- identity-provider changes;
- legal, regulatory, contractual, or standards changes;
- internal audit or self-assessment findings;
- management review;
- AI evaluations;
- AI impact assessments;
- changes to model, provider, tool, permission, data, prompt, workflow, or intended use;
- user feedback;
- and controlled change proposals.

## 5. Risk Record

Each risk record must contain enough information to understand the decision without relying on undocumented memory.

Minimum fields are:

- `id` — permanent identifier;
- `framework` — Security, AI, or Shared;
- `title` — concise risk name;
- `description` — event or condition being evaluated;
- `source` — why the risk was identified;
- `affectedAssetOrProcess` — affected system, data, process, person, or objective;
- `threatOrCause` — credible cause or initiating condition;
- `consequence` — credible impact if the event occurs;
- `existingControls` — controls already operating;
- `likelihood` — 1 through 5;
- `impact` — 1 through 5;
- `inherentRisk` — risk before considering existing controls;
- `residualLikelihood` — likelihood after existing or planned controls;
- `residualImpact` — impact after existing or planned controls;
- `residualRisk` — resulting residual rating;
- `treatment` — Avoid, Reduce, Transfer/Share, or Accept;
- `treatmentActions` — required actions where applicable;
- `controlReferences` — applicable policy, technical, ISO, or other control references;
- `owner` — accountable risk owner;
- `acceptanceAuthority` — person authorized to accept the residual risk;
- `status` — Open, Treating, Accepted, Closed, or Superseded;
- `reviewDue` — next planned review;
- `lastReviewed` — last completed review date;
- `evidence` — supporting repository, test, issue, release, log, assessment, or supplier evidence;
- and `notes` — contextual information not captured elsewhere.

AI risks may include additional fields defined in Section 12.

## 6. Likelihood Scale

Likelihood estimates the realistic probability or frequency of the risk event within the defined operating context.

| Score | Rating | Guidance |
|---|---|---|
| 1 | Rare | Not expected under normal operation; would require exceptional conditions |
| 2 | Unlikely | Credible but not expected; limited exposure or strong preventive controls |
| 3 | Possible | Could occur during ordinary operation or through a plausible failure path |
| 4 | Likely | Expected to occur periodically or exposure is substantial |
| 5 | Almost certain | Expected frequently, already recurring, or conditions strongly favor occurrence |

Likelihood must consider actual exposure, not only theoretical possibility.

## 7. Impact Scale

Impact evaluates the plausible consequence to the in-scope system, management-system objectives, interested parties, or AI-affected persons.

| Score | Rating | Guidance |
|---|---|---|
| 1 | Insignificant | Negligible effect; no meaningful loss of objective or trust |
| 2 | Minor | Limited, recoverable effect with little external consequence |
| 3 | Moderate | Material service, security, governance, accessibility, or AI impact requiring corrective work |
| 4 | Major | Significant compromise, outage, harmful AI behavior, data exposure, or management-system failure |
| 5 | Severe | Catastrophic or sustained impact, serious harm, major breach, systemic loss of control, or unacceptable external consequence |

Impact evaluation should consider, as applicable:

- confidentiality;
- integrity;
- availability;
- authentication and authorization;
- auditability;
- legal or contractual obligation;
- supplier dependency;
- accessibility commitments;
- reputation and trust;
- human oversight;
- AI misuse or unintended use;
- affected individuals or groups;
- data quality and provenance;
- and recoverability.

## 8. Risk Score and Rating

The default quantitative score is:

`risk score = likelihood × impact`

The following bands are used for prioritization:

| Score | Rating | Default expectation |
|---|---|---|
| 1–4 | Low | May be accepted by the risk owner if rationale is documented |
| 5–9 | Moderate | Review treatment options; acceptance requires explicit rationale |
| 10–16 | High | Treatment normally required; acceptance requires management-system owner approval |
| 17–25 | Critical | Do not knowingly introduce or continue without explicit management decision, documented rationale, and urgent treatment or avoidance |

A numerical score may be overridden upward when qualitative consequences justify stronger treatment. Any override must be documented.

## 9. Inherent and Residual Risk

Each material risk should be evaluated twice where practical:

1. **Inherent risk** — expected exposure before considering controls.
2. **Residual risk** — remaining exposure after considering existing and planned controls.

This distinction makes control effectiveness visible and prevents existing controls from hiding the seriousness of the underlying risk.

If reliable inherent scoring is not practical, the record may state why and focus on current/residual risk.

## 10. Risk Treatment

One or more of the following treatment approaches may be selected:

### Avoid

Remove the activity, feature, permission, integration, data use, supplier dependency, or other source of risk.

### Reduce

Apply controls that lower likelihood, impact, or both.

Examples include:

- stronger authorization;
- narrower permissions;
- input validation;
- rate limiting;
- logging;
- monitoring;
- secure configuration;
- dependency updates;
- architectural isolation;
- fallback behavior;
- human approval;
- additional testing;
- accessibility remediation;
- AI tool restrictions;
- or data minimization.

### Transfer or Share

Allocate part of the risk through a supplier, contractual arrangement, service provider, insurance mechanism, or shared operational responsibility.

Transfer does not remove WizardGang's responsibility to understand residual risk within its control.

### Accept

Retain the residual risk because further treatment is not justified, feasible, proportionate, or necessary within the approved scope.

Acceptance must include rationale and an authorized acceptance decision.

## 11. Risk Acceptance

Default acceptance authority is:

- **Low:** designated risk owner;
- **Moderate:** risk owner with documented rationale;
- **High:** management-system owner;
- **Critical:** management-system owner with explicit written decision and treatment/avoidance rationale.

A risk may not be marked accepted merely because no treatment has yet occurred.

Acceptance records should include:

- date;
- accepting authority;
- residual score/rating;
- rationale;
- review due date;
- and any conditions that would trigger reconsideration.

## 12. AI-Specific Risk and Impact Considerations

AI risks are recorded in the AI risk register but use the same core scoring method unless another method is explicitly documented for a specific assessment.

AI risk identification must consider, where relevant:

- intended use;
- foreseeable misuse;
- unauthorized or excessive tool use;
- permission escalation;
- incorrect or misleading output;
- harmful automation;
- insufficient human oversight;
- data leakage;
- sensitive or inappropriate input data;
- poor data quality or provenance;
- model/provider dependency;
- unavailability or degraded provider behavior;
- prompt or instruction manipulation;
- unexpected model behavior;
- output handling by downstream systems;
- auditability and traceability;
- limitations communicated to users;
- affected persons and groups;
- accessibility impacts;
- and changes in system capability over time.

AI risk records may additionally include:

- `aiSystemOrCapability`;
- `intendedUse`;
- `foreseeableMisuse`;
- `affectedParties`;
- `humanOversight`;
- `dataInputs`;
- `outputsAndActions`;
- `modelOrProvider`;
- `evaluationEvidence`;
- `impactAssessmentReference`;
- and `knownLimitations`.

## 13. AI Impact Assessment Interface

AI impact assessment is a related but distinct activity.

Risk assessment asks what uncertain events or conditions could affect objectives and how they should be treated.

AI impact assessment evaluates how the AI system or capability may affect individuals, groups, users, operators, or other interested parties across its intended use and foreseeable misuse.

An AI impact assessment must therefore not be replaced by a cybersecurity risk register alone.

When an AI capability is introduced or materially changed, the risk process determines whether a new or updated AI impact assessment is required.

At minimum, an impact assessment should examine:

- system purpose and intended use;
- system boundaries;
- affected parties;
- data and inputs;
- outputs and actions;
- human oversight;
- misuse scenarios;
- known limitations;
- potential positive and negative impacts;
- control measures;
- residual impacts;
- and approval/review decisions.

## 14. Opportunities

Clause 6 planning includes opportunities as well as risks.

Opportunities may include:

- automating a manual control;
- improving evidence retention;
- reducing supplier dependency;
- improving accessibility;
- strengthening observability;
- simplifying architecture;
- narrowing permissions;
- improving AI evaluation coverage;
- improving user transparency;
- or reducing operational cost without weakening controls.

Opportunities may be tracked through objectives, roadmap issues, or controlled `DEMO-###` changes rather than the risk register when that provides clearer ownership.

## 15. Review Triggers

Risks must be reviewed at least annually and when relevant changes occur.

Event-driven review triggers include:

- new or materially changed functionality;
- authentication or authorization changes;
- new data categories;
- new persistence or data flows;
- security incidents or near misses;
- new vulnerabilities;
- major dependency updates;
- new suppliers or material supplier changes;
- hosting or architecture changes;
- changes to public exposure;
- changes to recovery or availability assumptions;
- significant accessibility findings;
- new AI providers or models;
- new AI tools or permissions;
- changes to AI intended use;
- new AI data sources;
- AI evaluation failures;
- material changes to interested-party requirements;
- and audit or management-review findings.

## 16. Relationship to Controlled Changes

A `DEMO-###` change may trigger a management-system risk review, but the change's Low / Medium / High engineering-risk classification remains separate.

Examples:

- a documentation-only change may be **Low change risk** while documenting a **Critical security risk**;
- a schema migration may be **High change risk** while reducing an existing **High information-security risk**;
- an AI permission expansion may be **High change risk** and also create a new **High AI risk**.

Where a change materially affects a recorded risk, the associated pull request or commit should reference the risk ID.

## 17. Risk Register Structure

The management system will maintain separate but interoperable registers:

- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`.

A shared risk may appear in both registers only when the distinction adds useful accountability. Otherwise, one authoritative record should reference both frameworks.

Risk IDs should be permanent and sequential within their register, for example:

- `SEC-RISK-001`;
- `AI-RISK-001`.

Closed or superseded risks retain their identifiers and history.

## 18. Control Selection and Statement of Applicability

Risk treatment informs control selection.

For ISO/IEC 27001, applicable controls and exclusions are recorded in the ISO 27001 Statement of Applicability.

For ISO/IEC 42001, applicable AI controls and exclusions are recorded in the ISO 42001 Statement of Applicability or equivalent applicability record.

A control may be applicable because of:

- identified risk;
- interested-party requirement;
- legal or contractual obligation;
- management policy;
- operational need;
- or another justified requirement.

A control is not excluded simply because a current technical implementation does not yet exist.

Exclusions must contain rationale and must be revisited when scope or risk changes.

## 19. Treatment Tracking

Treatment actions should be tracked through the repository's normal work-management and change process.

Where implementation is required, the risk record should reference:

- issue or work item;
- `DEMO-###` change ID;
- branch or pull request;
- validation evidence;
- release;
- deployment evidence;
- and verification of effectiveness where applicable.

Treatment is not complete until the required action has occurred and residual risk has been reconsidered.

## 20. Risk Review and Closure

A risk may be closed when:

- the risk source has been removed;
- treatment reduced exposure to a level that no longer requires active tracking;
- the affected asset or process left scope;
- or the risk was superseded by a more accurate record.

Closure must include rationale and evidence.

Closed risks remain retained as management-system history.

## 21. Evidence

Risk-management evidence may include:

- risk registers;
- AI impact assessments;
- Statements of Applicability;
- pull requests and reviews;
- security tests;
- AI evaluations;
- CI evidence;
- vulnerability findings;
- dependency audit results;
- architecture records;
- incident records;
- supplier information;
- logs and operational observations;
- release and deployment records;
- management-review decisions;
- and corrective-action records.

## 22. Initial Deliverables

Adoption of this methodology creates the following follow-on management-system work:

1. establish the initial information-security risk register;
2. establish the initial AI risk register;
3. perform the initial risk assessments;
4. define treatment decisions;
5. establish the ISO/IEC 27001 Statement of Applicability;
6. establish the ISO/IEC 42001 applicability record / Statement of Applicability;
7. perform an AI impact assessment for the in-scope MCP/AI capability;
8. connect treatment actions to controlled repository work;
9. record residual-risk acceptance;
10. periodically review risk status and effectiveness.

Until those activities occur, this methodology demonstrates that the process is defined but does not by itself demonstrate that all Clause 6 risk activities have been completed.

## 23. Alignment

This methodology supports:

- ISO/IEC 27001:2022 §6.1.1 — actions addressing risks and opportunities;
- ISO/IEC 27001:2022 §6.1.2 — information security risk assessment;
- ISO/IEC 27001:2022 §6.1.3 — information security risk treatment;
- ISO/IEC 42001:2023 §6.1.1 — actions addressing risks and opportunities;
- ISO/IEC 42001:2023 §6.1.2 — AI risk assessment;
- ISO/IEC 42001:2023 §6.1.3 — AI risk treatment;
- ISO/IEC 42001:2023 §6.1.4 — AI system impact assessment planning and integration.

**Current posture after approval:** Risk methodology defined and controlled. Initial risk registers, treatment decisions, Statements of Applicability, and completed AI impact assessment remain separate required evidence.
