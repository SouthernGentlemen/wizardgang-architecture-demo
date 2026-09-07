import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "i18n",
  "route": "/interfaces?view=i18n",
  "title": "Internationalization",
  "group": "Standards",
  "sourcePath": "src/demos/i18n.ts",
  "summary": "Locale-ready interface architecture including language, formatting, translation resources, and RTL readiness.",
  "proves": [
    "Synchronized resources for English, Spanish, French, German, Japanese, and Arabic",
    "Locale-aware number, date, currency, and plural formatting",
    "Instant client-side switching with shareable server-rendered fallback",
    "Inspectable translation keys and correct right-to-left direction"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/interfaces?view=i18n&locale=ar&count=3", "description": "Render the live locale and RTL demonstration." }],
  "supportingSources": [{ "label": "View rendered i18n page", "path": "src/demos/i18n-page.ts" }, { "label": "View locale configuration", "path": "config/i18n.json" }]
};

export default demo;
