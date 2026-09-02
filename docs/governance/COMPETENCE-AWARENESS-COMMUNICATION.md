# Competence, Awareness, Communication, and AI Concern Reporting

**Reference:** WG-GOV-019  
**Applies to:** ISO/IEC 27001:2022 §7.2–§7.4 and relevant awareness/event-reporting controls · ISO/IEC 42001:2023 §7.2–§7.4 and relevant competence, concern-reporting, external-reporting, and AI-incident communication controls  
**Status:** Approved
**Owner:** Management-System Owner  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually and after material role, supplier, AI/MCP, incident, audit, scope, policy, or communication changes

## 1. Purpose

This procedure defines how the WizardGang Architecture Demo establishes and evidences competence, maintains relevant security and AI awareness, plans management-system communications, and receives and handles concerns about AI/MCP behavior.

It expands the support framework in `docs/governance/MANAGEMENT-SYSTEM-SUPPORT.md` without replacing it. The goal is to create usable operating evidence rather than assume that a role assignment, policy file, or successful deployment proves competence or awareness.

Approval of this procedure establishes the process. It does **not** claim that training has already been completed, that every role has been independently assessed, that no concerns exist, or that ISO/IEC 27001 or ISO/IEC 42001 certification has been achieved.

## 2. Operating Principles

1. **Role assignment is not competence evidence.** A person may hold a role before all desired evidence is consolidated; gaps remain visible until addressed.
2. **Competence is proportional.** The evidence needed for a routine documentation change is different from the evidence needed for security-sensitive work, AI authority expansion, accessibility verification, recovery testing, or formal internal audit.
3. **Awareness is activity-specific.** Contributors need to understand the requirements relevant to the work they perform rather than memorize the entire management system.
4. **Communication is deliberate.** Material management-system information has an owner, audience, channel, timing trigger, and sensitivity boundary.
5. **Concerns are not incidents by default.** A concern may become a risk, incident, nonconformity, supplier issue, impact-assessment trigger, or improvement item after triage.
6. **Sensitive matters stay private.** Credentials, active vulnerabilities, private infrastructure details, personal information, and sensitive evidence must not be placed into public GitHub issues or public governance records.
7. **No synthetic completion.** Planned training, planned awareness activity, or an unused reporting channel is not treated as completed evidence.
8. **Public assurance remains qualified.** These records support an aligned — uncertified posture only.

## 3. Competence Model

Competence is evaluated against the responsibility being performed.

Evidence may include:

- relevant professional or implementation experience;
- demonstrated controlled changes and validation history;
- formal education or certification where relevant;
- completed training or self-study;
- successful exercises or technical assessments;
- specialist review;
- supervised or independently reviewed work;
- documented familiarity with the applicable policy, risk, procedure, or standard;
- and evidence that prior identified competence gaps were addressed effectively.

The authoritative lightweight competence/awareness record is `docs/governance/registers/COMPETENCE-AWARENESS-REGISTER.md`.

## 4. Role-Based Competence Expectations

| Function | Minimum competence expectation | Additional evidence when risk increases |
|---|---|---|
| Management-System Owner | Scope, policy, risk, objectives, SoA, review, corrective-action, and approval model | Specialist or independent support for legal, certification, or assurance matters outside reasonable internal expertise |
| Change / Release Owner | `DEMO-###` lifecycle, CI evidence, semantic releases, tagged deployment, rollback, and release verification | Independent or specialist review for high-risk release/control changes |
| Operations Owner | Cloudflare runtime, health/log evidence, admin/offline behavior, recovery, incident escalation | Completed recovery/incident exercises and evidence of restoring important controls |
| Information Security Owner | Authentication/authorization, secrets, logging, vulnerability handling, risk treatment, incident handling | Security specialist input for unfamiliar high-impact threats or controls |
| AI Governance / Capability Owner | MCP protocol/tool boundaries, intended use, authorization parity, AI risk, impact assessment, supplier boundary, evaluation | Reassessment before write/privileged/destructive/autonomous authority or new AI/MCP supplier |
| Accessibility Verification Owner | Applicable WCAG 2.2 criteria, automated/manual distinction, keyboard/focus/reflow/AT testing | Specialist assistive-technology review where internal evidence is insufficient |
| Supplier Owner | Provider responsibility boundary, least privilege, availability/continuity, data/AI implications, review triggers | Contractual/security specialist input when the dependency or terms materially change |
| Incident / Corrective-Action Owner | Severity, evidence preservation, containment, investigation, corrective action, effectiveness verification | Specialist support for major security, AI, privacy, legal, or forensic events |
| Internal Auditor / Independent Reviewer | Audit criteria, sampling, evidence evaluation, findings, impartiality | Sufficient independence from the subject being formally audited |

The same person may hold several current roles. The management system does not invent organizational separation where none exists, but it must not represent self-review as independent assurance.

## 5. Competence Assessment and Gaps

A competence review should answer:

1. What responsibility is being performed?
2. What knowledge or skill is necessary for that responsibility?
3. What evidence currently supports the competence conclusion?
4. What important limitations remain?
5. Is the evidence adequate for the risk of the activity?
6. Is training, specialist support, supervision, independent review, or scope reduction required?
7. When should competence be reviewed again?

Possible outcomes are:

- **Adequate** — evidence supports the current responsibility and risk level;
- **Partial** — useful evidence exists but additional competence or corroboration is needed;
- **Planned** — the requirement is identified but the evidence/activity has not yet occurred;
- **Not applicable** — the role/activity is not currently used, with rationale;
- **Restricted** — the activity must not proceed without additional support or approval.

A competence gap may require:

- targeted training;
- documented self-study;
- supervised implementation;
- specialist consultation;
- independent review;
- narrowing the planned change;
- or deferring the activity.

## 6. Awareness Requirements

People performing in-scope work must understand, as relevant to their role:

- the Information Security Policy;
- the AI Policy for AI-related activity;
- the management-system scope and `aligned — uncertified` posture;
- their assigned responsibilities and approval limits;
- secrets and sensitive-information handling;
- security and AI risk escalation;
- the `DEMO-###` controlled-change and release process;
- supplier and dependency restrictions;
- incident reporting and evidence-preservation expectations;
- accessibility requirements relevant to public interfaces;
- AI intended-use, authority, data, human-oversight, and evaluation boundaries;
- the fact that **Codex and Claude are the only approved AI/MCP connection families** in the current demo scope;
- and the consequences of bypassing required controls or making unsupported public assurance claims.

Awareness may be established through onboarding, policy acknowledgement, review checklists, briefings, training, exercises, or other attributable evidence.

## 7. Initial Awareness Baseline

The first management-system awareness cycle should cover at minimum:

- information-security policy;
- AI policy;
- role and approval responsibilities;
- secret/public-evidence boundaries;
- incident and vulnerability reporting;
- AI/MCP intended use and Codex/Claude-only supplier boundary;
- change/release requirements;
- recovery and continuity expectations;
- accessibility evidence requirements;
- and certification/alignment claim restrictions.

A planned awareness activity is not marked complete until an attributable record identifies what was reviewed, by whom, when, and any resulting action.

## 8. Communication Planning

Material management-system communication should identify:

- **what** must be communicated;
- **why** the communication is necessary;
- **who** owns it;
- **who** needs to receive it;
- **when** it is triggered;
- **which channel** is appropriate;
- **what sensitivity restrictions** apply;
- and whether acknowledgement or response evidence is required.

## 9. Communication Matrix

| Trigger / subject | Owner | Audience | Normal channel | Evidence expectation |
|---|---|---|---|---|
| Policy, scope, or role change | Management-System Owner | Affected contributors/operators | Controlled PR/governance record | PR/merge plus updated awareness record where material |
| Material security risk or control change | Security / Risk Owner | Management-System Owner and affected technical roles | Risk record, issue/PR, direct escalation when urgent | Updated risk/treatment and controlled change |
| Material AI/MCP authority, data, intended-use, provider, or oversight change | AI Governance Owner | Management-System Owner, Security, affected operators | Risk/impact record + PR | AI risk/impact/SoA/supplier review before release |
| New AI/MCP provider request | AI Governance Owner | Management-System Owner | Controlled management-system change | Must remain unapproved until supplier/risk/impact/SoA/evaluation review completes |
| Incident or suspected compromise | Incident Owner | Required responders/management | Incident process; private channel for sensitive detail | `INC-###` or appropriate retained incident evidence |
| Public service degradation/offline state | Operations Owner | Public users where useful | Demo offline/status surfaces | Operational/audit evidence |
| Supplier outage/material supplier change | Supplier Owner | Management, operations, affected owners | Supplier record, issue/incident as applicable | Supplier/risk/update evidence |
| Audit/self-assessment finding | Auditor/reviewer | Management-System Owner + finding owner | Audit record | Finding, owner, due date, follow-up |
| Corrective action | Corrective-Action Owner | Affected owners/management | CA/issue/PR | Implementation and effectiveness evidence |
| Accessibility regression | Accessibility Owner | Change owner/management where material | Issue/PR/verification record | Updated verification and corrective work |
| Public assurance/compliance claim change | Evidence / Management-System Owner | Public reviewers/users | `/compliance`, docs, release/site content | Source/evidence mapping and controlled change |

Urgent communication may occur outside Git first, but material decisions and outcomes should be retained in a controlled record afterward without exposing sensitive details.

## 10. Dedicated AI/MCP Concern Reporting

The management system provides a dedicated path for concerns about the AI/MCP capability that do not necessarily qualify as security incidents.

Examples include concerns about:

- unexpected or excessive tool authority;
- misleading intended-use or limitation statements;
- data quality, provenance, freshness, or unintended data exposure;
- indirect instruction/prompt-injection behavior in returned content;
- human-oversight weakness;
- supplier/client behavior involving Codex or Claude;
- protocol/client compatibility creating unsafe behavior;
- accessibility or affected-party impact;
- bias, fairness, ethical, or safety concerns relevant to the scoped capability;
- evaluation gaps;
- or a public assurance statement that appears stronger than the evidence supports.

For **non-sensitive public concerns**, the repository's AI/MCP concern issue template may be used.

For concerns that include a suspected vulnerability, credential, private infrastructure detail, sensitive payload, personal information, or exploit information, reporters must **not** place those details in a public issue. They should follow the private vulnerability-reporting guidance in `SECURITY.md` when available.

## 11. AI Concern Triage

A received concern is reviewed to determine whether it is:

- informational / no action required;
- a documentation or communication issue;
- an improvement opportunity;
- a security or AI risk requiring register update;
- a supplier issue;
- an AI impact-assessment trigger;
- a Statement-of-Applicability change;
- a nonconformity or corrective action;
- an incident requiring `INC-###` handling;
- or a request outside the current supported scope.

Material concerns should record:

- date received;
- source/channel, without unnecessary personal data;
- affected capability;
- concern category;
- evidence or reproduction information where safe;
- triage decision;
- owner;
- related risk/incident/nonconformity/SoA/impact/supplier records;
- action and due date where needed;
- communication back to the reporter where appropriate;
- and closure rationale.

A concern is not closed merely because the expected behavior is undocumented. If the concern reveals a misleading claim, control weakness, unintended impact, or scope mismatch, the underlying record must be corrected.

## 12. Escalation Rules

Immediate escalation is required when a concern indicates possible:

- unauthorized privileged/write/destructive AI authority;
- sensitive data exposure;
- authentication/authorization bypass;
- compromise of credentials or infrastructure;
- material human or affected-party harm;
- repeated failure of an approved AI boundary;
- an unapproved AI/MCP provider or client family;
- significant supplier compromise;
- or a condition that may qualify as a SEV-1/SEV-2 incident.

The Incident Management procedure controls incident severity and response once the concern is classified as an incident.

## 13. AI/MCP Provider Boundary

Codex and Claude remain the only approved AI/MCP provider/client families for the current demo.

A report, outage, or concern involving Codex or Claude does not authorize substituting another provider. Adding another provider remains a material controlled change requiring supplier, security-risk, AI-risk, impact-assessment, SoA, evaluation, and management approval.

Client/provider identity remains descriptive only and must not be used as an authentication or authorization factor.

## 14. Evidence and Retention

Competence, awareness, communication, and concern evidence may include:

- `docs/governance/registers/COMPETENCE-AWARENESS-REGISTER.md`;
- controlled governance changes;
- policy acknowledgement or briefing records;
- training/exercise records;
- PR review or specialist-review evidence;
- issues and corrective actions;
- incident records;
- AI risk and impact-assessment updates;
- supplier review records;
- audit/self-assessment findings;
- management review;
- and public AI concern issues that contain no sensitive information.

Sensitive evidence must be retained only in an appropriate restricted system or summarized safely in public governance records.

## 15. Review Triggers

This process and its records are reviewed when:

- a role or responsibility materially changes;
- a competence gap affects a release/control/decision;
- a new contributor or specialist performs material in-scope work;
- a policy or scope changes;
- a material incident or concern occurs;
- a new AI/MCP capability or provider is proposed;
- Codex or Claude integration assumptions materially change;
- a supplier or legal/contractual requirement changes;
- an audit or management review finds awareness/communication weaknesses;
- or evidence becomes stale or insufficient.

## 16. Supporting Records

- `docs/governance/MANAGEMENT-SYSTEM-SUPPORT.md`
- `docs/governance/ROLES-RESPONSIBILITIES.md`
- `docs/governance/INFORMATION-SECURITY-POLICY.md`
- `docs/governance/AI-POLICY.md`
- `docs/governance/registers/COMPETENCE-AWARENESS-REGISTER.md`
- `docs/governance/INCIDENT-MANAGEMENT.md`
- `docs/governance/NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md`
- `docs/governance/SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`
- `SECURITY.md`

## 17. Current Posture

After approval, the management system will have an explicit competence, awareness, communication, and AI-concern process. The first competence/awareness review and recurring operating evidence remain to be completed and retained.

**Current posture after approval:** Process defined; operating evidence partial; certification is not claimed.
