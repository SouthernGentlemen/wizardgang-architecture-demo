# Competence and Awareness Register

**Reference:** WG-REG-006  
**Framework:** Integrated ISMS / AIMS support  
**Status:** Approved
**Owner:** Management-System Owner  
**Assessment date:** 2026-09-02  
**Initial review due:** 2026-12-02  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register records the competence and awareness requirements for material WizardGang Architecture Demo management-system roles and the current evidence posture for those requirements.

It is deliberately conservative. A role is not marked competent merely because it exists in `ROLES-RESPONSIBILITIES.md`, and a policy is not treated as awareness evidence merely because it is committed to Git.

## 2. Status Values

- **Adequate** — current evidence supports the responsibility and risk level.
- **Partial** — useful evidence exists but additional corroboration, training, exercise, specialist input, or review is needed.
- **Planned** — the competence/awareness activity or evidence has been identified but has not yet been completed.
- **Restricted** — the activity must not proceed without additional competence, supervision, specialist input, or approval.
- **N/A** — the role/activity is not currently used; rationale required.

A status in this register is management-system evidence status, not a professional credential or certification statement.

## 3. Initial Competence Baseline

| ID | Role / activity | Required competence | Current evidence | Current status | Required next evidence |
|---|---|---|---|---|---|
| COMP-001 | Management-System Owner | Scope, policy, risk, objectives, SoA, controlled documented information, management review, corrective action | Controlled management-system artifacts `DEMO-070` onward demonstrate active implementation of the defined governance model | Partial | Complete the initial competence/self-assessment review and retain rationale for areas requiring specialist or independent support |
| COMP-002 | Change / Release Owner | `DEMO-###` lifecycle, CI, semantic versioning, tag-only release/deployment, rollback, verification | `CHANGE-MANAGEMENT.md`, release workflows/docs, controlled repository history | Partial | Retain periodic release-control review evidence and verify any high-risk change receives proportional specialist/security review |
| COMP-003 | Operations / Recovery Owner | Cloudflare operation, health/log evidence, admin/offline controls, incident escalation, recovery | `OPERATIONS.md`, incident process, backup/recovery procedure, runtime evidence model | Partial | Complete `RT-001` technical restore exercise and retain observed recovery results |
| COMP-004 | Information Security Owner | Authentication/authorization, secrets, logging, webhook/security boundaries, security risk, incident response | `SECURITY.md`, security risk register, incident/corrective-action procedures, security-oriented implementation evidence | Partial | Complete focused security-control review and use specialist input for unfamiliar high-impact threats where needed |
| COMP-005 | AI Governance / Capability Owner | MCP protocol/tools, intended use, server-side authorization, AI risk/impact, supplier boundary, evaluation, change triggers | AI policy, AI risk register, MCP impact assessment, SoA, MCP implementation/evaluation evidence | Partial | Expand AI evaluation coverage and complete first competence/awareness review; reassess before any authority/provider expansion |
| COMP-006 | Accessibility Verification Owner | WCAG 2.2 criteria relevant to the demo, automated/manual distinction, keyboard/focus/reflow/AT testing | `ACCESSIBILITY.md` and accessibility demo/evidence structure | Partial | Retain dated manual verification evidence and obtain specialist/AT review where internal evidence is insufficient |
| COMP-007 | Supplier Owner | Provider responsibility boundary, permissions, data/AI exposure, continuity, review triggers | Supplier-management procedure and initial supplier register | Partial | Complete initial periodic supplier review for GitHub, Cloudflare, Codex, and Claude by the scheduled review date |
| COMP-008 | Incident / Corrective-Action Owner | Severity, evidence preservation, containment, investigation, communication, corrective action, effectiveness | Incident and Clause 10 procedures | Planned | Complete `EX-001` incident exercise and retain lessons/actions |
| COMP-009 | Internal Auditor / Independent Reviewer | Audit method, sampling, evidence evaluation, findings, impartiality | Audit program defines requirements and self-assessment distinction | Restricted | Formal internal-audit claims require a reviewer with sufficient objectivity from the audited work; self-review remains self-assessment |

## 4. Initial Awareness Baseline

The initial awareness cycle is **Planned**. Approval of this register does not mark it complete.

| ID | Awareness topic | Audience | Required evidence | Target date | Status |
|---|---|---|---|---|---|
| AW-001 | Information Security Policy and secret/public-evidence boundaries | All people performing material in-scope work | Dated acknowledgement, briefing, or attributable review record | 2026-12-02 | Planned |
| AW-002 | AI Policy, MCP intended use, human accountability, and AI reassessment triggers | AI/MCP and management roles | Dated acknowledgement/briefing and any questions/actions | 2026-12-02 | Planned |
| AW-003 | Codex and Claude as the only approved AI/MCP provider/client families | AI/MCP, supplier, security, operations, management roles | Dated acknowledgement/briefing | 2026-12-02 | Planned |
| AW-004 | `DEMO-###` controlled change, release, and evidence requirements | Change/release/contributor roles | Attributable review or onboarding evidence | 2026-12-02 | Planned |
| AW-005 | Incident, vulnerability, AI concern, and sensitive-evidence reporting routes | All material roles | Exercise/briefing acknowledgement; can be combined with `EX-001` | 2026-12-02 | Planned |
| AW-006 | WCAG evidence expectations and no-certification/no-overclaim posture | Accessibility, change, evidence, management roles | Dated review/briefing record | 2026-12-02 | Planned |
| AW-007 | Recovery limitations: source reconstruction is not D1/R2 restore assurance | Operations, release, security, management roles | Dated review or `RT-001` exercise participation | 2026-12-02 | Planned |

## 5. Evidence Rules

A competence or awareness entry may be moved from `Planned` or `Partial` only when evidence identifies enough of the following to support the conclusion:

- person or accountable role;
- activity/topic;
- date;
- evidence source;
- method used to establish competence or awareness;
- important limitation;
- resulting action where needed;
- reviewer/owner;
- next review trigger or date.

Successful execution can be useful competence evidence, but a single successful change is not automatically proof of competence for every future activity.

## 6. Small-Operator Model

The current system may have one person performing several roles. This register therefore evaluates **functions and evidence** rather than inventing separate employees or departments.

Where objectivity, specialist knowledge, or independent assurance is needed, the appropriate response is external/specialist support or a clear limitation—not a fabricated internal role separation.

Formal internal audit remains subject to the independence rules in `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md`.

## 7. AI/MCP Competence Boundary

AI/MCP competence must include understanding that:

- WizardGang controls the MCP server, tool schemas, authorization, validation, data selection, limits, logging, and release decisions;
- external model reasoning, prompting, memory, and downstream actions remain outside direct WizardGang control;
- current MCP authority is public read-only and non-destructive;
- client/provider identity does not grant privilege;
- **Codex and Claude are the only approved AI/MCP connection families**;
- a new provider/client family is a material change;
- and new write, privileged, destructive, deployment, private-data, or autonomous authority requires risk and impact reassessment before approval.

## 8. Review Triggers

Review competence/awareness when:

- a role materially changes;
- a new high-risk activity is introduced;
- a control fails because of knowledge or process weakness;
- an incident/exercise identifies a competence gap;
- a new supplier or AI/MCP provider is proposed;
- AI authority, data, intended use, oversight, or protocol materially changes;
- a recovery test fails;
- an audit/self-assessment identifies a support gap;
- or management review determines additional competence/resources are required.

## 9. Current Posture

This register establishes the evidence model and initial planned review cycle. It does not claim completed training or a completed competence assessment.

**Current posture after approval:** Competence evidence is Partial/Planned; awareness cycle Planned; formal internal-audit independence Restricted until a suitably objective reviewer is used; certification is not claimed.
