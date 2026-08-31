import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "saml",
  "route": "/identity/saml",
  "title": "SAML",
  "group": "Identity",
  "sourcePath": "src/demos/saml.ts",
  "summary": "SAML enterprise identity integration demonstration surface.",
  "proves": [
    "Served provider-neutral service-provider metadata",
    "Explicit assertion signature, issuer, audience, time, and replay requirements",
    "Application role policy remains separate from SAML authentication"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/identity/saml/metadata", "description": "Fetch non-secret service-provider metadata." }, { "method": "GET", "path": "/__api/identity/saml/inspect", "description": "Inspect the required validation and authorization boundary." }],
  "supportingSources": [{ "label": "View SAML boundary implementation", "path": "src/api/identity.ts" }, { "label": "View metadata example", "path": "contracts/identity/saml-metadata.example.xml" }],
  "action": { "label": "Inspect the SAML boundary", "method": "GET", "path": "/__api/identity/saml/inspect" }
};

export default demo;
