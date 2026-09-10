import type { DemoDefinition, Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { demoContent, type PageContent } from '../ui/page';

const demo: DemoDefinition = {
  "id": "durable-objects",
  "title": "Durable Objects",
  "group": "Platform",
  "sourcePath": "src/demos/durable-objects.ts",
  "summary": "Coordinated stateful compute for cases where independent Worker requests must agree on shared state.",
  "proves": [
    "A named Durable Object owns the shared counter",
    "Concurrent increments are serialized at the object boundary",
    "D1 records audit evidence but does not hold the counter"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET / POST", "path": "/api/labs/durable-counter", "description": "Read or atomically increment the public coordinated counter." }],
  "supportingSources": [{ "label": "View Durable Object API", "path": "src/api/durable.ts" }, { "label": "View Durable Object class", "path": "src/durable/demo-coordinator.ts" }, { "label": "View Durable Object binding", "path": "wrangler.jsonc" }],
  "action": { "label": "Increment the coordinated counter", "method": "POST", "path": "/api/labs/durable-counter" }
};

export function durableObjectsContent(env: Env): PageContent {
  return demoContent(env, { ...demo, route: `${routeUrl('demos.index')}#durable-objects` });
}

export default demo;
