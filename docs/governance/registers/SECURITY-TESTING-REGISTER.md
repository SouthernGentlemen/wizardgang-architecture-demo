# Security Engineering and Testing Register

**Reference:** WG-REG-013  
**Parent:** `docs/governance/SECURE-ENGINEERING-TESTING.md`  
**Status:** Approved
**Approval record:** PR #56 · merge commit `1ae105da8ab6466e334a2faf4e6c63f5885c91df`
**Owner:** Technical System Owner / Information Security Owner  
**Initialized:** 2026-09-02  
**Review:** At least quarterly for material security-test coverage and after High-risk/security-sensitive changes

## 1. Purpose

This register records the principal secure-engineering validation and security-testing controls for the WizardGang Architecture Demo.

A row marked **Active** means the test/control mechanism is implemented in controlled source and can produce evidence. It does **not** mean the current branch, current production release, or every historical release has passed that control.

Current-run success must come from a specific CI/workflow/test/deployment record.

This register contains no fabricated penetration-test, external-assessment, fuzzing, or historical pass records.

## 2. Status Model

| Status | Meaning |
|---|---|
| **Active** | Implemented repeatable test/control exists in source/workflow |
| **Partial** | Useful implementation exists but coverage/evidence is incomplete |
| **Planned** | Defined requirement or future evidence activity, not yet implemented/operated |
| **Gap** | Material desired security-testing capability is not currently evidenced |
| **N/A** | Not applicable to the current scoped architecture, with rationale |

## 3. Testing Inventory

| ID | Category | Test / control | Current evidence | Status | Trigger / cadence | Current limitation / next action |
|---|---|---|---|---|---|---|
| ST-001 | Change control | Permanent `DEMO-###` identity and risk-scaled controlled record | `docs/CHANGE-MANAGEMENT.md`, `validate:history` | Active | Every controlled change | Provider enforcement of review gates remains separately unverified |
| ST-002 | CI | Locked dependency installation with `npm ci` | `.github/workflows/ci.yml`, `package-lock.json` | Active | PR / main CI | Lockfile integrity does not eliminate malicious dependency risk |
| ST-003 | Static | TypeScript typecheck | CI `npm run typecheck` | Active | PR / main CI | Type safety is not authorization/security proof |
| ST-004 | Static | Repository lint | CI `npm run lint` | Active | PR / main CI | Custom lint coverage is narrower than a dedicated security linter |
| ST-005 | Repository integrity | Route manifest validation | CI `validate:routes` | Active | PR / main CI | Valid route inventory does not prove route authorization |
| ST-006 | Repository integrity | Scaffold/required artifact validation | CI `validate:scaffold` | Active | PR / main CI | Structure validation does not prove control effectiveness |
| ST-007 | Repository integrity | Sequential controlled-history validation | CI `validate:history` | Active | PR / main CI | Branch/ruleset enforcement remains unverified |
| ST-008 | Contract | OpenAPI/GraphQL/webhook/MCP contract validation | CI `validate:contracts` | Active | PR / main CI | Contract validity alone is not behavioral security evidence |
| ST-009 | Localization | Locale structure validation | CI `validate:locales` | Active | PR / main CI | Not a security test except where locale behavior affects controls |
| ST-010 | Secret prevention | High-confidence tracked-file secret-pattern scan | `scripts/validate-security.mjs` | Active | PR / main CI | Not full secret scanning/SAST; selected patterns only |
| ST-011 | Database | Apply D1 migrations to clean local database | CI `validate:migrations` | Active | PR / main CI | Does not prove production backup/restore or migration rollback |
| ST-012 | Dependency | `npm audit --audit-level=high` | CI `security:dependencies` | Active | PR / main CI | Does not cover all supply-chain or lower-severity risks |
| ST-013 | Build | Wrangler production-style dry-run build | CI `npm run build` | Active | PR / main CI | Build success does not prove runtime security |
| ST-014 | Evidence | Commit-bound validation evidence artifact | `scripts/generate-evidence.mjs`, CI artifact upload | Active | PR / main CI | Artifact retention currently workflow-limited; results must be tied to a run |
| ST-015 | PR governance | Pull-request title/change-ID format check | CI `change-id` job | Active | PR | Does not independently verify required reviewer/branch rules |
| ST-016 | Admin auth | Missing/incorrect admin credential rejection | `tests/security.test.ts` | Active | Relevant code change / full tests | Test uses synthetic credentials, as intended |
| ST-017 | Browser mutation | Exact same-origin rejection for admin mutation | `tests/security.test.ts` | Active | Relevant auth/admin change | Must be extended to new browser state-change boundaries as added |
| ST-018 | Failure security | D1 control failure defaults demo offline/crawler disabled | `tests/security.test.ts` | Active | Control/availability change | Does not simulate every Cloudflare/provider outage mode |
| ST-019 | HTTP boundary | Security headers, JSON content type, bounded request handling | `tests/security.test.ts`, HTTP helpers | Active | HTTP boundary change | Coverage varies by specialized endpoint |
| ST-020 | Identity authorization | Unauthenticated caller rejected before authorization | `tests/identity.test.ts` | Active | Identity/auth change | Mock/application evidence, not provider production assurance |
| ST-021 | Identity authorization | Server-derived role/assurance overrides caller-supplied claims | `tests/identity.test.ts` | Active | Identity/authz change | New roles/scopes require new tests |
| ST-022 | Identity session | Tampered encrypted session rejected | `tests/identity.test.ts` | Active | Session/crypto change | Does not substitute for cryptographic independent review |
| ST-023 | Identity CSRF/origin | Authenticated authorization requires application origin | `tests/identity.test.ts` | Active | Identity state-change change | New cross-site flows require explicit design/testing |
| ST-024 | Identity secrecy | Provider configuration and browser responses exclude client secrets/flow material | `tests/identity.test.ts` | Active | Identity/provider change | Public-output tests cannot prove logs/provider consoles contain no secret |
| ST-025 | OIDC | Google discovery/JWKS/signature/audience/issuer flow behavior | `tests/identity.test.ts` | Active | OIDC change | Provider responses are mocked; live provider configuration is separate evidence |
| ST-026 | OAuth | GitHub immutable numeric identity and provider-token disposal | `tests/identity.test.ts` | Active | GitHub identity change | Live OAuth application settings are provider-side evidence |
| ST-027 | SAML | Signed-assertion metadata/trust boundary behavior | `tests/identity.test.ts`, `docs/IDENTITY.md` | Partial | SAML change | Full adversarial SAML parser/signature test breadth remains limited |
| ST-028 | Webhook | HMAC signature, repository/event validation, duplicate-delivery rejection | `tests/webhooks.test.ts`, `src/api/webhooks.ts` | Active | Webhook change | External sender/provider configuration remains separate evidence |
| ST-029 | MCP interoperability | Official MCP client connects, lists only approved tools, invokes bounded reads | `tests/mcp-client.test.ts` | Active | MCP protocol/tool change | Does not evaluate external model reasoning quality |
| ST-030 | MCP negative | Tool-header/body mismatch and unsupported protocol behavior rejected | `tests/mcp-client.test.ts` | Active | MCP protocol/tool change | Additional abuse cases required if authority expands |
| ST-031 | MCP authority | Tool annotations remain read-only, non-destructive, idempotent, closed-world | `tests/mcp-client.test.ts`, MCP contract | Active | MCP tool catalog change | A future write/admin tool would require material reassessment |
| ST-032 | REST/API authorization | Record API namespace/auth behavior and malformed request handling | `tests/api-records.test.ts` | Active | REST/data boundary change | Review required when data classes or scopes change |
| ST-033 | GraphQL authorization | Resolver/query/mutation boundary testing | `tests/graphql.test.ts` | Active | GraphQL schema/resolver change | Must continue matching REST/application authorization policy |
| ST-034 | R2 | Protected R2 mutation and object behavior tests | `tests/r2-lab.test.ts` | Active | R2/storage change | Production object classification and restore remain separate evidence |
| ST-035 | Operations/logging | Operations/log behavior, public-safe output and control-state tests | `tests/operations.test.ts`, `tests/logs.test.ts` | Active | Operations/log change | Does not prove all production telemetry is complete/retained |
| ST-036 | Accessibility | Automated interface/accessibility assertions | `tests/interface.test.ts`, `test:accessibility` | Partial | UI/security-control change | Manual browser/AT validation remains required for claims beyond automation |
| ST-037 | Deployment | Exact annotated semantic tag required before production deploy | `.github/workflows/deploy.yml` | Active | Every production deploy | Requires actual workflow evidence for each release |
| ST-038 | Deployment | Live `/version` matches expected tag/SHA after deployment | `.github/workflows/deploy.yml` | Active | Every production deploy | Checks release identity, not every feature/control |
| ST-039 | Deployment | Live `/health` confirms Worker operational after deployment | `.github/workflows/deploy.yml` | Active | Every production deploy | Health coverage is bounded; service-specific verification may be needed |
| ST-040 | High-risk regression | Targeted negative test required for auth/secrets/schema/deploy/admin/destructive/AI authority changes | Secure engineering standard | Partial | Every High-risk change | Requirement now formalized; historical consistency not asserted |
| ST-041 | Security fix | Regression test after reproducible vulnerability/security defect | Secure engineering + vulnerability process | Planned | Each reproducible security fix | No fabricated remediation history exists |
| ST-042 | Test trend | Periodic security-test failure/flakiness/coverage trend review | Monitoring framework | Planned | Quarterly / management review | No recurring trend history yet |
| ST-043 | SAST | Dedicated security static-analysis platform | None evidenced | Gap | Risk/contract trigger | Current type/lint/secret scan is narrower than SAST |
| ST-044 | DAST | Dedicated dynamic application security testing | None evidenced | Gap | Risk/contract trigger | Consider before stronger external assurance claims |
| ST-045 | Fuzzing | Structured fuzz/property campaign for parsers/protocol boundaries | None evidenced | Gap | Material parser/protocol risk | Target identity/webhook/MCP/schema inputs if risk justifies |
| ST-046 | Penetration testing | Independent application/infrastructure penetration test | None evidenced | Gap | Risk/customer/management trigger | Do not claim pentest until independent evidence exists |
| ST-047 | Independent code review | Independent security-focused source review | None evidenced | Gap | High assurance trigger | Ordinary author/owner review is not automatically independent |
| ST-048 | External AI evaluation | External-model reasoning/harm quality evaluation | MCP impact assessment / current bounded integration | Partial | Material AI change | Application authority is tested; model reasoning remains provider/external behavior |
| ST-049 | Production abuse test | Safe targeted production security-boundary verification | Deployment verification framework | Partial | High-risk release | Must avoid destructive testing against public production |
| ST-050 | Provider configuration | Verify GitHub/Cloudflare/identity provider security settings against desired state | Configuration/access/supplier governance | Partial | Quarterly/material change | Provider-side evidence incomplete; GitHub branch/ruleset enforcement unverified |

## 4. Current Coverage Summary

Current source demonstrates meaningful automated coverage across change integrity, static validation, unit/integration behavior, authentication/authorization, identity protocols, webhooks, REST/GraphQL/R2, operations/logging, MCP interoperability, migrations, dependency audit, build, evidence generation, and release/deployment verification.

The principal remaining assurance gaps are not more ordinary unit tests. They are:

- independent penetration/security review;
- broader SAST/DAST/fuzzing where justified;
- recurring security-test trend/coverage evidence;
- provider-side configuration verification;
- formalized High-risk regression-test consistency across future changes;
- safe production verification tailored to materially changed security boundaries;
- external AI/model-behavior evaluation beyond the application-controlled MCP authority boundary.

## 5. Current CI Result Boundary

The presence of `.github/workflows/ci.yml` and the tests above demonstrates the **configured validation mechanism**.

It does not prove the current head is passing. A current status must be taken from the specific GitHub Actions/status record for that commit. Missing/not-yet-posted status is not a pass.

## 6. Evidence Rules

For a material security claim, retain the smallest practical chain:

```text
requirement / risk / finding
-> DEMO change
-> source/control
-> targeted test
-> CI result
-> PR/review
-> tag/release
-> deploy/production verification when applicable
-> later effectiveness evidence when required
```

Do not publish secret fixtures, active exploit details, private provider/account evidence, or sensitive incident information solely to make this register public.

## 7. AI/MCP Boundary

Codex and Claude remain the only approved runtime AI/MCP provider/client families. Their identity does not create application privilege.

Current testing can demonstrate the server/tool/data/authorization boundary exposed to an AI client. It cannot prove the correctness, safety, memory behavior, prompt handling, or downstream actions of an external model outside WizardGang-controlled application code.

Any new AI/MCP provider family, write/destructive/admin capability, additional data source, expanded autonomy, or reduced human oversight requires controlled risk/impact/test reassessment before the current coverage can be reused.

## 8. Review Triggers

Update this register when:

- test suites or CI gates materially change;
- security-sensitive routes/interfaces are added or removed;
- authentication/authorization/secret/cryptographic behavior changes;
- D1/R2 schemas or data exposure changes;
- MCP tool/provider/data/permission boundaries change;
- a vulnerability or incident exposes a missing test;
- an external assessment occurs;
- a contractual/legal requirement changes expected security testing;
- management review changes the assurance target.

## 9. Claim Boundary

This is a public secure-engineering testing inventory, not an independent test report or certification record.

Statuses describe current control/evidence maturity under the WizardGang management-system model and remain **aligned — uncertified**.
