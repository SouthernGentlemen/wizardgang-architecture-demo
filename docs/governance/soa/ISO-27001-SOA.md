# ISO/IEC 27001:2022 Statement of Applicability

**Reference:** WG-SOA-001  
**Status:** Proposed  
**Owner:** WizardGang  
**Assessment date:** 2026-09-02  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material scope, risk, supplier, architecture, data, personnel, or AI-capability change

## Purpose

This SoA records Annex A applicability, rationale, current implementation/evidence status, and remaining treatment for the declared management-system scope. Control labels are short paraphrases, not ISO normative text. This supports an **aligned — uncertified** posture only.

## Rules

- **Applicable:** selected because of scope, risk, policy, interested-party requirements, supplier dependency, or operating need.
- **Not applicable:** outside current scope; rationale is mandatory and must be revisited when scope changes.
- **Met / Partial / Gap / N/A:** evidence status only; not a certification score.
- A control is never excluded because implementation is missing. Missing implementation remains `Gap` or `Partial`.
- This document is Proposed while PR #56 is open. Merge approves the SoA baseline but does not automatically make `Partial`/`Gap` controls `Met` or accept residual risks.

## Scope notes

- **Scope:** `demo.wizardgang.ai`, its public repository/delivery pipeline, Cloudflare runtime/data services, credentials, operations, and material suppliers.
- **Physical controls:** provider-operated facilities/hardware are outside WizardGang's direct operating boundary; related provider risk remains covered through supplier/cloud controls.
- **People controls:** exclusions reflect the current system-level demo scope. Reassess if employees, contractors, issued endpoints, or offices enter scope.
- **Public source:** source confidentiality is not an objective; write, merge, release, credential, and production authority remain controlled.

## Evidence key

`GOV` governance context/scope/management-system docs · `POL` information-security policy · `ROLES` roles/responsibilities · `LEAD` leadership · `RISK` security risk register · `SEC` SECURITY.md · `OPS` operations · `CHANGE` change/release · `EVID` evidence/architecture · `MCP` governance/MCP source

## Summary

| Controls | Met | Partial | Gap | N/A |
|---:|---:|---:|---:|---:|
| 93 | 3 | 47 | 18 | 25 |

## Applicability register

| Control | Theme | Applicability | Status | Basis / evidence / remaining gap |
|---|---|---|---|---|
| A.5.1 | Organizational | Yes | Partial | Included by scope/risk. A dedicated information-security policy now exists in this PR, but it remains Proposed until merge and policy communication/review evidence has not yet accumulated. Evidence: SEC,POL,GOV. |
| A.5.2 | Organizational | Yes | Partial | Included by scope/risk. A formal repository-native role and responsibility matrix now exists; it remains Proposed until merge and recurring assignment/review evidence is still limited. Evidence: OPS,ROLES,GOV. |
| A.5.3 | Organizational | Yes | Partial | Included by scope/risk. The roles record identifies overlapping duties, approval authority, independence needs, and compensating review for the small-operator model; stronger incompatible-duty enforcement is still limited. Evidence: ROLES,GOV. |
| A.5.4 | Organizational | Yes | Partial | Included by scope/risk. The leadership record now defines management accountability, resources, risk decisions, review duties, and continual-improvement obligations; recurring evidence remains to be produced. Evidence: LEAD,GOV. |
| A.5.5 | Organizational | Yes | Gap | Included by scope/risk. No authority-contact criteria/list/escalation process. Evidence: GOV. |
| A.5.6 | Organizational | Yes | Gap | Included by scope/risk. No documented special-interest/security-group participation process. Evidence: GOV. |
| A.5.7 | Organizational | Yes | Gap | Included by scope/risk. No threat-intelligence collection/triage/feed process evidenced. Evidence: GOV. |
| A.5.8 | Organizational | Yes | Partial | Included by scope/risk. Change records carry risk, controls, validation, evidence, and rollback expectations. Evidence: CHANGE,GOV,RISK. |
| A.5.9 | Organizational | Yes | Partial | Included by scope/risk. Architecture/resources are documented, but no authoritative information/asset inventory with owners/classification. Evidence: OPS,GOV,RISK. |
| A.5.10 | Organizational | Yes | Gap | Included by scope/risk. No acceptable-use rules for information/assets found. Evidence: GOV. |
| A.5.11 | Organizational | No | N/A | Excluded — No employee-issued organizational assets are inside the current demo-system scope; revisit if organizational scope expands. |
| A.5.12 | Organizational | Yes | Gap | Included by scope/risk. No formal classification scheme/register. Evidence: GOV. |
| A.5.13 | Organizational | Yes | Gap | Included by scope/risk. No classification/labelling process. Evidence: GOV. |
| A.5.14 | Organizational | Yes | Partial | Included by scope/risk. APIs/webhooks apply scoped auth/HMAC and bounded payloads; no overarching transfer policy/agreement framework. Evidence: SEC,GOV. |
| A.5.15 | Organizational | Yes | Partial | Included by scope/risk. Admin, API, GraphQL, MCP, R2, and crawler boundaries are documented and fail closed; policy/evidence scope is incomplete. Evidence: SEC,GOV,RISK. |
| A.5.16 | Organizational | Yes | Partial | Included by scope/risk. Identity sessions and principals are bounded; lifecycle governance is not fully documented. Evidence: SEC,GOV. |
| A.5.17 | Organizational | Yes | Partial | Included by scope/risk. Secrets are managed outside source and credentials are bounded; formal credential lifecycle rules are incomplete. Evidence: SEC,GOV. |
| A.5.18 | Organizational | Yes | Partial | Included by scope/risk. Least-privilege tokens and scoped mutations exist; periodic review/provisioning/deprovisioning evidence is absent. Evidence: SEC,GOV. |
| A.5.19 | Organizational | Yes | Partial | Included by scope/risk. Cloudflare/GitHub dependencies are visible, but supplier risk due diligence and monitoring are not formalized. Evidence: OPS,GOV,RISK. |
| A.5.20 | Organizational | Yes | Gap | Included by scope/risk. No supplier security-requirements/contract evidence. Evidence: GOV. |
| A.5.21 | Organizational | Yes | Gap | Included by scope/risk. Dependency checks exist, but no complete ICT supply-chain risk process. Evidence: CHANGE,GOV. |
| A.5.22 | Organizational | Yes | Gap | Included by scope/risk. No formal supplier-review cadence and change-risk process. Evidence: GOV. |
| A.5.23 | Organizational | Yes | Partial | Included by scope/risk. Cloudflare architecture, minimum-permission tokens, secrets, telemetry boundaries, and operational behavior are documented. Evidence: OPS,GOV,RISK. |
| A.5.24 | Organizational | Yes | Partial | Included by scope/risk. Vulnerability reporting, logs, offline controls, and evidence exist; no complete incident response plan/playbooks. Evidence: SEC,GOV,RISK. |
| A.5.25 | Organizational | Yes | Partial | Included by scope/risk. Audit/log streams distinguish events and diagnostics; classification/escalation criteria are not formalized. Evidence: OPS,GOV,RISK. |
| A.5.26 | Organizational | Yes | Partial | Included by scope/risk. Fail-closed and maintenance controls exist; full incident response roles, communications, containment, recovery are not evidenced. Evidence: SEC,GOV,RISK. |
| A.5.27 | Organizational | Yes | Gap | Included by scope/risk. No post-incident review/lesson tracking process found. Evidence: GOV,RISK. |
| A.5.28 | Organizational | Yes | Partial | Included by scope/risk. Traceability and D1 audit evidence are first-class design goals; forensic evidence procedure is incomplete. Evidence: EVID,GOV,RISK. |
| A.5.29 | Organizational | Yes | Partial | Included by scope/risk. Intentional offline mode preserves status/admin/health and avoids debug leakage; broader disruption scenarios are not covered. Evidence: OPS,GOV,RISK. |
| A.5.30 | Organizational | Yes | Partial | Included by scope/risk. Health, scheduled availability observations, graceful degradation, and rollback targets exist; formal BCP/RTO/RPO testing is absent. Evidence: OPS,GOV,RISK. |
| A.5.31 | Organizational | Yes | Partial | Included by scope/risk. Standards posture is explicit and uncertified; no authoritative legal/regulatory/contract register. Evidence: MCP,GOV,RISK. |
| A.5.32 | Organizational | Yes | Gap | Included by scope/risk. No specific IP compliance procedure/evidence beyond ordinary repository licensing/content choices. Evidence: GOV. |
| A.5.33 | Organizational | Yes | Partial | Included by scope/risk. Git history, releases, audit events, logs, and D1 records exist; retention/integrity/disposition policy is incomplete. Evidence: EVID,GOV,RISK. |
| A.5.34 | Organizational | Yes | Partial | Included by scope/risk. Public telemetry/logging intentionally excludes sensitive identifiers and credentials; no full privacy management process/data inventory. Evidence: SEC,GOV,RISK. |
| A.5.35 | Organizational | Yes | Gap | Included by scope/risk. No independent security review/audit evidence found. Evidence: GOV,RISK. |
| A.5.36 | Organizational | Yes | Partial | Included by scope/risk. CI validates change/history/dependencies and public boundaries; formal policy-compliance review is incomplete. Evidence: CHANGE,GOV,RISK. |
| A.5.37 | Organizational | Yes | Partial | Included by scope/risk. Operations/security/change procedures are documented; procedure inventory and ownership/review cadence need completion. Evidence: OPS,GOV,RISK. |
| A.6.1 | People | No | N/A | Excluded — Personnel hiring/screening is outside the current demo-system scope; applicable if organizational certification scope includes staff. |
| A.6.2 | People | No | N/A | Excluded — Employment/contract terms are outside current demo-system scope. |
| A.6.3 | People | Yes | Gap | Included by scope/risk. No formal awareness/training evidence found for people with security responsibilities. Evidence: RISK. |
| A.6.4 | People | No | N/A | Excluded — No employee disciplinary process is in the demo-system scope. |
| A.6.5 | People | No | N/A | Excluded — Personnel lifecycle is outside current demo-system scope. |
| A.6.6 | People | No | N/A | Excluded — No workforce/contractor NDA process is in the current system scope. |
| A.6.7 | People | No | N/A | Excluded — Remote-work workplace controls are outside current demo-system scope. |
| A.6.8 | People | Yes | Partial | Included by scope/risk. Private vulnerability reporting is prescribed; workforce reporting/escalation workflow is not complete. Evidence: SEC,RISK. |
| A.7.1 | Physical | No | N/A | Excluded — No customer-operated facilities/data center in system scope; physical infrastructure is provider-hosted and must be handled through supplier/cloud assurance. |
| A.7.2 | Physical | No | N/A | Excluded — No customer-operated facility in current system scope; inherited provider concern. |
| A.7.3 | Physical | No | N/A | Excluded — No customer-operated facility in current system scope. |
| A.7.4 | Physical | No | N/A | Excluded — No customer-operated facility in current system scope. |
| A.7.5 | Physical | No | N/A | Excluded — Cloud provider infrastructure is outside direct control; address through provider assurance/supplier risk. |
| A.7.6 | Physical | No | N/A | Excluded — No secure physical work area in current system scope. |
| A.7.7 | Physical | No | N/A | Excluded — Workplace policy is outside current demo-system scope. |
| A.7.8 | Physical | No | N/A | Excluded — No customer-operated production equipment in scope. |
| A.7.9 | Physical | No | N/A | Excluded — No assigned physical production assets in current system scope. |
| A.7.10 | Physical | No | N/A | Excluded — No removable/physical production storage media identified; logical storage controls remain applicable elsewhere. |
| A.7.11 | Physical | No | N/A | Excluded — Provider-hosted infrastructure; inherited supplier/cloud concern. |
| A.7.12 | Physical | No | N/A | Excluded — Provider-hosted infrastructure; no customer-managed cabling. |
| A.7.13 | Physical | No | N/A | Excluded — Provider-hosted infrastructure; no customer-managed production hardware. |
| A.7.14 | Physical | No | N/A | Excluded — No customer-managed production hardware in scope. |
| A.8.1 | Technological | Yes | Gap | Included by scope/risk. Developer/admin endpoints exist but no endpoint-hardening/management standard is evidenced. Evidence: RISK. |
| A.8.2 | Technological | Yes | Partial | Included by scope/risk. Admin and GitHub/Cloudflare tokens are deliberately scoped; formal privileged-access review is incomplete. Evidence: SEC,RISK. |
| A.8.3 | Technological | Yes | Partial | Included by scope/risk. Server-derived namespaces, protected mutations, public/private boundaries, and fail-closed controls exist. Evidence: SEC,RISK. |
| A.8.4 | Technological | Yes | Partial | Included by scope/risk. Source is intentionally public; privileged write/merge/release paths are controlled. Formal write-access review evidence is incomplete. Evidence: CHANGE,RISK. |
| A.8.5 | Technological | Yes | Partial | Included by scope/risk. Digest comparison, same-origin checks, identity-derived tokens, and protected admin paths exist; full auth assurance/testing remains incomplete. Evidence: SEC,RISK. |
| A.8.6 | Technological | Yes | Partial | Included by scope/risk. Usage telemetry and normal→warning→degraded behavior exist; formal capacity thresholds/forecasting are incomplete. Evidence: OPS,RISK. |
| A.8.7 | Technological | Yes | Gap | Included by scope/risk. No malware prevention/detection process for development endpoints or artifacts is evidenced. Evidence: RISK. |
| A.8.8 | Technological | Yes | Partial | Included by scope/risk. Dependency security checks and private vulnerability reporting exist; scanning, triage SLAs, patch cadence, and remediation evidence are incomplete. Evidence: SEC,RISK. |
| A.8.9 | Technological | Yes | Partial | Included by scope/risk. Environment-owned config, managed secrets, route manifests, and controlled source are documented; full configuration baseline/drift evidence is incomplete. Evidence: SEC,RISK. |
| A.8.10 | Technological | Yes | Gap | Included by scope/risk. No comprehensive deletion/retention/disposal rules for D1/R2/log/audit data found. Evidence: RISK. |
| A.8.11 | Technological | Yes | Partial | Included by scope/risk. Public logs/telemetry are defensively redacted and identifiers excluded; broader masking requirements are not inventoried. Evidence: SEC,RISK. |
| A.8.12 | Technological | Yes | Partial | Included by scope/risk. Secrets and sensitive telemetry are blocked from public surfaces; no formal DLP monitoring/ruleset exists. Evidence: SEC,RISK. |
| A.8.13 | Technological | Yes | Gap | Included by scope/risk. No authoritative backup/restore policy, retention, or restore-test evidence found. Evidence: RISK. |
| A.8.14 | Technological | Yes | Partial | Included by scope/risk. Cloudflare provides distributed infrastructure and the app demonstrates graceful degradation, but inherited redundancy assurance is not captured as evidence. Evidence: OPS,RISK. |
| A.8.15 | Technological | Yes | Met | Included by scope/risk. Application logs and separate audit events are implemented with explicit redaction, bounding, and public-safe behavior. Evidence: OPS,RISK. |
| A.8.16 | Technological | Yes | Partial | Included by scope/risk. Health, uptime, usage, logs, and scheduled observations exist; detection/alerting/escalation coverage is incomplete. Evidence: OPS,RISK. |
| A.8.17 | Technological | No | N/A | Excluded — No customer-managed infrastructure clock service; provider/runtime timestamps are inherited. Document provider dependency if certification scope requires it. |
| A.8.18 | Technological | Yes | Partial | Included by scope/risk. Privileged actions are constrained behind admin/workflow boundaries; utility inventory/authorization review is incomplete. Evidence: SEC,RISK. |
| A.8.19 | Technological | Yes | Partial | Included by scope/risk. Deployments are controlled through versioned workflow/tag paths; no general operational software-installation policy because runtime is serverless. Evidence: CHANGE,RISK. |
| A.8.20 | Technological | Yes | Partial | Included by scope/risk. Edge/runtime network controls are largely provider-managed; application gates/auth exist, but network-security assurance/config evidence is incomplete. Evidence: SEC,RISK. |
| A.8.21 | Technological | Yes | Partial | Included by scope/risk. HTTPS/provider edge and scoped APIs are assumed/implemented; service-security requirements and supplier assurance are incomplete. Evidence: SEC,RISK. |
| A.8.22 | Technological | No | N/A | Excluded — No customer-managed network segments/VLANs in the serverless production architecture; isolation is primarily provider/application-layer. |
| A.8.23 | Technological | No | N/A | Excluded — The system is not an enterprise user web-browsing platform; no organizational web-filtering function is in scope. |
| A.8.24 | Technological | Yes | Partial | Included by scope/risk. HMAC-SHA256, managed secrets, and secure transport/auth patterns are used; cryptographic policy/key lifecycle is incomplete. Evidence: SEC,RISK. |
| A.8.25 | Technological | Yes | Met | Included by scope/risk. Change IDs, risk levels, validation, evidence, PR/release/deploy traceability, and secure-development controls are central to the repo. Evidence: CHANGE,RISK. |
| A.8.26 | Technological | Yes | Partial | Included by scope/risk. Auth, logging, secrets, APIs, webhooks, accessibility, and fail-closed expectations are documented; no single approved app-security requirement register. Evidence: SEC,RISK. |
| A.8.27 | Technological | Yes | Partial | Included by scope/risk. Architecture and security boundaries are explicit; formal principle catalogue/threat modeling and review evidence are incomplete. Evidence: EVID,RISK. |
| A.8.28 | Technological | Yes | Partial | Included by scope/risk. Security invariants, redaction, same-origin checks, HMAC, scoped tokens and CI exist; secure-coding standard/training/SAST evidence is incomplete. Evidence: SEC,RISK. |
| A.8.29 | Technological | Yes | Partial | Included by scope/risk. Automated checks, dependency security, tests, and route contracts exist; independent security testing/pentest coverage is absent. Evidence: CHANGE,RISK. |
| A.8.30 | Technological | No | N/A | Excluded — No outsourced development supplier is evidenced in the reviewed system scope; reclassify if contractors/external development suppliers are used. |
| A.8.31 | Technological | Yes | Partial | Included by scope/risk. Local/CI/tagged production deployment boundaries exist; formal environment access/data-separation evidence is incomplete. Evidence: CHANGE,RISK. |
| A.8.32 | Technological | Yes | Met | Included by scope/risk. Permanent DEMO IDs, risk, controls, validation, evidence, release/rollback metadata, and controlled merge/release flow are documented. Evidence: CHANGE,RISK. |
| A.8.33 | Technological | Yes | Partial | Included by scope/risk. Demo/test data is intentionally bounded/public-safe, but test-data classification, minimization, retention, and production-data prohibition are not formalized. Evidence: SEC,RISK. |
| A.8.34 | Technological | Yes | Gap | Included by scope/risk. No audit-testing authorization, isolation, scheduling, production-safety, or cleanup procedure found. Evidence: RISK. |

## Control selection and treatment

Applicable controls are selected from the declared scope, interested-party requirements, policies, risk registers, supplier dependencies, architecture, and operating requirements. Treatment work uses the controlled lifecycle:

`requirement / risk → DEMO-### → branch → PR → validation → review → merge → release → deployment → verification → evidence`

A control status change requires evidence. Risk acceptance remains explicit and attributable; it is not implied by SoA approval.

## Alignment

This is repository-controlled governance evidence for an **ISO-aligned, uncertified** management-system demonstration. Independent certification is not claimed.
