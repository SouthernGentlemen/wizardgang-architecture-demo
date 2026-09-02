# Artificial Intelligence Policy

**Reference:** WG-POL-002  
**Applies to:** ISO/IEC 42001:2023 §5.2  
**Status:** Approved
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually and after material changes to AI scope, intended use, capabilities, data, suppliers, risk, incidents, or applicable requirements

## 1. Purpose

This policy establishes the direction for responsible design, integration, operation, evaluation, and governance of artificial-intelligence capabilities within the WizardGang Architecture Demo.

The objective is to ensure that AI-enabled behavior remains bounded, intentional, reviewable, secure, traceable, and subject to human accountability.

This policy supports engineering alignment with ISO/IEC 42001. It does not represent certification.

## 2. Scope

This policy applies to the AI management system defined in `docs/governance/SCOPE.md`, including AI-related capabilities that WizardGang designs, configures, exposes, integrates, evaluates, or operates as part of the demo.

Current in-scope AI behavior includes the controlled Model Context Protocol boundary and any related agent-facing interfaces, tools, authorization rules, data access, logging, evaluation, fallback behavior, and operational controls.

General-purpose third-party AI models or services are not represented as being developed or controlled by WizardGang when they are supplier-owned. Their use, configuration, permissions, data exposure, and dependency risks remain within the applicable management-system boundary.

## 3. Policy Commitments

WizardGang commits to treating AI as a controlled system capability rather than an unrestricted authority.

### 3.1 Defined purpose and intended use

Every material AI capability must have a defined purpose and intended use appropriate to the scope of the system.

The capability should identify, where relevant:

- intended users;
- intended operations;
- expected inputs and outputs;
- data or systems it may access;
- decisions or actions it may influence;
- prohibited or unsupported uses;
- foreseeable misuse;
- and known limitations.

An AI capability must not silently expand its own intended authority merely because a technically broader interface exists.

### 3.2 Explicit system boundaries

AI integrations must operate inside defined technical and organizational boundaries.

AI callers do not bypass ordinary authentication, authorization, validation, logging, data-access, or change-management controls.

Tool and API exposure must be deliberate. Unknown methods, invalid namespaces, unauthorized operations, malformed requests, and unsupported capability requests should fail safely according to the relevant interface contract.

### 3.3 Human accountability and oversight

Accountability for AI-enabled system behavior remains with authorized human management and operators.

AI systems may assist with analysis, generation, retrieval, testing, or automation, but they do not replace accountable approval where the management system requires a human decision.

Human authority must remain over, as applicable:

- policy approval;
- management-system scope;
- risk acceptance;
- production source and configuration;
- privileged access;
- deployment and release decisions;
- destructive or high-impact actions;
- corrective action;
- and management review.

Where automated execution is permitted, the authorization for that automation must itself be explicit and controlled.

### 3.4 Risk and impact management

Material AI capabilities must be evaluated for risks and impacts proportionate to their intended use and possible consequences.

Evaluation should consider, where relevant:

- security and unauthorized access;
- privacy and data exposure;
- incorrect or misleading output;
- inappropriate automation;
- loss of human oversight;
- excessive permissions;
- unintended tool use;
- harmful or discriminatory outcomes;
- accessibility impacts;
- dependency and supplier risks;
- operational failure;
- foreseeable misuse;
- and affected interested parties.

Risk treatment and accepted residual risk must be documented where material.

### 3.5 Data governance

AI capabilities must use data only within approved system and authorization boundaries.

Data sources, persistence, retrieval paths, and sensitive-data exposure should be understood and controlled according to risk.

AI integration must not be used as a reason to weaken existing access-control or confidentiality requirements.

Where third-party AI services process data, supplier behavior, contractual terms, data handling, retention, and exposure must be considered when relevant to the risk.

### 3.6 Security

AI capabilities are subject to the Information Security Policy and ordinary security architecture.

AI-specific behavior must preserve, as applicable:

- least privilege;
- explicit authorization;
- secrets separation;
- input validation;
- bounded data access;
- secure integration;
- logging and auditability;
- fail-closed behavior;
- and controlled change.

AI callers must not receive elevated authority solely because the interaction is mediated through an agent or model.

### 3.7 Transparency and inspectability

The public demo should make material AI boundaries and demonstrated behavior inspectable where practical and safe.

Documentation and evidence should distinguish between:

- what the WizardGang system controls;
- what a third-party model or provider controls;
- intended behavior;
- tested behavior;
- limitations;
- and unresolved gaps.

The system must not imply deterministic, complete, certified, or independently verified AI assurance when the available evidence does not support that claim.

### 3.8 Testing and evaluation

AI-related functionality must be tested in ways appropriate to the capability and risk.

Evaluation may include:

- approved-capability tests;
- unauthorized-operation tests;
- invalid-method and namespace tests;
- permission-boundary tests;
- malformed-input tests;
- logging verification;
- fallback and failure behavior;
- misuse cases;
- regression testing;
- and human review of behavior that cannot be established reliably through automation alone.

Passing a narrow automated evaluation does not establish complete safety or conformance.

### 3.9 Logging and traceability

Material AI interactions and system events must be logged where necessary to support accountability, troubleshooting, security, evaluation, and incident investigation.

Logs and evidence must avoid unnecessary disclosure of sensitive information.

AI-related changes must remain traceable through the controlled Git lifecycle and, when released, to the deployed production version.

### 3.10 Change management

Material changes to AI capabilities must be controlled and evaluated proportionately to risk.

Changes that may trigger reassessment include:

- new tools or permissions;
- broader data access;
- new model or provider integrations;
- changed intended use;
- changed prompts or orchestration that materially affect behavior;
- autonomous or write capabilities;
- changes to human oversight;
- new affected parties;
- and changes to safety, fallback, or monitoring behavior.

The normal repository change and release process applies.

### 3.11 Supplier and model dependency

External AI models, hosting providers, identity providers, libraries, and integration platforms must be treated as dependencies rather than assumed internal controls.

WizardGang is responsible for decisions within its control, including:

- provider selection;
- configuration;
- permissions;
- exposed data;
- tool access;
- integration design;
- monitoring;
- and fallback behavior.

Supplier limitations and incidents must be considered when they affect the in-scope system.

### 3.12 Accessibility and human usability

AI-enabled features should be designed so that users can understand and operate relevant controls without unnecessary accessibility barriers.

Where AI output affects user understanding or action, presentation, error states, alternatives, and human override should be considered together with accessibility requirements.

### 3.13 Failure and graceful degradation

AI capability should fail in a controlled manner when required dependencies, permissions, contracts, or validation are unavailable.

Failure must not silently expand privileges or bypass required controls.

Where practical, the system should preserve useful non-AI behavior or provide a clear fallback rather than treating AI availability as equivalent to total system availability.

### 3.14 Incidents, concerns, and corrective action

Material AI failures, misuse, unexpected behavior, control failures, or credible concerns must be evaluated and addressed proportionately to their impact.

Corrective action should identify:

- what occurred;
- affected capability or interested parties;
- immediate containment where required;
- root or contributing causes where useful;
- changes made;
- verification of effectiveness;
- and whether risk or impact assessments require revision.

## 4. AI Objectives

Specific measurable AI-management objectives are maintained separately under the objectives process.

At a policy level, WizardGang intends to:

- keep AI authority bounded and explicit;
- preserve human accountability for material decisions;
- prevent AI interfaces from bypassing existing security controls;
- identify intended use and foreseeable misuse for material AI capabilities;
- evaluate AI risks and impacts before or alongside material expansion;
- retain useful AI event and change evidence;
- make limitations visible rather than overstating assurance;
- and improve AI governance based on evaluation, incidents, risk, audit, and review.

## 5. Roles and Responsibilities

Leadership is accountable for approving this policy, determining AI-management priorities, providing resources, approving material risk acceptance, and ensuring AI governance is integrated into ordinary engineering and operations.

Developers and operators are responsible for implementing AI capabilities within approved boundaries and escalating material gaps, failures, or risks.

Where one individual performs multiple roles, the responsibilities remain distinct even if held by the same person.

## 6. Prohibited Governance Practices

The following practices are not acceptable within the declared management-system model:

- granting unrestricted system authority solely because the caller is an AI agent;
- representing third-party model controls as WizardGang-operated controls;
- using AI to bypass authentication or authorization requirements;
- silently enabling materially broader AI permissions;
- treating automated evaluation as proof of complete AI safety;
- suppressing known material limitations from assurance claims;
- or claiming ISO/IEC 42001 certification without independent certification evidence.

## 7. Exceptions

Material exceptions to this policy require documented rationale and risk consideration.

An exception should state:

- the policy requirement being varied;
- why the exception is necessary;
- affected AI capability and interested parties;
- associated risk or impact;
- compensating controls where applicable;
- responsible decision maker;
- review or expiry conditions;
- and evidence of approval.

An undocumented bypass is not an approved exception.

## 8. Communication and Availability

This policy is repository-controlled documented information.

Because the covered AI demo and governance model are intentionally public, this policy may be publicly available unless a future requirement makes a portion of it sensitive.

People performing in-scope work are expected to understand the AI-governance requirements relevant to their responsibilities.

## 9. Review and Continual Improvement

This policy must be reviewed:

- at least annually;
- during management review;
- after a material AI incident or credible concern;
- when intended use materially changes;
- when AI permissions or autonomy materially expand;
- when a significant model, provider, data source, or integration changes;
- when risk or impact assessment identifies a material deficiency;
- or when applicable requirements materially change.

Policy changes use the normal controlled Git process.

## 10. Evidence

Evidence supporting this policy includes, as applicable:

- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- `docs/governance/SCOPE.md`;
- `docs/governance/MANAGEMENT-SYSTEM.md`;
- `docs/governance/LEADERSHIP.md`;
- `SECURITY.md`;
- MCP contracts and implementation source;
- AI/MCP evaluation evidence;
- authentication and authorization source;
- audit events and public-safe operational logs;
- controlled Git changes and pull requests;
- CI validation evidence;
- tagged releases and deployment records;
- and AI risk, impact, applicability, incident, and corrective-action records when established.

## 11. Alignment

This policy supports **ISO/IEC 42001:2023 §5.2 — AI policy**.

**Current posture after approval:** AI-management direction and commitments are formally defined and controlled; certification is not claimed.
