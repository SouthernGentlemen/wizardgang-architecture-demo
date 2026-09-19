# Security Governance

**Reference:** WG-POL-001
**Owner:** Information Security Owner
**Applies to:** information security, assets, access, credentials, cryptography, vulnerability management, threat intelligence, and security responsibilities across the WizardGang Architecture Demo
**Review:** At least annually and after a material security, identity, supplier, architecture, incident, or credential-boundary change

## 1. Purpose

This document is the current security-governance authority for the application. It defines security requirements and responsibilities without duplicating structured assurance state, change mechanics, release mechanics, or historical implementation narrative.

The executable source and contracts remain authoritative for runtime behavior. Structured records under assurance/governance and assurance/risks remain authoritative for current inventories, findings, status, and evidence.

## 2. Security Principles

Security decisions are risk based, least privilege is the default, trust boundaries are explicit, secrets remain outside public source and public logs, and critical controls fail closed when their prerequisites cannot be trusted.

Provider-managed controls do not transfer WizardGang's responsibility for secure configuration, permissions, data exposure, integration behavior, monitoring, and the decision to continue using a service.

This repository demonstrates engineering alignment with ISO/IEC 27001 and ISO/IEC 42001; it does not claim certification.

## 3. Policy Commitments

WizardGang shall:

- identify information-security risk and select proportionate controls;
- grant access only for defined business or engineering purposes and revoke it when no longer required;
- protect credentials, secrets, authentication material, private identifiers, and sensitive operational information;
- keep production secrets in managed secret stores and local placeholders in ignored development configuration;
- validate untrusted input at application and protocol boundaries;
- preserve authentication and authorization decisions independently from caller-controlled metadata;
- keep public logs and diagnostics disclosure safe and bounded;
- review known vulnerabilities, dependency advisories, material supplier notices, and relevant threat information;
- preserve recoverability and continuity without weakening security boundaries;
- investigate material security events and feed lessons into risk, control, and management review;
- apply security controls to AI/MCP integrations as part of the same application boundary; and
- use docs/CHANGE-MANAGEMENT.md and docs/RELEASE-MANAGEMENT.md as the sole detailed authorities for controlled-change and release execution.

## 3. Asset Categories

Current asset categories include application source and contracts; D1, R2, Durable Object, log, audit, and runtime state; credentials and authorization configuration; governance and assurance records; supplier services; AI/MCP assets; and privileged administrative endpoints or sessions.

The authoritative current asset inventory is assurance/governance/asset-inventory.json.

## 4. Security Responsibilities

The Management-System Owner approves policy, risk treatment, and material exceptions. The Information Security Owner coordinates security risk, access review, vulnerability handling, incident security decisions, and periodic review. Technical and Change Owners implement controls and evidence validation. Supplier Owners review external-service boundaries. Privileged users protect credentials, use only authorized access, and report suspected compromise promptly.

## 4. Current Implemented Cryptographic Baseline

Current application cryptography relies on established platform and library mechanisms rather than custom algorithms. The baseline includes HTTPS/TLS at provider boundaries, HMAC verification for signed webhooks and internal derivation where specified, authenticated encryption for protected identity/session payloads, secure random token material, and fixed-length digest comparison for applicable credential checks.

Cryptographic applicability, implementation evidence, gaps, and review triggers are maintained in assurance/governance/cryptography-secrets.json. The repository does not claim Git commits or tags are cryptographically signed unless that control is explicitly implemented and verified.

## 4. Vulnerability Intake Sources

Potential vulnerabilities may enter through private vulnerability reports, dependency and package advisories, GitHub or Cloudflare notices, identity-provider notices, MCP/protocol or SDK notices, automated security checks, testing, audit, incident investigation, credible security research, or maintainer discovery.

Sensitive vulnerability detail is handled through the private reporting boundary described in SECURITY.md rather than public issues.

## 5. Acceptable Use

In-scope assets may be used only for authorized development, testing, demonstration, deployment, operation, monitoring, incident handling, recovery, governance, assurance, accessibility verification, and approved maintenance.

Unacceptable use includes publishing secrets or private credentials, bypassing required authorization, using privileged access outside its approved purpose, intentionally disrupting the public service outside an approved test or incident exercise, placing private data into a public interface without review, or using an external provider to expand authority without the required risk and supplier review.

## 6. Secret and Authentication-Information Categories

Secret and authentication information includes administrator credentials, Worker secrets, webhook signing secrets, identity-provider client credentials, session and token protection material, private certificates or keys, GitHub or Cloudflare access tokens, and equivalent privileged authentication material.

config/worker-secrets.json is authoritative for the names, required/optional status, consuming capability, minimum enforced length, and owner of Worker-managed values. Secret values are never part of that inventory or any public assurance record.

## 7. Access Classes

Access is separated by purpose, including public read access, repository contribution, merge/release authority, workflow credentials, provider administration, application administration, identity-derived application writes, reporting administration, and AI/MCP access.

No broad operator bearer credential is accepted by the application. Application bearer writes use short-lived identity-derived tokens restricted to a server-derived visitor namespace. Public REST, GraphQL, and MCP reads remain governed by the explicit demo:read boundary; privileged reporting and administration use their separately defined controls.

The current machine-readable access-class authority is assurance/governance/access-classes.json.

## 8. Access Lifecycle

Access requires a defined owner, business or engineering purpose, minimum necessary authority, and an approved authentication path. Material role or responsibility changes trigger review. Access is changed or revoked when its purpose ends, a user or service changes role, a credential is exposed, a supplier relationship changes, or risk requires restriction.

Shared credentials are avoided where accountable individual or service identities are available. Emergency access does not create a permanent entitlement.

## 9. Secret Distribution and Use

Secret values are provisioned only through approved provider-managed channels or ignored local development files. They must not appear in source, pull-request prose, issues, logs, command-line arguments that expose them, screenshots, public evidence, or AI/MCP outputs.

Credentials are scoped to the smallest practical capability. Suspected exposure triggers revocation or rotation, impact review, and incident handling as appropriate. Recovery documentation identifies names and owners, not secret values.

## 9. Threat Intelligence

Threat review focuses on information relevant to the actual application stack, exposed interfaces, dependencies, identity providers, Cloudflare/GitHub services, and approved AI/MCP integrations. Automated advisories are inputs to triage rather than proof of applicability or remediation.

Relevant threat information may trigger vulnerability triage, supplier review, risk reassessment, control testing, incident handling, or a controlled change.

## 11. Malware and Development-Endpoint Security

Devices and sessions used for privileged development or administration must use supported operating-system security updates, reasonable malware protection for the platform, protected credential storage, and compromise-response practices proportionate to their authority.

Public governance evidence must not expose device-sensitive configuration. Gaps in endpoint-hardening evidence remain visible in the structured security-maintenance record rather than being converted into unsupported assurance claims.

## 11. Periodic Access Review

Privileged repository, provider, release, and administrative access is reviewed at least quarterly and after material personnel, credential, supplier, incident, or authority changes. Other material access is reviewed at least annually or when its purpose changes.

Review evidence records what was checked, what changed, unresolved gaps, owner, and follow-up without publishing credential values.

## 13. Privileged Access

Privileged access is granted narrowly, protected by strong provider authentication where available, separated from public application behavior, and used only for approved administrative purposes. Provider consoles, deployment credentials, repository administration, and application administration do not inherit authority from ordinary public or identity-derived demo access.

## 14. Source-Code Access

Public source readability does not imply write, merge, workflow, release, or provider authority. Source changes follow repository permissions and the controlled-change process. Access capable of modifying protected source, workflow behavior, or release controls is privileged and reviewed accordingly.

## 15. Contacts With Authorities

A security event may require contact with a regulator, law-enforcement body, CERT/CSIRT, supplier, contractual counterparty, insurer, specialist counsel, or other authority. The Incident Owner and Management-System Owner make and record that decision based on actual legal, contractual, safety, security, and materiality requirements.

No fictional universal contact list is treated as current evidence.

## 16. Security Communities and Special-Interest Sources

Relevant provider advisories, upstream projects, CERT/CSIRT sources, standards bodies, and credible security communities may inform threat and vulnerability review. Membership or consultation is claimed only when it actually occurs and can be evidenced.

## 17. Evidence and Structured Authorities

Current inventories and operating status are maintained in assurance/governance/asset-inventory.json, access-classes.json, access-reviews.json, cryptography-secrets.json, security-maintenance.json, security-testing.json, assurance/risks/risks.json, and assurance/incidents/incidents.json.

SECURITY.md owns public vulnerability-reporting and disclosure guidance. This document does not duplicate secret values, runtime configuration, current register rows, or historical change records.
