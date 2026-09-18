# Release Operations Hardening Implementation Plan

Status: **Active**

Scope: post-v0.24.0 hardening of the release, deployment, secret, repository, and monitoring operations that the v0.24.0 release depended on without checking, plus the accessibility and evaluation-harness defects found while validating and verifying it.

This file is the active planning source of truth for DEMO-294 through DEMO-306. Runtime route declarations, `assurance/registry.json` and its registered schemas, and permanent contract documents remain authoritative for shipped behavior. Retire or delete this plan after the sequence is released and its durable requirements have been absorbed by permanent contracts and tests.

## Context

v0.24.0 released DEMO-282 through DEMO-293. It was tagged at 2026-09-17 21:40 EDT on merge commit `7a7fcda` and deployed by Release run 35296310582. The release succeeded, but only because steps that nothing in the repository checks were caught by hand:

- DEMO-291 made `IDENTITY_AUDIT_HMAC_SECRET` mandatory for identity. It had not been provisioned when DEMO-293 merged.
- The first attempt to provision it used the interactive `wrangler secret put` prompt and stored a three-character value. The prompt echoed three mask characters and wrangler reported success, but v0.24.0 would have treated the value as missing.
- The Release workflow would have reported success in either case.

The release operator replaced the value with a generated 64-character secret before pushing the tag. Validating and verifying the release also surfaced:

- a monitor that has never passed;
- a retired credential that is still provisioned;
- deployment records that stopped at v0.7.0;
- an unprotected `main`;
- two accessibility defects, and a harness race that hides one of them.

Measured against deployed v0.24.0 (`7a7fcda`):

| Observation | Value |
|---|---|
| Worker secret names provisioned in production | `18`, including `DEMO_API_TOKEN`, which nothing has read since DEMO-187 |
| Release-pipeline checks that read Worker secrets or identity readiness | `0` |
| Identity providers configured before and after deployment | Microsoft Entra ID (OpenID Connect), Google, GitHub; SAML not configured |
| Deployment records in `docs/history/DEPLOYMENTS.md` | `8`; the last is DEP-DEMO-008 for v0.7.0 (2026-09-01) |
| Releases without a deployment record | `29`, v0.8.0 through v0.24.0 |
| Assurance Monitor scheduled runs since it was added on 2026-09-03 | `15`, all failed with `/security returned 403` |
| Branch protection and rulesets on `main` | none; `0` rulesets; all three merge methods allowed; merged head branches not deleted |
| Merged head branches left on origin after v0.24.0 | `11`, demo-283 through demo-293 |
| Node or npm version declared by the repository | none; each workflow pins Node 22 separately |
| Last `CHANGELOG.md` entry | 0.20.0; all `42` tags have release records |
| WCAG 2.2 results at v0.24.0 | `47` pass · `20` partial · `1` gap (1.4.10) · `18` N/A |

### v0.24.0 deployment evidence

Recorded during release verification for DEMO-295 to cite:

- Annotated tag `v0.24.0`, created 2026-09-17 21:40:54 −04:00 on merge commit `7a7fcda1c058540c82c888f5cd1489de153b68e9` (PR #246).
- Release run 35296310582 succeeded. The reproduce job (105449447121) ran from 01:40:59 to 01:43:18 UTC on 2026-09-18, and the deploy job (105449911434) from 01:43:23 to 01:45:52 UTC. The GitHub Release was published at 01:43:15 UTC with `registry-v0.24.0.json`, and migration 0013 was applied to production D1.
- `IDENTITY_AUDIT_HMAC_SECRET` was provisioned before the tag push with a generated 64-character value.
- Post-deployment checks:
  - `/api/operations/version` reported 0.24.0 at `7a7fcda`, and the Worker was operational.
  - `/`, `/security`, `/demos`, and `/assurance` returned 200 in English and Arabic, and `/operations` returned 404 without a `Location` header.
  - `/api/demos/d1` returned no localization placeholder in any of the six locales. The D1 Users table showed email addresses in Arabic.
  - The record presentation route returned 200 for `ISO27001-A.5.19`, `ISO42001-A.9.4`, and `WCAG-2.4.7`, and 404 for an unknown record. In a browser, `/assurance#ISO42001-A.9.4` (English) and `/assurance?lang=ar#WCAG-2.4.7` selected their records, with every link pinned to `7a7fcda`.
  - The three retired governance laboratory paths returned 404 without a `Location` header.
  - `/api/operations/logs?source=identity` returned 31 entries, none with detail.
  - `/auth/session` still reported Microsoft Entra ID, Google, and GitHub as configured.

## Product goal

A release should fail before it reaches production when a prerequisite is missing. It should verify what it deployed, including the parts that do not show up in a health check, and leave a record that says what was deployed and how it was verified. The repository enforces the release rules it already writes down, and its monitors report failures to someone.

## Findings this sequence closes

Findings are grouped by class:

- `RELEASE`: a release or deployment step that nothing checks or records.
- `SECRET`: a credential whose presence, strength, or purpose nothing verifies.
- `DRIFT`: documentation that disagrees with the code.
- `DEFECT`: a live defect.
- `MONITOR`: a monitor that fails without anyone noticing.
- `CONTROL`: a written rule that the platform does not enforce.
- `HARNESS`: an evaluation harness that measures less than it reports.

### RELEASE — the pipeline cannot see what a release depends on

- **F1.** Nothing ties a new Worker secret to the deployment that needs it. DEMO-291 (PR #244) requires `IDENTITY_AUDIT_HMAC_SECRET` for identity. Release preparation found it absent with `wrangler secret list`. `deploy.yml` verifies only `/api/operations/version` and `services.worker` from `/api/operations/health`. With the secret missing, `identityProviderConfiguration()` reports every provider unconfigured, while health still reports the Worker operational.
- **F2.** Provisioning a secret is manual and unchecked. The interactive prompt accepted a three-character value, and wrangler reported success. The running v0.23.0 ignored it, and v0.24.0 would have treated it as missing, because `identityAuditSecret()` requires at least 32 UTF-8 bytes. No command generates a compliant value, and nothing reports a short one. Only the provider readiness on `/auth/session` would have shown it.
- **F3.** Deployment records stopped at DEP-DEMO-008 (v0.7.0, 2026-09-01). None of the 29 releases from v0.8.0 through v0.24.0 has one. `docs/RELEASE-MANAGEMENT.md` nonetheless ends its flow in a deployment record and identifies rollback targets by it, and MON-001 in `MONITORING-MEASUREMENT-EVALUATION.md` compares deployed identity against it.
- **F4.** The Release workflow publishes GitHub Release notes from `origin/main:docs/releases/$TAG.md`, not from the tag. Yet production identity comes from the immutable tag.
- **F5.** Two release rules are undefined. First, the release date is written when the release change is authored, but the tag is created after merge. v0.24.0's record says 2026-09-17, which was the local date, while in UTC it was merged and tagged on 2026-09-18. Second, nothing governs a rollback past a `SEC` change. v0.24.0's rollback target is v0.23.0, which is data-compatible but would resume, for new activity, the identity exposure that DEMO-291 closed.
- **F6.** The toolchain is not pinned. There is no `engines`, `packageManager`, `.nvmrc`, or `.node-version`. All five workflows (CI, Release, Deploy, the Assurance Monitor, and the Git demo) pin Node 22, each in its own file. A local release candidate ran on Node 26.7.0 with npm 11.19.0, whose install-script gate skipped the `workerd`, `esbuild`, and `fsevents` install scripts.

### SECRET and DRIFT — credentials and documentation that no longer match the code

- **F7.** A retired credential is still provisioned. DEMO-187 (`6059488`, 2026-09-07) removed `DEMO_API_TOKEN` from the code, `.dev.vars.example`, `SECURITY.md`, and the cryptography register, but the production Worker still holds it. Nothing reads it:
  - bearer authentication in `authorize()` accepts only identity-derived visitor tokens;
  - the only other `Authorization` reader is `/admin` Basic authentication.

  `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md` §8 forbids credentials left enabled without a defined use. No inventory ties the provisioned secret names to the code that reads them. CFG-014 in the configuration register is partial, and CFG-028 (automated provider drift) is a gap.
- **F8.** The documentation describes an operator bearer credential that no longer exists:
  - `SECURITY.md` says REST writes accept "the managed operator bearer credential";
  - `ASSET-ACCESS-ACCEPTABLE-USE.md` says protected writes use "managed operator bearer credentials";
  - the `/auth/authorize` policy text in `src/api/identity.ts` says only that credential "can address a caller-selected namespace".

  Every authenticated principal now carries a visitor sandbox namespace, so the `caller-selected` branch in `namespaceFor()` and `publicPrincipal()` (`src/api/records.ts`) appears unreachable.
- **F9.** `CHANGELOG.md` stops at 0.20.0, and its `Unreleased` section is empty. v0.21.0 through v0.24.0 shipped without entries. The release records under `docs/releases/` cover all 42 tags.

### DEFECT — live defects

- **F10.** Identity endpoints assume the audit secret exists whenever a session exists. If it is missing or too short:
  - `identityHmac()` throws `identity_audit_not_configured`, and `errorResponse()` in `src/lib/http.ts` re-throws anything that is not an `HttpError`;
  - so `/auth/token` and `/auth/authorize` end in an unhandled exception;
  - `identityLogoutResponse()` revokes the session and then throws before it sends the cookie-clearing response.
- **F11.** WCAG 1.4.10 Reflow is a recorded gap. At 320 CSS pixels, the `/demos` D1 presentation is about 334 px wide, because its two table-tab controls keep 145 px minimum widths.
- **F12.** Repeated link text leads to different destinations, which fails WCAG 2.4.9 (Link Purpose, Link Only):
  - Every `/assurance` record pane renders one "Open location" and one "Open evidence record" per evidence item, and one "Open documentation" per documentation reference (`src/demos/assurance-workbench.ts`). For example, WCAG-2.4.7's pane shows three of each evidence link in Arabic.
  - The Accessibility, Durable Objects, Edge, and Workers demos each render a "Route source" link beside the shell's own "Route source" link. On `/demos#edge`, for example, one points to `src/demos/edge.ts` and the other to `src/demos/demos-page.ts`.

  WCAG-2.4.9 is partial, but its gap does not name any of this.

### MONITOR — a monitor that has never worked

- **F13.** The Assurance Monitor has never passed. All 15 scheduled runs since DEMO-125 added it on 2026-09-03 failed at the live check with `https://demo.wizardgang.ai/security returned 403` on GitHub-hosted runners. The same page returns 200 to ordinary requests, and the deploy verifier reaches the host from the same kind of runner with a browser-compatible user agent. The Worker's crawler policy blocks only OpenAI agents, so the 403 most likely comes from the Cloudflare edge. Nothing alerted anyone for 15 days.

### CONTROL — rules that nothing enforces

- **F14.** `main` and the release tags are unprotected. `main` has no branch protection and no rulesets, all three merge methods are allowed, and merged head branches are not deleted. `docs/RELEASE-MANAGEMENT.md` says published tags are never moved or deleted, but nothing prevents either. ISO/IEC 27001 A.8.25 and A.8.32 stay partial on exactly this gap, as CFG-013 and WG-GOV-028 §18 record.

### HARNESS — an evaluation that can miss what it evaluates

- **F15.** The DEMO-289 content review can inventory `/assurance#WCAG-1.1.1` before its record pane loads. In CI run 35295391305, both English and Arabic captured 2 headings and 38 links for that state. A local run captured the pane in Arabic only, with 3 headings and 45 links. Every ISO state captured its pane. The review therefore sometimes misses a record pane's links, including F12, while still reporting success.

## Boundaries and non-goals

This sequence must not:

- commit, print, or log a secret value; evidence about secrets is limited to names, dates, and purposes;
- create, backdate, or simulate an operating record; retrospective deployment entries state what workflow runs show and nothing more;
- change an assurance status except where a change here produces the evidence: A.8.25 and A.8.32 in DEMO-300, and the WCAG criteria that DEMO-304 re-evaluates;
- weaken Cloudflare edge protection to make the monitor pass;
- require approving reviews that a single maintainer cannot give;
- add a public page route; `/api/operations/health` gains a field and keeps its status semantics;
- retire the `claims` collection, whose 9 records carry 23 `evidence` relationships that the permanent evidence invariant preserves; that needs an explicit decision to amend the invariant first;
- edit a historical release, deployment, SoA, or evaluation record; add a new dated record instead;
- change `/demos` or `/assurance` beyond the DEMO-304 fixes.

## Delivery sequence

Changes are sequential and should normally branch from the latest merged `main`. Do not consume a later reserved ID before the prior controlled change is merged, unless the work is intentionally stacked and its base is explicit. A change that acts on a provider (Cloudflare or GitHub) states the provider state before and after, by name, in its controlled record, and asks the owner before any destructive provider action.

### DEMO-294 — DOCS — Define release operations hardening plan

- create this active root implementation plan;
- bind `AGENTS.md` to it while it is active, including the plan-scoped secret rule;
- reserve DEMO-295 through DEMO-306;
- change no runtime, route, data, workflow, or provider configuration.

### DEMO-295 — OPS — Record the verified v0.24.0 deployment

- add DEP-DEMO-009 for v0.24.0 to `docs/history/DEPLOYMENTS.md` from *v0.24.0 deployment evidence* and Release run 35296310582;
- add one retrospective table for v0.8.0 through v0.23.0 with each release's tag, tagged commit, Release workflow run, and deploy job conclusion, taken only from the tag and GitHub Actions; mark it retrospective and state that no further post-deployment verification was recorded;
- make recording the deployment an explicit step, with its required fields, in `docs/RELEASE-MANAGEMENT.md`; a deployment record is its own controlled `OPS` change after the release is verified;
- change no runtime, workflow, or provider configuration.

Closes F3.

### DEMO-296 — SEC — Fail closed when identity secrets are missing

- when `IDENTITY_SESSION_SECRET` or `IDENTITY_AUDIT_HMAC_SECRET` is missing or shorter than 32 UTF-8 bytes, return a controlled `503` JSON error from every identity endpoint instead of an unhandled exception;
- let sign-out revoke the session and clear the cookie even when the audit identifier cannot be derived, and skip that audit event without logging a subject-derived value;
- expose identity readiness as one public-safe value on `/api/operations/health`, either ready or not configured, computed by the same checks as `identityProviderConfiguration()`, never naming a secret or its length, and without changing the health status code;
- test every identity endpoint with each identity secret missing and too short.

Closes F10.

### DEMO-297 — OPS — Verify Worker secrets before and after deployment

- declare the Worker's secrets in one checked-in inventory, for example `config/worker-secrets.json`, holding names only, never values: name, required or optional, the capability that reads it, the minimum length the code enforces, and owner;
- validate in `npm run check` that the inventory, the secret fields of `Env` in `src/types.ts`, `.dev.vars.example`, and the secret list in `SECURITY.md` agree;
- in `deploy.yml`, before migrations, compare the names from `wrangler secret list` with the inventory; fail on a missing required secret, and report provisioned names the inventory does not declare;
- after deployment, fail verification in either case:
  - identity readiness (DEMO-296) is not ready, although it was ready before the deployment;
  - a provider that `/auth/session` reported as configured before the deployment no longer is;
- add a provisioning command that generates a compliant random value and pipes it to `wrangler secret put`, so an operator never types or sees a secret value; document it in `docs/RELEASE-MANAGEMENT.md` and in §8 of `CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md`;
- a change that adds a required secret updates the inventory in the same change;
- update CFG-014 and CFG-028 in `CONFIGURATION-REGISTER.md` with what the preflight now compares, and with what it still cannot see: values and strength.

Closes F1, F2.

### DEMO-298 — SEC — Retire the orphaned operator credential

- confirm from the DEMO-297 inventory and the code that nothing reads `DEMO_API_TOKEN`; with the owner's confirmation, delete it from the production Worker; record the revocation by name and date, never by value, in `CRYPTOGRAPHY-SECRETS-REGISTER.md` and the access-class records;
- remove the `caller-selected` branch from `namespaceFor()` and `publicPrincipal()` in `src/api/records.ts` if no authenticator can produce an authenticated principal without a sandbox namespace; otherwise, document the one that can;
- correct `SECURITY.md`, `ASSET-ACCESS-ACCEPTABLE-USE.md`, and the `/auth/authorize` policy text so they describe only the credentials that exist;
- keep exploit detail out of the public record, as `SECURITY.md` requires.

Closes F7, F8.

### DEMO-299 — OPS — Restore the assurance monitor

- reproduce the 403 from a GitHub-hosted runner, and establish from the response whether the Cloudflare edge or the Worker answered: its `server`, `cf-ray`, and `cf-mitigated` headers and its body;
- fix it with the smallest change that keeps edge protection in place: either identify the monitor with a browser-compatible user agent that carries a URL, like the deploy verifier's, or add a narrowly scoped provider rule recorded in `CONFIGURATION-REGISTER.md`;
- make a failed run visible outside the Actions tab, for example by opening or updating one tracking issue on failure and closing it on recovery;
- keep every check the monitor makes, and record its first passing scheduled run as monitoring evidence.

Closes F13.

### DEMO-300 — OPS — Protect main and release tags

- add a ruleset on `main` that requires a pull request and the `validate` and `change-id` checks, and blocks force pushes and deletion; with one maintainer, require zero approving reviews rather than implying a review that does not happen;
- add a tag ruleset on `v*` that blocks update and deletion, enforcing the rule that published tags are never moved or deleted;
- allow only merge commits, which preserve the pull-request topology that `docs/CHANGE-MANAGEMENT.md` describes, and delete merged head branches automatically;
- record the settings and how they were verified in CFG-013 and WG-GOV-028 §18;
- reassess ISO/IEC 27001 A.8.25 and A.8.32 in a dated addendum under `docs/governance/assessments/`; they stay partial until an effectiveness review is recorded.

Closes F14.

### DEMO-301 — OPS — Bind release notes, dates, and rollback to the tag

- publish GitHub Release notes from the tagged commit, with `git show "$GITHUB_REF_NAME:docs/releases/$GITHUB_REF_NAME.md"`, instead of from `origin/main`;
- record a release's date the way the record already records its commit: as the annotated tag's date, with the command that reads it, so a record written before tagging cannot disagree with the tag; historical records keep their dates;
- add a rollback rule: a rollback target older than a `SEC` change must state what the rollback reinstates and needs the owner's explicit acceptance in the deployment record; prefer a forward correction;
- retire `CHANGELOG.md`, because release records under `docs/releases/` cover every tag and `docs/RELEASE-MANAGEMENT.md` requires them; update `docs/ARCHITECTURE-STANDARD.md`, `scripts/validate-governance-metadata.mjs`, and `tests/removed-routes.test.ts`.

Closes F4, F5, F9.

### DEMO-302 — BUILD — Pin the Node toolchain

- declare the supported Node and npm versions in the repository (`engines`, `packageManager`, and a `.node-version` or `.nvmrc`), matching the Node 22 the workflows use;
- make every workflow read the Node version from that file with `node-version-file` instead of repeating it;
- make `validate:ci` report a Node or npm major-version mismatch before it installs, and fail on one in CI;
- decide and document how npm's install-script approval is handled for `workerd`, `esbuild`, and `fsevents`, so `npm ci` behaves the same everywhere.

Closes F6.

### DEMO-303 — TEST — Wait for assurance record panes in the WCAG content review

- make the DEMO-289 content review wait until the selected record pane, with its heading and inspector, has rendered; use a bounded timeout that fails with the page, state, and locale;
- fail the review when an `/assurance` state's inventory lacks its record heading, instead of reporting a smaller inventory;
- keep every page, state, locale, and check from DEMO-289.

Closes F15.

### DEMO-304 — A11Y — Fix the D1 reflow gap and repeated link names

- remove the root-document horizontal overflow at 320 CSS pixels on `/demos` D1 without hiding content or controls;
- in all six locales, give repeated links accessible names that identify their destinations:
  - "Open location", "Open evidence record", and "Open documentation" carry the evidence title or documentation reference;
  - each demo's "Route source" carries its module;
- re-evaluate WCAG 1.4.10, 2.4.9, and any criterion the changes touch in a new dated evaluation record under `docs/governance/assessments/`, registered in `REFERENCE-REGISTRY.json`; leave the 2026-09-17 report unchanged; update each affected WCAG record's status, rationale, gaps, and documentation references;
- run `npm run test:site-accessibility`, `npm run validate:site-accessibility`, `npm run validate:site-i18n`, `npm run validate:locales`, and `npm run validate:wcag`.

Closes F11, F12.

### DEMO-305 — TEST — Enforce release operations acceptance

Lock the contract so this sequence cannot silently regress:

- the secret inventory, `Env`, `.dev.vars.example`, and `SECURITY.md` agree, and no secret is documented by value;
- `deploy.yml` runs the secret preflight before migrations, and checks identity readiness and provider continuity after deployment;
- with each identity secret missing or too short, every identity endpoint returns the controlled error instead of an unhandled exception, and sign-out clears the cookie;
- `/api/operations/health` reports identity readiness without naming a secret;
- the Release workflow reads release notes from the tag;
- deployment records validate against the format `docs/RELEASE-MANAGEMENT.md` defines, and v0.24.0 has one;
- the monitor's user agent and failure alerting stay as DEMO-299 left them;
- a committed baseline of the repository settings recorded in CFG-013 is checked in CI, and a documented command verifies it against the live rulesets;
- the WCAG content review fails when a record pane is missing;
- in English and Arabic, no link text on any audited page or state repeats with a different destination.

### DEMO-306 — BUILD — Release operations hardening as v0.25.0

After DEMO-295 through DEMO-305 are merged and green:

- release as `v0.25.0`, with v0.24.0 as the previous release and rollback target;
- run the DEMO-297 secret preflight before the tag is pushed, and list any new secret as a deployment prerequisite;
- move the plan-scoped secret rule into the permanent architecture invariants in `AGENTS.md`, and retire this plan;
- afterwards, record the v0.25.0 deployment under the next ID, as `docs/RELEASE-MANAGEMENT.md` requires after DEMO-295.

## Validation expectations

Every controlled change follows `AGENTS.md` and `docs/CHANGE-MANAGEMENT.md`.

At minimum, repository-changing tasks complete the standard validation loop:

- `npm run check`
- `npm run validate:migrations`
- `npm run security:dependencies`
- `npm run build`
- `git diff --check`

Further validation depends on what a change touches:

- **Workflows or validation tooling** (DEMO-297, DEMO-299, DEMO-301, DEMO-302, DEMO-303): also run `npm run validate:ci`.
- **Identity behavior** (DEMO-296, DEMO-298): also exercise a local Worker with each identity secret present, missing, and too short.
- **Accessibility** (DEMO-304): also run the accessibility and localization commands listed in that change.
- **Assurance data** (DEMO-300, DEMO-304): also run `npm run validate:assurance`, `npm run validate:assurance-summaries`, `npm run validate:governance`, and `npm run validate:wcag`, and refresh their lifecycle source approvals.
- **Provider settings** (DEMO-298, DEMO-299, DEMO-300): record the before and after state by name, never by value, and confirm it with the provider's CLI or API.

## After this sequence

This sequence makes releases check what they depend on. It does not produce the operating records that most ISO requirements are still waiting for. These still need the owner, and none has a reserved ID:

- the access review AR-001, which should cite the DEMO-297 inventory and the DEMO-298 revocation;
- the recovery test RT-001;
- the incident exercise EX-001, for which the missing-secret release is a ready scenario;
- the awareness cycle AW-001 through AW-007;
- the competence and supplier reviews;
- the first management review;
- an objective internal audit.

Other open work:

- Screen-reader and human visual testing for the 20 partial WCAG criteria remain pending.
- The future of the `claims` collection needs a decision on the evidence invariant first.
