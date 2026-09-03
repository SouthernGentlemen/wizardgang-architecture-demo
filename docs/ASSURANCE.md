# Public assurance registry

The `assurance/` directory is the canonical public, disclosure-safe data layer for assurance claims, evidence, risks, incidents, and response exercises. It is not the complete private operational or forensic record and does not claim certification.

`assurance/registry.json` indexes controlled datasets and their JSON Schema contracts. Counts and reverse relationships are derived in code; they are not duplicated in source JSON.

The incident and exercise datasets are sourced from `docs/governance/registers/INCIDENT-REGISTER.md`. Actual incidents use permanent `INC-*` identifiers only after a real retained incident record exists. Simulated exercises use permanent `EX-*` identifiers and remain explicitly simulated. Vulnerabilities and published advisories remain separate disclosure records rather than being converted into incidents.

At the current baseline, the public incident dataset contains zero established actual incident records. That is not a claim that the system has never experienced defects, outages, vulnerabilities, near misses, or incidents. `EX-001` is a planned response exercise due 2026-12-02 and has no completion evidence.

## Evidence and record rules

- Evidence IDs are stable `EVD-<KIND>-###` identifiers.
- Claim IDs are stable `CLM-<AREA>-###` identifiers.
- Risk IDs retain the approved `SEC-RISK-*` and `AI-RISK-*` identifiers.
- Actual incident IDs are permanent `INC-###` identifiers and are created only for established real incident records.
- Exercise IDs are permanent `EX-###` identifiers and every exercise record is explicitly marked as simulated.
- Planned exercises cannot carry completion timestamps, result summaries, or completion evidence.
- Repository evidence records paths, not branch-dependent GitHub URLs.
- Public URLs are resolved against the exact deployed commit when presented.
- Source/test evidence is release-bound, governance evidence is event-driven, and live observations are observation-bound.
- Validation derives reverse `usedBy` relationships from claim references and derives all dataset counts at runtime.
- No secret, reporter identity, private infrastructure detail, unreviewed request content, unreleased vulnerability detail, or private treatment detail belongs in this registry.

Run `npm run validate:assurance` to enforce controlled paths, identifiers, disclosure-safe fields, source-register parity, record-type separation, planned/completed exercise semantics, schemas, duplicates, and referential integrity.
