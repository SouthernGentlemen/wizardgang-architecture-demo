import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveRuntimeSchemaDependencyDigests } from '../scripts/generate-assurance-runtime-binding.mjs';
import { createAssuranceSchemaLoader } from '../scripts/lib/assurance-validation.mjs';
import {
  collectJsonSchemaDependencies,
  createFileSchemaLoader,
  resolveJsonSchemaProperty,
  validateJsonSchema,
} from '../scripts/lib/json-schema.mjs';

const root = process.cwd();
const loadSchema = createFileSchemaLoader(root);
const loadAssuranceSchema = createAssuranceSchemaLoader(root);
const readJson = (relative) => JSON.parse(readFileSync(relative, 'utf8'));
const advisorySchemaPath = 'contracts/assurance/advisory.schema.json';
const advisorySchema = readJson(advisorySchemaPath);
const riskSchemaPath = 'contracts/assurance/risk.schema.json';
const riskSchema = readJson(riskSchemaPath);
const riskVocabularySchemaPath = 'contracts/assurance/risk-vocabulary.schema.json';
const riskVocabularySchema = readJson(riskVocabularySchemaPath);

function relationshipsFixture() {
  const targets = {
    evidence: ['github.structured-records.evidence', 'EVD-TEST-001'],
    compliance: ['github.structured-records.compliance.iso-27001', 'ISO27001-A.5.1'],
    frameworks: ['github.structured-records.compliance.iso-27001', 'iso-27001'],
    claims: ['github.structured-records.claims', 'CLM-SEC-001'],
    risks: ['github.structured-records.risks', 'SEC-RISK-001'],
    controls: ['github.structured-records.compliance.iso-27001', 'ISO27001-A.5.1'],
    incidents: ['github.structured-records.incidents', 'INC-001'],
    exercises: ['github.structured-records.exercises', 'EX-001'],
    advisories: ['github.structured-records.advisories', 'GHSA-aaaa-bbbb-cccc'],
    governanceDocuments: ['github.structured-records.presentation.documents', 'WG-POL-001'],
    objectives: ['github.structured-records.objectives', 'SEC-OBJ-001'],
  };
  return Object.entries(targets).map(([relation, [source, native]]) => ({
    relation,
    from: { source: 'github.structured-records.advisories', native: 'GHSA-aaaa-bbbb-cccc' },
    to: { source, native },
  }));
}

function advisoryFixture() {
  return {
    schemaVersion: 1,
    qualification: 'Synthetic schema fixture only.',
    records: [{
      id: 'GHSA-aaaa-bbbb-cccc',
      recordType: 'advisory',
      title: 'Synthetic advisory fixture',
      severity: 'low',
      summary: 'Disposable fixture used to exercise the public advisory contract.',
      publishedAt: '2026-09-03T12:00:00Z',
      fixedReleases: ['v0.14.0'],
      relationships: relationshipsFixture(),
    }],
  };
}

function validateAdvisory(value) {
  return validateJsonSchema(value, advisorySchema, {
    schemaPath: advisorySchemaPath,
    loadSchema,
  });
}

describe('shared assurance schema contracts', () => {
  it('validates registered datasets through repository-relative shared schema references', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-assurance-registry.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(`${result.stdout}\n${result.stderr}`).not.toContain('unsupported non-local JSON Schema reference');
    expect(result.status).toBe(0);
  });

  it('resolves metadata through the same local and external reference semantics as structural validation', () => {
    const localSchema = {
      type: 'object',
      properties: {
        records: {
          type: 'array',
          items: { $ref: '#/$defs/record' },
        },
      },
      $defs: {
        record: {
          type: 'object',
          properties: {
            status: { $ref: '#/$defs/status' },
          },
        },
        status: { enum: ['open', 'treating'] },
      },
    };
    expect(resolveJsonSchemaProperty(localSchema, 'records', 'status')).toEqual(localSchema.$defs.status);
    expect(resolveJsonSchemaProperty(riskSchema, 'records', 'status', {
      schemaPath: riskSchemaPath,
      loadSchema: loadAssuranceSchema,
    })).toEqual(riskVocabularySchema.$defs.status);

    const dependencies = collectJsonSchemaDependencies(riskSchema, {
      schemaPath: riskSchemaPath,
      loadSchema: loadAssuranceSchema,
    });
    expect(dependencies).toContain(riskVocabularySchemaPath);
    expect(dependencies).toContain('contracts/assurance/relationships.schema.json');
  });

  it('fails unresolved metadata references deterministically', () => {
    const schema = {
      type: 'object',
      properties: {
        records: {
          type: 'array',
          items: { $ref: '#/$defs/missing' },
        },
      },
    };
    expect(() => resolveJsonSchemaProperty(schema, 'records', 'status'))
      .toThrow('unresolved JSON Schema reference #/$defs/missing');
  });

  it('changes generated dependency digests when a referenced schema changes', () => {
    const directory = mkdtempSync(join(tmpdir(), 'assurance-schema-dependency-'));
    try {
      const contracts = join(directory, 'contracts', 'assurance');
      mkdirSync(contracts, { recursive: true });
      writeFileSync(join(contracts, 'root.schema.json'), JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          value: { $ref: './dependency.schema.json#/$defs/value' },
        },
      }));
      const dependencyPath = join(contracts, 'dependency.schema.json');
      writeFileSync(dependencyPath, JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $defs: { value: { enum: ['one'] } },
      }));
      const registry = {
        datasets: [{
          id: 'fixture',
          kind: 'fixture',
          role: 'dataset',
          path: 'assurance/fixture.json',
          schema: 'contracts/assurance/root.schema.json',
          visibility: 'public',
          capabilities: ['runtime'],
        }],
      };
      const first = deriveRuntimeSchemaDependencyDigests(registry, directory);
      writeFileSync(dependencyPath, JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $defs: { value: { enum: ['two'] } },
      }));
      const second = deriveRuntimeSchemaDependencyDigests(registry, directory);
      expect(first['contracts/assurance/dependency.schema.json'])
        .not.toBe(second['contracts/assurance/dependency.schema.json']);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('accepts canonical GHSA advisory IDs in shared relationships', () => {
    expect(validateAdvisory(advisoryFixture())).toEqual([]);
  });

  it.each([
    ['advisories', 'ADV-001'],
    ['evidence', 'SEC-RISK-001'],
    ['incidents', 'EX-001'],
    ['controls', 'ISO27001-5.1'],
  ])('rejects invalid %s target IDs before referential resolution', (family, invalidId) => {
    const fixture = advisoryFixture();
    const relationship = fixture.records[0].relationships.find((candidate) => candidate.relation === family);
    relationship.to.native = invalidId;
    expect(validateAdvisory(fixture).length).toBeGreaterThan(0);
  });

  it('requires RFC 3339 date-time values rather than accepting date-only strings', () => {
    expect(validateJsonSchema('2026-09-03T12:00:00Z', { type: 'string', format: 'date-time' })).toEqual([]);
    expect(validateJsonSchema('2026-09-03', { type: 'string', format: 'date-time' }).length).toBeGreaterThan(0);
    expect(validateJsonSchema('2026-02-30T12:00:00Z', { type: 'string', format: 'date-time' }).length).toBeGreaterThan(0);
  });

  it('honors boolean schemas, including items: false', () => {
    expect(validateJsonSchema('anything', true)).toEqual([]);
    expect(validateJsonSchema('anything', false).length).toBe(1);
    expect(validateJsonSchema([], { type: 'array', items: false })).toEqual([]);
    expect(validateJsonSchema(['blocked'], { type: 'array', items: false }).length).toBe(1);
  });
});
