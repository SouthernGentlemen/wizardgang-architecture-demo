# AGENTS.md

This repository is a public architecture demonstration, not a generic application template.

Preserve these invariants:

- Keep public routes stable once released.
- Keep one architecture concern per demo module.
- Keep `src/demos/registry.ts`, `docs/ROUTES.md`, and `docs/route-manifest.json` consistent.
- Keep the operations dashboard and admin/offline controls working as cross-cutting infrastructure while individual demos are implemented.
- Never let ordinary demo behavior execute behind the intentional offline gate.
- Keep `/dashboard/*`, `/health`, `/version`, `/__api/operations/logs`, `/admin`, and `/offline` reachable while intentionally offline.
- API/non-HTML/write requests receive `503` JSON while offline; browser HTML demo navigation may redirect to `/offline`.
- Do not commit secrets, real Cloudflare billing/account data, or admin credentials.
- Do not claim WCAG, ISO/IEC 27001, or ISO/IEC 42001 certification.
- Prefer the smallest implementation that visibly proves the architecture concept.
- Keep all source links public and deterministic.
- Use `DEMO_DB` / `demo-blob` for shared relational demo state and audit metadata.
- Use R2 for actual objects and Durable Objects for actual coordinated state; do not fake them with D1.
- Record safe audit evidence for meaningful control/architecture actions without logging credentials.
- Keep `application_logs` public-safe and bounded; never persist credentials, authorization headers, cookies, tokens, secrets, payment data, private account metadata, or unreviewed request bodies.
- Keep architecture documentation in Markdown/text. Do not add PDFs to this package unless explicitly requested later.
