# Declarative route registry

DEMO-166 introduced the typed route declaration and matching foundation. DEMO-167 adopted it for global administration, recovery, operations, protocol, and asset routes. DEMO-168 extends active adoption to assurance HTML and API routes by compiling `assurance/registry.json` route ownership into declarative route modules. `src/router.ts` remains the single top-level Worker dispatcher; domain routing is delegated to registered modules rather than duplicated in central path or owner switches.

## Declaration contract

Each route declaration in `src/routing/registry.ts` carries the policy and ownership context needed for runtime routing:

- a stable route ID;
- an exact path or `:parameter` pattern;
- explicit supported HTTP methods;
- `page`, `api`, `protocol`, or `asset` kind;
- the route handler;
- authentication and authorization policy;
- public or private visibility;
- same-origin requirements, including the methods they apply to;
- offline availability policy;
- cache policy, including immutable public assets;
- crawler and indexing policy;
- documentation metadata;
- source and test metadata.

Capability code contributes declarations through `defineRouteModule`. `createRouteRegistry` composes any set of modules supplied by the caller, so adding a compatible capability does not require adding a central domain switch to the registry implementation.

## Matcher rules

The matcher is deterministic:

1. Request paths are normalized for trailing slashes.
2. Exact routes are checked before parameter routes.
3. Parameter values are percent-decoded and normalized to Unicode NFC.
4. A matched path with an unsupported method returns a `method-not-allowed` result with HTTP status `405` and the declaration's allowed methods. Methods are explicit; `HEAD` is not inferred from `GET`.
5. An unknown path or malformed encoded parameter returns the standard `not-found` result with HTTP status `404`.

Registry construction fails before matching when it finds duplicate module IDs, duplicate stable route IDs, duplicate normalized patterns, duplicate methods, invalid parameter syntax, same-origin methods that are not supported by the route, or parameterized patterns that can match the same request path. Exact routes are allowed to intersect parameter routes because exact precedence resolves that case deterministically.

## Active operational module

`src/routing/operational-routes.ts` owns declarations and runtime policy enforcement for:

- `/admin` and `/offline`;
- `/health` and `/version`;
- `/robots.txt`, `/.well-known/security.txt`, `/og.png`, and `/sitemap.xml`;
- `/dashboard`, `/dashboard/uptime`, `/dashboard/docs`, `/dashboard/billing`, and `/dashboard/logs`;
- `/__api/operations/logs`, `/__api/operations/cloudflare-usage`, and `/__api/operations/billing`.

For these routes, authentication, authorization, POST same-origin enforcement, supported methods, offline reachability, cache behavior, and OpenAI crawler/indexing policy are read from route metadata. In particular, dashboard availability is exact-route metadata rather than a `/dashboard/*` offline-bypass prefix. Unknown dashboard and operations paths are not declarations and do not acquire recovery privileges.

The ChatGPT crawler switch retains its existing semantics: `GPTBot` remains blocked, `OAI-SearchBot` and `ChatGPT-User` follow the runtime crawler-control state on controlled routes, and `/robots.txt` continues to publish the selected policy. Administration and the two public policy/contact protocol routes retain their previous pre-crawler behavior through explicit `allow` metadata.

## Active assurance modules

`src/routing/assurance-routes.ts` compiles the canonical route owners from `assurance/registry.json` into declarative route modules. The JSON registry remains the only owner of assurance HTML, collection API, and exact-record API paths; handler capability modules contain no URL literals.

Current specialized presentation and focused-API handlers register by stable registry owner ID under `src/assurance/route-capabilities/`. Collection and exact-record API routes without a specialized handler use `genericAssuranceResponse`, so a compatible new public assurance family with valid `runtime`, `records`, `api-index`, and route declarations becomes routable without editing `src/router.ts`. HTML routes remain intentionally specialized presentation surfaces and fail validation if their registry owner has no registered renderer.

The declarative matcher supplies exact-before-parameter precedence. Assurance exact-record `{id}` templates are translated to the generic matcher form only after the assurance route contract validates the template. Unsupported or incomplete route capabilities fail during router construction. The active router does not install assurance aliases.

Assurance request/response semantics remain owned by the existing assurance HTTP contract. Focused APIs are thin adapters over the shared query handler, and successful/error responses continue to preserve disclosure selection, filters, pagination, exact record lookup, CORS, ETags, and cache headers. The `/security` recovery availability exception is now local route metadata on the advisory presentation capability rather than a path exception in `src/router.ts`.

## Incremental adoption boundary

Non-operational, non-assurance demo routes remain on the existing imperative sections of `src/router.ts` until their capability migrations. `docs/ROUTES.md` and `docs/route-manifest.json` remain the canonical public URL contract. DEMO-168 changes assurance route ownership and dispatch representation, not released paths, representations, aliases, storage, release state, or deployment behavior.
