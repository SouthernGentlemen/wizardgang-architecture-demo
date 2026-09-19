# Risk Management and Operational Reassessment

**Reference:** WG-GOV-007
**Applies to:** ISO/IEC 27001:2022 §6.1 and §8.2–§8.3 · ISO/IEC 42001:2023 §6.1 and §8.2–§8.4
**Status:** Approved
**Owner:** WizardGang
**Approval:** Controlled pull request and merge
**Review:** At least annually and after material changes to scope, context, architecture, suppliers, identity, data handling, security posture, incidents, or AI capability

## 1. Purpose

This document defines the repeatable risk methodology for the WizardGang Architecture Demo and the operating process for reassessing information-security risk, AI risk, AI impact, treatment, residual risk, and control applicability.

Management-system risk is distinct from the Low/Medium/High implementation-risk label attached to an individual controlled change. Change risk estimates delivery risk; management-system risk evaluates conditions that can affect security, AI behavior or impacts, interested parties, obligations, or management-system objectives.

The canonical risk records are maintained under `assurance/risks/`. This document defines the method, not a duplicate risk register.

## 2. Risk principles

Risk management follows these principles:

1. **Evidence over assumption.** Use architecture, incidents, tests, supplier information, operational observations, requirements, and other credible evidence where available.
2. **Explicit ownership.** Every durable risk has an accountable owner.
3. **Consistent evaluation.** Comparable risks use the same likelihood and impact method.
4. **Residual risk is explicit.** Existing controls do not erase the underlying exposure.
5. **Acceptance is a decision.** Accepted residual risk requires identified authority and rationale.
6. **Controls follow risk and requirements.** A standard listing alone is not the reason for a control.
7. **AI impacts extend beyond cybersecurity.** Human impact, misuse, incorrect behavior, transparency, data quality, and oversight may matter even when confidentiality, integrity, and availability are unaffected.
8. **Reassessment follows material change or evidence.**
9. **Scores support prioritization; they are not proof of safety or conformity.**

## 3. Risk record and ownership

A durable risk record contains enough information to reconstruct the decision without relying on memory. At minimum it identifies:

- permanent risk ID and framework/domain;
- title, description, source, affected asset/process or party;
- credible cause or threat and consequence;
- existing controls;
- likelihood and impact;
- inherent and residual rating where practical;
- selected treatment and treatment actions;
- related controls, obligations, objectives, incidents, suppliers, or assessments as applicable;
- owner and acceptance authority;
- lifecycle status;
- review due/last-reviewed information;
- supporting evidence and material notes.

AI risks may additionally identify intended use, affected parties, provider/model dependency, data inputs/outputs, tool or permission boundary, foreseeable misuse, human oversight, and impact-assessment relationships.

## 4. Likelihood and impact

Likelihood uses a five-point scale:

| Score | Rating | Guidance |
|---|---|---|
| 1 | Rare | Not expected in normal operation; exceptional conditions required |
| 2 | Unlikely | Credible but not expected; limited exposure or strong prevention |
| 3 | Possible | Plausible during ordinary operation or through a credible failure path |
| 4 | Likely | Expected periodically or exposure is substantial |
| 5 | Almost certain | Expected frequently, recurring, or conditions strongly favor occurrence |

Impact also uses a five-point scale:

| Score | Rating | Guidance |
|---|---|---|
| 1 | Insignificant | Negligible effect; no meaningful loss of objective or trust |
| 2 | Minor | Limited, recoverable effect with little external consequence |
| 3 | Moderate | Material service, security, governance, accessibility, or AI impact requiring corrective work |
| 4 | Major | Significant compromise, outage, harmful AI behavior, data exposure, or management-system failure |
| 5 | Severe | Catastrophic or sustained impact, serious harm, major breach, systemic loss of control, or unacceptable external consequence |

Impact considers the dimensions relevant to the risk, including confidentiality, integrity, availability, authorization, auditability, legal/contractual duties, supplier dependency, accessibility commitments, trust, recoverability, human oversight, AI misuse, affected parties, and data quality/provenance.

The default score is `likelihood × impact`:

| Score | Rating | Default treatment expectation |
|---|---|---|
| 1–4 | Low | May be accepted by the risk owner with rationale |
| 5–9 | Moderate | Review treatment options; acceptance requires explicit rationale |
| 10–16 | High | Treatment normally required; acceptance requires Management-System Owner approval |
| 17–25 | Critical | Do not knowingly introduce or continue without explicit management decision and urgent treatment or avoidance rationale |

A rating may be raised when qualitative consequences justify stronger treatment. Any override is documented.

## 5. Inherent and residual risk

Material risks are evaluated before controls and after controls when practical:

- **inherent risk** describes the exposure before considering existing controls;
- **residual risk** describes the remaining exposure after considering operating and planned controls.

If an inherent score cannot be estimated credibly, the record states the limitation rather than manufacturing precision.

## 6. Risk treatment and acceptance

Treatment choices are:

- **Avoid** — remove the activity, feature, data use, permission, integration, supplier dependency, or other source of risk.
- **Reduce** — apply controls that lower likelihood, impact, or both.
- **Transfer/Share** — allocate part of the risk through a supplier, contractual arrangement, service provider, or other shared responsibility without treating WizardGang's residual responsibility as eliminated.
- **Accept** — retain residual risk because further treatment is not justified, feasible, proportionate, or necessary for the approved scope.

Default acceptance authority is:

- Low — designated Risk Owner;
- Moderate — Risk Owner with documented rationale;
- High — Management-System Owner;
- Critical — Management-System Owner with explicit written decision and treatment/avoidance rationale.

Risk acceptance does not change a compliance or assurance conclusion by itself.

## 7. AI-specific risk and impact

AI risk analysis considers, as applicable:

- intended and foreseeable use;
- affected users or other parties;
- tool and permission boundaries;
- input/output data, quality, provenance, retention, and disclosure;
- hallucination or incorrect output where application behavior can depend on it;
- automation bias and inadequate human oversight;
- malicious or out-of-scope invocation;
- prompt/tool manipulation and authorization bypass;
- provider/model dependency;
- transparency and user responsibility;
- accessibility and human usability;
- graceful degradation and fallback;
- security and privacy impacts;
- change in authority, autonomy, provider, or data scope.

The AI impact assessment is a related operating record. It does not replace the risk register and the risk register does not replace impact assessment where impact-specific review is required.

## 8. Control selection and Statements of Applicability

Applicable controls are selected because they address identified risks, obligations, interested-party requirements, management-system needs, or other justified control objectives.

The structured ISO/IEC 27001 and ISO/IEC 42001 compliance records are authoritative for applicability, rationale, implementation/evidence status, gaps, and documentation/evidence relationships. A not-applicable decision requires a rationale; provider ownership alone does not remove WizardGang's configuration, integration, oversight, or supplier responsibilities.

When a risk, treatment, scope, or requirement changes the control basis, the relevant structured compliance record is reassessed.

## 9. Operational reassessment

Risk assessment is not a one-time planning artifact. During operation, a reassessment determines whether the existing risk description, score, controls, treatment, owner, acceptance, evidence, and review date still reflect actual conditions.

Information-security reassessment considers changes in threat exposure, vulnerabilities, identities, permissions, secrets, configuration, data, dependencies, provider behavior, incidents, recovery assumptions, and operational evidence.

AI reassessment additionally considers intended use, affected parties, model/provider, tools, permissions, autonomy, data, prompts/workflows, human oversight, misuse paths, evaluation results, incidents, and impact assumptions.

## 10. Reassessment triggers

Reassessment is required when material evidence or change can invalidate a prior decision. Triggers include:

- management-system scope, context, interested-party, obligation, or architecture change;
- new or materially changed supplier, identity provider, dependency, runtime service, or data flow;
- vulnerability, incident, near miss, abuse path, audit finding, failed control, or material monitoring trend;
- missed objective or stale evidence relevant to the risk;
- new AI provider, model family, tool, permission, write/destructive/privileged authority, data source, affected party, intended use, autonomous behavior, or reduced human oversight;
- material accessibility or user-safety issue;
- change in applicable standard, law, contract, or public commitment;
- periodic review due date.

## 11. Treatment planning and implementation

A treatment plan identifies the selected response, actions, owner, priority, target or review date, related controls, required evidence, and any dependency or acceptance condition.

Technical treatments are implemented through the controlled engineering/release process. Operational treatments use the relevant operating procedure. Supplier, policy, data, access, continuity, audit, or competence treatments update their authoritative records rather than being hidden in code changes.

A treatment is not complete because a task was merged. Completion requires the intended control to exist and the evidence required by the treatment to be available.

## 12. Treatment verification and closure

After treatment:

1. verify the intended control or operating change;
2. recalculate residual likelihood/impact where meaningful;
3. review whether residual risk is within the authorized acceptance boundary;
4. update related controls, objectives, suppliers, incidents, assessments, or obligations where required;
5. retain evidence;
6. assign the next review or close/supersede the risk according to the structured lifecycle.

A risk may remain open after implementation when operating evidence, effectiveness verification, supplier action, or a management decision is still outstanding.

## 13. AI impact reassessment

AI impact reassessment is required when a change can materially alter intended use, affected parties, authority, autonomy, data, provider/model dependency, transparency, human oversight, misuse potential, or other impact assumptions.

The reassessment records the changed condition, affected impact/risk assumptions, evidence, resulting treatment or control changes, and whether the existing AI impact assessment remains adequate.

The current public MCP boundary remains read-only. Any expansion into write, destructive, privileged, deployment, private-data, autonomous, third-provider, or reduced-oversight behavior requires explicit supplier, risk, impact, Statement-of-Applicability, data, and testing review before the expanded behavior is treated as approved.

## 14. Incident, supplier, and change interfaces

Incidents and near misses trigger reassessment when they reveal a new risk, changed likelihood/impact, ineffective treatment, or invalid assumption.

Supplier changes or failures trigger reassessment when they affect service criticality, data, access, location, obligations, availability, security, AI behavior, exit strategy, or shared responsibility.

Controlled changes trigger reassessment according to `docs/governance/GOVERNANCE.md` when they materially affect management-system assumptions.

## 15. Evidence and review

Risk evidence may include architecture, structured records, tests, CI results, incidents, provider information, operational observations, audit findings, AI evaluations, impact assessments, supplier reviews, releases, and controlled change records.

Review the methodology at least annually and when management-system scope, risk vocabulary, scoring, acceptance authority, AI impact practice, or structured risk contracts materially change.

## Alignment

This document provides the risk, treatment, acceptance, and operational-reassessment method for the in-scope ISO/IEC 27001 and ISO/IEC 42001 requirements. Exact risk records and compliance conclusions remain in structured assurance data.
