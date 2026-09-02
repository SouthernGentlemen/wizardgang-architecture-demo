# ISO/IEC 27001:2022 Statement of Applicability

**Reference:** WG-SOA-001  
**Status:** Proposed  
**Owner:** WizardGang  
**Assessment date:** 2026-09-02  
**Last refreshed by:** DEMO-105  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material scope, risk, supplier, architecture, data, personnel, or AI-capability change

## Purpose

This SoA records Annex A applicability, rationale, current implementation/evidence status, and remaining treatment for the declared management-system scope. Control labels are short paraphrases, not ISO normative text. This supports an **aligned — uncertified** posture only.

## Refresh basis

`DEMO-105` reassesses all 93 Annex A controls against the repository baseline through `DEMO-104`, including the management-system procedures/registers added after the original SoA in `DEMO-081`.

Status changes are evidence-driven:

- a newly defined policy, procedure, register, or review mechanism can move a former `Gap` to `Partial` when it materially addresses the control;
- documentation alone does not make an operating control `Met`;
- planned exercises, reviews, awareness cycles, restore tests, supplier reviews, audits, and management reviews are not counted as completed evidence;
- provider-side controls are not treated as WizardGang operating effectiveness without verification;
- no status implies certification or residual-risk acceptance.

## Rules

- **Applicable:** selected because of scope, risk, policy, interested-party requirements, supplier dependency, or operating need.
- **Not applicable:** outside current scope; rationale is mandatory and must be revisited when scope changes.
- **Met / Partial / Gap / N/A:** evidence status only; not a certification score.
- A control is never excluded because implementation is missing. Missing implementation remains `Gap` or `Partial`.
- This document is Proposed while PR #56 is open. Merge approves this refreshed SoA but does not automatically make `Partial`/`Gap` controls `Met` or accept residual risks.

## Scope notes

- **Scope:** `demo.wizardgang.ai`, its public repository/delivery pipeline, Cloudflare runtime/data services, credentials, operations, and material suppliers.
- **Physical controls:** provider-operated facilities/hardware are outside WizardGang's direct operating boundary; related provider risk remains covered through supplier/cloud controls.
- **People controls:** exclusions reflect the current system-level demo scope. Reassess if employees, contractors, issued endpoints, or offices enter scope.
- **Public source:** source confidentiality is not an objective; write, merge, release, credential, and production authority remain controlled.
- **AI/MCP boundary:** Codex and Claude remain the only approved AI/MCP provider/client families; `demo_records` remains the only approved D1 source for public MCP records.

## Evidence key

`GOV` core governance · `POL` security policy · `ROLES` roles · `LEAD` leadership · `RISK` security risk register · `SEC` SECURITY.md · `OPS` operations · `CHANGE` change/release · `EVID` evidence/architecture · `MCP` MCP source/governance · `SUP` supplier governance · `INC` incident management · `REC` backup/recovery · `COMP` competence/awareness · `DATA` data governance · `VULN` vulnerability/threat maintenance · `ACCESS` asset/access governance · `LEGAL` obligations/IP/privacy · `CFG` configuration/drift · `CRYPTO` cryptography/secrets · `ENG` secure engineering/testing · `CONT` continuity · `AUDIT` internal audit/self-assessment · `MREV` management review · `CA` corrective action · `IDX` control/document index

## Summary

| Controls | Met | Partial | Gap | N/A |
|---:|---:|---:|---:|---:|
| 93 | 3 | 62 | 3 | 25 |

Compared with the original `DEMO-081` SoA (`3 Met / 47 Partial / 18 Gap / 25 N/A`), the refreshed posture is more completely governed but still operating-evidence constrained. Most movement is `Gap → Partial`, not `Partial → Met`.

## Applicability register

| Control | Theme | Applicability | Status | Basis / evidence / remaining gap |
|---|---|---|---|---|
| A.5.1 | Organizational | Yes | Partial | Information-security policy is defined and controlled, but PR approval and recurring communication/review evidence are not yet complete. Evidence: POL,GOV,COMP. |
| A.5.2 | Organizational | Yes | Partial | Roles, responsibilities, and authorities are formally assigned; recurring assignment/review evidence remains incomplete. Evidence: ROLES,GOV,ACCESS. |
| A.5.3 | Organizational | Yes | Partial | Incompatible duties, approval authority, and independence limits are documented for the small-operator model; stronger technical separation and independent review remain limited. Evidence: ROLES,GOV,AUDIT. |
| A.5.4 | Organizational | Yes | Partial | Leadership accountability, resources, risk decisions, review duties, and improvement obligations are defined; recurring management-review evidence is not yet complete. Evidence: LEAD,GOV,MREV. |
| A.5.5 | Organizational | Yes | Partial | Incident and obligations processes define when authority/external notification must be considered, but an evidenced authority-contact inventory and real notification history are not yet established. Evidence: INC,LEGAL,GOV. |
| A.5.6 | Organizational | Yes | Partial | Security-maintenance governance defines external threat/community information sources and review expectations; actual participation/contact records remain incomplete. Evidence: VULN,GOV. |
| A.5.7 | Organizational | Yes | Partial | Threat-intelligence collection, triage, review, and maintenance expectations are defined with an initial register; recurring human review and response history remain incomplete. Evidence: VULN,RISK. |
| A.5.8 | Organizational | Yes | Partial | Security is integrated into controlled DEMO changes through risk, controls, validation, evidence, release, and rollback expectations; operating effectiveness depends on continued execution. Evidence: CHANGE,ENG,RISK. |
| A.5.9 | Organizational | Yes | Partial | An asset/access inventory now identifies material repositories, services, data stores, credentials, owners, and access expectations; recurring completeness review remains incomplete. Evidence: ACCESS,DATA,CFG. |
| A.5.10 | Organizational | Yes | Partial | Acceptable-use requirements for source, credentials, services, data, AI/MCP access, and public evidence are defined; awareness and recurring compliance evidence are still planned/partial. Evidence: ACCESS,COMP. |
| A.5.11 | Organizational | No | N/A | Excluded — no employee-issued organizational assets are inside the current demo-system scope; reassess if issued devices or personnel asset-return obligations enter scope. |
| A.5.12 | Organizational | Yes | Partial | A PUBLIC / INTERNAL / SENSITIVE / RESTRICTED classification model and data inventory are defined; operational classification completeness and periodic review remain partial. Evidence: DATA. |
| A.5.13 | Organizational | Yes | Partial | Classification-linked handling and marking expectations are defined, including public-evidence and restricted-secret rules; automated enforcement and recurring verification remain incomplete. Evidence: DATA,SEC. |
| A.5.14 | Organizational | Yes | Partial | APIs, webhooks, MCP, source, supplier, and evidence-transfer boundaries are documented with scoped authentication and data-handling rules; contractual transfer requirements are not comprehensively evidenced. Evidence: SEC,DATA,SUP. |
| A.5.15 | Organizational | Yes | Partial | Access-control principles and application boundaries are documented across admin, APIs, MCP, data, source, secrets, and suppliers; provider-side enforcement remains only partially verified. Evidence: ACCESS,SEC,CFG. |
| A.5.16 | Organizational | Yes | Partial | Identity and access lifecycle expectations are documented with an access register; first periodic access review and some provider-side identity evidence remain incomplete. Evidence: ACCESS,SEC. |
| A.5.17 | Organizational | Yes | Partial | Credential, secret, cryptographic material, storage, rotation, revocation, and exposure rules are defined; private production inventory/age/rotation evidence remains partial. Evidence: CRYPTO,SEC. |
| A.5.18 | Organizational | Yes | Partial | Provisioning, least privilege, privileged access, periodic review, revocation, and exceptions are defined; initial recurring review evidence remains incomplete. Evidence: ACCESS,SEC. |
| A.5.19 | Organizational | Yes | Partial | Supplier governance and a supplier register identify critical/material dependencies and review triggers; recurring supplier assurance evidence remains incomplete. Evidence: SUP. |
| A.5.20 | Organizational | Yes | Partial | Security, data, continuity, incident, access, AI, change, and exit expectations for suppliers are defined; contractual evidence is not complete for every provider. Evidence: SUP,LEGAL. |
| A.5.21 | Organizational | Yes | Partial | ICT supply-chain risks are addressed through supplier governance, dependency auditing, change control, vulnerability management, and approved-provider boundaries; deeper supplier assurance remains partial. Evidence: SUP,VULN,ENG. |
| A.5.22 | Organizational | Yes | Partial | Supplier review cadence, material-change reassessment, incident handling, and register updates are defined; the first periodic review cycle has not yet been completed. Evidence: SUP. |
| A.5.23 | Organizational | Yes | Partial | Cloud-service acquisition, configuration, access, logging, continuity, data, and supplier boundaries are documented; provider-side control verification and recurring drift evidence remain partial. Evidence: SUP,CFG,CONT. |
| A.5.24 | Organizational | Yes | Partial | Incident preparation, roles, severity, reporting, containment, evidence, communication, recovery, and exercise requirements are defined; EX-001 remains planned. Evidence: INC. |
| A.5.25 | Organizational | Yes | Partial | Security events are evaluated through a documented severity/triage model and escalation rules; live/exercise classification evidence remains limited. Evidence: INC,OPS. |
| A.5.26 | Organizational | Yes | Partial | Incident response responsibilities and actions are defined, including containment, communication, recovery, evidence, and corrective action; operating effectiveness is not yet demonstrated. Evidence: INC,CA. |
| A.5.27 | Organizational | Yes | Partial | Post-incident lessons, root-cause analysis, corrective action, effectiveness verification, and management-system updates are defined; completed incident/exercise learning records are not yet available. Evidence: INC,CA. |
| A.5.28 | Organizational | Yes | Partial | Evidence preservation, audit trails, sensitive handling, incident records, and traceability are defined; dedicated forensic-collection exercises and external evidentiary requirements remain incomplete. Evidence: INC,EVID,DATA. |
| A.5.29 | Organizational | Yes | Partial | Normal, Degraded, Intentional Offline, and Recovery/Verification modes define security-preserving operation during disruption; continuity exercises remain incomplete. Evidence: CONT,OPS. |
| A.5.30 | Organizational | Yes | Partial | Continuity, recovery priorities, source reconstruction, D1/R2 recovery, and technical restore testing are defined; RT-001 and broader continuity effectiveness remain incomplete. Evidence: CONT,REC. |
| A.5.31 | Organizational | Yes | Partial | A controlled obligations process/register now covers legal, regulatory, contractual, standards, privacy, IP, and external-reporting triggers without inventing duties; jurisdiction-specific review remains evidence-dependent. Evidence: LEGAL. |
| A.5.32 | Organizational | Yes | Partial | IP and licensing obligations, source/publication decisions, third-party content, and reassessment triggers are documented; recurring obligation review and external assurance remain limited. Evidence: LEGAL. |
| A.5.33 | Organizational | Yes | Partial | Record integrity, Git history, audit/evidence retention, data classes, retention/deletion, incident preservation, and backup inheritance are defined; technical retention/deletion enforcement remains partial. Evidence: DATA,EVID,INC. |
| A.5.34 | Organizational | Yes | Partial | Data minimization, classification, sensitive handling, public-safe logging, identity boundaries, and privacy-obligation reassessment are defined; no broad privacy compliance claim or complete jurisdictional program is made. Evidence: DATA,LEGAL,SEC. |
| A.5.35 | Organizational | Yes | Gap | No completed independent information-security review, penetration test, or sufficiently objective formal internal audit is evidenced. Self-assessment procedures exist but do not satisfy independent assurance. Evidence: AUDIT,ENG. |
| A.5.36 | Organizational | Yes | Partial | CI, controlled history, governance metadata validation, self-assessment, management review, corrective action, and compliance-review expectations are defined; formal audit/management-review operating evidence remains incomplete. Evidence: GOV,AUDIT,MREV,CA. |
| A.5.37 | Organizational | Yes | Partial | The management-system index and controlled procedures cover operations, security, data, suppliers, incidents, recovery, access, configuration, secrets, engineering, and continuity; recurring procedure-use evidence remains partial. Evidence: IDX,GOV,OPS. |
| A.6.1 | People | No | N/A | Excluded — personnel screening/hiring is outside the current system-level demo scope; reassess if staff or contractors enter certification scope. |
| A.6.2 | People | No | N/A | Excluded — employment and contractor terms are outside the current demo-system scope. |
| A.6.3 | People | Yes | Partial | Competence, security/AI awareness requirements, evidence types, and an initial awareness cycle are defined; the first completed awareness/competence cycle is still planned or partial. Evidence: COMP. |
| A.6.4 | People | No | N/A | Excluded — no employee disciplinary process is in the current demo-system scope. |
| A.6.5 | People | No | N/A | Excluded — employment-change/termination personnel lifecycle is outside the current demo-system scope. |
| A.6.6 | People | No | N/A | Excluded — no workforce/contractor confidentiality agreement process is currently in scope; reassess if such personnel are added. |
| A.6.7 | People | No | N/A | Excluded — remote-work workplace controls are outside the current demo-system scope. |
| A.6.8 | People | Yes | Partial | Private vulnerability reporting, AI concern reporting, incident reporting, escalation, and sensitive-disclosure rules are defined; workforce reporting history is not yet established. Evidence: SEC,INC,COMP. |
| A.7.1 | Physical | No | N/A | Excluded — no WizardGang-operated production facilities or data centers are in scope; physical hosting risk is addressed through supplier/cloud governance. |
| A.7.2 | Physical | No | N/A | Excluded — no WizardGang-operated physical facility, secure area, or production hardware for this control is inside the current system scope. |
| A.7.3 | Physical | No | N/A | Excluded — no WizardGang-operated physical facility, secure area, or production hardware for this control is inside the current system scope. |
| A.7.4 | Physical | No | N/A | Excluded — no WizardGang-operated physical facility, secure area, or production hardware for this control is inside the current system scope. |
| A.7.5 | Physical | No | N/A | Excluded — provider-hosted infrastructure is outside direct WizardGang physical control; related risk is handled through supplier/cloud assurance and continuity governance. |
| A.7.6 | Physical | No | N/A | Excluded — no WizardGang-operated physical facility, secure area, or production hardware for this control is inside the current system scope. |
| A.7.7 | Physical | No | N/A | Excluded — no WizardGang-operated physical facility, secure area, or production hardware for this control is inside the current system scope. |
| A.7.8 | Physical | No | N/A | Excluded — no WizardGang-operated physical facility, secure area, or production hardware for this control is inside the current system scope. |
| A.7.9 | Physical | No | N/A | Excluded — no WizardGang-operated physical facility, secure area, or production hardware for this control is inside the current system scope. |
| A.7.10 | Physical | No | N/A | Excluded — no removable or customer-managed physical production media are identified; logical storage controls remain applicable elsewhere. |
| A.7.11 | Physical | No | N/A | Excluded — provider-hosted infrastructure is outside direct WizardGang physical control; related risk is handled through supplier/cloud assurance and continuity governance. |
| A.7.12 | Physical | No | N/A | Excluded — provider-hosted infrastructure is outside direct WizardGang physical control; related risk is handled through supplier/cloud assurance and continuity governance. |
| A.7.13 | Physical | No | N/A | Excluded — provider-hosted infrastructure is outside direct WizardGang physical control; related risk is handled through supplier/cloud assurance and continuity governance. |
| A.7.14 | Physical | No | N/A | Excluded — provider-hosted infrastructure is outside direct WizardGang physical control; related risk is handled through supplier/cloud assurance and continuity governance. |
| A.8.1 | Technological | Yes | Gap | Developer/admin endpoints are part of the risk boundary, but a demonstrated endpoint hardening, inventory, malware, patch, and device-management control set is not evidenced. Evidence: VULN,ACCESS. |
| A.8.2 | Technological | Yes | Partial | Privileged accounts/tokens are scoped and governed, with access-review expectations and a register; first periodic review and provider-side permission verification remain incomplete. Evidence: ACCESS,SEC. |
| A.8.3 | Technological | Yes | Partial | Server-derived namespaces, authenticated admin boundaries, public/private data separation, and least-privilege MCP/API behavior are implemented; complete access-review evidence remains partial. Evidence: SEC,ACCESS,MCP. |
| A.8.4 | Technological | Yes | Partial | Source is intentionally public while write, merge, release, secret, and production authority are restricted; GitHub ruleset/classic protection enforcement remains unverified. Evidence: CHANGE,ACCESS,CFG. |
| A.8.5 | Technological | Yes | Partial | Authentication boundaries, same-origin checks, digest/token controls, fail-closed behavior, and protected administration are implemented; broader end-to-end authentication assurance remains partial. Evidence: SEC,ENG. |
| A.8.6 | Technological | Yes | Partial | Usage, health, billing/cost guardrails, and degradation behavior are observable; formal capacity forecasting and recurring threshold review remain incomplete. Evidence: OPS,CONT. |
| A.8.7 | Technological | Yes | Partial | Security-maintenance governance addresses malware/threat prevention expectations and dependency/artifact hygiene, but endpoint malware-control tooling and recurring evidence are not demonstrated. Evidence: VULN,ENG. |
| A.8.8 | Technological | Yes | Partial | Dependency auditing, vulnerability reporting, threat review, remediation tracking, and change controls exist; complete remediation-effectiveness history and broader scanning coverage remain incomplete. Evidence: VULN,SEC,ENG. |
| A.8.9 | Technological | Yes | Partial | A configuration baseline/register defines source-controlled desired state, provider-side drift concerns, review triggers, and exceptions; recurring external reconciliation/automation remains incomplete. Evidence: CFG. |
| A.8.10 | Technological | Yes | Partial | Data retention/deletion rules, Git-history limitations, logical purge expectations, credential revocation, backup inheritance, and verification requirements are defined; D1/R2/runtime deletion effectiveness is not yet fully validated. Evidence: DATA. |
| A.8.11 | Technological | Yes | Partial | Public-safe logging and telemetry apply redaction/minimization and sensitive-field exclusion; comprehensive masking inventory and validation remain partial. Evidence: SEC,DATA,OPS. |
| A.8.12 | Technological | Yes | Partial | Secrets, restricted data, private incident evidence, identity data, and MCP data boundaries are explicitly constrained from public surfaces; dedicated DLP tooling/monitoring is not claimed. Evidence: DATA,SEC,MCP. |
| A.8.13 | Technological | Yes | Partial | Backup/recovery/source-reconstruction procedures and a restore-test register exist; actual D1/R2 backup mechanisms and successful RT-001 restore evidence remain incomplete. Evidence: REC,CONT. |
| A.8.14 | Technological | Yes | Partial | Provider-distributed infrastructure, graceful degradation, recovery priorities, and continuity modes are documented; provider redundancy and alternate-platform effectiveness are not independently verified. Evidence: CONT,OPS,SUP. |
| A.8.15 | Technological | Yes | Met | Application logging and separate audit events are implemented with explicit redaction, bounds, event intent, and public-safe behavior. Evidence: OPS,SEC,EVID. |
| A.8.16 | Technological | Yes | Partial | Health, uptime, usage, logs, audit events, and scheduled observations exist; full detection, alerting, escalation, and response coverage remains incomplete. Evidence: OPS,INC. |
| A.8.17 | Technological | No | N/A | Excluded — no customer-managed infrastructure clock service is operated; runtime timestamps are inherited from platform services and remain a supplier dependency. |
| A.8.18 | Technological | Yes | Partial | Administrative/privileged utilities are constrained by authenticated routes, scoped tokens, controlled workflows, and logging; complete utility inventory and periodic authorization review remain partial. Evidence: ACCESS,SEC. |
| A.8.19 | Technological | Yes | Partial | Operational software changes are delivered through controlled source, CI, tags/releases, and deployment workflows; serverless runtime installation is provider-managed and broader installation-policy evidence is limited. Evidence: CHANGE,ENG. |
| A.8.20 | Technological | Yes | Partial | Application-layer network boundaries, origin/auth checks, scoped interfaces, and provider edge controls are documented; provider network configuration and assurance remain partially verified. Evidence: SEC,CFG,SUP. |
| A.8.21 | Technological | Yes | Partial | Security expectations for externally exposed services, APIs, webhooks, identity, MCP, and provider dependencies are documented; provider-side service assurance remains partial. Evidence: SEC,SUP,ENG. |
| A.8.22 | Technological | No | N/A | Excluded — no WizardGang-managed VLAN/network-segmentation infrastructure exists in the serverless production architecture; isolation is enforced primarily through provider and application/data boundaries. |
| A.8.23 | Technological | No | N/A | Excluded — the scoped system is not an organizational end-user web-browsing environment and does not operate a managed web-filtering gateway. |
| A.8.24 | Technological | Yes | Partial | Cryptographic use, HMAC, transport/auth patterns, secrets, key lifecycle, rotation/revocation, and compromise handling are governed; provider-managed encryption/key assurance and private lifecycle evidence remain partial. Evidence: CRYPTO,SEC. |
| A.8.25 | Technological | Yes | Met | The repository uses a controlled secure-development lifecycle with permanent DEMO IDs, risk classification, required controls/validation/evidence, review, release/deploy traceability, and rollback expectations. Evidence: CHANGE,ENG. |
| A.8.26 | Technological | Yes | Partial | Application-security requirements for authentication, authorization, secrets, validation, logging, APIs/webhooks/MCP, error handling, accessibility, and failure behavior are defined; completeness is risk-scaled rather than independently certified. Evidence: SEC,ENG. |
| A.8.27 | Technological | Yes | Partial | Architecture standards, trust boundaries, least privilege, fail-closed design, data separation, resilience, and secure-engineering principles are documented; independent architecture/threat-model review remains incomplete. Evidence: EVID,ENG. |
| A.8.28 | Technological | Yes | Partial | Secure-coding expectations, negative-path validation, code review, CI checks, secret handling, injection/auth boundaries, and AI-generated-code parity are defined; dedicated SAST and independent secure-code review are not claimed. Evidence: ENG,SEC. |
| A.8.29 | Technological | Yes | Partial | Unit, contract, route, security-source, dependency, migration, build, and negative/abuse-path testing are governed; independent penetration testing, dedicated DAST/SAST/fuzzing, and broader acceptance evidence remain incomplete. Evidence: ENG,CHANGE. |
| A.8.30 | Technological | No | N/A | Excluded — no outsourced development supplier is currently evidenced. External AI/code-assistance does not transfer WizardGang development accountability; reassess if development is contracted to a supplier. |
| A.8.31 | Technological | Yes | Partial | Local development, CI validation, and tagged production deployment are separated with controlled configuration/secret boundaries; comprehensive environment-access and test-data separation evidence remains partial. Evidence: CHANGE,CFG,DATA. |
| A.8.32 | Technological | Yes | Met | Permanent DEMO IDs, risk/impact fields, validation, evidence, PR review, release/rollback metadata, tagged delivery, and deployment verification form the controlled change process. Evidence: CHANGE,EVID. |
| A.8.33 | Technological | Yes | Partial | Test/demo information is governed by data classification, public-safe boundaries, minimization, retention/deletion rules, and secure-engineering expectations; recurring validation that production-sensitive data never enters tests remains partial. Evidence: DATA,ENG. |
| A.8.34 | Technological | Yes | Gap | Formal audit/self-assessment governance exists, but a specific demonstrated production-safe audit-testing authorization, isolation, scheduling, cleanup, and recovery procedure/evidence set is not yet established. Evidence: AUDIT,ENG. |

## Control selection and treatment

Applicable controls are selected from the declared scope, interested-party requirements, policies, risk registers, supplier dependencies, architecture, data, operational requirements, and controlled evidence.

Treatment work uses the controlled lifecycle:

`requirement / risk → DEMO-### → branch → PR → validation → review → merge → release → deployment → verification → evidence`

A control status change requires evidence. Risk acceptance remains explicit and attributable; it is not implied by SoA approval.

## Remaining priority gaps

- **A.5.35 independent review:** no completed independent security review, penetration test, or sufficiently objective formal internal audit is evidenced.
- **A.8.1 endpoint devices:** developer/admin endpoint hardening and managed endpoint security are not demonstrated.
- **A.8.34 audit testing:** production-safe audit-testing authorization/isolation/cleanup evidence remains undefined at an operating level.

High-value Partial controls still require real evidence, especially first supplier/access/competence reviews, `EX-001`, `RT-001`, recurring threat review, D1/R2 restore/deletion validation, provider-side configuration verification, and formal management review/audit evidence.

## Alignment

This is repository-controlled governance evidence for an **ISO-aligned, uncertified** management-system demonstration. Independent certification is not claimed.
