# Declarative route registry

DEMO-166 introduced the typed route declaration and matching foundation. DEMO-167 begins incremental runtime adoption by registering the global administration, recovery, operations, protocol, and asset routes while leaving the remaining demo and assurance routes on the existing imperative router. `src/router.ts` remains the single top-level Worker dispatcher; registered operational routes are delegated to the operations route module rather than duplicated in a second active router.

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

Capability code contributes declarations through `defineRouteModule`. `createRouteRegistry` composes any set of modules supplied by the caller, so adding a capability does not require adding a central domain switch to the registry implementation.

## Matcher rules

The matcher is deterministic:

1. Request paths are normalized for trailing slashes.
2. Exact routes are checked before parameter routes.
3. Parameter values are percent-decoded and normalized to Unicode NFC.
4. A matched path with an unsupported method returns a `method-not-allowed` result with HTTP status `405` and the declaration's allowed methods. Methods are explicit; `HEAD` is not inferred from `GET`.
5. An unknown path or malformed encoded parameter returns the standard `not-found` result with HTTP status `404`.

Registry construction fails before matching when it finds duplicate module IDs, duplicate stable route IDs, duplicate normalized patterns, duplicate methods, invalid parameter syntax, same-origin methods that are not supported by the route, or parameterized patterns that can match the same request path. Exact routes are allowed to intersect parameter routes because exact precedence resolves that case deterministically.

## Active operational module

`src/routing/operational-routes.ts` is the first active capability module. It owns declarations and runtime policy enforcement for:

- `/admin` and `/offline`;
- `/health` and `/version`;
- `/robots.txt`, `/.well-known/security.txt`, `/og.png`, and `/sitemap.xml`;
- `/dashboard`, `/dashboard/uptime`, `/dashboard/docs`, `/dashboard/billing`, and `/dashboard/logs`;
- `/__api/operations/logs`, `/__api/operations/cloudflare-usage`, and `/__api/operations/billing`.

For these routes, authentication, authorization, POST same-origin enforcement, supported methods, offline reachability, cache behavior, and OpenAI crawler/indexing policy are read from route metadata. In particular, dashboard availability is exact-route metadata rather than a `/dashboard/*` offline-bypass prefix. Unknown dashboard and operations paths are not declarations and do not acquire recovery privileges.

The ChatGPT crawler switch retains its existing semantics: `GPTBot` remains blocked, `OAI-SearchBot` and `ChatGPT-User` follow the runtime crawler-control state on controlled routes, and `/robots.txt` continues to publish the selected policy. Administration and the two public policy/contact protocol routes retain their previous pre-crawler behavior through explicit `allow` metadata.

## Incremental adoption boundary

All non-operational demo and assurance routes remain on the existing routing code for now. Their canonical URLs and offline behavior are unchanged. The one existing assurance recovery exception remains an exact legacy exception until that capability is migrated in a later controlled change. `docs/ROUTES.md` and `docs/route-manifest.json` remain the canonical public URL contract; DEMO-167 changes route ownership and policy representation, not public paths.
