import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "saml",
  "route": "/identity/saml",
  "title": "SAML",
  "group": "Identity",
  "sourcePath": "src/demos/saml.ts",
  "summary": "SAML enterprise identity integration demonstration surface.",
  "proves": [
    "Stable SAML exhibit route",
    "Metadata/config scaffold",
    "Application authorization remains separate"
  ],
  "status": "scaffolded"
};

export default demo;
