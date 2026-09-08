# Interactive demonstration specification

This document describes the interaction model of the architecture demo. Route declarations, the generated route manifest, OpenAPI, and the implementation remain authoritative when extending a capability.

## Browser topology

The browser topology is a declared resource hierarchy, not a fixed pathname list. Each user-facing conceptual destination has one route ID, one canonical pathname, and page metadata describing its parent, label, summary, ordering, navigation membership, and architecture-map membership.

Platform, Interfaces, Assurance, Operations, and Security are application domains expressed through those declarations. Index resources group related child resources, while cross-domain relationships are represented by navigation metadata rather than copied URL lists.

Query parameters refine a selected resource through filters, search, sorting, pagination, locale, or comparable interaction state. They do not select the primary page. Retired resource-selection query forms and retired aliases remain ordinary unknown paths.

The current browser inventory is generated in [`docs/ROUTES.md`](ROUTES.md) and [`docs/route-manifest.json`](route-manifest.json); this specification intentionally does not restate it.

## Routing contract

`src/routing/application-routes.ts` composes capability-owned declarative route modules. `src/routing/registry.ts` provides the generic matcher. `src/router.ts` performs normalization, matching, common policy enforcement, and handler invocation; it does not dispatch by application pathname or prefix.

The same declarations project generated route documentation, route-manifest records, navigation metadata, breadcrumbs, architecture-map membership, canonical links, and sitemap membership. OpenAPI operations identify their owning declaration with `x-route-id`.

A route change is incomplete until route and OpenAPI generation produce matching checked-in artifacts.

## Platform laboratories

The platform domain demonstrates edge inspection, stateless Worker computation, Durable Object coordination, D1 relational state, R2 object storage, delivery controls, governance controls, and accessibility support through capability-owned declarations.

Every mutation has explicit method, body, identity, same-origin, size, and storage constraints in its route declaration and handler. D1 owns relational state, R2 owns object bytes, Durable Objects own coordinated state, and Worker computation remains stateless.

## Interface demonstrations

The interface domain separates browser consoles from machine protocol contracts. REST/OpenAPI, GraphQL, signed webhooks, identity federation, MCP, internationalization, and accessibility each retain the protocol-specific validation and disclosure boundary appropriate to the capability.

Public REST, GraphQL, and MCP reads share the same authorization boundary. Authenticated visitor writes use identity-derived, short-lived access tokens scoped to server-derived visitor sandboxes. There is no static bearer-token credential.

The generated route artifacts and OpenAPI describe the current concrete endpoints; this document describes the model rather than maintaining a second endpoint inventory.

## Reporting and assurance

All structured assurance and provider-backed queries use the registered reporting route family and the canonical reporting schema. Canonical records store relationship edges once as `relationships`; forward views read those edges, reverse graphs are derived at runtime, and counts and facets are calculated from selected records.

Structured and provider-backed collection queries share the signed-cursor contract. A cursor is bound to source, collection, filters, ordering, and authorization context; provider-native continuations are never exposed as an alternate public cursor.

Public reporting is disclosure-safe. Protected provider sources are visible only through the authorization policies declared for those routes.

## Operations

Operations pages and machine contracts are declared in the same registry but retain distinct browser/API policies. Health, release identity, public-safe logs, usage observations, reporting, synthetic budget behavior, administrative control, and offline recovery remain governed by their route declarations rather than a hardcoded operations pathname list.

Provider credentials, private resource identifiers, invoices, payment details, and raw provider payloads never cross the public boundary. Missing or malformed provider data is reported as unavailable or partial; it is not converted into invented zero usage.

## Identity and security boundaries

OAuth authorization-code flows use server-side PKCE and validated provider callbacks. SAML validates issuer, audience, recipient, time bounds, request correlation, signatures, and replay state. Application sessions are encrypted, revocable, short-lived, and separate from provider credentials.

Webhook requests are signature-verified before persistence. MCP requests are origin-checked and pass through the common authorization layer. GraphQL enforces body, depth, field-count, batching, and same-origin mutation constraints.

Public records and logs are disclosure-safe projections. Credentials, cookies, tokens, authorization codes, PKCE material, SAML assertions, and private provider data are excluded from HTML, logs, reporting responses, and error details.

## Verification

The implementation is complete only when the repository definition-of-done commands pass from a clean checkout, including route/OpenAPI generation checks, the full repository check, migration validation, dependency audit, build validation, and whitespace validation.

Release and deployment are separate controlled actions. An implementation PR must not tag, release, migrate a remote database, or deploy the Worker.
