# ISO/IEC 42001:2023 Statement of Applicability

**Reference:** WG-SOA-002  
**Status:** Proposed  
**Owner:** WizardGang  
**Assessment date:** 2026-09-02  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material scope, risk, supplier, architecture, data, personnel, or AI-capability change

## Purpose

This SoA records Annex A applicability, rationale, current implementation/evidence status, and remaining treatment for the declared management-system scope. Control labels are short paraphrases, not ISO normative text. This supports an **aligned — uncertified** posture only.

## Rules

- **Applicable:** selected because of scope, risk, policy, interested-party requirements, supplier dependency, or operating need.
- **Not applicable:** outside current scope; rationale is mandatory and must be revisited when scope changes.
- **Met / Partial / Gap / N/A:** evidence status only; not a certification score.
- A control is never excluded because implementation is missing. Missing implementation remains `Gap` or `Partial`.
- This document is Proposed while PR #56 is open. Merge approves the SoA baseline but does not automatically make `Partial`/`Gap` controls `Met` or accept residual risks.

## Scope notes

- **Scope:** the current public, read-only WizardGang MCP capability and the application controls governing its tools, permissions, data, logging, evaluation, change, and operation.
- WizardGang does not claim to develop or control a general-purpose AI model in this scope.
- Future write, privileged, destructive, deployment, private-data, or autonomous AI authority requires SoA, risk, and impact reassessment.
- Model-training/fine-tuning data controls are excluded where no training, labeling, or enhancement pipeline exists.

## Evidence key

`AIPOL` AI policy · `ROLES` roles/responsibilities · `AIRISK` AI risk register · `AIA` MCP AI impact assessment · `MCP` MCP/governance source · `SEC` SECURITY.md · `OPS` operations · `CHANGE` change/release · `EVID` evidence/architecture

## Summary

| Controls | Met | Partial | Gap | N/A |
|---:|---:|---:|---:|---:|
| 38 | 2 | 30 | 4 | 2 |

## Applicability register

| Control | Theme | Applicability | Status | Basis / evidence / remaining gap |
|---|---|---|---|---|
| A.2.2 | Policies | Yes | Partial | Included by scope/risk. A dedicated AI policy now exists in this PR; it remains Proposed until merge and has not yet accumulated communication/review evidence. Evidence: AIPOL,AIRISK. |
| A.2.3 | Policies | Yes | Partial | Included by scope/risk. The AI policy explicitly operates alongside information-security, risk, change, supplier, and other governance controls; a complete policy crosswalk remains to be maintained. Evidence: AIPOL,AIRISK. |
| A.2.4 | Policies | Yes | Partial | Included by scope/risk. The AI policy now defines annual and event-driven review triggers; it remains Proposed until merge and no completed periodic review cycle exists yet. Evidence: AIPOL,AIRISK. |
| A.3.2 | Organization | Yes | Partial | Included by scope/risk. The roles record now assigns AI capability, risk, approval, oversight, and review responsibilities; the record remains Proposed and recurring evidence is still limited. Evidence: MCP,ROLES,AIRISK. |
| A.3.3 | Organization | Yes | Gap | Included by scope/risk. No dedicated AI concern/bias/safety/ethics reporting process evidenced. Evidence: ROLES,AIRISK. |
| A.4.2 | Resources | Yes | Partial | Included by scope/risk. Runtime, source, tools, D1/R2, MCP, and evidence locations are documented; no consolidated AI resource register. Evidence: EVID,AIRISK. |
| A.4.3 | Resources | Yes | Partial | Included by scope/risk. Demo data stores and boundaries are documented; AI-specific data ownership, quality, provenance, retention, and lifecycle inventory is incomplete. Evidence: OPS,AIRISK. |
| A.4.4 | Resources | Yes | Partial | Included by scope/risk. MCP/tool boundary and platform tooling are inspectable; no formal AI-tool inventory/approval lifecycle. Evidence: MCP,AIRISK. |
| A.4.5 | Resources | Yes | Partial | Included by scope/risk. Cloudflare infrastructure and service dependencies are documented; AI-system resource capacity/assurance inventory is incomplete. Evidence: OPS,AIRISK. |
| A.4.6 | Resources | Yes | Gap | Included by scope/risk. No AI human-resource competency/capacity/training record. Evidence: AIRISK. |
| A.5.2 | Impact | Yes | Partial | Included by scope/risk. The risk methodology now defines an AI impact-assessment interface and mandatory reassessment triggers; a dedicated standalone impact-assessment procedure/template can still be formalized. Evidence: AIRISK,AIA. |
| A.5.3 | Impact | Yes | Partial | Included by scope/risk. A retained MCP AI impact assessment now exists for the current read-only capability; the assessment remains Proposed until merge and must be repeated for material capability changes. Evidence: AIRISK,AIA. |
| A.5.4 | Impact | Yes | Partial | Included by scope/risk. The MCP impact assessment explicitly evaluates direct and indirect affected parties, human oversight, misuse, accessibility, data exposure, and downstream interpretation; future broader use requires reassessment. Evidence: AIRISK,AIA. |
| A.5.5 | Impact | Yes | Partial | Included by scope/risk. The MCP impact assessment considers broader downstream, information-ecosystem, interoperability, and societal consequences proportionate to the current low-authority demo; broader impact methodology remains limited. Evidence: AIRISK,AIA. |
| A.6.1.2 | Lifecycle | Yes | Partial | Included by scope/risk. Approved-tool/fail-closed/traceability objectives are evident, but no complete responsible-AI objective set. Evidence: MCP,AIRISK,AIA. |
| A.6.1.3 | Lifecycle | Yes | Partial | Included by scope/risk. Controlled SDLC exists; AI-specific responsible-design process is not comprehensive. Evidence: CHANGE,AIRISK,AIA. |
| A.6.2.2 | Lifecycle | Yes | Partial | Included by scope/risk. Approved read methods, namespace boundary, intended use, and failure behavior are specified; broader functional/responsible-AI requirements are incomplete. Evidence: MCP,AIRISK,AIA. |
| A.6.2.3 | Lifecycle | Yes | Partial | Included by scope/risk. Source and evidence are inspectable; no consolidated AI design-decision/model/system documentation package. Evidence: EVID,AIRISK,AIA. |
| A.6.2.4 | Lifecycle | Yes | Partial | Included by scope/risk. Approved, unknown-method, and invalid-scope cases are exercised; validation does not cover a full AI risk/quality suite. Evidence: MCP,AIRISK,AIA. |
| A.6.2.5 | Lifecycle | Yes | Partial | Included by scope/risk. Tagged/release/deployment traceability exists; AI-specific deployment gates/approval criteria are incomplete. Evidence: EVID,AIRISK,AIA. |
| A.6.2.6 | Lifecycle | Yes | Partial | Included by scope/risk. Audit events and operational surfaces exist; AI performance/risk/drift monitoring is not comprehensive. Evidence: MCP,AIRISK,AIA. |
| A.6.2.7 | Lifecycle | Yes | Partial | Included by scope/risk. MCP implementation/source/evidence are public; technical-documentation completeness/maintenance criteria are not formalized. Evidence: MCP,AIRISK,AIA. |
| A.6.2.8 | Lifecycle | Yes | Met | Included by scope/risk. Boundary evaluation records meaningful events into the audit stream and preserves traceability without exposing secrets. Evidence: MCP,AIRISK,AIA. |
| A.7.2 | Data | No | N/A | Excluded — The reviewed demo does not train or enhance an AI model. Reclassify if model development/fine-tuning enters scope. |
| A.7.3 | Data | Yes | Partial | Included by scope/risk. Demo data sources are controlled, but lawful acquisition/licensing/consent/provenance criteria are not captured as an AI-data process. Evidence: OPS,AIRISK,AIA. |
| A.7.4 | Data | Yes | Partial | Included by scope/risk. Validation/bounded schemas exist for application data, but no formal AI-data quality/representativeness criteria and results. Evidence: AIRISK,AIA. |
| A.7.5 | Data | Yes | Partial | Included by scope/risk. D1/R2 and evidence relationships are traceable at system level; dataset lineage/provenance is incomplete. Evidence: EVID,AIRISK,AIA. |
| A.7.6 | Data | No | N/A | Excluded — No model-training data preparation/labeling pipeline identified in current demo scope; reassess if added. |
| A.8.2 | Interested parties | Yes | Partial | Included by scope/risk. Public route/source/docs explain behavior and limitations; user information is not yet a complete AI system card/instruction set. Evidence: MCP,AIRISK,AIA. |
| A.8.3 | Interested parties | Yes | Gap | Included by scope/risk. No defined AI external/regulatory reporting process. Evidence: AIRISK. |
| A.8.4 | Interested parties | Yes | Gap | Included by scope/risk. No AI-specific incident notification thresholds, recipients, timing, or records. Evidence: AIRISK. |
| A.8.5 | Interested parties | Yes | Partial | Included by scope/risk. Public alignment disclaimers, boundary behavior, and evidence are visible; stakeholder-specific disclosure obligations are not mapped. Evidence: MCP,AIRISK,AIA. |
| A.9.2 | Use | Yes | Partial | Included by scope/risk. Allowed/unknown/invalid MCP behavior is defined and fail closed; responsible-use process beyond that boundary is incomplete. Evidence: MCP,AIRISK,AIA. |
| A.9.3 | Use | Yes | Partial | Included by scope/risk. Safe bounded read behavior and auditability are implicit objectives; no formal objective/measures register. Evidence: MCP,AIRISK,AIA. |
| A.9.4 | Use | Yes | Met | Included by scope/risk. The demo explicitly distinguishes approved methods from unknown methods and invalid scope and documents intended boundary/oversight/fallback. Evidence: MCP,AIRISK,AIA. |
| A.10.2 | Third parties | Yes | Partial | Included by scope/risk. The assessment and interested-party/roles records distinguish WizardGang-controlled responsibilities from external model/client responsibilities; a formal AI value-chain responsibility matrix remains incomplete. Evidence: AIRISK,AIA. |
| A.10.3 | Third parties | Yes | Partial | Included by scope/risk. Cloud/platform dependencies are known, but AI supplier due diligence, contractual requirements, monitoring, and exit controls are not formalized. Evidence: OPS,AIRISK,AIA. |
| A.10.4 | Third parties | Yes | Partial | Included by scope/risk. Public users receive some boundary/limitation information; customer responsibilities/obligations are not formally defined. Evidence: MCP,AIRISK,AIA. |

## Control selection and treatment

Applicable controls are selected from the declared scope, interested-party requirements, policies, risk registers, supplier dependencies, architecture, and operating requirements. Treatment work uses the controlled lifecycle:

`requirement / risk → DEMO-### → branch → PR → validation → review → merge → release → deployment → verification → evidence`

A control status change requires evidence. Risk acceptance remains explicit and attributable; it is not implied by SoA approval.

## Alignment

This is repository-controlled governance evidence for an **ISO-aligned, uncertified** management-system demonstration. Independent certification is not claimed.
