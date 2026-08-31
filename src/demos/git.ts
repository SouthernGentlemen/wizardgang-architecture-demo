import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "git",
  "route": "/git",
  "title": "Git / GitHub",
  "group": "Delivery",
  "sourcePath": "src/demos/git.ts",
  "summary": "Public source-of-truth demonstration for code, documentation, history, and engineering context.",
  "proves": [
    "Public repository and deterministic route-to-source linkage",
    "Git history as an inspectable engineering record",
    "Version, workflow, release, and deployment evidence remain connected"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/version", "description": "Inspect running version, commit, branch, environment, and repository metadata." }],
  "supportingSources": [{ "label": "View contribution workflow", "path": "CONTRIBUTING.md" }, { "label": "View release evidence design", "path": "docs/RELEASE.md" }],
  "repositoryLinks": [{ "label": "View commits", "path": "/commits/main" }, { "label": "View Actions", "path": "/actions" }, { "label": "View Releases", "path": "/releases" }],
  "action": { "label": "Inspect running source identity", "method": "GET", "path": "/version" }
};

export default demo;
