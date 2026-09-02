# Interested Parties and Their Requirements

**Reference:** WG-GOV-002  
**Applies to:** ISO/IEC 27001:2022 §4.2 · ISO/IEC 42001:2023 §4.2  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after a material change to scope, suppliers, legal or contractual obligations, architecture, AI capabilities, or operating model

## 1. Purpose

This document identifies the interested parties relevant to the WizardGang Architecture Demo information security management system (ISMS) and AI management system (AIMS), the requirements that matter to those systems, and how those requirements are addressed or tracked.

This register is scoped to the management-system boundary defined for `demo.wizardgang.ai` and its supporting GitHub and Cloudflare delivery and operating environment.

It is not a certification statement and does not create legal conclusions beyond documented system obligations and operating commitments.

## 2. Requirement Categories

Relevant requirements are grouped as:

- **Operational** — needed to run, support, recover, and maintain the system;
- **Security** — confidentiality, integrity, availability, authentication, authorization, logging, vulnerability, incident, and supply-chain expectations;
- **AI governance** — intended use, bounded authority, human oversight, transparency, testing, monitoring, and misuse considerations;
- **Accessibility** — WCAG-oriented usability and assistive-technology expectations;
- **Privacy and data handling** — minimization, protection, retention, disclosure, and appropriate use of information;
- **Contractual or provider** — terms and technical constraints imposed by suppliers or integration providers;
- **Standards and assurance** — commitments created by the project's published alignment posture and evidence model.

## 3. Interested-Party Register

| Interested party | Why relevant | Requirements relevant to the ISMS/AIMS | Management-system response |
|---|---|---|---|
| WizardGang owner/operator | Accountable for system design, operation, security, AI boundaries, releases, and public claims | Clear ownership; controlled changes; secure credentials; recoverable releases; risk decisions; retained evidence; accurate public claims; review of security and AI impacts | Git-centered change/release process, governance records, risk registers, SoAs, management review, corrective action, operational monitoring |
| Public users and visitors | Interact directly with the public demonstration and APIs | Reasonable availability; safe failure behavior; protection from cross-user data exposure; accessible interaction; understandable behavior; no unnecessary collection or disclosure of sensitive information | Visitor-scoped state, authorization boundaries, fail-closed controls, accessibility testing, health monitoring, sanitized logs, bounded demo data |
| Users of accessibility demonstrations | Rely on the site to demonstrate accessibility-oriented engineering | Keyboard operability; semantics; focus behavior; contrast; reflow; accessible authentication; honest distinction between automated testing and manual verification | WCAG checklist, accessibility lab, manual verification records, evidence links, no certification overclaim |
| AI/MCP users and operators | May invoke or inspect AI-exposed application capabilities | Defined intended use; explicit tool boundaries; least privilege; authentication/authorization; invalid-scope rejection; logging; human control over privileged changes; foreseeable-misuse consideration | MCP boundary controls, AI evaluations, AI risk and impact assessment, AI SoA, audit events, fail-closed behavior |
| Prospective clients, employers, reviewers, and technical evaluators | Use the demo as evidence of architecture and engineering capability | Accurate representation of implemented capabilities; traceable evidence; no fabricated certification or operational claims; reproducible source/release relationship | Public source links, release/tag identity, evidence chain, compliance checklist, explicit `aligned — uncertified` posture |
| Security researchers and reporters | May identify vulnerabilities in public source or deployed behavior | Clear vulnerability-reporting path; no requirement to expose sensitive details publicly; timely triage and corrective action | `SECURITY.md`, controlled security changes, issue/PR/release evidence where disclosure is appropriate |
| GitHub | Provides source control, pull requests, Actions, release, and evidence services | Account and token security; repository permissions; workflow limits and service terms; resilient operation when GitHub evidence is unavailable | Scoped credentials, CI/CD controls, immutable tags/releases, supplier risk treatment, honest `unverifiable` states when evidence cannot be retrieved |
| Cloudflare | Provides runtime, edge, D1, R2, Durable Objects, DNS, TLS, and platform controls | Correct configuration; credential protection; service limits; platform terms; availability dependency; provider security responsibilities; recoverable deployment | Managed secrets, configuration validation, health checks, tagged deployment, provider-risk tracking, graceful degradation and recovery procedures |
| External identity providers | Support OAuth, OIDC, SSO, or SAML scenarios when configured | Correct redirect and trust configuration; signing/token validation; replay protection; provider availability; protection of client credentials and signing material | Explicit identity boundaries, managed credentials, replay protections, session controls, supplier/integration review |
| Open-source maintainers and package ecosystems | Supply third-party dependencies and build/runtime components | License observance; dependency integrity; vulnerability awareness; controlled upgrades; avoidance of unreviewed dependency drift | Lockfile, dependency audit, CI validation, controlled dependency changes, vulnerability treatment |
| Standards bodies and published standards | Define the external frameworks the project publicly references | Accurate version/reference use; no unsupported certification claim; review when relevant standards materially change | Standards register, compliance checklist, controlled mappings, periodic review of applicability and evidence |
| Independent assessors or auditors, if engaged | May evaluate evidence or alignment in the future | Traceable records; defined scope; controlled documented information; objective evidence; identifiable gaps and N/A rationales | Git history, PR review, releases, audit records, SoAs, risk registers, management review records, evidence registry |
| Legal, regulatory, and contractual authorities where applicable | May impose obligations depending on actual data, users, jurisdictions, or agreements | Applicable law, regulation, contract, intellectual-property, privacy, security, accessibility, and record obligations must be identified when they attach to the scoped system | Obligations register and risk review; requirements are not assumed applicable without an identified basis |

## 4. WizardGang Requirements

As system owner and operator, WizardGang requires the scoped system to:

- remain understandable and maintainable by a small team;
- keep source, documentation, changes, releases, and evidence traceable through Git where practical;
- keep secrets and credentials outside public source;
- use least privilege and explicit authorization boundaries;
- automate repeatable validation and deployment controls where practical;
- fail visibly and safely when a dependency or control is unavailable;
- retain enough evidence to reconstruct meaningful production changes and operational events;
- keep published accessibility, security, and AI-assurance claims accurate;
- distinguish alignment evidence from independent certification;
- and support corrective action and continual improvement when gaps are identified.

## 5. User and Visitor Requirements

Relevant user and visitor requirements include:

- public pages and ordinary demo behavior should not require privileged credentials;
- authenticated or visitor-scoped data must not leak across authorization boundaries;
- sensitive credentials and private account metadata must not appear in public logs or source;
- user-visible failures should be understandable and should not expose sensitive internals;
- accessibility-oriented behavior should be testable and documented;
- the demo should degrade safely when external dependencies are unavailable;
- and public claims should accurately describe what has and has not been demonstrated.

These requirements feed security, availability, accessibility, privacy, logging, testing, and communication controls.

## 6. AI-Related Requirements

Interested parties interacting with AI or MCP capabilities require that:

- AI functionality has a defined purpose and system boundary;
- only approved capabilities are exposed;
- ordinary authentication and authorization rules still apply;
- malformed, unknown, or unauthorized operations are rejected;
- AI callers do not obtain unrestricted administrative authority;
- relevant AI-system events can be reconstructed;
- meaningful limitations and foreseeable misuse are considered;
- human operators retain control over source, configuration, privileged administration, and releases;
- and AI-related changes are reviewed through the same controlled lifecycle as other system changes.

These requirements feed the AI risk register, AI impact assessments, ISO/IEC 42001 Statement of Applicability, evaluation tests, and management review.

## 7. Supplier and Integration Requirements

GitHub, Cloudflare, identity providers, and other external dependencies create requirements that cannot be satisfied exclusively through application code.

The management system must therefore consider:

- provider availability and service limits;
- provider account and credential security;
- configuration ownership;
- dependency on provider security controls;
- contractual or service-term changes that materially affect the system;
- migration, recovery, or fallback considerations where appropriate;
- and the distinction between provider-controlled infrastructure and WizardGang-controlled configuration and application behavior.

Supplier use does not automatically make a corresponding ISO control `Met`. Provider responsibilities and WizardGang responsibilities must remain distinguishable in the Statements of Applicability and risk treatment records.

## 8. Legal, Regulatory, and Contractual Requirements

The public architecture demo does not assume that every possible legal, regulatory, industry, accessibility, privacy, or contractual regime applies to its current scope.

Where a requirement becomes applicable because of:

- collected or processed information;
- user location;
- customer or employment contract;
- integration agreement;
- software or content license;
- regulatory classification;
- accessibility obligation;
- or another identified basis,

that requirement must be recorded, evaluated, and connected to the relevant risk, control, procedure, or evidence.

Unverified legal obligations must not be represented as established requirements merely to populate the register.

## 9. Standards and Assurance Requirements

WizardGang publicly references WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 as engineering and governance frameworks.

That published posture creates an internal requirement to:

- use the identified standards consistently;
- maintain an explicit checklist or control register;
- identify `Met`, `Partial`, `Gap`, and `N/A` status honestly;
- provide rationale for exclusions or N/A decisions;
- distinguish automated evidence from manual or management evidence;
- preserve traceability to source, validation, releases, deployment, and operations where relevant;
- review stale evidence;
- and avoid `certified` or equivalent claims unless independent certification is actually obtained and evidenced.

## 10. Determining Which Requirements Enter the Management System

A requirement from an interested party is treated as relevant when it can materially affect:

- confidentiality, integrity, or availability;
- achievement of security objectives;
- achievement of responsible-AI objectives;
- AI intended use or foreseeable misuse;
- legal, regulatory, contractual, or provider obligations;
- accessibility or user protection;
- supplier dependency;
- continuity or recovery;
- evidence integrity;
- or the accuracy of public assurance claims.

Relevant requirements are addressed through one or more of:

- policy;
- risk assessment and treatment;
- Statement of Applicability;
- technical control;
- operating procedure;
- supplier treatment;
- AI impact assessment;
- objective or metric;
- testing or monitoring;
- audit;
- management review;
- or corrective action.

## 11. Review and Change

This register must be reviewed:

- at least annually;
- when management-system scope changes;
- when a new material supplier or integration is introduced;
- when a significant AI capability is introduced or materially changed;
- when a new category of user or data is introduced;
- when a material legal, regulatory, contractual, or accessibility obligation is identified;
- following a material incident;
- or when management review identifies a changed interested-party requirement.

Changes are controlled through the repository's normal `DEMO-###` Git process.

## 12. Evidence

Supporting evidence includes:

- `docs/governance/CONTEXT.md`;
- `docs/ARCHITECTURE-STANDARD.md`;
- `README.md`;
- `SECURITY.md`;
- `docs/IDENTITY.md`;
- `docs/ACCESSIBILITY.md`;
- `docs/OPERATIONS.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/EVIDENCE.md`;
- GitHub repository, pull-request, Actions, tag, and release history;
- Cloudflare deployment and operational evidence;
- accessibility verification evidence;
- and AI/MCP evaluation evidence.

## 13. Alignment

This document supports:

- **ISO/IEC 27001:2022 §4.2 — Understanding the needs and expectations of interested parties**
- **ISO/IEC 42001:2023 §4.2 — Understanding the needs and expectations of interested parties**

**Current posture after approval:** Relevant interested parties and management-system requirements identified and subject to controlled review; certification is not claimed.
