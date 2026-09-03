import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createFileSchemaLoader,
  validateJsonSchema,
} from '../scripts/lib/json-schema.mjs';

const root = process.cwd();
const loadSchema = createFileSchemaLoader(root);
const readJson = (relative) => JSON.parse(readFileSync(relative, 'utf8'));
const advisorySchemaPath = 'contracts/assurance/advisory.schema.json';
const advisorySchema = readJson(advisorySchemaPath);

function relationshipsFixture() {
  return {
    evidence: ['EVD-TEST-001'],
    compliance: ['ISO27001-A.5.1'],
    frameworks: ['iso-27001'],
    claims: ['CLM-SEC-001'],
    risks: ['SEC-RISK-001'],
    controls: ['ISO27001-A.5.1'],
    incidents: ['INC-001'],
    exercises: ['EX-001'],
    advisories: ['GHSA-aaaa-bbbb-cccc'],
    governanceDocuments: ['WG-POL-001'],
    objectives: ['SEC-OBJ-001'],
  };
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
    fixture.records[0].relationships[family] = [invalidId];
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
