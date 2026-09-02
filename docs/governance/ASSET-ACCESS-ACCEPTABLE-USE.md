# Asset Inventory, Acceptable Use, and Access Review

**Reference:** WG-GOV-022  
**Applies to:** ISO/IEC 27001:2022 asset inventory, acceptable use, access control, identity/access lifecycle, privileged access, source-code access, supplier, configuration, and information-handling controls · ISO/IEC 42001:2023 resource, access, supplier, data, AI/MCP authority, and operational-control requirements where access to AI-related assets is relevant  
**Status:** Proposed  
**Owner:** Management-System Owner / Information Security Owner  
**Approval:** Controlled pull request and merge  
**Review:** Asset inventory at least annually and after material architecture/supplier changes; privileged and provider access at least quarterly and after material personnel, credential, incident, or authority changes

## 1. Purpose

This procedure defines how the WizardGang Architecture Demo identifies material assets, assigns ownership, establishes acceptable-use expectations, limits access, and reviews privileged or sensitive access.

The project already documents roles, suppliers, data classes, secrets, authorization boundaries, and release controls. This procedure brings those pieces into one asset/access lifecycle so the management system can answer:

1. What assets matter to the scoped system?
2. Who is accountable for each asset class?
3. What use is permitted or prohibited?
4. Which access classes can change source, release, production, data, credentials, or management-system evidence?
5. How is access granted, changed, reviewed, and removed?
6. What evidence supports the current access posture?

Approval of this procedure establishes the process. It does **not** claim that every provider account, collaborator, token, device, or privilege has already completed a formal access review, and it does not publish a sensitive account roster.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Core Principles

1. **Inventory what matters.** Assets are identified because their compromise, loss, misuse, or unavailability could affect the scoped system—not because every file or provider object needs its own row.
2. **Ownership is explicit.** Every material asset class has an accountable functional owner.
3. **Public does not mean uncontrolled.** Source may be public while write, merge, release, provider, credential, and production authority remain restricted.
4. **Least privilege.** Access is limited to the permissions necessary for the intended responsibility.
5. **No shared-secret publication.** Public governance records may identify credential names and purposes but never secret values, recovery codes, private keys, or equivalent material.
6. **Access classes are public; account rosters may remain private.** The public register documents what kinds of access exist and what must be reviewed. Usernames, private provider identifiers, recovery material, and sensitive account details are not required in the public repository.
7. **Provider identity does not grant application privilege.** A request appearing to originate from Codex, Claude, a browser, curl, or another client does not receive extra authority based on client metadata alone.
8. **AI authority is explicit.** Codex and Claude remain the only approved AI/MCP client/provider families and currently receive no privileged provider-specific application path.
9. **Privilege changes are controlled changes.** New privileged permissions, tokens, service accounts, write-capable AI tools, or production roles require review before use.
10. **Review is evidence.** An access model is not considered periodically reviewed merely because the permissions have not visibly changed.
11. **Remove stale access.** Access that is no longer required must be revoked or disabled promptly once identified.
12. **Unverified enforcement stays visible.** Repository branch/ruleset enforcement, provider-account configuration, and endpoint access remain Partial where the available evidence cannot fully verify them.

## 3. Asset Categories

The management system uses the following asset categories:

- **Source and delivery assets** — repository, branches, workflows, tags, releases, deployment evidence.
- **Runtime/platform assets** — Cloudflare Worker/runtime, DNS/TLS, D1, R2, Durable Objects where configured, operational telemetry.
- **Security assets** — secrets, API tokens, signing keys, credentials, session secrets, authorization configuration.
- **Data assets** — public demo data, visitor-scoped data, logs, audit records, identity state, R2 object sets.
- **Governance/evidence assets** — policies, risk registers, SoAs, assessments, audit/review records, incident/corrective-action evidence.
- **Supplier assets/services** — GitHub, Cloudflare, approved identity providers, dependency ecosystem.
- **AI/MCP assets** — MCP endpoint, tool definitions, evaluation evidence, public AI-accessible data boundary, Codex and Claude integration families.
- **Administrative endpoints/devices** — devices or sessions capable of repository, provider, release, secret, or administrative access.

The authoritative baseline is maintained in `docs/governance/registers/ASSET-ACCESS-REGISTER.md`.

## 4. Asset Ownership

Functional ownership follows `docs/governance/ROLES-RESPONSIBILITIES.md`.

Default ownership is:

| Asset class | Primary owner | Supporting owners |
|---|---|---|
| Repository/source/workflows | Change and Release Authority | Technical Owner, Security Owner |
| Production Cloudflare runtime | Technical / Operations Owner | Security Owner, Release Authority |
| D1/R2/data | Data Owner / Technical Owner | Security, Operations, Evidence owners |
| Secrets/credentials | Information Security Owner | relevant system owner |
| Identity/authentication | Information Security / Technical Owner | Supplier Owner |
| Logs/audit/evidence | Operations / Evidence Custodian | Security Owner |
| Governance records | Management-System Owner / Evidence Custodian | responsible functional owner |
| MCP server/tools | AI Governance / Technical Owner | Security Owner |
| Codex and Claude supplier boundaries | AI Governance / Supplier Owner | Security Owner |
| Developer/admin endpoint access | Management-System / Security Owner | individual authorized operator |

Ownership does not automatically grant every possible technical permission. Access remains proportional to responsibilities.

## 5. Acceptable Use

In-scope assets may be used only for authorized development, testing, demonstration, operation, monitoring, incident handling, recovery, governance, accessibility verification, AI/MCP evaluation, and approved maintenance activities.

Acceptable use includes:

- using public source and documentation for review and demonstration;
- using controlled branches and `DEMO-###` changes for modifications;
- using approved CI/release workflows for production-bound changes;
- using provider consoles/APIs only for authorized configuration, monitoring, deployment, recovery, or investigation;
- using D1/R2 only for intended demo, operational, identity, evidence, and controlled data purposes;
- using logs/evidence for troubleshooting, assurance, audit, review, incident, and improvement activities;
- using MCP through its approved read-only public boundary;
- connecting Codex or Claude to the approved MCP capability within the documented intended use;
- and using credentials only for the purpose and permission set for which they were issued.

## 6. Prohibited or Unacceptable Use

The following are prohibited unless a future controlled change explicitly establishes a justified and approved use:

- committing secrets, passwords, tokens, private keys, recovery codes, cookies, or private signing material;
- sharing privileged credentials through public issues, source, public logs, or public AI/MCP responses;
- bypassing the controlled Git/release lifecycle for convenience;
- using production credentials for unrelated experimentation;
- expanding a token or account permission beyond its documented purpose without review;
- using a public demo namespace to store private, sensitive, regulated, or credential data;
- placing visitor/session/identity/log/audit/R2/secret data into the public MCP boundary without approved reassessment;
- treating Codex, Claude, client metadata, user-agent text, or model identity as an authentication mechanism;
- adding an additional AI/MCP provider or client family without the supplier/risk/impact/SoA/evaluation approval process;
- giving Codex or Claude write, deployment, administrative, destructive, source-control, or privileged data authority under the current approved assessment;
- using security testing to intentionally disrupt the public service outside an approved test/incident exercise;
- retaining access after it is no longer needed;
- or representing unverified access enforcement as independently assured.

## 7. Access Classes

The system distinguishes several access classes.

### 7.1 Public read access

Includes public website, public source, documentation, approved APIs, public-safe logs/telemetry, and public MCP reads.

Public read access does not grant write, admin, secret, provider, source-control, or release authority.

### 7.2 Repository write/change access

Allows controlled source changes or branch creation as permitted by GitHub configuration.

Expected controls include:

- authenticated GitHub identity;
- controlled `DEMO-###` change history;
- PR/CI/review lifecycle;
- least privilege appropriate to contributor responsibility;
- and removal/review when no longer required.

Branch-protection/ruleset enforcement must not be represented as fully verified where the available integration cannot confirm it.

### 7.3 Merge/release access

Allows a reviewed change to become part of the accepted baseline or release lifecycle.

This is more sensitive than ordinary source contribution and requires:

- release responsibility;
- successful required validation;
- traceable commit/tag/release identity;
- and no bypass of required controls.

### 7.4 GitHub workflow/token access

Repository-managed credentials used by automation must be scoped to the narrow workflow purpose.

Examples already documented include:

- `GITHUB_DEMO_TOKEN` for restricted workflow dispatch;
- `GIT_DEMO_PR_TOKEN` for the controlled live-demo branch/PR/status/merge/tag lifecycle;
- optional read-only GitHub API access where documented.

Token values remain outside source.

### 7.5 Cloudflare administrative/deployment access

Access capable of changing production configuration, deployment, D1/R2 resources, DNS, secrets, or provider settings is privileged.

Controls include:

- least-permission provider/API tokens where practical;
- separate purpose-specific credentials where documented;
- managed secrets;
- controlled deployment;
- and periodic access review.

### 7.6 Application administration

`/admin` and other state-changing administrative paths require the application-side authentication/authorization boundary defined in `SECURITY.md`.

Administrative credentials must not be exposed to browsers beyond the intended same-origin interaction or forwarded to external providers.

### 7.7 Application API write access

Protected write paths use managed operator bearer credentials or bounded identity-derived authorization where implemented.

A write credential does not imply repository, provider, deployment, or AI authority.

### 7.8 Identity-provider access

Identity providers remain Conditional suppliers until specifically configured for an active scenario. Provider-specific administrative access and secrets require review before activation.

### 7.9 AI/MCP access

The current public MCP capability uses the application's `demo:read` boundary and exposes read-only/non-destructive tools.

Rules:

- Codex and Claude are the only approved AI/MCP client/provider families;
- client identity metadata is evidence only, not authorization;
- no provider receives additional privilege because of its brand/client identity;
- MCP access is limited to the approved tool inventory and public-data boundary;
- no current MCP tool may write, delete, administer, deploy, modify source, change permissions, or access private data;
- any authority expansion requires a controlled change, security and AI risk review, impact reassessment, SoA review, evaluation update, and management approval.

## 8. Access Lifecycle

Access should follow this lifecycle:

```text
business / operating need
        ↓
role + asset + minimum permission identified
        ↓
authorization / approval
        ↓
credential or account provisioned outside public source
        ↓
use within approved purpose
        ↓
periodic / event-driven review
        ↓
change, retain, restrict, suspend, or revoke
        ↓
retain appropriate review evidence
```

Access must not be provisioned merely because a platform offers a role or token.

## 9. Access Granting

Before granting privileged access, the responsible owner should establish:

- person/service/function receiving access;
- asset or provider boundary;
- reason access is needed;
- minimum role/permissions;
- whether write/admin/release/secret/data authority is included;
- approval authority;
- expiration/review trigger where temporary;
- and any additional controls such as MFA, provider policy, or supervised use where available and appropriate.

The public register does not require publishing the individual account identifier.

## 10. Access Changes and Revocation

Access must be reviewed and changed/revoked when:

- a responsibility ends;
- a role changes;
- a credential is suspected compromised;
- a supplier or platform changes;
- a token is replaced or its purpose changes;
- an incident reveals excessive privilege;
- a project/feature is retired;
- an identity-provider configuration is removed;
- an AI/MCP capability is suspended;
- or management determines that the access is no longer necessary.

Emergency revocation/rotation may occur before normal documentation is complete. Material actions must be recorded afterward without exposing secret values.

## 11. Periodic Access Review

Privileged and sensitive access should be reviewed at least quarterly.

The review should cover, as applicable:

- GitHub repository write/merge/release access;
- GitHub Actions/workflow tokens;
- Cloudflare account and API-token privileges;
- deployment credentials;
- application admin access;
- operator API credentials;
- webhook signing secrets and related administrative ownership;
- identity-provider administrative credentials where active;
- session/signing secret ownership and rotation need;
- access to D1/R2 administrative functions;
- management-system approval authority;
- and AI/MCP authority/tool inventory.

A review should ask:

1. Is the access still needed?
2. Is the scope still the minimum needed?
3. Is the owner/function still correct?
4. Is any credential stale, duplicated, shared unnecessarily, or due for rotation?
5. Has a supplier/platform change expanded effective privilege?
6. Has an incident, audit, risk, or role change created a revocation need?
7. Does the access still match the documented register?

The first consolidated access review is planned for **2026-12-02**. This date is a management-system target, not evidence that the review has already occurred.

## 12. Review Evidence

Access-review evidence may include:

- dated private provider/account review notes;
- sanitized public summary in the asset/access register;
- controlled issue or management-review record;
- token scope/configuration evidence without secret values;
- repository collaborator/role review evidence where safely retained;
- revocation/rotation decision;
- risk or incident linkage;
- or a statement that no change was required after an actual review.

The public record should normally retain:

- date;
- reviewer;
- access class reviewed;
- result (`Retain`, `Reduce`, `Rotate`, `Revoke`, `Investigate`, `Not verified`);
- action owner;
- due date where applicable;
- and sanitized evidence reference.

## 13. Privileged Access

Privileged access includes any permission capable of materially changing:

- production deployment/configuration;
- source merge/release history;
- credentials or secrets;
- administrative state;
- authorization/access policy;
- D1/R2 protected data;
- DNS/provider configuration;
- management-system approval/risk acceptance;
- or future AI/MCP authority.

Privileged access should:

- be limited to accountable roles;
- use separate purpose-specific credentials where practical;
- avoid unnecessary sharing;
- be rotated/revoked after suspected compromise;
- be included in periodic review;
- and generate attributable change/audit evidence where the system supports it.

## 14. Source-Code Access

Source confidentiality is not a control objective because the repository is public.

The protected interest is **source integrity**:

- who may change accepted code;
- who may merge/release;
- whether controlled validation occurred;
- whether automation credentials are constrained;
- and whether an accepted release can be tied to an immutable commit/tag.

Public read access to source must never be confused with public write access.

## 15. Administrative Endpoint Security

Devices and sessions capable of privileged repository/provider/admin actions are material access assets even though the current scope does not define a corporate endpoint fleet.

Expectations include:

- supported operating system/browser/security updates;
- device/session access controlled by the authorized operator;
- reasonable malware protection as defined in the security-maintenance procedure;
- no storage of production secret values in public source;
- prompt investigation and credential rotation after suspected compromise;
- and avoiding privileged operations from untrusted/shared environments.

**Current limitation:** independent endpoint inventory/hardening evidence remains incomplete and must not be treated as Met merely because these rules exist.

## 16. Supplier Access and Responsibility

GitHub and Cloudflare operate provider-side infrastructure, but WizardGang controls its own account configuration, credentials, permissions, application code, and integration choices.

Codex and Claude control their own model/client environments, but WizardGang controls whether they may connect to the public MCP boundary and what that boundary exposes.

Supplier approval does not authorize:

- unrestricted provider permissions;
- new products/features automatically;
- new AI/MCP families;
- broader data exposure;
- or transfer of WizardGang risk-acceptance authority to the supplier.

## 17. Incidents and Access

An access-related event may become an incident when it involves:

- suspected credential/token compromise;
- unauthorized account use;
- unexpected privilege expansion;
- unauthorized source/release change;
- provider-account takeover;
- unauthorized D1/R2 access;
- admin-bypass behavior;
- unintended public data exposure;
- or AI/MCP authority beyond the approved read-only boundary.

Incident response may require immediate revocation, token rotation, provider-session invalidation, access reduction, release rollback, or service offline/degraded state.

## 18. Exceptions

A temporary exception to the normal access model must identify:

- reason;
- asset/access class;
- permissions required;
- owner;
- duration;
- risk;
- compensating controls;
- approval;
- and removal/review date.

An exception must not silently become permanent access.

Material exceptions follow the risk-acceptance rules in `docs/governance/RISK-MANAGEMENT.md`.

## 19. Current Evidence Posture

Current strengths include:

- defined roles and decision authorities;
- public source with controlled change/release history;
- managed secrets outside source;
- scoped GitHub and Cloudflare token design;
- application-side admin/auth boundaries;
- identity-derived bounded write authorization where implemented;
- public/private data classification;
- supplier register;
- read-only MCP authority;
- Codex/Claude-only AI/MCP supplier boundary.

Material incomplete evidence includes:

- a completed consolidated quarterly access review;
- a verified current collaborator/provider-account roster retained privately;
- complete branch/ruleset enforcement verification;
- comprehensive developer/admin endpoint inventory/hardening evidence;
- provider-specific identity access review if/when an identity provider is activated;
- and recurring evidence that stale credentials/access are removed.

These items remain Partial/Planned/Gap until actual review evidence exists.

## 20. Evidence and Cross-References

Primary evidence includes:

- `docs/governance/registers/ASSET-ACCESS-REGISTER.md`;
- `docs/governance/ROLES-RESPONSIBILITIES.md`;
- `docs/governance/registers/SUPPLIER-REGISTER.md`;
- `docs/governance/DATA-GOVERNANCE.md`;
- `docs/governance/registers/DATA-REGISTER.md`;
- `docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`;
- `docs/governance/INCIDENT-MANAGEMENT.md`;
- `docs/governance/RISK-MANAGEMENT.md`;
- `SECURITY.md`;
- `docs/CHANGE-MANAGEMENT.md`;
- `docs/RELEASE.md`;
- `.github/workflows/ci.yml`;
- and current source implementing authorization and MCP boundaries.

## 21. Alignment

This procedure principally strengthens evidence for:

- ISO/IEC 27001 A.5.9 — inventory of information and associated assets;
- A.5.10 — acceptable use of information and associated assets;
- A.5.15–A.5.18 — access control, identity/authentication information, and access-right lifecycle;
- A.8.2–A.8.4 — privileged access, information access restriction, and source-code access;
- related supplier, configuration, logging, incident, and asset controls;
- and ISO/IEC 42001 resource, data, supplier, AI-authority, and operational-governance requirements relevant to the current MCP boundary.

**Current posture after approval:** Asset classes, owners, acceptable-use rules, access classes, and the review process are defined. A first formal consolidated access review and stronger endpoint/provider enforcement evidence remain operating work; certification is not claimed.
