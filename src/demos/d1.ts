import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "d1",
  "title": "Cloudflare D1",
  "group": "Platform",
  "sourcePath": "src/demos/d1.ts",
  "summary": "Isolated Users and Tasks CRUD with live parameterized SQL, timing, row counts, shared GraphQL data, and resettable D1 state.",
  "proves": [
    "Shared DEMO_DB binding",
    "Session-scoped Users and Tasks CRUD against demo-blob",
    "Relational audit and public-safe operational records"
  ],
  "status": "working",
  "interfaces": [
    { "method": "GET / POST", "path": "/api/labs/d1-users", "description": "List or create visitor-scoped users in D1." },
    { "method": "GET / PUT / DELETE", "path": "/api/labs/d1-users/{id}", "description": "Read, replace, or delete one visitor-scoped user." },
    { "method": "GET / POST", "path": "/api/labs/d1-tasks", "description": "List or create tasks related to users in the same D1 sandbox." },
    { "method": "GET / PUT / DELETE", "path": "/api/labs/d1-tasks/{id}", "description": "Read, replace, or delete one visitor-scoped task." },
    { "method": "POST", "path": "/api/labs/d1-reset", "description": "Restore deterministic users and tasks for the current visitor sandbox." }
  ],
  "supportingSources": [
    { "label": "View D1 API implementation", "path": "src/api/d1-lab.ts" },
    { "label": "View visitor sandbox", "path": "src/lib/demo-session.ts" },
    { "label": "View interactive schema", "path": "migrations/0008_interactive_demo.sql" }
  ]
};

export default demo;
