# AI Risk Register

**Reference:** WG-REG-002  
**Applies to:** ISO/IEC 42001:2023 planning and AI risk-management requirements  
**Status:** Proposed  
**Owner:** WizardGang  
**Method:** `docs/governance/RISK-MANAGEMENT.md`  
**Approval:** Controlled pull request and merge  
**Assessment date:** 2026-09-02  
**Review due:** 2026-12-02, and earlier upon a material AI/MCP change

## 1. Purpose

This register records the initial AI-management risks identified for the WizardGang Architecture Demo.

The current in-scope AI capability is the controlled Model Context Protocol (MCP) boundary and related agent-facing interfaces. The demonstrated boundary exposes public read behavior through controlled tools, ordinary authorization and validation, bounded results, fail-closed handling for unsupported behavior, and audit evidence.

The current evidence does **not** show WizardGang developing or controlling a general-purpose AI model. External agents and models that call the interface remain supplier- or user-controlled systems. WizardGang remains responsible for the interface, permissions, data exposure, validation, logging, intended use, and other decisions within the declared scope.

This register supports engineering alignment with ISO/IEC 42001. It does not represent certification, complete AI safety, or an AI impact assessment.

## 2. Assessment Rules

The scoring model is defined in `docs/governance/RISK-MANAGEMENT.md`:

`risk score = likelihood × impact`

| Score | Rating |
|---|---|
| 1–4 | Low |
| 5–9 | Moderate |
| 10–16 | High |
| 17–25 | Critical |

Each record distinguishes:

- inherent exposure before controls;
- controls already evidenced;
- residual exposure after those controls;
- treatment direction;
- and whether an explicit acceptance decision has occurred.

**No risk in this initial register is implicitly accepted by creation or merge of this document.** Merge approves the assessment record and treatment direction only. Risk acceptance remains a separate attributable decision.

## 3. Current AI/MCP Control Baseline

The current implementation provides useful risk reduction through:

- a defined intended use: inspection of public demo records through a controlled AI application interface;
- an explicit MCP server boundary;
- a demonstrated approved read tool;
- no MCP write tools in the current evaluation boundary;
- ordinary authorization and validation rather than AI-specific privilege bypass;
- namespace validation;
- structured failure for invalid tool requests;
- JSON-RPC method-not-found behavior for unsupported methods;
- fail-closed behavior for tested invalid scopes;
- human control over source, release, privileged administration, and deployment;
- an AI-boundary evaluation endpoint;
- audit event creation for evaluations;
- public-safe application logging;
- controlled Git change and release history;
- and an explicit uncertified alignment posture.

The current automated evaluation is intentionally narrow. It verifies selected boundary behavior; it is not treated as comprehensive AI assurance.

## 4. Risk Summary

| ID | Risk | Inherent | Residual | Treatment | Status |
|---|---|---:|---:|---|---|
| AI-RISK-001 | Unauthorized expansion of AI tool authority | 20 Critical | 8 Moderate | Reduce | Treating |
| AI-RISK-002 | Authorization mismatch between AI and non-AI interfaces | 16 High | 8 Moderate | Reduce | Treating |
| AI-RISK-003 | Indirect prompt or instruction injection through returned content | 12 High | 9 Moderate | Reduce | Treating |
| AI-RISK-004 | Sensitive or unintended data exposure through AI-accessible tools | 15 High | 6 Moderate | Reduce | Treating |
| AI-RISK-005 | Malformed or unsupported MCP requests bypass intended controls | 12 High | 4 Low | Reduce | Open |
| AI-RISK-006 | Incorrect, stale, or incomplete data is over-trusted by an AI caller | 12 High | 9 Moderate | Reduce | Treating |
| AI-RISK-007 | AI evaluation coverage is too narrow to detect regressions | 16 High | 9 Moderate | Reduce | Treating |
| AI-RISK-008 | AI logging or evidence is insufficient or discloses inappropriate content | 12 High | 6 Moderate | Reduce | Treating |
| AI-RISK-009 | AI/MCP capability drift occurs without risk reassessment | 16 High | 8 Moderate | Reduce | Treating |
| AI-RISK-010 | External agent/model behavior causes misleading or unintended downstream use | 12 High | 8 Moderate | Reduce/Share | Treating |
| AI-RISK-011 | MCP protocol, client, or integration changes cause unsafe or misleading behavior | 12 High | 6 Moderate | Reduce | Treating |
| AI-RISK-012 | Human oversight is bypassed if privileged actions become AI-callable | 20 Critical | 8 Moderate | Avoid/Reduce | Treating |
| AI-RISK-013 | Data quality or provenance weaknesses degrade AI-assisted interpretation | 12 High | 9 Moderate | Reduce | Treating |
| AI-RISK-014 | Public AI-assurance claims are misunderstood as certification or complete safety | 12 High | 6 Moderate | Reduce | Treating |
| AI-RISK-015 | AI incidents, concerns, or unexpected behavior are not handled consistently | 12 High | 9 Moderate | Reduce | Treating |

## 5. Detailed Risk Records

### AI-RISK-001 — Unauthorized expansion of AI tool authority

**Framework:** AI  
**Affected capability:** MCP tools, authorization boundaries, application actions  
**Threat or cause:** A future tool, route, orchestration change, or configuration exposes write, administrative, destructive, cross-namespace, or otherwise broader authority to an AI caller without equivalent governance and authorization.  
**Consequence:** Unauthorized changes, loss of integrity, excessive automation, security compromise, or loss of human control over material actions.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 5 — Severe  
**Inherent risk:** 20 — Critical

**Existing controls:**

- current AI evaluation identifies the system boundary as a public read tool;
- write operations are not exposed as MCP tools in the current evaluated boundary;
- AI callers are subject to ordinary authorization and validation;
- human operators retain control of source, release, and demo state;
- AI policy prohibits silent permission expansion;
- material capability changes use the controlled Git lifecycle.

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 4 — Major  
**Residual risk:** 8 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

1. maintain a controlled MCP tool/capability inventory;
2. require explicit risk review for any new write, privileged, destructive, or cross-scope tool;
3. require an updated AI impact assessment before material authority expansion;
4. add negative tests proving privileged operations remain unavailable to the public MCP boundary;
5. map tool permissions into the ISO 42001 applicability record.

**Owner:** Management-system owner / AI capability owner  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Evidence:** `src/api/governance.ts`, MCP implementation, `docs/governance/AI-POLICY.md`

---

### AI-RISK-002 — Authorization mismatch between AI and non-AI interfaces

**Framework:** Shared security / AI  
**Affected capability:** MCP, REST, GraphQL, identity, authorization policy  
**Threat or cause:** AI-facing code implements a different identity, namespace, or authorization interpretation from equivalent human/API access paths.  
**Consequence:** AI callers gain access beyond intended permissions or receive inconsistent controls compared with non-AI callers.

**Inherent likelihood:** 4  
**Inherent impact:** 4  
**Inherent risk:** 16 — High

**Existing controls:**

- policy requires AI callers to remain within ordinary authorization boundaries;
- current architecture describes a shared explicit read boundary;
- invalid namespace behavior is included in the AI boundary evaluation;
- unknown or invalid operations fail with structured errors.

**Residual likelihood:** 2  
**Residual impact:** 4  
**Residual risk:** 8 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- maintain contract tests comparing equivalent AI and non-AI authorization outcomes;
- include identity-derived and anonymous access scenarios where applicable;
- review authorization changes for MCP impact;
- retain negative authorization tests in CI.

**Owner:** Security/control owner  
**Status:** Treating  
**Evidence:** `src/api/governance.ts`, authorization source, API/MCP contracts

---

### AI-RISK-003 — Indirect prompt or instruction injection through returned content

**Framework:** AI  
**Affected capability:** Public records returned to external AI agents  
**Threat or cause:** Public application data contains text that an external model interprets as instructions rather than data.  
**Consequence:** A consuming AI system may disregard user intent, misrepresent returned data, request unintended tools, or take actions outside the WizardGang application based on untrusted content.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- the current MCP boundary is read-only;
- tool authority is bounded by server-side validation rather than model interpretation;
- unsupported operations do not become valid merely because a model requests them.

**Residual likelihood:** 3  
**Residual impact:** 3  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- classify returned record content as untrusted data in MCP documentation;
- keep authority enforcement server-side;
- add representative indirect-instruction content to evaluation cases;
- avoid presenting record text as trusted system instruction;
- document this limitation for integrating agents.

**Owner:** AI capability owner  
**Status:** Treating  
**Evidence:** MCP contract and server implementation

---

### AI-RISK-004 — Sensitive or unintended data exposure through AI-accessible tools

**Framework:** Shared security / AI  
**Affected capability:** D1 records, MCP result schemas, public namespace  
**Threat or cause:** A tool returns fields, namespaces, identifiers, or records that were not intended for public AI access.  
**Consequence:** Confidentiality loss, privacy impact, exposure of operational information, or expansion of the public data boundary.

**Inherent likelihood:** 3  
**Inherent impact:** 5  
**Inherent risk:** 15 — High

**Existing controls:**

- current intended use is inspection of public demo records;
- namespace input is validated;
- the evaluated invalid namespace fails closed;
- public-safe logging and secret-handling requirements apply;
- source is public by design but secrets are not.

**Residual likelihood:** 2  
**Residual impact:** 3  
**Residual risk:** 6 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- maintain explicit public-field and namespace allowlists;
- test for sensitive-field exclusion;
- review schema/migration changes for MCP exposure;
- include AI-accessible data flows in the AI impact assessment and data-governance record.

**Owner:** Data/control owner  
**Status:** Treating  
**Evidence:** MCP implementation, schema/migrations, `SECURITY.md`

---

### AI-RISK-005 — Malformed or unsupported MCP requests bypass intended controls

**Framework:** AI / security  
**Affected capability:** MCP protocol handler  
**Threat or cause:** Unexpected JSON-RPC methods, malformed input, invalid namespaces, unsupported arguments, or parser edge cases produce unsafe default behavior.  
**Consequence:** Authorization or validation bypass, uncontrolled execution, service instability, or ambiguous behavior.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- unknown-method evaluation expects JSON-RPC `-32601`;
- invalid namespace evaluation expects a tool error;
- tested unsupported behavior fails closed;
- structured request contracts exist.

**Residual likelihood:** 1  
**Residual impact:** 4  
**Residual risk:** 4 — Low

**Treatment:** Reduce; no acceptance recorded.  
**Treatment actions:**

- expand malformed-input and boundary-case tests;
- fuzz or property-test parsers where practical;
- retain fail-closed behavior as the default;
- monitor failures for regression indicators.

**Owner:** AI capability owner / security owner  
**Status:** Open  
**Evidence:** `src/api/governance.ts`, MCP tests and contracts

---

### AI-RISK-006 — Incorrect, stale, or incomplete data is over-trusted by an AI caller

**Framework:** AI  
**Affected capability:** MCP output and downstream interpretation  
**Threat or cause:** Returned demo data is outdated, incomplete, synthetic, or context-limited but is treated by an external model or user as authoritative.  
**Consequence:** Misleading summaries, incorrect conclusions, or inappropriate downstream decisions.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- the demo exposes architecture evidence rather than claiming a general authoritative knowledge service;
- public assurance language distinguishes demonstrated behavior from certification;
- system boundaries and intended use are documented.

**Residual likelihood:** 3  
**Residual impact:** 3  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- expose freshness/provenance metadata where useful;
- identify synthetic/demo records clearly;
- document output limitations for AI callers;
- include stale/incomplete-data scenarios in evaluation and impact assessment.

**Owner:** AI capability owner / data owner  
**Status:** Treating

---

### AI-RISK-007 — AI evaluation coverage is too narrow to detect regressions

**Framework:** AI  
**Affected capability:** AI assurance and regression detection  
**Threat or cause:** The existing evaluation verifies a small set of approved, unknown-method, and invalid-namespace cases but misses other authorization, data, misuse, logging, protocol, or edge-case failures.  
**Consequence:** Regressions or unsafe behavior persist while the visible evaluation continues to pass.

**Inherent likelihood:** 4  
**Inherent impact:** 4  
**Inherent risk:** 16 — High

**Existing controls:**

- executable boundary evaluation exists;
- results are structured and auditable;
- evaluation failure returns an error status and application log;
- policy explicitly states that narrow automated evaluation is not proof of complete safety.

**Residual likelihood:** 3  
**Residual impact:** 3  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- create an AI evaluation matrix covering authorization, malformed input, tool inventory, data exposure, indirect instruction content, failure behavior, and logging;
- run relevant evaluations in CI where deterministic;
- retain manual review scenarios for behavior automation cannot establish reliably;
- connect failed evaluations to corrective action.

**Owner:** AI capability owner / quality owner  
**Status:** Treating  
**Evidence:** `src/api/governance.ts`, CI evidence

---

### AI-RISK-008 — AI logging or evidence is insufficient or discloses inappropriate content

**Framework:** Shared security / AI  
**Affected capability:** Audit events, application logs, evaluation evidence  
**Threat or cause:** AI interactions are under-logged for investigation or over-logged in a way that stores sensitive input, output, credentials, or unnecessary content.  
**Consequence:** Weak accountability and incident investigation, or confidentiality/privacy exposure through retained evidence.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- AI boundary evaluations create audit events;
- application logs are separate from audit evidence;
- logging policy requires public-safe redaction and bounded detail;
- secrets and authorization material must not be logged.

**Residual likelihood:** 2  
**Residual impact:** 3  
**Residual risk:** 6 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- define minimum AI-event fields and prohibited fields;
- test redaction for AI-related events;
- define retention and investigation needs;
- ensure future tools add appropriate event coverage without logging raw sensitive content.

**Owner:** Security/control owner  
**Status:** Treating  
**Evidence:** `src/api/governance.ts`, logging/audit source, `SECURITY.md`

---

### AI-RISK-009 — AI/MCP capability drift occurs without risk reassessment

**Framework:** AI  
**Affected capability:** Tools, permissions, data, prompts/orchestration, intended use  
**Threat or cause:** Incremental changes alter effective AI capability without triggering risk, impact, policy, or applicability review.  
**Consequence:** The documented AIMS no longer represents actual authority, affected parties, data exposure, or foreseeable misuse.

**Inherent likelihood:** 4  
**Inherent impact:** 4  
**Inherent risk:** 16 — High

**Existing controls:**

- all controlled repository changes use permanent `DEMO-###` identifiers;
- AI policy names material capability-change triggers;
- risk methodology requires event-driven reassessment;
- Git history makes changes traceable.

**Residual likelihood:** 2  
**Residual impact:** 4  
**Residual risk:** 8 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- add AI-impact/risk-review prompts to controlled change templates for AI-related paths;
- maintain a capability inventory;
- require review of the AI register and impact assessment for material changes;
- define staleness checks for AI governance evidence.

**Owner:** Management-system owner / AI capability owner  
**Status:** Treating

---

### AI-RISK-010 — External agent/model behavior causes misleading or unintended downstream use

**Framework:** AI / supplier boundary  
**Affected capability:** External agents and models consuming WizardGang MCP output  
**Threat or cause:** A third-party model hallucinates, combines data incorrectly, ignores limitations, invokes unrelated tools, or presents results as more authoritative than the server response supports.  
**Consequence:** Users make incorrect decisions or attribute external model behavior to WizardGang.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- WizardGang controls the server-side permission and data boundary rather than model reasoning;
- current tool is read-only;
- AI policy distinguishes WizardGang-controlled behavior from provider-controlled behavior;
- public claims are explicitly uncertified and limited to demonstrated behavior.

**Residual likelihood:** 2  
**Residual impact:** 4  
**Residual risk:** 8 — Moderate

**Treatment:** Reduce / Share.  
**Treatment actions:**

- document the responsibility boundary for external agents and models;
- expose machine-readable descriptions/limitations where useful;
- avoid claims that external model output is controlled or guaranteed by WizardGang;
- review provider/client assumptions if a specific model integration is later operated by WizardGang.

**Owner:** AI capability owner  
**Status:** Treating

---

### AI-RISK-011 — MCP protocol, client, or integration changes cause unsafe or misleading behavior

**Framework:** AI / supplier dependency  
**Affected capability:** MCP contracts and client interoperability  
**Threat or cause:** Protocol evolution, SDK/library changes, client interpretation differences, or incompatible transport behavior changes how tools or errors are represented.  
**Consequence:** Broken safeguards, ambiguous errors, incorrect tool invocation, unavailable capability, or misleading assurance results.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- checked-in contracts and implementation source;
- automated validation and release traceability;
- explicit structured errors;
- controlled dependency lifecycle.

**Residual likelihood:** 2  
**Residual impact:** 3  
**Residual risk:** 6 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- pin and review relevant dependencies;
- regression-test supported protocol behavior;
- review material protocol/SDK updates as AI-risk triggers;
- document compatibility assumptions.

**Owner:** AI capability owner / dependency owner  
**Status:** Treating

---

### AI-RISK-012 — Human oversight is bypassed if privileged actions become AI-callable

**Framework:** AI  
**Affected capability:** Release, administration, risk acceptance, configuration, destructive actions  
**Threat or cause:** Future automation makes decisions or privileged operations callable through AI without retained human authority or explicit pre-authorization.  
**Consequence:** Loss of accountable control, unauthorized production changes, destructive actions, inappropriate risk acceptance, or systemic governance failure.

**Inherent likelihood:** 4  
**Inherent impact:** 5  
**Inherent risk:** 20 — Critical

**Existing controls:**

- current MCP evaluation exposes no write operations;
- policy reserves material approvals and privileged decisions to authorized humans;
- production source/release/admin control is outside the current public MCP tool set;
- controlled Git and release workflows provide human-controlled change points.

**Residual likelihood:** 2  
**Residual impact:** 4  
**Residual risk:** 8 — Moderate

**Treatment:** Avoid / Reduce.  
**Treatment actions:**

- prohibit direct AI risk acceptance or policy approval;
- require explicit human authorization design for any future privileged tool;
- require narrow scopes, confirmation/approval boundaries, audit evidence, and rollback for authorized automation;
- reassess this risk before any MCP write capability is introduced.

**Owner:** Management-system owner  
**Status:** Treating

---

### AI-RISK-013 — Data quality or provenance weaknesses degrade AI-assisted interpretation

**Framework:** AI  
**Affected capability:** Demo records and other AI-readable data  
**Threat or cause:** Source data lacks clear provenance, completeness, context, or validation.  
**Consequence:** AI-generated interpretation appears coherent but is based on inaccurate or poorly understood evidence.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- architecture evidence is traceable to repository, release, and operational sources;
- the current MCP tool accesses a defined public namespace;
- the broader demo emphasizes evidence and source links.

**Residual likelihood:** 3  
**Residual impact:** 3  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- define provenance/freshness expectations for AI-readable datasets;
- identify synthetic or illustrative data;
- include data-quality checks where practical;
- incorporate data-governance controls into the ISO 42001 applicability record.

**Owner:** Data owner / AI capability owner  
**Status:** Treating

---

### AI-RISK-014 — Public AI-assurance claims are misunderstood as certification or complete safety

**Framework:** AI governance  
**Affected capability:** `/governance`, `/compliance`, documentation, AI evaluation output  
**Threat or cause:** A reviewer interprets a passing boundary evaluation or ISO mapping as independent certification, complete conformance, or proof that external model behavior is safe.  
**Consequence:** Misleading assurance, reputational harm, or inappropriate reliance on the demonstration.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- public responses state `ISO/IEC 42001 aligned — uncertified`;
- AI policy prohibits overstated assurance;
- current governance output describes a specific tested boundary and intended use.

**Residual likelihood:** 2  
**Residual impact:** 3  
**Residual risk:** 6 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- preserve uncertified language on all assurance surfaces;
- display evaluation coverage and limitations alongside pass/fail results;
- distinguish technical evidence from management-system status;
- ensure future checklist summaries are evidence status, not certification scores.

**Owner:** Management-system owner  
**Status:** Treating  
**Evidence:** `src/api/governance.ts`, `docs/governance/AI-POLICY.md`

---

### AI-RISK-015 — AI incidents, concerns, or unexpected behavior are not handled consistently

**Framework:** AI governance  
**Affected capability:** Incident handling, concern reporting, corrective action  
**Threat or cause:** A material AI failure, misuse report, unexpected tool behavior, or credible concern occurs before a dedicated AI incident/concern workflow and record format are established.  
**Consequence:** Delayed containment, inconsistent investigation, lost evidence, repeated failures, or affected-party concerns not being tracked appropriately.

**Inherent likelihood:** 3  
**Inherent impact:** 4  
**Inherent risk:** 12 — High

**Existing controls:**

- audit and application logging exist;
- security vulnerability reporting guidance exists;
- AI policy requires incidents and credible concerns to be evaluated and corrected;
- controlled Git provides a corrective-change mechanism.

**Residual likelihood:** 3  
**Residual impact:** 3  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce.  
**Treatment actions:**

- define an AI incident and concern-reporting process;
- define containment, assessment, affected-party, evidence, corrective-action, and reassessment fields;
- link material AI incidents to risk and impact-assessment updates;
- test the process with a tabletop or representative scenario.

**Owner:** Management-system owner / incident owner  
**Status:** Treating

## 6. Treatment Priorities

The initial priority order is:

1. **Preserve bounded authority** — AI-RISK-001 and AI-RISK-012.
2. **Preserve authorization and data boundaries** — AI-RISK-002 and AI-RISK-004.
3. **Expand evaluation coverage** — AI-RISK-003, AI-RISK-005, and AI-RISK-007.
4. **Establish the AI impact assessment** — use these risks as inputs but evaluate affected people and impacts separately.
5. **Strengthen data governance and provenance** — AI-RISK-006 and AI-RISK-013.
6. **Formalize AI incident/concern handling** — AI-RISK-015.
7. **Maintain accurate transparency and external responsibility boundaries** — AI-RISK-010 and AI-RISK-014.
8. **Track capability and protocol change** — AI-RISK-009 and AI-RISK-011.

## 7. AI Impact Assessment Relationship

This register is **not** the AI impact assessment.

The next AIMS assessment must evaluate the actual MCP capability from the perspective of affected users and other interested parties, including:

- purpose and intended use;
- current read-only capability boundary;
- affected parties;
- public data inputs and outputs;
- foreseeable misuse;
- indirect instruction/prompt-injection scenarios;
- external-agent responsibility boundaries;
- human oversight;
- transparency and known limitations;
- accessibility considerations;
- positive and negative impacts;
- residual impacts;
- and approval/review decisions.

The completed impact assessment should reference relevant `AI-RISK-###` records and should create or revise risks when it identifies material issues not captured here.

## 8. Review Triggers

This register must be reviewed before the scheduled review date when any of the following occurs:

- a new MCP tool is added;
- any write, mutation, privileged, destructive, or cross-namespace tool is proposed;
- the set of AI-readable fields or datasets expands;
- authentication or authorization changes;
- a specific model/provider becomes an operated dependency;
- prompt/orchestration behavior becomes part of the WizardGang-operated system;
- external AI output begins driving application actions;
- AI evaluation fails;
- a material AI incident or credible concern occurs;
- MCP protocol or SDK behavior changes materially;
- intended use changes;
- affected parties change materially;
- or the management-system scope changes.

## 9. Risk Acceptance Status

As of the initial assessment date:

- no High or Critical residual risk is recorded;
- several Moderate residual risks require continued treatment;
- AI-RISK-005 is currently Low residual risk but remains open pending broader malformed-input coverage;
- no residual risk is marked accepted solely by this register;
- and any future acceptance must identify the accepting authority, rationale, date, conditions, and review due date.

## 10. Evidence

Primary evidence for this assessment includes:

- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/AI-POLICY.md`;
- `docs/governance/SCOPE.md`;
- `docs/governance/ROLES-RESPONSIBILITIES.md`;
- `src/api/governance.ts`;
- MCP implementation and contracts;
- authorization implementation;
- `SECURITY.md`;
- `docs/EVIDENCE.md`;
- CI and release evidence;
- audit events and public-safe logs;
- and this controlled change history.

## 11. Current Posture

After approval of this record:

- the initial AIMS AI-risk baseline is documented;
- current controls and limitations are tied to concrete risks;
- treatment priorities are defined;
- risk acceptance remains explicit rather than implied;
- and the separate MCP AI impact assessment remains required.

Certification is not claimed.
