# Security Maintenance Register

**Reference:** WG-REG-008  
**Framework:** Integrated ISMS / AIMS security maintenance  
**Status:** Approved
**Owner:** Information Security Owner / Management-System Owner  
**Initial review due:** 2026-12-02  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register records recurring vulnerability-management, threat-intelligence, security-maintenance, authority-contact, and security-community activities for the WizardGang Architecture Demo.

It is intentionally conservative. The existence of CI, a vulnerability-reporting file, or a documented process is not treated as proof that recurring reviews, remediation targets, endpoint-malware controls, or authority/security-community interactions have already occurred.

## 2. Status Values

- **Active** — operating control exists and produces current evidence.
- **Partial** — useful control/evidence exists but coverage or recurring proof is incomplete.
- **Planned** — requirement/process exists but the operating evidence has not yet been produced.
- **Gap** — required control/evidence is materially absent.
- **N/A** — not applicable to the current scope, with rationale.

## 3. Initial Register

<!-- GENERATED:governance-records:security-maintenance:start -->
| ID | Area | Current state | Evidence / basis | Current gap / next action | Owner | Review / target |
|---|---|---|---|---|---|---|
| VM-001 | Dependency vulnerability audit | **Active** | CI installs locked dependencies and runs `npm audit --audit-level=high` through `npm run security:dependencies`. | Continue on PR/main validation; applicable findings still require triage, remediation, and closure evidence. | Information Security Owner | Every controlled CI run; monthly review summary |
| VM-002 | Source-security validation | **Partial** | CI runs `npm run validate:security` before build/evidence generation. | Maintain scope and demonstrate that the checks remain adequate as auth, webhook, identity, data, and MCP boundaries change. | Information Security Owner | Every controlled CI run; material security change |
| VM-003 | Private vulnerability reporting | **Partial** | GitHub private vulnerability reporting is enabled and linked by `SECURITY.md`, `/security`, and `/.well-known/security.txt`. | Retain a periodic availability/notification check without publishing sensitive report details. | Information Security Owner | Enabled and verified 2026-09-02; annual/material change |
| VM-004 | Vulnerability triage and remediation timing | **Planned** | DEMO-096 defines Critical/High/Medium/Low response targets and exception/risk-acceptance rules. | Produce actual finding records when applicable; do not invent a clean historical SLA record. | Information Security Owner | Event-driven; monthly review |
| VM-005 | Post-remediation effectiveness verification | **Planned** | DEMO-096 requires focused testing, CI, release/deployment identity, and residual-risk review before closure. | First applicable vulnerability remediation must retain verification evidence. | Change Owner / Security Owner | Event-driven |
| TI-001 | Dependency and upstream advisory review | **Partial** | `npm audit` consumes dependency advisory information during CI; upstream project/security notices are recognized sources. | Add an attributable monthly review record covering material direct/transitive dependencies and used runtimes. | Information Security Owner | Monthly; first review by 2026-12-02 |
| TI-002 | GitHub and Cloudflare security intelligence | **Planned** | Both are Critical suppliers and material supplier changes already trigger risk/review. | Establish a lightweight monthly/event-driven review of relevant security/platform notices; retain dated conclusion/action. | Supplier Owner / Security Owner | Monthly + material supplier notice |
| TI-003 | Codex, Claude, and MCP security intelligence | **Planned** | Codex and Claude are the only approved AI/MCP families; MCP protocol/SDK changes already trigger AI reassessment when material. | Establish a lightweight review of provider/MCP security or protocol changes that could affect tool authority, data exposure, client behavior, or impact assumptions. | AI Governance Owner / Security Owner | Monthly + material provider/protocol notice |
| TI-004 | Broader credible threat-intelligence review | **Planned** | DEMO-096 permits relevant CERT/CSIRT, upstream, provider, and credible security-research sources. | Record only sources relevant to the actual stack/exposure; first dated review due 2026-12-02. | Information Security Owner | Monthly/event-driven |
| SC-001 | Security-community / special-interest participation | **Planned** | Procedure defines monitoring/consultation without claiming membership. | Record actual subscriptions, consultations, memberships, or responsible-disclosure interactions only when they occur. | Information Security Owner | Annual + event-driven |
| AC-001 | Authority-contact decision framework | **Partial** | Incident process and DEMO-096 define when law enforcement, regulator, CERT/CSIRT, provider, contractual, or other authority contact may need consideration. | No fictional universal list; actual SEV-1/SEV-2 incidents must record the notification/contact decision and specialist review where needed. | Management-System Owner / Incident Owner | Event-driven; annual process review |
| MW-001 | Developer/admin endpoint malware protection | **Gap** | Repository process defines expected OS security updates, malware protection where appropriate, locked dependencies, credential hygiene, and compromise response. | No independent endpoint-hardening/anti-malware evidence is retained in the public management system. Establish proportionate evidence without publishing device-sensitive details. | Information Security Owner | Initial evidence by 2026-12-02; annual/material endpoint change |
| SC-002 | Package/workflow supply-chain maintenance | **Partial** | Lockfile, `npm ci`, dependency audit, controlled Git changes, scoped workflow credentials, and supplier process exist. | Add explicit review evidence for materially risky package/action changes and compromised/abandoned dependency decisions. | Change Owner / Security Owner | Every material dependency/workflow change |
| AISEC-001 | AI/MCP security-maintenance boundary | **Partial** | Current MCP is read-only and bounded; Codex/Claude only; AI risk/impact/supplier review triggers already exist. | Accumulate provider/protocol threat-review evidence and security regression cases beyond the current narrow boundary evaluation. | AI Governance Owner / Security Owner | Monthly + every material MCP change |
| MET-001 | Security-maintenance metrics | **Planned** | DEMO-096 defines overdue High/Critical findings, open-age, treatment coverage, threat-review freshness, and remediation timing as useful measures. | No accumulated operating history yet; summarize after first review cycle and feed management review. | Evidence / Security Owner | Quarterly/management review |
<!-- GENERATED:governance-records:security-maintenance:end -->

## 4. Vulnerability Record Template

When an applicable vulnerability is identified, add a controlled record containing at least:

```text
ID: VULN-###
Discovered:
Source:
Affected component/service:
Affected version/configuration:
Applicability: Confirmed | Suspected | Not applicable
Priority: Critical | High | Medium | Low
Publicly exposed: Yes | No | Conditional
Security impact:
AI/MCP impact (if any):
Supplier involved:
Owner:
Containment:
Treatment:
Target date:
DEMO change:
Incident/risk references:
Validation:
Residual risk:
Status: Open | Contained | Remediating | Verifying | Closed | Risk accepted
Closed/reviewed:
Public-safe notes:
```

Sensitive exploit information, credentials, private infrastructure detail, or forensic evidence must remain outside the public register. The public record may point to a controlled private evidence location where one exists.

## 5. Threat Review Record Template

A lightweight recurring review may be retained as:

```text
ID: THREAT-REVIEW-YYYY-MM
Review date:
Reviewer:
Sources reviewed:
Relevant findings:
Applicability decisions:
Actions opened:
Risk/supplier/AI-impact updates:
No-action rationale where applicable:
Next review:
```

`No relevant action` is a valid result only when an actual attributable review occurred.

## 6. Contact / Community Record Template

Actual authority/security-community interactions may be recorded as:

```text
ID: SECURITY-CONTACT-###
Date:
Type: Authority | CERT/CSIRT | Provider | Security community | Researcher | Other
Reason:
Owner:
Sensitive details location (if any):
Outcome / decision:
Incident/risk references:
Follow-up:
```

Do not publish personal contact details, credentials, protected case information, or sensitive incident evidence merely to populate this register.

## 7. Initial Evidence Conclusions

The current register supports the following conclusions:

- dependency auditing is an **Active** automated control;
- source-security validation and supply-chain controls are **Partial** because the automated checks do not establish complete vulnerability-management effectiveness;
- private vulnerability reporting is **Partial** until configuration/availability is evidenced;
- recurring threat-intelligence review is **Planned**;
- authority-contact criteria are defined but actual contact evidence remains event-driven;
- security-community participation is **Planned** and no membership is claimed;
- developer/admin endpoint malware evidence remains a **Gap**;
- AI/MCP security maintenance is **Partial**, with Codex and Claude remaining the only approved AI/MCP families;
- no historical vulnerability or remediation record is fabricated by this baseline.

## 8. Review Triggers

Review this register when:

- a new Critical/High vulnerability is identified;
- a dependency or GitHub Action changes materially;
- a security incident occurs;
- GitHub or Cloudflare changes a material security boundary;
- Codex, Claude, MCP protocol, or MCP SDK behavior changes materially;
- a new authentication/identity mechanism is enabled;
- a new public data surface is created;
- a control status in the SoA depends on new vulnerability/threat evidence;
- an audit/self-assessment finds security-maintenance weakness;
- or the monthly/annual review becomes due.

## 9. Supporting Evidence

- `docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`
- `SECURITY.md`
- `.github/workflows/ci.yml`
- `package.json`
- `package-lock.json`
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`
- `docs/governance/registers/SUPPLIER-REGISTER.md`
- `docs/governance/INCIDENT-MANAGEMENT.md`
- `docs/governance/COMPETENCE-AWARENESS-COMMUNICATION.md`
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`

**Current posture:** Initial security-maintenance inventory established. Automated dependency audit exists; recurring human threat review, remediation-effectiveness history, endpoint-malware evidence, and actual contact/community records remain incomplete. Alignment is uncertified.
