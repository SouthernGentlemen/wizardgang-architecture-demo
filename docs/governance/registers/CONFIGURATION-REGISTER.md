# Configuration Register

**Reference:** WG-REG-011  
**Framework:** Integrated ISMS / AIMS configuration governance  
**Status:** Approved
**Owner:** Technical System Owner / Change and Release Authority  
**Assessment date:** 2026-09-02  
**Review due:** 2026-12-02 for initial operating review, then at least annually and after material configuration/provider changes  
**Approval:** Controlled pull request and merge
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`

## 1. Purpose

This register identifies the material configuration surfaces for the WizardGang Architecture Demo, their authoritative source, environment, owner, verification method, drift posture, and known gaps.

The governing procedure is `docs/governance/CONFIGURATION-BASELINE-DRIFT.md`.

## 2. Status Values

- **Met** — desired state and verification are both established for the defined boundary.
- **Partial** — useful desired-state or verification evidence exists, but provider/runtime reconciliation is incomplete.
- **Gap** — material configuration assurance or evidence is missing.
- **N/A** — not applicable to the current scope, with rationale.

A repository file may be `Met` as desired-state configuration while provider enforcement remains `Partial`.

## 3. Current Configuration Summary

<!-- GENERATED:governance-records:configuration-summary:start -->
| ID | Configuration surface | Authority / source | Environment | Verification | Status |
|---|---|---|---|---|---|
| CFG-001 | Worker/runtime desired state | `wrangler.jsonc` | Production + local tooling | source review, Wrangler build/deploy | Met |
| CFG-002 | Production release identity | `.github/workflows/deploy.yml` + annotated tag | Production | `/version` expected version/SHA | Met |
| CFG-003 | Production Worker health | deploy workflow + runtime | Production | `/health` post-deploy + monitoring | Met |
| CFG-004 | D1 binding/resource identity | `wrangler.jsonc` + deploy workflow + Cloudflare resource | Production | build/deploy/health/migrations; provider reconciliation incomplete | Partial |
| CFG-005 | R2 binding/resource identity | `wrangler.jsonc` + deploy workflow + Cloudflare resource | Production/preview | build/runtime tests; provider reconciliation incomplete | Partial |
| CFG-006 | Durable Object binding/migration | `wrangler.jsonc` | Production | build/tests/runtime behavior | Partial |
| CFG-007 | Custom domain / route | `wrangler.jsonc` + Cloudflare DNS/domain state | Production | live route reachable; provider-side DNS/TLS review incomplete | Partial |
| CFG-008 | Scheduled five-minute health trigger | `wrangler.jsonc` | Production | operational records indicate scheduled behavior; provider trigger reconciliation incomplete | Partial |
| CFG-009 | Non-secret runtime variables | `wrangler.jsonc` + deployment overrides | Local/Production | deploy command + runtime surfaces where safe | Partial |
| CFG-010 | Managed secret names/requirements | `.dev.vars.example`, `SECURITY.md`, workflows/provider stores | Local/Production | names/purpose documented; values intentionally unverifiable publicly | Partial |
| CFG-011 | CI validation configuration | `.github/workflows/ci.yml` | GitHub Actions | workflow source + runs when available | Met |
| CFG-012 | Release/deployment workflows | workflow YAML + release docs | GitHub Actions/Production | source + tagged deployment evidence | Met |
| CFG-013 | GitHub repository permissions/protections | GitHub provider state | GitHub | rulesets query/classic protection evidence incomplete | Partial |
| CFG-014 | GitHub environment/secrets/variables | GitHub provider state | GitHub | workflow references exist; full provider-state inventory not public/evidenced | Partial |
| CFG-015 | Cloudflare account/token permissions | Cloudflare provider state + security docs | Production | least-privilege intent documented; recurring provider reconciliation pending | Partial |
| CFG-016 | Application feature config | `config/*.json` + source | All | source/CI/tests | Met |
| CFG-017 | API/webhook/identity contracts | `contracts/**` | All | contract validation/tests | Met |
| CFG-018 | MCP tool/authority/data boundary | `contracts/mcp/tools.json`, `src/api/mcp.ts`, governance records | Production | tests/evaluation/risk-impact records | Partial |
| CFG-019 | D1 schema/migrations | `migrations/**` | Local/Production | clean local migration validation + tagged production apply | Met |
| CFG-020 | Dependency/toolchain baseline | `package.json`, `package-lock.json` | CI/build | `npm ci`, audit, build/tests | Met |
| CFG-021 | TypeScript/test baseline | `tsconfig.json`, `vitest.config.ts` | CI/local | typecheck/tests | Met |
| CFG-022 | Route manifest | generator/registry → `docs/route-manifest.json` | Source | `validate:routes` | Met |
| CFG-023 | Runtime admin/offline/crawler state | D1/runtime controls | Production | audit/events/runtime routes | Partial |
| CFG-024 | Identity-provider configuration | provider-specific secrets/vars/contracts when active | Conditional | implementation/tests exist; provider activation varies | Partial |
| CFG-025 | Public logging/redaction configuration | source + `SECURITY.md` | Production | source validation/tests/runtime logs | Partial |
| CFG-026 | Billing/degradation configuration | `config/billing-demo.json`, deploy vars, runtime logic | Production | tests/usage/degradation evidence | Partial |
| CFG-027 | i18n configuration | `config/i18n.json`, locale files | All | locale validation/tests | Met |
| CFG-028 | Provider-side configuration drift monitoring | GitHub/Cloudflare external state | Production/GitHub | no complete automated reconciliation currently evidenced | Gap |
| CFG-029 | Emergency configuration reconciliation | incident/change processes | All | process defined; recurring event evidence not yet accumulated | Partial |
| CFG-030 | Configuration review history | this register + future review records | Management system | first formal review pending | Gap |
<!-- GENERATED:governance-records:configuration-summary:end -->

## 4. Critical Baseline — Production Worker

**Configuration IDs:** CFG-001 through CFG-010.

The current repository baseline establishes:

- Worker `wizardgang-architecture-demo`;
- `src/index.ts` entry point;
- custom domain `demo.wizardgang.ai`;
- five-minute cron;
- production D1 binding `DEMO_DB` / `demo-blob`;
- production R2 binding `DEMO_R2` / `wizardgang-demo-r2`;
- preview R2 bucket;
- `DEMO_COORDINATOR` Durable Object;
- source-safe non-secret variables.

Production deployment intentionally substitutes release and environment values. Those substitutions are expected and controlled.

**Known gap:** an automated full comparison between `wrangler.jsonc`/deploy desired state and the Cloudflare provider account is not currently evidenced.

## 5. Critical Baseline — Deployment Identity

**CFG-002 — Status: Met for current workflow design/evidence.**

Production deployment requires an exact annotated semantic-version tag and records the version/SHA into deployment variables. The workflow then verifies the live `/version` response against the expected version/SHA.

This provides strong evidence that the deployed Worker corresponds to the intended tagged source. It does not prove every provider-side setting matches source.

## 6. D1 Configuration

**CFG-004 / CFG-019.**

Current source identifies:

- binding: `DEMO_DB`;
- database name: `demo-blob`;
- production database identifier;
- migration directory: `migrations`.

CI applies migrations to a clean local database. Production deployment applies remote migrations before Worker deployment.

**Status split:**

- migration history/process — Met;
- provider-side database configuration/recovery assurance — Partial.

Review triggers include database replacement, binding change, migration failure, provider migration, restore event, data-classification change, or unexpected resource identity.

## 7. R2 Configuration

**CFG-005 — Status: Partial.**

Source identifies the production and preview bucket names and application binding.

Useful tests/implementation exist, but full provider-side bucket settings, lifecycle behavior, recovery/export posture, and configuration reconciliation remain incomplete.

R2 remains outside the public MCP data boundary by default.

## 8. Durable Object Configuration

**CFG-006 — Status: Partial.**

The source baseline contains the `DEMO_COORDINATOR` binding and `do-v1` migration.

Build/test evidence supports the application configuration. Provider-side Durable Object state/namespace reconciliation remains less complete than repository configuration evidence.

## 9. GitHub Configuration

### CFG-011 — CI configuration — Met

CI source defines:

- locked install;
- route/scaffold/history validation;
- lint/typecheck/tests;
- contract/localization/security validation;
- clean D1 migration validation;
- dependency audit;
- Worker build;
- provider-derived retained report generation after trusted default-branch workflows.

### CFG-012 — release/deployment workflows — Met

Workflow source and release history provide controlled desired-state evidence.

### CFG-013 — repository permissions/protections — Partial

Repository write/merge/protection settings exist outside source.

Current caveat remains:

- no configured rulesets were observed through the available rulesets endpoint;
- classic branch protection could not be fully verified through the available integration;
- therefore enforcement must not be represented as verified.

### CFG-014 — environment/secrets/variables — Partial

Workflow references demonstrate required configuration names, but public evidence intentionally does not expose secret values or every provider setting.

The first access/configuration review should verify existence, purpose, scope, and stale access without publishing values.

## 10. Cloudflare Configuration

### CFG-015 — account/token permissions — Partial

Security documentation defines minimum-permission intent and purpose-specific tokens where practical.

Evidence still needed includes recurring provider-side permission review and documented reconciliation after material account/resource change.

### CFG-007 — DNS/domain — Partial

The live domain demonstrates functioning configuration, but availability of the site does not by itself prove the entire DNS/TLS/account configuration matches an approved baseline.

### CFG-028 — automated provider drift — Gap

No comprehensive automated comparison of GitHub/Cloudflare account state to an approved machine-readable configuration baseline is currently evidenced.

This is a control/evidence gap, not a claim that drift currently exists.

## 11. Secrets Configuration

**CFG-010 — Status: Partial.**

The project intentionally documents secret names without values.

Current examples include admin credentials, API/webhook secrets, session/identity secrets, provider OAuth/SAML configuration, GitHub workflow credentials, and optional Cloudflare telemetry credentials.

Required evidence focuses on:

- correct purpose;
- minimum permissions;
- environment separation;
- absence from source/logs/public output;
- rotation/revocation after compromise or role change;
- periodic stale-secret review.

The secret value itself is not governance evidence and must not be copied into this register.

## 12. MCP / AI Configuration

**CFG-018 — Status: Partial.**

Current approved baseline:

- read-only public MCP tools;
- `demo:read` boundary;
- `demo_records` as the only approved D1 public MCP data source;
- bounded namespace/results;
- no admin/write/delete/deploy/source/private-data authority;
- Codex and Claude as the only approved provider/client families.

Repository contracts/tests provide useful configuration evidence.

Remaining work includes stronger automated sensitive-field/data-boundary drift tests, recurring provider/client interoperability evaluation, and retained periodic review evidence.

Any new AI/MCP provider, tool, data source, or privilege is a material change and cannot be introduced as ordinary configuration drift reconciliation.

## 13. Runtime State

**CFG-023 — Status: Partial.**

Online/offline and crawler-control states are intentionally runtime-managed rather than static repository configuration.

The baseline is therefore the **allowed state machine + authorization/audit controls**, not a requirement that the value always equal a single constant.

Drift occurs if:

- the state changes without authorized path/evidence;
- the control becomes unauditable;
- state bypasses fail-closed behavior;
- or runtime behavior no longer matches the approved control semantics.

## 14. Generated and Derived Configuration

**CFG-022 — route manifest — Met.**

`docs/route-manifest.json` is generated from authoritative route definitions and checked in CI. Manual divergence should fail validation rather than become accepted configuration.

The same principle applies to future generated governance/compliance indexes: source data should be authoritative and generated views validated against it.

## 15. Initial Review Plan

The first consolidated configuration review is planned for **2026-12-02** alongside the first access/supplier/recovery operating cycle.

The review should cover at minimum:

1. `wrangler.jsonc` against deployed Cloudflare Worker/resources where observable;
2. production version/SHA;
3. D1/R2/DO bindings;
4. domain/cron behavior;
5. GitHub workflow and repository permissions/protection posture;
6. required GitHub/Cloudflare secret/variable inventory by name/purpose, not value;
7. privileged access linkage to `AR-001`;
8. MCP tool/data/provider baseline;
9. unexpected configuration differences;
10. required corrective/change/risk actions.

No completed review is claimed by creation of this register.

## 16. Drift Classification

When a difference is observed, record one of:

- **Expected environment substitution** — approved and documented difference;
- **Approved pending reconciliation** — authorized emergency/provider change not yet reflected in desired state;
- **Provider-managed variance** — expected provider implementation behavior that does not change WizardGang's control intent;
- **Baseline stale** — running state is approved but source/register must be updated through controlled change;
- **Unauthorized/unexplained drift** — requires containment/investigation;
- **False positive / not material** — with rationale.

## 17. Configuration Evidence Rules

Evidence must avoid:

- secret values;
- recovery codes;
- private keys;
- raw OAuth/SAML credentials;
- private account identifiers not needed for assurance;
- screenshots or exports that unnecessarily expose sensitive provider state.

Useful evidence may include hashes, names, scopes, timestamps, sanitized provider summaries, configuration diffs, workflow results, version/health responses, and review conclusions.

## 18. Review Triggers

Review this register when:

- Worker route/domain/binding/cron changes;
- D1/R2/DO resources change;
- GitHub workflow/permission/environment configuration changes;
- Cloudflare account/token/resource configuration changes;
- secret inventory materially changes;
- identity provider activates/changes;
- incident/recovery exposes configuration weakness;
- MCP tool/data/provider/authority changes;
- new AI/MCP provider is proposed;
- CI/security validation changes;
- drift is detected;
- or management review/audit requests reassessment.

## 19. Current Posture

The project has a strong source-controlled configuration baseline for application, deployment, contracts, schema, dependencies, tests, and major Cloudflare bindings.

The principal remaining weakness is **provider-side reconciliation and recurring drift evidence**, especially for GitHub permission/protection state, Cloudflare account/resource settings, secret inventory review, and automated external drift detection.

**Current posture:** Partial overall configuration-management assurance; aligned/uncertified only.
