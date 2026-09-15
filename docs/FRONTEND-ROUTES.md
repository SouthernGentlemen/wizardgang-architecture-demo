# Frontend information architecture

Application route declarations are authoritative for browser resources that exist at runtime. The generated [`docs/ROUTES.md`](ROUTES.md) and [`docs/route-manifest.json`](route-manifest.json) are projections of those declarations. This document is the permanent browser information-architecture contract; it is not a roadmap or implementation backlog.

## Task-oriented page model

A browser page route represents a distinct user task or a browser-visible security/protocol boundary that requires its own browser resource. A dataset, framework, technology, renderer, registry partition, or reporting view does not justify a page route by itself.

A page declaration owns one stable route ID, one canonical pathname, its transport policy, and its presentation metadata. Feature modules may refer to route IDs, but they do not own browser pathnames or maintain a second frontend inventory.

A new page route is appropriate when moving to that location changes the user's primary task or crosses a browser-visible security/protocol boundary. Differences in data source, implementation technology, framework, renderer, or reporting perspective should normally remain inside the selected task page.

## Sections, demonstrations, and records

One task page may contain multiple independently linkable demonstrations, framework views, datasets, reporting presentations, and records. These are page content, not automatically separate page resources.

Stable sections and URL fragments are permitted for content that must be directly linkable within a task page. A demonstration or record may therefore expose a durable section or record anchor such as `/demos#graphql` or `/assurance#traceability` without receiving another page route, canonical pathname, sitemap entry, or route ID.

Fragments identify a location inside the already-selected page. They must not be used to disguise a second application router or create competing canonical page identities.

## Architecture demos destination

`/demos` is the single public Architecture Demos task page. Former Platform and Interfaces browser hierarchies are retired; their machine/API/protocol endpoints remain independent contracts.

Durable demo fragments include `#edge`, `#workers`, `#durable-objects`, `#d1`, `#r2`, `#rest`, `#graphql`, `#webhooks`, `#identity`, `#mcp`, `#accessibility`, and `#i18n`.

The current presentation groups those capabilities as:

- Data: D1 and R2;
- APIs: REST/OpenAPI and GraphQL;
- Integrations: Webhooks;
- Identity: configured OAuth/OIDC/SAML behavior;
- AI / MCP: MCP endpoint, tools, executable proof, and concise connection guidance;
- supporting runtime proof: Edge, Workers, Durable Objects;
- supporting quality proof: Accessibility and internationalization.

Advanced material may remain behind native disclosure controls. Fragment handling may open or focus referenced content, but it does not perform application routing.

## Assurance destination

`/assurance` is the single public engineering-assurance task page. Its ordinary human presentation is centered on four checks:

- security controls;
- AI boundary;
- traceability/evidence;
- accessibility posture.

Canonical risks, incidents, exercises, concerns, governance records, suppliers, objectives, framework records, and other management-system inventories remain in canonical data/reporting contracts rather than ordinary public HTML navigation. Their existence does not create a browser-route requirement.

## Query-state policy

Query parameters are interaction state, not primary resource selectors. They may filter, search, sort, paginate, localize, or otherwise refine the task already selected by the pathname.

A query parameter must not choose the primary conceptual destination. A genuinely different user task or browser-visible security/protocol boundary requires a page route; a framework, dataset, technology, renderer, report, filter, search result, or sort choice remains state within the selected task page.

## Current browser structure

The ordinary public product is intentionally small:

- `/` — understand the project and choose a task;
- `/demos` — execute or inspect architecture demonstrations;
- `/assurance` — verify bounded engineering-assurance claims.

`/security` is a contextual support/security boundary for vulnerability reporting and advisories. It is reachable from footer or contextual security links rather than primary product navigation.

The former `/operations` browser page is retired by DEMO-259. It is not a canonical page, navigation destination, sitemap member, homepage action, discovery entry, redirect, or alias. Requests for that pathname, including query-string variants, fall through the ordinary application 404. Operational machine APIs, scheduled collection, 365-day retention, bounded logs, protected controls, and compact homepage proof remain independent of that retirement.

## Hidden operational browser pages

`/admin` and `/offline` remain registered operational browser pages because they represent protected and recovery boundaries. They are not ordinary product navigation destinations.

## Retirement policy

Removed browser locations are retired, not aliased. A retired browser pathname falls through the ordinary application 404 with no compatibility redirect, alias route, or `Location` header. Migration updates internal links rather than preserving old browser locations as compatibility entrances.

## Projection model

Route declarations remain the runtime source of truth. Primary/secondary navigation, breadcrumbs, homepage task links, sitemap membership, canonical links, and generated route documentation should be derived from or validated against those declarations.

Parent relationships are expressed as route IDs, not inferred from pathname prefixes. Projections may report the number of routes they observe, but documentation and tests must not freeze a manually counted route inventory.

## Protocol and machine boundaries

REST/JSON endpoints, OpenAPI, GraphQL, MCP, identity callbacks, webhooks, laboratory APIs, reporting APIs, operational APIs, and other non-browser contracts retain their own route declarations, methods, policies, and source ownership. Browser consolidation must not move or delete a machine contract merely because its demonstration is presented under `/demos` or `/assurance`, or because a human browser route is retired.

## Rendering model

The application has no client-side router. `src/router.ts` normalizes requests, matches the registry, enforces shared policy, and invokes the declared handler. Client scripts may enhance controls, update interaction state, or focus a fragment target, but they do not emulate application routing.

## Change guardrail

Prefer presentation reduction, grouping, hiding, and progressive disclosure over introducing another public destination or dashboard. Short-lived implementation sequencing belongs in the controlled change or pull request rather than a permanent implementation-plan document.
