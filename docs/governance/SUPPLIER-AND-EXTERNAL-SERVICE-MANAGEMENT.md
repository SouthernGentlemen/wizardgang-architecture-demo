# Supplier and External-Service Management

**Reference:** WG-GOV-016  
**Applies to:** ISO/IEC 27001:2022 supplier/security and operational-control requirements · ISO/IEC 42001:2023 third-party, customer, and AI-supply-chain requirements  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after a material supplier, service, identity, dependency, AI/MCP, data, architecture, or contractual change

## 1. Purpose

This document defines how the WizardGang Architecture Demo identifies, approves, configures, monitors, changes, and retires suppliers and externally provided services that can materially affect the scoped information security management system (ISMS) or AI management system (AIMS).

The goal is not to pretend WizardGang controls supplier-internal systems. The goal is to make the boundary explicit: WizardGang governs provider selection, configuration, credentials, permissions, exposed data, integration behavior, fallback, monitoring, and the decision to continue using the service.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification or independent supplier assurance.

## 2. Supplier Boundary

A supplier or external service enters this process when failure, compromise, misuse, contractual change, or capability change could materially affect:

- source integrity or delivery;
- production availability or recoverability;
- authentication or authorization;
- secrets or credentials;
- stored or transmitted data;
- logging, audit, or evidence integrity;
- dependency integrity;
- accessibility or public-service behavior;
- AI/MCP authority, data exposure, intended use, or downstream behavior;
- or the accuracy of public assurance claims.

The authoritative supplier inventory is `docs/governance/registers/SUPPLIER-REGISTER.md`.

## 3. Current Approved AI/MCP Boundary

The current WizardGang Architecture Demo approves only the following AI/MCP client/provider families for connection to the public MCP demonstration boundary:

1. **OpenAI Codex**
2. **Anthropic Claude**

No other AI/MCP provider or client family is approved as part of the current managed integration boundary.

The approval is deliberately narrow:

- Codex and Claude may connect only through the same server-side MCP authorization, validation, tool, namespace, data, and logging controls that govern the public MCP interface;
- provider or client identity must not create additional application privilege;
- recognized client metadata or user-agent classification is informational and is not an authentication mechanism;
- WizardGang does not control the external model's reasoning, prompts, memory, orchestration, or downstream actions;
- the current public MCP tool boundary remains read-only and non-destructive unless a future controlled change explicitly expands it;
- no provider is implicitly authorized to administer WizardGang, modify source, deploy releases, change configuration, access private data, or accept risk;
- and provider-specific behavior is not treated as proof that the WizardGang MCP server is safe for every external agent.

Adding another AI/MCP provider or client family is a **material management-system change**. It requires, before the existing AI operating conclusion is reused:

- a controlled `DEMO-###` change;
- update of the supplier register and interested-party record;
- security and AI risk review;
- review of AI-RISK-010, AI-RISK-011, and any newly applicable risks;
- AI impact-assessment review and update where triggered;
- ISO/IEC 42001 Statement-of-Applicability review;
- evaluation of authentication, protocol, tool, data, logging, failure, and misuse behavior;
- and explicit management approval of the new supplier/integration boundary.

## 4. Supplier Classification

Suppliers are classified by the consequence of their failure or compromise within WizardGang's scope.

| Class | Meaning | Default review expectation |
|---|---|---|
| Critical | Loss or compromise can materially prevent release/operation, expose or corrupt important data, or undermine major security/AI controls | Initial review + at least annual review + material-change review |
| Material | Important integration or dependency with meaningful security, AI, data, or operational effect, but with bounded impact or practical workaround | Initial review + annual/material-change review |
| Supporting | Lower-impact external dependency whose failure is recoverable and does not undermine a key control | Review through dependency/change process; escalate if risk changes |
| Conditional | Defined integration class that is not active until configured | Review before activation and after material change |

Classification is risk-based. A supplier is not downgraded merely because its internal controls are undocumented.

## 5. Minimum Supplier Record

Each material supplier record should identify:

- permanent supplier ID;
- provider/service name;
- supplier class;
- service role;
- systems or processes affected;
- data or credentials exposed to the service;
- WizardGang-controlled responsibilities;
- provider-controlled responsibilities;
- principal security, availability, AI, privacy, continuity, and supply-chain risks;
- relevant risk-register references;
- applicable control/SoA references;
- owner;
- current approval/use state;
- available assurance/evidence;
- known limitations or unverified assumptions;
- fallback, recovery, or exit consideration;
- last review date;
- next review date;
- and material-change triggers.

An empty evidence field does not become a positive assurance result. Unknown supplier-control evidence remains unknown.

## 6. Initial Review and Approval

Before a new Critical or Material supplier is relied on, WizardGang should evaluate proportionately:

- business/technical need;
- service and trust boundary;
- data and credential access;
- permissions and least privilege;
- authentication and administrative controls;
- security and incident implications;
- availability and dependency concentration;
- backup, export, recovery, or migration implications;
- logging and evidence availability;
- change/version behavior;
- applicable service terms or contractual constraints;
- AI intended use, authority, data handling, oversight, and downstream behavior where applicable;
- and credible alternatives or failure behavior.

Approval must identify the service actually being approved. A broad vendor relationship does not automatically approve every product, model, integration, permission, or data flow offered by that vendor.

## 7. Configuration and Least Privilege

WizardGang-controlled supplier configuration must follow least privilege.

Examples include:

- GitHub tokens scoped to the minimum repository/workflow capability needed;
- Cloudflare credentials separated by deployment, analytics, and other duties where practical;
- identity-provider client credentials and signing material kept outside public source;
- dependency versions locked and updated through controlled changes;
- MCP callers restricted by the server's authorization and tool boundaries rather than provider identity;
- and external AI clients receiving no hidden privileged path unavailable to equivalent authorized callers.

Secrets, API tokens, private keys, passwords, signing material, and provider credentials must not be committed to public source or emitted into public evidence surfaces.

## 8. Data and AI-Specific Supplier Controls

Where a supplier touches AI/MCP behavior or AI-accessible data, review must consider:

- what data crosses the boundary;
- whether the data is public, private, synthetic, stale, or provenance-limited;
- what the external agent/model can request or receive;
- whether the provider can initiate actions or only consume results;
- how user/client identity is represented;
- whether provider/client metadata is trusted or merely descriptive;
- foreseeable misuse or indirect-instruction behavior;
- logging and retention implications;
- protocol/version compatibility;
- provider/service changes that could alter effective behavior;
- and whether the existing AI impact assessment still describes the system accurately.

For the current MCP implementation, Codex and Claude are external consumers of a WizardGang-controlled read-only interface. Their model behavior remains outside WizardGang's direct control; the WizardGang responsibility is the server-side boundary and the claims made about it.

## 9. Monitoring and Periodic Review

Critical and Material suppliers are reviewed using evidence appropriate to the service. Review may consider:

- operational incidents or outages;
- security notices and material vulnerabilities;
- credential or permission changes;
- configuration drift;
- service/API/protocol changes;
- material terms or service-limit changes;
- dependency-version changes;
- observed availability or integration failures;
- changes to data handling or AI capability;
- failed tests/evaluations;
- recovery or migration concerns;
- and whether the supplier remains necessary and proportionate.

Supplier review should update the supplier register and related risk records when conditions change.

## 10. Supplier Incidents and Failures

A supplier incident or material failure may require:

- containment or credential rotation;
- temporary disablement or degraded operation;
- failover, rollback, export, or reconstruction from controlled source;
- security or AI incident handling;
- risk reassessment;
- AI impact reassessment;
- corrective action;
- management review;
- or replacement/exit.

Provider unavailability must not be hidden with fabricated telemetry or synthetic success.

## 11. Change Control

Material supplier changes use the normal controlled Git process.

Changes that require explicit supplier review include:

- new Critical or Material supplier;
- new product/service from an existing supplier that changes the trust boundary;
- materially broader permissions;
- new private or sensitive data exposure;
- new authentication/identity dependency;
- major platform/runtime migration;
- new package source or dependency mechanism;
- material service/API/protocol change;
- new AI/MCP provider or client family beyond Codex and Claude;
- changed AI intended use, tool authority, data access, model/provider dependency, or human-oversight assumptions;
- and supplier incidents that invalidate prior assumptions.

The change must update affected risks, SoAs, impact assessments, objectives, monitoring, or recovery records where applicable.

## 12. Exit and Continuity

For Critical suppliers, WizardGang should understand the practical consequences of service loss and the available exit or recovery path.

Current continuity principles include:

- source and management-system records remain reconstructable through Git history where retained;
- tagged releases identify deployable source state;
- Cloudflare service loss may require provider restoration or a future migration rather than an instantaneous alternate runtime;
- external identity-provider scenarios should fail safely when the provider is unavailable;
- dependency versions are locked to reduce uncontrolled package drift;
- loss of Codex or Claude connectivity does not authorize another AI/MCP provider automatically;
- and the public demo should degrade honestly when required dependencies are unavailable.

A documented limitation is preferable to an unsupported continuity claim.

## 13. Evidence and Assurance

Supplier evidence may include:

- configuration and architecture records;
- scoped credential documentation;
- contracts or service terms where actually reviewed;
- provider security/assurance material where available and relevant;
- status/outage records;
- dependency audit results;
- integration tests;
- MCP protocol/evaluation evidence;
- risk and impact assessments;
- release/deployment history;
- incidents and corrective actions;
- and periodic supplier-review records.

Provider certifications or attestations, if later relied upon, remain provider evidence. They do not certify WizardGang's own management system.

## 14. Current Supplier Posture

The initial supplier register identifies GitHub and Cloudflare as Critical platform dependencies; OpenAI Codex and Anthropic Claude as the only approved AI/MCP connection families; identity providers as Conditional until configured; and package/dependency ecosystems as Material supporting dependencies.

Formal recurring supplier-review evidence is not considered complete merely because this process and register are approved. The first periodic review must produce an actual dated review record or register update based on observed evidence.

## 15. Supporting Records

- `docs/governance/registers/SUPPLIER-REGISTER.md`
- `docs/governance/INTERESTED-PARTIES.md`
- `docs/governance/RISK-MANAGEMENT.md`
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`
- `docs/governance/registers/AI-RISK-REGISTER.md`
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`
- `docs/governance/soa/ISO-27001-SOA.md`
- `docs/governance/soa/ISO-42001-SOA.md`
- `docs/governance/OPERATIONAL-PLANNING-CONTROL.md`
- `docs/governance/MONITORING-MEASUREMENT-EVALUATION.md`
- `SECURITY.md`
- `docs/OPERATIONS.md`
- `docs/IDENTITY.md`
- `docs/CHANGE-MANAGEMENT.md`

## 16. Alignment

This process supports the supplier, externally provided process, supply-chain, third-party AI, and operational-control requirements relevant to the scoped ISO/IEC 27001:2022 ISMS and ISO/IEC 42001:2023 AIMS.

**Current posture after approval:** Supplier governance process defined and the approved external-service boundary identified. Actual periodic supplier reviews and supplier-specific assurance remain operating evidence; certification is not claimed.
