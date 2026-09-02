# Information Security Risk Register

**Reference:** WG-REG-001  
**Framework:** Information Security  
**Applies to:** ISO/IEC 27001:2022 §6.1.2–§6.1.3  
**Method:** `docs/governance/RISK-MANAGEMENT.md`  
**Status:** Approved
**Owner:** WizardGang  
**Assessment date:** 2026-09-02  
**Review due:** 2026-12-02  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register is the initial information-security risk assessment for the WizardGang Architecture Demo.

It records risks affecting the confidentiality, integrity, availability, authorization, auditability, delivery, recovery, and trustworthy operation of the system defined by `docs/governance/SCOPE.md`.

The register evaluates current architecture and controls as they exist or are evidenced in the repository. It does not treat planned controls as completed controls and does not represent certification under ISO/IEC 27001.

## 2. Rating Method

Risk scoring follows `docs/governance/RISK-MANAGEMENT.md`:

`risk score = likelihood × impact`

| Score | Rating |
|---|---|
| 1–4 | Low |
| 5–9 | Moderate |
| 10–16 | High |
| 17–25 | Critical |

All entries show inherent risk before controls and residual risk after current evidenced controls. Planned treatment does not lower the residual score until implemented and verified.

## 3. Register Summary

| ID | Risk | Inherent | Residual | Treatment | Status |
|---|---|---:|---:|---|---|
| SEC-RISK-001 | Credential or secret exposure | 20 Critical | 10 High | Reduce | Treating |
| SEC-RISK-002 | Unauthorized privileged administration | 20 Critical | 10 High | Reduce | Treating |
| SEC-RISK-003 | Source-control or delivery-pipeline compromise | 20 Critical | 15 High | Reduce | Treating |
| SEC-RISK-004 | Open-source dependency or software supply-chain compromise | 16 High | 12 High | Reduce | Treating |
| SEC-RISK-005 | Forged or replayed webhook requests | 16 High | 8 Moderate | Reduce | Treating |
| SEC-RISK-006 | Sensitive information disclosed through public diagnostics | 16 High | 8 Moderate | Reduce | Treating |
| SEC-RISK-007 | Persistent data loss or corruption without demonstrated recovery | 12 High | 12 High | Reduce | Treating |
| SEC-RISK-008 | Cloudflare service or platform dependency disrupts operation | 12 High | 9 Moderate | Reduce / Share | Open |
| SEC-RISK-009 | GitHub dependency disrupts source, CI/CD, or release operations | 9 Moderate | 9 Moderate | Reduce / Share | Open |
| SEC-RISK-010 | Identity-provider failure or misconfiguration affects authentication | 12 High | 8 Moderate | Reduce / Share | Treating |
| SEC-RISK-011 | Authorization-scope bypass across application interfaces | 20 Critical | 10 High | Reduce | Treating |
| SEC-RISK-012 | Resource exhaustion, abusive traffic, or cost pressure degrades service | 16 High | 9 Moderate | Reduce | Treating |
| SEC-RISK-013 | Security incident response is incomplete or unexercised | 12 High | 12 High | Reduce | Treating |
| SEC-RISK-014 | Release or deployment drift causes unauthorized or untraceable production state | 12 High | 6 Moderate | Reduce | Treating |
| SEC-RISK-015 | Stale or inaccurate assurance evidence causes false security conclusions | 9 Moderate | 9 Moderate | Reduce | Treating |

No risk in this initial register is marked **Accepted**. Acceptance requires the explicit decision and rationale defined by the risk-management methodology.

---

## SEC-RISK-001 — Credential or Secret Exposure

**Framework:** Security  
**Affected asset/process:** Credentials, Cloudflare resources, GitHub integrations, identity integrations, administrative access  
**Source:** Public-source operating model and repository security review  
**Threat/cause:** Secrets are committed to public source, included in diagnostic output, exposed through logs, copied into build artifacts, or handled with excessive permissions.  
**Consequence:** Unauthorized access, administrative compromise, API abuse, source-control compromise, data modification, or broader infrastructure impact.

**Existing controls:**

- public source explicitly excludes credentials and private authentication material;
- production secrets are held in managed GitHub/Cloudflare secret stores;
- local secret placeholders use ignored `.dev.vars`;
- public health, usage, evidence, and source-link surfaces are prohibited from returning secrets;
- public logs are defensively redacted and size-bounded;
- Cloudflare usage uses a dedicated minimum-permission token;
- GitHub demo tokens are scoped to defined repository/workflow capabilities.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 5 — Severe  
**Inherent risk:** 20 — Critical

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 5 — Severe  
**Residual risk:** 10 — High

**Treatment:** Reduce

**Treatment actions:**

1. verify automated secret-detection coverage in CI or repository-native secret scanning;
2. document credential rotation and emergency revocation procedures;
3. verify all current GitHub and Cloudflare tokens against least-privilege expectations;
4. add periodic checks that public diagnostic routes do not expose sensitive fields;
5. review this risk whenever a new provider credential or secret-bearing integration is introduced.

**Control references:** ISO 27001 A.5.15, A.5.16, A.5.17, A.5.18, A.8.2, A.8.3, A.8.9, A.8.12  
**Owner:** Management-system owner / system operator  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `SECURITY.md`, `docs/OPERATIONS.md`, managed secret configuration, CI/repository settings when verified

---

## SEC-RISK-002 — Unauthorized Privileged Administration

**Framework:** Security  
**Affected asset/process:** `/admin`, demo state, crawler-control state, privileged Git lifecycle actions  
**Source:** Privileged application-control boundary  
**Threat/cause:** Administrative credentials are stolen, guessed, replayed, improperly shared, or the privileged surface is reached without sufficient authentication and authorization.  
**Consequence:** Unauthorized changes to demo availability, crawler policy, release actions, or other privileged state; possible loss of integrity or availability.

**Existing controls:**

- `/admin` is authenticated;
- state-changing responses use `Cache-Control: no-store`;
- credential comparisons use fixed-length digests;
- state-changing forms require exact same-origin requests;
- control failures fail closed;
- privileged state transitions are audited;
- Git lifecycle authorization remains server-side and does not forward browser Basic credentials to GitHub;
- production guidance recommends Cloudflare Access in addition to application-side authentication.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 5 — Severe  
**Inherent risk:** 20 — Critical

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 5 — Severe  
**Residual risk:** 10 — High

**Treatment:** Reduce

**Treatment actions:**

1. place the production privileged surface behind a second identity-aware access layer where practical;
2. verify strong authentication and credential-rotation expectations;
3. test lockout/rate-limiting or equivalent abuse controls for repeated authentication attempts;
4. periodically validate audit evidence for privileged state transitions;
5. review privileged access whenever new administrative capabilities are added.

**Control references:** ISO 27001 A.5.15–A.5.18, A.8.2, A.8.3, A.8.5, A.8.15, A.8.16  
**Owner:** System operator  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `SECURITY.md`, `docs/OPERATIONS.md`, admin authentication source, audit event records

---

## SEC-RISK-003 — Source-Control or Delivery-Pipeline Compromise

**Framework:** Security  
**Affected asset/process:** GitHub repository, branches, Actions workflows, tags, releases, production deployment  
**Source:** Git-centered governance and delivery model  
**Threat/cause:** GitHub account compromise, excessive token permissions, malicious workflow modification, bypassed review, unauthorized branch/tag changes, or compromised CI execution.  
**Consequence:** Malicious or unreviewed code reaches production, evidence is falsified, release history loses integrity, or credentials available to CI are abused.

**Existing controls:**

- controlled `DEMO-###` change identity;
- pull-request workflow and automated validation;
- scoped GitHub tokens for demo workflow behavior;
- annotated version tags and GitHub Releases;
- tag-bound production deployment;
- exact version and health verification;
- secrets separated from source;
- repository history retains change evidence.

**Current limitation:** Required branch-protection/approval enforcement has not been fully verified through the available repository evidence and must not be assumed.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 5 — Severe  
**Inherent risk:** 20 — Critical

**Residual likelihood:** 3 — Possible  
**Residual impact:** 5 — Severe  
**Residual risk:** 15 — High

**Treatment:** Reduce

**Treatment actions:**

1. verify and document branch/ruleset enforcement for the production branch;
2. verify required status checks and approval expectations cannot be bypassed unintentionally;
3. review workflow permissions and token scopes periodically;
4. protect release/tag creation and deployment credentials with least privilege;
5. define response steps for suspected source-control or CI credential compromise.

**Control references:** ISO 27001 A.5.18, A.8.2, A.8.4, A.8.25, A.8.29, A.8.31, A.8.32  
**Owner:** Repository/release owner  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`, `docs/RELEASE.md`, `.github/workflows/`, GitHub tags/releases and settings when verified

---

## SEC-RISK-004 — Open-Source Dependency or Software Supply-Chain Compromise

**Framework:** Security  
**Affected asset/process:** npm dependencies, build tools, transitive packages, CI environment  
**Source:** Open-source dependency ecosystem  
**Threat/cause:** Vulnerable, malicious, abandoned, hijacked, or unexpectedly changed dependencies enter the application or build process.  
**Consequence:** Code execution, data exposure, compromised builds, degraded availability, or malicious production behavior.

**Existing controls:**

- dependency versions are locked;
- CI uses locked dependency installation;
- dependency auditing is part of the validation flow;
- source and build behavior are reviewable in Git;
- release state is tied to reviewed tags.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 4 — Major  
**Inherent risk:** 16 — High

**Residual likelihood:** 3 — Possible  
**Residual impact:** 4 — Major  
**Residual risk:** 12 — High

**Treatment:** Reduce

**Treatment actions:**

1. establish a documented vulnerability-remediation expectation by severity;
2. review dependency update automation and alerting coverage;
3. document handling for compromised or abandoned critical dependencies;
4. periodically review direct dependencies and unnecessary packages;
5. retain dependency-audit evidence with relevant releases where material.

**Control references:** ISO 27001 A.5.21, A.8.8, A.8.25, A.8.29  
**Owner:** Development/release owner  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** lockfiles, CI workflow, dependency audit results, release validation records

---

## SEC-RISK-005 — Forged or Replayed Webhook Requests

**Framework:** Security  
**Affected asset/process:** Public webhook receivers and downstream event processing  
**Source:** Public integration boundary  
**Threat/cause:** An attacker fabricates webhook payloads, modifies signed content, replays a valid delivery, or sends events from an unauthorized repository/source.  
**Consequence:** Unauthorized actions, false audit data, corrupted application state, or misleading demonstrations.

**Existing controls:**

- HMAC-SHA256 verification over the exact request body;
- replay protection through delivery-ID rejection;
- GitHub event-type allowlisting;
- configured repository allowlisting;
- signing secrets remain environment-owned;
- only bounded summaries and digests are persisted.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 4 — Major  
**Inherent risk:** 16 — High

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 4 — Major  
**Residual risk:** 8 — Moderate

**Treatment:** Reduce

**Treatment actions:**

1. retain automated positive/negative tests for signature verification and replay rejection;
2. review event allowlists whenever webhook capabilities change;
3. define key-rotation procedure for signing secrets;
4. monitor repeated invalid-signature/replay activity where practical.

**Control references:** ISO 27001 A.5.17, A.8.5, A.8.20, A.8.24, A.8.26, A.8.29  
**Owner:** Integration owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `SECURITY.md`, webhook source/tests, audit/log evidence

---

## SEC-RISK-006 — Sensitive Information Disclosed Through Public Diagnostics

**Framework:** Security  
**Affected asset/process:** `/dashboard/logs`, operations APIs, usage telemetry, health/version/evidence routes  
**Source:** Intentionally public operational visibility  
**Threat/cause:** Raw request data, credentials, account identifiers, private infrastructure metadata, billing data, or unreviewed structured details reach public diagnostic surfaces.  
**Consequence:** Secret exposure, privacy loss, infrastructure reconnaissance, account compromise, or loss of trust.

**Existing controls:**

- public logs are application-generated rather than raw provider logs;
- forbidden sensitive fields are explicitly documented;
- structured details are redacted and size-bounded;
- usage telemetry is normalized and excludes provider/account/payment identifiers;
- health/version responses must not return secrets or private infrastructure metadata;
- logs and audit evidence are separated.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 4 — Major  
**Inherent risk:** 16 — High

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 4 — Major  
**Residual risk:** 8 — Moderate

**Treatment:** Reduce

**Treatment actions:**

1. maintain automated tests using representative secret-like and sensitive field names;
2. review all new diagnostic fields before public exposure;
3. periodically inspect persisted public-safe logs for redaction failures;
4. prohibit raw request-body persistence unless explicitly reviewed and sanitized.

**Control references:** ISO 27001 A.5.12, A.5.34, A.8.11, A.8.12, A.8.15, A.8.16  
**Owner:** Operations/security owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `SECURITY.md`, `docs/OPERATIONS.md`, logging implementation/tests, public diagnostic route review

---

## SEC-RISK-007 — Persistent Data Loss or Corruption Without Demonstrated Recovery

**Framework:** Security  
**Affected asset/process:** D1 records, R2 objects, operational history, audit evidence, demo configuration  
**Source:** Persistence and recovery review  
**Threat/cause:** Accidental deletion, faulty migration, application defect, provider failure, operator error, or corrupted state affects persistent data.  
**Consequence:** Loss of evidence, unavailable demonstrations, incorrect state, inability to reconstruct operations, or extended recovery time.

**Existing controls:**

- schema changes are versioned through migrations;
- releases are traceable and rollback-aware;
- application health and dependency readiness are observable;
- meaningful control changes are auditable;
- source state is preserved in Git.

**Current limitation:** A documented and tested backup/restore process for in-scope persistent data has not yet been evidenced.

**Inherent likelihood:** 3 — Possible  
**Inherent impact:** 4 — Major  
**Inherent risk:** 12 — High

**Residual likelihood:** 3 — Possible  
**Residual impact:** 4 — Major  
**Residual risk:** 12 — High

**Treatment:** Reduce

**Treatment actions:**

1. define backup requirements by data class and store;
2. document D1/R2 recovery options and retention expectations;
3. perform and retain evidence of at least one restore/reconstruction exercise;
4. define recovery objectives appropriate to the demo scope;
5. ensure destructive migrations or admin operations include recovery consideration.

**Control references:** ISO 27001 A.5.29, A.5.30, A.8.13, A.8.14, A.8.32  
**Owner:** Operations/data owner  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** migrations, release records, `docs/OPERATIONS.md`; backup/restore evidence pending

---

## SEC-RISK-008 — Cloudflare Service or Platform Dependency Disrupts Operation

**Framework:** Security  
**Affected asset/process:** Worker runtime, D1, R2, Durable Objects, DNS/CDN, traffic controls  
**Source:** Supplier/platform dependency  
**Threat/cause:** Cloudflare outage, regional/platform failure, API change, quota/service-limit issue, account configuration error, or pricing/service change.  
**Consequence:** Full or partial unavailability, degraded features, delayed recovery, telemetry gaps, or increased operating cost.

**Existing controls:**

- dependency health is observed on a schedule;
- intentional offline and unexpected failure states are distinguished;
- critical operational/status routes are designed to remain available during intentional offline behavior;
- cost/degradation behavior is explicitly modeled;
- architecture and configuration are maintained as code/documented state where practical.

**Inherent likelihood:** 3 — Possible  
**Inherent impact:** 4 — Major  
**Inherent risk:** 12 — High

**Residual likelihood:** 3 — Possible  
**Residual impact:** 3 — Moderate  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce / Share

**Treatment actions:**

1. establish a supplier register and Cloudflare dependency review;
2. document recovery actions for provider outage or account-level failure;
3. identify which components can be reconstructed from repository state and which require provider-side recovery;
4. review limits and service changes that could create availability or cost risk;
5. reassess if the demo becomes subject to an external SLA.

**Control references:** ISO 27001 A.5.19–A.5.23, A.5.29, A.5.30, A.8.14  
**Owner:** Management-system owner / operations owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Open  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `docs/OPERATIONS.md`, architecture standard, Cloudflare configuration and health evidence

---

## SEC-RISK-009 — GitHub Dependency Disrupts Source, CI/CD, or Release Operations

**Framework:** Security  
**Affected asset/process:** Source control, collaboration, CI, release records, deployment initiation, evidence  
**Source:** Supplier/platform dependency  
**Threat/cause:** GitHub outage, account lockout, Actions failure, service/API change, or repository access problem.  
**Consequence:** Development and release operations stop, evidence becomes temporarily inaccessible, urgent fixes are delayed, or deployment processes fail.

**Existing controls:**

- released source state is represented by Git commits/tags;
- deployment and validation processes are documented;
- runtime operation is separated from ordinary repository browsing;
- production health/version endpoints allow deployed-state verification independently of GitHub UI availability.

**Inherent likelihood:** 3 — Possible  
**Inherent impact:** 3 — Moderate  
**Inherent risk:** 9 — Moderate

**Residual likelihood:** 3 — Possible  
**Residual impact:** 3 — Moderate  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce / Share

**Treatment actions:**

1. establish GitHub in the supplier register;
2. document repository recovery/export expectations appropriate to public source;
3. document emergency behavior when GitHub or Actions is unavailable;
4. periodically verify release and source history can be reconstructed from Git objects and retained local/alternate copies where maintained.

**Control references:** ISO 27001 A.5.19–A.5.23, A.5.29, A.5.30  
**Owner:** Repository/release owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Open  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** Git history, release records, CI configuration, architecture standard

---

## SEC-RISK-010 — Identity-Provider Failure or Misconfiguration Affects Authentication

**Framework:** Security  
**Affected asset/process:** OAuth, SSO, SAML, identity sessions, identity-derived API permissions  
**Source:** External identity integration  
**Threat/cause:** Provider outage, signing-key/certificate error, callback/configuration mistake, token-validation defect, account compromise, or incorrect identity mapping.  
**Consequence:** Authentication failure, unauthorized access, incorrect principal mapping, or loss of availability for identity-dependent features.

**Existing controls:**

- identity providers are explicit external dependencies;
- REST identity-derived write tokens are generated only from validated sessions;
- visitor write scope is server-derived rather than caller-selected;
- GraphQL mutations cross the normalized-principal authorization policy;
- application-side authorization remains responsible for access decisions.

**Inherent likelihood:** 3 — Possible  
**Inherent impact:** 4 — Major  
**Inherent risk:** 12 — High

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 4 — Major  
**Residual risk:** 8 — Moderate

**Treatment:** Reduce / Share

**Treatment actions:**

1. document supported providers, trust assumptions, and configuration ownership;
2. retain negative tests for invalid/expired tokens and incorrect claims;
3. define certificate/signing-key rotation and expiry monitoring where applicable;
4. assess authentication behavior during provider outage;
5. include material identity-provider changes in supplier and risk review.

**Control references:** ISO 27001 A.5.16–A.5.18, A.5.19–A.5.23, A.8.5  
**Owner:** Identity/security owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `SECURITY.md`, `docs/IDENTITY.md`, identity source/tests

---

## SEC-RISK-011 — Authorization-Scope Bypass Across Application Interfaces

**Framework:** Security  
**Affected asset/process:** REST, GraphQL, R2 mutations, MCP/read surfaces, identity-derived visitor namespaces  
**Source:** Multiple public API and integration boundaries  
**Threat/cause:** Inconsistent authorization logic, caller-controlled identifiers, permission escalation, missing checks on one protocol, or regression between equivalent interfaces.  
**Consequence:** Unauthorized reads or writes, cross-user data access, integrity loss, privilege escalation, or bypass of intended trust boundaries.

**Existing controls:**

- REST writes require a managed operator bearer token or short-lived identity-derived token;
- identity-derived write scope uses a server-derived visitor namespace;
- caller cannot select another visitor's write namespace;
- REST, GraphQL, and MCP reads share an explicit read boundary;
- authenticated GraphQL mutations use the same normalized-principal policy;
- R2 mutations retain a protected boundary;
- AI/MCP does not receive unrestricted authority by virtue of being AI-driven.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 5 — Severe  
**Inherent risk:** 20 — Critical

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 5 — Severe  
**Residual risk:** 10 — High

**Treatment:** Reduce

**Treatment actions:**

1. maintain cross-protocol authorization contract tests;
2. add explicit negative tests for identifier substitution and namespace crossover;
3. require risk review for any new privileged method, mutation, tool, or write surface;
4. verify protected APIs fail closed when identity or control dependencies are unavailable;
5. map authorization requirements into the Statement of Applicability.

**Control references:** ISO 27001 A.5.15–A.5.18, A.8.2, A.8.3, A.8.5, A.8.26, A.8.29  
**Owner:** Application/security owner  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `SECURITY.md`, API contracts, authorization source/tests, MCP evaluation evidence

---

## SEC-RISK-012 — Resource Exhaustion, Abusive Traffic, or Cost Pressure Degrades Service

**Framework:** Security  
**Affected asset/process:** Public Worker, storage/query resources, availability, operating budget  
**Source:** Public internet exposure and serverless consumption model  
**Threat/cause:** Automated abuse, traffic spikes, expensive requests, repeated writes, provider quotas, or cost growth beyond intended operating limits.  
**Consequence:** Degraded availability, throttling, unexpected cost, delayed operations, or deliberate denial of service.

**Existing controls:**

- Cloudflare edge/runtime provides the public boundary;
- scheduled health/availability observations detect degradation;
- the architecture explicitly models normal/warning/degraded behavior;
- optional behavior can degrade while core operational/status surfaces remain available;
- public endpoints use bounded output where documented.

**Current limitation:** Application-level rate-limiting and abuse-control coverage has not been fully evidenced for all relevant public write and compute surfaces.

**Inherent likelihood:** 4 — Likely  
**Inherent impact:** 4 — Major  
**Inherent risk:** 16 — High

**Residual likelihood:** 3 — Possible  
**Residual impact:** 3 — Moderate  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce

**Treatment actions:**

1. inventory endpoints requiring rate limits, quotas, or abuse controls;
2. define bounded request/payload/query limits for public interfaces;
3. verify Cloudflare traffic/security controls appropriate to the demo exposure;
4. create operational thresholds that trigger investigation before hard limits are reached;
5. retain degradation tests for cost/resource guardrail behavior.

**Control references:** ISO 27001 A.5.29, A.5.30, A.8.6, A.8.14, A.8.16, A.8.20  
**Owner:** Operations/security owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `docs/OPERATIONS.md`, health/usage records, traffic configuration when verified

---

## SEC-RISK-013 — Security Incident Response Is Incomplete or Unexercised

**Framework:** Security  
**Affected asset/process:** Security-event handling, containment, evidence, recovery, communication, improvement  
**Source:** Management-system gap analysis  
**Threat/cause:** A security incident occurs before a complete response procedure, severity model, communication path, evidence-preservation process, and exercise record exist.  
**Consequence:** Slow containment, lost evidence, inconsistent decisions, prolonged impact, incomplete recovery, or failure to learn from the event.

**Existing controls:**

- security-relevant audit and operational logs exist;
- vulnerability reporting guidance exists;
- change/release history supports reconstruction;
- the architecture distinguishes operational logs from audit evidence;
- privileged/admin changes are auditable.

**Current limitation:** A full incident-management procedure and exercised incident record have not yet been established in the management-system layer.

**Inherent likelihood:** 3 — Possible  
**Inherent impact:** 4 — Major  
**Inherent risk:** 12 — High

**Residual likelihood:** 3 — Possible  
**Residual impact:** 4 — Major  
**Residual risk:** 12 — High

**Treatment:** Reduce

**Treatment actions:**

1. create the formal incident-management procedure;
2. define classification, escalation, containment, recovery, communication, evidence, and post-incident review steps;
3. perform a tabletop or simulated incident exercise and retain results;
4. connect corrective actions and lessons learned to controlled changes;
5. define when supplier/provider incidents require reassessment.

**Control references:** ISO 27001 A.5.24–A.5.28, A.6.8, A.8.15, A.8.16  
**Owner:** Management-system owner / security owner  
**Acceptance authority:** Management-system owner  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `SECURITY.md`, `docs/OPERATIONS.md`, `docs/EVIDENCE.md`; formal incident procedure/exercise pending

---

## SEC-RISK-014 — Release or Deployment Drift Causes Unauthorized or Untraceable Production State

**Framework:** Security  
**Affected asset/process:** Production deployment, version identity, release evidence, rollback  
**Source:** Controlled delivery architecture  
**Threat/cause:** Production is deployed from an unreviewed state, mutable branch head, incorrect commit, incomplete release record, or manual change that breaks traceability.  
**Consequence:** Production cannot be tied to reviewed source, defects or malicious changes evade review, rollback becomes uncertain, or evidence becomes unreliable.

**Existing controls:**

- controlled changes use permanent IDs;
- release flow uses branches, PRs, CI, review, merge, semantic annotated tags, GitHub Releases, and tag-only deployment;
- deployments are expected to reproduce exact tagged state;
- `/version` and `/health` support post-deployment verification;
- release records identify rollback targets.

**Inherent likelihood:** 3 — Possible  
**Inherent impact:** 4 — Major  
**Inherent risk:** 12 — High

**Residual likelihood:** 2 — Unlikely  
**Residual impact:** 3 — Moderate  
**Residual risk:** 6 — Moderate

**Treatment:** Reduce

**Treatment actions:**

1. verify deployment workflow cannot silently deploy mutable or untagged source;
2. retain release-to-deployment evidence for each production version;
3. test rollback procedure periodically;
4. investigate any version mismatch as a control failure;
5. include governance artifacts in formal releases when they become effective.

**Control references:** ISO 27001 A.8.25, A.8.29, A.8.31, A.8.32  
**Owner:** Release/operations owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE.md`, `docs/RELEASE-MANAGEMENT.md`, tags/releases, deployment/version evidence

---

## SEC-RISK-015 — Stale or Inaccurate Assurance Evidence Causes False Security Conclusions

**Framework:** Security  
**Affected asset/process:** Compliance register, management-system records, public evidence routes, audits/reviews  
**Source:** Public assurance and evidence model  
**Threat/cause:** Documentation or control mappings remain marked current after architecture changes, tests lapse, evidence links break, or implementation status is overstated.  
**Consequence:** Reviewers or operators make incorrect security decisions, gaps are hidden, management review is misleading, or public assurance claims exceed actual evidence.

**Existing controls:**

- management-system records are controlled in Git;
- traceability links requirements to source, validation, release, deployment, and operation;
- public claims use aligned/uncertified language;
- the planned compliance registry distinguishes Met, Partial, Gap, and N/A;
- N/A requires rationale;
- CI already validates repository history and controlled change identity.

**Current limitation:** Formal last-verified/staleness enforcement across the complete compliance registry is still planned work.

**Inherent likelihood:** 3 — Possible  
**Inherent impact:** 3 — Moderate  
**Inherent risk:** 9 — Moderate

**Residual likelihood:** 3 — Possible  
**Residual impact:** 3 — Moderate  
**Residual risk:** 9 — Moderate

**Treatment:** Reduce

**Treatment actions:**

1. require `lastVerified` and evidence ownership in the exhaustive compliance register;
2. define and enforce staleness rules for evidence-bearing rows;
3. validate internal evidence links and identifiers in CI;
4. review affected governance/risk/control records after material architecture changes;
5. use internal audit and management review to challenge unsupported assurance claims.

**Control references:** ISO 27001 A.5.1, A.5.35, A.5.36, A.5.37, A.8.15  
**Owner:** Management-system owner  
**Acceptance authority:** Risk owner with documented rationale for Moderate residual risk  
**Status:** Treating  
**Last reviewed:** 2026-09-02  
**Review due:** 2026-12-02  
**Evidence:** `docs/EVIDENCE.md`, governance records, compliance registry when implemented, CI evidence

---

## 4. Initial Treatment Priorities

The register establishes the following initial priority order based on residual risk and control maturity.

### Priority 1 — High residual risk

- `SEC-RISK-001` — secret/credential exposure;
- `SEC-RISK-002` — privileged administration;
- `SEC-RISK-003` — source-control/delivery compromise;
- `SEC-RISK-004` — dependency/supply-chain compromise;
- `SEC-RISK-007` — backup/recovery gap;
- `SEC-RISK-011` — authorization-scope bypass;
- `SEC-RISK-013` — incident-response maturity.

These require treatment or explicit management-system owner acceptance before they can be considered complete management-system risk decisions.

### Priority 2 — Moderate residual risk

- webhook authenticity/replay;
- public diagnostic disclosure;
- Cloudflare/GitHub dependency;
- identity-provider dependency;
- resource exhaustion/cost pressure;
- release/deployment drift;
- evidence staleness.

These remain active and require documented treatment or explicit acceptance rationale.

## 5. Treatment Tracking

Treatment work should be implemented through the normal repository lifecycle and linked back to the risk ID.

Where a treatment changes code, infrastructure, policy, configuration, or operating procedure, the related issue/PR/commit should reference the applicable `SEC-RISK-###` identifier.

A risk remains **Treating** until the action is implemented, evidence exists, residual risk is reconsidered, and any required acceptance decision is recorded.

## 6. Review Triggers

In addition to the review date above, this register must be reviewed after material changes involving:

- authentication or authorization;
- secrets or credentials;
- GitHub or Cloudflare configuration;
- persistence or recovery;
- public logs or diagnostics;
- new APIs, webhooks, write methods, or integration surfaces;
- dependency or vulnerability findings;
- security incidents or near misses;
- supplier/platform changes;
- release/deployment controls;
- management-system scope;
- or internal-audit/management-review findings.

## 7. Approval and Risk Acceptance

Merging this document approves the **risk assessment record and treatment direction**. It does not automatically accept the residual risk of every entry.

Individual residual-risk acceptance must be explicit in the applicable record or a linked decision and must identify:

- accepting authority;
- acceptance date;
- residual rating;
- rationale;
- review due date;
- and any conditions that trigger reconsideration.

## 8. Alignment

This register supports:

- **ISO/IEC 27001:2022 §6.1.2 — Information security risk assessment**
- **ISO/IEC 27001:2022 §6.1.3 — Information security risk treatment**

The associated Statement of Applicability will use this register, interested-party requirements, policy requirements, and other justified needs to determine control applicability.
