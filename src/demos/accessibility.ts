import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "accessibility",
  "route": "/accessibility",
  "title": "WCAG 2.2",
  "group": "Standards",
  "sourcePath": "src/demos/accessibility.ts",
  "summary": "Isolated WCAG 2.2 before-and-after laboratory with accessible behavior, opt-in teaching failures, axe-core output, and manual evidence.",
  "proves": [
    "Twelve visible accessible-versus-broken behavior comparisons",
    "Sandboxed teaching failures that cannot invalidate the surrounding controls",
    "Locally bundled axe-core findings labeled as partial automated coverage"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/accessibility?mode=accessible", "description": "Run the isolated WCAG 2.2 comparison laboratory." }],
  "supportingSources": [{ "label": "View rendered accessibility page", "path": "src/demos/accessibility-page.ts" }, { "label": "View accessibility checklist", "path": "docs/ACCESSIBILITY.md" }]
};

export default demo;
