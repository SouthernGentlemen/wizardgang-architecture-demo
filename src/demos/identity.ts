import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "identity",
  "route": "/identity",
  "title": "Authentication & Authorization",
  "group": "Identity",
  "sourcePath": "src/demos/identity.ts",
  "summary": "Identity overview separating authentication from authorization.",
  "proves": [
    "Authentication context and application authorization are evaluated separately",
    "Least-privilege read/write policy with an MFA condition",
    "Each policy decision creates safe D1 evidence"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/__api/identity/authorize", "description": "Evaluate a provider-neutral authenticated context against application policy." }],
  "supportingSources": [{ "label": "View identity boundary implementation", "path": "src/api/identity.ts" }, { "label": "View identity design", "path": "docs/IDENTITY.md" }],
  "action": { "label": "Evaluate authenticated operator access", "method": "POST", "path": "/__api/identity/authorize", "body": { "authentication": { "subject": "visitor@example.test", "assurance": "mfa", "role": "operator" }, "requestedAction": "demo:write" } }
};

export default demo;
