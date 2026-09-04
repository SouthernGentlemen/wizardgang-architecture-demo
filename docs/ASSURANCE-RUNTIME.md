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

## HTTP boundary

Runtime discoverability does not imply HTTP exposure. The released `/v1/assurance` route and response inventory remains an explicit versioned compatibility contract, with serializers and route declarations controlling which record families are public API surfaces.

A runtime dataset may therefore be available to shared listing, exact-ID, count, and relationship services without receiving a new endpoint. Adding a compatible internal family or partition requires its data, schema, registry declaration, and generated runtime binding; it does not require editing a central runtime family switch.

## Validation expectations

Tests should exercise the shared runtime services, not only the record-discovery helper or generated import text. Coverage includes registered objectives and a generated synthetic family with an additional partition to prove that collection aggregation, canonical-ID lookup, counts, and relationship traversal remain registry-driven.
