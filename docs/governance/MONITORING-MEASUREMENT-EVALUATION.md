# Monitoring, Measurement, Analysis, and Evaluation

**Reference:** WG-GOV-012  
**Applies to:** ISO/IEC 27001:2022 §9.1 · ISO/IEC 42001:2023 §9.1  
**Status:** Approved
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually and when objectives, scope, risks, suppliers, architecture, evidence sources, or AI capability materially change

## 1. Purpose

This document defines how the WizardGang Architecture Demo monitors, measures, analyzes, and evaluates the performance and effectiveness of its integrated information-security management system (ISMS) and AI management system (AIMS).

The project already produces operational and engineering evidence through GitHub, CI, releases, Cloudflare runtime behavior, D1 records, health checks, logs, risk registers, accessibility validation, and MCP evaluation. Clause 9.1 requires those signals to be used deliberately: what is measured, how it is measured, when it is reviewed, who evaluates it, what result is expected, and what happens when evidence is missing or performance is unacceptable.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification or independent assurance.

## 2. Measurement Principles

Monitoring and measurement follow these rules:

1. **Measure useful outcomes.** A metric should support a policy commitment, objective, risk decision, control, interested-party requirement, or management decision.
2. **Reuse operating evidence.** Existing source, CI, release, runtime, audit, and assessment records are preferred over duplicate reporting systems.
3. **Evidence before status.** A control, risk treatment, or objective is not considered effective because it is documented or because implementation merged.
4. **Automation has limits.** Automated checks establish only the condition they test. Manual, specialist, operational, or management evidence is required where automation cannot establish effectiveness.
5. **Missing evidence is visible.** Missing, stale, incomplete, or unreliable evidence is not replaced with synthetic success.
6. **Trends matter.** Repeated near misses, degradation, stale evidence, recurring failed checks, or repeated manual exceptions may be material even when a single threshold is not crossed.
7. **Security and AI conclusions remain distinguishable.** AI performance, human-impact, authorization, misuse, data, and oversight concerns are not reduced to cybersecurity telemetry alone.
8. **Public assurance stays qualified.** Measurement results support an aligned — uncertified posture and do not imply certification.

## 3. Measurement Lifecycle

The normal evaluation loop is:

```text
objective / risk / control / requirement
        ↓
define metric or evidence expectation
        ↓
collect operational / engineering / assessment evidence
        ↓
validate evidence quality and freshness
        ↓
compare result with target, threshold, or expected condition
        ↓
record conclusion and variance
        ↓
continue / investigate / treat / correct / reassess / escalate
        ↓
feed management review and continual improvement
```

A measurement may be continuous, event-driven, release-driven, monthly, quarterly, annual, or triggered by a material change.

## 4. Measurement Roles

Functional ownership follows `docs/governance/ROLES-RESPONSIBILITIES.md`.

| Function | Measurement responsibility |
|---|---|
| Management-system owner | Ensures the measurement program remains adequate; reviews material variance, overdue evidence, objective status, and management-system effectiveness. |
| Security owner | Evaluates security risks, secret exposure, vulnerabilities, incident readiness, access/security-control evidence, and security treatment effectiveness. |
| AI management / capability owner | Evaluates MCP tool authority, AI risks, AI evaluation coverage/results, data-boundary evidence, impact-assessment triggers, and AI treatment effectiveness. |
| Release / operations owner | Evaluates release traceability, deployment verification, health, availability, recovery, degraded behavior, logs, and operational evidence. |
| Accessibility owner | Evaluates automated and manual accessibility evidence, known gaps, test freshness, and regressions. |
| Evidence / compliance owner | Evaluates checklist/SoA evidence links, N/A rationale, `lastVerified` freshness, management-system record review dates, and evidence completeness. |
| Independent reviewer / auditor | Evaluates management-system effectiveness when an internal audit or independent review is performed; ordinary self-monitoring is not represented as independent audit. |

One person may currently perform multiple functions, but the responsibilities and decision authorities remain distinct.

## 5. Measurement Catalog

The following catalog defines the initial measurements for the current scope.

| ID | Area | What is monitored / measured | Method and evidence | Cadence / trigger | Owner | Expected condition / target | Initial state |
|---|---|---|---|---|---|---|---|
| MON-001 | Release integrity | Production deployment traceability | Compare deployed version/SHA with controlled commit, tag/release, deployment record, and `/version` evidence | Each production release; quarterly summary | Release owner | 100% traceable production deployments; aligns to SEC-OBJ-001 | Active |
| MON-002 | CI / validation | Controlled source validation health | GitHub Actions results for lint, typecheck, tests, contracts, routes, localization, security, migrations, dependency audit, build, evidence generation, and controlled-history checks | Each PR/push/release | Repository/change owner | Required checks pass before approved release; failures remain visible | Active |
| MON-003 | Secrets | Confirmed credential or secret exposure | Repository review/security checks, public-log review, incident records, credential-rotation decisions | Continuous; review quarterly and after suspected exposure | Security owner | 0 confirmed exposures; aligns to SEC-OBJ-002 | Active |
| MON-004 | Vulnerabilities | Dependency and security findings | Dependency audit/security workflow output, security reports, issues, treatment changes | Each controlled validation; review monthly/quarterly | Security owner | Material findings have owner/treatment; critical unresolved exposure escalates | Active |
| MON-005 | Security risk | High/Critical risk treatment accountability | Security risk register fields for owner, treatment, status, review date, linked evidence | Monthly; after trigger events | Security owner / management-system owner | 100% of High/Critical risks have active accountable treatment or explicit authorized acceptance | Active |
| MON-006 | AI risk | High/Critical AI risk treatment accountability | AI risk register, impact assessment, controlled changes, evaluation evidence | Monthly; after material AI change/evaluation failure | AI owner / management-system owner | 100% of High/Critical AI risks have active treatment or explicit authorized acceptance | Active |
| MON-007 | Health | Worker and dependency operational status | `/health`, scheduled health observations, D1 readiness, configured R2/DO readiness, demo-control state | Five-minute collection where configured; operational review as needed | Operations owner | Unexpected down/degraded conditions are visible and distinguishable from intentional offline state | Active |
| MON-008 | Availability | Observed service availability | `service_health_checks`, dashboard uptime calculations, observation window and failure classification | Five-minute observations; monthly/quarterly trend review | Operations owner | Trend is evaluated; no SLA is implied unless separately approved | Active |
| MON-009 | Operational diagnostics | Material application errors and control failures | Sanitized `application_logs`, error/warn trends, health failures, audit events | Continuous; event-driven review; quarterly trend review | Operations/security owner | Material recurring failures are investigated; credentials/private data absent from public logs | Active |
| MON-010 | Admin control | Privileged demo/crawler-state changes | `demo_events`, D1 control state, protected admin behavior, same-origin/auth evidence | Each privileged state transition; quarterly review | Operations/security owner | Every material admin transition attributable and auditable; unauthorized mutation fails closed | Active |
| MON-011 | Recovery | Recovery readiness and completed recovery tests | Defined procedure, rollback evidence, D1/R2 recovery documentation, completed test record | Quarterly progress; at least one test by 2026-12-02 | Operations owner | SEC-OBJ-004 target satisfied with actual recovery evidence | Planned |
| MON-012 | Incident readiness | Incident process performance/readiness | Incident procedure, incident records, exercises, triage/containment/recovery decisions, corrective actions | After each material incident; quarterly readiness review | Security owner | 100% of material incidents handled through adopted process; readiness not inferred from absence of incidents | Planned |
| MON-013 | Supplier governance | Critical supplier review coverage | Supplier register, role/owner, risk rationale, material changes, review evidence | Quarterly progress; annual review; material supplier change | Management-system owner | 100% of identified critical suppliers reviewed within required cadence | Planned |
| MON-014 | MCP authority | Public MCP tool inventory and authority classification | `src/api/mcp.ts`, tool schemas/annotations, authorization boundary, MCP evaluation | Each MCP change; quarterly review | AI capability owner | 100% tools inventoried/classified; 0 unapproved privileged/write/destructive public tools | Active |
| MON-015 | MCP / AI evaluation | Approved and prohibited AI-boundary behaviors | Executable evaluation cases, MCP tests, CI evidence, evaluation audit events | Each material MCP change/release; quarterly | AI capability / quality owner | Current baseline passes; planned matrix expands per AI-OBJ-003 | Active / expansion Planned |
| MON-016 | AI reassessment | Material AI changes receiving governance review | `DEMO-###` records, AI risk register, impact assessment revisions, PR evidence | Every material authority/data/provider/intended-use/oversight change | AI owner / management-system owner | 100% of triggered changes reassessed before previous conclusion is reused | Active |
| MON-017 | AI data boundary | AI-accessible data transparency and sensitive-field exclusion | MCP source/contracts, data records, impact assessment, tests, provenance/freshness metadata when implemented | Quarterly; schema/data changes | AI/data owner | All public AI data surfaces documented; no known sensitive fields exposed | Planned |
| MON-018 | Accessibility | Automated accessibility regression evidence | Automated accessibility/axe evidence and applicable CI checks | Each relevant UI change/release | Accessibility owner | No known automated regression left unexplained; automation not represented as full conformance | Active |
| MON-019 | Accessibility | Manual WCAG evidence freshness | Manual matrix, browser/AT/date/result, checklist `lastVerified`, open gaps | At planned manual review and after material UI behavior changes | Accessibility owner | Required manual evidence remains current enough for claims; missing tests remain Partial/Gap | Planned / Partial |
| MON-020 | Compliance evidence | Checklist and SoA evidence freshness | Compliance registry, evidence links, N/A rationale, review dates, `lastVerified` | Monthly freshness check; material scope/control change | Evidence/compliance owner | 0 critical governance records >30 days overdue; aligns to GOV-OBJ-001 | Planned |
| MON-021 | Objectives | Security/AI objective performance | `OBJECTIVES.md` plus underlying evidence for each metric | Monthly/quarterly according to objective; management review | Management-system owner | Every active objective has an observed result or explicit evidence gap | Planned / Active by objective |
| MON-022 | Risk treatment effectiveness | Whether completed treatments changed exposure as intended | Implementation evidence, validation, operational observation, updated residual risk | At treatment completion; after relevant incidents/changes; periodic review | Risk owner | No treatment marked effective solely because implementation merged | Planned / event-driven |
| MON-023 | SoA posture | Control applicability and evidence status | ISO 27001/42001 SoAs, scope, risks, policies, evidence changes | At least annually; material scope/risk/control change | Evidence/compliance + control owner | N/A rationale remains valid; status reflects evidence; gaps are not hidden | Active baseline; recurring review Planned |
| MON-024 | Governance records | Required review-date compliance | Metadata across policies, scope, risk method, registers, SoAs, impact assessment, objectives and support/operation docs | Monthly; management review | Management-system owner | Critical records not >30 days overdue; overdue status visible | Planned |
| MON-025 | Cost/degradation | Resource-usage visibility and graceful-degradation behavior | Cloudflare usage snapshot, billing simulator, degraded behavior validation | Usage collection cadence; release/quarterly behavior review | Operations owner | Live usage/estimated cost correctly labeled; degradation preserves critical operational surfaces | Active where telemetry configured |

## 6. Measurement Methods and Evidence Quality

### 6.1 Automated measurements

Automated measurements may be generated by:

- GitHub Actions;
- unit/contract/integration tests;
- route and migration validation;
- dependency/security checks;
- scheduled health collection;
- D1 audit/event records;
- application logs;
- MCP evaluation;
- version/deployment metadata;
- and usage telemetry.

Automated evidence should identify the relevant commit, release, timestamp, environment, or event where practical.

### 6.2 Manual measurements

Manual evidence is required where the quality being assessed depends on human observation, judgment, specialist review, or context that automation does not establish.

Examples include:

- keyboard and assistive-technology behavior;
- whether a risk treatment is proportionate;
- residual-risk acceptance;
- supplier assurance review;
- incident lessons learned;
- AI impact on affected parties;
- policy adequacy;
- management-system effectiveness;
- and management review.

Manual evidence records should state who performed the review, when, what was reviewed, the method used, the result, and any limitations.

### 6.3 Evidence quality

Before relying on a measurement, the reviewer should consider whether the evidence is:

- attributable;
- sufficiently current;
- scoped to the relevant environment/capability;
- complete enough for the conclusion;
- reproducible or explainable where appropriate;
- protected from unauthorized alteration at a level proportionate to its use;
- and free from misleading synthetic or substituted data.

Where evidence quality is insufficient, the result is recorded as incomplete, stale, unavailable, or requiring follow-up rather than inferred as passing.

## 7. Evaluation Status

A measurement result may be summarized using the following evaluation states where useful:

- **Within target** — evidence satisfies the defined target for the measurement period;
- **Watch** — target currently holds but trend, freshness, dependency, or known limitation warrants attention;
- **At risk** — evidence indicates the target is likely to be missed or cannot currently be established;
- **Outside target** — defined target or control condition is not met;
- **Not measured** — required measurement has not yet been established;
- **Not enough evidence** — measurement exists, but available evidence cannot support the conclusion;
- **N/A** — measurement is not applicable to the current approved scope and rationale is retained.

These states are not ISO certification scores and do not automatically replace checklist, SoA, objective, risk, or incident statuses.

## 8. Analysis and Trends

Evaluation should consider both individual results and patterns over time.

Trend analysis may identify:

- repeated CI failures in the same control area;
- recurring authorization or input-validation failures;
- rising operational error rates;
- availability degradation;
- repeated dependency vulnerabilities;
- repeated evidence staleness;
- objectives repeatedly remaining At risk or Missed;
- treatments that do not materially reduce residual risk;
- supplier instability;
- accessibility regressions;
- repeated MCP evaluation failures;
- changing AI misuse patterns;
- growth in AI authority or data exposure;
- or increased reliance on manual exceptions.

A trend can require action even when no single measurement independently crosses a fixed threshold.

## 9. Variance and Escalation

A measurement outside its expected condition is handled proportionately.

Possible responses include:

- correct the evidence or measurement if the data is wrong;
- open an issue or controlled `DEMO-###` change;
- update a security or AI risk record;
- perform or revise risk treatment;
- reopen the AI impact assessment;
- block, delay, roll back, or degrade a release/capability;
- initiate incident handling;
- revise a supplier assessment;
- update an objective;
- create a corrective-action record;
- or escalate the matter to management review.

The following conditions normally require prompt escalation to the relevant owner:

- confirmed secret or credential exposure;
- unauthorized privileged action;
- Critical residual risk or materially worsened High risk;
- failed security boundary allowing access outside approved authority;
- material private/sensitive data exposed through a public surface;
- unapproved AI write/destructive/privileged authority;
- a material AI impact outside the current assessment assumptions;
- inability to establish the integrity of a production release;
- repeated failure of a critical operational control;
- or evidence indicating a serious incident may have occurred.

## 10. Relationship to Objectives

`docs/governance/registers/OBJECTIVES.md` defines the management-system objectives and targets.

This measurement framework is the operating mechanism used to determine whether those objectives are:

- Planned;
- Active;
- Met;
- At risk;
- Missed;
- or Retired.

Approval of an objective does not create a measurement result.

Where a metric has no operating evidence yet, its objective stays Planned or At risk as appropriate rather than being marked Met.

## 11. Relationship to Risk and Treatment

Monitoring is a primary input to operational risk reassessment.

A measurement may:

- identify a new risk;
- change likelihood or impact assumptions;
- show that an existing control is weaker or stronger than assumed;
- provide evidence that a treatment was implemented;
- provide evidence that treatment is or is not effective;
- justify revised residual risk;
- trigger risk acceptance review;
- or show that a risk can be closed or must be reopened.

Implementation evidence and effectiveness evidence are distinct.

For example, a new authorization check may prove that a treatment was implemented. Repeated negative authorization tests and production observation may later provide stronger evidence that the treatment is effective.

## 12. AI Evaluation and Impact Monitoring

AI monitoring for the current scope focuses on the controlled MCP boundary rather than attempting to score every behavior of arbitrary external models.

Evaluation includes, as applicable:

- exposed tool inventory;
- read/write/destructive classification;
- authorization parity with ordinary application boundaries;
- valid and invalid namespace/input behavior;
- unsupported-method behavior;
- malformed request handling;
- sensitive-field exclusion;
- indirect-instruction/untrusted-content handling scenarios;
- client/protocol compatibility;
- auditability;
- human-oversight assumptions;
- data provenance/freshness limitations;
- and capability changes over time.

Passing evaluation does not prove complete AI safety.

Material changes to AI authority, data, intended use, affected parties, provider dependencies, autonomy, or human oversight are evaluated under `docs/governance/OPERATIONAL-RISK-AND-AI-REASSESSMENT.md` and may require a revised impact assessment before the previous conclusion is reused.

## 13. Accessibility Measurement

Accessibility measurement distinguishes automated checks from manual conformance evidence.

Automated evidence may identify detectable violations and regressions but cannot establish full WCAG conformance.

Manual evidence should be retained for criteria requiring human interaction or assistive-technology judgment, including relevant keyboard, focus, screen-reader/semantic, reflow/zoom, forced-color, reduced-motion, authentication, dragging, target-size, and consistent-help behavior.

Where a manual criterion has not been tested, its checklist row remains Partial, Gap, or otherwise accurately qualified rather than being inferred from automated success.

## 14. Supplier and External Dependency Measurement

Supplier monitoring is proportional to supplier criticality and the portion of the service within WizardGang control.

Relevant signals may include:

- material service outages;
- security advisories;
- provider configuration changes;
- terms/service changes affecting requirements;
- identity or permission-model changes;
- dependency vulnerabilities;
- support/deprecation notices;
- changes to data handling or AI/model behavior;
- and changes to provider assurance evidence when available.

The absence of internal visibility into a provider is not treated as evidence that provider controls are effective.

Formal supplier-review evidence remains Planned until the supplier register/review process is actually operated.

## 15. Reporting and Retention

Measurement evidence is retained in the system appropriate to its source.

Examples include:

- Git commits and pull requests;
- GitHub Actions runs and retained validation artifacts;
- tags and releases;
- deployment/version metadata;
- D1 audit events;
- bounded application logs;
- health and uptime records;
- risk registers;
- impact assessments;
- SoAs;
- objective review records;
- accessibility manual evidence;
- supplier reviews;
- incident/corrective-action records;
- and management-review records.

Quarterly and management-review summaries should record, where relevant:

- measurement ID;
- measurement period;
- observed result;
- evidence reference;
- evaluation status;
- trend or material variance;
- action required;
- owner;
- and next review date.

Raw data need not be duplicated into governance documents when a durable authoritative source already exists; the governance record may reference that evidence.

## 16. Measurement Changes

A measurement may be added, changed, retired, or re-baselined when:

- scope changes;
- risks change;
- objectives change;
- control design changes;
- evidence proves the existing metric unhelpful;
- architecture or suppliers change;
- data sources change;
- AI authority/intended use/data/provider/affected parties change;
- audit or management review identifies a gap;
- or a measurement becomes unreliable or disproportionately costly.

Material measurement changes use the controlled Git process and retain rationale.

Targets should not be weakened solely to make an unfavorable result appear compliant.

## 17. Current Evidence and Gaps

The current project already has meaningful operating measurements for:

- controlled CI validation;
- release/source traceability;
- health and scheduled availability observations;
- logs and audit events;
- secret/public-evidence boundaries;
- dependency/security checks;
- current MCP authority and selected boundary evaluation;
- security and AI risk-register ownership/treatment fields;
- and the initial SoA/checklist posture.

The following measurements remain incomplete or require recurring evidence before they should be represented as mature:

- completed recovery/restore testing;
- incident-process exercises or actual incident performance records;
- formal supplier-review coverage;
- expanded MCP/AI evaluation matrix;
- formal AI data-governance/provenance evidence;
- recurring manual accessibility evidence freshness;
- recurring governance/checklist `lastVerified` measurement;
- objective result history;
- treatment-effectiveness history;
- and formal audit/management-review conclusions.

These are intentional evidence gaps to be closed through actual operation rather than retroactive documentation.

## 18. Management Review Interface

Management review consumes the results of this measurement program.

Inputs should include, as applicable:

- objective results and trends;
- risk and treatment status;
- incidents and near misses;
- security and dependency findings;
- health/availability and recovery evidence;
- supplier performance and changes;
- accessibility evidence and gaps;
- AI evaluations, AI risks, impact-assessment status, and capability changes;
- audit/self-assessment findings;
- corrective-action effectiveness;
- evidence freshness;
- and opportunities for improvement.

Management review decides whether the management system remains suitable, adequate, and effective for the declared scope and what actions/resources/changes are required next.

## 19. Supporting Evidence

Primary supporting material includes:

- `docs/governance/registers/OBJECTIVES.md`;
- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/OPERATIONAL-PLANNING-CONTROL.md`;
- `docs/governance/OPERATIONAL-RISK-AND-AI-REASSESSMENT.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- `docs/governance/soa/ISO-27001-SOA.md`;
- `docs/governance/soa/ISO-42001-SOA.md`;
- `docs/OPERATIONS.md`;
- `docs/EVIDENCE.md`;
- `docs/ACCESSIBILITY.md`;
- `SECURITY.md`;
- `.github/workflows/ci.yml`;
- deployment workflows;
- source implementing health/logging/audit/MCP behavior;
- and retained release/runtime evidence.

## 20. Alignment

This document supports:

- **ISO/IEC 27001:2022 §9.1 — monitoring, measurement, analysis, and evaluation**;
- **ISO/IEC 42001:2023 §9.1 — monitoring, measurement, analysis, and evaluation**.

**Current posture after approval:** the project has a defined measurement framework connected to existing operational evidence and measurable objectives. Several measurements are already active, while supplier review, recovery testing, incident readiness, expanded AI evaluation, manual accessibility freshness, objective history, and treatment-effectiveness history still require actual operating evidence. Certification is not claimed.
