import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "durable-objects",
  "route": "/durable-objects",
  "title": "Durable Objects",
  "group": "Runtime",
  "sourcePath": "src/demos/durable-objects.ts",
  "summary": "Coordinated stateful compute for cases where independent Worker requests must agree on shared state.",
  "proves": [
    "A named Durable Object owns the shared counter",
    "Concurrent increments are serialized at the object boundary",
    "D1 records audit evidence but does not hold the counter"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET / POST", "path": "/__api/durable/counter", "description": "Read or atomically increment the public coordinated counter." }],
  "supportingSources": [{ "label": "View Durable Object API", "path": "src/api/durable.ts" }, { "label": "View Durable Object class", "path": "src/durable/demo-coordinator.ts" }, { "label": "View Durable Object binding", "path": "wrangler.jsonc" }],
  "action": { "label": "Increment the coordinated counter", "method": "POST", "path": "/__api/durable/counter" }
};

export default demo;
