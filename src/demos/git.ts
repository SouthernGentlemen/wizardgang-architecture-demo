import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "git",
  "route": "/git",
  "title": "Git / GitHub",
  "group": "Delivery & Governance",
  "sourcePath": "src/demos/git.ts",
  "summary": "An authenticated, two-stage live release lifecycle backed by real branches, commits, pull requests, CI jobs, retained reports, semantic tags, deployment, and public GitHub evidence.",
  "proves": [
    "Same-origin demo-admin authorization can dispatch one allowlisted GitHub workflow without exposing credentials",
    "A real patch, minor, or major change remains open as a pull request while its actual CI jobs run",
    "Merge and annotated release require a second authenticated action after successful CI",
    "One active live-demo pull request and one serialized controller workflow prevent version collisions",
    "Bounded live GitHub queries for the configured repository only",
    "Explicit available, empty, partial-failure, and unavailable evidence states",
    "Canonical CI and assurance-monitor reports retained in Git history beyond transient artifact retention",
    "No branch-protection claim unless GitHub exposes the supporting response"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View contribution workflow", "path": "CONTRIBUTING.md" },
    { "label": "View change management", "path": "docs/CHANGE-MANAGEMENT.md" },
    { "label": "View release procedure", "path": "docs/RELEASE.md" },
    { "label": "View CI workflow", "path": ".github/workflows/ci.yml" },
    { "label": "View retained-report publisher", "path": ".github/workflows/report-publisher.yml" },
    { "label": "View live lifecycle workflow", "path": ".github/workflows/git-demo.yml" },
    { "label": "View deploy workflow", "path": ".github/workflows/deploy.yml" },
    { "label": "View Cloudflare bindings", "path": "wrangler.jsonc" },
    { "label": "View secret guidance", "path": "SECURITY.md" }
  ],
  "repositoryLinks": [{ "label": "View commits", "path": "/commits/main" }, { "label": "View branches", "path": "/branches" }, { "label": "View pull requests", "path": "/pulls" }, { "label": "View Actions", "path": "/actions" }, { "label": "View Releases", "path": "/releases" }],
  "interfaces": [
    { "method": "GET", "path": "/__api/git/evidence", "description": "Fetch bounded, sanitized, cached public GitHub evidence." },
    { "method": "GET", "path": "/__api/git/demo", "description": "Poll the active or most recent live delivery lifecycle." },
    { "method": "POST", "path": "/__api/git/demo", "description": "Authenticate and dispatch one controlled semantic-version pull request." },
    { "method": "POST", "path": "/__api/git/demo/release", "description": "Authenticate and dispatch merge, annotated tag, release, deploy, and verification after CI passes." }
  ]
};

export default demo;
