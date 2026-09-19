# AI Governance

**Reference:** WG-POL-002
**Owner:** AI Governance Owner
**Applies to:** AI-assisted and MCP-enabled behavior within the WizardGang Architecture Demo management-system boundary
**Review:** At least annually and after a material change to AI purpose, provider, tool authority, data boundary, human oversight, impact, security, or incident posture

## 1. Purpose

This document defines the current AI governance model: intended use, approved boundary, human accountability, impact review, supplier controls, data restrictions, testing, traceability, and change triggers.

Executable MCP contracts and runtime source remain authoritative for behavior. Structured assurance records remain authoritative for current supplier, risk, impact, objective, and evidence state.

## 2. Scope

The governed boundary includes the public MCP server, its tool and namespace contracts, data made available through that interface, AI-related demonstrations, approved external AI/MCP client or provider families, and AI-assisted engineering where it can materially affect the delivered system.

General-purpose external models remain supplier-owned. WizardGang governs its own configuration, permissions, exposed data, integration behavior, intended use, monitoring, fallback, and decision to continue using them.

## 3. Policy Commitments

AI-enabled capabilities shall have a defined purpose, explicit authority and data boundaries, accountable human ownership, proportionate risk and impact review, testable contracts, disclosure-safe logging, supplier review, and fail-closed behavior where a required control cannot be trusted.

### 3.1 Defined purpose and intended use

AI/MCP capabilities are introduced for a documented demonstration or engineering purpose. The intended user, input, output, data source, permitted action, and non-goals must be understandable enough to support testing and risk review.

### 3.2 Explicit system boundaries

The application boundary distinguishes WizardGang-controlled source, contracts, authorization, tool registration, data selection, logging, and operational policy from supplier-controlled model or client behavior.

AI/MCP access does not inherit provider, repository, release, application-admin, private-reporting, or risk-acceptance authority.

### 3.6 Security

AI/MCP interfaces follow the same security principles as other application interfaces: least privilege, explicit authorization, input validation, bounded output, safe logging, secret separation, dependency review, incident handling, and controlled supplier access.

### 3.7 Transparency and inspectability

Current tool purpose, input shape, output shape, authority, and material data boundary must be inspectable through source or contracts. Public claims distinguish demonstrated behavior from planned, partial, supplier-dependent, or unevidenced controls.

The application does not claim to inspect or control a supplier model's undisclosed internal reasoning.

### 3.9 Logging and traceability

Material application-side AI/MCP activity is logged or evidenced where necessary for troubleshooting, security, evaluation, incident review, and accountability. Logs remain bounded and exclude credentials, private authentication material, unsafe request bodies, and data outside the approved disclosure boundary.

### 3.10 Change management

A change to intended use, approved provider family, tool inventory, namespace, write/destructive authority, data source, public/private exposure, human oversight, evaluation conclusion, or relevant supplier behavior is material and must be assessed before the prior operating conclusion is reused.

Detailed branch, review, risk-field, validation, and merge mechanics are owned solely by docs/CHANGE-MANAGEMENT.md. Detailed release and deployment mechanics are owned solely by docs/RELEASE-MANAGEMENT.md.

## 3. Current Approved AI/MCP Boundary

The current public MCP boundary is read-only and non-destructive, uses the explicit demo:read permission, and exposes only approved public-safe data sources and bounded tools. No MCP tool receives implicit application administration, provider administration, deployment, source-control, private-data, or risk-acceptance authority.

Codex and Claude are the approved AI/MCP client/provider families for this managed integration boundary. Recognition of client metadata is informational and is not authentication. Adding another family requires supplier, risk, impact, applicability, evaluation, and management review appropriate to the proposed change.

The authoritative tool contract is contracts/mcp/tools.json. Current suppliers are recorded in assurance/governance/suppliers.json.

## 4. AI Objectives

AI objectives are maintained in assurance/objectives/objectives.json. Objectives must be measurable enough to support review and must not be upgraded based on documentation alone.

## 5. Human Accountability and Oversight

A human owner remains accountable for intended use, boundary approval, supplier selection, material risk acceptance, incident decisions, and release of authority-changing AI features. An AI client or supplier cannot approve its own expanded permissions, accept organizational risk, deploy production changes, or override application authorization.

## 6. Risk and Impact Assessment

AI risk is maintained in assurance/risks/risks.json. The current AI/MCP impact assessment is `docs/governance/AI-IMPACT-ASSESSMENT.md`; its impact method is informed by ISO/IEC 42005:2025 while ISO/IEC 42001:2023 remains the AI management-system baseline.

Impact reassessment is required when material changes affect purpose, affected parties, data, autonomy, authority, provider, tool behavior, security, human oversight, or foreseeable misuse.

## 7. Data Governance and Privacy

AI/MCP access is limited to data intentionally approved for the interface. Private identity/session data, credentials, secret values, private reports, privileged logs, payment data, and other restricted information are excluded unless a future controlled decision explicitly changes the boundary with appropriate legal, privacy, security, and impact review.

DATA-AND-PRIVACY.md owns classification, inventory, retention, deletion, and privacy requirements.

## 8. Data and AI-Specific Supplier Controls

Before approving an AI-related supplier or integration, review the data it receives, retained or reused data where known, geographic or contractual constraints where relevant, credentials and permissions, failure modes, available security information, model/service changes that can affect intended use, and exit or continuity implications.

Supplier limitations remain visible. Lack of provider transparency does not become evidence that a risk is absent.

## 9. Review and Continual Improvement

Review uses structured objectives, risk, supplier state, evaluation evidence, incidents, security findings, audit results, user-impact findings, and material provider or protocol changes.

Improvements are made through controlled changes. Documentation alone does not convert a gap or partial control into a demonstrated operating result.

## 11. Change Control

Supplier or AI-boundary changes are assessed for security, data, privacy, intended use, impact, human oversight, continuity, and SoA/compliance implications before approval. Emergency conditions do not authorize an unreviewed provider substitution or an authority expansion.

## 12. Evaluation and Testing

AI/MCP testing covers contract validity, allowed methods, namespace/data restrictions, prohibited write or destructive behavior, error handling, authorization, disclosure safety, and relevant misuse cases. Supplier behavior may be evaluated where it materially affects the integration, but external model results are not treated as deterministic application controls.

Current security-testing state is maintained in assurance/governance/security-testing.json.
