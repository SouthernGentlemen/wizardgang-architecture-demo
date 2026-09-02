# Identity architecture

The `/identity` console proves one complete boundary:

```text
provider authentication -> protocol validation -> normalized identity -> application authorization -> WizardGang session
```

Authentication establishes who a visitor is. Authorization remains a separate application decision about what that authenticated identity can do.

## Provider model

| Provider | Protocol | Purpose |
|---|---|---|
| Microsoft Entra ID | OpenID Connect over OAuth 2.0 authorization code + PKCE | Modern enterprise SSO |
| Microsoft Entra ID | SAML 2.0 | Enterprise federation |
| Google | OpenID Connect over OAuth 2.0 authorization code + PKCE | Standard Google-account authentication |
| GitHub | OAuth 2.0 authorization code + PKCE and authenticated REST API | Developer identity |

Google Workspace is not required or claimed. The Google path does not depend on an `hd` claim, an organizational domain, or Workspace SAML. Google `sub` is the durable provider subject.

GitHub is intentionally different from the OIDC providers. It does not supply an ID token in this flow. After the code exchange, the Worker calls `GET /user` and uses GitHub's immutable numeric `id` as the durable subject. It requests `read:user user:email`; the email endpoint is used only when the public profile has no email, and only a primary verified email is selected.

## Public routes

| Route | Purpose |
|---|---|
| `/identity` | Sign-in surface and authenticated identity inspector |
| `/identity/microsoft` | Start Microsoft OIDC authentication |
| `/identity/microsoft/callback` | Validate the Microsoft OIDC callback |
| `/identity/google` | Start Google OIDC authentication |
| `/identity/google/callback` | Validate the Google OIDC callback |
| `/identity/github` | Start GitHub OAuth authentication |
| `/identity/github/callback` | Validate the GitHub OAuth callback and API identity |
| `/identity/saml` | Start Microsoft Entra SAML authentication |
| `/identity/saml/acs` | Validate the posted SAML response |
| `/identity/saml/metadata` | Public service-provider metadata |
| `/identity/session` | Return the current browser's sanitized application identity |
| `/identity/logout` | Revoke the current application session |
| `/__api/identity/authorize` | Apply application policy to the authenticated session |

The earlier `/__api/identity/oauth-pkce`, `/__api/identity/sso`, and `/__api/identity/saml/inspect` contracts remain available for route stability. They now describe the live security boundary without returning verifier, state, nonce, token, or credential values.

## Validation boundaries

Microsoft and Google OIDC callbacks fetch trusted discovery metadata, constrain discovered endpoints to provider-owned HTTPS hosts, exchange the code from the Worker, and verify the ID token against the discovered JWKS. Validation requires RS256, exact issuer and audience, `sub`, `iat`, `exp`, the encrypted browser-flow state, the OIDC nonce, and the original PKCE verifier.

GitHub callbacks validate browser-flow state and PKCE, exchange the code on the Worker, then revalidate the identity through GitHub's authenticated API. The access credential is discarded after this exchange and never becomes the application session.

The SAML assertion consumer uses `@node-saml/node-saml` with a configured Entra signing certificate. It requires one signed assertion, the configured Entra issuer, the exact service-provider audience, the exact ACS recipient, valid time bounds, a stored `InResponseTo`, matching encrypted `RelayState`, and a previously unseen assertion ID. Authentication requests and accepted assertion IDs are stored in D1 so a different Worker isolate can validate the callback and replays fail closed.

## Normalized identity

Only values that can be derived from validated provider data are included:

```json
{
  "provider": "microsoft | google | github",
  "protocol": "oidc | oauth2 | saml2",
  "subject": "provider-stable subject",
  "email": "when supplied",
  "emailVerified": true,
  "displayName": "when supplied, otherwise a safe fallback",
  "username": "GitHub only, when supplied",
  "organization": "Entra tenant only, when supplied",
  "assurance": "mfa | provider-authenticated",
  "role": "operator | viewer",
  "authenticatedAt": "ISO-8601 timestamp",
  "expiresAt": "ISO-8601 timestamp"
}
```

`emailVerified`, `organization`, and `mfa` are omitted or downgraded when the provider did not supply evidence for them. The `operator` application role is accepted only from a validated `operator` or `demo.operator` Entra app-role claim. Google and GitHub identities default to `viewer`.

The policy is deliberately small:

- `demo:read`: any authenticated viewer or operator;
- `demo:write`: an operator application role plus MFA assurance.

The authorization endpoint no longer accepts a caller-supplied authentication context.

## Application session

Provider credentials are not browser sessions. After validation, the Worker creates an opaque, encrypted cookie that references an encrypted D1 session record. The cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, path-bound to `/`, and expires after no more than 30 minutes. Logout revokes the D1 record and expires the cookie. Provider-token expiry can shorten the application session.

OIDC flow material is AES-GCM encrypted in a separate ten-minute `HttpOnly`, `Secure`, `SameSite=Lax` cookie. The SAML flow cookie uses `SameSite=None` because Entra posts the response cross-site to the ACS; it is still `HttpOnly`, `Secure`, short-lived, encrypted, and bound to a one-time RelayState.

The browser and public logs never receive access tokens, refresh tokens, client secrets, authorization codes, PKCE verifiers, private signing keys, raw application cookies, or unsanitized SAML responses.

## Environment configuration

Set these with Cloudflare secrets or local `.dev.vars`; never commit real values:

```text
IDENTITY_SESSION_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_TENANT_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
SAML_IDP_CERT
```

`IDENTITY_SESSION_SECRET` must contain at least 32 UTF-8 bytes. `SAML_IDP_ISSUER` and `SAML_SSO_URL` are optional overrides. By default they are derived from the Microsoft tenant ID.

### Microsoft Entra OIDC app registration

Configure this Web redirect URI:

```text
https://demo.wizardgang.ai/identity/microsoft/callback
```

The app requests `openid profile email`. Add an app role with value `demo.operator` (or `operator`) and assign it only to identities that should demonstrate write authorization. MFA assurance is recognized only when Entra emits `mfa` in the validated authentication-method claim.

### Microsoft Entra SAML enterprise application

Configure:

```text
Identifier (Entity ID): https://demo.wizardgang.ai/identity/saml
Reply URL (ACS):        https://demo.wizardgang.ai/identity/saml/acs
Sign-on URL:            https://demo.wizardgang.ai/identity
```

Download the Entra SAML signing certificate and store its PEM or base64 certificate body in `SAML_IDP_CERT`. The live service-provider metadata is available at `/identity/saml/metadata`.

### Google OAuth client

Create a Web application OAuth client and configure:

```text
https://demo.wizardgang.ai/identity/google/callback
```

This is ordinary Google OpenID Connect and does not require Google Workspace.

### GitHub OAuth app

Configure the authorization callback URL:

```text
https://demo.wizardgang.ai/identity/github/callback
```

## Audit evidence

Authentication and policy transitions create sanitized events including `identity.authentication_started`, `identity.authentication_completed`, `identity.authentication_failed`, `identity.saml_assertion_validated`, `identity.authorization_allowed`, `identity.authorization_denied`, `identity.session_created`, and `identity.session_destroyed`. Subject values are SHA-256 digests in audit evidence. Tokens, cookies, raw assertions, and credentials are excluded.
