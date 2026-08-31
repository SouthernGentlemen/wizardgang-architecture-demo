import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "actions",
  "route": "/git/actions",
  "title": "GitHub Actions",
  "group": "Delivery",
  "sourcePath": "src/demos/actions.ts",
  "summary": "Automated validation, testing, release, and deployment controls.",
  "proves": [
    "Clean dependency install plus full validation suite",
    "Contract, migration, accessibility, localization, and security checks",
    "Reviewed tagged source drives controlled deployment"
  ],
  "status": "working",
  "supportingSources": [{ "label": "View CI workflow", "path": ".github/workflows/ci.yml" }, { "label": "View deploy workflow", "path": ".github/workflows/deploy.yml" }, { "label": "View validation scripts", "path": "scripts/validate-scaffold.mjs" }],
  "repositoryLinks": [{ "label": "Inspect workflow runs", "path": "/actions" }],
  "action": { "label": "Inspect running release identity", "method": "GET", "path": "/version" }
};

export default demo;
