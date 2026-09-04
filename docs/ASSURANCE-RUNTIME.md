# Assurance runtime discovery

Canonical assurance runtime discovery is registry-driven.

Every resource in `assurance/registry.json` that declares both `runtime` and `records` participates in the shared Worker runtime record indexes after the normal assurance runtime binding is generated. This includes primary datasets, additional partitions, and internal record families that do not declare `api-index` or a public route.

The shared runtime derives, in registry order:

- record collections grouped by registered resource `kind`;
- per-kind record counts;
- one global canonical-ID lookup;
- forward relationship lookup by canonical ID;
- reverse relationship lookup across every relationship-bearing runtime family.

Framework-specific canonical derivations remain domain-owned. In particular, compliance records retain their normalized framework metadata, source path, section derivation, and deterministic framework/reference ordering before entering the common indexes.

## Lifecycle control plane

Lifecycle metadata is a registry-owned control-plane resource, not a canonical assurance record collection. Exactly one registered resource must own the `lifecycle` capability, and that owner must also declare `runtime` so the generated Worker binding imports the registry-declared path and schema. Worker publication and Node publication validation resolve the same capability owner; neither owns a filesystem path independently.

Baseline lifecycle inheritance is verified membership, not a default. Runtime-binding generation resolves the lifecycle resource's immutable `baseline.commit` through the existing historical assurance snapshot decoder and emits `src/assurance/generated/lifecycle-baseline-membership.json`. The generated Worker binding imports that artifact, and Node publication validation reads the same artifact. Runtime publication therefore has no Git or network dependency while still inheriting baseline metadata only for IDs proven to exist in the immutable snapshot.

Lifecycle resolution is fail-closed and ordered: explicit current lifecycle metadata takes precedence, retained tombstones reserve retired IDs, and only then may a verified baseline member inherit the baseline lifecycle and disclosure review. An unknown current ID without explicit lifecycle metadata has no publication lifecycle. A retired baseline ID cannot regain baseline publication through inheritance.

Lifecycle state remains distinct from visibility. A public record with explicit `Draft` lifecycle metadata and a `Reviewed` disclosure review remains eligible for publication; `Draft` is not an implicit privacy state. Unreviewed records remain ineligible regardless of lifecycle state.

The `records` capability remains the only admission contract for canonical assurance record discovery, IDs, relationships, counts, and release snapshot record totals. The lifecycle resource therefore remains outside those collections even though it is Worker-bound. Moving lifecycle data requires moving the file and updating its registry declaration, then regenerating the runtime binding; no runtime source import changes are permitted.

Missing or multiple lifecycle capability owners fail binding generation and registry validation. The lifecycle control-plane owner is also rejected if it declares `records`, preventing lifecycle metadata from silently becoming assurance records.

## Schema-derived runtime metadata

Structural assurance validation and runtime metadata generation share the same JSON Schema reference semantics. Supported local references and repository-relative external references are resolved from each registered root schema through its reachable dependency graph. Assurance schema dependencies remain confined to `contracts/assurance/`, use JSON Schema draft 2020-12, and retain the existing rejection of absolute references, repository escapes, unsupported keywords, cycles, and unresolved references.

Filter vocabularies are extracted from authoritative schema `enum` or `const` declarations during Node/build tooling and emitted into the generated Worker binding. The Worker consumes those generated values directly; it does not read the filesystem, interpret `$ref`, duplicate allowed values, or infer vocabularies from current records. Registry-owned metadata remains the authoritative fallback only when a filter dimension is owned by the registered resource rather than its record schema, such as normalized compliance framework identity.

The generated binding also records SHA-256 digests for reachable external schema dependencies. `npm run validate:assurance-runtime-binding` therefore fails when a dependency changes without regenerating the binding, even if the derived filter values happen to remain unchanged. The same check regenerates baseline membership from the immutable historical snapshot when repository history is available and rejects a stale generated membership artifact.

## HTTP boundary

Runtime discoverability does not imply HTTP exposure. The released `/v1/assurance` route and response inventory remains an explicit versioned compatibility contract, with serializers and route declarations controlling which record families are public API surfaces.

A runtime dataset may therefore be available to shared listing, exact-ID, count, and relationship services without receiving a new endpoint. Adding a compatible internal family or partition requires its data, schema, registry declaration, and generated runtime binding; it does not require editing a central runtime family switch.

## Validation expectations

Tests should exercise the shared runtime services, not only the record-discovery helper or generated import text. Coverage includes registered objectives and a generated synthetic family with an additional partition to prove that collection aggregation, canonical-ID lookup, counts, and relationship traversal remain registry-driven.

Lifecycle coverage additionally relocates the lifecycle file through the registry, regenerates the Worker binding, validates Node publication selection, bundles the Worker, and proves lifecycle control-plane metadata remains excluded from release snapshot record totals. Verified baseline tests exercise true baseline inheritance through a real runtime/API consumer, fail-closed handling for new ungoverned IDs, explicit reviewed and unreviewed lifecycle decisions, retired baseline reservations, registered partitions, newly registered families, and the Node publication-validator entry point. Missing and ambiguous lifecycle capability ownership are negative cases.

Schema-reference coverage additionally exercises inline/local/external filter vocabulary forms, existing shared relationship references, deterministic missing-reference failures, generated dependency-digest drift, and filtered API/HTML behavior.
