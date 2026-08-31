import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "sso",
  "route": "/identity/sso",
  "title": "Single Sign-On",
  "group": "Identity",
  "sourcePath": "src/demos/sso.ts",
  "summary": "Enterprise single sign-on demonstration surface.",
  "proves": [
    "Provider-neutral SSO trust and validation responsibilities",
    "Live configuration truthfully reports unconfigured without secrets",
    "Application authorization remains independent after authentication"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/__api/identity/sso", "description": "Inspect authentication and authorization ownership across the SSO boundary." }],
  "supportingSources": [{ "label": "View SSO boundary implementation", "path": "src/api/identity.ts" }, { "label": "View identity design", "path": "docs/IDENTITY.md" }],
  "action": { "label": "Inspect the SSO trust boundary", "method": "GET", "path": "/__api/identity/sso" }
};

export default demo;
