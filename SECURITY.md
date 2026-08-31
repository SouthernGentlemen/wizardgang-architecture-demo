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

## Demo administration

`/admin` is authenticated and state-changing responses use `Cache-Control: no-store`. Online/offline state is persisted in D1 and state transitions are auditable, but audit payloads must never contain credentials or authorization material.

For production, prefer Cloudflare-native access control where practical, while retaining an application-side authorization boundary for state changes.

## Public logging

`/dashboard/logs` and `/__api/operations/logs` are intentionally public-safe diagnostic surfaces. They must never become raw request/Cloudflare log proxies. Do not store or render passwords, authorization headers, cookies, bearer tokens, API keys, secrets, payment data, private account identifiers, or unreviewed request bodies. Structured detail is defensively redacted and size-bounded before it reaches `application_logs`.

Keep operational logs distinct from the `demo_events` audit/evidence stream: logs explain runtime behavior; audit events preserve meaningful control/change evidence.

## Offline behavior

Intentional offline state is not a reason to expose debugging details. Browser demo routes receive the public maintenance page; API-like/write calls receive safe JSON `503` responses. Operations/status routes remain available to explain the system state.

## Vulnerability reporting

Do not open a public issue for a suspected vulnerability involving credentials or active infrastructure. Use the repository's configured private vulnerability reporting mechanism when enabled.
