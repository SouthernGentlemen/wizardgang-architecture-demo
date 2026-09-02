# Operational Planning and Control

**Reference:** WG-GOV-010  
**Applies to:** ISO/IEC 27001:2022 §8.1 · ISO/IEC 42001:2023 §8.1  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material scope, architecture, supplier, operational, security, data, or AI-capability change

## 1. Purpose

This document defines how the WizardGang Architecture Demo plans, performs, controls, monitors, and evidences the operational activities needed to satisfy the integrated information-security management system (ISMS) and AI management system (AIMS).

It does not create a second engineering process.

The existing repository, CI, release, deployment, administration, monitoring, and evidence mechanisms remain the primary operating controls. This document explains how those mechanisms implement management-system requirements and when additional assessment or approval is required.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Operating Principle

Management-system requirements must be carried into ordinary work rather than maintained only as policy documents.

The normal operational lifecycle is:

```text
requirement / issue / risk / objective
        ↓
controlled DEMO change
        ↓
branch + implementation
        ↓
automated and manual validation
        ↓
pull-request review
        ↓
merge / approved source state
        ↓
tag + release
        ↓
controlled deployment
        ↓
production verification
        ↓
monitoring / logs / audit evidence
        ↓
risk, objective, audit, review, or corrective-action feedback
```

A control is not treated as operationally effective merely because a document says it should exist. Where a requirement calls for an activity, evidence must come from the actual activity, system behavior, review, test, event, release, or other retained record.

## 3. Operational Inputs

Operational planning considers, as applicable:

- approved management-system scope;
- interested-party requirements;
- information-security and AI policies;
- security and AI risk registers;
- treatment decisions;
- Statements of Applicability;
- AI impact assessments;
- management-system objectives;
- architecture and security requirements;
- accessibility and internationalization requirements;
- supplier and platform dependencies;
- incidents, vulnerabilities, failures, and corrective actions;
- monitoring and usage observations;
- previous releases and operational evidence;
- and planned changes to the system or management system.

These inputs determine what controls, validation, approvals, monitoring, and evidence are required for a particular change or operating activity.

## 4. Existing Operational-Control System

### 4.1 Controlled change

Every controlled repository change uses a permanent `DEMO-###` identifier and the process defined in `docs/CHANGE-MANAGEMENT.md`.

Risk scales the rigor of the record:

- Low-risk changes may use lightweight documentation and validation;
- Medium-risk changes require clear behavior and boundary validation;
- High-risk changes require explicit controls, validation, and rollback considerations.

Management-system change planning adds a second question: whether a change also alters scope, risk, control applicability, suppliers, objectives, data boundaries, AI intended use, AI authority, or other governance assumptions.

When it does, the affected management-system records must be reassessed in the same controlled change or a traceable follow-up change.

### 4.2 Development and validation

Implementation is performed in controlled source with validation appropriate to the change.

The normal validation baseline includes, as applicable:

- locked dependency installation;
- lint and type checking;
- unit and contract tests;
- route/scaffold validation;
- migration validation;
- localization checks;
- security checks;
- dependency audit;
- accessibility checks and manual verification where needed;
- MCP/AI boundary evaluation where AI behavior is affected;
- build validation;
- and evidence generation.

A successful automated check proves only the condition actually tested. Manual, operational, management, or specialist evidence remains necessary where automation cannot establish the requirement.

### 4.3 Review and approval

Pull requests are the normal review and integration boundary.

Review should establish, proportionately to risk:

- the change matches its stated purpose;
- security and authorization invariants are preserved;
- secrets and private infrastructure data remain protected;
- data and migration effects are understood;
- applicable risk treatment is implemented or traceably planned;
- control and SoA implications are addressed;
- user-facing accessibility and error behavior remain appropriate;
- AI boundaries and impact assumptions remain valid when relevant;
- deployment and rollback expectations are reasonable;
- and evidence is sufficient for the type of change.

Merge is the repository approval event for the controlled source/document state. It does not by itself constitute risk acceptance, management review, incident closure, audit completion, or another decision that the management system requires to be explicitly recorded.

## 5. Release and Deployment Control

Production delivery follows the repository release process:

```text
approved source
→ semantic version
→ annotated tag
→ GitHub Release
→ deployment of the tagged state
→ smoke / health verification
→ operational observation
```

Operational expectations include:

- deploy the intended tagged source state rather than an untracked working copy;
- expose version and commit identity through deployment metadata where configured;
- validate migrations before deployment;
- preserve rollback or previous-release reference;
- verify health and critical public behavior after deployment;
- and retain release/deployment evidence sufficient to reconstruct what changed.

The target is traceability from requirement through deployed production state, not merely the existence of a release tag.

## 6. Security Operations

Operational security controls include, as applicable:

- authentication and authorization boundaries;
- least-privilege API, GitHub, Cloudflare, and integration credentials;
- secrets stored outside public source;
- same-origin controls for privileged state changes;
- fail-closed behavior when authorization or required control state cannot be established;
- bounded and redacted diagnostics;
- audit events separated from application diagnostics;
- dependency and vulnerability checking;
- public-safe error responses;
- change and release traceability;
- health and availability monitoring;
- controlled offline/maintenance behavior;
- and recovery or rollback using controlled source and release history.

The security risk register determines where existing controls remain insufficient and require further treatment.

Operational use of an existing control does not automatically close its risk record. Closure or residual-risk acceptance requires the decision and evidence defined by the risk-management process.

## 7. AI Operational Control

The current AIMS operating boundary centers on the public read-only MCP capability.

Operational AI controls include:

- explicit tool inventory and schemas;
- server-side authorization;
- validated namespace/input boundaries;
- bounded data retrieval;
- current read-only/non-destructive authority;
- fail-closed behavior for unsupported or invalid requests;
- client/tool-call evidence;
- AI boundary evaluation;
- human control over source, deployment, administration, policy, and risk acceptance;
- AI risk tracking;
- and the MCP AI impact assessment.

The current impact assessment and risk posture apply only while the material capability assumptions remain true.

The following changes require management-system reassessment before the existing AI operating conclusion is reused:

- addition of write or destructive tools;
- privileged or administrative AI authority;
- deployment or source-control authority;
- access to private or materially new data categories;
- broader namespaces or systems;
- changed intended use;
- material autonomous action;
- changed human-oversight model;
- a new material model/provider/data dependency;
- or a material change in affected parties or foreseeable impact.

AI automation does not replace accountable human decisions where policy, risk acceptance, approval, audit, review, or corrective action require explicit judgment.

## 8. Administration and Privileged Operation

Privileged operational controls are kept separate from public demonstration behavior.

Current controls include:

- authenticated `/admin` access;
- credentials outside source;
- `Cache-Control: no-store` for protected state;
- exact same-origin requirements for state-changing forms;
- digest-based credential comparison in the application boundary;
- D1-backed demo and crawler state;
- audit events for administrative transitions;
- fail-closed behavior when required control state cannot be read;
- public operational routes that remain inspectable during intentional offline periods;
- and separation between public dashboards and working mutation controls.

Production administration should prefer stronger external access controls such as Cloudflare Access while retaining application-side authorization.

Privileged changes remain subject to the same risk, change, evidence, and review expectations as equivalent source changes.

## 9. Monitoring, Health, Logs, and Audit Evidence

The operational evidence model intentionally distinguishes system health, diagnostics, and audit evidence.

### Health and availability

The system records scheduled health observations and distinguishes intentional administrative offline state from unexpected dependency failure.

Health evidence may include:

- Worker/runtime state;
- D1 readiness;
- configured R2 and Durable Object readiness;
- demo-control state;
- observation history;
- response timing;
- and availability calculations.

No SLA is implied unless separately established.

### Diagnostics

`application_logs` provide bounded public-safe operational diagnostics.

They must not expose:

- passwords;
- authorization headers;
- cookies;
- bearer tokens;
- API keys;
- secrets;
- payment data;
- private account identifiers;
- or unbounded raw request bodies.

### Audit evidence

`demo_events`, Git history, pull requests, CI artifacts, tags, releases, and deployment/version metadata provide evidence for controlled events and traceability.

Diagnostics and audit evidence may describe the same occurrence but serve different purposes and are not treated as interchangeable records.

## 10. Availability, Cost, and Graceful Degradation

Operational planning includes behavior under degraded dependencies or resource pressure.

The demo distinguishes:

- normal operation;
- warning state;
- degraded optional behavior;
- intentional offline state;
- and unexpected system/dependency failure.

Critical operational surfaces such as status, health, documentation, logs, and protected administration should remain available where the architecture permits, even when optional demonstration behavior is reduced.

Synthetic cost scenarios are demonstrations, not real billing-control enforcement unless explicitly connected to provider controls in the future.

## 11. Data and Persistence Operations

Operational changes affecting D1, R2, Durable Objects, identity/session data, logs, audit data, or MCP-accessible records must consider:

- authorized readers and writers;
- schema and migration compatibility;
- retention needs;
- public versus private data boundaries;
- integrity and concurrency expectations;
- rollback/recovery effects;
- logging and evidence requirements;
- and whether security or AI risk/impact records require reassessment.

Applied migrations are not edited in place. A new controlled migration is added for subsequent schema changes.

Material changes to AI-accessible data must be evaluated against the AI risk register and impact assessment before the previous AI data-boundary conclusion is reused.

## 12. Supplier and Externally Provided Processes

The system depends materially on external providers including GitHub, Cloudflare, identity providers when configured, package registries/open-source dependencies, and external MCP/AI clients or model providers.

WizardGang does not claim control over provider-internal operations.

Operational control covers the portions that WizardGang can govern, including:

- selection;
- configuration;
- credential scope;
- integration design;
- exposed data;
- permissions;
- dependency versions;
- monitoring;
- fallback or degradation behavior;
- and risk treatment.

Supplier outages or control limitations must not be hidden by fabricated evidence or synthetic success states.

Formal supplier-review and assurance records remain a management-system treatment area and are not considered complete solely because suppliers are documented in architecture material.

## 13. Operational Risk Treatment

Security and AI risk treatment is implemented through controlled engineering, operational, supplier, policy, or management actions.

For a treatment action to be represented as complete, evidence should identify:

- the related risk;
- the treatment or control implemented;
- the controlled change or operating record;
- validation performed;
- resulting residual-risk assessment where relevant;
- and the responsible approval or acceptance decision where required.

A code change may reduce a risk without automatically closing it. Risk records must be updated deliberately.

## 14. Nonconforming or Failed Operation

When expected operational criteria are not met, the response should be proportional to impact.

Possible responses include:

- fail the CI or release;
- block or roll back deployment;
- enter intentional maintenance/offline state;
- disable or degrade an optional capability;
- reject unauthorized or invalid requests;
- open a corrective-action item;
- update a risk or impact assessment;
- initiate incident handling;
- or require management review before further operation.

A failed control must not be silently reclassified as acceptable merely to keep a green status surface.

## 15. Evidence Retention

Operational evidence is retained through the systems appropriate to the evidence type, including:

- Git commits and history;
- pull requests and review discussion;
- CI artifacts;
- version tags and releases;
- deployment metadata;
- D1 audit events;
- bounded application logs;
- scheduled health records;
- usage snapshots;
- risk and treatment records;
- AI evaluation records;
- and management-system documents.

Evidence should be sufficient to support the requirement or decision it claims to demonstrate. Evidence freshness and retention are reviewed through the objectives and management-system review processes.

## 16. Current Operational Evidence and Remaining Work

The project already demonstrates substantial operational-control implementation through controlled Git history, CI, release practices, health, logging, audit evidence, admin boundaries, deployment metadata, and MCP evaluation.

The following areas still require additional recurring or completed records before they should be represented as mature management-system operation:

- formal supplier reviews;
- completed recovery/restore tests;
- completed incident exercises or actual incident records;
- competence and awareness evidence;
- objective measurement history;
- expanded AI evaluation coverage;
- recurring risk-treatment verification;
- internal audit;
- management review;
- and corrective-action effectiveness records where applicable.

These are operational evidence gaps, not reasons to create unsupported records retroactively.

## 17. Supporting Evidence

Primary supporting material includes:

- `docs/OPERATIONS.md`;
- `SECURITY.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE.md`;
- `docs/RELEASE-MANAGEMENT.md`;
- `docs/EVIDENCE.md`;
- `.github/workflows/ci.yml`;
- deployment workflows;
- `docs/governance/RISK-MANAGEMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- `docs/governance/soa/ISO-27001-SOA.md`;
- `docs/governance/soa/ISO-42001-SOA.md`;
- `docs/governance/registers/OBJECTIVES.md`;
- `docs/governance/MANAGEMENT-SYSTEM-CHANGE-PLANNING.md`;
- MCP and governance source;
- operations source and D1 migrations;
- audit/logging source;
- and repository release/deployment evidence.

## 18. Alignment

This document supports:

- **ISO/IEC 27001:2022 §8.1 — Operational planning and control**
- **ISO/IEC 42001:2023 §8.1 — Operational planning and control**

**Current posture after approval:** The repository-native engineering and production lifecycle is formally connected to management-system operational requirements, risk treatment, control decisions, monitoring, and evidence. Recurring operational evidence remains subject to actual execution; certification is not claimed.
