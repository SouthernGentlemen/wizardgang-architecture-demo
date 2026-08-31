# AGENTS.md

This repository is a public architecture demonstration, not a generic application template.

## Definition of done

After every task that changes repository files, finish the delivery loop before handing the task back:

1. Account for every modified, deleted, and untracked file; preserve unrelated or user-authored work.
2. Remove only task-created temporary artifacts, then run `npm run check`, `npm run validate:migrations`, `npm run security:dependencies`, `npm run build`, and `git diff --check`.
3. Commit each intended controlled change with one permanent `DEMO-###` ID and one primary bracketed type.
4. Push the isolated branch and open a pull request. Do not push ordinary changes directly to `main`.
5. Confirm the worktree is clean before reporting completion.

Production is deployed only from an annotated semantic-version release tag, never from an arbitrary branch commit. See `docs/CHANGE-MANAGEMENT.md` and `docs/RELEASE-MANAGEMENT.md`.

If a required check, push, pull request, release, deployment, or live verification cannot be completed, report the exact blocker and leave all recoverable work intact.

## Architecture invariants

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
