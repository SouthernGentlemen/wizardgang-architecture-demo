# Supplier Register

**Reference:** WG-REG-003  
**Framework:** Integrated ISMS / AIMS  
**Status:** Proposed  
**Owner:** WizardGang  
**Assessment date:** 2026-09-02  
**Review due:** 2026-12-02 for initial operating review, then at least annually and after material supplier change  
**Approval:** Controlled pull request and merge

## 1. Purpose

This register identifies suppliers and externally provided services that materially affect the WizardGang Architecture Demo management-system scope.

It records the current approved boundary, ownership, principal risks, available evidence, limitations, and review expectations. It does not claim that provider-internal controls have been independently audited by WizardGang.

## 2. Approval States

- **Approved** — currently permitted for the defined service and boundary.
- **Conditional** — recognized but not active until configured and reviewed for the actual deployment.
- **Supporting** — used through the controlled dependency process but not treated as a standalone critical service.
- **Suspended** — temporarily not permitted because of an incident, risk, or unresolved change.
- **Retired** — no longer used; historical record retained.

Approval is service-specific. Approval of a supplier does not approve every product, model, feature, permission, or data flow the supplier offers.

## 3. Current Supplier Summary

| ID | Supplier / service | Class | Role | Approval state | Owner | Initial review state |
|---|---|---|---|---|---|---|
| SUP-001 | GitHub | Critical | Source control, pull requests, Actions, release/evidence history | Approved | Change / Release owner | Baseline documented; recurring supplier review pending |
| SUP-002 | Cloudflare | Critical | Runtime, edge, DNS/TLS, Workers, D1, R2, Durable Objects, operational telemetry | Approved | Technical / Operations owner | Baseline documented; recurring supplier review pending |
| SUP-003 | OpenAI Codex | Material AI/MCP | Approved external AI/MCP client/provider family connecting to WizardGang's public MCP server | Approved | AI Governance owner | Approved only for existing bounded MCP interface; periodic review pending |
| SUP-004 | Anthropic Claude | Material AI/MCP | Approved external AI/MCP client/provider family connecting to WizardGang's public MCP server | Approved | AI Governance owner | Approved only for existing bounded MCP interface; periodic review pending |
| SUP-005 | External identity provider | Conditional | OAuth/OIDC/SSO/SAML provider when a scenario is configured | Conditional | Security / Technical owner | Provider-specific review required before activation |
| SUP-006 | npm / open-source package ecosystem | Material | Dependency distribution and third-party application/build components | Supporting | Technical / Security owner | Lockfile/audit controls exist; supplier/ecosystem review remains partial |

**AI/MCP restriction:** `SUP-003` and `SUP-004` are the only approved AI/MCP connection families in the current scope. Any additional AI/MCP provider or client family requires a controlled management-system change before approval.

## 4. SUP-001 — GitHub

**Class:** Critical  
**Approval state:** Approved  
**Role:** Authoritative source repository, branches, pull requests, Actions, tags, releases, and a major portion of management-system evidence.  
**Affected processes:** Development, change control, CI, review, release, documented information, evidence retention, auditability.  
**Credentials/data exposed:** Repository content; GitHub credentials/tokens configured outside source; workflow metadata; release/evidence records.

**WizardGang-controlled responsibilities:**

- repository permissions and collaborator access;
- token scope and storage;
- branch/change/release workflow;
- workflow definitions;
- secrets handling;
- review and merge decisions;
- tag/release conventions;
- backup/export decisions for source/evidence;
- and interpretation of GitHub evidence.

**Provider-controlled responsibilities:**

- GitHub platform infrastructure;
- service availability;
- platform account/authentication mechanisms outside WizardGang configuration;
- hosted repository/Actions service implementation;
- provider security operations;
- and provider service limits/terms.

**Principal risks:**

- source or delivery compromise;
- credential/token compromise;
- dependency on hosted availability;
- loss or unavailability of evidence;
- workflow abuse;
- unverified repository-rule enforcement assumptions.

**Risk references:** Security risk register entries for source/delivery compromise, GitHub dependency, release drift, stale assurance, secrets, and authorization as applicable.

**Existing evidence/controls:**

- controlled `DEMO-###` history;
- pull-request workflow;
- CI validation;
- annotated tags/releases;
- release/deployment documentation;
- restricted live-demo token model documented in `SECURITY.md`;
- Git history as management-system documented-information record.

**Known limitations / unverified items:**

- repository ruleset endpoint previously returned no configured rulesets;
- classic branch-protection enforcement could not be fully verified through the available integration;
- therefore required approval/protection enforcement must not be represented as verified solely from this register.

**Continuity/exit:** Source and records should remain recoverable through retained Git clones/history and release artifacts where maintained. A provider outage may block hosted workflows/reviews/releases until GitHub service returns or a future migration is performed.

**Review triggers:** Permission/token changes, workflow changes, major GitHub outage/security event, repository migration, release-process change, or changed evidence dependency.

---

## 5. SUP-002 — Cloudflare

**Class:** Critical  
**Approval state:** Approved  
**Role:** Production runtime and edge platform, including Workers and configured D1/R2/Durable Object/DNS/TLS/telemetry services.  
**Affected processes:** Hosting, runtime security, persistence, availability, monitoring, degradation, deployment, recovery.  
**Credentials/data exposed:** Deployment/configuration credentials; runtime configuration; application data stored in configured Cloudflare services; sanitized analytics/usage data.

**WizardGang-controlled responsibilities:**

- architecture and service configuration;
- secret and token scope;
- Worker code and bindings;
- D1/R2/DO data model and access logic;
- DNS/runtime configuration within owned account scope;
- health checks and monitoring;
- deployment workflow;
- application authorization and fail-closed behavior;
- recovery planning and testing within available provider capabilities.

**Provider-controlled responsibilities:**

- Cloudflare platform infrastructure and regional service operation;
- underlying managed-service resilience/security;
- provider API/service availability;
- platform limits and billing mechanics;
- provider incident response for platform events.

**Principal risks:**

- platform outage or regional/service degradation;
- account/token compromise;
- misconfiguration;
- storage/data loss or recovery limitations;
- resource exhaustion/cost pressure;
- provider API/telemetry changes.

**Risk references:** Security risk register entries for Cloudflare dependency, secrets, unauthorized administration, data loss/recovery, resource exhaustion, and availability.

**Existing evidence/controls:**

- tagged deployment model;
- separate deployment/analytics credentials where documented;
- health and scheduled availability observations;
- D1 audit/log records;
- admin/offline control;
- usage/degradation evidence;
- sanitized public telemetry;
- `SECURITY.md` and `docs/OPERATIONS.md` controls.

**Known limitations / gaps:**

- completed D1/R2 backup/restore test evidence remains outstanding;
- provider continuity does not create an instant alternate hosting environment;
- some billing/usage data may be unavailable depending on token/API access and is represented honestly when unavailable.

**Continuity/exit:** Controlled source and releases preserve the application state needed for reconstruction, but provider migration would require planned engineering work. Data recovery depends on implemented backup/export/restore mechanisms and must be evidenced separately.

**Review triggers:** Major platform/service change, new Cloudflare service, permission/token expansion, material outage/security event, data-location/retention change, recovery-assumption change, or architecture migration.

---

## 6. SUP-003 — OpenAI Codex

**Class:** Material AI/MCP  
**Approval state:** Approved  
**Role:** One of exactly two approved external AI/MCP client/provider families permitted to connect to the WizardGang public MCP interface.  
**Affected processes:** AI/MCP interoperability, tool invocation, returned public demo data, client metadata/logging, downstream interpretation.  
**Data exposed by WizardGang:** Only data allowed by the public MCP tool and namespace/result boundary. Sensitive/private data is not intended for this interface.

**WizardGang-controlled responsibilities:**

- MCP server implementation;
- tool inventory and schemas;
- authentication/authorization;
- namespace/input validation;
- public-data selection;
- result limits;
- logging/redaction;
- supported intended use;
- risk and impact assessment;
- and whether Codex remains approved to connect.

**Provider/client-controlled responsibilities:**

- model reasoning and generated interpretation;
- prompts and client-side orchestration;
- provider-side storage/processing outside WizardGang's application boundary;
- downstream actions taken outside the WizardGang MCP server;
- client releases and behavior.

**Important boundary:** Recognition of Codex/client metadata is descriptive only and is not an authentication or authorization factor.

**Principal risks:**

- external model/client behavior causing misleading downstream use;
- protocol/client changes;
- indirect instruction interpretation;
- stale/incomplete public data being over-trusted;
- excessive trust in provider/client identity metadata;
- future authority expansion without reassessment.

**Risk references:** AI-RISK-003, AI-RISK-006, AI-RISK-009, AI-RISK-010, AI-RISK-011, AI-RISK-014 and related shared security risks.

**Existing evidence/controls:**

- current read-only public MCP tools;
- server-side authorization and validation;
- bounded namespace and result count;
- unsupported/invalid operation failure behavior;
- tool-call logging;
- MCP impact assessment;
- AI risk register;
- AI policy;
- no provider-specific privileged path.

**Known limitations:** WizardGang does not independently control or assure Codex model reasoning, prompt handling, memory, provider-internal safeguards, or downstream actions outside the MCP server.

**Continuity/exit:** Loss, suspension, or incompatibility of Codex does not authorize a replacement provider automatically. Claude remains the only other currently approved AI/MCP family. The server may remain available for supported clients while provider-specific compatibility is remediated.

**Review triggers:** Material Codex/MCP protocol behavior change, client identity/transport change, new data flow, new tool authority, provider incident affecting the integration, evaluation failure, or change in intended use.

---

## 7. SUP-004 — Anthropic Claude

**Class:** Material AI/MCP  
**Approval state:** Approved  
**Role:** One of exactly two approved external AI/MCP client/provider families permitted to connect to the WizardGang public MCP interface.  
**Affected processes:** AI/MCP interoperability, tool invocation, returned public demo data, client metadata/logging, downstream interpretation.  
**Data exposed by WizardGang:** Only data allowed by the public MCP tool and namespace/result boundary. Sensitive/private data is not intended for this interface.

**WizardGang-controlled responsibilities:**

- MCP server implementation;
- tool inventory and schemas;
- authentication/authorization;
- namespace/input validation;
- public-data selection;
- result limits;
- logging/redaction;
- supported intended use;
- risk and impact assessment;
- and whether Claude remains approved to connect.

**Provider/client-controlled responsibilities:**

- model reasoning and generated interpretation;
- prompts and client-side orchestration;
- provider-side storage/processing outside WizardGang's application boundary;
- downstream actions taken outside the WizardGang MCP server;
- client releases and behavior.

**Important boundary:** Recognition of Claude/Claude Code client metadata is descriptive only and is not an authentication or authorization factor.

**Principal risks:**

- external model/client behavior causing misleading downstream use;
- protocol/client changes;
- indirect instruction interpretation;
- stale/incomplete public data being over-trusted;
- excessive trust in provider/client identity metadata;
- future authority expansion without reassessment.

**Risk references:** AI-RISK-003, AI-RISK-006, AI-RISK-009, AI-RISK-010, AI-RISK-011, AI-RISK-014 and related shared security risks.

**Existing evidence/controls:** Same WizardGang-controlled MCP boundary as Codex: read-only tools, server-side authorization/validation, bounded data, failure behavior, tool logging, risk assessment, impact assessment, and no provider-specific privilege.

**Known limitations:** WizardGang does not independently control or assure Claude model reasoning, prompt handling, memory, provider-internal safeguards, or downstream actions outside the MCP server.

**Continuity/exit:** Loss, suspension, or incompatibility of Claude does not authorize a replacement provider automatically. Codex remains the only other currently approved AI/MCP family.

**Review triggers:** Material Claude/MCP protocol behavior change, client identity/transport change, new data flow, new tool authority, provider incident affecting the integration, evaluation failure, or change in intended use.

---

## 8. SUP-005 — External Identity Provider

**Class:** Conditional  
**Approval state:** Conditional  
**Role:** OAuth/OIDC/SSO/SAML identity provider for demonstrations where configured.  
**Affected processes:** Authentication, federation, session establishment, authorization context.  
**Activation rule:** A specific provider must be identified and reviewed before production reliance; this generic record does not approve an unnamed provider.

**WizardGang-controlled responsibilities:** Redirect/trust configuration, client credentials, signing/trust material, token/assertion validation, session handling, authorization mapping, replay protection, and fail-safe behavior.

**Provider-controlled responsibilities:** Provider identity infrastructure, credential/user lifecycle within provider scope, provider availability, provider authentication controls, and provider-issued assertions/tokens.

**Principal risks:** Provider outage, trust misconfiguration, signing/token validation error, credential exposure, replay/session weakness, or authorization mismatch.

**Existing evidence/controls:** Identity architecture documentation and application-side validation/session controls where implemented.

**Known limitation:** No unnamed identity provider may be represented as approved or reviewed through this generic entry.

**Review triggers:** Provider selection, metadata/certificate/key changes, auth-flow changes, scope/claim changes, incident, or material provider-service change.

---

## 9. SUP-006 — npm / Open-Source Package Ecosystem

**Class:** Material / Supporting  
**Approval state:** Supporting  
**Role:** Distribution of TypeScript/JavaScript dependencies and transitive third-party components used by build/runtime tooling.  
**Affected processes:** Build integrity, dependency security, licensing, runtime behavior, CI.

**WizardGang-controlled responsibilities:** Dependency selection, lockfile use, version updates, audit/remediation decisions, license review where relevant, removal/replacement of unsafe dependencies, and controlled change validation.

**Provider/maintainer-controlled responsibilities:** Package publishing, registry availability, upstream code maintenance, vulnerability disclosure, and package-account security outside WizardGang control.

**Principal risks:** Malicious or compromised package, vulnerable dependency, abandoned dependency, registry outage, dependency confusion, uncontrolled version drift, licensing conflict.

**Existing evidence/controls:** Locked dependencies, CI dependency audit, controlled upgrades, public source review, build validation.

**Known limitations:** A successful dependency audit does not prove all packages are secure, well-maintained, or free of supply-chain risk.

**Continuity/exit:** Lockfile and retained source metadata reduce drift; a compromised/abandoned dependency may require replacement through a controlled change.

**Review triggers:** Critical vulnerability, package compromise, major dependency upgrade, registry/source change, new runtime dependency, or license/maintenance concern.

## 10. AI/MCP Provider Change Rule

The following rule is mandatory for the current AIMS scope:

> **Codex and Claude are the only approved AI/MCP provider/client families that connect to the WizardGang demo.**

Adding another AI/MCP family requires all of the following before it becomes Approved:

1. controlled `DEMO-###` change;
2. supplier-register entry;
3. interested-party update where relevant;
4. security and AI risk review;
5. AI impact-assessment review/update where triggered;
6. ISO 42001 SoA review;
7. protocol/auth/tool/data/logging/misuse evaluation;
8. management approval.

A connection observed from an unapproved client does not itself change the approved supplier boundary and must not create additional privilege.

## 11. Initial Review Conclusion

The current supplier boundary is sufficiently identified to support management-system operation, but **formal recurring supplier-review evidence is still pending**. Approval of this register establishes the initial inventory and allowed boundary; it does not claim that supplier attestations, contracts, security reports, continuity exercises, or annual reviews have all been completed.

The initial operating review due 2026-12-02 should confirm at minimum:

- GitHub and Cloudflare remain necessary and appropriately configured;
- critical credentials remain least-privileged and outside source;
- material incidents/outages since approval are reflected in risk treatment;
- Codex and Claude remain the only approved AI/MCP families;
- no unreviewed AI/MCP provider has been added;
- MCP tool/data/authority assumptions remain valid;
- identity-provider status accurately reflects actual configuration;
- dependency-audit and material package risks are reviewed;
- and any changed supplier assumptions are reflected in risks, SoAs, objectives, impact assessment, or corrective action.

## 12. Supporting Evidence

- `docs/governance/SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`
- `docs/governance/INTERESTED-PARTIES.md`
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`
- `docs/governance/registers/AI-RISK-REGISTER.md`
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`
- `docs/governance/soa/ISO-27001-SOA.md`
- `docs/governance/soa/ISO-42001-SOA.md`
- `SECURITY.md`
- `docs/OPERATIONS.md`
- `docs/IDENTITY.md`
- `.github/workflows/ci.yml`
- MCP source/tests/evaluation evidence
- GitHub release/deployment evidence

**Current posture after approval:** Initial supplier inventory and governance boundary defined; Codex and Claude are the only approved AI/MCP connection families; recurring supplier-review evidence remains to be produced through operation; certification is not claimed.
