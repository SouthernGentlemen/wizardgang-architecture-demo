import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "git",
  "route": "/git",
  "title": "Git / GitHub",
  "group": "Delivery & Governance",
  "sourcePath": "src/demos/git.ts",
  "summary": "Live public GitHub evidence for branches, commits, pull requests, Actions runs, tags, releases, and verifiable delivery controls.",
  "proves": [
    "Bounded live GitHub queries for the configured repository only",
    "Explicit available, empty, partial-failure, and unavailable evidence states",
    "No branch-protection claim unless GitHub exposes the supporting response",
    "A visible commit-to-release pipeline linked to public source objects"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View contribution workflow", "path": "CONTRIBUTING.md" },
    { "label": "View change management", "path": "docs/CHANGE-MANAGEMENT.md" },
    { "label": "View release procedure", "path": "docs/RELEASE.md" },
    { "label": "View CI workflow", "path": ".github/workflows/ci.yml" },
    { "label": "View deploy workflow", "path": ".github/workflows/deploy.yml" },
    { "label": "View Cloudflare bindings", "path": "wrangler.jsonc" },
    { "label": "View secret guidance", "path": "SECURITY.md" }
  ],
  "repositoryLinks": [{ "label": "View commits", "path": "/commits/main" }, { "label": "View branches", "path": "/branches" }, { "label": "View pull requests", "path": "/pulls" }, { "label": "View Actions", "path": "/actions" }, { "label": "View Releases", "path": "/releases" }],
  "interfaces": [{ "method": "GET", "path": "/__api/git/evidence", "description": "Fetch bounded, sanitized, cached public GitHub evidence." }]
};

export default demo;
