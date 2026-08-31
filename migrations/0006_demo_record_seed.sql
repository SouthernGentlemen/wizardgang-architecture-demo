-- Seed the public read surface shared by REST, GraphQL, and the MCP tool.
-- Without these rows every public read demonstration returns an empty array,
-- because writes are bearer-protected and a public visitor cannot create one.
-- INSERT OR IGNORE keeps the seed idempotent and never overwrites operator writes.

INSERT OR IGNORE INTO demo_records (namespace, record_key, value_json, created_at, updated_at) VALUES
  ('public', 'runtime-edge',
   '{"layer":"Runtime","route":"/edge","binding":"Cloudflare global network","summary":"Public edge boundary for DNS, TLS, CDN, routing, and security policy."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ('public', 'runtime-workers',
   '{"layer":"Runtime","route":"/workers","binding":"Worker script","summary":"Stateless TypeScript compute mediating clients, platform state, and integrations."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ('public', 'runtime-durable-objects',
   '{"layer":"Runtime","route":"/durable-objects","binding":"DEMO_COORDINATOR","summary":"Coordinated stateful compute for requests that must agree on shared state."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ('public', 'runtime-d1',
   '{"layer":"Runtime","route":"/d1","binding":"DEMO_DB -> demo-blob","summary":"Relational persistence for structured application records and audit metadata."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ('public', 'runtime-r2',
   '{"layer":"Runtime","route":"/r2","binding":"DEMO_R2","summary":"Object storage for files and artifacts; D1 holds metadata and references only."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ('public', 'integration-rest',
   '{"layer":"Integration","route":"/api/rest","binding":"/v1/demo-records","summary":"Versioned REST/JSON resource endpoints over the shared authorization boundary."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ('public', 'integration-graphql',
   '{"layer":"Integration","route":"/api/graphql","binding":"/graphql","summary":"Schema-driven reads resolving against the same records and the same policy as REST."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z'),
  ('public', 'integration-mcp',
   '{"layer":"AI Integration","route":"/mcp","binding":"list_demo_records","summary":"JSON-RPC tool operating inside ordinary application permissions and data limits."}',
   '2026-08-31T00:00:00.000Z', '2026-08-31T00:00:00.000Z');
