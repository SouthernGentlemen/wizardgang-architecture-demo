# Data Register

**Reference:** WG-REG-007  
**Framework:** Integrated ISMS / AIMS data governance  
**Status:** Approved
**Owner:** Management-System Owner / Data Owner  
**Assessment date:** 2026-09-02  
**Review due:** 2026-12-02 for initial operating review, then at least annually and after material schema, storage, identity, supplier, retention, deletion, recovery, or AI/MCP change  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register identifies the material data stores and data surfaces used by the WizardGang Architecture Demo and records their purpose, classification, exposure boundary, retention/deletion expectations, recovery needs, and known gaps.

It is intentionally conservative. A field or table is not considered public, safely retained, automatically deleted, or AI-approved merely because a schema exists or an expiration timestamp is present.

The governing procedure is `docs/governance/DATA-GOVERNANCE.md`.

## 2. Status Values

- **Met** — the data-control expectation is implemented and supported by current evidence.
- **Partial** — useful controls/evidence exist but one or more material aspects remain unverified or incomplete.
- **Gap** — a required control/evidence item is materially missing.
- **N/A** — not applicable to the current scoped data surface, with rationale.

Status is an evidence posture, not a certification score.

## 3. Current Inventory Summary

| ID | Store / surface | Classification | Public exposure | MCP exposure | Retention / deletion posture | Status |
|---|---|---|---|---|---|---|
| DATA-001 | `demo_records` | PUBLIC / PUBLIC-DEMO | Yes, through approved app/API surfaces | **Yes — approved bounded source** | Persistent until controlled update/delete; provenance/freshness improvement pending | Partial |
| DATA-002 | `demo_events` | AUDIT-EVIDENCE | Bounded evidence may be exposed; raw event store is not inherently public | No | Evidence-oriented retention; no blanket pruning rule yet | Partial |
| DATA-003 | `application_logs` | OPERATIONAL / public-safe after sanitization | Yes, bounded sanitized viewer/API | No | Operational retention; explicit pruning baseline pending | Partial |
| DATA-004 | `service_health_checks` | OPERATIONAL | Yes, aggregate/bounded uptime views | No | Rolling operational history; pruning baseline pending | Partial |
| DATA-005 | `usage_snapshots` | OPERATIONAL / PUBLIC-DEMO | Yes, synthetic degradation evidence | No | Rolling demo evidence; no universal retention duration defined | Partial |
| DATA-006 | `cloudflare_usage_snapshots` | OPERATIONAL / provider-derived / public-safe after normalization | Yes, sanitized normalized view | No | Cached rolling snapshots; explicit pruning baseline pending | Partial |
| DATA-007 | `demo_sessions` | VISITOR-SCOPED | No global public exposure | No | `expires_at` exists; cleanup effectiveness requires verification | Partial |
| DATA-008 | `demo_users` | VISITOR-SCOPED / potentially identifying | Session-scoped only | No | Session-linked; cascade design exists; actual expiry cleanup verification pending | Partial |
| DATA-009 | `demo_tasks` | VISITOR-SCOPED | Session-scoped only | No | Session-linked; cascade design exists; actual expiry cleanup verification pending | Partial |
| DATA-010 | `demo_state` | VISITOR-SCOPED | Session-scoped only | No | Session-linked; cascade design exists; actual expiry cleanup verification pending | Partial |
| DATA-011 | `webhook_events` | OPERATIONAL / AUDIT-EVIDENCE | Only bounded/sanitized summaries where surfaced | No | Replay/evidence value; explicit retention/pruning baseline pending | Partial |
| DATA-012 | `webhook_receipts` | AUDIT-EVIDENCE / security replay metadata | Not intended for public raw exposure | No | Retain as needed for replay/evidence; pruning baseline pending | Partial |
| DATA-013 | `identity_sessions` | AUTH-SECURITY / encrypted payload | No | No | Expiry/revocation fields exist; cleanup/enforcement evidence pending | Partial |
| DATA-014 | `identity_saml_requests` | AUTH-SECURITY / replay state | No | No | Short-lived by purpose; cleanup enforcement evidence pending | Partial |
| DATA-015 | `identity_saml_assertions` | AUTH-SECURITY / replay state | No | No | Expiry exists; cleanup enforcement evidence pending | Partial |
| DATA-016 | R2 objects + `r2_object_metadata` | Varies by object set; PUBLIC-DEMO / VISITOR-SCOPED / CONFIDENTIAL possible | Only when explicitly routed | No by default | Object expiry/backup/deletion depends on set; restore/deletion evidence incomplete | Partial |
| DATA-017 | Git source, governance, tags, releases | PUBLIC + AUDIT-EVIDENCE | Yes by design | Not an MCP data source | Retained through Git/release history; superseded records remain reconstructable | Met |
| DATA-018 | Managed secret values | SECRET | No | No | Managed outside source/runtime public data; rotation/re-provisioning by authorized operator | Partial |

## 4. DATA-001 — Public Demo Records

**Store:** D1 `demo_records`  
**Classification:** PUBLIC / PUBLIC-DEMO  
**Owner:** Data Owner / AI Capability Owner  
**Purpose:** Shared demonstration records used by public application/API examples and the current MCP read capability.  
**Provenance:** Seeded/generated/demo-controlled records stored by namespace/key.  
**User-entered:** Not intended as a general personal-data store.  
**Public exposure:** Yes, where approved by application route/API behavior.  
**AI/MCP exposure:** **Yes. This is the only currently approved D1 data source for public MCP records.**

**Schema evidence:**

- `id`;
- `namespace`;
- `record_key`;
- `value_json`;
- `created_at`;
- `updated_at`.

**MCP output:** Current `list_demo_records` returns only:

- `id`;
- `namespace`;
- `key`;
- `valueJson`.

The server validates namespace syntax, queries by exact namespace, orders by key, and limits retrieval to 100 rows.

**Handling requirements:**

- only intentionally public/demo content belongs in MCP-accessible namespaces;
- `value_json` must not contain credentials, private identity data, payment data, private account metadata, or other sensitive content;
- returned text is treated as untrusted data, not trusted instruction;
- provenance/freshness limitations should be documented where interpretation depends on age/source;
- material field or namespace-boundary changes require data + AI review.

**Retention:** Persistent until controlled update/deletion; no universal expiry currently defined.

**Deletion:** Controlled record deletion/update behavior exists at application level where implemented; deletion testing and retention criteria are not yet comprehensive.

**Recovery:** D1 backup/restore controls remain incomplete pending `RT-001` and actual backup/export evidence.

**Known gaps:**

- full public-field/namespace allowlist evidence should be strengthened;
- sensitive-field exclusion tests remain planned;
- provenance/freshness metadata remains incomplete;
- persistent D1 restore evidence remains incomplete.

**Status:** Partial.

---

## 5. DATA-002 — Audit Event Stream

**Store:** D1 `demo_events`  
**Classification:** AUDIT-EVIDENCE  
**Owner:** Evidence / Security / Operations owners as applicable  
**Purpose:** Retain meaningful demo/control/governance event evidence separate from operational diagnostics.  
**Fields:** `demo_id`, `event_type`, optional `payload_json`, `created_at` plus identifier.

**Public exposure:** Selected/sanitized evidence may support public assurance, but the existence of the table does not make arbitrary payload content public.

**AI/MCP exposure:** No.

**Handling:**

- payloads must not contain passwords, tokens, cookies, authorization headers, secret values, or raw sensitive request bodies;
- record significant control/action evidence with bounded context;
- preserve distinction from `application_logs`.

**Retention:** Evidence-oriented; preserve long enough for traceability, incident review, audit, management review, releases, and corrective action. No blanket deletion period is yet established.

**Deletion:** Any pruning must preserve required traceability and must not erase unresolved incident/corrective-action evidence.

**Recovery:** D1 evidence loss is a material recovery concern under `SEC-RISK-007`.

**Status:** Partial — useful architecture exists; explicit retention/pruning and restore evidence remain incomplete.

---

## 6. DATA-003 — Application Logs

**Store:** D1 `application_logs`  
**Classification:** OPERATIONAL / public-safe after sanitization  
**Owner:** Operations / Security Owner  
**Purpose:** Explain runtime behavior through bounded application-generated diagnostics.  
**Fields:** level, source, event key, message, route, request ID, detail JSON, timestamp.

**Public exposure:** Yes through bounded sanitized log surfaces.

**AI/MCP exposure:** No.

**Required exclusions:**

- passwords;
- auth headers;
- cookies;
- bearer/API tokens;
- secret values;
- private identity payloads;
- payment/account identifiers not intentionally public;
- raw unreviewed request bodies;
- unrestricted user-entered content.

**Retention:** Rolling operational value; explicit pruning duration not yet formally baselined.

**Deletion:** Pruning mechanism/evidence requires further operating definition/testing.

**Status:** Partial — sanitization/bounded-view controls are strong; retention/deletion evidence remains incomplete.

---

## 7. DATA-004 — Service Health Checks

**Store:** D1 `service_health_checks`  
**Classification:** OPERATIONAL  
**Owner:** Operations Owner  
**Purpose:** Availability and dependency-health observations.  
**Public exposure:** Aggregate/bounded uptime and health views.  
**AI/MCP exposure:** No.

**Data includes:** service key, status, response time, detail JSON, check timestamp.

**Handling:** Detail fields must remain public-safe if surfaced.

**Retention:** Rolling measurement history; duration not yet standardized.

**Deletion:** Historical pruning may be appropriate once data no longer supports trend/assurance needs; mechanism/evidence pending.

**Status:** Partial.

---

## 8. DATA-005 — Synthetic Usage Snapshots

**Store:** D1 `usage_snapshots`  
**Classification:** OPERATIONAL / PUBLIC-DEMO  
**Owner:** Operations Owner  
**Purpose:** Demonstrate normal/warning/degraded cost behavior using controlled values.  
**Public exposure:** Yes as explicitly labeled demonstration data.  
**AI/MCP exposure:** No.

**Data includes:** service/metric key, quantity/unit, estimated cost, budget limit, timestamp.

**Handling:** Synthetic/estimated behavior must remain labeled and must not be represented as an invoice or provider-authoritative billed cost.

**Retention/deletion:** Rolling demo evidence; explicit pruning baseline pending.

**Status:** Partial.

---

## 9. DATA-006 — Cloudflare Usage Snapshots

**Store:** D1 `cloudflare_usage_snapshots`  
**Classification:** OPERATIONAL / provider-derived / public-safe after normalization  
**Owner:** Operations Owner / Supplier Owner  
**Purpose:** Cache normalized Cloudflare usage information without exposing provider credentials or private account/resource metadata.  
**Public exposure:** Yes, sanitized normalized values and freshness/status only.  
**AI/MCP exposure:** No.

**Schema:** status (`live`, `partial`, `unavailable`), source, normalized JSON, captured timestamp.

**Handling:** Public output excludes tokens, account/resource identifiers, account names, invoice/subscription IDs, payment data, and raw upstream error text.

**Retention/deletion:** Cached rolling history; explicit pruning period pending.

**Supplier dependency:** Cloudflare behavior/availability may affect freshness/completeness.

**Status:** Partial.

---

## 10. DATA-007 — Demo Sessions

**Store:** D1 `demo_sessions`  
**Classification:** VISITOR-SCOPED  
**Owner:** Application / Security Owner  
**Purpose:** Isolate interactive demo state.  
**Fields:** session ID, created, expires, last-seen timestamps.

**Public exposure:** No global/public listing. Session context may be represented to the owning browser/application flow.

**AI/MCP exposure:** No.

**Retention:** Session-bounded by design using `expires_at`.

**Deletion:** Child tables use foreign-key cascade in the schema, but the management system has not yet evidenced that expired session parents are cleaned on the intended cadence.

**Risk:** Stale sessions can retain visitor-scoped data longer than intended.

**Status:** Partial — expiration metadata/cascade design exists; operational cleanup verification pending.

---

## 11. DATA-008 — Demo Users

**Store:** D1 `demo_users`  
**Classification:** VISITOR-SCOPED / potentially identifying  
**Owner:** Application / Data Owner  
**Purpose:** Demonstrate CRUD/user/role behavior within an isolated demo session.  
**Fields:** user ID, session ID, `name`, `email`, role, timestamps.

**Public exposure:** Session-scoped only.

**AI/MCP exposure:** No.

**Important classification note:** `name` and `email` are potentially identifying if a visitor enters real values. The demo should not encourage entry of sensitive or real personal information merely to demonstrate CRUD behavior.

**Isolation:** Linked to `demo_sessions`; unique email is scoped to session.

**Retention/deletion:** Intended to end with session lifetime through cascade behavior. Actual expired-session cleanup must be tested.

**Logging:** Avoid copying full names/emails into public diagnostics unless explicitly justified and sanitized.

**Status:** Partial.

---

## 12. DATA-009 — Demo Tasks

**Store:** D1 `demo_tasks`  
**Classification:** VISITOR-SCOPED  
**Owner:** Application / Data Owner  
**Purpose:** Demonstrate session-scoped task CRUD/relationships.  
**Data:** task ID, session, optional assignee, title, status, timestamps.

**Public exposure:** Session-scoped only.  
**AI/MCP exposure:** No.

**Risk:** Visitors could enter identifying/sensitive text in a free-form title even though that is not the intended use.

**Retention/deletion:** Session-linked cascade design; expiry cleanup verification pending.

**Status:** Partial.

---

## 13. DATA-010 — Demo State

**Store:** D1 `demo_state`  
**Classification:** VISITOR-SCOPED  
**Owner:** Application / Data Owner  
**Purpose:** Persist session-scoped feature/demo state.  
**Data:** session ID, state key, JSON value, update timestamp.

**Public exposure:** Session-scoped only.  
**AI/MCP exposure:** No.

**Handling:** State values must not be used as a hidden store for credentials or private cross-user data.

**Retention/deletion:** Session-linked cascade; actual cleanup verification pending.

**Status:** Partial.

---

## 14. DATA-011 — Webhook Events

**Store:** D1 `webhook_events`  
**Classification:** OPERATIONAL / AUDIT-EVIDENCE  
**Owner:** Integration / Security Owner  
**Purpose:** Store bounded webhook event evidence for demo and GitHub webhook flows.  
**Data:** optional session, provider, delivery ID, event type/action, repository/actor metadata, summary JSON, payload SHA-256, signature-valid flag, timestamp.

**Public exposure:** Only sanitized/bounded summaries where intentionally surfaced.  
**AI/MCP exposure:** No.

**Handling:**

- raw signing secrets never stored;
- exact body may be used transiently for HMAC verification;
- retained record favors digest and bounded summary over full payload;
- repository/actor metadata must not be assumed non-sensitive in every future integration.

**Retention:** Enough for replay/security/evidence need; explicit pruning baseline pending.

**Status:** Partial.

---

## 15. DATA-012 — Webhook Receipts

**Store:** D1 `webhook_receipts`  
**Classification:** AUDIT-EVIDENCE / security replay metadata  
**Owner:** Security / Integration Owner  
**Purpose:** Track event type, unique delivery ID, payload digest, and received timestamp for verification/replay control.  
**Public exposure:** Not intended as a raw public surface.  
**AI/MCP exposure:** No.

**Retention:** Retain according to replay window and evidence need; exact duration/mechanism pending.

**Status:** Partial.

---

## 16. DATA-013 — Identity Sessions

**Store:** D1 `identity_sessions`  
**Classification:** AUTH-SECURITY / application-layer encrypted  
**Owner:** Security / Identity Owner  
**Purpose:** Retain protected validated identity-session state.  
**Data:** SHA-256 session identifier, encrypted payload, creation/expiry, optional revocation.

**Public exposure:** No.  
**AI/MCP exposure:** No.

**Handling:**

- encrypted payload remains restricted;
- ciphertext is not public data;
- session identifiers are stored as digests rather than raw values;
- expiry/revocation must be enforced server-side;
- raw tokens/assertions/cookies must not enter public logs/evidence.

**Retention/deletion:** Expiry/revocation metadata exists; physical cleanup schedule/effectiveness requires verification.

**Recovery:** Restore must preserve confidentiality and session invalidation semantics; secret keys required to interpret data remain outside source.

**Status:** Partial.

---

## 17. DATA-014 — SAML Request Replay State

**Store:** D1 `identity_saml_requests`  
**Classification:** AUTH-SECURITY  
**Owner:** Security / Identity Owner  
**Purpose:** Track SAML request state/replay handling.  
**Data:** request ID/value and creation timestamp.

**Public exposure:** No.  
**AI/MCP exposure:** No.

**Retention:** Short-lived by security purpose; cleanup enforcement must be verified.

**Status:** Partial.

---

## 18. DATA-015 — SAML Assertion Replay State

**Store:** D1 `identity_saml_assertions`  
**Classification:** AUTH-SECURITY  
**Owner:** Security / Identity Owner  
**Purpose:** Track validated assertion identifiers to prevent inappropriate replay.  
**Data:** SHA-256 assertion identifier, expiry, validation timestamp.

**Public exposure:** No.  
**AI/MCP exposure:** No.

**Retention:** Through relevant replay/expiry window, then eligible for cleanup. Cleanup effectiveness pending.

**Status:** Partial.

---

## 19. DATA-016 — R2 Objects and Metadata

**Store:** R2 + D1 `r2_object_metadata`  
**Classification:** Determined per object set; may be PUBLIC-DEMO, VISITOR-SCOPED, OPERATIONAL, or CONFIDENTIAL  
**Owner:** Storage / Data Owner  
**Purpose:** Demonstrate object storage and retain object metadata.

**Metadata includes:** object key, content type, size, updated timestamp/updater and, after interactive-demo migration, session ID, display name, and expiry metadata.

**Public exposure:** Only through explicitly authorized application routes.  
**AI/MCP exposure:** **No by default.**

**Requirements:**

- classify each material object set;
- do not assume bucket-wide public status;
- avoid sensitive object names/metadata in public diagnostics;
- session-linked objects must preserve visitor isolation;
- expiry metadata requires actual deletion behavior to be verified;
- non-reconstructable objects require backup/copy/export planning.

**Recovery:** R2 backup/restore remains incomplete pending real evidence.

**Status:** Partial.

---

## 20. DATA-017 — Repository and Governance Evidence

**Store:** GitHub repository, Git history, PRs, tags, releases, checked-in governance records  
**Classification:** PUBLIC + AUDIT-EVIDENCE  
**Owner:** Change / Evidence Owner  
**Purpose:** Source of truth for application code, controlled documentation, change history, releases, and a large portion of management-system evidence.

**Public exposure:** Yes by design.  
**AI/MCP exposure:** Not an application MCP data source.

**Handling:**

- secrets and private evidence excluded;
- revisions retained immutably through Git history;
- superseded governance versions remain reconstructable;
- release/tag identity supports source recovery and traceability.

**Retention:** Long-lived management-system/release history; history is intentionally not routinely deleted.

**Deletion:** Public-source corrections may remove current content but historical exposure must be considered; secret exposure requires incident/rotation response rather than relying on commit deletion alone.

**Status:** Met for repository-controlled history/traceability within current evidence scope; provider continuity remains a supplier/recovery consideration.

---

## 21. DATA-018 — Managed Secret Values

**Store:** Cloudflare/GitHub/provider-managed secret stores and authorized operator recovery sources; not public repository data  
**Classification:** SECRET  
**Owner:** Security / Operations Owner  
**Purpose:** Authentication, session signing, webhook verification, deployment, provider integrations, administration.

**Examples include:**

- admin password;
- API bearer secret;
- webhook signing secrets;
- session/signing secrets;
- GitHub workflow/dispatch tokens;
- Cloudflare API token;
- identity-provider credentials/signing material.

**Public exposure:** Never approved.  
**AI/MCP exposure:** Never approved.

**Handling:**

- values remain outside source;
- public documentation may identify secret names/purpose/scope but not values;
- public health/version/log/evidence surfaces must not return values;
- suspected exposure triggers incident review and rotation decision.

**Retention/deletion:** Driven by active need, rotation, revocation, provider capability, and recovery requirements. Exact values are intentionally not recorded in this public register.

**Recovery:** Re-provisioning ability must be maintained by authorized operator without publishing secret material.

**Status:** Partial — strong separation is evidenced; independent recoverability/rotation exercises for every credential are not claimed complete.

---

## 22. AI/MCP Approved Data Boundary

The current approved public MCP boundary is intentionally narrower than the data inventory.

### Approved

- `DATA-001` `demo_records`, only for intentionally public/public-demo content through the current validated/bounded tool behavior.
- connectivity metadata returned by `ping`.

### Not approved as MCP data sources

- `DATA-002` audit events;
- `DATA-003` application logs;
- `DATA-004` health history;
- `DATA-005` synthetic usage table;
- `DATA-006` provider usage cache;
- `DATA-007` through `DATA-010` visitor/session data;
- `DATA-011` and `DATA-012` webhook evidence;
- `DATA-013` through `DATA-015` identity/authentication data;
- `DATA-016` R2 objects/metadata by default;
- `DATA-018` secret values.

Codex and Claude remain the only approved AI/MCP provider/client families. Provider/client recognition does not alter these data permissions.

Any proposal to expose an additional data record class or store to MCP is a material change requiring the reassessment path in `docs/governance/DATA-GOVERNANCE.md`.

## 23. Initial Retention / Deletion Worklist

The following work remains required to strengthen current data-control status:

| Work item | Affected data | Expected evidence | Current state |
|---|---|---|---|
| Define/verify expired session cleanup | DATA-007–010 | Implementation + test showing expired session and dependent records handled as designed | Planned |
| Define/verify identity/replay cleanup | DATA-013–015 | Cleanup/enforcement logic + tests across expiry/revocation/replay windows | Planned |
| Define log/telemetry pruning baseline | DATA-003–006 | Documented cadence/basis + implementation/test where automated | Planned |
| Define webhook replay/evidence retention | DATA-011–012 | Retention basis + pruning/replay tests | Planned |
| Classify R2 object sets | DATA-016 | Object-set inventory/classification + exposure/expiry/backup rules | Planned |
| Evidence D1 backup/restore | D1 data generally | `RT-001` and actual backup/export/restore result | Planned |
| Evidence R2 backup/restore | DATA-016 | `RT-001` or successor technical restore result | Planned |
| Add MCP sensitive-field exclusion tests | DATA-001 | Automated evaluation/contract tests | Planned |
| Add provenance/freshness coverage | DATA-001 | Field/namespace documentation or metadata + evaluation | Planned |
| Test deletion from public/API/MCP views | Applicable records | Test proving deleted/expired data is not returned through active surfaces | Planned |

No item above is marked complete by approval of this register.

## 24. Review Triggers

This register must be updated when:

- a D1 migration adds or materially changes persistent data;
- a new R2 object class is introduced;
- user-entered or identity data changes;
- public/API/MCP output changes;
- logs or events retain new fields/content;
- a new supplier receives data;
- retention/deletion behavior changes;
- a backup/replica/export is introduced;
- a recovery test changes data assumptions;
- an incident reveals classification/exposure error;
- a new AI/MCP provider is proposed;
- or the MCP capability accesses any new store/data class.

## 25. Evidence

Primary evidence includes:

- `docs/governance/DATA-GOVERNANCE.md`;
- the migrations referenced in each data record;
- `src/api/mcp.ts`;
- `SECURITY.md`;
- `docs/OPERATIONS.md`;
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`;
- security and AI risk registers;
- recovery/incident/supplier records;
- and controlled repository/release history.

## 26. Current Posture

After approval, the major data stores, classifications, ownership, public exposure, AI/MCP boundary, retention principles, and deletion expectations are documented.

The strongest current data boundary is the explicit separation between public demo records and visitor/identity/secret data. The principal remaining operating gaps are verified cleanup, explicit retention baselines, D1/R2 restore evidence, R2 object-set classification, deletion testing, and expanded AI provenance/sensitive-field evaluation.

**Certification is not claimed.**
