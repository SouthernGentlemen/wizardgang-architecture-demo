# Continuity and Resilience Plan

**Reference:** WG-GOV-026  
**Applies to:** ISO/IEC 27001:2022 information-security continuity, ICT readiness, supplier, backup/recovery, incident, availability, configuration, logging, access-control, and operational-resilience controls · ISO/IEC 42001:2023 operational continuity, supplier, data, security, human-oversight, AI/MCP, monitoring, incident, and change requirements  
**Status:** Proposed  
**Owner:** Operations Owner / Management-System Owner  
**Approval:** Controlled pull request and merge  
**Review:** At least annually, after a material outage/incident/recovery exercise, and after material architecture, supplier, data, security, or AI/MCP change

## 1. Purpose

This plan defines how the WizardGang Architecture Demo maintains safe and useful operation during disruption, intentionally reduces capability when dependencies or controls are unreliable, communicates service state, coordinates recovery, and returns to normal operation only after required boundaries are verified.

The project already has several continuity-enabling mechanisms:

- an explicit online/offline control;
- a public maintenance page;
- API-safe `503` behavior during intentional offline operation;
- health, version, logs, documentation, billing/usage, and dashboard routes intended to remain observable during ordinary demo outages;
- five-minute health observations;
- graceful cost/degradation behavior;
- exact-tag release/deployment mechanics;
- incident-management procedures;
- backup/recovery/restore procedures;
- supplier governance;
- risk and objective registers.

This plan connects those mechanisms into one continuity model. It does not create a second incident process, a second recovery process, or an unsupported disaster-recovery promise.

Approval of this document does **not** establish a contractual SLA, prove a completed continuity exercise, prove that GitHub or Cloudflare can always be bypassed, prove that D1/R2 recovery is currently successful, or establish measured RTO/RPO performance.

WizardGang remains **aligned — uncertified** unless independent certification is explicitly obtained and evidenced.

## 2. Continuity Principles

1. **Safe service is more important than full service.** A degraded or intentionally offline demo is preferable to an available system whose authorization, data, logging, recovery, or AI boundary cannot be trusted.
2. **Continuity is not the same as uptime.** The ability to communicate status, preserve control, retain evidence, and recover safely is part of continuity even while ordinary demo routes are unavailable.
3. **Incident response and continuity are linked but distinct.** Incident management contains and investigates; continuity determines what service can safely continue; recovery restores lost or damaged capability.
4. **Provider resilience is not WizardGang resilience evidence by itself.** GitHub/Cloudflare availability features do not prove WizardGang continuity until the configured dependency and recovery path are understood and exercised proportionately.
5. **No invented SLA/RTO/RPO.** Actual recovery duration and recovered data point are measured through technical tests/incidents before stronger objectives are claimed.
6. **Critical boundaries do not degrade open.** Authentication, authorization, secret handling, data restrictions, public-log safety, and AI/MCP authority fail closed when they cannot be trusted.
7. **Status remains understandable.** Users and reviewers should be able to tell the difference between intentional maintenance, dependency degradation, and normal operation without exposing sensitive infrastructure details.
8. **Evidence survives where practical.** Continuity actions should preserve the records needed to understand the disruption and decisions made.
9. **Supplier fallback must be real.** A dependency cannot be described as redundant merely because an alternative vendor exists in the market.
10. **AI provider substitution is not an emergency shortcut.** Codex and Claude remain the only approved AI/MCP families; a third provider requires controlled review even during a disruption.
11. **Accessibility remains part of continuity.** Status, maintenance, authentication, and critical operating information must remain usable by keyboard and assistive technology where the interface remains available.
12. **Return to normal is an explicit decision.** Service is not considered fully restored merely because the homepage responds.

## 3. Relationship to Other Procedures

This plan relies on, but does not duplicate:

| Concern | Governing record |
|---|---|
| Incident detection, severity, containment, investigation, notification | `INCIDENT-MANAGEMENT.md` |
| Backup, reconstruction, data restore, restore testing | `BACKUP-RECOVERY-RESTORE.md` |
| Runtime/admin/health/log/offline behavior | `docs/OPERATIONS.md` |
| Supplier criticality and provider changes | `SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md` + supplier register |
| Security/AI risk treatment | security and AI risk registers |
| Change/release/deployment | `CHANGE-MANAGEMENT.md`, release/deployment documents/workflows |
| Secure verification | `SECURE-ENGINEERING-TESTING.md` |
| Corrective action | `NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md` |
| Management decisions | `MANAGEMENT-REVIEW.md` |

A disruption may invoke several of these records at once.

## 4. Continuity Objectives

The current continuity objectives are qualitative until actual exercises provide measured evidence.

### 4.1 Preserve trustworthy control

During disruption the operator must retain, or deliberately re-establish before restoration:

- authorized repository/provider control;
- known release identity;
- protected credentials/secrets;
- ability to place the demo offline or otherwise fail closed;
- ability to observe enough status/evidence to make a safe decision.

### 4.2 Preserve a minimum public status surface where possible

When the Worker/runtime remains healthy enough to serve requests safely, the design intends to keep these surfaces available:

- `/dashboard` and operational dashboard routes;
- `/health`;
- `/version`;
- `/offline`;
- protected `/admin`;
- `/robots.txt`;
- public-safe operations logs/usage endpoints that remain trustworthy.

This is a design intent, not a promise that the routes remain reachable during a total Cloudflare or DNS outage.

### 4.3 Fail ordinary demo behavior closed when necessary

If a material dependency, control state, authentication boundary, data source, or AI authority cannot be trusted, ordinary architecture/demo routes may be blocked or placed into maintenance/offline mode.

### 4.4 Preserve evidence and recovery options

Continuity actions should avoid destroying logs, audit history, releases, data, or provider evidence needed for incident/recovery analysis where practical.

### 4.5 Restore from known-good state

Recovery uses reviewed source/release identity and verified data/configuration inputs rather than improvising an untraceable production state.

## 5. Operating Modes

The demo uses four conceptual continuity modes.

### 5.1 Normal

Normal operation means:

- ordinary demo routes available;
- expected dependencies operating within observed limits;
- security and AI boundaries verified by normal controls;
- no active continuity restriction.

Normal does not imply zero risk or contractual uptime.

### 5.2 Degraded

Degraded operation is used when the service can safely provide a subset of functionality but a dependency, resource, feature, or assurance signal is impaired.

Examples:

- optional Cloudflare usage telemetry unavailable;
- identity provider unavailable while public read-only demos remain safe;
- optional compute behavior paused due to the cost-degradation scenario;
- R2-specific demo unavailable while unrelated routes remain safe;
- GitHub links/workflow activity unavailable while already deployed read-only functionality remains safe;
- an MCP feature disabled while the rest of the site remains functional.

Degraded operation must not silently broaden access or substitute synthetic success data.

### 5.3 Intentional Offline / Maintenance

Intentional offline operation blocks ordinary demo behavior while keeping the operational/control surface available where the Worker remains functional.

Current design behavior includes:

- browser GETs to ordinary architecture routes redirecting to `/offline?from=...`;
- API/non-HTML/write requests receiving safe JSON `503` responses;
- dashboard/health/version/offline/admin remaining reachable where runtime permits;
- no redirect loops;
- no debugging-secret exposure.

Offline mode may be used for containment, maintenance, failed recovery, unsafe dependency state, or controlled exercise.

### 5.4 Recovery / Verification

Recovery mode is the period after containment/reconstruction where some service may be technically reachable but normal operation has not yet been approved.

Recovery mode continues until required validation has established the expected:

- release/version identity;
- health/dependency state;
- authentication/authorization boundary;
- data/storage state;
- logging/audit behavior;
- admin/offline behavior;
- accessibility of critical status/control interfaces;
- and AI/MCP authority/data/provider boundary where applicable.

## 6. Service and Asset Priorities

The continuity priority follows the recovery model but focuses on operational capability.

| Priority | Capability | Continuity objective |
|---|---|---|
| **C0 — Control** | repository/provider account control, credentials, admin containment, known release identity | retain/re-establish trustworthy control before expanding service |
| **C1 — Core status/runtime** | Worker, DNS/route where available, `/version`, `/health`, operational status, critical D1 control state | provide identifiable and safely observable service |
| **C2 — Core demo data/functions** | ordinary Worker routes, D1 application data, required integrations | restore when control and data boundaries are trustworthy |
| **C3 — Object/optional integrations** | R2 features, identity-provider demonstrations, webhooks, AI/MCP, optional telemetry | restore independently when their own boundary is verified |
| **C4 — Historical diagnostics** | nonessential telemetry, usage history, public-safe historical logs | preserve/restore where retained and useful; otherwise document loss and resume collection |

A lower-priority feature must not delay containment of a higher-priority trust problem.

## 7. Disruption and Continuity Scenarios

### 7.1 Cloudflare Worker/runtime outage

Potential effect:

- public demo, dashboard, health, version, admin, API, MCP, D1/R2/DO mediated access may all become unavailable;
- the application cannot provide its own status page if the Worker/edge route is entirely unavailable.

Continuity response:

- confirm provider/service status using independent authorized channels where available;
- preserve Git/release/configuration evidence;
- avoid unnecessary deployment churn during a provider-wide incident;
- communicate through available external channels if a communication obligation exists and the application itself cannot respond;
- use incident/supplier processes for material outages;
- recover/redeploy only when provider capability and current release state can be verified.

**Current limitation:** no immediate independently hosted alternate runtime/status platform is claimed.

### 7.2 D1 unavailable or unreliable

Potential effect:

- admin/control state, application data, logs/audit, sessions, health observations, and other stateful behavior may fail.

Continuity response:

- fail closed for controls that depend on D1 and cannot be trusted;
- use intentional offline/degraded behavior where available;
- do not substitute fabricated data for unavailable authoritative state;
- preserve evidence;
- invoke D1 recovery if loss/corruption is involved;
- verify restored authorization/control/data behavior before returning to normal.

### 7.3 R2 unavailable or unreliable

Potential effect:

- object-storage demos/content may fail while unrelated Worker/D1 functionality may remain safe.

Continuity response:

- isolate/degrade R2-dependent features where feasible;
- preserve the rest of the service if independent boundaries remain healthy;
- determine whether affected objects are reconstructable or require restore;
- verify object integrity/access control before restoring the feature.

### 7.4 Durable Object disruption

Potential effect:

- coordinated-state demonstrations may fail or behave inconsistently.

Continuity response:

- disable/degrade DO-dependent functionality if state cannot be trusted;
- do not move coordinated state into unsafe in-memory shortcuts merely to retain functionality;
- determine whether the state is reconstructable or requires a service-specific recovery decision;
- treat non-reconstructable critical state as a recovery/risk issue.

### 7.5 GitHub outage or repository-hosting disruption

Potential effect:

- PR/change workflow, hosted CI, releases, repository browsing, and normal tagged deployment initiation may be unavailable.

Continuity response:

- keep an already deployed safe release operating if no related security reason requires shutdown;
- do not bypass controlled release history by deploying arbitrary unreviewed local source solely because GitHub is unavailable;
- use retained local clones only as continuity/recovery inputs whose identity/integrity can be established;
- defer ordinary changes/releases until the controlled workflow is restored where practical;
- use incident/supplier review if the disruption is material.

**Current limitation:** a fully independent source-control/CI failover platform is not claimed.

### 7.6 Deployment/release failure

Potential effect:

- new version fails validation or deployment; partial rollout; runtime version mismatch.

Continuity response:

- keep/restore a known approved tag where possible;
- verify exact `/version` commit/version identity;
- verify `/health` and affected boundary;
- use intentional offline state if safe known-good operation cannot be established;
- preserve workflow/deployment evidence;
- treat persistent or security-significant failures through incident/corrective processes.

### 7.7 DNS/custom-domain/TLS disruption

Potential effect:

- users may not reach the Worker through the expected public hostname even if the underlying service is otherwise healthy.

Continuity response:

- verify Cloudflare/domain state through authorized provider channels;
- avoid publishing unreviewed alternate URLs that bypass intended security/origin assumptions;
- restore approved DNS/domain/TLS configuration;
- revalidate same-origin/security behaviors and public hostname before normal operation.

Provider-managed TLS key lifecycle remains provider evidence unless independently verified.

### 7.8 Identity-provider disruption

Potential effect:

- Microsoft/Google/GitHub authentication demonstrations may become unavailable while public read-only content remains unaffected.

Continuity response:

- degrade/disable only the affected identity path where feasible;
- do not weaken application authorization or accept caller-supplied identity as a fallback;
- do not automatically convert viewers to operators;
- preserve local/admin boundaries separately;
- restore identity only after provider validation behavior remains trustworthy.

### 7.9 Credential compromise

Potential effect:

- provider, deployment, admin, webhook, identity, session, or API authority may be untrusted.

Continuity response:

- invoke incident handling;
- revoke/rotate affected credentials;
- disable affected integration/feature as required;
- preserve relevant evidence;
- re-provision through approved secret stores;
- validate authorization and logging before restoring dependent service.

Availability must not be preserved by continuing to use a credibly compromised secret.

### 7.10 Security vulnerability/exploitation

Continuity response:

- contain the affected route/feature or take the demo offline;
- preserve evidence;
- patch through controlled change;
- add regression testing where reproducible;
- restore only after the affected security invariant is revalidated;
- reassess related risk/SoA/incident records.

### 7.11 AI/MCP disruption or control failure

Potential effects include:

- MCP protocol/client incompatibility;
- tool invocation failure;
- unintended data exposure;
- tool/authority drift;
- provider/client behavior violating current assumptions;
- loss of required oversight.

Continuity response:

- disable MCP or the affected tool rather than broaden permissions;
- retain ordinary non-AI demo functionality if independently safe;
- preserve invocation/evaluation evidence where available;
- reassess AI risk and MCP impact assumptions after material failures;
- restore only the approved bounded tool/data/authorization model.

Current runtime baseline remains:

- `ping` and `list_demo_records` only;
- read-only/non-destructive authority;
- `demo:read` boundary;
- `demo_records` as the only approved D1 public MCP source;
- Codex and Claude as the only approved AI/MCP families.

A provider outage involving Codex or Claude does not authorize a third family as emergency failover.

### 7.12 Cost/resource pressure

The project explicitly demonstrates graceful degradation rather than uncontrolled spend.

Continuity behavior should:

- preserve critical status/admin/health/documentation functions;
- reduce or pause optional compute/features according to the controlled policy;
- label simulated/estimated billing behavior accurately;
- avoid representing cost-degradation simulation as a guaranteed provider billing control.

### 7.13 Data corruption/loss

Continuity response:

- stop writes or affected functionality when continued mutation may increase loss;
- preserve evidence;
- determine affected data class and reconstructability;
- invoke backup/recovery/restore;
- document unrecovered data/evidence;
- verify data authorization and AI exposure boundaries after restoration.

### 7.14 Logging/evidence impairment

If public-safe logs or audit evidence cannot be trusted:

- do not fabricate replacement evidence;
- determine whether operation can continue safely without the missing evidence;
- restrict high-risk changes/actions if accountability cannot be established;
- record the evidence gap;
- restore logging/audit control and determine whether management/risk/incident review is required.

## 8. Continuity Activation

Continuity mode may be activated by the Operations Owner, Incident Owner, or Management-System Owner when a disruption materially threatens safe normal operation.

Triggers include:

- health/dependency failure;
- provider notice;
- security/AI incident;
- failed deployment/recovery;
- data integrity concern;
- credential compromise;
- material configuration drift;
- sustained resource/cost issue;
- scheduled maintenance/exercise;
- or another condition where reduced functionality is safer than normal service.

Urgent containment does not require waiting for documentation completion. The decision and resulting configuration/state are recorded after immediate safety needs are addressed.

## 9. Decision Rights During Disruption

The responsible owner may, within existing authorization:

- intentionally place the demo offline;
- disable an affected route/integration/tool;
- pause release/deployment activity;
- roll back to an existing approved release;
- rotate/revoke a credential;
- restrict access;
- suspend a supplier integration;
- initiate recovery/testing;
- communicate an accurate bounded status.

The continuity process does **not** authorize:

- bypassing material security controls merely to restore availability;
- accepting High/Critical residual risk without the defined acceptance authority;
- adding an unapproved AI/MCP provider;
- fabricating logs/evidence/health results;
- deploying unreviewed arbitrary source when controlled history is available or can reasonably be restored;
- destroying incident evidence without a justified operational need.

## 10. Communication During Disruption

Communication should be proportional to impact and audience.

Potential channels include:

- `/offline` maintenance page;
- dashboard/health status where available;
- repository issue/release/notice when suitable and non-sensitive;
- direct supplier/support channel;
- direct communication to affected interested parties when an actual obligation or material need exists.

Public status communications should include, where appropriate:

- affected capability;
- whether the state is intentional maintenance/degradation or unexpected disruption when known;
- safe user action, if any;
- current limitation;
- restoration notice once verified.

Do not disclose:

- credentials;
- private infrastructure data;
- exploit details that create unnecessary risk;
- raw sensitive payloads;
- unsupported root-cause conclusions;
- unsupported legal/regulatory statements;
- fabricated restoration times.

SEV-1/SEV-2 incidents retain the explicit communication/notification decision requirements in the incident procedure.

## 11. Alternate Operating Paths

An alternate operating path is recognized only when it is actually controlled and supportable.

Current valid alternatives include:

- degraded feature set instead of full demo;
- intentional offline state instead of unsafe ordinary routes;
- exact-tag rollback instead of continuing a failed new deployment;
- independently safe public read-only routes while an identity integration is unavailable;
- disabling MCP while preserving unrelated architecture demonstrations;
- reconstructing source from retained Git history/clones where integrity can be established.

The following are **not currently claimed** as established failover:

- alternate cloud runtime replacing Cloudflare;
- alternate authoritative Git/CI provider replacing GitHub;
- alternate DNS provider with tested cutover;
- live replicated D1/R2 recovery environment;
- third AI/MCP provider replacing Codex/Claude;
- independently hosted external status page.

If these capabilities are later required, they become separate controlled architecture/supplier/risk/recovery work.

## 12. Continuity and Suppliers

GitHub and Cloudflare are Critical suppliers under the current register because loss of either can materially affect controlled delivery or runtime operation.

Continuity reviews should consider:

- what function the supplier provides;
- what can continue without it;
- what cannot safely continue;
- provider-side configuration/credential dependency;
- evidence available during outage;
- recovery/re-provisioning path;
- whether an alternate exists and has actually been tested;
- whether the event changes the supplier's risk/status.

Codex and Claude are Material AI/MCP suppliers under the current approved boundary. Their disruption may disable or reduce AI/MCP demonstration capability without requiring the rest of the site to fail.

An identity provider is Conditional and should be treated as material to continuity only when configured/active in the scenario being operated.

## 13. Continuity and Data

Continuity actions must respect data classification and recovery priority.

Rules:

- do not expose restricted data because the primary interface is unavailable;
- do not use public demo storage as an emergency backup for secrets/private evidence;
- do not restore data into a broader authorization scope than before the disruption;
- preserve the MCP rule that only `demo_records` is an approved public D1 source;
- document any permanent data/evidence loss rather than masking it;
- use recovery testing to establish actual recoverability instead of assuming provider durability.

## 14. Return-to-Normal Criteria

Normal service may resume when the responsible owner has proportionately verified the affected boundaries.

Depending on the event, criteria include:

- disruption contained or supplier/service restored sufficiently;
- expected semantic version/commit confirmed through `/version` or equivalent evidence;
- Worker and required dependency readiness confirmed through `/health` or equivalent evidence;
- D1/R2/DO state suitable for the affected functions;
- required credentials rotated/re-provisioned and not publicly exposed;
- authentication/authorization behaves as expected;
- intended admin/offline control works;
- public logging/audit behavior is safe and available enough for the restored service;
- affected routes/contracts function within approved boundaries;
- accessibility-critical status/control paths remain operable;
- MCP tools/data/permissions/provider-family constraints remain approved and tested when MCP is restored;
- outstanding limitations are explicitly documented and accepted by the appropriate authority.

A homepage `200` response is insufficient evidence by itself.

## 15. Post-Disruption Review

A material continuity event should determine:

- what service was preserved;
- what failed;
- duration/observed impact where measurable;
- whether degradation/offline controls worked;
- whether communication was adequate;
- whether recovery inputs were usable;
- whether supplier assumptions were accurate;
- whether security/data/AI boundaries remained intact;
- what manual dependencies delayed response;
- whether monitoring detected the event;
- whether corrective action is needed;
- whether risks/objectives/SoAs/supplier records require update.

The review is linked to the incident record when the disruption qualified as an incident.

## 16. Exercises and Testing

Continuity capability must be exercised rather than assumed.

The current management system already plans:

- `EX-001` — incident-response tabletop/exercise due **2026-12-02**;
- `RT-001` — first technical restore/recovery exercise due **2026-12-02**.

These exercises should together provide continuity evidence by covering:

- decision to degrade/offline;
- incident escalation;
- supplier dependency;
- status/communication decisions;
- known-good release selection;
- recovery of core state;
- return-to-normal validation;
- security/AI boundary verification.

A tabletop can demonstrate decision-process readiness but cannot prove a technical restore. Conversely, a technical restore test does not by itself prove incident communication, supplier escalation, or decision quality.

After the first exercises, management review should determine whether a distinct continuity-specific scenario is needed annually or whether combined incident/recovery exercises provide sufficient coverage.

No completed continuity exercise is claimed by approval of this plan.

## 17. Continuity Evidence

Useful evidence includes:

- incident/exercise ID;
- start/end timestamps;
- disruption scenario;
- affected routes/services/suppliers;
- selected operating mode;
- admin/offline change evidence;
- health/version results;
- GitHub workflow/release/deployment evidence;
- D1 audit events and public-safe application logs;
- supplier notices/support records where appropriate;
- restored data/object checks;
- communication decisions;
- validation results;
- measured recovery time/data point when applicable;
- follow-up/corrective actions;
- risk/objective/SoA/supplier updates.

Sensitive provider/account/credential evidence remains private/restricted rather than copied into public governance records.

## 18. Metrics

Continuity monitoring may evaluate:

- number of material service disruptions;
- intentional offline periods vs unexpected dependency failures;
- detection-to-containment time where samples exist;
- time spent in degraded/offline/recovery mode where measurable;
- successful/failed recovery exercises;
- percentage of material exercises/events with recorded return-to-normal validation;
- supplier-related disruptions;
- unrecovered data/evidence;
- overdue continuity/incident/recovery exercises;
- recurrence of continuity defects;
- corrective-action effectiveness.

A period with zero incidents is not by itself evidence of continuity readiness.

## 19. Current Evidence Posture

As of the 2026-09-02 management-system baseline:

### Demonstrated / structurally available

- intentional online/offline control exists;
- ordinary browser/API behavior has defined offline handling;
- operational/status routes are intentionally designed to remain available during ordinary intentional offline state;
- health observations run on a five-minute schedule;
- cost/degradation behavior is explicitly modeled;
- release identity and exact-tag deployment are defined;
- post-deployment version/health verification exists;
- incident, recovery, supplier, risk, and corrective-action procedures exist;
- security/AI boundaries are documented for recovery and degraded operation.

### Partial / not yet proven through continuity operation

- completed incident-response exercise;
- completed technical restore exercise;
- measured recovery time/data point;
- D1/R2 backup/restore effectiveness;
- independent GitHub-hosted source continuity;
- full provider-side configuration reconstruction;
- recurring continuity review history;
- communication exercise evidence;
- documented alternate external status channel.

### Not claimed / current gaps

- contractual SLA;
- achieved formal RTO/RPO;
- tested alternate cloud runtime;
- tested alternate source-control/CI platform;
- tested DNS-provider failover;
- hot/warm standby environment;
- third AI/MCP emergency provider;
- independent continuity certification/assurance.

These limitations remain visible until real evidence changes them.

## 20. Management-System Linkage

A material continuity disruption or exercise can trigger updates to:

- security risk register;
- AI risk register;
- objectives;
- supplier register/review;
- configuration baseline;
- data register;
- recovery test register;
- incident register;
- Statements of Applicability;
- MCP AI impact assessment;
- vulnerability/security maintenance records;
- corrective action;
- management review;
- `/compliance` evidence/status once the canonical registry is rebuilt.

Merge of a documentation change does not prove continuity effectiveness.

## 21. Supporting Evidence

Primary supporting records include:

- `docs/OPERATIONS.md`
- `docs/governance/INCIDENT-MANAGEMENT.md`
- `docs/governance/BACKUP-RECOVERY-RESTORE.md`
- `docs/governance/registers/INCIDENT-REGISTER.md`
- `docs/governance/registers/RECOVERY-TEST-REGISTER.md`
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`
- `docs/governance/registers/AI-RISK-REGISTER.md`
- `docs/governance/registers/OBJECTIVES.md`
- `docs/governance/SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md`
- `docs/governance/registers/SUPPLIER-REGISTER.md`
- `docs/governance/CONFIGURATION-BASELINE-DRIFT.md`
- `docs/governance/DATA-GOVERNANCE.md`
- `docs/governance/CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`
- `docs/governance/SECURE-ENGINEERING-TESTING.md`
- `docs/RELEASE.md`
- `.github/workflows/deploy.yml`
- `SECURITY.md`

## 22. Alignment Statement

This plan supports the integrated WizardGang information-security and AI-management-system baseline by defining how approved security, data, supplier, operational, and AI boundaries are preserved during disruption and recovery.

Its claims are deliberately limited to what is implemented and evidenced. Planned exercises, provider features, alternate platforms, recovery objectives, and certification are not represented as completed assurance.
