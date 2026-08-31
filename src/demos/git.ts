import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "git",
  "route": "/git",
  "title": "Git / GitHub",
  "group": "Delivery & Governance",
  "sourcePath": "src/demos/git.ts",
  "summary": "One inspectable delivery chain connecting public source, controlled commits, branching, CI/CD, releases, and environment boundaries to the running version.",
  "proves": [
    "Public repository and deterministic route-to-source linkage",
    "Controlled commits and isolated branches return through validated review",
    "Semantic releases and exact-tag deployments connect runtime identity to source",
    "Secrets stay in ignored local or managed environment stores"
  ],
  "status": "working",
  "sections": [
    {
      "id": "source-of-truth",
      "title": "Source of truth",
      "description": "The public repository holds code, documentation, contracts, workflows, migrations, and the evidence needed to understand the running system.",
      "points": ["Every public page links to its primary source", "The route registry and manifest make ownership deterministic"]
    },
    {
      "id": "versioning",
      "title": "Commit conventions",
      "description": "Each controlled change receives one permanent DEMO identifier and one primary type so history remains small, sequential, and reviewable.",
      "points": ["Commit subjects follow the project convention", "Risk, validation, evidence, and release intent live in the commit record"]
    },
    {
      "id": "branching",
      "title": "Branching",
      "description": "Work starts on an isolated branch and returns to the accepted main baseline through a pull request.",
      "points": ["Ordinary changes are never pushed directly to main", "Review topology remains visible in Git history"]
    },
    {
      "id": "actions",
      "title": "CI/CD",
      "description": "GitHub Actions reproduces validation, release, and deployment controls from repository-owned workflows.",
      "points": ["CI validates contracts, migrations, accessibility, localization, security, tests, and the Worker build", "Deployment accepts reviewed semantic-version tags only"]
    },
    {
      "id": "releases",
      "title": "Releases",
      "description": "Annotated semantic-version tags and GitHub Releases identify immutable accepted product states.",
      "points": ["Runtime version and commit metadata are injected from the tagged source", "Release and deployment evidence record explicit rollback targets"]
    },
    {
      "id": "environments",
      "title": "Environments & secrets",
      "description": "Local, preview, and production bindings are explicit while credentials remain outside source and public runtime metadata.",
      "points": ["Managed secrets are injected only at the boundary that needs them", "The public version response exposes environment identity without private account data"]
    }
  ],
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
  "action": { "label": "Inspect running source identity", "method": "GET", "path": "/version" }
};

export default demo;
