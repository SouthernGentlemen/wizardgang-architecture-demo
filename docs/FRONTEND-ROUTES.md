# Frontend Information Architecture

The frontend hierarchy is owned by application route declarations. A user-facing conceptual destination is a page resource only when it has a registered route ID, one canonical pathname, and a `page` metadata block. Feature modules may refer to route IDs, but they do not own browser pathnames or maintain a second frontend inventory.

The authoritative current inventory is generated in [`docs/ROUTES.md`](ROUTES.md) and [`docs/route-manifest.json`](route-manifest.json).

## Replacement invariants

Future route work must preserve these invariants:

- every user-facing conceptual destination has exactly one canonical route ID and pathname;
- no two canonical routes present the same conceptual page;
- a query parameter may filter, search, sort, paginate or localise, and may not select the primary resource;
- primary navigation, secondary navigation, breadcrumbs, the homepage map, the sitemap, canonical links and route documentation are all projections of the same declarations;
- route counts are reported, never asserted.

## Canonical destination model

A page declaration owns both transport policy and presentation metadata. Its stable route ID is the application-level reference used by internal callers; its pathname is declared once and resolved through `routeUrl(routeId)` rather than copied into feature code.

Parent relationships are expressed as route IDs, not inferred from pathname prefixes. Index pages and their children therefore form an explicit resource hierarchy that can be validated for one root, valid parents, reachability, and cycles without creating an independent route table.

Retired aliases and retired resource-selection URLs are not compatibility routes. Unless a separate protocol endpoint intentionally retains the same pathname for a different machine contract, retired browser locations fall through the ordinary 404 with no `Location` header.

## Query-state policy

Query parameters are interaction state, not resource selectors. They may represent filters, search terms, sort order, pagination cursors, locale, or comparable state that refines one already-selected resource.

A query parameter must not choose the primary conceptual destination. A presentation that deserves independent navigation, canonical-link identity, sitemap membership, or direct sharing must be declared as its own route instead.

Stable fragments remain appropriate for record-level anchors within a page.

## Projection model

The route declarations are projected into all user-facing navigation and discovery surfaces:

- primary navigation;
- secondary navigation;
- breadcrumbs;
- the homepage architecture map;
- the sitemap;
- canonical links;
- generated route documentation and the route manifest.

These projections may report the number of registered routes they observe, but documentation and tests must not freeze a manually counted page inventory.

## Protocol and machine boundaries

Browser pages and machine contracts are separate declarations even when they demonstrate the same capability. GraphQL, MCP, identity callbacks, webhooks, laboratory APIs, reporting APIs, and operational APIs keep protocol-appropriate routes and policies. Their current IDs, patterns, methods, and source ownership are listed in the generated route artifacts and, where applicable, OpenAPI.

## Rendering model

The application has no client-side router. `src/router.ts` normalizes requests, matches the registry, enforces shared policy, and invokes the declared handler. Client scripts may enhance controls or update true interaction state, but they do not emulate application routing.
