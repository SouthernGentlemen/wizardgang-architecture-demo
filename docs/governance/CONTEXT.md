# Context of the Organization

**Reference:** WG-GOV-001  
**Applies to:** ISO/IEC 27001:2022 §4.1 · ISO/IEC 42001:2023 §4.1  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after a material change to architecture, ownership, hosting, AI capabilities, regulatory obligations, or operating model

## 1. Purpose

This document defines the internal and external context relevant to the information security management system and AI management system supporting the WizardGang Architecture Demo.

It establishes the operating conditions that can affect the ability of the system to achieve its information-security and responsible-AI objectives.

This is a management-system record. It does not represent certification under ISO/IEC 27001 or ISO/IEC 42001.

## 2. Organization

For management-system purposes, **WizardGang** is the owner and operator of the public `wizardgang.ai` architecture and demonstration environment covered by this record.

This definition describes operational responsibility for the system and does not assert a separate legal or corporate status.

The primary system covered by this context record is:

- `demo.wizardgang.ai`;
- its public GitHub source repository;
- its Cloudflare runtime and storage resources;
- its build, validation, release, and deployment processes;
- its administrative and operational controls;
- its public APIs and integration boundaries;
- its accessibility and internationalization behavior;
- and its controlled AI/MCP integration.

Other WizardGang projects are outside this context unless specifically incorporated into the management-system scope.

## 3. Purpose of the System

The WizardGang Architecture Demo is a public, executable reference implementation of the WizardGang Systems Architecture.

Its purpose is to demonstrate that a lightweight TypeScript, Cloudflare, and GitHub architecture can support:

- controlled software delivery;
- authentication and authorization;
- structured and object persistence;
- REST, GraphQL, webhook, identity, and MCP integration;
- accessibility and internationalization;
- operational monitoring and graceful degradation;
- security controls;
- AI boundary controls;
- and traceable engineering evidence.

The system is intentionally designed to be understandable, reproducible, auditable, inexpensive to operate, and capable of scaling without requiring a fundamental architecture change.

## 4. Operating Model

GitHub is the authoritative source for:

- application source;
- management and technical documentation;
- engineering history;
- controlled changes;
- pull requests and review;
- automated validation;
- release records;
- version tags;
- and deployment evidence.

Cloudflare provides the primary runtime and public infrastructure boundary through services including Workers, D1, R2, Durable Objects, DNS, CDN, TLS, security, and traffic controls.

Production changes follow a controlled lifecycle:

`requirement → branch → controlled change → pull request → automated validation → review → merge → version tag → release → deployment → verification → operational observation`

Repeatable controls are automated where practical rather than relying on operator memory.

## 5. Information Security Context

The system is publicly reachable and its source code is intentionally public.

This creates a security model in which confidentiality does not depend on source-code secrecy. Security instead depends on explicit trust boundaries, managed credentials, least privilege, authentication, authorization, validation, secure configuration, controlled release processes, monitoring, and failure behavior.

Sensitive information that must remain outside public source and public diagnostic surfaces includes:

- passwords;
- API tokens;
- authentication and authorization material;
- cookies and session secrets;
- signing keys and certificates;
- private infrastructure identifiers where disclosure is unnecessary;
- payment or billing information;
- and other credentials or private account information.

The system therefore treats separation of public implementation from private credentials and configuration as a fundamental security requirement.

## 6. AI Management Context

AI capability is treated as a controlled system integration rather than an unrestricted authority.

The current architecture may expose application capabilities through the Model Context Protocol and related AI interfaces.

AI callers remain subject to the same security, authorization, validation, data-access, logging, and audit boundaries as other application callers.

The current public demonstration is designed around bounded and inspectable AI behavior, including:

- explicitly approved capabilities;
- defined system boundaries;
- intended-use statements;
- authorization constraints;
- invalid-scope rejection;
- unknown-method rejection;
- human control over source, releases, configuration, and administrative state;
- audit evidence;
- and fail-closed behavior.

The system does not grant an AI caller unrestricted administrative or write authority merely because the caller is an AI system.

## 7. Internal Issues

The following internal conditions are relevant to the ISMS and AIMS.

### 7.1 Small operating model

The architecture is intentionally designed to remain understandable and manageable by a small development and operating team.

This provides short decision paths and direct technical ownership but increases the importance of:

- documented procedures;
- automation;
- reproducible controls;
- explicit ownership;
- retained evidence;
- and avoiding controls that depend solely on individual memory.

### 7.2 Git-centered governance

A substantial portion of system governance is implemented through Git and GitHub.

Changes, approvals, validation, releases, corrective actions, and evidence should therefore remain traceable through the repository wherever practical.

Management-system documentation is subject to the same controlled-change expectations as application source.

### 7.3 Public-by-design architecture

The public repository and demonstration are intended to expose implementation and evidence.

Controls must therefore distinguish clearly between information that is intentionally public and information that must remain confidential.

### 7.4 Automation dependency

CI/CD, automated testing, migrations, dependency checks, evidence generation, scheduled health collection, and deployment workflows perform repeatable control functions.

Failure or bypass of these mechanisms can affect assurance and must be visible rather than silently treated as successful.

### 7.5 Continuous development

The architecture is expected to evolve.

Management-system records, risk decisions, control applicability, accessibility results, and AI impact assessments must therefore be reviewed when relevant system changes occur.

## 8. External Issues

The following external conditions can affect the ISMS or AIMS.

### 8.1 Internet exposure

The service is publicly available and can receive normal user traffic, automated traffic, malformed requests, abusive traffic, unauthorized access attempts, vulnerability probing, and requests intended to bypass application boundaries.

Security controls must assume an untrusted public network.

### 8.2 Cloud service dependency

The production architecture depends substantially on Cloudflare services.

Availability, security, geographic operation, service changes, pricing, service limits, and provider incidents can affect the system.

Provider controls do not eliminate WizardGang's responsibility to configure and use those services appropriately.

### 8.3 Source-control and delivery dependency

GitHub provides source control, collaboration, CI/CD, release, and evidence capabilities.

GitHub availability, account security, permission configuration, workflow behavior, and platform changes can affect development and production delivery.

### 8.4 Identity-provider dependency

Where OAuth, SSO, or SAML integrations are enabled, external identity providers become dependencies.

Identity-provider availability, configuration, signing material, token behavior, and account security can affect authentication.

### 8.5 Open-source dependency ecosystem

The application depends on third-party software packages and tools.

Supply-chain compromise, vulnerabilities, abandonment, incompatible releases, licensing changes, and dependency drift can affect system security and operation.

Dependencies must therefore remain version controlled and subject to validation and security review.

### 8.6 Standards evolution

WCAG, ISO/IEC standards, supporting guidance, and related technical practices can change over time.

The compliance register and management-system mappings must be reviewed when relevant standards or interpretations materially change.

### 8.7 Security threat environment

Threat techniques affecting web applications, cloud platforms, software supply chains, credentials, identity systems, APIs, webhooks, AI integrations, and development pipelines continue to evolve.

Security controls and risk assessments must therefore be reviewed rather than treated as permanent.

### 8.8 Accessibility expectations

The service is intended to demonstrate accessibility-oriented engineering.

Accessibility depends on application behavior, browser behavior, assistive technologies, content, operating systems, and implementation changes.

Automated testing alone cannot establish conformance.

### 8.9 AI-related expectations and risk

AI integrations may create risks involving inappropriate permissions, unintended tool use, invalid or malicious input, data exposure, incorrect output, automation bias, insufficient human oversight, unclear system boundaries, and foreseeable misuse.

AI-related changes must therefore remain subject to explicit authorization, testing, monitoring, risk evaluation, and human control.

## 9. Management-System Implications

The internal and external context above establishes the need for controls covering at least:

- information-security risk management;
- AI risk and impact management;
- access control;
- identity and authentication;
- secrets and configuration management;
- secure development;
- change and release management;
- dependency and supplier management;
- vulnerability management;
- logging and monitoring;
- incident response;
- business continuity and recovery;
- accessibility verification;
- AI system boundaries and responsible use;
- documented information;
- auditability;
- corrective action;
- and continual improvement.

Specific controls are selected and justified through the applicable ISO/IEC 27001 and ISO/IEC 42001 Statements of Applicability.

## 10. Context Review

This context must be reviewed:

- at least annually;
- when the management-system scope changes;
- when a major architecture or hosting change occurs;
- when a significant AI capability is introduced or materially changed;
- when a significant supplier or identity provider changes;
- following a material security or AI incident;
- when applicable legal, regulatory, contractual, or standards requirements materially change;
- or when management review determines that the current context no longer reflects actual operation.

Review changes are handled through the normal controlled Git process.

The repository history serves as the change record for this document.

## 11. Evidence

Primary evidence supporting this context includes:

- `docs/ARCHITECTURE-STANDARD.md`;
- `README.md`;
- `SECURITY.md`;
- `docs/OPERATIONS.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/RELEASE.md`;
- `docs/EVIDENCE.md`;
- Git history and pull requests;
- GitHub Actions validation evidence;
- GitHub Releases and annotated tags;
- Cloudflare deployment identity;
- application health and availability observations;
- audit events and public-safe operational logs;
- accessibility verification evidence;
- and AI/MCP boundary evaluations.

## 12. Alignment

This document supports:

- **ISO/IEC 27001:2022 §4.1 — Understanding the organization and its context**
- **ISO/IEC 42001:2023 §4.1 — Understanding the organization and its context**

**Current posture after approval:** Management-system context documented and controlled; certification is not claimed.
