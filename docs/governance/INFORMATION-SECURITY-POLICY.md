# Information Security Policy

**Reference:** WG-POL-001  
**Applies to:** ISO/IEC 27001:2022 §5.2  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material changes to scope, risk, architecture, suppliers, incidents, or applicable requirements

## 1. Purpose

This policy establishes the information-security direction for the WizardGang Architecture Demo and its in-scope management system.

The objective is to protect the confidentiality, integrity, availability, authenticity, and traceability of information and system behavior to a level appropriate to the declared scope and identified risks.

This policy supports engineering alignment with ISO/IEC 27001. It does not represent certification.

## 2. Scope

This policy applies to the information-security management system defined in `docs/governance/SCOPE.md`, including:

- `demo.wizardgang.ai`;
- the public source repository and controlled delivery lifecycle;
- GitHub-based change, validation, review, release, and evidence mechanisms;
- Cloudflare-hosted runtime, storage, configuration, and operational resources used by the demo;
- credentials and secrets required to administer or integrate the system;
- APIs, webhooks, identity integrations, MCP boundaries, and administrative capabilities;
- operational monitoring, audit events, and evidence records;
- and management-system documentation and records.

Provider-owned facilities and controls remain outside WizardGang's direct operational control, but supplier selection, configuration, integration, dependency risk, and assurance remain in scope.

## 3. Policy Commitments

WizardGang commits to managing information security as part of ordinary engineering and operations.

The in-scope system will be designed, changed, released, and operated according to the following commitments.

### 3.1 Risk-based security

Information-security controls will be selected and maintained based on:

- identified assets and information;
- threats and vulnerabilities;
- likelihood and impact;
- legal, contractual, supplier, and interested-party requirements;
- system architecture and exposure;
- and accepted residual risk.

Risk acceptance must be explicit where material risk remains after treatment.

### 3.2 Least privilege and explicit authorization

Access to privileged capabilities, credentials, administrative functions, data, and integrations must be limited to what is required for the intended function.

Authentication does not imply unrestricted authorization.

Public interfaces, human operators, automated workflows, integrations, and AI callers must remain within explicit permission boundaries.

### 3.3 Protect secrets and sensitive information

Secrets and credentials must not be committed to public source control.

Sensitive values must use managed secret mechanisms or other appropriately protected configuration paths.

Public logs, evidence, dashboards, and diagnostics must not expose credentials, private tokens, session material, unnecessary account metadata, or real payment information.

### 3.4 Secure development and controlled change

Production changes must use the controlled Git lifecycle defined by the repository unless an emergency condition requires a documented exception.

The normal path is:

`requirement → controlled change → review → automated validation → merge → release → deployment → verification → operational observation`

Repeatable security checks should be automated where practical.

Security-relevant changes must receive scrutiny proportional to risk.

### 3.5 Reproducible and traceable releases

A production release must be traceable to a specific reviewed source state, version tag, validation record, and deployment.

Released tags must represent reproducible product states and must not be silently rewritten as ordinary development practice.

Known limitations, rollback targets, and validation results must be retained where required by the release process.

### 3.6 Secure configuration and environment separation

Environment-specific secrets, credentials, provider identifiers, and privileged configuration must remain separated from public source where confidentiality is required.

Production configuration must be deliberate and reviewable.

Development and test behavior must not be assumed to represent production behavior without verification.

### 3.7 Validate inputs and trust boundaries

Requests crossing application or integration boundaries must be validated according to their risk and contract.

Security controls must fail closed where allowing ambiguous or invalid behavior would create unacceptable risk.

APIs, webhooks, authentication flows, administrative actions, and AI/MCP tools must preserve defined trust boundaries.

### 3.8 Logging, monitoring, and evidence

Security-relevant and operational events must be recorded where necessary to support:

- detection;
- investigation;
- accountability;
- operational understanding;
- management-system evaluation;
- and traceability.

Public diagnostic logs must remain bounded and sanitized.

Audit evidence must remain distinguishable from ordinary debugging output where the distinction matters.

### 3.9 Availability and recovery

The system must use controls proportionate to its purpose to support availability, failure visibility, graceful degradation, recovery, and rollback.

Availability claims must be based on actual observation rather than assumption.

Where recovery depends on a supplier or managed platform, that dependency must be recognized in risk and supplier management.

### 3.10 Vulnerability and dependency management

Known vulnerabilities and dependency risks must be evaluated and addressed according to their severity and relevance.

Dependencies must be version controlled where practical, and automated dependency/security validation should be used where appropriate.

Unsupported, abandoned, or materially risky components must not remain unexamined merely because they continue to build successfully.

### 3.11 Supplier and cloud security

Cloudflare, GitHub, identity providers, package ecosystems, and other material external services must be treated as dependencies with associated risk.

WizardGang remains responsible for secure configuration and use of supplier capabilities within its control.

Provider controls must not be misrepresented as controls directly operated by WizardGang.

### 3.12 Incident and corrective action

Security events, control failures, vulnerabilities, or incidents requiring action must be evaluated, contained or corrected as appropriate, and retained as evidence when material.

Corrective action should identify what failed, what was changed, and how effectiveness was verified.

Material incidents or near misses must feed risk assessment and management review when appropriate.

### 3.13 Security in AI integrations

AI integrations do not bypass information-security requirements.

AI callers must remain subject to the same authentication, authorization, validation, data-access, logging, and audit boundaries appropriate to equivalently privileged non-AI callers.

Privileged AI capabilities require explicit authorization and risk consideration.

### 3.14 Accessibility of security mechanisms

Security controls should not unnecessarily create inaccessible user experiences.

Authentication, error handling, administrative workflows, and other security-related interactions should be designed so that accessibility and security requirements are addressed together rather than treated as competing concerns.

## 4. Information-Security Objectives

Specific measurable objectives are maintained separately under the management-system objectives process.

At a policy level, WizardGang intends to:

- prevent unauthorized privileged access;
- prevent secrets from entering public source or public logs;
- preserve traceability from controlled change through production operation;
- detect and expose failed security controls rather than silently masking them;
- maintain bounded and reviewable integration surfaces;
- reduce material known vulnerabilities and dependency risk;
- preserve recoverable production baselines;
- and continually improve controls based on risk, evidence, incidents, audits, and review.

## 5. Roles and Responsibilities

Leadership is accountable for approving this policy, providing resources, accepting material residual risk, and ensuring that information-security requirements remain integrated into normal work.

People or automation performing security-related functions are responsible for operating within assigned authority and preserving required evidence.

Where one person performs multiple roles, the responsibilities remain distinct even if the role holder is the same individual.

## 6. Exceptions

A security control may be varied only when the exception is justified by scope, risk, technical constraints, or a documented management decision.

Material exceptions must state:

- what is being varied;
- why;
- the affected risk;
- compensating controls where applicable;
- who accepted the residual risk;
- and when the exception must be reviewed.

An undocumented bypass is not an approved exception.

## 7. Communication and Availability

This policy is repository-controlled documented information.

Because the covered demo and its governance model are intentionally public, this policy may be publicly available unless a future requirement makes a portion of it sensitive.

People performing in-scope work are expected to understand the security requirements relevant to their responsibilities.

## 8. Review and Continual Improvement

This policy must be reviewed:

- at least annually;
- during management review;
- after a material security incident;
- after a significant change to scope, architecture, suppliers, or identity model;
- when risk assessment identifies a material policy deficiency;
- or when applicable requirements materially change.

Policy changes use the normal controlled Git process.

## 9. Evidence

Evidence supporting this policy includes, as applicable:

- `SECURITY.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/RELEASE.md`;
- `docs/OPERATIONS.md`;
- `docs/EVIDENCE.md`;
- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- `docs/governance/SCOPE.md`;
- `docs/governance/MANAGEMENT-SYSTEM.md`;
- `docs/governance/LEADERSHIP.md`;
- Git pull requests and reviews;
- CI validation and evidence artifacts;
- tagged releases and deployment records;
- operational logs and audit events;
- security findings and corrective actions;
- and risk and applicability records when established.

## 10. Alignment

This policy supports **ISO/IEC 27001:2022 §5.2 — Information security policy**.

**Current posture after approval:** Information-security direction and commitments are formally defined and controlled; certification is not claimed.
