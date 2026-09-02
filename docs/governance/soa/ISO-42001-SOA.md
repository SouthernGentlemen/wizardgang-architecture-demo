# ISO/IEC 42001:2023 Statement of Applicability

**Reference:** WG-SOA-002  
**Status:** Approved
**Owner:** WizardGang  
**Assessment date:** 2026-09-02  
**Last refreshed by:** DEMO-105  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually and after material scope, risk, supplier, architecture, data, personnel, or AI-capability change

## Purpose

This SoA records Annex A applicability, rationale, current implementation/evidence status, and remaining treatment for the declared AI management-system scope. Control labels are short paraphrases, not ISO normative text. This supports an **aligned — uncertified** posture only.

## Refresh basis

`DEMO-105` reassesses all 38 Annex A controls against the repository baseline through `DEMO-104`, including AI concern reporting, competence/awareness, incident management, supplier governance, data governance, secure engineering, continuity, and the canonical governance index added after the original `DEMO-081` SoA.

Status changes are evidence-driven:

- a defined governance mechanism can move a former structural `Gap` to `Partial`;
- documentation alone does not establish operating effectiveness or justify `Met`;
- planned competence/awareness cycles, supplier reviews, exercises, evaluations, audits, and management reviews are not counted as completed evidence;
- WizardGang does not represent external model/provider reasoning, memory, prompt handling, or internal controls as WizardGang-operated controls;
- no status implies certification, model safety, or residual-risk acceptance.

## Rules

- **Applicable:** selected because of scope, risk, policy, interested-party requirements, supplier dependency, data use, AI impact, or operating need.
- **Not applicable:** outside current scope; rationale is mandatory and must be revisited when scope changes.
- **Met / Partial / Gap / N/A:** evidence status only; not a certification score.
- A control is never excluded because implementation is missing. Missing implementation remains `Gap` or `Partial`.
- This document is Proposed while PR #56 is open. Merge approves this refreshed SoA but does not automatically make `Partial` controls `Met` or accept residual risks.

## Scope notes

- **Scope:** the current public, read-only WizardGang MCP capability and the application controls governing its tools, permissions, data, logging, evaluation, change, suppliers, and operation.
- WizardGang does not claim to develop or control a general-purpose AI model in this scope.
- **Approved provider/client boundary:** OpenAI Codex and Anthropic Claude are the only approved AI/MCP families.
- **Approved public MCP data boundary:** `demo_records` is the only approved D1 source for public MCP records; visitor/session, identity, logs, audit, R2, and secrets remain outside that boundary.
- Future write, privileged, destructive, deployment, private-data, autonomous authority, third-provider use, or reduced oversight requires controlled supplier/risk/impact/SoA/data/testing review before approval.
- Model-training/fine-tuning data controls remain N/A while no training, labeling, or model-enhancement pipeline exists.

## Evidence key

`AIPOL` AI policy · `ROLES` roles · `AIRISK` AI risk register · `AIA` MCP AI impact assessment · `MCP` MCP source/governance · `SEC` SECURITY.md · `OPS` operations · `CHANGE` change/release · `EVID` evidence/architecture · `SUP` supplier governance · `INC` incident management · `COMP` competence/awareness/concerns · `DATA` data governance · `LEGAL` obligations · `CFG` configuration/drift · `ENG` secure engineering/testing · `CONT` continuity · `OBJ` objectives · `MME` monitoring/measurement · `IDX` control/document index · `GOV` integrated governance

## Summary

| Controls | Met | Partial | Gap | N/A |
|---:|---:|---:|---:|---:|
| 38 | 2 | 34 | 0 | 2 |

Compared with the original `DEMO-081` SoA (`2 Met / 30 Partial / 4 Gap / 2 N/A`), all four former structural gaps now have controlled processes or registers. They remain `Partial` because operating evidence is still incomplete.

## Applicability register

| Control | Theme | Applicability | Status | Basis / evidence / remaining gap |
|---|---|---|---|---|
| A.2.2 | Policies | Yes | Partial | AI policy is defined and controlled with intended-use, authority, data, evaluation, human-accountability, supplier, incident, accessibility, and overclaim boundaries; approval and recurring communication/review evidence remain incomplete. Evidence: AIPOL,COMP. |
| A.2.3 | Policies | Yes | Partial | AI policy is integrated with security, risk, change, supplier, data, incident, continuity, accessibility, and corrective-action governance; recurring cross-policy review evidence remains partial. Evidence: AIPOL,GOV. |
| A.2.4 | Policies | Yes | Partial | Annual and event-driven AI policy review triggers are defined; no completed periodic review cycle is yet evidenced. Evidence: AIPOL,MREV. |
| A.3.2 | Organization | Yes | Partial | AI governance, technical ownership, risk/impact, supplier, release, incident, evidence, and approval responsibilities are assigned; recurring assignment/review evidence remains limited. Evidence: ROLES,COMP. |
| A.3.3 | Organization | Yes | Partial | A dedicated public AI/MCP concern path, private security route, triage categories, escalation triggers, and downstream risk/incident/corrective-action routing are defined; operating history is not yet established. Evidence: COMP,INC. |
| A.4.2 | Resources | Yes | Partial | Source, runtime, data stores, MCP tools, suppliers, configuration, evidence, access, and continuity resources are inventoried across controlled registers; a single consolidated AI-resource view is not yet exposed. Evidence: ACCESS,DATA,SUP,CFG. |
| A.4.3 | Resources | Yes | Partial | AI-accessible data ownership, classification, provenance/freshness, retention/deletion, backup inheritance, and public/private boundaries are defined; operational provenance/freshness coverage remains partial. Evidence: DATA,AIRISK. |
| A.4.4 | Resources | Yes | Partial | MCP methods, permissions, read-only authority, approved provider/client families, change triggers, and secure-engineering expectations are controlled; a dedicated tool approval register and recurring tool review remain partial. Evidence: MCP,SUP,ENG. |
| A.4.5 | Resources | Yes | Partial | Cloudflare/GitHub/runtime/service dependencies, continuity modes, configuration baselines, supplier criticality, and operational guardrails are documented; provider-side capacity/assurance remains partial. Evidence: SUP,CONT,CFG. |
| A.4.6 | Resources | Yes | Partial | Role-based AI competence expectations and an initial competence/awareness register exist; several records remain Partial/Planned and no completed recurring competence cycle is claimed. Evidence: COMP. |
| A.5.2 | Impact | Yes | Partial | AI impact-assessment triggers, scope, relationship to risk/change, and reassessment requirements are defined; broader operating history remains limited. Evidence: AIRISK,AIA,GOV. |
| A.5.3 | Impact | Yes | Partial | A retained impact assessment exists for the current read-only MCP capability and defines reassessment triggers for provider, data, authority, autonomy, intended use, or oversight changes; recurring reassessment evidence remains future work. Evidence: AIA,AIRISK. |
| A.5.4 | Impact | Yes | Partial | The MCP impact assessment covers users, affected parties, accessibility, misuse, data exposure, human oversight, downstream interpretation, and limitations; broader capability changes require reassessment. Evidence: AIA,AIRISK. |
| A.5.5 | Impact | Yes | Partial | The assessment considers downstream ecosystem, interoperability, supplier, trust, information-quality, and societal consequences proportionate to the current low-authority demo; broader impact evidence remains limited. Evidence: AIA,AIRISK. |
| A.6.1.2 | Lifecycle | Yes | Partial | Objectives now include AI boundary, evaluation, data transparency, evidence freshness, supplier, and governance outcomes, but achievement history remains incomplete. Evidence: OBJ,AIPOL,AIRISK. |
| A.6.1.3 | Lifecycle | Yes | Partial | Controlled change, secure engineering, risk/impact reassessment, supplier/data review, and human approval requirements form an AI-aware design/development process; recurring effectiveness evidence remains partial. Evidence: CHANGE,ENG,AIRISK. |
| A.6.2.2 | Lifecycle | Yes | Partial | Approved methods, read-only authority, demo_records-only D1 source, namespace/scope constraints, intended use, failure behavior, provider boundary, and escalation triggers are specified; broader responsible-AI requirements remain capability-dependent. Evidence: MCP,AIPOL,DATA. |
| A.6.2.3 | Lifecycle | Yes | Partial | Architecture, source, impact, risk, supplier, data, evaluation, configuration, and evidence records document the AI/MCP system; a single consolidated system card/design package is not yet maintained. Evidence: EVID,AIA,IDX. |
| A.6.2.4 | Lifecycle | Yes | Partial | Approved, unknown, invalid-scope, authorization, input, security, and negative/abuse-path cases are governed and tested; expanded AI evaluation coverage remains an objective. Evidence: MCP,ENG,OBJ. |
| A.6.2.5 | Lifecycle | Yes | Partial | AI-relevant changes follow DEMO risk/impact review, CI, PR review, tagged release/deployment, verification, and rollback expectations; no separately completed AI deployment-review history is claimed. Evidence: CHANGE,ENG. |
| A.6.2.6 | Lifecycle | Yes | Partial | Audit events, logs, health, uptime, usage, configuration, incident, supplier, and risk review channels exist; model/provider behavior and broader AI drift/evaluation monitoring remain partial. Evidence: OPS,CFG,AIRISK. |
| A.6.2.7 | Lifecycle | Yes | Partial | MCP implementation, architecture, policies, risks, impact, data, suppliers, concerns, tests, and limitations are documented in source; completeness/freshness must continue to be maintained through controlled changes. Evidence: IDX,EVID,MCP. |
| A.6.2.8 | Lifecycle | Yes | Met | Boundary evaluation records meaningful MCP behavior into the audit/evidence stream with bounded, public-safe logging and traceability. Evidence: MCP,EVID,OPS. |
| A.7.2 | Data | No | N/A | Excluded — the current scope does not train, fine-tune, or enhance a model. Reclassify before introducing model-development/training activity. |
| A.7.3 | Data | Yes | Partial | AI-accessible data sources, provenance expectations, licensing/obligation triggers, public/private boundaries, approved demo_records source, and supplier responsibilities are documented; source-specific legal/provenance evidence remains partial. Evidence: DATA,LEGAL,MCP. |
| A.7.4 | Data | Yes | Partial | Schema validation, bounded queries, source constraints, freshness/provenance expectations, and evaluation requirements exist; complete quality/representativeness measurement remains partial. Evidence: DATA,MCP,ENG. |
| A.7.5 | Data | Yes | Partial | Data inventory, storage/source, authority, provenance/freshness, backup, retention/deletion, and evidence relationships are documented; end-to-end automated lineage remains incomplete. Evidence: DATA,EVID. |
| A.7.6 | Data | No | N/A | Excluded — no model-training data preparation, labeling, or enhancement pipeline exists in the current scope; reassess if introduced. |
| A.8.2 | Interested parties | Yes | Partial | Public documentation, governance, concern reporting, intended-use/authority limits, provider boundary, and uncertified status inform users; a consolidated public AI system card remains incomplete. Evidence: MCP,COMP,AIPOL. |
| A.8.3 | Interested parties | Yes | Partial | Obligations, incident, concern, and communication processes now define when external/regulatory reporting must be assessed and recorded; actual recipients, deadlines, and evidence remain obligation/event dependent. Evidence: LEGAL,INC,COMP. |
| A.8.4 | Interested parties | Yes | Partial | AI/security incident severity, notification-decision rules, sensitive handling, external communication, evidence, and exercise requirements are defined; EX-001 and real notification history remain incomplete. Evidence: INC,COMP. |
| A.8.5 | Interested parties | Yes | Partial | Public assurance language, limitations, data/authority boundaries, accessibility, provider restrictions, concern channels, and affected-party considerations are documented; stakeholder-specific disclosure obligations remain event/context dependent. Evidence: AIPOL,AIA,COMP,LEGAL. |
| A.9.2 | Use | Yes | Partial | Allowed read-only methods, authorization, data scope, intended use, concern/incident escalation, provider restrictions, and fail-closed handling define responsible use; operating/evaluation history remains incomplete. Evidence: MCP,AIPOL,COMP. |
| A.9.3 | Use | Yes | Partial | Measurable AI management objectives now cover boundary control, expanded evaluation, data transparency, and governance freshness; objective achievement history remains incomplete. Evidence: OBJ,MME. |
| A.9.4 | Use | Yes | Met | The implementation explicitly distinguishes approved methods, invalid scope, unknown methods, authorized data, read-only authority, oversight, fallback, and provider restrictions. Evidence: MCP,AIA,AIPOL. |
| A.10.2 | Third parties | Yes | Partial | Supplier, roles, data, impact, incident, and AI policy records distinguish WizardGang-controlled server responsibilities from provider/client/model and user responsibilities; recurring value-chain review remains partial. Evidence: SUP,ROLES,AIA. |
| A.10.3 | Third parties | Yes | Partial | Codex and Claude are the only approved AI/MCP families, with supplier criticality, change/review triggers, data/security/continuity/incident expectations, and approval rules documented; periodic supplier assurance remains incomplete. Evidence: SUP,AIPOL. |
| A.10.4 | Third parties | Yes | Partial | Public users receive intended-use, authority, data, provider, limitation, security, concern, and accessibility responsibilities through source/docs and public surfaces; a formal customer-responsibility statement is not yet consolidated. Evidence: MCP,AIPOL,COMP. |

## Control selection and treatment

Applicable controls are selected from the declared scope, interested-party requirements, AI/security policies, risk and impact assessments, supplier/data boundaries, architecture, intended use, affected-party considerations, and operating requirements.

Treatment work uses the controlled lifecycle:

`requirement / risk / impact → DEMO-### → branch → PR → validation → review → merge → release → deployment → verification → evidence`

A control status change requires evidence. Risk acceptance remains explicit and attributable; it is not implied by SoA approval.

## Remaining operating-evidence priorities

There are no `Gap` rows in this refreshed Annex A applicability record, but that does **not** mean the AIMS is complete or certified. The dominant posture remains `Partial`.

Priority evidence includes:

- first completed AI competence/awareness cycle;
- first completed AI/supplier review cycle;
- expanded AI/MCP negative and boundary evaluation evidence;
- operational data provenance/freshness and public transparency evidence;
- `EX-001` incident/concern exercise;
- recurring monitoring/objective history;
- formal self-assessment/audit and management review;
- and provider-side assurance where relevant and actually verifiable.

## Alignment

This is repository-controlled governance evidence for an **ISO-aligned, uncertified** AI-management-system demonstration. Independent certification is not claimed.
