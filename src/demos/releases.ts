import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "releases",
  "route": "/git/releases",
  "title": "Release Management",
  "group": "Delivery",
  "sourcePath": "src/demos/releases.ts",
  "summary": "Semantic versioning, Git tags, GitHub Releases, and traceability from running version to source.",
  "proves": [
    "Semantic version tags and GitHub Releases identify accepted baselines",
    "Deployment checks out reviewed tagged source",
    "Runtime version and commit are injected and inspectable"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/version", "description": "Compare runtime metadata with a tag, Release, and commit." }],
  "supportingSources": [{ "label": "View release procedure", "path": "docs/RELEASE.md" }, { "label": "View deploy workflow", "path": ".github/workflows/deploy.yml" }, { "label": "View changelog", "path": "CHANGELOG.md" }],
  "repositoryLinks": [{ "label": "Inspect Releases", "path": "/releases" }, { "label": "Inspect tags", "path": "/tags" }],
  "action": { "label": "Inspect deployed release metadata", "method": "GET", "path": "/version" }
};

export default demo;
