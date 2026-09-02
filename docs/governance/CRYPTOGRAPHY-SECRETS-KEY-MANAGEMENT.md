# Cryptography, Secrets, and Key Lifecycle

**Reference:** WG-GOV-024  
**Applies to:** ISO/IEC 27001:2022 authentication information, use of cryptography, key/secret management, secure authentication, logging/redaction, communications security, supplier, incident, configuration, access, and secure-development controls · ISO/IEC 42001:2023 security, data, supplier, access, operational, change, AI/MCP, and incident controls where cryptographic or secret material protects the AI-system boundary  
**Status:** Proposed  
**Owner:** Information Security Owner / Technical System Owner  
**Approval:** Controlled pull request and merge  
**Review:** At least annually and after a material authentication, cryptographic, identity-provider, Cloudflare/GitHub, webhook, AI/MCP, incident, or credential change

## 1. Purpose

This procedure defines how the WizardGang Architecture Demo selects and uses cryptographic mechanisms, stores and handles authentication information, provisions and reviews secrets, responds to compromise, and retains evidence about key/secret lifecycle decisions.

The project already implements several concrete mechanisms, including:

- HTTPS through the Cloudflare-hosted public service;
- AES-GCM protection for identity-flow and identity-session state;
- cryptographically random identifiers and PKCE material;
- SHA-256 digests for bounded comparison, identifiers, and evidence;
- HMAC-SHA256 webhook authentication;
- OIDC signature verification through trusted provider discovery/JWKS;
- SAML assertion verification using the configured identity-provider signing certificate;
- managed GitHub/Cloudflare secrets for production credentials;
- and defensive exclusion/redaction of credentials from public source, logs, evidence, and diagnostics.

This procedure consolidates those controls without claiming that every provider-side key, certificate, secret age, rotation event, token scope, or encryption-at-rest mechanism has been independently verified.

Approval establishes the lifecycle and control expectations. It does **not** establish certification, completed secret rotation history, independent cryptographic assurance, or proof that every existing secret meets every target defined below.

## 2. Core Principles

1. **Do not invent cryptography.** Use platform-standard, reviewed primitives rather than custom algorithms.
2. **Secrets remain secret.** Secret values, recovery codes, private keys, bearer credentials, session material, authorization headers, and cookies never belong in public source or public evidence.
3. **Names may be public; values may not.** Governance may document a secret's name, purpose, owner, environment, and lifecycle without publishing its value.
4. **Cryptography has a purpose.** Encryption, integrity/authentication, hashing, signature verification, random generation, and pseudonymization are distinct uses and are not represented interchangeably.
5. **Hashing is not encryption.** SHA-256 digests used for comparison or evidence cannot be presented as reversible encryption.
6. **Public certificates are not private keys.** A SAML signing certificate used to verify provider assertions is trust material; it is not treated as a secret merely because it participates in cryptographic verification.
7. **Provider-managed controls stay provider-managed.** Cloudflare, GitHub, Microsoft, Google, and other providers manage parts of the cryptographic stack. WizardGang remains responsible for its configuration, credentials, trust decisions, and evidence.
8. **Least privilege applies to secrets.** Credential scope must match the function that uses it.
9. **Compromise beats calendar.** Suspected exposure, role change, provider change, authorization change, incident, or unnecessary privilege triggers immediate review/rotation/revocation. No unsupported claim is made that forced periodic password changes are inherently stronger.
10. **Long-lived secrets are reviewed.** Absence of a universal fixed rotation interval does not remove the requirement to review whether long-lived credentials are still necessary, scoped correctly, and recoverable/revocable.
11. **Cryptographic randomness is required for secret generation.** Security-sensitive random values use platform cryptographic random generation or provider-generated credentials.
12. **Failures fail closed.** Missing/invalid security-critical secrets or verification material must not silently downgrade authentication.
13. **Logs are not a credential store.** Operational and audit evidence records bounded non-secret results and digests, not raw authentication material.
14. **AI/MCP has no secret shortcut.** Codex and Claude remain the only approved AI/MCP families, and provider/client identity does not grant application privilege or access to secrets.
15. **No certification claim.** Cryptographic controls support an aligned, demonstrated, and evidenced posture only to the extent actually verified.

## 3. Cryptographic Functions

The system distinguishes these functions:

| Function | Current examples | Purpose |
|---|---|---|
| **Transport protection** | HTTPS/TLS on public Cloudflare route | Protect data in transit |
| **Authenticated encryption** | AES-GCM identity/session state | Confidentiality + integrity of application-managed state |
| **Message authentication** | HMAC-SHA256 webhooks | Verify sender possession of a shared signing secret and request-body integrity |
| **Signature verification** | OIDC JWT/JWKS, SAML signing certificate | Verify provider-issued authentication assertions |
| **Digest / fingerprint** | SHA-256 audit payload digests, subject/session identifiers | Integrity reference, comparison, pseudonymous lookup |
| **Cryptographic random generation** | `crypto.getRandomValues` | Session IDs, flow state, nonce, PKCE-related random values |
| **Proof-of-possession flow** | OAuth/OIDC authorization code + PKCE | Bind authorization response to the initiating browser flow |
| **Credential authentication** | passwords, bearer/API tokens, provider client secrets | Authenticate an operator, workflow, or application to an authorized boundary |

The current cryptographic/secret inventory is maintained in:

`docs/governance/registers/CRYPTOGRAPHY-SECRETS-REGISTER.md`

## 4. Current Implemented Cryptographic Baseline

### 4.1 Identity/session encryption

`src/lib/identity-session.ts` uses Web Crypto AES-GCM for encrypted identity-flow and identity-session material.

Current implementation characteristics include:

- a key derived from `IDENTITY_SESSION_SECRET` and a purpose label through SHA-256;
- AES-GCM encryption/decryption;
- a fresh 12-byte IV generated with `crypto.getRandomValues`;
- purpose/version text as additional authenticated data;
- different purpose strings for flow, session reference, session payload, and other protected values;
- rejection when ciphertext cannot be authenticated/decrypted;
- a minimum `IDENTITY_SESSION_SECRET` length of 32 UTF-8 bytes enforced by the application;
- and short lifetime limits on identity flows and application sessions.

This is implementation evidence for the current code path. It is not a claim that application-derived keys replace a dedicated hardware/KMS-backed key-management service.

### 4.2 Webhook message authentication

`src/api/webhooks.ts` uses HMAC-SHA256 over the exact request body for the demo and GitHub webhook receivers.

The implementation:

- imports the shared secret into Web Crypto HMAC/SHA-256;
- computes the expected digest over the exact payload;
- validates the required signature shape;
- compares fixed-length signature text without an early-exit comparison;
- rejects reused delivery IDs;
- and stores only bounded summaries and payload SHA-256 digests rather than raw credentials.

`WEBHOOK_DEMO_SECRET` and `GITHUB_WEBHOOK_SECRET` remain environment-managed shared secrets.

### 4.3 OIDC/OAuth verification

The identity implementation uses standard provider authentication rather than accepting caller-supplied identity assertions.

For Microsoft and Google OIDC, the documented boundary includes:

- provider discovery;
- provider-owned HTTPS endpoint constraints;
- authorization code + PKCE;
- OIDC nonce/state binding;
- JWT signature validation through discovered JWKS;
- issuer/audience/time/subject validation;
- and server-side client-secret use for the configured provider application where required.

GitHub OAuth similarly uses authorization code + PKCE and validates identity through the authenticated GitHub API rather than turning the provider access token into a WizardGang session.

### 4.4 SAML verification

Microsoft Entra SAML verification uses the configured `SAML_IDP_CERT` to verify signed assertions through the existing SAML library and application checks.

The certificate is verification/trust material. The private signing key is controlled by the identity provider and is not present in the WizardGang repository or Worker.

### 4.5 SHA-256 use

SHA-256 is used for several non-password purposes, including:

- bounded admin-credential comparison input;
- session/subject identifiers stored as digests;
- webhook payload fingerprints;
- sanitized audit evidence;
- and internal cryptographic key derivation for the current AES-GCM implementation.

A SHA-256 digest in logs or D1 must not be represented as encryption or as proof that source data can never be correlated.

### 4.6 Administrative secret comparison

`src/lib/admin-auth.ts` does not directly compare the submitted credential string with an early-return string comparison. Both credential tuples are digested and the fixed-length digest bytes are compared across the complete length before success/failure is returned.

The configured `DEMO_ADMIN_PASSWORD` itself remains a managed environment secret. The code does not create or maintain a password database, salt, or password-verifier record, so the digest comparison must not be described as password hashing/storage.

## 5. Secret Storage Boundary

Production secret values belong in controlled provider-managed secret stores.

Current expected production storage locations include:

- **GitHub Actions secrets** for credentials used only by workflows;
- **Cloudflare Worker secrets** for credentials consumed by the runtime Worker;
- provider-managed application credentials where the external provider owns them;
- ignored `.dev.vars` for local-only development values.

The checked-in `.dev.vars.example` documents names/placeholders only.

Secret values must not be placed in:

- Git source;
- committed configuration files;
- issues, pull requests, or review comments;
- public screenshots;
- public logs or audit-event payloads;
- `/health`, `/version`, `/dashboard`, `/compliance`, `/governance`, or documentation responses;
- public D1/R2 demo data;
- MCP responses;
- browser-visible HTML/JavaScript unless the value is intentionally public and is therefore not a secret.

## 6. Secret and Authentication-Information Categories

The current system uses these categories.

### 6.1 Human/operator authentication

Examples:

- `DEMO_ADMIN_USER`;
- `DEMO_ADMIN_PASSWORD`;
- provider account/MFA credentials outside the application repository.

The username is authentication configuration but is not necessarily secret. The password and provider authentication material are secret.

### 6.2 Application/API credentials

Examples:

- `DEMO_API_TOKEN`;
- identity-derived short-lived access tokens created by the application;
- OAuth client secrets.

Long-lived operator/API tokens should be narrowly scoped and replaced when their purpose or authorized holder changes.

### 6.3 Workflow/provider credentials

Examples:

- `GITHUB_DEMO_TOKEN`;
- `GIT_DEMO_PR_TOKEN`;
- optional `GITHUB_READ_TOKEN`;
- `CLOUDFLARE_API_TOKEN`;
- provider OAuth client secrets.

Each workflow/provider credential must be scoped to the function documented for it. Broader provider account ownership does not justify broader automation-token scope.

### 6.4 Session/encryption secrets

Examples:

- `DEMO_SESSION_SECRET`;
- `IDENTITY_SESSION_SECRET`.

These protect application session/flow state and must be high-entropy values, unavailable to clients and public logs.

### 6.5 Webhook signing secrets

Examples:

- `WEBHOOK_DEMO_SECRET`;
- `GITHUB_WEBHOOK_SECRET`.

Sender and receiver must share the intended secret through an out-of-band/provider configuration path. The received signature is evidence of possession, not a replacement for repository/event allowlisting and replay protection.

### 6.6 Identity-provider trust/configuration

Examples:

- Microsoft/Google/GitHub OAuth client IDs (normally non-secret identifiers);
- Microsoft/Google/GitHub client secrets;
- Microsoft tenant ID (identifier, not secret);
- `SAML_IDP_CERT` (verification certificate, not a private signing key);
- provider-discovered JWKS (public verification keys).

The management system must not label every security-related value a secret merely because it is sensitive to configuration correctness.

## 7. Secret Generation and Strength

New high-value shared secrets should be generated using a cryptographically secure random source or by the provider issuing the credential.

Baseline expectations:

- `IDENTITY_SESSION_SECRET` must meet the application's enforced minimum of 32 UTF-8 bytes;
- newly generated application session/signing/shared secrets should target at least 32 random bytes unless the provider defines an equivalent or stronger format;
- provider-generated access tokens/API keys may use provider-defined formats/entropy;
- operator passwords must be unique, non-default, and resistant to guessing; a password manager is preferred for high-entropy generated values;
- placeholder values from `.dev.vars.example` are never valid production credentials;
- OAuth client IDs, public certificates, resource IDs, and other non-secret identifiers do not need fabricated secrecy requirements.

**Current evidence limitation:** except where code/provider format enforces strength, the existence and entropy of current production values cannot be proven from public source. Those rows remain Partial/Restricted rather than being inferred as fully Met.

## 8. Credential Provisioning

Before provisioning a new long-lived credential, identify:

- credential name/type;
- purpose;
- consuming service/workflow/runtime;
- owner;
- environment;
- minimum required permission/scope;
- storage location;
- whether it is human, service, shared, or provider-managed;
- whether a non-secret/public counterpart exists;
- revocation mechanism;
- rotation/change triggers;
- recovery dependency;
- audit/evidence requirements.

Credentials must not be created “just in case” and left permanently enabled without a defined use.

## 9. Secret Distribution and Use

Secrets are supplied only to the process or environment that needs them.

Rules:

- browser code must not receive server/provider secrets;
- the Worker must not forward `Authorization` values to unrelated external providers;
- workflow credentials are made available only to the workflow steps that need them;
- logs/errors must sanitize external provider responses before publication;
- local credentials must not be copied into tickets/issues to troubleshoot;
- provider credentials must not be placed in MCP context or responses;
- Codex or Claude connection to the public MCP endpoint never grants access to WizardGang secret stores.

## 10. Rotation and Review

The project does not impose a fictional universal “rotate every N days” rule on all credentials.

Instead, each credential must have a review/rotation model appropriate to its exposure and provider capabilities.

Rotation or replacement is required when relevant after:

- suspected or confirmed disclosure;
- secret committed or posted publicly;
- secret observed in logs, screenshots, issue text, or AI context;
- provider security incident affecting the credential;
- departure/removal of a person who had access;
- change in role/responsibility;
- transfer of ownership;
- token permission expansion/reduction;
- application/provider migration;
- supplier/API integration change;
- evidence that the credential is stale or unused;
- authentication anomaly suggesting compromise;
- failed access/configuration review;
- cryptographic algorithm/provider deprecation;
- or management decision that the secret's lifetime is no longer justified.

A provider-enforced expiration or shorter internal lifetime remains authoritative where configured.

Periodic access/configuration review must confirm that each long-lived credential is still needed, appropriately scoped, stored in the intended environment, and revocable.

## 11. Revocation and Destruction

When a credential is no longer required:

1. revoke/disable/delete it at the authoritative provider/runtime boundary;
2. remove it from workflow/environment configuration;
3. remove stale local copies;
4. update configuration/access/supplier/data/identity records as needed;
5. confirm replacement credentials are functioning if continuity requires replacement;
6. retain non-secret evidence of the change without retaining the secret value itself.

Deleting a credential name from documentation does not revoke a live token.

## 12. Suspected Secret or Key Compromise

A suspected secret exposure is treated as a security event and may become an incident under `INCIDENT-MANAGEMENT.md`.

Immediate actions may include:

```text
identify credential / trust material
        ↓
restrict exposure + preserve safe evidence
        ↓
revoke or rotate credential / certificate trust as appropriate
        ↓
check provider, workflow, source, logs, deployments, sessions, and recent actions
        ↓
issue replacement through controlled storage
        ↓
revalidate authentication / webhook / deploy / runtime boundary
        ↓
update risk + incident + configuration + access + corrective-action records
        ↓
verify containment and effectiveness
```

Do not delay revocation merely to complete documentation first.

A compromised shared secret invalidates prior assumptions about any messages/sessions authenticated solely by that secret during the relevant exposure period and must be investigated accordingly.

## 13. Certificate and Public-Key Trust Management

The current application primarily consumes provider-controlled public keys/certificates rather than operating its own public-key infrastructure.

### OIDC/JWKS

OIDC verification keys are obtained through trusted provider discovery/JWKS behavior implemented by the identity path. Provider key rotation is expected to be handled through the standard discovery/JWKS process rather than hard-coding a permanent signing key.

### SAML

`SAML_IDP_CERT` is configured trust material for Microsoft Entra SAML verification.

When the Entra signing certificate changes or approaches expiry:

- obtain the new verification certificate through the trusted provider/admin process;
- validate issuer/audience/ACS configuration remains correct;
- update the managed configuration through a controlled change;
- test SAML authentication before retiring the previous trust path where overlap is supported;
- retain non-secret evidence of the certificate transition.

The repository must never contain the identity provider's private signing key.

### TLS

Public TLS certificate/private-key lifecycle for `demo.wizardgang.ai` is provider-managed by the Cloudflare hosting boundary under the current architecture.

WizardGang should verify that HTTPS remains functional and appropriate provider/domain configuration is maintained, but this documentation does not claim direct custody of Cloudflare TLS private keys or independently verified certificate-rotation controls.

## 14. Encryption at Rest and Provider Storage

Application-managed identity/session payloads stored in D1 are encrypted by the application as documented above.

Other provider storage protections may also exist at Cloudflare/GitHub/provider layers, but the management system does not convert provider architecture assumptions into WizardGang-operated encryption evidence without a specific source.

Where an application dataset requires stronger application-level confidentiality in the future, the data/risk/configuration design must determine:

- whether application-layer encryption is required;
- key ownership/storage;
- rotation/recovery impact;
- query/operational constraints;
- deletion behavior;
- and failure/recovery testing.

## 15. Backup and Recovery of Cryptographic Dependencies

Recovery must preserve the distinction between reconstructable source and non-source secret material.

A tagged Git release can reconstruct source configuration, but it does not restore:

- production secret values;
- provider OAuth client secrets;
- Cloudflare/GitHub tokens;
- admin credentials;
- SAML trust configuration changed outside source;
- or provider account access/recovery factors.

`BACKUP-RECOVERY-RESTORE.md` therefore treats secrets/provider configuration as recovery dependencies that must be re-provisionable without committing them into a backup artifact that weakens the security boundary.

The first real recovery exercise should verify that required credentials/trust material can be restored or safely replaced through their authoritative provider process.

## 16. Logging, Audit, and Evidence

Permitted evidence includes:

- secret/credential **name**, not value;
- provider/storage location category;
- owner;
- permission/scope description;
- issue/rotation/revocation date where safe;
- last review date;
- validation result;
- credential fingerprint only when it is non-sensitive and necessary;
- audit event ID;
- provider event/reference without private account identifiers;
- algorithm/protocol used;
- source/test path demonstrating verification behavior.

Prohibited evidence includes:

- raw secret value;
- bearer token;
- password;
- authorization header;
- cookie;
- private key;
- recovery code;
- OAuth authorization code;
- PKCE verifier;
- raw SAML assertion containing unreviewed identity data;
- unredacted provider response containing credentials.

## 17. Source and CI Controls

Current source/CI protections include:

- explicit “never commit” rules in `SECURITY.md`;
- `.dev.vars` local secret separation with checked-in placeholder example;
- repository security validation in the normal CI path;
- controlled change/release/deployment history;
- public logs designed to redact security-sensitive field names/values;
- and tests around security/identity/webhook behavior.

These controls reduce accidental disclosure but do not constitute a dedicated enterprise secret-scanning platform unless such tooling is specifically configured and evidenced.

## 18. AI/MCP Boundary

The current MCP service is a public read-only demonstration boundary.

Cryptographic/secret rules for AI/MCP are:

- Codex and Claude are the only approved provider/client families;
- client/provider brand is not an authentication factor;
- no MCP tool exposes environment variables, secrets, cookies, tokens, private provider state, identity-session payloads, or signing material;
- `demo_records` remains the only approved D1 source for public MCP data;
- MCP tools cannot rotate, reveal, create, revoke, or manage secrets;
- any future secret-management or privileged MCP capability requires security-risk review, AI-risk review, AI impact reassessment, SoA review, supplier review, access review, configuration review, evaluation expansion, and explicit management approval before operation.

## 19. Cryptographic Agility and Change

A material algorithm/protocol/security-library change requires controlled review.

Triggers include:

- deprecation or practical weakness in an algorithm;
- platform/library advisory affecting cryptographic validation;
- provider changes to OIDC/SAML/webhook signature requirements;
- new cryptographic key-management provider;
- change to AES/HMAC/JWT/SAML verification behavior;
- new application-layer encryption;
- introduction of asymmetric signing/private-key custody;
- new client-authentication method;
- or a compliance/customer requirement mandating a specific cryptographic boundary.

Review should determine interoperability, migration, backward compatibility, recovery, data re-encryption/re-signing needs, testing, supplier impact, and residual risk.

## 20. Current Known Evidence Gaps

The current baseline deliberately retains these gaps/limitations:

- no completed consolidated secret/key lifecycle review record yet;
- no public evidence of historical production credential rotations;
- no public verification of each production token's current provider-side scope;
- no public proof that every existing shared secret was generated with at least the target entropy;
- provider-managed TLS private-key lifecycle is not independently verified;
- provider encryption-at-rest behavior is not treated as WizardGang-operated evidence without a specific source;
- no dedicated HSM/KMS-backed application key service is used by the current demo;
- no claim that Git commits/tags are cryptographically signed; current release integrity relies on controlled Git history, annotated tags, CI, deployment identity, and runtime verification;
- SAML certificate rollover has not yet been evidenced as an exercised event;
- recovery of/replacement for all required secrets has not yet been demonstrated through a completed restore exercise;
- dedicated automated secret scanning beyond current repository security validation is not claimed unless evidenced.

A missing record is an evidence gap, not permission to infer success.

## 21. Initial Secret/Cryptography Review

The first consolidated review should verify, without publishing secret values:

- every current production credential has an owner and purpose;
- each is stored in the intended provider/runtime secret store;
- each permission/scope is no broader than required;
- stale/unused credentials are revoked;
- provider/application recovery paths are known;
- `IDENTITY_SESSION_SECRET` meets the application requirement;
- shared webhook/session secrets have an acceptable generation basis;
- SAML trust material is current;
- OAuth app credentials/callback configuration remains intended;
- Cloudflare/GitHub workflow tokens match documented purposes;
- public logs/evidence do not expose secret material;
- current algorithms/protocols remain acceptable for the application risk;
- Codex/Claude MCP access remains outside all secret boundaries.

The review result may update the register from Partial/Restricted to stronger evidence states where attributable evidence exists.

## 22. Relationships to Existing Records

This procedure should be read with:

- `SECURITY.md`;
- `docs/IDENTITY.md`;
- `docs/governance/INFORMATION-SECURITY-POLICY.md`;
- `docs/governance/ASSET-ACCESS-ACCEPTABLE-USE.md`;
- `docs/governance/CONFIGURATION-BASELINE-DRIFT.md`;
- `docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md`;
- `docs/governance/INCIDENT-MANAGEMENT.md`;
- `docs/governance/BACKUP-RECOVERY-RESTORE.md`;
- `docs/governance/DATA-GOVERNANCE.md`;
- `docs/governance/registers/SECURITY-RISK-REGISTER.md`;
- `docs/governance/registers/ASSET-ACCESS-REGISTER.md`;
- `docs/governance/registers/CONFIGURATION-REGISTER.md`;
- `docs/governance/registers/CRYPTOGRAPHY-SECRETS-REGISTER.md`;
- `src/lib/identity-session.ts`;
- `src/lib/admin-auth.ts`;
- `src/api/webhooks.ts`.

## 23. Approval and Evidence

Approval metadata:

```text
Owner: WizardGang
Status: Proposed until PR approval/merge
Version: 1.0
Effective: on controlled merge
Review due: within 12 months or sooner after a material cryptographic/credential event
Approved via: PR #56
Approval commit: established by final approved merge state
```

The approval event establishes this procedure. Actual secret reviews, rotations, revocations, certificate rollovers, compromise responses, and recovery events require their own attributable evidence.
