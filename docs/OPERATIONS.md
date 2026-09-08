# Operations

Operations is a registry-owned domain with separately declared browser resources and machine contracts. Availability, diagnostics, usage/cost presentation, reporting, documentation, administration, and offline recovery all derive their location and policy from route declarations rather than a hand-maintained operations URL table.

The current route IDs, pathnames, methods, offline policy, source ownership, and documentation links are generated in [`docs/ROUTES.md`](ROUTES.md) and [`docs/route-manifest.json`](route-manifest.json).

## Browser model

The operations index and its child resources are canonical destinations. Navigation is projected from page metadata; page selection is never expressed through a `view` query parameter.

Query parameters remain valid for interaction state such as log filters, reporting filters, page size, search, sorting, and signed pagination cursors. Retired resource-selection query forms are not aliases and return the ordinary 404.

## Guided overview presentation

The operations index teaches five capabilities: availability, public-safe logging, cost resilience, unified reporting, and traceable implementation. Its live status strip remains first, followed by instructional cards, a runtime-to-evidence reading sequence, and live operational results. The sequence explains how to inspect the architecture; it is not a serial telemetry pipeline.

The presentation pattern is **explanation → demonstration → result → evidence → source**. Cards link to existing child resources through route IDs. Runtime details and operational policy use native disclosure controls. **Inspect evidence** opens the existing Reports resource, which continues to own the full registered collection and record browser. Implementation sources remain available at the end of the overview.

This is a presentation contract, not a second route, capability, or reporting registry. Health, logs, availability, telemetry states, source links, and reporting authorization remain owned by their existing implementations. Other operations child pages can adopt the same sequence in subsequent changes.

## Machine contracts

Operational APIs remain separate declarations from browser pages. Their route IDs include the health, version, public-safe log, synthetic budget, and reporting contracts documented by the generated route artifacts and OpenAPI where applicable.

The browser presentation may link to machine contracts when raw JSON is useful, but it does not own a second endpoint inventory.

## Health and availability

The health declaration reports whether the Worker and required dependencies can serve the demo. It remains available according to its registered offline policy so operators and automation can observe and recover the system.

The availability browser resource interprets the same operational evidence rather than defining an independent health contract. It explains stored observations and planned versus unexpected failures, then leads with the timeline, latest stored state, and measured results. Timestamp, latency, and classification tables remain available under **Inspect observations**, including the full retained window. Event counts classify observations rather than distinct incidents; percentages describe the stored sample window and do not constitute an SLA.

## Version

The version declaration returns deployed package and source identity metadata used by operators and release verification. It is operational metadata, not a release action.

## Logs

The public log API returns the disclosure-safe application log projection. Log records are sanitized before they cross the public HTTP boundary and retain bounded request and cache behavior.

The browser log resource consumes the same operational data instead of maintaining an independent API. It introduces structured events, sanitized telemetry, and traceability, then shows up to three distinct source/event pairs from the current bounded query, newest first. The preview uses real stored records and inherits the active filters; it never fabricates sample events. **Open log explorer** reveals the existing filters, all returned rows, structured detail, and matching JSON link. Requests containing log filter or limit parameters open the explorer automatically. Implementation and redaction sources remain available after the explorer.

## Usage and cost

Usage reporting uses the canonical reporting contract and normalized provider observations. Provider credentials and raw private provider payloads are never returned to the browser.

The usage service remains responsible for acquisition, observation windows, freshness, normalization, and safe cache behavior. The browser resource is only a presentation over that contract.

The synthetic budget action remains a demonstration and must not be treated as billing authorization or a real provider charge operation.

## Offline behavior

Offline reachability comes from route metadata, not a hardcoded path list in the central router.

When the demo is intentionally offline, declarations marked available remain reachable according to policy, ordinary gated APIs return structured `503` responses, and ordinary browser pages use the registered offline experience.

## Cache, crawler, authorization, and disclosure

Operational machine responses use the cache behavior declared by their route or response contract. Sensitive or operator data is never made publicly cacheable merely because a route is public.

Operational APIs deny indexing. Public browser resources remain governed by the global crawler-control state.

Public operational data is disclosure-safe. Protected administration remains separately authorized. Provider credentials, internal secrets, private infrastructure identifiers, and payment data are never serialized into public operations responses.

## Route ownership

Operational declarations live under the routing capability modules. The central router performs only normalization, global security/crawler processing, registry matching, shared policy enforcement, handler invocation, and safe error handling.

Adding a compatible operational route requires a declaration with method, authorization, offline, cache, crawler, documentation, source, and handler metadata; it must not add path-specific dispatch logic to `src/router.ts`.

## Validation

Relevant validation includes operational route-registry tests, operations behavior tests, dead-route tests, generated route-artifact tests, and the complete `npm run check` chain.
