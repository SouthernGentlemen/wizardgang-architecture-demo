# Data Governance, Classification, Retention, and Deletion

**Reference:** WG-GOV-020  
**Applies to:** ISO/IEC 27001:2022 information classification, handling, retention, deletion, logging, backup/recovery, and supplier controls · ISO/IEC 42001:2023 data, record, transparency, supplier, AI-impact, and operational-control requirements  
**Status:** Approved
**Owner:** Management-System Owner / Data Owner  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually and after material schema, storage, logging, supplier, identity, AI/MCP, retention, recovery, or public-data changes

## 1. Purpose

This procedure defines how the WizardGang Architecture Demo identifies, classifies, stores, exposes, retains, deletes, restores, and reviews data within the scoped information security management system (ISMS) and AI management system (AIMS).

The goal is to keep the public-by-design architecture simple without treating every value in D1, R2, logs, identity state, or management-system evidence as public merely because the source repository is public.

The procedure also defines the data boundary for the public MCP capability. The current MCP server is intended to expose bounded public demonstration records only; it is not a general-purpose path into D1, identity records, logs, audit records, administrative state, or R2 content.

Approval of this procedure establishes the governance model. It does **not** prove that every retention rule is already automated, that every deletion path has been tested, that every D1/R2 data set has completed backup/restore evidence, or that the system processes no personal information.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Core Principles

Data governance follows these rules:

1. **Public source does not make runtime data public.** Repository visibility and runtime data classification are separate decisions.
2. **Collect only what the demo needs.** The demo is not intended to become a repository for sensitive business, customer, employee, health, financial, credential, or private personal data.
3. **Treat user-entered identifying fields conservatively.** A field such as `email` may become personal information if a visitor enters real data, even when the feature is only a demonstration.
4. **AI access is explicit, not inherited.** A field is not approved for MCP because it exists in D1 or is visible to another application path.
5. **Synthetic data is labeled by context.** Synthetic or example data can still be misleading if freshness, provenance, or intended use is unclear.
6. **Secrets are outside public data stores and evidence.** Credentials, private keys, authorization headers, cookies, bearer tokens, signing secrets, passwords, and equivalent authentication material must not be stored in public source, public logs, public MCP results, or public assurance evidence.
7. **Retention has a reason.** Data is retained because it supports application state, evidence, security, recovery, investigation, measurement, or another identified need—not simply because storage is available.
8. **Deletion is a control.** Expiration fields, cascade rules, or planned cleanup jobs are not treated as effective deletion evidence until behavior is implemented and verified.
9. **Evidence may need longer retention than telemetry.** Audit, release, incident, risk, and corrective-action evidence may remain useful after ordinary operational logs have lost value.
10. **Recovery does not weaken classification.** Restored data retains the same or stronger access, exposure, and handling requirements.
11. **Unknown is visible.** If provenance, retention, cleanup, sensitivity, or supplier behavior is unverified, the record remains Partial/Gap rather than being assumed safe.

## 3. Data Classification Model

The following classes are used for in-scope data.

| Class | Meaning | Typical handling |
|---|---|---|
| **PUBLIC** | Intentionally publishable information whose disclosure is part of the demo purpose | May be exposed through approved public routes/APIs; still must be accurate, bounded, and free of secrets |
| **PUBLIC-DEMO** | Public demonstration or synthetic/example content that may be incomplete, stale, simplified, or non-authoritative | May be publicly exposed with intended-use/provenance/freshness limitations |
| **VISITOR-SCOPED** | Session- or visitor-specific demonstration data, potentially including user-entered identifying information | Isolate by session/principal; do not expose through global public/MCP paths; expire/delete when no longer needed |
| **OPERATIONAL** | Health, usage, diagnostic, performance, or service-state information | Expose only sanitized/bounded views; retain proportionately to troubleshooting/measurement need |
| **AUDIT-EVIDENCE** | Events and records retained to reconstruct significant control, change, incident, release, or governance activity | Protect integrity; minimize sensitive content; retain long enough to support review and traceability |
| **AUTH-SECURITY** | Authentication/session state, replay-prevention material, encrypted identity payloads, security tokens or token-derived records | Restricted; short-lived where practical; never expose publicly; deletion/expiry must be verifiable |
| **CONFIDENTIAL** | Information not intended for public disclosure, including sensitive provider/configuration data or private evidence | Least privilege; do not place into public evidence; encrypt/protect where stored |
| **SECRET** | Credentials, signing material, private keys, passwords, API tokens, bearer/session secrets, webhook secrets | Managed secret stores only; never stored in repository, public D1/R2 content, logs, issue templates, or public evidence |

A data set may also carry qualifiers such as:

- **synthetic**;
- **user-entered**;
- **provider-derived**;
- **generated**;
- **encrypted-at-application-layer**;
- **reconstructable**;
- **non-reconstructable**;
- **AI-accessible**;
- **public-safe after sanitization**.

Classification is based on actual content and use, not table name alone.

## 4. Data Ownership

The **Management-System Owner** is accountable for the overall classification model.

The **Data Owner** for a specific data surface is responsible for:

- defining intended use;
- assigning or reviewing classification;
- identifying data source/provenance;
- defining public or AI exposure;
- identifying retention/deletion expectations;
- ensuring security and authorization controls are appropriate;
- identifying backup/recovery need;
- reviewing schema or supplier changes;
- and escalating uncertainty or material data risk.

Functional ownership follows `docs/governance/ROLES-RESPONSIBILITIES.md`.

## 5. Authoritative Data Inventory

The current inventory is maintained at:

`docs/governance/registers/DATA-REGISTER.md`

Each material data record should identify:

- permanent data ID;
- table/store/surface;
- purpose;
- classification;
- source/provenance;
- user-entered or generated status;
- intended audience;
- public exposure;
- AI/MCP exposure;
- principal sensitive fields;
- authorization/isolation boundary;
- retention basis;
- deletion/expiry mechanism;
- backup/recovery expectation;
- owner;
- evidence;
- known gaps;
- review trigger;
- and current evidence status.

## 6. Public and Public-Demo Data

Public data may be exposed only through a deliberate application surface.

For public demonstration data:

- intended use should be understandable;
- synthetic/example status should be clear where relevant;
- stale data must not be represented as current merely because it remains queryable;
- unsupported assurance claims must not be embedded into data payloads;
- secrets, private account identifiers, payment data, credentials, and unreviewed provider metadata must be excluded;
- public records must not become an indirect path to visitor-scoped or identity data;
- and material changes to returned fields require exposure review.

The public nature of one namespace does not imply that every syntactically valid namespace is appropriate for AI or anonymous access.

## 7. Visitor-Scoped Demonstration Data

The interactive demo contains session-scoped structures including `demo_sessions`, `demo_users`, `demo_tasks`, and `demo_state`.

`demo_users` includes a `name` and `email` field. Those fields are treated as **VISITOR-SCOPED / potentially identifying** because a visitor could enter real information even if sample data is expected.

Requirements:

- visitors should not be encouraged to enter real sensitive information;
- session isolation must prevent one visitor from accessing another visitor's data;
- visitor-scoped records must not be returned by the public MCP `list_demo_records` tool;
- session-linked deletion/expiration behavior should be verified rather than inferred solely from schema design;
- records should be deleted or expired when their demo purpose ends, subject to any narrow evidence/security need;
- and logs must not copy full user-entered content unless specifically justified and sanitized.

Foreign-key cascade definitions are useful design evidence, but they do not prove that expired parent sessions are actually cleaned up on schedule.

## 8. Authentication and Identity Data

Authentication and identity records are **AUTH-SECURITY** and are never approved for public or MCP exposure.

Current D1 structures include:

- `identity_sessions` with a SHA-256 session identifier, encrypted payload, creation/expiry, and optional revocation timestamp;
- `identity_saml_requests` for request/replay state;
- `identity_saml_assertions` for assertion replay/validation state.

Requirements:

- identity/session payloads remain restricted to server-side authorized use;
- ciphertext must not be treated as public merely because it is encrypted;
- expiration and revocation must be enforced by application logic;
- expired/revoked records should be removed on a defined cleanup path where operationally appropriate;
- raw identity assertions, tokens, cookies, credentials, and signing material must not be persisted into public logs/evidence;
- identity-provider changes require supplier and data-flow review;
- and recovery/testing must preserve authentication boundaries without exposing secret material.

A timestamp column named `expires_at` is not by itself proof of deletion or invalidation effectiveness.

## 9. Operational Data and Public Diagnostics

Operational data includes:

- service health checks;
- usage snapshots;
- Cloudflare usage snapshots;
- application logs;
- demo control/crawler control state;
- bounded webhook summaries/receipts;
- and other runtime measurements.

Operational records should contain the minimum detail necessary to support:

- troubleshooting;
- availability and degradation analysis;
- incident investigation;
- cost/resource evidence;
- security monitoring;
- and management-system measurement.

Public diagnostic surfaces must remain sanitized and bounded.

`application_logs` are not a raw request-body store. They must not contain:

- passwords;
- authorization headers;
- cookies;
- API keys;
- bearer tokens;
- secret values;
- private identity payloads;
- payment data;
- unreviewed full request/response bodies;
- or unrestricted user-entered content.

Retention should be based on troubleshooting/measurement value and storage/risk. No universal legal retention period is invented by this procedure.

## 10. Audit and Evidence Data

`demo_events`, release records, Git history, risk registers, SoAs, incident records, audit/self-assessment records, management review, corrective actions, and similar material are **AUDIT-EVIDENCE**.

Audit/evidence data should:

- preserve enough context to reconstruct the relevant event or decision;
- identify timestamp and event/change context where applicable;
- avoid storing credentials or unnecessary sensitive content;
- use hashes/digests or bounded summaries where those satisfy the evidence need;
- preserve integrity and version history;
- remain accessible to authorized review;
- and distinguish observed fact from conclusion or approval.

Evidence retention may exceed ordinary log retention because historical traceability is a management-system control.

Deletion of evidence must consider whether the record is still needed for:

- incident investigation;
- risk acceptance/treatment;
- release traceability;
- audit;
- management review;
- corrective-action verification;
- public assurance substantiation;
- or another identified obligation.

## 11. R2 Data

R2 object data is classified by object set and content, not by bucket alone.

For each material R2 object set, the owner should determine:

- whether it is public, visitor-scoped, operational, confidential, or another class;
- whether objects are reconstructable;
- whether metadata contains user/session identifiers;
- expected object lifetime;
- deletion/expiry mechanism;
- backup/copy/export requirement;
- and whether the objects may be surfaced to AI/MCP clients.

`r2_object_metadata` records object key, type, size, updater and timestamps and may also include session association/display/expiry metadata after later migrations.

R2 objects are **not** approved for MCP exposure by default.

The backup/restore expectations in `docs/governance/BACKUP-RECOVERY-RESTORE.md` remain applicable.

## 12. Webhook Data

Webhook handling stores bounded receipt/event information such as event type, delivery identifier, digest, timestamp, selected provider/repository/actor metadata, and sanitized summary data.

Requirements:

- exact raw request bodies are used for signature verification when required but are not automatically retained;
- retained data should prefer payload digests and bounded summaries;
- signing secrets are **SECRET** and never persisted with webhook records;
- replay identifiers are retained only as long as needed to enforce replay protection and evidence requirements;
- provider metadata must be reviewed before becoming public diagnostic content;
- and a webhook schema change that begins retaining materially broader payload content requires data/security review.

## 13. AI/MCP Data Boundary

The current MCP data boundary is intentionally narrow.

The public MCP server currently exposes:

- `ping`, which returns server/transport/timestamp information; and
- `list_demo_records`, which reads `demo_records` by validated namespace, orders results by key, limits the query to 100 rows, and returns only `id`, `namespace`, `key`, and `valueJson`.

For current approved operation:

- MCP-accessible data must be **PUBLIC** or **PUBLIC-DEMO**;
- `demo_records` content intended for MCP must be reviewed for public disclosure;
- visitor-scoped, identity, authentication, admin, logs, audit records, supplier-private material, and confidential R2 objects are not approved AI data sources;
- sensitive-field exclusion must be tested rather than assumed;
- returned text is untrusted data and must not be represented as system instruction;
- provenance/freshness/limitations should be documented for AI-accessible data surfaces;
- client metadata such as `codex` or `claude-code` remains descriptive, not an authorization factor;
- and the approved AI/MCP supplier boundary remains **OpenAI Codex and Anthropic Claude only**.

A schema or code change that causes MCP to access a new table, store, namespace class, field category, or private/visitor data is a **material AI/data change**.

Before release it requires, as applicable:

- data-register update;
- security-risk review;
- AI-risk review;
- AI impact-assessment review;
- supplier review;
- ISO/IEC 42001 SoA review;
- authorization review;
- sensitive-field exclusion tests;
- provenance/freshness documentation;
- evaluation updates;
- and management approval.

## 14. Data Provenance and Freshness

Where the meaning of data depends on its origin or age, the system should preserve enough context to answer:

- where the data came from;
- whether it is generated, synthetic, user-entered, repository-derived, provider-derived, or operator-entered;
- when it was created/captured/updated;
- whether it is expected to be current;
- what transformation or sanitization occurred;
- and what limitations affect interpretation.

For AI-accessible data, provenance and freshness are especially important because an external model may present returned content more confidently than the source warrants.

A stale record is not automatically a security incident, but stale or misleading evidence may trigger `AI-RISK-006`, `AI-RISK-013`, `SEC-RISK-015`, corrective action, or public-claim review.

## 15. Retention Model

Retention is assigned by data purpose rather than a single blanket duration.

### 15.1 Current retention categories

| Category | Retention intent |
|---|---|
| Ephemeral/session | Keep only for the active session or short security/operational window; expire/delete promptly after purpose ends |
| Short operational | Retain while useful for troubleshooting, monitoring, replay prevention, or current measurement |
| Rolling evidence | Retain for a defined operational/review window and prune when historical detail is no longer needed |
| Management-system evidence | Retain while necessary to support traceability, review, audit, corrective action, release history, and assurance claims; Git history may preserve superseded versions |
| Required retention | Apply a specific contractual/legal/standards requirement only after an actual basis is identified and recorded |

This document intentionally does not invent universal 30/90/365-day periods where the implemented system has not established them.

### 15.2 Retention decisions

A material retention decision should consider:

- application purpose;
- security/investigation need;
- management-system evidence need;
- recovery need;
- data sensitivity;
- user expectation;
- storage/cost;
- supplier capability;
- applicable contractual/legal requirement;
- and deletion feasibility.

## 16. Deletion and Expiration

Deletion must be designed to remove data from the active application boundary when its purpose ends, subject to justified evidence/recovery retention.

Deletion controls may include:

- session expiration and cleanup;
- foreign-key cascade deletion;
- explicit table-row deletion;
- R2 object deletion;
- TTL/expiry handling;
- replay-record pruning;
- log/telemetry pruning;
- revocation and later cleanup;
- replacement/supersession of repository records while retaining controlled history;
- and destruction/expiry of backups according to an approved retention plan.

A deletion control is not considered fully evidenced until tests establish, where relevant:

- trigger works;
- dependent records behave as intended;
- deleted data no longer appears through public/API/MCP paths;
- indexes/caches/object metadata do not leave an unintended active copy;
- authorization is preserved;
- and required audit evidence records the deletion without reproducing the deleted sensitive content.

## 17. Schema and Data-Flow Change Control

The following changes require explicit data-governance review:

- new D1 table or persistent store;
- new identity or user-entered field;
- new log/event field;
- change from synthetic/public-demo to real/user data;
- new provider-derived data;
- new public API exposure;
- new MCP tool or data source;
- broader namespace access;
- new R2 object class;
- new data export/import path;
- new backup or replicated copy;
- changed retention or deletion behavior;
- changed encryption/protection method;
- new external identity provider;
- new AI/MCP provider beyond Codex/Claude;
- or an incident showing the current classification/exposure assumption is wrong.

Material changes use the existing `DEMO-###` process and `docs/governance/MANAGEMENT-SYSTEM-CHANGE-PLANNING.md`.

## 18. Data Incidents and Concerns

Potential data incidents include:

- public exposure of visitor-scoped or identity data;
- secret or credential exposure;
- cross-session access;
- public logs containing sensitive content;
- unintended MCP field/table exposure;
- loss/corruption of material data;
- inability to perform required deletion;
- supplier data-handling change invalidating assumptions;
- or restored data being exposed with weaker controls.

Such conditions are handled through `docs/governance/INCIDENT-MANAGEMENT.md` and may trigger risk, supplier, recovery, SoA, AI-impact, and corrective-action review.

Non-sensitive concerns about AI/MCP data quality, provenance, freshness, or exposure may also enter through the AI/MCP concern process. Sensitive details must remain in private reporting channels.

## 19. Backup and Recovery Interface

Backup and recovery must preserve classification and handling requirements.

A backup copy is not less sensitive than its source merely because it is inactive.

Recovery planning must ensure:

- AUTH-SECURITY, CONFIDENTIAL, and SECRET material remains protected;
- public backups are not created accidentally from mixed-class stores;
- D1/R2 restoration preserves visitor isolation and public exposure boundaries;
- restored logs/evidence do not expose secrets;
- retention/deletion obligations are not silently reset without review;
- and MCP post-restore validation confirms that only approved public demo data is available and the Codex/Claude-only provider boundary remains intact.

## 20. Current Known Gaps

Approval of this procedure does not close the following operating gaps:

1. D1 backup/export and restore effectiveness is not yet evidenced.
2. R2 backup/restore effectiveness is not yet evidenced.
3. Session/expired identity cleanup effectiveness requires explicit operational verification.
4. Table-by-table retention durations are not yet automated or formally baselined where no current business/security need defines them.
5. Deletion testing is not yet complete across D1, R2, identity, session, logs, replay records, and backups.
6. AI-sensitive-field exclusion/evaluation coverage remains an objective/treatment item rather than complete assurance.
7. Provenance/freshness metadata for all public AI-accessible demo records remains incomplete.
8. No claim is made that provider-internal copies, backups, or logs are deleted according to WizardGang-controlled timing unless provider evidence establishes that behavior.

These gaps must remain visible in the compliance checklist, risk/treatment records, objectives, or corrective/improvement work as applicable.

## 21. Evidence

Supporting evidence includes:

- `docs/governance/registers/DATA-REGISTER.md`;
- `migrations/0001_demo_blob.sql`;
- `migrations/0002_operations_dashboard.sql`;
- `migrations/0004_application_logs.sql`;
- `migrations/0005_capability_records.sql`;
- `migrations/0008_interactive_demo.sql`;
- `migrations/0010_identity_sessions.sql`;
- `migrations/0011_cloudflare_usage.sql`;
- `src/api/mcp.ts`;
- `SECURITY.md`;
- `docs/OPERATIONS.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/AI-RISK-REGISTER.md`;
- `docs/governance/BACKUP-RECOVERY-RESTORE.md`;
- `docs/governance/INCIDENT-MANAGEMENT.md`;
- and controlled Git/release evidence.

## 22. Alignment

This procedure supports applicable ISO/IEC 27001:2022 and ISO/IEC 42001:2023 requirements for information/data classification, appropriate handling, access restriction, logging/evidence, retention/deletion, supplier data boundaries, backup/recovery, AI data governance, transparency, impact reassessment, and controlled change.

**Current posture after approval:** Data classes, ownership, major stores, public/AI exposure boundaries, retention principles, and deletion expectations are defined. Operational cleanup, deletion testing, backup/restore evidence, and full AI provenance/freshness coverage remain partial until demonstrated. Certification is not claimed.
