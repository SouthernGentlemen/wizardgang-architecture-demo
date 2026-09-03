# Information Security Risk Register

<!-- BEGIN GENERATED ASSURANCE PROJECTION -->

**Reference:** WG-REG-001

**Framework:** Information Security

**Applies to:** ISO/IEC 27001:2022 §6.1.2–§6.1.3

**Status:** Approved

**Owner:** WizardGang

**Assessment date:** 2026-09-02

**Approval:** Controlled pull request and merge

**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

**Review due:** 2026-12-02

## Current Register

**Records:** 15

| ID | Risk | Inherent | Residual | Treatment | Status | Review due |
|---|---|---:|---:|---|---|---|
| SEC-RISK-001 | Credential or secret exposure | 20 Critical | 10 High | Reduce | Treating | 2026-12-02 |
| SEC-RISK-002 | Unauthorized privileged administration | 20 Critical | 10 High | Reduce | Treating | 2026-12-02 |
| SEC-RISK-003 | Source-control or delivery-pipeline compromise | 20 Critical | 15 High | Reduce | Treating | 2026-12-02 |
| SEC-RISK-004 | Open-source dependency or software supply-chain compromise | 16 High | 12 High | Reduce | Treating | 2026-12-02 |
| SEC-RISK-005 | Forged or replayed webhook requests | 16 High | 8 Moderate | Reduce | Treating | 2026-12-02 |
| SEC-RISK-006 | Sensitive information disclosed through public diagnostics | 16 High | 8 Moderate | Reduce | Treating | 2026-12-02 |
| SEC-RISK-007 | Persistent data loss or corruption without demonstrated recovery | 12 High | 12 High | Reduce | Treating | 2026-12-02 |
| SEC-RISK-008 | Cloudflare service or platform dependency disrupts operation | 12 High | 9 Moderate | Reduce / Share | Open | 2026-12-02 |
| SEC-RISK-009 | GitHub dependency disrupts source, CI/CD, or release operations | 9 Moderate | 9 Moderate | Reduce / Share | Open | 2026-12-02 |
| SEC-RISK-010 | Identity-provider failure or misconfiguration affects authentication | 12 High | 8 Moderate | Reduce / Share | Treating | 2026-12-02 |
| SEC-RISK-011 | Authorization-scope bypass across application interfaces | 20 Critical | 10 High | Reduce | Treating | 2026-12-02 |
| SEC-RISK-012 | Resource exhaustion, abusive traffic, or cost pressure degrades service | 16 High | 9 Moderate | Reduce | Treating | 2026-12-02 |
| SEC-RISK-013 | Security incident response is incomplete or unexercised | 12 High | 12 High | Reduce | Treating | 2026-12-02 |
| SEC-RISK-014 | Release or deployment drift causes unauthorized or untraceable production state | 12 High | 6 Moderate | Reduce | Treating | 2026-12-02 |
| SEC-RISK-015 | Stale or inaccurate assurance evidence causes false security conclusions | 9 Moderate | 9 Moderate | Reduce | Treating | 2026-12-02 |

<!-- END GENERATED ASSURANCE PROJECTION -->

## Purpose

This register presents the information-security risks for the WizardGang Architecture Demo management-system scope. Canonical risk state is maintained in `assurance/risks/risks.json`; this Markdown document provides generated state plus human-readable methodology and interpretation guidance.

The assessment covers confidentiality, integrity, availability, authorization, auditability, delivery, recovery, and trustworthy operation. It does not treat planned controls as completed controls and does not represent ISO/IEC 27001 certification.

## Rating Method

Risk scoring follows `docs/governance/RISK-MANAGEMENT.md`:

`risk score = likelihood × impact`

| Score | Rating |
|---|---|
| 1–4 | Low |
| 5–9 | Moderate |
| 10–16 | High |
| 17–25 | Critical |

Inherent risk is assessed before controls; residual risk is assessed after currently evidenced controls. Planned treatment does not lower residual risk until implemented and verified.

## Interpretation

Risk status, treatment direction, review dates, evidence relationships, and record counts are canonical JSON fields or deterministic projections from them. Merge of a risk record does not imply risk acceptance; acceptance remains a separate attributable governance decision.

## Governance Process

Edit canonical risk records in `assurance/risks/risks.json`, then run `npm run generate:assurance-summaries`. Narrative outside the generated markers may explain method or interpretation, but it must not restate record status, rationale, evidence, ownership, lifecycle state, or counts as an independent source.
