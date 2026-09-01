# Interactive demo implementation specification

Status: implemented by DEMO-037 through DEMO-044 for the v0.5.0 release. This document remains the design specification; deployed evidence is recorded only by the exact-tag release and deployment records.

## Objective

Deepen seven existing demonstrations without turning the architecture companion into seven unrelated applications. Every upgraded surface follows one sequence:

1. Run a bounded demonstration.
2. Show the live technical state produced by that action.
3. Link to the exact route, Worker/API, contract or resource, test, and workflow source.
4. Explain the architecture boundary being proved.
5. Reset only the current visitor's demonstration state.

The implementation remains a Cloudflare Worker with server-rendered TypeScript and progressively enhanced browser controls. A reference implementation may use React or Hono without requiring this repository to adopt that framework. GraphiQL is the one intentional client application because an actual GraphQL IDE is part of the proof.

## Route compatibility decisions

Released routes remain canonical. The proposed `/demo/*` names are represented by the current public contract instead of creating a second URL hierarchy.

| Capability | Canonical human surface | Machine surface | Compatibility decision |
|---|---|---|---|
| R2 | `/r2` | `/__api/r2/*` | Deepen the existing route. |
| D1 | `/d1` | `/__api/d1/*`; retain `/v1/demo-records*` | Add the Users/Tasks lab without removing the current record contract. |
| i18n | `/i18n` | Server render plus local progressive enhancement | Deepen the existing route and retain Arabic/RTL. |
| WCAG | `/accessibility` | Isolated lab frame and test result JSON | Do not add `/wcag`; the released accessibility route remains canonical. |
| Git/GitHub | `/git` | `/__api/git/evidence` | Replace static assertions with fetched public evidence. |
| Webhooks | `/api#webhooks` | `/v1/webhooks/github`; `/__api/webhooks/*` | Do not restore `/webhook`; `/api/webhooks` continues to redirect to the anchor. |
| GraphQL | `/api#graphql` | `/graphql`; `/graphql/schema` | Embed GraphiQL in the existing section; `/graphql` remains the executable endpoint. |

No existing response field, method, redirect, source link, or offline-gate behavior may be removed in the same release. Additive interface changes must be reflected in `docs/ROUTES.md`, `docs/route-manifest.json`, and the applicable contract.

## Shared visitor sandbox

The live D1, GraphQL, R2, and webhook demonstrations need writes without sharing mutable data between anonymous visitors. Add one bounded visitor sandbox rather than weakening the existing bearer-protected interfaces.

- Issue `wg_demo_session=<opaque-id>.<signature>` as `Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`.
- Sign the opaque ID with a managed `DEMO_SESSION_SECRET`; never store the secret, raw cookie, IP address, or user agent in D1 or logs.
- Require an exact same-origin check on every visitor mutation.
- Scope every mutable row and uploaded object to the session ID.
- Limit each session to 10 users, 25 tasks, 10 uploads, 5 MiB per object, 20 MiB total R2 content, and 50 webhook events.
- Expire sandbox state after 24 hours. Opportunistic cleanup may delete expired D1 rows; R2 cleanup must enumerate only `uploads/<session-id>/` and delete explicit validated keys.
- Keep `/v1/demo-records*` and `/__api/r2/object` bearer authorization unchanged. New visitor-lab handlers are separate, narrowly scoped interfaces.
- Reset is idempotent. It removes only rows/objects belonging to the current signed session, recreates deterministic seed data where applicable, records a public-safe audit event, and returns a reset summary.
- When the demo is intentionally offline, all sandbox interfaces return the existing JSON `503` response and no action reaches D1 or R2.

The common action response is:

```json
{
  "requestId": "uuid",
  "operation": "d1.users.create",
  "resource": "DEMO_DB / demo-blob",
  "status": 201,
  "durationMs": 8.4,
  "rowCount": 1,
  "statement": "INSERT INTO demo_users (...) VALUES (?, ...)",
  "parameters": ["sessionId", "id", "name", "email", "role"],
  "result": {}
}
```

`statement` is a checked-in template selected by statement ID, not dynamically supplied SQL. `parameters` contains names, not session identifiers, secrets, or credential values. R2 and webhook responses use the same envelope but replace `statement` and `parameters` with safe object or verification metadata.

## Shared D1 schema

Add the next numbered migration; never edit an applied migration. The implementation may add housekeeping columns, but the following public-safe model and constraints are required.

```sql
CREATE TABLE demo_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE demo_users (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE,
  UNIQUE (session_id, email)
);

CREATE INDEX idx_demo_users_session ON demo_users(session_id, updated_at DESC);

CREATE TABLE demo_tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  assignee_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'doing', 'done')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES demo_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_demo_tasks_session ON demo_tasks(session_id, updated_at DESC);

CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('demo', 'github')),
  delivery_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  action TEXT,
  repository TEXT,
  actor TEXT,
  summary_json TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  signature_valid INTEGER NOT NULL CHECK (signature_valid IN (0, 1)),
  received_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_webhook_events_session_time
  ON webhook_events(session_id, received_at DESC);

CREATE TABLE demo_state (
  session_id TEXT NOT NULL,
  state_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, state_key),
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
);
```

`webhook_receipts` remains in place for migration and rollback compatibility until the new receiver has been released and verified. Copy its safe historical fields into `webhook_events`; do not copy raw payloads because they were intentionally never stored. `demo_control` remains the global operator-controlled online/offline state and must not be conflated with visitor `demo_state`.

Seed each new session with three fictional users and four tasks. Names, domains, repository values, and timestamps must be obviously synthetic and deterministic enough for tests.

## R2 layout

Keep actual object bytes in `DEMO_R2`; D1 stores only metadata and ownership needed for listing and cleanup.

```text
DEMO_R2 / wizardgang-demo-r2
├── documents/
│   └── architecture-demo.txt       immutable shared seed
├── images/
│   └── architecture-map.svg        immutable shared seed
└── uploads/
    └── <session-id>/
        └── <uuid>-<safe-filename>  visitor-owned, expires in 24 hours
```

Never accept an object key from the browser. The Worker derives the prefix from the verified session, creates a UUID, strips path separators/control characters from the display name, and stores the original display name only as bounded metadata. Preview only `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `text/plain`, and `application/pdf`; serve every other type as an attachment with `X-Content-Type-Options: nosniff`. SVG uploads are attachments, not inline previews.

## Shared UI components

Implement these as TypeScript HTML helpers with small colocated progressive-enhancement scripts. Avoid introducing a site-wide client framework.

| Component | Responsibility | Target source |
|---|---|---|
| `demoWorkbench` | Enforces the sequence Demo, Technical state, Architecture, Reset. | `src/ui/demo-workbench.ts` |
| `technicalState` | Renders operation, binding, endpoint, request/response, duration, and row/object count from the common envelope. | `src/ui/technical-state.ts` |
| `sourceEvidence` | Renders deterministic Route, Worker, Contract/resource, Tests, and Workflow links. | `src/ui/source-evidence.ts` |
| `resetControl` | Same-origin POST, pending state, confirmation, and focus-safe status update. | `src/ui/demo-workbench.ts` |
| `sandboxSession` | Creates/verifies the signed cookie, applies limits, and performs scoped cleanup. | `src/lib/demo-session.ts` |
| `safeGitHubClient` | Allowlisted public GitHub reads, optional managed token, cache, timeouts, and sanitized fallback states. | `src/lib/github-api.ts` |

Every workbench must be usable without a pointer, expose pending/completed/error states through an existing live region, retain focus after rerender, honor reduced motion, and fit at 320 CSS pixels without two-dimensional scrolling except inside code/table regions.

## `/d1` — Users and Tasks CRUD

### Working demonstration

Render Users and Tasks as two compact tabs implemented with buttons and an accessible tab pattern, with Users selected by default. Each table supports list, create, edit, and delete. Selecting a user filters tasks by assignee; selecting a task exposes its status and assignee. Destructive actions use a native confirmation dialog with cancel focused first.

### Interfaces

| Method | Path | Behavior |
|---|---|---|
| `GET`, `POST` | `/__api/d1/users` | List or create session-scoped users. |
| `PATCH`, `DELETE` | `/__api/d1/users/{id}` | Update or delete one session-scoped user. Deletion sets task assignees to null. |
| `GET`, `POST` | `/__api/d1/tasks` | List/filter or create session-scoped tasks. |
| `PATCH`, `DELETE` | `/__api/d1/tasks/{id}` | Update or delete one session-scoped task. |
| `POST` | `/__api/d1/reset` | Reset Users and Tasks to the session seed used by both D1 and GraphQL. |

Names are 1–80 characters, emails are normalized and validated up to 254 characters, task titles are 1–120 characters, IDs are Worker-generated UUIDs, and unrecognized JSON fields are rejected. Each handler uses parameterized statements and returns the common technical-state envelope. Optimistic UI is not used; the D1 result is authoritative.

### Live state and evidence

Beside the table show the HTTP method/path, D1 binding `DEMO_DB`, database name `demo-blob`, checked-in SQL template, parameter names, status, duration, changed row count, and sanitized result. Never echo the signed session ID.

### Source links

- Route: `src/demos/d1.ts` and `src/demos/d1-page.ts`
- Worker: `src/api/d1-lab.ts`
- Schema: the new numbered migration
- Tests: `tests/d1-lab.test.ts` and `tests/interface.test.ts`
- Workflow: `.github/workflows/ci.yml`

### Acceptance tests

- Two sessions cannot list, update, or delete each other's rows.
- Create/read/update/delete and reset work for both entities.
- Invalid fields, foreign IDs, duplicate email, limits, cross-origin writes, expired/tampered cookies, and offline state fail safely.
- The UI displays the exact statement ID/template, operation, timing, and row count returned by the Worker.
- Existing `/v1/demo-records*` tests and bearer authorization remain unchanged.

## `/r2` — Mini file manager

### Working demonstration

Provide keyboard-operable drag/drop and file-input upload, a list grouped into Documents, Images, and My uploads, and preview/download/delete actions. Only session uploads are deletable. Selecting an object opens a metadata panel containing key, display name, size, content type, ETag, uploaded time, and ownership class (`shared seed` or `this sandbox`).

### Interfaces

| Method | Path | Behavior |
|---|---|---|
| `GET`, `POST` | `/__api/r2/files` | List visible shared/session objects or accept one bounded multipart upload. |
| `GET` | `/__api/r2/files/{id}` | Stream a visible object as an inline-safe preview or attachment. |
| `DELETE` | `/__api/r2/files/{id}` | Delete one object owned by the session and its D1 metadata. |
| `POST` | `/__api/r2/reset` | Delete the session's explicit upload keys and metadata. |

`POST` accepts one multipart field named `file`; it rejects missing/ambiguous content type, empty objects, declared or measured bodies over 5 MiB, and a session total over 20 MiB. D1 metadata is written after a successful R2 put. If metadata persistence fails, delete the just-written explicit R2 key as compensation and return failure. On delete, remove R2 first and then D1 metadata; an absent R2 object is treated as idempotent success.

### Live state and evidence

Show binding `DEMO_R2`, bucket alias, operation (`list`, `put`, `get`, or `delete`), derived safe key, content metadata, HTTP status, duration, and object count/bytes. Never expose account IDs, S3 credentials, signed URLs, or the raw session prefix.

### Source links

- Route: `src/demos/r2.ts` and `src/demos/r2-page.ts`
- Worker: `src/api/r2.ts`
- Storage boundary: `src/storage/r2.ts`
- Metadata schema: `migrations/0005_capability_records.sql` plus the new migration
- Tests: `tests/r2-lab.test.ts` and `tests/security.test.ts`
- Workflow: `.github/workflows/ci.yml`

### Acceptance tests

- Upload/list/preview/download/delete/reset use the actual R2 binding in integration tests and an interface-faithful fake in unit tests.
- Key traversal, SVG/HTML inline rendering, oversized input, cross-session access, metadata compensation, object-count/byte limits, same-origin enforcement, and offline state are covered.
- Drag/drop has an equivalent file-input path and all actions are reachable by keyboard.

## `/i18n` — Instant locale laboratory

### Working demonstration

Render one representative application card with locale buttons for English, Spanish, French, German, Japanese, and Arabic. Keep Arabic because it proves the existing RTL invariant. Changing locale updates the card immediately without a full navigation, while the query string remains shareable and server rendering remains the no-script fallback.

The card includes translated heading/body/action text, a fixed reference date, decimal number, USD currency, and an item count with pluralization. Clicking or focusing an inspectable element updates a companion panel with its translation key, selected/fallback locale, resolved string, format options, plural category where relevant, and the JSON resource excerpt.

### Resource contract

- Add `fr.json`, `de.json`, and `ja.json`; preserve `en.json`, `es.json`, and `ar.json`.
- Declare all six locales and `en` fallback in `config/i18n.json`.
- Use one identical flat key set across every resource. Use i18next JSON v4 plural suffixes (`_one`, `_other`, and locale-specific categories where needed).
- Keep formatting in `Intl.DateTimeFormat`, `Intl.NumberFormat`, and `Intl.PluralRules`; do not store preformatted dates/numbers in translation files.
- Use a fixed UTC reference instant for deterministic snapshots and expose that fact in the UI.
- Missing keys resolve through English and are labeled `fallback: en` in the inspector; production locale validation must still fail CI on missing required keys.

### Source links

- Route: `src/demos/i18n.ts`
- Renderer/client behavior: `src/demos/i18n-page.ts`
- Configuration: `config/i18n.json`
- Selected resource: `src/i18n/locales/{locale}.json`
- Tests: `tests/interface.test.ts` and `scripts/validate-locales.mjs`
- Workflow: `.github/workflows/ci.yml`

### Acceptance tests

- All locales expose the same required keys and valid plural forms.
- Instant changes update `lang`, `dir`, URL state, text, date, number, currency, plural, inspector key, and selected resource link.
- Arabic still passes RTL scroll-safety tests; Japanese and English demonstrate different plural behavior; unsupported locales fall back to English.
- Reset returns to English, count `3`, and the default inspected title without touching server state.

## `/accessibility` — WCAG 2.2 before/after laboratory

### Working demonstration

Keep the page controls and explanation accessible at all times. Render the compared application inside a titled `srcdoc` frame with a strict `sandbox="allow-scripts allow-forms"` policy so intentionally broken content does not invalidate the surrounding navigation or gain parent-page access. Accessible mode is the default; Broken mode is opt-in and carries a persistent warning.

The same fictional sign-in/task dialog demonstrates these toggles individually or as a preset:

| Behavior | Accessible mode | Broken mode | Relevant criteria/pattern |
|---|---|---|---|
| Keyboard navigation | Native controls in logical order | Click-only element and disrupted order | 2.1.1, 2.4.3 |
| Focus visibility | 3 CSS-pixel token outline | Outline removed | 2.4.7, 2.4.13 |
| Focus not obscured | Focused item scrolls above sticky UI | Sticky footer fully hides focus | 2.4.11; 2.4.12 shown as enhanced guidance |
| Modal behavior | Labeled dialog, initial focus, trapped Tab, Escape, focus return | Unlabeled overlay; focus escapes | WAI-ARIA dialog pattern; 2.4.3 |
| Image alternative | Useful bounded alt text | Missing `alt` | 1.1.1 |
| Landmarks and labels | Semantic regions and explicit labels | Generic containers and unlabeled input | 1.3.1, 2.4.1, 3.3.2 |
| Target size | Controls at least 24×24 CSS px or valid spacing | Adjacent undersized controls | 2.5.8 |
| Contrast | Token pair meets AA for its text size | Known failing token pair | 1.4.3, 1.4.11 |
| Redundant entry | Previously supplied value is populated/selectable | Value must be retyped | 3.3.7 |
| Accessible authentication | Password-manager paste and non-cognitive alternative allowed | Paste blocked and puzzle required | 3.3.8; 3.3.9 shown as enhanced guidance |
| Dragging | Move buttons and keyboard alternative accompany drag | Drag is the only mechanism | 2.5.7 |
| Consistent help | Help stays in the same relative location | Help moves/disappears | 3.2.6 |

The criteria introduced in WCAG 2.2 include three AAA criteria. The public result must therefore say `WCAG 2.2 AA demonstration — uncertified`; it may describe AAA behavior as enhanced guidance but must not count that behavior toward an AA claim.

### Automated and manual evidence

Bundle `axe-core` locally inside the frame and run it only against Accessible mode, returning sanitized findings to the parent with a type-checked `postMessage` protocol. Display critical, serious, moderate, and minor counts, rule IDs, and scan time. Broken mode may show expected teaching findings, but it is not a site-conformance result. Automated output is labeled partial coverage and sits beside a checked-in manual matrix for keyboard, focus, screen-reader semantics, target sizing, accessible authentication, zoom/reflow, forced colors, and reduced motion.

### Source links

- Route: `src/demos/accessibility.ts`
- Lab renderer/behavior: `src/demos/accessibility-page.ts` and `src/ui/accessibility-lab.ts`
- Manual matrix: `docs/ACCESSIBILITY.md`
- Tests: `tests/interface.test.ts` and `tests/accessibility-browser.spec.ts`
- Workflow: `.github/workflows/ci.yml`
- Standards: W3C WCAG 2.2 and WAI-ARIA APG links from the references section below

### Acceptance tests

- Playwright keyboard tests verify modal focus entry, trap, Escape, return, visible/not-obscured focus, and non-drag alternatives.
- Axe reports zero critical/serious violations in Accessible mode at desktop and 320 CSS-pixel widths; test failures include the actual rule IDs.
- The known Broken preset produces the expected deterministic teaching findings without disabling the parent page's controls.
- Reset restores Accessible mode, closes dialogs, clears form state, returns focus to the mode control, and reruns the accessible scan.

## `/git` — Public source-control evidence

### Working demonstration

Render live cards for the default branch, latest non-default branch when one exists, five commits, one open PR, one recently merged PR, recent Actions runs, tags, and latest release. Every item links to the corresponding GitHub page, object, workflow, or run. Missing data is an explicit empty state; an unavailable API is `Evidence unavailable`, never fabricated data.

Display the delivery pipeline as repository evidence:

```text
Commit → Pull request → Typecheck → Unit tests → WCAG scan → Build
       → Annotated tag → Deploy → Health check → GitHub Release
```

Only show `Protected`, `PR required`, `CI required`, `signed commits`, `linear history`, or `force push blocked` when the GitHub ruleset/branch-protection response available to the Worker proves that setting. Otherwise show `Not publicly verifiable` with a link to the repository-owned change policy.

### Interface

`GET /__api/git/evidence` accepts no repository parameter. It derives the allowlisted owner/repository from `GITHUB_REPO_URL`, uses public GitHub APIs with an optional managed `GITHUB_READ_TOKEN`, applies a short timeout, sanitizes fields, caches successful responses for 60 seconds, and returns per-card freshness and partial-failure state. The token is never forwarded, logged, or returned.

### Source links

- Route: `src/demos/git.ts` and `src/demos/git-page.ts`
- GitHub client: `src/lib/github-api.ts`
- Change policy: `docs/CHANGE-MANAGEMENT.md`
- Tests: `tests/git-evidence.test.ts`
- CI workflow: `.github/workflows/ci.yml`
- Deploy workflow: `.github/workflows/deploy.yml`

### Acceptance tests

- Fixtures cover open/merged PRs, no feature branches, no release, API rate limit, partial Actions failure, protected/unverifiable branch, timeout, and sanitized upstream errors.
- Every rendered commit, branch, PR, run, tag, and release link stays under the configured public repository/API origins.
- The page makes no control assertion not present in the evidence response.
- Reset is a `Refresh evidence` action that clears only the browser view and refetches; it performs no GitHub mutation.

## `/api#webhooks` — Verified live delivery

### Working demonstration

`Send demo webhook` shows the complete bounded path: Worker creates a synthetic GitHub-shaped event, signs the exact body server-side, receiver verifies HMAC-SHA256, validates headers/body, records a safe event summary and digest in D1, notifies the live viewer, and responds `202`. A delivery card shows accepted/rejected state, event, delivery ID, digest, timestamp, and each completed stage. Raw request bodies are never persisted or displayed.

The real GitHub receiver uses `X-Hub-Signature-256`, `X-GitHub-Event`, and `X-GitHub-Delivery` with a managed `GITHUB_WEBHOOK_SECRET`. Keep the current demo-signature endpoint during migration.

### Interfaces

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/v1/webhooks/github` | Verify and accept configured GitHub webhook traffic. |
| `POST` | `/__api/webhooks/demo` | Create a synthetic delivery and send it through the same verifier/storage path. |
| `GET` | `/__api/webhooks/events?after={id}` | Bounded polling fallback for safe recent summaries. |
| `GET` | `/__api/webhooks/stream` | Same-origin event stream coordinated by `DEMO_COORDINATOR`. |
| `POST` | `/__api/webhooks/reset` | Remove only synthetic events from the current session. Real GitHub evidence is retained by policy. |

Verify the signature against the raw bytes before parsing JSON. Accept only allowlisted GitHub event types needed by the demo (`ping`, `push`, `pull_request`, `workflow_run`, `release`), validate the minimal shape for the selected type, reject replay through unique delivery ID, return quickly, and cap input at 64 KiB. Persist only allowlisted summaries plus the SHA-256 digest. Invalid-signature logging contains request ID, provider, event header, and rejection reason—not headers, body, signature, secret, or private repository data.

### Source links

- Section: `src/demos/api.ts` and `src/demos/webhook-console.ts`
- Worker: `src/api/webhooks.ts`
- Event contract: `contracts/webhooks/events.json`
- Schema: the new numbered migration
- Tests: `tests/webhooks.test.ts` and `tests/integration-interfaces.test.ts`
- Workflow: `.github/workflows/ci.yml`

### Acceptance tests

- Valid GitHub and synthetic signatures succeed; altered body, wrong/missing signature, malformed/oversized payload, replayed ID, unsupported event, and expired session fail safely.
- Two sessions see only their synthetic events. Real repository events are visible only when their repository matches `GITHUB_REPO_URL` and their summary is public-safe.
- The live stream reconnects with last event ID and falls back to bounded polling without losing accepted deliveries.
- Reset cannot remove real GitHub events.

## `/api#graphql` — GraphiQL over the D1 lab

### Working demonstration

Embed a locally bundled GraphiQL IDE in the GraphQL section, preloaded with `users`, `user(id)`, `createUser`, `updateUser`, and `deleteUser` examples. It posts only to same-origin `/graphql`, shows response headers/timing, and links to the served schema. The D1 route and GraphiQL use the same session-scoped `demo_users` rows; creating a user in one surface becomes visible after querying the other.

Use current GraphQL Yoga with the Cloudflare Modules/Fetch API integration for parsing, validation, execution, GraphiQL support, and masked errors. Do not emulate GraphQL by regular-expression parsing. Bundle GraphiQL locally so the existing `connect-src 'self'` policy remains valid; do not load executable code from a CDN.

### Schema additions

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole!
  createdAt: String!
  updatedAt: String!
}

enum UserRole { ADMIN MEMBER VIEWER }

input CreateUserInput { name: String!, email: String!, role: UserRole! }
input UpdateUserInput { name: String, email: String, role: UserRole }

type Query {
  demoRecords(namespace: String): [DemoRecord!]!
  users: [User!]!
  user(id: ID!): User
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}
```

Keep `demoRecords` for backward compatibility. User resolvers call the same repository/service functions as `/__api/d1/users`; they do not duplicate SQL. Mutations require the signed visitor sandbox and exact same-origin checks. Apply a 16 KiB body limit, parsed-document depth limit 8, field-count limit 50, disabled batching, no schema mutation through variables, and masked unexpected errors with a request ID. Introspection remains enabled because inspectability is the point of this public demo.

### Source links

- Section: `src/demos/api.ts` and `src/demos/graphql-console.ts`
- Worker: `src/api/graphql.ts`
- Schema: `contracts/graphql/schema.graphql`
- Shared D1 repository: `src/lib/demo-users.ts`
- Tests: `tests/graphql.test.ts` and `tests/contracts.test.ts`
- Workflow: `.github/workflows/ci.yml`

### Acceptance tests

- REST-lab create → GraphQL query and GraphQL mutation → D1-lab list prove the same rows.
- Session isolation, validation errors, unknown IDs, duplicate email, body/depth/field limits, batching rejection, same-origin mutation, offline state, and masked internal errors are covered.
- Existing `demoRecords` queries keep their response shape and authorization behavior.
- The embedded IDE loads with no third-party runtime requests and is keyboard operable at 320 CSS pixels.
- Reset calls the shared `/__api/d1/reset` behavior and refreshes both surfaces.

## Source evidence matrix

The `sourceEvidence` component renders these labels in this order. A missing file is an implementation failure, not a hidden link.

| Surface | View route | View Worker | View contract/resource | View tests | View workflow |
|---|---|---|---|---|---|
| `/d1` | `src/demos/d1-page.ts` | `src/api/d1-lab.ts` | next D1 migration | `tests/d1-lab.test.ts` | `.github/workflows/ci.yml` |
| `/r2` | `src/demos/r2-page.ts` | `src/api/r2.ts` | `src/storage/r2.ts` | `tests/r2-lab.test.ts` | `.github/workflows/ci.yml` |
| `/i18n` | `src/demos/i18n-page.ts` | `src/demos/i18n-page.ts` | selected locale JSON | `tests/interface.test.ts` | `.github/workflows/ci.yml` |
| `/accessibility` | `src/demos/accessibility-page.ts` | `src/ui/accessibility-lab.ts` | `docs/ACCESSIBILITY.md` | `tests/accessibility-browser.spec.ts` | `.github/workflows/ci.yml` |
| `/git` | `src/demos/git-page.ts` | `src/lib/github-api.ts` | `docs/CHANGE-MANAGEMENT.md` | `tests/git-evidence.test.ts` | `.github/workflows/deploy.yml` |
| `/api#webhooks` | `src/demos/webhook-console.ts` | `src/api/webhooks.ts` | `contracts/webhooks/events.json` | `tests/webhooks.test.ts` | `.github/workflows/ci.yml` |
| `/api#graphql` | `src/demos/graphql-console.ts` | `src/api/graphql.ts` | `contracts/graphql/schema.graphql` | `tests/graphql.test.ts` | `.github/workflows/ci.yml` |

## Delivery slices

Each slice receives its own permanent `DEMO-###` ID, branch, pull request, validation evidence, and rollback notes. Do not combine the schema/session security boundary with all page work in one change.

1. **Visitor sandbox and schema** — session signing, limits, migration, seeded Users/Tasks repository, reset, unit/security tests.
2. **D1 workbench** — CRUD interface, technical state, D1 source evidence, interface tests.
3. **GraphQL workbench** — Yoga execution, additive schema, local GraphiQL bundle, shared repository integration, limits/tests.
4. **R2 workbench** — mini file manager, R2/D1 compensation, preview/download security, cleanup/tests.
5. **i18n workbench** — French/German/Japanese resources, instant switching, inspector, locale validation/tests.
6. **WCAG laboratory** — isolated comparison, axe, manual matrix, Playwright keyboard/viewport tests.
7. **Webhook workbench** — GitHub verification, safe event summaries, coordinated live update, demo/reset/tests.
8. **Git evidence** — allowlisted cached client, evidence cards/links, unverifiable states, fixtures/tests.
9. **Cross-demo hardening** — shared evidence rail, offline behavior, responsive/a11y/security regression, documentation and release evidence.

For every slice run the repository delivery loop in `AGENTS.md`. Production verification occurs only after an annotated semantic-version release tag; a branch preview is not production evidence.

## System acceptance criteria

- All seven surfaces follow Demo → Technical state → Source evidence → Architecture → Reset.
- D1 and GraphQL visibly operate on the same session-scoped users.
- GitHub delivery visibly flows GitHub/demo sender → verified webhook → D1 event → live viewer.
- R2 stores real bytes; D1 stores only object metadata. Durable Objects coordinate live webhook delivery; they do not replace D1 history.
- No visitor can observe or mutate another visitor's D1 rows, R2 keys, or synthetic webhook events.
- Existing public URLs and contracts remain valid, including retired-route redirects.
- All code/data source links are deterministic and public; all external-state failures are honest, timestamped states.
- The accessible mode has zero axe critical/serious findings in CI, plus passing manual/keyboard evidence. The site continues to say `WCAG 2.2 aligned/demonstration — uncertified`.
- No secret, credential-bearing header, raw webhook body, private repository metadata, signed session value, IP address, or user agent reaches D1 logs or public output.
- `npm run check`, migration validation, dependency audit, Worker build, browser accessibility checks, and `git diff --check` pass before review.

## Canonical upstream references

- Cloudflare R2: [Upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/) and [Workers API usage](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- Cloudflare D1: [Build a Comments API](https://developers.cloudflare.com/d1/tutorials/build-a-comments-api/) and [D1 examples](https://developers.cloudflare.com/d1/examples/)
- i18next/react-i18next: [Step-by-step guide](https://react.i18next.com/latest), [pluralization](https://www.i18next.com/translation-function/plurals), and [formatting](https://www.i18next.com/translation-function/formatting)
- W3C WAI: [What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), and [Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- GitHub: [Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule) and [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
- Cloudflare webhooks: [Webhooks](https://developers.cloudflare.com/agents/communication-channels/webhooks/)
- GraphQL Yoga: [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)
