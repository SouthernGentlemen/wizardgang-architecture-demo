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

The current Worker secrets are `DEMO_ADMIN_USER`, `DEMO_ADMIN_PASSWORD`, `DEMO_API_TOKEN`, `WEBHOOK_DEMO_SECRET`, `GITHUB_WEBHOOK_SECRET`, and `DEMO_SESSION_SECRET`. `GITHUB_READ_TOKEN` is an optional read-only GitHub API token. Values are never returned by health, version, logs, evidence, or source-link surfaces.

## Demo administration

`/admin` is authenticated and state-changing responses use `Cache-Control: no-store`. Online/offline state is persisted in D1 and state transitions are auditable, but audit payloads must never contain credentials or authorization material.

Admin credentials are compared through fixed-length digests, state-changing form submissions require an exact same-origin request, and control failures fail closed. For production, place Cloudflare Access in front of `/admin` where practical while retaining the application-side Basic authentication and authorization boundary for state changes.

REST writes and R2 mutations require a bearer token supplied through `DEMO_API_TOKEN`. Public REST, GraphQL, and MCP reads share the explicit `demo:read` boundary. Webhook receivers verify HMAC-SHA256 over the exact request body and reject reused delivery IDs. The GitHub receiver additionally allowlists event types and the configured repository. Signing secrets remain environment-owned; only bounded summaries and payload digests are persisted.

## Public logging

`/dashboard/logs` and `/__api/operations/logs` are intentionally public-safe diagnostic surfaces. They must never become raw request/Cloudflare log proxies. Do not store or render passwords, authorization headers, cookies, bearer tokens, API keys, secrets, payment data, private account identifiers, or unreviewed request bodies. Structured detail is defensively redacted and size-bounded before it reaches `application_logs`.

Keep operational logs distinct from the `demo_events` audit/evidence stream: logs explain runtime behavior; audit events preserve meaningful control/change evidence.

## Offline behavior

Intentional offline state is not a reason to expose debugging details. Browser demo routes receive the public maintenance page; API-like/write calls receive safe JSON `503` responses. Operations/status routes remain available to explain the system state.

## Vulnerability reporting

Do not open a public issue for a suspected vulnerability involving credentials or active infrastructure. Use the repository's configured private vulnerability reporting mechanism when enabled.
