import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "identity",
  "route": "/identity",
  "title": "Authentication & SSO",
  "group": "Interfaces",
  "sourcePath": "src/demos/identity.ts",
  "summary": "Real Microsoft Entra ID, Google, and GitHub authentication paths converge on one normalized identity and application authorization boundary.",
  "proves": [
    "Microsoft Entra ID authenticates enterprise users through OIDC or SAML 2.0",
    "Google OIDC and GitHub OAuth identities cross the same normalized identity boundary",
    "State, nonce, PKCE, signatures, issuer, audience, expiration, and SAML replay controls are enforced server-side",
    "Revocable application sessions and least-privilege decisions create sanitized D1 evidence"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View identity console", "path": "src/demos/identity-page.ts" },
    { "label": "View identity boundary implementation", "path": "src/api/identity.ts" },
    { "label": "View identity design", "path": "docs/IDENTITY.md" },
    { "label": "View SAML metadata example", "path": "contracts/identity/saml-metadata.example.xml" }
  ],
  "interfaces": [
    { "method": "GET", "path": "/identity/microsoft", "description": "Start Microsoft Entra ID OIDC authentication." },
    { "method": "GET", "path": "/identity/google", "description": "Start Google OpenID Connect authentication." },
    { "method": "GET", "path": "/identity/github", "description": "Start GitHub OAuth authentication." },
    { "method": "GET / POST", "path": "/identity/saml → /identity/saml/acs", "description": "Start and consume Microsoft Entra ID SAML authentication." },
    { "method": "GET", "path": "/identity/session", "description": "Inspect only the current browser's sanitized application session." },
    { "method": "POST", "path": "/__api/identity/authorize", "description": "Evaluate the authenticated application identity against demo policy." }
  ]
};

export default demo;
