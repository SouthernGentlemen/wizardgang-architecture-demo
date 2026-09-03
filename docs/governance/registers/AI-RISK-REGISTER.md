# AI Risk Register

<!-- BEGIN GENERATED ASSURANCE PROJECTION -->

**Reference:** WG-REG-002

**Framework:** AI Management

**Applies to:** ISO/IEC 42001:2023 planning and AI risk-management requirements

**Status:** Approved

**Owner:** WizardGang

**Assessment date:** 2026-09-02

**Approval:** Controlled pull request and merge

**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

**Review due:** 2026-12-02

**Review cadence:** Earlier upon a material AI/MCP change

## Current Register

**Records:** 15

| ID | Risk | Inherent | Residual | Treatment | Status | Review due |
|---|---|---:|---:|---|---|---|
| AI-RISK-001 | Unauthorized expansion of AI tool authority | 20 Critical | 8 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-002 | Authorization mismatch between AI and non-AI interfaces | 16 High | 8 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-003 | Indirect prompt or instruction injection through returned content | 12 High | 9 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-004 | Sensitive or unintended data exposure through AI-accessible tools | 15 High | 6 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-005 | Malformed or unsupported MCP requests bypass intended controls | 12 High | 4 Low | Reduce | Open | 2026-12-02 |
| AI-RISK-006 | Incorrect, stale, or incomplete data is over-trusted by an AI caller | 12 High | 9 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-007 | AI evaluation coverage is too narrow to detect regressions | 16 High | 9 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-008 | AI logging or evidence is insufficient or discloses inappropriate content | 12 High | 6 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-009 | AI/MCP capability drift occurs without risk reassessment | 16 High | 8 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-010 | External agent/model behavior causes misleading or unintended downstream use | 12 High | 8 Moderate | Reduce / Share | Treating | 2026-12-02 |
| AI-RISK-011 | MCP protocol, client, or integration changes cause unsafe or misleading behavior | 12 High | 6 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-012 | Human oversight is bypassed if privileged actions become AI-callable | 20 Critical | 8 Moderate | Avoid / Reduce | Treating | 2026-12-02 |
| AI-RISK-013 | Data quality or provenance weaknesses degrade AI-assisted interpretation | 12 High | 9 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-014 | Public AI-assurance claims are misunderstood as certification or complete safety | 12 High | 6 Moderate | Reduce | Treating | 2026-12-02 |
| AI-RISK-015 | AI incidents, concerns, or unexpected behavior are not handled consistently | 12 High | 9 Moderate | Reduce | Treating | 2026-12-02 |

<!-- END GENERATED ASSURANCE PROJECTION -->

## Purpose

This register presents AI-management risks for the WizardGang Architecture Demo. The current scope is the controlled Model Context Protocol (MCP) boundary and related agent-facing interfaces. Canonical risk state is maintained in `assurance/risks/risks.json`; this Markdown document provides generated state plus human-readable methodology and interpretation guidance.

WizardGang does not claim to develop or control a general-purpose AI model in this scope. External agents and models remain supplier- or user-controlled systems, while WizardGang remains responsible for the interface, permissions, data exposure, validation, logging, intended use, and other decisions within the declared scope. This register supports engineering alignment with ISO/IEC 42001 and does not represent certification or complete AI safety.

## Assessment Rules

The scoring model is defined in `docs/governance/RISK-MANAGEMENT.md`:

`risk score = likelihood × impact`

| Score | Rating |
|---|---|
| 1–4 | Low |
| 5–9 | Moderate |
| 10–16 | High |
| 17–25 | Critical |

Each canonical record distinguishes inherent exposure, residual exposure, treatment direction, and current lifecycle/status fields. Creation or merge of a record does not itself constitute risk acceptance.

## Interpretation

Risk status, treatment direction, review dates, evidence relationships, and record counts are canonical JSON fields or deterministic projections from them. Narrative guidance must not create a parallel statement of current risk state.

## Governance Process

Edit canonical risk records in `assurance/risks/risks.json`, then run `npm run generate:assurance-summaries`. Narrative outside the generated markers may explain purpose, assessment method, or interpretation, but it must not restate record status, rationale, evidence, ownership, lifecycle state, or counts as an independent source.
