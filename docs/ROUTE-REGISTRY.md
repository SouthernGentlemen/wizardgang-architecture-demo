# Declarative route registry foundation

DEMO-166 introduces typed route declaration and matching infrastructure for incremental route migration. It does not replace or participate in the active Worker router yet. `src/router.ts` remains the sole runtime dispatcher, so this change does not alter canonical URLs, route behavior, offline behavior, or deployment behavior.

## Declaration contract

Each route declaration in `src/routing/registry.ts` carries the complete policy and ownership context needed for later adoption:

- a stable route ID;
- an exact path or `:parameter` pattern;
- explicit supported HTTP methods;
- `page`, `api`, `protocol`, or `asset` kind;
- the route handler;
- authentication and authorization policy;
- public or private visibility;
- offline availability policy;
- cache policy;
- crawler and indexing policy;
- documentation metadata;
- source and test metadata.

Capability code contributes declarations through `defineRouteModule`. `createRouteRegistry` composes any set of modules supplied by the caller, so adding a capability does not require adding a central domain switch to the registry implementation.

## Matcher rules

The matcher is deterministic and independent of the active router:

1. Request paths are normalized for trailing slashes.
2. Exact routes are checked before parameter routes.
3. Parameter values are percent-decoded and normalized to Unicode NFC.
4. A matched path with an unsupported method returns a `method-not-allowed` result with HTTP status `405` and the declaration's allowed methods. Methods are explicit; `HEAD` is not inferred from `GET`.
5. An unknown path or malformed encoded parameter returns the standard `not-found` result with HTTP status `404`.

Registry construction fails before matching when it finds duplicate module IDs, duplicate stable route IDs, duplicate normalized patterns, duplicate methods, invalid parameter syntax, or parameterized patterns that can match the same request path. Exact routes are allowed to intersect parameter routes because exact precedence resolves that case deterministically.

## Adoption boundary

This foundation intentionally contains no declarations for the current production route set and is not called by `src/router.ts`. Future controlled changes can migrate one capability at a time by exporting a route module and then wiring that module into the runtime router. Until such a migration is explicitly made, `docs/ROUTES.md` and `docs/route-manifest.json` remain the current canonical URL contract without changes from DEMO-166.
