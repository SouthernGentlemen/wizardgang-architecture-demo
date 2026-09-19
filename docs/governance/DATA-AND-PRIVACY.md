# Data and Privacy Governance

**Reference:** WG-GOV-020
**Owner:** Data and Privacy Owner
**Applies to:** data classification, inventory, collection, storage, disclosure, retention, deletion, privacy, legal/contractual obligations, and AI/MCP data boundaries
**Review:** At least annually and after a material data, storage, identity, supplier, legal, privacy, or AI/MCP boundary change

## 1. Purpose

This document defines the current data and privacy rules for the WizardGang Architecture Demo. Structured inventories under assurance/governance remain authoritative for current data assets, retention rules, and obligations.

## 2. Data Principles

Collect and retain only what is needed for a defined purpose. Classify data by disclosure and impact. Keep secret and private information out of public source, logs, evidence, and public AI/MCP outputs. Apply retention and deletion rules to the actual storage class rather than assuming source-control recoverability is a data backup.

Privacy, licensing, intellectual-property, contractual, and other legal obligations are reviewed when scope or data use changes.

## 3. Data Classification Model

The application uses practical disclosure classes: Public, Public-demo, Internal/operational, and Restricted. Classification follows the most restrictive applicable content within a record or payload.

Restricted information includes credentials, secrets, authentication material, private identity/session information, sensitive vulnerability detail, private account/payment data, and equivalent high-impact information.

## 3. Obligation Sources

Potential obligations may arise from applicable law, privacy requirements, contracts, supplier terms, software and content licenses, intellectual-property rights, security commitments, records requirements, and standards or customer commitments actually adopted by the project.

assurance/governance/obligations.json is the current structured authority for identified obligations, applicability, basis, and remaining work.

## 5. Authoritative Data Inventory

assurance/governance/data-inventory.json is authoritative for current data categories, purpose, system of record, classification, access boundary, retention/deletion posture, and known gaps.

New persistent data or a material change in purpose, classification, recipient, storage, or disclosure requires inventory and risk review before release.

## 6. Current Known Licensing and IP Baseline

Repository licensing and third-party dependency licenses are governed by the actual checked-in license and dependency metadata. Source, documentation, trademarks, external content, and supplier terms are used only within their applicable rights and conditions.

A new dependency, dataset, model/service, media asset, or external content source must be reviewed when its license or terms create a material distribution, attribution, privacy, data-use, or operational obligation.

## 6. Public and Public-Demo Data

Public interfaces return only data intentionally approved for public disclosure. A public-demo namespace is not permission to mix in private identity, provider, billing, secret, vulnerability-report, or privileged operational information.

Synthetic examples must not be presented as real operating records.

## 8. Privacy and Personal Information

Personal information is processed only for a defined application or security purpose and is minimized to the fields required for that purpose. Identity normalization separates provider credentials from application identity and session state. Public logs and assurance projections exclude private identifiers and authentication material.

Where a supplier processes relevant personal information, its role, data flow, retention, contractual terms, and transfer considerations are reviewed proportionately before the integration is relied on.

## 9. Operational Data and Public Diagnostics

Application logs, health output, usage metrics, audit evidence, and reporting projections are disclosure bounded. Public operational output must not expose passwords, bearer tokens, authorization headers, cookies, secret values, payment data, private account identifiers, unreviewed request bodies, or raw upstream errors that could reveal sensitive detail.

Operational logs explain runtime behavior; audit/evidence records preserve meaningful control or assurance events.

## 12. Records, Retention, and Legal Hold

assurance/governance/data-retention.json is authoritative for current retention and deletion policy by data class. Retention periods are tied to purpose, operational need, evidence requirements, legal/contractual obligations, and storage capability.

When a valid legal hold or equivalent preservation requirement applies, ordinary deletion for the affected records is suspended to the extent required. The decision, scope, owner, and release of the hold must be recorded without publishing protected content.

## 13. AI/MCP Data Boundary

The public MCP boundary may expose only data sources explicitly approved for that interface. It does not inherit access to identity/session records, secrets, privileged logs, private reporting data, provider account data, or other restricted stores.

A new AI/MCP data source, broader recipient, write authority, or changed supplier data handling is a material data and AI governance change and requires reassessment before release.

## 16. Deletion and Expiration

Deletion is implemented according to the current retention policy and storage capability. Expired or no-longer-required application data is removed or anonymized where the governing rule requires it, subject to valid preservation obligations.

Deleting a source-controlled current document does not erase Git history; Git is the authority for superseded repository states. That distinction must not be confused with deletion of application, identity, log, or object data.

## 17. Data Responsibilities

The Data and Privacy Owner maintains classification and inventory policy. Technical Owners implement storage, access, retention, and deletion controls. Supplier Owners review external data handling. Incident Owners preserve and restrict evidence during incidents. AI Governance owns the approved AI/MCP data boundary jointly with Data and Security Owners.

## 18. Evidence

Current data, retention, and obligation state is maintained in assurance/governance/data-inventory.json, data-retention.json, obligations.json, suppliers.json, and assurance/risks/risks.json.

This document states policy; it does not duplicate those records or turn missing operating evidence into a stronger status.
