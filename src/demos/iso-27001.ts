import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "iso27001",
  "route": "/governance/iso-27001",
  "title": "ISO/IEC 27001 Alignment",
  "group": "Governance",
  "sourcePath": "src/demos/iso-27001.ts",
  "summary": "Security governance reference covering access control, secure development, change, release, logging, configuration, and evidence retention.",
  "proves": [
    "Alignment-only status",
    "Security control demonstration scaffold",
    "No certification claim"
  ],
  "status": "scaffolded"
};

export default demo;
