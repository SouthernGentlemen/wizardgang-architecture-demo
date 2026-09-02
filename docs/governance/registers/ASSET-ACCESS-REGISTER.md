# Asset and Access Register

**Reference:** WG-REG-009  
**Framework:** Integrated ISMS / AIMS asset and access governance  
**Status:** Approved
**Owner:** Management-System Owner / Information Security Owner  
**Assessment date:** 2026-09-02  
**Initial access review due:** 2026-12-02  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register identifies the material assets and access classes used by the WizardGang Architecture Demo and records ownership, sensitivity, principal access boundary, review need, and current evidence status.

It is intentionally public-safe. It does not publish credential values, recovery codes, private provider identifiers, or a complete named-account roster. Sensitive account-level evidence may be retained privately while this register records the sanitized governance conclusion.

The governing procedure is `docs/governance/ASSET-ACCESS-ACCEPTABLE-USE.md`.

## 2. Status Values

- **Met** — the stated asset/access expectation is implemented and supported by current evidence.
- **Partial** — useful controls/evidence exist, but one or more material operating/review elements remain incomplete.
- **Gap** — a required control/evidence item is materially missing.
- **Planned** — an operating review or action has been scheduled but not completed.
- **N/A** — not applicable to the current scoped asset/access class, with rationale.

Status is an evidence posture, not a certification score.

## 3. Asset Inventory Summary

| ID | Asset / class | Category | Primary owner | Principal access / exposure | Status |
|---|---|---|---|---|---|
| AST-001 | GitHub repository/source | Source & delivery | Change / Release Authority | Public read; authenticated controlled write | Partial |
| AST-002 | GitHub branches / PRs | Source & delivery | Change / Release Authority | Authenticated contributor/reviewer/merge roles | Partial |
| AST-003 | GitHub Actions / workflow definitions | Source & delivery | Change / Release Authority | Public source; workflow execution under GitHub controls | Partial |
| AST-004 | Git tags, Releases, validation evidence | Evidence / delivery | Release Authority / Evidence Custodian | Public read; controlled creation | Met |
| AST-005 | GitHub managed tokens/secrets | Security | Security / Release Owner | Restricted provider-managed secret storage | Partial |
| AST-006 | Cloudflare Worker production runtime | Runtime | Technical / Operations Owner | Public app surface; privileged provider/deploy access | Partial |
| AST-007 | Cloudflare DNS/TLS/custom-domain configuration | Runtime / security | Technical Owner | Public DNS/TLS behavior; provider admin restricted | Partial |
| AST-008 | D1 databases | Runtime / data | Data / Technical Owner | Application-controlled; provider admin privileged | Partial |
| AST-009 | R2 bucket/object sets | Runtime / data | Data / Technical Owner | Explicit app routes only; provider admin privileged | Partial |
| AST-010 | Durable Objects where configured | Runtime | Technical Owner | Application-internal/provider-controlled runtime | Partial |
| AST-011 | Cloudflare deployment/admin credentials | Security | Security / Operations Owner | Restricted managed tokens/secrets | Partial |
| AST-012 | Cloudflare analytics/read credential | Security / operations | Operations Owner | Restricted read-only provider token where configured | Partial |
| AST-013 | Application `/admin` boundary | Security / operations | Operations / Security Owner | Authenticated same-origin admin path | Partial |
| AST-014 | Application API write credentials | Security | Security / Technical Owner | Managed bearer / identity-derived bounded write access | Partial |
| AST-015 | Webhook signing secrets | Security | Security / Technical Owner | Managed secret; HMAC verification | Partial |
| AST-016 | Identity/session signing secrets and provider credentials | Security / identity | Security / Technical Owner | Restricted managed secret/provider config | Partial |
| AST-017 | Public demo records (`demo_records`) | Data | Data / AI Capability Owner | Approved public/API/MCP read boundary | Partial |
| AST-018 | Visitor/session/identity/log/audit/R2 data | Data | Data / Security / Operations owners | Non-MCP; bounded app/provider access | Partial |
| AST-019 | Governance docs/registers/SoAs/assessments | Governance / evidence | Management-System Owner / Evidence Custodian | Public source; controlled write/approval | Partial |
| AST-020 | MCP server and tool inventory | AI/MCP | AI Governance / Technical Owner | Public read-only `demo:read` tool boundary | Met |
| AST-021 | OpenAI Codex connection family | AI/MCP supplier | AI Governance / Supplier Owner | Approved MCP client/provider family; no extra privilege | Partial |
| AST-022 | Anthropic Claude connection family | AI/MCP supplier | AI Governance / Supplier Owner | Approved MCP client/provider family; no extra privilege | Partial |
| AST-023 | npm/open-source dependency set + lockfile | Supplier / software | Technical / Security Owner | Public dependency metadata; controlled update/CI audit | Partial |
| AST-024 | Developer/admin endpoint(s) capable of privileged operations | Administrative endpoint | Management-System / Security Owner | Restricted to authorized operator; evidence not publicly inventoried | Gap |
| AST-025 | External identity provider configuration | Conditional supplier/identity | Security / Technical Owner | Not active unless provider-specific configuration approved | N/A / Conditional |

## 4. Asset Notes

### AST-001 — GitHub repository/source

**Purpose:** Authoritative source and public engineering record.  
**Confidentiality objective:** Source itself is public by design.  
**Integrity objective:** High — unauthorized accepted source/release change could compromise the system.  
**Availability objective:** Material — hosted unavailability can block normal review/release work.  
**Current controls:** `DEMO-###` history, PR/CI flow, tags/releases, public history, token restrictions.  
**Known limitation:** Required branch/ruleset approval enforcement is not fully verified through available evidence.  
**Status:** Partial.

### AST-004 — Tags, Releases, and Validation Evidence

**Purpose:** Tie accepted release state to immutable source identity and validation evidence.  
**Controls:** semantic tags/releases, commit SHA, tagged deployment, validation artifact.  
**Status:** Met for the current engineering evidence model; provider continuity remains supplier/recovery risk.

### AST-005 — GitHub Managed Tokens/Secrets

Includes the documented restricted workflow credentials and optional read-only API credentials.

**Rules:**

- values remain outside source;
- scope must match documented workflow purpose;
- suspected compromise triggers rotation/revocation and incident review;
- quarterly access review includes purpose/scope/continued need.

**Status:** Partial — design is documented; periodic consolidated access-review evidence is pending.

### AST-006 through AST-012 — Cloudflare Platform Assets

Cloudflare assets include production runtime, DNS/TLS, D1, R2, Durable Objects where configured, deployment credentials, and analytics credentials.

**Provider boundary:** Cloudflare operates the underlying platform; WizardGang owns its account configuration, tokens, application behavior, data model, deployment, authorization, monitoring, and recovery decisions.

**Status:** Partial — architecture and least-permission design are established, while recurring account/access review and D1/R2 recovery evidence remain incomplete.

### AST-013 — Application Administration

**Boundary:** application-side authentication with state-changing same-origin controls and `no-store` behavior as documented in `SECURITY.md`.

**Access:** authorized operator only.

**Status:** Partial — control design exists; periodic credential/access review evidence remains pending.

### AST-014 — Application Write Credentials

**Boundary:** managed operator bearer token or bounded identity-derived token where implemented.

**Important:** API write permission does not grant repository, provider, release, or MCP authority.

**Status:** Partial.

### AST-017 — Public Demo Records

**Data classification:** PUBLIC / PUBLIC-DEMO.  
**MCP:** approved bounded source through `list_demo_records`.  
**Limitations:** provenance/freshness and sensitive-field exclusion tests remain incomplete.  
**Status:** Partial.

### AST-018 — Non-Public / Non-MCP Runtime Data

Includes visitor/session data, identity state, application logs, audit events, R2 content by default, webhook evidence, and protected operational data.

**MCP exposure:** No.

**Status:** Partial — classifications and boundaries are documented; retention/deletion/recovery evidence remains incomplete.

### AST-019 — Governance and Evidence Records

**Purpose:** Policies, scope/context, risk registers, SoAs, AI impact assessment, objectives, supplier/data/security registers, incidents, audit/review/corrective-action records.

**Access:** public read; controlled change/approval through Git.

**Status:** Partial while current PR remains Proposed and recurring operating evidence continues to accumulate.

### AST-020 — MCP Server and Tool Inventory

**Current tools:** `ping`, `list_demo_records`.  
**Authority:** public read-only/non-destructive.  
**Authorization:** application `demo:read`.  
**MCP data source:** only approved public `demo_records` boundary.  
**Status:** Met for current bounded tool-authority design; evaluation breadth remains separate Partial evidence.

### AST-021 / AST-022 — Codex and Claude

These are the only approved AI/MCP connection families.

**They do not receive:**

- write authority;
- admin authority;
- release/deployment authority;
- source-control authority;
- private D1/R2 access;
- secret access;
- or privilege based on client metadata.

**Status:** Partial — provider/client boundary is documented; periodic supplier and security review remains pending.

### AST-024 — Developer/Admin Endpoints

**Purpose:** Devices/sessions used to administer GitHub, Cloudflare, releases, secrets, or application controls.

**Public detail intentionally limited:** A public device/account roster is not required.

**Current limitation:** no comprehensive independently evidenced endpoint inventory, hardening, malware, and privileged-session baseline has been retained in this public governance stream.

**Status:** Gap.

### AST-025 — External Identity Provider

**State:** Conditional / not universally active.  
**Rationale:** Provider-specific review is required before activation; the management system does not invent a single active identity provider where none is specifically configured.  
**Status:** N/A / Conditional for the generic provider asset until an actual provider is activated.

## 5. Access-Class Inventory

| ID | Access class | Asset boundary | Minimum intended authority | Public record posture | Review state |
|---|---|---|---|---|---|
| ACC-001 | Public source/site read | GitHub/site/docs | Read only | Public by design | Met |
| ACC-002 | Repository contributor/write | GitHub source branches | Controlled source change | Named account details may remain private | Partial |
| ACC-003 | Merge/release authority | GitHub accepted baseline/releases | Merge/tag/release under controlled process | Function documented | Partial |
| ACC-004 | GitHub workflow dispatch token | GitHub Actions | Restricted checked-in workflow dispatch | Secret value private; purpose public | Partial |
| ACC-005 | Git live-demo PR lifecycle token | GitHub PR/status/merge/tag workflow | Controlled branch/PR/status/merge/tag tasks | Secret value private; purpose public | Partial |
| ACC-006 | Optional GitHub read token | GitHub API | Read only | Secret value private | Partial |
| ACC-007 | Cloudflare deploy/admin access | Cloudflare account/runtime | Deployment/configuration according to token/account scope | Account details private | Partial |
| ACC-008 | Cloudflare analytics access | Cloudflare analytics/billing API | Read only; Billing Read only when needed | Account/token details private | Partial |
| ACC-009 | Application admin credential | `/admin`, `/git` app boundary | Administrative app actions | Credential private | Partial |
| ACC-010 | Operator API bearer access | protected application writes | Scoped application write | Credential private | Partial |
| ACC-011 | Identity-derived write token | visitor namespace | 10-minute bounded visitor write authority | Runtime-derived; no public token detail | Partial |
| ACC-012 | Webhook signing secrets | webhook receivers | Signature verification only | Secret private | Partial |
| ACC-013 | Session/signing secrets | application/identity sessions | Session integrity/encryption | Secret private | Partial |
| ACC-014 | Provider identity admin | configured identity provider | Provider-specific admin | Conditional until provider activation | N/A / Conditional |
| ACC-015 | Public MCP read | MCP server | `demo:read`, approved read-only tools only | Public interface | Met |
| ACC-016 | Codex MCP client | MCP server | Same public MCP read boundary; no provider-specific privilege | Approved family | Partial |
| ACC-017 | Claude MCP client | MCP server | Same public MCP read boundary; no provider-specific privilege | Approved family | Partial |
| ACC-018 | D1/R2 provider administration | Cloudflare data resources | Privileged data/resource operations | Account details private | Partial |
| ACC-019 | Management-system approval authority | Governance records | Policy/scope/risk/SoA/review approvals according to roles | Functional authority public | Partial |
| ACC-020 | Developer/admin endpoint privileged session | GitHub/Cloudflare/admin | Whatever authorized privilege the operator invokes | Device/account specifics private | Gap |

## 6. First Access Review Plan

The first consolidated access review is due **2026-12-02**.

It must review at minimum:

- ACC-002 through ACC-010;
- ACC-012 through ACC-013;
- ACC-018 through ACC-020;
- Codex/Claude approval and MCP tool inventory under ACC-015 through ACC-017;
- whether any identity provider has moved from Conditional to active;
- whether any stale, duplicate, over-broad, or unused credential/access exists;
- and whether the register still matches the actual architecture.

The review must not publish secret values or sensitive provider-account details.

## 7. Access Review Record Template

When a review occurs, append or link a sanitized result using:

| Field | Required content |
|---|---|
| Review ID | `AR-###` |
| Date | Date review performed |
| Reviewer | Accountable reviewer/function |
| Access classes | IDs reviewed |
| Evidence | Safe evidence reference; private evidence may be described without disclosure |
| Result | Retain / Reduce / Rotate / Revoke / Investigate / Not verified |
| Actions | Required action(s) |
| Owner | Action owner |
| Due | Due date if action remains |
| Risk/incident link | If applicable |
| Closed | Date when actions/effectiveness confirmed |

## 8. Current Access Review Records

No completed consolidated `AR-###` access review is claimed yet.

| ID | Scope | State | Due | Notes |
|---|---|---|---|---|
| AR-001 | Initial privileged/provider/source/admin access review | Planned | 2026-12-02 | Must review GitHub, Cloudflare, app admin/API, managed credentials, data administration, governance approval authority, endpoint privilege, and current MCP/Codex/Claude authority. |

`AR-001` being Planned is not evidence that access has been reviewed.

## 9. Acceptable-Use Evidence State

The acceptable-use rules now explicitly prohibit:

- committing/sharing secrets;
- uncontrolled production/source/release changes;
- privilege expansion without review;
- use of production credentials for unrelated experimentation;
- storing private/sensitive data in public demo/MCP surfaces;
- treating Codex/Claude/client metadata as authentication;
- adding another AI/MCP provider without governance review;
- giving current MCP clients write/admin/deploy/destructive authority;
- retaining stale access;
- or overstating unverified enforcement.

**Evidence status:** Partial until the rules are approved through merge and awareness/access-review evidence is produced.

## 10. Review Triggers

Update this register when:

- a new material GitHub or Cloudflare resource enters scope;
- a new secret/token/access class is introduced;
- an access permission materially changes;
- a person/service responsibility changes;
- an identity provider is activated or changed;
- a material supplier changes;
- D1/R2 data authority changes;
- an incident or vulnerability involves access;
- branch/repository protection evidence changes;
- a new MCP tool is added;
- AI/MCP authority changes;
- Codex or Claude approval changes;
- another AI/MCP provider is proposed;
- or an asset is retired.

## 11. Cross-References

- `docs/governance/ASSET-ACCESS-ACCEPTABLE-USE.md`
- `docs/governance/ROLES-RESPONSIBILITIES.md`
- `docs/governance/registers/SUPPLIER-REGISTER.md`
- `docs/governance/DATA-GOVERNANCE.md`
- `docs/governance/registers/DATA-REGISTER.md`
- `docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`
- `docs/governance/INCIDENT-MANAGEMENT.md`
- `docs/governance/RISK-MANAGEMENT.md`
- `SECURITY.md`
- `docs/CHANGE-MANAGEMENT.md`
- `docs/RELEASE.md`

## 12. Current Conclusion

The scoped system now has a documented baseline inventory of material asset and access classes, asset ownership, acceptable-use rules, privileged access expectations, and a scheduled access-review process.

Current strengths include controlled public source, scoped credential design, explicit data boundaries, management-system ownership, and bounded public MCP authority.

The principal remaining evidence gaps are:

- completed quarterly access review;
- private corroboration of current provider/account access;
- full branch/ruleset enforcement verification;
- recurring stale-access removal evidence;
- and developer/admin endpoint hardening/access evidence.

No certification or independent access-control assurance is claimed.
