# Security

This is a public architecture demonstration. Public source is intentional; secrets are not.

## Never commit

- Cloudflare API tokens or account credentials;
- admin passwords;
- OAuth/SAML client secrets or signing material;
- authorization headers, cookies, session tokens, private keys;
- real billing/payment/account metadata;
- production-only infrastructure identifiers that are not intentionally public.

Use Cloudflare/GitHub managed secret stores for production and ignored `.dev.vars` for local-only admin placeholders.

The current core Worker secrets are `DEMO_ADMIN_USER`, `DEMO_ADMIN_PASSWORD`, `DEMO_API_TOKEN`, `WEBHOOK_DEMO_SECRET`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_DEMO_TOKEN`, `DEMO_SESSION_SECRET`, `IDENTITY_SESSION_SECRET`, and the optional read-only `CLOUDFLARE_API_TOKEN`; provider credentials and the SAML certificate are listed in `docs/IDENTITY.md`. `GITHUB_READ_TOKEN` is an optional read-only GitHub API token. `GITHUB_DEMO_TOKEN` is restricted to Actions write on this repository and can dispatch only the checked-in live-demo workflow; it cannot create branches, commits, pull requests, tags, or releases. Values are never returned by health, version, logs, usage, evidence, or source-link surfaces.

Cloudflare usage collection uses a dedicated minimum-permission token with Analytics Read and, only when needed, Billing Read. The public usage API returns normalized product metrics and freshness only. It excludes account/resource identifiers, account names, invoice and subscription identifiers, tokens, payment data, and raw upstream error text. Stored snapshots follow the same boundary.

## Demo administration

`/admin` is authenticated and state-changing responses use `Cache-Control: no-store`. Online/offline and ChatGPT crawler-access states are persisted in D1 and state transitions are auditable, but audit payloads must never contain credentials or authorization material.

Admin credentials are compared through fixed-length digests, state-changing form submissions require an exact same-origin request, and control failures fail closed. For production, place Cloudflare Access in front of `/admin` where practical while retaining the application-side Basic authentication and authorization boundary for state changes.

The `/assurance?view=delivery` Git lifecycle reuses that application-side admin boundary for both start and merge/release actions. The browser sends credentials only to the same-origin Worker and clears the password field after a successful dispatch. The Worker exchanges successful authorization for a server-side workflow dispatch and never forwards the Basic authorization value to GitHub. A separate GitHub-managed `GIT_DEMO_PR_TOKEN` gives the workflow only the repository access needed to create its controlled branch and pull request, read Actions status, merge without bypassing protections, and push the annotated tag.

The crawler-access control combines a dynamic `/robots.txt` with a request gate for `OAI-SearchBot` and `ChatGPT-User`; relying on robots rules alone is insufficient for user-triggered visits. `GPTBot` is always denied so search/fetch access is separate from model-training access. User-agent matching expresses site policy rather than bot identity authentication; the site contains only public data and no authorization decision relies on a crawler user agent.

REST writes accept either the managed operator bearer credential or a ten-minute token derived from a validated identity session. Identity-derived tokens are limited to a server-derived visitor namespace; the caller cannot select another visitor's write scope. Public REST, GraphQL, and MCP reads share the explicit `demo:read` boundary, and authenticated GraphQL mutations cross the same normalized-principal policy. R2 mutations retain their existing protected boundary. Webhook receivers verify HMAC-SHA256 over the exact request body and reject reused delivery IDs. The GitHub receiver additionally allowlists event types and the configured repository. Signing secrets remain environment-owned; only bounded summaries and payload digests are persisted.

## Public logging

`/dashboard/logs` and `/__api/operations/logs` are intentionally public-safe diagnostic surfaces. They must never become raw request/Cloudflare log proxies. Do not store or render passwords, authorization headers, cookies, bearer tokens, API keys, secrets, payment data, private account identifiers, or unreviewed request bodies. Structured detail is defensively redacted and size-bounded before it reaches `application_logs`.

Keep operational logs distinct from the `demo_events` audit/evidence stream: logs explain runtime behavior; audit events preserve meaningful control/change evidence.

## Offline behavior

Intentional offline state is not a reason to expose debugging details. Browser demo routes receive the public maintenance page; API-like/write calls receive safe JSON `503` responses. Operations/status routes remain available to explain the system state.

## Vulnerability reporting

Do not open a public issue for a suspected vulnerability, active security incident, credential exposure, exploit detail, or sensitive infrastructure concern. Use the repository's [private vulnerability reporting](https://github.com/SouthernGentlemen/wizardgang-architecture-demo/security/advisories/new) mechanism.

The public disclosure policy and reporting boundary are available at `https://demo.wizardgang.ai/security`. Machine-readable contact information is available at `https://demo.wizardgang.ai/.well-known/security.txt`.

Include the affected route, component, or release; observed behavior and impact; safe reproduction steps; and any supporting evidence that can be shared privately. A report may be rejected as non-security, accepted into a draft GitHub Security Advisory, coordinated through remediation, and later published in sanitized form. Not every report is a vulnerability, security incident, GHSA, or CVE.

### Coordinated disclosure lifecycle

The controlled path is **private report → triage → GHSA → fix/release → eligible CVE → public advisory**.

1. **Private report.** Reporter identity, private reproduction steps, attachments, exploit detail, credentials, and sensitive infrastructure information stay in GitHub private vulnerability reporting.
2. **Triage.** Maintainers validate whether the report is a security vulnerability, determine scope and impact, and request clarification as needed. Triage notes remain private.
3. **GHSA.** A confirmed vulnerability may be coordinated in a draft GitHub Security Advisory. Draft advisory content is private and is not public assurance evidence.
4. **Fix and release.** Remediation is completed and a fixed release is published before a public advisory record is added to this repository's assurance dataset.
5. **Eligible CVE.** A CVE is requested or associated only when appropriate. The public dataset records a CVE only after an actual identifier has been assigned; no placeholder CVE is permitted.
6. **Public advisory.** After the sanitized GitHub Security Advisory is published, its public GHSA identity, severity, summary, fixed release, optional assigned CVE, public evidence, and optional incident linkage may be projected through `GET /v1/assurance/advisories` and the `#published-advisories` section of `/security`.

Published advisories and operational incidents remain separate records. A public advisory may link to an `INC-*` identifier only when that actual incident already exists in the retained incident register. A vulnerability or advisory never creates an incident record by implication.

The canonical advisory dataset contains only public disclosure material. Private report contents, draft GHSA data, reporter identity, exploit details, private treatment notes, and unreleased vulnerability detail are prohibited. An empty advisory dataset does not claim that no vulnerabilities, private reports, defects, or security investigations have existed.
