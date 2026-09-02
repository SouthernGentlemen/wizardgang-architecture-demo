# Cryptography and Secrets Register

**Reference:** WG-REG-010  
**Parent:** `docs/governance/CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`  
**Status:** Proposed  
**Owner:** Information Security Owner / Technical System Owner  
**Assessment date:** 2026-09-02  
**Review due:** 2027-09-02 or earlier after a material credential, cryptographic, provider, identity, webhook, incident, recovery, or AI/MCP change  
**Approval:** Controlled pull request and merge

## 1. Purpose

This register identifies the material cryptographic mechanisms, authentication information, shared secrets, provider credentials, trust material, and secret-storage boundaries used by the WizardGang Architecture Demo.

It is intentionally **public-safe**. It records names, purposes, owners, expected storage, and evidence posture. It does **not** contain secret values, token fragments, password hashes/verifiers, recovery codes, private keys, account IDs that are not intentionally public, or other material that would weaken the security boundary.

Evidence status uses **Met / Partial / Gap / N/A**. Applicability is recorded separately so an optional or inactive credential is not mistaken for a failed control.

Approval of this register does not prove that every production secret exists, has been rotated, has a particular age, or has provider-side scope exactly matching the documented intent. Provider-side/private evidence remains required for those conclusions.

## 2. Register

| ID | Surface / credential | Applicability | Purpose / cryptographic function | Expected authority / storage | Current evidence | Status | Review / change trigger |
|---|---|---|---|---|---|---|---|
| CRY-001 | Public HTTPS/TLS for `demo.wizardgang.ai` | Applicable | Transport confidentiality/integrity for public service | Cloudflare-managed TLS/domain configuration | HTTPS public architecture is established; provider private-key/certificate lifecycle is not independently verified here | Partial | domain/TLS/provider change, certificate problem, recovery, incident |
| CRY-002 | `IDENTITY_SESSION_SECRET` | Applicable | Root application secret for identity flow/session encryption key derivation | Cloudflare Worker secret; local ignored `.dev.vars` | Application rejects missing/trimmed values under 32 UTF-8 bytes | Met | identity change, exposure, owner change, recovery, algorithm change |
| CRY-003 | AES-GCM identity flow/session protection | Applicable | Authenticated encryption of browser-flow state, session references, and D1 session payloads | Web Crypto implementation in `src/lib/identity-session.ts` | AES-GCM, fresh 12-byte IV, purpose-specific AAD, authenticated decrypt failure path evidenced in source | Met | library/platform change, identity redesign, cryptographic advisory |
| CRY-004 | Cryptographic random generation | Applicable | Flow state, nonce, session IDs, PKCE-related values | Web Crypto `crypto.getRandomValues` | Source uses platform CSPRNG | Met | platform/library change, new random security value |
| CRY-005 | OIDC JWT/JWKS verification | Applicable when Microsoft/Google OIDC configured | Verify provider-issued identity assertions | Provider discovery/JWKS + application validation | Architecture documents provider discovery, RS256/JWKS, issuer/audience/time/subject checks | Met | provider/protocol/library change, validation incident |
| CRY-006 | OAuth/OIDC PKCE + state/nonce | Applicable when OAuth/OIDC configured | Bind authorization response to initiated browser flow and reduce code interception/replay risk | Application-generated ephemeral values; never public evidence | Identity architecture documents authorization-code + PKCE, state, nonce and short-lived encrypted flow state | Met | provider/protocol/library change, callback redesign |
| CRY-007 | `SAML_IDP_CERT` | Applicable when Entra SAML configured | Verify identity-provider assertion signatures | Cloudflare Worker configuration/secret-like trust store; value is a public verification certificate, not a private key | SAML verification path is documented; current production certificate freshness/rollover evidence is private/not yet reviewed | Partial | certificate rollover/expiry, issuer change, SAML incident |
| CRY-008 | `MICROSOFT_CLIENT_SECRET` | Conditional on Microsoft OIDC configuration | OAuth/OIDC confidential client authentication | Cloudflare Worker secret; local ignored `.dev.vars` | Name/purpose documented; value, age, scope and rotation history not public | Partial | app registration change, exposure, owner/provider change |
| CRY-009 | `GOOGLE_CLIENT_SECRET` | Conditional on Google OIDC configuration | OAuth/OIDC confidential client authentication | Cloudflare Worker secret; local ignored `.dev.vars` | Name/purpose documented; value, age and rotation history not public | Partial | app registration change, exposure, owner/provider change |
| CRY-010 | `GITHUB_CLIENT_SECRET` | Conditional on GitHub OAuth configuration | OAuth confidential client authentication | Cloudflare Worker secret; local ignored `.dev.vars` | Name/purpose documented; value, age and rotation history not public | Partial | OAuth app change, exposure, owner/provider change |
| CRY-011 | `DEMO_ADMIN_PASSWORD` | Applicable when `/admin` enabled | Human/operator application administration authentication | Cloudflare Worker secret; local ignored `.dev.vars` | Runtime fails closed when missing and compares credential tuple via complete SHA-256 digest comparison; actual production strength/rotation is private | Partial | exposure, access change, owner change, incident, review |
| CRY-012 | `DEMO_ADMIN_USER` | Applicable when `/admin` enabled | Administrative authentication identifier | Environment configuration; may be confidential operational metadata but is not cryptographic secret material by itself | Name/purpose documented; provider/runtime value not published | Partial | admin identity change, access review |
| CRY-013 | `DEMO_API_TOKEN` | Applicable when protected operator API writes are enabled | Long-lived operator bearer credential | Cloudflare Worker secret; local ignored `.dev.vars` | Security boundary documented; current production token scope/value/age not public | Partial | exposure, API authority change, access review, owner change |
| CRY-014 | `DEMO_SESSION_SECRET` | Applicable to demo-session functionality | Protect/sign session-related application state as implemented by demo session boundary | Cloudflare Worker secret; local ignored `.dev.vars` | Secret name/purpose and non-public boundary documented; consolidated generation/rotation evidence pending | Partial | session redesign, exposure, recovery, review |
| CRY-015 | `WEBHOOK_DEMO_SECRET` | Applicable to demo webhook receiver | HMAC-SHA256 request authentication | Cloudflare Worker secret; sender configured out-of-band | HMAC use is evidenced in source; current production secret generation/rotation history not public | Partial | exposure, sender change, webhook incident, review |
| CRY-016 | `GITHUB_WEBHOOK_SECRET` | Applicable to GitHub webhook receiver | HMAC-SHA256 request authentication | Cloudflare Worker secret + matching GitHub webhook configuration | HMAC/replay/repository checks evidenced; provider-side secret match/rotation history not public | Partial | webhook reconfiguration, exposure, repo/provider change |
| CRY-017 | `GITHUB_DEMO_TOKEN` | Applicable to controlled live-demo workflow dispatch | Restricted GitHub Actions workflow-dispatch credential | Cloudflare Worker secret / GitHub token authority | `SECURITY.md` documents Actions-write-only intent for the checked-in workflow; provider-side current scope not independently verified | Partial | token replacement, workflow authority change, access review, incident |
| CRY-018 | `GIT_DEMO_PR_TOKEN` | Applicable to live Git demonstration workflow | GitHub credential for controlled branch/PR/status/merge/tag lifecycle | GitHub Actions secret | Purpose and intended limited repository access documented; provider-side current scope/age not public | Partial | workflow change, token replacement, access review, incident |
| CRY-019 | `GITHUB_READ_TOKEN` | Conditional / optional | Read-only GitHub API enrichment | Cloudflare Worker secret when configured | Optional read-only purpose documented; configuration not required for baseline operation | Partial | feature activation/deactivation, scope change |
| CRY-020 | `CLOUDFLARE_API_TOKEN` | Applicable to deployment; optional for runtime telemetry depending deployment | Deploy/migrate Worker resources and/or minimum-permission analytics/billing reads | GitHub Actions secret for deployment; Cloudflare Worker secret only if runtime telemetry enabled | Deployment/runtime purposes documented; exact provider-side scopes and separation of token instances require private evidence | Partial | scope change, deployment/telemetry change, exposure, access review |
| CRY-021 | GitHub Actions secret store | Applicable | Hold workflow credentials without committing them | GitHub repository/environment secret storage | Workflows reference secrets without values in source; provider-side inventory/review remains private | Partial | workflow/provider change, access review, incident, recovery |
| CRY-022 | Cloudflare Worker secret store | Applicable | Hold runtime/admin/session/webhook/identity credentials | Cloudflare-managed Worker secrets | Repository explicitly requires managed secrets; complete provider-side inventory/rotation evidence not public | Partial | deployment/runtime change, recovery, incident, access review |
| CRY-023 | Local `.dev.vars` secret boundary | Applicable to local development | Keep local development credentials out of Git | Ignored local file; `.dev.vars.example` contains placeholders only | Checked-in template and security policy explicitly prohibit committing real values | Met | tooling/repository layout change, secret-leak incident |
| CRY-024 | HMAC-SHA256 webhook mechanism | Applicable | Authenticate exact webhook payload and detect tampering | `src/api/webhooks.ts` | Web Crypto HMAC-SHA256, signature format validation, complete comparison, delivery replay rejection evidenced | Met | webhook/library/protocol change |
| CRY-025 | SHA-256 evidence/pseudonymous digests | Applicable | Payload fingerprints, session/subject identifiers, bounded comparison and evidence | Application code / D1 evidence stores | SHA-256 use evidenced; documentation explicitly prevents calling digesting “encryption” | Met | data/evidence model change, correlation/privacy review |
| CRY-026 | Admin credential digest comparison | Applicable | Reduce direct/early-exit comparison behavior for submitted admin credential tuple | `src/lib/admin-auth.ts` | Both tuples SHA-256 digested and all digest bytes compared before decision | Met | admin-auth redesign, cryptographic review |
| CRY-027 | Encrypted D1 identity-session payloads | Applicable when identity sessions enabled | Protect persisted normalized identity/session details at application layer | D1 ciphertext generated by application AES-GCM | Source encrypts payload before insert and uses digested session identifier; recovery/rotation behavior still depends on `IDENTITY_SESSION_SECRET` | Met | schema/session/key change, recovery test, exposure |
| CRY-028 | Cryptographic Git commit/tag signing | N/A under current approved release-integrity model | Optional additional provenance/authenticity mechanism | Would require Git signing identity/key custody and verification policy | Current commits/tags are not claimed as cryptographically signed; release integrity instead uses controlled history, annotated tags, CI, exact-tag deployment and runtime version verification | N/A | customer/contract requirement, threat/risk change, stronger provenance objective |

## 3. Evidence Summary

Current row count: **28**.

Evidence posture:

- **Met:** source directly demonstrates the current mechanism or control boundary;
- **Partial:** the design/use is documented but provider-side/private strength, scope, age, rotation, or review evidence is incomplete;
- **Gap:** required current control is absent;
- **N/A:** not selected/applicable under current scope, with a reassessment trigger.

This register intentionally contains many `Partial` rows because secret values and provider account configuration should not be published merely to make a public compliance table look stronger.

## 4. Minimum Review Dataset

The private/attributable secret review should be able to answer, for every applicable long-lived credential:

```text
credential ID/name
purpose
owner
consumer
storage authority
environment
permission/scope
created/replaced date where known
last review date
expiry/provider lifetime if any
rotation/revocation trigger
recovery/re-provisioning method
current disposition: retain / rotate / restrict / revoke
review authority
evidence reference
```

The record should identify credentials without copying their values.

## 5. Immediate Escalation Conditions

Any of the following requires immediate security review and may create an incident/corrective action:

- secret committed to Git;
- token/password/private material included in a public issue, PR, log, screenshot, R2 object, D1 public dataset, or MCP response;
- unexpected provider use or authorization event;
- loss of access to the secret-management authority;
- unknown credential owner;
- credential with broader authority than its documented purpose;
- SAML/OIDC trust verification bypass or unexpected signing-key behavior;
- failed HMAC verification that suggests sender/configuration compromise;
- unexplained change in production authentication/secret configuration;
- addition of an AI/MCP capability able to view or manage secret material.

## 6. AI/MCP Boundary

Codex and Claude remain the only approved AI/MCP provider/client families.

Neither family receives access to:

- environment variables;
- GitHub/Cloudflare secret stores;
- OAuth client secrets;
- admin passwords/API tokens;
- session cookies/session encryption secrets;
- webhook signing secrets;
- provider private account configuration;
- private signing keys or recovery material.

A future AI/MCP secret-management tool is outside the current impact assessment and requires a new controlled change plus security/AI risk, supplier, access, data, configuration, SoA, AI-impact, evaluation, and management approval before operation.

## 7. Evidence References

- `docs/governance/CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`
- `SECURITY.md`
- `docs/IDENTITY.md`
- `.dev.vars.example`
- `src/lib/identity-session.ts`
- `src/lib/admin-auth.ts`
- `src/api/webhooks.ts`
- `.github/workflows/deploy.yml`
- `.github/workflows/git-demo.yml`
- `docs/governance/CONFIGURATION-BASELINE-DRIFT.md`
- `docs/governance/registers/CONFIGURATION-REGISTER.md`
- `docs/governance/ASSET-ACCESS-ACCEPTABLE-USE.md`
- `docs/governance/INCIDENT-MANAGEMENT.md`
- `docs/governance/BACKUP-RECOVERY-RESTORE.md`
- `docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md`

## 8. Approval Metadata

```text
Owner: WizardGang
Status: Proposed until PR approval/merge
Version: 1.0
Effective: on controlled merge
Review due: 2027-09-02 or earlier after a material trigger
Approved via: PR #56
Approval commit: established by final approved merge state
```

No secret value is required or permitted in this public register.
