# Incident and Exercise Register

**Reference:** WG-REG-004  
**Framework:** Integrated ISMS / AIMS  
**Status:** Approved
**Owner:** Incident and Corrective-Action Owner / WizardGang  
**Baseline date:** 2026-09-02  
**Review due:** 2026-12-02, then at least quarterly and after every material incident or exercise  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register is the authoritative index for actual incidents and incident-response exercises within the WizardGang Architecture Demo management-system scope.

Actual incidents use permanent `INC-###` identifiers. Exercises/tabletops use permanent `EX-###` identifiers. The two record types remain distinct so simulated scenarios are never presented as historical incidents.

This register does not fabricate past events. At the initial baseline, no material historical incident has been entered because no retained incident record has been established in this governance stream.

## 2. Current Status

### Actual incidents

**No actual incident records are established in this initial baseline.**

This statement means only that this register begins with no retained `INC-###` records. It does not prove that the system has never experienced defects, outages, vulnerabilities, near misses, or other events before the register existed.

Future material incidents are added when they meet the criteria in `docs/governance/INCIDENT-MANAGEMENT.md`.

### Exercises

The first incident-response exercise is required by **2026-12-02** to support `SEC-OBJ-005`.

| ID | Type | Scenario | Scope | Planned date / due | Owner | Status | Evidence |
|---|---|---|---|---|---|---|---|
| EX-001 | Tabletop / response exercise | Combined security + AI/MCP incident scenario | Credential/authorization containment, MCP boundary, supplier communication, recovery, evidence, corrective action | Due 2026-12-02 | Incident and Corrective-Action Owner | Planned | Evidence to be created when exercise is performed |

`EX-001` is a planned exercise only. It is not evidence that an exercise has occurred.

## 3. Incident Record Requirements

Each actual incident record should contain, as applicable:

- `id` — permanent `INC-###` identifier;
- title;
- detection date/time;
- detection source;
- category or categories;
- initial and final severity;
- affected systems/capabilities;
- affected users/data/suppliers where known;
- incident owner;
- whether the event was active at detection;
- initial impact statement;
- containment actions;
- evidence-preservation actions;
- investigation summary;
- timeline;
- confirmed impact;
- credentials/data/authorization/AI-authority involvement;
- supplier involvement;
- Codex/Claude involvement where relevant;
- notification/communication decision;
- notification rationale and recipients where applicable;
- recovery actions;
- root/contributing-cause analysis when required;
- linked `SEC-RISK-*` and/or `AI-RISK-*` records;
- linked supplier IDs;
- linked SoA/control references;
- linked AI impact-assessment review where applicable;
- linked nonconformity/corrective-action record;
- linked issue / `DEMO-###` / PR / release;
- effectiveness-verification plan;
- closure criteria;
- closure date and authority;
- residual limitations or risk;
- and next review date.

Missing facts remain explicitly unknown until established. An incident record should not convert uncertainty into a positive conclusion.

## 4. Exercise Record Requirements

Each exercise record should contain:

- `id` — permanent `EX-###` identifier;
- date;
- exercise type;
- scenario;
- objectives;
- roles/participants;
- systems/processes being tested;
- evidence sources available to responders;
- decisions made during the scenario;
- expected versus observed response;
- gaps, delays, confusion, or missing evidence;
- communication/notification decision exercise;
- security-risk implications;
- AI/MCP-risk or impact implications where relevant;
- supplier implications where relevant;
- corrective/improvement actions;
- owner and target date for each action;
- and management-review input.

Exercises must be marked clearly as simulated.

## 5. Severity Summary

Actual incident severity uses the incident-management model:

| Severity | Summary |
|---|---|
| SEV-1 Critical | Severe compromise or systemic loss of control requiring immediate containment and management decision |
| SEV-2 High | Material impact or control failure requiring coordinated response and normally corrective action/risk reassessment |
| SEV-3 Moderate | Bounded/recoverable incident requiring documented response and proportional follow-up |
| SEV-4 Low | Minor incident-like condition that is useful to record and may be handled through ordinary controlled work |

The final severity may differ from the initial severity as evidence improves.

## 6. Category Summary

Incident categories include:

- Security;
- AI/MCP;
- Supplier;
- Data;
- Operational;
- Privacy/confidentiality;
- Accessibility;
- Governance/evidence.

Multiple categories may apply to one incident.

## 7. Current Risk and Objective Links

The incident program directly supports current management-system risks and objectives, including:

- `SEC-RISK-001` — credential/secret exposure;
- `SEC-RISK-002` — unauthorized administration;
- `SEC-RISK-003` — source/delivery compromise;
- `SEC-RISK-005` — webhook forgery/replay;
- `SEC-RISK-006` — public diagnostic disclosure;
- `SEC-RISK-007` — data loss/recovery;
- `SEC-RISK-008` — Cloudflare dependency;
- `SEC-RISK-009` — GitHub dependency;
- `SEC-RISK-011` — authorization bypass;
- `SEC-RISK-012` — resource exhaustion;
- `SEC-RISK-013` — incomplete/unexercised incident response;
- `AI-RISK-001` — unauthorized AI authority expansion;
- `AI-RISK-003` — indirect instruction behavior;
- `AI-RISK-004` — unintended AI-accessible data exposure;
- `AI-RISK-007` — insufficient AI evaluation coverage;
- `AI-RISK-008` — AI logging/evidence weakness;
- `AI-RISK-009` — capability drift without reassessment;
- `AI-RISK-010` — external agent/model downstream behavior;
- `AI-RISK-011` — MCP/client/protocol change;
- `AI-RISK-012` — human oversight bypass;
- `AI-RISK-015` — inconsistent AI incident/concern handling;
- `SEC-OBJ-005` — incident readiness;
- and management-system monitoring, audit, management-review, and continual-improvement obligations.

## 8. Supplier and AI/MCP Links

Current material supplier IDs relevant to incident handling include:

- `SUP-001` — GitHub;
- `SUP-002` — Cloudflare;
- `SUP-003` — OpenAI Codex;
- `SUP-004` — Anthropic Claude;
- `SUP-005` — external identity provider when activated;
- `SUP-006` — npm/open-source dependency ecosystem.

Codex and Claude are the only approved AI/MCP provider/client families in the current demo boundary. An incident involving one does not automatically authorize another AI provider as a replacement.

## 9. Communication Decision Record

For SEV-1 and SEV-2 incidents, the incident record must include a communication/notification decision with:

- decision date/time;
- decision owner;
- affected party/provider considered;
- whether notification is required, appropriate, deferred pending facts, or not currently required;
- rationale;
- recipients when notification occurs;
- communication channel/evidence reference;
- and any follow-up deadline.

The record does not assume legal notification requirements unless an applicable basis is actually identified.

## 10. Closure and Follow-Up

Before an actual incident is marked Closed, the register must point to evidence that:

- active impact is contained/ended;
- recovery or accepted limitation is documented;
- the material timeline and evidence are retained;
- required notification decisions are recorded;
- linked risk/supplier/SoA/AI-impact reviews are completed or assigned;
- corrective actions are assigned where required;
- effectiveness verification is planned;
- and an accountable closure decision exists.

Possible incident status values are:

- Investigating;
- Contained;
- Recovering;
- Monitoring;
- Closed;
- Superseded.

Possible exercise status values are:

- Planned;
- In progress;
- Completed;
- Follow-up open;
- Closed;
- Superseded.

## 11. Exercise Coverage Expectations

Over the annual cycle, exercises should collectively test:

- incident declaration and severity assignment;
- evidence preservation;
- credential/security containment;
- intentional offline/degraded operation;
- Git/release/recovery traceability;
- supplier escalation;
- notification/communication decisions;
- MCP authorization/data/authority controls;
- Codex or Claude supplier/client considerations;
- AI impact reassessment triggers;
- corrective-action creation;
- and management-review feedback.

The first exercise may combine several of these areas rather than creating multiple ceremonial exercises.

## 12. Metrics

Quarterly and management-review reporting should consider:

- actual incidents by severity/category;
- incidents without required communication decisions;
- overdue post-incident reviews;
- repeat incidents or causes;
- open incident corrective actions;
- average/median triage and containment times when enough samples exist;
- exercise completion against due date;
- exercise findings and overdue follow-up;
- and whether material incidents triggered required risk, supplier, SoA, or AI-impact reassessment.

Where the sample size is zero or too small, the result is reported as such rather than converted to a favorable performance score.

## 13. Supporting Records

- `docs/governance/INCIDENT-MANAGEMENT.md`
- `SECURITY.md`
- `docs/OPERATIONS.md`
- `docs/governance/ROLES-RESPONSIBILITIES.md`
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`
- `docs/governance/registers/AI-RISK-REGISTER.md`
- `docs/governance/registers/SUPPLIER-REGISTER.md`
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`
- `docs/governance/registers/OBJECTIVES.md`
- `docs/governance/MONITORING-MEASUREMENT-EVALUATION.md`
- `docs/governance/MANAGEMENT-REVIEW.md`
- `docs/governance/NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md`

## 14. Current Posture

**Actual incident records:** none established in the initial register.  
**Incident procedure:** Proposed in the same controlled change as this register.  
**First exercise:** `EX-001` Planned; due 2026-12-02.  
**Certification:** not claimed.

Approval of this register establishes the record structure and planned exercise. It does not prove completed incident readiness or a history free of incidents.
