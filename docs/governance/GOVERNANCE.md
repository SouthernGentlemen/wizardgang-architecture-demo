# Management-System Governance

**Reference:** WG-GOV-001
**Applies to:** ISO/IEC 27001:2022 as amended by ISO/IEC 27001:2022/Amd 1:2024 · ISO/IEC 42001:2023
**Status:** Approved
**Owner:** WizardGang
**Approval:** Controlled pull request and merge
**Review:** At least annually and after material changes to scope, context, ownership, architecture, suppliers, obligations, security risk, or AI capability

## 1. Purpose and authority

This document defines the current integrated management-system governance for the WizardGang Architecture Demo. It replaces separate clause-by-clause governance documents with one operating model for context, interested parties, scope, leadership, roles, support, planning, operation, management review, corrective action, and continual improvement.

Structured assurance records remain authoritative for current requirement status, rationale, evidence relationships, risks, objectives, incidents, and other machine-owned state. This document explains how the management system operates; it does not reproduce the structured compliance inventory or claim certification.

## 2. Standards basis and claim boundary

The information-security management-system baseline is **ISO/IEC 27001:2022 together with ISO/IEC 27001:2022/Amd 1:2024, Climate action changes**. ISO identifies the 2024 amendment as applicable to ISO/IEC 27001:2022. The project therefore includes climate relevance in its context and interested-party review without reproducing ISO's copyrighted requirements text.

The AI management-system baseline is **ISO/IEC 42001:2023**, the currently published ISO/IEC AI management-system standard.

Official references:

- ISO/IEC 27001:2022: `https://www.iso.org/standard/27001`
- ISO/IEC 27001:2022/Amd 1:2024: `https://www.iso.org/standard/88435.html`
- ISO/IEC 42001:2023: `https://www.iso.org/standard/42001`

These standards are used as engineering and governance references. WizardGang does **not** claim ISO/IEC 27001 or ISO/IEC 42001 certification.

## 3. Context and operating model

For this management-system scope, WizardGang is the owner and operator of the public `demo.wizardgang.ai` architecture demonstration and its supporting delivery and operating environment. The management-system boundary includes the public application, its GitHub repository and delivery process, Cloudflare runtime and storage services, administration and operations, public interfaces, accessibility and localization behavior, and the controlled AI/MCP capability.

The operating context is intentionally:

- **public by design** — source and most assurance material are public, while credentials, private account data, and other restricted information remain outside public source and diagnostics;
- **small-operator** — one person may hold several roles, making explicit ownership, automation, retained evidence, and truthful independence claims especially important;
- **Git-centered** — repository-controlled source, contracts, governance, review, validation, release identity, and change history are managed through Git and GitHub;
- **cloud-dependent** — Cloudflare is the primary runtime boundary and GitHub is the primary source/delivery boundary;
- **internet exposed** — the service assumes untrusted traffic, malformed requests, abuse, vulnerability probing, and attempts to cross authorization boundaries;
- **continuously changing** — architecture, dependencies, evidence, risks, AI capability, and requirements are reassessed when material changes occur.

Relevant external conditions include cloud and source-control provider availability, identity-provider behavior, open-source supply-chain risk, changing security threats, applicable legal or contractual obligations, accessibility expectations, AI-specific risks, and standards evolution.

### 3.1 Climate-change relevance

The ISO/IEC 27001:2022/Amd 1:2024 climate amendment is part of the current ISMS baseline.

For the present serverless public-demo scope, climate change is relevant to context review but no separate climate-specific information-security risk or objective has been identified beyond already managed dependencies involving provider availability, geographic operation, resource availability, cost, continuity, supplier obligations, and service resilience.

This determination must be reconsidered when infrastructure, suppliers, legal or contractual obligations, interested-party requirements, operating geography, continuity assumptions, or management-review inputs materially change. A climate-related requirement that becomes relevant is handled through the same obligation, risk, objective, supplier, and change processes as any other applicable requirement.

## 4. Interested parties and requirements

Interested parties are identified because their requirements can affect the ISMS or AIMS, not because every stakeholder request automatically becomes a management-system requirement.

Relevant parties include:

- WizardGang management and operators;
- public users and visitors;
- AI/MCP users and affected parties;
- security researchers and vulnerability reporters;
- GitHub, Cloudflare, identity providers, and other approved suppliers;
- open-source maintainers and dependency ecosystems;
- clients, reviewers, and technical evaluators relying on public claims;
- applicable legal, regulatory, contractual, and intellectual-property authorities;
- standards bodies and assurance stakeholders;
- independent assessors or specialist reviewers if engaged.

Requirements may concern security, privacy, availability, accessibility, data handling, AI intended use and oversight, supplier obligations, release integrity, evidence, legal or contractual commitments, or accurate public representations.

A requirement enters the management system when it is applicable to the defined scope and can affect intended management-system results, a stated commitment, a risk decision, an obligation, or a control. The structured obligations register is authoritative for obligations that require durable tracking.

### 4.1 Climate-related interested-party requirements

Climate-related needs are considered when reviewing relevant interested parties and obligations. No distinct climate-specific interested-party requirement is currently recorded for the scoped service. That conclusion is not permanent and must be reassessed when a supplier, contract, law, operating location, customer requirement, or other relevant party introduces such a requirement.

## 5. Scope

The integrated management-system scope is the WizardGang Architecture Demo at `demo.wizardgang.ai` and the processes and resources required to develop, release, deploy, operate, secure, monitor, recover, and govern it.

In scope are:

- the public Worker application and registered interfaces;
- GitHub source control, pull requests, Actions, tags, Releases, and repository settings relevant to the application;
- Cloudflare Workers, D1, R2, Durable Objects, DNS, edge configuration, and production bindings used by the demo;
- authentication, authorization, secrets, configuration, data, logging, monitoring, recovery, continuity, supplier, and incident processes;
- security and accessibility engineering that supports published claims;
- the public read-only AI/MCP capability and the application controls governing its tools, permissions, data, logging, testing, suppliers, and change.

Other WizardGang projects, provider-internal systems, general-purpose model internals, and systems not incorporated into this boundary are outside scope. External dependencies remain subject to supplier, interface, and risk treatment when they can affect the in-scope system.

### 5.1 AI management-system boundary

WizardGang governs the AI capability it configures and exposes: intended use, application permissions, data boundaries, MCP tools, provider selection, logging, tests, change control, human oversight, and incident response.

WizardGang does not represent provider reasoning, training, memory, internal prompt handling, or provider-operated model controls as WizardGang-operated controls. The current public MCP capability is read-only and may not gain write, destructive, privileged, deployment, private-data, autonomous, or additional-provider authority without a controlled reassessment.

### 5.2 Explicit exclusions and applicability

An out-of-scope component is not automatically irrelevant. If it can affect an in-scope objective, control, obligation, supplier boundary, data flow, or risk, the interface remains subject to management-system treatment.

Control applicability and any not-applicable rationale are maintained in the structured ISO/IEC 27001 and ISO/IEC 42001 compliance records rather than duplicated here.

## 6. Management-system model

The management system is integrated into the engineering lifecycle rather than operated as a parallel paperwork process.

The current lifecycle is:

`requirement or finding → risk/impact review when required → controlled change → validation → review → merge → release → deployment → verification → operation → evidence → evaluation → improvement`

Repository authority follows `AGENTS.md`: executable source and contracts define behavior; structured assurance records define current assurance state; generated artifacts are projections; concise current-state Markdown explains intent and controls; dated records provide operating evidence; Git and GitHub retain superseded states and historical delivery evidence.

Management-system documentation must describe the current system. Historical implementation narration, old change IDs, prior pull requests, merge SHAs, staged rollout notes, and obsolete worklists belong in Git/GitHub history or dated evidence, not current governance prose.

## 7. Leadership and accountability

Management is accountable for keeping the ISMS and AIMS appropriate to the real system and its risks. Leadership responsibilities include:

- approving scope, policies, objectives, material risk acceptance, Statements of Applicability, and material exceptions;
- integrating security and AI governance into ordinary engineering and operations;
- providing sufficient time, tooling, platform capability, evidence storage, review capability, and specialist support where needed;
- ensuring responsibilities and decision rights are understood;
- requiring failed controls, stale evidence, incidents, findings, or missed objectives to receive proportionate treatment;
- preserving accurate public claims and the uncertified alignment boundary;
- reviewing management-system performance and authorizing improvement.

Automation may enforce controls or summarize evidence, but it does not replace accountable judgment for risk acceptance, policy exceptions, scope changes, management review, or closure of material nonconformities.

## 8. Roles, authorities, and independence

One person may perform multiple roles, but responsibilities remain explicit:

- **Management-System Owner** — accountable for the integrated ISMS/AIMS, scope, policies, objectives, review, and management decisions.
- **Technical System Owner** — accountable for architecture and technical integrity.
- **Information Security Owner** — accountable for security risk, security controls, vulnerability and incident interfaces.
- **AI Governance Owner** — accountable for AI intended use, boundaries, AI risk/impact, evaluation, supplier and change requirements.
- **Change and Release Authority** — accountable for controlled changes and production release authorization.
- **Operations Owner** — accountable for monitoring, availability, administration, recovery, and operating evidence.
- **Risk Owner** — accountable for an assigned risk, treatment, review, and residual-risk decision within delegated authority.
- **Supplier Owner** — accountable for supplier approval, access, monitoring, reassessment, and exit.
- **Incident/Corrective-Action Owner** — accountable for containment, investigation, action, effectiveness verification, and closure.
- **Evidence/Document Custodian** — accountable for controlled documented information and evidence integrity.
- **Accessibility Verification Owner** — accountable for truthful accessibility verification evidence and boundaries.
- **Auditor or Independent Reviewer** — accountable for the defined audit/review scope when sufficient objectivity exists.
- **Management Reviewer** — accountable for explicit management-review decisions and actions.

Where the same person would audit their own decisions or work, the activity is labeled self-assessment unless a credible independence safeguard is used. Independence must not be overstated.

## 9. Policies, objectives, and planning

The current policy authorities are:

- `docs/governance/SECURITY-GOVERNANCE.md`
- `docs/governance/AI-GOVERNANCE.md`

Management-system objectives are maintained as structured records under `assurance/objectives/`. Objectives must be measurable or otherwise evaluable, have an owner and review basis, and be reconsidered when context, risk, obligations, performance, or management priorities change.

Planning considers risks and opportunities, applicable requirements, resources, dependencies, implementation responsibilities, evaluation methods, and the evidence required to determine whether the intended result was achieved.

## 10. Resources, competence, awareness, communication, and documented information

The management system relies on proportionate resources including engineering/review time, GitHub and Cloudflare capabilities, security and dependency tooling, automated validation, logging and evidence storage, accessibility verification, AI evaluation, and external specialist support when the required competence or independence is not available internally.

People performing management-system work must have competence appropriate to their responsibilities. Competence gaps are recorded and treated through training, narrower authority, assistance, external expertise, or other proportionate action. Structured competence and awareness records under `assurance/governance/` are the durable operating records.

Awareness includes relevant policies, assigned responsibilities, security and AI boundaries, incident/concern reporting, consequences of control bypass, and the requirement that evidence and public claims reflect actual behavior.

Internal and external communication must identify what is communicated, why, when, by whom, to whom, and through which channel when those details matter. Security reports use `SECURITY.md`; AI/MCP concerns follow the documented incident/concern path; supplier and incident communications follow their respective operating documents.

Documented information is controlled through Git and structured assurance sources. Creation and update must preserve identity, reviewability, integrity, access restrictions where required, and clear authority. Public and restricted records are separated according to their data and security needs. External standards and provider documentation are referenced rather than copied when licensing or copyright limits reproduction.

## 11. Management-system change planning

Ordinary engineering change control remains governed by `docs/CHANGE-MANAGEMENT.md`. A management-system review is additionally required when a change can materially affect:

- scope, context, interested parties, obligations, or policy;
- security or AI risk;
- data classification, retention, access, or privacy;
- architecture, trust boundaries, identity, secrets, or privileged administration;
- suppliers or externally provided processes;
- AI intended use, provider, authority, tools, data, affected parties, or human oversight;
- objectives, measurements, audit assumptions, continuity, or recovery;
- the applicability or implementation basis of an ISO control.

The review is proportionate to the change. Routine changes may require only the normal controlled record; material changes require explicit updates to the affected structured and human authorities. Emergency changes remain controlled and are reviewed after stabilization when advance review was not practical.

## 12. Operational planning and control

Operational controls are implemented through the existing engineering and operating system rather than duplicate governance workflows. Applicable mechanisms include:

- controlled branches, pull requests, review, CI, migrations, release tags, GitHub Releases, and exact-version deployment;
- secure engineering, dependency and vulnerability management;
- identity, access, secrets, configuration, cryptography, and data controls;
- supplier approval and external-service management;
- monitoring, logs, audit evidence, availability observation, cost/degradation handling, continuity, backup, and recovery;
- incident response and corrective action;
- AI/MCP boundary enforcement, evaluation, logging, supplier controls, and fail-closed behavior.

Nonconforming or failed operation must be made visible, contained where needed, and handled through incident, risk, corrective-action, or change processes according to significance.

## 13. Management review

The Management-System Owner performs a full management review at least annually and considers an out-of-cycle review after material events.

Review inputs include, where applicable:

- previous review actions;
- context, interested-party, scope, obligation, architecture, and standards changes;
- policy suitability and objective performance;
- security and AI risks, treatments, AI impact assessment, and Statements of Applicability;
- monitoring/evaluation results, incidents, vulnerabilities, supplier performance, recovery/continuity evidence, and accessibility evidence;
- audit or self-assessment findings;
- nonconformities, corrective actions, evidence freshness, competence/resource needs, and improvement opportunities.

Review outputs record decisions and actions concerning changes, priorities, resources, objectives, risks, controls, policies, scope, suppliers, corrective action, and improvement. A management review is an accountable decision record; automation may provide inputs but cannot perform the management judgment itself.

## 14. Nonconformity, corrective action, and continual improvement

A nonconformity is handled according to significance and may originate from incidents, failed controls, audits, tests, monitoring, stale evidence, missed objectives, supplier failures, complaints, accessibility findings, AI evaluations, or management review.

The response is:

1. correct or contain the immediate condition where necessary;
2. determine whether a broader or recurring cause exists;
3. assess related risks, impacts, controls, and obligations;
4. define and assign corrective action;
5. implement through controlled change or operation;
6. verify effectiveness using evidence appropriate to the failure;
7. update risks, policies, controls, objectives, procedures, or structured records when required;
8. close only when the defined closure criteria are met.

Continual improvement uses the same evidence sources plus opportunities identified through engineering, operations, users, suppliers, reviews, and changes in requirements. Improvement does not mean converting incomplete evidence into a favorable status; gaps remain visible until supported by actual implementation and evidence.

## 15. Current governance authorities

The primary current-state governance set is deliberately small:

- this document — integrated management-system governance;
- `docs/governance/RISK-MANAGEMENT.md` — risk methodology, treatment, acceptance, and operational reassessment;
- `docs/governance/ASSURANCE-AND-AUDIT.md` — monitoring, evaluation, audit, self-assessment, and assurance evidence rules;
- the information-security and AI policies;
- distinct operating/control documents for assets/access, suppliers, incidents, recovery, continuity, data, obligations, configuration, cryptography/secrets, vulnerabilities, and secure engineering;
- structured records under `assurance/**`.

`docs/governance/REFERENCE-REGISTRY.json` assigns stable document/register identities only. It is not a second clause map or assurance-state authority.

## 16. Review and maintenance

Review this governance model at least annually and when a material event changes its assumptions. Changes use the normal controlled-change process. Superseded text is recovered from Git rather than retained as historical narration in this document.

## Alignment

This document provides the current management-system governance basis for the in-scope ISO/IEC 27001 and ISO/IEC 42001 clauses and related governance controls. Exact requirement status, applicability, rationale, and documentation relationships are maintained in the structured compliance records.
