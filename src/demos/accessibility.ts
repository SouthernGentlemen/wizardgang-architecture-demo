import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "accessibility",
  "route": "/accessibility",
  "title": "WCAG 2.2",
  "group": "Interface Standards",
  "sourcePath": "src/demos/accessibility.ts",
  "summary": "Accessibility engineering demonstration for semantic HTML, keyboard use, focus, labels, errors, and predictable navigation.",
  "proves": [
    "Semantic HTML baseline",
    "Keyboard-visible controls",
    "Accessible status output"
  ],
  "status": "scaffolded"
};

export default demo;
