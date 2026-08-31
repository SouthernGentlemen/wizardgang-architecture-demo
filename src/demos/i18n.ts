import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "i18n",
  "route": "/i18n",
  "title": "Internationalization",
  "group": "Standards",
  "sourcePath": "src/demos/i18n.ts",
  "summary": "Locale-ready interface architecture including language, formatting, translation resources, and RTL readiness.",
  "proves": [
    "Translated resources for English, Spanish, and Arabic",
    "Locale-aware number, date, currency, and plural formatting",
    "Correct document language and right-to-left direction"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/i18n?locale=ar&count=3", "description": "Render the live locale and RTL demonstration." }],
  "supportingSources": [{ "label": "View rendered i18n page", "path": "src/demos/i18n-page.ts" }, { "label": "View locale configuration", "path": "config/i18n.json" }]
};

export default demo;
