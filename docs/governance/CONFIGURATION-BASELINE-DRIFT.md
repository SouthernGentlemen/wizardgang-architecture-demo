# Configuration Baseline and Drift Management

**Reference:** WG-GOV-024  
**Applies to:** ISO/IEC 27001:2022 configuration management, change management, secure development, privileged access, logging, monitoring, supplier, backup/recovery, and operational controls · ISO/IEC 42001:2023 configuration, resource, supplier, data, AI/MCP authority, change, monitoring, and operational-control requirements  
**Status:** Approved
**Owner:** Technical System Owner / Change and Release Authority  
**Approval:** Controlled pull request and merge  
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Review:** At least annually, after material architecture/provider/configuration changes, and when drift or unauthorized configuration is detected

## 1. Purpose

This procedure defines how the WizardGang Architecture Demo establishes authoritative configuration baselines, distinguishes configuration from secrets, detects and handles drift, controls emergency changes, and verifies production configuration after deployment.

The project already stores substantial desired-state configuration in source, including `wrangler.jsonc`, GitHub Actions workflows, runtime contracts, route manifests, package lockfiles, migrations, and feature configuration. Production deployment also injects release identity and selected environment-specific values through the controlled deploy workflow.

This procedure makes those sources explicit and separates four different things that must not be confused:

1. **repository desired state** — configuration represented in controlled source;
2. **managed secret state** — sensitive values stored outside source;
3. **provider-side state** — GitHub/Cloudflare/account configuration that may exist outside the repository;
4. **observed runtime state** — what the deployed system actually reports or demonstrates.

Approval of this procedure does **not** prove that all provider-console state is continuously synchronized, that GitHub branch protection/rulesets are configured, that every Cloudflare resource can be reconstructed automatically, or that automated drift detection exists for every external setting.

This record supports engineering alignment with ISO/IEC 27001 and ISO/IEC 42001. It does not represent certification.

## 2. Configuration Principles

1. **Source-controlled desired state is preferred.** Configuration that can safely and meaningfully live in Git should be versioned and reviewed there.
2. **Secrets are not configuration files.** Secret values stay in approved managed secret stores or ignored local development files.
3. **Environment-specific values are explicit.** Production-specific resource identifiers, release identity, and provider values must have a defined source and owner.
4. **Generated state is not manually edited.** Generated manifests or evidence should be regenerated from their source and validated.
5. **Applied migrations are immutable.** Database schema changes use new numbered migrations rather than rewriting applied history.
6. **Runtime verification matters.** A correct repository file does not prove production matches it.
7. **External state stays visible.** Settings that cannot be verified through current evidence remain Partial/Unverified rather than assumed aligned.
8. **Drift is evaluated, not blindly reverted.** Observed differences may represent unauthorized drift, an emergency change, a provider-managed change, or a desired baseline that needs updating.
9. **Emergency changes remain controlled afterward.** Urgent containment may precede normal documentation, but material emergency changes must be reconciled into controlled history promptly.
10. **Privilege follows configuration sensitivity.** Changes to production, secrets, identity, DNS, data stores, GitHub permissions, or AI/MCP authority require appropriate authorization.
11. **AI/MCP configuration is safety-relevant.** Tool inventory, permissions, data sources, approved provider families, and authority boundaries are part of the governed baseline.
12. **No silent third AI/MCP provider.** Codex and Claude remain the only approved AI/MCP families; configuration changes that introduce another family require the full controlled reassessment process.

## 3. Configuration Classes

The management system uses these configuration classes:

| Class | Examples | Primary control |
|---|---|---|
| **SOURCE-CONFIG** | `wrangler.jsonc`, `config/*.json`, workflow YAML, TypeScript configuration | Git history + PR + CI |
| **GENERATED-CONFIG** | route manifest, generated evidence, generated artifacts | generator + validation + Git/evidence |
| **SCHEMA-CONFIG** | D1 migrations, API contracts, MCP tool schemas | immutable/versioned source + tests |
| **SECRET-CONFIG** | passwords, tokens, signing material, session secrets | GitHub/Cloudflare managed secret stores; local ignored `.dev.vars` |
| **PROVIDER-CONFIG** | GitHub permissions, environment settings, Cloudflare DNS/resource/account settings | provider console/API + access control + review evidence |
| **DEPLOYMENT-CONFIG** | deployed tag/SHA, environment name, deployment variables | tagged release + deployment workflow |
| **RUNTIME-STATE** | online/offline state, crawler control, health, selected operational control state | D1/runtime control + audit/logging |
| **AI-MCP-CONFIG** | MCP tools, scopes, approved public data source, approved provider families | source + risk/impact/SoA/evaluation approval |

A value may belong to more than one class. For example, a Cloudflare D1 binding is represented in source but also depends on provider-side resource existence.

## 4. Authoritative Baseline Sources

The current configuration inventory is maintained in:

`docs/governance/registers/CONFIGURATION-REGISTER.md`

The primary baseline sources include:

- `wrangler.jsonc` — Worker name, source entry point, compatibility date, custom domain route, five-minute cron, non-secret variables, D1 binding, R2 binding, Durable Object binding/migration;
- `.github/workflows/ci.yml` — validation baseline;
- `.github/workflows/deploy.yml` — production deployment baseline and environment-specific deployment variables;
- `.github/workflows/release.yml` and `git-demo.yml` — controlled release and live-demo lifecycle configuration;
- `.dev.vars.example` — local-development variable/secret-name template only, never authoritative secret values;
- `config/*.json` — application configuration owned by source;
- `contracts/**` — API, webhook, identity, and MCP contract configuration;
- `migrations/**` — D1 schema/history baseline;
- `package.json` / `package-lock.json` — package/tooling baseline;
- `tsconfig.json`, `vitest.config.ts` — build/test configuration;
- `docs/route-manifest.json` — generated route inventory whose source is the route registry/generator;
- management-system policies/registers where control configuration is expressed;
- provider-side GitHub and Cloudflare settings where they cannot be fully represented in source.

## 5. `wrangler.jsonc` Baseline

`wrangler.jsonc` is the repository baseline for the Cloudflare Worker configuration that is safe to commit.

Current controlled items include:

- Worker name: `wizardgang-architecture-demo`;
- entry point: `src/index.ts`;
- compatibility date;
- custom domain `demo.wizardgang.ai`;
- five-minute scheduled trigger;
- non-secret runtime variables;
- D1 binding `DEMO_DB` to `demo-blob`;
- R2 binding `DEMO_R2` to `wizardgang-demo-r2` with preview bucket;
- Durable Object binding `DEMO_COORDINATOR` to `DemoCoordinator`;
- Durable Object migration history.

Resource IDs/names that are intentionally represented in public source are configuration identifiers, not credentials. Their visibility does not authorize access to those resources.

Changes to bindings, routes, cron schedules, Durable Object migrations, database/resource identity, or compatibility dates require normal controlled change and validation.

## 6. Deployment-Time Configuration

Production deployment occurs only from an existing annotated semantic-version tag under the current release model.

The deploy workflow:

- checks out the exact tagged source;
- validates the annotated semantic-version tag;
- installs locked dependencies;
- runs repository validation;
- applies remote D1 migrations;
- deploys the Worker;
- injects release identity and selected production variables;
- verifies `/version` and `/health` after deployment.

Deployment-time values such as `DEPLOYED_VERSION`, `DEPLOYED_SHA`, `DEPLOYMENT_ENVIRONMENT`, and CI status are expected to differ from development defaults in `wrangler.jsonc`. That difference is **controlled environment substitution**, not drift.

A deployment variable duplicated in both `wrangler.jsonc` and the workflow should have a clear production authority. The deployment workflow is authoritative for values it intentionally supplies at production deployment.

## 7. Secrets vs Non-Secret Configuration

Secret values must never be committed to the repository.

The repository may document:

- secret variable names;
- purpose;
- required format/length;
- owning function;
- environment in which the secret is required;
- rotation/revocation procedure;
- and whether the secret is optional or conditional.

Actual values belong in:

- GitHub-managed secrets where a workflow requires them;
- Cloudflare-managed Worker secrets/provider secret storage;
- ignored `.dev.vars` for local-only development;
- provider-specific secure stores where required.

`.dev.vars.example` is a template only. Placeholder strings are not approved production values.

Non-secret configuration should not be hidden in a secret store merely to avoid documenting it. Configuration that affects behavior should remain reviewable where practical.

## 8. Environment Separation

The current operating model distinguishes at least:

- **local development** — local Wrangler/D1 environment and `.dev.vars`;
- **preview/test behavior** — tests, dry-run build, preview R2 where applicable;
- **production** — `demo.wizardgang.ai`, production D1/R2/DO/runtime and production deployment environment.

Rules:

- local placeholder credentials must never be treated as production credentials;
- production secret values must not be copied into source-controlled examples;
- preview/test data must not silently become production data;
- production deployment must use the controlled tagged workflow;
- environment-specific provider identifiers must be reviewed when changed;
- tests that require mocks/stubs must not be represented as proof of production provider configuration.

## 9. GitHub Configuration Baseline

Repository-controlled GitHub configuration includes:

- workflow definitions;
- workflow permissions specified in YAML;
- controlled change conventions;
- CI validation;
- release/deploy mechanics;
- issue templates;
- repository source/history.

Provider-side GitHub configuration may include:

- collaborator/repository permissions;
- environment settings;
- environment protection rules;
- Actions settings;
- secret/variable configuration;
- branch protection/classic protections;
- rulesets;
- private vulnerability reporting configuration.

These external settings must not be inferred solely from workflow files.

**Current evidence limitation:** configured rulesets were not observed through the available ruleset query, and classic branch-protection enforcement could not be fully verified through the available integration. Therefore the management system records repository enforcement as Partial/Unverified unless stronger evidence is obtained.

## 10. Cloudflare Configuration Baseline

Repository-controlled Cloudflare desired state includes the Worker/binding/route/cron configuration and deployment workflow.

Provider-side state includes, as applicable:

- account ownership/permissions;
- API tokens and scopes;
- Worker secret values;
- D1 database existence/configuration;
- R2 bucket existence/configuration;
- Durable Object namespace/state;
- custom-domain/DNS/TLS configuration;
- Worker environment settings;
- analytics/billing access;
- any provider feature configured outside source.

Provider-side state should be reviewed when materially changed and after incidents/recovery.

This procedure does not claim that all provider-side Cloudflare configuration is currently exportable or continuously compared against Git.

## 11. Application Configuration

Source-owned application configuration under `config/`, contracts, route definitions, and related code is controlled through Git.

Configuration changes that alter:

- public routes;
- API contract behavior;
- authorization scopes;
- webhook events;
- identity behavior;
- billing/degradation thresholds;
- i18n support;
- data exposure;
- logging/public diagnostics;
- or accessibility behavior

must update the appropriate contracts/docs/tests as required by the existing contribution and architecture standards.

## 12. Database and Storage Configuration

D1 schema configuration is represented through numbered migrations.

Rules:

- never rewrite an applied migration;
- add the next numbered migration;
- validate migrations against a clean local database in CI;
- review production migration effects before deployment;
- preserve data classification and retention requirements when schemas change;
- update backup/recovery expectations where the recoverable state changes.

R2 object handling, metadata schema, expiration behavior, and access boundaries must remain consistent with data governance and recovery requirements.

## 13. AI/MCP Configuration Baseline

The current AI/MCP baseline is deliberately narrow:

- public MCP endpoint under the documented server route;
- read-only/non-destructive tool inventory;
- `demo:read` authorization boundary;
- `demo_records` as the only approved D1 source for public MCP records;
- namespace validation and bounded results;
- no write/admin/deploy/source-control/destructive/private-data authority;
- OpenAI Codex and Anthropic Claude as the only approved AI/MCP provider/client families.

Changes to any of the following are **material configuration changes**:

- new MCP tool;
- tool permission expansion;
- write/delete/admin/deploy capability;
- new data source/namespace;
- increased result/exposure boundary;
- new provider/client family;
- authentication/authorization change;
- provider-specific privilege;
- new autonomy or reduced human oversight;
- protocol/SDK change affecting authority or data behavior.

Such changes require security risk, AI risk, impact assessment, SoA, supplier, data, evaluation, and management approval as already defined.

## 14. Drift Definition

**Configuration drift** is a material difference between the approved baseline and the observed provider/runtime/system state that is not already explained by an approved environment substitution, deployment identity, provider-managed behavior, or controlled change.

Examples include:

- production running an unexpected commit/tag;
- missing or unexpected Worker binding;
- changed route/domain behavior;
- changed cron schedule;
- provider token permissions broader than intended;
- unexpected GitHub collaborator/role;
- changed repository/environment setting;
- unapproved secret/variable name or missing required secret;
- D1/R2 resource pointed at the wrong environment;
- MCP tool/data/authority outside the approved inventory;
- public diagnostic behavior exposing configuration that should be private;
- undocumented emergency provider-console changes.

## 15. Drift Detection Sources

Drift may be detected through:

- Git diff/PR review;
- CI validation;
- generated-manifest validation;
- deployment `/version` verification;
- `/health` and operational observations;
- GitHub/provider configuration review;
- access review;
- supplier review;
- security monitoring;
- incident investigation;
- restore testing;
- internal audit/self-assessment;
- management review;
- manual comparison of provider state to the register;
- or future automated configuration reconciliation.

Current automation does **not** provide complete GitHub/Cloudflare provider-state drift detection. That remains a Partial control.

## 16. Configuration Review Cadence

The following review baseline applies:

| Configuration area | Minimum review/trigger |
|---|---|
| Source-controlled config | every controlled change affecting it |
| Production release identity | every deployment |
| Public runtime health/version | every deployment + routine monitoring |
| Privileged/provider access | quarterly + event-driven |
| GitHub provider settings | at least annually and after material permission/workflow/security changes |
| Cloudflare provider settings | at least annually and after material resource/permission/domain/storage changes |
| Secrets/credential inventory | at least quarterly as part of access/secret review and after compromise/role change |
| AI/MCP authority/data/provider baseline | every material AI/MCP change + periodic governance review |
| Full configuration register | at least annually and during management review |

More frequent checks may be used where technically inexpensive or risk warrants them.

## 17. Drift Triage

When drift is detected:

1. identify the affected asset/configuration;
2. capture enough evidence to reproduce the difference without exposing secrets;
3. determine whether the difference is authorized environment substitution, approved change, provider-managed behavior, emergency change, or unauthorized/unexplained drift;
4. evaluate security/AI/availability/data/recovery impact;
5. contain or revert if necessary;
6. open a controlled `DEMO-###` change if the desired baseline must be changed;
7. update risk/incident/corrective-action records where applicable;
8. revalidate production/runtime state;
9. close only when the desired and accepted state is explicit and evidenced.

## 18. Unauthorized or Suspicious Drift

Drift involving any of the following should be treated as security-significant until explained:

- credentials or secret configuration;
- repository/admin privileges;
- production deployment source;
- DNS/custom domain;
- D1/R2 resource identity;
- authentication/authorization;
- webhook validation;
- logging/redaction;
- AI/MCP authority or data exposure;
- unexpected provider/client family;
- disabled security validation;
- altered evidence/release history.

Such drift may trigger incident management, credential rotation, release verification, risk reassessment, supplier review, and corrective action.

## 19. Emergency Configuration Changes

An emergency change may be necessary to:

- contain active exploitation;
- revoke compromised credentials;
- disable an unsafe endpoint/tool;
- take the demo offline;
- block a crawler/client behavior;
- correct provider/DNS configuration;
- stop destructive or excessive resource use;
- or restore safe operation.

When normal pre-change review would materially delay containment, an authorized owner may implement the minimum safe emergency change.

Afterward, the change must be reconciled by:

- recording what changed and why;
- identifying who authorized/performed it;
- preserving relevant evidence;
- deciding whether the change is temporary or becomes desired baseline;
- creating the corresponding controlled change where required;
- updating source/config/registers;
- performing validation;
- reviewing risk/incident/corrective-action impact;
- and removing temporary elevated access or workaround configuration when no longer needed.

Emergency authority does not allow silent permanent drift.

## 20. Post-Deployment Configuration Verification

Every production deployment already verifies release identity and Worker health.

Post-deployment configuration verification should include, proportionately:

- `/version` matches expected semantic version and commit SHA;
- Worker service reports operational through `/health`;
- required D1/R2/DO dependencies are available or accurately degraded;
- critical routes respond as expected;
- admin/offline boundary remains intact;
- public logs remain sanitized;
- MCP remains within approved read-only/data/provider boundary;
- no unexpected environment/version value appears publicly;
- configuration-related migrations completed successfully.

A successful deploy does not prove every provider-side setting is correct; external configuration review remains separate evidence.

## 21. Configuration Evidence

Evidence may include:

- controlled source files and Git history;
- PR review/CI results;
- provider-derived retained validation report;
- tagged release and deployment history;
- `/version` and `/health` verification;
- D1 audit events;
- provider configuration exports/screenshots/summaries retained privately where appropriate;
- access reviews;
- incident/recovery records;
- configuration register reviews;
- corrective actions;
- management review.

Secret values must never be included merely to prove that a secret exists.

## 22. Current Gaps / Planned Improvements

At approval, the following remain incomplete until evidenced:

- full provider-side GitHub configuration reconciliation;
- verified branch/classic protection status through an authoritative source;
- automated GitHub/Cloudflare drift detection;
- complete Cloudflare provider-state export/reconciliation;
- recurring secret inventory/rotation evidence;
- completed `AR-001` access review;
- completed restore test and post-restore configuration verification;
- retained recurring configuration-review history;
- formal automated MCP configuration/data-sensitive-field drift checks beyond current contract/tests.

These are evidence/control gaps, not reasons to weaken the baseline.

## 23. Required Record for a Configuration Review

A material review should record at minimum:

- `reviewId`;
- date/time;
- reviewer;
- scope;
- baseline source/version;
- observed environment/provider;
- configuration items checked;
- differences found;
- classification of each difference;
- required actions;
- owners/due dates;
- linked change/incident/risk/corrective action;
- conclusion;
- follow-up evidence.

## 24. Alignment

This procedure primarily strengthens the evidence posture for:

- ISO/IEC 27001 configuration-management and change-management controls;
- access and privileged configuration controls;
- secure-development and deployment controls;
- logging/monitoring and incident controls;
- supplier/cloud configuration responsibilities;
- recovery configuration assurance;
- ISO/IEC 42001 AI-resource, supplier, data, authority, and change controls.

**Current posture after approval:** configuration governance is defined and substantial repository desired state is version-controlled. Full provider-side drift assurance remains Partial until recurring reconciliation evidence or automation is implemented. Certification is not claimed.
