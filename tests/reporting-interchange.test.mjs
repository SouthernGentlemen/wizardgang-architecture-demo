import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildInterchangeEnvelope,
  planInterchangeImport,
} from '../scripts/assurance-interchange.mjs';

function copy(value) {
  return structuredClone(value);
}

function riskCollection(envelope) {
  const collection = envelope.collections.find((candidate) => candidate.resource.id === 'risks');
  if (!collection) throw new Error('Expected risks interchange collection.');
  return collection;
}

describe('current reporting interchange', () => {
  it('exports every record-bearing source with deterministic authority and revision context', () => {
    const first = buildInterchangeEnvelope(process.cwd());
    const second = buildInterchangeEnvelope(process.cwd());
    expect(second).toEqual(first);
    expect(first.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(first.registry).toEqual({ id: 'wizardgang-public-assurance', schemaVersion: 1 });
    expect(first.collections.length).toBeGreaterThan(1);
    for (const collection of first.collections) {
      expect(collection.source.authority).toBe('structured-record');
      expect(collection.source.capabilities).toContain('export');
      expect(collection.resource.schema).toBe(collection.source.schema);
      expect(collection.revision.commit).toMatch(/^[0-9a-f]{40}$/);
      expect(collection.revision.blob).toMatch(/^[0-9a-f]{40}$/);
      expect(Array.isArray(collection.records)).toBe(true);
      expect(Array.isArray(collection.relationships)).toBe(true);
    }
    const risks = riskCollection(first);
    expect(risks.records.length).toBeGreaterThan(0);
    expect(risks.records.every((record) => !Object.hasOwn(record.inherent ?? {}, 'rating'))).toBe(true);
    expect(risks.records.every((record) => !Object.hasOwn(record.residual ?? {}, 'rating'))).toBe(true);
    expect(risks.records.every((record) => !Object.hasOwn(record, 'publication'))).toBe(true);
  });

  it('dry-runs a complete round trip idempotently without creating duplicate records', () => {
    const envelope = buildInterchangeEnvelope(process.cwd());
    const plan = planInterchangeImport(process.cwd(), envelope);
    expect(plan.changedResources).toEqual([]);
    expect(plan.unchangedResources.length).toBe(envelope.collections.length);
  });

  it('preserves omitted fields when a public subset is imported as an authoritative patch', () => {
    const envelope = buildInterchangeEnvelope(process.cwd());
    const risks = copy(riskCollection(envelope));
    const current = risks.records[0];
    risks.records = [{ id: current.id, title: current.title }];
    risks.relationships = [];
    const subset = {
      contract: envelope.contract,
      registry: envelope.registry,
      collections: [risks],
    };
    const plan = planInterchangeImport(process.cwd(), subset);
    expect(plan.changedResources).toEqual([]);
    const next = plan.resources[0].nextDocument.records.find((record) => record.id === current.id);
    expect(next).toEqual(current);
  });

  it('rejects duplicate IDs, derived fields, stale conflicting revisions, and invalid relationships', () => {
    const envelope = buildInterchangeEnvelope(process.cwd());

    const duplicate = copy(envelope);
    const duplicateRisks = riskCollection(duplicate);
    duplicateRisks.records.push(copy(duplicateRisks.records[0]));
    expect(() => planInterchangeImport(process.cwd(), duplicate)).toThrow(/duplicate_import_id/);

    const derived = copy(envelope);
    const derivedRisk = riskCollection(derived).records[0];
    derivedRisk.residual = { ...derivedRisk.residual, rating: 'low' };
    expect(() => planInterchangeImport(process.cwd(), derived)).toThrow(/derived_field_not_authoritative/);

    const conflict = copy(envelope);
    const conflictRisks = riskCollection(conflict);
    conflictRisks.records[0].title = `${conflictRisks.records[0].title} changed`;
    conflictRisks.revision.blob = '0'.repeat(40);
    expect(() => planInterchangeImport(process.cwd(), conflict)).toThrow(/revision_conflict/);

    const invalid = copy(envelope);
    const invalidRisks = riskCollection(invalid);
    invalidRisks.relationships.push({
      relation: 'risks',
      from: { source: invalidRisks.source.id, native: invalidRisks.records[0].id },
      to: { source: invalidRisks.source.id, native: 'SEC-RISK-NOT-REAL' },
    });
    expect(() => planInterchangeImport(process.cwd(), invalid)).toThrow(/invalid_relationship/);
  });

  it('rejects legacy interchange payloads and native observation writes', () => {
    expect(() => planInterchangeImport(process.cwd(), {
      source: 'github.structured-records.risks',
      records: [],
      relationships: [],
    })).toThrow(/legacy_interchange_contract_rejected/);

    const envelope = buildInterchangeEnvelope(process.cwd());
    const native = copy(envelope);
    const registry = JSON.parse(readFileSync('assurance/registry.json', 'utf8'));
    riskCollection(native).source = registry.reporting.observations[0];
    expect(() => planInterchangeImport(process.cwd(), native)).toThrow(/unsupported_write_authority/);
  });
});
