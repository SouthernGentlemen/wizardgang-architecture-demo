# Frontend information architecture

Application route declarations are authoritative for the browser resources that exist at runtime. The generated [`docs/ROUTES.md`](ROUTES.md) and [`docs/route-manifest.json`](route-manifest.json) remain projections of those declarations.

The active target product structure and ordered consolidation roadmap are authoritative in the root [`IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md). This document records the frontend design contract and must not become a competing product roadmap.

## Task-oriented page model

A browser page route represents a distinct user task or a browser-visible security/protocol boundary that requires its own browser resource. A dataset, framework, technology, renderer, registry partition, or reporting view does not justify a page route by itself.

A page declaration owns one stable route ID, one canonical pathname, its transport policy, and its presentation metadata. Feature modules may refer to route IDs, but they do not own browser pathnames or maintain a second frontend inventory.

A new page route is appropriate when moving to that location changes the user's primary task or crosses a browser-visible security/protocol boundary. Differences in data source, implementation technology, framework, renderer, or reporting perspective should normally remain inside the selected task page.

## Sections, demonstrations, and records

One task page may contain multiple independently linkable demonstrations, framework views, datasets, reporting presentations, and records. These are page content, not automatically separate page resources.

Stable sections and URL fragments are permitted for content that must be directly linkable within a task page. A demonstration or record may therefore expose a durable section or record anchor such as `/demos#graphql` or `/assurance#traceability` without receiving another page route, canonical pathname, sitemap entry, or route ID.

Fragments identify a location inside the already-selected page. They must be stable enough for durable internal links when the underlying demonstration or record is intended to be linkable. They must not be used to disguise a second application router or create competing canonical page identities.

## Architecture demos destination

`/demos` is the single public Architecture Demos task page. The former Platform and Interfaces browser hierarchies are retired; their machine/API/protocol endpoints remain independent contracts.

Existing durable demo fragments remain valid for the underlying capabilities: `#edge`, `#workers`, `#durable-objects`, `#d1`, `#r2`, `#rest`, `#graphql`, `#webhooks`, `#identity`, `#mcp`, `#accessibility`, and `#i18n`.

The MVP presentation groups those capabilities rather than presenting all twelve as equal top-level concepts:

- Data: D1 and R2;
- APIs: REST/OpenAPI and GraphQL;
- Integrations: Webhooks;
- Identity: configured OAuth/OIDC/SAML behavior;
- AI / MCP: MCP endpoint, tools, executable proof, and concise connection guidance;
- secondary runtime proof: Edge, Workers, Durable Objects;
- secondary quality proof: Accessibility and internationalization.

Native disclosure controls and bounded client enhancement may keep advanced content collapsed until selected. Fragment handling may open/focus the referenced content, but it does not perform application routing.

## Assurance destination

`/assurance` is the single public engineering-assurance task page.

Its MVP human presentation is centered on four checks:

- security controls;
- AI boundary;
- traceability/evidence;
- accessibility posture.

Canonical risks, incidents, exercises, concerns, governance records, suppliers, objectives, framework records, and other management-system inventories may remain in their canonical data/reporting contracts without being projected into ordinary public HTML. Their existence does not create a browser navigation requirement.

## Query-state policy

Query parameters are interaction state, not primary resource selectors. They may filter, search, sort, paginate, localize, or otherwise refine the task already selected by the pathname.

A query parameter must not choose the primary conceptual destination. A change that represents a genuinely different user task or browser-visible security/protocol boundary requires a page route; a change that only changes framework, dataset, technology, renderer, report, filter, search result, or sort order remains state within the current task page.

This preserves shareable filtering without recreating route selection through values such as `?view=`.

## Target MVP browser structure

The active MVP target is intentionally smaller than the previously released five-destination frontend:

- `/` — understand the project and choose a task;
- `/demos` — execute or inspect architecture demonstrations;
- `/assurance` — verify the bounded engineering-assurance claims.

`/security` remains a narrow browser-visible support/security boundary for vulnerability reporting and advisories. It should remain reachable from the footer or contextual security links rather than primary navigation.

`/operations` is scheduled for controlled retirement from the human browser surface under the root implementation roadmap after current service state, measured availability summary, version, and commit/source identity have been projected into a compact public proof. Its machine APIs, scheduled collection, retention, bounded logs, and protected controls are not retired merely because the browser page is removed.

Until the relevant controlled change lands, the route declarations remain authoritative for the currently deployed runtime inventory.

## Hidden operational browser pages

`/admin` and `/offline` remain registered operational browser pages because they represent distinct protected/recovery boundaries. They are not part of ordinary public navigation or product discovery.

## Retirement policy

Removed browser locations are retired, not aliased. A retired browser pathname falls through the ordinary application 404 with no compatibility redirect, alias route, or `Location` header.

The same rule applies to obsolete query-selected browser destinations: migration must update links and navigation rather than preserve old browser locations as compatibility entrances.

## Projection model

Route declarations remain the runtime source of truth for browser resources. Primary navigation, secondary navigation, breadcrumbs, homepage task links, sitemap membership, canonical links, and generated route documentation should be derived from or validated against those declarations.

The root `IMPLEMENTATION_PLAN.md` is the source of truth for the intended MVP product shape and roadmap order. It does not replace route declarations as a runtime registry.

Parent relationships are expressed as route IDs, not inferred from pathname prefixes. Projections may report the number of routes they observe, but documentation and tests must not freeze a manually counted route inventory.

## Protocol and machine boundaries

Machine/API/protocol routes are outside browser presentation consolidation unless a separate controlled change explicitly modifies them. REST/JSON endpoints, OpenAPI, GraphQL, MCP, identity callbacks, webhooks, laboratory APIs, reporting APIs, operational APIs, and other non-browser contracts retain their existing route declarations, methods, policies, and source ownership.

Browser consolidation must not move or delete a machine contract merely because its associated demonstration is presented under `/demos` or `/assurance`, or because a human browser route is retired.

## Rendering model

The application has no client-side router. `src/router.ts` normalizes requests, matches the registry, enforces shared policy, and invokes the declared handler. Client scripts may enhance controls, update true interaction state, or focus a fragment target, but they do not emulate application routing.

## Active migration guardrail

The ordered MVP work is defined only in the root [`IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md). During that sequence, prefer presentation reduction, grouping, hiding, and progressive disclosure over introducing new public destinations or new dashboard surfaces.
