# Declarative route registry

The application route declarations are the runtime authority for browser, API, protocol, asset, and operational routes. Human routing/browser information architecture is documented here. The generated machine projection is `docs/route-manifest.json`; there is no separately generated Markdown route inventory.

## Dispatch and declaration authority

`src/router.ts` performs cross-cutting request orchestration:

1. normalize the pathname;
2. match the single application registry;
3. return the ordinary `404` for an unknown path;
4. enforce declared crawler, offline, method, authentication, authorization, same-origin, indexing, and generic cache policy;
5. invoke the matched handler with normalized parameters; and
6. convert unexpected failures into the shared safe error response.

The router does not maintain a pathname switch, API-prefix inventory, redirect/alias table, query-view router, or route-family dispatch chain.

`src/routing/application-routes.ts` composes capability registries. Each route declaration owns its stable ID, pattern, methods, kind, visibility, browser HTML policy, authentication, authorization, same-origin requirements, offline behavior, cache/crawler policy, documentation metadata, source/test provenance, and optional page metadata.

## Matcher behavior

The shared matcher is deterministic:

- trailing slashes normalize to the canonical path;
- exact routes take precedence over parameter routes;
- parameter values are percent-decoded and Unicode NFC-normalized;
- declared methods are explicit and `HEAD` is not inferred from `GET`;
- unsupported methods return `405` with the declaration's allowed methods;
- malformed encoded parameters and unknown paths return the ordinary `404`;
- duplicate IDs, duplicate normalized patterns, duplicate methods, invalid parameters, and ambiguous overlapping parameter patterns fail registry construction.

No redirect or compatibility alias layer is installed. Removed paths remain ordinary unknown routes.

## Route policy ownership

Generic dispatch policy belongs to route declarations: visibility, browser HTML behavior, authentication provider, authorization declaration, same-origin methods, offline availability, cache policy, crawler access/indexing, and page presentation metadata.

Protocol-specific validation remains in capability handlers. OAuth/OIDC/SAML cryptographic validation, GraphQL execution limits, webhook signature/replay checks, MCP protocol authorization, reporting disclosure, and release-readiness checks are not duplicated in the router.

Platform declarations retain request-limit and storage-boundary metadata. D1 owns relational state, R2 owns object bytes, Durable Objects own coordinated state, and Worker computation remains stateless.

## Page metadata and browser information architecture

A browser page route represents a distinct user task or a browser-visible security/protocol boundary, not merely a dataset, framework, implementation technology, renderer, registry partition, or reporting view.

A page declaration owns its browser contract through the `page` block:

- `parent`: parent page route ID, omitted only for the root;
- `label`: navigation text;
- `summary`: concise architecture description;
- `order`: sibling ordering;
- `navigation`: navigation membership;
- `architectureMap`: homepage architecture-map participation.

Parent relationships use route IDs rather than pathname inference.

The ordinary public product remains task-oriented:

- `/` — understand the project and choose a task;
- `/demos` — execute or inspect architecture demonstrations;
- `/assurance` — inspect framework assessment records, posture, documentation, and evidence;
- `/security` — contextual support/security boundary rather than primary product navigation.

`/admin` and `/offline` remain registered operational pages but are not ordinary product navigation.

## Fragments and query state

A single task page may expose multiple durable sections, demonstrations, framework views, datasets, and records without adding another page route.

Fragments identify a location within the selected page. Examples include `/demos#graphql` and `/assurance#ISO27001-A.5.19`. Fragments do not create additional canonical page identities, sitemap members, or route IDs.

Query parameters refine the selected task through filtering, search, sorting, pagination, localization, or other interaction state. They do not select the primary conceptual destination.

The application has no client-side router. Client scripts may enhance controls, update interaction state, or focus a fragment target, but application routing remains server-side through the declarative registry.

## Navigation, sitemap, and URL projection

`src/routing/navigation.ts` projects route declarations into primary navigation and the homepage architecture map. Active state is matched by route ID.

Sitemap membership and canonical links are derived from route declarations and page/crawler metadata. Internal callers use route-ID URL helpers from the application registry and provide normalized route parameters/query state instead of copying path strings.

Browser consolidation never removes a machine/protocol contract merely because its demonstration is presented under `/demos` or `/assurance`.

The registered `/assets/:asset` route remains the policy boundary for browser files. It accepts only paths projected by `docs/asset-manifest.json`, fetches their bytes from the Worker `ASSETS` binding, and preserves immutable caching and the shared security headers. Vite owns the content-hashed stylesheet names; vendored GraphiQL, Monaco, axe-core, and social-image URLs remain stable.

## Machine and protocol route families

REST/JSON endpoints, OpenAPI, GraphQL, MCP, identity callbacks, webhooks, laboratory APIs, reporting APIs, operational APIs, assets, crawler controls, and other non-browser contracts retain independent declarations, methods, policies, and source ownership.

Current laboratory boundaries include:

- R2 visitor storage uses `/api/labs/r2-files` plus the registered item and reset operations; R2 stores bytes and D1 stores associated metadata.
- `/api/labs/rest-demo-records` is the anonymous visitor/browser tutorial contract, isolated by signed visitor state and documented by `/api/labs/rest-demo-openapi.json`.
- `/api/labs/rest-records` is the bearer-capable machine contract documented by `/api/openapi.json`; anonymous reads use the public namespace and identity-derived `demo:write` authorization controls mutation/namespace ownership.

These families are separate contracts and are not aliases of one another.

## Generated machine manifest

`src/routing/artifacts.ts` builds the machine projection with `buildRouteManifest` and `serializeRouteManifest`.

Run:

```sh
npm run generate:routes
```

The route generator writes only:

```text
docs/route-manifest.json
```

The manifest records route ID, published pattern, methods, kind, visibility, browser HTML policy, authentication, authorization, same-origin policy, offline policy, cache/crawler policy, title/description, documentation links, source/test provenance, and derived page metadata.

`docs/route-manifest.json` is generated inventory; it is not hand-maintained. Human architecture belongs in this document, and complete route inventory belongs in the manifest rather than a duplicated Markdown table.

## Validation

`npm run validate:routes` verifies manifest parity with active declarations. Application and registry tests additionally cover sitemap projection, navigation projection, route-ID URL generation, method handling, page-hierarchy validity, shared policy completeness, collision rejection, compatible page registration, active-state semantics, unreachable/undocumented route rejection, and ordinary `404` behavior for removed or arbitrary unknown paths.

Route changes must update declarations first, regenerate `docs/route-manifest.json`, and pass route/contract validation without introducing duplicate route inventories.
