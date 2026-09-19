# Incident and Continuity Governance

**Reference:** WG-GOV-017
**Owner:** Incident and Continuity Owner
**Applies to:** incident detection and response, evidence preservation, continuity, degraded operation, backup/export, recovery, restore testing, and return to normal
**Review:** At least annually and after a material incident, outage, recovery exercise, supplier dependency change, or storage/runtime architecture change

## 1. Purpose

This document defines one operating model for incidents, continuity, backup, recovery, and restoration. Incident handling contains and investigates events; continuity decides what can safely keep operating; recovery restores trustworthy service and data.

Structured incident, exercise, and recovery-test records remain authoritative for what actually occurred.

## 2. Incident Principles

Protect people, data, credentials, and trustworthy control before convenience. Classify and escalate based on actual impact and scope. Contain without unnecessarily destroying evidence. Keep security, authorization, privacy, and AI/MCP boundaries fail closed when trust is lost. Distinguish security advisories, incidents, vulnerability findings, and continuity exercises.

## 3. Roles and Decision Rights

The Incident Owner coordinates triage, containment, evidence, communication, recovery coordination, and post-incident review. Technical Owners investigate and restore affected capability. Security, Data/Privacy, AI Governance, Supplier, and Management-System Owners participate when their boundary is affected.

Only authorized owners may approve a degraded mode, risk acceptance, external notification, destructive recovery action, credential rotation, or return to normal.

## 5. Backup and Export Expectations

Source, contracts, migrations, and documented configuration are reconstructable from controlled repository and release state. Persistent D1 data, R2 objects, provider-side configuration, and secrets require their own recovery strategy where they cannot be reconstructed safely from source.

Backup/export evidence identifies scope, time, integrity or completeness checks, retention, storage protection, and restore usability where applicable. A provider feature is not claimed as an effective backup merely because the supplier offers it.

Secret recovery records identify required names, owners, and provisioning paths, never secret values.

## 5. Operating Modes

The service may operate in Normal, Degraded, Intentional Offline / Maintenance, or Recovery / Verification mode.

Degradation never authorizes bypass of authentication, authorization, secret handling, data restrictions, logging safety, or AI/MCP authority. Routes available during offline or recovery states remain governed by their route declarations.

## 6. Detection and Reporting Sources

Events may be detected through health checks, application logs, audit evidence, provider alerts, user or researcher reports, dependency/security advisories, failed validation, supplier notices, data-integrity checks, recovery tests, cost/resource signals, or maintainer observation.

Sensitive security reports follow SECURITY.md and are not copied into public incident detail.

## 7. Initial Triage

Triage establishes affected assets and users, current impact, start or discovery time, security/privacy/AI implications, supplier involvement, evidence sources, whether containment is required, whether continuity mode should change, and who owns the next decision.

## 8. Containment

Containment may isolate a route or integration, disable a capability, revoke or rotate credentials, restrict access, enter offline/degraded mode, stop a deployment, or otherwise reduce exposure. Containment actions must preserve evidence where practical and must not create an unreviewed authority expansion.

## 9. Evidence Preservation

Preserve relevant logs, audit events, provider records, release identity, configuration state, affected data samples, timestamps, and decision records proportionately to the event. Access to sensitive evidence is limited to those who need it.

Public incident or advisory projections contain only disclosure-approved fields.

## 10. Recovery Testing

Recovery controls are considered demonstrated only when the relevant restore or reconstruction path is tested or exercised with evidence. A test records scope, source/backup used, steps, result, actual duration, recovered point where applicable, integrity checks, control checks, failures, and follow-up.

A failed or partial test creates follow-up work; it is not rewritten as a successful control.

## 11. Alternate Operating Paths

Approved continuity options include provider-native resilience already part of the architecture, intentional offline mode, disabling a non-critical integration, serving only routes explicitly available during degraded operation, reconstructing source-controlled state from known-good release/source, restoring persistent data from verified recovery sources, and escalating to a supplier.

A market alternative is not treated as a ready failover path unless it is actually approved, configured, tested, and within the current security/data/AI boundary. AI provider substitution is not an emergency shortcut.

## 13. Communication and Notification Decisions

Incident communication identifies the audience, owner, timing, approved facts, confidentiality level, and required follow-up. Decisions about regulator, law enforcement, customer/contractual, supplier, CERT/CSIRT, insurer, or public notification use the actual applicable obligation and impact.

## 14. Recovery

Recovery restores a known-good, controlled state. It includes application integrity, expected configuration/bindings, authentication and authorization, secret readiness, data integrity, required logs/evidence, current route behavior, and relevant supplier dependencies.

Recovery from a security incident may require clean credentials or configuration rather than simply restoring a prior state that contains the same weakness.

## 15. Post-Incident Review

Material incidents receive a review of cause, contributing conditions, detection, containment, communications, recovery, control effectiveness, supplier involvement, residual risk, and corrective actions. Findings feed risk, objectives, governance, testing, and management review as appropriate.

## 16. Return to Normal

Return to normal is an explicit decision based on verified service health and trustworthy controls. A responding homepage or successful deployment alone is not sufficient proof of complete recovery.

## 17. Structured Evidence

Current records are maintained in assurance/incidents/incidents.json, assurance/incidents/exercises.json, assurance/governance/recovery-tests.json, assurance/operations/monitoring.json, assurance/risks/risks.json, and assurance/governance/suppliers.json.

The repository does not invent recovery-time, recovery-point, exercise, or incident evidence that has not actually been observed.
