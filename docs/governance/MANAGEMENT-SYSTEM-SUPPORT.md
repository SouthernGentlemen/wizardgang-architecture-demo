# Management-System Support

**Reference:** WG-GOV-009  
**Applies to:** ISO/IEC 27001:2022 §7.1–§7.5 · ISO/IEC 42001:2023 §7.1–§7.5  
**Status:** Proposed  
**Owner:** WizardGang  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material changes to personnel, operating model, tooling, communication needs, evidence requirements, or documented-information controls

## 1. Purpose

This document defines the support mechanisms used by the WizardGang Architecture Demo information security management system (ISMS) and AI management system (AIMS).

It covers:

- resources;
- competence;
- awareness;
- communication;
- creation and update of documented information;
- control of documented information;
- retention and traceability of management-system evidence.

The intent is to use the repository and existing engineering workflow as the management-system support environment rather than create a separate administrative document platform.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Operating Principle

Management-system support should remain proportional to the current scope and operating model.

The Architecture Demo is maintained as a small, repository-centered system. A control is therefore not considered stronger merely because it produces more paperwork.

Support controls should instead make it possible to answer:

1. Are the necessary people, systems, services, tools, and time available?
2. Does the person performing a controlled activity have the required knowledge or ability?
3. Do relevant people understand the policies, risks, responsibilities, and consequences that apply to their work?
4. Are material internal and external communications intentional and attributable?
5. Can the current approved version of a management-system record be identified?
6. Can prior versions and approval history be reconstructed?
7. Can sensitive documented information be protected while public governance evidence remains inspectable?

## 3. Resources — Clause 7.1

WizardGang determines and provides resources necessary to establish, operate, maintain, and improve the scoped ISMS and AIMS.

Resources may include:

- accountable human time;
- development and review capability;
- GitHub repository and Actions capacity;
- Cloudflare runtime, storage, DNS, and monitoring capability;
- identity and authentication services;
- test and validation tools;
- dependency and vulnerability tooling;
- accessibility testing capability;
- logging and audit storage;
- risk, impact, SoA, audit, review, and corrective-action records;
- documentation and evidence storage;
- specialist expertise when the required competence is outside the operator's reasonable capability;
- and external independent review where objectivity or specialist assurance is needed.

Resource adequacy is evaluated through:

- risk assessment;
- objectives and target review;
- incidents or near misses;
- failed releases or tests;
- supplier limitations;
- audit or self-assessment findings;
- management review;
- and material changes to scope or AI authority.

A lack of necessary resources is itself a management-system issue and must not be hidden by marking affected controls `Met`.

## 4. Current Resource Model

The current model relies primarily on:

- one accountable WizardGang owner/operator;
- GitHub as the source, history, review, CI, and release control plane;
- Cloudflare as the primary runtime and public infrastructure platform;
- automated validation where repeatable checks are practical;
- public documentation and source evidence;
- managed secrets outside source;
- and external specialist or independent review when the required expertise or objectivity cannot reasonably be supplied by the same operator.

Because one person may perform multiple roles, role separation is implemented through explicit responsibility boundaries, controlled approvals, automation, evidence, and independent review where required rather than by inventing organizational departments that do not exist.

## 5. Competence — Clause 7.2

People performing work that can affect the ISMS or AIMS must be competent for the responsibilities assigned to them.

Competence may be established through one or more of:

- relevant professional experience;
- demonstrated implementation history;
- technical assessment;
- formal education;
- training;
- certification where relevant;
- documented self-study;
- supervised performance;
- successful completion of defined validation tasks;
- or specialist support.

Competence requirements should be proportional to the activity.

Examples include:

| Activity | Expected competence |
|---|---|
| Production release | Repository release process, CI evidence, rollback and deployment verification |
| Security-sensitive change | Authentication/authorization, secrets, validation, threat and failure behavior appropriate to the change |
| AI/MCP change | MCP/tool behavior, authorization parity, intended use, risk/impact triggers, evaluation expectations |
| Accessibility review | WCAG criteria relevant to the reviewed behavior and ability to perform the required manual/automated checks |
| Risk assessment | Defined risk methodology, scope, control evidence, treatment and acceptance rules |
| Internal audit | Audit method, scope, evidence evaluation, findings, and sufficient impartiality from the work being audited |
| Supplier review | Service dependency, security responsibility, contractual/operational considerations, and continuity impact |

## 6. Competence Evidence

Where competence materially affects a control or management-system decision, evidence should be retained proportionately.

Possible evidence includes:

- relevant work history;
- training completion;
- certification or qualification records;
- documented review by a qualified specialist;
- successful controlled implementation and validation;
- assessment notes;
- or a competence register entry.

The management system may maintain a lightweight record at:

`docs/governance/registers/COMPETENCE.md`

when recurring or multiple-person competence records are needed.

**Current limitation:** This support procedure defines the competence process, but no comprehensive competence/training register is currently claimed as completed. Where a specific competence assertion is needed, evidence must be produced rather than inferred from this document.

## 7. Competence Gaps

If required competence is missing, the management-system owner must choose an appropriate response, such as:

- obtain training;
- use documentation and supervised validation;
- narrow the activity;
- defer the change;
- obtain specialist advice;
- obtain independent assessment;
- or assign the activity to another qualified person.

The effectiveness of the response should be evaluated where the competence gap could materially affect security, AI impact, accessibility, legal obligations, audit integrity, or production reliability.

## 8. Awareness — Clause 7.3

People performing in-scope work must be aware of the management-system requirements relevant to their activities.

At minimum, relevant contributors and operators should understand:

- the Information Security Policy;
- the AI Policy where AI-related work is involved;
- applicable roles and approval authority;
- management-system scope;
- relevant security and AI risks;
- the requirement to protect credentials and sensitive information;
- controlled change and release requirements;
- accessibility obligations relevant to their work;
- incident and concern escalation expectations;
- the consequences of bypassing required controls;
- and the project's `aligned — uncertified` public assurance posture.

Awareness does not require every person to memorize every governance record. It requires the relevant obligations to be understood before or while performing controlled work.

## 9. Awareness Evidence

Awareness evidence may include:

- contributor onboarding records;
- acknowledgements of policies;
- reviewed pull requests;
- training or briefing records;
- documented security or AI review notes;
- issue templates or checklists that require acknowledgement of relevant controls;
- or other attributable evidence appropriate to the operating model.

**Current limitation:** The repository contains the policies and operating requirements, but a recurring awareness/acknowledgement record has not yet been established. The existence of a policy file alone is not treated as proof that awareness has occurred.

## 10. Communication — Clause 7.4

Management-system communications must be intentional, accurate, and appropriate to the audience.

For material communications, the system should determine:

- **what** is being communicated;
- **when** communication is required;
- **with whom** it should be shared;
- **how** it will be communicated;
- and **who** is responsible for the communication.

## 11. Internal Communication

Internal communication may occur through:

- GitHub issues;
- pull-request descriptions and reviews;
- controlled governance records;
- release notes;
- audit findings;
- corrective-action records;
- risk records;
- management-review records;
- and direct operational communication when immediate action is needed.

Examples of information that may require internal communication include:

- material risk changes;
- policy changes;
- scope changes;
- incidents or vulnerabilities;
- failed controls or evaluations;
- supplier changes;
- material AI capability changes;
- overdue treatment actions;
- audit findings;
- and changes to management-system objectives.

## 12. External Communication

External communication may include:

- public repository documentation;
- `wizardgang.ai` / `demo.wizardgang.ai` content;
- security reporting guidance;
- release notes;
- service/offline notices;
- public assurance and compliance statements;
- API/MCP contracts and limitations;
- supplier or support communication;
- and communication with relevant authorities or interested parties where an actual obligation exists.

External communication must not:

- expose secrets or protected information;
- imply certification where none exists;
- represent third-party controls as WizardGang-operated controls;
- overstate automated test results;
- or conceal a known material limitation when that limitation is necessary to understand the assurance claim.

## 13. Communication Ownership

Unless another accountable role is explicitly assigned, the management-system owner is responsible for determining whether a management-system matter requires communication.

Technical communication associated with a controlled change may be delegated to the change owner, but accountability for material policy, risk acceptance, incident, public assurance, or management-review communication remains with the responsible authority defined in `ROLES-RESPONSIBILITIES.md`.

## 14. Documented Information — Clause 7.5

The repository is the primary control environment for non-secret documented management-system information.

Documented information includes, as applicable:

- policies;
- context and scope;
- interested-party requirements;
- roles and responsibilities;
- risk methodology and registers;
- AI impact assessments;
- Statements of Applicability;
- objectives;
- procedures;
- release and change records;
- audit and management-review records;
- corrective actions;
- test and validation evidence;
- supplier records;
- incident records;
- competence and awareness evidence;
- and other records necessary to demonstrate operation of the ISMS or AIMS.

Not every piece of evidence must be a Markdown file. Appropriate evidence may also exist in GitHub, CI artifacts, D1, R2, deployment metadata, operational logs, or another controlled system where the evidence can be identified and protected.

## 15. Creation and Update — Clause 7.5.2

Controlled management-system documents should contain enough metadata to identify and manage the record.

Where appropriate, records should state:

- title;
- reference or identifier;
- owner;
- status;
- approval method;
- effective or assessment date;
- review cadence or review due date;
- scope or applicable framework;
- and related evidence.

Changes use the repository's normal `DEMO-###` process.

Material updates should explain:

- what changed;
- why;
- affected boundaries;
- risk;
- validation;
- evidence;
- and release applicability.

## 16. Document Status

The default governance-document lifecycle is:

`Draft / Proposed → Approved → Superseded or Retired`

### Proposed

The document is under controlled review and is not yet the approved baseline.

For the current governance rebuild, records on PR #56 remain **Proposed** until final review and merge.

### Approved

The document has passed its defined approval event and represents the current management-system baseline.

For repository-controlled governance records, approval may be evidenced by the reviewed merge commit or another explicitly recorded approval event.

### Superseded

A newer approved record replaces the prior version. Prior history remains retained in Git.

### Retired

The record is no longer active because the requirement, process, system, or scope was intentionally removed. Retirement requires rationale and does not erase historical evidence.

## 17. Approval and Signoff

For repository-controlled documented information, signoff should be attributable and reconstructable.

A typical approval record is:

```text
Owner: WizardGang
Status: Approved
Version: <version or commit>
Effective: <date>
Review due: <date or trigger>
Approved via: PR #<number>
Approval commit: <sha>
```

A reviewed pull request and merge can serve as the approval event when that is the defined approval mechanism.

Approval of a document does **not** automatically mean:

- every control described in it is operating effectively;
- every objective is achieved;
- every risk is accepted;
- every gap is closed;
- or certification has been obtained.

## 18. Control of Documented Information — Clause 7.5.3

Documented information must be controlled so it is:

- available where needed;
- suitable for use;
- identifiable;
- protected from unauthorized change or disclosure;
- retained for an appropriate period;
- and recoverable enough to support traceability and management-system operation.

The repository supports these objectives through:

- controlled branches;
- permanent `DEMO-###` identifiers;
- commit history;
- pull requests and reviews;
- CI validation;
- merge history;
- tags and releases;
- explicit source paths;
- and immutable historical Git objects.

Repository controls do not replace the need to protect sensitive records that should not be public.

## 19. Public and Restricted Records

### Public by design

The following are normally appropriate for public repository storage:

- policies intended for public review;
- scope and governance methodology;
- sanitized risk/control summaries where appropriate;
- SoAs for the public demo;
- public architecture and operations documentation;
- public-safe test/evidence descriptions;
- and release/change records.

### Restricted where required

The following should not be made public merely to satisfy a documentation requirement:

- credentials or secrets;
- private keys;
- authentication material;
- sensitive incident details that would increase active risk;
- private personal information;
- confidential supplier or contractual information;
- raw security evidence containing exploit details before safe disclosure;
- or other information whose exposure would violate an obligation or create material risk.

Restricted records may be referenced by identifier and evidence location without publishing their sensitive contents.

## 20. External Documents

External documented information that is necessary to plan or operate the management system may include:

- standards;
- supplier documentation;
- platform security documentation;
- legal or contractual requirements;
- vulnerability advisories;
- accessibility references;
- and integration specifications.

Where an external document materially affects a control or decision, the management system should identify the source/version or otherwise retain enough information to know what requirement was relied upon.

External documents are not copied into the repository solely to create evidence when a controlled reference is sufficient.

## 21. Retention and History

Git history is the default retention mechanism for repository-controlled governance records.

Approved records should not be rewritten to erase prior decisions. Corrections and replacements use new controlled changes so the previous state remains reconstructable.

Operational evidence retention may differ by evidence type.

Retention decisions should consider:

- investigation needs;
- release traceability;
- risk and control review;
- auditability;
- legal or contractual requirements where applicable;
- privacy and minimization;
- storage cost;
- and the value of the evidence to future management-system review.

## 22. Disposal

When documented information is no longer required, disposal must preserve any applicable retention or audit requirement.

Public Git history is intentionally persistent and should be treated as effectively non-erasable for ordinary governance records.

Sensitive or temporary records stored outside Git should be removed using the controls appropriate to their storage system when their retention period expires.

## 23. Evidence Integrity

Evidence should be attributable to the state it represents.

Where practical, evidence should identify one or more of:

- requirement/control;
- source path;
- change ID;
- commit SHA;
- pull request;
- validation result;
- release/tag;
- deployed version/SHA;
- operational event;
- date/time;
- responsible person or automated process.

This preserves the project evidence chain:

`requirement → change → validation → release → deployment → operation`

## 24. Review and Continual Improvement

Support controls are reviewed through management-system operation.

Review should consider:

- whether resource constraints are preventing objectives or treatment;
- whether competence gaps exist;
- whether awareness evidence is sufficient;
- whether communications are timely and accurate;
- whether document owners and review dates remain current;
- whether evidence is stale or inaccessible;
- whether restricted information is properly protected;
- and whether the repository workflow still provides adequate control over management-system information.

Findings feed corrective action, risk treatment, objectives, or controlled change as appropriate.

## 25. Current Gaps and Follow-On Evidence

This procedure establishes the Clause 7 support model, but recurring evidence still needs to be produced.

Current follow-on work includes:

1. create a competence record when competence assertions require formal evidence;
2. establish lightweight awareness/acknowledgement evidence for people performing in-scope work;
3. define incident and supplier communication procedures in their dedicated records;
4. verify review dates and stale-document handling through actual operating cycles;
5. retain future audit, management-review, corrective-action, and objective-review evidence;
6. protect any future restricted management-system records outside the public repository where required.

## 26. Alignment

This document supports:

- **ISO/IEC 27001:2022 §7.1 — Resources**
- **ISO/IEC 27001:2022 §7.2 — Competence**
- **ISO/IEC 27001:2022 §7.3 — Awareness**
- **ISO/IEC 27001:2022 §7.4 — Communication**
- **ISO/IEC 27001:2022 §7.5 — Documented information**
- **ISO/IEC 42001:2023 §7.1 — Resources**
- **ISO/IEC 42001:2023 §7.2 — Competence**
- **ISO/IEC 42001:2023 §7.3 — Awareness**
- **ISO/IEC 42001:2023 §7.4 — Communication**
- **ISO/IEC 42001:2023 §7.5 — Documented information**

**Current posture after approval:** The management-system support and document-control model is formally defined and repository-controlled; recurring competence, awareness, communication, and review evidence remains to be produced through operation. Certification is not claimed.
