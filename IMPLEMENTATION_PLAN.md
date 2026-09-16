# Assurance Assessment Implementation Plan

Status: **Active**

Scope: post-v0.23.0 replacement of the `/assurance` four-check presentation with a pass / partial / gap assessment of every ISO/IEC 27001:2022 and ISO/IEC 42001:2023 clause and Annex A control and every WCAG 2.2 Level A, AA, and AAA success criterion. Each requirement shows its canonical evidence, unchanged, and references the Markdown documentation that governs it. The sequence also closes two defects found during the review.

This file is the active planning source of truth for DEMO-282 through DEMO-293. Runtime route declarations, `assurance/registry.json` and its registered schemas, and permanent contract documents remain authoritative for shipped behavior. Retire or delete this plan after the sequence is released and its durable requirements have been absorbed by permanent contracts and tests.

## Context

v0.21.0 reduced `/assurance` to four bounded checks (DEMO-258). v0.22.0 turned `/demos` into a focused workbench and v0.23.0 consolidated the shell. Neither release touched assurance: `src/demos/assurance-minimal.ts`, `src/api/governance.ts`, `assurance/`, `contracts/assurance/`, and `docs/governance/` are unchanged between v0.21.0 and v0.23.0. The statuses behind the page come from the assessment dated 2026-09-02 and approved in PR #56, which first shipped in v0.10.0.

The four checks were meant to let a visitor verify assurance claims. Two of the three Run buttons observe nothing, the third is the only place two MCP negative cases are tested, and no ISO requirement references the governance documentation that covers it.

Measured against deployed v0.23.0 (`b617ed0`):

| Observation | Value |
|---|---|
| Requirements assessed in canonical data | `287` — ISO/IEC 27001: 34 clauses + 93 controls; ISO/IEC 42001: 36 clauses + 38 controls; WCAG 2.2: 86 criteria |
| Requirements a visitor can read on `/assurance` | `14` |
| Links in `/assurance` main content | `46` — 40 to JSON under `/api/reporting` (29 distinct), 5 in-page, 1 to `/security` |
| Links that open documentation | `0` |
| Distinct evidence targets behind all 287 requirements | `17` — 6 Markdown documents, none under `docs/governance/` |
| ISO/IEC 27001 records whose only linked document is `SECURITY.md` | `50` of 127 |
| Governance Markdown documents in `docs/governance/REFERENCE-REGISTRY.json` | `47` |
| ISO records referencing any of those documents | `0` of 201 |
| Applicable ISO records with a rationale | `0` of 174 |
| WCAG criteria missing from the page's WCAG posture | `52` of 86 |
| WCAG criteria whose implementation note is one of two templates | `52` of 86 |
| Manual accessibility procedures executed | `0` of 17 |
| Unreachable assurance page code kept alive by tests | `1,026` lines in 3 modules |

## Product goal

For every requirement, `/assurance` answers three questions:

1. **Status** — pass, partial, gap, or not applicable.
2. **Why** — one or two sentences, and what is missing when it is not a pass.
3. **Where to look** — the Markdown documentation that governs it, section by section, and the canonical evidence records behind it, both pinned to the deployed commit.

The visitor should experience `/assurance` as: **pick a framework, pick a requirement, read why, open the documentation.**

**Evidence stays in JSON; documentation is Markdown.** The canonical evidence records in `assurance/evidence/evidence.json` and every compliance record's `evidence` relationships stay as they are, and they remain the evidence the page shows. Each requirement also references the Markdown documentation — a policy, procedure, register, or record section — that describes how it is met. The Run buttons are retired: a check that observes nothing is neither evidence nor documentation.

## Findings this sequence closes

Findings are grouped by class. `CHECK` is a Run button that does not work as an assurance check. `DOCUMENTATION` is a requirement that does not say why it has its status or where it is documented. `MISREPORT` is presentation that misstates posture. `DEAD` code is unreachable. `DRIFT` is a document that disagrees with reality. `CALIBRATION` is a status that its support does not justify. `DEFECT` is a live bug found during the review outside the assurance surface.

### CHECK — the Run buttons are not assurance checks

- **F1.** `Run security-control check` calls `GET /api/labs/governance-security-controls`. `securityControlsResponse()` in `src/api/governance.ts` returns the statements of the seven claim records linked to ISO/IEC 27001, each with its first evidence file: `SECURITY.md` twice, `.github/workflows/ci.yml` twice, `docs/OPERATIONS.md` twice, and `docs/CHANGE-MANAGEMENT.md` once. It names no Annex A control and observes no runtime or repository state; every request to a given deployment returns the same content.
- **F2.** `Run AI boundary evaluation` calls `POST /api/labs/governance-ai-evaluation`, which does run three MCP cases: an approved read, an unknown method, and an invalid namespace. Nothing else tests the two negative cases: the only assertions are in `tests/governance.test.ts`, against this endpoint. Evidence record `EVD-TST-001` describes `tests/mcp-client.test.ts` as covering "allowed reads, unknown methods, invalid scope, and prohibited writes"; that file has four tests, and none covers an unknown method, an invalid scope, or a write. Each anonymous POST also appends an `application_logs` row and a `demo_events` row, and nothing prunes `demo_events`.
- **F3.** `Inspect live traceability` calls `GET /api/labs/governance-traceability`, which returns a hardcoded list of seven stage names, links to the repository's Actions and Releases index pages rather than to any run or release, and the twenty most recent `demo_events` rows from unrelated demonstrations. It traces no requirement to anything.

### DOCUMENTATION — no requirement says where it is documented

- **F4.** The only document reachable from an ISO/IEC 27001 record is its single evidence target, one of seven files. For 50 records, including the supplier controls A.5.19–A.5.23, that document is `SECURITY.md`, which never mentions suppliers.
- **F5.** No ISO record references a governance document. All 34 ISO/IEC 27001 clause records reach a document other than the one WG-GOV-028 §7 names as governing: 4.1 reaches `SECURITY.md` instead of `CONTEXT.md`, and 9.3 reaches `docs/OPERATIONS.md` instead of `MANAGEMENT-REVIEW.md`. ISO/IEC 42001 A.2.2 (AI policy) reaches `SECURITY.md` instead of `AI-POLICY.md`, and none of the impact-assessment controls A.5.2–A.5.5 reaches `MCP-AI-IMPACT-ASSESSMENT.md`.
- **F6.** No applicable ISO record has a rationale: 0 of 102 for ISO/IEC 27001 and 0 of 72 for ISO/IEC 42001. Both schemas require a rationale only for `not-applicable`. Nothing in the repository says why 93 ISO/IEC 27001 records are `partial` rather than `met` or `gap`.
- **F7.** The 86 WCAG criteria reach five fixed combinations of five files. The 29 `partial` rows share one templated note ("Related shared UI support exists for …"), and the 23 `gap` rows share another. The 16 `demonstrated` rows describe the teaching lab at `/demos#accessibility`, not the site. All 17 procedures in `docs/accessibility-manual-verification.json` are pending.

### MISREPORT — the page misstates posture

- **F8.** All 40 record and evidence links on the page open JSON, and none opens documentation. Evidence appears only as record IDs such as `EVD-DOC-003`, and the record behind that ID shows its location, `SECURITY.md`, as text rather than a link.
- **F9.** The WCAG badge renders only the `demonstrated` and `not-observed` counts: "16 demonstrated · 18 not observed". The 29 `partial` and 23 `gap` criteria, 60% of the framework, appear nowhere on the page.
- **F10.** The ISO badges count clauses and controls together and omit `not-applicable` without saying so. "3 met · 93 partial · 6 gap" covers 102 of 127 ISO/IEC 27001 records; WG-SOA-001 reports the same data as 93 controls: 3 met, 62 partial, 3 gap, 25 N/A.
- **F11.** "Focused evidence" shows the first records in file order: ISO/IEC 27001 clauses 4.1–4.4, ISO/IEC 42001 clauses 4.1–4.4, and WCAG 1.1.1 and 1.2.1–1.2.5. Five of the six WCAG rows are about media the site does not have.
- **F12.** The Statements of Applicability, `docs/governance/soa/ISO-27001-SOA.md` and `docs/governance/soa/ISO-42001-SOA.md`, contain a counts table and no per-control rows. The only human-readable SoA records no applicability decision, justification, status, or evidence for any control.

### DEAD — the pre-DEMO-258 page survives through tests

- **F13.** `src/demos/assurance.ts` (638 lines), `src/demos/assurance-workbench-renderers.ts` (241), and `src/demos/assurance-delivery.ts` (147) are unreachable; `assurance.index` renders `src/demos/assurance-minimal.ts`. Six test files import `assuranceIndexContent`, and `tests/reporting-final-audit.test.ts` and `tests/reporting-unified-presentation.test.ts` assert on the text of `assurance.ts`. Together they pin 1,026 dead lines in place.

### DRIFT — the documentation the page will reference is stale

- **F14.** WG-GOV-028 §10–§11 lists `/operations`, `/operations#availability`, `/operations#activity`, and `/operations#usage` as evidence routes, all retired by DEMO-259, and §3, §9, and §11 still describe the four `/assurance` check anchors. `CONTINUITY-RESILIENCE.md`, `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`, and `registers/OBJECTIVES.md` also cite `/operations`.
- **F15.** WG-GOV-028 §18 records GitHub branch protection as unverified. It can be verified: on 2026-09-16 the GitHub API reports `main` as unprotected with no rulesets, and of 227 merged pull requests, one has a review and none was merged by anyone other than its author. A.8.25 and A.8.32 are marked `met`.

### CALIBRATION — statuses their support does not justify

- **F16.** None of the five `met` records is supported by a record of the control operating. ISO/IEC 27001 A.8.15 reaches one source file. A.8.25 and A.8.32 reach only `docs/CHANGE-MANAGEMENT.md`, despite F15. ISO/IEC 42001 A.6.2.8 reaches three source files, and A.9.4 reaches a test file that does not test it (F2).
- **F17.** Operating records that exist go unreferenced, and the records that most passes would need do not exist yet. No compliance record references the 41 release records under `docs/releases/`, `SECURITY-TESTING-REGISTER.md`, or `SECURITY-MAINTENANCE-REGISTER.md`. The access review AR-001, recovery test RT-001, incident exercise EX-001, and awareness cycle AW-001–AW-007 are all `Planned` for 2026-12-02, and the initial competence and supplier reviews are still pending.

### DEFECT — found during the review, outside assurance

- **F18.** Public responses expose identity audit values. `GET /api/operations/logs?source=identity` and `GET /api/labs/governance-traceability` return identity events carrying `subjectSha256`, which `src/api/identity.ts` computes as an unkeyed SHA-256 of the provider and subject, and `src/lib/identity-session.ts` derives sandbox namespaces the same way. An unkeyed hash of an identity-provider account identifier is not anonymous.
- **F19.** On production, the Users table at `/demos#d1` shows `@@WG_I18N_BLOCK_4@@` in place of every email address. `localizeBody()` in `src/i18n/presentation.ts` protects `<code>` blocks before `<script>` blocks, so the `'<code>' + escape(user.email) + '</code>'` literal in the D1 client script becomes a placeholder inside a protected script, and the single-pass restore never replaces it.

## Assessment rubric

DEMO-285 makes this rubric WG-GOV-028 §13. It applies to all three frameworks.

| Status | Meaning | The record must carry |
|---|---|---|
| **Pass** | Implemented across the declared scope, documented in Markdown, and supported within its review interval by something that shows it operating: a canonical evidence record or a dated review, exercise, register entry, release record, or evaluation. No nonconformity is open against it. | Rationale; at least one Markdown documentation reference |
| **Partial** | Documented or implemented, but at least one part is missing: never operated, incomplete scope, unverified, stale, or weakened by a known gap such as a process that nothing enforces. | Rationale; what is missing; at least one Markdown documentation reference |
| **Gap** | Not implemented, not documented, or evaluated as failing. | Rationale; what is missing |
| **N/A** | ISO Annex A: excluded in `docs/governance/SCOPE.md` with a justification and a reassessment trigger. WCAG: no content of that type exists in the evaluated scope. Clauses 4–10 are never N/A. | Rationale; the documentation reference that records the exclusion or the content check |

- A requirement that implies recurring activity is at most `partial` until a record shows the activity happened.
- A governing document — a policy, procedure, standard, or register — may be referenced only for the requirements its Alignment section names. Dated records such as release records, SoAs, and assessment or evaluation reports are exempt, and historical records are never edited to comply.
- No status comes from a count, a green CI run on its own, or the existence of an evidence record by itself.
- Evidence records and `evidence` relationships are never changed to support a status.
- A WCAG pass is a self-evaluated result for the evaluated scope. It is not a conformance claim at any level. No status on this site is a certification.
- N/A is counted separately and never folded into pass. W3C treats a criterion with no applicable content as satisfied; the page shows it as N/A so that the pass count reflects content that was actually evaluated.

ISO scope is `docs/governance/SCOPE.md`. WCAG scope is every public HTML page and every state declared in `config/site-audit-states.json`, in English and Arabic.

## Target page composition

Illustrative layout; the statuses and text below are placeholders, not assessment results.

```
Assurance
Self-assessed status for every ISO/IEC 27001 and 42001 requirement and every
WCAG 2.2 success criterion, with its documentation and evidence. Not certified.

 ISO/IEC 27001    ISO/IEC 42001    WCAG 2.2
 ‾‾‾‾‾‾‾‾‾‾‾‾‾
 (A.5 Organizational 37) (A.6 People 8) (A.7 Physical 14)
 (A.8 Technological 34) (Clauses 4–10 34)

 A.5: PASS n · PARTIAL n · GAP n · N/A n      ISO/IEC 27001: PASS n · PARTIAL n · …

 A.5.1 ✓  A.5.2 ◐  A.5.3 ◐  A.5.4 ✕  A.5.5 ◐  …  A.5.19 ◐  …  A.5.37 ◐

+-----------------------------------------------+---------------------------+
| ISO/IEC 27001:2022 / ANNEX A / ORGANIZATIONAL | [Documentation] Evidence  |
| A.5.19  Supplier security governance  PARTIAL |                           |
|                                               | SUPPLIER-AND-EXTERNAL-    |
| Assessment                                    |   SERVICE-MANAGEMENT.md   |
| Supplier policy, classification, and a        |   § 4 Supplier            |
| register of six suppliers exist.              |   classification ↗        |
|                                               |                           |
| What is missing                               | SUPPLIER-REGISTER.md      |
| The initial supplier review due 2026-12-02    |   § 3 Current supplier    |
| has not been recorded.                        |   summary ↗               |
|                                               |                           |
| Assessed <date> · WG-SOA-001 ↗                |                           |
+-----------------------------------------------+---------------------------+
| Link to this requirement · Open assessment record ↗                       |
+---------------------------------------------------------------------------+
```

- **Framework tabs:** ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2, using the same tab-link pattern as the `/demos` category tabs. There is no `All frameworks` view.
- **Section selector:** ISO/IEC 27001 has A.5 Organizational, A.6 People, A.7 Physical, A.8 Technological, and Clauses 4–10. ISO/IEC 42001 has Annex A and Clauses 4–10. WCAG 2.2 has Level A, Level AA, and Level AAA. Each shows its record count.
- **Posture:** pass, partial, gap, and N/A counts for the selected section and for the framework. All four always appear, are derived from data, and sum to the total.
- **Record grid:** one link per requirement, showing its reference and its status as text or a glyph, never as color alone, with `aria-current` on the selection.
- **Focused record pane:** context, reference, paraphrased title, and status; **Assessment** (the rationale); **What is missing** (for partial and gap); **Assessed** (date, with a link to the requirement's row in its SoA or in the WCAG evaluation report).
- **Inspector:** **Documentation** lists Markdown references, labelled from path and anchor. **Evidence** lists the record's canonical evidence as it is today: title, kind, and freshness, with a link to the evidence location resolved through `presentEvidence()` and a link to the evidence record. Both modes pin links to the deployed commit. Like the `/demos` inspector, it drops to one mode when a record has nothing for the other.
- **Tools:** link to this requirement, and open its assessment record.
- **Deep links:** the existing public record IDs, for example `/assurance#ISO27001-A.5.19`, `/assurance#ISO42001-A.9.4`, and `/assurance#WCAG-2.4.7`. `/assurance` without a valid fragment selects ISO/IEC 27001 A.5.1.
- **Loading:** the grids for all three frameworks are server-rendered. Record panes load lazily from a presentation route that mirrors `demos.presentation`. The Worker never reads Markdown at runtime.
- **Without JavaScript:** `<noscript>` links to the two SoAs and the WCAG evaluation report, which carry every row.

Removed: the four `assurance-check` sections, the Run buttons and their JSON output, the claim and traceability cards, and the "Focused evidence" samples.

## Target data contract

JSON stays as it is for evidence. The canonical evidence records and each compliance record's `evidence` relationships are unchanged by this sequence. The per-requirement data that drives the page also stays in the registered compliance datasets, because the registry, schemas, lifecycle approvals, reporting API, and validators already govern it. What changes is what a compliance record says and the documentation it references.

- All compliance datasets share one status vocabulary: `pass`, `partial`, `gap`, `not-applicable`. The values `met`, `demonstrated`, and `not-observed` are retired.
- Every record carries a `rationale`, and `partial` and `gap` records carry non-empty `gaps`.
- A documentation reference is a `documentation` relationship whose target is a repository-relative `.md` path plus a GitHub heading anchor, for example `docs/governance/registers/SUPPLIER-REGISTER.md#3-current-supplier-summary`.
- The generated SoAs gain one row per clause and control: reference, title, applicability, status, rationale, what is missing, documentation references, and evidence. WCAG results go in a dated evaluation report under `docs/governance/assessments/` that lists all 86 criteria.
- Every referenced governing document has an Alignment section, added where missing, with a `Controls:` line naming the references it documents. This line is the one mapping that Markdown restates, so CI checks it in both directions: for each documentation reference, the file exists, the anchor matches a heading, and a governing document's `Controls:` line names the record; for each reference a `Controls:` line names, the record references that document. Validation reads headings and `Controls:` lines, never status.

## Starting documentation map

These tables compare the documents reachable from each record today, through its evidence, with the Markdown documentation that governs the same requirements, taken from WG-GOV-028 and the documents themselves. Reassessment verifies each row section by section and may change it. Evidence relationships stay as they are.

### ISO/IEC 27001:2022

| Requirements | Reachable today through evidence | Governing Markdown documentation |
|---|---|---|
| Clauses 4–10 | `SECURITY.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/OPERATIONS.md`, `ci.yml`, `/security` | The document WG-GOV-028 §7 names for each clause |
| A.5.1 | `SECURITY.md` | `INFORMATION-SECURITY-POLICY.md` |
| A.5.2–A.5.4 | `SECURITY.md` | `ROLES-RESPONSIBILITIES.md`, `LEADERSHIP.md` |
| A.5.5–A.5.7 | `SECURITY.md` | `VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`, `SECURITY-MAINTENANCE-REGISTER.md` |
| A.5.8 | `docs/CHANGE-MANAGEMENT.md` | `SECURE-ENGINEERING-TESTING.md` |
| A.5.9–A.5.11 | `SECURITY.md` | `ASSET-ACCESS-ACCEPTABLE-USE.md`, `ASSET-ACCESS-REGISTER.md` |
| A.5.12–A.5.14 | `SECURITY.md` | `DATA-GOVERNANCE.md`, `DATA-REGISTER.md` |
| A.5.15–A.5.18 | `src/lib/authorization.ts` | `ASSET-ACCESS-ACCEPTABLE-USE.md`, `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`, `docs/IDENTITY.md` |
| A.5.19–A.5.23 | `SECURITY.md` | `SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`, `SUPPLIER-REGISTER.md` |
| A.5.24–A.5.28 | `SECURITY.md` | `INCIDENT-MANAGEMENT.md`, `INCIDENT-REGISTER.md` |
| A.5.29–A.5.30 | `docs/OPERATIONS.md` | `CONTINUITY-RESILIENCE.md`, `BACKUP-RECOVERY-RESTORE.md`, `RECOVERY-TEST-REGISTER.md` |
| A.5.31–A.5.34 | `SECURITY.md` | `LEGAL-CONTRACTUAL-IP-PRIVACY.md`, `OBLIGATIONS-REGISTER.md` |
| A.5.35–A.5.36 | `ci.yml` | `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` |
| A.5.37 | `ci.yml` | `OPERATIONAL-PLANNING-CONTROL.md`, `docs/RELEASE-MANAGEMENT.md` |
| A.6.1–A.6.2, A.6.4–A.6.7 | `SECURITY.md` | `SCOPE.md`, `ROLES-RESPONSIBILITIES.md` |
| A.6.3 | `SECURITY.md` | `COMPETENCE-AWARENESS-COMMUNICATION.md`, `COMPETENCE-AWARENESS-REGISTER.md` |
| A.6.8 | `/security` | `SECURITY.md`, `INCIDENT-MANAGEMENT.md` |
| A.7.1–A.7.14 | `docs/OPERATIONS.md` | `SCOPE.md`, `SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`, `SUPPLIER-REGISTER.md` |
| A.8.1, A.8.7 | `SECURITY.md`, `ci.yml` | `VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`, `ASSET-ACCESS-ACCEPTABLE-USE.md` |
| A.8.2–A.8.5, A.8.18 | `src/lib/authorization.ts`, `docs/CHANGE-MANAGEMENT.md` | `ASSET-ACCESS-ACCEPTABLE-USE.md`, `docs/IDENTITY.md`, `SECURITY.md` |
| A.8.6 | `docs/OPERATIONS.md` | `OPERATIONAL-PLANNING-CONTROL.md` |
| A.8.8 | `ci.yml` | `VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`, `SECURITY-MAINTENANCE-REGISTER.md`, release records |
| A.8.9, A.8.19 | `ci.yml`, `docs/CHANGE-MANAGEMENT.md` | `CONFIGURATION-BASELINE-DRIFT.md`, `CONFIGURATION-REGISTER.md` |
| A.8.10–A.8.12 | `SECURITY.md`, `src/lib/logs.ts` | `DATA-GOVERNANCE.md`, `SECURITY.md` |
| A.8.13–A.8.14 | `docs/OPERATIONS.md` | `BACKUP-RECOVERY-RESTORE.md`, `CONTINUITY-RESILIENCE.md`, `RECOVERY-TEST-REGISTER.md` |
| A.8.15–A.8.17 | `src/lib/logs.ts`, `docs/OPERATIONS.md` | `docs/OPERATIONS.md`, `MONITORING-MEASUREMENT-EVALUATION.md`, `OPERATIONAL-PLANNING-CONTROL.md` |
| A.8.20–A.8.23 | `src/lib/authorization.ts`, `docs/OPERATIONS.md`, `SECURITY.md` | `docs/ARCHITECTURE-STANDARD.md`, `CONFIGURATION-BASELINE-DRIFT.md`, `SCOPE.md` |
| A.8.24 | `SECURITY.md` | `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`, `CRYPTOGRAPHY-SECRETS-REGISTER.md` |
| A.8.25–A.8.29 | `docs/CHANGE-MANAGEMENT.md`, `ci.yml`, `SECURITY.md` | `SECURE-ENGINEERING-TESTING.md`, `SECURITY-TESTING-REGISTER.md`, release records |
| A.8.30 | `docs/CHANGE-MANAGEMENT.md` | `SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`, `SUPPLIER-REGISTER.md` |
| A.8.31–A.8.32 | `docs/CHANGE-MANAGEMENT.md` | `CONFIGURATION-BASELINE-DRIFT.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`, release records |
| A.8.33–A.8.34 | `SECURITY.md`, `ci.yml` | `DATA-GOVERNANCE.md`, `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` |

### ISO/IEC 42001:2023

| Requirements | Reachable today through evidence | Governing Markdown documentation |
|---|---|---|
| Clauses 4–10 | `SECURITY.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/OPERATIONS.md`, `ci.yml`, `src/api/mcp.ts`, `tests/mcp-client.test.ts`, `/security#non-security-feedback` | The document WG-GOV-028 §8 names for each clause |
| A.2 Policies | `SECURITY.md`, `docs/CHANGE-MANAGEMENT.md` | `AI-POLICY.md`, `LEADERSHIP.md` |
| A.3 Internal organization | `SECURITY.md`, `/security#non-security-feedback` | `ROLES-RESPONSIBILITIES.md`, `COMPETENCE-AWARENESS-COMMUNICATION.md` |
| A.4 Resources | `SECURITY.md`, `docs/OPERATIONS.md`, `src/api/mcp.ts`, `tests/mcp-client.test.ts` | `ASSET-ACCESS-REGISTER.md`, `DATA-GOVERNANCE.md`, `CONFIGURATION-BASELINE-DRIFT.md`, `SUPPLIER-REGISTER.md` |
| A.5 Impact assessment | `SECURITY.md`, `docs/CHANGE-MANAGEMENT.md`, `tests/mcp-client.test.ts`, `/security#non-security-feedback` | `MCP-AI-IMPACT-ASSESSMENT.md`, `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md`, `AI-RISK-REGISTER.md` |
| A.6 Lifecycle | `docs/CHANGE-MANAGEMENT.md`, `docs/OPERATIONS.md`, `docs/RELEASE-MANAGEMENT.md`, four source files, `tests/mcp-client.test.ts` | `AI-POLICY.md`, `SECURE-ENGINEERING-TESTING.md`, `SECURITY-TESTING-REGISTER.md`, release records |
| A.7 Data | `src/api/mcp.ts`, `src/lib/audit.ts`, `tests/mcp-client.test.ts` | `DATA-GOVERNANCE.md`, `DATA-REGISTER.md`, `SCOPE.md` |
| A.8 Information for interested parties | `SECURITY.md`, `src/api/mcp.ts`, `/security`, `/security#non-security-feedback` | `AI-POLICY.md`, `INCIDENT-MANAGEMENT.md`, `MCP-AI-IMPACT-ASSESSMENT.md` |
| A.9 Use | `docs/OPERATIONS.md`, `src/api/mcp.ts`, `src/lib/authorization.ts`, `tests/mcp-client.test.ts` | `AI-POLICY.md`, `MCP-AI-IMPACT-ASSESSMENT.md`, `registers/OBJECTIVES.md` |
| A.10 Third parties | `SECURITY.md`, `docs/OPERATIONS.md`, `/security#non-security-feedback` | `SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`, `SUPPLIER-REGISTER.md`, `OBLIGATIONS-REGISTER.md` |

## Boundaries and non-goals

This sequence must not:

- change the canonical evidence records or any compliance record's `evidence` relationships;
- add a public page route; the record presentation route is a fragment API like `demos.presentation`;
- add an `All frameworks` view, render every record's detail at once, or restore risk, incident, exercise, supplier, objective, or register inventories as page sections; those documents appear only as documentation references;
- claim certification or conformance at any WCAG level;
- set a status without a rationale, or pass a requirement that implies recurring activity on the strength of a policy alone;
- create, backdate, or simulate an operating record; a review, exercise, audit, or accessibility test that did not happen stays missing;
- reproduce normative ISO text; control titles stay short original paraphrases;
- remove the `/api/reporting` contract or any of its collections; compliance status values change once, in DEMO-285, as an explicit contract change;
- retire the `claims` dataset, which loses its last page consumer here but is still a reporting collection and needs its own controlled change;
- extract shared workbench code from `/demos`, whose acceptance tests assert on the text of `src/demos/demos-page.ts`; that extraction is a separate change;
- change `/demos`, the shell, or primary navigation, apart from the DEMO-292 localization fix;
- fix accessibility defects outside `/assurance`.

## Delivery sequence

Changes are sequential and should normally branch from the latest merged `main`. Do not consume a later reserved ID before the prior controlled change is merged unless the work is intentionally stacked and its base is explicit.

### DEMO-282 — DOCS — Define assurance assessment plan

- create this active root implementation plan;
- bind `AGENTS.md` to it while active, including the documentation rule;
- reserve DEMO-283 through DEMO-293;
- change no runtime, route, or data.

### DEMO-283 — REFACTOR — Remove the unreachable assurance page modules

Pure deletion. `/assurance` markup is unchanged; only the stylesheet shrinks.

- delete `src/demos/assurance.ts`, `src/demos/assurance-workbench-renderers.ts`, and `src/demos/assurance-delivery.ts`;
- in the six test files that import `assuranceIndexContent`, keep the data and API assertions and delete the assertions that exist only to render the dead page;
- remove the source-text assertions on `assurance.ts` from `tests/reporting-final-audit.test.ts` and `tests/reporting-unified-presentation.test.ts`;
- remove stylesheet rules that styled only the deleted markup, keeping `npm run validate:stylesheet-classes` green.

Closes F13.

### DEMO-284 — REFACTOR — Retire the governance laboratory checks

- add the unknown-method, invalid-namespace, and write-tool cases to `tests/mcp-client.test.ts` before anything is removed, so the MCP boundary keeps its negative coverage; this makes the existing `EVD-TST-001` description accurate without changing the record;
- retire `platform.governance.security-controls`, `platform.governance.ai-evaluation`, and `platform.governance.traceability` to the ordinary 404 with no alias, and add their pathnames to `tests/fixtures/removed-api-pathnames.ts`; this also closes one of the two public paths in F18;
- delete `src/api/governance.ts` and `src/platform/route-capabilities/governance.ts`; keep the deployed-commit URL assertions from `tests/governance.test.ts` as tests of `presentEvidence()` and delete the rest;
- remove the Run buttons, the `<pre>` output, and the action script from `/assurance`;
- run `npm run generate:routes` and commit `docs/ROUTES.md` and `docs/route-manifest.json`.

Closes F1, F2, F3.

### DEMO-285 — API — Define the assessment and documentation reference contract

- replace the compliance status vocabularies with `pass`, `partial`, `gap`, and `not-applicable` in the ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 schemas, the reporting contract, and the derived filter vocabularies;
- map current values mechanically — `met` to `pass`, `demonstrated` to `partial`, `not-observed` to `not-applicable` — as a vocabulary change only; DEMO-287 through DEMO-289 reassess every status before release;
- add `rationale` and `gaps` to every compliance schema and the `documentation` relationship to the relationship contract, resolved to the deployed commit; they are optional until DEMO-290 makes them required;
- add the documentation validator described in *Target data contract*;
- leave `assurance/evidence/evidence.json` and every `evidence` relationship unchanged;
- make the rubric WG-GOV-028 §13, and update `docs/ASSURANCE.md`, the status vocabulary in `docs/ACCESSIBILITY.md`, and the assurance editing workflow in `CONTRIBUTING.md`, which must say that validation reads Markdown headings and `Controls:` lines but never takes status from Markdown;
- keep `/assurance` rendering with the new vocabulary until DEMO-286 replaces the page;
- regenerate the SoA summaries and refresh the lifecycle source approvals for the changed datasets.

Closes no finding on its own; DEMO-286 through DEMO-289 depend on it.

### DEMO-286 — FEAT — Build the assurance workbench

- replace the four-check page with the composition in *Target page composition*, in its own module with styles injected through `headExtra` as `/demos` does;
- add `assurance.presentation` at `/api/assurance/{record}`, returning one record pane as an HTML fragment, cacheable for the deployed commit, and returning 404 for unknown IDs; run `npm run generate:routes` and commit both artifacts;
- present each record's evidence records as they are, with resolved location links, instead of bare record IDs;
- while a record has no documentation reference, say so in its Documentation mode; do not infer references;
- pin every documentation and evidence link to the deployed commit, never a branch;
- mark record content `lang="en"` in localized views, and add every new interface string to the presentation catalog in all six locales;
- follow the DEMO-270 contract for keyboard selection, focus, back and forward history, locale changes, loading and error announcements, and narrow layouts;
- add representative `/assurance` states to `config/site-audit-states.json`;
- remove the stylesheet rules for every removed element in the same change;
- update the `assurance.index` route summary, `README.md`, `docs/FRONTEND-ROUTES.md`, `docs/ACCESSIBILITY.md`, and `docs/EVIDENCE.md`;
- record `/assurance` HTML bytes before and after in the controlled record.

Closes F8, F9, F10, F11.

### DEMO-287 — DOCS — Reassess ISO/IEC 27001:2022

Assess all 34 clauses and 93 Annex A controls against the rubric, starting from the documentation map.

- give every record a status, a rationale, gaps where required, and Markdown documentation references; leave its evidence relationships as they are;
- add a `Controls:` line to the Alignment section of every referenced governing document, adding the section where it is missing;
- regenerate WG-SOA-001 with one row per clause and control, and date the assessment;
- fix the drift before referencing it: remove the retired `/operations` evidence routes from WG-GOV-028 §10–§11, `CONTINUITY-RESILIENCE.md`, `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`, and `registers/OBJECTIVES.md`; replace the four-check anchors in §3, §9, and §11; record the verified branch-protection and review state in §18 and `CONFIGURATION-REGISTER.md`;
- assess clauses 4.1 and 4.2 against ISO/IEC 27001:2022/Amd 1:2024, whose climate-change consideration `CONTEXT.md` and `INTERESTED-PARTIES.md` do not address;
- re-examine the A.8.30 exclusion, whose own rationale mentions AI assistance in development;
- record the reassessment as the dated self-assessment that `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` §4.2 defines, and do not present it as an independent internal audit;
- create no operating record; a control that waits on AR-001, RT-001, EX-001, AW-001–AW-007, or a supplier review stays `partial` or `gap` and names that record as what is missing;
- refresh the dataset's lifecycle source approval.

Closes F14, F15, and the ISO/IEC 27001 parts of F4, F5, F6, F12, F16, F17.

### DEMO-288 — DOCS — Reassess ISO/IEC 42001:2023

Assess all 36 clauses and 38 Annex A controls the same way.

- reference `AI-POLICY.md`, `MCP-AI-IMPACT-ASSESSMENT.md`, `AI-RISK-REGISTER.md`, `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md`, and the Codex and Claude supplier records where they govern;
- record the MCP boundary tests from DEMO-284 in `SECURITY-TESTING-REGISTER.md`, and reference that row for A.6.2.4 and A.9.4;
- add ISO/IEC 42001 references to the `Controls:` line of every referenced governing document;
- regenerate WG-SOA-002 with one row per clause and control, and date the assessment;
- refresh the dataset's lifecycle source approval.

Closes the ISO/IEC 42001 parts of F5, F6, F12, F16, F17.

### DEMO-289 — A11Y — Evaluate WCAG 2.2 and record the results

Evaluate the release candidate, including the new `/assurance` workbench, against all 86 Level A, AA, and AAA criteria.

- follow W3C WCAG-EM: define scope from route declarations and `config/site-audit-states.json`; run the Chromium and axe harness; run scripted checks for reflow at 320 CSS pixels, 200% and 400% zoom, text spacing, target size, computed contrast, focus visibility and obscuring, keyboard traps, reduced motion, and forced colors; review headings, link purpose, language of parts, unusual words, abbreviations, and reading level by hand;
- write a dated evaluation report under `docs/governance/assessments/`, registered in `REFERENCE-REGISTRY.json`, with a result, the pages and states checked, and the method for every criterion, and with the evaluator named;
- record each manual procedure actually executed in `docs/accessibility-manual-verification.json`, which stays the evidence record for manual checks;
- record screen-reader results only for testing actually performed with real assistive technology; criteria that depend on it stay `partial` until then;
- give every WCAG record a status, a rationale, gaps where required, and documentation references into the report;
- fix defects found on `/assurance`, which this sequence built; record defects elsewhere as `gap` or `partial` with the observed failure;
- run `npm run test:site-accessibility`, `npm run validate:site-accessibility`, and `npm run validate:wcag`.

Closes F7 and the WCAG part of F9.

### DEMO-290 — TEST — Enforce assurance assessment acceptance

Lock the contract so this sequence cannot silently regress:

- no compliance record uses `met`, `demonstrated`, or `not-observed`;
- every record carries a rationale, `partial` and `gap` records carry gaps, `pass`, `partial`, and `not-applicable` records carry at least one documentation reference, and no clause is `not-applicable`;
- every documentation reference resolves to a Markdown file and heading, and `Controls:` lines agree in both directions;
- `/assurance` contains no `assurance-check` section and no Run control — the assertion that would have caught F1;
- every record pane links the record's documentation references and presents its evidence records with resolved locations — the assertion that would have caught F8;
- for every framework and section, the posture on the page equals the counts derived from data, shows all four statuses, and sums to the total — the assertion that would have caught F9 and F10;
- every public record ID selects its record, and the presentation route returns 404 for unknown IDs;
- the three retired laboratory pathnames return the ordinary 404 with no `Location` header;
- `tests/mcp-client.test.ts` covers the unknown-method, invalid-namespace, and write-tool cases;
- documentation and evidence links resolve to the deployed commit;
- the WCAG evaluation report covers all 86 criteria and names its date, scope, evaluator, and method;
- representative `/assurance` states pass the Chromium and axe audit in English and Arabic.

### DEMO-291 — SEC — Stop exposing identity audit values

- replace unkeyed subject hashes in identity audit events, application logs, and sandbox namespaces with a keyed hash, such as HMAC-SHA-256 under a Worker secret whose name, never its value, goes in `.dev.vars.example`; drop subject-derived values wherever nothing needs them;
- stop returning identity event detail from public responses, including `/api/operations/logs`;
- add a numbered migration that removes or rewrites existing rows carrying unkeyed subject values, without editing an applied migration;
- confirm existing visitor sandboxes and sessions still resolve, or record the one-time reset;
- add tests that no public response contains a subject-derived value and that stored values are keyed;
- keep exploit detail out of the public change record, as `SECURITY.md` requires.

Closes F18.

### DEMO-292 — FIX — Restore localization placeholders inside scripts

- protect `<script>` blocks before technical blocks in `localizeBody()`, or restore placeholders until none remain, without localizing script or technical content;
- check every inline script for `<code>`, `<pre>`, `<samp>`, `<kbd>`, or `<bdi>` string literals;
- add a regression test that no `@@WG_I18N_BLOCK_` token survives in any locale, including the default, and that `/api/demos/d1` returns none;
- run `npm run test:site-accessibility`, `npm run validate:site-i18n`, and `npm run validate:locales`.

Closes F19.

### DEMO-293 — BUILD — Release assurance assessment as v0.24.0

After DEMO-283 through DEMO-292 are merged and green:

- release as `v0.24.0`;
- record validation, deployment, rollback, and release evidence according to `docs/RELEASE-MANAGEMENT.md`;
- retain v0.23.0 as the previous release and rollback reference;
- move the documentation rule into the permanent architecture invariants in `AGENTS.md`, and retire this plan.

## Validation expectations

Every controlled change follows `AGENTS.md` and `docs/CHANGE-MANAGEMENT.md`.

At minimum, repository-changing tasks complete the standard validation loop:

- `npm run check`
- `npm run validate:migrations`
- `npm run security:dependencies`
- `npm run build`
- `git diff --check`

Changes to assurance data or contracts (DEMO-285, DEMO-287, DEMO-288, DEMO-289) also run `npm run validate:assurance`, `npm run validate:assurance-summaries`, `npm run validate:governance`, and `npm run validate:wcag`, and refresh their lifecycle source approvals as `docs/ASSURANCE.md` requires. Changes to the `/assurance` presentation or localized output (DEMO-284, DEMO-286, DEMO-289, DEMO-292) also run `npm run test:site-accessibility`, `npm run validate:site-accessibility`, `npm run validate:site-i18n`, and `npm run validate:locales`. Changes to route declarations (DEMO-284, DEMO-286) run `npm run generate:routes` and commit both route artifacts before validation. DEMO-291 applies its migration to a local database that already holds identity rows before review.

## After this sequence

This sequence makes every status honest; it cannot make them pass. Most ISO requirements should be expected to land at `partial`, each naming the record it is waiting for. The path to pass is operating records, written in Markdown as the activities happen: the access review AR-001, recovery test RT-001, incident exercise EX-001, awareness cycle AW-001–AW-007, competence and supplier reviews, threat-intelligence reviews, a dated self-assessment, and the first management review. A ruleset on `main` that requires pull requests and passing checks is the smallest change that bears on A.8.25 and A.8.32. None of that work has reserved IDs.
