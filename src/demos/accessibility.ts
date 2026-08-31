import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "accessibility",
  "route": "/accessibility",
  "title": "WCAG 2.2",
  "group": "Interface Standards",
  "sourcePath": "src/demos/accessibility.ts",
  "summary": "Accessibility engineering demonstration for semantic HTML, keyboard use, focus, labels, errors, and predictable navigation.",
  "proves": [
    "Semantic landmarks, headings, labels, and native disclosure",
    "Skip link, keyboard-visible focus, and responsive text reflow",
    "Understandable validation and status output that does not rely on color"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/accessibility?name=Ada", "description": "Run the server-rendered accessible form and status interaction." }],
  "supportingSources": [{ "label": "View rendered accessibility page", "path": "src/demos/accessibility-page.ts" }, { "label": "View accessibility checklist", "path": "docs/ACCESSIBILITY.md" }]
};

export default demo;
