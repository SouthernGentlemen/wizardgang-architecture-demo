# Management-System Control and Document Index

**Reference:** WG-GOV-028  
**Framework:** Integrated ISMS / AIMS / WCAG engineering-assurance system  
**Status:** Approved
**Owner:** Management-System Owner / Evidence Custodian  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually and after material scope, standards, architecture, supplier, AI/MCP, evidence-model, or compliance-registry change

## 1. Purpose

This index is the controlled entry point for the WizardGang Architecture Demo management-system documentation and evidence model.

It answers five questions:

1. **What document governs this requirement or control area?**
2. **What register records current state, risk, applicability, objective, or evidence posture?**
3. **What source, test, workflow, release, runtime route, log, D1/R2 record, or manual validation provides technical or operating evidence?**
4. **Where should a public reviewer inspect that evidence?**
5. **What remains incomplete and requires actual recurring evidence rather than another policy document?**

This index does not replace the structured assurance registry, its generated ISO SoA summaries, risk registers, technical evidence, or actual management-system activities. It connects them.

The repository is engineered toward WCAG 2.2, ISO/IEC 27001:2022, and ISO/IEC 42001:2023 as **aligned — uncertified** references. Nothing in this index represents certification.

## 2. Documentation Baseline Decision

With `DEMO-103`, the initial management-system **documentation baseline is complete**.

Future governance documents should be created only when one of these exists:

- a new applicable requirement;
- a material scope change;
- a new control/process that cannot be represented in an existing document;
- a corrective action requiring a controlled procedure change;
- a material supplier, legal, security, accessibility, data, or AI/MCP change;
- or a management-review/audit decision requiring a new controlled record.

The default next action is **operate, test, measure, clean up, and evidence the system**, not add more policy Markdown.

## 3. Authoritative Record Hierarchy

The management system distinguishes different record types because a policy, register, test, and runtime signal do not prove the same thing.

| Layer | Purpose | Examples | What it can prove |
|---|---|---|---|
| **Architecture / engineering standard** | Defines system and delivery baseline | `docs/ARCHITECTURE-STANDARD.md`, `SECURITY.md`, `docs/CHANGE-MANAGEMENT.md` | Intended architecture and controlled engineering rules |
| **Policy / governance procedure** | Defines management-system expectation and decision process | `docs/governance/*.md` | What must be done and who owns the decision |
| **Structured assurance / risk / assessment / register** | Records current applicability, state, risk, objective, inventory, plan, or evaluation | `assurance/compliance/**`, `registers/**`, `assessments/**` | Current controlled assessment at a point in time; ISO control status/rationale is canonical only in structured assurance data |
| **Generated SoA summary** | Presents ISO Annex A assessment identity and derived counts without duplicating row state | `soa/ISO-27001-SOA.md`, `soa/ISO-42001-SOA.md` | Human-readable summary of the canonical structured compliance state only |
| **Implementation evidence** | Demonstrates a technical control exists | `src/**`, `migrations/**`, `contracts/**`, workflow/config files | Implemented behavior/configuration within the verified source state |
| **Validation evidence** | Demonstrates a check was executed for a specific state | tests, CI run, validation artifact, manual accessibility record, MCP evaluation | The tested condition at the stated commit/release/date |
| **Release / deployment evidence** | Connects accepted source to production | PR, merge, annotated tag, release, deploy run, `/version` | What source was accepted and deployed |
| **Operational evidence** | Demonstrates behavior over time | `/health`, dashboard, D1 audit events, public-safe logs, usage/uptime, incidents | Runtime/operational behavior for the observed period |
| **Management evidence** | Demonstrates review and decision activity | audit record, management review, risk acceptance, corrective action, competence review | Human governance activity and attributable decisions |
| **Public assurance presentation** | Makes the evidence understandable to reviewers | `/compliance`, `/governance`, `/interfaces?view=accessibility`, `/dashboard` | Presentation/traceability only; not independent certification |

A document moving to `Approved` does **not** by itself make the associated control `Met` or prove effectiveness.

## 4. Record Identity and Metadata Rule

`DEMO-104` normalizes management-system metadata into unique canonical reference namespaces.

The authoritative identity model is now:

1. repository path identifies the controlled document or register;
2. `DEMO-###` history identifies the controlled change that introduced or materially changed it;
3. the `**Reference:**` header provides a unique stable management-system identifier;
4. `docs/governance/REFERENCE-REGISTRY.json` is the machine-readable inventory of those identifiers;
5. `assurance/compliance/iso-27001-2022.json` and `assurance/compliance/iso-42001-2023.json` are authoritative for individual ISO Annex A applicability, status, rationale, title, and evidence links;
6. `soa/ISO-27001-SOA.md` and `soa/ISO-42001-SOA.md` are generated summaries and cannot independently change control state;
7. the structured WCAG registry and partitions are authoritative for WCAG criteria.

Reference namespaces are separated by record type: `WG-GOV-*`, `WG-POL-*`, `WG-REG-*`, `WG-OBJ-*`, `WG-SOA-*`, and `WG-AIA-*`.

CI validates reference uniqueness, registry/header agreement, governed-file existence, generated SoA agreement with structured assurance state, and local file links in this control/document index. A duplicate, mismatched reference, or independently edited generated SoA summary is a repository validation failure rather than a tolerated metadata ambiguity.

## 5. Core Governance Document Inventory

| DEMO | Governing document | Primary purpose | Primary state/evidence companion |
|---|---|---|---|
| DEMO-070 | `CONTEXT.md` | Internal/external issues and organizational context | scope, interested parties, risk registers |
| DEMO-071 | `INTERESTED-PARTIES.md` | Interested parties and relevant requirements | obligations/supplier registers, scope |
| DEMO-072 | `SCOPE.md` | ISMS/AIMS boundaries, inclusions, exclusions, applicability | SoAs, asset/data registers |
| DEMO-073 | `MANAGEMENT-SYSTEM.md` | Integrated management-system operating model | all governance records and controlled Git history |
| DEMO-074 | `LEADERSHIP.md` | Leadership, accountability, resources, human decision rights | roles, policies, management review |
| DEMO-075 | `INFORMATION-SECURITY-POLICY.md` | Information-security policy | security risk, security maintenance, incidents, testing |
| DEMO-075 | `AI-POLICY.md` | AI governance and intended-use policy | AI risk, impact assessment, supplier/AI evidence |
| DEMO-076 | `ROLES-RESPONSIBILITIES.md` | Functional roles, authorities, delegation and independence | competence/access registers |
| DEMO-077 | `RISK-MANAGEMENT.md` | Security/AI risk method, scoring, treatment and acceptance | security and AI risk registers |
| DEMO-083 | `MANAGEMENT-SYSTEM-CHANGE-PLANNING.md` | Management-system change planning | `DEMO-###` history, SoA/risk reassessment |
| DEMO-084 | `MANAGEMENT-SYSTEM-SUPPORT.md` | Resources, competence, awareness, communications, documented information | competence-awareness register |
| DEMO-085 | `OPERATIONAL-PLANNING-CONTROL.md` | Controlled execution of governance through actual operation | release/deploy/operations evidence |
| DEMO-086 | `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md` | Recurring risk treatment and AI impact reassessment | risk registers, AI impact assessment, SoAs |
| DEMO-087 | `MONITORING-MEASUREMENT-EVALUATION.md` | Measurement catalogue and evaluation method | objectives, dashboard/health/log evidence |
| DEMO-088 | `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` | Self-assessment vs formal internal audit and audit programme | future audit/self-assessment records |
| DEMO-089 | `MANAGEMENT-REVIEW.md` | Management review inputs, outputs and decisions | future management-review records/actions |
| DEMO-090 | `NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md` | Correction, cause, corrective action, effectiveness and improvement | future finding/corrective-action evidence |
| DEMO-091 | `SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md` | Supplier classification, review and AI-provider boundary | supplier register |
| DEMO-092 | `INCIDENT-MANAGEMENT.md` | Security/AI/data/supplier/operational incident handling | incident register, EX-001 |
| DEMO-093 | `BACKUP-RECOVERY-RESTORE.md` | Backup/export, reconstruction, restore and testing | recovery-test register, RT-001 |
| DEMO-094 | `COMPETENCE-AWARENESS-COMMUNICATION.md` | Role competence, awareness, communication and AI concerns | competence-awareness register, AI concern issue template |
| DEMO-095 | `DATA-GOVERNANCE.md` | Data classification, provenance, retention/deletion, AI data boundary | data register |
| DEMO-096 | `VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md` | Vulnerability intake, threat intelligence and security maintenance | security-maintenance register |
| DEMO-097 | `ASSET-ACCESS-ACCEPTABLE-USE.md` | Asset ownership, acceptable use, access lifecycle/review | asset-access register, AR-001 |
| DEMO-098 | `LEGAL-CONTRACTUAL-IP-PRIVACY.md` | Legal/contractual/IP/privacy obligation identification | obligations register |
| DEMO-099 | `CONFIGURATION-BASELINE-DRIFT.md` | Desired state, provider state, secrets/config split and drift | configuration register |
| DEMO-100 | `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md` | Cryptographic mechanisms, authentication information and secret lifecycle | cryptography-secrets register |
| DEMO-101 | `SECURE-ENGINEERING-TESTING.md` | Risk-scaled secure engineering and security testing | security-testing register, CI/tests |
| DEMO-102 | `CONTINUITY-RESILIENCE.md` | Safe continuity, degradation, supplier disruption and return to service | incident/recovery exercises, operations evidence |
| DEMO-103 | `CONTROL-AND-DOCUMENT-INDEX.md` | Authoritative navigation and traceability index | `assurance/registry.json`, `/compliance` registry and consistency checks |

## 6. Assessment, SoA, and Register Inventory

### 6.1 Assessments and statements of applicability

| Record | Purpose | Authority |
|---|---|---|
| `assessments/MCP-AI-IMPACT-ASSESSMENT.md` | Current read-only public MCP impact assessment | Authoritative only for the assessed current capability; material AI changes require reassessment |
| `soa/ISO-27001-SOA.md` | Generated ISO/IEC 27001:2022 Annex A summary | Generated presentation only; canonical applicability/rationale/status is `assurance/compliance/iso-27001-2022.json` |
| `soa/ISO-42001-SOA.md` | Generated ISO/IEC 42001:2023 Annex A summary | Generated presentation only; canonical applicability/rationale/status is `assurance/compliance/iso-42001-2023.json` |

### 6.2 Registers

| Register | Records |
|---|---|
| `SECURITY-RISK-REGISTER.md` | Formal information-security risks, treatment and residual posture |
| `AI-RISK-REGISTER.md` | AI/MCP risks and treatment posture |
| `OBJECTIVES.md` | Security, AI and governance objectives/targets |
| `SUPPLIER-REGISTER.md` | GitHub, Cloudflare, Codex, Claude, identity-provider and dependency supplier state |
| `INCIDENT-REGISTER.md` | Actual incidents when they occur and planned incident exercise `EX-001` |
| `RECOVERY-TEST-REGISTER.md` | Technical recovery/restore exercises including planned `RT-001` |
| `COMPETENCE-AWARENESS-REGISTER.md` | Role competence evidence and planned awareness cycle |
| `DATA-REGISTER.md` | Material data surfaces, classification, retention/deletion and MCP data exposure |
| `SECURITY-MAINTENANCE-REGISTER.md` | Dependency audit, threat review, vulnerability/security maintenance evidence |
| `ASSET-ACCESS-REGISTER.md` | Material assets, access classes and planned access review |
| `OBLIGATIONS-REGISTER.md` | Applicable, conditional, voluntary and needs-determination obligations |
| `CONFIGURATION-REGISTER.md` | Material source/provider/runtime/configuration items |
| `CRYPTOGRAPHY-SECRETS-REGISTER.md` | Material cryptographic and authentication-information surfaces |
| `SECURITY-TESTING-REGISTER.md` | Security engineering/test mechanisms and explicit testing gaps |

A register status is an evidence posture, not a certification score.

## 7. ISO/IEC 27001:2022 Clause Map

The management clauses remain distinct from Annex A controls.

| Clause area | Primary governing records | Supporting state/evidence |
|---|---|---|
| **4.1 Context** | `CONTEXT.md` | risks, obligations, supplier/environment changes |
| **4.2 Interested parties** | `INTERESTED-PARTIES.md` | obligations and supplier registers |
| **4.3 Scope** | `SCOPE.md` | asset/data inventories, SoA applicability |
| **4.4 ISMS** | `MANAGEMENT-SYSTEM.md` | full repository governance lifecycle |
| **5.1 Leadership** | `LEADERSHIP.md` | management review and attributable approvals |
| **5.2 Policy** | `INFORMATION-SECURITY-POLICY.md` | risk/objectives/operating evidence |
| **5.3 Roles** | `ROLES-RESPONSIBILITIES.md` | competence and access registers |
| **6.1 Risks/opportunities and treatment** | `RISK-MANAGEMENT.md`, `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md` | security-risk register, ISO27001 SoA |
| **6.2 Objectives** | `registers/OBJECTIVES.md` | monitoring/measurement results |
| **6.3 Change planning** | `MANAGEMENT-SYSTEM-CHANGE-PLANNING.md` | DEMO history, risk/SoA updates |
| **7.1 Resources** | `MANAGEMENT-SYSTEM-SUPPORT.md` | management review/resource decisions |
| **7.2 Competence** | `COMPETENCE-AWARENESS-COMMUNICATION.md` | competence-awareness register |
| **7.3 Awareness** | `COMPETENCE-AWARENESS-COMMUNICATION.md` | AW-001 through AW-007 when completed |
| **7.4 Communication** | `COMPETENCE-AWARENESS-COMMUNICATION.md` | incident/supplier/public-assurance communication records |
| **7.5 Documented information** | `MANAGEMENT-SYSTEM-SUPPORT.md` | Git-controlled history, PR approval, records indexed here |
| **8.1 Operational control** | `OPERATIONAL-PLANNING-CONTROL.md` | CI/release/deploy/operations evidence |
| **8.2 Risk assessment** | `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md` | security-risk register review history |
| **8.3 Risk treatment** | `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md` | treatment changes + effectiveness evidence |
| **9.1 Monitoring/evaluation** | `MONITORING-MEASUREMENT-EVALUATION.md` | objectives, health, uptime, logs, CI, reviews |
| **9.2 Internal audit** | `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` | future self-assessment/audit records; independence limitation retained |
| **9.3 Management review** | `MANAGEMENT-REVIEW.md` | future completed management-review record |
| **10.1 Continual improvement** | `NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md` | improvement/corrective-action evidence |
| **10.2 Nonconformity/corrective action** | same | formal findings tied to applicable criteria, root cause/effectiveness evidence |

### ISO 27001 Annex A

Per-control applicability, status, N/A rationale, title, and evidence links are governed by `assurance/compliance/iso-27001-2022.json`; `soa/ISO-27001-SOA.md` is generated from that source.

The principal evidence-owner map by Annex A theme is:

| Theme | Primary evidence owners |
|---|---|
| **A.5 Organizational** | policies, roles, risk, supplier, incident, asset/access, legal/obligations, data, continuity, structured SoA data |
| **A.6 People** | roles, competence/awareness, access lifecycle; physical/personnel controls may be N/A to current serverless/public-demo scope with rationale |
| **A.7 Physical** | largely provider/scope dependent; N/A/Partial rationales live in structured compliance data and must be revisited if physical scope changes |
| **A.8 Technological** | `SECURITY.md`, source, tests, CI, identity/webhook/MCP code, configuration, cryptography, secure engineering, logging, backup/recovery, operations |

No thematic mapping above overrides an individual canonical structured compliance record.

## 8. ISO/IEC 42001:2023 Clause Map

| Clause area | Primary governing records | Supporting state/evidence |
|---|---|---|
| **4.1 Context** | `CONTEXT.md` | AI risk/supplier/data changes |
| **4.2 Interested parties** | `INTERESTED-PARTIES.md` | AI users, providers, obligations, affected-party considerations |
| **4.3 Scope** | `SCOPE.md` | MCP capability boundary, suppliers, data boundary |
| **4.4 AIMS** | `MANAGEMENT-SYSTEM.md` | integrated ISMS/AIMS lifecycle |
| **5.1 Leadership** | `LEADERSHIP.md` | human accountability and decision rights |
| **5.2 AI policy** | `AI-POLICY.md` | AI risk, impact, supplier and evaluation evidence |
| **5.3 Roles** | `ROLES-RESPONSIBILITIES.md` | AI owner, supplier owner, security/data/access roles |
| **6.1 Risks/opportunities** | `RISK-MANAGEMENT.md`, `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md` | AI-risk register, impact assessment, ISO42001 SoA |
| **6.2 Objectives** | `registers/OBJECTIVES.md` | AI objective evidence/history |
| **6.3 Change planning** | `MANAGEMENT-SYSTEM-CHANGE-PLANNING.md` | AI material-change triggers |
| **7.1 Resources** | `MANAGEMENT-SYSTEM-SUPPORT.md` | competence, supplier, resource decisions |
| **7.2 Competence** | `COMPETENCE-AWARENESS-COMMUNICATION.md` | AI/MCP competence rows |
| **7.3 Awareness** | same | AI policy/MCP/provider/incident awareness records |
| **7.4 Communication** | same | AI concern, incident, public assurance, supplier communication |
| **7.5 Documented information** | `MANAGEMENT-SYSTEM-SUPPORT.md` | Git/PR/history/records |
| **8.1 Operational control** | `OPERATIONAL-PLANNING-CONTROL.md` | MCP implementation, eval, release and runtime evidence |
| **8.2 AI risk assessment** | `OPERATIONAL-RISK-AND-AI-REASSESSMENT.md` | AI-risk register |
| **8.3 AI risk treatment** | same | treatment/effectiveness evidence |
| **8.4 AI system impact assessment** | same + `MCP-AI-IMPACT-ASSESSMENT.md` | current bounded MCP assessment and reassessment triggers |
| **9.1 Monitoring/evaluation** | `MONITORING-MEASUREMENT-EVALUATION.md` | AI eval logs, risk/objective review, supplier/incident signals |
| **9.2 Internal audit** | `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` | future objective audit/self-assessment records |
| **9.3 Management review** | `MANAGEMENT-REVIEW.md` | future completed review decisions |
| **10 Improvement / corrective action** | `NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md` | AI concerns/incidents/findings and effectiveness evidence |

### ISO 42001 Annex A

Per-control applicability, status, N/A rationale, title, and evidence links are governed by `assurance/compliance/iso-42001-2023.json`; `soa/ISO-42001-SOA.md` is generated from that source.

| Annex A family | Principal evidence owners |
|---|---|
| **A.2 AI policies** | `AI-POLICY.md`, leadership, approvals |
| **A.3 Internal organization** | roles, competence/awareness, management system |
| **A.4 Resources for AI systems** | architecture, supplier, competence, asset/access, configuration |
| **A.5 Assessing AI impacts** | MCP AI impact assessment, AI risk, reassessment process |
| **A.6 AI system lifecycle** | secure engineering/testing, controlled change, MCP source/tests/evaluations, release history |
| **A.7 Data for AI systems** | data governance/register, `demo_records` boundary, provenance/freshness evidence |
| **A.8 Information for interested parties** | governance/public assurance, concerns/incidents, intended-use and limitation communication |
| **A.9 Use of AI systems** | AI policy, impact assessment, MCP intended-use/misuse boundaries, logs/evaluation |
| **A.10 Third-party/customer relationships** | supplier governance/register, Codex/Claude restriction, obligations |

Codex and Claude remain the only approved AI/MCP provider/client families. A third family requires the full controlled supplier, security-risk, AI-risk, impact, SoA, data, testing, and management review process.

## 9. WCAG 2.2 Map

WCAG evidence is intentionally not buried inside the ISO governance documents.

The detailed accessibility owner is:

- `docs/ACCESSIBILITY.md`;
- `/interfaces?view=accessibility` interactive/manual evidence route;
- `tests/interface.test.ts` and other applicable interface tests;
- automated axe evidence where implemented;
- dated browser/assistive-technology manual results when actually completed;
- the exhaustive `/compliance` checklist rows for every WCAG 2.2 A/AA/AAA criterion.

| WCAG principle | Primary evidence concerns |
|---|---|
| **Perceivable** | semantic structure, alternatives, contrast, zoom/reflow, forced colors and visual presentation |
| **Operable** | keyboard, focus, target size, drag alternatives, motion, timing/input behavior |
| **Understandable** | predictable navigation/help, labels/instructions, errors, accessible authentication |
| **Robust** | semantics, names/roles/states, assistive-technology compatibility, valid dynamic behavior |

Status language remains **WCAG 2.2 demonstration/alignment — uncertified** unless independent conformance/certification evidence exists.

Automated scanning is partial coverage. A zero automated finding count does not establish WCAG conformance. Manual browser/AT evidence is recorded separately with date/environment when performed.

## 10. Technical Evidence Owners

The most important technical evidence owners are:

| Evidence area | Primary source |
|---|---|
| Architecture | `docs/ARCHITECTURE-STANDARD.md`, `README.md` |
| Security boundary | `SECURITY.md` |
| Controlled change | `docs/CHANGE-MANAGEMENT.md`, Git commit/PR history |
| Release/deployment | release docs, `.github/workflows/release.yml`, `.github/workflows/deploy.yml`, tags/releases |
| CI validation | `.github/workflows/ci.yml`, `package.json`, validation scripts, commit-bound evidence artifact |
| REST / GraphQL / Webhooks | contracts, API handlers, tests |
| Identity / SSO / OAuth / SAML | `docs/IDENTITY.md`, identity handlers/session library, tests |
| MCP / AI | MCP handler, MCP client tests, governance API, AI policy/risk/impact/SoA |
| Data | migrations, D1/R2 source, data governance/register |
| Configuration | `wrangler.jsonc`, workflows, config/contracts, configuration register |
| Cryptography/secrets | identity/webhook/admin source, `SECURITY.md`, crypto/secrets governance/register |
| Logging/audit | logging/audit libraries, D1 migrations, `/dashboard/logs`, `demo_events`/`application_logs` |
| Health/uptime | `/health`, `/version`, scheduled observations, `/dashboard/uptime` |
| Cost/degradation | `/dashboard/billing`, usage collector, degradation behavior |
| Recovery | release reconstruction path, recovery procedure/register, future RT-001 evidence |
| Accessibility | `docs/ACCESSIBILITY.md`, `/interfaces?view=accessibility`, interface tests, manual records |
| Traceability | `docs/EVIDENCE.md`, Git/PR/CI/tag/release/deploy/runtime chain |
| Public assurance data | `assurance/registry.json`, `docs/ASSURANCE.md`, `contracts/assurance/**` |

Implementation evidence can support `Met` only when the applicable requirement is actually satisfied and current enough. A source file alone cannot prove recurring effectiveness.

## 11. Public Evidence Route Ownership

The intended public assurance architecture is:

| Route | Ownership |
|---|---|
| **`/compliance`** | Canonical human-readable projection of the structured WCAG/ISO checklist and current evidence posture |
| **`/interfaces?view=accessibility`** | Detailed WCAG interactive, automated and manual evidence |
| **`/governance`** | Governance, security-management and AI-management evidence summaries |
| **`/governance/concerns`** | Public, non-sensitive bug, feature, accessibility, AI/MCP and other concern intake |
| **`/security`** | Vulnerability disclosure policy and private-reporting boundary |
| **`/.well-known/security.txt`** | Machine-readable vulnerability-reporting contact and policy |
| **`/dashboard`** | Operational posture and links to evidence owners |
| **`/dashboard/uptime`** | Health/availability observations |
| **`/dashboard/logs`** | Public-safe application diagnostics |
| **`/dashboard/billing`** | Usage/cost/degradation evidence |
| **`/health`** | Machine-readable runtime/dependency health |
| **`/version`** | Deployed version/SHA identity |
| **`/mcp/server`** | Current bounded MCP implementation surface |

`/compliance` must not duplicate canonical state in a second data store. It derives presentation from structured assurance data and may deep-link evidence owners and detailed interactive demonstrations.

## 12. Exhaustive Compliance Registry

The structured `/compliance` registry covers:

- WCAG 2.2 Level A, AA and AAA success criteria;
- ISO/IEC 27001:2022 clauses 4-10;
- all 93 ISO/IEC 27001 Annex A controls;
- ISO/IEC 42001:2023 clauses 4-10;
- all 38 ISO/IEC 42001 Annex A controls.

Rules:

- canonical statuses and rationales are stored only in structured assurance data;
- generated ISO SoA Markdown summaries must exactly match the structured source;
- N/A requires rationale and scope-change review;
- counts represent evidence posture, never certification score, and are derived rather than stored;
- evidence links trace to stable assurance evidence IDs;
- WCAG rows distinguish automated from manual evidence;
- ISO management clauses remain separate from technical controls;
- stale time-bound evidence is rejected by validation;
- CI validates identifiers, status vocabulary, N/A rationale, evidence-link integrity, generated-summary agreement, and disclosure safety.

The generated SoA Markdown files preserve their WG-SOA identities and approval provenance, but they are not independent status/rationale authorities.

## 13. Evidence Status Semantics

The public compliance system uses:

- **Met** — applicable requirement is implemented and supported by sufficient current evidence for the claimed scope;
- **Partial** — meaningful implementation/evidence exists but a material portion, recurring activity, validation, independence, freshness, or effectiveness proof remains incomplete;
- **Gap** — an applicable requirement materially lacks implementation or evidence;
- **N/A** — requirement is outside current scope, with explicit rationale and reassessment trigger.

Supporting registers may use additional workflow statuses such as Planned, Active, Restricted, Watch, At risk, Failed, or Passed with limitations. These are not automatically interchangeable with compliance statuses.

A `Planned` exercise is not a `Met` control.

## 14. Evidence Freshness

Evidence is not timeless.

The compliance registry and recurring management-system reviews account for freshness based on the type of evidence:

- source/config evidence: revalidate after material source/configuration change;
- release evidence: release-specific;
- manual accessibility evidence: release/environment specific and rerun after relevant UI change;
- access/supplier/competence/risk review: periodic and event-triggered;
- incident/recovery exercise: dated exercise-specific;
- health/uptime/log evidence: time-window specific;
- AI impact assessment: valid only while assessed tool/data/provider/intended-use/authority assumptions remain unchanged;
- SoA/applicability: review after scope/control/environment change;
- legal/contractual obligations: review when jurisdiction, data, supplier, contract or use facts change.

Time-bound evidence includes an explicit validity window and becomes a validation failure when stale. Event-driven and release-bound evidence remains subject to its applicable review/change trigger rather than being silently treated as timeless proof.

## 15. Planned Operating Evidence

The documentation baseline deliberately leaves real activities incomplete until they occur.

### Due 2026-12-02 in current records

- `RT-001` — first technical recovery/restore exercise;
- `EX-001` — combined security + AI/MCP incident exercise;
- initial competence review for `COMP-001` through relevant role rows;
- awareness cycle `AW-001` through `AW-007`;
- first consolidated privileged/provider access review;
- initial supplier reviews where scheduled by the supplier/competence records;
- expanded AI/MCP evaluation and objective evidence where scheduled by `OBJECTIVES.md`.

These remain Planned/Partial until dated evidence exists.

### Additional recurring evidence

- monthly/event-driven threat-intelligence review where defined;
- configuration/provider-state reconciliation;
- credential/secret necessity and scope review;
- objective measurement history;
- D1/R2 backup/export and restore evidence;
- retention/deletion testing;
- accessibility manual browser/AT results;
- supplier review history;
- self-assessment and, when sufficiently objective, formal internal audit;
- management review;
- corrective-action effectiveness after actual findings;
- legal/contract/privacy reassessment when triggers become real.

Absence of an incident or finding does not prove readiness or control effectiveness.

## 16. Approval and Signoff Model

The normal repository approval record is:

```text
Owner: WizardGang
Status: Approved
Version: <version>
Effective: <date>
Review due: <date>
Approved via: PR #<number>
Approval commit: <sha>
```

PR review/merge provides attributable document approval and immutable Git history.

Approval does **not** automatically:

- accept residual risk;
- prove control effectiveness;
- complete an exercise;
- prove competence/awareness;
- prove supplier review;
- create audit independence;
- establish legal applicability;
- establish WCAG conformance;
- or establish ISO certification.

Residual-risk acceptance, audit conclusions, management-review decisions, corrective-action closure, and other material decisions remain explicit records.

## 17. AI/MCP Non-Negotiable Boundary

The current controlled AI/MCP baseline is:

- runtime MCP is public read-only/non-destructive;
- current tools are bounded to the approved catalog;
- `demo_records` is the only approved D1 source for public MCP records;
- visitor/session data, identity records, logs, audit events, R2 content and secrets are outside the MCP data boundary;
- application authorization is server-side and provider/client metadata creates no privilege;
- **OpenAI Codex and Anthropic Claude are the only approved AI/MCP provider/client families**;
- external model reasoning, prompting, memory and downstream actions remain outside direct WizardGang control;
- a new provider, write capability, privileged action, private data source, autonomy increase, oversight reduction, or intended-use change requires controlled risk/impact/SoA/data/supplier/testing review before approval.

No continuity event, incident, or convenience requirement overrides this boundary automatically.

## 18. Known Consistency and Assurance Gaps

This index intentionally preserves the following known gaps for cleanup or operation:

1. Canonical governance/register metadata references are unique and CI-validated; future drift is treated as a validation failure.
2. The exhaustive structured WCAG/ISO compliance registry is present and generated/presentation drift is CI-validated, but many rows remain operating-evidence constrained rather than independently demonstrated.
3. ISO SoA Markdown is generated from canonical structured compliance data; future status/rationale changes must be made in that structured source and pass generation checks.
4. GitHub ruleset/classic branch-protection enforcement remains unverified through the available integration.
5. No completed formal internal audit is claimed.
6. No completed management review is claimed.
7. No completed `RT-001` restore exercise is claimed.
8. No completed `EX-001` incident exercise is claimed.
9. Initial competence/awareness/access/supplier review evidence remains incomplete until performed.
10. D1/R2 backup/restore effectiveness remains incomplete.
11. Independent penetration testing, dedicated SAST/DAST/fuzzing and independent secure-code review are not claimed.
12. Complete developer/admin endpoint hardening/malware assurance remains a gap.
13. Manual WCAG browser/assistive-technology evidence must be maintained separately from automated checks.
14. Provider-side cryptographic, configuration, continuity and encryption claims are not treated as WizardGang effectiveness evidence without verification.
15. No contractual SLA/RTO/RPO, alternate Cloudflare runtime, alternate Git/CI platform, tested DNS failover or hot/warm standby is claimed.

These gaps are not reasons to invent new evidence or change a row to `Met`.

## 19. Post-Baseline Work Sequence

The controlled baseline has progressed beyond the original DEMO-103 documentation milestone:

1. **Governance metadata consistency — DEMO-104 complete.** Canonical references are normalized, registered, and CI-validated.
2. **SoA refresh — DEMO-105 complete.** ISO Annex A rows were reassessed against the completed governance baseline without upgrading unsupported effectiveness claims.
3. **Structured public assurance and exhaustive compliance — DEMO-114 through DEMO-120 complete.** Evidence, ISO/WCAG compliance, risk, incident/exercise, and public projections are structured and linked.
4. **Integrity, lifecycle, and API hardening — DEMO-121 through DEMO-124 complete.** Cross-dataset validation, stable record lifecycle/disclosure review, and the public API contract are enforced.
5. **Canonical SoA authority, release snapshots, and recurring monitoring — DEMO-125.** Structured compliance data is the only per-control status/rationale authority; Markdown is generated, releases carry digest-bound registry snapshots, and scheduled checks cover expiry/freshness/reporting/ownership.
6. **Operating evidence.** Complete actual access/supplier/competence/threat/recovery/incident/accessibility/objective review activities as they become due.
7. **Self-assessment/audit and management review.** Evaluate the operating system once sufficient evidence exists; label owner-only review correctly as self-assessment.
8. **Corrective action.** Create findings only against defined applicable requirements and verify effectiveness after implementation.
9. **Release/public assurance updates.** Continue publishing evidence posture without certification overclaim.

## 20. Traceability Standard

The target evidence chain is:

```text
Requirement / criterion / control
-> canonical structured applicability and rationale
-> policy / procedure / risk / objective
-> implementation source or controlled action
-> DEMO change / branch / commit / PR
-> validation
-> merge / tag / release + registry snapshot
-> deployment
-> runtime / manual / management evidence
-> public compliance projection
```

Not every requirement needs every link. A policy clause may terminate in management-review evidence; a technical control may include source/tests/deployment/runtime evidence; an N/A control requires scope rationale rather than fake implementation.

## 21. Baseline Completion Statement

`DEMO-070` through `DEMO-103` established the initial repository-native governance documentation layer for the WizardGang Architecture Demo. Subsequent DEMO changes added the structured assurance registry, exhaustive compliance projections, lifecycle/disclosure controls, API contract, and release/monitoring integrity controls described above.

The system now has controlled documentation for:

- context, interested parties and scope;
- integrated ISMS/AIMS governance;
- leadership, policies and roles;
- security and AI risk;
- AI impact assessment;
- generated ISO Statement of Applicability summaries backed by canonical structured data;
- objectives and management-system change planning;
- competence, awareness, communications and concerns;
- operational control and risk reassessment;
- monitoring, audit/self-assessment and management review;
- nonconformity, corrective action and improvement;
- suppliers and AI providers;
- incidents;
- backup/recovery/restore;
- data governance;
- vulnerability/threat/security maintenance;
- assets, acceptable use and access review;
- legal/contractual/IP/privacy obligations;
- configuration/drift;
- cryptography/secrets;
- secure engineering/testing;
- continuity/resilience;
- public structured assurance/compliance data with stable lifecycle controls;
- release-bound registry snapshots and scheduled assurance monitoring;
- and this control/document index.

The next maturity gain comes from **current operating evidence, completed reviews/exercises, independent assurance, and measured effectiveness**—not from duplicating state or expanding the policy stack.
