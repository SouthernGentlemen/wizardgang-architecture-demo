# Management-System Scope

**Reference:** WG-GOV-003  
**Applies to:** ISO/IEC 27001:2022 §4.3 · ISO/IEC 42001:2023 §4.3  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after a material change to system boundaries, suppliers, hosting, AI capabilities, ownership, or applicable requirements

## 1. Purpose

This document defines the scope of the information security management system (ISMS) and artificial intelligence management system (AIMS) supporting the WizardGang Architecture Demo.

The scope is based on the organizational context, interested parties, system interfaces, external dependencies, and operating model defined by the management-system records in this repository.

This scope is intentionally narrow and demonstrable. It does not represent certification under ISO/IEC 27001 or ISO/IEC 42001.

## 2. Scope Statement

The WizardGang ISMS and AIMS covered by this repository apply to the design, development, validation, release, deployment, operation, monitoring, administration, and governance of the public WizardGang Architecture Demo at `demo.wizardgang.ai`, together with the repository, automation, cloud resources, interfaces, and evidence processes required to operate that system.

The scope includes the controlled AI/MCP capability where it is implemented as part of the Architecture Demo.

The management-system boundary follows the system and processes WizardGang can directly design, configure, authorize, operate, monitor, document, or govern.

## 3. In-Scope Products and Services

The following are in scope:

- the public `demo.wizardgang.ai` application;
- the WizardGang Architecture Demo source repository;
- public and authenticated application routes owned by the demo;
- APIs and integration interfaces implemented by the demo;
- the public accessibility, governance, evidence, and operations surfaces;
- the demo's controlled MCP and other AI-related interfaces;
- administrative controls provided by the demo;
- operational health, availability, logging, audit, and evidence functions implemented by the demo.

## 4. In-Scope Development and Governance Processes

The following processes are in scope:

- requirements and controlled work identification;
- branch and commit management;
- pull-request review;
- automated validation and CI;
- security and dependency checks;
- migration validation;
- accessibility validation and manual verification records;
- AI/MCP evaluation and boundary testing;
- release management;
- semantic versioning and annotated tags;
- GitHub Releases;
- deployment of reviewed release states;
- production verification;
- operational monitoring;
- security-event and audit evidence generation;
- incident, corrective-action, risk, audit, and management-review records established under the management system;
- management-system documented information stored in this repository.

## 5. In-Scope Information and Assets

The scope includes information and assets required to operate or govern the demo, including:

- source code;
- infrastructure and application configuration owned by the demo;
- documentation;
- release records;
- test and validation evidence;
- audit metadata;
- operational health records;
- public-safe application logs;
- security-event records;
- accessibility verification records;
- AI evaluation records;
- D1 data created for demonstration and evidence purposes;
- R2 objects created for demonstration and evidence purposes;
- application sessions and identity metadata processed by the demo;
- managed credentials, secrets, tokens, certificates, and signing material required by the system, even where those values are intentionally stored outside Git.

Secret values are in scope as protected assets even when their storage location is an externally managed secret mechanism.

## 6. In-Scope Technology Boundary

The operational technology boundary includes WizardGang-controlled configuration and use of:

- Cloudflare Workers;
- D1;
- R2;
- Durable Objects;
- Cloudflare DNS and public edge configuration used by the demo;
- GitHub source control;
- GitHub Actions;
- GitHub Releases and tags;
- external identity-provider integrations configured for the demo;
- REST, GraphQL, webhook, OAuth, SSO, SAML, and MCP interfaces implemented by the demo.

Third-party platforms are not treated as wholly owned infrastructure. The scope covers WizardGang's selection, configuration, integration, permissions, credentials, monitoring, and use of those services.

## 7. Information Security Management System Boundary

The ISMS applies to information-security risks that can affect the confidentiality, integrity, availability, authenticity, authorization, traceability, or recoverability of the in-scope system and its information.

This includes risks associated with:

- public internet exposure;
- authentication and authorization;
- secrets and credentials;
- source control and software delivery;
- dependency and software supply chain;
- application and API behavior;
- data persistence;
- logging and monitoring;
- operational availability;
- configuration;
- supplier dependencies;
- incident handling;
- change and release management;
- backup and recovery where applicable;
- administrative access;
- and management-system evidence.

## 8. Artificial Intelligence Management System Boundary

The AIMS applies to AI-related capability that is designed, exposed, integrated, configured, evaluated, or governed as part of the WizardGang Architecture Demo.

The current AIMS boundary includes:

- MCP interfaces exposed by the demo;
- AI-accessible tools or application capabilities exposed through those interfaces;
- permissions and authorization governing AI access;
- intended-use and foreseeable-misuse definitions;
- AI system boundaries;
- AI-related testing and evaluation;
- human oversight and administrative control;
- AI-related audit records;
- fail-closed and fallback behavior;
- AI-related risk assessment and impact assessment;
- changes to AI-facing interfaces or permissions.

The AIMS does not claim control over the internal design, training, model weights, datasets, safety systems, or operation of external general-purpose AI models supplied by third parties unless those elements are explicitly brought into scope in a future revision.

## 9. External Dependencies and Interfaces

The management systems recognize external services that materially affect the scoped system, including:

- Cloudflare;
- GitHub;
- configured identity providers;
- open-source package registries and dependency ecosystems;
- browsers, operating systems, and assistive technologies used to access the public system;
- external AI clients or model providers interacting with defined AI/MCP interfaces.

These dependencies are considered through supplier, risk, access, configuration, monitoring, and continuity controls where applicable.

Their provider-owned internal operations are not automatically considered WizardGang-controlled operations.

## 10. Explicitly Out of Scope

Unless incorporated through a future approved scope change, the following are outside this management-system scope:

- WizardGang portfolio applications or repositories other than the Architecture Demo;
- `wizardgang.ai` content and functionality not required to operate or evidence `demo.wizardgang.ai`;
- unrelated personal, client, development, or experimental systems;
- customer environments not operated as part of the Architecture Demo;
- physical data centers, offices, hardware, networking equipment, personnel, and facilities operated by Cloudflare, GitHub, identity providers, or other suppliers;
- internal development, training, model architecture, model weights, or proprietary datasets of third-party AI providers;
- controls performed exclusively by a supplier where WizardGang has no direct operational authority, except for WizardGang's responsibility to select, configure, review, and govern that supplier relationship;
- legal entities, departments, employees, contractors, or business processes that are not part of operating the scoped demo.

An out-of-scope activity can still create an in-scope supplier, contractual, legal, or security risk.

## 11. Applicability and N/A Decisions

This scope is the primary boundary used when determining control applicability.

A control may be recorded as not applicable only when:

1. the control does not address a relevant risk, requirement, or activity within the approved scope;
2. exclusion does not undermine the ability of the ISMS or AIMS to achieve its intended outcomes;
3. the rationale is explicitly documented in the relevant Statement of Applicability or control register;
4. the decision is reviewed when the scope, architecture, supplier model, risk environment, or intended use changes.

Provider ownership alone is not sufficient reason to ignore a control. Where a provider performs an activity, WizardGang must still consider whether supplier assurance, contractual requirements, configuration, monitoring, or dependency risk remain applicable.

## 12. Scope Changes

A scope review is required when a material change introduces or removes:

- a production application or repository;
- a hosting or cloud provider;
- a material data store;
- an identity provider;
- an administrative boundary;
- a new AI capability;
- AI write or decision authority;
- a significant new class of user or affected party;
- regulated or contractual information;
- a new legal or regulatory obligation;
- a material supplier dependency.

Scope changes are managed through the normal controlled Git process.

## 13. Supporting Records

This scope is supported by:

- `docs/governance/CONTEXT.md`;
- `docs/governance/INTERESTED-PARTIES.md`;
- `docs/ARCHITECTURE-STANDARD.md`;
- `README.md`;
- `SECURITY.md`;
- `docs/OPERATIONS.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/EVIDENCE.md`.

Future risk registers, Statements of Applicability, AI impact assessments, audit records, and management reviews must use this scope unless a newer approved revision supersedes it.

## 14. Alignment

This document supports:

- **ISO/IEC 27001:2022 §4.3 — Determining the scope of the information security management system**
- **ISO/IEC 42001:2023 §4.3 — Determining the scope of the AI management system**

**Current posture after approval:** ISMS and AIMS boundaries defined and controlled; certification is not claimed.
