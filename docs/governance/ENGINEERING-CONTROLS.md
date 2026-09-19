# Engineering Controls

**Reference:** WG-GOV-026
**Owner:** Technical and Change Owner
**Applies to:** secure engineering, architecture, configuration, testing, dependency/supplier integration, environment separation, and controlled delivery gates
**Review:** At least annually and after a material architecture, configuration, supplier, security, testing, or delivery-control change

## 1. Purpose

This document defines engineering requirements that support the current security and AI management systems without duplicating the detailed change and release procedures.

docs/CHANGE-MANAGEMENT.md is the sole detailed authority for controlled-change identity, risk, validation, review, commit, and merge mechanics. docs/RELEASE-MANAGEMENT.md is the sole detailed authority for tag, deployment, secret-preflight, verification, and rollback mechanics.

Executable source, contracts, route declarations, migrations, and provider configuration remain authoritative for implemented behavior.

## Secure Engineering and Security Testing Standard

Engineering work applies risk-scaled requirements, explicit trust boundaries, least privilege, deterministic validation, current supported dependencies, disclosure-safe logging, and independent verification where the impact warrants it.

Security testing is evidence of the tested scope and point in time; it is not a certification or proof that no vulnerability exists.

## Configuration Baseline and Drift Management

Configuration is controlled through explicit authoritative sources and provider state. Source-controlled configuration must be reviewable and reproducible; provider-side configuration that cannot be fully represented in source must have an owner and verification approach.

Unexplained drift is investigated before being accepted as the new baseline. Emergency reconciliation follows incident and change governance rather than silently normalizing unreviewed provider state.

## 3. Existing Controlled Development Lifecycle

The current lifecycle requires an isolated controlled change, proportional risk and controls, required validation, reviewable evidence, and a defined rollback target. This document sets engineering security gates only; the exact controlled-change workflow is maintained in docs/CHANGE-MANAGEMENT.md.

Production deployment occurs only through the release process defined in docs/RELEASE-MANAGEMENT.md.

## 4. Risk-Scaled Engineering Requirements

Low-risk documentation or presentation changes may use ordinary validation appropriate to the changed surface. Application behavior, routes, storage, identity, authorization, secrets, persistence schemas, deployment controls, privileged administration, destructive behavior, AI authority, or external trust boundaries require progressively stronger review and focused tests.

## 4. Authoritative Baseline Sources

Authoritative engineering baselines include package and lock files, route declarations and generated route artifacts, machine-interface contracts, migrations and schemas, config/worker-secrets.json, source-controlled provider bindings, structured assurance records, and approved external provider configuration that cannot be represented in source.

Generated files remain projections of their authoritative inputs.

## 4. Supplier Classification

External services are classified by the consequence of failure or compromise, access to data or credentials, effect on release/operations, and effect on AI or identity boundaries. Classification is not reduced because a provider's internal controls are not visible.

The authoritative current supplier inventory is assurance/governance/suppliers.json.

## 5. Security Requirements Analysis

Before implementation, material changes identify affected assets, data, trust boundaries, authentication/authorization, secrets, storage, suppliers, failure behavior, logging/evidence, privacy, recovery, and abuse or misuse paths.

## 6. Secure Architecture and Design

Public clients are untrusted. Workers mediate access to persistent stores, provider APIs, identity providers, webhooks, reporting, and MCP. Interfaces return only data required by their contract and enforce authorization server-side.

Security controls are composed from established platform and library mechanisms.

## 6. Initial Review and Approval

A material supplier or external-service integration is reviewed for purpose, criticality, data access, credentials, permissions, security/reliability information, contractual constraints, continuity/exit concerns, and required monitoring before it is relied on.

Approval covers WizardGang's use of the service, not the supplier's internal systems.

## 7. Configuration and Least Privilege

Provider tokens, application credentials, workflow permissions, and service bindings use the minimum authority practical for the capability. Configuration changes are attributable and verified against the intended baseline.

## 7. Secure Coding Expectations

Validate input, constrain output, encode/escape by context, use parameterized storage access, preserve explicit authorization, avoid custom cryptography, handle errors without sensitive disclosure, bound resource use, and keep secret/private material out of logs and public responses.

## 8. Environment Separation

Development placeholders, test state, and production credentials are separated. Real production secrets do not belong in source, test fixtures, screenshots, public evidence, or local examples.

Tests must not depend on destructive production access.

## 8. Required Validation Layers

Validation is selected from static/type checks, unit and integration tests, contract/schema validation, negative authorization tests, route artifact checks, security validation, governance/assurance validation, dependency audit, migration validation, build verification, accessibility/localization checks, and focused scenario tests appropriate to the changed surface.

The repository's required command set is authoritative in package.json, AGENTS.md, and the controlled-change record. This document does not maintain a duplicate command checklist.

### 8.5 MCP/AI integration testing

MCP/AI boundary tests verify allowed methods and tools, reject unknown methods and invalid namespaces, preserve read-only/non-destructive authority where required, enforce approved data sources, and keep supplier/client identity from becoming authorization.

Changes to provider family, tool authority, write behavior, data boundary, or human oversight require AI governance reassessment in addition to engineering tests.

## 9. GitHub Configuration Baseline

Repository settings that materially affect branch protection, review, Actions, release, secrets, or controlled history are security-relevant configuration. Desired state is verified through available repository settings checks and provider evidence; gaps remain explicit when an external setting cannot be fully verified.

## 9. Monitoring and Periodic Review

Material suppliers and provider configuration are reviewed at least annually and more frequently where criticality, risk, access, incident history, or provider change requires it. Security advisories and platform changes can trigger event-driven review.

## 10. Test Data and Environment Rules

Tests use synthetic, public-demo, or otherwise approved data. Credentials, private identity records, payment data, sensitive vulnerability reports, and production-only information are not copied into ordinary fixtures.

## 12. AI-Assisted Engineering

AI-assisted coding or review remains subject to the same source-review, testing, data, secret, licensing, and controlled-change requirements as human-authored work. Private credentials or restricted data are not supplied to an external AI service without an explicitly approved data and supplier boundary.

AI output is not accepted as evidence that a control passed; the resulting source and verification are reviewed directly.

## 13. Evidence and Assurance

Engineering assurance uses current source/contracts plus structured security-testing, configuration, supplier, risk, and evidence records. Provider-native CI and release records prove actual execution for their scope.

## 20. Current Evidence Limitations

Automated checks do not prove every provider-side setting, every vulnerability is absent, every recovery path works, or every supplier control is effective. Current gaps and partial controls stay visible in structured assurance records until corresponding evidence exists.

Documentation consolidation does not change runtime behavior or upgrade any assurance conclusion.
