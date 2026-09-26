# Architecture Demo repository boundaries

## Cloud development contract

- Keep the full development and delivery loop reproducible from a clean cloud checkout using only the repository, its terminal commands, and authenticated service CLIs. Do not rely on local-only files, desktop UI state, or an existing working directory.
- After changing route declarations or route artifact generation, run `npm run generate:routes` and commit `docs/route-manifest.json` before validation.
- Keep CI failure output bounded and actionable for cloud clients: emit the failing file, line when available, and remediation command. Never print an entire generated artifact or a single-line Base64 payload into job logs.

## Architecture invariants

Preserve these invariants:

- Render HTML presentations from server-side React components, except the dependency-free safe error page. Keep pages usable without JavaScript; first-party browser modules progressively enhance them without hydration or a client-side router. Confine raw HTML insertion to an audited component.
- Keep the site-wide Content Security Policy free of `'unsafe-inline'`. HTML has no inline event handlers, and any necessary inline script or style is explicitly hash- or nonce-authorized; preserve standalone route policies where their browser dependencies require them.
- Serve browser-downloaded modules, stylesheets, and vendored files from Workers Static Assets through the `ASSETS` binding, not the Worker bundle. Build first-party browser assets with Vite into content-hashed, immutable files, and author stylesheets as CSS under `src/styles/`.
- Keep the ordinary public browser surface task-oriented and minimal: `/`, `/demos`, and `/assurance`; keep `/security` as a contextual support/security boundary; keep `/admin` protected and `/offline` as recovery.
- The shared shell stays minimal: the header is one non-wrapping row of brand, primary navigation, and utilities at every width; the footer carries the `/security` reachability link the frontend contract requires; navigation projections derive from route declarations without a hardcoded route allowlist; and breadcrumbs, secondary navigation, and related-destination navigation are not reintroduced.
- Do not leave a retired surface's stylesheet rules behind. A controlled change that removes markup removes the rules that styled it in the same change.
- `/demos` is one focused workbench, not a catalog page: one demo is selected/mounted at a time, D1 is the default, the released demo fragments remain stable deep links, category/demo controls are navigation, and an `All demos` mode or giant trailing inventory must not be introduced.
- Preserve the released demo set and capabilities while changing their presentation; hiding inactive demos from the page body is not permission to remove their underlying behavior or machine contracts.
- Keep verbose schemas, raw protocol payloads, logs, source detail, and assurance/control evidence subordinate to the executable demo task through bounded inspector/advanced surfaces when practical.
- `/operations` is an ordinary 404. Preserve operational machine APIs, scheduled collection, retention, bounded logs, protected controls, and the compact homepage operational proof without creating a public operations dashboard.
- Keep public routes stable once released unless a controlled change explicitly retires a route without compatibility aliases.
- Keep one architecture concern per demo module.
- Treat route declarations as the runtime route source of truth; `docs/route-manifest.json` is the generated machine projection and `docs/ROUTE-REGISTRY.md` is the human architecture contract, not a parallel route inventory.
- Keep registry-declared operations, security, administration, and offline-recovery capabilities available according to each declaration's offline policy; do not protect them with a hardcoded pathname inventory.
- Never let ordinary demo behavior execute behind the intentional offline gate.
- API/non-HTML/write requests receive `503` JSON while offline; browser HTML demo navigation may redirect to the registered offline recovery page.
- Do not commit secrets, real Cloudflare billing/account data, or admin credentials.
- A controlled change that adds, renames, or removes a Worker secret names the production provisioning requirement in its controlled record. Production must hold every required secret from `config/worker-secrets.json` before a release tag is pushed, and the deploy workflow must fail closed on a missing required name. Record secrets by name, date, and purpose only, never by value.
- Do not claim WCAG, ISO/IEC 27001, or ISO/IEC 42001 certification.
- The canonical JSON evidence records and `evidence` relationships stay as they are, and every `/assurance` requirement references the Markdown documentation that governs it. Do not set a compliance status without a rationale, and do not set any status other than `gap` without a Markdown documentation reference. Never create, backdate, or simulate an operating record to improve a status.
- Prefer the smallest implementation that visibly proves the architecture concept.
- Keep all source links public and deterministic.
- Use `DEMO_DB` / `demo-blob` for shared relational demo state and audit metadata.
- Use R2 for actual objects and Durable Objects for actual coordinated state; do not fake them with D1.
- Record safe audit evidence for meaningful control/architecture actions without logging credentials.
- Keep `application_logs` public-safe and bounded; never persist credentials, authorization headers, cookies, tokens, secrets, payment data, private account metadata, or unreviewed request bodies.
- Keep architecture documentation in Markdown/text. Do not add PDFs to this package unless explicitly requested later.
- Report route counts from generated artifacts or runtime projections; never encode a fixed route count as an invariant.
