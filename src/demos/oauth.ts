import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "oauth",
  "route": "/identity/oauth",
  "title": "OAuth 2.0",
  "group": "Identity",
  "sourcePath": "src/demos/oauth.ts",
  "summary": "OAuth 2.0 authorization-code/PKCE protocol material with an explicit boundary between identity-provider authentication and application authorization.",
  "proves": [
    "Cryptographically random verifier, S256 challenge, and state",
    "Identity-provider authentication remains distinct from application permissions",
    "No client secret or live provider tenant is exposed"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/__api/identity/oauth-pkce", "description": "Generate one-time OAuth 2.0 PKCE demonstration material." }],
  "supportingSources": [{ "label": "View OAuth boundary implementation", "path": "src/api/identity.ts" }, { "label": "View identity design", "path": "docs/IDENTITY.md" }],
  "action": { "label": "Generate OAuth PKCE material", "method": "POST", "path": "/__api/identity/oauth-pkce" }
};

export default demo;
