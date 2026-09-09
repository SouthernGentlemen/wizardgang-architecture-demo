# Operations acceptance — DEMO-207

Verified on 2026-09-08 against the DEMO-201–206 implementation, based on `c2c4c8a`.
This is local acceptance evidence; production deployment and accessibility certification are outside this result.

## Results

| Area | Result and evidence |
| --- | --- |
| Six-page journey | Overview, Availability, Logs, Usage & cost, Reports, and Documentation returned HTML successfully and retained section navigation and route-source links. New router-level regression runs the journey both online and during planned maintenance. |
| Keyboard disclosure | In the local browser, Enter opened runtime details, operational policy, observations, the log explorer, and the reporting explorer. Space closed runtime details. These use native summary/details controls. |
| Mobile layout | All six pages had document scroll width equal to viewport width at 320px and 390px. Open observation, log, and reporting disclosures also fit at 320px. Mobile screenshots were visually inspected; section navigation scrolls within its own strip. Documentation's long heading wraps at 320px. |
| Desktop layout | All six pages fit a 1280px viewport; overview and documentation layout were inspected. |
| Empty and unavailable states | Fresh local D1 showed awaiting observations and no logs. Provider billing displayed unavailable separately from operational application health. Existing passing tests cover maintenance/failure history, missing databases, partial/stale telemetry, valid zero activity, and unavailable cost. |
| Evidence drill-down | Browser selection and Next page navigation retained the open reporting explorer at 320px. New regression follows a real signed cursor, checks ten different records on the next page, preserves family/limit, and verifies the canonical evidence source URL. Fragment regression executes the rendered script for initial navigation, hash changes, nested disclosures, and malformed encoding. |
| Guardrail and logging behavior | Existing passing regression tests retain Normal/Warning/Degraded and recovery behavior, optional-compute gating, representative events, filters, structured details, and public-safe telemetry. |

## Reproduce

From a clean checkout:

```sh
npm ci
npm run validate:migrations
npm run dev -- --port 8797
```

Open `/operations` on the local server, then follow each section link. At 320px,
390px, and desktop width, check text, cards, navigation, and opened disclosures.
Use Tab to reach summaries and Enter/Space to toggle them. On Reports, select
evidence, follow Next page, and inspect its canonical source link. An empty local
database and unconfigured Cloudflare billing expose the empty/unavailable states.
Use the automated fixtures for populated, maintenance, failure, and telemetry states.

Run the targeted regression with:

```sh
npx vitest run tests/operations-acceptance.test.ts --maxWorkers=2 --minWorkers=1
```

## Required checks

- `npm run check`: passed; 497 tests across 83 files, plus route validation and the remaining repository validators. Vitest concurrency was bounded with `VITEST_MAX_THREADS=2 VITEST_MIN_THREADS=1 VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1`.
- `npm run validate:migrations`: passed against fresh local D1.
- `npm run build`: passed (dry run).
- `git diff --check`: passed.
- `npm run security:dependencies`: **blocked**, exit 1; five pre-existing dependency findings (two moderate, three high). Vitest/mocker is affected by GHSA-82fw-gwwq-j7x9; Wrangler/Miniflare/Sharp by GHSA-rgj7-g3m4-5g8c. The audit proposes breaking toolchain changes. Dependencies are unchanged by this acceptance task.

The functional acceptance checks passed. The required dependency audit must be
resolved before treating the delivery as fully green. Browser checks used the local
in-app browser, not a cross-browser or assistive-technology certification suite.

## Release follow-up — DEMO-208

The release preparation updates Vitest and Wrangler and overrides transitive Sharp
with the patched 0.35.4 line. The dependency audit now reports zero vulnerabilities.
The historical DEMO-207 audit failure above is retained as evidence of the original
acceptance run; the release PR and exact-tag workflow revalidate the updated toolchain.
