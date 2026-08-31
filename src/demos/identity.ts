import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "identity",
  "route": "/identity",
  "title": "Authentication & Authorization",
  "group": "Interfaces",
  "sourcePath": "src/demos/identity.ts",
  "summary": "One provider-neutral identity boundary for authentication context, OAuth PKCE, enterprise SSO, SAML validation, and separate application authorization.",
  "proves": [
    "Authentication context and application authorization are evaluated separately",
    "Cryptographically random OAuth verifier, S256 challenge, and state material",
    "Provider-neutral SSO and SAML trust responsibilities without exposed tenant secrets",
    "Least-privilege decisions create safe D1 evidence"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View identity boundary implementation", "path": "src/api/identity.ts" },
    { "label": "View identity design", "path": "docs/IDENTITY.md" },
    { "label": "View SAML metadata example", "path": "contracts/identity/saml-metadata.example.xml" }
  ],
  "actions": [
    {
      "id": "authorization",
      "title": "Application authorization",
      "description": "Evaluate a provider-neutral authenticated context against least-privilege application policy after authentication.",
      "label": "Evaluate authenticated operator access",
      "method": "POST",
      "path": "/__api/identity/authorize",
      "body": { "authentication": { "subject": "visitor@example.test", "assurance": "mfa", "role": "operator" }, "requestedAction": "demo:write" }
    },
    {
      "id": "oauth",
      "title": "OAuth 2.0 / PKCE",
      "description": "Generate one-time protocol material without exposing a client secret or live provider tenant.",
      "label": "Generate OAuth PKCE material",
      "method": "POST",
      "path": "/__api/identity/oauth-pkce"
    },
    {
      "id": "sso",
      "title": "Single Sign-On",
      "description": "Inspect ownership of authentication, assertion validation, and application authorization across the SSO trust boundary.",
      "label": "Inspect the SSO trust boundary",
      "method": "GET",
      "path": "/__api/identity/sso"
    },
    {
      "id": "saml",
      "title": "SAML",
      "description": "Inspect signature, issuer, audience, time, replay, and downstream role-policy requirements. Provider-facing metadata remains available at /identity/saml/metadata.",
      "label": "Inspect the SAML boundary",
      "method": "GET",
      "path": "/__api/identity/saml/inspect"
    }
  ]
};

export default demo;
