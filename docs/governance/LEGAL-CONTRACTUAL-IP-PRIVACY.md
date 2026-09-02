# Legal, Regulatory, Contractual, Intellectual-Property, and Privacy Obligations

**Reference:** WG-GOV-023  
**Applies to:** ISO/IEC 27001:2022 organizational compliance, legal/contractual, intellectual-property, records, privacy, supplier, incident, and documented-information controls · ISO/IEC 42001:2023 legal/contractual, transparency, data, supplier, impact, incident, and external-reporting obligations affecting the AIMS  
**Status:** Proposed  
**Owner:** Management-System Owner  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material jurisdiction, service, supplier, data, user population, contract, license, public-claim, incident, or AI/MCP change

## 1. Purpose

This procedure defines how the WizardGang Architecture Demo identifies, evaluates, records, implements, and reviews legal, regulatory, contractual, intellectual-property, privacy, and other externally imposed obligations relevant to the scoped ISMS and AIMS.

The project is a public architecture demonstration, not a legal-compliance product. The management system therefore distinguishes:

- obligations that are currently evidenced and directly applicable;
- contractual/provider obligations created by actual service use;
- voluntary standards commitments adopted by WizardGang;
- conditional obligations that apply only when a jurisdiction, data type, user population, transaction, incident, or other trigger exists;
- and matters whose applicability must be determined before a compliance claim is made.

Approval of this procedure does **not** constitute legal advice, a legal-compliance opinion, certification, or a finding that every possible law in every jurisdiction applies or has been satisfied.

## 2. Core Principles

1. **Do not invent legal obligations.** A law, notification deadline, retention period, filing requirement, or regulator is not recorded as applicable without a reasonable factual basis.
2. **Do not ignore conditional triggers.** When scope, users, data, geography, suppliers, or services change, potentially applicable obligations must be reassessed.
3. **Source matters.** Legal/regulatory duties, provider contracts, software licenses, internal policies, voluntary standards, and public commitments are recorded separately.
4. **Public claims must match evidence.** `aligned`, `demonstrated`, `evidenced`, `partial`, `gap`, and `uncertified` remain preferred terms unless stronger assurance is independently established.
5. **Provider terms are not inherited controls.** GitHub, Cloudflare, OpenAI, Anthropic, identity providers, and other suppliers retain responsibility for provider-controlled systems; WizardGang remains responsible for its use, configuration, data, permissions, and compliance decisions.
6. **Privacy follows actual data.** A demonstration field can still become personal information if a visitor enters real identifying data.
7. **Licenses are operational requirements.** Open-source and third-party content obligations must be preserved when code, packages, documentation, or media are redistributed or reused.
8. **Retention periods require a basis.** Internal engineering retention may be defined, but no statutory retention period is invented without an identified source.
9. **Incident duties are fact-dependent.** Notification to users, providers, authorities, insurers, or other parties depends on the event, data, contract, and jurisdiction.
10. **Escalate uncertainty.** Material uncertainty involving privacy, intellectual property, regulatory duties, breach notification, export controls, or contractual exposure should be reviewed by qualified counsel or another competent specialist rather than resolved through unsupported assumption.

## 3. Obligation Sources

Potential obligations may originate from:

- statutes, regulations, rules, and binding governmental requirements;
- court orders, legal holds, subpoenas, or other lawful process;
- contracts, provider terms, data-processing terms, acceptable-use terms, and service agreements;
- software and content licenses;
- privacy notices, public promises, and user-facing commitments made by WizardGang;
- internal policies and approved management-system decisions;
- voluntary standards adopted as alignment targets;
- customer/client requirements if the demo is later used in a commercial engagement;
- and incident-specific notification or preservation requirements.

The authoritative lightweight register is `docs/governance/registers/OBLIGATIONS-REGISTER.md`.

## 4. Applicability States

Each obligation is assigned one of these applicability states:

- **Applicable** — the current system/use creates a known obligation.
- **Conditional** — the obligation applies only if a documented trigger occurs.
- **Voluntary / Internal** — WizardGang has adopted the requirement as an internal or standards-alignment commitment rather than asserting legal compulsion.
- **Needs determination** — enough information exists to flag the topic, but legal/contractual applicability has not been established.
- **N/A** — outside the current scope, with rationale and a review trigger.

Applicability is separate from evidence status.

Evidence status continues to use:

- **Met**;
- **Partial**;
- **Gap**;
- **N/A**.

## 5. Applicability Assessment

Before representing an external obligation as applicable, the owner should identify as relevant:

- source and citation or contractual reference;
- jurisdiction or governing agreement;
- role WizardGang performs in the activity;
- system/service/data/process affected;
- trigger that makes the requirement applicable;
- required action or restriction;
- timing or deadline if actually established;
- required records/evidence;
- accountable owner;
- supplier dependency;
- security, privacy, AI, accessibility, or incident implications;
- and review/expiry conditions.

Where those facts are not available, the item remains `Conditional` or `Needs determination`.

## 6. Current Known Licensing and IP Baseline

### 6.1 WizardGang repository license

The repository currently contains an MIT License identifying WizardGang as the copyright holder.

When copies or substantial portions of the licensed software are distributed, the MIT copyright and permission notice must be preserved as required by the license.

### 6.2 Third-party software

The project uses npm/open-source dependencies. Third-party packages remain subject to their own licenses.

Requirements:

- do not assume the repository's MIT License replaces dependency licenses;
- review new material dependencies before use where licensing terms are unusual, reciprocal, restrictive, unclear, or incompatible with intended distribution;
- preserve required notices/attributions when distribution obligations apply;
- do not remove upstream copyright/license notices improperly;
- and retain enough package/version evidence to identify the dependency set used by a release.

A complete generated third-party license/attribution inventory is not currently treated as evidenced merely because `package-lock.json` exists.

### 6.3 Third-party content, trademarks, and documentation

Images, screenshots, logos, trademarks, copied text, test data, and other content must have an appropriate basis for use.

The public demo should avoid implying endorsement, affiliation, certification, or ownership of third-party brands where none exists.

Material externally sourced content should record its source/license/permission where needed.

## 7. Provider and Contractual Obligations

Actual use of external services creates provider-specific contractual and acceptable-use obligations.

Current material supplier families include:

- GitHub;
- Cloudflare;
- OpenAI Codex;
- Anthropic Claude;
- configured identity providers when activated;
- npm/open-source dependency sources.

Provider obligations are reviewed through the supplier register and relevant provider terms for the account/service actually used.

A supplier's marketing page or certification does not replace review of WizardGang's own configuration, permissions, data handling, or contractual responsibilities.

The management system does not publish private account terms, billing identifiers, contract numbers, or credentials into the public repository.

## 8. Privacy and Personal Information

The current demo includes visitor/session features that can contain names, email addresses, and other visitor-entered content. Such fields are treated conservatively because real identifying information may be entered even when the feature is demonstrative.

Privacy requirements include:

- collect only data necessary for the demonstration or security/operational purpose;
- avoid encouraging entry of sensitive or regulated personal information;
- maintain session/principal isolation;
- keep visitor, identity, log, R2, and secret data outside the public MCP boundary;
- avoid storing personal information in public logs or public governance evidence;
- define retention/deletion based on purpose and applicable obligations;
- evaluate supplier/data-flow implications before adding a provider or new data path;
- and reassess whether a public privacy notice or other user-facing disclosure is required when actual processing, retention, jurisdiction, or supplier behavior makes one appropriate.

**Current legal limitation:** this procedure does not assert that a specific privacy statute applies or does not apply. Applicability depends on facts such as jurisdiction, user population, data categories, scale, business role, contractual commitments, and actual processing behavior.

## 9. Security Incident and Breach Notification

The incident-management process must determine whether a material incident creates an external notification or preservation duty.

Potential recipients may include, when actually required:

- affected users;
- service providers;
- contractual counterparties;
- insurers;
- legal counsel;
- competent governmental or regulatory authorities;
- law enforcement;
- or other affected parties.

No universal notification deadline is established here.

Incident review must instead determine:

1. what happened;
2. what data/systems were affected;
3. which jurisdictions/contracts apply;
4. whether the event meets an applicable notification threshold;
5. what timing/content rules apply;
6. what evidence must be preserved;
7. who approves and performs notification;
8. and what risk/SoA/corrective-action updates follow.

## 10. Accessibility Obligations

WCAG 2.2 is an adopted accessibility alignment target for the public demo.

That standards target is separate from any legal accessibility requirement that may apply to a particular service, organization, contract, or jurisdiction.

Rules:

- do not claim WCAG certification;
- distinguish automated checks from manual verification;
- retain actual accessibility evidence;
- remediate known regressions proportionately;
- and obtain legal/specialist review if a specific statutory or contractual accessibility obligation must be determined.

## 11. ISO 27001 and ISO 42001

ISO/IEC 27001:2022 and ISO/IEC 42001:2023 are voluntary management-system alignment targets in the current scope.

WizardGang does not represent the demo as certified.

The standards become a contractual obligation only if a future agreement specifically makes them one. Until then they remain internal/voluntary governance commitments supported by the current SoAs, risk processes, policies, evidence, audit/self-assessment, management review, and continual-improvement framework.

## 12. Records, Retention, and Legal Hold

Operational and management-system records are retained according to business, security, audit, recovery, evidence, and identified external needs.

If a legal hold, dispute, investigation, contractual preservation requirement, or lawful request applies:

- ordinary deletion/pruning may need to be suspended for the affected records;
- the scope and authority for preservation should be recorded privately as appropriate;
- evidence integrity must be maintained;
- unrelated sensitive data should not be over-collected merely because a hold exists;
- and public governance records should not expose privileged or sensitive legal material.

No statutory retention duration is created by this procedure.

## 13. Public Claims and Representations

Public compliance, security, privacy, accessibility, AI, supplier, availability, or assurance statements must be supportable by current evidence.

Prohibited representations include:

- claiming ISO certification without independent certification;
- claiming complete WCAG conformance without sufficient evidence;
- claiming a supplier control as a WizardGang-operated control;
- claiming privacy-law compliance without an applicability/evidence basis;
- claiming a vulnerability-free or incident-free system as proof of security;
- claiming Codex or Claude identity as authenticated application identity;
- or representing a planned audit, restore test, access review, training event, or exercise as completed.

## 14. Change Triggers

The obligations register must be reviewed when any of the following materially changes:

- WizardGang's legal/business entity or contracting model;
- target geography or user population;
- collection of new personal, sensitive, regulated, payment, health, employment, education, biometric, precise-location, or other materially different data;
- data retention or deletion behavior;
- cookies/tracking/analytics behavior;
- user accounts or authentication flows;
- commercial transactions or paid services;
- new customer/client contracts;
- GitHub, Cloudflare, Codex, Claude, identity-provider, or other material supplier terms;
- new AI/MCP provider family;
- new AI write/privileged/destructive/autonomous authority;
- third-party copyrighted/trademarked content;
- dependency/license changes;
- material security/privacy/AI incident;
- regulatory inquiry, legal demand, dispute, or legal hold;
- or a public assurance statement becoming stronger or broader.

## 15. Legal/Specialist Review Trigger

Qualified legal or specialist review should be obtained before making a material decision where the team cannot reasonably determine:

- whether a privacy law applies;
- whether a breach/incident is externally notifiable;
- whether a license permits intended distribution/use;
- whether third-party content can be published;
- whether export/sanctions restrictions affect a use or recipient;
- whether a regulator/authority must be contacted;
- whether a contract creates a specific security/AI/accessibility obligation;
- or whether a legal hold or preservation duty exists.

The management system records the decision and source; it does not replace professional legal judgment.

## 16. Evidence and Review

Evidence may include:

- repository `LICENSE`;
- package manifests and lockfile;
- supplier register/reviews;
- controlled contracts/terms records kept outside public source where sensitive;
- data register and privacy/data-flow assessments;
- incident records and notification decisions;
- security and AI risk records;
- SoAs;
- accessibility evidence;
- public site notices/claims;
- releases and change records;
- legal/specialist advice summaries where appropriate and non-privileged;
- and management review decisions.

The Management-System Owner reviews the obligation register at least annually and after the material triggers above.

## 17. Alignment

This procedure principally supports:

- ISO/IEC 27001:2022 Annex A legal/statutory/regulatory/contractual, intellectual-property, records, privacy, supplier, incident, and compliance-review controls;
- ISO/IEC 42001:2023 external obligations, data, supplier, transparency, incident, impact, and management-system compliance requirements;
- the repository's `aligned — uncertified` assurance model.

**Current posture after approval:** obligation identification and review are formally defined; specific jurisdictional compliance remains evidence- and trigger-dependent and is not broadly claimed.