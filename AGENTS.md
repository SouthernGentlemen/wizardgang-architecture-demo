# AGENTS.md

This repository is a public architecture demonstration, not a generic application template.

## Active implementation source of truth

Before planning or implementing a controlled change, read the root [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

That file is authoritative for the active public product target, ordered roadmap, and reserved `DEMO-###` IDs. Application route declarations remain authoritative for the routes that actually exist at runtime; generated route artifacts remain projections of those declarations.

If an older planning, frontend, release, or historical document conflicts with the root implementation plan about intended public presentation or roadmap order, follow the root implementation plan. Historical documents remain evidence of prior decisions and released states, not a competing active backlog.

While an ordered roadmap is active:

- do not reuse a reserved `DEMO-###` ID for unrelated work;
- do not broaden the public browser surface, add another dashboard, or re-expose intentionally hidden internal inventories unless the root implementation plan is deliberately updated in a controlled change;
- prefer the smallest visitor-facing presentation that visibly proves the architecture while preserving valid machine contracts and canonical evidence underneath;
- update the root implementation plan when roadmap scope, order, status, or reserved IDs materially change.

## Definition of done

After every task that changes repository files, finish the delivery loop before handing the task back:

1. Account for every modified, deleted, and untracked file; preserve unrelated or user-authored work.
2. Remove only task-created temporary artifacts, then run `npm run check`, `npm run validate:migrations`, `npm run security:dependencies`, `npm run build`, and `git diff --check`.
3. Commit each intended controlled change with one permanent `DEMO-###` ID and one primary bracketed type.
4. Push the isolated branch and open a pull request. Do not push ordinary changes directly to `main`.
5. Confirm the worktree is clean before reporting completion.
6. If the controlled change implements or changes an item in the active root implementation plan, keep that plan accurate before finalizing the change.

Production is deployed only from an annotated semantic-version release tag, never from an arbitrary branch commit. See `docs/CHANGE-MANAGEMENT.md` and `docs/RELEASE-MANAGEMENT.md`.

If a required check, push, pull request, release, deployment, or live verification cannot be completed, report the exact blocker and leave all recoverable work intact.

## Cloud development contract

- Keep the full development and delivery loop reproducible from a clean cloud checkout using only the repository, its terminal commands, and authenticated service CLIs. Do not rely on local-only files, desktop UI state, or an existing working directory.
- After changing route declarations or route artifact generation, run `npm run generate:routes` and commit both `docs/ROUTES.md` and `docs/route-manifest.json` before validation.
- Keep CI failure output bounded and actionable for cloud clients: emit the failing file, line when available, and remediation command. Never print an entire generated artifact or a single-line Base64 payload into job logs.

## Architecture invariants

Preserve these invariants:

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
