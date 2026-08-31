import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "sso",
  "route": "/identity/sso",
  "title": "Single Sign-On",
  "group": "Identity",
  "sourcePath": "src/demos/sso.ts",
  "summary": "Enterprise single sign-on demonstration surface.",
  "proves": [
    "Stable SSO exhibit route",
    "Provider-neutral scaffold",
    "Authorization remains application-controlled"
  ],
  "status": "scaffolded"
};

export default demo;
