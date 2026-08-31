import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "oauth",
  "route": "/identity/oauth",
  "title": "OAuth 2.0",
  "group": "Identity",
  "sourcePath": "src/demos/oauth.ts",
  "summary": "OAuth 2.0 authentication and authorization flow demonstration.",
  "proves": [
    "Stable callback exhibit route",
    "Placeholder for provider configuration",
    "No secrets in source"
  ],
  "status": "scaffolded"
};

export default demo;
