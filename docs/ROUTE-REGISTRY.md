# Declarative route registry

DEMO-166 introduced the typed matcher foundation, and DEMO-167 through DEMO-170 moved operational, assurance, platform laboratory, interface, identity, delivery/governance, i18n, and frontend routes into capability-owned declarations. DEMO-171 completes the migration by composing those declarations into one application registry and making that registry the only active request-dispatch contract.

## Final dispatch boundary

`src/router.ts` now performs only cross-cutting request orchestration:

1. normalize the pathname;
2. match the single application registry;
3. return the normal 404 for an unknown path;
4. enforce declared crawler, offline, method, authentication, same-origin, indexing, and cache policies;
5. invoke the matched handler with normalized parameters; and
6. convert unexpected failures into the shared safe error response.

The router does not keep an application path switch, API-prefix inventory, HTML-path list, assurance-owner switch, demo fallback lookup, redirect alias list, or route-family dispatch chain. Browser offline behavior is read from route metadata, including routes that must never be treated as browser pages.

## Application registry

`src/routing/application-routes.ts` composes the current capability registries:

- operational and control routes;
- assurance routes compiled from the canonical assurance registry;
- interface and identity capabilities; and
- platform laboratory capabilities.

Composition adapts their handler contexts without moving ownership back into the central router. Cross-family duplicate IDs, duplicate patterns, and ambiguous parameter patterns are rejected by the shared matcher. Application validation additionally rejects undocumented routes, page declarations that cannot be reached with `GET`, invalid page metadata, missing page parents, cycles or multiple roots in the page hierarchy, publicly cached private routes, and indexable private routes.

The same module exposes stable route-ID URL helpers. Internal callers can resolve a declaration by ID and supply normalized, percent-encoded route parameters without copying its path literal.

## Registered page metadata

Page declarations own their frontend metadata directly through the optional `page` block: parent route ID, navigation label, summary, sibling order, primary/secondary/none navigation membership, and architecture-map membership. The hierarchy is expressed in route IDs rather than inferred from pathname prefixes, and `interfaces.frontend.index` is the single root.

`src/routing/navigation.ts` projects primary navigation, child navigation, architecture-map entries, and sitemap paths from those declarations while retaining the `configureRegisteredRoutes()` / `registeredRouteMetadata()` seam. The shell consumes primary navigation directly, and active state is matched by route ID: exactly the current primary route receives `aria-current="page"`; ancestors can receive visual section state without claiming a second current page.

`src/demos/registry.ts` now retains only the query-view inventories needed by the four consolidated surfaces plus `frontendViewUrl()`. It no longer owns pathnames, page titles, hierarchy, navigation membership, architecture-card membership, or sitemap membership.

`/sitemap.xml` is derived from public, indexable, non-parameterized page declarations. The root route remains in the sitemap but is not duplicated as an architecture card.

## Generated artifacts

`docs/route-manifest.json` and the route tables in `docs/ROUTES.md` are generated from the active application declarations by `src/routing/artifacts.ts`.

Run:

```sh
npm run generate:routes
```

Validation uses the same projection without writing files:

```sh
npm run validate:routes
```

The generated manifest records stable ID, route pattern, methods, kind, visibility, browser HTML policy, authentication/authorization, same-origin, offline, cache, crawler/indexing, documentation, source/test provenance, and derived page-navigation metadata. Route documentation is therefore a projection of the live contract rather than a second route inventory.

## Matcher and collision rules

The shared matcher retains the deterministic rules established in DEMO-166:

- trailing slashes normalize to the canonical path;
- exact routes take precedence over parameter routes;
- parameter values are percent-decoded and Unicode NFC-normalized;
- methods are explicit and `HEAD` is not inferred from `GET`;
- unsupported methods return `405` with the declaration's allowed methods;
- malformed encoded parameters and unknown paths return the standard `404`;
- duplicate module IDs, route IDs, normalized patterns, duplicate methods, invalid parameters, invalid same-origin method declarations, and overlapping parameter patterns fail registry construction.

No redirect or alias layer is installed by the final registry. Removed routes remain ordinary unknown paths.

## Policy ownership

Route declarations own the policy that can be enforced generically at dispatch: visibility, browser HTML behavior, authentication provider, authorization declaration, same-origin methods, offline availability, cache policy, crawler access, indexing, and page presentation metadata. Authentication and authorization remain independent declarations: a route may require a verified identity without defining an additional authorization policy. Protocol-specific validation remains in the capability handler where it belongs. For example, OAuth/OIDC/SAML cryptographic validation, GraphQL execution limits, webhook signature/replay checks, MCP protocol authorization, and Git release-readiness checks are not duplicated in the router.

Platform declarations continue to retain their request-limit and storage-boundary metadata. D1 owns relational state, R2 owns object bytes, Durable Objects own coordinated state, and Worker computation remains stateless.

## Validation

The route suite verifies generated manifest consistency, generated documentation, derived sitemap membership, primary and architecture navigation, route-ID URL generation, method handling, page-hierarchy validity, shared policy completeness, cross-family collision rejection, compatible additional-page registration, active-state semantics, unreachable/undocumented route rejection, and normal 404 behavior for removed aliases and arbitrary unknown paths.

The current registry is the complete route contract. Route removals are deliberate and receive the ordinary 404; this audit does not release or deploy the application.
