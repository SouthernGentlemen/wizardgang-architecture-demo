# Frontend Information Architecture

The frontend hierarchy is owned by application route declarations. This document defines the target browser information-architecture contract; the authoritative current runtime inventory remains generated in [`docs/ROUTES.md`](ROUTES.md) and [`docs/route-manifest.json`](route-manifest.json).

DEMO-240 defines the task-oriented contract before any runtime route migration. This change does not itself alter registered routes.

## Task-oriented page model

A browser page route represents a distinct user task or a security/protocol boundary that requires its own browser resource. A dataset, framework, technology, renderer, registry partition, or reporting view does not justify a page route by itself.

A page declaration owns one stable route ID, one canonical pathname, its transport policy, and its presentation metadata. Feature modules may refer to route IDs, but they do not own browser pathnames or maintain a second frontend inventory.

A new page route is appropriate when moving to that location changes the user's primary task or crosses a browser-visible security/protocol boundary. Differences in data source, implementation technology, framework, renderer, or reporting perspective should normally remain inside the selected task page.

## Sections, demonstrations, and records

One task page may contain multiple independently linkable demonstrations, framework views, datasets, reporting presentations, and records. These are page content, not automatically separate page resources.

Stable sections and URL fragments are explicitly permitted for content that must be directly linkable within a task page. A demonstration or record may therefore expose a durable section or record anchor such as `/demos#graphql` or `/assurance#control-example` without receiving another page route, canonical pathname, sitemap entry, or route ID.

Fragments identify a location inside the already-selected page. They must be stable enough for durable internal links when the underlying demonstration or record is intended to be linkable. They must not be used to disguise a second application router or to create competing canonical page identities.

## Query-state policy

Query parameters are interaction state, not primary resource selectors. They may filter, search, sort, paginate, localise, or otherwise refine the task already selected by the pathname.

A query parameter must not choose the primary conceptual destination. A change that represents a genuinely different user task or browser-visible security/protocol boundary requires a page route; a change that only changes framework, dataset, technology, renderer, report, filter, search result, or sort order remains state within the current task page.

This preserves shareable filtering without recreating route selection through values such as `?view=`.

## Intended public browser structure

The target public browser information architecture is intentionally small:

- `/` — understand the project and choose a task;
- `/demos` — execute or inspect the architecture demonstrations;
- `/assurance` — review assurance posture, evidence, governance, compliance, risks, incidents, concerns, and related records;
- `/operations` — inspect operational behavior, availability, health, logs, usage/cost behavior, and operational evidence;
- `/security` — access the browser-facing security boundary, including security reporting and advisory information.

These five locations are the intended public conceptual destinations. Their internal demonstrations and records may use stable sections and fragments rather than additional public page routes.

## Hidden operational browser pages

`/admin` and `/offline` remain registered operational browser pages because they represent distinct protected/recovery boundaries. They are not part of the public navigation structure and should remain hidden from ordinary public discovery surfaces according to their declarations and policies.

## Retirement policy

Removed browser locations are retired, not aliased. A retired browser pathname falls through the ordinary application 404 with no compatibility redirect, alias route, or `Location` header.

The same rule applies to obsolete query-selected browser destinations: migration must update links and navigation rather than preserve old browser locations as compatibility entrances.

## Projection model

Route declarations remain the single source of truth for browser resources. Primary navigation, secondary navigation, breadcrumbs, the homepage task map, sitemap membership, canonical links, and generated route documentation are projections of those declarations.

Parent relationships are expressed as route IDs, not inferred from pathname prefixes. Projections may report the number of routes they observe, but documentation and tests must not freeze a manually counted route inventory.

## Protocol and machine boundaries

Machine/API/protocol routes are outside this frontend consolidation and remain unchanged. REST/JSON endpoints, OpenAPI, GraphQL, MCP, identity callbacks, webhooks, laboratory APIs, reporting APIs, operational APIs, and other non-browser contracts retain their existing route declarations, methods, policies, and source ownership unless a separate controlled change explicitly modifies them.

Browser consolidation must not move a machine contract merely because its associated demonstration is presented under `/demos`, `/assurance`, `/operations`, or `/security`.

## Rendering model

The application has no client-side router. `src/router.ts` normalizes requests, matches the registry, enforces shared policy, and invokes the declared handler. Client scripts may enhance controls, update true interaction state, or focus a fragment target, but they do not emulate application routing.

## Migration guardrail

DEMO-240 is documentation-only. Runtime route declarations, generated route artifacts, APIs, protocol endpoints, `/admin`, and `/offline` remain as they are until subsequent controlled changes implement this contract. The ordered migration is recorded in [`docs/IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md).
