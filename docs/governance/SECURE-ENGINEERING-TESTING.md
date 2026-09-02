# Secure Engineering and Security Testing Standard

**Reference:** WG-GOV-025  
**Applies to:** ISO/IEC 27001:2022 secure development lifecycle, application security requirements, secure architecture and engineering, secure coding, security testing, outsourced development, development/test/production separation, change management, vulnerability management, logging/evidence, and related Annex A controls · ISO/IEC 42001:2023 AI-system lifecycle, verification/validation, data, security, supplier, human oversight, change, evaluation, monitoring, and operational-control requirements  
**Status:** Proposed  
**Owner:** Technical System Owner / Information Security Owner  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after material architecture, identity, persistence, deployment, cryptography, AI/MCP, supplier, or security-testing changes

## 1. Purpose

This standard defines how the WizardGang Architecture Demo turns security requirements into design decisions, code changes, tests, release gates, and retained evidence.

The repository already implements a substantial engineering baseline through TypeScript, Git, permanent `DEMO-###` change identifiers, pull requests, GitHub Actions, unit/integration tests, contract validation, migration validation, source-secret scanning, dependency audit, tagged releases, exact-tag deployment, and post-deployment version/health verification.

This standard does not create a parallel software-development lifecycle. It makes the security expectations of the existing lifecycle explicit and defines when additional review or testing is required.

Approval of this document does **not** claim that every security control has been independently reviewed, that a penetration test has occurred, that every provider-side control is verified, or that every historical release passed the current test suite.

WizardGang remains **aligned — uncertified** unless independent certification is explicitly obtained and evidenced.

## 2. Engineering Principles

1. **Security is part of the requirement.** Authentication, authorization, data exposure, failure behavior, logging, recovery, accessibility, supplier, and AI/MCP implications are considered with the feature rather than after implementation.
2. **One controlled change, one permanent identity.** Engineering work follows the existing `DEMO-###` lifecycle.
3. **Rigor scales with impact.** High-risk changes require stronger controls, targeted tests, rollback planning, and review evidence than presentation-only work.
4. **Test the denied path.** Security testing must cover rejection and failure behavior, not only successful requests.
5. **Fail closed at security boundaries.** Missing credentials, invalid signatures, unavailable control state, malformed authority, or failed validation must not silently expand access.
6. **Authentication and authorization are separate.** A valid identity, provider, client, or AI agent does not automatically receive application authority.
7. **Source visibility is not authority.** The public repository remains readable while production credentials, provider access, deployment authority, and data mutation stay separately controlled.
8. **Secrets stay outside source.** Test fixtures and examples use synthetic/placeholding values only.
9. **Contracts are security boundaries.** REST/OpenAPI, GraphQL, webhook, identity, and MCP contracts must stay consistent with implementation and authorization behavior.
10. **Persistence changes are security changes when data boundaries change.** New tables, columns, R2 content classes, retention behavior, or AI-accessible fields trigger data/security review.
11. **AI-generated code receives no exception.** Code produced with Codex, Claude, or another approved development tool is reviewed and validated under the same repository controls as human-authored code.
12. **AI/MCP authority is explicitly bounded.** Codex and Claude remain the only approved AI/MCP provider/client families for the current runtime integration; provider/client identity does not create additional privilege.
13. **Automation is evidence, not judgment.** CI can demonstrate that a test ran; it does not independently establish design suitability, residual-risk acceptance, or audit independence.
14. **No synthetic assurance.** Missing test evidence remains Partial/Gap rather than being inferred from code quality or documentation.

## 3. Existing Controlled Development Lifecycle

The current lifecycle is:

```text
requirement / issue / risk / finding
-> controlled DEMO change
-> isolated branch
-> implementation
-> local/CI validation
-> pull request
-> review
-> merge
-> annotated semantic version tag
-> GitHub release
-> exact tagged deployment
-> live version/health verification
-> operation / monitoring / evidence
```

`docs/CHANGE-MANAGEMENT.md` defines the permanent change identity and risk classification. `docs/ARCHITECTURE-STANDARD.md` defines the platform and engineering baseline. This standard adds the security/testing expectations that attach to that flow.

## 4. Risk-Scaled Engineering Requirements

The existing change-management levels remain authoritative.

### 4.1 Low-risk changes

Typical examples include documentation and non-authoritative presentation.

Minimum expectations:

- controlled change identity;
- repository validation appropriate to the changed files;
- no new secrets or authority;
- no unsupported compliance/security claim.

### 4.2 Medium-risk changes

Typical examples include application behavior, routes, storage behavior, integrations, and user workflows.

In addition to the Low requirements:

- identify affected trust/data boundaries;
- update or add unit/integration/contract tests;
- test malformed or unauthorized input where relevant;
- verify failure/degradation behavior;
- update evidence/docs/contracts when public behavior changes.

### 4.3 High-risk changes

Existing change management classifies authentication, authorization, secrets, persistence schemas, deployment controls, privileged administration, and destructive behavior as High. Material AI/MCP authority, provider, data, or autonomy changes are treated equivalently for engineering review.

In addition to Low/Medium requirements:

- explicit security invariants in the controlled record;
- targeted negative/abuse-path tests;
- least-privilege review;
- logging/evidence review;
- rollback/recovery target;
- security and data-risk review as applicable;
- AI-risk and impact reassessment where the AI boundary changes;
- supplier review where an external dependency/provider changes;
- post-deployment verification appropriate to the affected boundary;
- explicit treatment of any accepted residual risk rather than implicit acceptance through merge.

## 5. Security Requirements Analysis

Before implementing a material change, evaluate the applicable concerns:

- who or what can invoke the capability;
- authentication mechanism;
- authorization decision and permission/scope;
- data read/write/delete boundary;
- public vs private/sensitive data classification;
- input type, size, format, origin, schema, and namespace constraints;
- secret/credential use;
- cryptographic requirements;
- external provider/supplier dependence;
- logging and evidence requirements;
- privacy or contractual obligations;
- availability, degradation, retry, and failure behavior;
- recovery impact;
- accessibility of security-critical interactions;
- AI/MCP tool, provider, data, intended-use, and human-oversight implications;
- compatibility/migration implications.

Not every change needs a separate threat-model document. The controlled change, risk record, impact assessment, contract, code, and tests may together provide the evidence when the boundary is simple and explicit.

## 6. Secure Architecture and Design

Material designs must preserve the architecture standard and these invariants where applicable.

### 6.1 Explicit trust boundaries

Workers mediate access to D1, R2, Durable Objects, provider APIs, identity providers, webhooks, and MCP. Browser/client input is not trusted merely because it came through the public site.

### 6.2 Least privilege

A credential, workflow, provider integration, authenticated user, or AI client receives only the operations/data needed for its defined purpose.

### 6.3 Server-derived authority

Security-relevant identity, role, namespace, permission, and provider assertions must be derived or validated server-side. Caller-supplied role/authority claims are not accepted as authoritative.

### 6.4 Input validation and bounds

External requests are validated for method, content type, schema, size, origin, signature, namespace, event type, or equivalent controls appropriate to the interface.

### 6.5 Safe failure

Unavailable or invalid security-critical dependencies must not silently enable privileged behavior. Public errors remain bounded and avoid sensitive diagnostics.

### 6.6 Data minimization

Only data needed for the interface is returned. `demo_records` remains the only approved D1 source for public MCP record access under the current scope.

### 6.7 Secret separation

Credentials remain in managed provider secret stores or ignored local development files. Public source documents names and requirements, not values.

### 6.8 Cryptographic controls

Use the mechanisms and lifecycle defined in `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`. Custom cryptographic algorithms are not introduced for convenience.

### 6.9 Auditability

Material security/control transitions produce appropriate logs or audit events without recording raw secrets, cookies, authorization headers, private keys, or unsafe request bodies.

### 6.10 AI/MCP design

The current runtime MCP baseline remains read-only/non-destructive with `demo:read`, bounded tools/data, and Codex/Claude as the only approved provider/client families. A change to tool inventory, permissions, providers, data sources, write authority, autonomy, or human oversight is material and requires reassessment before release.

## 7. Secure Coding Expectations

The codebase should:

- use TypeScript types and schema validation where practical;
- centralize repeated security boundaries rather than duplicating inconsistent checks;
- validate before persistence or privileged action;
- avoid exposing provider tokens or secrets to browser/public output;
- avoid logging unreviewed raw request bodies or authentication material;
- use parameterized D1 statements rather than constructing queries from untrusted input;
- preserve same-origin/CSRF protections for browser state changes where applicable;
- enforce bounded request and response sizes where abuse/resource risk exists;
- maintain replay controls for signed webhook/event flows where applicable;
- use explicit allowlists for sensitive provider/repository/event/tool boundaries;
- preserve secure cookie flags and bounded session lifetimes;
- preserve dependency lockfiles and reproducible installation;
- keep generated/configuration artifacts tied to their source rather than manually editing generated output.

Security-relevant shortcuts require a controlled decision and risk treatment, not an undocumented exception.

## 8. Required Validation Layers

The repository uses multiple validation layers because no single test establishes security.

### 8.1 Static/source validation

Current controls include:

- TypeScript type checking;
- linting;
- route/scaffold/history validation;
- contract validation;
- localization validation;
- high-confidence tracked-file secret scanning;
- configuration and generated-artifact checks where implemented.

The source-secret check detects selected high-confidence private-key/token/file patterns. It is **not** a complete secret-detection or static-application-security-testing platform.

### 8.2 Unit and component tests

Security-sensitive helpers and handlers should have deterministic tests for expected decisions and boundary conditions.

Current examples cover admin authorization, origin enforcement, safe HTTP defaults, control fail-closed behavior, identity/session state, webhooks, REST/GraphQL/R2 behavior, logging, operations, and MCP.

### 8.3 Negative and abuse-path tests

Security changes must test relevant denial paths, for example:

- missing/invalid credentials;
- insufficient role/permission;
- wrong origin;
- invalid/tampered session material;
- malformed/oversized payload;
- invalid signature;
- replayed delivery/event;
- unauthorized namespace/data source;
- unsupported method/event/tool;
- mismatched protocol metadata;
- unavailable dependency/control state;
- attempts to expose secrets or broaden AI authority.

A positive test alone is insufficient evidence for an authorization or validation boundary.

### 8.4 Identity/protocol testing

Identity tests should validate the protocol and the application boundary separately.

Current evidence includes:

- PKCE/state/nonce secrecy behavior;
- authentication-required behavior;
- server-derived application role/assurance;
- same-origin authorization requests;
- tampered-session rejection;
- provider configuration redaction;
- Google OIDC discovery/JWKS validation;
- GitHub provider-token disposal after identity validation;
- SAML signed-assertion metadata/trust expectations.

Mocked provider tests validate application behavior against controlled provider responses. They do not prove a provider's production configuration or availability.

### 8.5 MCP/AI integration testing

The official MCP client interoperability tests currently verify:

- supported initialization/protocol paths;
- discoverable tool schemas;
- only `ping` and `list_demo_records` in the current tool catalog;
- read-only/non-destructive/idempotent/closed-world tool annotations;
- bounded public `demo_records` output;
- invocation logging metadata;
- protocol/tool-header mismatch rejection.

These are interface and authority-boundary tests. They do not evaluate the reasoning quality or downstream behavior of an external Codex or Claude model.

### 8.6 Contract/API testing

OpenAPI, GraphQL, webhook, identity, and MCP contract changes require contract/schema tests plus behavioral tests for authorization and validation where applicable.

Schema validity alone is not authorization evidence.

### 8.7 Persistence and migration testing

CI applies D1 migrations to a clean local database. Persistence changes must also test data-access/authorization behavior when the schema change affects security, classification, retention, deletion, or recovery.

A successful clean migration does not prove production backup/restore readiness.

### 8.8 Dependency and supply-chain validation

CI installs from the lockfile with `npm ci` and runs `npm audit --audit-level=high`.

This is a dependency vulnerability signal, not proof that all supply-chain risk is eliminated. Action pinning, provider assurance, maintainer compromise, malicious-but-unflagged packages, and lower-severity vulnerabilities remain separate considerations.

### 8.9 Build validation

CI performs a Wrangler dry-run build. Successful compilation/build does not replace behavioral or security testing.

### 8.10 Accessibility/security interaction testing

Security controls must remain operable through keyboard and assistive technology where the control is user-facing. Automated accessibility checks and manual validation serve different purposes; accessibility defects are not automatically security incidents but material inability to access an essential security/control function can trigger incident/nonconformity review.

### 8.11 Production verification

Production deployment verifies the exact tagged release and checks public `/version` and `/health` after deployment.

For material security changes, verification should also include the affected security boundary where it can be tested safely. Production verification must not use destructive or unsafe test data merely to produce evidence.

## 9. CI Security Gate

The current pull-request/main CI baseline runs:

1. locked dependency installation;
2. route validation;
3. scaffold validation;
4. controlled-history validation;
5. lint;
6. TypeScript typecheck;
7. unit/integration tests;
8. contract validation;
9. localization validation;
10. security source validation;
11. D1 migrations against a clean local database;
12. high-severity dependency audit;
13. Worker dry-run build;
14. commit-bound validation evidence generation/upload;
15. pull-request title/change-ID validation for pull-request events.

A required check that is missing, cancelled, or has not posted is not treated as passed.

Provider-side enforcement of required GitHub checks/branch protections remains unverified where current connector evidence cannot confirm it.

## 10. Test Data and Environment Rules

Tests should use synthetic/local data unless an explicitly controlled integration test requires otherwise.

Do not place real credentials, production cookies, private customer/user data, provider tokens, or sensitive incident material in test fixtures.

Local/test and production environments remain separated. Passing tests against mocks/local D1 do not establish production-provider or production-data behavior unless the same relevant boundary is separately verified.

## 11. Security Review Expectations

Review should evaluate more than formatting or test count. For security-significant changes, the reviewer should understand:

- the intended security invariant;
- changed trust/data boundary;
- authentication/authorization effect;
- new secret/provider dependency;
- failure path;
- tests that demonstrate allow and deny behavior;
- logs/evidence exposure;
- rollback/recovery path;
- risk/SoA/AI-impact implications.

Where the same person authors and reviews the change because of small-operator constraints, the record must not be represented as independent review.

## 12. AI-Assisted Engineering

Codex and Claude may assist with repository development, analysis, tests, and documentation under the approved working model.

AI-assisted engineering does not change the acceptance criteria:

- generated code is treated as untrusted until reviewed/validated;
- an agent may not waive CI, security tests, risk review, or management approval;
- model output is not evidence that a requirement is met;
- an AI-generated test can be useful but must actually execute against the relevant behavior;
- runtime MCP permissions remain distinct from repository-authoring permissions;
- the runtime approved AI/MCP provider boundary remains Codex and Claude only.

## 13. Security Test Failure Handling

A failed security-relevant test must be handled before release unless an explicit, controlled decision documents why the test is invalid or the affected requirement no longer applies.

Do not:

- delete or weaken a valid test solely to make CI green;
- broadly disable validation without a controlled reason;
- silently convert a failed security requirement into an accepted risk;
- treat a flaky security test as passing merely because a retry succeeded.

Material failures may create or update:

- a defect/change;
- security or AI risk;
- incident/concern;
- nonconformity/corrective action;
- supplier review;
- objective/measurement status.

## 14. Vulnerability and Security-Defect Handling

A discovered vulnerability follows `VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md` and, when appropriate, `INCIDENT-MANAGEMENT.md`.

Security fixes should include a regression test when the failure can be safely and reliably reproduced. The regression test should fail before the fix and pass after it where practical, without embedding exploit secrets or unsafe production information.

## 15. Release and Deployment Security

Production deployment remains tag-bound.

Security-sensitive release expectations include:

- reviewed source at the tagged commit;
- passing required validation before deployment;
- locked dependency installation;
- controlled D1 migration;
- managed deployment credentials;
- exact version/SHA traceability;
- live post-deploy verification;
- rollback/recovery path for material changes.

Merge or deployment is not evidence that a risk treatment or corrective action is effective. Effectiveness may require later operational observation or targeted retest.

## 16. Independent and Adversarial Testing

The current repository has automated and developer-authored security tests. It does **not** currently claim:

- independent penetration testing;
- external application security assessment;
- red-team testing;
- independent source-code security review;
- formal fuzzing campaign;
- dedicated SAST/DAST platform coverage;
- continuous production attack simulation.

Independent/adversarial testing should be considered when risk, customer/contract requirements, major privilege expansion, sensitive-data processing, material AI autonomy, significant public exposure, or management review justifies it.

If performed, scope, tester independence/competence, date, environment, findings, remediation, and retest evidence must be retained.

## 17. Security Testing Register

The current testing/control inventory is maintained in:

`docs/governance/registers/SECURITY-TESTING-REGISTER.md`

Statuses describe the existence and evidence maturity of the testing control. They do not state that the latest branch currently passes unless a specific current CI result is cited.

## 18. Evidence and Retention

Security engineering evidence may include:

- requirement/risk/finding reference;
- controlled commit and PR;
- code diff;
- test source;
- GitHub Actions result;
- validation evidence artifact;
- dependency audit result;
- release/tag;
- deployment/version result;
- production-safe verification;
- vulnerability/corrective-action retest;
- external assessment when one exists.

Sensitive test details, exploit material, secrets, and private provider/account evidence remain restricted even when the existence of the control is publicly documented.

## 19. Review and Reassessment Triggers

Review this standard/register after material changes involving:

- authentication or authorization;
- admin/privileged functions;
- secrets or cryptography;
- D1/R2/data classification;
- production deployment/release controls;
- GitHub/Cloudflare security configuration;
- webhook/public integration boundaries;
- identity providers;
- new critical dependencies;
- AI/MCP providers, tools, permissions, data, autonomy, or intended use;
- significant vulnerability or incident;
- repeated test failure/flakiness;
- external assessment finding;
- change in applicable contractual/legal security testing obligations.

## 20. Current Evidence Limitations

The following remain intentionally visible:

- GitHub branch/ruleset enforcement is not independently verified through current integration evidence;
- current-head CI results must be checked per change and cannot be inferred from workflow presence;
- source secret scanning is high-confidence pattern scanning, not complete secret/SAST coverage;
- `npm audit` does not establish complete supply-chain assurance;
- mocks/local tests do not establish provider production configuration;
- no independent penetration test or external secure-code review is claimed;
- formal fuzzing and dedicated DAST/SAST platforms are not currently evidenced;
- recurring security-test trend/coverage metrics are not yet established;
- treatment/corrective-action effectiveness requires later evidence where applicable;
- Codex/Claude downstream reasoning quality is outside the direct application security-test boundary, although the application authority exposed to them remains testable and controlled.

## 21. Related Evidence

- `docs/ARCHITECTURE-STANDARD.md`
- `docs/CHANGE-MANAGEMENT.md`
- `SECURITY.md`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `package.json`
- `scripts/validate-security.mjs`
- `tests/security.test.ts`
- `tests/identity.test.ts`
- `tests/mcp-client.test.ts`
- `tests/webhooks.test.ts`
- `tests/api-records.test.ts`
- `tests/graphql.test.ts`
- `tests/r2-lab.test.ts`
- `tests/operations.test.ts`
- `tests/interface.test.ts`
- `docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`
- `docs/governance/CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`
- `docs/governance/CONFIGURATION-BASELINE-DRIFT.md`
- `docs/governance/DATA-GOVERNANCE.md`
- `docs/governance/INCIDENT-MANAGEMENT.md`
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`

## 22. Claim Boundary

This standard demonstrates a repository-native secure-engineering and testing framework for the WizardGang Architecture Demo.

It supports an **aligned — uncertified** posture. Test source, CI configuration, and engineering controls are evidence only for what they actually demonstrate; they are not certification, independent assurance, or proof that unknown production/provider conditions do not exist.
