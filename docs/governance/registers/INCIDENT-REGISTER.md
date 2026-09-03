# Incident and Exercise Register

<!-- BEGIN GENERATED ASSURANCE PROJECTION -->

**Reference:** WG-REG-004

**Framework:** Integrated ISMS / AIMS

**Status:** Approved

**Owner:** Incident and Corrective-Action Owner / WizardGang

**Baseline date:** 2026-09-02

**Approval:** Controlled pull request and merge

**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

**Review due:** 2026-12-02

**Review cadence:** At least quarterly and after every material incident or exercise

## Current Status

**Actual incident records:** 0

No actual incident records are established in the current retained register. This is not a claim that defects, outages, vulnerabilities, near misses, or incidents have never occurred.

| ID | Title | Status | Detected | Final severity |
|---|---|---|---|---|


**Exercise records:** 1

Exercises are simulated readiness activities, not historical incidents. Planned exercises are not completion evidence.

| ID | Type | Scenario | Scope | Due / completed | Owner | Status | Evidence records |
|---|---|---|---|---|---|---|---:|
| EX-001 | Tabletop / response exercise | Combined security + AI/MCP incident scenario | Credential/authorization containment, MCP boundary, supplier communication, recovery, evidence, corrective action | 2026-12-02 | Incident and Corrective-Action Owner | Planned | 0 |

<!-- END GENERATED ASSURANCE PROJECTION -->

## Purpose

This document presents actual incident and incident-response exercise records within the WizardGang Architecture Demo management-system scope. Actual incidents use permanent `INC-###` identifiers; exercises and tabletops use permanent `EX-###` identifiers so simulated scenarios are never presented as historical incidents.

Canonical incident state lives in `assurance/incidents/incidents.json`; canonical exercise state lives in `assurance/incidents/exercises.json`. This Markdown document is presentation and governance guidance only.

## Incident Record Requirements

Actual incident records should capture the facts needed to understand detection, severity, scope, impact, containment, evidence preservation, investigation, recovery, notification decisions, linked risks and controls, corrective actions, closure authority, residual limitations, and next review. Missing facts remain explicitly unknown until established.

## Exercise Record Requirements

Exercise records should capture date, scenario, objectives, participants, tested systems/processes, evidence available to responders, decisions, observed gaps, communication decisions, risk implications, improvement actions, owners, target dates, and management-review input. Exercises must always remain clearly identified as simulated.

## Severity and Categories

Actual incidents use the incident-management severity model from SEV-1 Critical through SEV-4 Low. Categories may include security, AI/MCP, supplier, data, operational, privacy/confidentiality, accessibility, and governance/evidence; multiple categories may apply.

## Communication, Closure, and Follow-Up

Material incidents require an attributable communication/notification decision. Closure requires evidence that active impact is contained or ended, recovery or accepted limitation is documented, material evidence is retained, linked reviews and corrective actions are addressed, and an accountable closure decision exists.

## Governance Process

Edit incident and exercise records only in their canonical JSON datasets, then run `npm run generate:assurance-summaries`. Narrative outside the generated markers may describe process requirements, but it must not independently state current incidents, exercise status, ownership, evidence, relationships, lifecycle state, or counts.
