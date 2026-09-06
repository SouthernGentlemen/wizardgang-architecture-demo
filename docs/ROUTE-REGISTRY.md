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

The router does not keep an application path switch, API-prefix inventory, HTML-path list, assurance-owner switch, demo fallback lookup, redirect alias list, or route-family dispatch chain. Browser offline behavior is read from route metadata, including the GraphQL content-negotiation exception and routes that must never be treated as browser pages.

## Application registry

`src/routing/application-routes.ts` composes the current capability registries:

- operational and control routes;
- assurance routes compiled from the canonical assurance registry;
- interface and identity capabilities; and
- platform laboratory capabilities.

Composition adapts their handler contexts without moving ownership back into the central router. Cross-family duplicate IDs, duplicate patterns, and ambiguous parameter patterns are rejected by the shared matcher. Application validation additionally rejects undocumented routes, page declarations that cannot be reached with `GET`, unreachable navigation metadata, publicly cached private routes, and indexable private routes.

The same module exposes stable route-ID URL helpers. Internal callers can resolve a declaration by ID and supply normalized, percent-encoded route parameters without copying its path literal.

## Registered page metadata

The application registry attaches public page metadata to declarations by joining the active route patterns to the existing demo definitions. `src/routing/navigation.ts` exposes that registered metadata to consumers.

The architecture-map navigation consumes the registered page set instead of the demo registry directly. `/sitemap.xml` is generated from public, indexable, non-parameterized registered page metadata. The root route is explicitly registered as a sitemap page but is not duplicated as an architecture card.

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

The generated manifest records stable ID, route pattern, methods, kind, visibility, browser HTML policy, authentication/authorization, same-origin, offline, cache, crawler/indexing, documentation, source/test provenance, and navigation metadata. Route documentation is therefore a projection of the live contract rather than a second route inventory.

## Matcher and collision rules

The shared matcher retains the deterministic rules established in DEMO-166:

- trailing slashes normalize to the canonical path;
- exact routes take precedence over parameter routes;
- parameter values are percent-decoded and Unicode NFC-normalized;
- methods are explicit and `HEAD` is not inferred from `GET`;
- unsupported methods return `405` with the declaration's allowed methods;
- malformed encoded parameters and unknown paths return the standard `404`;
- duplicate module IDs, route IDs, normalized patterns, duplicate methods, invalid parameters, invalid same-origin method declarations, and overlapping parameter patterns fail registry construction.

No redirect or alias compatibility layer is installed by the final registry. Removed routes remain ordinary unknown paths.

## Policy ownership

Route declarations own the policy that can be enforced generically at dispatch: visibility, browser HTML behavior, authentication provider, authorization declaration, same-origin methods, offline availability, cache policy, crawler access, and indexing. Authentication and authorization remain independent declarations: a route may require a verified identity without defining an additional authorization policy. Protocol-specific validation remains in the capability handler where it belongs. For example, OAuth/OIDC/SAML cryptographic validation, GraphQL execution limits, webhook signature/replay checks, MCP protocol authorization, and Git release-readiness checks are not duplicated in the router.

Platform declarations continue to retain their request-limit and storage-boundary metadata. D1 owns relational state, R2 owns object bytes, Durable Objects own coordinated state, and Worker computation remains stateless.

## Validation

The route suite verifies generated manifest consistency, generated documentation, sitemap membership, architecture navigation, route-ID URL generation, method handling, shared policy completeness, cross-family collision rejection, unreachable/undocumented route rejection, and normal 404 behavior for removed aliases and arbitrary unknown paths.

This change does not rename public URLs, release, or deploy the application.
