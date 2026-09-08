# Declarative route registry

DEMO-166 introduced the typed matcher foundation, and DEMO-167 through DEMO-171 moved the application onto one declarative route registry. Later controlled changes promoted browser views to canonical child resources and made route declarations own frontend presentation metadata as well as transport policy.

## Final dispatch boundary

`src/router.ts` performs only cross-cutting request orchestration:

1. normalize the pathname;
2. match the single application registry;
3. return the normal 404 for an unknown path;
4. enforce declared crawler, offline, method, authentication, same-origin, indexing, and cache policies;
5. invoke the matched handler with normalized parameters; and
6. convert unexpected failures into the shared safe error response.

The router does not keep an application path switch, API-prefix inventory, HTML-path list, redirect alias list, query-view dispatch table, or route-family dispatch chain.

## Application registry

`src/routing/application-routes.ts` composes the capability registries. Composition adapts handler contexts without moving ownership back into the central router.

Cross-family duplicate IDs, duplicate patterns, and ambiguous parameter patterns are rejected by the shared matcher. Application validation additionally rejects undocumented routes, page declarations that cannot be reached with `GET`, invalid page metadata, missing page parents, cycles or multiple roots in the page hierarchy, publicly cached private routes, and indexable private routes.

The application module also exposes route-ID URL helpers. Internal callers resolve a declaration by ID and supply normalized parameters and query state without copying the declaration's pathname.

## Registered page metadata

A page declaration owns its frontend contract through the `page` block:

- `parent` — the parent page route ID, omitted only for the single root;
- `label` — navigation and breadcrumb text;
- `summary` — concise architecture-map and documentation description;
- `order` — sibling ordering;
- `navigation` — primary, secondary, or no navigation membership;
- `architectureMap` — whether the page participates in the homepage architecture projection.

The hierarchy is expressed in route IDs rather than inferred from pathname prefixes. Canonical pathname ownership remains on the route declaration itself.

Those declarations are projected into primary navigation, secondary navigation, breadcrumbs, the homepage architecture map, sitemap membership, canonical links, and generated route documentation. No projection owns or restates a pathname inventory, and route counts are derived when reported rather than fixed as assertions.

`src/routing/navigation.ts` performs the navigation and architecture projections while the shell consumes the result. Active state is matched by route ID so only the current document receives `aria-current="page"`.

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

The generated manifest records stable ID, route pattern, methods, kind, visibility, browser HTML policy, authentication/authorization, same-origin, offline, cache, crawler/indexing, documentation, source/test provenance, and derived page metadata. Route documentation is therefore a projection of the live contract rather than a second route inventory.

## Matcher and collision rules

The shared matcher retains the deterministic rules established by the registry migration:

- trailing slashes normalize to the canonical path;
- exact routes take precedence over parameter routes;
- parameter values are percent-decoded and Unicode NFC-normalized;
- methods are explicit and `HEAD` is not inferred from `GET`;
- unsupported methods return `405` with the declaration's allowed methods;
- malformed encoded parameters and unknown paths return the standard `404`;
- duplicate module IDs, route IDs, normalized patterns, duplicate methods, invalid parameters, invalid same-origin method declarations, and overlapping parameter patterns fail registry construction.

No redirect or alias layer is installed by the registry. Removed routes remain ordinary unknown paths.

## Policy ownership

Route declarations own the policy that can be enforced generically at dispatch: visibility, browser HTML behavior, authentication provider, authorization declaration, same-origin methods, offline availability, cache policy, crawler access, indexing, and page presentation metadata.

Authentication and authorization remain independent declarations. Protocol-specific validation remains in the capability handler where it belongs. OAuth/OIDC/SAML cryptographic validation, GraphQL execution limits, webhook signature/replay checks, MCP protocol authorization, and release-readiness checks are not duplicated in the router.

Platform declarations retain their request-limit and storage-boundary metadata. D1 owns relational state, R2 owns object bytes, Durable Objects own coordinated state, and Worker computation remains stateless.

## Validation

The route suite verifies generated artifact consistency, derived sitemap membership, navigation projection, route-ID URL generation, method handling, page-hierarchy validity, shared policy completeness, cross-family collision rejection, compatible additional-page registration, active-state semantics, unreachable/undocumented route rejection, and normal 404 behavior for removed aliases and arbitrary unknown paths.

The current registry is the complete route contract. Route removals are deliberate and receive the ordinary 404; release and deployment remain separate controlled actions.
