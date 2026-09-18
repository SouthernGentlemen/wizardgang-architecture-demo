# Security

This is a public architecture demonstration. Public source is intentional; secrets are not.

## Never commit

- Cloudflare API tokens or account credentials;
- admin passwords;
- OAuth/SAML client secrets or signing material;
- authorization headers, cookies, session tokens, private keys;
- real billing/payment/account metadata;
- production-only infrastructure identifiers that are not intentionally public.

Use Cloudflare/GitHub managed secret stores for production and ignored `.dev.vars` for local-only placeholders.

The authoritative Worker secret-name inventory is `config/worker-secrets.json`. Cloudflare's Worker secret store also carries some provider identifiers and verification material that are not intrinsically secret; they are inventoried here because deployment verifies the managed names as one set. Values are never checked in or exposed by health, version, logs, usage, evidence, or source-link surfaces.

<!-- WORKER_SECRETS_START -->
- `DEMO_ADMIN_USER`;
- `DEMO_ADMIN_PASSWORD`;
- `WEBHOOK_DEMO_SECRET`;
- `GITHUB_WEBHOOK_SECRET`;
- `GITHUB_READ_TOKEN` (optional);
- `GITHUB_REPORTING_WRITE_TOKEN` (optional);
- `GITHUB_DEMO_TOKEN`;
- `DEMO_SESSION_SECRET`;
- `IDENTITY_SESSION_SECRET`;
- `IDENTITY_AUDIT_HMAC_SECRET`;
- `MICROSOFT_CLIENT_ID`;
- `MICROSOFT_CLIENT_SECRET`;
- `MICROSOFT_TENANT_ID`;
- `GOOGLE_CLIENT_ID`;
- `GOOGLE_CLIENT_SECRET`;
- `GITHUB_CLIENT_ID`;
- `GITHUB_CLIENT_SECRET`;
- `SAML_IDP_CERT` (optional);
- `CLOUDFLARE_API_TOKEN` (optional);
<!-- WORKER_SECRETS_END -->

`IDENTITY_SESSION_SECRET` and `IDENTITY_AUDIT_HMAC_SECRET` each require at least 32 UTF-8 bytes. `DEMO_SESSION_SECRET` requires at least 32 characters. Other entries are currently enforced only as non-empty when their capability is used; provider-issued formats and strength requirements remain authoritative for provider credentials.

Cloudflare usage collection uses a dedicated minimum-permission token with Analytics Read and, only when needed, Billing Read. Public projections exclude account/resource identifiers, account names, invoice/subscription identifiers, tokens, payment data, and raw upstream error text.

## Demo administration

`/admin` is authenticated and state-changing responses use `Cache-Control: no-store`. Online/offline and crawler-access states are persisted in D1 and state transitions are auditable, but audit payloads must never contain credentials or authorization material.

Admin credentials are compared through fixed-length digests, state-changing form submissions require exact same-origin requests, and control failures fail closed. For production, place Cloudflare Access in front of `/admin` where practical while retaining the application-side authentication/authorization boundary.

The controlled Git lifecycle reuses the admin boundary for start and merge/release actions. The browser sends credentials only to the same-origin Worker. A separate GitHub-managed `GIT_DEMO_PR_TOKEN` gives workflow automation only the repository access required by the controlled delivery path. The public `/assurance#traceability` check presents disclosure-safe lifecycle evidence; it is not an operator control.

Crawler access combines dynamic `/robots.txt` policy with request gating for `OAI-SearchBot` and `ChatGPT-User`; robots rules alone are insufficient for user-triggered visits. `GPTBot` remains blocked so search/fetch access is separate from model-training access. No authorization decision relies on a crawler user agent.

REST writes accept short-lived tokens derived from validated identity sessions. Those tokens are limited to a server-derived visitor namespace; there is no separate operator bearer credential for application writes. Public REST, GraphQL, and MCP reads share the explicit `demo:read` boundary, and authenticated GraphQL mutations cross the same normalized-principal policy. Webhook receivers verify signatures over the exact request body and reject replayed delivery IDs.

## Public logging

`/api/operations/logs` is a bounded public-safe diagnostic machine surface. There is no public human log explorer after retirement of `/operations`. Do not store or return passwords, authorization headers, cookies, bearer tokens, API keys, secrets, payment data, private account identifiers, or unreviewed request bodies. Structured detail is defensively redacted and size-bounded before it reaches `application_logs`. Identity log records never expose their structured detail through the public log projection.

Keep operational logs distinct from the `demo_events` audit/evidence stream: logs explain runtime behavior; audit events preserve meaningful control/change evidence.

## Offline behavior

Intentional offline state is not a reason to expose debugging details. Gated browser demo routes use the registered recovery experience; gated API-like/write calls receive safe JSON `503` responses. Routes explicitly declared available while offline, including recovery, security/support, administration, crawler controls, and applicable operational machine endpoints, remain governed by their route declarations. The retired human `/operations` pathname is not restored as an offline status page.

## Vulnerability reporting

Do not open a public issue for a suspected vulnerability, active security incident, credential exposure, exploit detail, or sensitive infrastructure concern. Use the repository's [private vulnerability reporting](https://github.com/SouthernGentlemen/wizardgang-architecture-demo/security/advisories/new) mechanism.

The public disclosure policy and reporting boundary are available at `https://demo.wizardgang.ai/security`. Machine-readable contact information is available at `https://demo.wizardgang.ai/.well-known/security.txt`.

Include the affected route, component, or release; observed behavior and impact; safe reproduction steps; and supporting evidence that can be shared privately. A report may be rejected as non-security, accepted into a draft GitHub Security Advisory, coordinated through remediation, and later published in sanitized form. Not every report is a vulnerability, security incident, GHSA, or CVE.

### Coordinated disclosure lifecycle

The controlled path is **private report → triage → GHSA → fix/release → eligible CVE → public advisory**.

1. **Private report.** Reporter identity, private reproduction steps, attachments, exploit detail, credentials, and sensitive infrastructure information stay in GitHub private vulnerability reporting.
2. **Triage.** Maintainers validate whether the report is a security vulnerability and determine scope and impact. Triage notes remain private.
3. **GHSA.** A confirmed vulnerability may be coordinated in a draft GitHub Security Advisory. Draft advisory content is private and is not public assurance evidence.
4. **Fix and release.** Remediation is completed and a fixed release is published before a public advisory record is added to the repository assurance dataset.
5. **Eligible CVE.** A CVE is recorded only after an actual identifier has been assigned.
6. **Public advisory.** After the sanitized GitHub Security Advisory is published, its public identity, severity, summary, fixed release, optional CVE, public evidence, and optional incident linkage may be projected through `GET /api/reporting/security` and `/security`.

Published advisories and operational incidents remain separate records. A public advisory may link to an `INC-*` identifier only when that incident already exists in the retained incident register. Private report contents, draft GHSA data, reporter identity, exploit details, private treatment notes, and unreleased vulnerability detail are prohibited from the canonical public advisory dataset.
