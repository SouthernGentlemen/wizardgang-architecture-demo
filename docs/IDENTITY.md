# Identity architecture

The registered identity browser resource demonstrates one complete boundary:

```text
provider authentication -> protocol validation -> normalized identity -> application authorization -> WizardGang session
```

Authentication establishes who a visitor is. Authorization remains a separate application decision about what that authenticated identity can do.

The current identity browser route, protocol callbacks, session endpoints, methods, policies, and source ownership are generated in [`docs/ROUTES.md`](ROUTES.md) and described by OpenAPI where applicable. This document describes the security model rather than maintaining a second route inventory.

## Provider model

| Provider | Protocol | Purpose |
|---|---|---|
| Microsoft Entra ID | OpenID Connect over OAuth 2.0 authorization code + PKCE | Modern enterprise SSO |
| Microsoft Entra ID | SAML 2.0 | Enterprise federation |
| Google | OpenID Connect over OAuth 2.0 authorization code + PKCE | Standard Google-account authentication |
| GitHub | OAuth 2.0 authorization code + PKCE and authenticated REST API | Developer identity |

Google Workspace is not required or claimed. The Google path does not depend on an `hd` claim, an organizational domain, or Workspace SAML. Google `sub` is the durable provider subject.

GitHub does not supply an ID token in this flow. After the code exchange, the Worker calls the authenticated GitHub user API and uses GitHub's immutable numeric ID as the durable subject. The access credential is discarded after identity normalization and never becomes the application session.

## Registered identity contract

The route declarations separate browser presentation from OAuth/OIDC, SAML, session, logout, authorization, and metadata protocol actions. External provider configuration must target the canonical protocol routes from the generated route artifacts; retired identity paths are ordinary unknown routes and are not aliases.

There are no browser-facing identity inspection APIs alongside the registered browser resource. The UI explains the boundary without returning verifier, state, nonce, token, or credential values.

## Validation boundaries

Microsoft and Google OIDC callbacks fetch trusted discovery metadata, constrain discovered endpoints to provider-owned HTTPS hosts, exchange the code from the Worker, and verify the ID token against the discovered JWKS. Validation requires RS256, exact issuer and audience, `sub`, `iat`, `exp`, encrypted browser-flow state, the OIDC nonce, and the original PKCE verifier.

GitHub callbacks validate browser-flow state and PKCE, exchange the code on the Worker, then revalidate the identity through GitHub's authenticated API.

The SAML assertion consumer uses `@node-saml/node-saml` with a configured Entra signing certificate. It requires one signed assertion, the configured Entra issuer, the exact service-provider audience and recipient, valid time bounds, a stored `InResponseTo`, matching encrypted `RelayState`, and a previously unseen assertion ID. Authentication requests and accepted assertion IDs are stored in D1 so a different Worker isolate can validate the callback and replays fail closed.

## Normalized identity

Only values derived from validated provider data are included. Provider, protocol, stable subject, optional verified email and display information, assurance, application role, authentication time, and expiry form the normalized identity boundary.

`emailVerified`, organization information, and MFA assurance are omitted or downgraded when the provider did not supply evidence for them. The `operator` application role is accepted only from a validated configured app-role claim. Google and GitHub identities default to viewer.

The policy is deliberately small:

- `demo:read`: any authenticated viewer or operator;
- `demo:write`: an operator application role plus MFA assurance.

The authorization endpoint does not accept a caller-supplied authentication context.

## Application session

Provider credentials are not browser sessions. After validation, the Worker creates an opaque encrypted cookie that references an encrypted D1 session record. The cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, path-bound to `/`, and short-lived. Logout revokes the D1 record and expires the cookie. Provider-token expiry can shorten the application session.

OIDC flow material is AES-GCM encrypted in a separate short-lived cookie. The SAML flow cookie uses `SameSite=None` because Entra posts the response cross-site to the assertion consumer; it remains `HttpOnly`, `Secure`, encrypted, and bound to one-time state.

The browser and public logs never receive access tokens, refresh tokens, client secrets, authorization codes, PKCE verifiers, private signing keys, raw application cookies, or unsanitized SAML responses.

## Environment configuration

Set identity secrets and provider credentials with Cloudflare secrets or local `.dev.vars`; never commit real values. Required variables are documented in `.dev.vars.example` and validated by the identity implementation.

External provider registrations must use the canonical callback, SAML entity/consumer, metadata, and webhook URLs from the generated route contract for the release origin. Provider and webhook configuration should be verified against the released origin before traffic is cut over.

## Audit evidence

Authentication and policy transitions create sanitized events for authentication start/completion/failure, SAML validation, authorization allow/deny, and session create/destroy activity. Subject values are hashed in audit evidence. Tokens, cookies, raw assertions, and credentials are excluded.

## Release-time provider cutover

The route migration removed previous identity and protocol contracts without redirects or alternate handlers. A code change does not modify external provider configuration and does not deploy or release the application.

At release cutover, operators must update provider registrations to the canonical protocol routes published by the generated route artifacts for that release. Removed identity and protocol URLs remain ordinary unknown paths, not aliases.
