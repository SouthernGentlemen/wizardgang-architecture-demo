# AGENTS.md

This repository is a public architecture demonstration, not a generic application template.

## Repository authority

Do not create or maintain implementation-plan or roadmap Markdown files. Short-lived planning belongs in the active controlled change, pull request, or issue; durable repository documentation describes contracts that remain true after the change is complete.

Use these authorities in order for their respective concerns:

- application route declarations are authoritative for runtime routes and route policy;
- `docs/ROUTES.md` and `docs/route-manifest.json` are generated projections of those declarations;
- `docs/FRONTEND-ROUTES.md` is the permanent browser information-architecture contract;
- `assurance/registry.json` and its registered schemas are authoritative for canonical assurance structured data;
- `docs/CHANGE-MANAGEMENT.md` governs controlled change identity and history;
- `docs/RELEASE-MANAGEMENT.md` governs releases, deployment, and rollback.

Historical release, deployment, and governance records remain evidence of prior states. Do not rewrite them merely to match the current presentation.

## Definition of done

After every task that changes repository files, finish the delivery loop before handing the task back:

1. Account for every modified, deleted, and untracked file; preserve unrelated or user-authored work.
2. Remove only task-created temporary artifacts, then run `npm run check`, `npm run validate:migrations`, `npm run security:dependencies`, `npm run build`, and `git diff --check`.
3. Commit each intended controlled change with one permanent `DEMO-###` ID and one primary bracketed type.
4. Push the isolated branch and open a pull request. Do not push ordinary changes directly to `main`.
5. Confirm the worktree is clean before reporting completion.

Production is deployed only from an annotated semantic-version release tag, never from an arbitrary branch commit. See `docs/CHANGE-MANAGEMENT.md` and `docs/RELEASE-MANAGEMENT.md`.

If a required check, push, pull request, release, deployment, or live verification cannot be completed, report the exact blocker and leave all recoverable work intact.

## Cloud development contract

- Keep the full development and delivery loop reproducible from a clean cloud checkout using only the repository, its terminal commands, and authenticated service CLIs. Do not rely on local-only files, desktop UI state, or an existing working directory.
- After changing route declarations or route artifact generation, run `npm run generate:routes` and commit both `docs/ROUTES.md` and `docs/route-manifest.json` before validation.
- Keep CI failure output bounded and actionable for cloud clients: emit the failing file, line when available, and remediation command. Never print an entire generated artifact or a single-line Base64 payload into job logs.

## Architecture invariants

Preserve these invariants:

- Keep the ordinary public browser surface task-oriented and minimal: `/`, `/demos`, and `/assurance`; keep `/security` as a contextual support/security boundary; keep `/admin` protected and `/offline` as recovery.
- The retired human `/operations` pathname remains an ordinary 404. Preserve operational machine APIs, scheduled collection, retention, bounded logs, protected controls, and the compact homepage operational proof without recreating a public operations dashboard.
- Keep public routes stable once released unless a controlled change explicitly retires a route without compatibility aliases.
- Keep one architecture concern per demo module.
- Treat route declarations as the runtime route source of truth; generated route documentation and manifests are projections, not parallel inventories.
- Keep registry-declared operations, security, administration, and offline-recovery capabilities available according to each declaration's offline policy; do not protect them with a hardcoded pathname inventory.
- Never let ordinary demo behavior execute behind the intentional offline gate.
- API/non-HTML/write requests receive `503` JSON while offline; browser HTML demo navigation may redirect to the registered offline recovery page.
- Do not commit secrets, real Cloudflare billing/account data, or admin credentials.
- Do not claim WCAG, ISO/IEC 27001, or ISO/IEC 42001 certification.
- Prefer the smallest implementation that visibly proves the architecture concept.
- Keep all source links public and deterministic.
- Use `DEMO_DB` / `demo-blob` for shared relational demo state and audit metadata.
- Use R2 for actual objects and Durable Objects for actual coordinated state; do not fake them with D1.
- Record safe audit evidence for meaningful control/architecture actions without logging credentials.
- Keep `application_logs` public-safe and bounded; never persist credentials, authorization headers, cookies, tokens, secrets, payment data, private account metadata, or unreviewed request bodies.
- Keep architecture documentation in Markdown/text. Do not add PDFs to this package unless explicitly requested later.
- Report route counts from generated artifacts or runtime projections; never encode a fixed route count as an invariant.
