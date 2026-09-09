import type { DemoDefinition } from '../types';
import { routeUrl } from '../routing/application-routes';

const demo: DemoDefinition = {
  "id": "i18n",
  "title": "Internationalization",
  "group": "Standards",
  "sourcePath": "src/demos/i18n.ts",
  "summary": "Application-owned locale resolution, formatting, translation resources, navigation persistence, and RTL behavior.",
  "proves": [
    "One global localization context serves English, Spanish, French, German, Japanese, and Arabic",
    "Server-rendered shell language and direction resolve before document emission",
    "Locale-aware number, date, currency, list, and plural formatting share the same runtime",
    "Language state persists through application navigation without changing canonical route identity"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": routeUrl('interfaces.i18n', {}, { lang: 'ar', count: '3' }), "description": "Inspect the application localization runtime in Arabic and RTL mode." }],
  "supportingSources": [{ "label": "View global i18n runtime", "path": "src/i18n/runtime.ts" }, { "label": "View rendered i18n inspection page", "path": "src/demos/i18n-page.ts" }, { "label": "View locale configuration", "path": "config/i18n.json" }]
};

export default demo;
