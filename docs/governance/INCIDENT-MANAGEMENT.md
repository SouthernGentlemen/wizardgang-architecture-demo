# Incident Management and Response

**Reference:** WG-GOV-017  
**Applies to:** ISO/IEC 27001:2022 incident-management and improvement requirements · ISO/IEC 42001:2023 AI incident/concern and improvement requirements  
**Status:** Proposed  
**Owner:** Management-System Owner / Incident and Corrective-Action Owner  
**Approval:** Controlled pull request and merge  
**Review:** At least annually, after every material incident or exercise, and after material scope, supplier, architecture, security, data, or AI/MCP change

## 1. Purpose

This document defines how the WizardGang Architecture Demo identifies, triages, contains, investigates, recovers from, records, communicates, reviews, and learns from incidents affecting the integrated information security management system (ISMS) and AI management system (AIMS).

The process uses the existing Git, release, operational, logging, risk, supplier, AI-impact, management-review, and corrective-action systems rather than creating a parallel incident platform.

Approval of this procedure establishes the response process. It does **not** claim that a material incident has already occurred, that an incident exercise has already been completed, or that incident readiness has been independently assured.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Incident Principles

Incident handling follows these rules:

1. **Protect first, explain second.** Containment and safe operation take priority over preserving normal demo availability.
2. **Preserve evidence.** Relevant logs, audit events, commits, releases, configuration state, timestamps, provider notices, and other evidence are retained before unnecessary mutation where practical.
3. **No public-secret handling.** Credentials, private infrastructure details, sensitive payloads, or other restricted evidence are not copied into public issues, public logs, or public compliance surfaces.
4. **Severity is impact based.** A dramatic error message is not automatically severe; a subtle authorization or AI-authority failure may be severe.
5. **Supplier incidents remain shared-responsibility events.** Provider failure does not remove WizardGang's responsibility to contain its integration, communicate accurately, and reassess risk.
6. **AI incidents are not reduced to cybersecurity.** Incorrect authority, misleading behavior, unsafe downstream use, data/provenance problems, loss of oversight, or material misuse may require AI incident handling even without a confidentiality breach.
7. **Correction and corrective action are distinct.** Restoring service is not the same as preventing recurrence.
8. **Closure requires evidence.** An incident is not closed merely because the site is back online or a patch merged.
9. **Claims remain bounded.** Incident handling must not create unsupported legal, certification, provider-assurance, or safety claims.

## 3. What Counts as an Incident

An incident is an observed event or condition that materially threatens or causes loss of an approved security, AI, operational, supplier, data, accessibility, evidence, or management-system expectation.

Examples include:

- confirmed or suspected credential exposure;
- unauthorized privileged access or state change;
- authorization-scope bypass across REST, GraphQL, MCP, identity, admin, webhook, or storage boundaries;
- source-control, CI/CD, release, or deployment compromise;
- sensitive information exposed through public logs, health, evidence, or API responses;
- persistent data loss or corruption;
- material Cloudflare or GitHub dependency failure affecting controlled operation;
- forged or replayed webhook behavior;
- material vulnerability exploitation or credible active abuse;
- sustained availability or resource-exhaustion event requiring operational intervention;
- loss of reliable audit/evidence records affecting assurance claims;
- MCP tool authority operating beyond its approved boundary;
- Codex or Claude integration behavior materially violating the approved MCP assumptions;
- unintended exposure of private/sensitive data through AI/MCP;
- AI output/data behavior causing a material foreseeable impact within WizardGang's controlled boundary;
- loss of required human oversight for a material AI capability;
- supplier change or incident invalidating security or AI assumptions;
- material accessibility regression that blocks a critical public operation or security mechanism;
- and a significant management-system failure requiring immediate correction.

A failed test, minor bug, ordinary support request, or transient provider error may remain an operational issue rather than an incident unless impact or recurrence justifies escalation.

## 4. Incident Categories

One incident may have multiple categories.

| Category | Examples |
|---|---|
| Security | credential exposure, authorization bypass, malicious request, source/delivery compromise |
| AI/MCP | authority expansion, unintended data access, failed oversight, material misuse, unsafe integration behavior |
| Supplier | GitHub, Cloudflare, Codex, Claude, identity-provider, or dependency event materially affecting scope |
| Data | loss, corruption, inappropriate disclosure, provenance or integrity failure |
| Operational | sustained outage, deployment failure, resource exhaustion, failed recovery |
| Privacy / confidentiality | unintended exposure of information requiring restricted handling |
| Accessibility | material regression affecting access to critical or security-relevant functionality |
| Governance / evidence | loss or falsification of assurance evidence, uncontrolled production change, material management-system failure |

## 5. Severity Model

Severity is assigned from observed or credibly possible impact, scope, recoverability, and control loss.

| Severity | Meaning | Default response |
|---|---|---|
| SEV-1 Critical | Severe compromise or loss of control; active sensitive exposure, privileged compromise, destructive AI authority, major unrecoverable loss, or systemic failure | Immediate containment; management escalation; preserve evidence; disable affected capability if needed; explicit recovery/notification decisions |
| SEV-2 High | Material security/AI/data/availability impact with significant exposure or control failure but bounded recovery path | Prompt containment and investigation; management-system owner notified; corrective-action and risk reassessment normally required |
| SEV-3 Moderate | Limited or recoverable impact requiring coordinated response, review, or treatment | Record, correct, investigate proportionately, track follow-up |
| SEV-4 Low | Minor incident-like event with limited impact and no material loss of control | Record when useful; correct through ordinary work; escalate if recurring |

Severity may be raised when uncertainty itself is material, evidence is incomplete, affected scope is expanding, or a supposedly bounded failure crosses authorization or AI authority boundaries.

## 6. Detection and Reporting Sources

Incidents may be detected through:

- public or private vulnerability reports;
- health and uptime observations;
- application logs and D1 audit events;
- admin-state or crawler-control events;
- CI, security, dependency, contract, or release checks;
- failed deployment or rollback;
- user/operator observation;
- GitHub or Cloudflare provider notices;
- Codex or Claude MCP behavior or integration failures;
- MCP/AI evaluation failures;
- supplier incidents;
- accessibility verification;
- risk review;
- audit/self-assessment;
- management review;
- or other credible evidence.

Suspected vulnerabilities involving credentials or active infrastructure must not be moved into a public GitHub issue merely for convenience. `SECURITY.md` remains the public reporting boundary.

## 7. Initial Triage

The Incident and Corrective-Action Owner records or establishes, as quickly as practical:

- incident identifier;
- detection time and source;
- affected service/capability;
- known or suspected category;
- initial severity;
- current impact;
- whether the incident is ongoing;
- whether credentials, private data, privileged authority, or AI authority may be involved;
- immediate containment action;
- evidence-preservation needs;
- responsible owner;
- and escalation/communication needs.

Unknown facts remain marked unknown. Triage does not require certainty before containment.

## 8. Containment

Containment actions may include:

- disable or remove an affected feature or MCP tool;
- place the demo in intentional offline/maintenance state;
- reject or block an affected request path;
- revoke or rotate credentials;
- suspend a webhook, token, workflow, supplier integration, identity provider, Codex connection, or Claude connection;
- reduce permissions;
- roll back to a known tagged release;
- freeze deployment/change activity while evidence is collected;
- restrict public data or affected namespace access;
- or otherwise fail closed.

Availability is not prioritized over preserving an approved security or AI boundary.

## 9. Evidence Preservation

Relevant evidence may include:

- Git commit, branch, PR, tag, release, and workflow history;
- deployed commit/version metadata;
- D1 `demo_events` audit records;
- bounded `application_logs` diagnostics;
- health and uptime records;
- relevant database/storage records or checksums;
- configuration snapshots that do not expose secrets publicly;
- provider notices/status information;
- dependency versions;
- request IDs or delivery IDs;
- AI/MCP tool, protocol, namespace, client-family, duration, and result metadata already retained by approved logging;
- evaluation results;
- screenshots or reproduction notes when appropriate;
- and corrective-change evidence.

Evidence must be handled according to sensitivity. Public documentation uses sanitized summaries rather than raw credentials, private request bodies, or unbounded logs.

## 10. Investigation

Investigation should determine, proportionately:

- what happened;
- when it began and ended;
- how it was detected;
- affected assets, interfaces, users, records, suppliers, or AI capabilities;
- whether the event crossed an authentication, authorization, namespace, data, or AI-authority boundary;
- whether sensitive information was exposed or modified;
- whether production source or deployment state diverged from approved history;
- whether Codex or Claude behavior exposed a gap in the current MCP assumptions;
- whether a supplier event contributed;
- what existing controls worked or failed;
- whether the incident remains contained;
- current residual risk;
- and whether a root/contributing-cause analysis is required.

Investigation distinguishes provider-controlled causes from WizardGang-controlled integration/configuration causes.

## 11. AI/MCP Incident Rules

For AI/MCP incidents, review additionally considers:

- intended use and foreseeable misuse;
- current tool inventory and authority classification;
- server-side authorization and validation;
- public/private data boundary;
- protocol/client behavior;
- Codex or Claude client/provider involvement;
- indirect-instruction or untrusted-data behavior;
- output limitations and provenance;
- downstream actions outside WizardGang control;
- human-oversight assumptions;
- and whether the MCP AI Impact Assessment still describes the actual capability.

A material AI/MCP incident triggers review of:

- `AI-RISK-REGISTER.md`;
- `MCP-AI-IMPACT-ASSESSMENT.md`;
- ISO 42001 SoA applicability/status;
- AI evaluation coverage;
- supplier register/status for Codex or Claude when relevant;
- and the approved MCP tool/data/authority inventory.

An incident involving one approved AI provider does not authorize a different provider as a fallback. Codex and Claude remain the only approved AI/MCP families unless a separate controlled change expands scope.

## 12. Supplier Incident Rules

A material supplier incident involving GitHub, Cloudflare, Codex, Claude, an active identity provider, or another material dependency may require:

- supplier status changed to Suspended or Conditional;
- credential rotation or permission reduction;
- temporary feature disablement;
- dependency/version change;
- recovery or migration action;
- supplier risk reassessment;
- security or AI risk reassessment;
- management review;
- and an updated supplier review record.

WizardGang does not claim access to provider-internal incident details unless evidence is actually available.

## 13. Communication and Notification Decisions

Every SEV-1 and SEV-2 incident requires an explicit communication/notification decision, even when the decision is that no external notification is currently required.

The decision considers, where actually applicable and known:

- affected users or interested parties;
- security researchers/reporters;
- GitHub, Cloudflare, Codex, Claude, identity, or other suppliers;
- contractual commitments;
- identified legal or regulatory notification requirements;
- public status/maintenance communication;
- and whether disclosure could itself expose sensitive security information.

The incident record captures the decision, rationale, owner, date, recipients when applicable, and evidence reference.

This procedure does not assume a specific statutory notification obligation where no applicable basis has been identified. Legal or contractual obligations are evaluated when they attach to the actual incident and scope.

## 14. Recovery

Recovery restores controlled operation and verifies the system is in an acceptable state.

Recovery may include:

- credential rotation;
- source or configuration correction;
- tagged rollback or controlled forward fix;
- data restore or reconstruction;
- supplier recovery or reconfiguration;
- re-running migrations/checks;
- authorization and security regression tests;
- MCP/AI boundary evaluation;
- health/smoke verification;
- accessibility verification where affected;
- and confirmation that public assurance statements remain accurate.

Recovery does not automatically close the incident.

## 15. Post-Incident Review

SEV-1 and SEV-2 incidents require a documented post-incident review. SEV-3 incidents receive one when recurrence, uncertainty, or management-system impact warrants it.

The review records:

- final severity and timeline;
- confirmed scope and impact;
- containment and recovery performed;
- controls that succeeded;
- controls that failed or were missing;
- root/contributing causes where analysis was required;
- notification/communication decisions;
- risk changes;
- supplier changes;
- AI impact/SoA changes where relevant;
- corrective actions;
- effectiveness-verification plan;
- lessons learned;
- and closure criteria.

## 16. Corrective Action and Risk Reassessment

An incident feeds `NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md` when recurrence prevention or systemic improvement is required.

Incidents must trigger reassessment when they invalidate assumptions in:

- security risk records;
- AI risk records;
- Statements of Applicability;
- objectives or thresholds;
- policies or procedures;
- supplier status/review;
- AI impact assessments;
- recovery assumptions;
- monitoring/evaluation coverage;
- or public assurance claims.

A corrective action is not considered effective solely because a patch was merged or deployed. Effectiveness is verified using evidence appropriate to the original failure.

## 17. Incident Closure

A material incident may be closed only when:

- the active condition is contained or ended;
- recovery is complete or the remaining limitation is explicitly accepted/managed;
- evidence and timeline are retained;
- impact and affected scope are reasonably understood;
- required notification decisions are recorded;
- required risk/supplier/AI-impact/SoA updates are completed or traceably assigned;
- required corrective actions are assigned;
- the next effectiveness/review checkpoint is known;
- and an accountable owner records the closure decision.

Closure of the incident record does not automatically close linked risks or corrective actions.

## 18. Exercise and Tabletop Program

Incident readiness must be tested even when no real incident occurs.

The management system requires:

- at least one documented incident exercise or tabletop per year;
- the first exercise to be completed by **2026-12-02** to support `SEC-OBJ-005`;
- exercises to include at least one security scenario and one AI/MCP or supplier dimension over the annual cycle;
- evidence of participants/roles, scenario, decisions, observed gaps, and follow-up actions;
- and review of whether the incident process itself needs improvement.

Candidate scenarios include:

- leaked deployment/admin credential;
- GitHub source/delivery compromise;
- Cloudflare outage plus failed recovery assumption;
- MCP authorization regression;
- sensitive field unintentionally added to public MCP output;
- Codex or Claude integration exposing a protocol or data-boundary weakness;
- supplier outage during a release;
- or misleading AI-facing demo data causing a material downstream interpretation concern.

An exercise is clearly labeled as an exercise and is not entered as a real incident unless an actual incident is discovered during the exercise.

## 19. Metrics

Incident metrics may include:

- number of incidents by severity/category;
- time to initial triage;
- time to containment;
- time to recovery;
- overdue post-incident reviews;
- incidents with required notification decisions recorded;
- recurrence of similar incident causes;
- corrective actions overdue or ineffective;
- exercises completed by due date;
- and risks/SoA/AI-impact records updated after material incidents.

A period with zero incidents does not prove readiness or control effectiveness. Exercise and preventive evidence remain necessary.

## 20. Incident Register

The authoritative incident and exercise index is:

`docs/governance/registers/INCIDENT-REGISTER.md`

Permanent identifiers use:

- `INC-###` for actual incidents;
- `EX-###` for exercises/tabletops.

Identifiers are never reused after publication.

## 21. Supporting Evidence

Primary supporting records include:

- `SECURITY.md`;
- `docs/OPERATIONS.md`;
- `docs/governance/ROLES-RESPONSIBILITIES.md`;
- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- `docs/governance/SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`;
- `docs/governance/registers/SUPPLIER-REGISTER.md`;
- `docs/governance/MONITORING-MEASUREMENT-EVALUATION.md`;
- `docs/governance/MANAGEMENT-REVIEW.md`;
- `docs/governance/NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md`;
- `docs/governance/registers/OBJECTIVES.md`;
- application/audit logs;
- release/deployment evidence;
- and controlled `DEMO-###` history.

## 22. Alignment

This process supports the security-event/incident lifecycle, evidence preservation, learning, AI incident/concern handling, supplier-incident handling, corrective action, and continual-improvement requirements applicable to the current scoped ISO/IEC 27001:2022 ISMS and ISO/IEC 42001:2023 AIMS.

**Current posture after approval:** Incident process, severity model, record requirements, communication decision rules, AI/supplier interfaces, closure criteria, and annual exercise requirement are defined. Actual incident and exercise effectiveness remains operating evidence; certification is not claimed.
